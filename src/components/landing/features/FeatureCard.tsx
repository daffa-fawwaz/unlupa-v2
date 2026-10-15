import React from 'react';
import { ArrowUpRight, LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: 'orange' | 'blue' | 'violet' | 'emerald' | 'amber';
  href?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  accent,
  href = '#beranda',
}) => (
  <article className="landing-feature-card">
    <span className={`landing-feature-card__icon landing-feature-card__icon--${accent}`}>
      <Icon aria-hidden="true" />
    </span>
    <div className="landing-feature-card__content">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
    <a className="landing-feature-card__link" href={href}>
      Pelajari fitur
      <ArrowUpRight aria-hidden="true" />
    </a>
  </article>
);
