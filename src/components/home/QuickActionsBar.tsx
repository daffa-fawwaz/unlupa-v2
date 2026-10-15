import React from "react";
import { useApp } from "../../context/AppContext";
import {
  Award,
  CalendarDays,
  Share2,
  Download,
  Zap,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  FolderDown,
} from "lucide-react";
import { downloadDatabaseBackup } from "../../lib/offlineStorage";

interface Props {
  onOpenReport: () => void;
  onOpenAchievementModal: () => void;
  onOpenAttendanceModal: () => void;
}

export const QuickActionsBar: React.FC<Props> = ({
  onOpenReport,
  onOpenAchievementModal,
  onOpenAttendanceModal,
}) => {
  const {
    language,
    quranPages,
    books,
    items,
    myClasses,
    teachingClasses,
    userProfile,
  } = useApp();

  const handleBackup = async () => {
    try {
      downloadDatabaseBackup();
    } catch (e) {
      console.error(e);
    }
  };

  const actions = [
    {
      id: "report",
      labelEn: "Progress Report",
      labelId: "Rapor Progres",
      descEn: "Share summary card",
      descId: "Kartu progres belajar",
      podClass: "clay-icon-pod-orange",
      icon: <Share2 className="w-4 h-4 text-white" strokeWidth={2.2} />,
      onClick: onOpenReport,
    },
    {
      id: "cert",
      labelEn: "Certificate Generator",
      labelId: "Cetak Sertifikat",
      descEn: "HD printable certificate",
      descId: "Sertifikat kelulusan",
      podClass: "clay-icon-pod-pacific",
      icon: <Award className="w-4 h-4 text-white" strokeWidth={2.2} />,
      onClick: onOpenAchievementModal,
    },
    {
      id: "attendance",
      labelEn: "Attendance Log",
      labelId: "Riwayat Kehadiran",
      descEn: "Daily presence history",
      descId: "Rekap kehadiran & izin",
      podClass: "clay-icon-pod-emerald",
      icon: <CalendarDays className="w-4 h-4 text-white" strokeWidth={2.2} />,
      onClick: onOpenAttendanceModal,
    },
    {
      id: "backup",
      labelEn: "Backup Database",
      labelId: "Cadangkan Data",
      descEn: "JSON local file export",
      descId: "Ekspor arsip offline",
      podClass: "clay-icon-pod-neutral",
      icon: <FolderDown className="w-4 h-4 text-[#4E89FF]" strokeWidth={2.2} />,
      onClick: handleBackup,
    },
  ];

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-[#1E293B] dark:text-[#F8FAFC] uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-[#FF6E65]" />
          <span>
            {language === "en" ? "Quick Tools" : "Fitur Cepat & Utilitas"}
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className="clay-card p-3.5 rounded-2xl flex flex-col items-start justify-between min-h-[105px] text-left transition-all hover:-translate-y-1 active:scale-[0.98] cursor-pointer group"
          >
            <div
              className={`w-9 h-9 rounded-2xl ${action.podClass} flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm`}
            >
              {action.icon}
            </div>
            <div>
              <p className="font-bold text-xs text-[#1E293B] dark:text-[#F8FAFC] leading-tight">
                {language === "en" ? action.labelEn : action.labelId}
              </p>
              <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate max-w-[130px] font-medium">
                {language === "en" ? action.descEn : action.descId}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
