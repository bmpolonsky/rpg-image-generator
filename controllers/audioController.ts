
import { appStore } from "../state/appStore";
import { TRANSLATIONS } from "../translations";

class AudioController {
  private recognition: SpeechRecognition | null = null;

  toggleListening() {
    const state = appStore.getState();

    if (!('webkitSpeechRecognition' in window)) {
        alert('Speech recognition is not supported in this browser.');
        return;
    }

    if (state.isListening) {
        this.stop();
        return;
    }

    this.start(state.language, state.locationRequest);
  }

  start(lang: 'en' | 'ru', currentText: string) {
    const SpeechRecognition = window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = lang === 'ru' ? 'ru-RU' : 'en-US';

    const startPrefix = currentText.trim().length > 0 ? currentText.trim() + ' ' : '';

    this.recognition.onstart = () => {
        appStore.update(s => ({ ...s, isListening: true }));
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
        }
        
        appStore.update(s => ({ 
            ...s, 
            locationRequest: startPrefix + transcript 
        }));
    };

    this.recognition.onend = () => {
        appStore.update(s => ({ ...s, isListening: false }));
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech Error", event.error);
        appStore.update(s => ({ 
            ...s, 
            isListening: false,
            error: event.error === 'not-allowed' ? TRANSLATIONS[lang].errMicrophone : null
        }));
    };

    try {
        this.recognition.start();
    } catch (e) {
        console.error(e);
    }
  }

  stop() {
    if (this.recognition) {
        this.recognition.stop();
        this.recognition = null;
    }
  }
}

export const audioController = new AudioController();
