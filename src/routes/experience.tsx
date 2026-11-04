import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/noir-data";
import { NextChapter, BookLink } from "@/components/noir/site-shell";
import { Comparison } from "@/components/noir/comparison";
import { images } from "@/lib/noir-data";
import { DepthVisual } from "@/components/noir/depth-visual";
import { useT } from "@/lib/i18n";
export const Route = createFileRoute("/experience")({
  head: () =>
    pageHead(
      "A new dimension",
      "Explore a visual before-and-after concept at NOIR PINK. Sample imagery, not real customer transformations.",
    ),
  component: ExperiencePage,
});
function ExperiencePage() {
  const { t } = useT();
  return (
    <>
      <DepthVisual
        className="experience-opening"
        image={images.campaign}
        alt={t("NOIR PINK dramatic makeup campaign concept", "کمپین مفهومی آرایش نوآر پینک")}
        priority
      >
        <div className="experience-opening-copy">
          <div className="eyebrow">
            <span /> {t("THE NOIR PINK EXPERIENCE", "تجربه‌ی نوآر پینک")}
          </div>
          <h1>
            {t("MORE THAN", "فراتر از")}
            <br />
            {t("A ", "یک ")}
            <em>{t("REFLECTION.", "بازتاب.")}</em>
          </h1>
          <p>
            {t(
              "The smallest details. The strongest expression.",
              "کوچک‌ترین جزئیات، قوی‌ترین بیان.",
            )}
          </p>
        </div>
        <span className="image-credit">
          01 / {t("EXPRESSION · CONCEPT PHOTOGRAPHY", "بیان · عکاسی مفهومی")}
        </span>
      </DepthVisual>
      <section className="editorial-section transformation-section">
        <div className="section-top" data-reveal>
          <div>
            <div className="eyebrow">
              <span /> 02 / {t("THE FINISH", "نتیجه")}
            </div>
            <h2>
              {t("SAME FACE.", "همان چهره.")}
              <br />
              <em>{t("NEW EXPRESSION.", "بیانی تازه.")}</em>
            </h2>
          </div>
          <p className="editorial-copy">
            {t(
              "A natural beginning. A considered finish. Precision in every detail.",
              "شروعی طبیعی، پایانی سنجیده، دقت در هر جزئیات.",
            )}
          </p>
        </div>
        <Comparison />
      </section>
      <section className="experience-editorial">
        <DepthVisual
          className="detail-visual"
          image={images.nails}
          alt={t(
            "Sculptural chrome and pink nail art, AI editorial concept",
            "طراحی ناخن کروم و صورتی، تصویر مفهومی هوش مصنوعی",
          )}
        >
          <span className="image-credit">03 / {t("THE DETAIL", "جزئیات")}</span>
        </DepthVisual>
        <div className="detail-copy" data-reveal>
          <div className="eyebrow">
            <span /> {t("PRECISION MEETS PERSONALITY", "دقت در کنار شخصیت")}
          </div>
          <h2>
            {t("SMALL DETAILS.", "جزئیات کوچک.")}
            <br />
            <em>{t("BOLD ENERGY.", "انرژی جسورانه.")}</em>
          </h2>
          <p>
            {t(
              "Texture. Colour. A signature that is entirely yours.",
              "بافت، رنگ، امضایی که کاملاً مال شماست.",
            )}
          </p>
          <BookLink />
        </div>
        <DepthVisual
          className="movement-visual"
          image={images.hair}
          alt={t("Hair movement, AI editorial beauty concept", "حرکت مو، تصویر مفهومی هوش مصنوعی")}
        >
          <span className="image-credit">04 / {t("THE MOVEMENT", "حرکت")}</span>
        </DepthVisual>
        <p className="sample-note">
          {t(
            "AI-generated editorial concepts · Replaceable imagery, not salon work.",
            "تصاویر مفهومی ساخته‌شده با هوش مصنوعی · قابل تعویض، نه کار واقعی سالن.",
          )}
        </p>
      </section>
      <NextChapter />
    </>
  );
}
