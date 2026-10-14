import React from 'react';
import { Flame } from 'lucide-react';
import { motion } from 'motion/react';

export interface StreakCounterProps {
  streakCount?: number;
  count?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({
  streakCount,
  count,
  label = 'Streak',
  size = 'md',
  className = '',
  showLabel = false,
}) => {
  const value = streakCount ?? count ?? 0;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-2.5 py-1.5 text-xs sm:text-sm gap-1.5',
    lg: 'px-3.5 py-2 text-sm sm:text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const isActive = value > 0;

  return (
    <div
      className={`inline-flex items-center justify-center font-bold rounded-full transition-all duration-300 ${
        isActive
          ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-red-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 shadow-xs'
          : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
      } ${sizeClasses[size]} ${className}`}
    >
      <motion.div
        animate={isActive ? { scale: [1, 1.18, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        className="relative flex items-center justify-center shrink-0"
      >
        <Flame
          className={`${iconSizes[size]} ${
            isActive
              ? 'text-orange-500 fill-amber-400 drop-shadow-[0_0_6px_rgba(249,115,22,0.5)]'
              : 'text-slate-400 dark:text-slate-500 fill-slate-300 dark:fill-slate-600'
          }`}
        />
      </motion.div>
      <span className="font-extrabold font-mono tracking-tight">{value}</span>
      {showLabel && (
        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </span>
      )}
    </div>
  );
};

export { FireStrikeBar } from './FireStrikeBar';
export { PurpleStrikeFireBadge } from './PurpleStrikeFireBadge';
export default StreakCounter;
