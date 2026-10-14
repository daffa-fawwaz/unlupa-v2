import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronRight, AlertCircle, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface Props {
  onOpenQuranReview: (juzNumber?: number) => void;
  onOpenMushafViewer: (pageNumber: number) => void;
}

export const WeakSpotsWidget: React.FC<Props> = ({
  onOpenQuranReview,
  onOpenMushafViewer
}) => {
  const { quranPages, language } = useApp();

  // Find pages that either have unresolved issues OR have difficulty >= 7 OR high lapses
  const weakPages = useMemo(() => {
    return (quranPages || [])
      .filter(p => p.isActive)
      .map(p => {
        const unresolvedIssues = (p.issues || []).filter(i => !i.isResolved);
        const difficulty = p.fsrsData?.difficulty || 0;
        const lapses = p.fsrsData?.lapses || 0;
        const stability = p.fsrsData?.stability || 0;

        let riskScore = unresolvedIssues.length * 3;
        if (difficulty >= 7) riskScore += 2;
        if (lapses >= 2) riskScore += 2;
        if (stability < 3) riskScore += 1;

        return {
          page: p,
          riskScore,
          unresolvedIssues,
          difficulty,
          lapses
        };
      })
      .filter(item => item.riskScore > 0 || item.unresolvedIssues.length > 0)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 4);
  }, [quranPages]);

  if (weakPages.length === 0) {
    return (
      <section className="neumorph-card p-4 sm:p-5 h-full flex flex-col justify-between space-y-3 rounded-3xl">
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] dark:border-white/[0.04]">
          <div className="flex items-center gap-2.5">
            <div className="w-8.5 h-8.5 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-4.5 h-4.5 text-white shrink-0" strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#18234A] dark:text-[#F8FAFC]">
                {language === 'en' ? 'Retention Health' : 'Kesehatan Retensi'}
              </h3>
              <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] font-medium">
                {language === 'en' ? 'All active pages stable' : 'Semua hafalan aktif stabil'}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-[10px] font-bold shrink-0 shadow-2xs">
            {language === 'en' ? 'Optimal' : 'Optimal'}
          </span>
        </div>

        <div className="my-auto py-2 text-center space-y-1.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white mx-auto flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <h4 className="font-bold text-xs sm:text-sm text-[#18234A] dark:text-[#F8FAFC]">
            {language === 'en' ? 'No Weak Spots Detected' : 'Alhamdulillah, Tidak Ada Titik Rawan'}
          </h4>
          <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] max-w-xs mx-auto leading-relaxed font-medium">
            {language === 'en' 
              ? 'Your memorization rhythm is high quality with no active issues reported.' 
              : 'Seluruh materi yang aktif berjalan mulus tanpa catatan kekeliruan.'}
          </p>
        </div>

        <div className="pt-2.5 border-t border-black/[0.04] dark:border-white/[0.04] flex justify-between items-center text-xs">
          <span className="text-[#FF6F3D] font-bold flex items-center gap-1.5 text-xs">
            <Zap className="w-3.5 h-3.5 text-[#FF6F3D]" />
            <span>{language === 'en' ? 'Stability 100%' : 'Stabilitas Terjaga'}</span>
          </span>
          <button
            type="button"
            onClick={() => onOpenQuranReview()}
            className="px-3 py-1 rounded-xl neumorph-card text-[#FF6F3D] font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-1 cursor-pointer text-xs"
          >
            <span>{language === 'en' ? 'Review' : 'Murajaah'}</span>
            <ChevronRight className="w-3 h-3 text-[#FF6F3D]" />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="neumorph-card p-4 sm:p-5 h-full flex flex-col justify-between space-y-3 rounded-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-black/[0.04] dark:border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 rounded-2xl bg-gradient-to-br from-[#EF4444] to-[#DC2626] text-white flex items-center justify-center shrink-0 shadow-xs">
            <AlertCircle className="w-4.5 h-4.5 text-white shrink-0" strokeWidth={2.2} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#18234A] dark:text-[#F8FAFC]">
              {language === 'en' ? 'Priority Attention' : 'Fokus Penguatan'}
            </h3>
            <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] font-medium">
              {language === 'en' 
                ? 'Pages with feedback notes or high difficulty' 
                : 'Halaman dengan catatan kekeliruan'}
            </p>
          </div>
        </div>

        <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white font-bold text-[10px] self-start sm:self-auto shrink-0 whitespace-nowrap shadow-2xs">
          {weakPages.length} {language === 'en' ? 'Pages' : 'Halaman'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {weakPages.map(({ page, unresolvedIssues, lapses }) => (
          <div
            key={page.pageNumber}
            className="p-3 rounded-2xl neumorph-inset flex flex-col justify-between gap-2 group"
          >
            <div className="flex items-start justify-between gap-1.5">
              <div 
                onClick={() => onOpenMushafViewer(page.pageNumber)}
                className="cursor-pointer group/title min-w-0 flex-1"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#18234A] dark:text-[#F8FAFC] group-hover/title:text-[#FF6F3D] transition-colors truncate">
                  <span>{language === 'en' ? 'Page' : 'Hal'} {page.pageNumber}</span>
                  <span className="text-[#FF6F3D]">•</span>
                  <span className="truncate">{page.surahNameEn}</span>
                </div>
                <p className="text-[10px] text-[#5E6D88] dark:text-[#94A3B8] truncate mt-0.5 font-medium">
                  Juz {page.juzNumber} • {page.ayahRange}
                </p>
              </div>

              <button
                onClick={() => onOpenQuranReview(page.juzNumber)}
                className="px-2.5 py-1 rounded-xl neumorph-card text-[#FF6F3D] text-xs font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
              >
                <span>{language === 'en' ? 'Review' : 'Murajaah'}</span>
                <ChevronRight className="w-3 h-3 text-[#FF6F3D]" />
              </button>
            </div>

            {/* Issues Badges */}
            <div className="flex flex-wrap gap-1">
              {unresolvedIssues.length > 0 ? (
                unresolvedIssues.map((issue, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white text-[9px] font-bold flex items-center gap-1 shadow-2xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                    <span className="truncate max-w-[160px]">Ayat {issue.ayah}: {issue.type} {issue.detail ? `(${issue.detail})` : ''}</span>
                  </span>
                ))
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white text-[9px] font-bold shadow-2xs">
                  {language === 'en' ? `Lapses ${lapses}x` : `Pernah lupa ${lapses}x`}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
