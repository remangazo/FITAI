// Test más exhaustivo con todas las combinaciones posibles
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
console.log("\n🧪 Probando TODOS los modelos disponibles...\n");

// Lista exhaustiva de modelos a probar
const modelsToTry = [
    // Gemini 2.0
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash",
    // Gemini 1.5 Flash variantes
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b-latest",
    "gemini-1.5-flash-8b",
    // Gemini 1.5 Pro variantes
    "gemini-1.5-pro-latest",
    "gemini-1.5-pro-001",
    "gemini-1.5-pro-002",
    "gemini-1.5-pro",
    // Gemini Pro legacy
    "gemini-pro",
    "gemini-pro-vision",
    // Gemini 1.0
    "gemini-1.0-pro-latest",
    "gemini-1.0-pro-001",
    "gemini-1.0-pro"
];

async function testModel(modelName) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;

    const requestBody = {
        contents: [{
            parts: [{
                text: "Responde con la palabra: OK"
            }]
        }]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;
            return { success: true, model: modelName, response: text.trim() };
        } else {
            const status = response.status;
            let reason = "";
            if (status === 429) reason = "Cuota excedida";
            else if (status === 404) reason = "No encontrado";
            else if (status === 403) reason = "Sin permisos";
            else reason = `Error ${status}`;
            return { success: false, model: modelName, error: reason };
        }
    } catch (error) {
        return { success: false, model: modelName, error: error.message };
    }
}

async function main() {
    console.log("=".repeat(60));
    console.log("🚀 TEST EXHAUSTIVO DE MODELOS GEMINI");
    console.log("=".repeat(60) + "\n");

    const results = [];

    for (const model of modelsToTry) {
        process.stdout.write(`⏳ ${model.padEnd(35)}... `);
        const result = await testModel(model);

        if (result.success) {
            console.log(`✅ FUNCIONA!`);
            results.push(result);
        } else {
            console.log(`❌ ${result.error}`);
        }

        // Pausa para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log("\n" + "=".repeat(60));

    if (results.length > 0) {
        console.log("✅ MODELOS FUNCIONALES ENCONTRADOS:");
        console.log("=".repeat(60));
        results.forEach((r, i) => {
            console.log(`\n${i + 1}. ${r.model}`);
            console.log(`   Respuesta: "${r.response}"`);
        });

        console.log("\n" + "=".repeat(60));
        console.log(`\n📝 Usa este en geminiService.js:\n`);
        console.log(`const MODEL_NAME = "${results[0].model}";\n`);
    } else {
        console.log("❌ NO SE ENCONTRÓ NINGÚN MODELO FUNCIONAL");
        console.log("=".repeat(60));
        console.log("\n⚠️  Todas las API Keys probadas tienen cuota excedida.");
        console.log("💡 Soluciones:");
        console.log("   1. Espera 24 horas para que se reinicie la cuota");
        console.log("   2. Crea una API Key en un proyecto NUEVO en Google AI Studio");
        console.log("   3. Habilita facturación en Google Cloud (tienes $300 gratis)\n");
    }
}

main();
