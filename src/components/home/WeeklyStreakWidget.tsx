import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Flame, Check, Trophy } from 'lucide-react';
import { motion } from 'motion/react';

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

export const WeeklyStreakWidget: React.FC = () => {
  const { quranPages, items, currentStreak, language } = useApp();

  const weeklyData = useMemo(() => {
    const countsByDate = new Map<string, number>();
    
    (quranPages || []).forEach(p => {
      (p.reviewLogs || []).forEach(log => {
        const dStr = safeDateKey(log?.date);
        if (dStr) countsByDate.set(dStr, (countsByDate.get(dStr) || 0) + 1);
      });
      const actStr = safeDateKey(p.activatedAt);
      if (actStr) countsByDate.set(actStr, (countsByDate.get(actStr) || 0) + 1);
    });

    (items || []).forEach(it => {
      (it.reviewLogs || []).forEach(log => {
        const dStr = safeDateKey(log?.date);
        if (dStr) countsByDate.set(dStr, (countsByDate.get(dStr) || 0) + 1);
      });
    });

    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - distanceToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekDays = [];
    const dayNames = language === 'en' 
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

    let todayIndex = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const dStr = safeDateKey(d.toISOString());
      
      const isToday = d.toDateString() === today.toDateString();
      if (isToday) todayIndex = i;

      weekDays.push({
        name: dayNames[i],
        date: d,
        isActive: dStr ? (countsByDate.get(dStr) || 0) > 0 : false,
        isToday,
        isFuture: d > today
      });
    }

    return { weekDays, todayIndex };
  }, [quranPages, items, language]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="neumorph-card p-4 sm:p-5 h-full flex flex-col justify-between relative overflow-hidden group rounded-3xl"
    >
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(255,111,61,0.35)]">
            <Flame className="w-4.5 h-4.5 text-white fill-white shrink-0" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#18234A] dark:text-[#F8FAFC] tracking-tight">
              {language === 'en' ? 'Weekly Streak' : 'Istiqomah Mingguan'}
            </h3>
            <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] font-medium mt-0.5">
              {currentStreak} {language === 'en' ? 'days active' : 'hari beruntun'}
            </p>
          </div>
        </div>
        {currentStreak > 0 && (
          <div className="px-2.5 py-1 neumorph-card text-[#FF6F3D] text-xs font-bold flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-[#FF6F3D] fill-[#FF6F3D]" />
            <span>{currentStreak} {language === 'en' ? 'd' : 'h'}</span>
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-end gap-1.5 sm:gap-2.5 relative z-10 h-24">
        {weeklyData.weekDays.map((day, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
            
            {/* 3D Soft Capsule */}
            <div className={`w-full max-w-[34px] rounded-full flex flex-col items-center justify-start pt-1.5 relative transition-all duration-700 ease-out ${
              day.isActive 
                ? 'h-full bg-gradient-to-t from-[#E65320] to-[#FF7E4A] shadow-[0_6px_16px_rgba(255,111,61,0.45),inset_1.5px_1.5px_2px_rgba(255,255,255,0.7),inset_-1.5px_-1.5px_2px_rgba(180,40,20,0.3)]'
                : day.isToday
                  ? 'h-[65%] neumorph-inset ring-2 ring-[#FF6F3D]/40'
                  : day.isFuture
                    ? 'h-[40%] bg-transparent border border-black/[0.08] dark:border-white/10 border-dashed'
                    : 'h-[50%] neumorph-inset opacity-75'
            }`}>
              
              {/* Inner active element */}
              {day.isActive && (
                <div className="w-5 h-5 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-xs mt-0.5 shadow-2xs">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              )}
              
              {/* Inner today indicator */}
              {!day.isActive && day.isToday && (
                <div className="w-2 h-2 rounded-full bg-[#FF6F3D] mt-2 animate-pulse shadow-xs" />
              )}
              
            </div>
            
            <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
              day.isActive
                ? 'text-[#FF6F3D]'
                : day.isToday 
                  ? 'text-[#18234A] dark:text-[#F8FAFC]' 
                  : 'text-[#8493AB]'
            }`}>
              {day.name}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
