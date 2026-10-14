import React from 'react';
import { useScrambleText } from './useScrambleText';
import { ArrowRight, ChevronDown, Compass, BookOpen, Layers, ShieldCheck, Zap, RotateCcw, CheckCircle2 } from 'lucide-react';
import { soundEngine } from './audio';

interface Scene1HeroProps {
  opacity: number;
  onLaunchApp: () => void;
}

export const Scene1Hero: React.FC<Scene1HeroProps> = ({ opacity, onLaunchApp }) => {
  const scrambledTitle = useScrambleText('UNLUPA', true, 1100);

  if (opacity <= 0.01) return null;

  return (
    <div 
      className="fixed inset-0 flex flex-col justify-center items-center text-center px-4 sm:px-6 pointer-events-none transition-opacity duration-300 z-10"
      style={{ opacity }}
    >
      <div className="max-w-4xl mx-auto flex flex-col items-center space-y-6 sm:space-y-8">
        
        {/* Amber Gold Brand Telemetry Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 backdrop-blur-xl shadow-[0_0_25px_rgba(245,158,11,0.2)]">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_#f59e0b]" />
          <span className="font-mono text-[10px] sm:text-[11px] font-bold tracking-[0.22em] text-amber-300 uppercase">
            ADAPTIVE MEMORY ENGINE // UNLUPA.ID
          </span>
        </div>

        {/* Hero Title with the user's core theme: "Dulu tidak tahu, sekarang jangan lupa" */}
        <div className="space-y-2 sm:space-y-3">
          <div className="text-xs sm:text-sm font-mono tracking-[0.3em] text-slate-400 uppercase font-semibold">
            DULU KITA BERJUANG DARI TIDAK TAHU
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-sans font-black tracking-tight text-white uppercase select-none leading-[1.08] drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
            SEKARANG, JANGAN SAMPAI{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 drop-shadow-[0_0_35px_rgba(245,158,11,0.4)]">
              LUPA.
            </span>
          </h1>
        </div>

        {/* Tagline & Emotional Hook */}
        <div className="space-y-3 max-w-2xl">
          <p className="text-lg sm:text-2xl font-serif italic text-amber-200/95 font-normal tracking-wide">
            "Sistem Pengunci Ingatan & Penjaga Hafalan Abadi."
          </p>
          <p className="text-xs sm:text-sm md:text-base text-slate-300 max-w-xl mx-auto font-light leading-relaxed">
            Menghafal Al-Qur'an dan menuntut ilmu butuh waktu bertahun-tahun. Tanpa jadwal pengulangan presisi, 70% ilmu pudar dalam 48 jam. 
            <span className="text-amber-300 font-normal"> Unlupa mengunci hafalan tepat sebelum Anda melupakannya.</span>
          </p>
        </div>

        {/* Call To Action Buttons (Amber Gold Signature & Obsidian Base) */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3.5 pointer-events-auto">
          <button
            onClick={() => {
              soundEngine.playGlassChime();
              onLaunchApp();
            }}
            className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-mono text-xs sm:text-sm font-black tracking-[0.16em] uppercase shadow-[0_0_35px_rgba(245,158,11,0.45)] hover:shadow-[0_0_50px_rgba(245,158,11,0.65)] transition-all flex items-center gap-3 cursor-pointer active:scale-95"
          >
            <Compass className="w-4 h-4 text-slate-950" />
            <span>Mulai Jaga Hafalan</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </button>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300 bg-slate-900/80 border border-slate-700/60 px-4 py-3 rounded-2xl backdrop-blur-md shadow-lg">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>100% Gratis · Tanpa Iklan · Private</span>
          </div>
        </div>

        {/* Brand Highlights & Feature Badges */}
        <div className="flex flex-wrap justify-center items-center gap-2 pt-1 text-[11px] text-slate-400 pointer-events-auto">
          <span className="px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 flex items-center gap-1.5 shadow-sm">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" /> 604 Halaman Mushaf
          </span>
          <span className="px-3.5 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/60 text-slate-300 flex items-center gap-1.5 shadow-sm">
            <Layers className="w-3.5 h-3.5 text-blue-400" /> Kitab Matn Klasik
          </span>
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 98.4% Mutqin Target
          </span>
        </div>

        {/* Scroll To Explore Indicator */}
        <div className="pt-6 flex flex-col items-center gap-1.5 select-none">
          <span className="font-mono text-[9px] tracking-[0.3em] text-amber-400/80 uppercase animate-pulse">
            GULIR KE BAWAH UNTUK MELIHAT CARA KERJA
          </span>
          <ChevronDown className="w-4 h-4 text-amber-400 animate-bounce" />
        </div>

      </div>
    </div>
  );
};
