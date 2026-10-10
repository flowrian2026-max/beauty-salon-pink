import { useRef, type ReactNode } from "react";

export function DepthVisual({ image, alt, className = "", children, priority = false }: {
  image: string; alt: string; className?: string; children?: ReactNode; priority?: boolean;
}) {
  const photo = useRef<HTMLImageElement>(null);
  return (
    <section className={`depth-visual ${className}`} onPointerMove={(e) => {
      if (!photo.current || e.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const box = e.currentTarget.getBoundingClientRect();
      photo.current.style.translate = `${(e.clientX - box.left - box.width / 2) * 0.012}px ${(e.clientY - box.top - box.height / 2) * 0.009}px`;
    }} onPointerLeave={() => { if (photo.current) photo.current.style.translate = "0 0"; }}>
      <img ref={photo} className="depth-photo" src={image} alt={alt} width="1600" height="1104" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} />
      {children}
    </section>
  );
}