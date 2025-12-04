
import React from 'react';
import { BrainCircuit, Mic } from 'lucide-react';
import { appStore } from '../../state/appStore';
import { useStore } from '../../lib/store';
import { audioController } from '../../controllers/audioController';
import { TRANSLATIONS } from '../../translations';
import { GenerationMode } from '../../types';

const PromptSection: React.FC = () => {
    const { locationRequest, isListening, mode, language } = useStore(appStore);
    const t = TRANSLATIONS[language];

    const getPlaceholderText = () => {
        switch (mode) {
         case GenerationMode.BATTLEMAP: return t.placeholders.battlemap;
         case GenerationMode.LOCATION: return t.placeholders.location;
         case GenerationMode.CHARACTER: return t.placeholders.character;
       }
    };

    return (
        <div className="space-y-2 relative">
            <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <BrainCircuit size={14} /> {t.visualRequest}
                </h2>
                {isListening && <span className="text-xs text-red-400 animate-pulse flex items-center gap-1">● {t.listening}</span>}
            </div>
            <div className="relative">
                <textarea 
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pr-10 text-base lg:text-sm focus:ring-1 focus:ring-amber-450 outline-none text-white placeholder-gray-500"
                    rows={4}
                    placeholder={getPlaceholderText()}
                    value={locationRequest}
                    onChange={(e) => appStore.update(s => ({...s, locationRequest: e.target.value}))}
                />
                <button
                    onClick={() => audioController.toggleListening()}
                    className={`absolute bottom-2 right-2 p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-700 text-gray-300 hover:text-white'}`}
                    title={t.placeholders.voiceInput}
                >
                    <Mic size={16} />
                </button>
            </div>
        </div>
    );
};

export default PromptSection;
