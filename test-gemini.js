import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from 'fs';

// Leer .env manualmente
const envContent = readFileSync('.env', 'utf-8');
const envLines = envContent.split('\n');
const envVars = {};
envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envVars[key.trim()] = value.trim();
});

const API_KEY = envVars.VITE_GEMINI_API_KEY;
const MODEL_NAME = "gemini-pro"; // Modelo gratuito más estable

console.log("🔑 API Key encontrada:", API_KEY ? "✅ SÍ" : "❌ NO");
console.log("📝 Modelo a usar:", MODEL_NAME);
console.log("\n" + "=".repeat(60) + "\n");

async function testRoutineGeneration() {
    console.log("🏋️ TEST 1: Generación de Rutina");
    console.log("-".repeat(60));

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const testUserData = {
        goal: "muscle",
        level: "intermediate",
        weight: "75",
        height: "175",
        unit: "kg"
    };

    const prompt = `
    Eres FITAI. Genera una rutina de entrenamiento en ESPAÑOL.
    
    Usuario: Objetivo ${testUserData.goal}, nivel ${testUserData.level}, ${testUserData.weight}kg, ${testUserData.height}cm
    
    Responde SOLO con JSON válido en este formato:
    {
        "title": "Nombre de la Rutina",
        "description": "Descripción breve",
        "daysPerWeek": 4,
        "estimatedDuration": "60 min",
        "days": [
            {
                "day": "Día 1",
                "focus": "Pecho y Tríceps",
                "warmup": "5 min cardio + movilidad",
                "exercises": [
                    { "name": "Press Banca", "sets": 4, "reps": "8-12", "rest": "90s", "notes": "Controla la fase excéntrica", "muscleGroup": "Pectoral" }
                ],
                "stretching": "Estiramiento pectoral"
            }
        ],
        "progression": {
            "week1_2": "Adaptación técnica",
            "week3_4": "Incremento de volumen",
            "tips": "Descansa bien"
        },
        "nutrition_tip": "Consume proteína post-entrenamiento"
    }`;

    try {
        console.log("⏳ Enviando petición a Gemini...");
        const startTime = Date.now();

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                maxOutputTokens: 4096,
            }
        });

        const response = await result.response;
        const text = response.text();
        const endTime = Date.now();

        console.log(`✅ Respuesta recibida en ${endTime - startTime}ms`);
        console.log("\n📄 Texto crudo recibido:");
        console.log(text.substring(0, 500) + "...");

        // Intentar parsear JSON
        let cleanText = text.trim();
        // Remover markdown code blocks si existen
        if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }

        const jsonData = JSON.parse(cleanText);
        console.log("\n✅ JSON parseado correctamente");
        console.log("📊 Datos de la rutina:");
        console.log("   - Título:", jsonData.title);
        console.log("   - Días por semana:", jsonData.daysPerWeek);
        console.log("   - Días incluidos:", jsonData.days?.length || 0);

        return { success: true, data: jsonData };
    } catch (error) {
        console.error("\n❌ ERROR:", error.message);
        return { success: false, error: error.message };
    }
}

async function testDietGeneration() {
    console.log("\n\n🥗 TEST 2: Generación de Dieta");
    console.log("-".repeat(60));

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const testUserData = {
        goal: "fat_loss",
        weight: "75",
        height: "175",
        age: "30",
        unit: "kg",
        culture: "Argentina"
    };

    const prompt = `
    Eres el Nutricionista de FITAI. Genera un plan de alimentación en ESPAÑOL.
    
    Usuario: ${testUserData.weight}kg, ${testUserData.height}cm, ${testUserData.age} años, cultura ${testUserData.culture}
    Objetivo: ${testUserData.goal}
    
    Responde SOLO con JSON válido en este formato:
    {
        "title": "Plan Nutricional",
        "description": "Descripción del plan",
        "targetCalories": 2000,
        "macros": { "protein": 150, "carbs": 200, "fats": 60, "fiber": 30 },
        "hydration": "3 litros diarios",
        "meals": [
            {
                "name": "Desayuno",
                "time": "08:00",
                "description": "Huevos revueltos con pan integral",
                "calories": 400,
                "macros": { "protein": 25, "carbs": 40, "fats": 15 },
                "isLocal": true,
                "substitute": "Opción rápida alternativa"
            }
        ],
        "shoppingList": ["Huevos", "Pan integral", "Verduras"],
        "tips": ["Tip nutricional 1", "Tip nutricional 2"]
    }`;

    try {
        console.log("⏳ Enviando petición a Gemini...");
        const startTime = Date.now();

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                maxOutputTokens: 4096,
            }
        });

        const response = await result.response;
        const text = response.text();
        const endTime = Date.now();

        console.log(`✅ Respuesta recibida en ${endTime - startTime}ms`);
        console.log("\n📄 Texto crudo recibido:");
        console.log(text.substring(0, 500) + "...");

        // Limpiar y parsear JSON
        let cleanText = text.trim();
        if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }

        const jsonData = JSON.parse(cleanText);
        console.log("\n✅ JSON parseado correctamente");
        console.log("📊 Datos de la dieta:");
        console.log("   - Título:", jsonData.title);
        console.log("   - Calorías objetivo:", jsonData.targetCalories);
        console.log("   - Comidas incluidas:", jsonData.meals?.length || 0);

        return { success: true, data: jsonData };
    } catch (error) {
        console.error("\n❌ ERROR:", error.message);
        return { success: false, error: error.message };
    }
}

// Ejecutar tests
console.log("🚀 INICIANDO PRUEBAS DE GEMINI 1.5 FLASH (GRATUITO)\n");

testRoutineGeneration()
    .then(() => testDietGeneration())
    .then(() => {
        console.log("\n" + "=".repeat(60));
        console.log("✅ PRUEBAS COMPLETADAS");
        console.log("=".repeat(60));
    })
    .catch(error => {
        console.error("\n💥 Error fatal:", error);
        process.exit(1);
    });
