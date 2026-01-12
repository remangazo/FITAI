/**
 * Servicio de Sincronización Rutina-Dieta - FitAI
 * Asegura que la nutrición esté perfectamente alineada con el entrenamiento
 */

import { calculateFullMetabolicProfile } from './metabolicCalculator';
import { generateQuickPlan } from './mealGenerator';
import { generateAdvancedRoutine } from './advancedRoutineEngine';

/**
 * Genera plan completo sincronizado: Rutina + Nutrición
 */
export const generateSynchronizedPlan = async (userProfile) => {
    // 1. Generar rutina personalizada
    const routine = generateAdvancedRoutine(userProfile);

    // 2. Ajustar perfil metabólico según estrategia de la rutina
    const adjustedProfile = adjustMetabolicProfileForRoutine(userProfile, routine);

    // 3. Calcular métricas metabólicas
    const metabolicProfile = calculateFullMetabolicProfile(adjustedProfile);

    // 4. Generar plan nutricional alineado
    const nutritionPlan = generateQuickPlan(metabolicProfile, userProfile.country || 'Argentina');

    // 5. Agregar días de entrenamiento a la nutrición
    const synchronizedNutrition = addTrainingDaysToNutrition(
        nutritionPlan,
        routine.weeklyRoutine
    );

    return {
        routine,
        nutrition: synchronizedNutrition,
        syncDetails: {
            approach: routine.goalStrategy.approach,
            nutritionAdjustment: routine.nutritionSync.adjustment,
            recommendation: routine.nutritionSync.recommendation,
            trainingDays: Object.keys(routine.weeklyRoutine),
            caloriesTrainingDay: metabolicProfile.metabolism.targetCalories,
            caloriesRestDay: calculateRestDayCalories(
                metabolicProfile.metabolism.targetCalories,
                routine.goalStrategy.approach
            )
        },
        generatedAt: new Date().toISOString()
    };
};

/**
 * Ajusta perfil metabólico según estrategia de rutina
 */
const adjustMetabolicProfileForRoutine = (userProfile, routine) => {
    const strategy = routine.goalStrategy;

    // Ajustar objetivo primario según estrategia
    let adjustedGoal = userProfile.primaryGoal;

    if (strategy.approach === "recomposition") {
        adjustedGoal = "muscle"; // Priorizar preservación/ganancia muscular
    } else if (strategy.approach === "powerbuilding") {
        adjustedGoal = "strength";
    } else if (strategy.approach === "fat_loss") {
        adjustedGoal = "weight_loss";
    }

    // Ajustar frecuencia de entrenamiento para TDEE
    const adjustedFrequency = mapFrequencyToActivityLevel(routine.frequency);

    return {
        ...userProfile,
        primaryGoal: adjustedGoal,
        trainingFrequency: adjustedFrequency,
        // Metadata para el calculador
        _routineStrategy: strategy
    };
};

/**
 * Mapea frecuencia de rutina a nivel de actividad
 */
const mapFrequencyToActivityLevel = (frequency) => {
    if (frequency >= 6) return "veryActive";
    if (frequency >= 5) return "active";
    if (frequency >= 3) return "moderate";
    return "light";
};

/**
 * Calcula calorías para días de descanso
 */
const calculateRestDayCalories = (trainingDayCalories, approach) => {
    // En días de descanso, reducir calorías ligeramente
    const reductions = {
        pure_hypertrophy: 0.95,      // -5% (mantener anabolismo)
        recomposition: 0.85,          // -15% (mayor déficit en reposo)
        fat_loss: 0.80,               // -20% (déficit agresivo en reposo)
        powerbuilding: 0.95,          // -5%
        pure_strength: 1.0,           // Sin cambio (necesita recuperación)
        balanced: 0.90                // -10%
    };

    const reduction = reductions[approach] || 0.90;
    return Math.round(trainingDayCalories * reduction);
};

/**
 * Agrega información de entreno a cada día nutricional
 */
const addTrainingDaysToNutrition = (nutritionPlan, weeklyRoutine) => {
    const trainingDays = new Set(Object.keys(weeklyRoutine).map(d => d.toLowerCase()));

    // Días de la semana
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    const enhancedPlan = { ...nutritionPlan };

    days.forEach(day => {
        const dayLower = day.toLowerCase();
        const isTrainingDay = trainingDays.has(dayLower);

        if (enhancedPlan.weeklyPlan[day]) {
            // NOTA: Mantenemos el array pero le adjuntamos propiedades de metadatos
            // para que .map() siga funcionado en la UI
            const meals = enhancedPlan.weeklyPlan[day];
            meals.isTrainingDay = isTrainingDay;
            meals.workoutInfo = isTrainingDay ? {
                type: weeklyRoutine[dayLower].type,
                exercises: weeklyRoutine[dayLower].exercises.map(e => e.name),
                estimatedDuration: calculateWorkoutDuration(weeklyRoutine[dayLower].exercises)
            } : null;
        }
    });

    return enhancedPlan;
};

/**
 * Estima duración del entreno
 */
const calculateWorkoutDuration = (exercises) => {
    // Fórmula: (sets × rest_time) + (sets × 60s trabajo) por ejercicio
    let totalMinutes = 0;

    exercises.forEach(ex => {
        const sets = ex.sets || 3;
        const rest = ex.rest || 90;
        const workTime = 60; // ~1 min por set

        totalMinutes += (sets * (rest + workTime)) / 60;
    });

    // Agregar warm-up (10 min) y stretching (5 min)
    totalMinutes += 15;

    return Math.round(totalMinutes);
};

/**
 * Calcula calorías quemadas en un entreno
 */
export const calculateWorkoutCalories = (exercises, userWeight, duration) => {
    // Usar MET de weight_training_moderate (0.08)
    const calPerKgPerMin = 0.08;
    const weight = parseFloat(userWeight) || 70;
    const durationMin = duration || calculateWorkoutDuration(exercises);

    return Math.round(calPerKgPerMin * weight * durationMin);
};

/**
 * Obtiene recomendaciones de timing nutricional
 */
export const getNutritionTiming = (approach) => {
    const timings = {
        pure_hypertrophy: {
            preWorkout: "Comida con carbos 2-3h antes del entreno",
            postWorkout: "Proteína + carbos dentro de 2h post-entreno",
            evening: "Proteína antes de dormir (caseína)"
        },
        recomposition: {
            preWorkout: "Comida ligera 1-2h antes",
            postWorkout: "Proteína + carbos moderados post-entreno",
            evening: "Proteína con vegetales"
        },
        fat_loss: {
            preWorkout: "Comida ligera o ayuno (opcional)",
            postWorkout: "Proteína principalmente, carbos limitados",
            evening: "Proteína con vegetales"
        },
        powerbuilding: {
            preWorkout: "Comida completa 2-3h antes",
            postWorkout: "Proteína + carbos rápidos",
            evening: "Comida completa alta en proteína"
        },
        pure_strength: {
            preWorkout: "Comida completa alta en carbos 3h antes",
            postWorkout: "Recuperación completa (proteína + carbos + grasas)",
            evening: "Comida densa en calorías"
        }
    };

    return timings[approach] || timings.recomposition;
};

export default {
    generateSynchronizedPlan,
    calculateWorkoutCalories,
    getNutritionTiming,
    calculateRestDayCalories
};
