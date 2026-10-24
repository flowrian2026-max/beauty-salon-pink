import { useEffect } from "react";

/** Lightweight scroll reveal: no animation dependency, respects reduced motion. */
export function ScrollReveals() {
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      targets.forEach((node) => node.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -7% 0px" });

    targets.forEach((node, index) => {
      node.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 90}ms`);
      observer.observe(node);
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
