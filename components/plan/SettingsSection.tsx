
import React from 'react';
import { appStore } from '../../state/appStore';
import { useStore } from '../../lib/store';
import { TRANSLATIONS } from '../../translations';

const SettingsSection: React.FC = () => {
    const { descriptionModel, imageModel, artStyle, imageCount, language } = useStore(appStore);
    const t = TRANSLATIONS[language];

    const handleImageModelChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newVal = e.target.value;
        appStore.update(s => ({...s, imageModel: newVal}));

        // Check if Pro model and ensure key is selected immediately
        if (newVal === 'gemini-3-pro-image-preview') {
            if (window.aistudio && window.aistudio.openSelectKey) {
                try {
                    // Force open key selector if we can't verify a key is selected
                    // The API doesn't always strictly return true/false synchronously so we rely on user action
                    const hasKey = window.aistudio.hasSelectedApiKey 
                        ? await window.aistudio.hasSelectedApiKey() 
                        : false;
                    
                    if (!hasKey) {
                        await window.aistudio.openSelectKey();
                    }
                } catch (err) {
                    console.error("Failed to open key selector", err);
                }
            }
        }
    };

    return (
        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 space-y-3">
            {/* Text Model */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="font-semibold uppercase tracking-wide">{t.textModel}</span>
                </div>
                <select
                    value={descriptionModel}
                    onChange={(e) => appStore.update(s => ({...s, descriptionModel: e.target.value}))}
                    className="bg-gray-800 text-xs text-gray-300 border border-gray-600 rounded px-2 py-1 outline-none focus:border-amber-450 cursor-pointer w-40"
                >
                    <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="skip">{t.modelDirect}</option>
                </select>
            </div>

            {/* Image Model */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="font-semibold uppercase tracking-wide">{t.imageModel}</span>
                </div>
                <select
                    value={imageModel}
                    onChange={handleImageModelChange}
                    className="bg-gray-800 text-xs text-gray-300 border border-gray-600 rounded px-2 py-1 outline-none focus:border-amber-450 cursor-pointer w-40"
                >
                        <option value="gemini-2.5-flash-image">Gemini 2.5 Flash</option>
                        <option value="gemini-3-pro-image-preview">Gemini 3 Pro Image {t.requiresKey}</option>
                </select>
            </div>

            {/* Art Style */}
            <div className="flex items-center justify-between border-t border-gray-700 pt-3">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="font-semibold uppercase tracking-wide">{t.artStyle}</span>
                </div>
                <select
                    value={artStyle}
                    onChange={(e) => appStore.update(s => ({...s, artStyle: e.target.value}))}
                    className="bg-gray-800 text-xs text-gray-300 border border-gray-600 rounded px-2 py-1 outline-none focus:border-amber-450 cursor-pointer w-40"
                >
                        <option value="modern">{t.styles.modern}</option>
                        <option value="realistic">{t.styles.realistic}</option>
                        <option value="anime">{t.styles.anime}</option>
                        <option value="comic">{t.styles.comic}</option>
                        <option value="pixelart">{t.styles.pixelart}</option>
                        <option value="watercolor">{t.styles.watercolor}</option>
                        <option value="oilpainting">{t.styles.oilpainting}</option>
                        <option value="oldschool">{t.styles.oldschool}</option>
                        <option value="grimdark">{t.styles.grimdark}</option>
                        <option value="gothic">{t.styles.gothic}</option>
                        <option value="cyberpunk">{t.styles.cyberpunk}</option>
                        <option value="sketch">{t.styles.sketch}</option>
                        <option value="isometric">{t.styles.isometric}</option>
                        <option value="blueprint">{t.styles.blueprint}</option>
                        <option value="noir">{t.styles.noir}</option>
                        <option value="claymation">{t.styles.claymation}</option>
                </select>
            </div>

            {/* Image Count Selector */}
            <div className="flex items-center justify-between border-t border-gray-700 pt-3">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="font-semibold uppercase tracking-wide">{t.count}</span>
                </div>
                <div className="flex bg-gray-900 rounded border border-gray-600">
                    {[1, 2, 3, 4].map(n => (
                        <button
                            key={n}
                            onClick={() => appStore.update(s => ({...s, imageCount: n}))}
                            className={`px-3 py-1 text-xs font-medium transition-colors first:rounded-l last:rounded-r ${
                                imageCount === n 
                                ? 'bg-amber-450 text-black' 
                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                        >
                            {n}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SettingsSection;
