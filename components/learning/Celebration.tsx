"use client";
import { useEffect, useRef } from "react";

/** Courte pluie de confettis aux couleurs Yoovi (désactivée si l'utilisateur réduit les animations). */
export function Confetti({ fire }: { fire: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!fire || !canvas.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = canvas.current;
    const ctx = c.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);
    const colors = ["#5046E5", "#FF64F5", "#FFD95A", "#0125C5", "#8B83EE", "#3DD39B"];
    const parts = Array.from({ length: 140 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 200,
      y: innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 13 - 4,
      r: Math.random() * 6 + 4,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() > 0.5 ? "rect" : "circle",
    }));
    let frame = 0;
    let raf = 0;
    const tick = () => {
      frame++;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of parts) {
        p.vy += 0.32; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - frame / 150);
        ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color;
        if (p.shape === "rect") ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
        else { ctx.beginPath(); ctx.arc(0, 0, p.r / 2.4, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
      if (frame < 150) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, innerWidth, innerHeight);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fire]);
  return <canvas ref={canvas} className="pointer-events-none fixed inset-0 z-[80] size-full" aria-hidden />;
}
