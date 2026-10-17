import React, { useRef } from "react";
import {
  ArrowRight,
  BrainCircuit,
  CalendarCheck2,
  LibraryBig,
  Sparkles,
} from "lucide-react";

interface LandingHeroProps {
  onGetStarted: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onGetStarted }) => {
  const heroRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || !heroRef.current) return;
    const bounds = heroRef.current.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    heroRef.current.style.setProperty(
      "--hero-card-x",
      `${(x * 14).toFixed(2)}px`,
    );
    heroRef.current.style.setProperty(
      "--hero-card-y",
      `${(y * 10).toFixed(2)}px`,
    );
  };

  const resetPointer = () => {
    heroRef.current?.style.setProperty("--hero-card-x", "0px");
    heroRef.current?.style.setProperty("--hero-card-y", "0px");
  };

  return (
    <div
      ref={heroRef}
      className="landing-hero"
      id="beranda"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
    >
      <div className="landing-hero__copy">
        <div className="landing-eyebrow">
          <Sparkles aria-hidden="true" />
          <span>Murajaah lebih terarah</span>
        </div>

        <h1>
          Hafalan baru bertambah.
          <span>Hafalan lama masih sempat dijaga?</span>
        </h1>

        <p>
          Jaga hafalan tetap hidup dengan ruang hafalan yang rapi dan
          <strong> Daily Review</strong> yang membantu menentukan apa yang perlu
          diulang hari ini.
        </p>

        <div className="landing-hero__actions">
          <button
            className="landing-button landing-button--hero-primary"
            type="button"
            onClick={onGetStarted}
          >
            Mulai jaga hafalan
            <ArrowRight aria-hidden="true" />
          </button>
          <a
            className="landing-button landing-button--hero-secondary"
            href="#fitur"
          >
            Lihat cara kerjanya
          </a>
        </div>
      </div>

      <div className="landing-mockups" aria-label="Pratinjau aplikasi Unlupa">
        <div className="landing-mockups__glow" aria-hidden="true" />
        <div className="landing-mockup-note landing-mockup-note--left">
          <span className="landing-mockup-note__icon landing-mockup-note__icon--orange">
            <LibraryBig aria-hidden="true" />
          </span>
          <span className="landing-mockup-note__copy">
            <strong>Ruang Hafalan</strong>
            <small>Al-Qur'an &amp; kitab</small>
          </span>
          <span className="landing-mockup-note__status" aria-hidden="true" />
        </div>
        <div className="landing-mockup-note landing-mockup-note--right">
          <span className="landing-mockup-note__icon landing-mockup-note__icon--blue">
            <CalendarCheck2 aria-hidden="true" />
          </span>
          <span className="landing-mockup-note__copy">
            <strong>Daily Review</strong>
            <small>Prioritas hari ini</small>
          </span>
          <span className="landing-mockup-note__status" aria-hidden="true" />
        </div>
        <div className="landing-mockup-note landing-mockup-note--upper">
          <span className="landing-mockup-note__icon landing-mockup-note__icon--violet">
            <BrainCircuit aria-hidden="true" />
          </span>
          <span className="landing-mockup-note__copy">
            <strong>Jadwal Adaptif</strong>
            <small>Jadwal sesuai daya ingat</small>
          </span>
          <span className="landing-mockup-note__status" aria-hidden="true" />
        </div>
        <img
          className="landing-mockup landing-mockup--secondary"
          src="/mockups/mockup-secondary.png"
          alt="Tampilan ruang peringkat Unlupa"
        />
        <img
          className="landing-mockup landing-mockup--main"
          src="/mockups/mockup-main.png"
          alt="Tampilan dashboard dan Daily Review Unlupa"
        />
        <img
          className="landing-mockup landing-mockup--tertiary"
          src="/mockups/mockup-tertiary.png"
          alt="Tampilan flashcard hafalan Unlupa"
        />
      </div>
    </div>
  );
};
