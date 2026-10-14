import React, { useState, useEffect, useMemo } from 'react';
import { QuranPageItem, Language } from '../../types';
import { X, Target, Layers, Search } from 'lucide-react';
import { QuranPageCard } from './QuranPageCard';
import { getQuranPageClusterKey, QuranIntervalClusterKey } from '../../lib/fsrs';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clusterKey: QuranIntervalClusterKey | null;
  quranPages?: QuranPageItem[];
  pages?: QuranPageItem[];
  language: Language;
  onToggleActive?: (pageNumber: number) => void;
  onOpenMapanModal?: (page: QuranPageItem) => void;
  onOpenFeedbackModal?: (page: QuranPageItem) => void;
  onOpenMushafViewer?: (pageNumber: number) => void;
  onInlineReview?: (pageNumber: number, rating: 1 | 2 | 3) => void;
  justReviewedPage?: { pageNumber: number; rating: 1 | 2 | 3 } | null;
}

const CLUSTERS: Array<{
  key: QuranIntervalClusterKey;
  labelEn: string;
  labelId: string;
  subEn: string;
  subId: string;
  color: string;
  activeBg: string;
  badge: string;
}> = [
  {
    key: '<5',
    labelEn: '< 5 Days',
    labelId: '< 5 Hari',
    subEn: 'New & Adaptation Stage (< 5 Days)',
    subId: 'Hafalan Baru & Adaptasi Awal (< 5 Hari)',
    color: 'text-rose-600 dark:text-rose-400',
    activeBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300',
    badge: 'bg-rose-500 text-white'
  },
  {
    key: '<10',
    labelEn: '5 - 9 Days',
    labelId: '5 - 9 Hari',
    subEn: 'Developing Stability (5 - 9 Days)',
    subId: 'Penguatan & Pembiasaan (5 - 9 Hari)',
    color: 'text-amber-600 dark:text-amber-400',
    activeBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-500 text-white'
  },
  {
    key: '<15',
    labelEn: '10 - 14 Days',
    labelId: '10 - 14 Hari',
    subEn: 'Consolidation Stage (10 - 14 Days)',
    subId: 'Konsolidasi & Terpola (10 - 14 Hari)',
    color: 'text-teal-600 dark:text-teal-400',
    activeBg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300',
    badge: 'bg-teal-600 text-white'
  },
  {
    key: '<20',
    labelEn: '15 - 19 Days',
    labelId: '15 - 19 Hari',
    subEn: 'Stabilizing Stage (15 - 19 Days)',
    subId: 'Hafalan Kokoh & Mantap (15 - 19 Hari)',
    color: 'text-sky-600 dark:text-sky-400',
    activeBg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300',
    badge: 'bg-sky-600 text-white'
  },
  {
    key: '<30',
    labelEn: '20 - 29 Days',
    labelId: '20 - 29 Hari',
    subEn: 'Near Mastery Stage (20 - 29 Days)',
    subId: 'Menuju Mapan & Tertanam Kuat (20 - 29 Hari)',
    color: 'text-indigo-600 dark:text-indigo-400',
    activeBg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
    badge: 'bg-indigo-600 text-white'
  },
  {
    key: '>30',
    labelEn: '> 30 Days',
    labelId: '> 30 Hari',
    subEn: 'Mastered & Mutqin (> 30 Days)',
    subId: 'Mapan & Mutqin (> 30 Hari)',
    color: 'text-emerald-600 dark:text-emerald-400',
    activeBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-600 text-white'
  }
];

export const IntervalPagesModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  clusterKey, 
  quranPages = [], 
  pages: altPages = [],
  language, 
  onToggleActive = () => {},
  onOpenMapanModal = () => {},
  onOpenFeedbackModal = () => {},
  onOpenMushafViewer = () => {},
  onInlineReview,
  justReviewedPage
}) => {
  const safeQuranPages = useMemo(() => (quranPages && quranPages.length > 0 ? quranPages : altPages) || [], [quranPages, altPages]);
  const [activeCluster, setActiveCluster] = useState<QuranIntervalClusterKey>(clusterKey || '<5');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track page numbers in the current cluster for this viewing session so reviewing does not cause abrupt pop-out
  const [sessionPageNumbers, setSessionPageNumbers] = useState<number[]>([]);

  // Synchronize active cluster when modal opens or parent passes a new clusterKey
  useEffect(() => {
    if (clusterKey) {
      setActiveCluster(clusterKey);
    }
  }, [clusterKey, isOpen]);

  // Update session pages when activeCluster or modal open state changes
  useEffect(() => {
    if (isOpen && activeCluster) {
      const pageIds = (safeQuranPages || [])
        .filter(p => p && p.isActive && getQuranPageClusterKey(p) === activeCluster)
        .map(p => p.pageNumber);
      setSessionPageNumbers(pageIds);
      setSearchQuery('');
    }
  }, [isOpen, activeCluster, safeQuranPages]);

  // Compute live counts for all 6 clusters to show on the tab badges
  const clusterCounts = useMemo(() => {
    const counts: Record<QuranIntervalClusterKey, number> = {
      '<5': 0,
      '<10': 0,
      '<15': 0,
      '<20': 0,
      '<30': 0,
      '>30': 0
    };
    (safeQuranPages || []).forEach(p => {
      if (p && p.isActive) {
        const k = getQuranPageClusterKey(p);
        counts[k] = (counts[k] || 0) + 1;
      }
    });
    return counts;
  }, [safeQuranPages]);

  // Resolve pages to display: prioritize sessionPageNumbers to keep reviewed items visible,
  // falling back to live matching if sessionPageNumbers is empty or newly activated
  const displayedPages = useMemo(() => {
    let pagesList: QuranPageItem[] = [];
    if (sessionPageNumbers.length > 0) {
      pagesList = sessionPageNumbers
        .map(num => (safeQuranPages || []).find(p => p && p.pageNumber === num))
        .filter((p): p is QuranPageItem => Boolean(p && p.isActive));
    } else {
      pagesList = (safeQuranPages || []).filter(p => p && p.isActive && getQuranPageClusterKey(p) === activeCluster);
    }

    if (!searchQuery.trim()) return pagesList;

    const query = searchQuery.toLowerCase().trim();
    return pagesList.filter(p => 
      p.pageNumber.toString().includes(query) ||
      p.surahNameEn?.toLowerCase().includes(query) ||
      p.surahNameAr?.toLowerCase().includes(query) ||
      `juz ${p.juzNumber}`.includes(query)
    );
  }, [sessionPageNumbers, safeQuranPages, activeCluster, searchQuery]);

  if (!isOpen) return null;

  const currentClusterMeta = CLUSTERS.find(c => c.key === activeCluster) || CLUSTERS[0];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-slate-850/80 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 ${currentClusterMeta.activeBg}`}>
              <Target className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug">
                  {language === 'en' ? `Memory Stability: ${currentClusterMeta.labelEn}` : `Kekuatan Hafalan: ${currentClusterMeta.labelId}`}
                </h3>
                <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold leading-normal shrink-0 shadow-2xs ${currentClusterMeta.badge}`}>
                  {clusterCounts[activeCluster]} {language === 'en' ? 'Pages' : 'Halaman'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                {language === 'en' ? currentClusterMeta.subEn : currentClusterMeta.subId}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            aria-label={language === 'en' ? 'Close modal' : 'Tutup modal'}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cluster Selector Tabs & Search Bar */}
        <div className="px-4 sm:px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* 5 Stability Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none py-0.5">
            {CLUSTERS.map(c => {
              const isActive = activeCluster === c.key;
              const count = clusterCounts[c.key] || 0;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => {
                    setActiveCluster(c.key);
                    const pageIds = (safeQuranPages || [])
                      .filter(p => p && p.isActive && getQuranPageClusterKey(p) === c.key)
                      .map(p => p.pageNumber);
                    setSessionPageNumbers(pageIds);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all inline-flex items-center justify-center gap-2 border cursor-pointer ${
                    isActive
                      ? c.activeBg
                      : 'border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{language === 'en' ? c.labelEn : c.labelId}</span>
                  <span className={`inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-[11px] font-black leading-none ${
                    isActive ? c.badge : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative shrink-0 w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'en' ? 'Search page / surah...' : 'Cari nomor hal / surah...'}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Content Body: Responsive Page Cards */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {displayedPages.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Layers className="w-9 h-9 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold">
                {searchQuery 
                  ? (language === 'en' ? 'No pages matching search query.' : 'Tidak ada halaman yang cocok dengan pencarian.')
                  : (language === 'en' ? 'No pages in this stability range.' : 'Belum ada halaman pada rentang kekuatan hafalan ini.')}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                >
                  {language === 'en' ? 'Clear search' : 'Hapus pencarian'}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {displayedPages.map(p => (
                <QuranPageCard
                  key={p.pageNumber}
                  page={p}
                  language={language}
                  onToggleActive={onToggleActive}
                  onOpenMapanModal={onOpenMapanModal}
                  onOpenFeedbackModal={onOpenFeedbackModal}
                  onOpenMushafViewer={onOpenMushafViewer}
                  onInlineReview={onInlineReview}
                  isJustReviewed={justReviewedPage?.pageNumber === p.pageNumber}
                  justReviewedRating={justReviewedPage?.pageNumber === p.pageNumber ? justReviewedPage.rating : undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
          <span>
            {language === 'en' 
              ? `Showing ${displayedPages.length} of ${clusterCounts[activeCluster]} pages in this cluster` 
              : `Menampilkan ${displayedPages.length} dari ${clusterCounts[activeCluster]} halaman pada klaster ini`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {language === 'en' ? 'Close' : 'Tutup'}
          </button>
        </div>
      </div>
    </div>
  );
};
