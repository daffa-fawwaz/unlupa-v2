import React from "react";
import {
  Clock,
  Flame,
  Share2,
  Calendar,
  Home,
  BookOpen,
  Library,
  GraduationCap,
  Users,
  User as UserIcon,
  RotateCcw,
  Check,
  Eye,
  HardDrive,
  Filter,
  Plus,
  Upload,
  MessageSquare,
  BarChart3,
  PenLine,
  CheckCircle2,
  KeyRound,
  Award,
} from "lucide-react";
import { OnboardingPageKey } from "../types";

export interface OnboardingItemGuide {
  id: string;
  nameEn: string;
  nameId: string;
  badgeEn: string;
  badgeId: string;
  icon: React.ReactNode;
  iconBg: string;
  descEn: string;
  descId: string;
  functionEn: string;
  functionId: string;
  tipEn: string;
  tipId: string;
  mockup: React.ReactNode;
}

export interface PageOnboardingData {
  pageKey: OnboardingPageKey;
  titleEn: string;
  titleId: string;
  subtitleEn: string;
  subtitleId: string;
  badgeEn: string;
  badgeId: string;
  icon: React.ReactNode;
  themeColor: string;
  items: OnboardingItemGuide[];
}

export const ONBOARDING_PAGES_DATA: Record<
  OnboardingPageKey,
  PageOnboardingData
> = {
  home: {
    pageKey: "home",
    titleEn: "Dashboard & Home Walkthrough",
    titleId: "Panduan Fitur & Antarmuka Beranda",
    subtitleEn:
      "Understand every icon, metric card, and daily action on your dashboard.",
    subtitleId:
      "Pelajari setiap ikon, kartu metrik, dan tombol aksi harian di beranda Anda.",
    badgeEn: "Home Walkthrough",
    badgeId: "Panduan Beranda",
    icon: <Home className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
    themeColor: "blue",
    items: [
      {
        id: "due-card",
        nameEn: "Due Today Counter & Quick Review",
        nameId: "Antrean Jatuh Tempo & Murajaah Kilat",
        badgeEn: "Daily Priority",
        badgeId: "Prioritas Harian",
        icon: <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
        iconBg:
          "bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800",
        descEn:
          "Shows the exact number of Quran pages and flashcards that have reached their calculated memory retention limit today.",
        descId:
          "Menampilkan jumlah tepat halaman Quran dan kartu materi yang telah mencapai batas retensi daya ingat hari ini.",
        functionEn:
          'Clicking "Start Review Session" immediately launches the focused review workflow for today\'s queue.',
        functionId:
          'Menekan "Mulai Sesi Murajaah" langsung membuka alur latihan fokus untuk menyelesaikan antrean hari ini.',
        tipEn:
          "Aim for a clean slate (0 Due) every day to keep your long-term memory permanently locked in.",
        tipId:
          "Usahakan angka jatuh tempo menjadi 0 setiap hari agar hafalan terkunci kuat dalam memori jangka panjang.",
        mockup: (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500 text-white">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Jatuh Tempo Hari Ini
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] font-black">
                7 Materi
              </span>
            </div>
            <div className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl text-center shadow-xs">
              Mulai Sesi Murajaah Kilat
            </div>
          </div>
        ),
      },
      {
        id: "daily-streak",
        nameEn: "Daily Habit Streak Counter",
        nameId: "Indikator Konsistensi Harian (Streak Api)",
        badgeEn: "Habit Engine",
        badgeId: "Konsistensi",
        icon: <Flame className="w-5 h-5 text-orange-500" />,
        iconBg:
          "bg-orange-100 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800",
        descEn:
          "Tracks your daily consecutive practice streak to reinforce the psychological habit of consistent recitation.",
        descId:
          "Mencatat jumlah hari berturut-turut Anda aktif murajaah untuk membangun kebiasaan istiqomah yang tidak putus.",
        functionEn:
          "Automatically increases each day you complete at least one page or card review.",
        functionId:
          "Otomatis bertambah setiap kali Anda menuntaskan minimal 1 halaman atau kartu materi dalam sehari.",
        tipEn:
          "Even 5 minutes of review on busy days protects your hard-earned streak and stops forgetting curves.",
        tipId:
          "Cukup 5 menit murajaah di hari tersibuk Anda untuk menjaga streak tetap menyala dan mencegah kelupaan.",
        mockup: (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
                <Flame className="w-5 h-5 fill-amber-500 text-amber-500 animate-bounce" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Streak Istiqomah
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Aktif tanpa henti
                </p>
              </div>
            </div>
            <span className="text-base font-black text-amber-600 dark:text-amber-400 tabular-nums">
              14 Hari
            </span>
          </div>
        ),
      },
      {
        id: "share-report",
        nameEn: "Progress Report & Certificates",
        nameId: "Bagi Rapor Progres & Cetak Sertifikat",
        badgeEn: "Accountability",
        badgeId: "Akuntabilitas & Berbagi",
        icon: <Share2 className="w-5 h-5 text-blue-500" />,
        iconBg:
          "bg-blue-100 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800",
        descEn:
          "Share live verified progress cards or print certificates to show teachers, parents, or study partners.",
        descId:
          "Bagikan kartu progres terverifikasi atau cetak sertifikat kelancaran ke wali santri, guru, atau rekan belajar.",
        functionEn:
          "Generates shareable read-only links and high-res certificate graphics without requiring login for viewers.",
        functionId:
          "Membuat tautan baca publik yang aman dan sertifikat beresolusi tinggi tanpa memaksa penerima untuk mendaftar.",
        tipEn:
          "Use public links during family updates or quarterly evaluations in your Islamic school.",
        tipId:
          "Gunakan link publik ini saat laporan bulanan halaqah atau evaluasi belajar keluarga.",
        mockup: (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button className="flex-1 py-1.5 px-3 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs">
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagi Rapor</span>
            </button>
            <button className="py-1.5 px-3 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Sertifikat</span>
            </button>
          </div>
        ),
      },
      {
        id: "review-calendar",
        nameEn: "Intelligent Retention Review Calendar",
        nameId: "Kalender Sebaran Beban Murajaah",
        badgeEn: "Forecast & Planning",
        badgeId: "Perencanaan Cerdas",
        icon: <Calendar className="w-5 h-5 text-purple-500" />,
        iconBg:
          "bg-purple-100 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800",
        descEn:
          "A visual heat-map showing how many pages and cards are scheduled for future dates based on your retention ratings.",
        descId:
          "Peta visual yang memproyeksikan berapa banyak materi yang jatuh tempo di hari-hari mendatang.",
        functionEn:
          "Click any date to inspect exactly which pages will be due, allowing you to prepare or balance your schedule.",
        functionId:
          "Klik tanggal mana pun untuk melihat rincian halaman yang dijadwalkan, sehingga beban belajar tidak menumpuk mendadak.",
        tipEn:
          "Dates with darker dots mean heavier review sessions are incoming—plan a bit of extra recitation time ahead.",
        tipId:
          "Tanggal dengan titik pekat menandakan beban murajaah lebih banyak—siapkan waktu luang lebih awal.",
        mockup: (
          <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
            <div className="flex justify-between items-center text-xs font-bold mb-2">
              <span className="text-slate-700 dark:text-slate-300">
                Proyeksi Jadwal Murajaah
              </span>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                Adaptif
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
              {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Ahad"].map((d) => (
                <span key={d} className="text-slate-400 font-medium">
                  {d}
                </span>
              ))}
              {[12, 13, 14, 15, 16, 17, 18].map((d, i) => (
                <div
                  key={d}
                  className={`py-1 rounded-lg font-bold ${i === 2 ? "bg-amber-500 text-slate-950 shadow-xs" : i === 4 ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400"}`}
                >
                  {d}
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: "five-spaces-nav",
        nameEn: "5-Space Unified Navigation",
        nameId: "Bilah Navigasi 5 Ruang Belajar",
        badgeEn: "App Architecture",
        badgeId: "Navigasi Inti",
        icon: <BookOpen className="w-5 h-5 text-blue-500" />,
        iconBg:
          "bg-blue-100 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800",
        descEn:
          "Persistent bar at the bottom: Home, Quran (604 pages), Personal Flashcards, Student Cohorts, and Teaching Studio.",
        descId:
          "Bilah navigasi di bawah layar: Beranda, Mushaf Al-Qur'an, Buku Pribadi, Kelas Santri, dan Ruang Mengajar.",
        functionEn:
          "Switch seamlessly between individual memorization, book flashcards, and group mentoring in one tap.",
        functionId:
          "Berpindah instan antara hafalan Quran mandiri, materi kitab, dan kelas bimbingan dalam satu ketukan.",
        tipEn:
          "Look for the amber badge counter on any tab to see where your attention is needed today.",
        tipId:
          "Perhatikan lencana angka kuning pada ikon tab untuk mengetahui di ruang mana ada materi yang jatuh tempo.",
        mockup: (
          <div className="grid grid-cols-5 gap-1 p-2 bg-slate-900 text-white rounded-2xl text-[10px] text-center font-medium">
            <div className="p-1 rounded-lg bg-blue-600 text-white font-bold flex flex-col items-center">
              <Home className="w-4 h-4" />
              <span>Beranda</span>
            </div>
            <div className="p-1 flex flex-col items-center relative text-slate-400">
              <BookOpen className="w-4 h-4" />
              <span>Al-Qur'an</span>
              <span className="absolute -top-1 right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
                4
              </span>
            </div>
            <div className="p-1 flex flex-col items-center text-slate-400">
              <Library className="w-4 h-4" />
              <span>Pribadi</span>
            </div>
            <div className="p-1 flex flex-col items-center text-slate-400">
              <GraduationCap className="w-4 h-4" />
              <span>Kelas</span>
            </div>
            <div className="p-1 flex flex-col items-center text-slate-400">
              <Users className="w-4 h-4" />
              <span>Mengajar</span>
            </div>
          </div>
        ),
      },
      {
        id: "profile-settings",
        nameEn: "User Profile & Onboarding Settings",
        nameId: "Menu Profil & Kontrol Panduan Halaman",
        badgeEn: "Settings & Control",
        badgeId: "Pengaturan & Kontrol",
        icon: <UserIcon className="w-5 h-5 text-indigo-500" />,
        iconBg:
          "bg-indigo-100 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800",
        descEn:
          "Located at the top right: manage your account, dark mode, language, and customize which page onboarding guides appear.",
        descId:
          "Di pojok kanan atas: kelola akun, mode malam, bahasa, dan atur sakelar panduan onboarding untuk tiap halaman.",
        functionEn:
          "Turn page walkthroughs on/off per section, or replay any guide whenever you need a refresher.",
        functionId:
          "Nyalakan atau matikan panduan per halaman, atau putar ulang panduan kapan saja Anda membutuhkan petunjuk.",
        tipEn:
          "You can disable walkthroughs once you master the gestures and shortcuts.",
        tipId:
          "Anda bebas menonaktifkan panduan setelah Anda menguasai seluruh fungsi tombol dan pintasan.",
        mockup: (
          <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">
                UA
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Profil & Pengaturan
                </p>
                <p className="text-[10px] text-slate-500">
                  Sakelar Panduan Aktif
                </p>
              </div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 font-bold text-[11px] border border-blue-200 dark:border-blue-800">
              Buka Profil
            </span>
          </div>
        ),
      },
    ],
  },

  quran: {
    pageKey: "quran",
    titleEn: "Quran Space Walkthrough",
    titleId: "Panduan Fitur & Antarmuka Al-Qur'an",
    subtitleEn:
      "Learn how to navigate 604 pages, activate Juz, evaluate recitation, and read Mushaf.",
    subtitleId:
      "Pelajari cara navigasi 604 halaman, aktivasi Juz, evaluasi hafalan, dan mushaf offline.",
    badgeEn: "Quran Walkthrough",
    badgeId: "Panduan Al-Qur'an",
    icon: <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
    themeColor: "amber",
    items: [
      {
        id: "quran-filter-tabs",
        nameEn: "Status Filter Tabs (All, Due, Active, Mastered)",
        nameId: "Tab Filter Status Halaman (Semua, Jatuh Tempo, Aktif, Mapan)",
        badgeEn: "Fast Filtering",
        badgeId: "Penyaring Cepat",
        icon: <Filter className="w-5 h-5 text-amber-500" />,
        iconBg:
          "bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800",
        descEn:
          "Allows you to instantly isolate the pages you need to recite right now from pages that are resting comfortably.",
        descId:
          "Menyaring halaman yang wajib dimurajaah hari ini agar Anda tidak pusing mencari di antara 604 halaman.",
        functionEn:
          'Tap "Due Today" to filter down to only pages currently scheduled for review by the retention engine.',
        functionId:
          'Klik tab "Jatuh Tempo" untuk langsung memunculkan hanya halaman-halaman yang waktunya dimurajaah hari ini.',
        tipEn:
          'Keep the filter on "Due Today" during your morning session to finish your revision quickly.',
        tipId:
          'Pasang filter pada "Jatuh Tempo" saat sesi tasmi\' pagi agar Anda langsung fokus menuntaskan target.',
        mockup: (
          <div className="flex gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-2xs">
              Semua
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 shadow-2xs">
              Jatuh Tempo (4)
            </span>
            <span className="px-2.5 py-1 text-slate-500">Aktif (18)</span>
            <span className="px-2.5 py-1 text-slate-500">Mapan (12)</span>
          </div>
        ),
      },
      {
        id: "quran-color-codes",
        nameEn: "Smart Color Codes & Juz Grid",
        nameId: "Navigasi 30 Juz & Kode Warna Halaman",
        badgeEn: "Visual Mapping",
        badgeId: "Status Visual",
        icon: <BookOpen className="w-5 h-5 text-blue-500" />,
        iconBg:
          "bg-blue-100 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800",
        descEn:
          "604 Madinah pages mapped clearly with Surah names and dynamic color borders reflecting memory health.",
        descId:
          "604 halaman mushaf Madinah dengan nama surat dan bingkai warna dinamis yang mencerminkan kesehatan hafalan.",
        functionEn:
          "Amber border = Due today; Green = Mastered/Mapan; Blue = Active & healthy; Gray = Not yet activated.",
        functionId:
          "Bingkai Kuning = Waktunya murajaah; Hijau = Mapan (>30 hari); Biru = Sedang aktif dalam siklus; Abu-abu = Belum aktif.",
        tipEn:
          "Notice the yellow glow on pages—it means review them today before they fade into the forgetting zone.",
        tipId:
          "Segera murajaah halaman berbingkai kuning sebelum ingatan memudar dan butuh usaha lebih berat untuk mengulang.",
        mockup: (
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl border-2 border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-xs">
              <div className="flex justify-between font-bold text-amber-900 dark:text-amber-200">
                <span>Hal. 582</span>
                <span className="text-[10px] bg-amber-500 text-slate-950 px-1 rounded">
                  Jatuh Tempo
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                An-Naba' (1-30)
              </p>
            </div>
            <div className="p-2.5 rounded-xl border border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-xs">
              <div className="flex justify-between font-bold text-emerald-900 dark:text-emerald-200">
                <span>Hal. 1</span>
                <span className="text-[10px] bg-emerald-500 text-white px-1 rounded">
                  Mapan
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                Al-Fatihah (1-7)
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "quran-activate-button",
        nameEn: "Page Activation Toggle",
        nameId: "Tombol Aktivasi Halaman",
        badgeEn: "Load Management",
        badgeId: "Aktivasi Terarah",
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        iconBg:
          "bg-emerald-100 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800",
        descEn:
          'Only pages you actively toggle "Active" will enter your daily schedule. Unmemorized pages stay dormant.',
        descId:
          'Hanya halaman yang Anda klik "Aktifkan" yang akan masuk jadwal harian. Halaman lain tidak akan membebani Anda.',
        functionEn:
          'Clicking "Aktifkan" starts tracking retention; clicking "Nonaktifkan" pauses reviews without losing history.',
        functionId:
          'Klik "Aktifkan" untuk mulai memantau retensi; klik "Nonaktifkan" untuk menjeda tanpa menghapus riwayat hafalan.',
        tipEn:
          "Activate gradually. 5 strong, mutqin pages beat 50 rushed, shaky pages every time.",
        tipId:
          "Aktifkan secara bertahap. 5 halaman mutqin jauh lebih berharga daripada 50 halaman yang berantakan.",
        mockup: (
          <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Status Halaman
              </p>
              <p className="text-[10px] text-slate-500">
                Klik untuk masukkan ke siklus
              </p>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs">
              Aktifkan Halaman
            </button>
          </div>
        ),
      },
      {
        id: "quran-review-actions",
        nameEn: "Two-Button Evaluation (Need Review vs Fluent)",
        nameId: "Tombol Evaluasi (Perlu Murajaah vs Saya Lancar)",
        badgeEn: "Adaptive Engine",
        badgeId: "Penilaian Cepat",
        icon: <RotateCcw className="w-5 h-5 text-rose-500" />,
        iconBg:
          "bg-rose-100 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800",
        descEn:
          "A streamlined 2-button system designed specifically for Quran tasmi' without cognitive friction.",
        descId:
          "Sistem evaluasi 2 tombol yang dirancang khusus untuk tasmi' Quran tanpa kerumitan.",
        functionEn:
          '"Perlu Murajaah" brings the page back tomorrow; "Saya Lancar" doubles or expands the review interval safely.',
        functionId:
          '"Perlu Murajaah" menjadwalkan ulang besok; "Saya Lancar" memperpanjang interval hari ke depan secara aman.',
        tipEn:
          'Be honest: if you had 2 or more stops/hesitations, click "Perlu Murajaah" so the algorithm reinforces it.',
        tipId:
          'Jujurlah: jika tersendat atau lupa lebih dari 2 kali, pilih "Perlu Murajaah" agar sistem memperkuatnya kembali.',
        mockup: (
          <div className="grid grid-cols-2 gap-2">
            <button className="py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Perlu Murajaah</span>
            </button>
            <button className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs">
              <Check className="w-3.5 h-3.5" />
              <span>Saya Lancar (Mutqin)</span>
            </button>
          </div>
        ),
      },
      {
        id: "quran-mushaf-view",
        nameEn: "Eye Icon & High-Res Mushaf Viewer",
        nameId: "Ikon Mata & Pratinjau Mushaf Madinah",
        badgeEn: "Verification",
        badgeId: "Pengecekan Mushaf",
        icon: <Eye className="w-5 h-5 text-indigo-500" />,
        iconBg:
          "bg-indigo-100 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800",
        descEn:
          "Tap the eye icon on any page card to inspect the authentic Madinah Quran layout, ayah borders, and tajwid marks.",
        descId:
          "Ketuk ikon mata pada kartu halaman untuk membuka lembaran mushaf Madinah asli beresolusi tinggi.",
        functionEn:
          "Opens an interactive fullscreen sheet where you can verify ayat without switching to other Quran apps.",
        functionId:
          "Membuka modal lembar mushaf resolusi tinggi untuk memverifikasi ayat tanpa perlu membuka aplikasi lain.",
        tipEn:
          "Recite from memory first, then tap the Eye icon to confirm doubtful harakat or waqaf.",
        tipId:
          "Bacalah dari hafalan terlebih dahulu, lalu buka ikon Mata untuk memeriksa harakat atau waqaf yang diragukan.",
        mockup: (
          <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Eye className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Buka Lembar Mushaf Asli
              </span>
            </div>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300 font-semibold">
              HD Madinah
            </span>
          </div>
        ),
      },
      {
        id: "quran-offline-download",
        nameEn: "Download Juz for Offline Recitation",
        nameId: "Unduh Juz untuk Akses Offline Tanpa Kuota",
        badgeEn: "Offline Access",
        badgeId: "Akses Tanpa Internet",
        icon: (
          <HardDrive className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        ),
        iconBg:
          "bg-teal-100 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800",
        descEn:
          "Pre-cache entire Juz image sets locally so you can recite on trips, in mosques, or during flight mode.",
        descId:
          "Simpan gambar mushaf per juz ke memori browser/perangkat agar tetap bisa murajaah di masjid atau tanpa kuota.",
        functionEn:
          'Tap "Unduh Juz" at the top right of any Juz view to store all 20 pages into local indexed storage.',
        functionId:
          'Klik "Unduh Juz" di bagian atas untuk menyimpan 20 halaman ke penyimpanan perangkat Anda.',
        tipEn:
          "Download your primary active Juz once over Wi-Fi, and it will be permanently available anywhere.",
        tipId:
          "Unduh Juz hafalan aktif Anda saat tersambung Wi-Fi, setelah itu siap dipakai selamanya secara offline.",
        mockup: (
          <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <div>
                <p className="text-xs font-bold text-teal-950 dark:text-teal-100">
                  Status Offline: Tersimpan
                </p>
                <p className="text-[10px] text-teal-700 dark:text-teal-300">
                  20 / 20 Halaman siap diakses
                </p>
              </div>
            </div>
            <span className="px-2 py-1 rounded bg-teal-600 text-white text-[10px] font-bold">
              Tersedia Offline
            </span>
          </div>
        ),
      },
    ],
  },

  personal: {
    pageKey: "personal",
    titleEn: "Personal Space & Flashcard Walkthrough",
    titleId: "Panduan Fitur Materi Pribadi & Kitab",
    subtitleEn:
      "Master structured learning: Books, Chapters, 1-Click Cards, and Active Recall.",
    subtitleId:
      "Kuasai materi hafalan terstruktur: Buku, Bab, Kartu 1-Klik, dan Active Recall.",
    badgeEn: "Personal Walkthrough",
    badgeId: "Panduan Materi Pribadi",
    icon: <Library className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
    themeColor: "indigo",
    items: [
      {
        id: "personal-hierarchy",
        nameEn: "Book → Chapter → Card Hierarchy",
        nameId: "Hierarki Buku → Bab → Kartu Belajar",
        badgeEn: "Deep Organization",
        badgeId: "Struktur Rapi",
        icon: <Library className="w-5 h-5 text-indigo-500" />,
        iconBg:
          "bg-indigo-100 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800",
        descEn:
          "Organize any knowledge domain just like real-world books: Hadith collections, Arabic vocabulary, or jurisprudence.",
        descId:
          "Tata materi ilmu seperti buku sungguhan: Kumpulan Hadits, Matan Tajwid, Kosakata Bahasa Arab, atau Fiqih.",
        functionEn:
          "Create multiple books with custom chapters. Each chapter holds dedicated flashcards with questions and answers.",
        functionId:
          "Buat banyak buku dan bab. Tiap bab memuat kartu flashcard soal dan jawaban yang terstruktur.",
        tipEn:
          "Keep each card focused on a single atomic concept for maximum retention strength.",
        tipId:
          "Buat 1 kartu untuk 1 konsep ringkas agar otak lebih mudah mengingat dan tidak terbebani.",
        mockup: (
          <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
              <Library className="w-4 h-4" />
              <span>Kitab Arbain Nawawi</span>
            </div>
            <div className="pl-4 border-l-2 border-indigo-200 dark:border-indigo-800 text-[11px] text-slate-600 dark:text-slate-400">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Bab 1: Niat & Keikhlasan
              </p>
              <p className="text-[10px] text-slate-500">
                4 Kartu • 1 Jatuh Tempo
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "personal-activation",
        nameEn: "1-Click Card Activation Switch",
        nameId: "Sakelar Aktivasi Kartu 1-Klik",
        badgeEn: "Pacing Control",
        badgeId: "Kontrol Beban",
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        iconBg:
          "bg-emerald-100 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800",
        descEn:
          "Newly created or imported cards remain dormant until you explicitly activate them when ready to learn.",
        descId:
          "Kartu baru yang dibuat atau diimpor tetap nonaktif sampai Anda siap menghafalnya satu per satu.",
        functionEn:
          "Prevents review queues from becoming overwhelmed with hundreds of cards at once.",
        functionId:
          "Mencegah antrean murajaah harian meledak karena ratusan kartu masuk sekaligus.",
        tipEn:
          "Activate 5–10 cards each morning, master them, then activate the next batch.",
        tipId:
          "Aktifkan 5–10 kartu setiap pagi, kuasai dengan lancar, baru tambahkan kelompok kartu berikutnya.",
        mockup: (
          <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Hadits ke-1 (Innamal A'malu bin Niyyat)
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold">
                Siap Diaktivasi
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-xs">
              Aktifkan
            </span>
          </div>
        ),
      },
      {
        id: "personal-four-ratings",
        nameEn: "Active Recall & 4-Level Ratings",
        nameId: "Mode Uji Ingatan & 4 Tombol Rating Retensi",
        badgeEn: "Active Recall",
        badgeId: "Pengujian Ingatan",
        icon: <RotateCcw className="w-5 h-5 text-blue-500" />,
        iconBg:
          "bg-blue-100 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800",
        descEn:
          'Inspect the prompt, recall the answer mentally, tap "Show Answer", then rate: Again, Hard, Good, or Easy.',
        descId:
          'Baca soal, ingat jawabannya di pikiran, klik "Buka Jawaban", lalu pilih: Ulangi, Sulit, Bagus, atau Mudah.',
        functionEn:
          "Each rating precisely recalibrates the interval until this specific card is reviewed again.",
        functionId:
          "Tiap rating memperbarui jadwal kemunculan kartu berikutnya sesuai kekuatan ingatan Anda saat itu.",
        tipEn:
          "Resist the urge to peek at answers immediately—the mental strain of remembering is what builds memory.",
        tipId:
          "Jangan langsung membuka jawaban—usaha mengingat inilah yang menguatkan sel memori di otak.",
        mockup: (
          <div className="grid grid-cols-4 gap-1 text-[11px] font-bold text-center">
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              Ulangi
            </div>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Sulit
            </div>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Bagus
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Mudah
            </div>
          </div>
        ),
      },
      {
        id: "personal-import-library",
        nameEn: "Import JSON/Anki & Public Curated Library",
        nameId: "Impor JSON/Anki & Perpustakaan Kurasi Publik",
        badgeEn: "Expansion",
        badgeId: "Koleksi Cepat",
        icon: <Upload className="w-5 h-5 text-purple-500" />,
        iconBg:
          "bg-purple-100 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800",
        descEn:
          "Load pre-made decks from teachers, or import existing Anki flashcard sets directly via JSON.",
        descId:
          "Ambil kurikulum yang sudah disiapkan pengajar atau impor file flashcard eksternal tanpa mengetik manual.",
        functionEn:
          "Seamlessly adds entire decks with categorized chapters and ready-to-learn flashcards.",
        functionId:
          "Menambahkan satu buku lengkap beserta bab dan soal-jawabannya secara instan ke akun Anda.",
        tipEn:
          "Browse the Public Library tab for popular books like Nawawiyyah or Matan Tuhfatul Athfal.",
        tipId:
          "Buka tab Perpustakaan Publik untuk menemukan materi populer yang telah dirapikan ustadz.",
        mockup: (
          <div className="flex gap-2">
            <button className="flex-1 py-2 px-3 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs">
              <Upload className="w-3.5 h-3.5" />
              <span>Impor JSON</span>
            </button>
            <button className="flex-1 py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5">
              <Library className="w-3.5 h-3.5 text-amber-500" />
              <span>Katalog Publik</span>
            </button>
          </div>
        ),
      },
    ],
  },

  teaching: {
    pageKey: "teaching",
    titleEn: "Teaching Studio Walkthrough",
    titleId: "Panduan Fitur & Antarmuka Ruang Mengajar",
    subtitleEn:
      "Create cohorts, monitor student retention telemetry, and conduct real-time evaluations.",
    subtitleId:
      "Buka halaqah, pantau telemetri retensi santri, dan lakukan tasmi' real-time.",
    badgeEn: "Teaching Walkthrough",
    badgeId: "Panduan Mengajar",
    icon: <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />,
    themeColor: "violet",
    items: [
      {
        id: "create-class-cohort",
        nameEn: "Create Class & Class Code Generator",
        nameId: "Pembuat Kelas & Generator Kode Undangan",
        badgeEn: "Class Setup",
        badgeId: "Manajemen Kelas",
        icon: <Plus className="w-5 h-5 text-violet-500" />,
        iconBg:
          "bg-violet-100 dark:bg-violet-950/60 border-violet-200 dark:border-violet-800",
        descEn:
          "Set up Quran or Book classes, configure assigned Juz/decks, and generate 6-character invite codes.",
        descId:
          "Buka kelas Quran atau Kitab, tentukan juz/kitab wajib, dan buat kode undangan 6 karakter.",
        functionEn:
          "Share the generated code with students so they can join with zero manual clerical overhead.",
        functionId:
          "Cukup bagikan kode tersebut ke grup santri/wali murid untuk pendaftaran otomatis tanpa ribet.",
        tipEn:
          "Create separate classes for different target juz (e.g. Juz 30 vs Juz 29) for clearer telemetry.",
        tipId:
          "Buat kelas terpisah untuk target juz yang berbeda agar pemantauan data lebih rapi dan fokus.",
        mockup: (
          <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Kode Kelas: TAHFIZH-01
              </p>
              <p className="text-[10px] text-slate-500">18 Santri Terdaftar</p>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-violet-600 text-white font-bold text-xs shadow-xs">
              Salin Kode
            </button>
          </div>
        ),
      },
      {
        id: "retention-telemetry",
        nameEn: "Student Memory Retention Telemetry",
        nameId: "Telemetri Retensi & Pantauan Santri",
        badgeEn: "Data Analytics",
        badgeId: "Analitik Retensi",
        icon: <BarChart3 className="w-5 h-5 text-blue-500" />,
        iconBg:
          "bg-blue-100 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800",
        descEn:
          "Monitor live retention rates, daily due counts, and frequently struggling pages across your entire cohort.",
        descId:
          "Pantau tingkat kelancaran, jumlah hafalan jatuh tempo, dan halaman yang sering terlupa pada santri.",
        functionEn:
          "Spot students who are falling behind early, before they completely forget their hard-earned pages.",
        functionId:
          "Deteksi santri yang mulai kendur sebelum hafalannya hilang total, sehingga guru bisa membimbing tepat sasaran.",
        tipEn:
          'Prioritize hearing tasmi\' from students with the highest "Due Today" counter.',
        tipId:
          "Dahulukan menyimak tasmi' dari santri yang memiliki antrean jatuh tempo paling banyak.",
        mockup: (
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Muhammad Raihan
              </span>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                98% Mutqin
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[90%]"></div>
            </div>
          </div>
        ),
      },
      {
        id: "real-time-eval",
        nameEn: "Live Tasmi' Review & Direct Rating",
        nameId: "Evaluasi Tasmi' Langsung & Catatan Guru",
        badgeEn: "Direct Review",
        badgeId: "Penilaian Langsung",
        icon: <PenLine className="w-5 h-5 text-emerald-500" />,
        iconBg:
          "bg-emerald-100 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800",
        descEn:
          "Listen to a student's recitation and rate it: Mutqin, Lancar, or Perlu Ulang with custom tajwid notes.",
        descId:
          "Simak setoran santri dan berikan penilaian: Mutqin, Lancar, atau Perlu Ulang beserta catatan tajwid.",
        functionEn:
          "Directly updates the student's memory engine and recalculates their next review interval immediately.",
        functionId:
          "Langsung memperbarui status retensi di akun santri tersebut dan menjadwalkan murajaah berikutnya.",
        tipEn:
          'Add specific ayah numbers in your feedback note (e.g. "Ayat 14 mad jaiz") so the student knows where to polish.',
        tipId:
          'Sebutkan nomor ayat dalam catatan guru (misal: "Ayat 14 mad jaiz") agar santri tahu letak evaluasinya.',
        mockup: (
          <div className="grid grid-cols-3 gap-1 text-[11px] font-bold text-center">
            <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300">
              Perlu Ulang
            </div>
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
              Cukup
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-xs">
              Lancar Mutqin
            </div>
          </div>
        ),
      },
    ],
  },
};
