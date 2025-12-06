
import React, { useRef, useEffect, useState } from 'react';
import { Tool } from '../types';
import { Eraser, Pencil, Trash2, Undo, Redo, Square, Circle, Minus, Grid3X3, ImagePlus } from 'lucide-react';
import { useStore } from '../lib/store';
import { canvasStore, setTool, setColor, setLineWidth, pushHistory, undo, redo, clearCanvas, toggleGrid } from '../state/canvasStore';
import { appStore } from '../state/appStore';
import { TRANSLATIONS } from '../translations';

const PaintCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { tool, lineWidth, color, history, historyStep, currentBase64, showGrid } = useStore(canvasStore);
  const { language } = useStore(appStore);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{x: number, y: number} | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);

  const t = TRANSLATIONS[language];

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
            redo();
        } else {
            undo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key.toLowerCase() === 'b') {
        setTool(Tool.PEN);
      } else if (e.key.toLowerCase() === 'e') {
        setTool(Tool.ERASER);
      } else if (e.key.toLowerCase() === 'g') {
        toggleGrid();
      } else if (e.key === '[') {
        setLineWidth(Math.max(1, lineWidth - 2));
      } else if (e.key === ']') {
        setLineWidth(Math.min(50, lineWidth + 2));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lineWidth]);

  // Sync canvas with history when historyStep changes
  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (historyStep >= 0 && history[historyStep]) {
          ctx.putImageData(history[historyStep], 0, 0);
      } else if (historyStep === -1) {
          // If fresh but we have a base64 from persistence
          if (currentBase64) {
              const img = new Image();
              img.onload = () => {
                  ctx.drawImage(img, 0, 0);
                  // Initialize history with this image
                  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  pushHistory(data, currentBase64);
              };
              img.src = currentBase64;
          } else {
              // Fill black
              ctx.fillStyle = '#000000';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              // Save initial blank state
              const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
              pushHistory(data, canvas.toDataURL('image/png'));
          }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyStep, history]);

  const getCoordinates = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent scrolling
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Capture pointer to ensure we get events even if cursor leaves canvas
    (e.target as Element).setPointerCapture(e.pointerId);

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    setIsDrawing(true);
    const pos = getCoordinates(e);
    
    if (tool === Tool.RECT || tool === Tool.CIRCLE || tool === Tool.LINE) {
        setStartPos(pos);
        snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } else {
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPos = getCoordinates(e);

    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round'; // Fixes "sharp square" corners on thick lines
    ctx.strokeStyle = tool === Tool.ERASER ? '#000000' : color;

    if (tool === Tool.PEN || tool === Tool.ERASER) {
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.stroke();
    } else if (snapshotRef.current && startPos) {
        ctx.putImageData(snapshotRef.current, 0, 0);
        ctx.beginPath();

        if (tool === Tool.RECT) {
            ctx.rect(startPos.x, startPos.y, currentPos.x - startPos.x, currentPos.y - startPos.y);
            ctx.stroke();
        } else if (tool === Tool.CIRCLE) {
            const radius = Math.sqrt(Math.pow(currentPos.x - startPos.x, 2) + Math.pow(currentPos.y - startPos.y, 2));
            ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (tool === Tool.LINE) {
            ctx.moveTo(startPos.x, startPos.y);
            ctx.lineTo(currentPos.x, currentPos.y);
            ctx.stroke();
        }
    }
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isDrawing) {
      setIsDrawing(false);
      
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch (err) {
          // ignore
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (tool === Tool.PEN || tool === Tool.ERASER) {
            ctx?.closePath();
        }
        setStartPos(null);
        snapshotRef.current = null;
        
        // Save to store
        if (ctx) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            pushHistory(imageData, canvas.toDataURL('image/png'));
        }
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Fit image to canvas preserving aspect ratio
            const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
            const w = img.width * scale;
            const h = img.height * scale;
            const x = (canvas.width - w) / 2;
            const y = (canvas.height - h) / 2;

            // Draw black background first
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.drawImage(img, x, y, w, h);
            
            // Save to history
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            pushHistory(imageData, canvas.toDataURL('image/png'));
        };
        img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-2 w-full h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg border border-gray-700 flex-shrink-0 select-none overflow-x-auto no-scrollbar">
        <button title="Pencil (B)" onClick={() => setTool(Tool.PEN)} className={`p-2 rounded flex-shrink-0 ${tool === Tool.PEN ? 'bg-amber-450 text-black' : 'text-gray-300 hover:bg-gray-700'}`}>
          <Pencil size={18} />
        </button>
        <button title="Eraser (E)" onClick={() => setTool(Tool.ERASER)} className={`p-2 rounded flex-shrink-0 ${tool === Tool.ERASER ? 'bg-amber-450 text-black' : 'text-gray-300 hover:bg-gray-700'}`}>
          <Eraser size={18} />
        </button>
        <div className="h-6 w-px bg-gray-600 mx-1 flex-shrink-0"></div>
         <button onClick={() => setTool(Tool.RECT)} className={`p-2 rounded flex-shrink-0 ${tool === Tool.RECT ? 'bg-amber-450 text-black' : 'text-gray-300 hover:bg-gray-700'}`}>
          <Square size={18} />
        </button>
         <button onClick={() => setTool(Tool.CIRCLE)} className={`p-2 rounded flex-shrink-0 ${tool === Tool.CIRCLE ? 'bg-amber-450 text-black' : 'text-gray-300 hover:bg-gray-700'}`}>
          <Circle size={18} />
        </button>
         <button onClick={() => setTool(Tool.LINE)} className={`p-2 rounded flex-shrink-0 ${tool === Tool.LINE ? 'bg-amber-450 text-black' : 'text-gray-300 hover:bg-gray-700'}`}>
          <Minus size={18} className="rotate-45" />
        </button>

        <div className="h-6 w-px bg-gray-600 mx-1 flex-shrink-0"></div>

        <button 
            title="Toggle Grid (G)" 
            onClick={toggleGrid} 
            className={`p-2 rounded flex-shrink-0 ${showGrid ? 'bg-gray-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
        >
          <Grid3X3 size={18} />
        </button>

        <div className="h-6 w-px bg-gray-600 mx-1 flex-shrink-0"></div>

        <input 
          type="color" 
          value={color} 
          onChange={(e) => { setColor(e.target.value); setTool(Tool.PEN); }}
          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent flex-shrink-0"
        />

        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                <div 
                    className="rounded-full bg-white border border-gray-400"
                    style={{ 
                        width: lineWidth, 
                        height: lineWidth, 
                        backgroundColor: tool === Tool.ERASER ? '#000' : color,
                        borderColor: tool === Tool.ERASER ? '#fff' : 'transparent',
                        maxHeight: '24px', maxWidth: '24px'
                    }}
                />
            </div>
            <input 
                type="range" min="1" max="50" value={lineWidth} 
                onChange={(e) => setLineWidth(Number(e.target.value))}
                className="w-16 sm:w-20 accent-amber-450 cursor-pointer"
            />
        </div>

        <div className="flex-grow min-w-[10px]"></div>

        <div className="flex items-center gap-1 bg-gray-900/50 rounded-lg px-1 flex-shrink-0">
            <button title="Undo (Ctrl+Z)" onClick={undo} disabled={historyStep <= 0} className="p-2 rounded text-gray-300 hover:text-white hover:bg-gray-700 disabled:opacity-30">
                <Undo size={18} />
            </button>
            <button title="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={historyStep >= history.length - 1} className="p-2 rounded text-gray-300 hover:text-white hover:bg-gray-700 disabled:opacity-30">
                <Redo size={18} />
            </button>
        </div>

        <div className="h-6 w-px bg-gray-600 mx-1 flex-shrink-0"></div>

        <button title={t.uploadReference} onClick={() => fileInputRef.current?.click()} className="p-2 rounded text-gray-300 hover:bg-gray-700 hover:text-white flex-shrink-0">
          <ImagePlus size={18} />
        </button>
        <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleImageUpload}
        />

        <button onClick={() => clearCanvas(800, 800)} className="p-2 rounded text-red-400 hover:bg-red-900/30 hover:text-red-300 flex-shrink-0">
          <Trash2 size={18} />
        </button>
      </div>

      <div className="flex-grow relative min-h-0 bg-gray-900 rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center overflow-hidden w-full">
        <div className="relative max-w-full max-h-full aspect-square shadow-2xl">
            {/* Grid Overlay */}
            {showGrid && (
                <div 
                    className="absolute inset-0 z-10 pointer-events-none opacity-30"
                    style={{
                        backgroundImage: `linear-gradient(to right, #444 1px, transparent 1px), linear-gradient(to bottom, #444 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                ></div>
            )}
            
            <canvas
                ref={canvasRef}
                width={800}
                height={800}
                className="w-full h-full block bg-black touch-none cursor-crosshair relative z-0"
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerCancel={stopDrawing}
                onPointerLeave={stopDrawing}
            />
        </div>
      </div>
    </div>
  );
};

export default PaintCanvas;
