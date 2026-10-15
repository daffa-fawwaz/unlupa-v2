import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Youtube,
} from 'lucide-react';
import './footer.css';

const FOOTER_LINKS = {
  Produk: [
    { label: 'Fitur', href: '#fitur' },
    { label: 'Cara Kerja', href: '#cara-kerja' },
    { label: 'Harga', href: '#harga' },
  ],
  Bantuan: [
    { label: 'FAQ', href: '#faq' },
    { label: 'Privasi', href: '#tentang' },
    { label: 'Ketentuan', href: '#tentang' },
  ],
};

export const LandingFooter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    setIsSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="landing-footer">
      <div className="landing-footer__top">
        <div className="landing-footer__identity">
          <a href="#beranda" className="landing-footer__brand" aria-label="Unlupa — kembali ke atas">
            <span><img src="/unlupa.logo.png" alt="" /></span>
            <strong>unlupa<span>.id</span></strong>
          </a>
          <p>Ruang untuk menjaga hafalan Al-Qur'an, kitab, dan ilmu agar tetap hidup dalam ingatan.</p>
        </div>

        <div className="landing-footer__newsletter">
          <h2>Tetap terhubung</h2>
          <p>Dapatkan kabar fitur dan panduan murajaah terbaru.</p>
          <form onSubmit={handleSubscribe}>
            <label>
              <span className="sr-only">Alamat email</span>
              <Mail aria-hidden="true" />
              <input type="email" required value={email} onChange={(event) => { setEmail(event.target.value); setIsSubscribed(false); }} placeholder="Alamat email Anda" />
            </label>
            <button type="submit">
              {isSubscribed ? <><Check aria-hidden="true" /> Tersimpan</> : <>Berlangganan <ArrowRight aria-hidden="true" /></>}
            </button>
          </form>
        </div>
      </div>

      <div className="landing-footer__divider" />

      <div className="landing-footer__bottom">
        <div className="landing-footer__community">
          <div className="landing-footer__socials" aria-label="Media sosial Unlupa">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram /></a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook /></a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube /></a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin /></a>
          </div>
          <p>© {new Date().getFullYear()} Unlupa.id. Seluruh hak cipta dilindungi.</p>
        </div>

        <div className="landing-footer__links">
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3>{title}</h3>
              {links.map((link) => <a key={link.label} href={link.href}>{link.label}</a>)}
            </div>
          ))}
          <div className="landing-footer__contact">
            <h3>Kontak</h3>
            <a href="mailto:halo@unlupa.id"><Mail aria-hidden="true" /> halo@unlupa.id</a>
            <span><MapPin aria-hidden="true" /> Indonesia</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
