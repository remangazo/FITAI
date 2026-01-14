/**
 * Trainer Service
 * 
 * Manages the Trainer/Coach ecosystem: registration, student management,
 * routine assignment, rewards system, and team challenges.
 */

import { db } from '../config/firebase';
import {
    collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, addDoc,
    query, where, orderBy, limit, increment, serverTimestamp,
    runTransaction, writeBatch, Timestamp
} from 'firebase/firestore';

// Constants
const TRAINER_COLLECTION = 'trainers';
const USERS_COLLECTION = 'users';
const ASSIGNED_ROUTINES_COLLECTION = 'assignedRoutines';
const TEAM_CHALLENGES_COLLECTION = 'teamChallenges';

// Reward points configuration
const REWARD_POINTS = {
    STUDENT_REGISTERED: 5,
    STUDENT_COMPLETED_ONBOARDING: 10,
    STUDENT_TRAINED_10_TIMES: 15,
    STUDENT_PREMIUM_MONTHLY: 50,
    STUDENT_PREMIUM_ANNUAL: 150,
    STUDENT_RENEWED_PREMIUM: 30,
};

// Level thresholds
const TRAINER_LEVELS = {
    bronze: { min: 0, max: 299, discount: 0, freeShipping: false },
    silver: { min: 300, max: 999, discount: 0.05, freeShipping: false },
    gold: { min: 1000, max: 2499, discount: 0.10, freeShipping: false },
    diamond: { min: 2500, max: Infinity, discount: 0.15, freeShipping: true },
};

class TrainerService {
    /**
     * Generate a unique coach code
     * Format: FITAI-XXXX-YYYY where XXXX is from the name and YYYY is random
     */
    generateCoachCode(displayName) {
        const namePart = displayName
            .toUpperCase()
            .replace(/[^A-Z]/g, '')
            .substring(0, 4)
            .padEnd(4, 'X');
        const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `FITAI-${namePart}-${randomPart}`;
    }

    /**
     * Calculate the trainer level based on reward points
     */
    calculateLevel(points) {
        if (points >= TRAINER_LEVELS.diamond.min) return 'diamond';
        if (points >= TRAINER_LEVELS.gold.min) return 'gold';
        if (points >= TRAINER_LEVELS.silver.min) return 'silver';
        return 'bronze';
    }

    /**
     * Get level details for display
     */
    getLevelDetails(level) {
        const details = TRAINER_LEVELS[level];
        const levelNames = {
            bronze: { name: 'Bronce', emoji: '🥉' },
            silver: { name: 'Plata', emoji: '🥈' },
            gold: { name: 'Oro', emoji: '🥇' },
            diamond: { name: 'Diamante', emoji: '💎' },
        };
        return {
            ...details,
            ...levelNames[level],
        };
    }

    /**
     * Register a user as a Trainer
     */
    async registerAsTrainer(userId, profileData) {
        try {
            // Check if already a trainer
            const existingTrainer = await getDoc(doc(db, TRAINER_COLLECTION, userId));
            if (existingTrainer.exists()) {
                throw new Error('Usuario ya es un Trainer');
            }

            // Generate unique coach code
            let coachCode = this.generateCoachCode(profileData.displayName || 'COACH');

            // Ensure code is unique (check if exists)
            let codeExists = true;
            let attempts = 0;
            while (codeExists && attempts < 10) {
                const codeQuery = query(
                    collection(db, TRAINER_COLLECTION),
                    where('coachCode', '==', coachCode)
                );
                const existing = await getDocs(codeQuery);
                if (existing.empty) {
                    codeExists = false;
                } else {
                    coachCode = this.generateCoachCode(profileData.displayName || 'COACH');
                    attempts++;
                }
            }

            // Create trainer document
            const trainerData = {
                userId,
                displayName: profileData.displayName || '',
                coachCode,
                bio: profileData.bio || '',
                specialties: profileData.specialties || [],
                certifications: profileData.certifications || [],
                photoURL: profileData.photoURL || '',
                studentCount: 0,
                plan: 'free',
                rewardPoints: 0,
                rewardLevel: 'bronze',
                shopDiscount: 0,
                freeShipping: false,
                studentReferrals: 0,
                totalRevenue: 0,
                rating: 0,
                isVerified: false,
                isFeatured: false,
                createdAt: serverTimestamp(),
            };

            await setDoc(doc(db, TRAINER_COLLECTION, userId), trainerData);

            // Update user document with role
            await updateDoc(doc(db, USERS_COLLECTION, userId), {
                role: 'trainer',
            });

            return { success: true, coachCode, trainerData };
        } catch (error) {
            console.error('[TrainerService] registerAsTrainer error:', error);
            throw error;
        }
    }

    /**
     * Get trainer by coach code (for student linking)
     */
    async getTrainerByCode(coachCode) {
        try {
            const q = query(
                collection(db, TRAINER_COLLECTION),
                where('coachCode', '==', coachCode.toUpperCase())
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                return null;
            }

            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            console.error('[TrainerService] getTrainerByCode error:', error);
            throw error;
        }
    }

    /**
     * Get trainer profile by ID
     */
    async getTrainerById(trainerId) {
        try {
            const docRef = doc(db, TRAINER_COLLECTION, trainerId);
            const snapshot = await getDoc(docRef);

            if (!snapshot.exists()) {
                return null;
            }

            return { id: snapshot.id, ...snapshot.data() };
        } catch (error) {
            console.error('[TrainerService] getTrainerById error:', error);
            throw error;
        }
    }

    /**
     * Synchronize and force update trainer statistics (student count)
     */
    async syncTrainerStats(trainerId) {
        try {
            // 1. Get real count from users collection
            const q = query(
                collection(db, USERS_COLLECTION),
                where('coachId', '==', trainerId)
            );
            const snapshot = await getDocs(q);
            const actualCount = snapshot.size;

            // 2. Get current trainer data to check points
            const trainerRef = doc(db, TRAINER_COLLECTION, trainerId);
            const trainerSnap = await getDoc(trainerRef);
            const currentPoints = trainerSnap.exists() ? (trainerSnap.data().rewardPoints || 0) : 0;

            // Calculate minimum points (5 per student)
            const minPoints = actualCount * (REWARD_POINTS.STUDENT_REGISTERED || 5);

            const updates = {
                studentCount: actualCount,
            };

            // Only update points if they are less than the minimum expected (to avoid overwriting extra points)
            if (currentPoints < minPoints) {
                updates.rewardPoints = minPoints;
                // Also update level if needed
                const newLevel = this.calculateLevel(minPoints);
                if (newLevel !== (trainerSnap.data().rewardLevel || 'bronze')) {
                    updates.rewardLevel = newLevel;
                    const levelDetails = TRAINER_LEVELS[newLevel];
                    updates.shopDiscount = levelDetails.discount;
                    updates.freeShipping = levelDetails.freeShipping;
                }
            }

            await updateDoc(trainerRef, updates);

            // Return current/updated values
            const finalPoints = updates.rewardPoints !== undefined ? updates.rewardPoints : currentPoints;
            const finalLevel = updates.rewardLevel !== undefined ? updates.rewardLevel : (trainerSnap.data().rewardLevel || 'bronze');

            return { success: true, count: actualCount, points: finalPoints, level: finalLevel };
        } catch (error) {
            console.error('[TrainerService] syncTrainerStats error:', error);
            throw error;
        }
    }

    /**
     * Link a student to a trainer using an atomic transaction
     */
    async linkStudentToCoach(studentId, coachCode) {
        try {
            const trainer = await this.getTrainerByCode(coachCode);
            if (!trainer) {
                throw new Error('Código de coach inválido');
            }

            const trainerRef = doc(db, TRAINER_COLLECTION, trainer.id);
            const studentRef = doc(db, USERS_COLLECTION, studentId);

            await runTransaction(db, async (transaction) => {
                const studentDoc = await transaction.get(studentRef);
                if (!studentDoc.exists()) throw new Error('Usuario no encontrado');

                // Only increment if student is not already linked to this coach
                if (studentDoc.data().coachId !== trainer.id) {
                    transaction.update(studentRef, {
                        coachId: trainer.id,
                        joinedCoachAt: serverTimestamp(),
                    });

                    transaction.update(trainerRef, {
                        studentCount: increment(1),
                        rewardPoints: increment(REWARD_POINTS.STUDENT_REGISTERED || 5)
                    });
                }
            });

            return { success: true, trainerId: trainer.id, trainerName: trainer.displayName };
        } catch (error) {
            console.error('[TrainerService] linkStudentToCoach error:', error);
            throw error;
        }
    }

    /**
     * Unlink a student from trainer using an atomic transaction
     */
    async unlinkStudent(studentId, trainerId) {
        try {
            const trainerRef = doc(db, TRAINER_COLLECTION, trainerId);
            const studentRef = doc(db, USERS_COLLECTION, studentId);

            await runTransaction(db, async (transaction) => {
                const studentDoc = await transaction.get(studentRef);

                // Only decrement if student was actually linked to this coach
                if (studentDoc.exists() && studentDoc.data().coachId === trainerId) {
                    transaction.update(studentRef, {
                        coachId: null,
                        joinedCoachAt: null,
                    });

                    transaction.update(trainerRef, {
                        studentCount: increment(-1)
                    });
                }
            });

            return { success: true };
        } catch (error) {
            console.error('[TrainerService] unlinkStudent error:', error);
            throw error;
        }
    }

    /**
     * Get all students for a trainer with summarized activity stats
     */
    async getMyStudentsWithStats(trainerId) {
        try {
            const students = await this.getMyStudents(trainerId);

            // Get recent activity for all students efficiently
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const studentsWithStats = await Promise.all(students.map(async (student) => {
                try {
                    // Get last workout
                    const lastWorkoutQuery = query(
                        collection(db, 'workouts'),
                        where('userId', '==', student.id),
                        orderBy('startTime', 'desc'),
                        limit(1)
                    );
                    const lastSnapshot = await getDocs(lastWorkoutQuery);
                    const lastWorkout = lastSnapshot.empty ? null : lastSnapshot.docs[0].data();

                    // Get workouts count in last 30 days
                    const recentWorkoutsQuery = query(
                        collection(db, 'workouts'),
                        where('userId', '==', student.id),
                        where('startTime', '>=', thirtyDaysAgo),
                        orderBy('startTime', 'desc')
                    );
                    const recentSnapshot = await getDocs(recentWorkoutsQuery);
                    // Filter strictly completed workouts to avoid duplicates/abandoned
                    const workoutCount = recentSnapshot.docs.filter(doc => {
                        const data = doc.data();
                        return data.status === 'completed';
                    }).length;

                    // Simple "At Risk" logic: more than 7 days since last workout if they have a plan
                    const lastWorkoutDate = lastWorkout?.startTime?.toDate?.() || lastWorkout?.completedAt?.toDate?.() || null;
                    const daysSinceLastWorkout = lastWorkoutDate
                        ? Math.floor((new Date() - lastWorkoutDate) / (1000 * 60 * 60 * 24))
                        : null;

                    const isAtRisk = daysSinceLastWorkout !== null && daysSinceLastWorkout > 7;

                    return {
                        ...student,
                        stats: {
                            workoutCount,
                            lastWorkoutDate,
                            daysSinceLastWorkout,
                            isAtRisk,
                            attendanceRate: this.calculateAttendanceRate(recentSnapshot.docs.map(d => d.data()).filter(w => w.status === 'completed'), student)
                        }
                    };
                } catch (statError) {
                    console.error(`[TrainerService] Error fetching stats for student ${student.id}:`, statError);
                    // Return student without stats if they fail to load
                    return {
                        ...student,
                        stats: {
                            workoutCount: 0,
                            lastWorkoutDate: null,
                            daysSinceLastWorkout: null,
                            isAtRisk: false,
                            attendanceRate: 0,
                            error: true
                        }
                    };
                }
            }));

            return studentsWithStats;
        } catch (error) {
            console.error('[TrainerService] getMyStudentsWithStats error:', error);
            throw error;
        }
    }

    /**
     * Get all students for a trainer
     */
    async getMyStudents(trainerId) {
        try {
            const q = query(
                collection(db, USERS_COLLECTION),
                where('coachId', '==', trainerId)
            );
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
        } catch (error) {
            console.error('[TrainerService] getMyStudents error:', error);
            throw error;
        }
    }

    /**
     * Get detailed progress for a specific student
     */
    async getStudentDetails(trainerId, studentId) {
        try {
            // Verify the student belongs to this trainer
            const studentDoc = await getDoc(doc(db, USERS_COLLECTION, studentId));
            if (!studentDoc.exists() || studentDoc.data().coachId !== trainerId) {
                throw new Error('No tienes acceso a este alumno');
            }

            const student = { id: studentDoc.id, ...studentDoc.data() };

            // Get student's routines
            const routinesQuery = query(
                collection(db, 'routines'),
                where('userId', '==', studentId),
                orderBy('createdAt', 'desc'),
                limit(10)
            );
            const routinesSnapshot = await getDocs(routinesQuery);
            const routines = routinesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            // Get student's workouts (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const workoutsQuery = query(
                collection(db, 'workouts'),
                where('userId', '==', studentId),
                where('startTime', '>=', thirtyDaysAgo),
                orderBy('startTime', 'desc')
            );
            const workoutsSnapshot = await getDocs(workoutsQuery);
            // Filter strictly completed workouts
            const workouts = workoutsSnapshot.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(w => w.status === 'completed');

            // Get assigned routines
            const assignedQuery = query(
                collection(db, ASSIGNED_ROUTINES_COLLECTION),
                where('studentId', '==', studentId),
                where('trainerId', '==', trainerId),
                orderBy('assignedAt', 'desc')
            );
            const assignedSnapshot = await getDocs(assignedQuery);
            const assignedRoutines = assignedSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            return {
                student,
                routines,
                workouts,
                assignedRoutines,
                stats: {
                    totalWorkouts: workouts.length,
                    attendanceRate: this.calculateAttendanceRate(workouts, student),
                }
            };
        } catch (error) {
            console.error('[TrainerService] getStudentDetails error:', error);
            throw error;
        }
    }

    /**
     * Calculate attendance rate (workouts / expected based on routine)
     */
    /**
     * Get detailed analytics for a student
     * @param {string} studentId - User ID of the student
     * @returns {Object} - Complete analytics object
     */
    async getStudentAnalytics(studentId) {
        try {
            // 1. Get workout history (last 100 to ensure we have enough data even after filtering)
            let workouts = [];
            try {
                const workoutsQuery = query(
                    collection(db, 'workouts'),
                    where('userId', '==', studentId),
                    orderBy('startTime', 'desc'),
                    limit(100)
                );
                const workoutsSnapshot = await getDocs(workoutsQuery);
                workouts = workoutsSnapshot.docs
                    .map(d => {
                        const data = d.data();
                        return {
                            id: d.id,
                            ...data,
                            date: data.startTime?.toDate?.() || (data.startTime ? new Date(data.startTime) : new Date())
                        };
                    })
                    .filter(w => w.status === 'completed')
                    .reverse(); // Oldest to newest for charts
            } catch (err) {
                console.error('[TrainerService] Error fetching workouts for analytics:', err);
            }

            // 2. Process volume trend
            const volumeTrend = workouts.map(w => ({
                date: w.date.toLocaleDateString(),
                timestamp: w.date.getTime(),
                volume: w.totalVolume || 0,
                sets: w.totalSets || 0,
                duration: w.duration || 0,
                name: w.dayName || w.dayFocus || 'Sesión'
            }));

            // 3. Process exercise progress
            const exerciseMap = {};
            workouts.forEach(w => {
                (w.exercises || []).forEach(ex => {
                    const name = ex.name;
                    if (!name) return;
                    if (!exerciseMap[name]) exerciseMap[name] = [];

                    const maxWeight = Math.max(...(ex.sets || []).map(s => s.weight || 0), 0);
                    if (maxWeight > 0) {
                        exerciseMap[name].push({
                            date: w.date.toLocaleDateString(),
                            timestamp: w.date.getTime(),
                            maxWeight
                        });
                    }
                });
            });

            // 4. Get active routine exercises to provide context
            const activeExercises = new Set();
            try {
                const assignedQuery = query(
                    collection(db, ASSIGNED_ROUTINES_COLLECTION),
                    where('studentId', '==', studentId),
                    orderBy('assignedAt', 'desc'),
                    limit(1)
                );
                const assignedSnapshot = await getDocs(assignedQuery);

                if (!assignedSnapshot.empty) {
                    const routine = assignedSnapshot.docs[0].data().routine || {};
                    (routine.days || []).forEach(day => {
                        (day.exercises || []).forEach(ex => ex.name && activeExercises.add(ex.name));
                    });
                } else {
                    const routinesQuery = query(
                        collection(db, 'routines'),
                        where('userId', '==', studentId),
                        orderBy('createdAt', 'desc'),
                        limit(1)
                    );
                    const routinesSnapshot = await getDocs(routinesQuery);
                    if (!routinesSnapshot.empty) {
                        const routine = routinesSnapshot.docs[0].data();
                        (routine.days || []).forEach(day => {
                            (day.exercises || []).forEach(ex => ex.name && activeExercises.add(ex.name));
                        });
                    }
                }
            } catch (err) {
                console.warn('[TrainerService] Non-critical: Error fetching routine context for analytics:', err);
            }

            activeExercises.forEach(name => {
                if (name && !exerciseMap[name]) {
                    exerciseMap[name] = [];
                }
            });

            // 5. Get cardio activities (last 30 days) - Robust fetch to avoid index issues
            const cardioActivities = [];
            try {
                const now = new Date();
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                // Fetch all logs for the user (or a limited set to be safe)
                // Filtering by date in JS is safer than requiring a composite index in Firestore
                const nutritionQuery = query(
                    collection(db, 'nutritionLogs'),
                    where('userId', '==', studentId),
                    orderBy('date', 'desc'),
                    limit(45) // Get more than a month to be safe
                );

                const nutritionSnapshot = await getDocs(nutritionQuery);
                nutritionSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    const logDate = new Date(data.date + 'T00:00:00');

                    if (logDate >= thirtyDaysAgo && data.activities) {
                        data.activities.forEach(act => {
                            // Only include if it has relevant info and is cardio (or categorized as such)
                            if (act.category === 'cardio' || act.durationMinutes > 0 || act.caloriesBurned > 0) {
                                cardioActivities.push({
                                    ...act,
                                    date: data.date,
                                    // Ensure field names match what UI expects
                                    durationMinutes: act.durationMinutes || 0,
                                    caloriesBurned: act.caloriesBurned || 0,
                                    name: act.name || 'Actividad sin nombre'
                                });
                            }
                        });
                    }
                });
            } catch (err) {
                console.error('[TrainerService] Non-critical: Cardio fetch failed:', err);
            }

            // 6. Calculate volume change (last 30 days vs 31-60 days ago)
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

            const recentWorkouts = workouts.filter(w => w.date >= thirtyDaysAgo);
            const previousWorkouts = workouts.filter(w => w.date < thirtyDaysAgo && w.date >= sixtyDaysAgo);

            const recentVolume = recentWorkouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
            const previousVolume = previousWorkouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);

            let volumeChange = null;
            if (previousVolume > 0) {
                volumeChange = ((recentVolume - previousVolume) / previousVolume) * 100;
            }

            return {
                summary: {
                    totalWorkouts: workouts.length,
                    totalVolume: workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0),
                    totalSets: workouts.reduce((sum, w) => sum + (w.totalSets || 0), 0),
                    avgDuration: workouts.length > 0
                        ? Math.round(workouts.reduce((sum, w) => sum + (w.duration || 0), 0) / workouts.length)
                        : 0,
                    prCount: workouts.reduce((sum, w) => sum + (w.personalRecords?.length || 0), 0),
                    volumeChange: volumeChange !== null ? volumeChange.toFixed(1) : null
                },
                charts: {
                    volumeTrend,
                    exercises: exerciseMap
                },
                cardio: cardioActivities.sort((a, b) => new Date(b.date) - new Date(a.date)),
                recentHistory: [...workouts].reverse().slice(0, 10)
            };

        } catch (error) {
            console.error('[TrainerService] Fatal error in getStudentAnalytics:', error);
            // Fallback object to avoid UI crash
            return {
                summary: { totalWorkouts: 0, totalVolume: 0, totalSets: 0, avgDuration: 0, prCount: 0 },
                charts: { volumeTrend: [], exercises: {} },
                cardio: [],
                recentHistory: []
            };
        }
    }

    calculateAttendanceRate(workouts, student) {
        // Refactored to Weekly Compliance: workouts in last 7 days / daysPerWeek from profile
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

        const recentWorkouts = workouts.filter(w => {
            const date = w.completedAt?.toDate?.() || w.endTime?.toDate?.() || w.startTime?.toDate?.() || new Date(w.startTime);
            return date >= sevenDaysAgo;
        });

        const daysPerWeekStr = String(student.daysPerWeek || "3");
        const daysPerWeek = parseInt(daysPerWeekStr.match(/\d+/)?.[0] || 3);

        // Return percentage (e.g. 1 workout / 5 days = 20%)
        const rate = Math.min((recentWorkouts.length / daysPerWeek) * 100, 100);
        return Math.round(rate);
    }

    /**
     * Assign a routine to a student
     */
    async assignRoutineToStudent(trainerId, studentId, routineData, notes = '') {
        try {
            // Verify the student belongs to this trainer
            const studentDoc = await getDoc(doc(db, USERS_COLLECTION, studentId));
            if (!studentDoc.exists() || studentDoc.data().coachId !== trainerId) {
                throw new Error('No tienes acceso a este alumno');
            }

            // Mark any existing active assigned routines as replaced
            const activeQuery = query(
                collection(db, ASSIGNED_ROUTINES_COLLECTION),
                where('studentId', '==', studentId),
                where('trainerId', '==', trainerId),
                where('status', '==', 'active')
            );
            const activeSnapshot = await getDocs(activeQuery);

            const batch = writeBatch(db);
            activeSnapshot.docs.forEach(docSnap => {
                batch.update(docSnap.ref, { status: 'replaced' });
            });

            // Create new assigned routine record (history)
            const assignedRoutineRef = doc(collection(db, ASSIGNED_ROUTINES_COLLECTION));
            const assignedData = {
                trainerId,
                studentId,
                routine: routineData,
                notes,
                assignedAt: serverTimestamp(),
                startDate: serverTimestamp(),
                status: 'active',
            };
            // The routine is saved in the assignedRoutines record above.
            // We also update the student's profile with the new active routine ID if needed
            batch.update(doc(db, USERS_COLLECTION, studentId), {
                activeRoutineId: assignedRoutineRef.id,
                lastRoutineUpdate: serverTimestamp()
            });

            // Create notification for student

            // Create notification for student
            const notificationRef = doc(collection(db, 'notifications'));
            const trainerDoc = await getDoc(doc(db, TRAINER_COLLECTION, trainerId));
            const trainerName = trainerDoc.data()?.displayName || 'Tu Coach';

            batch.set(notificationRef, {
                userId: studentId,
                sourceUserId: trainerId,
                sourceName: trainerName,
                type: 'new_routine',
                message: `${trainerName} te ha asignado una nueva rutina: ${routineData.name}`,
                read: false,
                createdAt: serverTimestamp(),
            });

            await batch.commit();

            // ENGINE LEARNING: Save a copy to curated library for engine improvement
            try {
                // Solo guardamos si tiene ejercicios (rutinas reales) y anonimizamos
                if (routineData.days && routineData.days.length > 0) {
                    await addDoc(collection(db, 'curated_routines'), {
                        name: routineData.name,
                        days: routineData.days,
                        goal: routineData.goal,
                        level: routineData.level,
                        originalTrainerId: trainerId,
                        source: 'coach_assignment',
                        learningModel: 'v1',
                        createdAt: serverTimestamp(),
                        metadata: {
                            goal: routineData.goal || 'performance',
                            level: routineData.level || 'intermediate',
                            daysPerWeek: routineData.daysPerWeek || routineData.days.length
                        }
                    });
                    console.log('[System] Routine added to curated library for learning.');
                }
            } catch (learningError) {
                console.warn('[System] Learning system error:', learningError);
            }

            // Send Real-Time Push Notification via backend
            try {
                const functionsUrl = import.meta.env.VITE_FUNCTIONS_URL || '';
                if (functionsUrl) {
                    await fetch(`${functionsUrl}/sendPushNotification`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: studentId,
                            templateId: 'assigned_routine',
                            customData: {
                                title: '🏋️ Nueva Rutina de tu Coach',
                                body: `${trainerName} te ha asignado un nuevo plan: ${routineData.name}. ¡Pulsa para empezar!`
                            }
                        })
                    });
                }
            } catch (pushError) {
                console.warn('[TrainerService] Non-critical push notification error:', pushError);
            }

            return { success: true, routineId: assignedRoutineRef.id };
        } catch (error) {
            console.error('[TrainerService] assignRoutineToStudent error:', error);
            throw error;
        }
    }

    /**
     * Get assigned routines for a student (from student's perspective)
     */
    async getAssignedRoutinesForStudent(studentId) {
        try {
            const q = query(
                collection(db, ASSIGNED_ROUTINES_COLLECTION),
                where('studentId', '==', studentId),
                where('status', '==', 'active')
            );
            const snapshot = await getDocs(q);

            const routines = [];
            for (const docSnap of snapshot.docs) {
                const data = docSnap.data();
                // Get trainer info
                const trainer = await this.getTrainerById(data.trainerId);
                routines.push({
                    id: docSnap.id,
                    ...data,
                    trainerName: trainer?.displayName || 'Tu Entrenador',
                    trainerPhoto: trainer?.photoURL || null,
                });
            }

            return routines;
        } catch (error) {
            console.error('[TrainerService] getAssignedRoutinesForStudent error:', error);
            throw error;
        }
    }

    /**
     * Recalculate trainer level based on current points
     */
    async recalculateTrainerLevel(trainerId) {
        try {
            const trainerDoc = await getDoc(doc(db, TRAINER_COLLECTION, trainerId));
            if (!trainerDoc.exists()) return;

            const data = trainerDoc.data();
            const newLevel = this.calculateLevel(data.rewardPoints);
            const levelDetails = TRAINER_LEVELS[newLevel];

            await updateDoc(doc(db, TRAINER_COLLECTION, trainerId), {
                rewardLevel: newLevel,
                shopDiscount: levelDetails.discount,
                freeShipping: levelDetails.freeShipping,
            });

            return { newLevel, ...levelDetails };
        } catch (error) {
            console.error('[TrainerService] recalculateTrainerLevel error:', error);
            throw error;
        }
    }

    /**
     * Add reward points to a trainer (called by Cloud Function on Premium conversion)
     */
    async addRewardPoints(trainerId, pointType) {
        try {
            const points = REWARD_POINTS[pointType] || 0;
            if (points === 0) return;

            await updateDoc(doc(db, TRAINER_COLLECTION, trainerId), {
                rewardPoints: increment(points),
            });

            // Recalculate level
            await this.recalculateTrainerLevel(trainerId);

            return { success: true, pointsAdded: points };
        } catch (error) {
            console.error('[TrainerService] addRewardPoints error:', error);
            throw error;
        }
    }

    /**
     * Get team leaderboard (all students ranked by workout count)
     */
    async getTeamLeaderboard(trainerId, limitCount = 20) {
        try {
            const students = await this.getMyStudents(trainerId);

            // Get workout counts for each student (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const leaderboard = await Promise.all(students.map(async (student) => {
                const workoutsQuery = query(
                    collection(db, 'workouts'),
                    where('userId', '==', student.id),
                    where('completedAt', '>=', thirtyDaysAgo)
                );
                const snapshot = await getDocs(workoutsQuery);

                return {
                    id: student.id,
                    displayName: student.displayName || student.name || 'Usuario',
                    photoURL: student.photoURL || null,
                    workoutCount: snapshot.size,
                };
            }));

            // Sort by workout count
            leaderboard.sort((a, b) => b.workoutCount - a.workoutCount);

            return leaderboard.slice(0, limitCount);
        } catch (error) {
            console.error('[TrainerService] getTeamLeaderboard error:', error);
            throw error;
        }
    }

    /**
     * Update trainer profile
     */
    async updateTrainerProfile(trainerId, updates) {
        try {
            // Filter out protected fields
            const { rewardPoints, rewardLevel, shopDiscount, studentReferrals, ...safeUpdates } = updates;

            await updateDoc(doc(db, TRAINER_COLLECTION, trainerId), safeUpdates);
            return { success: true };
        } catch (error) {
            console.error('[TrainerService] updateTrainerProfile error:', error);
            throw error;
        }
    }

    /**
     * Get team challenges for a trainer
     */
    async getTeamChallenges(trainerId) {
        try {
            const q = query(
                collection(db, TEAM_CHALLENGES_COLLECTION),
                where('coachId', '==', trainerId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);

            return snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data(),
            }));
        } catch (error) {
            console.error('[TrainerService] getTeamChallenges error:', error);
            throw error;
        }
    }

    /**
     * Create a team challenge
     */
    async createTeamChallenge(trainerId, challengeData) {
        try {
            const challengeRef = doc(collection(db, TEAM_CHALLENGES_COLLECTION));

            const newChallenge = {
                coachId: trainerId,
                title: challengeData.title,
                description: challengeData.description || '',
                type: challengeData.type || 'total_workouts', // total_workouts | streak | custom
                target: challengeData.target || 10,
                startDate: challengeData.startDate || serverTimestamp(),
                endDate: challengeData.endDate || null,
                participants: [],
                leaderboard: [],
                isActive: true,
                createdAt: serverTimestamp(),
            };

            await setDoc(challengeRef, newChallenge);

            return { success: true, challengeId: challengeRef.id };
        } catch (error) {
            console.error('[TrainerService] createTeamChallenge error:', error);
            throw error;
        }
    }

    /**
     * Update team challenge participants/progress
     */
    async updateChallengeProgress(challengeId, studentId, progress) {
        try {
            const challengeRef = doc(db, TEAM_CHALLENGES_COLLECTION, challengeId);
            const challengeDoc = await getDoc(challengeRef);

            if (!challengeDoc.exists()) {
                throw new Error('Challenge not found');
            }

            const data = challengeDoc.data();
            const leaderboard = data.leaderboard || [];

            // Update or add student progress
            const existingIndex = leaderboard.findIndex(e => e.studentId === studentId);
            if (existingIndex >= 0) {
                leaderboard[existingIndex].progress = progress;
            } else {
                leaderboard.push({ studentId, progress });
            }

            // Sort leaderboard
            leaderboard.sort((a, b) => b.progress - a.progress);

            await updateDoc(challengeRef, { leaderboard });

            return { success: true };
        } catch (error) {
            console.error('[TrainerService] updateChallengeProgress error:', error);
            throw error;
        }
    }
}

export const trainerService = new TrainerService();
export { REWARD_POINTS, TRAINER_LEVELS };

