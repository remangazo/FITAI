import { EXERCISES } from '../data/exercises';

/**
 * Servicio de Mapeo Inteligente de Ejercicios
 * Resuelve discrepancias entre nombres técnicos de rutinas y el catálogo de videos.
 */

// Mapeo manual para casos ambiguos o muy específicos
const MANUAL_MAPPINGS = {
    'fondos en paralelas': 'chest-dips',
    'jalones pronos': 'back-lat-pulldown',
    'prensa 45': 'legs-leg-press',
    'vuelos laterales': 'shoulders-lateral-raise',
    'frontales sentado': 'shoulders-front-raise',
    'extension de triceps': 'triceps-pushdown',
    'martillo': 'biceps-hammer-curl',
    'frances tumbado': 'triceps-skull-crusher',
    'patada de triceps': 'triceps-kickback',
    'sillon de cuadriceps': 'legs-leg-extension',
    'camilla de femorales': 'legs-leg-curl',
    'hip thrust': 'legs-hip-thrust',
    'v-ups': 'core-v-ups',
    'rueda abdominal': 'core-ab-wheel',
    'encogimiento en polea': 'core-cable-crunch',
    'giros rusos': 'core-russian-twist',
    'elevacion de piernas': 'core-leg-raises',
    'plancha': 'core-plank',
    'crunch': 'core-crunches'
};

/**
 * Normaliza un string eliminando acentos, caracteres especiales y términos técnicos sobrantes.
 */
const normalizeText = (text) => {
    if (!text) return '';
    return text.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
        .replace(/[0-9]+ grados/g, '') // Quitar "35 grados", etc.
        .replace(/unilateral|bilateral/g, '')
        .replace(/con mancuernas|con barra|en polea|en smith|en maquina/g, '')
        .replace(/[^a-z0-9 ]/g, '') // Quitar símbolos
        .trim();
};

/**
 * Obtiene la URL del video para un ejercicio dado por nombre.
 */
export const getExerciseVideo = (exerciseName) => {
    if (!exerciseName) return null;

    const normalizedInput = normalizeText(exerciseName);

    // 1. Intentar mapeo manual rápido
    for (const [key, id] of Object.entries(MANUAL_MAPPINGS)) {
        if (normalizedInput.includes(normalizeText(key))) {
            const exercise = EXERCISES.find(ex => ex.id === id);
            if (exercise?.videoUrl) return exercise.videoUrl;
        }
    }

    // 2. Intentar coincidencia exacta en el catálogo (después de normalizar ambos)
    const exactMatch = EXERCISES.find(ex =>
        normalizeText(ex.name) === normalizedInput ||
        normalizedInput.includes(normalizeText(ex.name)) ||
        normalizeText(ex.name).includes(normalizedInput)
    );

    if (exactMatch?.videoUrl) return exactMatch.videoUrl;

    // 3. Fallback: buscar por palabras clave críticas
    const keywords = ['press', 'remo', 'curl', 'extension', 'sentadilla', 'peso muerto', 'aperturas'];
    for (const kw of keywords) {
        if (normalizedInput.includes(kw)) {
            const kwMatch = EXERCISES.find(ex => normalizeText(ex.name).includes(kw));
            if (kwMatch?.videoUrl) return kwMatch.videoUrl;
        }
    }

    return null;
};
