
import { appStore } from "../state/appStore";
import { TRANSLATIONS } from "../translations";

class AudioController {
  private recognition: SpeechRecognition | null = null;
  private baseText: string = "";
  private finalTranscript: string = "";

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
    this.finalTranscript = "";
    
    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    this.recognition = recognition;
    
    // Keep continuous: true for speed and UX
    recognition.continuous = true; 
    recognition.interimResults = true;
    recognition.lang = state.language === 'ru' ? 'ru-RU' : 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";

        // Fix for mobile duplication: 
        // Use event.resultIndex to iterate ONLY over new/changed results.
        // This prevents re-appending history that mobile browsers might keep in the array.
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                this.finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        appStore.update(s => ({ 
            ...s, 
            locationRequest: this.baseText + this.finalTranscript + interimTranscript 
        }));
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
             appStore.update(s => ({ ...s, isListening: false, error: TRANSLATIONS[s.language].errMicrophone }));
             this.recognition = null;
        } else {
             // For other errors, just stop to reset state
             this.stop();
        }
    };

    recognition.onend = () => {
        // Stop UI state if it ends naturally (e.g. silence or user stop)
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
