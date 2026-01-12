/**
 * Badge Service - Gamification system for FitAI
 */
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

export const BADGES = {
    EARLY_ADOPTER: { id: 'early_adopter', name: 'Miembro Fundador', icon: '🏛️', color: 'amber' },
    STREAK_7: { id: 'streak_7', name: 'Siete de Hierro', icon: '🔥', color: 'orange' },
    STREAK_30: { id: 'streak_30', name: 'Imparable 30', icon: '💎', color: 'blue' },
    CLUB_100_BENCH: { id: 'club_100_bench', name: '100kg Club (Banca)', icon: '🏋️', color: 'purple' },
    VOLUME_LEGEND: { id: 'volume_legend', name: 'Leyenda del Volumen', icon: '📈', color: 'emerald' }
};

export const badgeService = {
    /**
     * Checks and awards badges to a user based on their stats
     */
    async checkAndAwardBadges(userId, stats, prs) {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) return [];

            const userData = userSnap.data();
            const currentBadges = userData.badges || [];
            const newBadges = [];

            // 1. Check Streaks
            if (stats.streak >= 7 && !currentBadges.includes('streak_7')) {
                newBadges.push('streak_7');
            }
            if (stats.streak >= 30 && !currentBadges.includes('streak_30')) {
                newBadges.push('streak_30');
            }

            // 2. Check PRs
            if (prs && prs['Press Banca']?.weight >= 100 && !currentBadges.includes('club_100_bench')) {
                newBadges.push('club_100_bench');
            }

            // Award if there are new ones
            if (newBadges.length > 0) {
                await updateDoc(userRef, {
                    badges: arrayUnion(...newBadges)
                });
                console.log('[BadgeService] Awarded new badges:', newBadges);
            }

            return newBadges;

        } catch (error) {
            console.error('[BadgeService] Error awarding badges:', error);
            return [];
        }
    }
};
