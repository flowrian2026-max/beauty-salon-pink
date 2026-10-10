import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/noir-data";
import { NextChapter, BookLink } from "@/components/noir/site-shell";
import { Comparison } from "@/components/noir/comparison";
import { images } from "@/lib/noir-data";
import { DepthVisual } from "@/components/noir/depth-visual";
export const Route = createFileRoute("/experience")({
  head: () =>
    pageHead(
      "A new dimension",
      "Explore a visual before-and-after concept at NOIR PINK. Sample imagery, not real customer transformations.",
    ),
  component: ExperiencePage,
});
function ExperiencePage() {
  return (
    <>
      <DepthVisual className="experience-opening" image={images.campaign} alt="NOIR PINK dramatic makeup campaign concept" priority>
        <div className="experience-opening-copy">
          <div className="eyebrow"><span /> THE NOIR PINK EXPERIENCE</div>
          <h1>MORE THAN<br />A <em>REFLECTION.</em></h1>
          <p>The smallest details. The strongest expression.</p>
        </div>
        <span className="image-credit">01 / EXPRESSION · CONCEPT PHOTOGRAPHY</span>
      </DepthVisual>
      <section className="editorial-section transformation-section">
        <div className="section-top" data-reveal>
          <div><div className="eyebrow"><span /> 02 / THE FINISH</div><h2>SAME HAND.<br /><em>NEW EXPRESSION.</em></h2></div>
          <p className="editorial-copy">A natural beginning. A considered finish. Precision in every detail.</p>
        </div>
        <Comparison />
      </section>
      <section className="experience-editorial">
        <DepthVisual className="detail-visual" image={images.nails} alt="Sculptural chrome and pink nail art, AI editorial concept"><span className="image-credit">03 / THE DETAIL</span></DepthVisual>
        <div className="detail-copy" data-reveal><div className="eyebrow"><span /> PRECISION MEETS PERSONALITY</div><h2>SMALL DETAILS.<br /><em>BOLD ENERGY.</em></h2><p>Texture. Colour. A signature that is entirely yours.</p><BookLink /></div>
        <DepthVisual className="movement-visual" image={images.hair} alt="Hair movement, AI editorial beauty concept"><span className="image-credit">04 / THE MOVEMENT</span></DepthVisual>
        <p className="sample-note">AI-generated editorial concepts · Replaceable imagery, not salon work.</p>
      </section>
      <NextChapter />
    </>
  );
}
