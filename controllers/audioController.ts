
import { appStore } from "../state/appStore";
import { TRANSLATIONS } from "../translations";

class AudioController {
  private recognition: SpeechRecognition | null = null;
  private baseText: string = "";

  toggleListening() {
    const state = appStore.getState();

    if (!('webkitSpeechRecognition' in window)) {
        alert('Speech recognition is not supported in this browser.');
        return;
    }

    if (state.isListening) {
        this.stop();
    } else {
        this.start();
    }
  }

  start() {
    // Prevent multiple instances
    if (this.recognition) return;

    const state = appStore.getState();
    appStore.update(s => ({ ...s, isListening: true, error: null }));

    // Capture the text state at the moment of starting
    this.baseText = state.locationRequest;
    let finalTranscript = ""; // reset

    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    this.recognition = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = state.language === "ru" ? "ru-RU" : "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            const alt = res[0];
            const text = alt.transcript;
            const confidence = alt.confidence;

            // Mobile bug workaround: 
            // On some Android devices, the engine returns the whole history as 'isFinal' chunks 
            // but with confidence 0. Real final results usually have confidence > 0.
            if (res.isFinal && confidence > 0) {
                // final chunk -> add to stable text
                finalTranscript += text;
            } else {
                // still “live” text -> only interim
                interimTranscript += text;
            }
        }

        appStore.update(s => ({
            ...s,
            locationRequest: this.baseText + finalTranscript + interimTranscript + ' ',
        }));
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error", event.error);
        if (event.error === "not-allowed") {
            appStore.update(s => ({
                ...s,
                isListening: false,
                error: TRANSLATIONS[s.language].errMicrophone,
            }));
            this.recognition = null;
        } else {
            this.stop();
        }
    };

    recognition.onend = () => {
        if (this.recognition) {
            this.stop();
        }
    };

    try {
        recognition.start();
    } catch (e) {
        console.error("Failed to start recognition", e);
        this.stop();
    }
  }

  stop() {
    if (this.recognition) {
        // Remove handler to prevent loops
        this.recognition.onend = null;
        this.recognition.stop();
        this.recognition = null;
    }
    appStore.update(s => ({ ...s, isListening: false }));
  }
}

export const audioController = new AudioController();
