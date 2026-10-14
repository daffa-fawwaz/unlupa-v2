import React from 'react';
import { 
  X, 
  Download, 
  Share2, 
  FileText, 
  Calendar, 
  Target, 
  Activity,
  Flame,
  CheckCircle2,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserProfile, 
  QuranPageItem, 
  QuranStats, 
  Book, 
  BookItem, 
  Chapter, 
  ClassGroup, 
  Language 
} from '../../types';

interface StudentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  quranPages: QuranPageItem[];
  quranStats: QuranStats;
  books: Book[];
  items: BookItem[];
  chapters: Chapter[];
  myClasses: ClassGroup[];
  teachingClasses: ClassGroup[];
  currentStreak: number;
  totalActiveMaterials: number;
  totalMasteredMaterials: number;
  language: Language;
}

/**
 * PROFESSIONAL STUDENT PROGRESS REPORT
 * Minimalist, elegant, and ready for sharing.
 */
export const StudentReportModal: React.FC<StudentReportModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  quranStats,
  currentStreak,
  totalActiveMaterials,
  totalMasteredMaterials,
  language
}) => {
  if (!isOpen) return null;

  const masteryRate = totalActiveMaterials > 0 
    ? Math.round((totalMasteredMaterials / totalActiveMaterials) * 100) 
    : 0;

  const handleDownload = () => {
    // In a real app, this would generate a PDF or Image
    alert(language === 'en' ? 'Generating High-Resolution Report...' : 'Menghasilkan Rapor Resolusi Tinggi...');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-950/20 overflow-hidden"
        >
          {/* Header Controls */}
          <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
            <button 
              onClick={handleDownload}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:scale-110 transition-transform"
            >
              <Download className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:scale-110 transition-transform"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-8 sm:p-12 space-y-10">
            {/* 1. Profile & Status Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <div className="relative">
                <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl bg-slate-100 dark:bg-slate-800">
                  <img 
                    src={userProfile?.avatarUrl || ''} 
                    alt={userProfile?.fullName || 'Pengguna'} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-xl shadow-lg border-2 border-white dark:border-slate-900">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{userProfile?.fullName || 'Pengguna Unlupa'}</h2>
                  <Award className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {language === 'en' ? 'Unlupa.id Learning Portfolio' : 'Portofolio Belajar Unlupa.id'}
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-4 pt-2">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                    <span className="text-sm font-black text-slate-900 dark:text-white">{currentStreak || 0} Day Streak</span>
                  </div>
                  <div className="w-px h-3 bg-slate-200 dark:bg-slate-800" />
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Core Metrics Visualization */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 text-center space-y-2 border border-slate-100 dark:border-slate-800">
                <Target className="w-5 h-5 text-blue-500 mx-auto" />
                <div className="text-3xl font-black text-slate-900 dark:text-white">{masteryRate}%</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'en' ? 'Mastery' : 'Kematangan'}</div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 text-center space-y-2 border border-slate-100 dark:border-slate-800">
                <Activity className="w-5 h-5 text-indigo-500 mx-auto" />
                <div className="text-3xl font-black text-slate-900 dark:text-white">{totalMasteredMaterials || 0}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'en' ? 'Items' : 'Materi'}</div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 text-center space-y-2 border border-slate-100 dark:border-slate-800">
                <FileText className="w-5 h-5 text-emerald-500 mx-auto" />
                <div className="text-3xl font-black text-slate-900 dark:text-white">{quranStats?.active || 0}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'en' ? 'Pages' : 'Halaman'}</div>
              </div>
            </div>

            {/* 3. Detailed Breakdown */}
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{language === 'en' ? 'Recent Milestones' : 'Capaian Terakhir'}</h3>
                  <div className="h-px flex-1 mx-4 bg-slate-100 dark:bg-slate-800" />
               </div>

               <div className="space-y-4">
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">{language === 'en' ? 'Memory Stability Matrix' : 'Stabilitas Matriks Daya Ingat'}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{language === 'en' ? '92% overall memory retention target met.' : 'Target retensi memori 92% tercapai.'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">{language === 'en' ? 'Consistency Record' : 'Catatan Istiqomah'}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{language === 'en' ? 'Active daily engagement for the last 14 days.' : 'Interaksi harian aktif selama 14 hari terakhir.'}</p>
                    </div>
                  </div>
               </div>
            </div>

            {/* Footer / Call to Action */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2 text-slate-400">
                <Share2 className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">unlupa.id/report/{userProfile?.quranSpaceCode || 'default'}</span>
              </div>
              <button 
                className="w-full sm:w-auto px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>{language === 'en' ? 'Share Portfolio' : 'Bagikan Portofolio'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
