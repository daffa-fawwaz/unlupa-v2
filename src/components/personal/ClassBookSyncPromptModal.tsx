import React from 'react';
import { School, CheckCircle2, User, X, Sparkles, BookOpen, Users } from 'lucide-react';
import { Language } from '../../types';

export interface ConnectedClassItem {
  id: string;
  name: string;
  code: string;
  studentCount?: number;
}

interface ClassBookSyncPromptModalProps {
  isOpen: boolean;
  bookTitle: string;
  associatedClasses: ConnectedClassItem[];
  onConfirmSync: () => void; // User chose "Ya"
  onCancelSync: () => void;  // User chose "Tidak"
  language: Language;
}

export const ClassBookSyncPromptModal: React.FC<ClassBookSyncPromptModalProps> = ({
  isOpen,
  bookTitle,
  associatedClasses,
  onConfirmSync,
  onCancelSync,
  language,
}) => {
  if (!isOpen) return null;

  const isEn = language === 'en';

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancelSync();
      }}
    >
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-in"
        role="dialog"
        aria-modal="true"
      >
        {/* Subtle Top Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600" />

        {/* Modal Header */}
        <div className="p-6 pb-4 flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
              <School className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 mb-1">
                <Sparkles className="w-3 h-3" />
                <span>{isEn ? 'Class Book Update' : 'Sinkronisasi Buku Kelas'}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
                {isEn ? 'Apply Changes to Classroom?' : 'Terapkan Perubahan ke Ruang Kelas?'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelSync}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title={isEn ? 'Close' : 'Tutup'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {isEn ? (
              <>
                Book <strong className="text-slate-900 dark:text-white">"{bookTitle}"</strong> has been successfully updated. This book is currently active in your classroom(s):
              </>
            ) : (
              <>
                Perubahan pada buku <strong className="text-slate-900 dark:text-white">"{bookTitle}"</strong> telah berhasil disimpan. Buku ini saat ini terhubung dengan kelas aktif Anda:
              </>
            )}
          </p>

          {/* Connected Classes Pills */}
          <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isEn ? 'Connected Classroom(s):' : 'Ruang Kelas Terhubung:'}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {associatedClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs text-xs font-medium text-slate-800 dark:text-slate-200"
                >
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{cls.name}</span>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {cls.code}
                  </span>
                  {typeof cls.studentCount === 'number' && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <Users className="w-3 h-3" />
                      <span>{cls.studentCount}</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Decision Cards */}
          <div className="space-y-3 pt-1">
            {/* Option YA */}
            <button
              type="button"
              onClick={onConfirmSync}
              className="w-full text-left p-4 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-500 dark:hover:border-emerald-400 transition-all group flex items-start gap-3.5 cursor-pointer shadow-xs"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                    {isEn ? 'Yes, Apply to Classroom' : 'Ya, Terapkan ke Ruang Kelas'}
                  </h4>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                    {isEn ? 'Recommended' : 'Disarankan'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {isEn
                    ? 'Book changes will immediately apply to the classroom. All students opening this book will see the latest version.'
                    : 'Perubahan buku langsung diterapkan ke ruang kelas, sehingga murid yang membuka buku tersebut akan melihat versi terbaru.'}
                </p>
              </div>
            </button>

            {/* Option TIDAK */}
            <button
              type="button"
              onClick={onCancelSync}
              className="w-full text-left p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700 transition-all group flex items-start gap-3.5 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {isEn ? 'No, Keep Only in My Book' : 'Tidak, Hanya Simpan di Buku Saya'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {isEn
                    ? 'Changes are only saved to your personal book. The book in the classroom will remain in its previous version.'
                    : 'Perubahan hanya disimpan pada buku milik pemiliknya. Buku yang ada di ruang kelas tetap menggunakan versi sebelumnya dan tidak ikut berubah.'}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-slate-50 dark:bg-slate-900/70 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancelSync}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {isEn ? 'Cancel / Keep Personal Only' : 'Tidak (Hanya Buku Saya)'}
          </button>
          <button
            type="button"
            onClick={onConfirmSync}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isEn ? 'Yes, Apply to Class' : 'Ya, Terapkan ke Kelas'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
