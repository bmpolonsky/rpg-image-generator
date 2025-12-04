import { Store } from '../lib/store';
import { GenerationMode, LoreFile, GeneratedAsset } from '../types';
import { loadState, saveState } from '../services/storageService';

export interface AppState {
  // Persistent Domain Data
  loreFiles: LoreFile[];
  locationRequest: string;
  sketchBase64: string | null; // Keep for persistence/initial load
  
  generatedDescription: string;
  narrativeDescription: string; 
  generatedImages: GeneratedAsset[];
  
  mode: GenerationMode;
  descriptionModel: string;
  imageModel: string;
  artStyle: string;
  imageCount: number;
  language: 'en' | 'ru';
  
  // Metrics
  lastTextDuration?: number;
  lastImageDuration?: number;

  // Transient UI State
  isGeneratingDescription: boolean;
  isGeneratingImage: boolean;
  isEditingImage: boolean;
  isGeneratingNarrative: boolean;
  isListening: boolean;
  error: string | null;
  genTimer: number;

  selectedImageIndex: number;
  isLoaded: boolean;
}

const defaultLang = 'ru';

export const INITIAL_STATE: AppState = {
  loreFiles: [],
  locationRequest: '',
  sketchBase64: null,
  generatedDescription: '',
  narrativeDescription: '',
  generatedImages: [],
  mode: GenerationMode.BATTLEMAP,
  descriptionModel: 'gemini-3-pro-preview',
  imageModel: 'gemini-2.5-flash-image',
  artStyle: 'realistic',
  imageCount: 2,
  language: defaultLang,
  
  isGeneratingDescription: false,
  isGeneratingImage: false,
  isEditingImage: false,
  isGeneratingNarrative: false,
  isListening: false,
  error: null,
  genTimer: 0,

  selectedImageIndex: 0,
  isLoaded: false
};

export const appStore = new Store<AppState>(INITIAL_STATE);

// Persistence logic
appStore.subscribe((state) => {
  if (state.isLoaded) {
    const mapDataToSave = {
      loreFiles: state.loreFiles,
      locationRequest: state.locationRequest,
      sketchBase64: state.sketchBase64,
      generatedDescription: state.generatedDescription,
      narrativeDescription: state.narrativeDescription,
      generatedImages: state.generatedImages,
      mode: state.mode,
      descriptionModel: state.descriptionModel,
      imageModel: state.imageModel,
      artStyle: state.artStyle,
      imageCount: state.imageCount,
      language: state.language,
      lastTextDuration: state.lastTextDuration,
      lastImageDuration: state.lastImageDuration
    };
    saveState(mapDataToSave);
  }
});

// Hydration logic
loadState().then((data) => {
  if (data) {
    appStore.update(s => ({
      ...s,
      ...data,
      mode: data.mode || GenerationMode.BATTLEMAP,
      descriptionModel: data.descriptionModel || 'gemini-3-pro-preview',
      imageModel: data.imageModel || 'gemini-2.5-flash-image',
      artStyle: data.artStyle || 'realistic',
      imageCount: data.imageCount || 2,
      language: data.language || defaultLang,
      generatedImages: typeof data.generatedImages?.[0] === 'string' 
        ? (data.generatedImages as any).map((url: string) => ({ imageUrl: url }))
        : (data.generatedImages || []),
      isLoaded: true,
      selectedImageIndex: (data.generatedImages?.length || 0) > 0 ? (data.generatedImages?.length || 1) - 1 : 0
    }));
  } else {
    appStore.update(s => ({ ...s, isLoaded: true }));
  }
});