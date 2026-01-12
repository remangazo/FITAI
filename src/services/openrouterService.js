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
 * Genera rutinas o dietas
 */
export const generateWithOpenRouter = async (type, userData) => {
    const action = type === 'routine' ? 'generateRoutine' : 'generateDiet';
    return await callAiProxy(action, userData);
};

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

    return {
        overallAssessment: workouts >= goal
            ? "¡Excelente semana! Has cumplido tu objetivo de frecuencia."
            : `Llevas ${workouts} entrenamientos. Mantén el ritmo.`,
        activePlanSummary: activeRoutine?.title || "Entrenamiento General",
        progressScore: Math.min(100, score),
        strengths: workouts >= 1 ? ["Constancia semanal iniciada"] : ["Primeros pasos"],
        areasToImprove: workouts < 3 ? ["Aumentar frecuencia"] : ["Mantener intensidad"],
        weeklyGoals: [{ text: "Mantener la intensidad", completed: workouts >= goal }],
        motivationalMessage: "La disciplina vence al talento.",
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
