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

console.log("🔑 API Key encontrada:", API_KEY ? "✅ SÍ" : "❌ NO");
console.log("\n📋 Listando modelos disponibles...\n");

const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        // Lista todos los modelos disponibles
        const models = await genAI.listModels();

        console.log("✅ Modelos disponibles:\n");
        for await (const model of models) {
            console.log("📌", model.name);
            console.log("   Soporta generateContent:", model.supportedGenerationMethods?.includes("generateContent") ? "✅" : "❌");
            console.log("");
        }
    } catch (error) {
        console.error("❌ Error listando modelos:", error.message);
    }
}

listModels();
