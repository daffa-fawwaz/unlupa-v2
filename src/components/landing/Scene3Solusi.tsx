import React from 'react';
import { Cpu, Clock, CheckCircle2, Zap } from 'lucide-react';

interface Scene3SolusiProps {
  opacity: number;
}

export const Scene3Solusi: React.FC<Scene3SolusiProps> = ({ opacity }) => {
  if (opacity <= 0.01) return null;

  return (
    <div 
      className="fixed inset-0 flex flex-col justify-center items-start px-6 sm:px-16 pointer-events-none transition-opacity duration-300 z-10"
      style={{ opacity }}
    >
      <div className="max-w-xl text-left space-y-6">
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/35 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.25)]">
          <Cpu className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono text-[10px] tracking-[0.25em] text-amber-300 uppercase font-bold">
            SOLUSI // UNLUPA ADAPTIVE ENGINE
          </span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-sans font-black tracking-tight text-white uppercase leading-tight">
          Review Tepat Waktu, <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 font-serif font-normal italic">
            Hafalan Menjadi Mutqin.
          </span>
        </h2>

        <p className="text-sm sm:text-base text-slate-200 font-light leading-relaxed border-l-2 border-amber-500 pl-4 py-1">
          <strong>Sistem Retensi Adaptif Unlupa:</strong> Algoritma sains memori modern yang menghitung stabilitas ($S$), kesulitan ($D$), dan retensi ($R$) setiap bait, hadits, dan halaman Al-Qur'an secara presisi.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/60 space-y-1 shadow-lg">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">
              EFISIENSI WAKTU
            </span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-2xl font-mono font-black text-amber-300">3x Lebih Cepat</span>
            </div>
            <p className="text-[11px] text-slate-400">Tidak perlu mengulang yang sudah lancar</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/60 space-y-1 shadow-lg">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">
              KEPASTIAN JADWAL
            </span>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-2xl font-mono font-black text-emerald-400">Otomatis</span>
            </div>
            <p className="text-[11px] text-slate-400">Buka aplikasi, langsung tahu yang harus diulang</p>
          </div>
        </div>

      </div>
    </div>
  );
};
