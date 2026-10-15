import React, { useState } from 'react';
import { BrainCircuit } from 'lucide-react';

const RESULTS = {
  again: { label: 'Lupa', interval: '1 hari', stability: '2,1', retention: 38, color: '#ef4444' },
  hard: { label: 'Sulit', interval: '4 hari', stability: '8,4', retention: 64, color: '#f59e0b' },
  good: { label: 'Lancar', interval: '12 hari', stability: '24,8', retention: 88, color: '#4e89ff' },
  easy: { label: 'Mudah', interval: '28 hari', stability: '51,2', retention: 96, color: '#10b981' },
} as const;

type RatingKey = keyof typeof RESULTS;

export const FSRSSimulatorCard: React.FC = () => {
  const [rating, setRating] = useState<RatingKey>('good');
  const result = RESULTS[rating];
  const arcLength = 251.2;
  const dashOffset = arcLength - (arcLength * result.retention) / 100;

  return (
    <article className="analytics-card">
      <div className="analytics-card__icon analytics-card__icon--violet">
        <BrainCircuit aria-hidden="true" />
      </div>
      <h3>Simulasi FSRS</h3>
      <p>Coba hasil review dan lihat bagaimana FSRS menyusun interval berdasarkan kekuatan memori.</p>

      <div className="fsrs-simulator" style={{ '--fsrs-color': result.color } as React.CSSProperties}>
        <div className="fsrs-simulator__topline">
          <span>Prediksi jadwal berikutnya</span>
          <strong>Target retensi 92%</strong>
        </div>

        <div className="fsrs-gauge">
          <svg viewBox="0 0 200 112" role="img" aria-label={`Kekuatan memori ${result.retention}%`}>
            <path className="fsrs-gauge__track" d="M 20 100 A 80 80 0 0 1 180 100" pathLength="251.2" />
            <path className="fsrs-gauge__value" d="M 20 100 A 80 80 0 0 1 180 100" pathLength="251.2" style={{ strokeDashoffset: dashOffset }} />
          </svg>
          <div className="fsrs-gauge__value-label">
            <small>Kekuatan memori</small>
            <strong>{result.retention}%</strong>
          </div>
        </div>

        <div className="fsrs-simulator__metrics">
          <span><small>Hasil review</small><strong>{result.label}</strong></span>
          <span><small>Stabilitas</small><strong>{result.stability} hari</strong></span>
          <span><small>Review lagi</small><strong>{result.interval}</strong></span>
        </div>

        <div className="fsrs-simulator__ratings" aria-label="Pilih hasil simulasi review">
          {(Object.keys(RESULTS) as RatingKey[]).map((key) => (
            <button key={key} type="button" className={rating === key ? 'is-active' : ''} onClick={() => setRating(key)}>
              {RESULTS[key].label}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
};
