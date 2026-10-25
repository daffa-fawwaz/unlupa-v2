import React from 'react';
import { ArrowRight, Check, X } from 'lucide-react';

interface PricingFeature {
  label: string;
  included?: boolean;
}

interface PricingCardProps {
  name: string;
  description: string;
  price: string;
  suffix?: string;
  features: PricingFeature[];
  highlighted?: boolean;
  badge?: string;
  footnote?: string;
  actionLabel: string;
  onAction: () => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  name,
  description,
  price,
  suffix,
  features,
  highlighted = false,
  badge,
  footnote,
  actionLabel,
  onAction,
}) => (
  <article className={`pricing-card${highlighted ? ' pricing-card--highlighted' : ''}`}>
    {badge && <span className="pricing-card__badge">{badge}</span>}
    <header>
      <h3>{name}</h3>
      <p>{description}</p>
    </header>
    <div className="pricing-card__price">
      <strong>{price}</strong>
      {suffix && <span>{suffix}</span>}
    </div>
    <ul>
      {features.map((feature) => (
        <li className={feature.included === false ? 'is-muted' : ''} key={feature.label}>
          <span>{feature.included === false ? <X aria-hidden="true" /> : <Check aria-hidden="true" />}</span>
          {feature.label}
        </li>
      ))}
    </ul>
    {footnote && <p className="pricing-card__footnote">{footnote}</p>}
    <button type="button" onClick={onAction}>
      {actionLabel}
      <ArrowRight aria-hidden="true" />
    </button>
  </article>
);
