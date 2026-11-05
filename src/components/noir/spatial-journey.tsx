import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroVideo from "@/assets/hero-portrait.mp4.asset.json";
import heroPoster from "@/assets/hero-poster.jpg.asset.json";

export function SpatialJourney() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => setReduced(media.matches);
    preference();
    media.addEventListener("change", preference);
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!section.current || !stage.current) return;
        const bounds = section.current.getBoundingClientRect();
        progress.current = Math.max(
          0,
          Math.min(1, -bounds.top / Math.max(1, bounds.height - window.innerHeight)),
        );
        stage.current.style.setProperty("--journey-progress", String(progress.current));
        const chapter = progress.current < 0.3 ? "1" : progress.current < 0.73 ? "2" : "3";
        stage.current.dataset["chapter"] = media.matches ? "1" : chapter;
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      media.removeEventListener("change", preference);
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <section
      ref={section}
      className={`spatial-journey ${reduced ? "journey-static" : ""}`}
      aria-label="PINKO signature beauty journey"
    >
      <div ref={stage} className="journey-stage" data-chapter="1">
        <div className="scene-layer" aria-hidden="true">
          {reduced ? (
            <img
              className="scene-fallback"
              src={heroPoster.url}
              width={720}
              height={1280}
              alt=""
              fetchPriority="high"
            />
          ) : (
            <video
              className="scene-video"
              src={heroVideo.url}
              poster={heroPoster.url}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />
          )}
          <div className="scene-shade" />
        </div>
        <div className="journey-coordinates" aria-hidden="true">
          <span>PINKO / THE SIGNATURE EXPERIENCE</span>
          <span>BEAUTY / FORM / SELF-EXPRESSION</span>
        </div>
        <div className="journey-title">
          <span className="eyebrow">PINKO · BEAUTY STUDIO</span>
          <h1>
            PINKO
            <span>
              BEAUTY,
              <br />
              REDEFINED.
            </span>
          </h1>
        </div>
        <div className="journey-intro">
          <p>
            Beauty as an art.
            <br />
            Self-expression as a signature.
          </p>
          <Button variant="default" className="journey-primary-button" asChild>
            <Link to="/services">
              EXPLORE THE WORK <ArrowUpRight />
            </Link>
          </Button>
        </div>
        <div className="journey-chapter journey-chapter-two">
          <span className="eyebrow">01 — BEAUTY ON YOUR TERMS</span>
          <h2>
            Not a standard.
            <br />
            <em>Your signature.</em>
          </h2>
          <p>
            Beauty is not a formula.
            <br />
            It is your own expression.
          </p>
        </div>
        <div className="journey-chapter journey-chapter-three">
          <span className="eyebrow">02 — EVERY DETAIL, YOURS</span>
          <h2>
            Every detail.
            <br />
            <em>A new dimension.</em>
          </h2>
          <Button variant="outline" className="journey-secondary-button" asChild>
            <Link to="/services">
              ENTER THE COLLECTION <ArrowUpRight />
            </Link>
          </Button>
        </div>
        {!reduced && (
          <div className="signature-controls" aria-hidden="true">
            <span className="finish-name">PINKO / BEAUTY STUDY</span>
            <span className="control-rule" />
            <span className="finish-name">01 — 03</span>
          </div>
        )}
        <div className="journey-bottom">
          <a href="#services" className="scroll-indicator" aria-label="Scroll to services">
            <ArrowDown size={18} />
            <span>BEYOND THE SURFACE</span>
          </a>
          <div className="chapter-track" aria-hidden="true">
            <span className="track-one">01</span>
            <i />
            <span className="track-two">02</span>
            <i />
            <span className="track-three">03</span>
          </div>
          <span className="journey-edition">PINKO / STUDIO EXPERIENCE</span>
        </div>
      </div>
    </section>
  );
}
