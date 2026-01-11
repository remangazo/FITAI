// Test simple con fetch directo a la API REST de Gemini
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

console.log("🔑 API Key:", API_KEY ? "✅ Encontrada" : "❌ No encontrada");
console.log("\n🧪 Probando modelos disponibles...\n");

// Modelos a probar (de más reciente a más antiguo)
const modelsToTry = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-1.0-pro"
];

async function testModel(modelName) {
    const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${API_KEY}`;

    const requestBody = {
        contents: [{
            parts: [{
                text: "Di exactamente: OK"
            }]
        }]
    };

    try {
        console.log(`⏳ Probando: ${modelName}...`);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;
            console.log(`✅ ${modelName} FUNCIONA! Respuesta: "${text.trim()}"\n`);
            return { success: true, model: modelName, response: text };
        } else {
            const errorText = await response.text();
            console.log(`❌ ${modelName} falló: ${response.status} - ${errorText.substring(0, 100)}...\n`);
            return { success: false, model: modelName, error: response.status };
        }
    } catch (error) {
        console.log(`❌ ${modelName} error: ${error.message}\n`);
        return { success: false, model: modelName, error: error.message };
    }
}

async function testAllModels() {
    const results = [];

    for (const model of modelsToTry) {
        const result = await testModel(model);
        results.push(result);

        // Si encontramos uno que funciona, usemos ese
        if (result.success) {
            console.log(`\n🎉 MODELO FUNCIONAL ENCONTRADO: ${model}`);
            console.log("=".repeat(60));
            break;
        }
    }

    const workingModel = results.find(r => r.success);
    if (workingModel) {
        console.log(`\n✅ Modelo recomendado para usar: ${workingModel.model}`);
        console.log(`📝 Actualiza geminiService.js con: const MODEL_NAME = "${workingModel.model}";`);
    } else {
        console.log("\n❌ Ningún modelo funcionó. Verifica tu API Key.");
    }
}

testAllModels();
