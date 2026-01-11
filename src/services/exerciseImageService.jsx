/**
 * Exercise Image Service
 * 
 * Proporciona imágenes e íconos SVG para ejercicios.
 * Combina íconos SVG locales con imágenes curadas de Unsplash.
 */

// Mapeo de ejercicios a categorías de imágenes
const EXERCISE_CATEGORIES = {
    // Pecho
    'press banca': 'chest',
    'bench press': 'chest',
    'press inclinado': 'chest',
    'incline press': 'chest',
    'aperturas': 'chest',
    'chest fly': 'chest',
    'flexiones': 'chest',
    'push ups': 'chest',
    'push-ups': 'chest',

    // Espalda
    'dominadas': 'back',
    'pull ups': 'back',
    'pull-ups': 'back',
    'remo': 'back',
    'row': 'back',
    'jalon': 'back',
    'lat pulldown': 'back',
    'peso muerto': 'back',
    'deadlift': 'back',

    // Piernas
    'sentadillas': 'legs',
    'squat': 'legs',
    'squats': 'legs',
    'prensa': 'legs',
    'leg press': 'legs',
    'extensiones': 'legs',
    'leg extension': 'legs',
    'curl femoral': 'legs',
    'leg curl': 'legs',
    'zancadas': 'legs',
    'lunges': 'legs',
    'hip thrust': 'glutes',
    'hip thrusts': 'glutes',

    // Hombros
    'press militar': 'shoulders',
    'shoulder press': 'shoulders',
    'elevaciones laterales': 'shoulders',
    'lateral raise': 'shoulders',
    'elevaciones frontales': 'shoulders',
    'front raise': 'shoulders',
    'face pull': 'shoulders',

    // Brazos
    'curl biceps': 'arms',
    'bicep curl': 'arms',
    'triceps': 'arms',
    'fondos': 'arms',
    'dips': 'arms',
    'extension triceps': 'arms',
    'tricep extension': 'arms',

    // Core
    'abdominales': 'core',
    'crunch': 'core',
    'plancha': 'core',
    'plank': 'core',
};

// Íconos SVG por categoría (inline para performance)
const CATEGORY_ICONS = {
    chest: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 4c-4 0-7 3-7 7v6h14v-6c0-4-3-7-7-7z"/><path d="M9 11h6M12 8v6"/></svg>`,
    back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 12h8M8 16h8"/></svg>`,
    legs: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 4v8l-2 8M16 4v8l2 8M8 12h8"/></svg>`,
    glutes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="14" rx="8" ry="6"/><path d="M12 8v6"/></svg>`,
    shoulders: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 12h16M12 4v16"/><circle cx="12" cy="12" r="3"/></svg>`,
    arms: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 18l4-4 4 4 4-8"/></svg>`,
    core: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="4" width="12" height="16" rx="2"/><path d="M6 10h12M6 14h12"/></svg>`,
    default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 3"/></svg>`,
};

// Imágenes curadas de Unsplash por categoría (URLs optimizadas)
const CATEGORY_IMAGES = {
    chest: [
        'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1597347343908-2937e7dcc560?w=400&h=300&fit=crop',
    ],
    back: [
        'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&h=300&fit=crop',
    ],
    legs: [
        'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop',
    ],
    glutes: [
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    ],
    shoulders: [
        'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400&h=300&fit=crop',
    ],
    arms: [
        'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=300&fit=crop',
    ],
    core: [
        'https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=400&h=300&fit=crop',
    ],
    default: [
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
    ],
};

/**
 * Detecta la categoría de un ejercicio basado en su nombre
 */
function detectCategory(exerciseName) {
    const nameLower = exerciseName.toLowerCase().trim();

    for (const [keyword, category] of Object.entries(EXERCISE_CATEGORIES)) {
        if (nameLower.includes(keyword)) {
            return category;
        }
    }

    return 'default';
}

/**
 * Obtiene el ícono SVG para un ejercicio
 */
export function getExerciseIcon(exerciseName) {
    const category = detectCategory(exerciseName);
    return CATEGORY_ICONS[category] || CATEGORY_ICONS.default;
}

/**
 * Obtiene una imagen para un ejercicio (para vista detallada)
 */
export function getExerciseImage(exerciseName) {
    const category = detectCategory(exerciseName);
    const images = CATEGORY_IMAGES[category] || CATEGORY_IMAGES.default;

    // Seleccionar imagen aleatoria de la categoría
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];
}

/**
 * Componente de ícono de ejercicio reutilizable
 */
export function ExerciseIconSVG({ exerciseName, className = '' }) {
    const svg = getExerciseIcon(exerciseName);

    return (
        <div
            className={`exercise-icon ${className}`}
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}

/**
 * Lista de ejercicios comunes con imágenes específicas
 * Para ejercicios muy populares, usamos imágenes específicas
 */
export const POPULAR_EXERCISES = {
    'press banca': {
        name: 'Press de Banca',
        nameEn: 'Bench Press',
        category: 'chest',
        equipment: 'barbell',
        image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop',
    },
    'sentadillas': {
        name: 'Sentadillas',
        nameEn: 'Squats',
        category: 'legs',
        equipment: 'barbell',
        image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop',
    },
    'peso muerto': {
        name: 'Peso Muerto',
        nameEn: 'Deadlift',
        category: 'back',
        equipment: 'barbell',
        image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&h=300&fit=crop',
    },
    'dominadas': {
        name: 'Dominadas',
        nameEn: 'Pull-ups',
        category: 'back',
        equipment: 'bodyweight',
        image: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400&h=300&fit=crop',
    },
    'press militar': {
        name: 'Press Militar',
        nameEn: 'Shoulder Press',
        category: 'shoulders',
        equipment: 'barbell',
        image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400&h=300&fit=crop',
    },
    'hip thrust': {
        name: 'Hip Thrust',
        nameEn: 'Hip Thrusts',
        category: 'glutes',
        equipment: 'barbell',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    },
    'curl biceps': {
        name: 'Curl de Bíceps',
        nameEn: 'Bicep Curl',
        category: 'arms',
        equipment: 'dumbbell',
        image: 'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=400&h=300&fit=crop',
    },
    'remo': {
        name: 'Remo',
        nameEn: 'Row',
        category: 'back',
        equipment: 'barbell',
        image: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400&h=300&fit=crop',
    },
};

/**
 * Busca un ejercicio popular por nombre
 */
export function findPopularExercise(name) {
    const nameLower = name.toLowerCase().trim();

    for (const [key, exercise] of Object.entries(POPULAR_EXERCISES)) {
        if (nameLower.includes(key) ||
            nameLower.includes(exercise.nameEn.toLowerCase())) {
            return exercise;
        }
    }

    return null;
}

/**
 * Obtiene la mejor imagen disponible para un ejercicio
 * Primero intenta ejercicio popular, luego categoría
 */
export function getBestExerciseImage(exerciseName) {
    // Primero verificar si es ejercicio popular
    const popular = findPopularExercise(exerciseName);
    if (popular) {
        return popular.image;
    }

    // Fallback a imagen de categoría
    return getExerciseImage(exerciseName);
}

export default {
    getExerciseIcon,
    getExerciseImage,
    getBestExerciseImage,
    findPopularExercise,
    POPULAR_EXERCISES,
    CATEGORY_ICONS,
};
