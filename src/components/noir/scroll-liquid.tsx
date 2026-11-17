import { useEffect, useRef } from "react";

const LIQUID_REFERENCE =
  "https://raw.githubusercontent.com/flowrian2026-max/beauty-salon-pink/main/1794912712424.jpg";

/**
 * PINKO's separate rose-gold ribbon layer.
 * Its position and scale are scrubbed by page scroll so the liquid can travel
 * out of the hero and continue across the editorial sections.
 */
export function ScrollLiquid() {
  const image = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const node = image.current;
    if (!node) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const progress = Math.max(0, Math.min(1, window.scrollY / maxScroll));

      const fadeIn = Math.max(0, Math.min(1, (progress - 0.035) / 0.12));
      const fadeOut = Math.max(0, Math.min(1, (0.985 - progress) / 0.13));
      const opacity = reducedMotion.matches ? 0 : fadeIn * fadeOut * 0.82;

      node.style.opacity = String(opacity);
      node.style.setProperty("--liquid-x", `${15 - progress * 16}vw`);
      node.style.setProperty("--liquid-y", `${-28 + progress * 90}vh`);
      node.style.setProperty("--liquid-scale", String(0.78 + progress * 0.2));
      node.style.setProperty("--liquid-rotation", `${-9 + progress * 13}deg`);
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const onMotionChange = () => schedule();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reducedMotion.addEventListener("change", onMotionChange);
    schedule();

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reducedMotion.removeEventListener("change", onMotionChange);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <img
      ref={image}
      className="pinko-scroll-liquid"
      src={LIQUID_REFERENCE}
      alt=""
      aria-hidden="true"
      draggable={false}
      loading="lazy"
      decoding="async"
    />
  );
}
