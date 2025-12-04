

import { appStore } from "../state/appStore";
import { canvasStore } from "../state/canvasStore";
import { AIController } from "./aiController";
import { GeneratedAsset } from "../types";
import { TRANSLATIONS } from "../translations";

class GenerationController {
  private abortController: AbortController | null = null;
  private timerInterval: number | null = null;

  constructor() {
     appStore.subscribe(state => {
         const isWorking = state.isGeneratingDescription || state.isGeneratingImage || state.isEditingImage || state.isGeneratingNarrative;
         if (isWorking && !this.timerInterval) {
             this.startTimer();
         } else if (!isWorking && this.timerInterval) {
             this.stopTimer();
         }
     });
  }

  private startTimer() {
      this.timerInterval = window.setInterval(() => {
          appStore.update(s => ({ ...s, genTimer: s.genTimer + 0.1 }));
      }, 100);
  }

  private stopTimer() {
      if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
      }
  }

  private initAbortController() {
      if (this.abortController) this.abortController.abort();
      this.abortController = new AbortController();
      return this.abortController.signal;
  }

  private async ensureApiKey(model: string): Promise<boolean> {
      if (model === 'gemini-3-pro-image-preview') {
          if (window.aistudio && window.aistudio.hasSelectedApiKey) {
              const hasKey = await window.aistudio.hasSelectedApiKey();
              if (!hasKey) {
                  if (window.aistudio.openSelectKey) {
                      try {
                        await window.aistudio.openSelectKey();
                        return true; // Assume success to handle race condition
                      } catch (e) {
                          console.error("Key selection failed", e);
                          return false;
                      }
                  }
                  return false;
              }
          }
      }
      return true;
  }

  cancel() {
      if (this.abortController) {
          this.abortController.abort();
          this.abortController = null;
      }
      appStore.update(s => ({
          ...s,
          isGeneratingDescription: false,
          isGeneratingImage: false,
          isEditingImage: false,
          isGeneratingNarrative: false,
          error: null
      }));
  }

  handleError(err: any) {
    const state = appStore.getState();
    if (err.name === 'AbortError' || err.message === 'Cancelled') {
        this.cancel();
        return;
    }
    
    let msg = (err as Error).message || "Unknown error";
    if (msg.includes("403") || msg.includes("permission") || msg.includes("entity was not found")) {
        msg = "Access denied or Key missing. Please check your API Key selection.";
    }
    
    appStore.update(s => ({
        ...s,
        error: msg,
        isGeneratingDescription: false,
        isGeneratingImage: false,
        isEditingImage: false,
        isGeneratingNarrative: false
    }));
  }

  async generateFull() {
    const state = appStore.getState();
    const canvasState = canvasStore.getState();

    if (!state.locationRequest) {
        appStore.update(s => ({ ...s, error: TRANSLATIONS[s.language].errNoRequest }));
        return;
    }

    // Check API Key for Pro models
    if (!(await this.ensureApiKey(state.imageModel))) {
        appStore.update(s => ({ ...s, error: "API Key selection required for this model." }));
        return;
    }

    const signal = this.initAbortController();
    const sketch = canvasState.currentBase64; // Get directly from canvas store
    const isDirectMode = state.descriptionModel === 'skip';

    appStore.update(s => ({ 
        ...s, 
        genTimer: 0,
        isGeneratingDescription: true, 
        isGeneratingNarrative: true, 
        error: null,
    }));

    const textStartTime = Date.now();
    let currentDescription = "";
    
    // Start narrative generation but don't await it yet for UI flow
    const narrativePromise = AIController.generateNarrativeText(state.loreFiles, state.locationRequest, state.mode, state.language)
        .then(text => {
            if (signal.aborted) return "";
            appStore.update(s => ({
                ...s, 
                narrativeDescription: text,
                isGeneratingNarrative: false
            }));
            return text;
        });

    try {
        // 2. Visual Description
        if (isDirectMode) {
             currentDescription = state.locationRequest;
             await new Promise(r => setTimeout(r, 100));
        } else {
             currentDescription = await AIController.generateVisualDescription(
                state.loreFiles,
                state.locationRequest,
                sketch,
                state.descriptionModel,
                state.mode,
                state.artStyle
            );
        }

        if (signal.aborted) throw new Error('Cancelled');

        appStore.update(s => ({
            ...s,
            generatedDescription: currentDescription,
            lastTextDuration: Date.now() - textStartTime,
            isGeneratingDescription: false,
            isGeneratingImage: true
        }));

        // 3. Images
        const imageStartTime = Date.now();
        const imgPromises = Array(state.imageCount).fill(null).map(async () => {
            if (signal.aborted) return;
            try {
                // Wait for narrative before creating the asset to ensure data integrity
                const narrativeText = await narrativePromise;
                if (signal.aborted) return;

                const imgUrl = await AIController.generateSingleImage(
                    currentDescription,
                    sketch,
                    state.imageModel,
                    state.mode,
                    state.artStyle
                );
                
                if (signal.aborted) return;

                const newAsset: GeneratedAsset = {
                    imageUrl: imgUrl,
                    narrative: narrativeText,
                    visualPrompt: currentDescription
                };

                appStore.update(s => ({
                    ...s,
                    generatedImages: [...s.generatedImages, newAsset],
                    selectedImageIndex: s.generatedImages.length // Select new
                }));
            } catch (e) {
                console.error("Single image gen failed", e);
                // Don't throw here to allow other images to finish
            }
        });

        await Promise.all(imgPromises);
        
        if (!signal.aborted) {
             appStore.update(s => ({
                 ...s,
                 lastImageDuration: Date.now() - imageStartTime,
                 isGeneratingImage: false
             }));
        }

    } catch (err) {
        this.handleError(err);
    } finally {
        this.abortController = null;
    }
  }

  async generateVariations() {
      const state = appStore.getState();
      const sketch = canvasStore.getState().currentBase64;

      if (!state.generatedDescription) return;
      if (!(await this.ensureApiKey(state.imageModel))) return;

      const signal = this.initAbortController();

      appStore.update(s => ({ ...s, genTimer: 0, isGeneratingImage: true, error: null }));

      try {
          const startTime = Date.now();
          const promises = Array(state.imageCount).fill(null).map(async () => {
              if (signal.aborted) return;
              try {
                  const imgUrl = await AIController.generateSingleImage(
                      state.generatedDescription,
                      sketch,
                      state.imageModel,
                      state.mode,
                      state.artStyle
                  );
                  if (signal.aborted) return;
                  
                  const newAsset: GeneratedAsset = {
                      imageUrl: imgUrl,
                      narrative: state.narrativeDescription,
                      visualPrompt: state.generatedDescription
                  };
                  appStore.update(s => ({
                      ...s,
                      generatedImages: [...s.generatedImages, newAsset],
                      selectedImageIndex: s.generatedImages.length
                  }));
              } catch (e) { console.error(e); }
          });

          await Promise.all(promises);

          if (!signal.aborted) {
              appStore.update(s => ({
                  ...s,
                  lastImageDuration: Date.now() - startTime,
                  isGeneratingImage: false
              }));
          }
      } catch (err) {
          this.handleError(err);
      }
  }

  async editImage(prompt: string) {
      const state = appStore.getState();
      const targetAsset = state.generatedImages[state.selectedImageIndex];
      if (!prompt.trim() || !targetAsset) return;

      if (!(await this.ensureApiKey(state.imageModel))) return;

      const signal = this.initAbortController();
      appStore.update(s => ({ ...s, genTimer: 0, isEditingImage: true, error: null }));

      try {
          const startTime = Date.now();
          const updatedUrl = await AIController.editProjectImage(
              targetAsset.imageUrl,
              prompt,
              state.imageModel,
              state.mode,
              state.artStyle
          );

          if (signal.aborted) throw new Error('Cancelled');

          const newAsset: GeneratedAsset = {
              imageUrl: updatedUrl,
              narrative: targetAsset.narrative,
              visualPrompt: targetAsset.visualPrompt
          };

          appStore.update(s => ({
              ...s,
              generatedImages: [...s.generatedImages, newAsset],
              selectedImageIndex: s.generatedImages.length,
              lastImageDuration: Date.now() - startTime,
              isEditingImage: false
          }));

      } catch (err) {
          this.handleError(err);
      }
  }

  deleteImage(index: number | null, isAll: boolean) {
      if (isAll) {
          appStore.update(s => ({ ...s, generatedImages: [], selectedImageIndex: 0 }));
      } else if (index !== null) {
          appStore.update(s => {
              const newImages = s.generatedImages.filter((_, i) => i !== index);
              let newIndex = s.selectedImageIndex;
              if (index < newIndex) newIndex--;
              else if (index === newIndex && newIndex > 0) newIndex--;
              
              return {
                  ...s,
                  generatedImages: newImages,
                  selectedImageIndex: newIndex
              };
          });
      }
  }
}

export const generationController = new GenerationController();