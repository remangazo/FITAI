import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Modelos gratuitos disponibles:
// - models/gemini-1.5-flash-latest: Formato oficial completo
// - gemini-1.5-flash: Alias corto
// - gemini-pro: Modelo base legacy
const MODEL_NAME = "models/gemini-1.5-flash-latest";

export const generateWithGemini = async (type, userData, language = "es") => {
    if (!genAI) {
        throw new Error("VITE_GEMINI_API_KEY no encontrada en el archivo .env");
    }

    // Verificar que la API key no sea placeholder
    if (API_KEY.includes('YOUR_') || API_KEY.length < 20) {
        throw new Error("API Key de Gemini inválida. Obtén una en: https://aistudio.google.com/app/apikey");
    }

    const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
    });

    const generationConfig = {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        // Nota: responseMimeType no es soportado por gemini-pro
    };


    const isMetric = userData.unit === 'kg';
    const weightUnit = isMetric ? 'kg' : 'lb';
    const heightUnit = isMetric ? 'cm' : 'ft';

    let prompt = "";

    if (type === 'routine') {
        prompt = `
        Eres FITAI, el asistente de entrenamiento de élite más avanzado (estilo FitBot). 
        Tu misión es generar una rutina de TRANSFORMACIÓN física total.
        IDIOMA: ${language === 'es' ? 'Español' : 'Inglés'}.

        DATOS DEL USUARIO:
        - Objetivo: ${userData.goal} (Maximizar eficiencia para este fin)
        - Nivel: ${userData.level}
        - Peso: ${userData.weight} ${weightUnit}
        - Altura: ${userData.height} ${heightUnit}
        - Frecuencia: 4 días por semana.

        REQUERIMIENTOS TÉCNICOS:
        1. Estructura Pro: Calentamiento Dinámico -> Bloque Principal -> Finisher -> Estiramientos.
        2. Ejercicios: Incluye nombres técnicos. Especifica carga sugerida y RPE (esfuerzo percibido).
        3. Progresión: Explica cómo aumentar la intensidad cada semana (sobrecarga progresiva).

        FORMATO JSON OBLIGATORIO:
        {
            "title": "Nombre de la Rutina Elite",
            "description": "Explicación técnica de por qué este plan funcionará para el objetivo del usuario.",
            "daysPerWeek": 4,
            "estimatedDuration": "50-70 min",
            "days": [
                {
                    "day": "Día 1",
                    "focus": "Grupo muscular y tipo de estímulo",
                    "warmup": "3-4 ejercicios de movilidad y activación cognitiva",
                    "exercises": [
                        { "name": "Ejercicio", "sets": 4, "reps": "8-12", "rest": "90s", "notes": "Foco en la fase excéntrica (3 seg)", "muscleGroup": "Pectoral" }
                    ],
                    "stretching": "3 estiramientos clave para la recuperación"
                }
            ],
            "progression": {
                "week1_2": "Fase de adaptación y técnica",
                "week3_4": "Fase de máxima intensidad y volumen acumulado",
                "tips": "Consejos sobre sueño y recuperación"
            },
            "nutrition_tip": "Estrategia de suplementación o macronutrientes para estos entrenos."
        }`;
    } else {
        prompt = `
        Eres el Nutricionista Jefe de FITAI. Genera un plan de alimentación maestría.
        IDIOMA: ${language === 'es' ? 'Español' : 'Inglés'}.
        CULTURA: ${userData.culture || 'Argentina'}.

        DATOS DEL USUARIO:
        - Objetivo: ${userData.goal}
        - Peso: ${userData.weight} ${weightUnit}
        - Altura: ${userData.height} ${heightUnit}
        - Edad: ${userData.age} años.

        REQUERIMIENTOS NUTRICIONALES:
        1. Cálculo real de macros adaptado al objetivo (Déficit, Superávit o Mantenimiento).
        2. Sabores Locales: Si es Argentina, incluye opciones como bife de lomo, ensaladas completas, fruta de estación y mate.
        3. Flexibilidad: Provee un sustituto inteligente para cada comida principal.

        FORMATO JSON OBLIGATORIO:
        {
            "title": "Plan de Nutrición Inteligente",
            "description": "Análisis nutricional basado en los datos del atleta.",
            "targetCalories": 2400,
            "macros": { "protein": 180, "carbs": 250, "fats": 70, "fiber": 30 },
            "hydration": "3 litros diarios + 500ml durante entreno",
            "meals": [
                { 
                    "name": "Desayuno", 
                    "time": "08:00", 
                    "description": "Descripción gourmet y nutritiva", 
                    "calories": 500,
                    "macros": { "protein": 30, "carbs": 60, "fats": 15 },
                    "isLocal": true,
                    "substitute": "Opción rápida para días con poco tiempo"
                }
            ],
            "shoppingList": ["Item 1", "Item 2", "Item 3"],
            "tips": ["Tip sobre el índice glucémico", "Tip sobre el cortisol matutino"]
        }`;
    }


    try {
        console.log(`[FITAI] Generando ${type} con modelo ${MODEL_NAME}...`);

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig
        });
        const response = await result.response;
        const text = response.text();

        console.log(`[FITAI] Respuesta recibida exitosamente`);
        return JSON.parse(text);
    } catch (error) {
        console.error("[FITAI] Error llamando a Gemini:", error);

        // Mensajes de error más claros
        if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('401')) {
            throw new Error("API Key inválida. Verifica tu VITE_GEMINI_API_KEY en el archivo .env");
        }
        if (error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('429')) {
            throw new Error("Límite de cuota excedido. Espera unos minutos o usa una API key diferente.");
        }
        if (error.message?.includes('NOT_FOUND') || error.message?.includes('404')) {
            throw new Error(`Modelo ${MODEL_NAME} no disponible. Prueba con otro modelo.`);
        }
        if (error.message?.includes('PERMISSION_DENIED') || error.message?.includes('403')) {
            throw new Error("Acceso denegado. Verifica que tu API key tenga permisos para usar la API de Gemini.");
        }

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
