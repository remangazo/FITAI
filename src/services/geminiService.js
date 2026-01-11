
const MODEL_NAME = "models/gemini-1.5-flash-latest";
const API_BASE = import.meta.env.VITE_FUNCTIONS_URL || '';

/**
 * Genera rutinas o dietas usando el proxy de backend para proteger la API Key
 */
export const generateWithGemini = async (type, userData, language = "es") => {
    try {
        console.log(`[GeminiService] Generando ${type} vía Backend Proxy...`);

        const { auth } = await import('../config/firebase');
        const token = await auth.currentUser?.getIdToken();

        if (!token) {
            throw new Error('Usuario no autenticado');
        }

        const action = type === 'routine' ? 'generateRoutine' : 'generateDiet';

        const response = await fetch(`${API_BASE}/aiProxy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                action,
                data: userData
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error en el servicio de IA');
        }

        const data = await response.json();
        return data.result;

    } catch (error) {
        console.error(`[GeminiService] Error generando ${type}:`, error);
        throw error;
    }
};

/**
 * Analiza una imagen de una rutina (pueden ser apuntes, PDF, screenshot)
 * y devuelve un objeto JSON compatible con el sistema.
 */
/**
 * Analiza una imagen de rutina usando el proxy de backend para ocultar la API Key
 */
export const analyzeRoutineFromImage = async (base64Image) => {
    try {
        console.log('[GeminiService] Analizando imagen vía Backend Proxy...');

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
            body: JSON.stringify({
                action: 'analyzeRoutineFromImage',
                data: { image: base64Image }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error en el servidor de IA');
        }

        const data = await response.json();
        return data.result;

    } catch (error) {
        console.error('[GeminiService] analyzeRoutineFromImage error:', error);
        throw error;
    }
};

// Función para verificar si la API está funcionando
export const testGeminiConnection = async () => {
    if (!genAI) {
        return { success: false, error: "API Key no configurada" };
    }

    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const result = await model.generateContent("Di exactamente: OK");
        const text = await result.response.text();
        return { success: true, model: MODEL_NAME, response: text.trim() };
    } catch (error) {
        return { success: false, error: error.message, model: MODEL_NAME };
    }
};
