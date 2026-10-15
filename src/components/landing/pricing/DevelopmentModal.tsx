import React, { useEffect } from 'react';
import { BellRing, Construction, X } from 'lucide-react';

interface DevelopmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevelopmentModal: React.FC<DevelopmentModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="pricing-development" role="dialog" aria-modal="true" aria-labelledby="development-title">
      <button className="pricing-development__backdrop" type="button" onClick={onClose} aria-label="Tutup modal" />
      <div className="pricing-development__shell">
        <div className="pricing-development__dialog">
          <button className="pricing-development__close" type="button" onClick={onClose} aria-label="Tutup">
            <X aria-hidden="true" />
          </button>
          <span className="pricing-development__icon"><Construction aria-hidden="true" /></span>
          <span className="pricing-development__eyebrow">Premium Unlupa</span>
          <h2 id="development-title">Sedang kami persiapkan.</h2>
          <p>
            Paket Premium masih dalam tahap pengembangan agar pengalaman pembayaran
            dan seluruh fitur lanjutannya siap digunakan dengan aman.
          </p>
          <div className="pricing-development__notice">
            <BellRing aria-hidden="true" />
            <span>Kami akan mengumumkannya saat Premium tersedia.</span>
          </div>
          <button className="pricing-development__action" type="button" onClick={onClose}>Mengerti</button>
        </div>
      </div>
    </div>
  );
};
