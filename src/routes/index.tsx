import { useT } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/noir-data";
import { Services } from "@/components/noir/services";
import { Comparison } from "@/components/noir/comparison";
import { NextChapter } from "@/components/noir/site-shell";
import { SpatialJourney } from "@/components/noir/spatial-journey";
import { ScrollReveals } from "@/components/noir/scroll-reveals";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Beauty, redefined",
      "A cinematic world of self-expression. Discover PINKO beauty: nail art, hair, makeup and skincare.",
    ),
  component: Index,
});

function Index() {
  const { m, t } = useT();

  return (
    <>
      <ScrollReveals />
      <SpatialJourney />

      <div className="ticker" aria-hidden="true">
        <span>{m("NAIL ART")}</span>
        <span>✦</span>
        <span>{m("HAIR STYLING")}</span>
        <span>✦</span>
        <span>{m("MAKEUP")}</span>
        <span>✦</span>
        <span>{m("SKINCARE")}</span>
        <span>✦</span>
        <span>{m("SELF EXPRESSION")}</span>
      </div>

      <section className="editorial-section" id="services" data-reveal>
        <div className="section-top" data-reveal>
          <div>
            <div className="eyebrow">
              <span />
              {m("PRECISION MEETS PERSONALITY")}
            </div>
            <h2>
              {m("THE ART OF")}
              <br />
              {m("TRANSFORMATION.")}
            </h2>
          </div>
          <Button asChild variant="link">
            <Link to="/services">
              {m("ALL SERVICES")} <ArrowUpRight />
            </Link>
          </Button>
        </div>
        <Services preview />
      </section>

      <section className="pinko-manifesto" data-reveal aria-label={m("Beauty manifesto")}>
        <span className="pinko-manifesto-index">NO. 01 / THE PINKO POINT OF VIEW</span>
        <p>
          {t("Beauty is not about becoming someone else.", "زیبایی یعنی خودت باشی؛ نه اینکه به شخص دیگری تبدیل شوی.")}
        </p>
        <div className="pinko-manifesto-bottom">
          <span>{t("A LITTLE BOLDER. ENTIRELY YOU.", "جسورتر؛ اما کاملاً خودت.")}</span>
          <span className="pinko-manifesto-star" aria-hidden="true">✳</span>
        </div>
      </section>

      <section className="editorial-section transformation-section" data-reveal>
        <div className="section-top" data-reveal>
          <div>
            <div className="eyebrow">
              <span />
              {m("A DIFFERENT PERSPECTIVE")}
            </div>
            <h2>
              {t("SAME FACE.", "همان چهره.")}
              <br />
              {m("NEW EXPRESSION.")}
            </h2>
          </div>
          <Button asChild variant="link">
            <Link to="/experience">
              {m("THE EXPERIENCE")} <ArrowUpRight />
            </Link>
          </Button>
        </div>
        <Comparison />
      </section>

      <NextChapter />
    </>
  );
}
