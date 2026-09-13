'use client';

import { useEffect, useRef } from 'react';

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cursorDotRef = useRef<HTMLDivElement | null>(null);
  const cursorRingRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let dotX = mouseX;
    let dotY = mouseY;
    let isHoveringInteractive = false;
    let isVisible = false;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      isVisible = true;

      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest('button, a, input, select, textarea, [role="button"], .interactive');
        isHoveringInteractive = !!interactive;
      }
    };

    const handleMouseLeave = () => {
      isVisible = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    let animationFrameId: number;

    const animateCursor = () => {
      // Lerp ring with smooth 0.12 easing delay
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;

      dotX += (mouseX - dotX) * 0.35;
      dotY += (mouseY - dotY) * 0.35;

      if (cursorDotRef.current && cursorRingRef.current) {
        if (!isVisible) {
          cursorDotRef.current.style.opacity = '0';
          cursorRingRef.current.style.opacity = '0';
        } else {
          cursorDotRef.current.style.opacity = '1';
          cursorRingRef.current.style.opacity = '1';

          cursorDotRef.current.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%) scale(${isHoveringInteractive ? 1.5 : 1})`;
          cursorRingRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${isHoveringInteractive ? 1.7 : 1})`;

          if (isHoveringInteractive) {
            cursorRingRef.current.style.borderColor = 'rgba(18, 84, 79, 0.8)';
            cursorRingRef.current.style.backgroundColor = 'rgba(139, 187, 146, 0.15)';
          } else {
            cursorRingRef.current.style.borderColor = 'rgba(18, 84, 79, 0.4)';
            cursorRingRef.current.style.backgroundColor = 'transparent';
          }
        }
      }

      animationFrameId = requestAnimationFrame(animateCursor);
    };

    animateCursor();

    // Canvas fluid video-like gradient mesh reacting to mouse
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
          if (!canvas) return;
          width = canvas.width = window.innerWidth;
          height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        // Blobs using #12544F and #8BBB92 palette
        const orbs = [
          { x: width * 0.25, y: height * 0.25, r: 380, vx: 0.25, vy: 0.2, color: 'rgba(18, 84, 79, 0.07)' },    // Deep Forest #12544F
          { x: width * 0.75, y: height * 0.3, r: 420, vx: -0.2, vy: 0.25, color: 'rgba(139, 187, 146, 0.10)' }, // Soft Mint Sage #8BBB92
          { x: width * 0.5, y: height * 0.75, r: 360, vx: 0.2, vy: -0.2, color: 'rgba(18, 84, 79, 0.05)' },     // Deep Pine #12544F
          { x: width * 0.15, y: height * 0.8, r: 340, vx: -0.2, vy: -0.2, color: 'rgba(139, 187, 146, 0.08)' },  // Mint Sage #8BBB92
        ];

        let canvasAnimId: number;

        const renderCanvas = () => {
          ctx.clearRect(0, 0, width, height);

          const targetPullX = (mouseX / width - 0.5) * 50;
          const targetPullY = (mouseY / height - 0.5) * 50;

          orbs.forEach((orb) => {
            orb.x += orb.vx;
            orb.y += orb.vy;

            if (orb.x < -100 || orb.x > width + 100) orb.vx *= -1;
            if (orb.y < -100 || orb.y > height + 100) orb.vy *= -1;

            const drawX = orb.x + targetPullX;
            const drawY = orb.y + targetPullY;

            const grad = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, orb.r);
            grad.addColorStop(0, orb.color);
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(drawX, drawY, orb.r, 0, Math.PI * 2);
            ctx.fill();
          });

          canvasAnimId = requestAnimationFrame(renderCanvas);
        };

        renderCanvas();

        return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseleave', handleMouseLeave);
          window.removeEventListener('resize', handleResize);
          cancelAnimationFrame(animationFrameId);
          cancelAnimationFrame(canvasAnimId);
        };
      }
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-90"
      />

      {/* Trailing Dot in #12544F and #8BBB92 */}
      <div
        ref={cursorDotRef}
        className="pointer-events-none fixed left-0 top-0 z-50 h-2.5 w-2.5 rounded-full bg-gradient-to-tr from-[#12544F] to-[#8BBB92] shadow-sm shadow-[#12544F]/40 will-change-transform hidden md:block"
        style={{ transform: 'translate3d(-100px, -100px, 0)' }}
      />

      {/* Outer Smooth Lagging Ring */}
      <div
        ref={cursorRingRef}
        className="pointer-events-none fixed left-0 top-0 z-50 h-8 w-8 rounded-full border border-[#12544F]/40 transition-[border-color,background-color] duration-200 will-change-transform hidden md:block"
        style={{ transform: 'translate3d(-100px, -100px, 0)' }}
      />
    </>
  );
}
