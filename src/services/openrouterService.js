// OpenRouter AI Service - Refactorizado para usar Proxy Seguro en Firebase Functions
// Este servicio ya no contiene prompts ni API Keys expuestas.

const API_BASE = import.meta.env.VITE_FUNCTIONS_URL || '';

/**
 * Función genérica para llamar al Proxy de IA
 */
const callAiProxy = async (action, data) => {
    const { auth } = await import('../config/firebase');
    const token = await auth.currentUser?.getIdToken();

    if (!token) {
        throw new Error('Usuario no autenticado para usar IA');
    }

    const response = await fetch(`${API_BASE}/aiProxy`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, data })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error en el servicio de IA (${response.status})`);
    }

    const result = await response.json();
    return result.result;
};

/**
 * Genera rutinas o dietas (Proxy centralizado)
 */
export const generateWithOpenRouter = async (type, userData) => {
    // Si el tipo es uno de los predefinidos, mapeamos a la acción del backend
    // Si no, usamos el tipo recibido directamente (ej: 'meal_recipe')
    const actionMap = {
        'routine': 'generateRoutine',
        'diet': 'generateDiet'
    };

    const action = actionMap[type] || type;
    return await callAiProxy(action, userData);
};

// También exportamos callAiProxy para máxima flexibilidad
export { callAiProxy };

/**
 * Analiza el progreso del entrenamiento
 */
export const analyzeProgressWithAI = async (progressData) => {
    try {
        return await callAiProxy('analyzeProgress', progressData);
    } catch (error) {
        console.error('[AI Progress] Error via Proxy, using local fallback:', error);
        return generateLocalAnalysis(progressData);
    }
};

/**
 * Calcula macros de un alimento
 */
export const calculateFoodMacros = async (foodDescription) => {
    return await callAiProxy('calculateMacros', { foodDescription });
};

/**
 * Análisis local determinista (Fallback si falla la IA)
 */
export const generateLocalAnalysis = (data) => {
    const { weeklyStats, activeRoutine } = data;
    const workouts = weeklyStats?.workoutsThisWeek || 0;
    const goal = 4;
    const streak = weeklyStats?.streak || 0;

    let score = Math.min(100, Math.round((workouts / goal) * 100));
    if (streak > 2) score += 5;

    const extraActivities = data.extraActivities || [];
    const cardioActivities = extraActivities.filter(a => a.category === 'cardio');

    // Calcular calorías totales de cardio esta semana
    const totalKcal = Math.max(0, cardioActivities.reduce((sum, a) => sum + (Number(a.caloriesBurned) || 0), 0));

    // Meta dinámica: Basada en fisiología real (Calorías y Tiempo Sostenible)
    const currentWeight = parseFloat(data.userProfile?.weight) || 70;
    const targetWeight = parseFloat(data.userProfile?.targetWeight) || currentWeight;
    const weightDiff = Math.max(0, currentWeight - targetWeight);

    // Tasa de pérdida saludable: 0.7% del peso corporal por semana
    const healthyWeeklyLossKg = currentWeight * 0.007;
    // Semanas necesarias (Mínimo 4 para ajustes pequeños, máximo según división saludable)
    const sustainableWeeks = Math.max(8, Math.ceil(weightDiff / Math.max(0.1, healthyWeeklyLossKg)));

    // Calorías totales a perder a través del ejercicio (30% del déficit total estimado)
    let cardioKcalMeta = 1000; // Base de salud mínima

    const userGoal = data.userProfile?.primaryGoal;
    const isFatLoss = Array.isArray(userGoal)
        ? userGoal.includes('fat') || userGoal.includes('weight_loss')
        : (userGoal === 'fat' || userGoal === 'weight_loss');

    if (isFatLoss && weightDiff > 0) {
        const totalKcalToLose = weightDiff * 7700;
        const totalExerciseKcal = totalKcalToLose * 0.3; // 30% vía deporte para conservar metabolismo
        const calculatedKcalPerWeek = Math.round(totalExerciseKcal / sustainableWeeks);

        // Limitar meta semanal (800 kcal min / 4000 kcal max para seguridad y realismo)
        cardioKcalMeta = Math.min(4000, Math.max(800, calculatedKcalPerWeek));
    } else if (isFatLoss) {
        cardioKcalMeta = 1500;
    } else {
        cardioKcalMeta = 800;
    }

    const cardioProgress = cardioKcalMeta > 0 ? Math.min(100, (totalKcal / cardioKcalMeta) * 100) : 0;

    return {
        overallAssessment: workouts === 0
            ? "¡Bienvenido a FitAI! Tu viaje comienza hoy. Haz clic para iniciar tu primer entrenamiento."
            : workouts >= goal
                ? "¡Excelente semana! Has cumplido tu objetivo de frecuencia."
                : `Llevas ${workouts} entrenamientos. Mantén el ritmo y sigue progresando.`,
        activePlanSummary: activeRoutine?.title || "Entrenamiento General",
        progressScore: Math.min(100, score),
        cardioProgress: Math.round(cardioProgress),
        cardioSessions: cardioActivities.length,
        cardioKcal: Math.round(totalKcal),
        cardioGoalKcal: cardioKcalMeta,
        strengths: workouts >= 1 ? ["Constancia semanal iniciada"] : ["Perfil completado", "Listo para el Día 1"],
        areasToImprove: workouts === 0
            ? ["Comenzar rutina", "Registrar peso inicial"]
            : workouts < 3
                ? ["Aumentar frecuencia", "Registrar más pesajes"]
                : ["Mantener intensidad"],
        weeklyGoals: [
            {
                text: workouts === 0 ? "Completar tu primer entrenamiento" : "Mantener la intensidad",
                completed: workouts > 0
            },
            {
                text: workouts === 0 ? "Registrar tus medidas iniciales" : "Registrar todos los entrenamientos",
                completed: workouts > 0
            },
            { text: `Quemar ${cardioKcalMeta} kcal de cardio`, completed: totalKcal >= cardioKcalMeta }
        ],
        motivationalMessage: workouts === 0 ? "El éxito es la suma de pequeños esfuerzos diarios." : "La disciplina vence al talento.",
        recoveryAlert: { needsDeload: false, reason: "", recommendation: "" },
        isFallback: true
    };
};

/**
 * Verifica conexión (Test)
 */
export const testOpenRouterConnection = async () => {
    try {
        const result = await callAiProxy('calculateMacros', { foodDescription: "1 manzana" });
        return { success: true, response: "OK", data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Mantener compatibilidad con funciones de utilidad exportadas si existen
export const getSmartWeightRecommendation = (exerciseName, history) => {
    if (!history || history.length === 0) return { suggested: null, reason: "Sin historial", confidence: 0 };
    const maxWeights = history.slice(0, 4).map(h => h.maxWeight).filter(w => w > 0);
    if (maxWeights.length === 0) return { suggested: null, reason: "Sin datos", confidence: 0 };
    const lastWeight = maxWeights[0];
    return {
        suggested: lastWeight + 2.5,
        reason: "Progresión sugerida",
        confidence: 80,
        trend: 'up'
    };
};
