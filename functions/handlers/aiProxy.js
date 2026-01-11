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

        return response.data.choices[0].message.content;
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
    // Robust field mapping
    const gender = userData.gender || 'atleta';
    const age = userData.age || (userData.birthYear ? (new Date().getFullYear() - parseInt(userData.birthYear)) : 30);
    const weight = userData.weight || 75;
    const height = userData.height || 175;
    const goal = userData.goal || userData.primaryGoal || 'fitness general';
    const level = userData.experienceYears || userData.level || 'principiante';
    const days = userData.daysPerWeek || userData.trainingFrequency || 3;
    const equipment = userData.equipment || userData.availableEquipment || ['mancuernas', 'barra'];

    const prompt = `Genera una rutina de entrenamiento personalizada en formato JSON.
    
Usuario:
- Género: ${gender}
- Edad: ${age} años
- Peso: ${weight} kg
- Altura: ${height} cm
- Objetivo: ${goal}
- Nivel: ${level}
- Días por semana: ${days}
- Equipamiento: ${Array.isArray(equipment) ? equipment.join(', ') : equipment}

Responde SOLO con JSON válido, sin markdown, siguiendo esta estructura exacta:
{
  "title": "Nombre de la Rutina",
  "description": "Breve descripción",
  "days": [
    {
      "day": "Día 1",
      "focus": "Pecho y Tríceps",
      "exercises": [
        { "name": "Press de Banca", "sets": 3, "reps": "10", "rest": "60s" }
      ]
    }
  ]
}`;

    const systemPrompt = "Eres un entrenador personal experto. Responde solo con JSON válido.";
    const response = await callOpenRouter(prompt, systemPrompt);

    // Try to parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Failed to parse routine from AI response");
}

async function handleGenerateDiet(userData) {
    const calories = userData.targetCalories || userData.bmr || 2000;
    const goal = userData.goal || userData.primaryGoal || 'mantenimiento';
    const protein = userData.macros?.protein || 150;
    const carbs = userData.macros?.carbs || 200;
    const fats = userData.macros?.fats || 65;

    const prompt = `Genera un plan de comidas diario en formato JSON para un día completo (desayuno, almuerzo, merienda, cena).
    
Usuario:
- Calorías objetivo: ${calories} kcal
- Objetivo: ${goal}
- Macronutrientes sugeridos: Proteína ${protein}g, Carbohidratos ${carbs}g, Grasas ${fats}g

Responde SOLO con JSON válido, sin markdown.`;

    const systemPrompt = "Eres un nutricionista experto. Responde solo con JSON válido.";
    const response = await callOpenRouter(prompt, systemPrompt);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Failed to parse diet from AI response");
}

async function handleCalculateMacros(data) {
    const prompt = `Calcula los macronutrientes para: "${data.foodDescription}"

Responde SOLO con JSON:
{
  "name": "nombre del alimento",
  "calories": número,
  "protein": número en gramos,
  "carbs": número en gramos,
  "fats": número en gramos,
  "quantity": cantidad,
  "unit": "unidad (g, ml, unidad, etc)"
}`;

    const response = await callOpenRouter(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Failed to calculate macros");
}

async function handleAnalyzeProgress(data) {
    const prompt = `Analiza el progreso de entrenamiento y da recomendaciones.
    
Datos: ${JSON.stringify(data)}

Responde con recomendaciones personalizadas.`;

    const response = await callOpenRouter(prompt);
    return { recommendations: response };
}

async function handleVerifyProof(data) {
    const prompt = `Verifica si esta imagen es una prueba válida de actividad física o ejercicio. 
    Contexto: El usuario dice que esto es "${data.activityName || 'un entrenamiento'}".
    
    Analiza la imagen y responde SOLO con un JSON:
    {
      "verified": boolean,
      "confidence": number (0-1),
      "reason": "breve explicación de por qué sí o no"
    }
    
    Si la imagen no es clara, es de baja calidad, o no parece relacionada con fitness, marca verified: false.`;

    const systemPrompt = "Eres un verificador de actividad física AI. Eres estricto pero justo.";

    // data.image must be a base64 string including data URI scheme e.g. "data:image/jpeg;base64,..."
    const response = await callOpenRouter(prompt, systemPrompt, data.image);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    // Fallback if no JSON
    if (response.toLowerCase().includes("true") || response.toLowerCase().includes("verified")) {
        return { verified: true, confidence: 0.8, reason: "Verificado por análisis de texto (fallback)." };
    }

    return { verified: false, confidence: 0, reason: "No se pudo analizar la respuesta de la IA." };
}

async function handleAnalyzeRoutineFromImage(data) {
    const prompt = `Analiza esta imagen de una rutina de entrenamiento y extrae la información en formato JSON.
    
    Busca:
    1. Un título sugerido para la rutina.
    2. Una descripción breve.
    3. Los días de entrenamiento.
    4. Los ejercicios con sus series (sets), repeticiones (reps) y descanso (rest).
    
    Responde SOLO con un JSON válido siguiendo esta estructura:
    {
      "name": "Título de la rutina",
      "description": "Descripción breve",
      "days": [
        {
          "day": "Día (ej: Lunes o Día 1)",
          "focus": "Enfoque (ej: Piernas)",
          "exercises": [
            { "name": "Ejercicio", "sets": 4, "reps": "12", "rest": "60s" }
          ]
        }
      ],
      "notes": "Cualquier información adicional encontrada que no encaje en la estructura"
    }
    
    Si la imagen no es una rutina, devuelve un objeto indicando error.`;

    const systemPrompt = "Eres un experto en lectura de rutinas de fitness. Extraes datos con precisión milimétrica.";

    // data.image must be a base64 string
    const response = await callOpenRouter(prompt, systemPrompt, data.image);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No se pudo extraer el JSON de la respuesta de la IA.");
}
