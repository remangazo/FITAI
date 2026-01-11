// Progress Tracker Service - Analyzes user progress and provides AI recommendations
import { getExerciseById, EXERCISES, MUSCLE_GROUPS } from '../data/exercises';

// Calculate 1RM (One Rep Max) using Epley formula
export const calculate1RM = (weight, reps) => {
    if (reps === 1) return weight;
    return weight * (1 + reps / 30);
};

// Calculate volume (sets * reps * weight)
export const calculateVolume = (sets, reps, weight) => sets * reps * weight;

// Analyze progress for an exercise
export const analyzeExerciseProgress = (exerciseHistory) => {
    if (!exerciseHistory || exerciseHistory.length < 2) {
        return { trend: 'new', message: 'Necesitas más datos para analizar tu progreso' };
    }

    const recent = exerciseHistory.slice(-5);
    const oldest = recent[0];
    const newest = recent[recent.length - 1];

    const oldestMax = calculate1RM(oldest.weight, parseInt(oldest.reps));
    const newestMax = calculate1RM(newest.weight, parseInt(newest.reps));

    const change = ((newestMax - oldestMax) / oldestMax) * 100;

    if (change > 10) {
        return {
            trend: 'excellent',
            change: change.toFixed(1),
            message: `¡Excelente! Tu fuerza aumentó ${change.toFixed(1)}%. Es momento de subir la dificultad.`,
            recommendation: 'increase_weight'
        };
    } else if (change > 5) {
        return {
            trend: 'good',
            change: change.toFixed(1),
            message: `Buen progreso. Tu fuerza mejoró ${change.toFixed(1)}%.`,
            recommendation: 'maintain'
        };
    } else if (change > 0) {
        return {
            trend: 'stable',
            change: change.toFixed(1),
            message: 'Progreso estable. Considera variar tu entrenamiento.',
            recommendation: 'vary_exercises'
        };
    } else {
        return {
            trend: 'plateau',
            change: change.toFixed(1),
            message: 'Posible estancamiento. Tu cuerpo necesita un nuevo estímulo.',
            recommendation: 'deload_or_change'
        };
    }
};

// Get AI-powered exercise recommendations based on progress
export const getProgressRecommendations = (progressData, profile) => {
    const recommendations = [];

    // Check overall training frequency
    const weeklyWorkouts = progressData.recentWorkouts?.length || 0;
    const targetFrequency = parseInt(profile?.trainingFrequency?.charAt(0)) || 3;

    if (weeklyWorkouts < targetFrequency) {
        recommendations.push({
            type: 'frequency',
            priority: 'high',
            icon: '📅',
            title: 'Aumenta tu frecuencia',
            message: `Solo entrenaste ${weeklyWorkouts} veces esta semana. Tu objetivo es ${targetFrequency} días.`,
            action: 'Ver rutina sugerida'
        });
    }

    // Check muscle balance
    const muscleFrequency = progressData.muscleGroupsWorked || {};
    const neglectedMuscles = MUSCLE_GROUPS.filter(mg =>
        (muscleFrequency[mg.id] || 0) < 1
    );

    if (neglectedMuscles.length > 0) {
        recommendations.push({
            type: 'balance',
            priority: 'medium',
            icon: '⚖️',
            title: 'Balance muscular',
            message: `No has trabajado: ${neglectedMuscles.slice(0, 3).map(m => m.name).join(', ')} esta semana.`,
            action: 'Ver ejercicios'
        });
    }

    // Check if user is ready for progression
    const strongestLifts = progressData.exerciseProgress || {};
    Object.entries(strongestLifts).forEach(([exerciseId, history]) => {
        const analysis = analyzeExerciseProgress(history);
        if (analysis.recommendation === 'increase_weight') {
            const exercise = getExerciseById(exerciseId);
            if (exercise) {
                recommendations.push({
                    type: 'progression',
                    priority: 'high',
                    icon: '🚀',
                    title: `Progresión: ${exercise.name}`,
                    message: analysis.message,
                    action: 'Ver nueva carga sugerida',
                    suggestedWeight: Math.ceil(history[history.length - 1].weight * 1.025 / 2.5) * 2.5
                });
            }
        }
    });

    // Nutrition check based on goal
    if (profile?.primaryGoal === 'muscle' && profile?.weight) {
        const proteinNeeded = parseFloat(profile.weight) * 2; // 2g per kg for muscle gain
        recommendations.push({
            type: 'nutrition',
            priority: 'medium',
            icon: '🥩',
            title: 'Proteína diaria',
            message: `Para ganar músculo necesitas ~${proteinNeeded.toFixed(0)}g de proteína diaria.`,
            action: 'Ver plan nutricional'
        });
    }

    return recommendations.sort((a, b) => {
        const priority = { high: 3, medium: 2, low: 1 };
        return priority[b.priority] - priority[a.priority];
    });
};

// Suggest exercise progressions
export const suggestExerciseProgression = (currentExercise, userLevel) => {
    const progressions = {
        // Chest progressions
        'chest-pushups': ['chest-db-press', 'chest-bench-press'],
        'chest-db-press': ['chest-bench-press', 'chest-incline-press'],
        'chest-bench-press': ['chest-incline-press', 'chest-dips'],

        // Back progressions
        'back-lat-pulldown': ['back-pull-ups', 'back-bb-row'],
        'back-db-row': ['back-bb-row', 'back-tbar-row'],
        'back-bb-row': ['back-deadlift'],

        // Legs progressions
        'legs-goblet-squat': ['legs-squat', 'legs-front-squat'],
        'legs-leg-press': ['legs-squat', 'legs-hack-squat'],
        'legs-squat': ['legs-front-squat', 'legs-bulgarian-split'],

        // Shoulders progressions
        'shoulders-db-press': ['shoulders-ohp', 'shoulders-arnold-press'],

        // Arms progressions
        'biceps-db-curl': ['biceps-bb-curl', 'biceps-preacher-curl'],
        'triceps-pushdown': ['triceps-dips', 'triceps-skull-crusher'],
    };

    const nextExercises = progressions[currentExercise.id] || [];
    return nextExercises.map(id => getExerciseById(id)).filter(Boolean);
};

// Save workout log entry
import { db } from '../config/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export const saveWorkoutLog = async (workoutData, userId) => {
    try {
        if (userId) {
            // Firestore persistence
            const docRef = await addDoc(collection(db, 'workouts'), {
                ...workoutData,
                userId,
                date: new Date().toISOString(),
                createdAt: new Date()
            });
            return { id: docRef.id, ...workoutData };
        } else {
            // LocalStorage fallback
            const existingLogs = JSON.parse(localStorage.getItem('fitai_workout_logs') || '[]');
            const newLog = {
                id: Date.now(),
                date: new Date().toISOString(),
                ...workoutData
            };
            existingLogs.unshift(newLog);
            localStorage.setItem('fitai_workout_logs', JSON.stringify(existingLogs.slice(0, 500)));
            return newLog;
        }
    } catch (error) {
        console.error("Error saving workout log:", error);
        throw error;
    }
};

// Get workout history
export const getWorkoutHistory = async (maxLimit = 30, userId = null) => {
    try {
        if (userId) {
            const q = query(
                collection(db, 'workouts'),
                where('userId', '==', userId),
                orderBy('date', 'desc'),
                limit(maxLimit)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else {
            const logs = JSON.parse(localStorage.getItem('fitai_workout_logs') || '[]');
            return logs.slice(0, maxLimit);
        }
    } catch (error) {
        console.error("Error fetching workout history:", error);
        return [];
    }
};

// Calculate weekly volume by muscle group
export const getWeeklyVolume = async (userId = null) => {
    try {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        // Fetch logs (async)
        const logs = await getWorkoutHistory(100, userId);
        const recentLogs = logs.filter(log => new Date(log.date) > weekAgo);

        const volumeByMuscle = {};

        recentLogs.forEach(log => {
            if (log.exercises) {
                log.exercises.forEach(ex => {
                    const exercise = getExerciseById(ex.exerciseId);
                    if (exercise) {
                        const volume = calculateVolume(ex.sets, parseInt(ex.reps), parseFloat(ex.weight || 0));
                        volumeByMuscle[exercise.muscleGroup] = (volumeByMuscle[exercise.muscleGroup] || 0) + volume;
                    }
                });
            }
        });

        return volumeByMuscle;
    } catch (error) {
        console.error("Error calculating volume:", error);
        return {};
    }
};
