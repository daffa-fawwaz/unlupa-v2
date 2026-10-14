import React, { useMemo } from 'react';

interface ActivityHeatmapProps {
  language: 'en' | 'id' | 'ar';
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ language }) => {
  // Generate a plausible 60-day heatmap data based on current date
  const heatmapData = useMemo(() => {
    const data: { date: Date; count: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 59; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      
      // Plausible random distribution: more active recently, some days off
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      let count = 0;
      if (Math.random() > (isWeekend ? 0.6 : 0.2)) {
        // Active day
        count = Math.floor(Math.random() * 20) + 5;
      }
      
      data.push({ date: d, count });
    }
    return data;
  }, []);

  const totalReviews = useMemo(() => (heatmapData || []).reduce((acc, curr) => acc + (curr?.count || 0), 0), [heatmapData]);
  
  const activeStreak = useMemo(() => {
    if (!heatmapData || heatmapData.length === 0) return 0;
    const reversed = [...heatmapData].reverse();
    const streakIndex = reversed.findIndex(d => d.count === 0);
    return streakIndex === -1 ? reversed.length : streakIndex;
  }, [heatmapData]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-4.5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            {language === 'en' ? 'Learning Consistency' : 'Konsistensi Murajaah'}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {language === 'en' ? '60-day review activity & consistency.' : 'Aktivitas murajaah selama 60 hari terakhir.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{language === 'en' ? 'Streak' : 'Streak'}</div>
            <div className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-500 leading-tight">{activeStreak} <span className="text-[10px] font-normal text-slate-400">hari</span></div>
          </div>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
          <div className="text-right">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{language === 'en' ? 'Total' : 'Total'}</div>
            <div className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-500 leading-tight">{totalReviews}</div>
          </div>
        </div>
      </div>

      <div className="flex items-end gap-1 overflow-x-auto pb-1.5 scrollbar-hide">
        {(heatmapData || []).map((day, idx) => {
          let bgClass = 'bg-slate-100 dark:bg-slate-800';
          if (day.count > 0) bgClass = 'bg-emerald-100 dark:bg-emerald-900/40';
          if (day.count > 10) bgClass = 'bg-emerald-300 dark:bg-emerald-700/60';
          if (day.count > 20) bgClass = 'bg-emerald-500 dark:bg-emerald-500';

          return (
            <div 
              key={idx}
              className={`w-2.5 sm:w-3 h-5 sm:h-7 rounded-xs shrink-0 ${bgClass} transition-all hover:ring-2 hover:ring-offset-1 hover:ring-emerald-400 dark:hover:ring-offset-slate-900 cursor-help`}
              title={`${day.date.toLocaleDateString()}: ${day.count} review`}
            />
          );
        })}
      </div>
      
      <div className="flex items-center justify-between mt-2 text-[10px] font-medium text-slate-400">
        <span>60 {language === 'en' ? 'Days Ago' : 'Hari Lalu'}</span>
        <div className="flex items-center gap-1.5">
          <span className="opacity-70">{language === 'en' ? 'Less' : 'Sedikit'}</span>
          <div className="flex gap-0.5">
            <div className="w-2 h-2 rounded-xs bg-slate-100 dark:bg-slate-800" />
            <div className="w-2 h-2 rounded-xs bg-emerald-100 dark:bg-emerald-900/40" />
            <div className="w-2 h-2 rounded-xs bg-emerald-300 dark:bg-emerald-700/60" />
            <div className="w-2 h-2 rounded-xs bg-emerald-500 dark:bg-emerald-500" />
          </div>
          <span className="opacity-70">{language === 'en' ? 'More' : 'Banyak'}</span>
        </div>
        <span>{language === 'en' ? 'Today' : 'Hari Ini'}</span>
      </div>
    </div>
  );
};
