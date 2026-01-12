/**
 * FITAI Professional Routine Generator
 * Motor de generación de rutinas basado en base de datos curada
 * 100% preciso anatómicamente - sin dependencia de IA
 * PERSONALIZADO según objetivos, nivel, equipo, lesiones y BENCHMARKS del usuario
 */

import {
    MUSCLE_GROUPS,
    EXERCISES,
    EQUIPMENT,
    getCompoundExercises,
    getIsolationExercises,
    getRandomExercises,
    getAbsCircuit
} from './exerciseDatabase';

/**
 * Utilidad global para limpiar textos de errores de codificación
 */
const cleanString = (str) => {
    if (!str) return "";
    return String(str)
        .replace(/Ã­/g, 'i')
        .replace(/Ã¡/g, 'a')
        .replace(/Ã©/g, 'e')
        .replace(/Ã³/g, 'o')
        .replace(/Ãº/g, 'u')
        .replace(/Ã±/g, 'n')
        .replace(/A-da/g, 'ida')
        .replace(/fA-sicos/g, 'fisicos')
        .replace(/Anico/g, 'unico')
        .replace(/mAsculo/g, 'musculo')
        .replace(/tAccnicas/g, 'tecnicas')
        .replace(/ejecuciA3n/g, 'ejecucion')
        .replace(/RetracciA3n/g, 'Retraccion')
        .replace(/mAquina/g, 'maquina')
        .replace(/ExtensiA3n/g, 'Extension')
        .replace(/trA-ceps/g, 'triceps')
        .replace(/FrancAcs/g, 'Frances')
        .replace(/í/g, 'i')
        .replace(/á/g, 'a')
        .replace(/é/g, 'e')
        .replace(/ó/g, 'o')
        .replace(/ú/g, 'u')
        .replace(/°/g, ' grados')
        .replace(/×/g, 'x')
        .replace(/Ã—/g, 'x')
        .trim();
};

/**
 * Configuraciones por OBJETIVO del usuario
 */
const GOAL_CONFIG = {
    muscle: {
        name: 'Hipertrofia',
        repsModifier: 0,
        setsModifier: 0,
        restTime: '90s',
        intensityFocus: 'dropset',
        description: 'Máximo desarrollo muscular con alto volumen'
    },
    strength: {
        name: 'Fuerza',
        repsModifier: -2,
        setsModifier: 1,
        restTime: '2-3 min',
        intensityFocus: 'pyramid',
        description: 'Desarrollo de fuerza con cargas pesadas'
    },
    definition: {
        name: 'Definición',
        repsModifier: +4,
        setsModifier: 0,
        restTime: '45-60s',
        intensityFocus: 'superset',
        description: 'Alto gasto calórico manteniendo músculo'
    },
    endurance: {
        name: 'Resistencia',
        repsModifier: +6,
        setsModifier: -1,
        restTime: '30-45s',
        intensityFocus: 'superset',
        description: 'Resistencia muscular y cardiovascular'
    }
};

/**
 * Configuraciones por NIVEL de experiencia
 */
const LEVEL_CONFIG = {
    beginner: {
        name: 'Principiante',
        exercisesPerMuscle: 2,
        preferCompound: true,
        avoidTechniques: ['dropset', 'superset'],
        notes: 'Enfócate en la técnica antes de aumentar peso.'
    },
    intermediate: {
        name: 'Intermedio',
        exercisesPerMuscle: 3,
        preferCompound: true,
        avoidTechniques: [],
        notes: 'Aplica sobrecarga progresiva cada semana.'
    },
    advanced: {
        name: 'Avanzado',
        exercisesPerMuscle: 4,
        preferCompound: false,
        avoidTechniques: [],
        notes: 'Varía las técnicas de intensidad según sensaciones.'
    }
};

/**
 * Mapeo de equipo del usuario a tipos de equipo
 */
const EQUIPMENT_MAP = {
    'gym': [EQUIPMENT.SMITH, EQUIPMENT.BARBELL, EQUIPMENT.DUMBBELL, EQUIPMENT.CABLE, EQUIPMENT.MACHINE, EQUIPMENT.BODYWEIGHT],
    'home': [EQUIPMENT.DUMBBELL, EQUIPMENT.BODYWEIGHT, EQUIPMENT.BARBELL],
    'minimal': [EQUIPMENT.DUMBBELL, EQUIPMENT.BODYWEIGHT],
    'bodyweight': [EQUIPMENT.BODYWEIGHT]
};

/**
 * Palabras clave de lesiones y músculos a evitar
 */
const INJURY_KEYWORDS = {
    'shoulder': [MUSCLE_GROUPS.SHOULDERS],
    'hombro': [MUSCLE_GROUPS.SHOULDERS],
    'back': [MUSCLE_GROUPS.BACK],
    'espalda': [MUSCLE_GROUPS.BACK],
    'knee': [MUSCLE_GROUPS.LEGS_QUAD, MUSCLE_GROUPS.LEGS_HAM],
    'rodilla': [MUSCLE_GROUPS.LEGS_QUAD, MUSCLE_GROUPS.LEGS_HAM],
    'elbow': [MUSCLE_GROUPS.BICEPS, MUSCLE_GROUPS.TRICEPS],
    'codo': [MUSCLE_GROUPS.BICEPS, MUSCLE_GROUPS.TRICEPS],
    'wrist': [MUSCLE_GROUPS.BICEPS, MUSCLE_GROUPS.TRICEPS],
    'muñeca': [MUSCLE_GROUPS.BICEPS, MUSCLE_GROUPS.TRICEPS]
};

/**
 * Mapeo de equipo desde el Onboarding a constantes internas
 */
const UI_EQUIPMENT_MAP = {
    'Barra': EQUIPMENT.BARBELL,
    'Mancuernas': EQUIPMENT.DUMBBELL,
    'Poleas': EQUIPMENT.CABLE,
    'Máquinas': EQUIPMENT.MACHINE,
    'Rack / Smith': EQUIPMENT.SMITH,
    'Peso Corporal': EQUIPMENT.BODYWEIGHT
};

/**
 * Calcular peso sugerido basado en benchmarks del usuario
 */
const calculateSuggestedWeight = (exercise, benchmarks, goalConfig) => {
    if (!benchmarks) return null;

    // Mapeo de grupos musculares a benchmarks
    const benchmarkMap = {
        [MUSCLE_GROUPS.CHEST]: parseFloat(benchmarks.benchmarkBenchPress) || null,
        [MUSCLE_GROUPS.SHOULDERS]: parseFloat(benchmarks.benchmarkShoulderPress) || null,
        [MUSCLE_GROUPS.BACK]: parseFloat(benchmarks.benchmarkDeadlift) || null,
        [MUSCLE_GROUPS.LEGS_QUAD]: parseFloat(benchmarks.benchmarkSquat) || null,
        [MUSCLE_GROUPS.LEGS_HAM]: parseFloat(benchmarks.benchmarkDeadlift) || null,
        [MUSCLE_GROUPS.BICEPS]: benchmarks.benchmarkBenchPress ? Math.round(parseFloat(benchmarks.benchmarkBenchPress) * 0.25) : null,
        [MUSCLE_GROUPS.TRICEPS]: benchmarks.benchmarkBenchPress ? Math.round(parseFloat(benchmarks.benchmarkBenchPress) * 0.35) : null
    };

    const baseBenchmark = benchmarkMap[exercise.muscleGroup];
    if (!baseBenchmark || isNaN(baseBenchmark)) return null;

    // Calcular porcentaje según tipo de ejercicio y objetivo
    let percentage = 0.6; // Base para aislamiento

    if (exercise.type === 'compound') {
        percentage = goalConfig.name === 'Fuerza' ? 0.8 : 0.7;
    } else {
        percentage = goalConfig.name === 'Fuerza' ? 0.5 : 0.4;
    }

    // Ajuste por equipo
    if (exercise.equipment === EQUIPMENT.DUMBBELL) {
        percentage *= 0.6; // Cada mancuerna es ~30% del peso de barra
    } else if (exercise.equipment === EQUIPMENT.CABLE) {
        percentage *= 0.5;
    } else if (exercise.equipment === EQUIPMENT.MACHINE) {
        percentage *= 0.7;
    }

    const suggestedWeight = Math.round(baseBenchmark * percentage / 2.5) * 2.5; // Redondear a 2.5kg

    if (suggestedWeight < 5) return null;

    return `${suggestedWeight}kg`;
};

/**
 * Definición de splits por frecuencia
 */
const SPLITS = {
    3: {
        name: 'PPL (Push/Pull/Legs)',
        days: [
            { name: 'Día 1: Empuje (Pecho, Hombros, Tríceps)', focus: 'Pectoral y deltoides anterior', muscles: [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.TRICEPS] },
            { name: 'Día 2: Tracción (Espalda, Bíceps)', focus: 'Dorsales y espalda alta', muscles: [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.BICEPS] },
            { name: 'Día 3: Piernas Completo', focus: 'Cuádriceps, isquiotibiales y glúteos', muscles: [MUSCLE_GROUPS.LEGS_QUAD, MUSCLE_GROUPS.LEGS_HAM] }
        ]
    },
    4: {
        name: 'Torso/Pierna x2',
        days: [
            { name: 'Día 1: Torso (Empuje)', focus: 'Pecho, hombros y tríceps', muscles: [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.TRICEPS] },
            { name: 'Día 2: Piernas (Cuádriceps)', focus: 'Dominante de rodilla', muscles: [MUSCLE_GROUPS.LEGS_QUAD] },
            { name: 'Día 3: Torso (Tracción)', focus: 'Espalda y bíceps', muscles: [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.BICEPS] },
            { name: 'Día 4: Piernas (Isquios/Glúteo)', focus: 'Dominante de cadera', muscles: [MUSCLE_GROUPS.LEGS_HAM] }
        ]
    },
    5: {
        name: 'Split de Especialización',
        days: [
            { name: 'Día 1: Pecho y Tríceps', focus: 'Pectoral mayor y cabeza larga del tríceps', muscles: [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.TRICEPS] },
            { name: 'Día 2: Espalda y Bíceps', focus: 'Dorsales, romboides y bíceps braquial', muscles: [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.BICEPS] },
            { name: 'Día 3: Hombros', focus: 'Deltoides anterior, lateral y posterior', muscles: [MUSCLE_GROUPS.SHOULDERS] },
            { name: 'Día 4: Piernas', focus: 'Cuádriceps, isquiotibiales, glúteos y gemelos', muscles: [MUSCLE_GROUPS.LEGS_QUAD, MUSCLE_GROUPS.LEGS_HAM] },
            { name: 'Día 5: Pecho, Hombros y Brazos', focus: 'Retoque estético y superseries', muscles: [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.BICEPS, MUSCLE_GROUPS.TRICEPS] }
        ]
    },
    6: {
        name: 'PPL x2',
        days: [
            { name: 'Día 1: Empuje', focus: 'Pecho, hombros, tríceps', muscles: [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.TRICEPS] },
            { name: 'Día 2: Tracción', focus: 'Espalda y bíceps', muscles: [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.BICEPS] },
            { name: 'Día 3: Piernas', focus: 'Cuádriceps y isquios', muscles: [MUSCLE_GROUPS.LEGS_QUAD, MUSCLE_GROUPS.LEGS_HAM] },
            { name: 'Día 4: Empuje (Volumen)', focus: 'Pecho y deltoides', muscles: [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.TRICEPS] },
            { name: 'Día 5: Tracción (Volumen)', focus: 'Espalda ancha', muscles: [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.BICEPS] },
            { name: 'Día 6: Piernas (Intensidad)', focus: 'Fuerza y detalle', muscles: [MUSCLE_GROUPS.LEGS_QUAD, MUSCLE_GROUPS.LEGS_HAM] }
        ]
    }
};

/**
 * Detectar nivel del usuario
 */
const detectLevel = (experienceYears) => {
    if (!experienceYears) return 'intermediate';
    const exp = String(experienceYears).toLowerCase();

    // Mejor detección de nivel "Principiante"
    if (exp.includes('principiante') || exp.includes('menos') || exp.includes('0') || exp.includes('1')) {
        return 'beginner';
    }

    if (exp.includes('3-5') || exp.includes('intermedio')) return 'intermediate';
    if (exp.includes('5+') || exp.includes('avanzado') || exp.includes('experto')) return 'advanced';
    return 'intermediate';
};

/**
 * Detectar músculos afectados por lesiones
 */
const detectInjuredMuscles = (injuriesText) => {
    if (!injuriesText || injuriesText === 'Ninguna') return [];
    const injured = [];
    const text = injuriesText.toLowerCase();
    Object.entries(INJURY_KEYWORDS).forEach(([keyword, muscles]) => {
        if (text.includes(keyword)) {
            injured.push(...muscles);
        }
    });
    return [...new Set(injured)];
};

/**
 * Seleccionar ejercicios personalizados
 */
const selectExercisesForMuscle = (muscleGroup, count, usedIds, config) => {
    const { allowedEquipment, injuredMuscles, levelConfig } = config;

    let available = EXERCISES.filter(ex =>
        ex.muscleGroup === muscleGroup &&
        !usedIds.includes(ex.id) &&
        allowedEquipment.includes(ex.equipment) &&
        !injuredMuscles.includes(muscleGroup)
    );

    // Prioridad ELITE: Si hay ejercicios del COACH, darles preferencia
    const coachExercises = available.filter(ex => ex.coachSource === true);
    if (coachExercises.length > 0) {
        // Mezclamos los del coach para que no siempre sea el mismo
        available = [...coachExercises, ...available];
    }

    if (available.length === 0) {
        available = EXERCISES.filter(ex =>
            ex.muscleGroup === muscleGroup &&
            !usedIds.includes(ex.id)
        );
    }

    const compounds = available.filter(ex => ex.type === 'compound');
    const isolations = available.filter(ex => ex.type === 'isolation');

    const selected = [];

    if (levelConfig.preferCompound && compounds.length > 0) {
        const randomCompound = compounds[Math.floor(Math.random() * compounds.length)];
        selected.push({
            ...randomCompound,
            notes: '2x15 calentamiento previo. ' + randomCompound.notes
        });
    }

    const remaining = [...compounds, ...isolations]
        .filter(ex => !selected.find(s => s.id === ex.id))
        .sort(() => Math.random() - 0.5);

    const needed = Math.min(count - selected.length, remaining.length);
    selected.push(...remaining.slice(0, needed));

    return selected;
};

/**
 * Generar circuito de ABS
 */
const generateAbsCircuit = () => {
    const absExercises = getAbsCircuit();
    return absExercises.map(ex => ({
        ...ex,
        notes: '3 vueltas sin descanso. 1 min entre vueltas.'
    }));
};

/**
 * Generar un día de entrenamiento
 */
const generateDay = (dayTemplate, usedExerciseIds, config) => {
    const { name, focus, muscles } = dayTemplate;
    const { levelConfig, goalConfig, benchmarks } = config;
    const exercises = [];

    const basePerMuscle = levelConfig.exercisesPerMuscle;
    let exercisesPerMuscle = muscles.length === 1 ? basePerMuscle + 2 :
        muscles.length === 2 ? basePerMuscle :
            Math.max(2, basePerMuscle - 1);

    // AJUSTE POR DURACIÓN (NUEVO)
    const duration = config.sessionDuration || '60 min';
    if (duration.includes('30') || duration.includes('45')) {
        exercisesPerMuscle = Math.max(1, exercisesPerMuscle - 1);
    } else if (duration.includes('90')) {
        exercisesPerMuscle += 1;
    }

    muscles.forEach(muscle => {
        // AJUSTE POR FOCO MUSCULAR O DEBILIDAD (NUEVO)
        let count = exercisesPerMuscle;
        const isFocus = config.trainingFocus === muscle;
        const isWeakness = config.weaknesses?.includes(muscle);

        if (isFocus) count += 1;
        if (isWeakness && !isFocus) count += 1; // Solo +1 si no es ya el foco principal

        const muscleExercises = selectExercisesForMuscle(muscle, count, usedExerciseIds, config);
        exercises.push(...muscleExercises);
        muscleExercises.forEach(ex => usedExerciseIds.push(ex.id));
    });

    const absCircuit = generateAbsCircuit();

    return {
        day: cleanString(name),
        focus: cleanString(focus),
        warmup: '5 min cardio ligero + movilidad articular',
        exercises: exercises.map(ex => {
            const suggestedWeight = calculateSuggestedWeight(ex, benchmarks, goalConfig);

            // NOTAS DE INTENSIDAD (NUEVO)
            let customNotes = ex.notes || '';
            if (config.intensityPreference === 'high') {
                customNotes += ' 🔥 ALTA INTENSIDAD: Lleva la serie al fallo técnico. RPE 10.';
            } else {
                customNotes += ' ⚖️ RPE 8-9: Deja 1-2 reps en reserva.';
            }

            if (config.trainingFocus === ex.muscleGroup) {
                customNotes += ' ✨ FOCO DEL MES: Conexión mente-músculo máxima.';
            }

            return {
                name: cleanString(ex.name),
                sets: parseInt(ex.defaultSets) + (goalConfig.setsModifier || 0),
                reps: String(ex.defaultReps).replace('×', 'x').replace('Ã—', 'x'),
                rest: goalConfig.restTime,
                suggestedWeight: suggestedWeight || null,
                muscleGroup: cleanString((ex.muscleGroup || '').replace('chest', 'Pectoral').replace('back', 'Dorsal').replace('shoulders', 'Hombros').replace('legs_quad', 'Cuadriceps').replace('legs_ham', 'Isquiotibiales').replace('biceps', 'Biceps').replace('triceps', 'Triceps').replace('_', ' ')),
                machineName: cleanString((ex.equipment || '').replace('smith_machine', 'Smith Machine').replace('cable', 'Polea').replace('machine', 'Maquina').replace('dumbbell', 'Mancuernas').replace('barbell', 'Barra').replace('bodyweight', 'Peso corporal')),
                notes: cleanString(customNotes)
            };
        }),
        absCircuit: absCircuit.map(ex => ({
            name: ex.name,
            sets: 3,
            reps: ex.defaultReps,
            notes: 'Circuito sin descanso'
        })),
        stretching: 'Estiramiento profundo 30s por grupo.'
    };
};

/**
 * Generar rutina completa PERSONALIZADA
 */
export const generateRoutine = (userProfile = {}) => {
    // 1. Extraer frecuencia (Soporta rangos: "2-3 días" -> 3 días)
    let daysRequested = 5;
    const freqValue = userProfile.trainingFrequency || userProfile.frequency || "5";
    const allMatches = String(freqValue).match(/\d+/g);

    if (allMatches && allMatches.length > 0) {
        // Tomamos el número más alto encontrado (ej: "2-3" -> 3)
        daysRequested = Math.max(...allMatches.map(n => parseInt(n)));
    }

    if (![3, 4, 5, 6].includes(daysRequested)) {
        if (daysRequested < 3) daysRequested = 3;
        if (daysRequested > 6) daysRequested = 6;
    }

    // 2. Detectar objetivos (Soporta múltiples)
    const goalsArray = Array.isArray(userProfile.primaryGoal) ? userProfile.primaryGoal :
        (userProfile.primaryGoal ? [userProfile.primaryGoal] : []);

    const combinedGoals = [...goalsArray, ...(userProfile.secondaryGoals || [])].join(' ').toLowerCase();

    const goalKey = combinedGoals.includes('fuerza') ? 'strength' :
        combinedGoals.includes('defin') || combinedGoals.includes('grasa') ? 'definition' :
            combinedGoals.includes('resist') ? 'endurance' : 'muscle';
    const goalConfig = GOAL_CONFIG[goalKey];

    // 3. Detectar nivel
    const levelKey = detectLevel(userProfile.experienceYears);
    const levelConfig = LEVEL_CONFIG[levelKey];

    // 4. Detectar equipo DISPONIBLE REAL (NUEVO)
    let allowedEquipment = [];
    if (userProfile.availableEquipment && userProfile.availableEquipment.length > 0) {
        allowedEquipment = userProfile.availableEquipment
            .map(item => UI_EQUIPMENT_MAP[item])
            .filter(Boolean);
        // Siempre permitir peso corporal
        if (!allowedEquipment.includes(EQUIPMENT.BODYWEIGHT)) {
            allowedEquipment.push(EQUIPMENT.BODYWEIGHT);
        }
    } else {
        const loc = String(userProfile.trainingLocation || '').toLowerCase();
        const equipmentKey = loc.includes('casa') ? 'home' :
            loc.includes('minimal') ? 'minimal' : 'gym';
        allowedEquipment = EQUIPMENT_MAP[equipmentKey] || EQUIPMENT_MAP['gym'];
    }

    // 5. Detectar lesiones
    const injuredMuscles = detectInjuredMuscles(userProfile.injuries);

    // 6. Mapeo de debilidades a grupos musculares (NUEVO)
    const weaknesses = (userProfile.weaknesses || []).map(w => {
        const text = w.toLowerCase();
        if (text.includes('pecho')) return MUSCLE_GROUPS.CHEST;
        if (text.includes('espalda')) return MUSCLE_GROUPS.BACK;
        if (text.includes('hombro')) return MUSCLE_GROUPS.SHOULDERS;
        if (text.includes('pierna') || text.includes('cuad')) return MUSCLE_GROUPS.LEGS_QUAD;
        if (text.includes('isquio') || text.includes('femoral')) return MUSCLE_GROUPS.LEGS_HAM;
        if (text.includes('bicep')) return MUSCLE_GROUPS.BICEPS;
        if (text.includes('tricep')) return MUSCLE_GROUPS.TRICEPS;
        return null;
    }).filter(Boolean);

    // 7. Configuración extendida
    const config = {
        goalConfig,
        levelConfig,
        allowedEquipment,
        injuredMuscles,
        benchmarks: {
            benchmarkBenchPress: userProfile.benchmarkBenchPress,
            benchmarkShoulderPress: userProfile.benchmarkShoulderPress,
            benchmarkDeadlift: userProfile.benchmarkDeadlift,
            benchmarkSquat: userProfile.benchmarkSquat,
            benchmarkPullups: userProfile.benchmarkPullups
        },
        trainingFocus: userProfile.trainingFocus,
        intensityPreference: userProfile.intensityPreference,
        sessionDuration: userProfile.sessionDuration,
        weaknesses
    };

    const split = SPLITS[daysRequested];
    const usedExerciseIds = [];

    // Generar días
    const days = split.days.map(dayTemplate => generateDay(dayTemplate, usedExerciseIds, config));

    // Construir rutina
    const routine = {
        title: cleanString(`Protocolo ${goalConfig.name} ${daysRequested} Días - ${userProfile.displayName || 'Usuario'}`),
        description: cleanString(`Plan de ${daysRequested} días para ${goalConfig.description}. Nivel: ${levelConfig.name}. ${levelConfig.notes}`),
        daysPerWeek: parseInt(daysRequested),
        splitName: cleanString(split.name),
        goal: cleanString(goalConfig.name),
        level: cleanString(levelConfig.name),
        days: days,
        progression: {
            tips: cleanString(config.intensityPreference === 'high'
                ? 'ESTRATEGIA ELITE: Prioriza el fallo muscular técnico. Si logras todas las reps con el peso sugerido, sube 2.5kg la próxima sesión sin dudarlo.'
                : goalKey === 'strength'
                    ? 'Aumenta peso 2.5-5kg cuando completes todas las reps. Descansos largos entre series pesadas.'
                    : goalKey === 'definition'
                        ? 'Mantén el ritmo alto y descansos cortos. Prioriza la conexión mente-músculo.'
                        : 'Sobrecarga progresiva: aumenta peso cuando completes todas las reps con buena técnica.')
        },
        generatedAt: new Date().toISOString(),
        isLocalGenerated: true
    };

    // Limpiar campos undefined para evitar errores en Firestore
    const sanitize = (obj) => JSON.parse(JSON.stringify(obj, (key, value) => value === undefined ? null : value));

    return sanitize(routine);
};

export const generateRoutineVariant = (userProfile = {}) => generateRoutine(userProfile);

export default generateRoutine;
