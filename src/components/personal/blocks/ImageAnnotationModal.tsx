import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Pencil, Highlighter, Eraser, RotateCcw, RotateCw, Trash2, 
  Download, X, ArrowLeft, ZoomIn, ZoomOut, Hand,
  ChevronUp, ChevronDown, PenLine, Lock, Unlock, AlertCircle
} from 'lucide-react';

interface Point {
  x: number;
  y: number;
  pressure?: number;
}

interface DrawingPath {
  id: string;
  points: Point[];
  color: string;
  size: number;
  isHighlighter: boolean;
  isEraser: boolean;
}

interface ImageAnnotationModalProps {
  src: string;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  { name: 'Merah', value: '#ef4444' },
  { name: 'Kuning', value: '#eab308' },
  { name: 'Hijau', value: '#22c55e' },
  { name: 'Biru', value: '#3b82f6' },
  { name: 'Ungu', value: '#a855f7' },
  { name: 'Putih', value: '#ffffff' },
  { name: 'Hitam', value: '#0f172a' },
];

export const ImageAnnotationModal: React.FC<ImageAnnotationModalProps> = ({
  src,
  isOpen,
  onClose
}) => {
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser' | 'pan'>('pen');
  const [color, setColor] = useState<string>('#ef4444');
  const [size, setSize] = useState<number>(4);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [redoStack, setRedoStack] = useState<DrawingPath[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isImgLoaded, setIsImgLoaded] = useState(false);

  // Screen / Canvas Lock state (Locked by default when annotating to prevent accidental gesture shifts or page closes)
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [showLockedWarning, setShowLockedWarning] = useState<boolean>(false);

  // Zoom and Pan states
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Popover menus & toolbar visibility
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
  const [isSizeMenuOpen, setIsSizeMenuOpen] = useState(false);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentPathRef = useRef<Point[]>([]);

  // Multi-touch tracking for pinch-to-zoom & two-finger pan
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const initialPinchDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1);
  const lastPanMidpointRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingPanRef = useRef<boolean>(false);
  const lastSinglePointerPosRef = useRef<{ x: number; y: number } | null>(null);

  // Close handler with lock guard
  const handleAttemptClose = useCallback(() => {
    if (isLocked) {
      // Prompt user that screen is locked to avoid accidental dismissal
      setShowLockedWarning(true);
    } else {
      onClose();
    }
  }, [isLocked, onClose]);

  // Close with Escape key & manage body scroll + swipe suppression
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    document.body.setAttribute('data-annotation-open', 'true');
    document.body.classList.add('is-annotating');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleAttemptClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.body.removeAttribute('data-annotation-open');
      document.body.classList.remove('is-annotating');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleAttemptClose]);

  // Reset view when new image opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setIsLocked(true); // Automatically lock to guarantee rock-solid drawing stability
      setShowLockedWarning(false);
      setIsColorMenuOpen(false);
      setIsSizeMenuOpen(false);
    }
  }, [isOpen, src]);

  // Synchronize canvas dimensions with actual rendered unscaled image
  const syncCanvasDimensions = useCallback(() => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !isImgLoaded) return;

    const width = img.clientWidth;
    const height = img.clientHeight;
    if (width === 0 || height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    redrawCanvas();
  }, [isImgLoaded]);

  // Redraw all recorded paths on the canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    paths.forEach(p => {
      if (p.points.length < 2) return;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(p.points[0].x * dpr, p.points[0].y * dpr);

      for (let i = 1; i < p.points.length; i++) {
        const prev = p.points[i - 1];
        const curr = p.points[i];
        const midX = ((prev.x + curr.x) / 2) * dpr;
        const midY = ((prev.y + curr.y) / 2) * dpr;
        ctx.quadraticCurveTo(prev.x * dpr, prev.y * dpr, midX, midY);
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (p.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = p.size * 3 * dpr;
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else if (p.isHighlighter) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = p.size * 3.5 * dpr;
        ctx.strokeStyle = p.color;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = p.size * dpr;
        ctx.strokeStyle = p.color;
      }

      ctx.stroke();
      ctx.restore();
    });
  }, [paths]);

  useEffect(() => {
    syncCanvasDimensions();
    window.addEventListener('resize', syncCanvasDimensions);
    return () => window.removeEventListener('resize', syncCanvasDimensions);
  }, [syncCanvasDimensions]);

  useEffect(() => {
    redrawCanvas();
  }, [paths, redrawCanvas]);

  // Transform screen clientX/Y into internal unscaled canvas coordinate space
  const getCanvasCoordinates = (clientX: number, clientY: number): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    const scaleFactorX = canvas.clientWidth / rect.width;
    const scaleFactorY = canvas.clientHeight / rect.height;

    return {
      x: (clientX - rect.left) * scaleFactorX,
      y: (clientY - rect.top) * scaleFactorY,
    };
  };

  // Pointer event handlers for drawing, pan, and two-finger pinch
  const handlePointerDown = (e: React.PointerEvent) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch gestures (only active when UNLOCKED to protect palm/resting touches)
    if (!isLocked && activePointersRef.current.size === 2) {
      setIsDrawing(false);
      currentPathRef.current = [];
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialPinchDistRef.current = dist;
      initialZoomRef.current = zoom;
      lastPanMidpointRef.current = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2,
      };
      return;
    }

    // Pan tool mode (only when unlocked)
    if (!isLocked && (tool === 'pan' || e.button === 1)) {
      isDraggingPanRef.current = true;
      lastSinglePointerPosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Single pointer: Drawing tool mode (pen, highlighter, eraser)
    // Works reliably whether locked or unlocked!
    if (tool !== 'pan' && activePointersRef.current.size === 1) {
      const point = getCanvasCoordinates(e.clientX, e.clientY);
      if (!point) return;

      setIsDrawing(true);
      currentPathRef.current = [point];
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activePointersRef.current.has(e.pointerId)) return;
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch pinch-to-zoom & pan (unlocked only)
    if (!isLocked && activePointersRef.current.size === 2 && initialPinchDistRef.current !== null) {
      const pts = Array.from(activePointersRef.current.values());
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const ratio = currentDist / initialPinchDistRef.current;
      const newZoom = Math.min(4, Math.max(0.5, Math.round(initialZoomRef.current * ratio * 100) / 100));
      setZoom(newZoom);

      const currentMid = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2,
      };
      if (lastPanMidpointRef.current) {
        const dx = currentMid.x - lastPanMidpointRef.current.x;
        const dy = currentMid.y - lastPanMidpointRef.current.y;
        setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      }
      lastPanMidpointRef.current = currentMid;
      return;
    }

    // Pan mode (unlocked only)
    if (!isLocked && isDraggingPanRef.current && lastSinglePointerPosRef.current) {
      const dx = e.clientX - lastSinglePointerPosRef.current.x;
      const dy = e.clientY - lastSinglePointerPosRef.current.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastSinglePointerPosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Drawing stroke
    if (isDrawing && tool !== 'pan') {
      const point = getCanvasCoordinates(e.clientX, e.clientY);
      if (!point) return;

      currentPathRef.current.push(point);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && currentPathRef.current.length > 1) {
        const dpr = window.devicePixelRatio || 1;
        const pts = currentPathRef.current;
        const prev = pts[pts.length - 2];
        const curr = pts[pts.length - 1];

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(prev.x * dpr, prev.y * dpr);
        ctx.lineTo(curr.x * dpr, curr.y * dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (tool === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.lineWidth = size * 3 * dpr;
          ctx.strokeStyle = 'rgba(0,0,0,1)';
        } else if (tool === 'highlighter') {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 0.45;
          ctx.lineWidth = size * 3.5 * dpr;
          ctx.strokeStyle = color;
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1.0;
          ctx.lineWidth = size * dpr;
          ctx.strokeStyle = color;
        }

        ctx.stroke();
        ctx.restore();
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointersRef.current.delete(e.pointerId);

    if (activePointersRef.current.size < 2) {
      initialPinchDistRef.current = null;
      lastPanMidpointRef.current = null;
    }

    if (isDraggingPanRef.current && activePointersRef.current.size === 0) {
      isDraggingPanRef.current = false;
      lastSinglePointerPosRef.current = null;
    }

    if (isDrawing && tool !== 'pan') {
      setIsDrawing(false);
      if (currentPathRef.current.length > 0) {
        const pathId = typeof crypto !== 'undefined' && crypto.randomUUID 
          ? crypto.randomUUID() 
          : `path_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const newPath: DrawingPath = {
          id: pathId,
          points: [...currentPathRef.current],
          color,
          size,
          isHighlighter: tool === 'highlighter',
          isEraser: tool === 'eraser',
        };
        setPaths(prev => [...prev, newPath]);
        setRedoStack([]);
        currentPathRef.current = [];
      }
    }
  };

  // Wheel zoom on desktop (only when unlocked)
  const handleWheel = (e: React.WheelEvent) => {
    if (isLocked) return;
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setZoom(prev => {
      const next = Math.min(Math.max(0.5, prev + delta), 4);
      return Math.round(next * 100) / 100;
    });
  };

  const handleZoomChange = (delta: number) => {
    if (isLocked) {
      setIsLocked(false);
    }
    setZoom(prev => {
      const next = Math.min(Math.max(0.5, prev + delta), 4);
      return Math.round(next * 100) / 100;
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleUndo = () => {
    if (paths.length === 0) return;
    const last = paths[paths.length - 1];
    setPaths(paths.slice(0, -1));
    setRedoStack(prev => [...prev, last]);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(redoStack.slice(0, -1));
    setPaths(prev => [...prev, next]);
  };

  const handleClearAll = () => {
    if (paths.length === 0) return;
    if (window.confirm('Bersihkan semua anotasi pada gambar ini?')) {
      setPaths([]);
      setRedoStack([]);
    }
  };

  // Merge original image with annotations and download as PNG
  const handleDownload = () => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const exportCanvas = document.createElement('canvas');
    const naturalWidth = img.naturalWidth || img.clientWidth;
    const naturalHeight = img.naturalHeight || img.clientHeight;
    exportCanvas.width = naturalWidth;
    exportCanvas.height = naturalHeight;
    const expCtx = exportCanvas.getContext('2d');
    if (!expCtx) return;

    try {
      // 1. Draw base image
      expCtx.drawImage(img, 0, 0, naturalWidth, naturalHeight);

      // 2. Draw scaled annotations
      const scaleX = naturalWidth / canvas.clientWidth;
      const scaleY = naturalHeight / canvas.clientHeight;

      paths.forEach(p => {
        if (p.points.length < 2) return;
        expCtx.save();
        expCtx.beginPath();
        expCtx.moveTo(p.points[0].x * scaleX, p.points[0].y * scaleY);

        for (let i = 1; i < p.points.length; i++) {
          const prev = p.points[i - 1];
          const curr = p.points[i];
          const midX = ((prev.x + curr.x) / 2) * scaleX;
          const midY = ((prev.y + curr.y) / 2) * scaleY;
          expCtx.quadraticCurveTo(prev.x * scaleX, prev.y * scaleY, midX, midY);
        }

        expCtx.lineCap = 'round';
        expCtx.lineJoin = 'round';

        if (p.isEraser) {
          expCtx.globalCompositeOperation = 'destination-out';
          expCtx.lineWidth = p.size * 3 * scaleX;
          expCtx.strokeStyle = 'rgba(0,0,0,1)';
        } else if (p.isHighlighter) {
          expCtx.globalCompositeOperation = 'source-over';
          expCtx.globalAlpha = 0.45;
          expCtx.lineWidth = p.size * 3.5 * scaleX;
          expCtx.strokeStyle = p.color;
        } else {
          expCtx.globalCompositeOperation = 'source-over';
          expCtx.globalAlpha = 1.0;
          expCtx.lineWidth = p.size * scaleX;
          expCtx.strokeStyle = p.color;
        }

        expCtx.stroke();
        expCtx.restore();
      });

      const dataUrl = exportCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `materi-catatan-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export image with annotations:', err);
      alert('Gagal mengunduh gambar beranotasi. Pastikan gambar tidak terblokir kebijakan CORS browser.');
    }
  };

  // Compute slider limits based on active tool
  const getMinSize = () => (tool === 'eraser' ? 4 : tool === 'highlighter' ? 4 : 1);
  const getMaxSize = () => (tool === 'eraser' ? 60 : tool === 'highlighter' ? 40 : 32);

  if (!isOpen) return null;

  return (
    <div 
      data-no-swipe="true"
      data-annotation-active="true"
      data-annotation-modal="true"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onTouchCancel={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[200] bg-slate-950 flex flex-col select-none touch-none"
    >
      {/* ========================================================================= */}
      {/* 1. TOP HEADER                                                             */}
      {/* ========================================================================= */}
      <header className="h-14 px-3 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white shrink-0 z-30">
        {/* Left: Back / Exit & Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAttemptClose();
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 hover:text-white flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer border border-slate-700/60 min-h-[36px]"
            title="Kembali dan Tutup Kanvas"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <PenLine className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 leading-none">
                <span>Kanvas Anotasi</span>
              </h3>
              <p className="text-[10px] text-slate-400 hidden md:block mt-0.5">
                Dukungan stylus, sentuhan layar, dan kunci kanvas
              </p>
            </div>
          </div>
        </div>

        {/* Center: Lock Screen Toggle & Zoom Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* SCREEN LOCK TOGGLE BUTTON */}
          <button
            type="button"
            onClick={() => {
              setIsLocked(!isLocked);
              if (isLocked && tool === 'pan') {
                setTool('pen');
              }
              setShowLockedWarning(false);
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm border ${
              isLocked
                ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400'
                : 'bg-slate-800 text-slate-300 border-slate-700/80 hover:text-white hover:bg-slate-700'
            }`}
            title={
              isLocked
                ? 'Layar Terkunci: Posisi stabil, aman dari geser/tutup tidak sengaja. Klik untuk membuka kunci.'
                : 'Layar Bebas: Klik untuk mengunci layar agar menggambar lebih stabil.'
            }
          >
            {isLocked ? (
              <>
                <Lock className="w-3.5 h-3.5 text-slate-950" />
                <span className="text-[11px] sm:text-xs">Terkunci</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] sm:text-xs hidden xs:inline">Kunci Layar</span>
                <span className="text-[11px] sm:text-xs xs:hidden">Kunci</span>
              </>
            )}
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-800/90 rounded-xl p-1 gap-1 border border-slate-700/60">
            <button
              type="button"
              onClick={() => handleZoomChange(-0.25)}
              disabled={zoom <= 0.5}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 transition-colors cursor-pointer"
              title="Perkecil (Zoom Out)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 py-0.5 rounded text-[11px] font-mono font-bold text-slate-200 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Atur Ulang Perbesaran (100%)"
            >
              {Math.round(zoom * 100)}%
            </button>

            <button
              type="button"
              onClick={() => handleZoomChange(0.25)}
              disabled={zoom >= 4}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 transition-colors cursor-pointer"
              title="Perbesar (Zoom In)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            {(zoom !== 1 || pan.x !== 0 || pan.y !== 0) && (
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold hover:bg-amber-500/30 transition-colors cursor-pointer ml-0.5"
                title="Pusatkan Gambar"
              >
                Fit
              </button>
            )}
          </div>
        </div>

        {/* Right: Save & Close Button */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer min-h-[36px]"
            title="Simpan Gambar Beserta Catatan"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Simpan Catatan</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAttemptClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/60 min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Tutup Kanvas Anotasi"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN VIEWPORT (Canvas & Image)                                         */}
      {/* ========================================================================= */}
      <main 
        ref={containerRef}
        data-no-swipe="true"
        data-annotation-stage="true"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onTouchCancel={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`flex-1 relative overflow-hidden flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 touch-none min-h-0 min-w-0 ${
          tool === 'pan' && !isLocked
            ? 'cursor-grab active:cursor-grabbing' 
            : tool === 'eraser' 
              ? 'cursor-cell' 
              : 'cursor-crosshair'
        }`}
      >
        {/* Interactive Transform Canvas Stage */}
        <div 
          ref={stageRef}
          data-no-swipe="true"
          className="relative inline-flex transition-transform duration-75 origin-center shadow-2xl rounded-xl overflow-hidden bg-black/40 border border-slate-800/80 max-w-full max-h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <img
            ref={imageRef}
            src={src}
            crossOrigin="anonymous"
            alt="Materi Ajar"
            draggable={false}
            onLoad={() => {
              setIsImgLoaded(true);
              setTimeout(syncCanvasDimensions, 80);
            }}
            className="max-w-full max-h-full object-contain block select-none pointer-events-none"
          />

          {/* Transparent Live Drawing Layer */}
          <canvas
            ref={canvasRef}
            data-no-swipe="true"
            data-annotation-canvas="true"
            className="absolute inset-0 z-10 touch-none"
          />
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 3. DOCKED BOTTOM TOOLBAR                                                  */}
      {/* ========================================================================= */}
      <footer className="relative bg-slate-900 border-t border-slate-800 text-white shrink-0 z-30 transition-all duration-200">
        {/* Collapse Toggle Handle */}
        <div className="absolute -top-6 right-4 z-40">
          <button
            type="button"
            onClick={() => {
              setIsToolbarCollapsed(!isToolbarCollapsed);
              setIsColorMenuOpen(false);
              setIsSizeMenuOpen(false);
            }}
            className="px-2 py-1 rounded-t-lg bg-slate-900 border-t border-x border-slate-800 text-slate-400 hover:text-white text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-md"
            title={isToolbarCollapsed ? 'Tampilkan Bilah Alat' : 'Sembunyikan Bilah Alat'}
          >
            {isToolbarCollapsed ? (
              <>
                <ChevronUp className="w-3 h-3 text-amber-400" />
                <span>Bilah Alat</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                <span>Sembunyikan</span>
              </>
            )}
          </button>
        </div>

        {!isToolbarCollapsed && (
          <div className="h-16 px-2 sm:px-6 flex items-center justify-between gap-1 sm:gap-3 max-w-4xl mx-auto w-full">
            {/* Left: Tools Group (Pena, Stabilo, Hapus, Geser) */}
            <div className="flex items-center bg-slate-800/90 rounded-xl p-1 gap-0.5 sm:gap-1 border border-slate-700/60">
              <button
                type="button"
                onClick={() => {
                  setTool('pen');
                  setIsColorMenuOpen(false);
                  setIsSizeMenuOpen(false);
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  tool === 'pen'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Pena"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Pena</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTool('highlighter');
                  setIsColorMenuOpen(false);
                  setIsSizeMenuOpen(false);
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  tool === 'highlighter'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Stabilo (Penyorot)"
              >
                <Highlighter className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Stabilo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTool('eraser');
                  setIsColorMenuOpen(false);
                  setIsSizeMenuOpen(false);
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  tool === 'eraser'
                    ? 'bg-rose-500 text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Penghapus"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Hapus</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTool('pan');
                  setIsColorMenuOpen(false);
                  setIsSizeMenuOpen(false);
                  if (isLocked) {
                    setIsLocked(false);
                  }
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  tool === 'pan'
                    ? 'bg-blue-500 text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Mode Geser (Pan & Navigasi - Otomatis membuka kunci layar)"
              >
                <Hand className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Geser</span>
              </button>
            </div>

            {/* Center: Color Popover & SLIDER BAR Size Popover */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Color Button with Upward Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsColorMenuOpen(!isColorMenuOpen);
                    setIsSizeMenuOpen(false);
                  }}
                  disabled={tool === 'eraser' || tool === 'pan'}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/60 text-xs font-medium transition-colors ${
                    tool === 'eraser' || tool === 'pan' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  title="Pilih Warna"
                >
                  <span
                    className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                  <span className="hidden sm:inline text-slate-300">Warna</span>
                  <ChevronUp className={`w-3 h-3 text-slate-400 transition-transform ${isColorMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Color Selection Popover */}
                {isColorMenuOpen && (
                  <div className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 p-2.5 rounded-2xl shadow-2xl z-50 flex items-center gap-2 animate-in fade-in">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => {
                          setColor(c.value);
                          if (tool === 'eraser' || tool === 'pan') setTool('pen');
                          setIsColorMenuOpen(false);
                        }}
                        className={`w-7 h-7 rounded-full transition-transform cursor-pointer relative ${
                          color === c.value && tool !== 'eraser' && tool !== 'pan'
                            ? 'scale-115 ring-2 ring-white ring-offset-2 ring-offset-slate-900 shadow-md'
                            : 'hover:scale-110 opacity-90 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* SLIDER BAR Size Popover Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsSizeMenuOpen(!isSizeMenuOpen);
                    setIsColorMenuOpen(false);
                  }}
                  disabled={tool === 'pan'}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/60 text-xs font-medium transition-colors ${
                    tool === 'pan' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  title="Atur Ukuran dengan Slider Bar"
                >
                  <span className="text-slate-300 font-mono text-xs font-bold">{size}px</span>
                  <ChevronUp className={`w-3 h-3 text-slate-400 transition-transform ${isSizeMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Continuous Slider Bar Popover */}
                {isSizeMenuOpen && (
                  <div className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 p-3.5 rounded-2xl shadow-2xl z-50 flex flex-col gap-3 w-64 animate-in fade-in">
                    {/* Header with Title and Current Value */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-300">
                        {tool === 'eraser' 
                          ? 'Ukuran Penghapus' 
                          : tool === 'highlighter' 
                            ? 'Ketebalan Stabilo' 
                            : 'Ketebalan Pena'}
                      </span>
                      <span className="font-mono text-xs font-bold text-amber-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                        {size} px
                      </span>
                    </div>

                    {/* Visual Live Preview Circle */}
                    <div className="h-10 w-full bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
                      <div
                        className="rounded-full transition-all duration-75"
                        style={{
                          width: `${Math.min(size, 36)}px`,
                          height: `${Math.min(size, 36)}px`,
                          backgroundColor: tool === 'eraser' ? '#cbd5e1' : color,
                          opacity: tool === 'highlighter' ? 0.6 : 1.0,
                          boxShadow: tool === 'eraser' ? 'inset 0 0 0 1px #475569' : undefined,
                        }}
                      />
                    </div>

                    {/* Continuous Slider Bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-mono">{getMinSize()}</span>
                      <input
                        type="range"
                        min={getMinSize()}
                        max={getMaxSize()}
                        step={1}
                        value={size}
                        onChange={(e) => setSize(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                      <span className="text-[10px] text-slate-500 font-mono">{getMaxSize()}</span>
                    </div>

                    {/* Quick Preset Shortcut Chips */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800 gap-1">
                      {[
                        { label: '2px', val: 2 },
                        { label: '6px', val: 6 },
                        { label: '12px', val: 12 },
                        { label: '20px', val: 20 },
                        { label: '32px', val: 32 },
                      ].map(preset => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => setSize(preset.val)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
                            size === preset.val 
                              ? 'bg-amber-500 text-slate-950 font-bold' 
                              : 'text-slate-400 bg-slate-800/80 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Undo, Redo, Clear All */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={handleUndo}
                disabled={paths.length === 0}
                className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors cursor-pointer"
                title="Urungkan (Undo)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors cursor-pointer"
                title="Ulangi (Redo)"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                disabled={paths.length === 0}
                className="p-2 rounded-xl bg-slate-800/90 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 disabled:opacity-30 transition-colors cursor-pointer"
                title="Hapus Semua Anotasi"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </footer>

      {/* ========================================================================= */}
      {/* 4. MODAL KONFIRMASI KETIKA INGIN KELUAR SAAT LAYAR MASIH TERKUNCI         */}
      {/* ========================================================================= */}
      {showLockedWarning && (
        <div className="fixed inset-0 z-[250] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl text-white">
            <div className="flex items-center gap-3 text-amber-400 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Layar Masih Terkunci</h4>
                <p className="text-xs text-slate-400">Pencegahan keluar / geser tidak sengaja</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              Fitur kunci layar sedang aktif untuk menjaga coretan penjelasan Anda tetap stabil. Apakah Anda ingin membuka kunci dan menutup kanvas ini untuk melanjutkan ke materi selanjutnya?
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLockedWarning(false)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Tetap di Sini
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLockedWarning(false);
                  setIsLocked(false);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Buka Kunci & Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
