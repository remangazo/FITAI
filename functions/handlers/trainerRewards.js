/**
 * Trainer Rewards Handler
 * 
 * Cloud Functions for automatically updating trainer reward points
 * when their students become Premium.
 */

const admin = require("firebase-admin");
const db = admin.firestore();

// Reward points configuration (must match frontend)
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

/**
 * Calculate the trainer level based on reward points
 */
function calculateLevel(points) {
    if (points >= TRAINER_LEVELS.diamond.min) return "diamond";
    if (points >= TRAINER_LEVELS.gold.min) return "gold";
    if (points >= TRAINER_LEVELS.silver.min) return "silver";
    return "bronze";
}

/**
 * Recalculate and update trainer level and benefits
 */
async function recalculateTrainerLevel(trainerId) {
    const trainerRef = db.collection("trainers").doc(trainerId);
    const trainerDoc = await trainerRef.get();

    if (!trainerDoc.exists) return null;

    const data = trainerDoc.data();
    const newLevel = calculateLevel(data.rewardPoints || 0);
    const levelDetails = TRAINER_LEVELS[newLevel];

    await trainerRef.update({
        rewardLevel: newLevel,
        shopDiscount: levelDetails.discount,
        freeShipping: levelDetails.freeShipping,
    });

    console.log(`[TrainerRewards] Trainer ${trainerId} recalculated to level ${newLevel}`);
    return { newLevel, ...levelDetails };
}

/**
 * Firestore trigger: When a user becomes Premium
 * Updates the trainer's reward points if the user has a coachId
 */
async function onUserPremiumConversion(change, context) {
    const before = change.before.data();
    const after = change.after.data();
    const userId = context.params.userId;

    // Check if user just became Premium
    const becamePremium = !before.isPremium && after.isPremium;

    if (!becamePremium || !after.coachId) {
        return null; // No action needed
    }

    const trainerId = after.coachId;
    const isAnnual = after.subscriptionPlan === "annual";
    const points = isAnnual ? REWARD_POINTS.STUDENT_PREMIUM_ANNUAL : REWARD_POINTS.STUDENT_PREMIUM_MONTHLY;

    console.log(`[TrainerRewards] User ${userId} became Premium. Coach: ${trainerId}, Points: ${points}`);

    try {
        const trainerRef = db.collection("trainers").doc(trainerId);

        await trainerRef.update({
            rewardPoints: admin.firestore.FieldValue.increment(points),
            studentReferrals: admin.firestore.FieldValue.increment(1),
            totalRevenue: admin.firestore.FieldValue.increment(
                isAnnual ? 150000 : 15000 // ARS revenue estimate
            ),
        });

        // Recalculate level
        await recalculateTrainerLevel(trainerId);

        console.log(`[TrainerRewards] Successfully updated trainer ${trainerId}`);
        return { success: true, trainerId, pointsAdded: points };
    } catch (error) {
        console.error("[TrainerRewards] Error updating trainer:", error);
        return { error: error.message };
    }
}

/**
 * Firestore trigger: When a user completes onboarding with a coach
 */
async function onStudentOnboardingComplete(change, context) {
    const before = change.before.data();
    const after = change.after.data();
    const userId = context.params.userId;

    // Check if user just completed onboarding with a coach
    const completedOnboarding = !before.onboardingCompleted && after.onboardingCompleted;

    if (!completedOnboarding || !after.coachId) {
        return null;
    }

    const trainerId = after.coachId;

    console.log(`[TrainerRewards] User ${userId} completed onboarding. Coach: ${trainerId}`);

    try {
        const trainerRef = db.collection("trainers").doc(trainerId);

        // We award 15 points total: 5 for registration + 10 for complete onboarding
        // consolidating both events into one secure server-side call.
        const totalPoints = REWARD_POINTS.STUDENT_REGISTERED + REWARD_POINTS.STUDENT_COMPLETED_ONBOARDING;

        await trainerRef.update({
            rewardPoints: admin.firestore.FieldValue.increment(totalPoints),
            studentCount: admin.firestore.FieldValue.increment(1),
        });

        await recalculateTrainerLevel(trainerId);

        return { success: true, trainerId, pointsAdded: totalPoints };
    } catch (error) {
        console.error("[TrainerRewards] Error updating trainer on onboarding:", error);
        return { error: error.message };
    }
}

module.exports = {
    onUserPremiumConversion,
    onStudentOnboardingComplete,
    recalculateTrainerLevel,
    REWARD_POINTS,
    TRAINER_LEVELS,
};
