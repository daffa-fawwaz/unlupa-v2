import React from 'react';
import { Brain, CheckCircle, Flame } from 'lucide-react';

interface Scene5RetrievabilityRingProps {
  opacity: number;
  scrollProgress: number;
}

export const Scene5RetrievabilityRing: React.FC<Scene5RetrievabilityRingProps> = ({ 
  opacity, 
  scrollProgress 
}) => {
  if (opacity <= 0.01) return null;

  // Calculate ring fill percentage based on scroll progress in Scene 5 (0.74 -> 0.88)
  const localProg = Math.max(0, Math.min(1, (scrollProgress - 0.74) / 0.14));
  const percent = Math.round(75 + localProg * 23.4); // 75% -> 98.4%

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div 
      className="fixed inset-0 flex flex-col justify-center items-center px-4 sm:px-6 pointer-events-none transition-opacity duration-300 z-10"
      style={{ opacity }}
    >
      <div className="max-w-2xl text-center space-y-6">
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/35 backdrop-blur-md">
          <Brain className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono text-[10px] tracking-[0.25em] text-amber-300 uppercase font-bold">
            05 // RETRIEVABILITY RING (R)
          </span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-sans font-black tracking-tight text-white uppercase">
          Tingkat Kemudahan Ingatan <br />
          <span className="text-amber-400 font-serif font-normal italic">Secara Real-Time</span>
        </h2>

        {/* Animated Circular Ring Visual with Amber Gold glow */}
        <div className="relative w-56 h-56 mx-auto flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 220 220">
            {/* Background Ring */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="14"
              fill="transparent"
            />
            {/* Active Amber Gold Ring */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke="url(#amberGradient)"
              strokeWidth="14"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{ transition: 'stroke-dashoffset 0.15s ease-out' }}
            />
            <defs>
              <linearGradient id="amberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Metric Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl sm:text-5xl font-mono font-black text-amber-300 tracking-tight">
              {percent}%
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mt-1">
              PROBABILITAS INGAT
            </span>
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle className="w-3 h-3" /> STATUS MUTQIN
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto font-light leading-relaxed">
          Algoritma cerdas Unlupa menjaga probabilitas retensi ingatan Anda selalu berada di atas ambang batas 90%, sehingga tidak ada hafalan yang runtuh menjadi lupa.
        </p>

      </div>
    </div>
  );
};
