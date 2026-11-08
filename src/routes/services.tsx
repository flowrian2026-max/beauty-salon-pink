import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
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
        <div className="consultation-entry">
          <h2>{t("A DIRECTION THAT FEELS LIKE YOU.", "مسیری که شبیه خودتان است.")}</h2>
          <div className="flex flex-wrap gap-4">
            <Button asChild variant="outline"><Link to="/consultation">{t("PERSONAL CONSULTATION", "مشاورهٔ شخصی")}<ArrowUpRight /></Link></Button>
            <Button asChild variant="outline"><Link to="/occasions">{t("THE OCCASION EDIT", "برای مناسبت شما")}<ArrowUpRight /></Link></Button>
          </div>
        </div>
      </div>
      <NextChapter />
    </>
  );
}
