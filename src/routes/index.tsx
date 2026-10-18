import { useT } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { images, pageHead } from "@/lib/noir-data";
import { Services } from "@/components/noir/services";
import { Comparison } from "@/components/noir/comparison";
import { NextChapter } from "@/components/noir/site-shell";
import { DepthVisual } from "@/components/noir/depth-visual";
export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Beauty, redefined",
      "A cinematic world of self-expression. Discover the NOIR PINK beauty concept: nail art, hair, makeup and skincare.",
    ),
  component: Index,
});
function Index() {
  const { m, c, t, lang } = useT();
  return (
    <>
      <DepthVisual className="hero" image={images.campaign} alt="NOIR PINK editorial beauty concept with dramatic pink rim lighting" priority>
        <div className="hero-content">
          <div className="eyebrow">
            <span />{m("NOIR PINK / BEAUTY ON YOUR OWN TERMS")}</div>
          <h1>{m("BEAUTY,")}<br />
            <em>{m("REDEFINED.")}</em>
          </h1>
          <p className="hero-copy">{m("Precision, creativity, and confidence in every detail.")}</p>
          <div className="hero-actions">
            <Button asChild>
              <Link to="/booking">{m("BOOK YOUR VISIT")}<ArrowUpRight />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="#services">{m("EXPLORE THE EXPERIENCE")}<ArrowRight />
              </a>
            </Button>
          </div>
        </div>
        <div className="hero-index">
          <span>{m("01 / THE NEW BEAUTY")}</span>
          <br />{m("NOT FOR EVERYONE.")}<br />{m("ENTIRELY FOR YOU.")}</div>
        <div className="hero-bottom">
          <a href="#services" className="scroll-cue">
            <ArrowDown size={15} />{m("SCROLL TO DISCOVER")}</a>
          <div className="hero-note">
            <span>{m("INDIVIDUALITY IS EVERYTHING.")}</span>
            <span>{m("NOIR PINK / CONCEPT")}<Plus size={10} className="inline ml-2" />
            </span>
          </div>
        </div>
      </DepthVisual>
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
            <h2>{m("SAME HAND.")}<br />{m("NEW EXPRESSION.")}</h2>
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
