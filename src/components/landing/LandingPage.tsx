import React from 'react';
import { useApp } from '../../context/AppContext';
import { LandingHero } from './LandingHero';
import { LandingNavbar } from './LandingNavbar';
import { FeaturesSection } from './features';
import { AnalyticsSection } from './analytics';
import { PricingSection } from './pricing';
import './landing.css';

export const LandingPage: React.FC = () => {
  const { openLoginModal, openRegisterModal } = useApp();

  return (
    <main className="landing-page">
      <LandingNavbar onLogin={openLoginModal} onRegister={openRegisterModal} />
      <LandingHero onGetStarted={openRegisterModal} />
      <FeaturesSection />
      <AnalyticsSection />
      <PricingSection onGetStarted={openRegisterModal} />
    </main>
  );
};
