/**
 * Unlupa.id - HTML Overlay & Typography Controller
 * Manages semantic SEO markup, top bar, hero content block, and Scene 2 (Masalah) overlay.
 */

import * as THREE from 'three';
import { TOKENS, APP_URL } from '../config';
import { ScrambleText } from './ScrambleText';

export interface OverlayCallbacks {
  onLaunchApp?: () => void;
  onScrollToTop?: () => void;
}

export class Overlay {
  public root: HTMLElement;
  public topBar!: HTMLElement;
  public heroBlock!: HTMLElement;
  public scrollIndicator!: HTMLElement;
  public ctaBtn!: HTMLElement;

  // Scene 02 (Masalah) DOM Elements
  public scene2Container!: HTMLElement;
  public gridLabelsContainer!: HTMLElement;
  public s2Kicker!: HTMLElement;
  public s2Headline!: HTMLElement;
  public s2Subtext!: HTMLElement;
  public s2Closing!: HTMLElement;
  public s2Footnote!: HTMLElement;
  public s2AxisY!: HTMLElement;
  public s2AxisX!: HTMLElement;
  public s2MilestoneLabels: Map<string, HTMLElement> = new Map();

  private s2HeadlineScramble: ScrambleText | null = null;
  private s2HeadlineRevealed: boolean = false;

  private tempVec = new THREE.Vector3();

  constructor(private container: HTMLElement, private callbacks: OverlayCallbacks = {}) {
    this.root = container;
    this.buildUI();
    this.buildScene2UI();
  }

  private buildUI() {
    this.root.innerHTML = '';

    // 1. Semantic H1 for SEO and Screen Readers
    const seoH1 = document.createElement('h1');
    seoH1.className = 'sr-only';
    seoH1.textContent = 'Unlupa.id — Sistem Ingatan Mutqin & Penjadwalan Murajaah Adaptif';
    this.root.appendChild(seoH1);

    // 2. Fixed Top Bar (Logo, Tag, Launch Button)
    this.topBar = document.createElement('header');
    this.topBar.className = 'unlupa-top-bar';
    this.topBar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 4.25rem;
      padding: 0 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 50;
      opacity: 0;
      transform: translateY(-20px);
      transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
    `;

    this.topBar.innerHTML = `
      <div id="unlupa-brand" class="unlupa-interactive" style="display: flex; align-items: center; gap: 0.85rem; cursor: pointer;">
        <span style="
          font-family: var(--font-hanken);
          font-weight: 300;
          font-size: 1.15rem;
          letter-spacing: 0.35em;
          color: var(--color-white);
          text-transform: uppercase;
        ">UNLUPA</span>
        <span style="
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.2rem 0.6rem;
          border-radius: 9999px;
          border: 1px solid rgba(212, 176, 106, 0.35);
          background: rgba(212, 176, 106, 0.08);
          font-family: var(--font-hanken);
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          color: var(--color-gold);
          text-transform: uppercase;
        ">
          <span style="width: 4px; height: 4px; border-radius: 50%; background: var(--color-gold); box-shadow: 0 0 8px var(--color-gold);"></span>
          SISTEM MUTQIN
        </span>
      </div>

      <nav style="display: flex; align-items: center; gap: 1.5rem;">
        <a 
          id="unlupa-top-launch" 
          href="${APP_URL}" 
          class="unlupa-interactive"
          style="
            font-family: var(--font-hanken);
            font-size: 0.8125rem;
            letter-spacing: 0.15em;
            color: var(--color-white);
            text-transform: uppercase;
            text-decoration: none;
            padding: 0.55rem 1.25rem;
            border-radius: 9999px;
            border: 1px solid rgba(255, 255, 255, 0.18);
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(8px);
            transition: all 0.3s ease;
          "
        >
          Masuk Aplikasi &rarr;
        </a>
      </nav>
    `;
    this.root.appendChild(this.topBar);

    // Bind Top Bar clicks
    const brandEl = this.topBar.querySelector('#unlupa-brand');
    if (brandEl) {
      brandEl.addEventListener('click', () => {
        if (this.callbacks.onScrollToTop) this.callbacks.onScrollToTop();
      });
    }

    const topLaunchEl = this.topBar.querySelector('#unlupa-top-launch') as HTMLAnchorElement;
    if (topLaunchEl) {
      topLaunchEl.addEventListener('click', (e) => {
        if (this.callbacks.onLaunchApp) {
          e.preventDefault();
          this.callbacks.onLaunchApp();
        }
      });
    }

    // 3. Hero Bottom Content Block (Scans 1 - Kurva Lupa Hero)
    this.heroBlock = document.createElement('div');
    this.heroBlock.className = 'unlupa-hero-block';
    this.heroBlock.style.cssText = `
      position: absolute;
      bottom: clamp(6vh, 8vh, 12vh);
      left: clamp(1.5rem, 6vw, 5rem);
      max-width: min(38rem, 88vw);
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
      padding: 0;
      z-index: 20;
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), filter 0.8s ease;
    `;

    this.heroBlock.innerHTML = `
      <div style="width: 100%; display: flex; flex-direction: column; align-items: flex-start; gap: 0.85rem;">
        
        <!-- Cognitive Memory Badge -->
        <div id="unlupa-badge" style="
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.3rem 0.85rem;
          border-radius: 9999px;
          border: 1px solid rgba(126, 208, 250, 0.28);
          background: rgba(10, 25, 45, 0.55);
          backdrop-filter: blur(10px);
          font-family: var(--font-hanken);
          font-size: 0.6875rem;
          font-weight: 400;
          letter-spacing: 0.22em;
          color: #9fe4ff;
          text-transform: uppercase;
          opacity: 0;
          transform: translateY(12px);
          transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        ">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #6ad5ff; box-shadow: 0 0 10px #6ad5ff;"></span>
          01 / ARSITEKTUR INGATAN &bull; KURVA LUPA EBBINGHAUS
        </div>

        <!-- Main Headline -->
        <h1 id="unlupa-tagline" style="
          font-family: var(--font-hanken);
          font-size: clamp(2.1rem, 4vw, 3.8rem);
          font-weight: 300;
          line-height: 1.14;
          letter-spacing: -0.02em;
          color: var(--color-white);
          margin: 0;
          opacity: 0;
          transform: translateY(15px);
          transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        ">
          Tanpa pengulangan, ingatan memudar dengan cepat.
        </h1>

        <!-- Arabic Line: Amiri, gold radiance -->
        <div id="unlupa-arabic" class="font-amiri" style="
          font-size: 1.55rem;
          color: var(--color-gold);
          opacity: 0;
          transform: translateY(15px);
          line-height: 1.4;
          letter-spacing: 0.04em;
          text-shadow: 0 0 25px rgba(212, 176, 106, 0.35);
          transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        ">
          العِلْمُ الَّذِي لَا يُنْسَى
        </div>

        <!-- Subtitle: High clarity typography -->
        <p id="unlupa-subtitle" style="
          max-width: 35rem;
          font-family: var(--font-hanken);
          font-size: clamp(0.875rem, 1.05vw, 1rem);
          font-weight: 300;
          line-height: 1.7;
          color: var(--color-ice-1);
          opacity: 0;
          transform: translateY(15px);
          margin: 0;
          transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        ">
          Semakin lama dibiarkan, semakin sulit hafalan dan pemahaman dipanggil kembali. Bukan karena kurang semangat—begitulah cara otak bekerja tanpa pengulangan adaptif berbasis sains memori.
        </p>

        <!-- CTA Button & Footnote -->
        <div style="display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; margin-top: 0.4rem;">
          <div id="unlupa-cta-wrapper" class="unlupa-interactive" style="
            opacity: 0;
            transform: translateY(15px);
            transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
          ">
            <a 
              id="unlupa-cta-btn" 
              href="${APP_URL}" 
              class="unlupa-btn-magnetic"
              style="
                display: inline-flex;
                align-items: center;
                gap: 0.65rem;
                padding: 0.75rem 1.85rem;
                border-radius: 9999px;
                border: 1px solid rgba(255, 255, 255, 0.24);
                background: rgba(255, 255, 255, 0.08);
                backdrop-filter: blur(12px);
                color: #ffffff;
                font-family: var(--font-hanken);
                font-size: 0.8125rem;
                font-weight: 400;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                text-decoration: none;
                box-shadow: 0 4px 24px rgba(0, 0, 0, 0.45), 0 0 20px rgba(110, 214, 255, 0.12);
                transition: all 0.35s ease;
              "
            >
              <span>Mulai Menghafal</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>

          <span style="
            font-family: var(--font-hanken);
            font-size: 0.72rem;
            color: rgba(126, 208, 250, 0.6);
            letter-spacing: 0.04em;
          ">
            Ilustrasi kurva lupa Ebbinghaus
          </span>
        </div>

      </div>
    `;

    this.root.appendChild(this.heroBlock);

    this.ctaBtn = this.heroBlock.querySelector('#unlupa-cta-btn') as HTMLElement;
    if (this.ctaBtn) {
      this.ctaBtn.addEventListener('click', (e) => {
        if (this.callbacks.onLaunchApp) {
          e.preventDefault();
          this.callbacks.onLaunchApp();
        }
      });
      this.initMagneticButton(this.ctaBtn);
    }

    // 4. Scroll Indicator
    this.scrollIndicator = document.createElement('div');
    this.scrollIndicator.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      z-index: 30;
      opacity: 0;
      transition: opacity 0.8s ease, transform 0.8s ease;
      user-select: none;
    `;
    this.scrollIndicator.innerHTML = `
      <div class="unlupa-scroll-indicator"></div>
      <span style="
        font-family: var(--font-hanken);
        font-size: 0.625rem;
        font-weight: 300;
        letter-spacing: 0.35em;
        color: var(--color-ice-1);
        text-transform: uppercase;
        writing-mode: vertical-rl;
        transform: rotate(180deg);
      ">GULIR</span>
    `;
    this.root.appendChild(this.scrollIndicator);
  }

  // =========================================================================
  // SCENE 02 (MASALAH) UI BUILDER & ACCESSIBILITY
  // =========================================================================

  private buildScene2UI() {
    this.scene2Container = document.createElement('div');
    this.scene2Container.className = 'unlupa-scene2-overlay';
    this.scene2Container.setAttribute('role', 'region');
    this.scene2Container.setAttribute('aria-label', 'Scene 2: Masalah Kurva Lupa');
    this.scene2Container.style.cssText = `
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 25;
      opacity: 0;
      transition: opacity 0.4s ease;
    `;

    // Semantic image container for Forgetting Curve accessibility
    const curveAria = document.createElement('div');
    curveAria.setAttribute('role', 'img');
    curveAria.setAttribute(
      'aria-label',
      'Ilustrasi kurva lupa: ingatan menurun tajam di awal lalu melandai seiring waktu bila tidak diulang.'
    );
    curveAria.className = 'sr-only';
    this.scene2Container.appendChild(curveAria);

    // 1. Text Block at bottom-left of screen (below high portion of curve)
    const textBlock = document.createElement('div');
    textBlock.style.cssText = `
      position: absolute;
      bottom: 7vh;
      left: 6vw;
      max-width: 32rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      user-select: none;
    `;

    // Kicker: "02 / AKIBAT NYATA"
    this.s2Kicker = document.createElement('div');
    this.s2Kicker.style.cssText = `
      font-family: var(--font-hanken);
      font-size: 0.75rem;
      font-weight: 400;
      letter-spacing: 0.4em;
      color: rgba(212, 176, 106, 0.75);
      text-transform: uppercase;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.5s ease;
    `;
    this.s2Kicker.textContent = '02 / AKIBAT NYATA';
    textBlock.appendChild(this.s2Kicker);

    // Headline: "90% hafalan hilang dalam 30 hari tanpa muraja'ah terstruktur."
    this.s2Headline = document.createElement('h2');
    this.s2Headline.style.cssText = `
      font-family: var(--font-hanken);
      font-size: clamp(1.85rem, 3.8vw, 3.6rem);
      font-weight: 300;
      line-height: 1.18;
      letter-spacing: -0.02em;
      color: var(--color-white);
      margin: 0;
      opacity: 0;
      transform: translateY(12px);
      transition: all 0.5s ease;
    `;
    this.s2Headline.textContent = "90% hafalan hilang dalam 30 hari tanpa muraja'ah terstruktur.";
    textBlock.appendChild(this.s2Headline);

    // Subtext: "Otak secara biologis membuang sinapsis yang pasif..."
    this.s2Subtext = document.createElement('p');
    this.s2Subtext.style.cssText = `
      font-family: var(--font-hanken);
      font-size: 1rem;
      font-weight: 300;
      line-height: 1.7;
      color: var(--color-ice-1);
      margin: 0;
      opacity: 0;
      filter: blur(8px);
      transform: translateY(10px);
      transition: all 0.6s ease;
    `;
    this.s2Subtext.textContent = 'Otak secara biologis menyaring sinapsis yang pasif. Mengulang tanpa jadwal presisi menyita ribuan jam berharga tanpa jaminan memori bertahan mutqin.';
    textBlock.appendChild(this.s2Subtext);

    // Closing statement: "Dibutuhkan algoritma presisi tinggi..."
    this.s2Closing = document.createElement('div');
    this.s2Closing.style.cssText = `
      font-family: var(--font-hanken);
      font-size: 0.9375rem;
      font-style: italic;
      color: rgba(212, 176, 106, 0.85);
      line-height: 1.6;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.6s ease;
    `;
    this.s2Closing.textContent = 'Dibutuhkan sistem cerdas yang memprediksi titik kritis sebelum sebuah ayat atau hadits terlupakan.';
    textBlock.appendChild(this.s2Closing);

    this.scene2Container.appendChild(textBlock);

    // 2. Footnote at bottom right
    this.s2Footnote = document.createElement('div');
    this.s2Footnote.style.cssText = `
      position: absolute;
      bottom: 2.5rem;
      right: 3.5rem;
      font-family: var(--font-hanken);
      font-size: 0.7rem;
      letter-spacing: 0.05em;
      color: var(--color-ice-1);
      opacity: 0;
      transition: opacity 0.5s ease;
      user-select: none;
    `;
    this.s2Footnote.textContent = 'Ilustrasi berdasarkan kurva lupa Ebbinghaus.';
    this.scene2Container.appendChild(this.s2Footnote);

    // 3. Projected Axis & Milestone Labels Container (active across scenes)
    this.gridLabelsContainer = document.createElement('div');
    this.gridLabelsContainer.className = 'unlupa-grid-labels-container';
    this.gridLabelsContainer.style.cssText = `
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 24;
    `;
    this.root.appendChild(this.gridLabelsContainer);

    this.s2AxisY = document.createElement('div');
    this.s2AxisY.style.cssText = `
      position: absolute;
      font-family: var(--font-hanken);
      font-size: 0.6875rem;
      letter-spacing: 0.25em;
      color: var(--color-ice-1);
      text-transform: uppercase;
      opacity: 0;
      transition: opacity 0.4s ease;
      pointer-events: none;
    `;
    this.s2AxisY.innerHTML = `
      <div style="writing-mode: vertical-rl; transform: rotate(180deg); margin-bottom: 0.5rem;">INGATAN</div>
      <div style="font-size: 0.625rem; opacity: 0.6;">100%</div>
    `;
    this.gridLabelsContainer.appendChild(this.s2AxisY);

    this.s2AxisX = document.createElement('div');
    this.s2AxisX.style.cssText = `
      position: absolute;
      font-family: var(--font-hanken);
      font-size: 0.6875rem;
      letter-spacing: 0.25em;
      color: var(--color-ice-1);
      text-transform: uppercase;
      opacity: 0;
      transition: opacity 0.4s ease;
      pointer-events: none;
    `;
    this.s2AxisX.textContent = 'WAKTU &rarr;';
    this.gridLabelsContainer.appendChild(this.s2AxisX);

    // Create DOM nodes for the 4 Milestones
    const milestoneDefs = [
      { key: 'm1', label: '20 MENIT' },
      { key: 'm2', label: '1 HARI' },
      { key: 'm3', label: '1 MINGGU' },
      { key: 'm4', label: '1 BULAN' },
    ];

    milestoneDefs.forEach((def) => {
      const el = document.createElement('div');
      el.style.cssText = `
        position: absolute;
        font-family: var(--font-hanken);
        font-size: 0.65rem;
        font-weight: 400;
        letter-spacing: 0.15em;
        color: var(--color-ice-1);
        text-transform: uppercase;
        opacity: 0;
        transform: translate(-50%, 0);
        transition: color 0.3s ease, opacity 0.4s ease, transform 0.3s ease;
        white-space: nowrap;
        pointer-events: none;
      `;
      el.textContent = def.label;
      this.s2MilestoneLabels.set(def.key, el);
      this.gridLabelsContainer.appendChild(el);
    });

    this.root.appendChild(this.scene2Container);

    // Scramble effect for Headline
    this.s2HeadlineScramble = new ScrambleText("90% hafalan hilang dalam 30 hari tanpa muraja'ah terstruktur.", {
      duration: 0.9,
      onUpdate: (text) => {
        this.s2Headline.textContent = text;
      }
    });
  }

  private initMagneticButton(btn: HTMLElement) {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);

      if (dist < 90) {
        const deltaX = (e.clientX - centerX) * 0.22;
        const deltaY = (e.clientY - centerY) * 0.22;
        btn.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
        btn.style.borderColor = 'rgba(212, 176, 106, 0.6)';
        btn.style.boxShadow = '0 6px 30px rgba(0, 0, 0, 0.5), 0 0 25px rgba(212, 176, 106, 0.25)';
      } else {
        btn.style.transform = 'translate3d(0, 0, 0)';
        btn.style.borderColor = 'rgba(255, 255, 255, 0.24)';
        btn.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.45), 0 0 20px rgba(110, 214, 255, 0.12)';
      }
    };

    const handleMouseLeave = () => {
      btn.style.transform = 'translate3d(0, 0, 0)';
      btn.style.borderColor = 'rgba(255, 255, 255, 0.24)';
      btn.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.45), 0 0 20px rgba(110, 214, 255, 0.12)';
    };

    window.addEventListener('mousemove', handleMouseMove);
    btn.addEventListener('mouseleave', handleMouseLeave);
  }

  // --- SCENE 1 STAGED INTRO REVEAL API ---

  public revealBadge() {
    const el = this.heroBlock.querySelector('#unlupa-badge') as HTMLElement;
    if (el) {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }
  }

  public revealTagline() {
    const el = this.heroBlock.querySelector('#unlupa-tagline') as HTMLElement;
    if (el) {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }
  }

  public revealArabic() {
    const el = this.heroBlock.querySelector('#unlupa-arabic') as HTMLElement;
    if (el) {
      el.style.opacity = '0.9';
      el.style.transform = 'translateY(0)';
    }
  }

  public revealSubtitle() {
    const el = this.heroBlock.querySelector('#unlupa-subtitle') as HTMLElement;
    if (el) {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }
  }

  public revealCTA() {
    const el = this.heroBlock.querySelector('#unlupa-cta-wrapper') as HTMLElement;
    if (el) {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }
  }

  public revealTopBar() {
    this.topBar.style.opacity = '1';
    this.topBar.style.transform = 'translateY(0)';
  }

  public revealScrollIndicator() {
    this.scrollIndicator.style.opacity = '1';
  }

  public revealAllInstant() {
    this.revealBadge();
    this.revealTagline();
    this.revealArabic();
    this.revealSubtitle();
    this.revealCTA();
    this.revealTopBar();
    this.revealScrollIndicator();
    this.heroBlock.style.opacity = '1';
    this.heroBlock.style.transform = 'translateY(0)';
  }

  public updateScene1Scroll(localProgress: number, globalScrollProgress: number) {
    if (globalScrollProgress > 0.05) {
      this.scrollIndicator.style.opacity = '0';
      this.scrollIndicator.style.pointerEvents = 'none';
    } else {
      this.scrollIndicator.style.opacity = '1';
      this.scrollIndicator.style.pointerEvents = 'auto';
    }

    if (localProgress <= 0.65) {
      this.heroBlock.style.transform = 'translate3d(0, 0, 0)';
      this.heroBlock.style.opacity = '1';
      this.heroBlock.style.filter = 'none';
      this.heroBlock.style.pointerEvents = 'auto';
    } else {
      const t = (localProgress - 0.65) / 0.35;
      const riseY = -35 * t;
      const opacity = 1 - t;
      const blurPx = 8 * t;

      this.heroBlock.style.transform = `translate3d(0, ${riseY}px, 0)`;
      this.heroBlock.style.opacity = `${Math.max(0, opacity)}`;
      this.heroBlock.style.filter = `blur(${blurPx}px)`;
      this.heroBlock.style.pointerEvents = opacity < 0.1 ? 'none' : 'auto';
    }
  }

  // =========================================================================
  // SCENE 2 CONTROL API
  // =========================================================================

  public setScene2Opacity(opacity: number) {
    this.scene2Container.style.opacity = `${Math.max(0, Math.min(1, opacity))}`;
  }

  public updateScene2Text(localProgress: number) {
    // 0.12 - 0.22: Kicker and Headline appear
    if (localProgress >= 0.12) {
      this.s2Kicker.style.opacity = '1';
      this.s2Kicker.style.transform = 'translateY(0)';
      this.s2Headline.style.opacity = '1';
      this.s2Headline.style.transform = 'translateY(0)';

      if (!this.s2HeadlineRevealed && this.s2HeadlineScramble) {
        this.s2HeadlineRevealed = true;
        this.s2HeadlineScramble.start();
      }
    } else {
      this.s2Kicker.style.opacity = '0';
      this.s2Kicker.style.transform = 'translateY(10px)';
      this.s2Headline.style.opacity = '0';
      this.s2Headline.style.transform = 'translateY(12px)';
      this.s2HeadlineRevealed = false;
    }

    // 0.25 - 0.35: Subtext fades in with blur to clear
    if (localProgress >= 0.25) {
      const subT = Math.min(1.0, (localProgress - 0.25) / 0.1);
      this.s2Subtext.style.opacity = `${subT}`;
      this.s2Subtext.style.filter = `blur(${(1.0 - subT) * 8}px)`;
      this.s2Subtext.style.transform = `translateY(${(1.0 - subT) * 10}px)`;
    } else {
      this.s2Subtext.style.opacity = '0';
      this.s2Subtext.style.filter = 'blur(8px)';
      this.s2Subtext.style.transform = 'translateY(10px)';
    }

    // Footnote appears with grid (0.15 - 0.25)
    if (localProgress >= 0.15) {
      this.s2Footnote.style.opacity = '0.6';
    } else {
      this.s2Footnote.style.opacity = '0';
    }

    // 0.80 - 0.95: Final closing statement appears
    if (localProgress >= 0.8) {
      const closeT = Math.min(1.0, (localProgress - 0.8) / 0.12);
      this.s2Closing.style.opacity = `${closeT * 0.9}`;
      this.s2Closing.style.transform = `translateY(${(1.0 - closeT) * 10}px)`;
    } else {
      this.s2Closing.style.opacity = '0';
      this.s2Closing.style.transform = 'translateY(10px)';
    }
  }

  /**
   * Projects 3D world coordinates to 2D screen pixels for precise grid and milestone alignment
   */
  public worldToScreen(worldPos: THREE.Vector3, camera: THREE.Camera): { x: number; y: number } {
    this.tempVec.copy(worldPos).project(camera);
    const x = (this.tempVec.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-this.tempVec.y * 0.5 + 0.5) * window.innerHeight;
    return { x, y };
  }

  public projectGridLabels(
    gridYPos: THREE.Vector3,
    gridXPos: THREE.Vector3,
    milestones: { key: string; worldPos: THREE.Vector3 }[],
    camera: THREE.Camera,
    curveProgress: number,
    alpha: number = 1.0
  ) {
    if (alpha < 0.02) {
      this.s2AxisY.style.opacity = '0';
      this.s2AxisX.style.opacity = '0';
      this.s2MilestoneLabels.forEach((el) => (el.style.opacity = '0'));
      return;
    }

    // Project Y axis label (top left of grid)
    const ptY = this.worldToScreen(gridYPos, camera);
    this.s2AxisY.style.left = `${ptY.x - 38}px`;
    this.s2AxisY.style.top = `${ptY.y}px`;
    this.s2AxisY.style.opacity = `${alpha * 0.75}`;

    // Project X axis label (bottom right of grid)
    const ptX = this.worldToScreen(gridXPos, camera);
    this.s2AxisX.style.left = `${ptX.x + 20}px`;
    this.s2AxisX.style.top = `${ptX.y - 8}px`;
    this.s2AxisX.style.opacity = `${alpha * 0.75}`;

    // Project each milestone along the horizontal time axis
    const milestoneThresholds: Record<string, number> = {
      m1: 0.12,
      m2: 0.38,
      m3: 0.66,
      m4: 0.94,
    };

    milestones.forEach((ms) => {
      const el = this.s2MilestoneLabels.get(ms.key);
      if (el) {
        const pt = this.worldToScreen(ms.worldPos, camera);
        el.style.left = `${pt.x}px`;
        el.style.top = `${pt.y + 12}px`;
        el.style.opacity = `${alpha * 0.8}`;

        const threshold = milestoneThresholds[ms.key] || 0;
        // Lights up from pale white to warm gold when curve head passes
        if (curveProgress >= threshold) {
          el.style.color = '#d4b06a';
          el.style.textShadow = '0 0 12px rgba(212, 176, 106, 0.5)';
        } else {
          el.style.color = 'var(--color-ice-1)';
          el.style.textShadow = 'none';
        }
      }
    });
  }

  public updateScene2ProjectedLabels(
    gridYPos: THREE.Vector3,
    gridXPos: THREE.Vector3,
    milestones: { key: string; worldPos: THREE.Vector3 }[],
    camera: THREE.Camera,
    curveProgress: number,
    scene2Alpha: number
  ) {
    this.projectGridLabels(gridYPos, gridXPos, milestones, camera, curveProgress, scene2Alpha);
  }

  public showWebGLFallback() {
    this.root.innerHTML = `
      <div style="
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        text-align: center;
        background: #05070f;
        color: #f0f7ff;
        font-family: var(--font-hanken);
      ">
        <h1 style="font-size: 2.2rem; font-weight: 300; letter-spacing: 0.3em; margin-bottom: 1rem;">UNLUPA</h1>
        <p style="max-width: 28rem; font-size: 1rem; color: #a3c4db; line-height: 1.7; margin-bottom: 2rem;">
          Hafalan Al-Qur'an dan ilmu Islam yang terjaga, diulang tepat pada waktunya dengan algoritma adaptif Unlupa.
        </p>
        <a 
          href="${APP_URL}" 
          style="
            display: inline-block;
            padding: 0.8rem 2rem;
            border-radius: 9999px;
            background: #d4b06a;
            color: #05070f;
            text-decoration: none;
            font-size: 0.875rem;
            letter-spacing: 0.15em;
            font-weight: 500;
            text-transform: uppercase;
          "
        >
          Masuk ke Aplikasi
        </a>
      </div>
    `;
  }

  public destroy() {
    this.root.innerHTML = '';
  }
}
