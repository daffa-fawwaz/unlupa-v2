import React, { useEffect, useState } from 'react';

export interface LandingNavItem {
  label: string;
  href: string;
}

interface LandingNavbarProps {
  onLogin: () => void;
  onRegister: () => void;
  items?: LandingNavItem[];
}

const DEFAULT_ITEMS: LandingNavItem[] = [
  { label: 'Beranda', href: '#beranda' },
  { label: 'Fitur', href: '#fitur' },
  { label: 'Cara Kerja', href: '#cara-kerja' },
  { label: 'Harga', href: '#harga' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Tentang', href: '#tentang' },
];

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onLogin,
  onRegister,
  items = DEFAULT_ITEMS,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  const handleAnchorClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const target = document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', href);
  };

  useEffect(() => {
    const updateNavbar = () => setIsScrolled(window.scrollY > 18);
    updateNavbar();
    window.addEventListener('scroll', updateNavbar, { passive: true });
    return () => window.removeEventListener('scroll', updateNavbar);
  }, []);

  return (
    <header className={`landing-navbar${isScrolled ? ' landing-navbar--scrolled' : ''}`} aria-label="Navigasi utama">
      <a className="landing-brand" href="#beranda" aria-label="Unlupa — Beranda" onClick={(event) => handleAnchorClick(event, '#beranda')}>
        <span className="landing-brand__mark">
          <img src="/unlupa.logo.png" alt="" />
        </span>
        <span className="landing-brand__name">
          unlupa<span>.id</span>
        </span>
      </a>

      <nav className="landing-navbar__links" aria-label="Navigasi landing page">
        {items.map((item) => (
          <a key={item.href} href={item.href} onClick={(event) => handleAnchorClick(event, item.href)}>
            {item.label}
          </a>
        ))}
      </nav>

      <div className="landing-navbar__actions">
        <button className="landing-button landing-button--ghost" type="button" onClick={onLogin}>
          Login
        </button>
        <button className="landing-button landing-button--primary" type="button" onClick={onRegister}>
          <span className="landing-register-label--full">Daftar sekarang</span>
          <span className="landing-register-label--short">Daftar</span>
        </button>
      </div>
    </header>
  );
};
