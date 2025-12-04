
import { Store } from '../lib/store';
import { Tool } from '../types';
import { appStore } from './appStore';

export interface CanvasState {
  tool: Tool;
  lineWidth: number;
  color: string;
  history: ImageData[];
  historyStep: number;
  currentBase64: string | null;
  showGrid: boolean;
}

export const canvasStore = new Store<CanvasState>({
  tool: Tool.PEN,
  lineWidth: 5,
  color: '#ffffff',
  history: [],
  historyStep: -1,
  currentBase64: null,
  showGrid: false
});

// Hydrate canvas from appStore sketch on load
const unsub = appStore.subscribe((appState) => {
    if (appState.isLoaded && appState.sketchBase64 && canvasStore.getState().historyStep === -1) {
        canvasStore.update(s => ({ ...s, currentBase64: appState.sketchBase64 }));
        unsub(); // One-time sync on load
    }
});

// Actions
export const setTool = (tool: Tool) => canvasStore.update(s => ({ ...s, tool }));
export const setColor = (color: string) => canvasStore.update(s => ({ ...s, color }));
export const setLineWidth = (width: number) => canvasStore.update(s => ({ ...s, lineWidth: width }));
export const toggleGrid = () => canvasStore.update(s => ({ ...s, showGrid: !s.showGrid }));

export const pushHistory = (imageData: ImageData, base64: string) => {
    canvasStore.update(s => {
        const newHistory = s.history.slice(0, s.historyStep + 1);
        newHistory.push(imageData);
        if (newHistory.length > 50) newHistory.shift(); // Limited to 50 steps
        
        // Sync to appStore for persistence
        setTimeout(() => appStore.update(as => ({ ...as, sketchBase64: base64 })), 0);

        return {
            ...s,
            history: newHistory,
            historyStep: newHistory.length - 1,
            currentBase64: base64
        };
    });
};

export const undo = () => {
    const s = canvasStore.getState();
    if (s.historyStep > 0) {
        canvasStore.update(prev => ({ ...prev, historyStep: prev.historyStep - 1 }));
    }
};

export const redo = () => {
    const s = canvasStore.getState();
    if (s.historyStep < s.history.length - 1) {
        canvasStore.update(prev => ({ ...prev, historyStep: prev.historyStep + 1 }));
    }
};

export const clearCanvas = (width: number, height: number) => {
    // Create black image data
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        pushHistory(imageData, canvas.toDataURL('image/png'));
    }
};
