import React from 'react';
import { Flame, Brain, Clock, CalendarClock } from 'lucide-react';

export interface MemoryMetricGridProps {
  reps: number;
  stability?: number;
  estDays?: number;
  nextReviewDate?: string | Date | null;
  isDue?: boolean;
  isMapan?: boolean;
  variant?: 'grid-2x2' | 'row' | 'auto';
  className?: string;
  language?: 'id' | 'en';
}

/**
 * Premium 4-Metric Display Component with White-on-White Depth:
 * 1. REVIEW (Flame icon, orange)
 * 2. STABILITY (Brain icon, emerald/indigo)
 * 3. EST. (Clock icon)
 * 4. NEXT (CalendarClock icon)
 */
export const MemoryMetricGrid: React.FC<MemoryMetricGridProps> = ({
  reps,
  stability = 0,
  estDays,
  nextReviewDate,
  isDue = false,
  isMapan = false,
  className = '',
  language = 'id',
}) => {
  // Format Review Reps
  const reviewText = `${reps}x`;

  // Format Stability
  let stabilityText = '—';
  if (stability > 0) {
    stabilityText = `${Math.round(stability)}d`;
  }

  // Format Estimated Interval
  let estText = '—';
  if (estDays !== undefined && estDays > 0) {
    estText = `${Math.round(estDays)}d`;
  } else if (stability > 0) {
    estText = isMapan ? '30d' : `${Math.round(stability)}d`;
  }

  // Format Next Review
  let nextText = '—';
  if (nextReviewDate) {
    const next = new Date(nextReviewDate);
    const now = new Date();
    const diffHours = (next.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (isDue || diffHours <= 0) {
      nextText = language === 'en' ? 'Today' : 'Hari Ini';
    } else if (diffHours <= 24) {
      nextText = language === 'en' ? 'Tomorrow' : 'Besok';
    } else {
      const diffDays = Math.ceil(diffHours / 24);
      if (diffDays <= 7) {
        nextText = `${diffDays}d`;
      } else {
        nextText = next.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
          day: 'numeric',
          month: 'short',
        });
      }
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-1.5 sm:gap-2 ${className}`}>
      {/* 1. REVIEW */}
      <div 
        className="flex items-center gap-1 px-2.5 py-1 rounded-xl clay-inset text-[#1E293B] dark:text-[#F8FAFC] text-xs"
        title={language === 'en' ? `Review count: ${reviewText}` : `Jumlah murajaah: ${reviewText}`}
      >
        <Flame className="w-3.5 h-3.5 text-[#F27A3D] shrink-0" />
        <span className="text-[10px] uppercase font-bold text-[#8E9BAE]">Rev</span>
        <span className="font-bold">{reviewText}</span>
      </div>

      {/* 2. STABILITY */}
      <div 
        className="flex items-center gap-1 px-2.5 py-1 rounded-xl clay-inset text-[#1E293B] dark:text-[#F8FAFC] text-xs"
        title={language === 'en' ? `Memory Stability: ${stabilityText}` : `Stabilitas ingatan: ${stabilityText}`}
      >
        <Brain className="w-3.5 h-3.5 text-[#5F6D84] dark:text-[#94A3B8] shrink-0" />
        <span className="text-[10px] uppercase font-bold text-[#8E9BAE]">Stab</span>
        <span className="font-bold">{stabilityText}</span>
      </div>

      {/* 3. EST. */}
      <div 
        className="flex items-center gap-1 px-2.5 py-1 rounded-xl clay-inset text-[#1E293B] dark:text-[#F8FAFC] text-xs"
        title={language === 'en' ? `Estimated interval: ${estText}` : `Estimasi interval: ${estText}`}
      >
        <Clock className="w-3.5 h-3.5 text-[#5F6D84] dark:text-[#94A3B8] shrink-0" />
        <span className="text-[10px] uppercase font-bold text-[#8E9BAE]">Est</span>
        <span className="font-bold">{estText}</span>
      </div>

      {/* 4. NEXT */}
      <div 
        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs ${
          isDue 
            ? 'clay-badge-orange text-white font-bold' 
            : 'clay-inset text-[#1E293B] dark:text-[#F8FAFC]'
        }`}
        title={language === 'en' ? `Next review: ${nextText}` : `Jadwal murajaah: ${nextText}`}
      >
        <CalendarClock className={`w-3.5 h-3.5 shrink-0 ${isDue ? 'text-white' : 'text-[#5F6D84] dark:text-[#94A3B8]'}`} />
        <span className={`text-[10px] uppercase font-bold ${isDue ? 'text-white/80' : 'text-[#8E9BAE]'}`}>Next</span>
        <span className="font-bold">
          {nextText}
        </span>
      </div>
    </div>
  );
};
