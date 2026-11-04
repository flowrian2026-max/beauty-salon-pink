import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/noir-data";
import { useDemo } from "@/components/noir/demo-provider";
import { DepthVisual } from "@/components/noir/depth-visual";
import { NextChapter } from "@/components/noir/site-shell";
import { useT } from "@/lib/i18n";

type Pair = [string, string];
const ritual: Pair[] = [
  ["CONSULTATION", "مشاوره"],
  ["PREPARATION", "آماده‌سازی"],
  ["THE CRAFT", "اجرای هنرمندانه"],
  ["THE FINISH", "جزئیات نهایی"],
];
const ritualCopy: Pair[] = [
  [
    "We listen first: your goals, occasion and preferences shape the plan.",
    "اول گوش می‌دهیم: هدف، مناسبت و سلیقه‌ی شما مسیر کار را می‌سازد.",
  ],
  [
    "Every detail is prepared with care before the work begins.",
    "پیش از شروع، همه‌ی جزئیات با دقت آماده می‌شود.",
  ],
  [
    "Precision and creativity, applied at your pace.",
    "دقت و خلاقیت، با ریتمی که برای شما راحت است.",
  ],
  ["A considered final look, reviewed together.", "یک نتیجه‌ی سنجیده که با هم مرورش می‌کنیم."],
];
const faq: [Pair, Pair][] = [
  [
    ["How much does it cost?", "هزینه چقدر است؟"],
    [
      "Pricing depends on your request and is confirmed by the studio on inquiry.",
      "هزینه به درخواست شما بستگی دارد و هنگام استعلام توسط سالن اعلام می‌شود.",
    ],
  ],
  [
    ["How long does it take?", "چقدر طول می‌کشد؟"],
    [
      "Timing varies by look; the studio confirms it when they reply.",
      "زمان بسته به نوع کار متفاوت است و سالن هنگام پاسخ آن را اعلام می‌کند.",
    ],
  ],
  [
    ["Is my appointment confirmed after the form?", "بعد از فرم، نوبتم قطعی است؟"],
    [
      "No. Your inquiry is a request; only the studio can confirm an appointment.",
      "خیر. فرم فقط درخواست است و فقط سالن می‌تواند نوبت را تأیید کند.",
    ],
  ],
];

export const Route = createFileRoute("/services_/$serviceId")({
  head: ({ params }) =>
    pageHead(
      params.serviceId.replace(/-/g, " ").toUpperCase(),
      "Discover this NOIR PINK service: the ritual, what to expect and how to send an inquiry.",
    ),
  component: ServiceDetail,
});

function ServiceDetail() {
  const { serviceId } = Route.useParams();
  const { data } = useDemo();
  const { t, c } = useT();
  const index = data.services.findIndex((s) => s.id === serviceId);
  const s = data.services[index];
  if (!s) {
    return (
      <section className="page-content service-missing">
        <h1>{t("SERVICE NOT FOUND.", "خدمت پیدا نشد.")}</h1>
        <Button asChild variant="outline">
          <Link to="/services">
            <ArrowLeft /> {t("ALL SERVICES", "همه‌ی خدمات")}
          </Link>
        </Button>
      </section>
    );
  }
  const others = data.services.filter((o) => o.id !== s.id).slice(0, 3);
  return (
    <>
      <DepthVisual
        className="experience-opening service-hero"
        image={s.image}
        alt={c(s.title)}
        priority
      >
        <div className="experience-opening-copy">
          <div className="eyebrow">
            <span /> 0{index + 1} / {t("THE SIGNATURE SERVICE", "خدمت امضادار")}
          </div>
          <h1>{c(s.title)}</h1>
          <p>{c(s.description)}</p>
          <div className="service-hero-actions">
            <Button asChild>
              <Link to="/booking" search={{ service: s.id }}>
                {t("SEND AN INQUIRY", "ارسال درخواست")} <ArrowUpRight />
              </Link>
            </Button>
            <span className="service-meta">
              <span>{s.price || t("PRICING ON INQUIRY", "قیمت با استعلام")}</span>
              {s.duration && <span>{s.duration}</span>}
            </span>
          </div>
        </div>
        <span className="image-credit">
          {t("AI CONCEPT PHOTOGRAPHY", "عکاسی مفهومی هوش مصنوعی")}
        </span>
      </DepthVisual>

      <section className="editorial-section service-ritual">
        <div className="section-top" data-reveal>
          <div>
            <div className="eyebrow">
              <span /> {t("THE RITUAL", "مسیر تجربه")}
            </div>
            <h2>
              {t("FOUR STEPS.", "چهار مرحله.")}
              <br />
              <em>{t("ONE SIGNATURE.", "یک امضا.")}</em>
            </h2>
          </div>
        </div>
        <ol className="ritual-list">
          {ritual.map(([en, fa], i) => (
            <li key={en} data-reveal>
              <span className="ritual-number">0{i + 1}</span>
              <h3>{t(en, fa)}</h3>
              <p>{t(...ritualCopy[i]!)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="editorial-section service-faq">
        <div className="eyebrow">
          <span /> {t("GOOD TO KNOW", "سؤالات رایج")}
        </div>
        {faq.map(([q, a]) => (
          <details key={q[0]} className="faq-item">
            <summary>{t(...q)}</summary>
            <p>{t(...a)}</p>
          </details>
        ))}
      </section>

      <section className="editorial-section">
        <div className="section-top">
          <div>
            <div className="eyebrow">
              <span /> {t("CONTINUE EXPLORING", "ادامه‌ی کاوش")}
            </div>
          </div>
          <Button asChild variant="link">
            <Link to="/services">
              {t("ALL SERVICES", "همه‌ی خدمات")} <ArrowUpRight />
            </Link>
          </Button>
        </div>
        <div className="related-services">
          {others.map((o) => (
            <Link
              key={o.id}
              to="/services/$serviceId"
              params={{ serviceId: o.id }}
              className="related-service"
            >
              <img src={o.image} alt="" loading="lazy" width="864" height="1104" />
              <span>
                {c(o.title)} <ArrowUpRight size={18} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <NextChapter />
    </>
  );
}
