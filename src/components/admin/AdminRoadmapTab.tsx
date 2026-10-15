import React from "react";
import {
  Compass,
  CheckCircle2,
  Clock,
  Cpu,
  CreditCard,
  ShieldCheck,
  BookCheck,
  ArrowRight,
  Layers,
  TrendingUp,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export const AdminRoadmapTab: React.FC = () => {
  const { language } = useApp();

  const roadmapItems = [
    {
      title: "Laporan Rapor Fisik (Cetak PDF / Excel)",
      category: "Analitik & Edukasi",
      status: "planned",
      statusLabel: "Direncanakan",
      description:
        "Fitur ekspor satu klik untuk mengunduh laporan bulanan santri (halaman lancar, retensi memori, dan umpan balik guru) ke format PDF atau Excel siap cetak yang ditujukan untuk orang tua murid.",
      icon: <Layers className="w-5 h-5 text-emerald-500" />,
      features: [
        "Desain template rapor PDF profesional",
        "Rekap otomatis dari data hafalan harian",
        "Tanda tangan digital guru pengampu",
        "Ekspor massal (Batch Export) per kelas",
      ],
    },
    {
      title: "Integrasi Audio Murattal",
      category: "Media & Aksesibilitas",
      status: "planned",
      statusLabel: "Direncanakan",
      description:
        "Pemutar suara Qari' terintegrasi langsung di layar muraja'ah bagi pembelajar auditori untuk memutar audio per ayat atau halaman yang sedang difokuskan.",
      icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />,
      features: [
        "Pemilihan Qari' (Mishary Rashid, Al-Husary, dll)",
        "Pemutaran per ayat atau halaman penuh",
        "Pengaturan kecepatan audio (Playback speed)",
        "Caching lokal untuk hemat kuota",
      ],
    },
    {
      title: "Dashboard Analitik Kelas Lanjutan",
      category: "Data Visualisasi",
      status: "planned",
      statusLabel: "Direncanakan",
      description:
        "Grafik visual interaktif (Pie chart, Bar chart) pada ruang kelas untuk memberikan gambaran kesehatan hafalan kelas, rata-rata umur retensi, dan progres target keseluruhan.",
      icon: <TrendingUp className="w-5 h-5 text-purple-500" />,
      features: [
        "Grafik distribusi hafalan santri",
        "Peta panas (Heatmap) kelas gabungan",
        "Notifikasi anomali jika banyak santri yang lupa halaman tertentu",
      ],
    },
    {
      title: "AI Speech & Recitation Evaluator (Evaluasi Hafalan Suara)",
      category: "AI Multimodal & Voice",
      status: "architecture_ready",
      statusLabel: "Arsitektur Siap (Roadmap Lanjutan)",
      description:
        "Fitur perekaman suara pada flashcard (Al-Qur'an dan materi umum) di mana AI mendengarkan bacaan santri, menganalisis ketepatan pelafalan/tajwid, dan menentukan status benar/salah secara otomatis.",
      icon: <Cpu className="w-5 h-5 text-amber-500" />,
      features: [
        "MediaRecorder API terintegrasi di setiap sesi ulas flashcard",
        "Analisis audio real-time menggunakan model Gemini Flash Multimodal",
        "Scoring otomatis: Mutqin, Cukup, atau Perlu Ulang",
        "Sinkronisasi langsung dengan mesin retensi cerdas & laporan harian",
      ],
    },
    {
      title: "Automated Payment Gateway & Marketplace Perpus",
      category: "Monetisasi & Transaksi",
      status: "architecture_ready",
      statusLabel: "Arsitektur Siap (Roadmap Lanjutan)",
      description:
        "Integrasi payment gateway otomatis (Midtrans/Xendit/QRIS instan) untuk pembelian kitab berbayar di marketplace perpustakaan dengan pembagian royalti kreator secara otomatis (85% kreator, 15% platform).",
      icon: <CreditCard className="w-5 h-5 text-indigo-500" />,
      features: [
        "Generator Invoice & VA Otomatis 24 Jam",
        "Pencatatan Ledger Keuangan & Histori Transaksi Pengguna",
        "Dashboard Royalti Penulis & Pencairan Saldo Kreator",
        "Mode Uji Coba / Sandbox saat ini untuk kemudahan testing",
      ],
    },
    {
      title: "AI Automated Book Curation & Review System",
      category: "Kurasi & Publikasi",
      status: "planning",
      statusLabel: "Dalam Perencanaan",
      description:
        "Sistem kurasi otomatis menggunakan AI untuk memvalidasi buku/kitab yang dipublikasikan oleh kreator di perpustakaan publik, memastikan format Q&A dan kualitas materi memenuhi standar sebelum tayang.",
      icon: <BookCheck className="w-5 h-5 text-purple-500" />,
      features: [
        "Validasi struktur Bab dan Kartu Q&A secara instan",
        "Pendeteksian konten duplikat atau kurang layak",
        "Sistem persetujuan 1-Klik bagi Admin",
      ],
    },
    {
      title: "Freemium & Institutional Tier Enforcement",
      category: "Sistem Kuota & Akses",
      status: "active",
      statusLabel: "Aktif (Free-First Strategy)",
      description:
        "Pemisahan batasan antara akun Free dan Pro (Mushaf 30 Juz, AI Builder tanpa batas, dan manajemen kelas). Saat ini seluruh fitur digratiskan untuk pengujian publik sebelum monetisasi penuh diaktifkan.",
      icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
      features: [
        "Gatekeeper Kuota (Buku, Kartu, AI Generator, Juz Qur'an)",
        "Modal Upgrade & Alur Simulasi Pembayaran Pro",
        "Manajemen Profil & Status Akun Real-time",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-amber-500/10 border border-indigo-100 dark:border-indigo-950/60 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-black tracking-wider uppercase">
            <Compass className="w-3.5 h-3.5" />
            <span>Unlupa.id Vision & Roadmap</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {language === "en"
              ? "Product Development Roadmap"
              : "Roadmap Pengembangan Produk"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
            Catatan arsitektur dan tahapan pengembangan lanjutan Unlupa.id.
            Untuk tahap awal, sistem inti digratiskan untuk mengumpulkan umpan
            balik (*feedback*) masyarakat, sementara arsitektur kompleks telah
            dipersiapkan sepenuhnya untuk rilis bertahap.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roadmapItems.map((item, index) => (
          <div
            key={index}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xs">
                  {item.icon}
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                    item.status === "active"
                      ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60"
                      : item.status === "architecture_ready"
                        ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60"
                        : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200/60"
                  }`}
                >
                  {item.statusLabel}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {item.category}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Komponen Utama & Spesifikasi:
                </span>
                <ul className="space-y-1.5">
                  {item.features.map((feat, fIdx) => (
                    <li
                      key={fIdx}
                      className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800">
              <span>Status Arsitektur: Siap diimplementasikan</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                Phase {index + 1}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
