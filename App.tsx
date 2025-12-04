
import React, { useState, useRef } from 'react';
import { Sparkles, ImageIcon, AlertTriangle, X, PenTool, BookOpen, ArrowRight, Loader2, Upload, Download } from 'lucide-react';
import PaintCanvas from './components/PaintCanvas';
import PlanPanel from './components/plan/PlanPanel';
import ResultsPanel from './components/ResultsPanel';
import DeleteModal from './components/DeleteModal';
import { GenerationMode } from './types';
import { TRANSLATIONS } from './translations';
import { appStore } from './state/appStore';
import { useStore } from './lib/store';
import { generationController } from './controllers/generationController';
import { projectController } from './controllers/projectController';

enum Tab {
  SKETCH = 'SKETCH',
  RESULTS = 'RESULTS'
}

enum MobileTab {
    SKETCH = 'SKETCH',
    PLAN = 'PLAN',
    RESULTS = 'RESULTS'
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.SKETCH);
  const [mobileTab, setMobileTab] = useState<MobileTab>(MobileTab.SKETCH);
  const [deleteConfirmState, setDeleteConfirmState] = useState<{isOpen: boolean; index: number | null; isAll: boolean}>({
    isOpen: false, index: null, isAll: false
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const state = useStore(appStore);
  
  if (!state.isLoaded) {
      return <div className="h-screen bg-gray-950 flex items-center justify-center text-amber-450"><Loader2 className="animate-spin mr-2"/> Loading...</div>;
  }

  const t = TRANSLATIONS[state.language];

  const getSketchHelperText = (mode: GenerationMode) => {
    switch (mode) {
      case GenerationMode.BATTLEMAP: return t.sketchHelpers.battlemap;
      case GenerationMode.LOCATION: return t.sketchHelpers.location;
      case GenerationMode.CHARACTER: return t.sketchHelpers.character;
    }
  };

  const requestDeleteImage = (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      setDeleteConfirmState({ isOpen: true, index, isAll: false });
  };

  const requestDeleteAll = () => {
      if (state.generatedImages.length === 0) return;
      setDeleteConfirmState({ isOpen: true, index: null, isAll: true });
  }

  const confirmDelete = () => {
      generationController.deleteImage(deleteConfirmState.index, deleteConfirmState.isAll);
      setDeleteConfirmState({ isOpen: false, index: null, isAll: false });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          projectController.importProject(e.target.files[0]);
      }
      e.target.value = '';
  };

  if (state.isGeneratingImage && activeTab !== Tab.RESULTS && !state.error) {
     setActiveTab(Tab.RESULTS);
     if (window.innerWidth < 1024) setMobileTab(MobileTab.RESULTS);
  }

  return (
    <div className="h-screen bg-gray-950 text-gray-200 font-sans flex flex-col overflow-hidden relative">
      
      <DeleteModal 
        isOpen={deleteConfirmState.isOpen}
        isAll={deleteConfirmState.isAll}
        onClose={() => setDeleteConfirmState({ isOpen: false, index: null, isAll: false })}
        onConfirm={confirmDelete}
        lang={state.language}
      />

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-amber-450 p-1.5 rounded-lg text-black">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-base lg:text-lg font-bold tracking-tight text-white leading-tight">{t.appTitle}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
           {/* Project Actions */}
           <div className="hidden lg:flex items-center gap-2">
               <button onClick={() => projectController.exportProject()} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800 transition-colors" title={t.exportProject}>
                   <Download size={14} /> {t.exportProject}
               </button>
               <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800 transition-colors" title={t.importProject}>
                   <Upload size={14} /> {t.importProject}
               </button>
               <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
           </div>

           {/* Language Switcher */}
           <div className="flex items-center bg-gray-800 rounded-md p-0.5 border border-gray-700">
               <button 
                onClick={() => appStore.update(s => ({...s, language: 'ru'}))}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${state.language === 'ru' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}
               >
                   🇷🇺 RU
               </button>
               <button 
                onClick={() => appStore.update(s => ({...s, language: 'en'}))}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${state.language === 'en' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}
               >
                   🇺🇸 EN
               </button>
           </div>

           {state.error && (
            <div className="text-red-400 text-sm flex items-center gap-2 bg-red-900/20 px-3 py-1 rounded border border-red-900/50 absolute left-4 right-4 top-14 lg:static z-50 lg:z-auto shadow-lg lg:shadow-none">
               <AlertTriangle size={14} className="flex-shrink-0" />
               <span className="font-medium whitespace-normal break-words">{state.error}</span>
               <button onClick={() => appStore.update(s => ({...s, error: null}))} className="hover:text-white ml-auto lg:ml-2 text-red-300">
                 <X size={14} />
               </button>
            </div>
           )}
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="flex-grow flex overflow-hidden relative">
        
        {/* DESKTOP LAYOUT */}
        <div className="hidden lg:flex w-full h-full">
            <div className="w-[400px] bg-gray-900 border-r border-gray-800 flex flex-col p-4 overflow-y-auto custom-scrollbar">
                <PlanPanel />
            </div>
            
            <div className="flex-grow flex flex-col bg-gray-950 w-full overflow-hidden">
                <div className="flex items-center justify-between p-2 bg-gray-900 border-b border-gray-800 flex-shrink-0">
                    <div className="flex items-center gap-1">
                        <button
                        onClick={() => setActiveTab(Tab.SKETCH)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === Tab.SKETCH ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                        }`}
                        >
                        <PenTool size={16} /> {t.tabSketch}
                        </button>
                        <button
                        onClick={() => setActiveTab(Tab.RESULTS)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === Tab.RESULTS ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                        }`}
                        >
                        <ImageIcon size={16} /> {t.tabResults} {state.generatedImages.length > 0 && `(${state.generatedImages.length})`}
                        </button>
                    </div>
                </div>

                <div className="flex-grow relative overflow-hidden p-4">
                    <div className={`w-full h-full flex flex-col ${activeTab === Tab.SKETCH ? 'block' : 'hidden'}`}>
                        <p className="text-gray-500 text-sm mb-2 flex items-center gap-2">
                            <ArrowRight size={14} /> {getSketchHelperText(state.mode)}
                        </p>
                        <div className="flex-grow overflow-hidden flex flex-col items-center justify-center bg-gray-950 rounded-lg">
                            <PaintCanvas />
                        </div>
                    </div>
                    <div className={`w-full h-full ${activeTab === Tab.RESULTS ? 'block' : 'hidden'}`}>
                        <ResultsPanel 
                            onDeleteRequest={requestDeleteImage}
                            onDeleteAllRequest={requestDeleteAll}
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* MOBILE LAYOUT */}
        <div className="lg:hidden w-full h-full flex flex-col">
            <div className="flex-grow overflow-y-auto overflow-x-hidden p-3 relative">
                 <div className={`w-full h-full flex flex-col ${mobileTab === MobileTab.SKETCH ? 'flex' : 'hidden'}`}>
                     <p className="text-gray-500 text-xs mb-2 flex items-center gap-2">
                            <ArrowRight size={12} /> {getSketchHelperText(state.mode)}
                     </p>
                     <div className="flex-grow overflow-hidden flex flex-col items-center justify-center bg-gray-950 rounded-lg border border-gray-800">
                        <PaintCanvas />
                     </div>
                 </div>

                 <div className={`w-full ${mobileTab === MobileTab.PLAN ? 'block' : 'hidden'}`}>
                    <PlanPanel />
                 </div>

                 <div className={`w-full h-full ${mobileTab === MobileTab.RESULTS ? 'block' : 'hidden'}`}>
                     <ResultsPanel 
                        onDeleteRequest={requestDeleteImage}
                        onDeleteAllRequest={requestDeleteAll}
                    />
                 </div>
            </div>

            <div className="flex-shrink-0 bg-gray-900 border-t border-gray-800 flex justify-around p-2 pb-6 z-30">
                <button 
                    onClick={() => setMobileTab(MobileTab.SKETCH)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors w-20 ${mobileTab === MobileTab.SKETCH ? 'text-amber-450 bg-gray-800' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <PenTool size={20} />
                    <span className="text-[10px] font-medium">{t.tabSketch}</span>
                </button>

                <button 
                    onClick={() => setMobileTab(MobileTab.PLAN)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors w-20 ${mobileTab === MobileTab.PLAN ? 'text-amber-450 bg-gray-800' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <BookOpen size={20} />
                    <span className="text-[10px] font-medium">{t.tabPlan}</span>
                </button>

                <button 
                    onClick={() => setMobileTab(MobileTab.RESULTS)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors w-20 ${mobileTab === MobileTab.RESULTS ? 'text-amber-450 bg-gray-800' : 'text-gray-500 hover:text-gray-300'} relative`}
                >
                    <ImageIcon size={20} />
                    <span className="text-[10px] font-medium">{t.tabResults}</span>
                    {state.generatedImages.length > 0 && (
                        <span className="absolute top-2 right-4 w-2 h-2 bg-amber-450 rounded-full"></span>
                    )}
                </button>
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;
