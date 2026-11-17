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

  const raf = useRef(0);
  const videoReady = useRef(false);
  const lastSeekAt = useRef(0);

  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const video = videoRef.current;

    const measure = () => {
      if (!section.current) return 0;
      const bounds = section.current.getBoundingClientRect();
      // Measure against the actual sticky stage, not innerHeight. Chrome's
      // mobile browser bars can change innerHeight while svh stays stable.
      const stickyHeight = stage.current?.getBoundingClientRect().height ?? window.innerHeight;
      const total = Math.max(1, bounds.height - stickyHeight);
      return Math.max(0, Math.min(1, -bounds.top / total));
    };

    const tick = () => {
      raf.current = 0;
      const p = measure();

      if (stage.current) {
        stage.current.style.setProperty("--journey-progress", String(p));

        const chapter = p < 0.28 ? "1" : p < 0.68 ? "2" : "3";
        const nextChapter = media.matches ? "1" : chapter;
        if (stage.current.dataset["chapter"] !== nextChapter) {
          stage.current.dataset["chapter"] = nextChapter;
        }
      }

      if (video && videoReady.current && video.duration > 0 && !media.matches) {
        const start = 0.05;
        const end = Math.max(start + 0.1, video.duration - 0.08);
        // Quantize to the source's 24fps frame grid. Never queue a second seek
        // while Chrome is decoding the previous one.
        const desiredTime = start + p * (end - start);
        const frameTime = Math.round(desiredTime * 24) / 24;
        const needsSync = Math.abs(video.currentTime - frameTime) > 1 / 48;

        if (needsSync && !video.seeking) {
          const now = performance.now();
          if (now - lastSeekAt.current >= 40) {
            try {
              video.currentTime = frameTime;
              lastSeekAt.current = now;
            } catch {
              // Ignore seek errors during rapid scroll changes.
            }
          } else {
            schedule();
          }
        }
      }
    };

    const schedule = () => {
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    };

    const markReady = () => {
      if (!video || !video.duration || Number.isNaN(video.duration)) return;
      videoReady.current = true;
      video.currentTime = 0.001;
      lastSeekAt.current = performance.now();
      schedule();
    };

    const onPref = () => {
      const shouldReduce = media.matches;
      setReduced(shouldReduce);
      if (video) {
        video.preload = shouldReduce ? "none" : "auto";
        if (!shouldReduce && video.readyState === 0) video.load();
      }
      schedule();
    };

    if (video) {
      video.pause();
      video.muted = true;
      video.playsInline = true;
      video.preload = media.matches ? "none" : "auto";
      if (video.readyState >= 1) markReady();
      else video.addEventListener("loadedmetadata", markReady);
      video.addEventListener("seeked", schedule);
    }

    onPref();
    media.addEventListener("change", onPref);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    schedule();

    return () => {
      media.removeEventListener("change", onPref);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      video?.removeEventListener("loadedmetadata", markReady);
      video?.removeEventListener("seeked", schedule);
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
          <video
            ref={videoRef}
            className="scene-video scene-video-scrub"
            src={heroVideo}
            poster={heroPoster}
            muted
            playsInline
            preload={reduced ? "none" : "auto"}
            // No autoPlay / loop — time is driven by scroll.
          />
          {reduced && (
            <img
              className="scene-fallback"
              src={heroPoster}
              width={1344}
              height={768}
              alt=""
              fetchPriority="high"
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
          <span className="eyebrow">
            {t("01 — BEAUTY ON YOUR TERMS", "۰۱ — زیبایی به سبک خودتان")}
          </span>
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
          <span className="eyebrow">
            {t("02 — EVERY DETAIL, YOURS", "۰۲ — هر جزئیات، مال شما")}
          </span>
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
            <span className="finish-name">
              {t("PINKO / BEAUTY STUDY", "پینکو / مطالعهٔ زیبایی")}
            </span>
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
          <span className="journey-edition">
            {t("PINKO / STUDIO EXPERIENCE", "پینکو / تجربهٔ استودیو")}
          </span>
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
