import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  Compass,
  BookOpen,
  Library,
  GraduationCap,
  Users,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { language } = useApp();
  const [slide, setSlide] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      icon: <Compass className="w-10 h-10 text-blue-600" />,
      titleEn: "Welcome to Unlupa.id",
      titleId: "Selamat Datang di Unlupa.id",
      subtitleEn: "Four spaces. One unified memory system.",
      subtitleId: "Empat ruang. Satu sistem memori terpadu.",
      descEn:
        "Forget the cycle of 'I used to know this, now it's gone'. Unlupa schedules your reviews right before memory fades using an advanced adaptive engine.",
      descId:
        "Hilangkan siklus 'dulu hafal sekarang lupa'. Unlupa menjadwalkan murajaah tepat waktu agar hafalan tetap melekat kuat.",
      badge: "Sistem Murajaah Cerdas",
    },
    {
      icon: <BookOpen className="w-10 h-10 text-amber-600" />,
      titleEn: "Quran Space",
      titleId: "Ruang Al-Qur'an",
      subtitleEn: "Page by page. Always mutqin.",
      subtitleId: "Per halaman. Selalu terjaga mutqin.",
      descEn:
        "All 604 pages mapped with Juz and Surahs. Optimized 2-button review ('I know' / 'Need review') with a strict 30-day maximum review interval.",
      descId:
        "604 halaman mushaf madinah dengan 2 tombol review ('Saya Lancar' / 'Perlu Murajaah') dan siklus maksimal 30 hari agar hafalan mutqin.",
      badge: "604 Pages • 30 Juz",
    },
    {
      icon: <Library className="w-10 h-10 text-indigo-600" />,
      titleEn: "Personal Space",
      titleId: "Ruang Pribadi",
      subtitleEn: "Structured like real books: Book → Chapter → Item.",
      subtitleId: "Struktur buku nyata: Buku → Bab → Kartu.",
      descEn:
        "Items stay inactive until you activate them with 1-click. Includes pre-review preview, Anki/JSON import, and curated public library.",
      descId:
        "Kartu tidak langsung masuk antrean sampai Anda klik Aktivasi. Dilengkapi pratinjau soal-jawaban, impor JSON, dan katalog kurasi.",
      badge: "1-Click Activation",
    },
    {
      icon: <GraduationCap className="w-10 h-10 text-indigo-600" />,
      titleEn: "My Classes",
      titleId: "Ruang Kelas Saya",
      subtitleEn: "Join halaqahs and cohorts with a code.",
      subtitleId: "Gabung halaqah dan kelas belajar dengan kode.",
      descEn:
        "Enter your instructor's invite code (e.g. QRN-2026) to receive assigned syllabi, practice daily reviews, and sync progress automatically.",
      descId:
        "Cukup masukkan kode kelas dari guru Anda untuk mendapatkan materi tugas dan sinkronisasi laporan murajaah harian.",
      badge: "Instant Enrollment",
    },
    {
      icon: <Users className="w-10 h-10 text-violet-600" />,
      titleEn: "Teaching Space",
      titleId: "Ruang Mengajar",
      subtitleEn: "Create classes & monitor retention telemetry.",
      subtitleId: "Buat kelas & pantau retensi murid secara live.",
      descEn:
        "Track student review consistency, spot cards needing review, and verify memory stability without tedious manual record keeping.",
      descId:
        "Pantau kestabilan memori murid, deteksi halaman yang sering lupa, dan bimbing santri dengan data analitik ilmiah.",
      badge: "Real-time Telemetry",
    },
  ];

  const current = slides[slide];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col justify-between min-h-[460px]">
        {/* Top bar with dots & close */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSlide(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === slide ? "w-6 bg-blue-600" : "w-2 bg-slate-200"
                }`}
              />
            ))}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="text-center py-4 space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 mx-auto flex items-center justify-center shadow-inner">
            {current.icon}
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {current.badge}
            </span>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">
              {language === "en" ? current.titleEn : current.titleId}
            </h3>
            <p className="text-sm font-semibold text-blue-700 mt-0.5">
              {language === "en" ? current.subtitleEn : current.subtitleId}
            </p>
          </div>

          <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
            {language === "en" ? current.descEn : current.descId}
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          <button
            disabled={slide === 0}
            onClick={() => setSlide(slide - 1)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{language === "en" ? "Previous" : "Sebelumnya"}</span>
          </button>

          {slide < slides.length - 1 ? (
            <button
              onClick={() => setSlide(slide + 1)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
            >
              <span>{language === "en" ? "Next" : "Lanjut"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20"
            >
              {language === "en" ? "Get Started" : "Mulai Sekarang"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
