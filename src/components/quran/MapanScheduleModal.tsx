import React, { useState } from "react";
import { QuranPageItem, MapanScheduleConfig } from "../../types";
import { useApp } from "../../context/AppContext";
import {
  X,
  Calendar,
  Clock,
  Check,
  CalendarDays,
  Zap,
  RotateCcw,
  CheckCircle2,
  CalendarCheck2,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  page: QuranPageItem | null;
  onSave?: (config: MapanScheduleConfig, applyToAll: boolean) => void;
}

const WEEK_DAYS = [
  { id: 0, labelId: "Ahad", labelEn: "Sunday" },
  { id: 1, labelId: "Senin", labelEn: "Monday" },
  { id: 2, labelId: "Selasa", labelEn: "Tuesday" },
  { id: 3, labelId: "Rabu", labelEn: "Wednesday" },
  { id: 4, labelId: "Kamis", labelEn: "Thursday" },
  { id: 5, labelId: "Jum'at", labelEn: "Friday" },
  { id: 6, labelId: "Sabtu", labelEn: "Saturday" },
];

export const MapanScheduleModal: React.FC<Props> = ({
  isOpen,
  onClose,
  page,
  onSave,
}) => {
  const { language, updateQuranMapanSchedule, setGlobalMapanSchedule } =
    useApp();

  const currentConfig: MapanScheduleConfig = page?.mapanSchedule || {
    mode: "fsrs",
  };

  const [mode, setMode] = useState<"fsrs" | "weekly" | "monthly">(
    currentConfig.mode || "fsrs",
  );
  const [weeklyDay, setWeeklyDay] = useState<number>(
    typeof currentConfig.weeklyDay === "number" ? currentConfig.weeklyDay : 5, // Default Jum'at
  );
  const [monthlyDate, setMonthlyDate] = useState<number>(
    typeof currentConfig.monthlyDate === "number"
      ? currentConfig.monthlyDate
      : 1, // Default tgl 1
  );
  const [applyToAll, setApplyToAll] = useState(false);

  // Sync state if page changes
  React.useEffect(() => {
    if (page?.mapanSchedule) {
      setMode(page.mapanSchedule.mode || "fsrs");
      if (typeof page.mapanSchedule.weeklyDay === "number")
        setWeeklyDay(page.mapanSchedule.weeklyDay);
      if (typeof page.mapanSchedule.monthlyDate === "number")
        setMonthlyDate(page.mapanSchedule.monthlyDate);
    } else {
      setMode("fsrs");
    }
    setApplyToAll(false);
  }, [page]);

  if (!isOpen || !page) return null;

  const handleSave = () => {
    const newConfig: MapanScheduleConfig = {
      mode,
      weeklyDay: mode === "weekly" ? weeklyDay : undefined,
      monthlyDate: mode === "monthly" ? monthlyDate : undefined,
    };

    if (applyToAll) {
      setGlobalMapanSchedule(newConfig);
    } else {
      updateQuranMapanSchedule(page.pageNumber, newConfig);
    }

    if (onSave) {
      onSave(newConfig, applyToAll);
    }

    onClose();
  };

  return (
    <div
      data-no-swipe="true"
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
    >
      <div className="neumorph-card w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white flex items-center justify-center font-bold shadow-xs">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#18234A] dark:text-[#F8FAFC] flex items-center gap-2">
                {language === "en"
                  ? "Mastered Murajaah Rhythm"
                  : "Atur Ritme Murajaah Mapan"}
              </h3>
              <p className="text-xs text-[#5E6D88] dark:text-[#94A3B8] font-medium">
                {language === "en"
                  ? `Page ${page.pageNumber} • ${page.surahNameEn} (Juz ${page.juzNumber})`
                  : `Halaman ${page.pageNumber} • ${page.surahNameEn} (Juz ${page.juzNumber})`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl neumorph-card text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-[#F8FAFC] flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          <p className="text-xs text-[#5E6D88] dark:text-[#94A3B8] font-medium leading-relaxed">
            {language === "en"
              ? "This page has reached Mastered status (>30 days interval). You can continue with the app-managed adaptive schedule, or choose a custom weekly or monthly rhythm below:"
              : "Halaman ini telah mencapai status Mapan (rotasi > 30 hari). Anda bisa tetap melanjutkan ritme murajaah sesuai dengan penjadwalan yang ditentukan oleh aplikasi, atau Anda bisa memilih ritme mingguan maupun ritme bulanan:"}
          </p>

          {/* Option 1: App Adaptive (Default) */}
          <div
            onClick={() => setMode("fsrs")}
            className={`p-4 rounded-2xl transition-all cursor-pointer flex flex-col gap-2 ${
              mode === "fsrs"
                ? "neumorph-card ring-2 ring-[#FF6F3D] shadow-sm"
                : "neumorph-card opacity-85 hover:opacity-100 hover:scale-[1.01]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${mode === "fsrs" ? "bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white" : "neumorph-inset text-[#5E6D88]"}`}
                >
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#18234A] dark:text-[#F8FAFC]">
                    {language === "en"
                      ? "App Adaptive Schedule (Default)"
                      : "Penjadwalan Otomatis Aplikasi (Bawaan)"}
                  </h4>
                  <span className="text-[11px] font-bold text-[#FF6F3D]">
                    {language === "en"
                      ? "Intelligent & continuous interval growth"
                      : "Interval terus bertumbuh otomatis"}
                  </span>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${mode === "fsrs" ? "bg-[#FF6F3D] text-white shadow-2xs" : "neumorph-inset"}`}
              >
                {mode === "fsrs" && (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                )}
              </div>
            </div>
            <p className="text-xs text-[#5E6D88] dark:text-[#94A3B8] font-medium pl-10">
              {language === "en"
                ? "Review intervals dynamically expand according to memory stability. If you ever falter, the system automatically schedules it earlier."
                : "Jadwal pengulangan diatur secara adaptif oleh sistem. Jika hafalan kelak terasa goyah saat diulang, sistem otomatis menjadwalkan murajaah lebih awal."}
            </p>
          </div>

          {/* Option 2: Weekly Fixed Day */}
          <div
            onClick={() => setMode("weekly")}
            className={`p-4 rounded-2xl transition-all cursor-pointer flex flex-col gap-2 ${
              mode === "weekly"
                ? "neumorph-card ring-2 ring-[#10B981] shadow-sm"
                : "neumorph-card opacity-85 hover:opacity-100 hover:scale-[1.01]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${mode === "weekly" ? "bg-gradient-to-br from-[#10B981] to-[#059669] text-white" : "neumorph-inset text-[#5E6D88]"}`}
                >
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#18234A] dark:text-[#F8FAFC]">
                    {language === "en"
                      ? "Fixed Weekly Rhythm"
                      : "Ritme Mingguan (Pilih Hari)"}
                  </h4>
                  <span className="text-[11px] font-bold text-[#10B981]">
                    {language === "en"
                      ? "Repeat on a specific day each week"
                      : "Dimurajaah pada hari tertentu setiap pekan"}
                  </span>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${mode === "weekly" ? "bg-[#10B981] text-white shadow-2xs" : "neumorph-inset"}`}
              >
                {mode === "weekly" && (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                )}
              </div>
            </div>

            {mode === "weekly" && (
              <div className="mt-2 pl-10 space-y-2">
                <span className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] block">
                  {language === "en"
                    ? "Select Day of the Week:"
                    : "Pilih Hari Murajaah:"}
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {WEEK_DAYS.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWeeklyDay(day.id);
                      }}
                      className={`py-1.5 px-2 rounded-xl text-xs font-black transition-all text-center cursor-pointer ${
                        weeklyDay === day.id
                          ? "bg-gradient-to-br from-[#10B981] to-[#059669] text-white shadow-2xs"
                          : "neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:scale-105 active:scale-95"
                      }`}
                    >
                      {language === "en"
                        ? day.labelEn.slice(0, 3)
                        : day.labelId}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[#10B981] font-bold">
                  {language === "en"
                    ? `Item will appear for review every ${WEEK_DAYS.find((d) => d.id === weeklyDay)?.labelEn}.`
                    : `Halaman ini akan dijadwalkan setiap hari ${WEEK_DAYS.find((d) => d.id === weeklyDay)?.labelId}.`}
                </p>
              </div>
            )}
          </div>

          {/* Option 3: Monthly Fixed Date */}
          <div
            onClick={() => setMode("monthly")}
            className={`p-4 rounded-2xl transition-all cursor-pointer flex flex-col gap-2 ${
              mode === "monthly"
                ? "neumorph-card ring-2 ring-[#FF6F3D] shadow-sm"
                : "neumorph-card opacity-85 hover:opacity-100 hover:scale-[1.01]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${mode === "monthly" ? "bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white" : "neumorph-inset text-[#5E6D88]"}`}
                >
                  <CalendarCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#18234A] dark:text-[#F8FAFC]">
                    {language === "en"
                      ? "Fixed Monthly Date"
                      : "Ritme Bulanan (Pilih Tanggal 1–31)"}
                  </h4>
                  <span className="text-[11px] font-bold text-[#FF6F3D]">
                    {language === "en"
                      ? "Repeat on a specific date every month"
                      : "Dimurajaah setiap tanggal tertentu tiap bulan"}
                  </span>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${mode === "monthly" ? "bg-[#FF6F3D] text-white shadow-2xs" : "neumorph-inset"}`}
              >
                {mode === "monthly" && (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                )}
              </div>
            </div>

            {mode === "monthly" && (
              <div className="mt-2 pl-10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC]">
                    {language === "en"
                      ? "Select Date (1 - 31):"
                      : "Pilih Tanggal (1 - 31):"}
                  </span>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#FF6F3D] text-white shadow-2xs">
                    {language === "en"
                      ? `Day ${monthlyDate}`
                      : `Tanggal ${monthlyDate}`}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="31"
                  value={monthlyDate}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setMonthlyDate(parseInt(e.target.value))}
                  className="w-full accent-[#FF6F3D] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#5E6D88] dark:text-[#94A3B8] font-bold">
                  <span>Tgl 1</span>
                  <span>Tgl 10</span>
                  <span>Tgl 20</span>
                  <span>Tgl 31</span>
                </div>
                <p className="text-[11px] text-[#FF6F3D] font-bold">
                  {language === "en"
                    ? `Item will appear for review on the ${monthlyDate}th of each month.`
                    : `Halaman ini akan dijadwalkan setiap tanggal ${monthlyDate} di setiap bulannya.`}
                </p>
              </div>
            )}
          </div>

          {/* Apply to all mastered pages checkbox */}
          <label className="flex items-start gap-3 p-3.5 rounded-2xl neumorph-inset cursor-pointer">
            <input
              type="checkbox"
              checked={applyToAll}
              onChange={(e) => setApplyToAll(e.target.checked)}
              className="mt-0.5 rounded text-[#FF6F3D] focus:ring-[#FF6F3D] cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-black text-[#18234A] dark:text-[#F8FAFC] block">
                {language === "en"
                  ? "Apply this rhythm to all current Mastered pages"
                  : "Terapkan ritme ini ke seluruh halaman yang sudah berstatus Mapan"}
              </span>
              <span className="text-[#5E6D88] dark:text-[#94A3B8] text-[11px] font-medium">
                {language === "en"
                  ? "Convenient for harmonizing your monthly/weekly murajaah khatam schedule."
                  : "Sangat praktis untuk menyelaraskan jadwal murajaah khatam sebulan atau sepekan."}
              </span>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-black/[0.04] dark:border-white/[0.04] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl neumorph-card text-xs font-bold text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-[#F8FAFC] cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            {language === "en" ? "Cancel" : "Batal"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-2xl text-xs font-black text-white bg-gradient-to-br from-[#FF7E4A] to-[#E65320] shadow-[0_4px_12px_rgba(255,111,61,0.35)] hover:scale-105 transition-all active:scale-95 cursor-pointer"
          >
            {language === "en" ? "Save Schedule" : "Simpan Ritme"}
          </button>
        </div>
      </div>
    </div>
  );
};
