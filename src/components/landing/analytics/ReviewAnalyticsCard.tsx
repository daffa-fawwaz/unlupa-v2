import React, { useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

const WEEK_DATA = [42, 58, 36, 82, 64, 74, 48];
const MONTH_DATA = [54, 68, 76, 61, 88, 72, 94];
const LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ahd'];

export const ReviewAnalyticsCard: React.FC = () => {
  const [range, setRange] = useState<'week' | 'month'>('week');
  const values = range === 'week' ? WEEK_DATA : MONTH_DATA;

  return (
    <article className="analytics-card">
      <div className="analytics-card__icon analytics-card__icon--blue">
        <BarChart3 aria-hidden="true" />
      </div>
      <h3>Analytics Review</h3>
      <p>Lihat ritme murajaah, tingkat penyelesaian, dan retensi hafalan dalam satu tampilan.</p>

      <div className="review-chart">
        <div className="review-chart__header">
          <div>
            <span>Review diselesaikan</span>
            <strong>{range === 'week' ? '48' : '186'}</strong>
            <small><TrendingUp aria-hidden="true" /> +12,4%</small>
          </div>
          <div className="review-chart__range" aria-label="Rentang analytics">
            <button type="button" className={range === 'week' ? 'is-active' : ''} onClick={() => setRange('week')}>7 hari</button>
            <button type="button" className={range === 'month' ? 'is-active' : ''} onClick={() => setRange('month')}>30 hari</button>
          </div>
        </div>

        <div className="review-chart__plot" aria-label="Grafik review mingguan">
          {values.map((value, index) => (
            <div className="review-chart__column" key={LABELS[index]}>
              <div className="review-chart__bar-track">
                <span
                  className={value === Math.max(...values) ? 'is-peak' : ''}
                  style={{ height: `${value}%` }}
                  title={`${value}% target tercapai`}
                />
              </div>
              <small>{LABELS[index]}</small>
            </div>
          ))}
        </div>

        <div className="review-chart__summary">
          <span><i className="is-orange" />12 <small>Due hari ini</small></span>
          <span><i className="is-blue" />48 <small>Selesai</small></span>
          <span><i className="is-green" />94% <small>Retensi</small></span>
        </div>
      </div>
    </article>
  );
};
