import React from 'react';
import { Brain } from 'lucide-react';
import { QuranPageItem } from '../../types';

interface Props {
  juzNumber: number;
  quranPages: QuranPageItem[];
  size?: 'sm' | 'hero';
  className?: string;
}

export const QuranMemoryStabilityBadge: React.FC<Props> = ({
  juzNumber,
  quranPages,
  size = 'hero',
  className = '',
}) => {
  // Compute average stability for active pages in this Juz
  const juzPages = quranPages.filter(p => Number(p.juzNumber) === juzNumber && p.isActive);
  const avgStability = juzPages.length > 0
    ? juzPages.reduce((acc, p) => acc + Math.round(((p.fsrsData?.stability || 0) * 0.4025587)), 0) / juzPages.length
    : 0;

  const stabilityScore = Math.min(100, Math.round((avgStability / 30) * 100));

  if (size === 'sm') {
    return (
      <div className={`w-10 aspect-[1/1.36] rounded-xl neumorph-inset bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 flex flex-col items-center justify-center p-1 relative select-none ${className}`}>
        <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white flex items-center justify-center shadow-xs mb-0.5">
          <Brain className="w-3 h-3 text-white" />
        </div>
        <span className="text-[9px] font-black text-[#18234A] dark:text-[#F8FAFC] leading-none">
          {Math.round(avgStability)}d
        </span>
        <span className="text-[7px] text-[#5E6D88] dark:text-[#94A3B8] font-bold mt-0.5">
          Stab
        </span>
      </div>
    );
  }

  // Hero size (for Bento Hero replacing book cover slot)
  return (
    <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl neumorph-card bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 flex flex-col items-center justify-center p-2 relative select-none shadow-md ${className}`}>
      {/* Circular Stability Gauge SVG */}
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-200 dark:text-slate-800"
            opacity="0.5"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="url(#stabilityGradient)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 40}
            strokeDashoffset={2 * Math.PI * 40 * (1 - Math.max(0.1, stabilityScore / 100))}
            className="transition-all duration-700 ease-out"
          />
          <defs>
            <linearGradient id="stabilityGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FF7E4A" />
              <stop offset="100%" stopColor="#E65320" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <Brain className="w-5 h-5 text-[#FF6F3D] mb-0.5 animate-pulse" />
        </div>
      </div>
      <div className="text-center mt-1">
        <span className="text-xs sm:text-sm font-black text-[#18234A] dark:text-[#F8FAFC] tracking-tight">
          {Math.round(avgStability)} {avgStability === 1 ? 'Day' : 'Hari'}
        </span>
        <p className="text-[9px] text-[#5E6D88] dark:text-[#94A3B8] font-bold uppercase tracking-wider">
          Stabilitas Memori
        </p>
      </div>
    </div>
  );
};
