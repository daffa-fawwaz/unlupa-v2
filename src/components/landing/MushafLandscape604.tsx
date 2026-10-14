import React, { useState, useMemo } from 'react';
import { BookOpen, CheckCircle2, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface MushafLandscapeProps {
  onSelectPage?: (page: number) => void;
}

// Representative sample pages for rich interactive demonstration
const SAMPLE_PAGE_DATA: Record<number, { surah: string; juz: number; state: 'mutqin' | 'review_today' | 'stable' }> = {
  1: { surah: 'Al-Fatihah', juz: 1, state: 'mutqin' },
  2: { surah: 'Al-Baqarah: 1-5', juz: 1, state: 'mutqin' },
  3: { surah: 'Al-Baqarah: 6-16', juz: 1, state: 'mutqin' },
  4: { surah: 'Al-Baqarah: 17-24', juz: 1, state: 'stable' },
  5: { surah: 'Al-Baqarah: 25-29', juz: 1, state: 'review_today' },
  6: { surah: 'Al-Baqarah: 30-37', juz: 1, state: 'mutqin' },
  7: { surah: 'Al-Baqarah: 38-48', juz: 1, state: 'stable' },
  22: { surah: 'Al-Baqarah: 142-145', juz: 2, state: 'review_today' },
  50: { surah: 'Ali Imran: 1-9', juz: 3, state: 'mutqin' },
  77: { surah: 'An-Nisa: 1-6', juz: 4, state: 'stable' },
  106: { surah: 'Al-Maidah: 1-2', juz: 6, state: 'mutqin' },
  151: { surah: 'Al-Araf: 1-11', juz: 8, state: 'review_today' },
  293: { surah: 'Al-Kahf: 1-15', juz: 15, state: 'mutqin' },
  294: { surah: 'Al-Kahf: 16-27', juz: 15, state: 'mutqin' },
  304: { surah: 'Al-Kahf: 99-110', juz: 16, state: 'mutqin' },
  312: { surah: 'Maryam: 1-11', juz: 16, state: 'stable' },
  322: { surah: 'Thaha: 1-12', juz: 16, state: 'review_today' },
  440: { surah: 'Yasin: 1-12', juz: 22, state: 'mutqin' },
  441: { surah: 'Yasin: 13-27', juz: 22, state: 'mutqin' },
  562: { surah: 'Al-Mulk: 1-12', juz: 29, state: 'mutqin' },
  563: { surah: 'Al-Mulk: 13-26', juz: 29, state: 'mutqin' },
  582: { surah: 'An-Naba: 1-30', juz: 30, state: 'mutqin' },
  583: { surah: 'An-Naba: 31 - An-Naziat: 15', juz: 30, state: 'mutqin' },
  604: { surah: 'Al-Ikhlas, Al-Falaq, An-Nas', juz: 30, state: 'mutqin' }
};

export const MushafLandscape604: React.FC<MushafLandscapeProps> = ({ onSelectPage }) => {
  const [selectedJuz, setSelectedJuz] = useState<number>(30); // Default to Juz 30 (popular)
  const [hoveredPage, setHoveredPage] = useState<number>(582);

  // Juz pages lookup (standard 20 pages per juz in standard Madinah mushaf)
  const juzPages = useMemo(() => {
    // Standard page boundary approximation
    const startPage = selectedJuz === 1 ? 1 : (selectedJuz - 1) * 20 + 2;
    const endPage = selectedJuz === 30 ? 604 : startPage + 19;
    const pages: number[] = [];
    for (let p = startPage; p <= endPage; p++) {
      pages.push(p);
    }
    return pages;
  }, [selectedJuz]);

  const activePageInfo = SAMPLE_PAGE_DATA[hoveredPage] || {
    surah: `Halaman ${hoveredPage}`,
    juz: selectedJuz,
    state: (hoveredPage % 3 === 0 ? 'review_today' : hoveredPage % 2 === 0 ? 'mutqin' : 'stable') as 'mutqin' | 'review_today' | 'stable'
  };

  return (
    <div className="w-full rounded-2xl bg-[#121316] border border-[#C4A47C]/20 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      
      {/* Decorative Warm Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#C4A47C]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-[#4ADE80]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header of the 604 Canvas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#C4A47C] animate-pulse" />
            <span className="text-[11px] font-mono tracking-[0.25em] text-[#C4A47C] uppercase">
              // Mushaf Matrix // 604 Halaman
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif text-white font-medium tracking-tight">
            Kebun Hafalan yang Hidup & Terpantau
          </h3>
        </div>

        {/* Legend */}
        <div className="flex items-center flex-wrap gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <span className="text-[#C9D1D9]">Mutqin (Kokoh)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#C4A47C] shadow-[0_0_8px_rgba(196,164,124,0.4)]" />
            <span className="text-[#C9D1D9]">Stabil</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
            <span className="text-[#C9D1D9]">Perlu Disiram Hari Ini</span>
          </div>
        </div>
      </div>

      {/* Juz Selector Ribbon */}
      <div className="py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono text-[#8B949E] tracking-widest uppercase">
            PILIH JUZ UNTUK DIINSPEKSI:
          </span>
          <span className="text-[11px] font-serif text-[#C4A47C] italic">
            Juz {selectedJuz} dari 30 Juz
          </span>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {[1, 2, 3, 15, 16, 28, 29, 30].map((juz) => (
            <button
              key={juz}
              onClick={() => {
                setSelectedJuz(juz);
                const start = juz === 1 ? 1 : (juz - 1) * 20 + 2;
                setHoveredPage(start);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 cursor-pointer ${
                selectedJuz === juz
                  ? 'bg-[#C4A47C] text-[#0C0D0E] font-bold shadow-[0_0_15px_rgba(196,164,124,0.3)]'
                  : 'bg-white/5 text-[#8B949E] hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              Juz {juz}
            </button>
          ))}
          <span className="px-2 py-1.5 text-xs text-[#8B949E] flex items-center font-mono">
            ...
          </span>
        </div>
      </div>

      {/* Pages Grid in Selected Juz */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 py-4">
        {juzPages.map((page) => {
          const sample = SAMPLE_PAGE_DATA[page];
          const state = sample ? sample.state : (page % 3 === 0 ? 'review_today' : page % 2 === 0 ? 'mutqin' : 'stable');
          const isSelected = hoveredPage === page;

          let colorClass = 'bg-white/10 border-white/10 text-white/70 hover:border-white/30';
          if (state === 'mutqin') {
            colorClass = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25';
          } else if (state === 'review_today') {
            colorClass = 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25 animate-pulse';
          } else {
            colorClass = 'bg-[#C4A47C]/15 border-[#C4A47C]/40 text-[#E8DCC9] hover:bg-[#C4A47C]/25';
          }

          return (
            <button
              key={page}
              onClick={() => {
                setHoveredPage(page);
                if (onSelectPage) onSelectPage(page);
              }}
              onMouseEnter={() => setHoveredPage(page)}
              className={`aspect-[3/4] rounded-lg border flex flex-col items-center justify-between p-2 transition-all relative group cursor-pointer ${colorClass} ${
                isSelected ? 'ring-2 ring-white scale-105 shadow-xl z-10' : ''
              }`}
            >
              <span className="text-[9px] font-mono text-white/50">{page}</span>
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
              <span className="text-[8px] font-serif opacity-75 truncate max-w-full">
                {page % 2 === 0 ? 'Kiri' : 'Kanan'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Live Selected Page Telemetry Card */}
      <motion.div 
        key={hoveredPage}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-4 p-4 sm:p-5 rounded-xl bg-[#1A1C20] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#C4A47C]/10 border border-[#C4A47C]/30 flex flex-col items-center justify-center text-[#C4A47C]">
            <span className="text-[9px] font-mono leading-none">HAL</span>
            <span className="text-lg font-bold font-serif leading-tight">{hoveredPage}</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-white tracking-wide">
                {activePageInfo.surah}
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#C4A47C]">
                Juz {activePageInfo.juz}
              </span>
            </div>
            <p className="text-xs text-[#8B949E] mt-0.5">
              {activePageInfo.state === 'mutqin' 
                ? 'Status: Mutqin Kokoh — Interval berikutnya dalam 24 hari' 
                : activePageInfo.state === 'review_today'
                ? 'Status: Perlu Disiram Hari Ini — Kurva ingatan mendekati ambang lupa'
                : 'Status: Stabil — Terjadwal murajaah 3 hari lagi'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onSelectPage && onSelectPage(hoveredPage)}
          className="px-4 py-2 rounded-lg bg-[#C4A47C] hover:bg-[#D4B58E] text-[#0C0D0E] font-bold text-xs tracking-wider uppercase flex items-center gap-2 transition-all shadow-md cursor-pointer shrink-0"
        >
          <span>Murajaah Halaman Ini</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>

    </div>
  );
};
