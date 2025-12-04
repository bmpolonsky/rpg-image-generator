import React from 'react';
import { BookOpen } from 'lucide-react';
import { appStore } from '../../state/appStore';
import { useStore } from '../../lib/store';
import FileUploader from '../FileUploader';
import { TRANSLATIONS } from '../../translations';

const LoreSection: React.FC = () => {
    const { loreFiles, descriptionModel, language } = useStore(appStore);
    const t = TRANSLATIONS[language];
    const isDirectMode = descriptionModel === 'skip';

    return (
        <div className={`space-y-2 transition-opacity duration-300 ${isDirectMode ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <BookOpen size={14} /> {t.loreContext}
            </h2>
            <FileUploader 
                files={loreFiles} 
                onFilesChange={(files) => appStore.update(s => ({...s, loreFiles: files}))}
                lang={language}
            />
        </div>
    );
};

export default LoreSection;