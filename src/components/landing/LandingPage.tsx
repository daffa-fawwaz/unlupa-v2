import React from 'react';
import { useApp } from '../../context/AppContext';
import { LandingHero } from './LandingHero';
import { LandingNavbar } from './LandingNavbar';
import { FeaturesSection } from './features';
import { HowItWorksSection } from './how-it-works';
import { PricingSection } from './pricing';
import { FAQSection } from './faq';
import { LandingFooter } from './footer';
import './landing.css';
import './landing-polish.css';

export const LandingPage: React.FC = () => {
  const { openLoginModal, openRegisterModal } = useApp();

  return (
    <main className="landing-page">
      <LandingNavbar onLogin={openLoginModal} onRegister={openRegisterModal} />
      <LandingHero onGetStarted={openRegisterModal} />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection onGetStarted={openRegisterModal} />
      <FAQSection onGetStarted={openRegisterModal} onLogin={openLoginModal} />
      <LandingFooter />
    </main>
  );
};
