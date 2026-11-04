import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Intro, NextChapter } from "./site-shell";
import { useT } from "@/lib/i18n";

export type Block = { en: [string, string]; fa: [string, string] };

export function InfoPage({
  eyebrow,
  title,
  note,
  blocks,
  faq = false,
}: {
  eyebrow: [string, string];
  title: [string, string];
  note: [string, string];
  blocks: Block[];
  faq?: boolean;
}) {
  const { t, fa } = useT();
  return (
    <>
      <Intro eyebrow={t(...eyebrow)} title={t(...title)} />
      <section className="page-content info-page">
        <div className={faq ? "service-faq" : "info-grid"}>
          {blocks.map((b, i) => {
            const [h, p] = fa ? b.fa : b.en;
            return faq ? (
              <details key={i} className="faq-item">
                <summary>{h}</summary>
                <p>{p}</p>
              </details>
            ) : (
              <article key={i} className="info-block" data-reveal>
                <span className="info-index">{String(i + 1).padStart(2, "0")}</span>
                <h2>{h}</h2>
                <p>{p}</p>
              </article>
            );
          })}
        </div>
        <p className="sample-note">{t(...note)}</p>
        <Link className="info-cta" to="/booking">
          {t("SEND AN INQUIRY", "ارسال درخواست")} <ArrowUpRight size={16} />
        </Link>
      </section>
      <NextChapter />
    </>
  );
}
