import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "fa";
const KEY = "noir-pink-lang";

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "en", setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    try { if (localStorage.getItem(KEY) === "fa") setLangState("fa"); } catch { /* storage unavailable */ }
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
  }, [lang]);
  function setLang(l: Lang) {
    setLangState(l);
    try { localStorage.setItem(KEY, l); } catch { /* storage unavailable */ }
  }
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

/** Validation and status messages produced outside components, translated by lookup. */
const messages: Record<string, string> = {
  "Choose a service": "یک خدمت انتخاب کنید",
  "Enter your name": "نام خود را وارد کنید",
  "Enter a valid email": "یک ایمیل معتبر وارد کنید",
  "Enter a valid date": "تاریخ معتبر وارد کنید",
  "Enter a valid time": "ساعت معتبر وارد کنید",
  "Keep your message under 1,000 characters": "پیام باید کمتر از ۱۰۰۰ نویسه باشد",
  "Please add a message": "لطفاً پیام خود را بنویسید",
  "Choose a listed service to inquire about": "یکی از خدمات فهرست‌شده را انتخاب کنید",
  "Tell us a little about your goals": "کمی درباره‌ی هدف‌تان بنویسید",
  "Local storage is unavailable. Changes will last only for this visit.": "حافظه‌ی مرورگر در دسترس نیست. تغییرات فقط در همین بازدید می‌ماند.",
  "Could not save on this device. Changes last only for this visit.": "ذخیره روی این دستگاه ممکن نشد. تغییرات فقط در همین بازدید می‌ماند.",
};

/** Default service and gallery copy; business-edited text is shown as entered. */
const content: Record<string, string> = {
  "NAIL ART": "طراحی ناخن",
  "HAIR STYLING": "حالت‌دهی مو",
  MAKEUP: "آرایش",
  SKINCARE: "مراقبت پوست",
  MANICURE: "مانیکور",
  PEDICURE: "پدیکور",
  NAILS: "ناخن",
  HAIR: "مو",
  ALL: "همه",
  "Small details. A bold statement. Sculptural designs made for your individuality.": "جزئیات کوچک، بیانی جسورانه. طرح‌هایی حجمی برای فردیت شما.",
  "Effortless movement, striking silhouettes. Your next signature look.": "حرکتی بی‌زحمت و فرمی چشمگیر. استایل امضای بعدی شما.",
  "From understated radiance to unapologetic expression.": "از درخششی آرام تا بیانی بی‌پروا.",
  "A moment to reset. A ritual dedicated to your skin.": "لحظه‌ای برای تازه شدن؛ آیینی برای پوست شما.",
  "Beautifully considered care, finished with precision.": "مراقبتی سنجیده که با دقت کامل می‌شود.",
  "A restorative ritual with an impeccably polished finish.": "آیینی آرام‌بخش با پایانی بی‌نقص.",
  "Chrome in bloom": "کروم در شکوفه",
  "After dark": "پس از تاریکی",
  "The art of movement": "هنر حرکت",
  "Bare luminosity": "درخشش طبیعی",
  "A space for self-expression. A different perspective on beauty. At NOIR PINK, creativity and considered detail come together to make every look distinctly yours.":
    "فضایی برای بیان خود؛ نگاهی متفاوت به زیبایی. در نوآر پینک، خلاقیت و جزئیات سنجیده کنار هم می‌آیند تا هر استایل کاملاً مال شما باشد.",
};

export function useT() {
  const { lang, setLang } = useContext(Ctx);
  const fa = lang === "fa";
  return {
    lang,
    setLang,
    fa,
    t: (en: string, faText: string) => (fa ? faText : en),
    m: (en: string | undefined) => (en && fa ? messages[en] ?? en : en ?? ""),
    c: (en: string) => (fa ? content[en] ?? en : en),
  };
}
