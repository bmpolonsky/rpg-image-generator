import React from 'react';
import { Loader2, Square, Wand2 } from 'lucide-react';
import { appStore } from '../../state/appStore';
import { useStore } from '../../lib/store';
import { generationController } from '../../controllers/generationController';
import { TRANSLATIONS } from '../../translations';
import ModeSelector from './ModeSelector';
import LoreSection from './LoreSection';
import PromptSection from './PromptSection';
import SettingsSection from './SettingsSection';

const PlanPanel: React.FC = () => {
    const { 
        isGeneratingDescription, 
        isGeneratingImage, 
        genTimer,
        language 
    } = useStore(appStore);
    
    const t = TRANSLATIONS[language];
    const isWorking = isGeneratingDescription || isGeneratingImage;

    return (
        <div className="space-y-6 pb-20 lg:pb-0">
            <ModeSelector />
            <LoreSection />
            <PromptSection />
            <div className="space-y-3 pt-2">
                <SettingsSection />
                
                {isWorking ? (
                     <div className="flex items-stretch gap-2">
                         <button
                            disabled
                            className="flex-grow bg-amber-450/80 cursor-not-allowed opacity-90 text-gray-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg text-sm lg:text-base relative overflow-hidden"
                         >
                            {isGeneratingDescription ? (
                                <> <Loader2 className="animate-spin" size={18} /> {t.btnAnalyzing} {genTimer > 0 && <span className="text-xs font-mono opacity-70 ml-1">({genTimer.toFixed(1)}s)</span>} </>
                            ) : (
                                <> <Loader2 className="animate-spin" size={18} /> {t.btnPainting} {genTimer > 0 && <span className="text-xs font-mono opacity-70 ml-1">({genTimer.toFixed(1)}s)</span>} </>
                            )}
                         </button>
                         <button
                            onClick={() => generationController.cancel()}
                            className="flex-shrink-0 w-12 bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center justify-center shadow-lg transition-colors"
                            title="Stop"
                         >
                             <Square fill="currentColor" size={18} />
                         </button>
                     </div>
                ) : (
                    <button
                        onClick={() => generationController.generateFull()}
                        className="w-full bg-amber-450 hover:bg-amber-500 text-gray-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg text-sm lg:text-base relative overflow-hidden"
                    >
                         <Wand2 size={18} /> {t.btnGenerate}
                    </button>
                )}
            </div>
        </div>
    );
};

export default PlanPanel;