import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemo } from "./demo-provider";
import { useT } from "@/lib/i18n";
import { Intro } from "./site-shell";

export function ConsultationPlanner({ occasionMode = false }: { occasionMode?: boolean }) {
  const { t, c } = useT();
  const { data } = useDemo();
  const [service, setService] = useState("");
  const [occasion, setOccasion] = useState("");
  const [finish, setFinish] = useState("");
  const [notes, setNotes] = useState("");
  const selected = data.services.find((s) => s.id === service);
  const photo = selected ?? data.services.find((s) => s.id === "makeup") ?? data.services[0];
  const draft = [
    t("I would like a consultation.", "می‌خواهم دربارهٔ انتخاب خدمات مشورت کنم."),
    occasion && `${t("Occasion", "مناسبت")}: ${occasion}`,
    finish && `${t("Desired look", "ظاهر دلخواه")}: ${finish}`,
    notes.trim(),
  ].filter(Boolean).join("\n");
  return (
    <>
      <Intro
        eyebrow={t(occasionMode ? "THE OCCASION EDIT" : "A PERSONAL PERSPECTIVE", occasionMode ? "برای لحظه‌های خاص" : "نگاهی شخصی به زیبایی")}
        title={t(occasionMode ? "YOUR MOMENT. YOUR LOOK." : "FIRST, YOU.", occasionMode ? "لحظهٔ شما، سبک شما." : "اول، خودِ شما.")}
        copy={t("Your preferences are the starting point. Explore a direction before making an inquiry.", "سلیقهٔ شما نقطهٔ شروع است. پیش از ثبت درخواست، مسیر دلخواهتان را انتخاب کنید.")}
      />
      <section className="page-content consultation-layout">
        <figure className="consultation-photo">
          {photo && <img src={photo.image} alt={t("Beauty concept inspiration", "الهام زیبایی، تصویر مفهومی")} width={864} height={1104} />}
          <figcaption>{t("AI CONCEPT / NOT A CLIENT RESULT", "تصویر مفهومی هوش مصنوعی / نه نتیجهٔ مشتری")}</figcaption>
        </figure>
        <div className="consultation-fields">
          <fieldset>
            <legend><span>01</span> {t("Your focus", "انتخاب شما")}</legend>
            <div className="consultation-options">
              {data.services.map((s) => <Button key={s.id} variant={service === s.id ? "default" : "outline"} aria-pressed={service === s.id} onClick={() => setService(s.id)}>{c(s.title)}{service === s.id && <Check size={14} />}</Button>)}
            </div>
          </fieldset>
          <fieldset>
            <legend><span>02</span> {t("The occasion", "مناسبت")}</legend>
            <div className="consultation-options">
              {[["Everyday", "روزمره"], ["Wedding", "عروسی"], ["Evening event", "مهمانی شب"], ["Photo session", "عکاسی"]].map(([en, fa]) => {
                const value = t(en ?? "", fa ?? "");
                return <Button key={en} variant={occasion === value ? "default" : "outline"} aria-pressed={occasion === value} onClick={() => setOccasion(value)}>{value}</Button>;
              })}
            </div>
          </fieldset>
          <fieldset>
            <legend><span>03</span> {t("The expression", "حس و سبک")}</legend>
            <div className="consultation-options">
              {[["Soft & natural", "ملایم و طبیعی"], ["Polished & classic", "آراسته و کلاسیک"], ["Bold & expressive", "جسور و متفاوت"]].map(([en, fa]) => {
                const value = t(en ?? "", fa ?? "");
                return <Button key={en} variant={finish === value ? "default" : "outline"} aria-pressed={finish === value} onClick={() => setFinish(value)}>{value}</Button>;
              })}
            </div>
          </fieldset>
          <label className="field">{t("Anything else?", "نکتهٔ دیگری دارید؟")}<textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={600} placeholder={t("Outfit, preferences, inspiration…", "لباس، سلیقه، ایدهٔ دلخواه…")} /></label>
          <div className="consultation-summary">
            <h2>{t("YOUR BRIEF", "خواستهٔ شما")}</h2>
            {selected && <p className="text-primary">{c(selected.title)}</p>}
            <p className="whitespace-pre-line" dir="auto">{draft}</p>
            <Button asChild disabled={!selected}><Link to="/booking" search={{ service: selected?.id, message: draft }}>{t("CONTINUE TO INQUIRY", "ادامهٔ درخواست")}<ArrowUpRight /></Link></Button>
            {!selected && <p>{t("Choose a service to continue.", "برای ادامه، یک خدمت انتخاب کنید.")}</p>}
            <p className="sample-note">{t("This prepares a draft only. Pricing, suitability and availability need salon confirmation.", "این فقط پیش‌نویس است. قیمت، مناسب‌بودن خدمت و زمان نیاز به تأیید سالن دارد.")}</p>
          </div>
        </div>
      </section>
      <section className="editorial-section">
        <div className="eyebrow">{t("BEFORE YOUR VISIT", "پیش از مراجعه")}</div>
        <div className="info-grid consultation-preparation">
          {[
            ["Bring your references", "A few images, your outfit and the setting help describe the direction you want.", "ایده‌هایتان را همراه داشته باشید", "چند تصویر، لباس و فضای مراسم کمک می‌کند خواسته‌تان را دقیق‌تر توضیح دهید."],
            ["Share what matters", "Mention preferences, sensitivities and previous experiences in your inquiry; confirm any preparation with the salon.", "نکات مهم را بگویید", "سلیقه، حساسیت‌ها و تجربه‌های قبلی را در درخواست مطرح کنید؛ آماده‌سازی لازم را با سالن هماهنگ کنید."],
            ["Leave room for a conversation", "A reference is a starting point, not a promised result. Discuss timing and details before confirming a visit.", "برای گفت‌وگو وقت بگذارید", "تصویر مرجع نقطهٔ شروع است، نه تضمین نتیجه. پیش از قطعی‌کردن مراجعه، زمان و جزئیات را هماهنگ کنید."],
          ].map(([h, p, fh, fp], i) => <article className="info-block" key={h}><span className="info-index">0{i + 1}</span><h2>{t(h ?? "", fh ?? "")}</h2><p>{t(p ?? "", fp ?? "")}</p></article>)}
        </div>
      </section>
    </>
  );
}