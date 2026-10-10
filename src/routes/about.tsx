import { createFileRoute } from "@tanstack/react-router";
import { images, pageHead } from "@/lib/noir-data";
import { Intro, NextChapter } from "@/components/noir/site-shell";
import { useDemo } from "@/components/noir/demo-provider";
export const Route = createFileRoute("/about")({
  head: () =>
    pageHead(
      "Beyond the ordinary",
      "Discover the NOIR PINK brand concept: creativity, considered detail and beauty on your own terms.",
    ),
  component: AboutPage,
});
function AboutPage() {
  const { data } = useDemo();
  return (
    <>
      <Intro eyebrow="THE NOIR PINK POINT OF VIEW" title="BEYOND THE ORDINARY." />
      <section className="page-content story">
        <img
          className="story-image"
          src={images.hair}
          width="864"
          height="1104"
          alt="NOIR PINK hair campaign concept"
          loading="lazy"
        />
        <div data-reveal>
          <div className="eyebrow">
            <span /> BEAUTY ON YOUR OWN TERMS
          </div>
          <h2>
            NOT A LOOK.
            <br />A FEELING.
          </h2>
          <p>{data.story}</p>
          <p className="sample-note">
            Editable brand concept copy · AI-generated sample photography. The salon’s real story
            will be added here.
          </p>
        </div>
      </section>
      <NextChapter />
    </>
  );
}
