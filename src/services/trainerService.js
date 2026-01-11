/**
 * Trainer Service
 * 
 * Manages the Trainer/Coach ecosystem: registration, student management,
 * routine assignment, rewards system, and team challenges.
 */

import { db } from '../config/firebase';
import {
    collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
    query, where, orderBy, limit, increment, serverTimestamp,
    writeBatch
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
     * Link a student to a trainer
     */
    async linkStudentToCoach(studentId, coachCode) {
        try {
            const trainer = await this.getTrainerByCode(coachCode);
            if (!trainer) {
                throw new Error('Código de coach inválido');
            }

            const batch = writeBatch(db);

            // Update student's coachId
            batch.update(doc(db, USERS_COLLECTION, studentId), {
                coachId: trainer.id,
                joinedCoachAt: serverTimestamp(),
            });

            // Increment trainer's student count and reward points
            batch.update(doc(db, TRAINER_COLLECTION, trainer.id), {
                studentCount: increment(1),
                rewardPoints: increment(REWARD_POINTS.STUDENT_REGISTERED),
            });

            await batch.commit();

            // Recalculate trainer level
            await this.recalculateTrainerLevel(trainer.id);

            return { success: true, trainerId: trainer.id, trainerName: trainer.displayName };
        } catch (error) {
            console.error('[TrainerService] linkStudentToCoach error:', error);
            throw error;
        }
    }

    /**
     * Unlink a student from trainer
     */
    async unlinkStudent(studentId, trainerId) {
        try {
            const batch = writeBatch(db);

            // Remove coachId from student
            batch.update(doc(db, USERS_COLLECTION, studentId), {
                coachId: null,
                joinedCoachAt: null,
            });

            // Decrement trainer's student count
            batch.update(doc(db, TRAINER_COLLECTION, trainerId), {
                studentCount: increment(-1),
            });

            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error('[TrainerService] unlinkStudent error:', error);
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
                where('completedAt', '>=', thirtyDaysAgo),
                orderBy('completedAt', 'desc')
            );
            const workoutsSnapshot = await getDocs(workoutsQuery);
            const workouts = workoutsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

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
    calculateAttendanceRate(workouts, student) {
        // Simple: workouts in last 30 days / (4 weeks * days per week from profile)
        const daysPerWeek = student.daysPerWeek || 3;
        const expectedWorkouts = 4 * daysPerWeek;
        const rate = Math.min((workouts.length / expectedWorkouts) * 100, 100);
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

            // Create new assigned routine
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
            batch.set(assignedRoutineRef, assignedData);

            await batch.commit();

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

