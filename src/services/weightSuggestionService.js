/**
 * Weight Suggestion Service
 * Provides intelligent weight recommendations based on user profile, benchmarks, and exercise history
 */

import { db } from '../config/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

// Multiplicadores base por grupo muscular (% del peso corporal para principiantes)
const BODY_WEIGHT_MULTIPLIERS = {
    'chest': 0.4,        // Pecho
    'back': 0.35,        // Espalda
    'shoulders': 0.2,    // Hombros
    'legs_quad': 0.6,    // Cuádriceps
    'legs_ham': 0.5,     // Isquiotibiales
    'biceps': 0.15,      // Bíceps
    'triceps': 0.18,     // Tríceps
    'glutes': 0.5,       // Glúteos
    'calves': 0.4,       // Gemelos
    'abs': 0,            // Abdominales (peso corporal)
    'forearms': 0.1      // Antebrazos
};

// Multiplicadores por nivel de técnica
const TECHNIQUE_MULTIPLIERS = {
    'principiante': 0.7,
    'intermedio': 0.9,
    'avanzado': 1.1,
    'basica': 0.7,
    'buena': 0.9,
    'avanzada': 1.1
};

// Multiplicadores por años de experiencia
const EXPERIENCE_MULTIPLIERS = {
    'Principiante': 0.65,
    '1-2 años': 0.85,
    '3-5 años': 1.0,
    '+5 años': 1.15
};

// Multiplicadores por género
const GENDER_MULTIPLIERS = {
    'Hombre': 1.0,
    'Mujer': 0.65,
    'Otro': 0.85
};

// Multiplicadores por tipo de ejercicio
const EXERCISE_TYPE_MULTIPLIERS = {
    'compound': 1.0,    // Ejercicios compuestos
    'isolation': 0.5    // Ejercicios de aislamiento
};

// Multiplicadores por equipo
const EQUIPMENT_MULTIPLIERS = {
    'barbell': 1.0,
    'dumbbell': 0.45,       // Cada mancuerna es ~45% del peso de barra
    'smith_machine': 0.85,
    'cable': 0.5,
    'machine': 0.7,
    'bodyweight': 0,
    'kettlebell': 0.35
};

// Mapeo de ejercicios a benchmarks del onboarding
const EXERCISE_TO_BENCHMARK = {
    // Pecho
    'press banca': { benchmark: 'benchmarkBenchPress', ratio: 1.0 },
    'press plano': { benchmark: 'benchmarkBenchPress', ratio: 1.0 },
    'press inclinado': { benchmark: 'benchmarkBenchPress', ratio: 0.8 },
    'press declinado': { benchmark: 'benchmarkBenchPress', ratio: 0.9 },
    'aperturas': { benchmark: 'benchmarkBenchPress', ratio: 0.3 },
    'cruces': { benchmark: 'benchmarkBenchPress', ratio: 0.25 },
    'fondos': { benchmark: 'benchmarkBenchPress', ratio: 0 },

    // Hombros
    'press militar': { benchmark: 'benchmarkShoulderPress', ratio: 1.0 },
    'press arnold': { benchmark: 'benchmarkShoulderPress', ratio: 0.9 },
    'elevaciones laterales': { benchmark: 'benchmarkShoulderPress', ratio: 0.35 },
    'elevaciones frontales': { benchmark: 'benchmarkShoulderPress', ratio: 0.35 },
    'pájaros': { benchmark: 'benchmarkShoulderPress', ratio: 0.3 },
    'face pull': { benchmark: 'benchmarkShoulderPress', ratio: 0.4 },

    // Espalda
    'peso muerto': { benchmark: 'benchmarkDeadlift', ratio: 1.0 },
    'remo con barra': { benchmark: 'benchmarkDeadlift', ratio: 0.5 },
    'remo': { benchmark: 'benchmarkDeadlift', ratio: 0.45 },
    'jalón': { benchmark: 'benchmarkDeadlift', ratio: 0.4 },
    'pulldown': { benchmark: 'benchmarkDeadlift', ratio: 0.4 },
    'dominadas': { benchmark: 'benchmarkPullups', ratio: 0 },
    'pullover': { benchmark: 'benchmarkBenchPress', ratio: 0.35 },

    // Piernas
    'sentadilla': { benchmark: 'benchmarkSquat', ratio: 1.0 },
    'squat': { benchmark: 'benchmarkSquat', ratio: 1.0 },
    'prensa': { benchmark: 'benchmarkSquat', ratio: 1.5 },
    'hack squat': { benchmark: 'benchmarkSquat', ratio: 0.9 },
    'extensión': { benchmark: 'benchmarkSquat', ratio: 0.35 },
    'curl femoral': { benchmark: 'benchmarkDeadlift', ratio: 0.35 },
    'peso muerto rumano': { benchmark: 'benchmarkDeadlift', ratio: 0.7 },
    'hip thrust': { benchmark: 'benchmarkSquat', ratio: 0.8 },
    'zancadas': { benchmark: 'benchmarkSquat', ratio: 0.4 },
    'búlgara': { benchmark: 'benchmarkSquat', ratio: 0.35 },
    'goblet': { benchmark: 'benchmarkSquat', ratio: 0.3 },

    // Bíceps
    'curl': { benchmark: 'benchmarkBenchPress', ratio: 0.25 },
    'curl martillo': { benchmark: 'benchmarkBenchPress', ratio: 0.25 },
    'curl predicador': { benchmark: 'benchmarkBenchPress', ratio: 0.22 },
    'curl concentrado': { benchmark: 'benchmarkBenchPress', ratio: 0.18 },

    // Tríceps
    'press francés': { benchmark: 'benchmarkBenchPress', ratio: 0.3 },
    'extensión tríceps': { benchmark: 'benchmarkBenchPress', ratio: 0.25 },
    'patada tríceps': { benchmark: 'benchmarkBenchPress', ratio: 0.15 },
    'fondos banco': { benchmark: 'benchmarkBenchPress', ratio: 0 },
    'pushdown': { benchmark: 'benchmarkBenchPress', ratio: 0.35 }
};

// Ejercicios que usan mancuernas individuales (peso es por mancuerna)
const PER_DUMBBELL_EXERCISES = [
    'press militar', 'press arnold', 'elevaciones laterales', 'elevaciones frontales',
    'curl', 'curl martillo', 'curl concentrado', 'curl predicador',
    'patada tríceps', 'press inclinado', 'press plano', 'aperturas',
    'remo', 'pullover', 'pájaros', 'extensión tríceps', 'frontales', 'laterales',
    'zancadas', 'búlgara', 'goblet'
];

// Ejercicios que son típicamente de peso corporal
const BODYWEIGHT_EXERCISES = [
    'fondos', 'dominadas', 'flexiones', 'plancha', 'push-ups', 'pull-ups', 'dips',
    'giros rusos', 'elevación de piernas', 'sentadilla búlgara', 'chin-ups', 'burpees'
];

/**
 * Obtener el PR más reciente del usuario para un ejercicio específico
 */
const getExercisePR = async (userId, exerciseName) => {
    if (!userId || !exerciseName) return null;

    try {
        const normalizedName = exerciseName.toLowerCase().trim();
        const prsRef = collection(db, 'personalRecords');
        const q = query(
            prsRef,
            where('userId', '==', userId),
            orderBy('date', 'desc'),
            limit(50)
        );

        const snapshot = await getDocs(q);

        for (const doc of snapshot.docs) {
            const pr = doc.data();
            if (pr.exerciseName?.toLowerCase().includes(normalizedName) ||
                normalizedName.includes(pr.exerciseName?.toLowerCase())) {
                return pr.weight;
            }
        }

        return null;
    } catch (error) {
        console.error('[WeightSuggestion] Error getting PR:', error);
        return null;
    }
};

/**
 * Encontrar el benchmark más relevante para un ejercicio
 */
const findRelevantBenchmark = (exerciseName, userProfile) => {
    if (!exerciseName || !userProfile) return null;

    const normalizedName = exerciseName.toLowerCase();

    // Buscar coincidencia directa
    for (const [keyword, config] of Object.entries(EXERCISE_TO_BENCHMARK)) {
        if (normalizedName.includes(keyword)) {
            const benchmarkValue = parseFloat(userProfile[config.benchmark]);
            if (benchmarkValue && !isNaN(benchmarkValue)) {
                return {
                    value: benchmarkValue,
                    ratio: config.ratio,
                    benchmarkName: config.benchmark.replace('benchmark', '')
                };
            }
        }
    }

    return null;
};

/**
 * Determinar si un ejercicio usa peso por mancuerna
 */
const isPerDumbbellExercise = (exerciseName, equipment) => {
    const normalizedName = exerciseName.toLowerCase();
    const normalizedEquipment = equipment?.toLowerCase() || '';

    const hasDumbbellKeywords = normalizedEquipment.includes('dumbbell') ||
        normalizedEquipment.includes('mancuerna') ||
        normalizedName.includes('mancuerna') ||
        normalizedName.includes('db');

    return hasDumbbellKeywords && PER_DUMBBELL_EXERCISES.some(ex => normalizedName.includes(ex));
};

/**
 * Determinar si un ejercicio es de peso corporal
 */
const isBodyweightExercise = (exerciseName, equipment) => {
    const normalizedName = exerciseName.toLowerCase();
    const normalizedEquipment = equipment?.toLowerCase() || '';

    return normalizedEquipment.includes('peso corporal') ||
        normalizedEquipment.includes('bodyweight') ||
        BODYWEIGHT_EXERCISES.some(ex => normalizedName.includes(ex));
};

/**
 * Normalizar grupo muscular
 */
const normalizeMuscleGroup = (muscleGroup) => {
    if (!muscleGroup) return 'chest';

    const mg = muscleGroup.toLowerCase();

    if (mg.includes('pecho') || mg.includes('pectoral')) return 'chest';
    if (mg.includes('espalda') || mg.includes('dorsal')) return 'back';
    if (mg.includes('hombro') || mg.includes('deltoid')) return 'shoulders';
    if (mg.includes('cuad') || mg.includes('quad')) return 'legs_quad';
    if (mg.includes('isquio') || mg.includes('ham') || mg.includes('femoral')) return 'legs_ham';
    if (mg.includes('bicep')) return 'biceps';
    if (mg.includes('tricep')) return 'triceps';
    if (mg.includes('glute') || mg.includes('glúteo')) return 'glutes';
    if (mg.includes('abdom') || mg.includes('core')) return 'abs';
    if (mg.includes('gemel') || mg.includes('calf')) return 'calves';

    return muscleGroup;
};

/**
 * Calcular peso sugerido inteligente
 * @param {Object} exercise - Datos del ejercicio
 * @param {Object} userProfile - Perfil del usuario con benchmarks
 * @param {string} userId - ID del usuario para buscar PRs
 * @returns {Object} - { weight, source, perDumbbell }
 */
export const calculateSmartWeight = async (exercise, userProfile, userId = null) => {
    const exerciseName = exercise?.name || '';
    const equipment = exercise?.equipment || exercise?.machineName || '';
    const muscleGroup = normalizeMuscleGroup(exercise?.muscleGroup);
    const exerciseType = exercise?.type || 'compound';

    // Defaults del usuario
    const userWeight = parseFloat(userProfile?.weight) || 75;
    const gender = userProfile?.gender || 'Hombre';
    const experience = userProfile?.experienceYears || 'Principiante';
    const technique = userProfile?.techniqueLevel || 'principiante';

    const perDumbbell = isPerDumbbellExercise(exerciseName, equipment);
    const isBodyweight = isBodyweightExercise(exerciseName, equipment);

    if (isBodyweight) {
        return {
            weight: 0,
            source: 'peso corporal',
            perDumbbell: false,
            isBodyweight: true
        };
    }

    // 1. Intentar usar PR histórico del usuario (más preciso)
    if (userId) {
        const historicalPR = await getExercisePR(userId, exerciseName);
        if (historicalPR && historicalPR > 0) {
            // Usar 85% del PR como peso de trabajo sugerido
            const suggestedWeight = Math.round(historicalPR * 0.85 / 2.5) * 2.5;
            return {
                weight: Math.max(5, suggestedWeight),
                source: 'tu récord anterior',
                perDumbbell
            };
        }
    }

    // 2. Intentar usar benchmark del onboarding
    const benchmark = findRelevantBenchmark(exerciseName, userProfile);
    if (benchmark && benchmark.ratio > 0) {
        let calculatedWeight = benchmark.value * benchmark.ratio;

        // Ajustar por equipo
        if (equipment.toLowerCase().includes('mancuerna') ||
            equipment.toLowerCase().includes('dumbbell')) {
            calculatedWeight *= EQUIPMENT_MULTIPLIERS['dumbbell'];
        } else if (equipment.toLowerCase().includes('cable') ||
            equipment.toLowerCase().includes('polea')) {
            calculatedWeight *= EQUIPMENT_MULTIPLIERS['cable'];
        } else if (equipment.toLowerCase().includes('máquina') ||
            equipment.toLowerCase().includes('machine')) {
            calculatedWeight *= EQUIPMENT_MULTIPLIERS['machine'];
        }

        const roundedWeight = Math.round(calculatedWeight / 2.5) * 2.5;
        const benchmarkLabel = benchmark.benchmarkName
            .replace('BenchPress', 'press banca')
            .replace('ShoulderPress', 'press militar')
            .replace('Squat', 'sentadilla')
            .replace('Deadlift', 'peso muerto');

        return {
            weight: Math.max(5, roundedWeight),
            source: `tu ${benchmarkLabel}`,
            perDumbbell
        };
    }

    // 3. Estimación basada en peso corporal y factores del usuario
    const baseMultiplier = BODY_WEIGHT_MULTIPLIERS[muscleGroup] || 0.3;
    const genderMultiplier = GENDER_MULTIPLIERS[gender] || 1.0;
    const experienceMultiplier = EXPERIENCE_MULTIPLIERS[experience] || 0.85;
    const techniqueMultiplier = TECHNIQUE_MULTIPLIERS[technique] || 0.85;
    const typeMultiplier = EXERCISE_TYPE_MULTIPLIERS[exerciseType] || 1.0;

    // Ajuste por equipo
    let equipmentMultiplier = 1.0;
    if (equipment.toLowerCase().includes('mancuerna') ||
        equipment.toLowerCase().includes('dumbbell')) {
        equipmentMultiplier = EQUIPMENT_MULTIPLIERS['dumbbell'];
    } else if (equipment.toLowerCase().includes('cable') ||
        equipment.toLowerCase().includes('polea')) {
        equipmentMultiplier = EQUIPMENT_MULTIPLIERS['cable'];
    }

    const estimatedWeight = userWeight *
        baseMultiplier *
        genderMultiplier *
        experienceMultiplier *
        techniqueMultiplier *
        typeMultiplier *
        equipmentMultiplier;

    const roundedWeight = Math.round(estimatedWeight / 2.5) * 2.5;

    return {
        weight: Math.max(5, roundedWeight),
        source: 'tu perfil',
        perDumbbell
    };
};

/**
 * Versión síncrona para uso en generación de rutinas (sin PRs históricos)
 */
export const calculateSmartWeightSync = (exercise, userProfile) => {
    const exerciseName = exercise?.name || '';
    const equipment = exercise?.equipment || exercise?.machineName || '';
    const muscleGroup = normalizeMuscleGroup(exercise?.muscleGroup);
    const exerciseType = exercise?.type || 'compound';

    const userWeight = parseFloat(userProfile?.weight) || 75;
    const gender = userProfile?.gender || 'Hombre';
    const experience = userProfile?.experienceYears || 'Principiante';
    const technique = userProfile?.techniqueLevel || 'principiante';

    const perDumbbell = isPerDumbbellExercise(exerciseName, equipment);
    const isBodyweight = isBodyweightExercise(exerciseName, equipment);

    if (isBodyweight) {
        return { weight: 0, label: 'Peso Corporal', perDumbbell: false, isBodyweight: true };
    }

    // Usar benchmark del onboarding
    const benchmark = findRelevantBenchmark(exerciseName, userProfile);
    if (benchmark && benchmark.ratio > 0) {
        let calculatedWeight = benchmark.value * benchmark.ratio;

        if (equipment.toLowerCase().includes('mancuerna') ||
            equipment.toLowerCase().includes('dumbbell')) {
            calculatedWeight *= EQUIPMENT_MULTIPLIERS['dumbbell'];
        } else if (equipment.toLowerCase().includes('cable')) {
            calculatedWeight *= EQUIPMENT_MULTIPLIERS['cable'];
        } else if (equipment.toLowerCase().includes('máquina')) {
            calculatedWeight *= EQUIPMENT_MULTIPLIERS['machine'];
        }

        const roundedWeight = Math.round(calculatedWeight / 2.5) * 2.5;
        const label = perDumbbell ? `${roundedWeight}kg c/u` : `${roundedWeight}kg`;

        return { weight: Math.max(5, roundedWeight), label, perDumbbell };
    }

    // Estimación por peso corporal
    const baseMultiplier = BODY_WEIGHT_MULTIPLIERS[muscleGroup] || 0.3;
    const genderMultiplier = GENDER_MULTIPLIERS[gender] || 1.0;
    const experienceMultiplier = EXPERIENCE_MULTIPLIERS[experience] || 0.85;
    const techniqueMultiplier = TECHNIQUE_MULTIPLIERS[technique] || 0.85;
    const typeMultiplier = EXERCISE_TYPE_MULTIPLIERS[exerciseType] || 1.0;

    let equipmentMultiplier = 1.0;
    if (equipment.toLowerCase().includes('mancuerna')) {
        equipmentMultiplier = EQUIPMENT_MULTIPLIERS['dumbbell'];
    } else if (equipment.toLowerCase().includes('cable')) {
        equipmentMultiplier = EQUIPMENT_MULTIPLIERS['cable'];
    }

    const estimatedWeight = userWeight *
        baseMultiplier *
        genderMultiplier *
        experienceMultiplier *
        techniqueMultiplier *
        typeMultiplier *
        equipmentMultiplier;

    const roundedWeight = Math.round(estimatedWeight / 2.5) * 2.5;
    const finalWeight = Math.max(5, roundedWeight);
    const label = perDumbbell ? `${finalWeight}kg c/u` : `${finalWeight}kg`;

    return { weight: finalWeight, label, perDumbbell };
};

export default calculateSmartWeight;
