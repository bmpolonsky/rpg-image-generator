
import { appStore } from "../state/appStore";
import { canvasStore } from "../state/canvasStore";

class ProjectController {
    
    exportProject() {
        const appState = appStore.getState();
        const canvasState = canvasStore.getState();

        const projectData = {
            version: 1,
            timestamp: Date.now(),
            appState: {
                loreFiles: appState.loreFiles,
                locationRequest: appState.locationRequest,
                generatedDescription: appState.generatedDescription,
                narrativeDescription: appState.narrativeDescription,
                generatedImages: appState.generatedImages,
                mode: appState.mode,
                descriptionModel: appState.descriptionModel,
                imageModel: appState.imageModel,
                artStyle: appState.artStyle,
                imageCount: appState.imageCount,
                language: appState.language
            },
            canvasState: {
                currentBase64: canvasState.currentBase64
            }
        };

        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `loremap-project-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importProject(file: File) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);

                if (data.version && data.appState) {
                    // Update App Store
                    appStore.update(s => ({
                        ...s,
                        ...data.appState,
                        sketchBase64: data.canvasState?.currentBase64 || null,
                        error: null,
                        isLoaded: true
                    }));
                    
                    // Update Canvas Store
                    if (data.canvasState?.currentBase64) {
                         canvasStore.update(s => ({
                             ...s,
                             currentBase64: data.canvasState.currentBase64,
                             historyStep: -1, // Reset history on load to prevent sync issues
                             history: []
                         }));
                    }
                } else {
                    alert("Invalid project file format.");
                }
            } catch (err) {
                console.error(err);
                alert("Failed to parse project file.");
            }
        };
        reader.readAsText(file);
    }
}

export const projectController = new ProjectController();
