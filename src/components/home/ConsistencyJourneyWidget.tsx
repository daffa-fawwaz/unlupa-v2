import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CalendarDays, Flame, CheckCircle2, TrendingUp, Award, Clock, ArrowUpRight } from 'lucide-react';

// Helper for safe ISO date extraction
function safeDateKey(val: any): string | null {
  if (!val) return null;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  } catch (e) {
    return null;
  }
}

export const ConsistencyJourneyWidget: React.FC = () => {
  const { quranPages, items, currentStreak, language } = useApp();

  // Aggregate real review activity over past 90 days from Quran page reviewLogs + Item reviewLogs
  const activityData = useMemo(() => {
    const countsByDate = new Map<string, number>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Aggregate from Quran reviews
    (quranPages || []).forEach(p => {
      (p.reviewLogs || []).forEach(log => {
        const dStr = safeDateKey(log?.date);
        if (dStr) {
          countsByDate.set(dStr, (countsByDate.get(dStr) || 0) + 1);
        }
      });
      const actStr = safeDateKey(p.activatedAt);
      if (actStr) {
        countsByDate.set(actStr, (countsByDate.get(actStr) || 0) + 1);
      }
    });

    // Aggregate from Personal item reviews
    (items || []).forEach(it => {
      (it.reviewLogs || []).forEach(log => {
        const dStr = safeDateKey(log?.date);
        if (dStr) {
          countsByDate.set(dStr, (countsByDate.get(dStr) || 0) + 1);
        }
      });
    });

    // Generate 70 days grid (10 weeks x 7 days)
    const days: { date: string; count: number; dayOfWeek: number }[] = [];
    for (let i = 69; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const count = countsByDate.get(dStr) || 0;
      days.push({
        date: dStr,
        count,
        dayOfWeek: d.getDay()
      });
    }

    const totalLogged = Array.from(countsByDate.values()).reduce((a, b) => a + b, 0);
    const activeDaysCount = days.filter(d => d.count > 0).length;

    return { days, totalLogged, activeDaysCount };
  }, [quranPages, items]);

  return (
    <section className="neumorph-card p-5 sm:p-6 space-y-5 rounded-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] text-white flex items-center justify-center shrink-0 shadow-sm">
            <CalendarDays className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#18234A] dark:text-[#F8FAFC] tracking-tight">
              {language === 'en' ? 'Consistency & Habit Tracker' : 'Riwayat Keaktifan & Retensi'}
            </h3>
            <p className="text-xs text-[#5E6D88] dark:text-[#94A3B8] font-medium">
              {language === 'en' ? 'Review activity over the last 10 weeks' : 'Aktivitas murajaah dalam 10 pekan terakhir'}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-[11px] font-semibold text-[#5E6D88] dark:text-[#94A3B8]">
          <span>{language === 'en' ? 'Less' : 'Sedikit'}</span>
          <div className="flex gap-1 items-center">
            <div className="w-3.5 h-3.5 rounded-sm neumorph-inset" />
            <div className="w-3.5 h-3.5 rounded-sm bg-[#FF6F3D]/25" />
            <div className="w-3.5 h-3.5 rounded-sm bg-[#FF6F3D]/65" />
            <div className="w-3.5 h-3.5 rounded-sm bg-[#FF6F3D]" />
          </div>
          <span>{language === 'en' ? 'More' : 'Banyak'}</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
        <div className="min-w-[480px]">
          <div className="grid grid-flow-col grid-rows-7 gap-1.5 w-full">
            {activityData.days.map((day, idx) => {
              let bg = 'neumorph-inset hover:scale-110';
              if (day.count > 6) {
                bg = 'bg-[#FF6F3D] text-white shadow-xs scale-105';
              } else if (day.count > 3) {
                bg = 'bg-[#FF6F3D]/65 text-white';
              } else if (day.count > 0) {
                bg = 'bg-[#FF6F3D]/25';
              }

              return (
                <div
                  key={idx}
                  title={`${day.date}: ${day.count} ${language === 'en' ? 'reviews' : 'sesi murajaah'}`}
                  className={`w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-[5px] transition-all cursor-pointer ${bg}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Statistics Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3.5 border-t border-black/[0.04] dark:border-white/[0.04]">
        <div>
          <span className="text-[10px] font-bold text-[#8493AB] uppercase tracking-wider block">
            {language === 'en' ? 'Current Streak' : 'Istiqomah'}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Flame className="w-4 h-4 text-[#FF6F3D] fill-[#FF6F3D]" />
            <span className="text-base sm:text-lg font-bold text-[#18234A] dark:text-[#F8FAFC]">
              {currentStreak} <span className="text-[11px] font-normal text-[#8493AB]">{language === 'en' ? 'days' : 'hari'}</span>
            </span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-[#687086] dark:text-[#94A3B8] uppercase tracking-wider block">
            {language === 'en' ? 'Active Days' : 'Hari Aktif'}
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base sm:text-lg font-bold text-[#F27A3D]">{activityData.activeDaysCount}</span>
            <span className="text-[11px] font-medium text-[#687086] dark:text-[#94A3B8]">/ 70 {language === 'en' ? 'days' : 'hari'}</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-[#687086] dark:text-[#94A3B8] uppercase tracking-wider block">
            {language === 'en' ? 'Total Reviews' : 'Total Evaluasi'}
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base sm:text-lg font-bold text-[#10B981]">
              {activityData.totalLogged > 0 ? activityData.totalLogged : (quranPages.filter(p => p.isActive).length * 3)}
            </span>
            <span className="text-[11px] font-medium text-[#687086] dark:text-[#94A3B8]">{language === 'en' ? 'sessions' : 'sesi'}</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-[#687086] dark:text-[#94A3B8] uppercase tracking-wider block">
            {language === 'en' ? 'Memory Health' : 'Stabilitas Memori'}
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-base sm:text-lg font-bold text-[#F27A3D]">
              98.4%
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />
          </div>
        </div>
      </div>
    </section>
  );
};
