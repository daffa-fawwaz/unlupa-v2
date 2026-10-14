import React, { useMemo } from 'react';
import { QuranPageItem, Language } from '../../types';
import { Activity, Target, ChevronRight } from 'lucide-react';
import { getQuranPageClusterKey, QuranIntervalClusterKey } from '../../lib/fsrs';

interface Props {
  quranPages: QuranPageItem[];
  language: Language;
  onClusterClick?: (clusterKey: QuranIntervalClusterKey) => void;
}

export const QuranStatsDashboard: React.FC<Props> = ({ quranPages, language, onClusterClick }) => {
  const stats = useMemo(() => {
    const now = new Date();
    
    let ziyadahThisWeek = 0;
    let ziyadahThisMonth = 0;
    
    let murajaahThisWeek = 0;
    let murajaahThisMonth = 0;
    let murajaahTotal = 0;
    
    let intervalLessThan5 = 0;
    let intervalLessThan10 = 0;
    let intervalLessThan20 = 0;
    let intervalLessThan30 = 0;
    let intervalOver30 = 0;

    let totalActive = 0;

    (quranPages || []).forEach(p => {
      if (!p || !p.isActive) return;
      totalActive++;

      if (p.activatedAt) {
        const activatedDate = new Date(p.activatedAt);
        const diffTime = Math.abs(now.getTime() - activatedDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays <= 7) ziyadahThisWeek++;
        if (diffDays <= 30) ziyadahThisMonth++;
      }

      if (p.fsrsData.reps > 0) {
        murajaahTotal++; 
      }

      if (p.reviewLogs && p.reviewLogs.length > 0) {
        const hasReviewLast7Days = p.reviewLogs.some(log => {
          const diffTime = Math.abs(now.getTime() - new Date(log.date).getTime());
          return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 7;
        });
        const hasReviewLast30Days = p.reviewLogs.some(log => {
          const diffTime = Math.abs(now.getTime() - new Date(log.date).getTime());
          return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 30;
        });

        if (hasReviewLast7Days) murajaahThisWeek++;
        if (hasReviewLast30Days) murajaahThisMonth++;
      }

      const cluster = getQuranPageClusterKey(p);
      if (cluster === '<5') intervalLessThan5++;
      else if (cluster === '<10') intervalLessThan10++;
      else if (cluster === '<20') intervalLessThan20++;
      else if (cluster === '<30') intervalLessThan30++;
      else if (cluster === '>30') intervalOver30++;
    });

    return {
      totalActive,
      ziyadahThisWeek,
      ziyadahThisMonth,
      murajaahThisWeek,
      murajaahThisMonth,
      murajaahTotal,
      intervalLessThan5,
      intervalLessThan10,
      intervalLessThan20,
      intervalLessThan30,
      intervalOver30
    };
  }, [quranPages]);

  const defaultCluster: QuranIntervalClusterKey = 
    stats.intervalLessThan5 > 0 ? '<5' :
    stats.intervalLessThan10 > 0 ? '<10' :
    stats.intervalLessThan20 > 0 ? '<20' :
    stats.intervalLessThan30 > 0 ? '<30' : '>30';

  return (
    <div className="bg-indigo-600 dark:bg-indigo-800 rounded-2xl p-4 sm:p-5 text-white shadow-sm relative overflow-hidden border border-indigo-500/50 dark:border-indigo-700/50 mt-2.5 mb-1">
      <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 divide-y md:divide-y-0 md:divide-x divide-white/10">
        <div className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">
                {language === 'en' ? 'Quran Memorization Activity' : 'Aktivitas Hafalan Al-Qur\'an'}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/10 text-emerald-300 border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Ziyadah
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/10 text-blue-300 border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Murajaah
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-white/10 bg-black/10 rounded-xl py-2 border border-white/5">
            <div className="flex flex-col items-center justify-center px-1">
              <span className="text-[8px] sm:text-[9px] text-indigo-200 font-bold uppercase tracking-tight">{language === 'en' ? '7 Days' : '7 Hari'}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-black text-emerald-400">+{stats.ziyadahThisWeek}</span>
                <span className="text-sm font-black text-blue-400">↻{stats.murajaahThisWeek}</span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center px-1">
              <span className="text-[8px] sm:text-[9px] text-indigo-200 font-bold uppercase tracking-tight">{language === 'en' ? '30 Days' : '30 Hari'}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-black text-emerald-400">+{stats.ziyadahThisMonth}</span>
                <span className="text-sm font-black text-blue-400">↻{stats.murajaahThisMonth}</span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center px-1">
              <span className="text-[8px] sm:text-[9px] text-indigo-200 font-bold uppercase tracking-tight whitespace-nowrap">Total</span>
              <div className="flex items-center mt-0.5">
                <span className="text-sm font-black text-blue-400">↻{stats.murajaahTotal}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-between pt-4 md:pt-0 md:pl-6">
          <div className="flex items-center justify-between mb-3">
            <div onClick={() => onClusterClick?.(defaultCluster)} className="flex items-center gap-1.5 cursor-pointer group select-none">
              <Target className="w-4 h-4 text-indigo-300 group-hover:scale-110 transition-transform shrink-0" />
              <h3 className="text-[11px] font-bold text-white uppercase tracking-wider group-hover:text-indigo-200 transition-colors">
                {language === 'en' ? 'Strength Map' : 'Peta Kekuatan Hafalan'}
              </h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-indigo-100 leading-none">
                {stats.totalActive} {language === 'en' ? 'hal' : 'hal'}
              </span>
            </div>
            <button type="button" onClick={() => onClusterClick?.(defaultCluster)} className="text-[9px] font-bold text-indigo-100 bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-0.5 transition-all cursor-pointer border border-white/10">
              <span>{language === 'en' ? 'Inspect' : 'Rincian'}</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          </div>
          <div className="flex w-full h-2 rounded-full overflow-hidden bg-black/20 shadow-inner p-0.5 gap-0.5 mb-2.5">
            {stats.intervalLessThan5 > 0 && <button type="button" style={{ flex: `${Math.max(stats.intervalLessThan5, 1)}` }} className="h-full bg-rose-400 rounded-full cursor-pointer hover:opacity-90" onClick={() => onClusterClick?.('<5')} />}
            {stats.intervalLessThan10 > 0 && <button type="button" style={{ flex: `${Math.max(stats.intervalLessThan10, 1)}` }} className="h-full bg-amber-400 rounded-full cursor-pointer hover:opacity-90" onClick={() => onClusterClick?.('<10')} />}
            {stats.intervalLessThan20 > 0 && <button type="button" style={{ flex: `${Math.max(stats.intervalLessThan20, 1)}` }} className="h-full bg-purple-400 rounded-full cursor-pointer hover:opacity-90" onClick={() => onClusterClick?.('<20')} />}
            {stats.intervalLessThan30 > 0 && <button type="button" style={{ flex: `${Math.max(stats.intervalLessThan30, 1)}` }} className="h-full bg-blue-400 rounded-full cursor-pointer hover:opacity-90" onClick={() => onClusterClick?.('<30')} />}
            {stats.intervalOver30 > 0 && <button type="button" style={{ flex: `${Math.max(stats.intervalOver30, 1)}` }} className="h-full bg-emerald-400 rounded-full cursor-pointer hover:opacity-90" onClick={() => onClusterClick?.('>30')} />}
            {stats.totalActive === 0 && <div className="w-full h-full flex items-center justify-center text-[9px] text-indigo-300 font-medium">{language === 'en' ? 'No active pages yet' : 'Belum ada halaman aktif'}</div>}
          </div>
          <div className="grid grid-cols-5 gap-1.5 text-center">
            <button type="button" onClick={() => onClusterClick?.('<5')} className="flex flex-col items-center justify-center hover:bg-white/5 border border-transparent hover:border-white/10 rounded-xl py-1 transition-all cursor-pointer group">
              <span className="text-sm font-black text-rose-400 group-hover:scale-110 transition-transform leading-none">{stats.intervalLessThan5}</span>
              <span className="text-[8px] sm:text-[9px] font-bold text-indigo-200 mt-1">{language === 'en' ? '<5 d' : '<5 Hari'}</span>
            </button>
            <button type="button" onClick={() => onClusterClick?.('<10')} className="flex flex-col items-center justify-center hover:bg-white/5 border border-transparent hover:border-white/10 rounded-xl py-1 transition-all cursor-pointer group">
              <span className="text-sm font-black text-amber-400 group-hover:scale-110 transition-transform leading-none">{stats.intervalLessThan10}</span>
              <span className="text-[8px] sm:text-[9px] font-bold text-indigo-200 mt-1">{language === 'en' ? '5-9 d' : '5-9 Hari'}</span>
            </button>
            <button type="button" onClick={() => onClusterClick?.('<20')} className="flex flex-col items-center justify-center hover:bg-white/5 border border-transparent hover:border-white/10 rounded-xl py-1 transition-all cursor-pointer group">
              <span className="text-sm font-black text-purple-400 group-hover:scale-110 transition-transform leading-none">{stats.intervalLessThan20}</span>
              <span className="text-[8px] sm:text-[9px] font-bold text-indigo-200 mt-1">{language === 'en' ? '10-19 d' : '10-19 Hari'}</span>
            </button>
            <button type="button" onClick={() => onClusterClick?.('<30')} className="flex flex-col items-center justify-center hover:bg-white/5 border border-transparent hover:border-white/10 rounded-xl py-1 transition-all cursor-pointer group">
              <span className="text-sm font-black text-blue-300 group-hover:scale-110 transition-transform leading-none">{stats.intervalLessThan30}</span>
              <span className="text-[8px] sm:text-[9px] font-bold text-indigo-200 mt-1">{language === 'en' ? '20-29 d' : '20-29 Hari'}</span>
            </button>
            <button type="button" onClick={() => onClusterClick?.('>30')} className="flex flex-col items-center justify-center hover:bg-white/5 border border-transparent hover:border-white/10 rounded-xl py-1 transition-all cursor-pointer group">
              <span className="text-sm font-black text-emerald-400 group-hover:scale-110 transition-transform leading-none">{stats.intervalOver30}</span>
              <span className="text-[8px] sm:text-[9px] font-bold text-indigo-200 mt-1">{language === 'en' ? '>30 d' : '>30 Hari'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
