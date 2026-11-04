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
  const { openLoginModal, openRegisterModal, currentUser, userProfile, setIsLandingPageOpen } = useApp();

  const isLoggedIn = Boolean(currentUser || (userProfile && userProfile.id !== 'guest'));

  const handleOpenApp = () => {
    try {
      sessionStorage.setItem('unlupa_in_app', 'true');
      window.location.hash = 'app';
    } catch {}
    setIsLandingPageOpen(false);
  };

  return (
    <main className="landing-page">
      <LandingNavbar
        onLogin={openLoginModal}
        onRegister={openRegisterModal}
        onOpenApp={handleOpenApp}
        isLoggedIn={isLoggedIn}
      />
      <LandingHero onGetStarted={isLoggedIn ? handleOpenApp : openRegisterModal} />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection onGetStarted={isLoggedIn ? handleOpenApp : openRegisterModal} />
      <FAQSection onGetStarted={isLoggedIn ? handleOpenApp : openRegisterModal} onLogin={isLoggedIn ? handleOpenApp : openLoginModal} />
      <LandingFooter />
    </main>
  );
};
