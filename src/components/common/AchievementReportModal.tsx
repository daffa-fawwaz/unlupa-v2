import React, { useState, useRef } from "react";
import { useApp } from "../../context/AppContext";
import {
  Award,
  FileText,
  Download,
  Share2,
  X,
  Settings2,
  CheckCircle2,
  ShieldCheck,
  Building2,
  UserCircle,
  PenTool,
  Image as ImageIcon,
  Instagram,
  Target,
} from "lucide-react";
import html2canvas from "html2canvas";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AchievementReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
}) => {
  const { quranStats, personalStats, userProfile, language } = useApp();
  const [reportType, setReportType] = useState<
    "certificate" | "report" | "social"
  >("social");
  const [reportSource, setReportSource] = useState<"quran" | "personal">(
    "quran",
  );

  // Customization State
  const [instName, setInstName] = useState("Rumah Tahfizh Unlupa");
  const [instLogo, setInstLogo] = useState("");
  const [teacherName, setTeacherName] = useState("Ust. Ahmad Al-Hafizh");
  const [headName, setHeadName] = useState("K.H. Budi Santoso");

  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const isQuran = reportSource === "quran";
  const primaryStat = isQuran
    ? quranStats?.active || 0
    : personalStats?.activeItems || 0;
  const primaryLabel = isQuran ? "Hafalan Aktif" : "Item Aktif";
  const primaryLabelCert = isQuran ? "Pages Memorized" : "Active Items";
  const primarySuffix = isQuran ? "hal" : "item";
  const primaryDesc = isQuran
    ? "Termasuk hafalan baru & lama"
    : "Materi yang sedang dipelajari";
  const secondaryStat = isQuran
    ? quranStats?.mastered || 0
    : personalStats?.totalItems || 0;
  const secondaryLabel = isQuran ? "Mutqin (>30 Hari)" : "Total Koleksi";
  const secondaryLabelCert = isQuran
    ? "Pages Mastered (Mutqin)"
    : "Items Saved";
  const secondarySuffix = isQuran ? "hal" : "item";
  const secondaryDesc = isQuran
    ? "> 30 Hari Tanpa Lupa"
    : "Semua materi dalam database";

  const reportSubtitle = isQuran
    ? "Laporan Progres Tahfizh Mutqin"
    : "Laporan Progres Kelas Pribadi";
  const certSubtitle = isQuran
    ? "Sertifikat Tahfizh"
    : "Sertifikat Kelas Pribadi";

  const generateImageBlob = async (): Promise<Blob | null> => {
    if (!printRef.current) return null;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: reportType === "social" ? 3 : 2, // High resolution
        useCORS: true,
        backgroundColor: reportType === "social" ? "#0f172a" : "#ffffff",
      });
      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          "image/png",
          1.0,
        );
      });
    } catch (err) {
      console.error("Failed to generate image", err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    const blob = await generateImageBlob();
    if (!blob) {
      alert(
        language === "en"
          ? "Failed to generate image."
          : "Gagal membuat gambar.",
      );
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `Unlupa-${reportType}-${(userProfile?.fullName || "User").replace(/\s+/g, "-")}.png`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const blob = await generateImageBlob();
    if (!blob) {
      alert(
        language === "en"
          ? "Failed to generate image."
          : "Gagal membuat gambar.",
      );
      return;
    }
    const file = new File([blob], `Unlupa-${reportType}.png`, {
      type: "image/png",
    });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title:
            language === "en" ? "Quran Progress" : "Progres Hafalan Al-Qur'an",
          text:
            language === "en"
              ? "Alhamdulillah, my memorization progress with Unlupa.id"
              : "Alhamdulillah, progres hafalan saya bersama Unlupa.id",
          files: [file],
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      // Fallback
      handleDownload();
      alert(
        language === "en"
          ? "Web Share not supported. Image downloaded instead."
          : "Fitur Share tidak didukung. Gambar telah diunduh.",
      );
    }
  };

  const todayStr = new Date().toLocaleDateString(
    language === "id" ? "id-ID" : "en-US",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-slate-850/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {language === "en"
                  ? "Generate Report & Certificate"
                  : "Buat Rapor & Sertifikat"}
              </h3>
              <p className="text-xs text-slate-500">
                {language === "en"
                  ? "Export official documents with Unlupa.id verification"
                  : "Ekspor dokumen resmi dengan verifikasi Unlupa.id"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0">
          {/* Left Panel: Settings Form */}
          <div className="w-full lg:w-80 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto p-5 space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {language === "en" ? "Data Source" : "Sumber Data"}
              </label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setReportSource("quran")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
                    reportSource === "quran"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <Award className="w-4 h-4" />
                  Al-Qur'an
                </button>
                <button
                  onClick={() => setReportSource("personal")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
                    reportSource === "personal"
                      ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <Target className="w-4 h-4" />
                  Kelas Pribadi
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {language === "en" ? "Document Type" : "Jenis Dokumen"}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setReportType("social")}
                  className={`flex flex-col items-center p-3 rounded-xl border ${
                    reportType === "social"
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  } transition-colors`}
                >
                  <Instagram className="w-5 h-5 mb-1.5" />
                  <span className="text-[10px] sm:text-[11px] font-bold text-center leading-tight">
                    {language === "en" ? "Social Story" : "Story Sosmed"}
                  </span>
                </button>
                <button
                  onClick={() => setReportType("certificate")}
                  className={`flex flex-col items-center p-3 rounded-xl border ${
                    reportType === "certificate"
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  } transition-colors`}
                >
                  <Award className="w-5 h-5 mb-1.5" />
                  <span className="text-[10px] sm:text-[11px] font-bold text-center leading-tight">
                    {language === "en" ? "Certificate" : "Sertifikat"}
                  </span>
                </button>
                <button
                  onClick={() => setReportType("report")}
                  className={`flex flex-col items-center p-3 rounded-xl border ${
                    reportType === "report"
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  } transition-colors`}
                >
                  <FileText className="w-5 h-5 mb-1.5" />
                  <span className="text-[10px] sm:text-[11px] font-bold text-center leading-tight">
                    {language === "en" ? "Report" : "Rapor"}
                  </span>
                </button>
              </div>
            </div>

            {reportType !== "social" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Settings2 className="w-4 h-4" />
                  {language === "en" ? "Customization" : "Kustomisasi Data"}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {language === "en" ? "Institution Name" : "Nama Lembaga"}
                    </label>
                    <input
                      type="text"
                      value={instName}
                      onChange={(e) => setInstName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                      <ImageIcon className="w-3.5 h-3.5" />
                      {language === "en"
                        ? "Logo URL (Optional)"
                        : "URL Logo Lembaga (Opsional)"}
                    </label>
                    <input
                      type="text"
                      value={instLogo}
                      onChange={(e) => setInstLogo(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                      <UserCircle className="w-3.5 h-3.5" />
                      {language === "en"
                        ? "Teacher / Mentor Name"
                        : "Nama Guru / Pembimbing"}
                    </label>
                    <input
                      type="text"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                      <PenTool className="w-3.5 h-3.5" />
                      {language === "en"
                        ? "Head of Institution"
                        : "Pimpinan / Kepala Lembaga"}
                    </label>
                    <input
                      type="text"
                      value={headName}
                      onChange={(e) => setHeadName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleShare}
                disabled={isGenerating}
                className="flex-1 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <Share2 className="w-4 h-4" />
                {language === "en" ? "Share" : "Bagikan"}
              </button>
              <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <Download className="w-4 h-4" />
                {isGenerating
                  ? language === "en"
                    ? "..."
                    : "..."
                  : language === "en"
                    ? "Save"
                    : "Simpan"}
              </button>
            </div>
          </div>

          {/* Right Panel: Live Preview Canvas */}
          <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-4 sm:p-8 overflow-y-auto flex justify-center items-center">
            {/* THIS IS THE PRINTABLE AREA */}
            <div
              ref={printRef}
              className={`${reportType === "social" ? "bg-slate-950" : "bg-white"} shrink-0 shadow-xl relative overflow-hidden flex flex-col`}
              style={{
                aspectRatio:
                  reportType === "certificate"
                    ? "1.414 / 1"
                    : reportType === "social"
                      ? "9 / 16"
                      : "1 / 1.414",
                width:
                  reportType === "certificate"
                    ? "800px"
                    : reportType === "social"
                      ? "450px"
                      : "566px",
                minHeight: reportType === "certificate" ? "566px" : "800px",
              }}
            >
              {/* Common Unlupa Watermark / Border */}
              <div className="absolute inset-0 border-[12px] border-indigo-900/5 pointer-events-none z-10 pointer-events-none"></div>
              <div className="absolute inset-2 border-2 border-indigo-900/10 pointer-events-none z-10 pointer-events-none"></div>

              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

              {/* Verified by Unlupa.id Default Logo (Bottom Center) */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-1.5 opacity-50 z-20 pointer-events-none">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
                  Verified by Unlupa.id
                </span>
              </div>

              {reportType === "social" ? (
                /* SOCIAL STORY LAYOUT */
                <div className="flex-1 flex flex-col p-8 relative z-20 text-center justify-between items-center overflow-hidden h-full">
                  <div className="absolute inset-0 bg-slate-950 pointer-events-none"></div>
                  <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/4 pointer-events-none"></div>
                  <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
                  <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)",
                      backgroundSize: "24px 24px",
                    }}
                  ></div>

                  <div className="relative z-10 w-full pt-8 flex-1 flex flex-col justify-center">
                    <div className="flex justify-center mb-6 relative">
                      <div className="w-24 h-24 rounded-full border-4 border-white/10 overflow-hidden shadow-2xl relative z-10 bg-slate-800">
                        {userProfile.avatarUrl ? (
                          <img
                            src={userProfile.avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                            {userProfile.fullName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-0 right-1/2 translate-x-10 translate-y-2 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg z-20 border border-amber-300">
                        Hafizh
                      </div>
                    </div>

                    <h2 className="text-sm font-bold text-blue-200/80 tracking-[0.2em] uppercase mb-2">
                      {userProfile.fullName}
                    </h2>
                    <h1 className="text-[2.5rem] font-black text-white leading-[1.1] mb-10 drop-shadow-lg">
                      {language === "en" ? "Alhamdulillah," : "Alhamdulillah,"}
                      <br />
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-emerald-300 to-emerald-400">
                        {language === "en"
                          ? "Great Progress!"
                          : "Progres Luar Biasa!"}
                      </span>
                    </h1>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 flex flex-col items-center shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                        <Target className="w-6 h-6 text-blue-400 mb-3 opacity-80" />
                        <span className="text-5xl font-black text-white mb-1 drop-shadow-md">
                          {primaryStat}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-blue-200/80 font-bold text-center leading-tight">
                          {primaryLabel.split(" ")[0]}
                          <br />
                          {primaryLabel.split(" ").slice(1).join(" ")}
                        </span>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 flex flex-col items-center shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                        <Award className="w-6 h-6 text-emerald-400 mb-3 opacity-80" />
                        <span className="text-5xl font-black text-emerald-400 mb-1 drop-shadow-md">
                          {secondaryStat}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-emerald-200/80 font-bold text-center leading-tight">
                          {secondaryLabel.split(" ")[0]}
                          <br />
                          {secondaryLabel.split(" ").slice(1).join(" ")}
                        </span>
                      </div>
                    </div>

                    {/* Retention Mini Chart */}
                    {isQuran ? (
                      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 mx-2 relative overflow-hidden mb-4">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                          Kekuatan Memori
                        </p>
                        <div className="flex items-end justify-center gap-1.5 h-20">
                          {[
                            {
                              val: quranStats.intervalLessThan5,
                              col: "bg-rose-500",
                            },
                            {
                              val:
                                quranStats.intervalLessThan10 -
                                quranStats.intervalLessThan5,
                              col: "bg-amber-500",
                            },
                            {
                              val:
                                quranStats.intervalLessThan20 -
                                quranStats.intervalLessThan10,
                              col: "bg-purple-500",
                            },
                            {
                              val:
                                quranStats.intervalLessThan30 -
                                quranStats.intervalLessThan20,
                              col: "bg-blue-500",
                            },
                            {
                              val: quranStats.intervalOver30,
                              col: "bg-emerald-500",
                            },
                          ].map((b, i) => (
                            <div
                              key={i}
                              className="flex-1 flex flex-col items-center gap-2 group"
                            >
                              <div
                                className={`w-full rounded-t-md ${b.col} shadow-lg shadow-black/20`}
                                style={{
                                  height: `${Math.max(15, (b.val / (quranStats.active || 1)) * 100)}%`,
                                }}
                              ></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 mx-2 relative overflow-hidden mb-4">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                          Rata-rata Memori
                        </p>
                        <div className="flex items-center justify-center h-20">
                          <span className="text-4xl font-black text-amber-400 drop-shadow-md">
                            {Math.round(personalStats.avgStability * 100)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative z-10 flex flex-col items-center gap-2 mt-auto pb-4">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white tracking-widest uppercase">
                        Unlupa.id
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-500 tracking-widest uppercase">
                      Adaptive Memorization Engine
                    </p>
                  </div>
                </div>
              ) : reportType === "certificate" ? (
                /* CERTIFICATE LAYOUT */
                <div className="flex-1 flex flex-col p-12 relative z-20 text-center">
                  <div className="flex justify-between items-start">
                    {instLogo ? (
                      <img
                        src={instLogo}
                        alt="Logo"
                        className="h-16 object-contain"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="h-16 flex items-center justify-center">
                        <span className="text-xl font-black text-indigo-900">
                          {instName}
                        </span>
                      </div>
                    )}

                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {certSubtitle}
                      </p>
                      <p className="text-xs text-slate-500">{todayStr}</p>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-center items-center mt-8">
                    <h1 className="text-5xl font-black text-indigo-950 mb-2 font-serif tracking-tight">
                      CERTIFICATE
                    </h1>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.3em] mb-8">
                      Of Achievement
                    </p>

                    <p className="text-sm text-slate-600 mb-2">
                      This certificate is proudly presented to
                    </p>
                    <h2
                      className="text-4xl font-bold text-slate-900 mb-6 italic"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {userProfile.fullName}
                    </h2>

                    <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                      For outstanding dedication and commitment in memorizing
                      with adaptive review methodology.
                    </p>

                    <div className="mt-8 flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-3xl font-black text-indigo-600">
                          {primaryStat}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                          {primaryLabelCert}
                        </p>
                      </div>
                      <div className="w-px h-12 bg-slate-200"></div>
                      <div className="text-center">
                        <p className="text-3xl font-black text-amber-500">
                          {secondaryStat}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                          {secondaryLabelCert}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex justify-between items-end px-10">
                    <div className="text-center w-48">
                      <div className="h-12 border-b border-slate-300 mb-2 flex items-end justify-center pb-2">
                        <span className="text-indigo-900/20 font-serif italic text-lg">
                          {teacherName.split(" ")[0]}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        {teacherName}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Mentor / Muhaffizh
                      </p>
                    </div>

                    <div className="w-20 h-20 rounded-full border-2 border-amber-400 bg-amber-50 flex items-center justify-center flex-col shadow-inner">
                      <Award className="w-6 h-6 text-amber-500 mb-1" />
                      <span className="text-[7px] font-bold text-amber-700 uppercase">
                        Excellent
                      </span>
                    </div>

                    <div className="text-center w-48">
                      <div className="h-12 border-b border-slate-300 mb-2 flex items-end justify-center pb-2">
                        <span className="text-indigo-900/20 font-serif italic text-lg">
                          {headName.split(" ")[0]}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        {headName}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Head of Institution
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* REPORT LAYOUT */
                <div className="flex-1 flex flex-col p-10 relative z-20">
                  {/* Report Header */}
                  <div className="flex items-start justify-between border-b-2 border-indigo-900 pb-6 mb-6">
                    <div className="flex items-center gap-4">
                      {instLogo ? (
                        <img
                          src={instLogo}
                          alt="Logo"
                          className="w-16 h-16 object-contain"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-indigo-900 text-white flex items-center justify-center font-bold text-2xl">
                          {instName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                          {instName}
                        </h1>
                        <p className="text-sm font-semibold text-indigo-600">
                          {reportSubtitle}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-bold text-slate-800 uppercase tracking-wider mb-1">
                        Tanggal Cetak
                      </p>
                      <p className="text-slate-600">{todayStr}</p>
                    </div>
                  </div>

                  {/* Student Info */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8 flex items-center gap-5">
                    <img
                      src={userProfile.avatarUrl}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full border-2 border-white shadow-sm"
                      crossOrigin="anonymous"
                    />
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Nama Santri
                      </p>
                      <h2 className="text-xl font-bold text-slate-900">
                        {userProfile.fullName}
                      </h2>
                      <p className="text-sm text-slate-600 mt-0.5">
                        {userProfile.email}
                      </p>
                    </div>
                  </div>

                  {/* Memory Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 text-center">
                      <p className="text-sm font-bold text-indigo-800 mb-1">
                        {primaryLabel}
                      </p>
                      <p className="text-4xl font-black text-indigo-600">
                        {primaryStat}{" "}
                        <span className="text-base font-semibold text-indigo-400">
                          {primarySuffix}
                        </span>
                      </p>
                      <p className="text-[10px] text-indigo-500 mt-2">
                        {primaryDesc}
                      </p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 text-center">
                      <p className="text-sm font-bold text-emerald-800 mb-1">
                        {secondaryLabel}
                      </p>
                      <p className="text-4xl font-black text-emerald-600">
                        {secondaryStat}{" "}
                        <span className="text-base font-semibold text-emerald-400">
                          {secondarySuffix}
                        </span>
                      </p>
                      <p className="text-[10px] text-emerald-500 mt-2">
                        {secondaryDesc}
                      </p>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="mb-auto">
                    {isQuran ? (
                      <>
                        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">
                          Distribusi Kekuatan Hafalan
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                              <span className="text-slate-700">
                                Sangat Kuat (&gt; 30 Hari)
                              </span>
                            </div>
                            <span className="font-bold text-slate-900">
                              {quranStats.intervalOver30} hal
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              <span className="text-slate-700">
                                Kuat (20 - 29 Hari)
                              </span>
                            </div>
                            <span className="font-bold text-slate-900">
                              {quranStats.intervalLessThan30 -
                                quranStats.intervalOver30}{" "}
                              hal
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                              <span className="text-slate-700">
                                Stabil (10 - 19 Hari)
                              </span>
                            </div>
                            <span className="font-bold text-slate-900">
                              {quranStats.intervalLessThan20 -
                                quranStats.intervalLessThan30}{" "}
                              hal
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                              <span className="text-slate-700">
                                Berkembang (5 - 9 Hari)
                              </span>
                            </div>
                            <span className="font-bold text-slate-900">
                              {quranStats.intervalLessThan10 -
                                quranStats.intervalLessThan20}{" "}
                              hal
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                              <span className="text-slate-700">
                                Hafalan Baru (&lt; 5 Hari)
                              </span>
                            </div>
                            <span className="font-bold text-slate-900">
                              {quranStats.intervalLessThan5} hal
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">
                          Statistik Kekuatan Ingatan
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                              <span className="text-slate-700">
                                Rata-rata Kekuatan Memori (Stability)
                              </span>
                            </div>
                            <span className="font-bold text-slate-900">
                              {Math.round(personalStats.avgStability * 100)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              <span className="text-slate-700">
                                Item Tersimpan
                              </span>
                            </div>
                            <span className="font-bold text-slate-900">
                              {personalStats.totalItems} item
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                              <span className="text-slate-700">
                                Jadwal Review Hari Ini
                              </span>
                            </div>
                            <span className="font-bold text-slate-900">
                              {personalStats.dueToday} item
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Signatures */}
                  <div className="mt-8 flex justify-between items-end">
                    <div className="text-center w-40">
                      <div className="h-12 border-b border-slate-400 mb-2 pb-2"></div>
                      <p className="text-xs font-bold text-slate-800">
                        {headName}
                      </p>
                      <p className="text-[10px] text-slate-500">Pimpinan</p>
                    </div>
                    <div className="text-center w-40">
                      <div className="h-12 border-b border-slate-400 mb-2 pb-2"></div>
                      <p className="text-xs font-bold text-slate-800">
                        {teacherName}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Muhaffizh / Mentor
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
