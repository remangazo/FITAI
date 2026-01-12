/**
 * Motor de Cálculo Metabólico de Precisión - FitAI
 * Basado en investigación científica actualizada (Mifflin-St Jeor, ACSM, ISSN)
 * 
 * Este servicio NO usa IA - solo matemáticas puras para máxima precisión.
 */

// ============================================================================
// CONSTANTES CIENTÍFICAS
// ============================================================================

// Factores de actividad (Harris-Benedict revisado / Mifflin-St Jeor)
const ACTIVITY_FACTORS = {
    sedentary: 1.2,        // Poco o nada de ejercicio, trabajo de escritorio
    light: 1.375,          // Ejercicio ligero 1-2 días/semana
    moderate: 1.55,        // Ejercicio moderado 3-4 días/semana
    active: 1.725,         // Ejercicio intenso 5-6 días/semana
    veryActive: 1.9,       // Ejercicio muy intenso, trabajo físico, atletas
    athlete: 2.2           // Atletas de élite, entrenamiento 2x/día
};

// Calorías quemadas por actividad por minuto (MET simplificado x peso promedio)
// Fuente: Compendium of Physical Activities (Ainsworth et al.)
const ACTIVITY_CALORIES_PER_KG_PER_MINUTE = {
    // Cardio
    walking_slow: 0.05,      // 3 km/h - paseo
    walking_moderate: 0.07,  // 5 km/h - caminata rápida
    walking_fast: 0.09,      // 6.5 km/h - power walking
    running_slow: 0.12,      // 8 km/h - trote suave
    running_moderate: 0.15,  // 10 km/h - carrera moderada
    running_fast: 0.18,      // 12+ km/h - carrera intensa
    cycling_slow: 0.06,      // Ciclismo recreativo
    cycling_moderate: 0.10,  // Ciclismo moderado
    cycling_fast: 0.14,      // Ciclismo intenso
    swimming: 0.11,          // Natación general
    elliptical: 0.09,        // Elíptica moderada
    rowing: 0.12,            // Remo moderado
    jump_rope: 0.16,         // Saltar la cuerda
    hiit: 0.18,              // HIIT general

    // Entrenamiento de fuerza
    // Valores actualizados según Compendium of Physical Activities (MET 3.5-6.0)
    // Fórmula: MET × 3.5 × peso / 200 ≈ kcal/min
    // Para 80kg: 0.08 × 80 = 6.4 kcal/min (moderado)
    weight_training_light: 0.06,    // Pesas ligeras, descansos largos (MET ~3.0)
    weight_training_moderate: 0.08, // Pesas moderadas (MET ~5.0, típico de hipertrofia)
    weight_training_intense: 0.11,  // Pesas pesadas, poco descanso (MET ~6.0)
    crossfit: 0.15,                 // CrossFit / entrenamiento funcional

    // Otras actividades
    yoga: 0.04,
    pilates: 0.05,
    stretching: 0.03,
    housework: 0.04,
    gardening: 0.06,
    dancing: 0.08,
    martial_arts: 0.12,
    climbing: 0.14,
    sports_general: 0.10
};

// Distribución de macros según objetivo (gramos por kg de peso corporal)
const MACRO_DISTRIBUTIONS = {
    fatLoss: {
        protein: 2.2,    // Alta proteína para preservar músculo
        fats: 0.8,       // Grasas esenciales
        // Carbos calculados con calorías restantes
    },
    maintenance: {
        protein: 1.8,
        fats: 1.0,
    },
    muscleGain: {
        protein: 2.0,
        fats: 1.0,
    },
    performance: {
        protein: 1.6,
        fats: 0.8,
        // Más carbos para rendimiento
    }
};

// Distribución de calorías por comida (porcentaje del total diario)
const MEAL_DISTRIBUTIONS = {
    3: [0.30, 0.40, 0.30],                           // 3 comidas
    4: [0.25, 0.35, 0.15, 0.25],                     // 4 comidas (estándar)
    5: [0.20, 0.30, 0.10, 0.25, 0.15],               // 5 comidas
    6: [0.15, 0.25, 0.10, 0.25, 0.10, 0.15]          // 6 comidas
};

// ============================================================================
// FUNCIONES DE CÁLCULO
// ============================================================================

/**
 * Calcula la Tasa Metabólica Basal (TMB) usando Mifflin-St Jeor
 * Esta es la fórmula más precisa según la investigación actual.
 * 
 * @param {number} weightKg - Peso en kilogramos
 * @param {number} heightCm - Altura en centímetros
 * @param {number} age - Edad en años
 * @param {string} gender - 'male' u 'female'
 * @returns {number} TMB en kcal/día
 */

const safeLower = (val) => {
    if (!val) return "";
    if (Array.isArray(val)) return val.join(' ').toLowerCase();
    return String(val).toLowerCase();
};

export const calculateTMB = (weightKg, heightCm, age, gender) => {
    // Validación de inputs
    const weight = Math.max(30, Math.min(300, parseFloat(weightKg) || 70));
    const height = Math.max(100, Math.min(250, parseFloat(heightCm) || 170));
    const ageVal = Math.max(15, Math.min(100, parseInt(age) || 25));

    // Mifflin-St Jeor Equation
    // Hombres: TMB = (10 × peso en kg) + (6.25 × altura en cm) − (5 × edad en años) + 5
    // Mujeres: TMB = (10 × peso en kg) + (6.25 × altura en cm) − (5 × edad en años) − 161

    const isMale = safeLower(gender) === 'male' ||
        safeLower(gender) === 'masculino' ||
        safeLower(gender) === 'm';

    const tmb = (10 * weight) + (6.25 * height) - (5 * ageVal) + (isMale ? 5 : -161);

    return Math.round(tmb);
};

/**
 * Calcula el Gasto Energético Total Diario (TDEE)
 * TDEE = TMB × Factor de Actividad
 * 
 * @param {number} tmb - Tasa Metabólica Basal
 * @param {string} activityLevel - Nivel de actividad (sedentary, light, moderate, active, veryActive)
 * @returns {number} TDEE en kcal/día
 */
export const calculateTDEE = (tmb, activityLevel = 'moderate') => {
    const factor = ACTIVITY_FACTORS[activityLevel] || ACTIVITY_FACTORS.moderate;
    return Math.round(tmb * factor);
};

/**
 * Determina el nivel de actividad basado en la frecuencia de entrenamiento
 * 
 * @param {string} trainingFrequency - Frecuencia de entrenamiento del perfil
 * @returns {string} Nivel de actividad
 */
export const getActivityLevelFromFrequency = (trainingFrequency) => {
    const freq = safeLower(trainingFrequency);

    if (freq.includes('0') || freq.includes('nunca') || freq.includes('sedentario')) {
        return 'sedentary';
    }
    if (freq.includes('1-2') || freq.includes('1 a 2') || freq.includes('poco')) {
        return 'light';
    }
    if (freq.includes('3-4') || freq.includes('3 a 4') || freq.includes('moderado')) {
        return 'moderate';
    }
    if (freq.includes('5-6') || freq.includes('5 a 6') || freq.includes('diario')) {
        return 'active';
    }
    if (freq.includes('7') || freq.includes('2x') || freq.includes('atleta')) {
        return 'veryActive';
    }

    return 'moderate'; // Default
};

/**
 * Calcula las calorías objetivo según el objetivo del usuario
 * 
 * @param {number} tdee - Gasto Energético Total Diario
 * @param {string} goal - Objetivo (fatLoss, maintenance, muscleGain)
 * @returns {Object} { targetCalories, deficit/surplus, explanation }
 */
export const calculateTargetCalories = (tdee, goal) => {
    const goalLower = safeLower(goal);

    let adjustment = 0;
    let type = 'maintenance';
    let explanation = '';

    if (goalLower.includes('perder') || goalLower.includes('fat') ||
        goalLower.includes('loss') || goalLower.includes('grasa') ||
        goalLower.includes('cut') || goalLower.includes('definicion')) {
        // Déficit moderado: 400-500 kcal para pérdida sostenible
        adjustment = -Math.round(tdee * 0.18); // ~18% déficit
        adjustment = Math.max(adjustment, -600); // Máximo 600 kcal déficit
        type = 'deficit';
        explanation = `Déficit de ${Math.abs(adjustment)} kcal para pérdida de grasa sostenible (~0.5kg/semana)`;
    }
    else if (goalLower.includes('ganar') || goalLower.includes('muscle') ||
        goalLower.includes('gain') || goalLower.includes('masa') ||
        goalLower.includes('volumen') || goalLower.includes('bulk')) {
        // Superávit moderado: 200-300 kcal para ganancia limpia
        adjustment = Math.round(tdee * 0.12); // ~12% superávit
        adjustment = Math.min(adjustment, 400); // Máximo 400 kcal superávit
        type = 'surplus';
        explanation = `Superávit de ${adjustment} kcal para ganancia muscular limpia`;
    }
    else {
        type = 'maintenance';
        explanation = 'Mantenimiento: calorías iguales al gasto energético';
    }

    const targetCalories = Math.round(tdee + adjustment);

    // Límites de seguridad
    const minCalories = 1200;
    const maxCalories = 5000;

    return {
        targetCalories: Math.max(minCalories, Math.min(maxCalories, targetCalories)),
        adjustment,
        type,
        explanation,
        tdee
    };
};

/**
 * Calcula la distribución de macronutrientes
 * 
 * @param {number} targetCalories - Calorías objetivo diarias
 * @param {number} weightKg - Peso en kilogramos
 * @param {string} goal - Objetivo del usuario
 * @returns {Object} { protein, carbs, fats } en gramos
 */
export const calculateMacros = (targetCalories, weightKg, goal) => {
    const goalLower = safeLower(goal);

    let distribution = MACRO_DISTRIBUTIONS.maintenance;

    if (goalLower.includes('perder') || goalLower.includes('fat') ||
        goalLower.includes('loss') || goalLower.includes('grasa')) {
        distribution = MACRO_DISTRIBUTIONS.fatLoss;
    }
    else if (goalLower.includes('ganar') || goalLower.includes('muscle') ||
        goalLower.includes('masa') || goalLower.includes('volumen')) {
        distribution = MACRO_DISTRIBUTIONS.muscleGain;
    }
    else if (goalLower.includes('rendimiento') || goalLower.includes('performance')) {
        distribution = MACRO_DISTRIBUTIONS.performance;
    }

    // Calcular proteína y grasas basadas en peso corporal
    const protein = Math.round(weightKg * distribution.protein);
    const fats = Math.round(weightKg * distribution.fats);

    // Calcular calorías de proteína y grasas
    const proteinCalories = protein * 4;
    const fatCalories = fats * 9;

    // Carbohidratos con calorías restantes
    const remainingCalories = targetCalories - proteinCalories - fatCalories;
    const carbs = Math.max(50, Math.round(remainingCalories / 4)); // Mínimo 50g carbos

    return {
        protein,
        carbs,
        fats,
        // Verificación
        totalCalories: Math.round(proteinCalories + fatCalories + (carbs * 4))
    };
};

/**
 * Distribuye las calorías en las comidas del día
 * 
 * @param {number} targetCalories - Calorías objetivo diarias
 * @param {Object} macros - { protein, carbs, fats }
 * @param {number} mealsPerDay - Número de comidas
 * @returns {Array} Array de objetos con calorías y macros por comida
 */
export const distributeMeals = (targetCalories, macros, mealsPerDay = 4) => {
    const mealCount = Math.max(3, Math.min(6, parseInt(mealsPerDay) || 4));
    const distribution = MEAL_DISTRIBUTIONS[mealCount] || MEAL_DISTRIBUTIONS[4];

    const mealNames = {
        3: ['Desayuno', 'Almuerzo', 'Cena'],
        4: ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'],
        5: ['Desayuno', 'Almuerzo', 'Snack', 'Cena', 'Post-Cena'],
        6: ['Desayuno', 'Media Mañana', 'Almuerzo', 'Merienda', 'Cena', 'Pre-Sueño']
    };

    const mealTimes = {
        3: ['08:00', '13:00', '20:00'],
        4: ['08:00', '13:00', '17:00', '20:30'],
        5: ['07:30', '12:30', '16:00', '19:30', '22:00'],
        6: ['07:00', '10:00', '13:00', '16:30', '20:00', '22:30']
    };

    const names = mealNames[mealCount] || mealNames[4];
    const times = mealTimes[mealCount] || mealTimes[4];

    return distribution.map((percent, index) => ({
        name: names[index],
        time: times[index],
        calories: Math.round(targetCalories * percent),
        macros: {
            protein: Math.round(macros.protein * percent),
            carbs: Math.round(macros.carbs * percent),
            fats: Math.round(macros.fats * percent)
        }
    }));
};

/**
 * Calcula las calorías quemadas por una actividad
 * 
 * @param {string} activityType - Tipo de actividad
 * @param {number} durationMinutes - Duración en minutos
 * @param {number} weightKg - Peso del usuario
 * @returns {Object} { calories, activity, duration }
 */
export const calculateActivityCalories = (activityType, durationMinutes, weightKg) => {
    const calPerKgPerMin = ACTIVITY_CALORIES_PER_KG_PER_MINUTE[activityType] || 0.07;
    const duration = Math.max(1, Math.min(300, parseInt(durationMinutes) || 30));
    const weight = parseFloat(weightKg) || 70;

    const calories = Math.round(calPerKgPerMin * weight * duration);

    return {
        activity: activityType,
        durationMinutes: duration,
        caloriesBurned: calories
    };
};

/**
 * Calcula el resumen metabólico completo del usuario
 * Esta es la función principal que une todo.
 * 
 * @param {Object} profile - Perfil completo del usuario
 * @returns {Object} Resumen metabólico completo
 */
export const calculateFullMetabolicProfile = (profile) => {
    // Extraer datos del perfil
    const weight = parseFloat(profile?.weight) || 70;
    const height = parseFloat(profile?.height) || 170;
    const birthYear = parseInt(profile?.birthYear) || 1995;
    const age = new Date().getFullYear() - birthYear;
    const gender = profile?.gender || 'male';
    const goal = profile?.primaryGoal || 'maintenance';
    const trainingFrequency = profile?.trainingFrequency || '3-4';
    const mealsPerDay = parseInt(profile?.mealsPerDay) || 4;

    // Paso 1: Calcular TMB
    const tmb = calculateTMB(weight, height, age, gender);

    // Paso 2: Determinar nivel de actividad
    const activityLevel = getActivityLevelFromFrequency(trainingFrequency);

    // Paso 3: Calcular TDEE
    const tdee = calculateTDEE(tmb, activityLevel);

    // Paso 4: Calcular calorías objetivo
    const calorieData = calculateTargetCalories(tdee, goal);

    // Paso 5: Calcular macros
    const macros = calculateMacros(calorieData.targetCalories, weight, goal);

    // Paso 6: Distribuir en comidas
    const mealDistribution = distributeMeals(calorieData.targetCalories, macros, mealsPerDay);

    return {
        // Datos del usuario
        profile: {
            weight,
            height,
            age,
            gender,
            goal,
            activityLevel,
            mealsPerDay
        },
        // Cálculos metabólicos
        metabolism: {
            tmb,
            tdee,
            targetCalories: calorieData.targetCalories,
            adjustment: calorieData.adjustment,
            adjustmentType: calorieData.type,
            explanation: calorieData.explanation
        },
        // Macronutrientes diarios
        dailyMacros: macros,
        // Distribución por comida
        mealDistribution,
        // Metadata
        calculatedAt: new Date().toISOString()
    };
};

/**
 * Obtiene la lista de actividades disponibles para tracking
 * @returns {Array} Lista de actividades con nombres legibles
 */
export const getAvailableActivities = () => {
    return [
        { id: 'walking_slow', name: 'Caminata suave', category: 'cardio' },
        { id: 'walking_moderate', name: 'Caminata rápida', category: 'cardio' },
        { id: 'walking_fast', name: 'Power Walking', category: 'cardio' },
        { id: 'running_slow', name: 'Trote suave', category: 'cardio' },
        { id: 'running_moderate', name: 'Carrera moderada', category: 'cardio' },
        { id: 'running_fast', name: 'Carrera intensa', category: 'cardio' },
        { id: 'cycling_slow', name: 'Bicicleta recreativa', category: 'cardio' },
        { id: 'cycling_moderate', name: 'Bicicleta moderada', category: 'cardio' },
        { id: 'cycling_fast', name: 'Bicicleta intensa', category: 'cardio' },
        { id: 'swimming', name: 'Natación', category: 'cardio' },
        { id: 'elliptical', name: 'Elíptica', category: 'cardio' },
        { id: 'rowing', name: 'Remo', category: 'cardio' },
        { id: 'jump_rope', name: 'Saltar la cuerda', category: 'cardio' },
        { id: 'hiit', name: 'HIIT', category: 'cardio' },
        { id: 'weight_training_light', name: 'Pesas (ligero)', category: 'strength' },
        { id: 'weight_training_moderate', name: 'Pesas (moderado)', category: 'strength' },
        { id: 'weight_training_intense', name: 'Pesas (intenso)', category: 'strength' },
        { id: 'crossfit', name: 'CrossFit', category: 'strength' },
        { id: 'yoga', name: 'Yoga', category: 'flexibility' },
        { id: 'pilates', name: 'Pilates', category: 'flexibility' },
        { id: 'stretching', name: 'Estiramientos', category: 'flexibility' },
        { id: 'dancing', name: 'Baile', category: 'other' },
        { id: 'martial_arts', name: 'Artes marciales', category: 'other' },
        { id: 'climbing', name: 'Escalada', category: 'other' },
        { id: 'sports_general', name: 'Deportes (general)', category: 'other' }
    ];
};

export default {
    calculateTMB,
    calculateTDEE,
    calculateTargetCalories,
    calculateMacros,
    distributeMeals,
    calculateActivityCalories,
    calculateFullMetabolicProfile,
    getActivityLevelFromFrequency,
    getAvailableActivities,
    ACTIVITY_FACTORS,
    ACTIVITY_CALORIES_PER_KG_PER_MINUTE
};
