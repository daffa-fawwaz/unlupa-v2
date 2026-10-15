import React, { useState, useEffect, useRef, useCallback } from "react";
import { Layers, Check } from "lucide-react";

interface AyahSweepSelectorProps {
  startAyah: number;
  endAyah: number;
  fromAyah: number;
  toAyah: number;
  onChange: (from: number, to: number) => void;
  surahName?: string;
  language?: string;
}

export const AyahSweepSelector: React.FC<AyahSweepSelectorProps> = ({
  startAyah,
  endAyah,
  fromAyah,
  toAyah,
  onChange,
  surahName,
  language = "id",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [hoverAyah, setHoverAyah] = useState<number | null>(null);

  const dragStartRef = useRef<number | null>(null);
  dragStartRef.current = dragStart;
  const isDraggingRef = useRef(false);
  isDraggingRef.current = isDragging;

  const totalAyahs = Math.max(1, endAyah - startAyah + 1);

  // Clamp current selection within valid bounds of this section
  const safeFrom = Math.max(startAyah, Math.min(endAyah, fromAyah));
  const safeTo = Math.max(startAyah, Math.min(endAyah, toAyah));
  const min = Math.min(safeFrom, safeTo);
  const max = Math.max(safeFrom, safeTo);
  const selectedCount = max - min + 1;
  const isSingle = min === max;

  const commitRange = useCallback(
    (start: number, end: number) => {
      const cMin = Math.max(startAyah, Math.min(endAyah, Math.min(start, end)));
      const cMax = Math.min(endAyah, Math.max(startAyah, Math.max(start, end)));
      onChange(cMin, cMax);
    },
    [startAyah, endAyah, onChange],
  );

  // Helper to extract ayah number from coordinates
  const getAyahFromCoords = (
    clientX: number,
    clientY: number,
  ): number | null => {
    const el = document.elementFromPoint(clientX, clientY);
    const item = el?.closest<HTMLElement>("[data-ayah]");
    if (!item) return null;
    const num = Number(item.dataset.ayah);
    return !isNaN(num) && num >= startAyah && num <= endAyah ? num : null;
  };

  // Pointer Down
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    ayah: number,
  ) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if unsupported
    }
    setIsDragging(true);
    setDragStart(ayah);
    setHoverAyah(ayah);
    commitRange(ayah, ayah);
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || dragStartRef.current === null) return;
    const currentAyah = getAyahFromCoords(e.clientX, e.clientY);
    if (currentAyah !== null) {
      setHoverAyah(currentAyah);
      commitRange(dragStartRef.current, currentAyah);
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
    setHoverAyah(null);
  };

  // Touch Move fallback
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || dragStartRef.current === null) return;
    const touch = e.touches[0];
    const currentAyah = getAyahFromCoords(touch.clientX, touch.clientY);
    if (currentAyah !== null) {
      setHoverAyah(currentAyah);
      commitRange(dragStartRef.current, currentAyah);
    }
  };

  useEffect(() => {
    const handleGlobalEnd = () => {
      if (isDraggingRef.current) {
        setIsDragging(false);
        setDragStart(null);
        setHoverAyah(null);
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

  return (
    <div className="space-y-2.5 select-none">
      {/* Ayah Selection Banner */}
      <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl neumorph-card border-l-3 border-[#FF6F3D]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Layers className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-xs text-[#18234A] dark:text-[#F8FAFC]">
              {language === "en" ? "Ayah" : "Ayat"}{" "}
              {isSingle ? min : `${min} - ${max}`}
            </span>
            <span className="text-[10px] text-[#5E6D88] dark:text-[#94A3B8] font-bold ml-1.5">
              ({selectedCount} {language === "en" ? "Ayah" : "Ayat"})
            </span>
          </div>
        </div>

        {/* Quick Presets: Select All vs First Ayah */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => commitRange(startAyah, endAyah)}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
              selectedCount === totalAyahs
                ? "bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white shadow-2xs"
                : "neumorph-card text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#FF6F3D]"
            }`}
          >
            {language === "en" ? "All" : "Semua"}
          </button>
        </div>
      </div>

      {/* Sweep / Tap Interactive Ayah Pill Matrix */}
      <div
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => handlePointerUp()}
        className="p-2.5 sm:p-3 rounded-2xl neumorph-inset bg-black/[0.02] dark:bg-white/[0.02] flex flex-wrap gap-2 items-center touch-none"
      >
        {Array.from({ length: totalAyahs }, (_, i) => {
          const ayah = startAyah + i;
          const isSelected = ayah >= min && ayah <= max;
          const isRangeStart = ayah === min;
          const isRangeEnd = ayah === max;

          return (
            <div
              key={ayah}
              data-ayah={ayah}
              onPointerDown={(e) => handlePointerDown(e, ayah)}
              className={`w-10 h-10 rounded-2xl flex flex-col items-center justify-center font-mono font-black text-xs transition-all cursor-pointer select-none active:scale-90 ${
                isSelected
                  ? "bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-[0_2px_8px_rgba(255,111,61,0.4),inset_0_1px_1.5px_rgba(255,255,255,0.7)] scale-105 z-10"
                  : "neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:text-[#FF6F3D] hover:scale-102 shadow-2xs"
              }`}
              title={`Ayat ${ayah}`}
            >
              <span>{ayah}</span>
            </div>
          );
        })}
      </div>

      {/* Instruction Caption */}
      <p className="text-[10px] text-center text-[#8493AB] font-medium">
        {language === "en"
          ? "Tap or drag fingers/mouse across numbers to select an ayah range."
          : "Ketuk nomor ayat atau sapukan jari/mouse untuk memilih rentang ayat bermasalah."}
      </p>
    </div>
  );
};
