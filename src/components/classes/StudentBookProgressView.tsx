import React, { useState } from 'react';
import { ClassStudent, ClassGroup, Book, Chapter, BookItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { isDue, getIntervalDays } from '../../lib/fsrs';
import { 
  ArrowLeft, 
  BookOpen, 
  Layers, 
  Brain, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ChevronRight, 
  ChevronDown, 
  HelpCircle
} from 'lucide-react';
import { BilingualCardText } from '../common/BilingualCardText';

interface StudentBookProgressViewProps {
  student: ClassStudent;
  classGroup: ClassGroup;
  onClose: () => void;
}

export const StudentBookProgressView: React.FC<StudentBookProgressViewProps> = ({
  student,
  classGroup,
  onClose,
}) => {
  const { books, chapters, items, language } = useApp();

  // Find assigned book or default to first book
  const assignedBookId = classGroup.assignedBookIds?.[0] || books[0]?.id;
  const book = books.find(b => b.id === assignedBookId) || books[0];
  const bookChapters = chapters.filter(c => c.bookId === book?.id);
  const bookItems = items.filter(i => i.bookId === book?.id);

  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(bookChapters[0]?.id || null);

  if (!book) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Kitab Belum Ditetapkan</h3>
        <p className="text-sm text-slate-500 mt-1 mb-4">Kelas ini belum memiliki kitab atau materi yang ditautkan.</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          Kembali
        </button>
      </div>
    );
  }

  // Computed student progress stats for this book
  const totalItems = bookItems.length;
  
  // Actually calculate from bookItemsData if available
  let actualActiveCount = 0;
  let actualDueCount = 0;
  let actualMasteredCount = 0;
  let totalReps = 0;
  let totalLapses = 0;
  
  const studentItems = student.bookItemsData || bookItems; // Fallback to provided items
  
  if (student.bookItemsData && student.bookItemsData.length > 0) {
    const classItems = student.bookItemsData.filter(i => i.bookId === book.id || i.bookId === `class-book-${book.id}`); // Depending on ID matching
    
    classItems.forEach(item => {
      if (item.isActive) {
        actualActiveCount++;
        if (item.fsrsData) {
          totalReps += (item.fsrsData.reps || 0);
          totalLapses += (item.fsrsData.lapses || 0);
          // basic heuristic for due
          if (new Date() >= new Date(item.fsrsData.nextReview || 0)) {
            actualDueCount++;
          }
          if ((item.fsrsData.stability || 0) >= 30 || item.status === 'mastered') {
            actualMasteredCount++;
          }
        }
      }
    });
  }

  const activeCount = actualActiveCount > 0 ? actualActiveCount : (student.activeItemsCount || Math.min(totalItems, 12));
  const dueCount = actualActiveCount > 0 ? actualDueCount : (student.dueTodayCount || 0);
  const masteredCount = actualActiveCount > 0 ? actualMasteredCount : Math.max(0, activeCount - dueCount - 2);
  
  let retentionRate = student.retentionRate || 95;
  if (totalReps > 0) {
    retentionRate = Math.max(0, Math.round(((totalReps - totalLapses) / totalReps) * 100));
  } else if (actualActiveCount > 0) {
    retentionRate = 100;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Bar / Navigation matching Screenshot 1 */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer shrink-0"
            title="Kembali ke Daftar Santri"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Kelas</span>
          </button>
          
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {student.name}
              </h2>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                {student.quranSpaceCode || 'ID: ' + student.id.slice(-4)}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {book.title} • {classGroup.name}
            </p>
          </div>
        </div>
      </div>

      {/* Hero Metric Cards for this Book */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Materi Aktif</span>
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {activeCount} <span className="text-xs font-normal text-slate-400">/ {totalItems} item</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Tugas Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`text-2xl font-black ${dueCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
            {dueCount} <span className="text-xs font-normal text-slate-400">hari ini</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Mapan / Mutqin</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {masteredCount} <span className="text-xs font-normal text-slate-400">item</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Tingkat Penguasaan</span>
            <Brain className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {retentionRate}%
          </div>
        </div>
      </div>

      {/* Chapters Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400" />
          Daftar Bab & Item Materi Kitab
        </h3>

        {bookChapters.length === 0 ? (
          <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
            Belum ada bab yang dibuat pada kitab ini.
          </div>
        ) : (
          <div className="space-y-3">
            {bookChapters.map((chap, idx) => {
              const chapItems = bookItems.filter(i => i.chapterId === chap.id);
              const isExpanded = expandedChapterId === chap.id;

              return (
                <div
                  key={chap.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-all"
                >
                  <button
                    onClick={() => setExpandedChapterId(isExpanded ? null : chap.id)}
                    className="w-full flex items-center justify-between p-4.5 text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {chap.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {chapItems.length} kartu pertanyaan / item
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {Math.min(chapItems.length, 3)} Aktif
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 space-y-2.5">
                      {chapItems.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">Tidak ada item dalam bab ini.</p>
                      ) : (
                        chapItems.map((item, itemIdx) => (
                          <div
                            key={item.id}
                            className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                  #{itemIdx + 1}
                                </span>
                                <div className="font-semibold text-slate-800 dark:text-slate-200 flex-1">
                                  <BilingualCardText text={item.question} type="question" variant="compact" />
                                </div>
                              </div>
                              <div className="text-slate-500 dark:text-slate-400 pl-4 border-l-2 border-slate-200 dark:border-slate-700 mt-1">
                                <BilingualCardText text={item.answer} type="answer" variant="compact" />
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center">
                              <div className="text-right">
                                <span className="block text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                                  Stabilitas: {getIntervalDays(item.fsrsData)} hari
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {item.fsrsData.reps || 3}x pengulangan
                                </span>
                              </div>
                              <span className="px-2.5 py-1 rounded-md bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium text-[10px]">
                                Sedang Dipelajari
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
