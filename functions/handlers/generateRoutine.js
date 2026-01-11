const admin = require("firebase-admin");
const axios = require("axios");
const { logger } = require("firebase-functions");

module.exports = async (req, res) => {
    // CORS
    res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Methods", "POST");
        res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.set("Access-Control-Max-Age", "3600");
        return res.status(204).send("");
    }

    const { userData, language = "es" } = req.body;
    const uid = req.auth?.uid || req.body.uid;

    if (!uid) {
        return res.status(401).send({ error: "Unauthorized" });
    }

    try {
        // Check subscription status
        const userDoc = await admin.firestore().collection("users").doc(uid).get();
        const isPremium = userDoc.data()?.isPremium || false;

        // Check usage limits for free users (1 routine per month)
        if (!isPremium) {
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const routinesThisMonth = await admin.firestore()
                .collection("routines")
                .where("userId", "==", uid)
                .where("createdAt", ">=", firstDayOfMonth)
                .count()
                .get();

            if (routinesThisMonth.data().count >= 1) {
                return res.status(403).send({
                    error: language === "es"
                        ? "Límite gratuito alcanzado (1 por mes). ¡Mejora a Premium!"
                        : "Free limit reached (1 per month). Upgrade to Premium!"
                });
            }
        }

        const geminiKey = process.env.GEMINI_API_KEY;
        const model = "gemini-2.0-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

        // Convert metrics if needed
        const weight = userData.unit === 'lb'
            ? Math.round(parseFloat(userData.weight) * 0.453592)
            : parseFloat(userData.weight);
        const height = userData.unit === 'ft'
            ? Math.round(parseFloat(userData.height) * 30.48)
            : parseFloat(userData.height);

        const prompt = language === "es"
            ? `Eres FITAI, el asistente de entrenamiento de élite más avanzado. Genera una rutina de TRANSFORMACIÓN física total.
            
            DATOS DEL USUARIO:
            - Objetivo: ${userData.goal}
            - Nivel: ${userData.level}
            - Peso: ${weight} kg
            - Altura: ${height} cm
            - Frecuencia: 4 días/semana.

            REQUERIMIENTOS:
            1. Estructura Pro: Calentamiento -> Bloque Principal -> Finisher -> Estiramientos.
            2. Incluye nombres técnicos, series, reps, descanso y RPE.
            3. Plan de progresión para 4 semanas.

            IMPORTANTE: Devuelve ÚNICAMENTE un objeto JSON válido con este formato:
            {
                "title": "Nombre de la Rutina Elite",
                "description": "Explicación técnica del plan.",
                "daysPerWeek": 4,
                "estimatedDuration": "60 min",
                "days": [
                    {
                        "day": "Día 1",
                        "focus": "Enfoque muscular",
                        "warmup": "Movilidad",
                        "exercises": [
                            { "name": "Ejercicio", "sets": 4, "reps": "8-12", "rest": "90s", "notes": "Foco técnico", "muscleGroup": "Pectoral" }
                        ],
                        "stretching": "Estiramientos"
                    }
                ],
                "progression": {
                    "week1_2": "Adaptación",
                    "week3_4": "Máxima intensidad",
                    "tips": "Tips de recuperación"
                },
                "nutrition_tip": "Plan de macros sugerido"
            }`
            : `You are FITAI, the most advanced elite training assistant. Generate a total physical TRANSFORMATION routine.

            USER DATA:
            - Goal: ${userData.goal}
            - Level: ${userData.level}
            - Weight: ${weight} kg
            - Height: ${height} cm
            - Frequency: 4 days/week.

            REQUIREMENTS:
            1. Pro Structure: Warmup -> Main Block -> Finisher -> Stretching.
            2. Include technical names, sets, reps, rest and RPE.
            3. 4-week progression plan.

            IMPORTANT: Return ONLY a valid JSON object with this format:
            {
                "title": "Elite Routine Name",
                "description": "Technical plan explanation.",
                "daysPerWeek": 4,
                "estimatedDuration": "60 min",
                "days": [
                    {
                        "day": "Day 1",
                        "focus": "Muscle focus",
                        "warmup": "Mobility",
                        "exercises": [
                            { "name": "Exercise", "sets": 4, "reps": "8-12", "rest": "90s", "notes": "Technical focus", "muscleGroup": "Chest" }
                        ],
                        "stretching": "Stretches"
                    }
                ],
                "progression": {
                    "week1_2": "Adaptation",
                    "week3_4": "Peak intensity",
                    "tips": "Recovery tips"
                },
                "nutrition_tip": "Suggested macros"
            }`;

        const response = await axios.post(url, {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.7,
            }
        });

        const resultText = response.data.candidates[0].content.parts[0].text;
        const routineData = JSON.parse(resultText);

        // Save to Firestore
        const routineRef = await admin.firestore().collection("routines").add({
            userId: uid,
            ...routineData,
            userLevel: userData.level,
            userGoal: userData.goal,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info(`Routine generated for user ${uid}`);
        res.status(200).send({ id: routineRef.id, ...routineData });
    } catch (error) {
        logger.error("Error generating routine:", error);
        res.status(500).send({ error: "Failed to generate routine", details: error.message });
    }
};
