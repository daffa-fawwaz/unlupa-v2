import React from 'react';
import { X, BookOpen } from 'lucide-react';
import { PageDocument } from '../../types';
import { BlockViewer } from './blocks/BlockViewer';
import { useApp } from '../../context/AppContext';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { soundEffects } from '../../lib/soundFeedback';

interface PageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  page: PageDocument | null;
}

export const PageViewerModal: React.FC<PageViewerModalProps> = ({ isOpen, onClose, page }) => {
  const { language } = useApp();

  useSwipeGesture(null, {
    disabled: !isOpen,
    onSwipeRight: () => {
      soundEffects.playCardFlip('backward');
      onClose();
    },
    onSwipeDown: () => {
      soundEffects.playSoftClick();
      onClose();
    },
    threshold: 40,
    minRatio: 1.15,
  });

  if (!isOpen || !page) return null;

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-[#EBEEF5] dark:bg-[#0B111D] animate-in fade-in duration-200">
      <header className="h-16 border-b border-black/[0.04] dark:border-white/[0.04] bg-white/90 dark:bg-[#131C2E]/90 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-2xl clay-icon-pod-emerald flex items-center justify-center text-white shrink-0 shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[#18234A] dark:text-[#F8FAFC] tracking-tight truncate max-w-sm sm:max-w-md">
            {page.title}
          </h2>
        </div>
        <button 
          onClick={onClose}
          className="w-9 h-9 rounded-2xl clay-icon-pod-neutral flex items-center justify-center text-[#5E6D88] hover:text-[#18234A] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
          title="Tutup"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-6 pb-32">
          <div className="clay-card p-6 sm:p-8 rounded-3xl space-y-6">
            <h1 className="text-2xl sm:text-3xl font-black text-[#18234A] dark:text-[#F8FAFC] tracking-tight border-b border-black/[0.04] dark:border-white/[0.04] pb-4">
              {page.title}
            </h1>
            
            <BlockViewer blocks={page.blocks || []} />
          </div>
        </div>
      </div>
    </div>
  );
};
