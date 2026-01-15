/**
 * XP Service - FitAI Gamification System
 * Handles experience points and level calculations
 */
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

export const XP_ACTIONS = {
    WORKOUT_COMPLETE: { xp: 100, reason: 'Entrenamiento Completado' },
    SET_COMPLETE: { xp: 5, reason: 'Serie Registrada' },
    PERSONAL_RECORD: { xp: 50, reason: 'Récord Personal' },
    BADGE_UNLOCKED: { xp: 200, reason: 'Logro Desbloqueado' }
};

export const xpService = {
    /**
     * Awards XP to a user and levels them up if necessary
     */
    async awardXP(userId, actionType) {
        if (!userId) return null;

        try {
            const action = typeof actionType === 'object' ? actionType : XP_ACTIONS[actionType];
            if (!action) {
                console.warn(`[XP Service] Unknown action type: ${actionType}`);
                return null;
            }

            const userRef = doc(db, 'users', userId);

            // 1. Get current stats to check for level up
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) return null;

            const userData = userSnap.data();
            const currentTotalXP = userData.totalXP || 0;
            const newTotalXP = currentTotalXP + action.xp;

            // 2. Calculate Level
            // Level 1: 0-500, Level 2: 501-1000, etc.
            const newLevel = Math.floor(newTotalXP / 500) + 1;
            const oldLevel = userData.level || 1;

            const updateData = {
                totalXP: increment(action.xp),
                lastXPUpdate: new Date().toISOString()
            };

            const leveledUp = newLevel > oldLevel;
            if (leveledUp) {
                updateData.level = newLevel;
            }

            await updateDoc(userRef, updateData);

            console.log(`[XP Service] Awarded ${action.xp} XP for ${action.reason}. New Total: ${newTotalXP}`);

            return {
                awardedXP: action.xp,
                newTotalXP,
                leveledUp,
                newLevel
            };

        } catch (error) {
            console.error('[XP Service] Error awarding XP:', error);
            return null;
        }
    },

    /**
     * Calculates stats for display based on totalXP
     */
    calculateLevelProgress(totalXP) {
        const currentXP = totalXP || 0;
        const level = Math.floor(currentXP / 500) + 1;
        const xpInCurrentLevel = currentXP % 500;
        const progressPercentage = (xpInCurrentLevel / 500) * 100;

        return {
            level,
            xpInCurrentLevel,
            nextLevelXP: 500,
            progressPercentage
        };
    }
};

export default xpService;
