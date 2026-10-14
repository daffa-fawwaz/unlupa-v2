import React from 'react';

interface Props {
  mapanCount: number;
  kokohCount: number;
  konsolidasiCount: number;
  kritisCount: number;
  totalCount: number;
  language?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ConcentricProgressRings: React.FC<Props> = ({
  mapanCount,
  kokohCount,
  konsolidasiCount,
  kritisCount,
  totalCount,
  language = 'id',
  size = 'md'
}) => {
  const total = Math.max(1, totalCount);
  
  const ratio1 = mapanCount / total;
  const ratio2 = kokohCount / total;
  const ratio3 = konsolidasiCount / total;
  const ratio4 = kritisCount / total;

  const percentage = Math.round((mapanCount / total) * 100);

  // Radii for 4 concentric rings
  const r1 = 44, c1 = 2 * Math.PI * r1, off1 = c1 - ratio1 * c1;
  const r2 = 36, c2 = 2 * Math.PI * r2, off2 = c2 - ratio2 * c2;
  const r3 = 28, c3 = 2 * Math.PI * r3, off3 = c3 - ratio3 * c3;
  const r4 = 20, c4 = 2 * Math.PI * r4, off4 = c4 - ratio4 * c4;

  const dimensionClasses = size === 'sm' ? 'w-24 h-24' : size === 'lg' ? 'w-36 h-36' : 'w-28 h-28 sm:w-32 sm:h-32';

  return (
    <div className={`relative ${dimensionClasses} shrink-0 flex items-center justify-center p-2 rounded-3xl backdrop-blur-md bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-white/10 shadow-sm select-none`}>
      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 overflow-visible">
        {/* Background Track Rings */}
        <circle cx="50" cy="50" r={r1} stroke="currentColor" strokeWidth="3.5" fill="transparent" className="text-emerald-500/15 dark:text-emerald-500/10" />
        <circle cx="50" cy="50" r={r2} stroke="currentColor" strokeWidth="3.5" fill="transparent" className="text-sky-500/15 dark:text-sky-500/10" />
        <circle cx="50" cy="50" r={r3} stroke="currentColor" strokeWidth="3.5" fill="transparent" className="text-amber-500/15 dark:text-amber-500/10" />
        <circle cx="50" cy="50" r={r4} stroke="currentColor" strokeWidth="3.5" fill="transparent" className="text-rose-500/15 dark:text-rose-500/10" />

        {/* Ring 1: Mapan & Mutqin (Emerald Green #10B981) */}
        <circle
          cx="50" cy="50" r={r1}
          stroke="#10B981" strokeWidth="3.5" fill="transparent"
          strokeDasharray={c1} strokeDashoffset={off1} strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        {/* Ring 2: Kokoh & Bertumbuh (Electric Blue #0EA5E9) */}
        <circle
          cx="50" cy="50" r={r2}
          stroke="#0EA5E9" strokeWidth="3.5" fill="transparent"
          strokeDasharray={c2} strokeDashoffset={off2} strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        {/* Ring 3: Konsolidasi Memori (Amber #F59E0B) */}
        <circle
          cx="50" cy="50" r={r3}
          stroke="#F59E0B" strokeWidth="3.5" fill="transparent"
          strokeDasharray={c3} strokeDashoffset={off3} strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        {/* Ring 4: Hafalan Baru & Kritis (Crimson Red #EF4444) */}
        <circle
          cx="50" cy="50" r={r4}
          stroke="#EF4444" strokeWidth="3.5" fill="transparent"
          strokeDasharray={c4} strokeDashoffset={off4} strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Glassmorphism Center Knob */}
      <div className="absolute inset-0 m-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/10 flex flex-col items-center justify-center pointer-events-none shadow-sm">
        <span className="text-[11px] sm:text-xs font-black font-mono text-slate-900 dark:text-white leading-none">
          {percentage}%
        </span>
        <span className="text-[6.5px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase mt-0.5 tracking-tight font-sans">
          {language === 'en' ? 'Mutqin' : 'Mapan'}
        </span>
      </div>
    </div>
  );
};
