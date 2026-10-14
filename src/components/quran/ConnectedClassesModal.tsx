import React, { useState } from 'react';
import { X, Users, LogOut, Search, Info, AlertTriangle, BookOpen, BookMarked, ArrowRight } from 'lucide-react';
import { ClassGroup } from '../../types';
import { useApp } from '../../context/AppContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'id' | 'ar';
  connectedClasses: ClassGroup[];
  onLeaveClass: (classId: string) => void;
}

export const ConnectedClassesModal: React.FC<Props> = ({ isOpen, onClose, language, connectedClasses, onLeaveClass }) => {
  const { setActiveSpace, setSelectedPersonalBookId, books } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmingLeaveId, setConfirmingLeaveId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredClasses = connectedClasses.filter(c => 
    (c.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
    (c.teacherName || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  return (
    <div 
      data-no-swipe="true"
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
    >
      <div className="neumorph-card w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white flex items-center justify-center shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-[#18234A] dark:text-[#F8FAFC] text-base">
                {language === 'en' ? 'Connected Classes' : 'Kelas Terhubung'}
              </h3>
              <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] font-medium">
                {language === 'en' 
                  ? `${connectedClasses.length} class(es) currently tracking your progress` 
                  : `${connectedClasses.length} kelas memantau progres Anda`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl neumorph-card text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-[#F8FAFC] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 border-b border-black/[0.04] dark:border-white/[0.04] shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#FF6F3D]" />
            <input
              type="text"
              placeholder={language === 'en' ? "Search classes or teachers..." : "Cari kelas atau pengajar..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full neumorph-inset rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#18234A] dark:text-[#F8FAFC] placeholder:text-[#8493AB] focus:outline-none"
            />
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {filteredClasses.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-14 h-14 rounded-2xl neumorph-inset flex items-center justify-center mx-auto mb-3 text-[#FF6F3D]">
                <Info className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#18234A] dark:text-[#F8FAFC]">
                {searchTerm 
                  ? (language === 'en' ? 'No classes match your search.' : 'Tidak ada kelas yang cocok.')
                  : (language === 'en' ? 'You are not connected to any classes.' : 'Anda belum terhubung ke kelas manapun.')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClasses.map(cls => (
                <div key={cls.id} className="neumorph-card rounded-2xl p-4 flex flex-col gap-3 shadow-xs">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FF6F3D]/10 text-[#FF6F3D] border border-[#FF6F3D]/20">
                          {cls.type === 'quran' ? 'Al-Qur\'an' : 'Materi Umum'}
                        </span>
                        <span className="text-[10px] text-[#5E6D88] dark:text-[#94A3B8] font-mono font-bold">{cls.code}</span>
                      </div>
                      <h4 className="font-extrabold text-[#18234A] dark:text-[#F8FAFC] text-sm truncate">{cls.name}</h4>
                      <p className="text-xs text-[#5E6D88] dark:text-[#94A3B8] truncate mt-0.5 font-medium">
                        {language === 'en' ? 'Teacher:' : 'Pengajar:'} <span className="font-bold text-[#18234A] dark:text-[#F8FAFC]">{cls.teacherName}</span>
                      </p>

                      <div className="mt-2.5 flex items-center gap-2">
                        {cls.type === 'quran' ? (
                          <button
                            onClick={() => {
                              setActiveSpace('quran');
                              onClose();
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white text-xs font-bold shadow-xs hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Buka Mushaf Al-Qur'an</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const found = books.find(b => b.classId === cls.id || b.id.startsWith(`class-book-${cls.id}-`) || (cls.assignedBookIds && cls.assignedBookIds.includes(b.id)));
                              if (found) {
                                setSelectedPersonalBookId(found.id);
                              }
                              setActiveSpace('personal');
                              onClose();
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs font-bold shadow-xs hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                          >
                            <BookMarked className="w-3.5 h-3.5" />
                            <span>Buka Materi Kitab Kelas</span>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {confirmingLeaveId !== cls.id && (
                      <button
                        onClick={() => setConfirmingLeaveId(cls.id)}
                        className="shrink-0 p-2 text-rose-500 hover:scale-105 active:scale-95 rounded-xl neumorph-card transition-all flex flex-col items-center gap-1 cursor-pointer self-start"
                        title={language === 'en' ? 'Leave Class' : 'Keluar Kelas'}
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-wider">{language === 'en' ? 'Leave' : 'Keluar'}</span>
                      </button>
                    )}
                  </div>
                  
                  {confirmingLeaveId === cls.id && (
                    <div className="pt-3 border-t border-rose-200 dark:border-rose-900/50 mt-1 animate-in slide-in-from-top-2">
                      <div className="flex items-start gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-rose-600 dark:text-rose-400 font-bold leading-relaxed">
                          {language === 'en' 
                            ? 'Are you sure you want to leave this class? The teacher will no longer be able to track your progress.' 
                            : 'Yakin ingin keluar? Pengajar tidak akan bisa lagi memantau progres hafalan Anda.'}
                        </p>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setConfirmingLeaveId(null)}
                          className="px-3 py-1.5 rounded-xl neumorph-card text-[#5E6D88] dark:text-[#94A3B8] text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        >
                          {language === 'en' ? 'Cancel' : 'Batal'}
                        </button>
                        <button
                          onClick={() => {
                            onLeaveClass(cls.id);
                            setConfirmingLeaveId(null);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-br from-[#EF4444] to-[#DC2626] text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer"
                        >
                          {language === 'en' ? 'Yes, Leave' : 'Ya, Keluar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
