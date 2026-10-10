import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/noir-data";
import { Intro, NextChapter } from "@/components/noir/site-shell";
import { Comparison } from "@/components/noir/comparison";
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
      <Intro
        eyebrow="A DIFFERENT PERSPECTIVE"
        title="A NEW DIMENSION."
        copy="The smallest details can change everything. Explore the space between understated and unforgettable."
      />
      <div className="page-content">
        <Comparison />
      </div>
      <NextChapter />
    </>
  );
}
