import { db } from '../config/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    serverTimestamp,
    increment,
    writeBatch
} from 'firebase/firestore';

export const socialService = {
    /**
     * Follow a user
     * Updates 3 paths: 
     * 1. targetUser's followers
     * 2. currentUser's following
     * 3. targetUser's notification
     */
    async followUser(currentUserId, targetUserId, currentUserData) {
        if (!currentUserId || !targetUserId) return;
        if (currentUserId === targetUserId) return;

        const batch = writeBatch(db);

        // 1. Add to target's followers
        const followerRef = doc(db, 'users', targetUserId, 'followers', currentUserId);
        batch.set(followerRef, {
            followedAt: serverTimestamp(),
            displayName: currentUserData.displayName || 'Usuario',
            photoURL: currentUserData.photoURL || null
        });

        // 2. Add to current's following
        const followingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
        batch.set(followingRef, {
            followedAt: serverTimestamp()
        });

        // 3. Update counts (optional, better via Cloud Functions triggers but doing optimistic here)
        // Note: Client-side increment is risky without strict rules, but acceptable for MVP
        // Best practice: Use Cloud Functions. We will rely on Rules for subcollections and maybe a Function for aggregates.
        // For now, we don't update counts on client to avoid complex rules logic. Components should count query size or use Cloud Function.

        // 4. Send Notification
        const notifRef = doc(collection(db, 'notifications'));
        batch.set(notifRef, {
            userId: targetUserId, // Recipient
            type: 'follow',
            sourceUserId: currentUserId,
            sourceName: currentUserData.displayName || 'Alguien',
            sourcePhotoURL: currentUserData.photoURL || null,
            message: `${currentUserData.displayName || 'Alguien'} comenzó a seguirte.`,
            read: false,
            createdAt: serverTimestamp()
        });

        await batch.commit();
    },

    async unfollowUser(currentUserId, targetUserId) {
        if (!currentUserId || !targetUserId) return;

        const batch = writeBatch(db);

        const followerRef = doc(db, 'users', targetUserId, 'followers', currentUserId);
        batch.delete(followerRef);

        const followingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
        batch.delete(followingRef);

        await batch.commit();
    },

    async isFollowing(currentUserId, targetUserId) {
        if (!currentUserId || !targetUserId) return false;
        const ref = doc(db, 'users', currentUserId, 'following', targetUserId);
        const snap = await getDoc(ref);
        return snap.exists();
    },

    async getFollowers(userId) {
        const q = query(collection(db, 'users', userId, 'followers'), limit(50));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    async getFollowing(userId) {
        const q = query(collection(db, 'users', userId, 'following'), limit(50));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    /**
     * Search users by displayName prefix
     */
    async searchUsers(searchTerm) {
        if (!searchTerm || searchTerm.length < 3) return [];
        // Note: Firestore doesn't support full text search. 
        // Simple prefix match:
        const term = searchTerm.toLowerCase();
        // This assumes we have a lowercase field 'searchName' or similar. 
        // For MVP we might scan or need a Cloud Function to mirror data to Algolia/Typesense.
        // Fallback: Query by plain displayName (case sensitive unfortunately) or just limit reasonable results.

        // Let's try to find users. Ideally we store 'username_lower'
        const usersRef = collection(db, 'users');
        const q = query(
            usersRef,
            where('displayName', '>=', searchTerm),
            where('displayName', '<=', searchTerm + '\uf8ff'),
            limit(10)
        );

        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    async getSocialFeed() {
        // MVP: Get recent community posts. 
        // Real: Get posts from people I follow. Firestore "IN" queries limit to 10.
        // For now, global feed or my feed.
        const q = query(
            collection(db, 'communityPosts'),
            orderBy('createdAt', 'desc'),
            limit(20)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    /**
     * Give kudos to an activity
     */
    async giveKudos(userId, activityId, userData) {
        if (!userId || !activityId) return;

        const kudosRef = doc(db, 'communityPosts', activityId, 'kudos', userId);
        await setDoc(kudosRef, {
            userId,
            userName: userData?.displayName || 'Usuario',
            userPhoto: userData?.photoURL || null,
            createdAt: serverTimestamp()
        });

        // Optionally send notification to activity owner
        // const activity = await getDoc(doc(db, 'communityPosts', activityId));
        // if (activity.exists() && activity.data().userId !== userId) { ... }
    },

    /**
     * Create activity post from completed workout
     */
    async createActivityPost(userId, userData, workoutData) {
        if (!userId || !workoutData) return;

        const postData = {
            userId,
            userName: userData?.displayName || 'Usuario',
            userPhoto: userData?.photoURL || null,
            userLevel: userData?.level || 1,
            type: 'workout',
            workout: {
                name: workoutData.dayName || workoutData.routineName,
                duration: workoutData.duration,
                calories: workoutData.caloriesBurned || 0,
                totalSets: workoutData.totalSets,
                totalVolume: workoutData.totalVolume,
                exercises: workoutData.exercises?.map(e => e.name) || [],
                prs: workoutData.personalRecords?.map(pr => ({
                    exercise: pr,
                    weight: 0,
                    reps: 0
                })) || []
            },
            kudosCount: 0,
            commentsCount: 0,
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'communityPosts'), postData);
        return { id: docRef.id, ...postData };
    },

    /**
     * Get leaderboard data
     */
    async getLeaderboard(type = 'workouts', period = 'week') {
        // For MVP, we'll calculate from workouts collection
        // In production, this should be a Cloud Function that updates periodically

        const startDate = new Date();
        if (period === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'month') {
            startDate.setMonth(startDate.getMonth() - 1);
        }

        // This is a simplified version - in production use aggregated data
        const usersRef = collection(db, 'users');
        const usersSnap = await getDocs(query(usersRef, orderBy('totalWorkouts', 'desc'), limit(10)));

        return usersSnap.docs.map((d, i) => ({
            rank: i + 1,
            id: d.id,
            ...d.data()
        }));
    },

    /**
     * Get users currently training (with recent workout start)
     */
    async getLiveTrainers(userId, followingIds = []) {
        // Check for workouts started in last 2 hours with status 'in_progress'
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

        const workoutsRef = collection(db, 'workouts');
        const q = query(
            workoutsRef,
            where('status', '==', 'in_progress'),
            limit(10)
        );

        const snap = await getDocs(q);
        const liveWorkouts = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

        // Get user data for each live workout
        const liveUsers = await Promise.all(
            liveWorkouts.map(async w => {
                const userDoc = await getDoc(doc(db, 'users', w.userId));
                if (userDoc.exists()) {
                    return {
                        id: w.userId,
                        ...userDoc.data(),
                        currentExercise: w.exercises?.[0]?.name || 'Entrenando'
                    };
                }
                return null;
            })
        );

        return liveUsers.filter(u => u !== null && u.id !== userId);
    }
};
