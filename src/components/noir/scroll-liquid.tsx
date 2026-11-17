import { useEffect, useRef } from "react";
import liquidReference from "../../../1794912712424.jpg";

/**
 * PINKO's separate rose-gold liquid layer.
 * Uses the local 1794912712424.jpg reference, extracts the metallic rose-gold
 * ribbon onto a transparent canvas (eliminating the dark studio backdrop cleanly
 * across all browsers), and stays hidden until the Hero scrolls out of view so it
 * never overlaps or distorts the hero model.
 */
export function ScrollLiquid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let ready = false;

    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (cancelled) return;
      const w = img.naturalWidth || 768;
      const h = img.naturalHeight || 1376;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const d = imageData.data;

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i] ?? 0;
        const g = d[i + 1] ?? 0;
        const b = d[i + 2] ?? 0;
        const mx = Math.max(r, g, b);
        const mn = Math.min(r, g, b);
        const chroma = mx - mn;
        const warmth = Math.max(0, r - b);
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        const lumScore = (lum - 54) / 26;
        const chromaScore = (chroma - 7) / 11;
        const warmScore = (warmth - 7) / 11;
        const t = Math.max(0, Math.min(1, Math.max(lumScore, chromaScore, warmScore)));
        const alpha = t * t * (3 - 2 * t);

        if (alpha <= 0.004) {
          d[i + 3] = 0;
        } else {
          if (alpha < 0.98) {
            // Gently de-matte dark studio fringe (~RGB 25,24,26) along semi-transparent edges.
            const bgR = 25;
            const bgG = 24;
            const bgB = 26;
            const inv = 1 / Math.max(0.2, alpha);
            d[i] = Math.min(255, Math.max(0, Math.round((r - bgR * (1 - alpha)) * inv)));
            d[i + 1] = Math.min(255, Math.max(0, Math.round((g - bgG * (1 - alpha)) * inv)));
            d[i + 2] = Math.min(255, Math.max(0, Math.round((b - bgB * (1 - alpha)) * inv)));
          }
          d[i + 3] = Math.round(alpha * 255);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      ready = true;
      schedule();
    };
    img.src = liquidReference;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      if (!ready || reducedMotion.matches) {
        canvas.style.opacity = "0";
        return;
      }

      const heroEl = document.querySelector<HTMLElement>(".spatial-journey");
      const heroBottom = heroEl ? heroEl.getBoundingClientRect().bottom : 0;
      const vh = Math.max(1, window.innerHeight);

      // Remain invisible while the sticky hero is in view; emerge smoothly as it scrolls off.
      const pastHero = Math.max(0, Math.min(1, (vh * 0.92 - heroBottom) / (vh * 0.55)));
      if (pastHero <= 0) {
        canvas.style.opacity = "0";
        return;
      }

      const heroScrollExit = heroEl
        ? Math.max(0, heroEl.offsetTop + heroEl.offsetHeight - vh * 0.92)
        : 0;
      const remainingScroll = Math.max(
        1,
        document.documentElement.scrollHeight - vh - heroScrollExit,
      );
      const p = Math.max(0, Math.min(1, (window.scrollY - heroScrollExit) / remainingScroll));

      const fadeOut = Math.max(0, Math.min(1, (0.985 - p) / 0.12));
      const isMobile = window.innerWidth <= 760;
      const maxOpacity = isMobile ? 0.58 : 0.76;
      const opacity = pastHero * fadeOut * maxOpacity;

      const swayX = Math.sin(p * Math.PI * 1.4) * (isMobile ? -3 : -5);
      const travelY = 16 - p * 34;
      const scale = 0.88 + p * 0.14;
      const rotation = -5 + p * 11;

      canvas.style.opacity = String(opacity);
      canvas.style.setProperty("--liquid-x", `${swayX}vw`);
      canvas.style.setProperty("--liquid-y", `${travelY}vh`);
      canvas.style.setProperty("--liquid-scale", String(scale));
      canvas.style.setProperty("--liquid-rotation", `${rotation}deg`);
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const onMotionChange = () => schedule();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    reducedMotion.addEventListener("change", onMotionChange);
    schedule();

    return () => {
      cancelled = true;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reducedMotion.removeEventListener("change", onMotionChange);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} className="pinko-scroll-liquid" aria-hidden="true" />;
}
