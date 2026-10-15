import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Compass,
  BookOpen,
  Target,
  Mic,
  CheckCircle2,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  Volume2,
  Lightbulb,
  Brain,
  Activity,
  Layers,
} from "lucide-react";
import confetti from "canvas-confetti";

interface QuranOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: "en" | "id" | "ar";
}

export const QuranOnboardingModal: React.FC<QuranOnboardingModalProps> = ({
  isOpen,
  onClose,
  language = "id",
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  // Reset step on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleFinish();
      } else if (e.key === "ArrowRight") {
        if (currentStep < steps.length - 1) setCurrentStep((prev) => prev + 1);
      } else if (e.key === "ArrowLeft") {
        if (currentStep > 0) setCurrentStep((prev) => prev - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const handleFinish = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem("unlupa_quran_onboarding_seen_v1", "true");
      } catch (e) {
        // ignore
      }
    }
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6"],
    });
    onClose();
  };

  const steps = [
    {
      id: "smart-review-concept",
      badgeId: "Inti Unlupa • Murajaah Cerdas",
      badgeEn: "Unlupa Core • Smart Review",
      titleId: "Murajaah Tepat Sasaran, Bukan Hafalan Buta",
      titleEn: "Targeted Review, Not Blind Repetition",
      descId:
        "Tinggalkan metode lama yang memaksa Anda mengulang semua juz tanpa arah. Unlupa menjadwalkan murajaah tepat waktu secara cerdas. Kami hanya meminta Anda mengulang halaman yang waktunya dimurajaah hari ini.",
      descEn:
        "Leave behind old methods that force directionless repetition. Unlupa intelligently schedules your reviews right on time. We only ask you to review pages that are due today.",
      tipId:
        'Cukup nol-kan angka "Jatuh Tempo" setiap hari, dan saksikan hafalan Anda selalu mutqin tanpa kelelahan ekstra.',
      tipEn:
        'Just clear your "Due Today" counter daily, and watch your memorization stay solid without burnout.',
      Visual: () => (
        <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-950 overflow-hidden">
          {/* Abstract background elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl animate-pulse"></div>
            <div
              className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500 rounded-full mix-blend-screen filter blur-3xl animate-pulse"
              style={{ animationDelay: "2s" }}
            ></div>
          </div>

          <div className="relative z-10 w-4/5">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
              <div className="flex items-center gap-4 mb-6 text-white">
                <Brain className="w-8 h-8 text-blue-300" />
                <div>
                  <h4 className="font-bold text-lg leading-tight">
                    Forgetting Curve
                  </h4>
                  <p className="text-blue-200/70 text-xs">
                    AI-Optimized Retention
                  </p>
                </div>
              </div>

              <div className="relative h-24 flex items-end gap-2">
                {/* Simulated Chart */}
                <div className="flex-1 bg-white/5 rounded-t-sm h-[90%] relative group">
                  <div className="absolute inset-x-0 bottom-0 bg-blue-500/40 h-full rounded-t-sm transition-all group-hover:bg-blue-400"></div>
                </div>
                <div className="flex-1 bg-white/5 rounded-t-sm h-[60%] relative group">
                  <div className="absolute inset-x-0 bottom-0 bg-blue-400/50 h-full rounded-t-sm transition-all group-hover:bg-blue-300"></div>
                </div>
                <div className="flex-1 bg-white/5 rounded-t-sm h-[30%] relative group">
                  <div className="absolute inset-x-0 bottom-0 bg-amber-400/60 h-full rounded-t-sm transition-all group-hover:bg-amber-300"></div>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-indigo-900 text-[10px] font-bold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                    {language === "en" ? "Review Now!" : "Murajaah Sekarang!"}
                  </div>
                </div>
                <div className="flex-1 bg-white/5 rounded-t-sm h-[80%] relative">
                  <div className="absolute inset-x-0 bottom-0 bg-emerald-400/60 h-full rounded-t-sm"></div>
                </div>
              </div>
              <div className="flex justify-between text-white/40 text-[10px] mt-2 font-mono">
                <span>Day 1</span>
                <span>Day 5</span>
                <span className="text-amber-300 font-bold">Today</span>
                <span>Day 20</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "juz-activation",
      badgeId: "Manajemen Modular • 30 Juz",
      badgeEn: "Modular Management • 30 Juz",
      titleId: "Kendalikan Ruang Hafalan Anda",
      titleEn: "Take Control of Your Memorization Space",
      descId:
        'Tidak perlu terintimidasi oleh 604 halaman. Masuk ke Juz mana pun, dan klik "Aktifkan" hanya pada halaman yang sudah atau sedang Anda hafal. Halaman yang tidak aktif tidak akan pernah mengganggu jadwal harian Anda.',
      descEn:
        'Don\'t be intimidated by 604 pages. Enter any Juz and click "Activate" only on the pages you have memorized or are currently learning. Inactive pages will never clutter your daily schedule.',
      tipId:
        "Aktifkan sedikit demi sedikit. Memiliki 10 halaman aktif yang mutqin jauh lebih baik daripada 100 halaman aktif namun berantakan.",
      tipEn:
        "Activate progressively. Having 10 solidly mastered pages is far better than 100 active but struggling pages.",
      Visual: () => (
        <div className="relative w-full h-full flex items-center justify-center bg-slate-100 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <BookOpen
              className="w-[120%] h-[120%] text-slate-900"
              strokeWidth={0.5}
            />
          </div>

          <div className="relative z-10 w-4/5 max-w-sm space-y-3">
            {/* Mockup Card 1 */}
            <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-200/60 flex items-center justify-between transform -rotate-2 hover:rotate-0 transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-lg font-serif">
                  1
                </div>
                <div>
                  <h5 className="font-bold text-slate-900">Al-Fatihah</h5>
                  <p className="text-[10px] text-slate-500">
                    Halaman 1 • Tidak Aktif
                  </p>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white transition-colors text-slate-600 rounded-lg text-xs font-bold cursor-pointer">
                Aktifkan
              </div>
            </div>

            {/* Mockup Card 2 */}
            <div className="bg-white p-4 rounded-2xl shadow-xl border border-blue-200/60 flex items-center justify-between transform translate-x-4 hover:translate-x-2 transition-transform relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl flex items-center justify-center font-bold text-lg font-serif">
                  2
                </div>
                <div>
                  <h5 className="font-bold text-slate-900">Al-Baqarah</h5>
                  <p className="text-[10px] text-blue-600 font-semibold">
                    Halaman 2 • Aktif
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Check className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "stability-clusters",
      badgeId: "Visualisasi Sains • 5 Klaster",
      badgeEn: "Scientific Visualization • 5 Clusters",
      titleId: "Ubah Data Menjadi Peta Kekuatan Memori",
      titleEn: "Turn Data into a Memory Strength Map",
      descId:
        "Sistem membagi halaman Anda ke dalam 5 spektrum warna berdasarkan rentang ingatannya. Mulai dari Merah (<5 Hari) untuk hafalan baru yang rapuh, hingga Hijau Tua (>30 Hari) untuk hafalan yang sudah Mapan.",
      descEn:
        "The system categorizes your pages into a 5-color spectrum based on retention span. Ranging from Red (<5 Days) for fragile new memorization, to Deep Green (>30 Days) for deeply mastered pages.",
      tipId:
        "Klik pada warna apa pun di ringkasan dasbor untuk melihat langsung daftar halaman di klaster tersebut. Semua elemen di Unlupa dirancang interaktif.",
      tipEn:
        "Click on any color block in the dashboard summary to instantly view the pages within that cluster. Everything is designed to be fully interactive.",
      Visual: () => (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-900 overflow-hidden">
          <div className="text-center mb-8 relative z-10">
            <h4 className="text-white font-bold text-xl tracking-tight mb-2">
              Memory Matrix
            </h4>
            <p className="text-slate-400 text-xs max-w-xs mx-auto">
              Perjalanan sebuah halaman menuju predikat Mutqin.
            </p>
          </div>

          <div className="flex items-end justify-center gap-2 sm:gap-4 relative z-10">
            {[
              { h: "h-16", color: "bg-rose-500", label: "<5d" },
              { h: "h-24", color: "bg-amber-500", label: "5-9d" },
              { h: "h-32", color: "bg-purple-500", label: "10-19d" },
              { h: "h-40", color: "bg-blue-500", label: "20-29d" },
              { h: "h-48", color: "bg-emerald-500", label: "Mapan" },
            ].map((bar, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div
                  className={`w-12 sm:w-16 rounded-t-xl ${bar.color} ${bar.h} shadow-lg shadow-${bar.color.split("-")[1]}-500/20 relative group cursor-pointer transition-all hover:scale-105 hover:-translate-y-2`}
                >
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 rounded-t-xl transition-colors"></div>
                </div>
                <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded-full">
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "mushaf-recorder",
      badgeId: "Simulasi Nyata • Mushaf & Audio",
      badgeEn: "True Simulation • Mushaf & Audio",
      titleId: "Setor Hafalan Anda Kapan Pun, Di Mana Pun",
      titleEn: "Recite Your Memorization Anytime, Anywhere",
      descId:
        "Kami membawakan pengalaman nyata Mushaf Madinah 15 baris langsung ke layar Anda. Gunakan fitur Perekam Audio internal untuk menyetorkan hafalan (tasmi') secara mandiri. Dengarkan kembali suara Anda untuk mengoreksi letak kesalahan.",
      descEn:
        "We bring the authentic 15-line Madinah Mushaf experience straight to your screen. Use the built-in Audio Recorder to practice self-tasmi'. Listen back to your own voice to identify and correct mistakes.",
      tipId:
        "Audio Anda akan tersimpan lokal di peramban selama 24 jam dan bisa diputar dengan kecepatan 1.5x untuk koreksi cepat.",
      tipEn:
        "Your audio is stored locally in your browser for 24 hours and can be played at 1.5x speed for quick reviewing.",
      Visual: () => (
        <div className="relative w-full h-full flex items-center justify-center bg-amber-50 overflow-hidden">
          {/* Abstract Mushaf Motif */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, #92400e 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          ></div>

          <div className="relative z-10 w-4/5 max-w-sm bg-white rounded-t-3xl shadow-2xl border-t border-x border-amber-200/60 overflow-hidden flex flex-col pt-6 translate-y-12 h-full">
            <div className="px-6 flex items-center justify-between mb-6">
              <div className="w-8 h-8 rounded-full border border-amber-200 flex items-center justify-center text-amber-700 font-serif font-bold text-xs">
                ٢٥
              </div>
              <div className="h-6 w-32 bg-amber-100 rounded-full"></div>
            </div>

            {/* Fake text lines */}
            <div className="px-8 space-y-3 flex-1 opacity-40">
              <div className="h-3 w-full bg-slate-200 rounded"></div>
              <div className="h-3 w-11/12 bg-slate-200 rounded"></div>
              <div className="h-3 w-full bg-slate-200 rounded"></div>
              <div className="h-3 w-4/5 bg-slate-200 rounded"></div>
            </div>

            {/* Audio Player Overlay Mockup */}
            <div className="absolute bottom-12 left-4 right-4 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/30 animate-pulse">
                <div className="w-3 h-3 bg-white rounded-sm"></div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-mono">
                  <span>02:14</span>
                  <span className="text-rose-400 font-bold">Merekam...</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
                  {/* Fake Audio Waveform */}
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-full w-2 bg-rose-500/80 rounded-full"
                      style={{ opacity: Math.random() * 0.5 + 0.5 }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "review-mastery",
      badgeId: "Aksi Harian • 2 Tombol",
      badgeEn: "Daily Action • 2 Buttons",
      titleId: "Kejujuran Adalah Kunci Memori Abadi",
      titleEn: "Honesty is the Key to Everlasting Memory",
      descId:
        'Setelah membaca, Anda hanya perlu memilih antara "Lancar" atau "Perlu Ulang". Tidak perlu memikirkan kapan harus mengulang lagi—sistem kami akan menjadwalkannya otomatis tepat waktu. Jangan ragu menekan "Perlu Ulang" jika Anda tersendat; mengulang hari ini mencegah hafalan hilang selamanya.',
      descEn:
        'After reciting, simply choose between "Mastered" or "Needs Review". Don\'t worry about when to review next—our system handles the scheduling automatically. Never hesitate to hit "Needs Review" if you stumble; reviewing today prevents losing it forever.',
      tipId:
        'Jika Anda menemukan kesalahan spesifik (Lupa Ayat, Salah Harakat, Tajwid), klik "Catatan Koreksi" untuk menyimpannya sebagai bahan evaluasi.',
      tipEn:
        'If you spot specific errors (Forgot Ayah, Vowel Error, Tajweed), click "Correction Notes" to save them for future evaluation.',
      Visual: () => (
        <div className="relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden">
          <div className="relative z-10 w-full px-8 space-y-6">
            <div className="text-center">
              <h4 className="text-white font-bold text-xl mb-2">
                Bagaimana hafalan Anda?
              </h4>
              <p className="text-slate-400 text-xs">
                Mesin beradaptasi dari kejujuran Anda.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-emerald-500/20 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/30 transition-all"></div>
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="text-emerald-400 font-bold text-lg">
                    {language === "en" ? "I Know It" : "Saya Lancar"}
                  </h5>
                  <p className="text-emerald-500/60 text-xs mt-0.5">
                    {language === "en"
                      ? "Interval expands safely."
                      : "Perluas interval memori."}
                  </p>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-amber-500/20 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-500/30 transition-all"></div>
                <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="text-amber-400 font-bold text-lg">
                    {language === "en" ? "Needs Review" : "Perlu Murajaah"}
                  </h5>
                  <p className="text-amber-500/60 text-xs mt-0.5">
                    {language === "en"
                      ? "Schedule a quick reinforcement."
                      : "Ulangi dalam 1-2 hari."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[currentStep];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 md:p-8"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-full max-h-[85vh]"
          >
            {/* LEFT COLUMN: Premium Visuals */}
            <div className="w-full md:w-1/2 h-64 md:h-full bg-slate-100 dark:bg-slate-950 relative overflow-hidden flex-shrink-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute inset-0"
                >
                  <current.Visual />
                </motion.div>
              </AnimatePresence>

              {/* Progress Indicators overlayed on visual for mobile, hidden on desktop if preferred */}
              <div className="absolute top-6 left-6 right-6 flex gap-2 z-20">
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm"
                  >
                    {idx <= currentStep && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: idx < currentStep ? "100%" : "100%" }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: Content & Navigation */}
            <div className="w-full md:w-1/2 h-full flex flex-col relative bg-white dark:bg-slate-900">
              {/* Close Button */}
              <div className="absolute top-6 right-6 z-10">
                <button
                  onClick={handleFinish}
                  className="w-10 h-10 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Text Content */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 mb-4">
                        <Compass className="w-3.5 h-3.5" />
                        {language === "en" ? current.badgeEn : current.badgeId}
                      </span>

                      <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-[1.15] tracking-tight">
                        {language === "en" ? current.titleEn : current.titleId}
                      </h2>
                    </div>

                    <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                      {language === "en" ? current.descEn : current.descId}
                    </p>

                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 p-4 rounded-2xl flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                        <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <p className="text-sm text-amber-900 dark:text-amber-200/90 leading-relaxed font-medium">
                        {language === "en" ? current.tipEn : current.tipId}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bottom Actions */}
              <div className="p-6 md:px-12 md:py-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <label className="flex items-center gap-2.5 text-sm text-slate-500 dark:text-slate-400 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 group-hover:border-blue-500 transition-colors">
                    <input
                      type="checkbox"
                      checked={dontShowAgain}
                      onChange={(e) => setDontShowAgain(e.target.checked)}
                      className="absolute opacity-0 w-full h-full cursor-pointer"
                    />
                    {dontShowAgain && (
                      <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 pointer-events-none" />
                    )}
                  </div>
                  <span className="select-none font-medium transition-colors group-hover:text-slate-700 dark:group-hover:text-slate-300">
                    {language === "en"
                      ? "Don't show this again"
                      : "Jangan tampilkan ini lagi"}
                  </span>
                </label>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setCurrentStep((prev) => prev - 1)}
                    disabled={currentStep === 0}
                    className="flex-1 sm:flex-none px-4 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{language === "en" ? "Back" : "Kembali"}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (currentStep < steps.length - 1) {
                        setCurrentStep((prev) => prev + 1);
                      } else {
                        handleFinish();
                      }
                    }}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                  >
                    <span>
                      {currentStep < steps.length - 1
                        ? language === "en"
                          ? "Continue"
                          : "Lanjutkan"
                        : language === "en"
                          ? "Let's Begin"
                          : "Mulai Sekarang"}
                    </span>
                    {currentStep < steps.length - 1 ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
