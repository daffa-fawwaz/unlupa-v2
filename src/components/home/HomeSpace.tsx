import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { soundEffects } from '../../lib/soundFeedback';
import { HomeHeroProgressRings } from './HomeHeroProgressRings';
import { WorkloadForecastWaveWidget } from './WorkloadForecastWaveWidget';
import { VisualReviewCalendar } from './VisualReviewCalendar';
import { MemoryStabilityPyramidWidget } from './MemoryStabilityPyramidWidget';
import { AccuracyRetentionDialWidget } from './AccuracyRetentionDialWidget';
import { QuranReviewModal } from '../quran/QuranReviewModal';
import { MushafPageViewerModal } from '../quran/MushafPageViewerModal';
import { PersonalReviewModal } from '../personal/PersonalReviewModal';

export const HomeSpace: React.FC = () => {
  const {
    quranPages,
    items,
    language,
    setActiveSpace,
    currentStreak,
  } = useApp();

  const [quranReviewConfig, setQuranReviewConfig] = useState<{ isOpen: boolean; juzFilter: number | null }>({
    isOpen: false,
    juzFilter: null
  });
  const [isPersonalReviewOpen, setIsPersonalReviewOpen] = useState(false);
  const [previewPageNumber, setPreviewPageNumber] = useState<number | null>(null);

  useSwipeGesture(null, {
    disabled: quranReviewConfig.isOpen || isPersonalReviewOpen || previewPageNumber !== null || Boolean(typeof document !== 'undefined' && document.body.getAttribute('data-annotation-open') === 'true'),
    onSwipeLeft: () => {
      soundEffects.playCardFlip('forward');
      setActiveSpace('quran');
    },
    onSwipeRight: () => {
      soundEffects.playCardFlip('backward');
      setActiveSpace('leaderboard');
    },
    threshold: 40,
    minRatio: 1.15,
  });

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 pb-20 space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. DUAL PROGRESS DIAGRAMS (AL-QUR'AN & RUANG BUKU) - STATUS MAKRO & PENCAPAIAN */}
      <section className="pt-1 sm:pt-2">
        <HomeHeroProgressRings
          language={language}
          quranPages={quranPages}
          items={items}
          currentStreak={currentStreak}
          onNavigateQuran={() => setActiveSpace('quran')}
          onNavigateBooks={() => setActiveSpace('personal')}
        />
      </section>

      {/* 2. LINI MASA MURAJAAH (WORKLOAD FORECAST WAVE & HISTORY) */}
      <section>
        <WorkloadForecastWaveWidget />
      </section>

      {/* 3. KALENDER / PREDIKSI MURAJAAH (EKSEKUSI TUGAS HARI INI & JADWAL TERDEKAT) */}
      <section>
        <VisualReviewCalendar
          onOpenQuranReview={(juz) => setQuranReviewConfig({ isOpen: true, juzFilter: juz || null })}
          onOpenPersonalReview={() => setIsPersonalReviewOpen(true)}
          onOpenMushafViewer={(page) => setPreviewPageNumber(page)}
        />
      </section>

      {/* 4. DIAGNOSIS KUALITAS & KEDALAMAN MEMORI FSRS (PIRAMIDA STABILITAS & AKURASI HASIL) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 items-stretch">
        <div className="flex flex-col h-full">
          <MemoryStabilityPyramidWidget />
        </div>
        <div className="flex flex-col h-full">
          <AccuracyRetentionDialWidget />
        </div>
      </section>

      {/* Global Review Modals Triggered from Home */}
      <QuranReviewModal
        isOpen={quranReviewConfig.isOpen}
        onClose={() => setQuranReviewConfig({ isOpen: false, juzFilter: null })}
        juzFilter={quranReviewConfig.juzFilter}
      />

      <MushafPageViewerModal
        isOpen={previewPageNumber !== null}
        onClose={() => setPreviewPageNumber(null)}
        pageNumber={previewPageNumber || 1}
        onNavigatePage={(p) => setPreviewPageNumber(p)}
      />

      <PersonalReviewModal
        isOpen={isPersonalReviewOpen}
        onClose={() => setIsPersonalReviewOpen(false)}
      />
    </div>
  );
};
