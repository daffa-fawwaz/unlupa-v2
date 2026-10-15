import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Pencil,
  Undo2,
  Trash2,
  Check,
  Sparkles,
  Highlighter,
  X,
} from "lucide-react";
import { Language } from "../../types";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  color: string;
  width: number;
  opacity: number;
  points: Point[];
}

interface MushafDrawingCanvasProps {
  pageNumber: number;
  containerWidth?: number;
  containerHeight?: number;
  isRightPage?: boolean;
  language: Language;
}

export const COLOR_PRESETS = [
  { id: "amber", color: "#F59E0B", label: "Stabilo Kuning / Ragu" },
  { id: "green", color: "#10B981", label: "Stabilo Hijau / Lancar" },
  { id: "blue", color: "#3B82F6", label: "Stabilo Biru / Catatan" },
  { id: "red", color: "#EF4444", label: "Stabilo Merah / Tajwid" },
];

export const MushafDrawingCanvas: React.FC<MushafDrawingCanvasProps> = ({
  pageNumber,
  isRightPage = true,
  language,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentColor, setCurrentColor] = useState("#F59E0B");
  const [strokeType, setStrokeType] = useState<"pen" | "highlighter">(
    "highlighter",
  );
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const isPointerDownRef = useRef(false);

  // Listen for toggle drawing event from header
  useEffect(() => {
    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{
        pageNumber?: number;
        enabled?: boolean;
      }>;
      if (
        customEvent.detail?.pageNumber &&
        customEvent.detail.pageNumber !== pageNumber
      )
        return;
      if (typeof customEvent.detail?.enabled === "boolean") {
        setIsDrawingMode(customEvent.detail.enabled);
      } else {
        setIsDrawingMode((prev) => !prev);
      }
    };
    window.addEventListener("toggle-mushaf-drawing", handleToggle);
    return () =>
      window.removeEventListener("toggle-mushaf-drawing", handleToggle);
  }, [pageNumber]);

  // Dispatch state change so header icon can reflect active state
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("mushaf-drawing-mode-changed", {
        detail: { pageNumber, isDrawingMode },
      }),
    );
  }, [pageNumber, isDrawingMode]);

  // Storage key per page
  const storageKey = `quran_drawing_page_${pageNumber}`;

  // Load saved strokes from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setStrokes(parsed);
          return;
        }
      }
    } catch (e) {
      console.debug("Failed to load drawing strokes", e);
    }
    setStrokes([]);
  }, [pageNumber, storageKey]);

  // Redraw canvas whenever strokes change or canvas resizes
  const redrawAllStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each stroke
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;

      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.globalAlpha = stroke.opacity;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      // Normalize coordinates to current canvas dimensions (0..1 percentage based)
      const first = stroke.points[0];
      ctx.moveTo(first.x * canvas.width, first.y * canvas.height);

      for (let i = 1; i < stroke.points.length; i++) {
        const p = stroke.points[i];
        ctx.lineTo(p.x * canvas.width, p.y * canvas.height);
      }
      ctx.stroke();
      ctx.restore();
    }
  }, [strokes]);

  // Adjust canvas size to parent container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      const parent = canvas.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        redrawAllStrokes();
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [redrawAllStrokes]);

  // Redraw when strokes change
  useEffect(() => {
    redrawAllStrokes();
  }, [strokes, redrawAllStrokes]);

  // Save strokes to localStorage
  const saveStrokes = (updatedStrokes: Stroke[]) => {
    try {
      if (updatedStrokes.length === 0) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, JSON.stringify(updatedStrokes));
      }
    } catch (e) {
      console.debug("Failed to save drawing strokes", e);
    }
  };

  // Pointer Down (Draw start)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isPointerDownRef.current = true;

    const rect = canvas.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width;
    const normY = (e.clientY - rect.top) / rect.height;

    const width = strokeType === "highlighter" ? 18 : 4;
    const opacity = strokeType === "highlighter" ? 0.42 : 0.95;

    currentStrokeRef.current = {
      color: currentColor,
      width,
      opacity,
      points: [{ x: normX, y: normY }],
    };
  };

  // Pointer Move (Draw ongoing)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (
      !isDrawingMode ||
      !isPointerDownRef.current ||
      !currentStrokeRef.current
    )
      return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width;
    const normY = (e.clientY - rect.top) / rect.height;

    currentStrokeRef.current.points.push({ x: normX, y: normY });

    // Live draw incremental stroke
    const ctx = canvas.getContext("2d");
    if (ctx && currentStrokeRef.current.points.length >= 2) {
      const pts = currentStrokeRef.current.points;
      const prev = pts[pts.length - 2];
      const curr = pts[pts.length - 1];

      ctx.save();
      ctx.strokeStyle = currentStrokeRef.current.color;
      ctx.lineWidth = currentStrokeRef.current.width;
      ctx.globalAlpha = currentStrokeRef.current.opacity;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(prev.x * canvas.width, prev.y * canvas.height);
      ctx.lineTo(curr.x * canvas.width, curr.y * canvas.height);
      ctx.stroke();
      ctx.restore();
    }
  };

  // Pointer Up (Draw complete)
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    if (
      currentStrokeRef.current &&
      currentStrokeRef.current.points.length >= 2
    ) {
      const updated = [...strokes, currentStrokeRef.current];
      setStrokes(updated);
      saveStrokes(updated);
    }
    currentStrokeRef.current = null;
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const updated = strokes.slice(0, -1);
    setStrokes(updated);
    saveStrokes(updated);
  };

  const handleClear = () => {
    if (strokes.length === 0) return;
    setStrokes([]);
    saveStrokes([]);
  };

  // Listen for toolbar commands from horizontal bar
  useEffect(() => {
    const handleSetColor = (e: Event) => {
      const detail = (e as CustomEvent<{ color?: string }>).detail;
      if (detail?.color) setCurrentColor(detail.color);
    };
    const handleSetType = (e: Event) => {
      const detail = (e as CustomEvent<{ strokeType?: "pen" | "highlighter" }>)
        .detail;
      if (detail?.strokeType) setStrokeType(detail.strokeType);
    };
    const handleUndoEvent = () => {
      setStrokes((prev) => {
        if (prev.length === 0) return prev;
        const updated = prev.slice(0, -1);
        saveStrokes(updated);
        return updated;
      });
    };
    const handleClearEvent = () => {
      setStrokes([]);
      saveStrokes([]);
    };

    window.addEventListener("set-mushaf-drawing-color", handleSetColor);
    window.addEventListener("set-mushaf-drawing-type", handleSetType);
    window.addEventListener("mushaf-drawing-undo", handleUndoEvent);
    window.addEventListener("mushaf-drawing-clear", handleClearEvent);

    return () => {
      window.removeEventListener("set-mushaf-drawing-color", handleSetColor);
      window.removeEventListener("set-mushaf-drawing-type", handleSetType);
      window.removeEventListener("mushaf-drawing-undo", handleUndoEvent);
      window.removeEventListener("mushaf-drawing-clear", handleClearEvent);
    };
  }, [saveStrokes]);

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`absolute inset-0 z-20 w-full h-full ${
        isDrawingMode
          ? "cursor-crosshair touch-none select-none"
          : "pointer-events-none select-none"
      }`}
    />
  );
};
