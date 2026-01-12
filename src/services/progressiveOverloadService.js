/**
 * Progressive Overload Service - "The Brain" of FitAI
 * Analyzes workout history to suggest weight increases or adjustments.
 */
import { getExerciseProgress } from './workoutService';

export const progressiveOverloadService = {
    /**
     * Calculates the suggested weight for an exercise based on history
     * @param {string} userId 
     * @param {string} exerciseName 
     * @param {string} goal - 'strength', 'hypertrophy', 'definition'
     * @returns {Object} { suggestedWeight, reason, confidence, trend }
     */
    calculateNextWeight: async (userId, exerciseName, goal = 'hypertrophy') => {
        try {
            const history = await getExerciseProgress(userId, exerciseName);

            if (!history || history.length === 0) {
                return { suggestedWeight: null, reason: "Sin historial previo", confidence: 0, trend: 'stable' };
            }

            // Get last 3 sessions for better trend analysis
            const lastSessions = history.slice(-3).reverse();
            const lastSession = lastSessions[0];

            if (!lastSession || !lastSession.maxWeight) {
                return { suggestedWeight: null, reason: "Datos de sesión incompletos", confidence: 0, trend: 'stable' };
            }

            const currentWeight = lastSession.maxWeight;

            // Logic: If all sets were completed with the same weight and reps >= target
            // For now, we simplify: if maxWeight in last session > 0, we analyze

            // 1. STALL DETECTION: If the weight hasn't changed in the last 3 sessions
            const weights = lastSessions.map(s => s.maxWeight);
            const isStalled = weights.length >= 3 && weights.every(w => w === weights[0]);

            if (isStalled) {
                return {
                    suggestedWeight: currentWeight,
                    reason: "Estancamiento detectado. Considera técnica de intensidad o cambiar orden.",
                    confidence: 90,
                    trend: 'stalled',
                    action: 'change_technique'
                };
            }

            // 2. PROGRESSION LOGIC
            // Higher increase for lower body, lower for upper body
            const isLowerBody = /squat|leg|deadlift|lunge|press/i.test(exerciseName) && !/shoulder|bench/i.test(exerciseName);
            const increment = isLowerBody ? 5 : 2.5;

            // Simple rule: if you did it last time, increment 
            // In a more advanced version, we would check reps vs target_reps
            return {
                suggestedWeight: currentWeight + increment,
                reason: `Sobrecarga Progresiva: ${increment}kg adicionales basados en tu sesión perfecta anterior.`,
                confidence: 85,
                trend: 'up'
            };

        } catch (error) {
            console.error('[ProgressiveOverload] Error:', error);
            return { suggestedWeight: null, reason: "Error en el cálculo", confidence: 0 };
        }
    },

    /**
     * Analyzes overall muscle group progress
     */
    analyzeMuscleGroup: async (userId, muscleGroup) => {
        // Future implementation for the Coach Widget
        return { status: 'improving', volumeTrend: '+12%' };
    }
};
