import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Layers } from 'lucide-react';

interface JuzRangeSelectorProps {
  value: string;
  onChange: (val: string) => void;
}

export const JuzRangeSelector: React.FC<JuzRangeSelectorProps> = ({ value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [hoverJuz, setHoverJuz] = useState<number | null>(null);

  // Keep refs to avoid stale closures in global listeners & fast event cycles
  const dragStartRef = useRef<number | null>(null);
  dragStartRef.current = dragStart;
  const isDraggingRef = useRef(false);
  isDraggingRef.current = isDragging;

  const parseRange = (val: string): [number, number] => {
    if (!val || val === 'all' || val === '1-30') return [1, 30];
    if (val.includes('-')) {
      const parts = val.split('-').map(Number);
      const start = Math.min(parts[0] || 1, parts[1] || 1);
      const end = Math.max(parts[0] || 1, parts[1] || 1);
      return [start, end];
    }
    const num = Number(val);
    if (!isNaN(num) && num >= 1 && num <= 30) {
      return [num, num];
    }
    return [1, 5];
  };

  const [range, setRange] = useState<[number, number]>(() => parseRange(value));

  useEffect(() => {
    setRange(parseRange(value));
  }, [value]);

  const commitRange = useCallback((start: number, end: number) => {
    const min = Math.max(1, Math.min(start, end));
    const max = Math.min(30, Math.max(start, end));
    setRange([min, max]);

    if (min === 1 && max === 30) {
      onChange('all');
    } else if (min === max) {
      onChange(String(min));
    } else {
      onChange(`${min}-${max}`);
    }
  }, [onChange]);

  // Helper to extract valid juz number from touch or cursor coordinates
  const getJuzFromCoords = (clientX: number, clientY: number): number | null => {
    const el = document.elementFromPoint(clientX, clientY);
    const item = el?.closest<HTMLElement>('[data-juz]');
    if (!item) return null;
    const num = Number(item.dataset.juz);
    return !isNaN(num) && num >= 1 && num <= 30 ? num : null;
  };

  // Pointer Down (Desktop Mouse, Touch, Stylus)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, juz: number) => {
    // Prevent default touch gestures and text selection
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignored in environments where setPointerCapture is restricted
    }
    setIsDragging(true);
    setDragStart(juz);
    setHoverJuz(juz);
    commitRange(juz, juz);
  };

  // Pointer Move (Dispatched to captured element or grid)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || dragStartRef.current === null) return;
    const currentJuz = getJuzFromCoords(e.clientX, e.clientY);
    if (currentJuz !== null) {
      setHoverJuz(currentJuz);
      commitRange(dragStartRef.current, currentJuz);
    }
  };

  // Pointer Up / Cancel
  const handlePointerUp = (e?: React.PointerEvent<HTMLDivElement>) => {
    if (e) {
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {}
    }
    setIsDragging(false);
    setDragStart(null);
    setHoverJuz(null);
  };

  // Touch Move fallback for mobile touch sweeps
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || dragStartRef.current === null) return;
    const touch = e.touches[0];
    const currentJuz = getJuzFromCoords(touch.clientX, touch.clientY);
    if (currentJuz !== null) {
      setHoverJuz(currentJuz);
      commitRange(dragStartRef.current, currentJuz);
    }
  };

  // Global listeners guarantee dragging state is cleanly reset if pointer released anywhere
  useEffect(() => {
    const handleGlobalEnd = () => {
      if (isDraggingRef.current) {
        setIsDragging(false);
        setDragStart(null);
        setHoverJuz(null);
      }
    };

    window.addEventListener('pointerup', handleGlobalEnd);
    window.addEventListener('pointercancel', handleGlobalEnd);
    window.addEventListener('touchend', handleGlobalEnd);
    window.addEventListener('touchcancel', handleGlobalEnd);

    return () => {
      window.removeEventListener('pointerup', handleGlobalEnd);
      window.removeEventListener('pointercancel', handleGlobalEnd);
      window.removeEventListener('touchend', handleGlobalEnd);
      window.removeEventListener('touchcancel', handleGlobalEnd);
    };
  }, []);

  const min = range[0];
  const max = range[1];
  const count = max - min + 1;
  const pageCount = count * 20;

  const PRESETS = [
    { label: 'Juz 1-5', range: [1, 5] },
    { label: 'Juz 28-30', range: [28, 30] },
    { label: 'Juz 30 Saja', range: [30, 30] },
    { label: 'Semua (1-30)', range: [1, 30] },
  ];

  return (
    <div className="space-y-2.5 select-none">
      {/* Target summary bar */}
      <div className="flex items-center justify-between text-xs clay-inset p-3 rounded-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl clay-icon-pod-orange flex items-center justify-center shrink-0 shadow-xs">
            <Layers className="w-4 h-4 text-white shrink-0" />
          </div>
          <div>
            <div className="font-bold text-[#1E293B] dark:text-[#F8FAFC] text-xs flex items-center gap-1.5">
              <span>{min === max ? `Juz ${min} Saja` : `Juz ${min} s.d. Juz ${max}`}</span>
              {isDragging && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full clay-badge-orange text-[10px] font-bold animate-pulse">
                  <Layers className="w-2.5 h-2.5" />
                  <span>Menyapu...</span>
                </span>
              )}
            </div>
            <div className="text-[#64748B] dark:text-[#94A3B8] font-medium text-[11px] mt-0.5">
              {count} Juz terpilih • Estimasi ~{pageCount} Halaman
            </div>
          </div>
        </div>
        <span className="text-[10px] text-[#FF6E65] font-bold clay-pill px-2.5 py-1 hidden sm:inline">
          Ketuk / sapu rentang
        </span>
      </div>

      {/* Preset shortcut buttons */}
      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map(p => {
          const isSelected = min === p.range[0] && max === p.range[1];
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => commitRange(p.range[0], p.range[1])}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'clay-btn-primary scale-105'
                  : 'clay-pill text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B]'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Interactive 30-Juz Sweep Grid */}
      <div 
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => handlePointerUp()}
        className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 p-3 rounded-2xl clay-inset touch-none select-none"
      >
        {Array.from({ length: 30 }, (_, i) => i + 1).map(juz => {
          const inRange = juz >= min && juz <= max;
          const isEdge = juz === min || juz === max;
          const isDragHover = isDragging && hoverJuz === juz;

          return (
            <div
              key={juz}
              data-juz={juz}
              onPointerDown={(e) => handlePointerDown(e, juz)}
              className={`h-10.5 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all cursor-pointer touch-none select-none relative ${
                isEdge
                  ? 'clay-juz-cell-edge'
                  : inRange
                  ? 'clay-juz-cell-range'
                  : 'clay-juz-cell-inactive'
              } ${isDragHover ? 'ring-2 ring-[#FF6E65]' : ''}`}
            >
              <span className="pointer-events-none">{juz}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[10.5px] text-[#64748B] dark:text-[#94A3B8] text-center flex items-center justify-center gap-1.5">
        <span>Ketuk satu juz atau sapukan jari/mouse untuk memilih rentang target hafalan secara instan.</span>
      </p>
    </div>
  );
};
