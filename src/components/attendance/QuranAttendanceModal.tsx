import React, { useState, useMemo } from 'react';
import { Language } from '../../types';
import { CalendarDays, CheckCircle2, XCircle, AlertCircle, X, Check, Undo2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const QuranAttendanceModal: React.FC<Props> = ({ isOpen, onClose, language }) => {
  const { quranPages, attendanceExceptions, markAttendanceException } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'absent' | 'excused'>('overview');

  const stats = useMemo(() => {
    let firstActivationTime = Infinity;
    const activeDates = new Set<string>();

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center border bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/50 text-purple-600 dark:text-purple-400">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {language === 'en' ? 'Attendance History' : 'Riwayat Kehadiran'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {language === 'en' ? `Tracked since Day 1 (${stats.totalDays} days recorded)` : `Terdata sejak hari pertama aktivasi (${stats.totalDays} hari)`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Interactive Cards */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
          <div className="grid grid-cols-3 gap-2.5">
            {/* Hadir */}
            <div 
              onClick={() => setActiveTab('overview')}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                  : 'border-emerald-200/60 dark:border-emerald-900/40 bg-white dark:bg-slate-850 hover:bg-emerald-50/40'
              }`}
            >
              <div className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase mb-1">
                <CheckCircle2 className="w-3 h-3" /> {language === 'en' ? 'Present' : 'Hadir'}
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.present}</div>
              <span className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70 font-semibold mt-0.5">
                {language === 'en' ? 'Auto-recorded' : 'Otomatis'}
              </span>
            </div>

            {/* Alpa */}
            <div 
              onClick={() => setActiveTab('absent')}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                activeTab === 'absent'
                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 ring-2 ring-rose-500/20'
                  : 'border-rose-200/60 dark:border-rose-900/40 bg-white dark:bg-slate-850 hover:bg-rose-50/40'
              }`}
            >
              <div className="flex items-center gap-1 text-[10px] text-rose-700 dark:text-rose-400 font-bold uppercase mb-1">
                <XCircle className="w-3 h-3" /> {language === 'en' ? 'Absent' : 'Alpa'}
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.absent}</div>
              <span className="text-[9px] text-rose-600/80 dark:text-rose-400/80 font-bold mt-0.5">
                {stats.absent > 0 ? (language === 'en' ? 'Click to resolve' : 'Klik konfirmasi') : (language === 'en' ? 'Zero' : 'Nihil')}
              </span>
            </div>

            {/* Berhalangan */}
            <div 
              onClick={() => setActiveTab('excused')}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                activeTab === 'excused'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 ring-2 ring-amber-500/20'
                  : 'border-amber-200/60 dark:border-amber-900/40 bg-white dark:bg-slate-850 hover:bg-amber-50/40'
              }`}
            >
              <div className="flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase mb-1">
                <AlertCircle className="w-3 h-3" /> {language === 'en' ? 'Excused' : 'Berhalangan'}
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.excused}</div>
              <span className="text-[9px] text-amber-600/80 dark:text-amber-400/80 font-bold mt-0.5">
                {stats.excused > 0 ? (language === 'en' ? 'View list' : 'Lihat daftar') : (language === 'en' ? 'Zero' : 'Nihil')}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {activeTab === 'overview' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <p className="font-bold text-slate-800 dark:text-white mb-1">
                  {language === 'en' ? 'Attendance Tracking Mechanism' : 'Mekanisme Pencatatan Kehadiran'}
                </p>
                <p>
                  {language === 'en' 
                    ? 'Attendance is automatically recorded whenever new pages are activated or scheduled reviews are marked. If a day had pending reviews or active learning but no action was recorded, it is initially flagged as Absent.' 
                    : 'Kehadiran otomatis tercatat ketika ada penambahan ziyadah atau penyelesaian murajaah. Hari yang tidak ada pengerjaan awalnya tercatat sebagai Alpa, namun dapat Anda konfirmasi sebagai Berhalangan (Izin/Sakit) kapan saja.'}
                </p>
              </div>

              {stats.absent > 0 && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>
                      {language === 'en' 
                        ? `${stats.absent} days need excuse confirmation.` 
                        : `Ada ${stats.absent} hari alpa yang dapat dikonfirmasi.`}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('absent')}
                    className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-2xs"
                  >
                    {language === 'en' ? 'Resolve' : 'Konfirmasi'}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'absent' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-bold uppercase text-slate-500">
                  {language === 'en' ? 'Unexcused Absences' : 'Daftar Alpa (Belum Ada Keterangan)'}
                </h4>
                <span className="text-xs text-slate-400">
                  {stats.absentDays.length} {language === 'en' ? 'days' : 'hari'}
                </span>
              </div>

              {stats.absentDays.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Check className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {language === 'en' ? 'Alhamdulillah! No unexcused absences.' : 'Alhamdulillah! Tidak ada alpa tanpa keterangan.'}
                  </p>
                </div>
              ) : (
                stats.absentDays.map(item => (
                  <div 
                    key={item.date} 
                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-2xs"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {formatDate(item.date)}
                      </div>
                      <div className="text-[10px] text-rose-500 font-semibold">
                        {language === 'en' ? 'Alpa (No task activity)' : 'Alpa (Tidak ada pengerjaan)'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => markAttendanceException(item.date, 'sakit')}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-transform active:scale-95 shadow-2xs cursor-pointer"
                        title="Tandai sebagai Sakit"
                      >
                        {language === 'en' ? 'Sick' : 'Sakit'}
                      </button>
                      <button
                        type="button"
                        onClick={() => markAttendanceException(item.date, 'izin')}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-transform active:scale-95 shadow-2xs cursor-pointer"
                        title="Tandai sebagai Izin"
                      >
                        {language === 'en' ? 'Permit' : 'Izin'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'excused' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-bold uppercase text-slate-500">
                  {language === 'en' ? 'Excused Records' : 'Riwayat Berhalangan'}
                </h4>
                <span className="text-xs text-slate-400">
                  {stats.excusedDays.length} {language === 'en' ? 'records' : 'hari'}
                </span>
              </div>

              {stats.excusedDays.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <p className="text-sm font-semibold text-slate-500">
                    {language === 'en' ? 'No excused records registered.' : 'Belum ada data izin atau sakit.'}
                  </p>
                </div>
              ) : (
                stats.excusedDays.map(item => (
                  <div 
                    key={item.date} 
                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-2xs"
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
                      type="button"
                      onClick={() => markAttendanceException(item.date, null)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      title={language === 'en' ? 'Revert back to Absent' : 'Batalkan status ini (Kembalikan ke Alpa)'}
                    >
                      <Undo2 className="w-3 h-3" />
                      <span>{language === 'en' ? 'Revert' : 'Batalkan'}</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            {language === 'en' ? 'Close' : 'Tutup'}
          </button>
        </div>
      </div>
    </div>
  );
};
