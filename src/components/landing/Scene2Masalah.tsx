import React from 'react';
import { AlertCircle, TrendingDown, Clock, Brain } from 'lucide-react';

interface Scene2MasalahProps {
  opacity: number;
}

export const Scene2Masalah: React.FC<Scene2MasalahProps> = ({ opacity }) => {
  if (opacity <= 0.01) return null;

  return (
    <div 
      className="fixed inset-0 flex flex-col justify-center items-end px-6 sm:px-16 pointer-events-none transition-opacity duration-300 z-10"
      style={{ opacity }}
    >
      <div className="max-w-xl text-right space-y-6">
        
        {/* Telemetry Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-950/50 border border-rose-500/40 backdrop-blur-md shadow-[0_0_20px_rgba(244,63,94,0.2)]">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          <span className="font-mono text-[10px] tracking-[0.25em] text-rose-300 uppercase">
            PARADOKS INGATAN // THE FORGETTING CURVE
          </span>
        </div>

        {/* Title */}
        <h2 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-white uppercase leading-tight">
          Dulu Dihafal Susah Payah, <br />
          <span className="italic font-serif text-rose-400 font-normal">
            Sekarang Hilang Begitu Saja?
          </span>
        </h2>

        {/* Sacred Quote in Amiri Font */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/20 backdrop-blur-md space-y-2 shadow-xl">
          <p className="text-2xl sm:text-3xl font-serif text-amber-300 leading-loose dir-rtl" style={{ fontFamily: "'Amiri', serif" }}>
            سَنُقْرِئُكَ فَلَا تَنسَىٰ
          </p>
          <p className="text-xs text-slate-300 italic">
            "Kami akan membacakan kepadamu (Al-Qur'an), maka kamu tidak akan lupa."
          </p>
          <span className="text-[10px] font-mono text-amber-400/80 uppercase tracking-widest block">
            QS. Al-A'la : 6
          </span>
        </div>

        {/* Cognitive & Practical Explanation */}
        <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
          Secara alamiah, otak manusia membuang <strong>70% informasi dalam 48 jam pertama</strong> jika tidak disentuh kembali. 
          Bukan karena kita lemah, tetapi karena kita tidak memiliki <em>sistem interval cerdas</em> yang memberitahu kapan waktu terbaik untuk mengulang.
        </p>

        {/* Telemetry Comparison Box */}
        <div className="grid grid-cols-2 gap-3 pt-2 text-left">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-rose-500/30">
            <span className="text-[9px] font-mono text-slate-400 block uppercase tracking-widest">
              PELURUHAN ALAMI (H+2)
            </span>
            <div className="flex items-center gap-2 mt-1">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <span className="text-xl font-mono font-black text-rose-400">-72%</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Hilang tanpa jadwal presisi</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/40">
            <span className="text-[9px] font-mono text-amber-400 block uppercase tracking-widest">
              DENGAN UNLUPA ENGINE
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Brain className="w-4 h-4 text-amber-400" />
              <span className="text-xl font-mono font-black text-amber-300">98.4%</span>
            </div>
            <span className="text-[10px] text-amber-200/80 block mt-0.5">Mutqin jangka panjang</span>
          </div>
        </div>

      </div>
    </div>
  );
};
