// Test de OpenRouter y sus modelos gratuitos
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envLines = envContent.split('\n');
const envVars = {};
envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envVars[key.trim()] = value.trim();
});

const OPENROUTER_API_KEY = envVars.VITE_OPENROUTER_API_KEY;

console.log("🔑 OpenRouter API Key:", OPENROUTER_API_KEY ? `✅ (${OPENROUTER_API_KEY.substring(0, 15)}...)` : "❌ No encontrada");
console.log("\n🧪 Probando modelos GRATUITOS de OpenRouter...\n");

// Modelos GRATUITOS disponibles en OpenRouter
const freeModels = [
    {
        id: "google/gemini-2.0-flash-exp:free",
        name: "Gemini 2.0 Flash (Experimental)",
        description: "Lo mejor de Google, gratis"
    },
    {
        id: "google/gemini-flash-1.5",
        name: "Gemini 1.5 Flash",
        description: "Rápido y eficiente"
    },
    {
        id: "meta-llama/llama-3.2-3b-instruct:free",
        name: "Llama 3.2 3B",
        description: "Meta AI, ultra rápido"
    },
    {
        id: "meta-llama/llama-3.1-8b-instruct:free",
        name: "Llama 3.1 8B",
        description: "Balance perfecto"
    },
    {
        id: "nousresearch/hermes-3-llama-3.1-405b:free",
        name: "Hermes 3 405B",
        description: "Muy potente, gratis"
    },
    {
        id: "qwen/qwen-2.5-72b-instruct:free",
        name: "Qwen 2.5 72B",
        description: "Excelente para español"
    }
];

async function testModel(modelInfo) {
    const url = "https://openrouter.ai/api/v1/chat/completions";

    const requestBody = {
        model: modelInfo.id,
        messages: [
            {
                role: "user",
                content: "Responde exactamente: OK FUNCIONANDO"
            }
        ]
    };

    try {
        const startTime = Date.now();

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5173', // Requerido por OpenRouter
                'X-Title': 'FitAI Personal' // Opcional pero recomendado
            },
            body: JSON.stringify(requestBody)
        });

        const elapsed = Date.now() - startTime;

        if (response.ok) {
            const data = await response.json();
            const text = data.choices[0].message.content;
            return {
                success: true,
                model: modelInfo,
                response: text.trim(),
                elapsed
            };
        } else {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                model: modelInfo,
                error: `${response.status}: ${errorData.error?.message || 'Error desconocido'}`
            };
        }
    } catch (error) {
        return {
            success: false,
            model: modelInfo,
            error: error.message
        };
    }
}

async function main() {
    console.log("=".repeat(70));
    console.log("🚀 TEST DE MODELOS GRATUITOS EN OPENROUTER");
    console.log("=".repeat(70) + "\n");

    const workingModels = [];

    for (const modelInfo of freeModels) {
        process.stdout.write(`⏳ ${modelInfo.name.padEnd(35)}... `);
        const result = await testModel(modelInfo);

        if (result.success) {
            console.log(`✅ ${result.elapsed}ms`);
            workingModels.push(result);
        } else {
            console.log(`❌ ${result.error}`);
        }

        // Pequeña pausa
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("\n" + "=".repeat(70));

    if (workingModels.length > 0) {
        console.log("✅ MODELOS FUNCIONALES:");
        console.log("=".repeat(70));

        workingModels.forEach((r, i) => {
            console.log(`\n${i + 1}. ${r.model.name} (${r.elapsed}ms)`);
            console.log(`   ID: ${r.model.id}`);
            console.log(`   Respuesta: "${r.response}"`);
            console.log(`   ${r.model.description}`);
        });

        // Recomendar el más rápido
        const fastest = workingModels.sort((a, b) => a.elapsed - b.elapsed)[0];

        console.log("\n" + "=".repeat(70));
        console.log(`\n🏆 MODELO RECOMENDADO (más rápido): ${fastest.model.name}`);
        console.log(`⏱️  Tiempo de respuesta: ${fastest.elapsed}ms`);
        console.log(`📝 ID del modelo: ${fastest.model.id}`);

        console.log("\n📝 Actualiza VITE_AI_PROVIDER en .env:");
        console.log(`VITE_AI_PROVIDER=openrouter`);
        console.log(`VITE_OPENROUTER_MODEL=${fastest.model.id}\n`);

        return fastest.model.id;
    } else {
        console.log("❌ NO SE ENCONTRÓ NINGÚN MODELO FUNCIONAL");
        console.log("=".repeat(70));
        console.log("\n⚠️  Verifica que la API Key de OpenRouter sea válida.");
        console.log("🔗 Panel de OpenRouter: https://openrouter.ai/keys\n");
    }
}

main();
