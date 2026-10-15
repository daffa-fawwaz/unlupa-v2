import React from 'react';
import { Sparkles } from 'lucide-react';
import { FSRSSimulatorCard } from './FSRSSimulatorCard';
import { ReviewAnalyticsCard } from './ReviewAnalyticsCard';
import './analytics.css';

export const AnalyticsSection: React.FC = () => (
  <section className="landing-analytics" id="cara-kerja" aria-labelledby="analytics-title">
    <div className="landing-analytics__heading">
      <span><Sparkles aria-hidden="true" /> Analytics &amp; FSRS</span>
      <h2 id="analytics-title">
        Pahami ritme hafalan.
        <strong>Simulasikan langkah berikutnya.</strong>
      </h2>
      <p>Data yang mudah dibaca membantu Anda memilih murajaah yang tepat, pada waktu yang tepat.</p>
    </div>

    <div className="landing-analytics__grid">
      <ReviewAnalyticsCard />
      <FSRSSimulatorCard />
    </div>
  </section>
);
