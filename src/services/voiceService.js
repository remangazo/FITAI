/**
 * VoiceService - Native Browser Text-to-Speech
 * Optimized for Spanish (Argentina) fallback to Spanish (International)
 */

class VoiceService {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.preferredVoice = null;
        this.enabled = true;
        this.volume = 1.0;
        this.rate = 1.0; // Velocidad normal
        this.pitch = 1.0;

        // Cargar voces cuando estén disponibles
        if (this.synth) {
            this.synth.onvoiceschanged = () => this.loadVoices();
            this.loadVoices();
        }
    }

    loadVoices() {
        this.voices = this.synth.getVoices();

        // Prioridad 1: Argentina (es-AR)
        // Prioridad 2: Otros países de Latinoamerica (es-419, es-MX)
        // Prioridad 3: España (es-ES)
        // Prioridad 4: Cualquier español

        this.preferredVoice =
            this.voices.find(v => v.lang === 'es-AR') ||
            this.voices.find(v => v.lang.includes('es-419')) ||
            this.voices.find(v => v.lang.includes('es-MX')) ||
            this.voices.find(v => v.lang === 'es-ES') ||
            this.voices.find(v => v.lang.startsWith('es-')) ||
            this.voices[0];

        // Log para depuración interna (solo en dev)
        // console.log("FitAI Voice Initialized:", this.preferredVoice?.name || "No voice found");
    }

    speak(text) {
        if (!this.synth || !this.enabled || !text) return;

        // Cancelar reproducción actual para no solapar
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        if (this.preferredVoice) {
            utterance.voice = this.preferredVoice;
        }

        utterance.lang = this.preferredVoice?.lang || 'es-AR';
        utterance.volume = this.volume;
        utterance.rate = this.rate;
        utterance.pitch = this.pitch;

        this.synth.speak(utterance);
    }

    stop() {
        if (this.synth) this.synth.cancel();
    }

    setEnabled(status) {
        this.enabled = status;
        if (!status) this.stop();
    }

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
    }
}

const voiceService = new VoiceService();
export default voiceService;
