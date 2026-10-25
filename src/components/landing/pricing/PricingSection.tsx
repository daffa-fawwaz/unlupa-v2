import React, { useState } from 'react';
import { BadgeDollarSign } from 'lucide-react';
import { PricingCard } from './PricingCard';
import { DevelopmentModal } from './DevelopmentModal';
import './pricing.css';

interface PricingSectionProps {
  onGetStarted: () => void;
}

const FREE_FEATURES = [
  { label: '3 buku dan 50 kartu per buku' },
  { label: '3 Juz Al-Qur’an aktif' },
  { label: 'Daily Review & jadwal adaptif' },
  { label: '3 generasi AI per hari' },
  { label: 'Ekspor laporan', included: false },
];

const PREMIUM_FEATURES = [
  { label: 'Buku dan kartu tanpa batas' },
  { label: 'Aktivasi seluruh 30 Juz' },
  { label: '30 generasi AI per hari' },
  { label: 'Smart Extractor & laporan' },
  { label: 'Kelas dan rekaman tanpa batas' },
];

export const PricingSection: React.FC<PricingSectionProps> = ({ onGetStarted }) => {
  const [isDevelopmentOpen, setIsDevelopmentOpen] = useState(false);

  return (
    <section className="landing-pricing" id="harga" aria-labelledby="pricing-title">
      <div className="landing-pricing__heading">
        <span><BadgeDollarSign aria-hidden="true" /> Pilihan paket</span>
        <h2 id="pricing-title">Mulai sederhana.<strong>Tumbuh bersama hafalan.</strong></h2>
        <p>Pilih ruang belajar sesuai kebutuhan pribadi, pengajar, atau lembaga Anda.</p>
      </div>

      <div className="landing-pricing__grid">
        <PricingCard name="Free" description="Untuk memulai kebiasaan murajaah." price="Gratis" features={FREE_FEATURES} actionLabel="Mulai gratis" onAction={onGetStarted} />
        <PricingCard
          name="Premium"
          description="Untuk hafalan dan pembelajaran tanpa batas."
          price="Sukarela"
          suffix="seikhlasnya"
          features={PREMIUM_FEATURES}
          highlighted
          badge="Paling diminati"
          footnote="Bantu dukung proyek ini agar Unlupa tetap gratis dan terus berkembang."
          actionLabel="Dukung Proyek Ini"
          onAction={() => setIsDevelopmentOpen(true)}
        />
      </div>
      <DevelopmentModal isOpen={isDevelopmentOpen} onClose={() => setIsDevelopmentOpen(false)} />
    </section>
  );
};
