import React from 'react';
import {
  BrainCircuit,
  CalendarCheck2,
  GraduationCap,
  LibraryBig,
  Sparkles,
} from 'lucide-react';
import { FeatureCard } from './FeatureCard';
import './features.css';

const FEATURES = [
  {
    icon: LibraryBig,
    title: "Ruang Hafalan Al-Qur'an",
    description: 'Kelola hafalan berdasarkan 604 halaman Mushaf Madinah dan lihat progres setiap lembar dengan jelas.',
    accent: 'orange' as const,
  },
  {
    icon: CalendarCheck2,
    title: 'Daily Review',
    description: 'Buka satu antrean murajaah harian yang diprioritaskan berdasarkan hafalan yang paling perlu dijaga.',
    accent: 'blue' as const,
  },
  {
    icon: BrainCircuit,
    title: 'FSRS Adaptif',
    description: 'Dapatkan jadwal pengulangan yang menyesuaikan kekuatan daya ingat, bukan sekadar kalender tetap.',
    accent: 'violet' as const,
  },
  {
    icon: Sparkles,
    title: 'Ruang Buku & Kitab',
    description: 'Ubah materi, matan, dan catatan belajar menjadi kartu aktif yang lebih mudah diingat dalam jangka panjang.',
    accent: 'amber' as const,
  },
  {
    icon: GraduationCap,
    title: 'Halaqah & Monitoring',
    description: 'Hubungkan guru dan santri untuk menyimak hafalan, memberi evaluasi, serta memantau perkembangan.',
    accent: 'emerald' as const,
  },
];

export const FeaturesSection: React.FC = () => (
  <section className="landing-features" id="fitur" aria-labelledby="features-title">
    <div className="landing-features__heading">
      <span>Fitur utama Unlupa</span>
      <h2 id="features-title">
        Semua yang dibutuhkan.
        <strong>Tanpa yang tidak perlu.</strong>
      </h2>
      <p>
        Satu ruang yang tenang untuk menambah hafalan, menjaga yang lama,
        dan memahami apa yang perlu diulang berikutnya.
      </p>
    </div>

    <div className="landing-features__grid">
      <FeatureCard {...FEATURES[0]} />
      <div className="landing-features-showcase" aria-label="Pratinjau dashboard Unlupa">
        <div className="landing-features-showcase__inner">
          <div className="landing-features-showcase__orb" aria-hidden="true" />
          <div className="landing-features-showcase__label">
            <span>Retensi terjaga</span>
            <strong>Daily Review</strong>
          </div>
          <img src="/mockups/mockup-main.png" alt="Dashboard murajaah harian Unlupa" />
        </div>
      </div>
      <FeatureCard {...FEATURES[1]} />
      <FeatureCard {...FEATURES[2]} />
      <FeatureCard {...FEATURES[3]} />
      <FeatureCard {...FEATURES[4]} />
    </div>

    <a className="landing-features__cta" href="#beranda">
      Jelajahi semua fitur
      <span aria-hidden="true">→</span>
    </a>
  </section>
);
