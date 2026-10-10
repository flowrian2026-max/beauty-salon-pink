import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/noir-data";
import { Intro, NextChapter } from "@/components/noir/site-shell";
import { Services } from "@/components/noir/services";
export const Route = createFileRoute("/services")({
  head: () =>
    pageHead(
      "The art of transformation",
      "Explore nail art, hair styling, makeup and skincare in the NOIR PINK concept collection.",
    ),
  component: ServicesPage,
});
function ServicesPage() {
  return (
    <>
      <Intro
        eyebrow="PRECISION MEETS PERSONALITY"
        title="THE ART OF TRANSFORMATION."
        copy="Considered rituals. Uncompromising detail. A new way to express who you are."
      />
      <div className="page-content">
        <Services />
      </div>
      <NextChapter />
    </>
  );
}
