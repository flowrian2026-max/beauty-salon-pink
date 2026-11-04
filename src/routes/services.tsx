import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/noir-data";
import { Intro, NextChapter } from "@/components/noir/site-shell";
import { Services } from "@/components/noir/services";
import { useT } from "@/lib/i18n";
export const Route = createFileRoute("/services")({
  head: () =>
    pageHead(
      "The art of transformation",
      "Explore nail art, hair styling, makeup and skincare in the NOIR PINK concept collection.",
    ),
  component: ServicesPage,
});
function ServicesPage() {
  const { t } = useT();
  return (
    <>
      <Intro
        eyebrow={t("PRECISION MEETS PERSONALITY", "دقت در کنار شخصیت")}
        title={t("THE ART OF TRANSFORMATION.", "هنر دگرگونی.")}
        copy={t(
          "Considered rituals. Uncompromising detail. A new way to express who you are.",
          "آیین‌هایی سنجیده، جزئیاتی بی‌نقص، راهی تازه برای بیان خودتان.",
        )}
      />
      <div className="page-content">
        <Services />
      </div>
      <NextChapter />
    </>
  );
}
