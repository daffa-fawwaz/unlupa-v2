import React from 'react';
import { BookOpen, Layers, Users, Compass } from 'lucide-react';

interface Scene4TigaRuangProps {
  opacity: number;
}

export const Scene4TigaRuang: React.FC<Scene4TigaRuangProps> = ({ opacity }) => {
  if (opacity <= 0.01) return null;

  return (
    <div 
      className="fixed inset-0 flex flex-col justify-center items-center px-4 sm:px-6 pointer-events-none transition-opacity duration-300 z-10"
      style={{ opacity }}
    >
      <div className="max-w-5xl text-center space-y-6 sm:space-y-8">
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 backdrop-blur-md">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono text-[10px] tracking-[0.25em] text-amber-300 uppercase font-bold">
            04 // EKOSISTEM TIGA RUANG
          </span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-sans font-black tracking-tight text-white uppercase">
          Tiga Ruang Khazanah. Satu Tujuan: <span className="text-amber-400">Mutqin.</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-left pt-2">
          
          {/* Ruang 1: Quran */}
          <div className="p-6 rounded-3xl bg-slate-900/85 border border-amber-500/30 backdrop-blur-xl space-y-3 shadow-xl hover:border-amber-500/60 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif text-amber-200 font-bold">1. Ruang Al-Qur'an (604)</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Pemetaan visual 30 Juz & 604 halaman mushaf standar Madinah dengan riwayat rating evaluasi mandiri per lembar halaman.
            </p>
            <div className="pt-2 text-[10px] font-mono text-amber-400/90 uppercase tracking-wider">
              ✦ 604 Halaman · 30 Juz · Voice & Tajwid
            </div>
          </div>

          {/* Ruang 2: Kitab & Matn */}
          <div className="p-6 rounded-3xl bg-slate-900/85 border border-blue-500/30 backdrop-blur-xl space-y-3 shadow-xl hover:border-blue-500/60 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif text-blue-200 font-bold">2. Ruang Kitab & Matn</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Koleksi matn klasik seperti <em>Ajurrumiyyah, Baiquniyyah,</em> dan <em>Hadits Arba'in</em> dengan metode takrar bertingkat.
            </p>
            <div className="pt-2 text-[10px] font-mono text-blue-400/90 uppercase tracking-wider">
              ✦ Bab & Bait · Audio Syarah · Takrar
            </div>
          </div>

          {/* Ruang 3: Kelas & Halaqah */}
          <div className="p-6 rounded-3xl bg-slate-900/85 border border-emerald-500/30 backdrop-blur-xl space-y-3 shadow-xl hover:border-emerald-500/60 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif text-emerald-200 font-bold">3. Ruang Kelas & Santri</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Platform untuk asatidz, pesantren, dan komunitas tasmi' untuk memantau ritme mutqin seluruh santri secara realtime.
            </p>
            <div className="pt-2 text-[10px] font-mono text-emerald-400/90 uppercase tracking-wider">
              ✦ Rapor Mutqin · Setoran · Feedback Guru
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
