import React, { useState, useEffect, useMemo } from 'react';
import { BookItem, Book, Chapter, ClassGroup, Language } from '../../types';
import { X, Sparkles, Search, BookOpen, Clock, Calendar, CheckCircle2, ArrowRight, GraduationCap, Library } from 'lucide-react';
import { getBookItemClusterKey, BookIntervalClusterKey, getNonQuranIntervalDays } from '../../lib/fsrs';
import { BilingualCardText } from '../common/BilingualCardText';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clusterKey: BookIntervalClusterKey | null;
  items?: BookItem[];
  books?: Book[];
  chapters?: Chapter[];
  myClasses?: ClassGroup[];
  language: Language;
  onOpenInPersonalSpace?: () => void;
  onOpenInClassesSpace?: () => void;
}

const BOOK_CLUSTERS: Array<{
  key: BookIntervalClusterKey;
  labelEn: string;
  labelId: string;
  subEn: string;
  subId: string;
  color: string;
  badge: string;
}> = [
  {
    key: '<75',
    labelEn: '< 75 Days',
    labelId: '< 75 Hari',
    subEn: 'Foundation & Early Adaptation (< 75 Days)',
    subId: 'Tahap Pondasi & Pengenalan Awal (< 75 Hari)',
    color: 'text-rose-600 dark:text-rose-400',
    badge: 'clay-badge-rose text-white'
  },
  {
    key: '<150',
    labelEn: '75 - 149 Days',
    labelId: '75 - 149 Hari',
    subEn: 'Developing Stability (75 - 149 Days)',
    subId: 'Penguatan Menengah & Terpola (75 - 149 Hari)',
    color: 'text-amber-600 dark:text-amber-400',
    badge: 'clay-badge-orange text-white'
  },
  {
    key: '<225',
    labelEn: '150 - 224 Days',
    labelId: '150 - 224 Hari',
    subEn: 'Deep Knowledge Anchoring (150 - 224 Days)',
    subId: 'Pemahaman Kuat & Tertanam (150 - 224 Hari)',
    color: 'text-purple-600 dark:text-purple-400',
    badge: 'clay-badge-purple text-white'
  },
  {
    key: '<300',
    labelEn: '225 - 299 Days',
    labelId: '225 - 299 Hari',
    subEn: 'Advanced Consolidation (225 - 299 Days)',
    subId: 'Konsolidasi Lanjut & Mantap (225 - 299 Hari)',
    color: 'text-sky-600 dark:text-sky-400',
    badge: 'clay-badge-sky text-white'
  },
  {
    key: '<375',
    labelEn: '300 - 374 Days',
    labelId: '300 - 374 Hari',
    subEn: 'Near Mastery Stage (300 - 374 Days)',
    subId: 'Kian Matang Menuju Kelulusan (300 - 374 Hari)',
    color: 'text-indigo-600 dark:text-indigo-400',
    badge: 'clay-badge-indigo text-white'
  },
  {
    key: '>375',
    labelEn: '≥ 375 Days',
    labelId: '≥ 375 Hari',
    subEn: 'Mastered / Book Graduation (≥ 375 Days)',
    subId: 'Mapan & Lulus Kitab (≥ 375 Hari)',
    color: 'text-emerald-600 dark:text-emerald-400',
    badge: 'clay-badge-emerald text-white'
  }
];

export const BookIntervalCardsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  clusterKey,
  items = [],
  books = [],
  chapters = [],
  myClasses = [],
  language,
  onOpenInPersonalSpace,
  onOpenInClassesSpace,
}) => {
  const [activeCluster, setActiveCluster] = useState<BookIntervalClusterKey>(clusterKey || '<75');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'personal' | 'classes'>('all');

  useEffect(() => {
    if (clusterKey) {
      setActiveCluster(clusterKey);
    }
  }, [clusterKey]);

  // Compute live counts for all 6 clusters
  const clusterCounts = useMemo(() => {
    const counts: Record<BookIntervalClusterKey, number> = {
      '<75': 0,
      '<150': 0,
      '<225': 0,
      '<300': 0,
      '<375': 0,
      '>375': 0,
    };
    (items || []).forEach(item => {
      if (item && item.isActive) {
        const k = getBookItemClusterKey(item);
        counts[k] = (counts[k] || 0) + 1;
      }
    });
    return counts;
  }, [items]);

  const activeClusterConfig = useMemo(() => {
    return BOOK_CLUSTERS.find(c => c.key === activeCluster) || BOOK_CLUSTERS[0];
  }, [activeCluster]);

  const filteredCards = useMemo(() => {
    const activeItems = (items || []).filter(item => {
      if (!item || !item.isActive) return false;
      if (getBookItemClusterKey(item) !== activeCluster) return false;

      const book = (books || []).find(b => b.id === item.bookId);
      const isClassBook = !!book?.classId;
      if (sourceFilter === 'personal' && isClassBook) return false;
      if (sourceFilter === 'classes' && !isClassBook) return false;

      return true;
    });

    if (!searchQuery.trim()) return activeItems;
    const q = searchQuery.toLowerCase().trim();
    return activeItems.filter(item => {
      const question = item.question?.toLowerCase() || '';
      const answer = item.answer?.toLowerCase() || '';
      const book = (books || []).find(b => b.id === item.bookId);
      const chapter = (chapters || []).find(c => c.id === item.chapterId);
      const bookTitle = book?.title?.toLowerCase() || '';
      const chapterTitle = chapter?.title?.toLowerCase() || '';
      return question.includes(q) || answer.includes(q) || bookTitle.includes(q) || chapterTitle.includes(q);
    });
  }, [items, activeCluster, searchQuery, books, chapters, sourceFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="clay-card rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-black/[0.04] dark:border-white/[0.06] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-black/[0.04] dark:border-white/[0.05] flex items-center justify-between gap-4 bg-[#FAFBFC]/80 dark:bg-[#141C2B]/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl clay-icon-pod-orange flex items-center justify-center shrink-0 shadow-sm">
              <Library className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-[#18234A] dark:text-[#F8FAFC] tracking-tight">
                  {language === 'en' ? 'Book Retention Clusters' : 'Klaster Retensi Kartu Kitab'}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${activeClusterConfig.badge} shadow-2xs`}>
                  {language === 'en' ? activeClusterConfig.labelEn : activeClusterConfig.labelId}
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium mt-0.5">
                {language === 'en' ? activeClusterConfig.subEn : activeClusterConfig.subId}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-xl clay-pill flex items-center justify-center text-[#18234A] dark:text-[#F8FAFC] hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cluster Tabs Horizontal Selector */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#FAFBFC]/40 dark:bg-[#141C2B]/40 border-b border-black/[0.03] dark:border-white/[0.04] flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
          {BOOK_CLUSTERS.map(c => {
            const isSelected = activeCluster === c.key;
            const count = clusterCounts[c.key] || 0;
            return (
              <button
                key={c.key}
                onClick={() => setActiveCluster(c.key)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? `${c.badge} shadow-2xs scale-102`
                    : 'clay-pill text-[#64748B] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-[#F8FAFC]'
                }`}
              >
                <span>{language === 'en' ? c.labelEn : c.labelId}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${isSelected ? 'bg-white/25 text-white' : 'bg-black/5 dark:bg-white/10'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Source Filter Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-black/[0.03] dark:border-white/[0.04] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FAFBFC]/60 dark:bg-[#141C2B]/60 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={language === 'en' ? 'Search question, answer, kitab, chapter...' : 'Cari pertanyaan, jawaban, kitab, bab...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-2xl clay-inset text-xs sm:text-sm text-[#18234A] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#FF6F3D]/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#18234A] dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
            {(['all', 'personal', 'classes'] as const).map(src => (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  sourceFilter === src
                    ? 'clay-badge-orange text-white shadow-2xs'
                    : 'clay-pill text-[#64748B] dark:text-[#94A3B8]'
                }`}
              >
                {src === 'all'
                  ? (language === 'en' ? 'All' : 'Semua')
                  : src === 'personal'
                  ? (language === 'en' ? 'Personal' : 'Kitab Mandiri')
                  : (language === 'en' ? 'Classes' : 'Halaqah')}
              </button>
            ))}
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredCards.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Sparkles className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" />
              <h4 className="font-extrabold text-[#18234A] dark:text-[#F8FAFC] text-sm">
                {language === 'en' ? 'No cards in this cluster' : 'Belum ada kartu di klaster ini'}
              </h4>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium mt-1">
                {language === 'en' ? 'Keep reviewing your flashcards to advance their retention stage.' : 'Terus murajaah kartu Anda untuk menaikkan interval retensinya.'}
              </p>
            </div>
          ) : (
            filteredCards.map(item => {
              const book = (books || []).find(b => b.id === item.bookId);
              const chapter = (chapters || []).find(c => c.id === item.chapterId);
              const interval = getNonQuranIntervalDays(item.fsrsData);

              return (
                <div
                  key={item.id}
                  className="clay-card-subtle p-4 rounded-2xl border border-black/[0.03] dark:border-white/[0.04] space-y-2.5 transition-all hover:scale-[1.005]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-lg clay-pill text-[10px] font-black text-[#FF6F3D]">
                        {book?.title || 'Kitab'}
                      </span>
                      {chapter && (
                        <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">
                          • {chapter.title}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-black text-[#18234A] dark:text-[#F8FAFC]">
                      <Clock className="w-3.5 h-3.5 text-[#FF6F3D]" />
                      <span>{interval} {language === 'en' ? 'days interval' : 'hari interval'}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="text-xs sm:text-sm font-bold text-[#18234A] dark:text-[#F8FAFC] leading-relaxed">
                      <BilingualCardText text={item.question} type="question" />
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-[#64748B] dark:text-[#94A3B8] leading-relaxed pt-1 border-t border-black/[0.03] dark:border-white/[0.04]">
                      <BilingualCardText text={item.answer} type="answer" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-black/[0.04] dark:border-white/[0.05] bg-[#FAFBFC]/80 dark:bg-[#141C2B]/80 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8]">
            {filteredCards.length} {language === 'en' ? 'cards found' : 'kartu ditemukan'}
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl clay-pill text-[#18234A] dark:text-[#F8FAFC] text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            {language === 'en' ? 'Close' : 'Tutup'}
          </button>
        </div>
      </div>
    </div>
  );
};
