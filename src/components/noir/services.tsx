import { ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useDemo } from "./demo-provider";
import { BookLink } from "./site-shell";
import { useT } from "@/lib/i18n";
import { useState } from "react";
import { Button } from "@/components/ui/button";
export function Services({ preview = false }: { preview?: boolean }) {
  const { data } = useDemo();
  const { t, c } = useT();
  const [category, setCategory] = useState("all");
  const categories = [
    { id: "all", label: t("All services", "همهٔ خدمات"), ids: [] },
    { id: "nails", label: t("Nails", "ناخن"), ids: ["nails", "manicure", "pedicure"] },
    { id: "hair", label: t("Hair", "مو"), ids: ["hair"] },
    { id: "makeup", label: t("Makeup", "آرایش"), ids: ["makeup"] },
    { id: "skin", label: t("Skin", "پوست"), ids: ["skin"] },
  ];
  const active = categories.find((item) => item.id === category);
  const visible = data.services.filter((s) => preview || category === "all" || active?.ids.includes(s.id));
  return (
    <>
      {!preview && <div className="service-category-nav" role="group" aria-label={t("Service categories", "دسته‌بندی خدمات")}>
        {categories.map((item) => <Button key={item.id} variant={category === item.id ? "default" : "ghost"} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</Button>)}
      </div>}
      <div className="service-grid">
        {visible.slice(0, preview ? 4 : undefined).map((s, i) => (
          <article className="service-item" key={s.id} data-reveal>
            <div className="service-image">
              <img
                src={s.image}
                alt={c(s.title) + t(" — sample beauty concept", " — تصویر مفهومی نمونه")}
                loading="lazy"
                width="864"
                height="1104"
              />
              <span className="service-number">0{i + 1} /</span>
            </div>
            <div className="service-caption">
              <h3>
                <Link
                  to="/services/$serviceId"
                  params={{ serviceId: s.id }}
                  className="service-link"
                >
                  {c(s.title)}
                </Link>
              </h3>
              <ArrowUpRight size={23} className="text-primary" />
            </div>
            <p>{c(s.description)}</p>
            <div className="service-meta">
              <span>{s.price || t("PRICING ON INQUIRY", "قیمت با استعلام")}</span>
              {s.duration && <span>{s.duration}</span>}
            </div>
            <BookLink service={s.id} />
          </article>
        ))}
      </div>
      <p className="sample-note">
        {t(
          "AI-generated concept photography. Service details and availability are confirmed on inquiry.",
          "عکس‌های مفهومی ساخته‌شده با هوش مصنوعی. جزئیات و زمان خدمات هنگام استعلام تأیید می‌شود.",
        )}
      </p>
    </>
  );
}
