import React, { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
  type: 'quran' | 'knowledge' | 'neutral';
}

export const SynapticCanvas: React.FC<{ scrollProgress?: number }> = ({ scrollProgress = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = { x: -2000, y: -2000, targetX: -2000, targetY: -2000 };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initNodes();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    let nodes: Node[] = [];

    const initNodes = () => {
      nodes = [];
      const count = Math.min(Math.floor((width * height) / 18000), 75);
      for (let i = 0; i < count; i++) {
        const isQuran = Math.random() > 0.5;
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          radius: Math.random() * 1.8 + 0.8,
          alpha: Math.random() * 0.5 + 0.2,
          type: isQuran ? 'quran' : 'knowledge',
          color: isQuran ? 'rgba(16, 185, 129, ' : 'rgba(217, 163, 67, '
        });
      }
    };

    initNodes();

    const render = () => {
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      ctx.clearRect(0, 0, width, height);

      // Subtle luminous focus around cursor
      if (mouse.x > -500) {
        const aura = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 350);
        aura.addColorStop(0, 'rgba(16, 185, 129, 0.04)');
        aura.addColorStop(0.5, 'rgba(217, 163, 67, 0.02)');
        aura.addColorStop(1, 'transparent');
        ctx.fillStyle = aura;
        ctx.fillRect(0, 0, width, height);
      }

      // Render synaptic nodes and interconnections
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0) n.x = width;
        if (n.x > width) n.x = 0;
        if (n.y < 0) n.y = height;
        if (n.y > height) n.y = 0;

        // Proximity glow
        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const dynamicAlpha = dist < 120 ? 0.9 : n.alpha;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${n.color}${dynamicAlpha})`;
        ctx.shadowBlur = dist < 120 ? 10 : 0;
        ctx.shadowColor = n.type === 'quran' ? '#10B981' : '#D9A343';
        ctx.fill();
        ctx.shadowBlur = 0;

        // Synaptic connections between related memory nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const cdx = n.x - n2.x;
          const cdy = n.y - n2.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

          if (cdist < 110) {
            const lineAlpha = (1 - cdist / 110) * 0.15 * Math.min(dynamicAlpha, n2.alpha);
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = n.type === n2.type 
              ? `${n.color}${lineAlpha})` 
              : `rgba(220, 225, 230, ${lineAlpha * 0.7})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-60"
      style={{ width: '100%', height: '100%' }}
    />
  );
};
