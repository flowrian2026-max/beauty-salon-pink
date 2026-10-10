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
  return (
    <>
      <DepthVisual className="hero" image={images.campaign} alt="NOIR PINK editorial beauty concept with dramatic pink rim lighting" priority>
        <div className="hero-content">
          <div className="eyebrow">
            <span /> NOIR PINK / BEAUTY ON YOUR OWN TERMS
          </div>
          <h1>
            BEAUTY,
            <br />
            <em>REDEFINED.</em>
          </h1>
          <p className="hero-copy">
            Precision, creativity, and confidence in every detail.
          </p>
          <div className="hero-actions">
            <Button asChild>
              <Link to="/experience">
                EXPLORE THE EXPERIENCE <ArrowUpRight />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/booking">
                BOOK YOUR VISIT <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
        <div className="hero-index">
          <span>01 / THE NEW BEAUTY</span>
          <br />
          NOT FOR EVERYONE.
          <br />
          ENTIRELY FOR YOU.
        </div>
        <div className="hero-bottom">
          <Link to="/services" className="scroll-cue">
            <ArrowDown size={15} /> SCROLL TO DISCOVER
          </Link>
          <div className="hero-note">
            <span>INDIVIDUALITY IS EVERYTHING.</span>
            <span>
              NOIR PINK / CONCEPT <Plus size={10} className="inline ml-2" />
            </span>
          </div>
        </div>
      </DepthVisual>
      <div className="ticker" aria-hidden="true">
        <span>NAIL ART</span>
        <span>✦</span>
        <span>HAIR STYLING</span>
        <span>✦</span>
        <span>MAKEUP</span>
        <span>✦</span>
        <span>SKINCARE</span>
        <span>✦</span>
        <span>SELF EXPRESSION</span>
      </div>
      <section className="editorial-section">
        <div className="section-top" data-reveal>
          <div>
            <div className="eyebrow">
              <span /> PRECISION MEETS PERSONALITY
            </div>
            <h2>
              THE ART OF
              <br />
              TRANSFORMATION.
            </h2>
          </div>
          <Button asChild variant="link">
            <Link to="/services">
              ALL SERVICES <ArrowUpRight />
            </Link>
          </Button>
        </div>
        <Services preview />
      </section>
      <section className="editorial-section transformation-section">
        <div className="section-top" data-reveal>
          <div>
            <div className="eyebrow">
              <span /> A DIFFERENT PERSPECTIVE
            </div>
            <h2>
              SAME HAND.
              <br />
              NEW EXPRESSION.
            </h2>
          </div>
          <Button asChild variant="link">
            <Link to="/experience">
              THE EXPERIENCE <ArrowUpRight />
            </Link>
          </Button>
        </div>
        <Comparison />
      </section>
      <NextChapter />
    </>
  );
}
