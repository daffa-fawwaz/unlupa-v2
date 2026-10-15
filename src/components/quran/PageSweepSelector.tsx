import React, { useState, useEffect, useRef, useCallback } from "react";
import { Layers, Check, RotateCcw } from "lucide-react";

interface Props {
  startPage: number;
  endPage: number;
  totalPages: number;
  fromPage: number;
  toPage: number;
  onChangeRange: (from: number, to: number) => void;
  language: string;
}

export const PageSweepSelector: React.FC<Props> = ({
  startPage,
  endPage,
  totalPages,
  fromPage,
  toPage,
  onChangeRange,
  language,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);

  const dragStartRef = useRef<number | null>(null);
  dragStartRef.current = dragStart;
  const isDraggingRef = useRef(false);
  isDraggingRef.current = isDragging;

  const min = Math.min(fromPage, toPage);
  const max = Math.max(fromPage, toPage);
  const count = max - min + 1;
  const isAll = min === startPage && max === endPage;

  const commitRange = useCallback(
    (start: number, end: number) => {
      const cMin = Math.max(startPage, Math.min(endPage, Math.min(start, end)));
      const cMax = Math.min(endPage, Math.max(startPage, Math.max(start, end)));
      onChangeRange(cMin, cMax);
    },
    [startPage, endPage, onChangeRange],
  );

  const getPageFromCoords = (
    clientX: number,
    clientY: number,
  ): number | null => {
    const el = document.elementFromPoint(clientX, clientY);
    const item = el?.closest<HTMLElement>("[data-page-num]");
    if (!item) return null;
    const num = Number(item.dataset.pageNum);
    return !isNaN(num) && num >= startPage && num <= endPage ? num : null;
  };

  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    pageNum: number,
  ) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setIsDragging(true);
    setDragStart(pageNum);
    commitRange(pageNum, pageNum);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || dragStartRef.current === null) return;
    const current = getPageFromCoords(e.clientX, e.clientY);
    if (current !== null) {
      commitRange(dragStartRef.current, current);
    }
  };

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
  };

  useEffect(() => {
    const handleGlobalEnd = () => {
      if (isDraggingRef.current) {
        setIsDragging(false);
        setDragStart(null);
      }
    };

    window.addEventListener("pointerup", handleGlobalEnd);
    window.addEventListener("pointercancel", handleGlobalEnd);
    window.addEventListener("touchend", handleGlobalEnd);
    window.addEventListener("touchcancel", handleGlobalEnd);

    return () => {
      window.removeEventListener("pointerup", handleGlobalEnd);
      window.removeEventListener("pointercancel", handleGlobalEnd);
      window.removeEventListener("touchend", handleGlobalEnd);
      window.removeEventListener("touchcancel", handleGlobalEnd);
    };
  }, []);

  // Generate 5-page chunk preset buttons
  const chunkPresets: { label: string; from: number; to: number }[] = [];
  const chunkSize = 5;
  for (let p = startPage; p <= endPage; p += chunkSize) {
    const chunkEnd = Math.min(endPage, p + chunkSize - 1);
    chunkPresets.push({
      label: `${p - startPage + 1}-${chunkEnd - startPage + 1}`,
      from: p,
      to: chunkEnd,
    });
  }

  return (
    <div className="neumorph-card p-3.5 sm:p-4 rounded-3xl space-y-3 select-none border border-sky-100 dark:border-sky-950/50">
      {/* Selector Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.04] dark:border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Layers className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm text-[#18234A] dark:text-[#F8FAFC]">
              {language === "en" ? "Page Sweep System" : "Sistem Sapu Halaman"}
            </h3>
          </div>
        </div>

        {/* Quick Range Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onChangeRange(startPage, endPage)}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
              isAll
                ? "bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white shadow-xs scale-105"
                : "neumorph-card text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]"
            }`}
          >
            {language === "en" ? "All Pages" : "Semua (1-20)"}
          </button>

          {chunkPresets.map((preset, idx) => {
            const isSelected = min === preset.from && max === preset.to;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onChangeRange(preset.from, preset.to)}
                className={`px-2 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white shadow-xs scale-105"
                    : "neumorph-inset text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]"
                }`}
              >
                Hal {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sweepable Interactive Page Chips Grid (Sky Blue / Blue Theme) */}
      <div
        className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-2 rounded-2xl neumorph-inset bg-slate-100/50 dark:bg-slate-900/60 touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {Array.from({ length: totalPages }).map((_, idx) => {
          const pageNum = startPage + idx;
          const relativeIdx = idx + 1;
          const isSelected = pageNum >= min && pageNum <= max;

          return (
            <div
              key={pageNum}
              data-page-num={pageNum}
              onPointerDown={(e) => handlePointerDown(e, pageNum)}
              className={`py-1.5 px-1 rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center h-10 select-none ${
                isSelected
                  ? "bg-gradient-to-br from-[#0EA5E9] to-[#2563EB] text-white font-black shadow-xs scale-102"
                  : "neumorph-card text-[#5E6D88] dark:text-[#94A3B8] font-bold hover:scale-102"
              }`}
            >
              <span className="text-[10px] font-mono leading-none">
                {relativeIdx}
              </span>
              <span className="text-[8px] opacity-80 mt-0.5 leading-none">
                H.{pageNum}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
