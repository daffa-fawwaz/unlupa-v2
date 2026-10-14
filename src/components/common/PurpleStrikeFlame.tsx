import React, { useEffect, useRef } from 'react';

interface PurpleStrikeFlameProps {
  number: number;
  isActive: boolean;
  isCurrent: boolean;
  size?: number; // size in px, e.g. 48
}

export const PurpleStrikeFlame: React.FC<PurpleStrikeFlameProps> = ({
  number,
  isActive,
  isCurrent,
  size = 48
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isSubscribed = true;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = size * dpr;
    const H = size * dpr;
    canvas.width = W;
    canvas.height = H;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      decay: number;
      size: number;
      wobble: number;
      wobbleSpeed: number;
    }> = [];

    const MAX_PARTICLES = isCurrent ? 120 : 70;

    function spawnParticle() {
      if (particles.length >= MAX_PARTICLES) return;
      const cx = W / 2;
      const baseY = H * 0.65;

      particles.push({
        x: cx + (Math.random() - 0.5) * W * 0.45,
        y: baseY + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -1.2 - Math.random() * 1.8,
        life: 1,
        decay: 0.018 + Math.random() * 0.022,
        size: (size * 0.22 * dpr) + Math.random() * (size * 0.28 * dpr),
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.05 + Math.random() * 0.05
      });
    }

    function render() {
      if (!isSubscribed || !ctx) return;

      // Fully transparent clear rect - no dark trail artifacts
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';

      for (let i = 0; i < 3; i++) {
        spawnParticle();
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 0.5;
        p.y += p.vy;
        p.vy *= 0.98;
        p.life -= p.decay;
        p.size *= 0.97;

        if (p.life <= 0 || p.size < 0.8) {
          particles.splice(i, 1);
          continue;
        }

        const t = 1 - p.life;
        let r: number, g: number, b: number, a: number;

        if (t < 0.3) {
          r = 255;
          g = 200 - (100 * (t / 0.3));
          b = 255;
          a = p.life * 0.8;
        } else {
          const k = (t - 0.3) / 0.7;
          r = 180 - (80 * k);
          g = 100 - (80 * k);
          b = 255;
          a = p.life * 0.6 * (1 - k);
        }

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        grad.addColorStop(0, `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${a})`);
        grad.addColorStop(1, `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    }

    render();

    return () => {
      isSubscribed = false;
      cancelAnimationFrame(animId);
    };
  }, [isActive, isCurrent, size]);

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 transition-transform duration-300 ${
        isCurrent ? 'scale-110 z-10' : isActive ? 'scale-105' : 'scale-95 opacity-35 grayscale'
      }`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        filter: isActive ? 'drop-shadow(0px 8px 12px rgba(160, 32, 240, 0.25))' : 'none'
      }}
      title={`Strike ${number}`}
    >
      {/* Fully Transparent Canvas Fire Animation Background */}
      {isActive && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      )}

      {/* SVG Flame Silhouette Accent */}
      <svg
        className={`absolute inset-0 w-full h-full pointer-events-none transition-all ${
          isActive
            ? 'drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]'
            : 'text-slate-400 dark:text-slate-700 opacity-40'
        }`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {isActive ? (
          <>
            <path
              d="M12 2C12 2 15.5 6.5 15.5 10C15.5 12.7614 13.9853 14.5 12 16.5C10.0147 14.5 8.5 12.7614 8.5 10C8.5 6.5 12 2 12 2Z"
              fill="url(#purpleFlameGradTransparent)"
            />
            <path
              d="M12 5.5C12 5.5 17 9.5 17 14C17 17.866 14.7614 21 12 21C9.23858 21 7 17.866 7 14C7 9.5 12 5.5 12 5.5Z"
              fill="url(#purpleFlameGradTransparent)"
            />
            <path
              d="M12 10.5C12 10.5 14 13 14 15.5C14 17.433 13.1046 19 12 19C10.8954 19 10 17.433 10 15.5C10 13 12 10.5 12 10.5Z"
              fill="url(#purpleFlameInnerTransparent)"
              opacity="0.9"
            />
            <defs>
              <linearGradient id="purpleFlameGradTransparent" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F0ABFC" />
                <stop offset="50%" stopColor="#C084FC" />
                <stop offset="100%" stopColor="#8A2BE2" />
              </linearGradient>
              <linearGradient id="purpleFlameInnerTransparent" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#E8B3FF" />
              </linearGradient>
            </defs>
          </>
        ) : (
          <path
            d="M12 2C12 2 17 9.5 17 14C17 17.866 14.7614 21 12 21C9.23858 21 7 17.866 7 14C7 9.5 12 2 12 2Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>

      {/* Pure White Glowing Number Centered inside Flame */}
      <span
        className={`relative z-10 font-black font-mono tracking-tighter select-none ${
          isCurrent ? 'animate-pulse' : ''
        }`}
        style={{
          fontSize: `${Math.round(size * 0.42)}px`,
          ...(isActive
            ? {
                color: '#ffffff',
                textShadow:
                  '0 0 6px #ffffff, 0 0 14px #d18aff, 0 0 28px #a020f0, 0 0 50px #6a0dad'
              }
            : {
                color: '#94A3B8'
              })
        }}
      >
        {number}
      </span>
    </div>
  );
};
