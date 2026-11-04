import { createFileRoute } from "@tanstack/react-router";
import { images, pageHead } from "@/lib/noir-data";
import { Intro, NextChapter } from "@/components/noir/site-shell";
import { useDemo } from "@/components/noir/demo-provider";
import { useT } from "@/lib/i18n";
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
  const { t, c } = useT();
  return (
    <>
      <Intro
        eyebrow={t("THE NOIR PINK POINT OF VIEW", "نگاه نوآر پینک")}
        title={t("BEYOND THE ORDINARY.", "فراتر از معمول.")}
      />
      <section className="page-content story">
        <img
          className="story-image"
          src={images.hair}
          width="864"
          height="1104"
          alt={t("NOIR PINK hair campaign concept", "کمپین مفهومی موی نوآر پینک")}
          loading="lazy"
        />
        <div data-reveal>
          <div className="eyebrow">
            <span /> {t("BEAUTY ON YOUR OWN TERMS", "زیبایی به سبک خودتان")}
          </div>
          <h2>
            {t("NOT A LOOK.", "نه فقط یک ظاهر؛")}
            <br />
            {t("A FEELING.", "یک حس.")}
          </h2>
          <p>{c(data.story)}</p>
          <p className="sample-note">
            {t(
              "Editable brand concept copy · AI-generated sample photography. The salon’s real story will be added here.",
              "متن مفهومی و قابل ویرایش · عکس‌های نمونه با هوش مصنوعی. داستان واقعی سالن اینجا اضافه می‌شود.",
            )}
          </p>
        </div>
      </section>
      <NextChapter />
    </>
  );
}
