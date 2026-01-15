// AI Proxy Handler - Centralizes all AI calls to protect API keys
// This function serves as a secure proxy for OpenRouter/Gemini API calls

const admin = require("firebase-admin");
const axios = require("axios");

const db = admin.firestore();

// Rate limit config per action type
const RATE_LIMITS = {
    generateRoutine: { windowMs: 60000, maxRequests: 3 },
    generateDiet: { windowMs: 60000, maxRequests: 3 },
    calculateMacros: { windowMs: 60000, maxRequests: 20 },
    analyzeProgress: { windowMs: 60000, maxRequests: 5 },
    verifyProof: { windowMs: 60000, maxRequests: 5 },
    analyzeRoutineFromImage: { windowMs: 60000, maxRequests: 10 },
    meal_recipe: { windowMs: 60000, maxRequests: 20 },
};

// Premium Limits (Monthly)
const FREE_TIER_LIMITS = {
    generateRoutine: 3
};

async function checkPremiumLimits(userId, action) {
    if (action !== 'generateRoutine') return { allowed: true };

    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) return { allowed: true }; // Should shouldn't happen, but let pass
    const userData = userDoc.data();

    // If Premium, no limits
    if (userData.isPremium) return { allowed: true, isPremium: true };

    // Check Free Tier Usage
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`; // e.g., "2024-5"

    const usage = userData.usage || {};
    const routinesThisMonth = usage.routinesGenerated?.[currentMonth] || 0;

    const limit = FREE_TIER_LIMITS[action];

    if (routinesThisMonth >= limit) {
        return {
            allowed: false,
            reason: 'PREMIUM_LIMIT_REACHED',
            limit,
            current: routinesThisMonth
        };
    }

    return { allowed: true, isPremium: false, currentMonth, userDocRef, routinesThisMonth };
}

async function incrementUsage(userId, action, promptData) {
    if (action !== 'generateRoutine') return;

    try {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
        const userDocRef = db.collection('users').doc(userId);

        await userDocRef.set({
            usage: {
                routinesGenerated: {
                    [currentMonth]: admin.firestore.FieldValue.increment(1)
                }
            }
        }, { merge: true });
    } catch (e) {
        console.error("Error incrementing usage:", e);
    }
}

// Rate limit state (in-memory)
const requestHistory = new Map();

function checkRateLimit(userId, action) {
    const limit = RATE_LIMITS[action] || { windowMs: 60000, maxRequests: 5 };
    const key = `${userId}:${action}`;
    const now = Date.now();

    if (!requestHistory.has(key)) {
        requestHistory.set(key, []);
    }

    let history = requestHistory.get(key);
    // Filter out old requests
    const windowStart = now - limit.windowMs;
    history = history.filter(timestamp => timestamp > windowStart);

    if (history.length >= limit.maxRequests) {
        return { allowed: false, retryAfter: Math.ceil((history[0] + limit.windowMs - now) / 1000) };
    }

    history.push(now);
    requestHistory.set(key, history);
    return { allowed: true };
}

async function callOpenRouter(prompt, systemPrompt = "Eres un asistente de fitness experto.", imageBase64 = null) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";

    if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY is not configured in environment variables");
    }

    const messages = [
        { role: "system", content: systemPrompt },
        {
            role: "user", content: imageBase64 ? [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: imageBase64 } }
            ] : prompt
        }
    ];

    try {
        const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model: model,
            messages: messages,
            temperature: 0.7,
        }, {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://fitai-personal.web.app",
                "X-Title": "FitAI Personal"
            },
            timeout: 60000
        });

        if (!response.data?.choices?.[0]?.message?.content) {
            console.error("OpenRouter Empty Response:", response.data);
            throw new Error("La IA no devolvió ninguna respuesta válida.");
        }

        const content = response.data.choices[0].message.content;
        console.log(`[AIProxy] Respuesta exitosa de ${model} (${content.length} caracteres)`);
        return content;
    } catch (error) {
        console.error("OpenRouter API Error:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || "Error al conectar con el servicio de IA. Intenta de nuevo.");
    }
}

// Main handler
module.exports = async (req, res) => {
    // CORS headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.status(204).send("");
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    let userId;
    try {
        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        userId = decodedToken.uid;
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }

    const { action, data } = req.body;

    if (!action) {
        return res.status(400).json({ error: "Action is required" });
    }

    // 1. Check Technical Rate Limits (DDOS protection)
    const rateLimitResult = checkRateLimit(userId, action);
    if (!rateLimitResult.allowed) {
        return res.status(429).json({
            error: "Demasiadas solicitudes. Intenta de nuevo más tarde.",
            retryAfter: rateLimitResult.retryAfter
        });
    }

    // 2. Check Business Limits (Freemium)
    try {
        const limitCheck = await checkPremiumLimits(userId, action);
        if (!limitCheck.allowed) {
            return res.status(403).json({
                error: "Límite gratuito alcanzado",
                code: limitCheck.reason,
                limit: limitCheck.limit
            });
        }

        let result;

        switch (action) {
            case "generateRoutine":
                result = await handleGenerateRoutine(data);
                // Increment usage only on success
                await incrementUsage(userId, action, limitCheck);
                break;
            case "generateDiet":
                result = await handleGenerateDiet(data);
                break;
            case "calculateMacros":
                result = await handleCalculateMacros(data);
                break;
            case "analyzeProgress":
                result = await handleAnalyzeProgress(data);
                break;
            case "verifyProof":
                result = await handleVerifyProof(data);
                break;
            case "analyzeRoutineFromImage":
                result = await handleAnalyzeRoutineFromImage(data);
                break;
            case "meal_recipe":
                result = await handleMealRecipe(data);
                break;
            default:
                return res.status(400).json({ error: `Unknown action: ${action}` });
        }

        return res.status(200).json({ success: true, result });
    } catch (error) {
        console.error(`AI Proxy Error [${action}]:`, error);
        return res.status(500).json({ error: error.message });
    }
};

// Action handlers
async function handleGenerateRoutine(userData) {
    const name = userData.name || 'el atleta';
    const goal = userData.primaryGoal || userData.goal || 'fitness general';
    const experience = userData.experienceYears || userData.level || 'principiante';
    const location = userData.trainingLocation || userData.equipment || 'gimnasio';

    // Extraer número de días de forma robusta
    let daysRequested = 5;
    const freqValue = userData.trainingFrequency || userData.frequency || userData.daysPerWeek || "5";
    const freqMatch = String(freqValue).match(/(\d+)/);
    if (freqMatch) {
        daysRequested = parseInt(freqMatch[1]);
    }

    const systemPrompt = `Eres FITAI Master Coach, experto en culturismo profesional y recomposición corporal.
Tu respuesta debe ser ÚNICAMENTE un objeto JSON válido. Sin texto adicional, sin explicaciones, sin bloques de código markdown.

ESTILO PROFESIONAL:
- Series piramidales: "4x12-10-10-8", "3x12-10-8".
- Técnicas de intensidad: Dropsets (+1 drop 50%fallo), Superseries (S/S).
- Nombres de máquinas: "Press inclinado Smith 35°", "Hack Squat", "Remo T", "Prensa 45°", "Polea alta".
- Primer ejercicio de cada día: compuesto con 2x15 de calentamiento.
- Circuito de Core/ABS al final de cada día.
- Entre 6 y 8 ejercicios POR DÍA.

REGLA DE CARDIO:
- Si el objetivo es perder grasa o recomposición, DEBES incluir una sección de cardio específica al final de CADA día (ej. "30 min caminata inclinada", "20 min HIIT en bici").
- El cardio se guarda en el campo "cardio" de cada día.

SPLITS OBLIGATORIOS:
- 5 días: Pecho-Tríceps, Espalda-Bíceps, Hombros, Piernas, Pecho-Hombros-Brazos

REGLA CRÍTICA: Genera TODOS los días solicitados, cada uno con sus propios ejercicios completos. NO generes 1 solo día.`;

    const userPrompt = `Genera un plan de entrenamiento COMPLETO de ${daysRequested} DÍAS para ${name}.
Objetivo: ${goal}. Experiencia: ${experience}. Equipo: ${location}.

IMPORTANTE: El array "days" DEBE contener EXACTAMENTE ${daysRequested} objetos, uno por cada día de entrenamiento.
Cada día debe tener entre 6 y 8 ejercicios con todos sus detalles y la sección de cardio si aplica.

Responde SOLO con JSON válido (sin texto antes ni después):
{
  "title": "Protocolo ${daysRequested} Días - ${name}",
  "description": "Plan profesional de ${daysRequested} días enfocado en ${goal}",
  "daysPerWeek": ${daysRequested},
  "days": [
    {
      "day": "Día 1: Pecho y Tríceps", 
      "focus": "...", 
      "warmup": "...", 
      "exercises": [{"name": "Press inclinado Smith 35°", "sets": 4, "reps": "12-10-10-8", "rest": "90s", "muscleGroup": "Pectoral", "machineName": "Smith Machine", "notes": "..."}], 
      "cardio": "30 min de caminata rápida",
      "stretching": "..."
    }
  ],
  "progression": {"tips": "..."}
}`;

    const response = await callOpenRouter(userPrompt, systemPrompt);

    // Try to parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        let cleanText = jsonMatch[0];
        // Clean trailing commas
        cleanText = cleanText.replace(/,\s*([\]\}])/g, '$1');
        return JSON.parse(cleanText);
    }
    throw new Error("Failed to parse routine from AI response");
}

async function handleGenerateDiet(userData) {
    const weightRaw = parseFloat(userData.weight) || 70;
    const heightRaw = parseFloat(userData.height) || 170;
    const birthYear = userData.birthYear || (new Date().getFullYear() - 25);
    const age = new Date().getFullYear() - parseInt(birthYear);
    const gender = userData.gender || 'Masculino';

    // Simple metabolic calculation
    const weightInKg = userData.weightUnit === 'lb' ? weightRaw * 0.453592 : weightRaw;
    const heightInCm = userData.heightUnit === 'ft' ? heightRaw / 0.032808 : heightRaw;

    let tmb = gender === 'Masculino' ? ((10 * weightInKg) + (6.25 * heightInCm) - (5 * age) + 5) : ((10 * weightInKg) + (6.25 * heightInCm) - (5 * age) - 161);

    let activityFactor = 1.2;
    const freq = (userData.trainingFrequency || '').toLowerCase();
    if (freq.includes('5-6') || freq.includes('diario')) activityFactor = 1.725;
    else if (freq.includes('3-4')) activityFactor = 1.55;
    else if (freq.includes('1-2')) activityFactor = 1.375;

    const tdee = Math.round(tmb * activityFactor);
    let targetCalories = tdee;
    const goal = (userData.primaryGoal || '').toLowerCase();
    if (goal.includes('muscle') || goal.includes('volumen')) targetCalories += 300;
    else if (goal.includes('fat') || goal.includes('perder')) targetCalories -= 500;

    targetCalories = Math.max(1200, Math.min(6000, targetCalories));
    const proteinG = Math.round(weightInKg * 2.0);
    const fatsG = Math.round(weightInKg * 0.9);
    const remainingCals = targetCalories - (proteinG * 4) - (fatsG * 9);
    const carbsG = Math.max(0, Math.round(remainingCals / 4));

    const systemPrompt = `Eres el SIMULADOR DE NUTRICIÓN CLÍNICA DE FITAI. Tu especialidad es la DIETA ARGENTINA DE ALTO RENDIMIENTO.
Tu única función es transformar macros en recetas exactas y realistas. 
NO generes texto genérico. Generas RECETAS DE PRECISIÓN con pesajes exactos.
REGLA DE ORO: Si no incluyes gramos (g) en cada ingrediente de CADA plato, el plan es un fracaso.
Responde SOLAMENTE en formato JSON.`;

    const userPrompt = `Genera un PLAN NUTRICIONAL PROFESIONAL DE 7 DÍAS enfocado en CULTURA ARGENTINA.
    
OBJETIVOS DIARIOS:
- CALORÍAS: ${targetCalories} kcal
- PROTEÍNA: ${proteinG}g
- CARBOHIDRATOS: ${carbsG}g
- GRASAS: ${fatsG}g
- COMIDAS: ${userData.mealsPerDay || 4} comidas diarias.

FORMATO DE SALIDA (JSON PURO):
{
    "title": "Protocolo Argentino: ${targetCalories} kcal",
    "description": "Plan ultra-específico de alto rendimiento.",
    "weeklyPlan": {
        "Lunes": [ { "name": "...", "time": "hh:mm", "description": "- 200g de Lomo\\n- 150g Papas...", "calories": 0, "macros": { "protein": 0, "carbs": 0, "fats": 0 } } ]
    },
    "weeklyMacros": { "calories": ${targetCalories}, "protein": ${proteinG}, "carbs": ${carbsG}, "fats": ${fatsG} },
    "hydration": "Mínimo 3.5 litros diarios.",
    "shoppingList": ["..."],
    "tips": ["..."]
}`;

    const response = await callOpenRouter(userPrompt, systemPrompt);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        let cleanText = jsonMatch[0].replace(/,\s*([\]\}])/g, '$1');
        return JSON.parse(cleanText);
    }
    throw new Error("Failed to parse diet from AI response");
}

async function handleCalculateMacros(data) {
    const prompt = `Calcula los macronutrientes para: "${data.foodDescription}" (Si no hay cantidad, asume porción estándar).
    
Responde SOLO con JSON:
{
  "name": "nombre del alimento",
  "calories": número,
  "protein": número,
  "carbs": número,
  "fats": número,
  "quantity": "cantidad",
  "unit": "unidad"
}`;

    const systemPrompt = "Eres un nutricionista experto. Responde solo con JSON.";
    const response = await callOpenRouter(prompt, systemPrompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0].replace(/,\s*([\]\}])/g, '$1'));
    }
    throw new Error("Failed to calculate macros");
}

async function handleAnalyzeProgress(data) {
    const { weeklyStats = {}, recentWorkouts = [], userProfile = {}, extraActivities = [] } = data;

    const cardioActivities = extraActivities.filter(a => a.category === 'cardio');
    const totalCardioMinutes = cardioActivities.reduce((sum, a) => sum + (Number(a.durationMinutes) || 0), 0);
    const isFatLoss = Array.isArray(userProfile?.primaryGoal)
        ? userProfile.primaryGoal.includes('fat')
        : userProfile?.primaryGoal === 'fat';
    const cardioMeta = isFatLoss ? 180 : 120;

    const systemPrompt = `Eres FITAI Elite Coach. Analiza consistencia y rendimiento.
IMPORTANTE: Menciona ocasionalmente que la carga de datos (entrenamientos, pesos, comidas) es CRÍTICA.
REGLA DE CARDIO: La meta semanal es de ${cardioMeta} minutos de actividad aeróbica. Evalúa el progreso basado en esto.

Responde ÚNICAMENTE con un objeto JSON válido.
{
    "overallAssessment": "Análisis corto",
    "progressScore": 1-100 (basado en pesas + cardio),
    "cardioProgress": 0-100 (según meta de ${cardioMeta}m),
    "strengths": ["..."],
    "areasToImprove": ["..."],
    "weeklyGoals": ["..."]
}`;

    const userPrompt = `Analiza mi progreso:
- Entrenamientos de pesas: ${weeklyStats.workoutsThisWeek || 0} de ${userProfile.trainingFrequency || 3} planeados.
- Minutos de Cardio: ${totalCardioMinutes} de ${cardioMeta} minutos objetivo.
- Objetivo: ${userProfile.primaryGoal || 'Mejora general'}
- Últimos entrenos: ${JSON.stringify(recentWorkouts.slice(0, 3))}`;

    const response = await callOpenRouter(userPrompt, systemPrompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0].replace(/,\s*([\]\}])/g, '$1'));
        // Asegurar que devolvemos el campo cardioProgress calculado por la IA o forzado
        if (result.cardioProgress === undefined) {
            result.cardioProgress = Math.min(100, Math.round((totalCardioMinutes / cardioMeta) * 100));
        }
        return result;
    }
    return { recommendations: response };
}

async function handleVerifyProof(data) {
    const prompt = `¿Es esta imagen una prueba válida de actividad física (${data.activityName || 'entrenamiento'})?
    Analiza la imagen y responde SOLO JSON:
    {
      "verified": boolean,
      "confidence": number (0-1),
      "reason": "explicación"
    }`;

    const systemPrompt = "Eres un verificador de actividad física AI estricto.";

    const response = await callOpenRouter(prompt, systemPrompt, data.image);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    return { verified: response.toLowerCase().includes("true"), confidence: 0.5, reason: "Análisis básico" };
}

async function handleAnalyzeRoutineFromImage(data) {
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
        throw new Error("GROQ_API_KEY no configurada en el servidor.");
    }

    if (!data.image) {
        throw new Error("No se recibió ninguna imagen para analizar.");
    }

    // Limpiar el base64 de prefijos si existen
    const base64Data = data.image.includes('base64,')
        ? data.image.split('base64,')[1]
        : data.image;

    const prompt = `Eres un experto en lectura de rutinas de fitness. Analiza esta imagen y extrae la información de la rutina.

INSTRUCCIONES CRÍTICAS:
1. Lee TODOS los ejercicios visibles en la imagen
2. Si es una tabla con múltiples días (ej: Día 1, Día 2, etc.), organiza por día
3. Si solo lista ejercicios sin días específicos, ponlos todos en un único día llamado "Rutina Completa"
4. Extrae: nombre del ejercicio, series, repeticiones

Tu respuesta DEBE ser SOLO un objeto JSON válido con esta estructura EXACTA:
{
  "title": "nombre descriptivo de la rutina",
  "notes": "objetivos o consejos breves (máx 100 caracteres)",
  "days": [
    {
      "day": "Día 1" o "Pecho" o "Rutina Completa",
      "focus": "grupo muscular principal",
      "exercises": [
        {"name": "Press Banca", "sets": "4", "reps": "8-10", "notes": ""},
        {"name": "Aperturas", "sets": "3", "reps": "12", "notes": ""}
      ]
    }
  ]
}

IMPORTANTE: Responde SOLO con el JSON, sin texto antes ni después, sin markdown.`;

    try {
        console.log(`[AIProxy] Llamando a Groq API (Llama Vision) para análisis de imagen...`);

        // Groq usa la API compatible con OpenAI
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "meta-llama/llama-4-scout-17b-16e-instruct", // Llama 4 Scout Vision (nombre oficial en Groq)
            messages: [
                {
                    role: "system",
                    content: "Eres un asistente que SIEMPRE responde con JSON válido y estructurado. NUNCA añadas texto explicativo fuera del JSON."
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Data}`
                            }
                        }
                    ]
                }
            ],
            temperature: 0.1, // Muy bajo para respuestas más deterministas
            max_tokens: 3000 // Aumentado para rutinas grandes
        }, {
            headers: {
                "Authorization": `Bearer ${groqApiKey}`,
                "Content-Type": "application/json"
            },
            timeout: 30000
        });

        const resultText = response.data.choices[0].message.content;
        console.log("[AIProxy] Respuesta de Groq recibida:", resultText.substring(0, 200));

        // PARSING MÁS ROBUSTO
        let cleanJson = resultText.trim();

        // Remover bloques markdown si existen
        cleanJson = cleanJson.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

        // Buscar el JSON entre llaves
        const firstBrace = cleanJson.indexOf('{');
        const lastBrace = cleanJson.lastIndexOf('}');

        if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
            console.error("[AIProxy] No se encontró JSON válido en la respuesta");
            throw new Error("La IA no devolvió un formato JSON válido. Respuesta recibida: " + cleanJson.substring(0, 500));
        }

        cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);

        // Intentar parsear
        const parsedData = JSON.parse(cleanJson);

        // Validación de estructura
        if (!parsedData.days || !Array.isArray(parsedData.days) || parsedData.days.length === 0) {
            console.error("[AIProxy] JSON parseado pero estructura inválida:", parsedData);
            throw new Error("La estructura del JSON es inválida: falta el array 'days' o está vacío");
        }

        return parsedData;
    } catch (error) {
        console.error("[AIProxy] Error en Groq Vision:", error.response?.data || error.message);
        const detail = error.response?.data?.error?.message || error.message;
        throw new Error(`Error de visión IA (Groq): ${detail}`);
    }
}

async function handleMealRecipe(data) {
    const { customSystemPrompt, customUserPrompt } = data;

    if (!customSystemPrompt || !customUserPrompt) {
        throw new Error("Prompts are required for meal_recipe");
    }

    const response = await callOpenRouter(customUserPrompt, customSystemPrompt);

    // Intentar extraer el JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0].replace(/,\s*([\]\}])/g, '$1'));
    }

    return response;
}
