import React from 'react';
import { Map, Mountain, User } from 'lucide-react';
import { GenerationMode } from '../../types';
import { appStore } from '../../state/appStore';
import { useStore } from '../../lib/store';
import { TRANSLATIONS } from '../../translations';

const ModeSelector: React.FC = () => {
    const { mode, language } = useStore(appStore);
    const t = TRANSLATIONS[language];

    const getModeIcon = (m: GenerationMode) => {
        switch (m) {
          case GenerationMode.BATTLEMAP: return <Map size={18} />;
          case GenerationMode.LOCATION: return <Mountain size={18} />;
          case GenerationMode.CHARACTER: return <User size={18} />;
        }
    };

    const getModeLabel = (m: GenerationMode) => {
        switch (m) {
          case GenerationMode.BATTLEMAP: return t.modeBattlemap;
          case GenerationMode.LOCATION: return t.modeLocation;
          case GenerationMode.CHARACTER: return t.modeCharacter;
        }
    };

    return (
        <div className="grid grid-cols-3 gap-2 bg-gray-800 p-1 rounded-lg">
            {[GenerationMode.BATTLEMAP, GenerationMode.LOCATION, GenerationMode.CHARACTER].map((m) => (
                <button
                    key={m}
                    onClick={() => appStore.update(s => ({...s, mode: m}))}
                    className={`flex flex-col items-center justify-center py-2 rounded-md text-xs font-medium transition-all ${
                        mode === m 
                        ? 'bg-amber-450 text-gray-900 shadow' 
                        : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                    }`}
                >
                    {getModeIcon(m)}
                    <span className="mt-1 hidden sm:inline">{getModeLabel(m)}</span>
                    <span className="mt-1 sm:hidden text-[10px]">{getModeLabel(m).split(' ')[0]}</span>
                </button>
            ))}
        </div>
    );
};

export default ModeSelector;