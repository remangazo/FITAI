// Test con v1beta API
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envLines = envContent.split('\n');
const envVars = {};
envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envVars[key.trim()] = value.trim();
});

const API_KEY = envVars.VITE_GEMINI_API_KEY;

console.log("🔑 API Key:", API_KEY ? `✅ (${API_KEY.substring(0, 10)}...)` : "❌ No encontrada");
console.log("\n🧪 Probando modelos con v1beta...\n");

const modelsToTry = [
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro"
];

async function testModel(modelName) {
    // Usar v1beta que es la API correcta para Gemini
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;

    const requestBody = {
        contents: [{
            parts: [{
                text: "Di exactamente: OK FUNCIONANDO"
            }]
        }]
    };

    try {
        console.log(`⏳ Probando ${modelName}...`);
        const startTime = Date.now();

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const elapsed = Date.now() - startTime;

        if (response.ok) {
            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;
            console.log(`   ✅ FUNCIONA! (${elapsed}ms)`);
            console.log(`   📝 Respuesta: "${text.trim()}"`);
            console.log(`   🎯 Este es tu modelo!\n`);
            return { success: true, model: modelName, elapsed };
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.log(`   ❌ Error ${response.status}`);
            if (errorData.error?.message) {
                console.log(`   💬 ${errorData.error.message.substring(0, 80)}`);
            }
            console.log("");
            return { success: false, model: modelName, error: response.status };
        }
    } catch (error) {
        console.log(`   ❌ ${error.message}\n`);
        return { success: false, model: modelName, error: error.message };
    }
}

async function main() {
    console.log("=".repeat(60));
    console.log("🚀 TEST GEMINI API (v1beta)");
    console.log("=".repeat(60) + "\n");

    for (const model of modelsToTry) {
        const result = await testModel(model);

        if (result.success) {
            console.log("=".repeat(60));
            console.log(`✅ MODELO FUNCIONAL: ${result.model}`);
            console.log(`⏱️  Tiempo: ${result.elapsed}ms`);
            console.log("=".repeat(60));
            console.log(`\n📝 Actualiza src/services/geminiService.js:\n`);
            console.log(`const MODEL_NAME = "${result.model}";\n`);
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log("=".repeat(60));
    console.log("❌ NINGÚN MODELO FUNCIONÓ");
    console.log("=".repeat(60));
    console.log("\n⚠️  Verifica:");
    console.log("1. API Key válida");
    console.log("2. API habilitada en Google Cloud");
    console.log("3. Obtén nueva key: https://aistudio.google.com/app/apikey\n");
}

main();
