/**
 * FITAI Professional Exercise Database
 * Base de datos curada de ejercicios profesionales de culturismo
 * Extraida de rutinas de preparadores fisicos de elite
 */

// Grupos musculares disponibles
export const MUSCLE_GROUPS = {
    CHEST: 'chest',
    BACK: 'back',
    SHOULDERS: 'shoulders',
    LEGS_QUAD: 'legs_quad',
    LEGS_HAM: 'legs_ham',
    BICEPS: 'biceps',
    TRICEPS: 'triceps',
    CORE: 'core'
};

// Tipos de equipo
export const EQUIPMENT = {
    SMITH: 'smith_machine',
    BARBELL: 'barbell',
    DUMBBELL: 'dumbbell',
    CABLE: 'cable',
    MACHINE: 'machine',
    BODYWEIGHT: 'bodyweight'
};

// Tipos de ejercicio
export const EXERCISE_TYPE = {
    COMPOUND: 'compound',
    ISOLATION: 'isolation'
};

/**
 * Base de datos de ejercicios profesionales
 * Cada ejercicio tiene:
 * - id: identificador unico
 * - name: nombre completo con especificaciones
 * - muscleGroup: grupo muscular principal
 * - secondaryMuscle: musculo secundario (opcional)
 * - equipment: tipo de equipo
 * - type: compuesto o aislamiento
 * - defaultSets: series recomendadas
 * - defaultReps: rango de repeticiones (formato piramidal)
 * - techniques: tecnicas de intensidad aplicables
 * - notes: instrucciones de ejecucion
 */
export const EXERCISES = [
    // ==================== PECHO ====================
    {
        id: 'chest_press_incline_smith',
        name: 'Press inclinacióndo en Smith 35 grados',
        muscleGroup: MUSCLE_GROUPS.CHEST,
        secondaryMuscle: MUSCLE_GROUPS.TRICEPS,
        equipment: EQUIPMENT.SMITH,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 4,
        defaultReps: '12-10-10-8',
        techniques: ['dropset', 'pyramid'],
        notes: '2x15 para calentamiento + series efectivas. Bajar hasta 90 grados de codo.'
    },
    {
        id: 'chest_press_incline_db',
        name: 'Press inclinacióndo con mancuernas 25 grados',
        muscleGroup: MUSCLE_GROUPS.CHEST,
        secondaryMuscle: MUSCLE_GROUPS.TRICEPS,
        equipment: EQUIPMENT.DUMBBELL,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 4,
        defaultReps: '12-10-10',
        techniques: ['dropset'],
        notes: 'retracción escapular. Controlar la bajada.'
    },
    {
        id: 'chest_fly_machine',
        name: 'Aperturas en máquina',
        muscleGroup: MUSCLE_GROUPS.CHEST,
        equipment: EQUIPMENT.MACHINE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 4,
        defaultReps: '15-15-12-10',
        techniques: ['dropset'],
        notes: '+ 1 drop al 50% hasta fallo'
    },
    {
        id: 'chest_fly_high_cable',
        name: 'Aperturas altas con estribos',
        muscleGroup: MUSCLE_GROUPS.CHEST,
        equipment: EQUIPMENT.CABLE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '12-10',
        techniques: ['dropset'],
        notes: '+ 1 drop al 50% fallo'
    },
    {
        id: 'chest_press_flat_smith',
        name: 'Press plano en Smith',
        muscleGroup: MUSCLE_GROUPS.CHEST,
        secondaryMuscle: MUSCLE_GROUPS.TRICEPS,
        equipment: EQUIPMENT.SMITH,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 4,
        defaultReps: '12-10-8-8',
        techniques: ['pyramid'],
        notes: 'Agarre medio. Tocar el pecho en cada rep.'
    },
    {
        id: 'chest_dips',
        name: 'Fondos en paralelas',
        muscleGroup: MUSCLE_GROUPS.CHEST,
        secondaryMuscle: MUSCLE_GROUPS.TRICEPS,
        equipment: EQUIPMENT.BODYWEIGHT,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 3,
        defaultReps: '10-8-8',
        techniques: [],
        notes: 'inclinacióncion hacia adelante para enfatizar pecho.'
    },

    // ==================== TRCEPS ====================
    {
        id: 'triceps_Extensión_cable_high',
        name: 'Extensión de triceps en polea alta',
        muscleGroup: MUSCLE_GROUPS.TRICEPS,
        equipment: EQUIPMENT.CABLE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 4,
        defaultReps: '15-15-12-10',
        techniques: ['dropset'],
        notes: '+ 1 drop al 50% fallo'
    },
    {
        id: 'triceps_Extensión_unilateral',
        name: 'Extensión neutra unilateral en polea',
        muscleGroup: MUSCLE_GROUPS.TRICEPS,
        equipment: EQUIPMENT.CABLE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '12-10',
        techniques: ['superset'],
        notes: 'S/S con barra supina bilateral'
    },
    {
        id: 'triceps_french_press',
        name: 'Frances tumbado con barra',
        muscleGroup: MUSCLE_GROUPS.TRICEPS,
        equipment: EQUIPMENT.BARBELL,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 2,
        defaultReps: '15',
        techniques: [],
        notes: '+ empuje x15 x fallo'
    },
    {
        id: 'triceps_pushdown_rope',
        name: 'Pushdown con soga',
        muscleGroup: MUSCLE_GROUPS.TRICEPS,
        equipment: EQUIPMENT.CABLE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '12-10-10',
        techniques: ['dropset'],
        notes: 'Separar la soga en la contracción maxima.'
    },
    {
        id: 'triceps_kickback_cable',
        name: 'Patada de triceps en polea',
        muscleGroup: MUSCLE_GROUPS.TRICEPS,
        equipment: EQUIPMENT.CABLE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '12-10',
        techniques: [],
        notes: 'Mantener el codo fijo. contracción maxima.'
    },

    // ==================== ESPALDA ====================
    {
        id: 'back_pullover_cable',
        name: 'Pullover con soga en polea',
        muscleGroup: MUSCLE_GROUPS.BACK,
        equipment: EQUIPMENT.CABLE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 2,
        defaultReps: '15',
        techniques: [],
        notes: 'Para calentamiento + 4x12-10'
    },
    {
        id: 'back_lat_pulldown_prone',
        name: 'Jalones pronos en polea alta',
        muscleGroup: MUSCLE_GROUPS.BACK,
        secondaryMuscle: MUSCLE_GROUPS.BICEPS,
        equipment: EQUIPMENT.CABLE,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 4,
        defaultReps: '15-12',
        techniques: ['dropset'],
        notes: '+ 1 drop al 50% fallo'
    },
    {
        id: 'back_row_t',
        name: 'Remo T',
        muscleGroup: MUSCLE_GROUPS.BACK,
        secondaryMuscle: MUSCLE_GROUPS.BICEPS,
        equipment: EQUIPMENT.MACHINE,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 3,
        defaultReps: '12-10',
        techniques: [],
        notes: 'Agarre neutro. Tirar hacia el abdomen.'
    },
    {
        id: 'back_row_machine_unilateral',
        name: 'Remo en máquina neutro unilateral',
        muscleGroup: MUSCLE_GROUPS.BACK,
        secondaryMuscle: MUSCLE_GROUPS.BICEPS,
        equipment: EQUIPMENT.MACHINE,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 3,
        defaultReps: '12-10',
        techniques: ['superset'],
        notes: 'S/S bilateral 3x12-10'
    },
    {
        id: 'back_pullup',
        name: 'Dominadas',
        muscleGroup: MUSCLE_GROUPS.BACK,
        secondaryMuscle: MUSCLE_GROUPS.BICEPS,
        equipment: EQUIPMENT.BODYWEIGHT,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 4,
        defaultReps: '10-8-8-6',
        techniques: [],
        notes: 'Agarre prono ancho. Bajar controlado.'
    },
    {
        id: 'back_seated_row_cable',
        name: 'Remo sentado en polea baja',
        muscleGroup: MUSCLE_GROUPS.BACK,
        secondaryMuscle: MUSCLE_GROUPS.BICEPS,
        equipment: EQUIPMENT.CABLE,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 4,
        defaultReps: '12-10-10-8',
        techniques: ['pyramid'],
        notes: 'Mantener espalda recta. retracción escapular.'
    },

    // ==================== BCEPS ====================
    {
        id: 'biceps_curl_incline_db',
        name: 'Curl biceps con mancuernas en banco 35 grados',
        muscleGroup: MUSCLE_GROUPS.BICEPS,
        equipment: EQUIPMENT.DUMBBELL,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '12-10',
        techniques: ['dropset'],
        notes: '+ 1 drop 50% fallo bilateral'
    },
    {
        id: 'biceps_curl_cable_low',
        name: 'Curl con barra en polea baja',
        muscleGroup: MUSCLE_GROUPS.BICEPS,
        equipment: EQUIPMENT.CABLE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '12-10',
        techniques: ['superset'],
        notes: 'S/S prono 3x12-10'
    },
    {
        id: 'biceps_hammer_seated',
        name: 'Martillo unilateral sentado con isometrico',
        muscleGroup: MUSCLE_GROUPS.BICEPS,
        equipment: EQUIPMENT.DUMBBELL,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '12',
        techniques: ['isometric'],
        notes: 'Manc isometrico 3" x3'
    },
    {
        id: 'biceps_preacher_curl',
        name: 'Curl predicador con barra Z',
        muscleGroup: MUSCLE_GROUPS.BICEPS,
        equipment: EQUIPMENT.BARBELL,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '12-10-8',
        techniques: ['pyramid'],
        notes: 'Bajar completamente. Sin impulso.'
    },
    {
        id: 'biceps_concentration_curl',
        name: 'Curl concentrado',
        muscleGroup: MUSCLE_GROUPS.BICEPS,
        equipment: EQUIPMENT.DUMBBELL,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '12-10',
        techniques: ['dropset'],
        notes: 'Maxima concentracion en el pico.'
    },

    // ==================== HOMBROS ====================
    {
        id: 'shoulders_lateral_raise_seated',
        name: 'Vuelos laterales sentado',
        muscleGroup: MUSCLE_GROUPS.SHOULDERS,
        equipment: EQUIPMENT.DUMBBELL,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 2,
        defaultReps: '15',
        techniques: ['isometric'],
        notes: 'Para calentamiento + 5x12-10 (ultimas 2 + 5" isometrico)'
    },
    {
        id: 'shoulders_press_smith',
        name: 'Press militar en Smith',
        muscleGroup: MUSCLE_GROUPS.SHOULDERS,
        secondaryMuscle: MUSCLE_GROUPS.TRICEPS,
        equipment: EQUIPMENT.SMITH,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 4,
        defaultReps: '12-10',
        techniques: ['dropset'],
        notes: '+ 1 drop 50% fallo (alternar x semana con mancuernas)'
    },
    {
        id: 'shoulders_front_raise_unilateral',
        name: 'Frontales sentado unilateral con mancuernas',
        muscleGroup: MUSCLE_GROUPS.SHOULDERS,
        equipment: EQUIPMENT.DUMBBELL,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '12-10',
        techniques: [],
        notes: 'Control total. Sin balanceo.'
    },
    {
        id: 'shoulders_rear_delt_machine',
        name: 'Posteriores en máquina',
        muscleGroup: MUSCLE_GROUPS.SHOULDERS,
        equipment: EQUIPMENT.MACHINE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 4,
        defaultReps: '20-15',
        techniques: [],
        notes: 'ulto volumen para deltoide posterior.'
    },
    {
        id: 'shoulders_pullface',
        name: 'Pullface con soga',
        muscleGroup: MUSCLE_GROUPS.SHOULDERS,
        equipment: EQUIPMENT.CABLE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 2,
        defaultReps: '15-12',
        techniques: [],
        notes: 'Separar la soga hacia las orejas.'
    },
    {
        id: 'shoulders_shrugs_smith',
        name: 'Encogimiento trapecios en Smith',
        muscleGroup: MUSCLE_GROUPS.SHOULDERS,
        equipment: EQUIPMENT.SMITH,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 4,
        defaultReps: '20',
        techniques: [],
        notes: 'Mantener 2" en la contracción maxima.'
    },
    {
        id: 'shoulders_lateral_cable',
        name: 'Vuelos laterales en polea baja',
        muscleGroup: MUSCLE_GROUPS.SHOULDERS,
        equipment: EQUIPMENT.CABLE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '12-10',
        techniques: ['dropset'],
        notes: 'Tension constante. Sin impulso.'
    },

    // ==================== PIERNAS (CUÁDRICEPS) ====================
    {
        id: 'legs_hack_squat',
        name: 'Hack Squat',
        muscleGroup: MUSCLE_GROUPS.LEGS_QUAD,
        equipment: EQUIPMENT.MACHINE,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 2,
        defaultReps: '15',
        techniques: [],
        notes: 'Para calentamiento + 4x12-10'
    },
    {
        id: 'legs_press_45',
        name: 'Prensa 45 grados',
        muscleGroup: MUSCLE_GROUPS.LEGS_QUAD,
        equipment: EQUIPMENT.MACHINE,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 4,
        defaultReps: '12-10',
        techniques: [],
        notes: 'Pies a la altura de los hombros. Bajar a 90 grados.'
    },
    {
        id: 'legs_lunges_db',
        name: 'Estocadas dinamicas con mancuernas',
        muscleGroup: MUSCLE_GROUPS.LEGS_QUAD,
        secondaryMuscle: MUSCLE_GROUPS.LEGS_HAM,
        equipment: EQUIPMENT.DUMBBELL,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 4,
        defaultReps: '12-10',
        techniques: [],
        notes: '+ 1 sentadilla con mancuernas x fallo'
    },
    {
        id: 'legs_leg_Extensión',
        name: 'Sillon de cuadriceps',
        muscleGroup: MUSCLE_GROUPS.LEGS_QUAD,
        equipment: EQUIPMENT.MACHINE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 4,
        defaultReps: '20-15-12-10',
        techniques: ['dropset'],
        notes: '+ 1 drop 50% fallo'
    },
    {
        id: 'legs_sissy_squat',
        name: 'Sissy Squat',
        muscleGroup: MUSCLE_GROUPS.LEGS_QUAD,
        equipment: EQUIPMENT.BODYWEIGHT,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '15-12',
        techniques: [],
        notes: 'Control total. Maxima Extensión de rodilla.'
    },

    // ==================== PIERNAS (ISQUIOTIBIALES/GLÚTEOS) ====================
    {
        id: 'legs_leg_curl',
        name: 'Camilla de femorales',
        muscleGroup: MUSCLE_GROUPS.LEGS_HAM,
        equipment: EQUIPMENT.MACHINE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 4,
        defaultReps: '12-10',
        techniques: [],
        notes: 'contracción maxima en cada rep.'
    },
    {
        id: 'legs_hip_thrust',
        name: 'Hip Thrust en máquina',
        muscleGroup: MUSCLE_GROUPS.LEGS_HAM,
        equipment: EQUIPMENT.MACHINE,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 3,
        defaultReps: '12-10',
        techniques: [],
        notes: 'Squeeze 2" en la contracción maxima.'
    },
    {
        id: 'legs_abductors',
        name: 'Abductores en máquina',
        muscleGroup: MUSCLE_GROUPS.LEGS_HAM,
        equipment: EQUIPMENT.MACHINE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 4,
        defaultReps: '20',
        techniques: ['superset'],
        notes: 'S/S aductores 4x12'
    },
    {
        id: 'legs_rdl',
        name: 'Peso muerto rumano con barra',
        muscleGroup: MUSCLE_GROUPS.LEGS_HAM,
        equipment: EQUIPMENT.BARBELL,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 4,
        defaultReps: '12-10-10-8',
        techniques: ['pyramid'],
        notes: 'Mantener espalda neutra. Estiramiento de isquios.'
    },
    {
        id: 'legs_good_morning',
        name: 'Buenos dias con barra',
        muscleGroup: MUSCLE_GROUPS.LEGS_HAM,
        equipment: EQUIPMENT.BARBELL,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 3,
        defaultReps: '12-10',
        techniques: [],
        notes: 'Flexion de cadera manteniendo rodillas semiflexionadas.'
    },

    // ==================== CORE / Abs ====================
    {
        id: 'core_crunch_cable',
        name: 'Encogimiento en polea',
        muscleGroup: MUSCLE_GROUPS.CORE,
        equipment: EQUIPMENT.CABLE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '20',
        techniques: [],
        notes: 'x3 lados'
    },
    {
        id: 'core_leg_raise',
        name: 'Elevacion de piernas y rodillas',
        muscleGroup: MUSCLE_GROUPS.CORE,
        equipment: EQUIPMENT.BODYWEIGHT,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: 'x fallo',
        techniques: [],
        notes: 'Sin descanso entre ejercicios del circuito.'
    },
    {
        id: 'core_ab_wheel',
        name: 'Rueda abdominal',
        muscleGroup: MUSCLE_GROUPS.CORE,
        equipment: EQUIPMENT.BODYWEIGHT,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 3,
        defaultReps: 'x fallo',
        techniques: [],
        notes: 'Control total. Sin colapsar la espalda baja.'
    },
    {
        id: 'core_plank',
        name: 'Plancha',
        muscleGroup: MUSCLE_GROUPS.CORE,
        equipment: EQUIPMENT.BODYWEIGHT,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: 'x fallo',
        techniques: [],
        notes: 'Mantener cuerpo alineado.'
    },
    {
        id: 'core_russian_twist',
        name: 'Giros rusos con peso',
        muscleGroup: MUSCLE_GROUPS.CORE,
        equipment: EQUIPMENT.DUMBBELL,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '20',
        techniques: [],
        notes: 'Tocar el suelo con el peso a cada lado.'
    },
    {
        id: 'core_cable_woodchop',
        name: 'Cortos en polea',
        muscleGroup: MUSCLE_GROUPS.CORE,
        equipment: EQUIPMENT.CABLE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: 'x fallo',
        techniques: [],
        notes: 'Movimiento explosivo controlado.'
    },

    // ==================== EJERCICIOS ADICIONuLES PECHO ====================
    {
        id: 'chest_press_decline_smith',
        name: 'Press declinado en Smith',
        muscleGroup: MUSCLE_GROUPS.CHEST,
        secondaryMuscle: MUSCLE_GROUPS.TRICEPS,
        equipment: EQUIPMENT.SMITH,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 4,
        defaultReps: '12-10-10-8',
        techniques: ['pyramid'],
        notes: 'Enfatiza pectoral inferior. ngulo 15-20 grados.'
    },
    {
        id: 'chest_cable_crossover',
        name: 'Cruces en polea alta',
        muscleGroup: MUSCLE_GROUPS.CHEST,
        equipment: EQUIPMENT.CABLE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '15-12-10',
        techniques: ['dropset'],
        notes: 'Cruzar las manos al centro. Squeeze 2".'
    },
    {
        id: 'chest_low_cable_fly',
        name: 'Cruces en polea baja',
        muscleGroup: MUSCLE_GROUPS.CHEST,
        equipment: EQUIPMENT.CABLE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '12-10',
        techniques: [],
        notes: 'Trabaja pectoral superior. Subir hasta nivel de ojos.'
    },
    {
        id: 'chest_press_db_flat',
        name: 'Press plano con mancuernas',
        muscleGroup: MUSCLE_GROUPS.CHEST,
        secondaryMuscle: MUSCLE_GROUPS.TRICEPS,
        equipment: EQUIPMENT.DUMBBELL,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 4,
        defaultReps: '12-10-8-8',
        techniques: ['dropset'],
        notes: 'Mayor rango de movimiento que barra.'
    },
    {
        id: 'chest_pushup_weighted',
        name: 'Flexiones con peso',
        muscleGroup: MUSCLE_GROUPS.CHEST,
        secondaryMuscle: MUSCLE_GROUPS.TRICEPS,
        equipment: EQUIPMENT.BODYWEIGHT,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 3,
        defaultReps: '15-12-10',
        techniques: [],
        notes: 'Disco en la espalda o chaleco lastrado.'
    },

    // ==================== EJERCICIOS ADICIONuLES ESPALDA ====================
    {
        id: 'back_lat_pulldown_supine',
        name: 'Jalones supinos en polea alta',
        muscleGroup: MUSCLE_GROUPS.BACK,
        secondaryMuscle: MUSCLE_GROUPS.BICEPS,
        equipment: EQUIPMENT.CABLE,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 4,
        defaultReps: '12-10-10',
        techniques: ['dropset'],
        notes: 'Agarre supino. nfasis en biceps y espalda baja.'
    },
    {
        id: 'back_row_barbell',
        name: 'Remo con barra inclinacióndo',
        muscleGroup: MUSCLE_GROUPS.BACK,
        secondaryMuscle: MUSCLE_GROUPS.BICEPS,
        equipment: EQUIPMENT.BARBELL,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 4,
        defaultReps: '10-8-8-6',
        techniques: ['pyramid'],
        notes: '45 grados de inclinacióncion. Tirar hacia el ombligo.'
    },
    {
        id: 'back_row_db_unilateral',
        name: 'Remo con mancuerna unilateral',
        muscleGroup: MUSCLE_GROUPS.BACK,
        secondaryMuscle: MUSCLE_GROUPS.BICEPS,
        equipment: EQUIPMENT.DUMBBELL,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 3,
        defaultReps: '12-10-8',
        techniques: [],
        notes: 'upoyo de rodilla en banco. Sin rotacion de torso.'
    },
    {
        id: 'back_straight_arm_pulldown',
        name: 'Pulldown brazos rectos',
        muscleGroup: MUSCLE_GROUPS.BACK,
        equipment: EQUIPMENT.CABLE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '15-12',
        techniques: [],
        notes: 'Mantener brazos rectos. Squeeze en dorsales.'
    },
    {
        id: 'back_machine_row',
        name: 'Remo en máquina (palancas)',
        muscleGroup: MUSCLE_GROUPS.BACK,
        secondaryMuscle: MUSCLE_GROUPS.BICEPS,
        equipment: EQUIPMENT.MACHINE,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 4,
        defaultReps: '12-10-10',
        techniques: [],
        notes: 'Control total. No usar impulso.'
    },

    // ==================== EJERCICIOS ADICIONuLES HOMBROS ====================
    {
        id: 'shoulders_press_db',
        name: 'Press militar con mancuernas',
        muscleGroup: MUSCLE_GROUPS.SHOULDERS,
        secondaryMuscle: MUSCLE_GROUPS.TRICEPS,
        equipment: EQUIPMENT.DUMBBELL,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 4,
        defaultReps: '12-10-8',
        techniques: ['pyramid'],
        notes: 'Sentado. Subir hasta Extensión completa.'
    },
    {
        id: 'shoulders_arnold_press',
        name: 'Press Arnold',
        muscleGroup: MUSCLE_GROUPS.SHOULDERS,
        secondaryMuscle: MUSCLE_GROUPS.TRICEPS,
        equipment: EQUIPMENT.DUMBBELL,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 3,
        defaultReps: '12-10',
        techniques: [],
        notes: 'Rotacion durante el press. Trabaja los 3 deltoides.'
    },
    {
        id: 'shoulders_upright_row',
        name: 'Remo al menton con barra',
        muscleGroup: MUSCLE_GROUPS.SHOULDERS,
        equipment: EQUIPMENT.BARBELL,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 3,
        defaultReps: '12-10',
        techniques: [],
        notes: 'Agarre medio. Subir hasta nivel de clavicula.'
    },
    {
        id: 'shoulders_lateral_machine',
        name: 'Vuelos laterales en máquina',
        muscleGroup: MUSCLE_GROUPS.SHOULDERS,
        equipment: EQUIPMENT.MACHINE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 4,
        defaultReps: '15-12-10',
        techniques: ['dropset'],
        notes: 'Mantener codos ligeramente flexionados.'
    },
    {
        id: 'shoulders_rear_cable',
        name: 'Posteriores en polea alta cruzada',
        muscleGroup: MUSCLE_GROUPS.SHOULDERS,
        equipment: EQUIPMENT.CABLE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '15-12',
        techniques: [],
        notes: 'Brazos cruzados. ubrir hacia afuera.'
    },

    // ==================== EJERCICIOS ADICIONuLES PIERNAS ====================
    {
        id: 'legs_squat_barbell',
        name: 'Sentadilla con barra',
        muscleGroup: MUSCLE_GROUPS.LEGS_QUAD,
        secondaryMuscle: MUSCLE_GROUPS.LEGS_HAM,
        equipment: EQUIPMENT.BARBELL,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 4,
        defaultReps: '10-8-6-6',
        techniques: ['pyramid'],
        notes: 'Barra alta. Bajar hasta paralelo o mas.'
    },
    {
        id: 'legs_goblet_squat',
        name: 'Sentadilla Goblet',
        muscleGroup: MUSCLE_GROUPS.LEGS_QUAD,
        equipment: EQUIPMENT.DUMBBELL,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 3,
        defaultReps: '15-12',
        techniques: [],
        notes: 'Mancuerna al pecho. Ideal para calentamiento.'
    },
    {
        id: 'legs_bulgarian_split',
        name: 'Sentadilla bulgara',
        muscleGroup: MUSCLE_GROUPS.LEGS_QUAD,
        secondaryMuscle: MUSCLE_GROUPS.LEGS_HAM,
        equipment: EQUIPMENT.DUMBBELL,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 3,
        defaultReps: '12-10',
        techniques: [],
        notes: 'Pie trasero elevado en banco. Control total.'
    },
    {
        id: 'legs_leg_curl_seated',
        name: 'Curl de piernas sentado',
        muscleGroup: MUSCLE_GROUPS.LEGS_HAM,
        equipment: EQUIPMENT.MACHINE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 4,
        defaultReps: '15-12-10',
        techniques: ['dropset'],
        notes: 'Trabaja isquios en posicion estirada.'
    },
    {
        id: 'legs_calf_raise_standing',
        name: 'Elevacion de gemelos de pie',
        muscleGroup: MUSCLE_GROUPS.LEGS_HAM,
        equipment: EQUIPMENT.MACHINE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 4,
        defaultReps: '20-15-15',
        techniques: [],
        notes: 'Pausa en la contracción maxima.'
    },
    {
        id: 'legs_calf_raise_seated',
        name: 'Elevacion de gemelos sentado',
        muscleGroup: MUSCLE_GROUPS.LEGS_HAM,
        equipment: EQUIPMENT.MACHINE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '20-15',
        techniques: [],
        notes: 'Trabaja el soleo. Pausa de 2" arriba.'
    },

    // ==================== EJERCICIOS ADICIONuLES BCEPS ====================
    {
        id: 'biceps_curl_barbell',
        name: 'Curl con barra recta',
        muscleGroup: MUSCLE_GROUPS.BICEPS,
        equipment: EQUIPMENT.BARBELL,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 4,
        defaultReps: '12-10-8',
        techniques: ['pyramid'],
        notes: 'Codos pegados al cuerpo. Sin impulso.'
    },
    {
        id: 'biceps_curl_spider',
        name: 'Curl araa',
        muscleGroup: MUSCLE_GROUPS.BICEPS,
        equipment: EQUIPMENT.DUMBBELL,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '12-10',
        techniques: [],
        notes: 'Pecho apoyado en banco inclinacióndo. Maxima contracción.'
    },
    {
        id: 'biceps_curl_21s',
        name: 'Curl 21s',
        muscleGroup: MUSCLE_GROUPS.BICEPS,
        equipment: EQUIPMENT.BARBELL,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 2,
        defaultReps: '21',
        techniques: [],
        notes: '7 reps parciales bajas + 7 altas + 7 completas.'
    },
    {
        id: 'biceps_drag_curl',
        name: 'Drag Curl',
        muscleGroup: MUSCLE_GROUPS.BICEPS,
        equipment: EQUIPMENT.BARBELL,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '10-8',
        techniques: [],
        notes: 'Barra desliza por el torso. Codos hacia atras.'
    },

    // ==================== EJERCICIOS ADICIONuLES TRCEPS ====================
    {
        id: 'triceps_dips_bench',
        name: 'Fondos en banco',
        muscleGroup: MUSCLE_GROUPS.TRICEPS,
        equipment: EQUIPMENT.BODYWEIGHT,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 3,
        defaultReps: '15-12-10',
        techniques: [],
        notes: 'Pies elevados para mayor intensidad.'
    },
    {
        id: 'triceps_overhead_db',
        name: 'Extensión overhead con mancuerna',
        muscleGroup: MUSCLE_GROUPS.TRICEPS,
        equipment: EQUIPMENT.DUMBBELL,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '12-10',
        techniques: [],
        notes: 'Una mancuerna con ambas manos. Codos apuntando al frente.'
    },
    {
        id: 'triceps_close_grip_press',
        name: 'Press agarre cerrado',
        muscleGroup: MUSCLE_GROUPS.TRICEPS,
        secondaryMuscle: MUSCLE_GROUPS.CHEST,
        equipment: EQUIPMENT.BARBELL,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 4,
        defaultReps: '10-8-8',
        techniques: ['pyramid'],
        notes: 'Agarre a la anchura de hombros. Codos pegados.'
    },
    {
        id: 'triceps_pushdown_bar',
        name: 'Pushdown con barra recta',
        muscleGroup: MUSCLE_GROUPS.TRICEPS,
        equipment: EQUIPMENT.CABLE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '15-12-10',
        techniques: ['dropset'],
        notes: 'Mantener codos fijos. Extensión completa.'
    },

    // ==================== EJERCICIOS ADICIONuLES CORE ====================
    {
        id: 'core_hanging_leg_raise',
        name: 'Elevacion de piernas colgado',
        muscleGroup: MUSCLE_GROUPS.CORE,
        equipment: EQUIPMENT.BODYWEIGHT,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 3,
        defaultReps: '15-12',
        techniques: [],
        notes: 'Sin balanceo. Control total.'
    },
    {
        id: 'core_dead_bug',
        name: 'Dead Bug',
        muscleGroup: MUSCLE_GROUPS.CORE,
        equipment: EQUIPMENT.BODYWEIGHT,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '12 c/lado',
        techniques: [],
        notes: 'Mantener espalda baja pegada al suelo.'
    },
    {
        id: 'core_mountain_climbers',
        name: 'Escaladores',
        muscleGroup: MUSCLE_GROUPS.CORE,
        equipment: EQUIPMENT.BODYWEIGHT,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 3,
        defaultReps: '30s',
        techniques: [],
        notes: 'Ritmo rapido. Caderas bajas.'
    },
    {
        id: 'core_pallof_press',
        name: 'Pallof Press',
        muscleGroup: MUSCLE_GROUPS.CORE,
        equipment: EQUIPMENT.CABLE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '12 c/lado',
        techniques: [],
        notes: 'Resistir la rotacion. Core activado.'
    },
    // ==================== COACH ELITE EXERCISES (PRO) ====================
    {
        id: 'coach_shoulders_pec_fly_posterior',
        name: 'Vuelos posteriores en máquina pectorales',
        muscleGroup: MUSCLE_GROUPS.SHOULDERS,
        equipment: EQUIPMENT.MACHINE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 4,
        defaultReps: '15-12',
        techniques: ['dropset'],
        coachSource: true,
        notes: '+ 2 drops al 25% cada uno al fallo. Pecho apoyado.'
    },
    {
        id: 'coach_biceps_hammer_rope_low',
        name: 'Martillo con soga en polea baja',
        muscleGroup: MUSCLE_GROUPS.BICEPS,
        equipment: EQUIPMENT.CABLE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 4,
        defaultReps: '12-10',
        techniques: ['dropset'],
        coachSource: true,
        notes: 'Mantener codos fijos. 1.30 min descanso.'
    },
    {
        id: 'coach_back_v_grip_machine_row',
        name: 'Remo en máquina agarre V',
        muscleGroup: MUSCLE_GROUPS.BACK,
        equipment: EQUIPMENT.MACHINE,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 4,
        defaultReps: '12-10',
        techniques: ['dropset'],
        coachSource: true,
        notes: '+ 2 drops al 25% cada uno al fallo. retracción maxima.'
    },
    {
        id: 'coach_triceps_Extensión_rope_overhead',
        name: 'Extensión triceps tras nuca con soga polea alta',
        muscleGroup: MUSCLE_GROUPS.TRICEPS,
        equipment: EQUIPMENT.CABLE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 4,
        defaultReps: '12-10',
        coachSource: true,
        notes: 'inclinacióncion hacia adelante. Codos cerrados.'
    },
    {
        id: 'coach_legs_bulgarian_db_elite',
        name: 'Sentadilla bulgara con mancuernas (Elite)',
        muscleGroup: MUSCLE_GROUPS.LEGS_QUAD,
        equipment: EQUIPMENT.DUMBBELL,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 3,
        defaultReps: '10-8',
        coachSource: true,
        notes: 'Pie trasero elevado. Enfoque en profundidad y control.'
    },
    {
        id: 'coach_abs_crunch_weighted_neck',
        name: 'ABS Crunch con peso tras nuca',
        muscleGroup: MUSCLE_GROUPS.CORE,
        equipment: EQUIPMENT.DUMBBELL,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '15',
        coachSource: true,
        notes: 'Peso de 5-10kg tras la nuca. Exhalar arriba.'
    },
    {
        id: 'coach_glute_kickback_machine_elite',
        name: 'Patada de gluteos en máquina/polea',
        muscleGroup: MUSCLE_GROUPS.LEGS_HAM,
        equipment: EQUIPMENT.CABLE,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '10-8',
        coachSource: true,
        notes: 'Controlar el regreso. Apretar gluteo 1".'
    },
    {
        id: 'coach_back_lat_pulldown_v_grip',
        name: 'Jalones neutros con agarre V',
        muscleGroup: MUSCLE_GROUPS.BACK,
        equipment: EQUIPMENT.CABLE,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 3,
        defaultReps: '10-8',
        techniques: ['dropset'],
        coachSource: true,
        notes: 'Tirar hacia la parte alta del pecho.'
    },
    {
        id: 'coach_legs_squat_smith_elite',
        name: 'Sentadilla en Smith (Elite)',
        muscleGroup: MUSCLE_GROUPS.LEGS_QUAD,
        equipment: EQUIPMENT.SMITH,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 4,
        defaultReps: '12-10',
        coachSource: true,
        notes: '2x10 calentamiento. Controlar el descenso.'
    },
    {
        id: 'coach_legs_hip_thrust_barbell_elite',
        name: 'Hip Thrust con barra (Elite)',
        muscleGroup: MUSCLE_GROUPS.LEGS_HAM,
        equipment: EQUIPMENT.BARBELL,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 4,
        defaultReps: '12-10',
        coachSource: true,
        notes: 'Apretar gluteo 2" arriba en cada rep.'
    },
    {
        id: 'coach_chest_press_incline_smith_elite',
        name: 'Press inclinacióndo 45Â° en Smith (Elite)',
        muscleGroup: MUSCLE_GROUPS.CHEST,
        equipment: EQUIPMENT.SMITH,
        type: EXERCISE_TYPE.COMPOUND,
        defaultSets: 3,
        defaultReps: '12-10',
        techniques: ['dropset'],
        coachSource: true,
        notes: '+ 2 drops x fallo. Enfoque pectoral superior.'
    },
    {
        id: 'coach_triceps_french_press_db_neutro',
        name: 'Frances tumbado con mancuernas agarre neutro',
        muscleGroup: MUSCLE_GROUPS.TRICEPS,
        equipment: EQUIPMENT.DUMBBELL,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '12-10',
        coachSource: true,
        notes: 'Bajar las mancuernas a los lados de la frente.'
    },
    {
        id: 'coach_biceps_curl_z_bar_preacher',
        name: 'Curl predicador con barra Z (Elite)',
        muscleGroup: MUSCLE_GROUPS.BICEPS,
        equipment: EQUIPMENT.BARBELL,
        type: EXERCISE_TYPE.ISOLATION,
        defaultSets: 3,
        defaultReps: '12-10',
        coachSource: true,
        notes: 'Extender brazo casi completo sin bloquear codos.'
    }
];

/**
 * Obtener ejercicios filtrados por grupo muscular
 */
export const getExercisesByMuscle = (muscleGroup) => {
    return EXERCISES.filter(ex => ex.muscleGroup === muscleGroup);
};

/**
 * Obtener ejercicios filtrados por equipo
 */
export const getExercisesByEquipment = (equipment) => {
    return EXERCISES.filter(ex => ex.equipment === equipment);
};

/**
 * Obtener ejercicios compuestos de un grupo muscular
 */
export const getCompoundExercises = (muscleGroup) => {
    return EXERCISES.filter(ex =>
        ex.muscleGroup === muscleGroup &&
        ex.type === EXERCISE_TYPE.COMPOUND
    );
};

/**
 * Obtener ejercicios de aislamiento de un grupo muscular
 */
export const getIsolationExercises = (muscleGroup) => {
    return EXERCISES.filter(ex =>
        ex.muscleGroup === muscleGroup &&
        ex.type === EXERCISE_TYPE.ISOLATION
    );
};

/**
 * Seleccionar ejercicios aleatorios de un grupo
 */
export const getRandomExercises = (muscleGroup, count, excludeIds = []) => {
    const available = EXERCISES.filter(ex =>
        ex.muscleGroup === muscleGroup &&
        !excludeIds.includes(ex.id)
    );

    // Shuffle y tomar los primeros 'count'
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

/**
 * Obtener ejercicios de core para circuito Abs
 */
export const getAbsCircuit = () => {
    const coreExercises = getExercisesByMuscle(MUSCLE_GROUPS.CORE);
    const shuffled = [...coreExercises].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3); // 3 ejercicios para el circuito
};

export default EXERCISES;


