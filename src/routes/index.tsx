import { useT } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { images, pageHead } from "@/lib/noir-data";
import { Services } from "@/components/noir/services";
import { Comparison } from "@/components/noir/comparison";
import { NextChapter } from "@/components/noir/site-shell";
import { SpatialJourney } from "@/components/noir/spatial-journey";
export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Beauty, redefined",
      "A cinematic world of self-expression. Discover the NOIR PINK beauty concept: nail art, hair, makeup and skincare.",
    ),
  component: Index,
});
function Index() {
  const { m, t } = useT();
  return (
    <>
      <div
        role="status"
        style={{
          position: "relative",
          zIndex: 9999,
          padding: "18px 20px",
          background: "#ff2d55",
          color: "#ffffff",
          textAlign: "center",
          fontWeight: 800,
          letterSpacing: "0.12em",
          fontSize: "14px",
          borderBottom: "4px solid #111111",
        }}
      >
        GITHUB SYNC TEST · OCT 24 · IF YOU CAN SEE THIS, THE NEW CODE IS LOADED
      </div>
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
      <section className="editorial-section" id="services">
        <div className="section-top" data-reveal>
          <div>
            <div className="eyebrow">
              <span />{m("PRECISION MEETS PERSONALITY")}</div>
            <h2>{m("THE ART OF")}<br />{m("TRANSFORMATION.")}</h2>
          </div>
          <Button asChild variant="link">
            <Link to="/services">{m("ALL SERVICES")}<ArrowUpRight />
            </Link>
          </Button>
        </div>
        <Services preview />
      </section>
      <section className="editorial-section transformation-section">
        <div className="section-top" data-reveal>
          <div>
            <div className="eyebrow">
              <span />{m("A DIFFERENT PERSPECTIVE")}</div>
            <h2>{t("SAME FACE.", "همان چهره.")}<br />{m("NEW EXPRESSION.")}</h2>
          </div>
          <Button asChild variant="link">
            <Link to="/experience">{m("THE EXPERIENCE")}<ArrowUpRight />
            </Link>
          </Button>
        </div>
        <Comparison />
      </section>
      <NextChapter />
    </>
  );
}
