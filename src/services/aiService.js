import { auth } from '../config/firebase';

const API_BASE = import.meta.env.VITE_FUNCTIONS_URL || 'https://us-central1-fitai-personal.cloudfunctions.net';

async function callAIProxy(action, data) {
    if (!auth.currentUser) throw new Error("User not authenticated");

    const token = await auth.currentUser.getIdToken();

    const response = await fetch(`${API_BASE}/aiProxy`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, data })
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response from AI Proxy:", text.substring(0, 500));
        throw new Error(`Error del servidor (${response.status}). Por favor, intenta de nuevo.`);
    }

    const result = await response.json();

    if (!response.ok) {
        // Prepare a structured error object
        const error = new Error(result.error || "Unknown Error");
        error.code = result.code;
        error.status = response.status;
        error.details = result;
        throw error;
    }

    return result.result;
}

export const aiService = {
    generateRoutine: (userData) => callAIProxy('generateRoutine', userData),
    generateDiet: (userData) => callAIProxy('generateDiet', userData),
    calculateMacros: (foodDescription) => callAIProxy('calculateMacros', { food: foodDescription }),
    analyzeProgress: (progressData) => callAIProxy('analyzeProgress', progressData),
    verifyProof: (fileBase64) => callAIProxy('verifyProof', { image: fileBase64 })
};
