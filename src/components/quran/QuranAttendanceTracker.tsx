import React, { useState, useMemo } from 'react';
import { QuranPageItem, Language } from '../../types';
import { CalendarDays, CheckCircle2, XCircle, AlertCircle, X, Check, ChevronRight, Undo2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface Props {
  quranPages: QuranPageItem[];
  language: Language;
}

export const QuranAttendanceTracker: React.FC<Props> = ({ quranPages, language }) => {
  const { attendanceExceptions, markAttendanceException } = useApp();

  const [isAbsentModalOpen, setIsAbsentModalOpen] = useState(false);
  const [isExcusedModalOpen, setIsExcusedModalOpen] = useState(false);

  const stats = useMemo(() => {
    // 1. Find the very first activation date (Day 1)
    let firstActivationTime = Infinity;
    const activeDates = new Set<string>(); // YYYY-MM-DD format

    (quranPages || []).forEach(p => {
      if (p && p.activatedAt) {
        const t = new Date(p.activatedAt).getTime();
        if (t < firstActivationTime) firstActivationTime = t;
        activeDates.add(new Date(p.activatedAt).toISOString().split('T')[0]);
      }
      if (p && Array.isArray(p.reviewLogs)) {
        p.reviewLogs.forEach(log => {
          if (log && log.date) {
            activeDates.add(new Date(log.date).toISOString().split('T')[0]);
          }
        });
      }
    });

    if (firstActivationTime === Infinity) {
      return { totalDays: 0, present: 0, absent: 0, excused: 0, absentDays: [], excusedDays: [] };
    }

    const startDate = new Date(firstActivationTime);
    startDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let present = 0;
    let absent = 0;
    let excused = 0;
    const absentDays: { date: string; isToday: boolean }[] = [];
    const excusedDays: { date: string; status: 'izin' | 'sakit'; isToday: boolean }[] = [];

    // Iterate from Start Date to Today
    const current = new Date(startDate);
    while (current <= today) {
      const dateStr = current.toISOString().split('T')[0];
      const isToday = current.getTime() === today.getTime();

      if (activeDates.has(dateStr)) {
        present++;
      } else {
        const exception = attendanceExceptions?.[dateStr];
        if (exception === 'izin' || exception === 'sakit') {
          excused++;
          excusedDays.push({ date: dateStr, status: exception, isToday });
        } else {
          absent++;
          absentDays.push({ date: dateStr, isToday });
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return { 
      totalDays: present + absent + excused, 
      present, 
      absent, 
      excused, 
      absentDays: absentDays.reverse(), 
      excusedDays: excusedDays.reverse() 
    };
  }, [quranPages, attendanceExceptions]);

  if (stats.totalDays === 0) return null; // No activity yet

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm mb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              {language === 'en' ? 'Attendance History' : 'Riwayat Kehadiran'}
            </h3>
          </div>
          <div className="text-[10px] text-slate-500 font-bold">
            {language === 'en' ? `Since Day 1 (${stats.totalDays} days)` : `Sejak Hari Pertama (${stats.totalDays} hari)`}
          </div>
        </div>

        {/* 3 Interactive Metric Cards */}
        <div className="grid grid-cols-3 gap-2">
          {/* 1. Hadir (Auto) */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/20 rounded-xl p-2.5 flex flex-col items-center justify-center border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center gap-1 text-[9px] text-emerald-700 dark:text-emerald-400 font-bold uppercase mb-1">
              <CheckCircle2 className="w-3 h-3" /> {language === 'en' ? 'Present' : 'Hadir'}
            </div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{stats.present}</div>
            <span className="text-[8px] text-emerald-600/70 dark:text-emerald-400/60 font-semibold mt-0.5">
              {language === 'en' ? 'Auto-detected' : 'Otomatis'}
            </span>
          </div>

          {/* 2. Absent (Clickable to confirm excuse) */}
          <button
            onClick={() => stats.absent > 0 && setIsAbsentModalOpen(true)}
            disabled={stats.absent === 0}
            className={`bg-rose-50/70 dark:bg-rose-950/20 rounded-xl p-2.5 flex flex-col items-center justify-center border border-rose-100 dark:border-rose-900/30 text-center transition-all ${
              stats.absent > 0 
                ? 'hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:scale-[1.02] cursor-pointer ring-1 ring-rose-300 dark:ring-rose-800/50 shadow-xs' 
                : 'opacity-80 cursor-default'
            }`}
            title={stats.absent > 0 ? (language === 'en' ? 'Click to confirm excuses' : 'Klik untuk konfirmasi alasan berhalangan') : ''}
          >
            <div className="flex items-center gap-1 text-[9px] text-rose-700 dark:text-rose-400 font-bold uppercase mb-1">
              <XCircle className="w-3 h-3" /> {language === 'en' ? 'Absent' : 'Alpa'}
            </div>
            <div className="text-xl font-black text-rose-600 dark:text-rose-400">{stats.absent}</div>
            <span className="text-[8px] text-rose-600/80 dark:text-rose-400/80 font-bold mt-0.5 flex items-center gap-0.5">
              {stats.absent > 0 
                ? (language === 'en' ? 'Click to resolve' : 'Klik konfirmasi') 
                : (language === 'en' ? 'No unexcused' : 'Nihil')}
              {stats.absent > 0 && <ChevronRight className="w-2.5 h-2.5" />}
            </span>
          </button>

          {/* 3. Berhalangan (Clickable to view/edit) */}
          <button
            onClick={() => stats.excused > 0 && setIsExcusedModalOpen(true)}
            disabled={stats.excused === 0}
            className={`bg-amber-50/70 dark:bg-amber-950/20 rounded-xl p-2.5 flex flex-col items-center justify-center border border-amber-100 dark:border-amber-900/30 text-center transition-all ${
              stats.excused > 0 
                ? 'hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:scale-[1.02] cursor-pointer ring-1 ring-amber-300 dark:ring-amber-800/50 shadow-xs' 
                : 'opacity-80 cursor-default'
            }`}
            title={stats.excused > 0 ? (language === 'en' ? 'Click to view excused history' : 'Klik untuk melihat riwayat berhalangan') : ''}
          >
            <div className="flex items-center gap-1 text-[9px] text-amber-700 dark:text-amber-400 font-bold uppercase mb-1">
              <AlertCircle className="w-3 h-3" /> {language === 'en' ? 'Excused' : 'Berhalangan'}
            </div>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400">{stats.excused}</div>
            <span className="text-[8px] text-amber-600/80 dark:text-amber-400/80 font-bold mt-0.5 flex items-center gap-0.5">
              {stats.excused > 0 
                ? (language === 'en' ? 'View details' : 'Lihat rincian') 
                : (language === 'en' ? 'None' : 'Nihil')}
              {stats.excused > 0 && <ChevronRight className="w-2.5 h-2.5" />}
            </span>
          </button>
        </div>
      </div>

      {/* Modal 1: Konfirmasi Alpa -> Berhalangan */}
      {isAbsentModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {language === 'en' ? 'Confirm Absence / Excuses' : 'Konfirmasi Alasan Berhalangan'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'en' 
                      ? `${stats.absent} unconfirmed absent days` 
                      : `${stats.absent} hari belum terisi konfirmasi`}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAbsentModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2.5 max-h-[60vh]">
              {stats.absentDays.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Check className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  <p className="text-sm font-bold">{language === 'en' ? 'All clear! No unexcused absences.' : 'Semua alpa telah dikonfirmasi!'}</p>
                </div>
              ) : (
                stats.absentDays.map(item => (
                  <div 
                    key={item.date} 
                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {formatDate(item.date)}
                      </div>
                      <div className="text-[10px] text-rose-500 font-semibold">
                        {language === 'en' ? 'Unexcused Absent' : 'Alpa (Tanpa Keterangan)'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          markAttendanceException(item.date, 'sakit');
                          if (stats.absentDays.length <= 1) {
                            setIsAbsentModalOpen(false);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-transform active:scale-95 shadow-2xs"
                      >
                        {language === 'en' ? 'Sick' : 'Sakit'}
                      </button>
                      <button
                        onClick={() => {
                          markAttendanceException(item.date, 'izin');
                          if (stats.absentDays.length <= 1) {
                            setIsAbsentModalOpen(false);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-transform active:scale-95 shadow-2xs"
                      >
                        {language === 'en' ? 'Permit' : 'Izin'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
              <button
                onClick={() => setIsAbsentModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {language === 'en' ? 'Close' : 'Tutup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Daftar Berhalangan & Batalkan jika salah */}
      {isExcusedModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {language === 'en' ? 'Excused Attendance List' : 'Riwayat Berhalangan / Izin'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'en' 
                      ? `${stats.excused} excused records` 
                      : `${stats.excused} hari terdata izin/sakit`}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsExcusedModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2.5 max-h-[60vh]">
              {stats.excusedDays.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  {language === 'en' ? 'No excused records.' : 'Belum ada data berhalangan.'}
                </div>
              ) : (
                stats.excusedDays.map(item => (
                  <div 
                    key={item.date} 
                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {formatDate(item.date)}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                          item.status === 'sakit' 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                        }`}>
                          {item.status === 'sakit' ? (language === 'en' ? 'Sick' : 'Sakit') : (language === 'en' ? 'Permit' : 'Izin')}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        markAttendanceException(item.date, null);
                        if (stats.excusedDays.length <= 1) {
                          setIsExcusedModalOpen(false);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1 transition-colors"
                      title={language === 'en' ? 'Revert back to Absent' : 'Batalkan status ini (Kembalikan ke Alpa)'}
                    >
                      <Undo2 className="w-3 h-3" />
                      <span>{language === 'en' ? 'Revert' : 'Batalkan'}</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
              <button
                onClick={() => setIsExcusedModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {language === 'en' ? 'Close' : 'Tutup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
