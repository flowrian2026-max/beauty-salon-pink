import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import heroVideo from "@/assets/hero-portrait.mp4.asset.json";
import heroPoster from "@/assets/hero-poster.jpg.asset.json";

export function SpatialJourney() {
  const { t } = useT();
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
      aria-label={t("PINKO signature beauty journey", "تجربهٔ زیبایی پینکو")}
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
      </div>
    </section>
  );
}
