// Workout Service - CRUD operations for workout logging and progress tracking
import { db } from '../config/firebase';
import {
    collection,
    addDoc,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp
} from 'firebase/firestore';
import { calculateActivityCalories } from './metabolicCalculator';
import { addActivityToLog } from './nutritionService';
import { getWeekStart } from '../utils/dateUtils';
import { progressiveOverloadService } from './progressiveOverloadService';
import { badgeService } from './badgeService';
import { socialService } from './socialService';

/**
 * Start a new workout session
 * @param {string} userId - User ID
 * @param {Object} routine - Active routine
 * @param {number} dayIndex - Index of the day being worked out
 * @returns {string} - Workout document ID
 */
export const startWorkout = async (userId, routine, dayIndex) => {
    if (!userId || !routine) throw new Error('User ID and routine are required');

    const day = routine.days[dayIndex];

    const workoutData = {
        userId,
        routineId: routine.id || null,
        routineName: routine.title,
        dayName: day.day,
        dayFocus: day.focus,
        dayIndex,
        startTime: Timestamp.now(),
        endTime: null,
        duration: null, // in minutes
        status: 'in_progress', // in_progress | completed | abandoned
        exercises: day.exercises.map(ex => ({
            name: ex.name,
            muscleGroup: ex.muscleGroup || '',
            targetSets: parseInt(ex.sets) || 4,
            targetReps: ex.reps || '8-12',
            suggestedWeight: null, // Will be populated from history
            sets: [], // Will be filled as user logs
            notes: '',
            personalRecord: false
        })),
        totalVolume: 0,
        totalSets: 0,
        personalRecords: [],
        notes: '',
        createdAt: Timestamp.now()
    };

    // Get suggested weights from "The Brain" (Progressive Overload Service)
    for (let i = 0; i < workoutData.exercises.length; i++) {
        const exerciseName = workoutData.exercises[i].name;
        const suggestion = await progressiveOverloadService.calculateNextWeight(userId, exerciseName, routine.goal || 'hypertrophy');

        workoutData.exercises[i].suggestedWeight = suggestion.suggestedWeight;
        workoutData.exercises[i].progressionReason = suggestion.reason;
        workoutData.exercises[i].progressionTrend = suggestion.trend;
    }

    const docRef = await addDoc(collection(db, 'workouts'), workoutData);
    console.log('[WorkoutService] Started workout:', docRef.id);
    return docRef.id;
};

/**
 * Get a workout by ID
 * @param {string} workoutId - Workout document ID
 * @returns {Object} - Workout data
 */
export const getWorkout = async (workoutId) => {
    const docRef = doc(db, 'workouts', workoutId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return {
        id: docSnap.id,
        ...docSnap.data()
    };
};

/**
 * Log a set for an exercise
 * @param {string} workoutId - Workout ID
 * @param {number} exerciseIndex - Index of the exercise
 * @param {Object} setData - { weight, reps, rpe?, completed }
 */
export const logSet = async (workoutId, exerciseIndex, setData) => {
    const workout = await getWorkout(workoutId);
    if (!workout) throw new Error('Workout not found');

    const exercises = [...workout.exercises];
    exercises[exerciseIndex].sets.push({
        ...setData,
        timestamp: Timestamp.now()
    });

    // Calculate if this is a PR
    const exerciseName = exercises[exerciseIndex].name;
    const maxWeight = await getMaxWeightForExercise(workout.userId, exerciseName);
    if (setData.weight > maxWeight) {
        exercises[exerciseIndex].personalRecord = true;
        if (!workout.personalRecords.includes(exerciseName)) {
            workout.personalRecords.push(exerciseName);
        }
    }

    // Update total volume and sets
    const setVolume = (setData.weight || 0) * (setData.reps || 0);
    const totalVolume = workout.totalVolume + setVolume;
    const totalSets = workout.totalSets + 1;

    await updateDoc(doc(db, 'workouts', workoutId), {
        exercises,
        totalVolume,
        totalSets,
        personalRecords: workout.personalRecords
    });

    console.log('[WorkoutService] Logged set:', exerciseIndex, setData);
    return { totalVolume, totalSets, isPR: exercises[exerciseIndex].personalRecord };
};

/**
 * Update exercise notes
 * @param {string} workoutId - Workout ID
 * @param {number} exerciseIndex - Index of the exercise
 * @param {string} notes - Notes for the exercise
 */
export const updateExerciseNotes = async (workoutId, exerciseIndex, notes) => {
    const workout = await getWorkout(workoutId);
    if (!workout) throw new Error('Workout not found');

    const exercises = [...workout.exercises];
    exercises[exerciseIndex].notes = notes;

    await updateDoc(doc(db, 'workouts', workoutId), { exercises });
};

/**
 * Complete a workout
 * @param {string} workoutId - Workout ID
 * @param {string} notes - Overall workout notes
 */
export const completeWorkout = async (workoutId, notes = '') => {
    const workout = await getWorkout(workoutId);
    if (!workout) throw new Error('Workout not found');

    const endTime = Timestamp.now();
    const startTime = workout.startTime.toDate();
    const duration = Math.round((endTime.toDate() - startTime) / 60000); // minutes

    await updateDoc(doc(db, 'workouts', workoutId), {
        endTime,
        duration,
        status: 'completed',
        notes
    });

    console.log('[WorkoutService] Completed workout:', workoutId, 'Duration:', duration, 'min');

    // SYNC WITH NUTRITION: Registrar las calorías quemadas hoy
    try {
        const userDoc = await getDoc(doc(db, 'users', workout.userId));
        const userWeight = userDoc.exists() ? (parseFloat(userDoc.data().weight) || 70) : 70;

        // Determinar intensidad del entrenamiento de pesas basada en la duración y volumen
        // MET aproximado para entrenamiento de fuerza: 0.07 para pesas moderadas
        // (En metabolicCalculator.js: weight_training_moderate = 0.07)
        const activityResult = calculateActivityCalories('weight_training_moderate', duration, userWeight);

        await addActivityToLog(workout.userId, null, {
            id: `workout_${workoutId}`,
            name: `Entrenamiento: ${workout.dayFocus || workout.dayName}`,
            category: 'strength',
            durationMinutes: duration,
            caloriesBurned: activityResult.caloriesBurned
        });
        console.log('[WorkoutService] Calories synced with Nutrition log:', activityResult.caloriesBurned);
    } catch (syncError) {
        console.error('[WorkoutService] Error syncing with Nutrition:', syncError);
    }

    // GAMIFICATION: Verificar y otorgar insignias
    try {
        const stats = await getWeeklyStats(workout.userId);
        const prs = await getAllPersonalRecords(workout.userId);
        const newBadges = await badgeService.checkAndAwardBadges(workout.userId, stats, prs);

        if (newBadges.length > 0) {
            console.log('[WorkoutService] Achievement Unlocked!', newBadges);
        }
    } catch (gamifyError) {
        console.error('[WorkoutService] Error in gamification flow:', gamifyError);
    }

    // SOCIAL: Publicar entrenamiento en el muro de la comunidad
    try {
        const userDoc = await getDoc(doc(db, 'users', workout.userId));
        const userData = userDoc.exists() ? userDoc.data() : null;

        if (userData && !userData.isPrivate) {
            await socialService.createActivityPost(workout.userId, userData, {
                ...workout,
                duration,
                caloriesBurned: duration > 0 ? Math.round(0.08 * (workout.userWeight || 70) * duration) : 0
            });
            console.log('[WorkoutService] Workout posted to Community Feed');
        } else {
            console.log('[WorkoutService] Skipping social post due to privacy settings');
        }
    } catch (socialError) {
        console.error('[WorkoutService] Error posting to social feed:', socialError);
    }

    return {
        duration,
        totalVolume: workout.totalVolume,
        totalSets: workout.totalSets,
        personalRecords: workout.personalRecords,
        // Fallback: 0.08 kcal/kg/min para entrenamiento moderado (MET ~5.0)
        caloriesBurned: duration > 0 ? Math.round(0.08 * (workout.userWeight || 70) * duration) : 0
    };
};

/**
 * Abandon a workout
 * @param {string} workoutId - Workout ID
 */
export const abandonWorkout = async (workoutId) => {
    await updateDoc(doc(db, 'workouts', workoutId), {
        status: 'abandoned',
        endTime: Timestamp.now()
    });
};

/**
 * Get workout history for a user
 * @param {string} userId - User ID
 * @param {number} limitCount - Number of workouts to return
 * @returns {Array} - Workout history
 */
export const getWorkoutHistory = async (userId, limitCount = 20) => {
    try {
        const q = query(
            collection(db, 'workouts'),
            where('userId', '==', userId),
            where('status', '==', 'completed')
        );

        const snapshot = await getDocs(q);
        const workouts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            startTime: doc.data().startTime?.toDate?.() || doc.data().startTime,
            endTime: doc.data().endTime?.toDate?.() || doc.data().endTime
        }));

        // Sort in memory
        workouts.sort((a, b) => {
            const dateA = a.startTime instanceof Date ? a.startTime : new Date(a.startTime);
            const dateB = b.startTime instanceof Date ? b.startTime : new Date(b.startTime);
            return dateB - dateA;
        });

        return workouts.slice(0, limitCount);
    } catch (error) {
        console.error('[WorkoutService] Error getting history:', error);
        return [];
    }
};

/**
 * Get the last weight used for an exercise
 * @param {string} userId - User ID
 * @param {string} exerciseName - Exercise name
 * @returns {number|null} - Last weight used or null
 */
export const getLastWeightForExercise = async (userId, exerciseName) => {
    try {
        const workouts = await getWorkoutHistory(userId, 10);

        for (const workout of workouts) {
            const exercise = workout.exercises?.find(ex =>
                ex.name.toLowerCase() === exerciseName.toLowerCase()
            );

            if (exercise && exercise.sets && exercise.sets.length > 0) {
                // Return the highest weight from the last session
                const maxWeight = Math.max(...exercise.sets.map(s => s.weight || 0));
                if (maxWeight > 0) return maxWeight;
            }
        }

        return null;
    } catch (error) {
        console.error('[WorkoutService] Error getting last weight:', error);
        return null;
    }
};

/**
 * Get the max weight ever lifted for an exercise
 * @param {string} userId - User ID
 * @param {string} exerciseName - Exercise name
 * @returns {number} - Max weight (0 if none)
 */
export const getMaxWeightForExercise = async (userId, exerciseName) => {
    try {
        const workouts = await getWorkoutHistory(userId, 50);
        let maxWeight = 0;

        for (const workout of workouts) {
            const exercise = workout.exercises?.find(ex =>
                ex.name.toLowerCase() === exerciseName.toLowerCase()
            );

            if (exercise && exercise.sets) {
                for (const set of exercise.sets) {
                    if (set.weight > maxWeight) {
                        maxWeight = set.weight;
                    }
                }
            }
        }

        return maxWeight;
    } catch (error) {
        console.error('[WorkoutService] Error getting max weight:', error);
        return 0;
    }
};

/**
 * Get exercise progress over time
 * @param {string} userId - User ID
 * @param {string} exerciseName - Exercise name
 * @returns {Array} - Array of { date, maxWeight, totalVolume }
 */
export const getExerciseProgress = async (userId, exerciseName) => {
    try {
        const workouts = await getWorkoutHistory(userId, 50);
        const progress = [];

        for (const workout of workouts) {
            const exercise = workout.exercises?.find(ex =>
                ex.name.toLowerCase() === exerciseName.toLowerCase()
            );

            if (exercise && exercise.sets && exercise.sets.length > 0) {
                const maxWeight = Math.max(...exercise.sets.map(s => s.weight || 0));
                const totalVolume = exercise.sets.reduce((sum, s) =>
                    sum + ((s.weight || 0) * (s.reps || 0)), 0
                );

                progress.push({
                    date: workout.startTime,
                    maxWeight,
                    totalVolume,
                    sets: exercise.sets.length
                });
            }
        }

        // Sort by date ascending for charts
        progress.sort((a, b) => new Date(a.date) - new Date(b.date));

        return progress;
    } catch (error) {
        console.error('[WorkoutService] Error getting exercise progress:', error);
        return [];
    }
};

/**
 * Get weekly workout stats
 * @param {string} userId - User ID
 * @returns {Object} - { workoutsThisWeek, totalVolume, avgDuration }
 */
export const getWeeklyStats = async (userId) => {
    try {
        const workouts = await getWorkoutHistory(userId, 20);

        const weekStart = getWeekStart();

        const thisWeek = workouts.filter(w => {
            const date = w.startTime instanceof Date ? w.startTime :
                (w.startTime?.toDate ? w.startTime.toDate() : new Date(w.startTime));
            return date >= weekStart;
        });
        const totalVolume = thisWeek.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
        const avgDuration = thisWeek.length > 0
            ? Math.round(thisWeek.reduce((sum, w) => sum + (w.duration || 0), 0) / thisWeek.length)
            : 0;

        // Re-implementing a cleaner streak logic
        const workoutDates = [...new Set(workouts.map(w => {
            const d = w.startTime instanceof Date ? w.startTime :
                (w.startTime?.toDate ? w.startTime.toDate() : new Date(w.startTime));
            return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        }))].sort((a, b) => b - a);

        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayTime = today.getTime();
        const yesterdayTime = todayTime - (24 * 60 * 60 * 1000);

        // Determinar si empezamos ayer u hoy
        let nextExpected = null;
        if (workoutDates.includes(todayTime)) {
            nextExpected = todayTime;
        } else if (workoutDates.includes(yesterdayTime)) {
            nextExpected = yesterdayTime;
        }

        if (nextExpected) {
            for (let date of workoutDates) {
                if (date === nextExpected) {
                    currentStreak++;
                    nextExpected -= (24 * 60 * 60 * 1000);
                } else if (date < nextExpected) {
                    break;
                }
            }
        }

        return {
            workoutsThisWeek: thisWeek.length,
            totalVolume,
            avgDuration,
            workouts: thisWeek,
            streak: currentStreak
        };
    } catch (error) {
        console.error('[WorkoutService] Error getting weekly stats:', error);
        return { workoutsThisWeek: 0, totalVolume: 0, avgDuration: 0, workouts: [] };
    }
};

/**
 * Get in-progress workout for user
 * @param {string} userId - User ID
 * @returns {Object|null} - In-progress workout or null
 */
export const getInProgressWorkout = async (userId) => {
    try {
        const q = query(
            collection(db, 'workouts'),
            where('userId', '==', userId),
            where('status', '==', 'in_progress')
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        // Return the most recent one
        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data()
        };
    } catch (error) {
        console.error('[WorkoutService] Error getting in-progress workout:', error);
        return null;
    }
};

/**
 * Get all personal records for a user
 * @param {string} userId - User ID
 * @returns {Object} - { exerciseName: maxWeight }
 */
export const getAllPersonalRecords = async (userId) => {
    try {
        const workouts = await getWorkoutHistory(userId, 100);
        const prs = {};

        for (const workout of workouts) {
            for (const exercise of workout.exercises || []) {
                if (exercise.sets) {
                    for (const set of exercise.sets) {
                        const name = exercise.name;
                        if (!prs[name] || set.weight > prs[name].weight) {
                            prs[name] = {
                                weight: set.weight,
                                reps: set.reps,
                                date: workout.startTime
                            };
                        }
                    }
                }
            }
        }

        return prs;
    } catch (error) {
        console.error('[WorkoutService] Error getting PRs:', error);
        return {};
    }
};
