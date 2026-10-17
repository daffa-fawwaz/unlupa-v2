import React from 'react';
import {
  CalendarCheck2,
  CalendarClock,
  Clock,
  GraduationCap,
  LibraryBig,
  ListChecks,
  LucideIcon,
  Repeat,
  Route,
  TrendingUp,
} from 'lucide-react';
import { StepCard, StepAccent } from './StepCard';
import { GrowthVisual, MushafVisual, QueueVisual, ScheduleVisual } from './StepVisuals';
import './how-it-works.css';

interface Step {
  icon: LucideIcon;
  metaIcon: LucideIcon;
  title: string;
  description: string;
  meta: string;
  accent: StepAccent;
  visual: React.ReactNode;
}

const STEPS: Step[] = [
  {
    icon: LibraryBig,
    metaIcon: ListChecks,
    title: 'Siapkan hafalan',
    description:
      'Daftarkan hafalan dari Mushaf Madinah 604 halaman, lalu susun materi dari kitab, matan, atau buku yang sedang Anda pelajari.',
    meta: 'Mushaf & semua materi',
    accent: 'orange',
    visual: <MushafVisual />,
  },
  {
    icon: CalendarCheck2,
    metaIcon: Clock,
    title: 'Murajaah dengan arah',
    description:
      'Setiap hari Daily Review menyiapkan antrean hafalan yang paling perlu dijaga, sehingga Anda tidak perlu menebak mulai dari mana.',
    meta: 'Antrean prioritas harian',
    accent: 'blue',
    visual: <QueueVisual />,
  },
  {
    icon: CalendarClock,
    metaIcon: Repeat,
    title: 'Jadwal menyesuaikan',
    description:
      'Setiap hasil review menentukan kapan sebuah materi muncul kembali, sehingga waktu murajaah terbagi lebih merata dan terarah.',
    meta: 'Interval yang adaptif',
    accent: 'violet',
    visual: <ScheduleVisual />,
  },
  {
    icon: GraduationCap,
    metaIcon: TrendingUp,
    title: 'Tumbuh bersama guru',
    description:
      'Guru dapat menyimak, memberi penilaian, dan memantau perkembangan hafalan santri langsung dari satu ruang halaqah.',
    meta: 'Halaqah & laporan',
    accent: 'emerald',
    visual: <GrowthVisual />,
  },
];

export const HowItWorksSection: React.FC = () => (
  <section className="landing-how" id="cara-kerja" aria-labelledby="how-title">
    <div className="landing-how__heading">
      <span><Route aria-hidden="true" /> Cara kerja</span>
      <h2 id="how-title">
        Empat langkah menjaga hafalan.
        <strong>Terarah sejak review pertama.</strong>
      </h2>
      <p>Alur yang sederhana dijalankan, namun konsisten menjaga setiap hafalan yang Anda miliki.</p>
    </div>

    <div className="landing-how__grid">
      {STEPS.map((step, index) => (
        <StepCard key={step.title} step={index + 1} {...step} />
      ))}
    </div>
  </section>
);
