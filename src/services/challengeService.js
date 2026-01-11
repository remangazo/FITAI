import { db } from '../config/firebase';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    increment,
    serverTimestamp,
    runTransaction
} from 'firebase/firestore';

export const challengeService = {
    // 1. Get Challenges (Active/Upcoming)
    getChallenges: async (filter = 'active') => {
        try {
            const challengesRef = collection(db, 'challenges');
            let q;

            const now = new Date();

            if (filter === 'active') {
                q = query(
                    challengesRef,
                    where('status', '==', 'active'),
                    orderBy('endDate', 'asc') // Show ending soonest first
                );
            } else {
                q = query(challengesRef, orderBy('startDate', 'desc'));
            }

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        } catch (error) {
            console.error("Error getting challenges:", error);
            return [];
        }
    },

    // 2. Join a Challenge
    joinChallenge: async (challengeId, userId, userProfile) => {
        try {
            const challengeRef = doc(db, 'challenges', challengeId);
            const participantRef = doc(db, 'challenges', challengeId, 'participants', userId);

            await runTransaction(db, async (transaction) => {
                const challengeDoc = await transaction.get(challengeRef);
                if (!challengeDoc.exists()) {
                    throw new Error("Challenge does not exist!");
                }

                const participantDoc = await transaction.get(participantRef);
                if (participantDoc.exists()) {
                    throw new Error("User already joined this challenge!");
                }

                // Create participant record
                transaction.set(participantRef, {
                    userId,
                    userName: userProfile.name || 'Atleta',
                    userPhoto: userProfile.photoURL || null,
                    joinedAt: serverTimestamp(),
                    progress: 0,
                    completed: false,
                    score: 0
                });

                // Increment participant count
                transaction.update(challengeRef, {
                    participantsCount: increment(1)
                });
            });
            return true;
        } catch (error) {
            console.error("Error joining challenge:", error);
            throw error;
        }
    },

    // 3. Get User Participation Status
    getUserChallengeStatus: async (challengeId, userId) => {
        try {
            const docRef = doc(db, 'challenges', challengeId, 'participants', userId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data();
            }
            return null;
        } catch (error) {
            console.error("Error checking status:", error);
            return null;
        }
    },

    // 4. Update Progress (called after workout/activity)
    // Type: 'workouts', 'calories', 'minutes'
    updateProgress: async (userId, type, value) => {
        try {
            // Find ALL active challenges of this type that the user has joined
            // Note: This requires a complex query or keeping a local list of joined challenges.
            // For MVP, simplistic approach: Query all active challenges of type, then check participation.
            // Optimization: Store 'activeChallenges' in user profile or keep a separate collection 'userChallenges'.

            // Simpler approach for now: Client knows active challenges or we query all active challenges
            const challengesRef = collection(db, 'challenges');
            const q = query(
                challengesRef,
                where('status', '==', 'active'),
                where('type', '==', type)
            );

            const snapshot = await getDocs(q);

            const updates = [];

            for (const challengeDoc of snapshot.docs) {
                const challengeId = challengeDoc.id;
                const target = challengeDoc.data().target;
                const participantRef = doc(db, 'challenges', challengeId, 'participants', userId);

                // We use transaction or direct update if we are sure user exists.
                // using updateDoc will fail if doc doesn't exist, which is good (user not joined).
                const promise = runTransaction(db, async (transaction) => {
                    const pDoc = await transaction.get(participantRef);
                    if (!pDoc.exists()) return; // User not in this challenge

                    const currentData = pDoc.data();
                    if (currentData.completed) return; // Already finished

                    const newProgress = (currentData.progress || 0) + value;
                    const isCompleted = newProgress >= target;

                    transaction.update(participantRef, {
                        progress: newProgress,
                        score: newProgress, // Simple scoring 1:1 for now
                        completed: isCompleted,
                        completedAt: isCompleted ? serverTimestamp() : null
                    });
                }).catch(err => {
                    // Ignore errors if user not joined (though logic above handles it gracefully)
                    // console.log(`User not in challenge ${challengeId}`);
                });

                updates.push(promise);
            }

            await Promise.all(updates);
            return true;
        } catch (error) {
            console.error("Error updating challenge progress:", error);
            return false;
        }
    },

    // 5. Get Leaderboard
    getLeaderboard: async (challengeId, limitCount = 10) => {
        try {
            const participantsRef = collection(db, 'challenges', challengeId, 'participants');
            const q = query(
                participantsRef,
                orderBy('score', 'desc'),
                limit(limitCount)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error getting leaderboard:", error);
            return [];
        }
    },

    // DEV TOOL: Seed default challenges
    seedChallenges: async () => {
        const challengesRef = collection(db, 'challenges');

        // Check if any exist
        const snapshot = await getDocs(query(challengesRef, limit(1)));
        if (!snapshot.empty) return; // Already seeded

        const now = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const seeds = [
            {
                title: 'Desafío de Constancia',
                description: 'Completa 12 entrenamientos este mes. ¡La consistencia es la clave!',
                type: 'workouts',
                target: 12,
                status: 'active',
                startDate: now,
                endDate: nextMonth,
                participantsCount: 0,
                image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1470',
                color: 'from-blue-600 to-indigo-600'
            },
            {
                title: 'Quemador de Calorías',
                description: 'Quema 5000 kcal totales en tus sesiones de cardio y pesas.',
                type: 'calories',
                target: 5000,
                status: 'active',
                startDate: now,
                endDate: nextMonth,
                participantsCount: 0,
                image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=1469',
                color: 'from-orange-500 to-red-600'
            }
        ];

        for (const seed of seeds) {
            await setDoc(doc(challengesRef), seed);
        }
        console.log('Seeded challenges');
    }
};
