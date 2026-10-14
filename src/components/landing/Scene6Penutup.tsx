import React from 'react';
import { Compass, ArrowRight, ShieldCheck, Mail, Heart, CheckCircle2 } from 'lucide-react';
import { soundEngine } from './audio';

interface Scene6PenutupProps {
  opacity: number;
  onLaunchApp: () => void;
}

export const Scene6Penutup: React.FC<Scene6PenutupProps> = ({ opacity, onLaunchApp }) => {
  if (opacity <= 0.01) return null;

  return (
    <div 
      className="fixed inset-0 flex flex-col justify-between items-center text-center px-4 sm:px-6 pt-24 pb-8 pointer-events-none transition-opacity duration-300 z-10"
      style={{ opacity }}
    >
      <div className="flex-1 flex flex-col justify-center items-center max-w-3xl mx-auto space-y-8">
        
        {/* Sacred Remembrance */}
        <div className="space-y-4">
          <p 
            className="text-4xl sm:text-6xl font-serif text-amber-300 leading-relaxed select-none"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            وَاذْكُر رَّبَّكَ إِذَا نَسِيتَ
          </p>
          <p className="text-xs sm:text-sm text-slate-300 italic">
            "Dan ingatlah Tuhanmu jika engkau lupa..." (QS. Al-Kahf : 24)
          </p>
        </div>

        {/* Monolithic Title: Jangan Lupa */}
        <div className="space-y-3">
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-sans font-black tracking-tight text-white uppercase select-none">
            JANGAN SAMPAI <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">LUPA LAGI.</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto font-light leading-relaxed">
            Mulailah menjaga hafalan dan disiplin ilmu Anda sekarang. Gratis, tanpa iklan, dan sepenuhnya berpihak pada keberkahan waktu Anda.
          </p>
        </div>

        {/* CTA Button */}
        <div className="pt-2 pointer-events-auto">
          <button
            onClick={() => {
              soundEngine.playGlassChime();
              onLaunchApp();
            }}
            className="group px-9 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-mono text-xs sm:text-sm font-black tracking-[0.18em] uppercase shadow-[0_0_40px_rgba(245,158,11,0.5)] hover:shadow-[0_0_60px_rgba(245,158,11,0.7)] transition-all flex items-center gap-3 cursor-pointer active:scale-95"
          >
            <Compass className="w-4 h-4 text-slate-950" />
            <span>Masuk ke Unlupa Workspace</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>

      </div>

      {/* Footer Info & Contact */}
      <footer className="w-full max-w-5xl mx-auto border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-400 gap-3 pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-white font-bold">UNLUPA.ID</span>
          <span className="text-slate-500">&bull;</span>
          <span>ILMU YANG TIDAK LUPA</span>
        </div>
        <div>
          ADAPTIVE RETENTION ENGINE &bull; 604 HALAMAN MUSHAF &bull; LOCAL-FIRST
        </div>
        <div className="flex items-center gap-4 text-slate-300">
          <button 
            onClick={onLaunchApp}
            className="text-amber-400 hover:text-amber-300 font-bold hover:underline uppercase transition-colors"
          >
            BUKA APLIKASI &rarr;
          </button>
        </div>
      </footer>
    </div>
  );
};
