// src/components/3d/CanvasFallback.tsx
import React, { useEffect, useRef } from 'react';

interface Props {
  isUrgent?: boolean;
}

export const CanvasFallback: React.FC<Props> = ({ isUrgent = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes
    const particleCount = 60;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      size: Math.random() * 2 + 1,
      color: Math.random() > 0.5 ? 'rgba(56, 189, 248, ' : 'rgba(129, 140, 248, '
    }));

    const render = () => {
      ctx.fillStyle = '#06080F';
      ctx.fillRect(0, 0, width, height);

      // Gradient radial glow
      const grad = ctx.createRadialGradient(
        width / 2, height / 2, 50,
        width / 2, height / 2, Math.max(width, height) / 1.5
      );
      grad.addColorStop(0, isUrgent ? 'rgba(245, 158, 11, 0.08)' : 'rgba(56, 189, 248, 0.07)');
      grad.addColorStop(1, 'rgba(6, 8, 15, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Render connected particles
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + '0.6)';
        ctx.fill();

        // Connect nearby points
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isUrgent]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none -z-10 w-full h-full" />;
};

