import React from 'react';
import { LucideIcon } from 'lucide-react';

export type StepAccent = 'orange' | 'blue' | 'violet' | 'emerald';

interface StepCardProps {
  step: number;
  icon: LucideIcon;
  metaIcon: LucideIcon;
  title: string;
  description: string;
  meta: string;
  accent: StepAccent;
  visual: React.ReactNode;
}

export const StepCard: React.FC<StepCardProps> = ({
  step,
  icon: Icon,
  metaIcon: MetaIcon,
  title,
  description,
  meta,
  accent,
  visual,
}) => (
  <article className={`step-card step-card--${accent}`}>
    <div className="step-card__visual" aria-hidden="true">
      {visual}
    </div>
    <div className="step-card__content">
      <div className="step-card__head">
        <span className="step-card__icon">
          <Icon aria-hidden="true" />
        </span>
        <span className="step-card__step">Langkah {String(step).padStart(2, '0')}</span>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="step-card__meta">
        <MetaIcon aria-hidden="true" />
        {meta}
      </span>
    </div>
  </article>
);
