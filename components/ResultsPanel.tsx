import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Download, Trash, X, ScrollText, Sparkles, Wand2, LayoutTemplate, Timer, RefreshCw } from 'lucide-react';
import { appStore } from '../state/appStore';
import { useStore } from '../lib/store';
import { generationController } from '../controllers/generationController';
import { TRANSLATIONS } from '../translations';

interface ResultsPanelProps {
    onDeleteRequest: (index: number, e: React.MouseEvent) => void;
    onDeleteAllRequest: () => void;
}

const DownloadMenu = ({ imageUrl, index, t }: { imageUrl: string, index: number, t: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [stats, setStats] = useState<{pngSize: number, webpSize: number, webpUrl: string} | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        let active = true;
        const calc = async () => {
            if (!imageUrl) return;
            setIsCalculating(true);
            setStats(null);
            
            try {
                const pngRes = await fetch(imageUrl);
                const pngBlob = await pngRes.blob();
                const pngSize = pngBlob.size;

                if (!active) return;

                const img = new Image();
                img.src = imageUrl;
                await new Promise((resolve) => { img.onload = resolve; });
                
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const webpUrl = canvas.toDataURL('image/webp', 0.9);
                    
                    const webpRes = await fetch(webpUrl);
                    const webpBlob = await webpRes.blob();
                    
                    if (active) {
                        setStats({ pngSize, webpSize: webpBlob.size, webpUrl });
                    }
                }
            } catch(e) { console.error(e); } finally { if (active) setIsCalculating(false); }
        };
        
        const timeout = setTimeout(calc, 100);
        return () => { active = false; clearTimeout(timeout); };
    }, [imageUrl]);
    
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="absolute top-4 right-4 z-30" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg backdrop-blur-sm transition-all flex items-center gap-2 border border-white/10 ${isOpen ? 'ring-2 ring-amber-450' : ''}`}
                title={t.download}
            >
                <Download size={20} />
            </button>
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden flex flex-col z-40">
                    <div className="bg-gray-800 px-3 py-2 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                        {t.download}
                    </div>
                    <a href={imageUrl} download={`rpg-asset-${index}.png`} className="px-4 py-3 hover:bg-gray-800 flex flex-col gap-0.5 border-b border-gray-800" onClick={() => setIsOpen(false)}>
                        <span className="text-sm font-medium text-white flex justify-between items-center">
                            <span>{t.fmtOriginal}</span>
                            <span className="text-amber-450 text-[10px] border border-amber-450/30 px-1 rounded bg-amber-450/10">HQ</span>
                        </span>
                        <span className="text-xs text-gray-400 font-mono">{stats ? formatBytes(stats.pngSize) : t.calculating}</span>
                    </a>
                    {stats?.webpUrl ? (
                         <a href={stats.webpUrl} download={`rpg-asset-${index}.webp`} className="px-4 py-3 hover:bg-gray-800 flex flex-col gap-0.5" onClick={() => setIsOpen(false)}>
                            <span className="text-sm font-medium text-white flex justify-between items-center">
                                <span>{t.fmtWebp}</span>
                                {stats && <span className="text-green-400 text-[10px] border border-green-400/30 px-1 rounded bg-green-400/10">-{(100 - (stats.webpSize / stats.pngSize * 100)).toFixed(0)}%</span>}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">{formatBytes(stats.webpSize)}</span>
                        </a>
                    ) : (
                        <div className="px-4 py-3 text-xs text-gray-500 flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> {t.calculating}</div>
                    )}
                </div>
            )}
        </div>
    );
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ onDeleteRequest, onDeleteAllRequest }) => {
    const state = useStore(appStore);
    const { 
        generatedImages, 
        selectedImageIndex, 
        isGeneratingImage, 
        isGeneratingNarrative,
        isEditingImage,
        narrativeDescription,
        generatedDescription,
        lastTextDuration,
        language
    } = state;

    const t = TRANSLATIONS[language];
    const [editPrompt, setEditPrompt] = useState('');
    const currentAsset = generatedImages[selectedImageIndex];

    useEffect(() => {
        if (currentAsset && currentAsset.visualPrompt) {
             appStore.update(s => ({ ...s, generatedDescription: currentAsset.visualPrompt! }));
        }
    }, [selectedImageIndex, currentAsset]);

    const formatDuration = (ms?: number) => ms ? `${(ms / 1000).toFixed(1)}s` : null;

    const handleEditClick = () => {
        generationController.editImage(editPrompt);
        setEditPrompt('');
    };

    const displayedNarrative = currentAsset?.narrative || narrativeDescription;

    return (
     <div className="w-full h-full flex flex-col lg:flex-row gap-4">
       {generatedImages.length > 0 || isGeneratingImage ? (
                <>
                  <div className="flex-grow flex flex-col gap-2 min-w-0 h-[50vh] lg:h-full">
                    <div className="relative flex-grow bg-gray-900 rounded-lg border border-gray-800 flex items-center justify-center overflow-hidden group/main">
                       {currentAsset ? (
                         <img src={currentAsset.imageUrl} alt="Result" className="max-w-full max-h-full object-contain shadow-lg"/>
                       ) : isGeneratingImage ? (
                         <div className="flex flex-col items-center gap-2 text-amber-450 animate-pulse">
                           <Loader2 size={40} className="animate-spin" />
                           <span className="text-sm">{t.rendering}</span>
                         </div>
                       ) : null}

                       {currentAsset && (
                        <DownloadMenu imageUrl={currentAsset.imageUrl} index={selectedImageIndex} t={t} />
                       )}
                    </div>
                    
                    <div className="flex items-center gap-2 h-16 lg:h-24 pb-2 flex-shrink-0">
                      {generatedImages.length > 1 && (
                          <button onClick={onDeleteAllRequest} className="h-14 w-10 lg:h-20 flex flex-col items-center justify-center bg-gray-800 hover:bg-red-900/50 text-gray-500 hover:text-red-400 rounded-lg border border-gray-700 transition-colors flex-shrink-0" title={t.clearHistory}>
                             <Trash size={16} />
                          </button>
                      )}
                      <div className="flex gap-2 overflow-x-auto h-full custom-scrollbar flex-grow">
                        {generatedImages.map((asset, idx) => (
                            <div key={idx} onClick={() => appStore.update(s => ({...s, selectedImageIndex: idx}))} className={`relative flex-shrink-0 w-14 h-14 lg:w-20 lg:h-20 rounded-lg border-2 cursor-pointer group overflow-hidden ${selectedImageIndex === idx ? 'border-amber-450' : 'border-gray-700 opacity-60 hover:opacity-100'}`}>
                              <img src={asset.imageUrl} className="w-full h-full object-cover" alt="thumb" />
                              <button onClick={(e) => onDeleteRequest(idx, e)} className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white p-1 rounded-md transition-all z-20 lg:opacity-0 lg:group-hover:opacity-100">
                                  <X size={10}/>
                              </button>
                            </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4 overflow-y-auto custom-scrollbar lg:overflow-visible pb-20 lg:pb-0">
                    {(displayedNarrative || isGeneratingNarrative) && (
                        <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 shadow-lg backdrop-blur-sm relative overflow-hidden flex flex-col max-h-48 lg:max-h-60">
                           <div className="absolute top-0 left-0 w-1 h-full bg-amber-450/50"></div>
                           <h3 className="text-gray-300 font-bold flex items-center gap-2 mb-2 text-xs uppercase tracking-wider flex-shrink-0">
                                <ScrollText size={14} className="text-amber-450" /> {t.gmFlavorText}
                           </h3>
                           <div className="overflow-y-auto custom-scrollbar pr-1">
                               {isGeneratingNarrative ? (
                                   <div className="flex items-center gap-2 text-gray-500 text-xs italic"><Loader2 size={12} className="animate-spin"/> {t.writingStory}</div>
                               ) : (
                                   <p className="text-sm text-gray-200 leading-relaxed font-serif italic whitespace-pre-wrap">{displayedNarrative}</p>
                               )}
                           </div>
                        </div>
                    )}

                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                      <h3 className="text-white font-bold flex items-center gap-2 mb-3 text-sm lg:text-base"><Sparkles className="text-amber-450" size={16} /> {t.editImage}</h3>
                      <textarea
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        placeholder={t.editPlaceholder}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-base lg:text-sm focus:ring-1 focus:ring-amber-450 outline-none mb-3 h-20 lg:h-24 resize-none"
                      />
                      <button onClick={handleEditClick} disabled={isEditingImage || !editPrompt.trim()} className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm font-medium py-3 lg:py-2 rounded-lg flex items-center justify-center gap-2 transition-all border border-gray-600">
                        {isEditingImage ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} {t.btnVariant}
                      </button>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-gray-800">
                        <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><LayoutTemplate size={14} /> {t.aiVisualPrompt}</h2>
                        {lastTextDuration && (
                            <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded flex items-center gap-1"><Timer size={10}/> {formatDuration(lastTextDuration)}</span>
                        )}
                        </div>
                        <textarea 
                        className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-base lg:text-xs font-mono leading-relaxed focus:ring-1 focus:ring-amber-450 outline-none text-gray-300 h-32"
                        value={generatedDescription}
                        onChange={(e) => appStore.update(s => ({...s, generatedDescription: e.target.value}))}
                        />
                        <button onClick={() => generationController.generateVariations()} disabled={isGeneratingImage} className="w-full bg-gray-800 hover:bg-gray-700 text-amber-450 font-bold py-3 rounded-lg flex items-center justify-center gap-2 border border-gray-700 hover:border-amber-450/50 transition-all shadow-sm group">
                        {isGeneratingImage ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />}
                        {t.btnAddVariations}
                        </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center w-full h-full text-gray-600 flex-col gap-4">
                  <div className="p-4 bg-gray-800 rounded-full"><Wand2 size={32} className="text-gray-500" /></div>
                  <p>{t.emptyState}</p>
                </div>
              )
       }
     </div>
    );
};

export default ResultsPanel;