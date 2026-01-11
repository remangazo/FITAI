// OpenRouter AI Service - Generación de rutinas y dietas con modelos gratuitos
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";

export const generateWithOpenRouter = async (type, userData, language = "es") => {
    if (!OPENROUTER_API_KEY) {
        throw new Error("VITE_OPENROUTER_API_KEY no encontrada en el archivo .env");
    }

    // Verificar que la API key no sea placeholder
    if (OPENROUTER_API_KEY.includes('YOUR_') || OPENROUTER_API_KEY.length < 20) {
        throw new Error("API Key de OpenRouter inválida. Obtén una en: https://openrouter.ai/keys");
    }

    const isMetric = userData.unit === 'kg';
    const weightUnit = isMetric ? 'kg' : 'lb';
    const heightUnit = isMetric ? 'cm' : 'ft';

    let systemPrompt = "";
    let userPrompt = "";

    if (type === 'routine') {
        // Calcular edad
        const age = userData.birthYear ? new Date().getFullYear() - parseInt(userData.birthYear) : 'No especificado';

        // Extraer número de días de forma robusta
        let daysRequested = 5;
        const freqValue = userData.trainingFrequency || userData.frequency || "5";
        const freqMatch = String(freqValue).match(/(\d+)/);
        if (freqMatch) {
            daysRequested = parseInt(freqMatch[1]);
        }

        systemPrompt = `Eres FITAI Master Coach, experto en culturismo profesional.
Tu respuesta debe ser ÚNICAMENTE un objeto JSON válido. Sin texto adicional, sin explicaciones, sin bloques de código markdown.

ESTILO PROFESIONAL:
- Series piramidales: "4x12-10-10-8", "3x12-10-8".
- Técnicas de intensidad: Dropsets (+1 drop 50%fallo), Superseries (S/S).
- Nombres de máquinas: "Press inclinado Smith 35°", "Hack Squat", "Remo T", "Prensa 45°", "Polea alta".
- Primer ejercicio de cada día: compuesto con 2x15 de calentamiento.
- Circuito de Core/ABS al final de cada día.
- Entre 6 y 8 ejercicios POR DÍA.

SPLITS OBLIGATORIOS:
- 5 días: Pecho-Tríceps, Espalda-Bíceps, Hombros, Piernas, Pecho-Hombros-Brazos

REGLA CRÍTICA: Genera TODOS los días solicitados, cada uno con sus propios ejercicios completos. NO generes 1 solo día.`;

        userPrompt = `Genera un plan de entrenamiento COMPLETO de ${daysRequested} DÍAS para ${userData.name || 'el atleta'}.
Objetivo: ${userData.primaryGoal}. Experiencia: ${userData.experienceYears}. Equipo: ${userData.trainingLocation}.

IMPORTANTE: El array "days" DEBE contener EXACTAMENTE ${daysRequested} objetos, uno por cada día de entrenamiento.
Cada día debe tener entre 6 y 8 ejercicios con todos sus detalles.

Responde SOLO con JSON válido (sin texto antes ni después):
{
  "title": "Protocolo ${daysRequested} Días - ${userData.name || 'Elite'}",
  "description": "Plan profesional de ${daysRequested} días enfocado en ${userData.primaryGoal}",
  "daysPerWeek": ${daysRequested},
  "days": [
    {"day": "Día 1: Pecho y Tríceps", "focus": "...", "warmup": "...", "exercises": [{"name": "Press inclinado Smith 35°", "sets": 4, "reps": "12-10-10-8", "rest": "90s", "muscleGroup": "Pectoral", "machineName": "Smith Machine", "notes": "..."}], "stretching": "..."},
    {"day": "Día 2: Espalda y Bíceps", "focus": "...", "warmup": "...", "exercises": [...], "stretching": "..."},
    {"day": "Día 3: Hombros", "focus": "...", "warmup": "...", "exercises": [...], "stretching": "..."},
    {"day": "Día 4: Piernas", "focus": "...", "warmup": "...", "exercises": [...], "stretching": "..."},
    {"day": "Día 5: Pecho-Hombros-Brazos", "focus": "...", "warmup": "...", "exercises": [...], "stretching": "..."}
  ],
  "progression": {"tips": "..."}
}

RECUERDA: Genera los ${daysRequested} días COMPLETOS con 6-8 ejercicios reales cada uno.`;
    } else {
        // Detección robusta de unidades (Incluso si no vienen en el perfil)
        // Si el peso es > 30 y la altura > 100, es casi seguro que es Métrico (kg/cm)
        const weightRaw = parseFloat(userData.weight) || 70;
        const heightRaw = parseFloat(userData.height) || 170;
        const isMetricHard = (weightRaw > 35 && heightRaw > 80) || userData.weightUnit === 'kg' || userData.heightUnit === 'cm';
        const age = userData.birthYear ? new Date().getFullYear() - parseInt(userData.birthYear) : 25;

        const weightInKg = isMetricHard ? weightRaw : weightRaw * 0.453592;
        const heightInCm = isMetricHard ? heightRaw : heightRaw / 0.032808; // Ft to cm if not metric

        console.log(`[Metabolic Debug] HardMetric: ${isMetricHard}, Kg: ${weightInKg}, Cm: ${heightInCm}`);

        // Fórmula Mifflin-St Jeor
        let tmb = 0;
        if (userData.gender === 'Masculino' || userData.gender === 'Male') {
            tmb = (10 * weightInKg) + (6.25 * heightInCm) - (5 * age) + 5;
        } else {
            tmb = (10 * weightInKg) + (6.25 * heightInCm) - (5 * age) - 161;
        }

        // Factor de actividad basado en frecuencia de entrenamiento
        let activityFactor = 1.2;
        const freq = (userData.trainingFrequency || '').toLowerCase();
        if (freq.includes('5-6') || freq.includes('diario') || freq.includes('daily')) {
            activityFactor = 1.725;
        } else if (freq.includes('3-4')) {
            activityFactor = 1.55;
        } else if (freq.includes('1-2')) {
            activityFactor = 1.375;
        }

        const tdee = Math.round(tmb * activityFactor);
        let targetCalories = tdee;
        const goal = (userData.primaryGoal || '').toLowerCase();
        if (goal.includes('muscle') || goal.includes('gain') || goal.includes('volumen') || goal.includes('masa')) {
            targetCalories = Math.round(tdee + 300);
        } else if (goal.includes('fat') || goal.includes('loss') || goal.includes('cut') || goal.includes('perder') || goal.includes('grasa')) {
            targetCalories = Math.round(tdee - 500);
        }

        // VALIDACIÓN DE SEGURIDAD: Prevenir desbordamientos (mínimo 1200, máximo 6000)
        targetCalories = Math.max(1200, Math.min(6000, targetCalories));
        // Distribución de Macros
        const proteinG = Math.round(weightInKg * 2.0);
        const fatsG = Math.round(weightInKg * 0.9);
        const remainingCals = targetCalories - (proteinG * 4) - (fatsG * 9);
        const carbsG = Math.max(0, Math.round(remainingCals / 4));

        systemPrompt = `Eres el SIMULADOR DE NUTRICIÓN CLÍNICA DE FITAI. Tu especialidad es la DIETA ARGENTINA DE ALTO RENDIMIENTO.
Tu única función es transformar macros en recetas exactas y realistas. 
NO generes texto genérico. Generas RECETAS DE PRECISIÓN con pesajes exactos.
REGLA DE ORO: Si no incluyes gramos (g) en cada ingrediente de CADA plato, el plan es un fracaso.
Responde SOLAMENTE en formato JSON.`;

        userPrompt = `Genera un PLAN NUTRICIONAL PROFESIONAL DE 7 DÍAS enfocado en CULTURA ARGENTINA (carnes magras, asado, huevos).

OBJETIVOS DIARIOS (OBLIGATORIO PARA CADA UNO DE LOS 7 DÍAS):
- CALORÍAS: ${targetCalories} kcal (+/- 50)
- PROTEÍNA: ${proteinG}g (+/- 5)
- CARBOHIDRATOS: ${carbsG}g
- GRASAS: ${fatsG}g
- COMIDAS: EXACTAMENTE ${userData.mealsPerDay || 4} comidas cada día (Sin excepciones).

REQUERIMIENTOS DE CONSISTENCIA Y DETALLE:
1. **Cero Generalización**: Todos los días (Lunes a Domingo) deben tener el mismo nivel de detalle quirúrgico.
2. **Ingredientes en Gramos**: Cada comida debe listar ingredientes con pesos exactos.
   Ejemplo de descripción de comida: 
   "- 250g de Bife de Chorizo a la plancha (magro)\\n- 150g de Puré de calabaza\\n- 100g de Ensalada mixta (lechuga y tomate)\\n- 10g de Aceite de oliva"
3. **Perfil Argentino**: Predominancia de proteínas animales (vaca, pollo, huevos) ajustadas a los macros de ${targetCalories} kcal.
4. **Cumplimiento de Comidas**: Si pido ${userData.mealsPerDay || 4} comidas, genera ${userData.mealsPerDay || 4} para cada uno de los 7 días.

FORMATO DE SALIDA (JSON PURO):
{
    "title": "Protocolo Argentino de Precisión: ${targetCalories} kcal",
    "description": "Plan ultra-específico de alto rendimiento con foco en carnes magras y macros exactos.",
    "weeklyPlan": {
        "Lunes": [ { "name": "Nombre Plato", "time": "hh:mm", "description": "- [peso] [ingrediente]\\n- [peso] [ingrediente]...", "calories": 0, "macros": { "protein": 0, "carbs": 0, "fats": 0 } } ],
        "Martes": [ ... ],
        "Miércoles": [ ... ],
        "Jueves": [ ... ],
        "Viernes": [ ... ],
        "Sábado": [ ... ],
        "Domingo": [ ... ]
    },
    "weeklyMacros": { "calories": ${targetCalories}, "protein": ${proteinG}, "carbs": ${carbsG}, "fats": ${fatsG} },
    "hydration": "Mínimo 3.5 litros de agua diarios.",
    "shoppingList": ["Lista de compras agregada por pesos totales"],
    "tips": ["Consejo Elite Argentino 1", "Consejo Elite 2", "Consejo Elite 3"]
}

IMPORTANTE: Revisa dos veces que el total de macros de las comidas de cada día sume aproximadamente los objetivos diarios.`;
    }

    try {
        console.log(`[FITAI OpenRouter] Generando ${type} con modelo ${OPENROUTER_MODEL}...`);

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin || 'http://localhost:5173',
                'X-Title': 'FitAI Personal'
            },
            body: JSON.stringify({
                model: OPENROUTER_MODEL,
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: userPrompt
                    }
                ],
                temperature: 0.2, // Temperatura baja para respuestas más deterministas y consistentes
                max_tokens: 4096
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const text = data.choices[0]?.message?.content || "";

        if (!text) {
            throw new Error("El sistema AI devolvió una respuesta vacía. Por favor, reintenta.");
        }

        console.log(`[FITAI OpenRouter] Respuesta recibida, longitud: ${text.length}`);

        // Robust JSON Cleaning
        let cleanText = text.trim();

        // 1. Eliminar bloques de código markdown si existen
        if (cleanText.includes('```')) {
            const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (match) cleanText = match[1];
        }

        // 2. Encontrar los límites reales del objeto JSON (de forma segura)
        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleanText = cleanText.substring(firstBrace, lastBrace + 1);
        }

        // 3. Limpieza de "Trailing Commas" (Comas al final de un array u objeto que rompen JSON.parse)
        // Este regex busca una coma seguida de un cierre de llave o corchete (posiblemente con espacios)
        cleanText = cleanText.replace(/,\s*([\]}])/g, '$1');

        try {
            return JSON.parse(cleanText);
        } catch (e) {
            console.error('[FITAI OpenRouter] JSON Parse Failure. Error:', e.message);
            console.error('[FITAI OpenRouter] Text Snippet:', cleanText.substring(0, 500));
            const entityName = type === 'routine' ? 'entrenador' : 'nutricionista';
            throw new Error(`El ${entityName} AI cometió un error de formato. Por favor, reintenta (la IA a veces falla en la estructura técnica compleja).`);
        }
    } catch (error) {
        console.error("[FITAI OpenRouter] Error:", error);

        // Mensajes de error más claros
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
            throw new Error("API Key de OpenRouter inválida. Verifica tu VITE_OPENROUTER_API_KEY");
        }
        if (error.message?.includes('429') || error.message?.includes('rate limit')) {
            throw new Error("Límite de cuota excedido. Espera unos minutos o usa otro modelo.");
        }
        if (error.message?.includes('404')) {
            throw new Error(`Modelo ${OPENROUTER_MODEL} no disponible. Usa otro modelo gratuito.`);
        }

        throw error;
    }
};

// Función para verificar si la API está funcionando
export const testOpenRouterConnection = async () => {
    if (!OPENROUTER_API_KEY) {
        return { success: false, error: "API Key no configurada" };
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin || 'http://localhost:5173',
                'X-Title': 'FitAI Personal'
            },
            body: JSON.stringify({
                model: OPENROUTER_MODEL,
                messages: [
                    { role: "user", content: "Di exactamente: OK" }
                ]
            })
        });

        if (response.ok) {
            const data = await response.json();
            const text = data.choices[0].message.content;
            return { success: true, model: OPENROUTER_MODEL, response: text.trim() };
        } else {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.error?.message || response.statusText, model: OPENROUTER_MODEL };
        }
    } catch (error) {
        return { success: false, error: error.message, model: OPENROUTER_MODEL };
    }
};

/**
 * Analyze workout progress and generate AI recommendations
 * @param {Object} progressData - User's workout history and stats
 * @param {string} language - Language for response (es/en)
 * @returns {Object} - AI recommendations
 */
/**
 * Generates valid analysis object locally when AI fails using heuristics
 */
export const generateLocalAnalysis = (data) => {
    const { weeklyStats, userProfile, activeRoutine } = data;
    const workouts = weeklyStats?.workoutsThisWeek || 0;
    const goal = 4; // Default goal
    const volume = (weeklyStats?.totalVolume || 0) / 1000;
    const streak = weeklyStats?.streak || 0;

    // Calculate score based on consistency
    let score = Math.min(100, Math.round((workouts / goal) * 100));
    if (streak > 2) score += 5;
    score = Math.min(100, score);

    // Dynamic Strengths
    const strengths = [];
    if (workouts >= 1) strengths.push("Constancia semanal iniciada");
    if (streak > 2) strengths.push(`Racha de ${streak} días`);
    if (volume > 5) strengths.push(`Buen volumen (${volume.toFixed(0)}k kg)`);
    if (strengths.length === 0) strengths.push("Primeros pasos dados");

    // Dynamic Areas to Improve
    const areas = [];
    if (workouts < 3) areas.push("Aumentar frecuencia");
    if (!weeklyStats?.totalVolume) areas.push("Registrar pesos en ejercicios");
    if (areas.length === 0) areas.push("Mantener intensidad");

    // Dynamic Goals
    const weeklyGoals = [];

    if (workouts < goal) {
        weeklyGoals.push({ text: `Completar ${goal - workouts} entreno${goal - workouts > 1 ? 's' : ''} más`, completed: false });
    } else {
        weeklyGoals.push({ text: "Mantener la intensidad", completed: true });
    }

    weeklyGoals.push({ text: "Dormir 7-8 horas", completed: false });

    return {
        overallAssessment: workouts >= goal
            ? "¡Excelente semana! Has cumplido tu objetivo de frecuencia."
            : `Llevas ${workouts} entrenamientos. Mantén el ritmo para llegar a tu meta.`,
        activePlanSummary: activeRoutine?.title || "Entrenamiento General",
        progressScore: score,
        strengths: strengths.slice(0, 2),
        areasToImprove: areas.slice(0, 2),
        weeklyGoals: weeklyGoals,
        weightRecommendations: [],
        motivationalMessage: workouts > 2 ? "¡Estás imparable!" : "La disciplina vence al talento.",
        recoveryAlert: { needsDeload: false, reason: "", recommendation: "" },
        isFallback: false // We treat this as valid data so it caches
    };
};

export const analyzeProgressWithAI = async (progressData, language = "es") => {
    if (!OPENROUTER_API_KEY) {
        throw new Error("VITE_OPENROUTER_API_KEY no encontrada");
    }

    const {
        weeklyStats = {},
        recentWorkouts = [],
        personalRecords = {},
        userProfile = {},
        activeRoutine = null,
        extraActivities = []
    } = progressData;

    // Prepare exercise progress summary
    const exerciseSummary = recentWorkouts.slice(0, 5).map(w => ({
        date: w.startTime,
        day: w.dayName,
        duration: w.duration,
        volume: w.totalVolume,
        exercises: w.exercises?.map(e => ({
            name: e.name,
            maxWeight: e.sets?.length > 0 ? Math.max(...e.sets.map(s => s.weight || 0)) : 0,
            totalSets: e.sets?.length || 0
        }))
    }));

    // Format extra activities
    const extraInfo = extraActivities.length > 0
        ? extraActivities.map(a => `- ${a.name}: ${a.durationMinutes} min (${a.caloriesBurned} kcal)`).join('\n')
        : 'Sin actividades extra registradas';

    // Format PRs for prompt
    const prList = Object.entries(personalRecords)
        .slice(0, 10)
        .map(([name, pr]) => `${name}: ${pr.weight}kg × ${pr.reps}`)
        .join('\n');

    const systemPrompt = `Eres FITAI Elite Coach. Tu rol es analizar datos de entrenamiento y dar recomendaciones precisas.
    REGLA DE ORO: Responde ÚNICAMENTE con un objeto JSON válido. NO uses bloques de código markdown.

    ESTRUCTURA JSON REQUERIDA:
    {
        "overallAssessment": "Análisis corto (1-2 frases) de la consistencia y rendimiento",
        "progressScore": número 1-100,
        "activePlanSummary": "Resumen fase actual",
        "strengths": ["Logro 1", "Logro 2"],
        "areasToImprove": ["Mejora 1"],
        "weightRecommendations": [{"exercise": "Nombre", "currentWeight": 0, "recommendedWeight": 0, "reason": ""}],
        "recoveryAlert": {"needsDeload": false, "reason": "", "recommendation": ""},
        "weeklyGoals": ["Meta 1", "Meta 2"],
        "motivationalMessage": "Frase corta"
    }`;

    const userPrompt = `Analiza mi progreso en ${language === 'es' ? 'ESPAÑOL' : 'INGLÉS'}:

    📊 ESTADÍSTICAS:
    - Entrenamientos esta semana: ${weeklyStats.workoutsThisWeek || 0}
    - Volumen total estimado: ${((weeklyStats.totalVolume || 0) / 1000).toFixed(1)}k kg
    - Actividades Extra: ${extraInfo}

    🏋️ ÚLTIMOS RESULTADOS:
    ${JSON.stringify(exerciseSummary, null, 2)}

    🏆 RÉCORDS:
    ${prList || 'Sin récords registrados aún'}

    🎯 OBJETIVO: ${userProfile.primaryGoal || 'Desarrollo muscular'} (${userProfile.trainingFrequency || '4 días'})

    Responde con el JSON solicitado (solo el objeto, sin texto extra):`;


    try {
        console.log('[AI Progress] Analyzing progress...');

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin || 'http://localhost:5173',
                'X-Title': 'FitAI Personal'
            },
            body: JSON.stringify({
                model: OPENROUTER_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.5,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            // If API fails, fallback to local analysis immediately
            console.warn('[AI Progress] API Error, using local fallback:', errorData);
            return generateLocalAnalysis(progressData);
        }

        const data = await response.json();
        const text = data.choices[0].message.content || "";
        console.log('[AI Progress] Response received');

        // Clean and parse JSON
        let cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) cleanedText = jsonMatch[0];

        try {
            const parsed = JSON.parse(cleanedText);
            return { ...parsed, isFallback: false };
        } catch (e) {
            // Second level cleanup for common AI mistakes
            const secondPass = cleanedText.replace(/,\s*([\]\}])/g, '$1');
            const parsed = JSON.parse(secondPass);
            return { ...parsed, isFallback: false };
        }

    } catch (error) {
        console.error('[AI Progress] Analysis Error:', error);
        // Fallback to local deterministic analysis
        return generateLocalAnalysis(progressData);
    }
};

/**
 * Get quick weight recommendation for a specific exercise
 * @param {string} exerciseName - Name of the exercise
 * @param {Array} history - Exercise history data
 * @returns {Object} - Weight recommendation
 */
export const getSmartWeightRecommendation = (exerciseName, history) => {
    if (!history || history.length === 0) {
        return {
            suggested: null,
            reason: "Sin historial previo",
            confidence: 0
        };
    }

    // Get last 4 sessions of this exercise
    const recentSessions = history.slice(0, 4);

    // Calculate average max weight
    const maxWeights = recentSessions.map(h => h.maxWeight).filter(w => w > 0);
    if (maxWeights.length === 0) {
        return {
            suggested: null,
            reason: "Sin datos de peso",
            confidence: 0
        };
    }

    const avgMaxWeight = maxWeights.reduce((a, b) => a + b, 0) / maxWeights.length;
    const lastMaxWeight = maxWeights[0];

    // Analyze trend
    const isProgressing = maxWeights.length >= 2 && maxWeights[0] >= maxWeights[maxWeights.length - 1];
    const isStagnant = maxWeights.length >= 3 &&
        Math.abs(maxWeights[0] - maxWeights[maxWeights.length - 1]) < 2.5;

    let suggested, reason, confidence;

    if (isProgressing && !isStagnant) {
        // Progressing well - suggest small increase
        suggested = Math.round((lastMaxWeight + 2.5) * 2) / 2; // Round to nearest 2.5
        reason = "Buena progresión, sube ligeramente";
        confidence = 85;
    } else if (isStagnant) {
        // Stagnant - might need deload or change
        suggested = Math.round((lastMaxWeight * 0.9) * 2) / 2;
        reason = "Peso estancado, considera deload";
        confidence = 70;
    } else {
        // Maintain current
        suggested = lastMaxWeight;
        reason = "Mantén el peso actual";
        confidence = 75;
    }

    return {
        suggested,
        reason,
        confidence,
        lastWeight: lastMaxWeight,
        avgWeight: Math.round(avgMaxWeight * 10) / 10,
        trend: isProgressing ? 'up' : isStagnant ? 'flat' : 'down'
    };
};

/**
 * Calculate macros for a food item using AI
 * @param {string} foodDescription - Description of the food (e.g., "2 huevos fritos con pan")
 * @returns {Object} - { name, calories, protein, carbs, fats, quantity, unit }
 */
export const calculateFoodMacros = async (foodDescription) => {
    if (!OPENROUTER_API_KEY) {
        throw new Error("VITE_OPENROUTER_API_KEY no encontrada");
    }

    const systemPrompt = `Eres un nutricionista experto. Tu única tarea es calcular los macronutrientes de alimentos.
Responde ÚNICAMENTE con JSON válido, sin markdown ni texto adicional.`;

    const userPrompt = `Calcula las calorías y macros de: "${foodDescription}"

Si el usuario no especifica cantidad, asume una porción estándar.

RESPONDE SOLO con este JSON exacto:
{
    "name": "Nombre del alimento",
    "quantity": "cantidad (ej: 2 unidades, 100g, 1 taza)",
    "calories": número,
    "protein": número en gramos,
    "carbs": número en gramos,
    "fats": número en gramos,
    "fiber": número en gramos (opcional),
    "notes": "observación breve si es relevante"
}`;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin || 'http://localhost:5173',
                'X-Title': 'FitAI Personal'
            },
            body: JSON.stringify({
                model: OPENROUTER_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.3,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();
        let text = data.choices[0].message.content;

        // Clean JSON
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            text = jsonMatch[0];
        }

        const result = JSON.parse(text);
        console.log('[AI Macros] Calculated:', result);

        return {
            name: result.name || foodDescription,
            quantity: result.quantity || '1 porción',
            calories: parseInt(result.calories) || 0,
            protein: parseInt(result.protein) || 0,
            carbs: parseInt(result.carbs) || 0,
            fats: parseInt(result.fats) || 0,
            fiber: parseInt(result.fiber) || 0,
            notes: result.notes || ''
        };

    } catch (error) {
        console.error('[AI Macros] Error:', error);

        // Return estimate based on simple heuristics
        return {
            name: foodDescription,
            quantity: '1 porción',
            calories: 150,
            protein: 10,
            carbs: 15,
            fats: 5,
            notes: 'Estimación aproximada - IA no disponible'
        };
    }
};
