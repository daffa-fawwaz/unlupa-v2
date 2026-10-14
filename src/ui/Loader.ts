/**
 * Minimalist Editorial SVG Ring Loader (72px)
 * Centered progress percentage with smooth exit fade.
 */

export class Loader {
  private element: HTMLElement;
  private circleElement: SVGCircleElement;
  private textElement: HTMLElement;
  private radius: number = 32;
  private circumference: number = 2 * Math.PI * 32;

  constructor(parent: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'unlupa-loader-container';
    this.element.style.cssText = `
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: #05070f;
      z-index: 100;
      pointer-events: auto;
      transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.8s;
    `;

    this.element.innerHTML = `
      <div style="position: relative; width: 72px; height: 72px; display: flex; align-items: center; justify-content: center;">
        <svg width="72" height="72" viewBox="0 0 72 72" style="transform: rotate(-90deg);">
          <circle
            cx="36"
            cy="36"
            r="${this.radius}"
            fill="none"
            stroke="rgba(182, 186, 197, 0.12)"
            stroke-width="1.5"
          />
          <circle
            id="unlupa-loader-circle"
            cx="36"
            cy="36"
            r="${this.radius}"
            fill="none"
            stroke="#9fc4ff"
            stroke-width="1.5"
            stroke-dasharray="${this.circumference}"
            stroke-dashoffset="${this.circumference}"
            stroke-linecap="round"
            style="transition: stroke-dashoffset 0.2s ease-out;"
          />
        </svg>
        <span 
          id="unlupa-loader-text" 
          style="
            position: absolute; 
            font-family: 'Hanken Grotesk', monospace; 
            font-size: 11px; 
            font-weight: 300; 
            letter-spacing: 0.1em; 
            color: #e8ecf5;
          "
        >0%</span>
      </div>
    `;

    parent.appendChild(this.element);
    this.circleElement = this.element.querySelector('#unlupa-loader-circle') as SVGCircleElement;
    this.textElement = this.element.querySelector('#unlupa-loader-text') as HTMLElement;
  }

  public setProgress(percent: number) {
    const clamped = Math.min(100, Math.max(0, percent));
    const offset = this.circumference - (clamped / 100) * this.circumference;
    if (this.circleElement) {
      this.circleElement.style.strokeDashoffset = `${offset}`;
    }
    if (this.textElement) {
      this.textElement.textContent = `${Math.round(clamped)}%`;
    }
  }

  public fadeOut(): Promise<void> {
    return new Promise((resolve) => {
      this.element.style.opacity = '0';
      this.element.style.pointerEvents = 'none';
      setTimeout(() => {
        this.element.style.visibility = 'hidden';
        resolve();
      }, 800);
    });
  }

  public destroy() {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
