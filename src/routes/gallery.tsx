import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/noir-data";
import { Intro, NextChapter } from "@/components/noir/site-shell";
import { Gallery } from "@/components/noir/gallery";
import { useT } from "@/lib/i18n";
export const Route = createFileRoute("/gallery")({
  head: () =>
    pageHead(
      "The visual world",
      "A curated concept gallery of sculptural nails, expressive makeup, luminous skin and bold hair.",
    ),
  component: GalleryPage,
});
function GalleryPage() {
  const { t } = useT();
  return (
    <>
      <Intro
        eyebrow={t("THE NOIR PINK EDIT", "گزیده‌ی نوآر پینک")}
        title={t("EXPRESSION. UNFILTERED.", "بیان، بی‌فیلتر.")}
        copy={t("A visual world where individuality takes the spotlight.", "دنیایی تصویری که فردیت در مرکز آن است.")}
      />
      <div className="page-content">
        <Gallery />
      </div>
      <NextChapter />
    </>
  );
}
