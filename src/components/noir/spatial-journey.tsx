import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import heroVideo from "@/assets/chrome-melt.mp4";
import heroPoster from "@/assets/chrome-melt-poster.jpg";

/**
 * Cinematic scroll-scrubbed hero.
 * The portrait video no longer loops — its currentTime is driven by scroll progress,
 * so the model’s turn and reveal feel locked to the user’s scroll.
 */
export function SpatialJourney() {
  const { t } = useT();
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const progress = useRef(0);
  const smooth = useRef(0);
  const raf = useRef(0);
  const videoReady = useRef(false);

  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onPref = () => setReduced(media.matches);
    onPref();
    media.addEventListener("change", onPref);

    const video = videoRef.current;
    if (video) {
      // Keep the video paused; we control time manually.
      video.pause();
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";

      const markReady = () => {
        videoReady.current = true;
        // Jump to first frame once metadata is known.
        if (video.duration && !Number.isNaN(video.duration)) {
          video.currentTime = 0.001;
        }
      };

      if (video.readyState >= 1) markReady();
      else video.addEventListener("loadedmetadata", markReady, { once: true });
    }

    const measure = () => {
      if (!section.current) return 0;
      const bounds = section.current.getBoundingClientRect();
      const total = Math.max(1, bounds.height - window.innerHeight);
      return Math.max(0, Math.min(1, -bounds.top / total));
    };

    const tick = () => {
      const target = measure();
      // Smooth lerp — feels more premium than raw scroll values.
      smooth.current += (target - smooth.current) * 0.085;
      // Snap when very close to avoid endless micro-updates.
      if (Math.abs(target - smooth.current) < 0.0008) smooth.current = target;

      progress.current = smooth.current;
      const p = progress.current;

      if (stage.current) {
        stage.current.style.setProperty("--journey-progress", String(p));

        // Chapter breakpoints aligned with the three narrative beats.
        const chapter = p < 0.28 ? "1" : p < 0.68 ? "2" : "3";
        if (stage.current.dataset["chapter"] !== chapter) {
          stage.current.dataset["chapter"] = media.matches ? "1" : chapter;
        }

        // Subtle scale + vertical drift for depth.
        const scale = 1 + p * 0.08;
        const yShift = p * -2.5; // percent
        stage.current.style.setProperty("--journey-scale", String(scale));
        stage.current.style.setProperty("--journey-y", `${yShift}%`);
      }

      // Scrub the video. We leave a tiny head/tail margin so the first/last frames stay clean.
      if (video && videoReady.current && video.duration && !media.matches) {
        const start = 0.05;
        const end = Math.max(start + 0.1, video.duration - 0.08);
        const time = start + p * (end - start);
        // Only seek when the difference is meaningful (avoids jank on some browsers).
        if (Math.abs(video.currentTime - time) > 0.04) {
          try {
            video.currentTime = time;
          } catch {
            // Ignore seek errors during rapid scrubbing.
          }
        }
      }

      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);

    return () => {
      media.removeEventListener("change", onPref);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <section
      ref={section}
      className={`spatial-journey ${reduced ? "journey-static" : ""}`}
      aria-label={t("PINKO signature beauty journey", "تجربهٔ زیبایی پینکو")}
    >
      <div ref={stage} className="journey-stage" data-chapter="1">
        <div className="scene-layer" aria-hidden="true">
          {reduced ? (
            <img
              className="scene-fallback"
              src={heroPoster}
              width={1344}
              height={768}
              alt=""
              fetchPriority="high"
            />
          ) : (
            <video
              ref={videoRef}
              className="scene-video scene-video-scrub"
              src={heroVideo}
              poster={heroPoster}
              muted
              playsInline
              preload="auto"
              // No autoPlay / loop — time is driven by scroll.
            />
          )}
          <div className="scene-shade" />
          <div className="scene-vignette" />
        </div>

        <div className="journey-coordinates" aria-hidden="true">
          <span>{t("PINKO / THE SIGNATURE EXPERIENCE", "پینکو / تجربهٔ امضادار")}</span>
          <span>{t("BEAUTY / FORM / SELF-EXPRESSION", "زیبایی / فرم / بیان خود")}</span>
        </div>

        <div className="journey-title">
          <span className="eyebrow">{t("PINKO · BEAUTY STUDIO", "پینکو · استودیو زیبایی")}</span>
          <h1>
            PINKO
            <span>
              {t("BEAUTY,", "زیبایی،")}
              <br />
              {t("REDEFINED.", "با تعریفی تازه.")}
            </span>
          </h1>
        </div>

        <div className="journey-intro">
          <p>
            {t("Beauty as an art.", "زیبایی به‌مثابه هنر.")}
            <br />
            {t("Self-expression as a signature.", "بیان خود، به‌جای امضا.")}
          </p>
          <Button variant="default" className="journey-primary-button" asChild>
            <Link to="/services">
              {t("EXPLORE THE WORK", "مشاهدهٔ نمونه‌کارها")} <ArrowUpRight />
            </Link>
          </Button>
        </div>

        <div className="journey-chapter journey-chapter-two">
          <span className="eyebrow">{t("01 — BEAUTY ON YOUR TERMS", "۰۱ — زیبایی به سبک خودتان")}</span>
          <h2>
            {t("Not a standard.", "نه یک قالب.")}
            <br />
            <em>{t("Your signature.", "امضای خودتان.")}</em>
          </h2>
          <p>
            {t("Beauty is not a formula.", "زیبایی یک فرمول نیست.")}
            <br />
            {t("It is your own expression.", "بیان خودِ شماست.")}
          </p>
        </div>

        <div className="journey-chapter journey-chapter-three">
          <span className="eyebrow">{t("02 — EVERY DETAIL, YOURS", "۰۲ — هر جزئیات، مال شما")}</span>
          <h2>
            {t("Every detail.", "هر جزئیات.")}
            <br />
            <em>{t("A new dimension.", "بُعدی تازه.")}</em>
          </h2>
          <Button variant="outline" className="journey-secondary-button" asChild>
            <Link to="/services">
              {t("ENTER THE COLLECTION", "ورود به مجموعه")} <ArrowUpRight />
            </Link>
          </Button>
        </div>

        {!reduced && (
          <div className="signature-controls" aria-hidden="true">
            <span className="finish-name">{t("PINKO / BEAUTY STUDY", "پینکو / مطالعهٔ زیبایی")}</span>
            <span className="control-rule" />
            <span className="finish-name">01 — 03</span>
          </div>
        )}

        <div className="journey-bottom">
          <a
            href="#services"
            className="scroll-indicator"
            aria-label={t("Scroll to services", "رفتن به خدمات")}
          >
            <ArrowDown size={18} />
            <span>{t("BEYOND THE SURFACE", "فراتر از ظاهر")}</span>
          </a>
          <div className="chapter-track" aria-hidden="true">
            <span className="track-one">01</span>
            <i />
            <span className="track-two">02</span>
            <i />
            <span className="track-three">03</span>
          </div>
          <span className="journey-edition">{t("PINKO / STUDIO EXPERIENCE", "پینکو / تجربهٔ استودیو")}</span>
        </div>

        {/* Progress bar — subtle cinematic cue */}
        {!reduced && (
          <div className="journey-progress-bar" aria-hidden="true">
            <span className="journey-progress-fill" />
          </div>
        )}
      </div>
    </section>
  );
}
