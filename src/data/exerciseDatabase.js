/**
 * Base de Datos de Ejercicios - FitAI
 * Ejercicios procesados de ejemplos del usuario + catálogo completo
 */

export const EXERCISE_DATABASE = [
    // ===== CHEST (PECHO) =====
    {
        id: "bench-press-barbell",
        name: "Press Banca con Barra",
        nameEN: "Barbell Bench Press",
        category: "push_horizontal",
        muscleGroups: ["pecho", "triceps", "hombros_anterior"],
        isPrimary: true,
        difficulty: "intermediate",
        equipment: ["barra", "banco", "discos"],
        variations: ["bench-press-incline", "bench-press-decline", "bench-press-dumbbell"],
        alternatives: ["press-mancuernas", "push-ups-weighted"],
        targetWeaknesses: ["pecho_debil", "fuerza_push"],
        contraindications: ["hombro_injury", "muneca_dolor"]
    },
    {
        id: "bench-press-incline",
        name: "Press Inclinado con Barra",
        nameEN: "Incline Barbell Bench Press",
        category: "push_horizontal",
        muscleGroups: ["pecho_superior", "triceps", "hombros_anterior"],
        isPrimary: true,
        difficulty: "intermediate",
        equipment: ["barra", "banco_inclinado", "discos"],
        variations: ["incline-db-press"],
        alternatives: ["press-mancuernas-inclinado"],
        targetWeaknesses: ["pecho_superior_debil"]
    },
    {
        id: "incline-db-press",
        name: "Press Inclinado con Mancuernas",
        nameEN: "Incline Dumbbell Press",
        category: "push_horizontal",
        muscleGroups: ["pecho_superior", "triceps", "hombros"],
        isPrimary: false,
        difficulty: "beginner",
        equipment: ["mancuernas", "banco_inclinado"],
        alternatives: ["incline-bench-press"],
        targetWeaknesses: ["pecho_superior_debil", "estabilidad"]
    },
    {
        id: "flies-cable-crossover",
        name: "Aperturas en Polea (Crossover)",
        nameEN: "Cable Crossover Flyes",
        category: "push_horizontal",
        muscleGroups: ["pecho"],
        isPrimary: false,
        difficulty: "intermediate",
        equipment: ["poleas", "cable"],
        alternatives: ["flies-dumbbells"],
        targetWeaknesses: ["pecho_interno"]
    },
    {
        id: "push-ups",
        name: "Flexiones",
        nameEN: "Push-ups",
        category: "push_horizontal",
        muscleGroups: ["pecho", "triceps", "core"],
        isPrimary: false,
        difficulty: "beginner",
        equipment: ["peso_corporal"],
        variations: ["push-ups-decline", "push-ups-diamond"],
        alternatives: ["bench-press-dumbbell"]
    },

    // ===== BACK (ESPALDA) =====
    {
        id: "deadlift-conventional",
        name: "Peso Muerto Convencional",
        nameEN: "Conventional Deadlift",
        category: "pull_posterior",
        muscleGroups: ["espalda_baja", "gluteos", "isquiotibiales", "trapecio"],
        isPrimary: true,
        difficulty: "advanced",
        equipment: ["barra", "discos"],
        variations: ["deadlift-sumo", "deadlift-romanian"],
        alternatives: ["rack-pulls"],
        targetWeaknesses: ["cadena_posterior", "fuerza_pull"]
    },
    {
        id: "deadlift-romanian",
        name: "Peso Muerto Rumano",
        nameEN: "Romanian Deadlift",
        category: "pull_posterior",
        muscleGroups: ["isquiotibiales", "gluteos", "espalda_baja"],
        isPrimary: true,
        difficulty: "intermediate",
        equipment: ["barra", "discos"],
        alternatives: ["buenos-dias"],
        targetWeaknesses: ["isquiotibiales_debiles"]
    },
    {
        id: "pull-ups",
        name: "Dominadas",
        nameEN: "Pull-ups",
        category: "pull_vertical",
        muscleGroups: ["dorsales", "biceps", "core"],
        isPrimary: true,
        difficulty: "intermediate",
        equipment: ["barra_dominadas"],
        variations: ["chin-ups", "pull-ups-wide"],
        alternatives: ["lat-pulldown"],
        targetWeaknesses: ["pull_vertical", "biceps"]
    },
    {
        id: "barbell-row",
        name: "Remo con Barra",
        nameEN: "Barbell Row",
        category: "pull_horizontal",
        muscleGroups: ["dorsales", "trapecio", "biceps"],
        isPrimary: true,
        difficulty: "intermediate",
        equipment: ["barra", "discos"],
        variations: ["pendlay-row"],
        alternatives: ["dumbbell-row", "cable-row"],
        targetWeaknesses: ["espalda_media"]
    },
    {
        id: "lat-pulldown",
        name: "Jalón al Pecho (Lat Pulldown)",
        nameEN: "Lat Pulldown",
        category: "pull_vertical",
        muscleGroups: ["dorsales", "biceps"],
        isPrimary: false,
        difficulty: "beginner",
        equipment: ["maquina_polea"],
        alternatives: ["pull-ups"],
        targetWeaknesses: ["dorsales_debiles"]
    },
    {
        id: "cable-row-seated",
        name: "Remo Sentado en Polea",
        nameEN: "Seated Cable Row",
        category: "pull_horizontal",
        muscleGroups: ["dorsales", "trapecio_medio", "biceps"],
        isPrimary: false,
        difficulty: "beginner",
        equipment: ["polea", "cable"],
        alternatives: ["barbell-row"]
    },

    // ===== SHOULDERS (HOMBROS) =====
    {
        id: "overhead-press-barbell",
        name: "Press Militar con Barra",
        nameEN: "Barbell Overhead Press",
        category: "push_vertical",
        muscleGroups: ["hombros", "triceps", "core"],
        isPrimary: true,
        difficulty: "intermediate",
        equipment: ["barra", "discos"],
        variations: ["overhead-press-seated"],
        alternatives: ["dumbbell-shoulder-press"],
        targetWeaknesses: ["hombros_debiles", "fuerza_overhead"]
    },
    {
        id: "dumbbell-shoulder-press",
        name: "Press de Hombros con Mancuernas",
        nameEN: "Dumbbell Shoulder Press",
        category: "push_vertical",
        muscleGroups: ["hombros", "triceps"],
        isPrimary: false,
        difficulty: "beginner",
        equipment: ["mancuernas", "banco"],
        alternatives: ["overhead-press-barbell"]
    },
    {
        id: "lateral-raises",
        name: "Elevaciones Laterales",
        nameEN: "Lateral Raises",
        category: "push_accessory",
        muscleGroups: ["hombros_lateral"],
        isPrimary: false,
        difficulty: "beginner",
        equipment: ["mancuernas"],
        alternatives: ["cable-lateral-raises"],
        targetWeaknesses: ["hombros_laterales"]
    },
    {
        id: "face-pulls",
        name: "Face Pulls (Poleas)",
        nameEN: "Face Pulls",
        category: "pull_accessory",
        muscleGroups: ["hombros_posterior", "trapecio"],
        isPrimary: false,
        difficulty: "beginner",
        equipment: ["polea", "cable"],
        targetWeaknesses: ["hombros_posteriores", "postura"]
    },

    // ===== LEGS (PIERNAS) =====
    {
        id: "squat-barbell",
        name: "Sentadilla con Barra",
        nameEN: "Barbell Squat",
        category: "legs_quad",
        muscleGroups: ["cuadriceps", "gluteos", "core"],
        isPrimary: true,
        difficulty: "intermediate",
        equipment: ["barra", "discos", "rack"],
        variations: ["front-squat", "box-squat"],
        alternatives: ["leg-press"],
        targetWeaknesses: ["cuadriceps_debiles", "fuerza_piernas"]
    },
    {
        id: "front-squat",
        name: "Sentadilla Frontal",
        nameEN: "Front Squat",
        category: "legs_quad",
        muscleGroups: ["cuadriceps", "core"],
        isPrimary: true,
        difficulty: "advanced",
        equipment: ["barra", "discos", "rack"],
        alternatives: ["goblet-squat"],
        targetWeaknesses: ["cuadriceps", "core"]
    },
    {
        id: "bulgarian-split-squat",
        name: "Sentadilla Búlgara",
        nameEN: "Bulgarian Split Squat",
        category: "legs_unilateral",
        muscleGroups: ["cuadriceps", "gluteos"],
        isPrimary: false,
        difficulty: "intermediate",
        equipment: ["mancuernas", "banco"],
        alternatives: ["lunges"],
        targetWeaknesses: ["desequilibrio_piernas"]
    },
    {
        id: "leg-press",
        name: "Prensa de Piernas",
        nameEN: "Leg Press",
        category: "legs_quad",
        muscleGroups: ["cuadriceps", "gluteos"],
        isPrimary: false,
        difficulty: "beginner",
        equipment: ["maquina_prensa"],
        alternatives: ["squat-barbell"]
    },
    {
        id: "leg-curl-machine",
        name: "Curl de Piernas en Máquina",
        nameEN: "Leg Curl Machine",
        category: "legs_hamstring",
        muscleGroups: ["isquiotibiales"],
        isPrimary: false,
        difficulty: "beginner",
        equipment: ["maquina_curl"],
        alternatives: ["deadlift-romanian"],
        targetWeaknesses: ["isquiotibiales"]
    },
    {
        id: "calf-raises",
        name: "Elevaciones de Gemelos",
        nameEN: "Calf Raises",
        category: "legs_calf",
        muscleGroups: ["gemelos"],
        isPrimary: false,
        difficulty: "beginner",
        equipment: ["maquina_gemelos"],
        targetWeaknesses: ["gemelos_debiles"]
    },

    // ===== ARMS (BRAZOS) =====
    {
        id: "barbell-curl",
        name: "Curl con Barra",
        nameEN: "Barbell Curl",
        category: "pull_arms",
        muscleGroups: ["biceps"],
        isPrimary: false,
        difficulty: "beginner",
        equipment: ["barra_ez", "discos"],
        variations: ["preacher-curl"],
        alternatives: ["dumbbell-curl"]
    },
    {
        id: "hammer-curl",
        name: "Curl Martillo",
        nameEN: "Hammer Curl",
        category: "pull_arms",
        muscleGroups: ["biceps", "braquial"],
        isPrimary: false,
        difficulty: "beginner",
        equipment: ["mancuernas"],
        alternatives: ["barbell-curl"]
    },
    {
        id: "tricep-pushdown",
        name: "Extensiones de Tríceps en Polea",
        nameEN: "Tricep Pushdown",
        category: "push_arms",
        muscleGroups: ["triceps"],
        isPrimary: false,
        difficulty: "beginner",
        equipment: ["polea", "cable"],
        alternatives: ["skull-crushers"]
    },
    {
        id: "skull-crushers",
        name: "Skull Crushers (Extensiones Acostado)",
        nameEN: "Skull Crushers",
        category: "push_arms",
        muscleGroups: ["triceps"],
        isPrimary: false,
        difficulty: "intermediate",
        equipment: ["barra_ez", "banco"],
        alternatives: ["tricep-pushdown"]
    },
    {
        id: "dips",
        name: "Fondos en Paralelas",
        nameEN: "Dips",
        category: "push_compound",
        muscleGroups: ["triceps", "pecho_inferior"],
        isPrimary: false,
        difficulty: "intermediate",
        equipment: ["paralelas"],
        alternatives: ["close-grip-bench"]
    },

    // ===== CORE (CORE/ABDOMEN) =====
    {
        id: "planks",
        name: "Planchas",
        nameEN: "Planks",
        category: "core",
        muscleGroups: ["core", "abdomen"],
        isPrimary: false,
        difficulty: "beginner",
        equipment: ["peso_corporal"],
        variations: ["side-planks", "plank-weighted"]
    },
    {
        id: "russian-twists",
        name: "Giros Rusos",
        nameEN: "Russian Twists",
        category: "core",
        muscleGroups: ["core", "oblicuos"],
        isPrimary: false,
        difficulty: "beginner",
        equipment: ["peso_corporal", "mancuerna"],
        alternatives: ["cable-wood-chops"]
    },
    {
        id: "leg-raises",
        name: "Elevaciones de Piernas",
        nameEN: "Leg Raises",
        category: "core",
        muscleGroups: ["abdomen_inferior"],
        isPrimary: false,
        difficulty: "intermediate",
        equipment: ["barra_dominadas"],
        alternatives: ["reverse-crunches"]
    },
    {
        id: "cable-crunches",
        name: "Crunches en Polea",
        nameEN: "Cable Crunches",
        category: "core",
        muscleGroups: ["abdomen"],
        isPrimary: false,
        difficulty: "beginner",
        equipment: ["polea", "cable"],
        alternatives: ["weighted-crunches"]
    }
];

/**
 * Obtiene ejercicios filtrados por categoría y dificultad
 */
export const getExercisesByCategory = (category, maxDifficulty = "advanced") => {
    const difficultyLevels = { beginner: 1, intermediate: 2, advanced: 3 };
    const maxLevel = difficultyLevels[maxDifficulty] || 3;

    return EXERCISE_DATABASE.filter(ex =>
        ex.category === category &&
        difficultyLevels[ex.difficulty] <= maxLevel
    );
};

/**
 * Obtiene ejercicios primarios (compuestos)
 */
export const getPrimaryExercises = (category, maxDifficulty = "advanced") => {
    return getExercisesByCategory(category, maxDifficulty).filter(ex => ex.isPrimary);
};

/**
 * Obtiene ejercicios accesorios
 */
export const getSecondaryExercises = (category, maxDifficulty = "advanced") => {
    return getExercisesByCategory(category, maxDifficulty).filter(ex => !ex.isPrimary);
};

/**
 * Filtra ejercicios según equipo disponible
 */
export const filterByEquipment = (exercises, availableEquipment) => {
    return exercises.filter(ex =>
        ex.equipment.every(eq => availableEquipment.includes(eq) || eq === "peso_corporal")
    );
};

/**
 * Filtra ejercicios según lesiones/contraindicaciones
 */
export const filterByInjuries = (exercises, injuries) => {
    if (!injuries || injuries.length === 0) return exercises;

    return exercises.filter(ex =>
        !ex.contraindications || !ex.contraindications.some(c => injuries.includes(c))
    );
};

export default {
    EXERCISE_DATABASE,
    getExercisesByCategory,
    getPrimaryExercises,
    getSecondaryExercises,
    filterByEquipment,
    filterByInjuries
};
