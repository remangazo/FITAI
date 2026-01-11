/**
 * Motor Avanzado de Rutinas - FitAI
 * Sistema inteligente que genera rutinas personalizadas basadas en:
 * - Perfil completo del usuario
 * - Objetivos múltiples (primario + secundarios)
 * - Capacidades reales (benchmarks)
 * - Equipo disponible
 * - Lesiones y limitaciones
 */

import { EXERCISE_DATABASE, filterByEquipment, filterByInjuries, getPrimaryExercises, getSecondaryExercises } from '../data/exerciseDatabase';
import { ROUTINE_TEMPLATES, selectTemplate, getTrainingDays } from '../data/routineTemplates';

// ===== ANÁLISIS DEL PERFIL =====

/**
 * Calcula el nivel REAL del usuario (no solo por años de experiencia)
 */
export const calculateTrueLevel = (userData) => {
    let score = 0;

    // 1. Años de experiencia (40% del score)
    const years = parseInt(userData.experienceYears) || 0;
    if (years >= 3) score += 4;
    else if (years >= 1) score += 2;
    else score += 1;

    // 2. Benchmarks de fuerza (50% del score)
    if (userData.benchmarkBenchPress || userData.benchmarkSquat || userData.benchmarkDeadlift) {
        const benchmarkScore = evaluateBenchmarks(userData);
        score += benchmarkScore;
    } else {
        // Si no tiene benchmarks, usar años + nivel técnico
        if (years >= 2) score += 2;
        if (userData.techniqueLevel === "avanzado") score += 1;
    }

    // 3. Nivel técnico autoreportado (10% del score)
    if (userData.techniqueLevel === "avanzado") score += 1;
    else if (userData.techniqueLevel === "intermedio") score += 0.5;

    // CLASIFICACIÓN FINAL
    if (score >= 8) return "advanced";
    if (score >= 5) return "intermediate";
    return "beginner";
};

/**
 * Evalúa benchmarks de fuerza en relación al peso corporal
 */
const evaluateBenchmarks = (userData) => {
    const bodyWeight = parseFloat(userData.weight) || 70;
    let score = 0;

    // Press Banca (ratio peso levantado / peso corporal)
    if (userData.benchmarkBenchPress) {
        const benchRatio = parseFloat(userData.benchmarkBenchPress) / bodyWeight;
        if (benchRatio >= 1.5) score += 2;        // Avanzado
        else if (benchRatio >= 1.0) score += 1;   // Intermedio
        else if (benchRatio >= 0.75) score += 0.5; // Principiante+
    }

    // Sentadilla
    if (userData.benchmarkSquat) {
        const squatRatio = parseFloat(userData.benchmarkSquat) / bodyWeight;
        if (squatRatio >= 2.0) score += 2;
        else if (squatRatio >= 1.5) score += 1;
        else if (squatRatio >= 1.0) score += 0.5;
    }

    // Peso Muerto
    if (userData.benchmarkDeadlift) {
        const deadliftRatio = parseFloat(userData.benchmarkDeadlift) / bodyWeight;
        if (deadliftRatio >= 2.5) score += 2;
        else if (deadliftRatio >= 2.0) score += 1;
        else if (deadliftRatio >= 1.5) score += 0.5;
    }

    // Dominadas (absoluto)
    if (userData.benchmarkPullups) {
        const pullups = parseInt(userData.benchmarkPullups) || 0;
        if (pullups >= 15) score += 1;
        if (pullups >= 20) score += 1;
    }

    return Math.min(score, 5); // Max 5 puntos de benchmarks
};

// ===== ESTRATEGIA DE OBJETIVOS MÚLTIPLES =====

/**
 * Define la estrategia de entrenamiento basada en objetivos primarios y secundarios
 */
export const defineGoalStrategy = (primaryGoal, secondaryGoals = []) => {
    const hasSecondary = (goal) => secondaryGoals.includes(goal);

    // RECOMPOSICIÓN: Pérdida grasa + Ganancia músculo
    if (
        (primaryGoal === "weight_loss" && hasSecondary("muscle")) ||
        (primaryGoal === "muscle" && hasSecondary("weight_loss"))
    ) {
        return {
            approach: "recomposition",
            trainingEmphasis: "hybrid",
            volumeDistribution: {
                strength: 60,
                metabolic: 40
            },
            setsReps: {
                primary: "6-10",
                secondary: "10-15"
            },
            restPeriods: {
                primary: 120,
                secondary: 60
            },
            cardio: "HIIT_post",
            cardio Duration: 12,
            nutritionAdjustment: "moderate_deficit_high_protein"
        };
    }

    // HIPERTROFIA PURA
    if (primaryGoal === "muscle" && !hasSecondary("weight_loss")) {
        return {
            approach: "pure_hypertrophy",
            trainingEmphasis: "volume",
            volumeDistribution: {
                hypertrophy: 80,
                strength: 20
            },
            setsReps: {
                primary: "8-12",
                secondary: "12-15"
            },
            restPeriods: {
                primary: 90,
                secondary: 60
            },
            cardio: "minimal",
            cardioDuration: 0,
            nutritionAdjustment: "surplus_high_protein"
        };
    }

    // FAT LOSS PURO
    if (primaryGoal === "weight_loss" && !hasSecondary("muscle")) {
        return {
            approach: "fat_loss",
            trainingEmphasis: "metabolic",
            volumeDistribution: {
                metabolic: 70,
                strength: 30
            },
            setsReps: {
                primary: "12-15",
                secondary: "15-20"
            },
            restPeriods: {
                primary: 45,
                secondary: 30
            },
            cardio: "extensive",
            cardioDuration: 20,
            nutritionAdjustment: "deficit_moderate_protein"
        };
    }

    // POWERBUILDING: Fuerza + Hipertrofia
    if (
        (primaryGoal === "strength" && hasSecondary("muscle")) ||
        (primaryGoal === "muscle" && hasSecondary("strength"))
    ) {
        return {
            approach: "powerbuilding",
            trainingEmphasis: "strength_volume",
            volumeDistribution: {
                strength: 50,
                hypertrophy: 50
            },
            setsReps: {
                primary: "3-6",
                secondary: "8-12"
            },
            restPeriods: {
                primary: 180,
                secondary: 90
            },
            cardio: "none",
            cardioDuration: 0,
            nutritionAdjustment: "surplus_high_protein"
        };
    }

    // FUERZA PURA
    if (primaryGoal === "strength") {
        return {
            approach: "pure_strength",
            trainingEmphasis: "power",
            volumeDistribution: {
                strength: 90,
                hypertrophy: 10
            },
            setsReps: {
                primary: "3-5",
                secondary: "5-8"
            },
            restPeriods: {
                primary: 210,
                secondary: 120
            },
            cardio: "none",
            cardioDuration: 0,
            nutritionAdjustment: "surplus_moderate_protein"
        };
    }

    // ENDURANCE (si elige múltiples secundarios incluyendo endurance)
    if (primaryGoal === "endurance" || hasSecondary("endurance")) {
        return {
            approach: "endurance_hybrid",
            trainingEmphasis: "circuit",
            volumeDistribution: {
                endurance: 60,
                strength: 40
            },
            setsReps: {
                primary: "12-20",
                secondary: "15-25"
            },
            restPeriods: {
                primary: 30,
                secondary: 20
            },
            cardio: "extensive",
            cardioDuration: 25,
            nutritionAdjustment: "balanced_high_carbs"
        };
    }

    // DEFAULT: Mantenimiento balanceado
    return {
        approach: "balanced",
        trainingEmphasis: "general",
        volumeDistribution: {
            strength: 50,
            hypertrophy: 50
        },
        setsReps: {
            primary: "6-10",
            secondary: "10-12"
        },
        restPeriods: {
            primary: 90,
            secondary: 60
        },
        cardio: "moderate",
        cardioDuration: 10,
        nutritionAdjustment: "maintenance"
    };
};

// ===== SELECCIÓN DE SPLIT =====

/**
 * Selecciona el split óptimo según perfil y estrategia
 */
export const selectOptimalSplit = (userLevel, availableDays, strategy) => {
    const daysCount = availableDays.length;

    // PRINCIPIANTES siempre Full Body (3-4 días)
    if (userLevel === "beginner") {
        return {
            type: "full_body",
            frequency: Math.min(daysCount, 4),
            reason: "Full body es óptimo para principiantes (mayor frecuencia muscular)"
        };
    }

    // INTERMEDIOS
    if (userLevel === "intermediate") {
        // Si tiene 5+ días y busca hipertrofia → PPL
        if (daysCount >= 5 && strategy.approach === "pure_hypertrophy") {
            return {
                type: "ppl",
                frequency: 6,
                reason: "PPL permite mayor volumen para hipertrofia"
            };
        }
        // Default: Upper/Lower (4 días)
        return {
            type: "upper_lower",
            frequency: 4,
            reason: "Upper/Lower balancea frecuencia y volumen"
        };
    }

    // AVANZADOS
    if (userLevel === "advanced") {
        // Powerbuilding → Upper/Lower con énfasis en fuerza
        if (strategy.approach === "powerbuilding") {
            return {
                type: "upper_lower_power",
                frequency: 4,
                reason: "Upper/Lower permite mayor intensidad en compuestos"
            };
        }
        // Default: PPL (5-6 días)
        return {
            type: "ppl",
            frequency: Math.min(daysCount, 6),
            reason: "PPL permite especialización y alto volumen"
        };
    }

    return { type: "full_body", frequency: 3, reason: "Default" };
};

// ===== SELECCIÓN INTELIGENTE DE EJERCICIOS =====

/**
 * Selecciona ejercicios evitando repeticiones recientes y priorizando debilidades
 */
export const selectExercises = (
    dayType,
    template,
    userProfile,
    availableEquipment,
    injuries,
    previousRoutines = []
) => {
    const { level, knownWeaknesses = [] } = userProfile;
    const structure = template.structure[dayType] || template.structure.main;

    let exercises = [];

    //=== EJERCICIOS PRIMARIOS (Compuestos) ===
    const primaryCount = structure.primaryCount || 2;

    for (let i = 0; i < primaryCount; i++) {
        const category = structure.categories[i];

        // Obtener opciones
        let options = getPrimaryExercises(category, level);

        // Filtrar por equipo
        options = filterByEquipment(options, availableEquipment);

        // Filtrar por lesiones
        options = filterByInjuries(options, injuries);

        // Excluir usados recientemente
        options = options.filter(ex => {
            const usedRecently = previousRoutines.some(routine =>
                routine.exercises?.some(e => e.id === ex.id)
            );
            return !usedRecently;
        });

        // Priorizar debilidades
        const selected = selectBasedOnWeakness(options, knownWeaknesses);

        if (selected) {
            exercises.push({
                ...selected,
                sets: template.details.sets[0],
                reps: template.details.reps.join('-'),
                rest: template.details.rest,
                order: i + 1,
                type: "primary"
            });
        }
    }

    // === EJERCICIOS SECUNDARIOS (Accesorios) ===
    const secondaryCount = structure.secondaryCount || 2;

    for (let i = 0; i < secondaryCount; i++) {
        const categoryIndex = primaryCount + i;
        const category = structure.categories[categoryIndex] || structure.categories[i % structure.categories.length];

        let options = getSecondaryExercises(category, level);
        options = filterByEquipment(options, availableEquipment);
        options = filterByInjuries(options, injuries);

        // Evitar músculos ya trabajados en este día
        options = options.filter(ex => {
            const alreadyWorked = exercises.some(e =>
                e.muscleGroups.some(mg => ex.muscleGroups.includes(mg))
            );
            return !alreadyWorked;
        });

        const selected = selectBasedOnWeakness(options, knownWeaknesses);

        if (selected) {
            exercises.push({
                ...selected,
                sets: 3,
                reps: template.details.reps.join('-'),
                rest: Math.max(template.details.rest - 30, 45),
                order: primaryCount + i + 1,
                type: "secondary"
            });
        }
    }

    return exercises;
};

/**
 * Selecciona ejercicio priorizando debilidades conocidas
 */
const selectBasedOnWeakness = (options, weaknesses) => {
    if (!options || options.length === 0) return null;

    if (weaknesses && weaknesses.length > 0) {
        // Priorizar ejercicios que trabajen debilidades
        const weaknessExercises = options.filter(ex =>
            ex.targetWeaknesses?.some(tw => weaknesses.includes(tw))
        );

        if (weaknessExercises.length > 0) {
            return randomWeighted(weaknessExercises);
        }
    }

    // Si no hay debilidades o no hay match, randomizar
    return randomWeighted(options);
};

/**
 * Selección random con peso (prioriza ejercicios no usados)
 */
const randomWeighted = (options) => {
    if (options.length === 0) return null;
    return options[Math.floor(Math.random() * options.length)];
};

// === FUNCIÓN PRINCIPAL: GENERAR RUTINA COMPLETA ===

/**
 * Genera rutina completa para el usuario
 */
export const generateAdvancedRoutine = (userProfile) => {
    // 1. Analizar perfil
    const trueLevel = calculateTrueLevel(userProfile);

    // 2. Definir estrategia de objetivos
    const strategy = defineGoalStrategy(
        userProfile.primaryGoal,
        userProfile.secondaryGoals || []
    );

    // 3. Seleccionar split óptimo
    const split = selectOptimalSplit(
        trueLevel,
        userProfile.availableDays || ["lunes", "miercoles", "viernes"],
        strategy
    );

    // 4. Seleccionar template base
    let goalForTemplate = userProfile.primaryGoal;
    if (strategy.approach === "recomposition") goalForTemplate = "hypertrophy";
    else if (strategy.approach === "powerbuilding") goalForTemplate = "strength";
    else if (strategy.approach === "fat_loss") goalForTemplate = "fat_loss";

    const template = selectTemplate(trueLevel, goalForTemplate);

    // 5. Generar días de entrenamiento
    const trainingDays = getTrainingDays(
        split.type,
        split.frequency,
        userProfile.availableDays || []
    );

    // 6. Generar ejercicios para cada día
    const weeklyRoutine = {};

    trainingDays.forEach(dayInfo => {
        const dayType = typeof dayInfo === 'string' ? split.type : dayInfo.type;
        const dayName = typeof dayInfo === 'string' ? dayInfo : dayInfo.day;

        const exercises = selectExercises(
            dayType,
            template,
            {
                level: trueLevel,
                knownWeaknesses: userProfile.knownWeaknesses || []
            },
            userProfile.availableEquipment || ["barra", "mancuernas", "banco", "peso_corporal"],
            userProfile.injuries || []
        );

        weeklyRoutine[dayName] = {
            dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
            type: dayType,
            exercises,
            cardio: strategy.cardioDuration > 0 ? {
                type: strategy.cardio,
                duration: strategy.cardioDuration
            } : null
        };
    });

    return {
        title: `Rutina ${strategy.approach} - ${trueLevel}`,
        level: trueLevel,
        goalStrategy: strategy,
        split: split.type,
        frequency: split.frequency,
        weeklyRoutine,
        nutritionSync: {
            adjustment: strategy.nutritionAdjustment,
            recommendation: getNutritionRecommendation(strategy)
        },
        generatedAt: new Date().toISOString()
    };
};

/**
 * Obtiene recomendación nutricional sincronizada
 */
const getNutritionRecommendation = (strategy) => {
    const recommendations = {
        surplus_high_protein: "Superávit calórico +300-400 kcal, proteína 2.0g/kg",
        moderate_deficit_high_protein: "Déficit moderado -300-400 kcal, proteína 2.2g/kg",
        deficit_moderate_protein: "Déficit -400-500 kcal, proteína 1.8g/kg",
        balanced_high_carbs: "Mantenimiento, carbohidratos elevados para resistencia",
        maintenance: "Calorías de mantenimiento, macros balanceados"
    };

    return recommendations[strategy.nutritionAdjustment] || recommendations.maintenance;
};

export default {
    calculateTrueLevel,
    defineGoalStrategy,
    selectOptimalSplit,
    selectExercises,
    generateAdvancedRoutine
};
