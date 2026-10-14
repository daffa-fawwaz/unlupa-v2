import { useEffect } from 'react';
import { QuranStats } from '../types';

export const useDailyReminder = (quranStats: QuranStats, personalStats: any) => {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    
    const checkAndNotify = async () => {
      try {
        // Don't ask repeatedly if denied
        if (Notification.permission === 'denied') return;
        
        const lastNotified = localStorage.getItem('unlupa_last_notified_date');
        const today = new Date().toISOString().split('T')[0];
        
        if (lastNotified === today) return; // Already notified today
        
        const dueCount = (quranStats?.dueToday || 0) + (personalStats?.dueToday || 0);
        if (dueCount > 0) {
          if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return;
          }
          
          if (Notification.permission === 'granted') {
            new Notification('Waktunya Muraja\'ah! 📖', {
              body: `Ada ${dueCount} materi hafalan yang jatuh tempo hari ini. Yuk rutinkan muraja'ahmu!`,
              icon: '/favicon.svg'
            });
            try {
              localStorage.setItem('unlupa_last_notified_date', today);
            } catch (e) { /* ignore */ }
          }
        }
      } catch (err) {
        // Silently ignore notification errors (e.g. inside restricted iframe)
        console.warn('Daily reminder notification notice:', err);
      }
    };
    
    // Check after a short delay so it doesn't block initial render
    const timer = setTimeout(checkAndNotify, 3000);
    return () => clearTimeout(timer);
  }, [quranStats, personalStats]);
};
