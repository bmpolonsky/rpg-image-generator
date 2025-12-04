
export interface LoreFile {
  name: string;
  content: string;
}

export enum Tool {
  PEN = 'PEN',
  ERASER = 'ERASER',
  RECT = 'RECT',
  CIRCLE = 'CIRCLE',
  LINE = 'LINE',
}

export enum GenerationMode {
  BATTLEMAP = 'BATTLEMAP',
  LOCATION = 'LOCATION',
  CHARACTER = 'CHARACTER',
}

export interface GenerationState {
  isGeneratingDescription: boolean;
  isGeneratingImage: boolean;
  isEditingImage: boolean;
  isGeneratingNarrative: boolean;
  isListening: boolean;
  error: string | null;
}

export interface GeneratedAsset {
  imageUrl: string;
  narrative?: string;
  visualPrompt?: string;
}

export interface MapData {
  loreFiles: LoreFile[];
  locationRequest: string;
  sketchBase64: string | null;
  
  // Current ephemeral text (used during gen)
  generatedDescription: string;
  narrativeDescription: string; 

  generatedImages: GeneratedAsset[];
  
  // Selected generation mode
  mode: GenerationMode;
  // Selected model for text description generation
  descriptionModel: string;
  // Selected model for painting
  imageModel: string;
  // Selected art style
  artStyle: string;
  imageCount: number;
  
  // Interface Language preference
  language: 'en' | 'ru';
  
  lastTextDuration?: number;
  lastImageDuration?: number;
}

declare global {
    interface SpeechRecognitionEvent extends Event {
        results: SpeechRecognitionResultList;
    }

    interface SpeechRecognitionErrorEvent extends Event {
        error: string;
    }

    interface SpeechRecognition extends EventTarget {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        start(): void;
        stop(): void;
        onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
        onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
        onend: ((this: SpeechRecognition, ev: Event) => any) | null;
        onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    }

    interface Window {
        webkitSpeechRecognition: {
            new(): SpeechRecognition;
        };
    }
}
