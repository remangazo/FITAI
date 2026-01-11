const admin = require("firebase-admin");
const axios = require("axios");
const { logger } = require("firebase-functions");

module.exports = async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Methods", "POST");
        res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        return res.status(204).send("");
    }

    const { userData, language = "es" } = req.body;
    const uid = req.auth?.uid || req.body.uid;

    if (!uid) {
        return res.status(401).send({ error: "Unauthorized" });
    }

    try {
        const userDoc = await admin.firestore().collection("users").doc(uid).get();
        const isPremium = userDoc.data()?.isPremium || false;

        if (!isPremium) {
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const dietsThisMonth = await admin.firestore()
                .collection("diets")
                .where("userId", "==", uid)
                .where("createdAt", ">=", firstDayOfMonth)
                .count()
                .get();

            if (dietsThisMonth.data().count >= 1) {
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

        // Convert weight if needed
        const weight = userData.unit === 'lb'
            ? Math.round(parseFloat(userData.weight) * 0.453592)
            : parseFloat(userData.weight);
        const height = userData.unit === 'ft'
            ? Math.round(parseFloat(userData.height) * 30.48)
            : parseFloat(userData.height);

        // Calculate BMR and calories based on goal
        const age = parseInt(userData.age);
        const bmr = 10 * weight + 6.25 * height - 5 * age + 5; // Mifflin-St Jeor for men (adjust for women)
        const activityMultiplier = userData.level === 'beginner' ? 1.4 : userData.level === 'intermediate' ? 1.6 : 1.8;
        let targetCalories = Math.round(bmr * activityMultiplier);

        if (userData.goal === 'fat_loss') {
            targetCalories -= 400;
        } else if (userData.goal === 'muscle') {
            targetCalories += 300;
        }

        // Culture-specific food suggestions
        const culturePrompts = {
            'Argentina': `
COMIDAS TÍPICAS ARGENTINAS A INCLUIR (elegir 3-4 por día):
- Desayuno: Mate con tostadas integrales, medialunas light, yogur con granola, huevos revueltos
- Almuerzo: Asado magro (entraña, lomo), pollo a la parrilla, milanesa de pollo al horno, empanadas de carne magra, ensalada criolla
- Merienda: Mate cocido, alfajor de maicena light, frutas de estación
- Cena: Bife de chorizo sin grasa, pescado a la plancha, pollo al disco, wok de verduras, milanesa de soja/lentejas

INGREDIENTES LOCALES PREFERIDOS:
Carnes: asado magro, pollo, pescado patagónico
Lácteos: yogur griego, queso port salut light
Verduras: tomate, lechuga, zapallo, choclo
Frutas: manzana, naranja, banana, uvas mendocinas
Cereales: arroz, fideos integrales, pan lactal integral`,
            'Vegan': `
COMIDAS VEGANAS A INCLUIR:
- Desayuno: Porridge de avena con frutas, tostadas con palta, batido verde, tofu revuelto
- Almuerzo: Buddha bowl, milanesas de lentejas/garbanzos, curry de garbanzos, wrap de falafel
- Merienda: Hummus con crudités, mix de frutos secos, fruta fresca
- Cena: Tacos de jackfruit, pasta con salsa de tomate y legumbres, hamburguesa de porotos negros

FUENTES DE PROTEÍNA:
Legumbres, tofu, tempeh, seitán, quinoa, frutos secos, semillas`,
            'Global': `
COMIDAS BALANCEADAS INTERNACIONALES:
- Desayuno: Avena con frutas, huevos con tostadas, yogur griego con granola
- Almuerzo: Pollo a la plancha con arroz, salmón con quinoa, ensalada con proteína
- Merienda: Frutos secos, frutas, yogur
- Cena: Pescado con verduras, pollo al horno, pasta integral con proteína`
        };

        const cultureInfo = culturePrompts[userData.culture] || culturePrompts['Global'];

        const prompt = language === "es"
            ? `Eres el Nutricionista Jefe de FITAI. Genera un plan de alimentación de maestría.
            
            DATOS DEL USUARIO:
            - Objetivo: ${userData.goal}
            - Peso: ${weight} kg
            - Altura: ${height} cm
            - Cultura: ${userData.culture || 'Argentina'}
            
            CALORÍAS OBJETIVO: ${targetCalories} kcal/día
            
            ${cultureInfo}

            REQUERIMIENTOS:
            1. 5 comidas diarias con detalle gourmet y cantidades.
            2. Macros exactos por comida y totales.
            3. Hidratación y sustitutos inteligentes.

            IMPORTANTE: Devuelve ÚNICAMENTE un objeto JSON válido con este formato:
            {
                "title": "Plan Nutricional FITAI Elite",
                "description": "Análisis nutricional detallado.",
                "targetCalories": ${targetCalories},
                "macros": { "protein": 0, "carbs": 0, "fats": 0, "fiber": 0 },
                "hydration": "Litros recomendados",
                "meals": [
                    {
                        "name": "Desayuno",
                        "time": "08:00",
                        "description": "Detalle completo",
                        "calories": 0,
                        "macros": { "protein": 0, "carbs": 0, "fats": 0 },
                        "isLocal": true,
                        "substitute": "Alternativa"
                    }
                ],
                "tips": ["Tip 1", "Tip 2"],
                "shoppingList": ["Item 1", "Item 2"]
            }`
            : `You are the FITAI Chief Nutritionist. Generate a mastery meal plan.

            USER DATA:
            - Goal: ${userData.goal}
            - Weight: ${weight} kg
            - Height: ${height} cm
            - Culture: ${userData.culture || 'Global'}

            TARGET CALORIES: ${targetCalories} kcal/day

            ${cultureInfo}

            REQUIREMENTS:
            1. 5 daily meals with gourmet detail and quantities.
            2. Exact macros per meal and totals.
            3. Hydration and smart substitutes.

            IMPORTANT: Return ONLY a valid JSON object with this format:
            {
                "title": "FITAI Elite Nutrition Plan",
                "description": "Detailed nutritional analysis.",
                "targetCalories": ${targetCalories},
                "macros": { "protein": 0, "carbs": 0, "fats": 0, "fiber": 0 },
                "hydration": "Recommended liters",
                "meals": [
                    {
                        "name": "Breakfast",
                        "time": "08:00",
                        "description": "Full detail",
                        "calories": 0,
                        "macros": { "protein": 0, "carbs": 0, "fats": 0 },
                        "isLocal": true,
                        "substitute": "Alternative"
                    }
                ],
                "tips": ["Tip 1", "Tip 2"],
                "shoppingList": ["Item 1", "Item 2"]
            }`;

        const response = await axios.post(url, {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.7,
            }
        });

        const resultText = response.data.candidates[0].content.parts[0].text;
        const dietData = JSON.parse(resultText);

        const dietRef = await admin.firestore().collection("diets").add({
            userId: uid,
            ...dietData,
            userGoal: userData.goal,
            culture: userData.culture,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info(`Diet generated for user ${uid}`);
        res.status(200).send({ id: dietRef.id, ...dietData });
    } catch (error) {
        logger.error("Error generating diet:", error);
        res.status(500).send({ error: "Failed to generate diet", details: error.message });
    }
};
