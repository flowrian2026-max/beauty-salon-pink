import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "fa";
const KEY = "noir-pink-lang";

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "en",
  setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === "fa") setLangState("fa");
    } catch {
      /* storage unavailable */
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
  }, [lang]);
  function setLang(l: Lang) {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* storage unavailable */
    }
  }
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

/** Validation and status messages produced outside components, translated by lookup. */
const messages: Record<string, string> = {
  "BEAUTY,": "زیبایی،",
  "REDEFINED.": "با تعریفی تازه.",
  "NOIR PINK / BEAUTY ON YOUR OWN TERMS": "NOIR PINK / زیبایی به سبک خودتان",
  "Precision, creativity, and confidence in every detail.":
    "دقت، خلاقیت و اعتمادبه‌نفس در هر جزئیات.",
  "BOOK YOUR VISIT": "رزرو وقت",
  "EXPLORE THE EXPERIENCE": "کشف تجربه",
  "01 / THE NEW BEAUTY": "۰۱ / زیبایی تازه",
  "NOT FOR EVERYONE.": "نه برای همه.",
  "ENTIRELY FOR YOU.": "کاملاً برای شما.",
  "SCROLL TO DISCOVER": "برای کشف بیشتر",
  "INDIVIDUALITY IS EVERYTHING.": "فردیت، همه‌چیز است.",
  "NOIR PINK / CONCEPT": "NOIR PINK / مفهوم",
  "NAIL ART": "طراحی ناخن",
  "HAIR STYLING": "حالت‌دهی مو",
  MAKEUP: "آرایش",
  SKINCARE: "مراقبت پوست",
  "SELF EXPRESSION": "بیان خود",
  "PRECISION MEETS PERSONALITY": "دقت در کنار شخصیت",
  "THE ART OF": "هنر",
  "TRANSFORMATION.": "دگرگونی.",
  "ALL SERVICES": "همهٔ خدمات",
  "A DIFFERENT PERSPECTIVE": "نگاهی متفاوت",
  "SAME HAND.": "همان چهره.",
  "NEW EXPRESSION.": "بیانی تازه.",
  "THE EXPERIENCE": "تجربه",
  "SOMETHING EXTRAORDINARY STARTS HERE": "شروع یک تجربهٔ متفاوت",
  "MAKE SPACE FOR YOU.": "وقتی برای خودتان.",
  "YOUR NEXT EXPRESSION.": "بیان تازهٔ شما.",
  "A considered moment. A fresh perspective. Choose the experience that feels like you.":
    "لحظه‌ای سنجیده، نگاهی تازه. تجربه‌ای را انتخاب کنید که شبیه خودتان است.",
  "BY INQUIRY": "با استعلام",
  "Tell us what you have in mind. Preferred dates are requests, not reserved appointments.":
    "از خواسته‌هایتان بگویید. تاریخ‌های پیشنهادی فقط درخواست‌اند، نه وقت رزروشده.",
  "Where a business email is supplied, you can send your inquiry from your email app.":
    "اگر ایمیل سالن ثبت شده باشد، می‌توانید درخواست را از برنامهٔ ایمیل خود بفرستید.",
  "Until then, this is a clearly labeled local preview.":
    "تا آن زمان، این فقط پیش‌نمایشی روی دستگاه شماست.",
  "LET’S CONNECT.": "در تماس باشیم.",
  "Your next expression starts with a conversation.": "بیان تازهٔ شما با یک گفت‌وگو شروع می‌شود.",
  ADDRESS: "آدرس",
  PHONE: "تلفن",
  EMAIL: "ایمیل",
  "OPENING HOURS": "ساعات کاری",
  "Business contact details have not yet been supplied. Online delivery is unavailable.":
    "اطلاعات تماس سالن هنوز ثبت نشده است؛ ارسال آنلاین در دسترس نیست.",
  "YOUR EMAIL DRAFT IS READY.": "پیش‌نویس ایمیل شما آماده است.",
  "LOCAL MESSAGE PREVIEW.": "پیش‌نمایش پیام روی این دستگاه.",
  "Open your email app and press Send to deliver your inquiry. Nothing is sent automatically.":
    "برنامهٔ ایمیل خود را باز کنید و برای ارسال درخواست، دکمهٔ ارسال را بزنید. چیزی خودکار ارسال نمی‌شود.",
  "Your message was validated but not sent or stored. A business email is needed for delivery.":
    "پیام شما بررسی شد، اما ارسال یا ذخیره نشد. برای ارسال، ایمیل سالن لازم است.",
  "OPEN EMAIL INQUIRY": "باز کردن درخواست ایمیل",
  "WRITE ANOTHER MESSAGE": "نوشتن پیام تازه",
  "YOUR NAME": "نام شما",
  "YOUR MESSAGE": "پیام شما",
  "Review your email draft before sending from your email app.":
    "پیش‌نویس را پیش از ارسال از برنامهٔ ایمیل خود بررسی کنید.",
  "Local preview only. No business email is configured; messages cannot be delivered.":
    "فقط پیش‌نمایش محلی؛ ایمیل سالن ثبت نشده و پیام‌ها ارسال نمی‌شوند.",
  "REVIEW YOUR MESSAGE": "بررسی پیام",
  "Before makeup — bare natural face, replaceable concept image":
    "پیش از آرایش؛ چهرهٔ طبیعی، تصویر مفهومی قابل تعویض",
  "After makeup — the same face with editorial pink makeup, replaceable concept image":
    "پس از آرایش؛ همان چهره با آرایش صورتی، تصویر مفهومی قابل تعویض",
  BEFORE: "قبل",
  AFTER: "بعد",
  "Before and after image comparison": "مقایسهٔ تصویر قبل و بعد",
  "AI MAKEUP CONCEPT · Same face and scene, makeup-only edit. Not a real customer result. Both images are replaceable in Demo Admin.":
    "تصویر مفهومی آرایش با هوش مصنوعی · همان چهره و صحنه، فقط آرایش تغییر کرده است؛ نتیجهٔ واقعی مشتری نیست. هر دو عکس در مدیریت نمایشی قابل تعویض‌اند.",
  "Gallery categories": "دسته‌های گالری",
  "No images in this collection yet.": "هنوز تصویری در این مجموعه نیست.",
  "AI-generated editorial concepts · Replaceable imagery, not customer results or salon work.":
    "تصاویر مفهومی ساخته‌شده با هوش مصنوعی · قابل تعویض، نه نتیجهٔ مشتری یا کار واقعی سالن.",
  "Concept photography": "عکاسی مفهومی",
  "Previous image": "تصویر قبلی",
  "Next image": "تصویر بعدی",
  Close: "بستن",
  Service: "خدمت",
  Name: "نام",
  Email: "ایمیل",
  Phone: "تلفن",
  "Preferred date": "تاریخ پیشنهادی",
  "Preferred time": "ساعت پیشنهادی",
  Message: "پیام",
  "Not supplied": "ثبت نشده",
  Flexible: "انعطاف‌پذیر",
  None: "ندارد",
  "Flexible date": "تاریخ انعطاف‌پذیر",
  "LOCAL PREVIEW SAVED.": "پیش‌نمایش روی این دستگاه ذخیره شد.",
  "PREVIEW RECORDED FOR THIS VISIT.": "پیش‌نمایش برای این بازدید ثبت شد.",
  "Nothing has been sent. No appointment is confirmed.":
    "چیزی ارسال نشده و هیچ وقتی تأیید نشده است.",
  "This inquiry stays on this device only.": "این درخواست فقط روی همین دستگاه می‌ماند.",
  "ANOTHER INQUIRY": "درخواست تازه",
  "02 / REVIEW YOUR INQUIRY": "۰۲ / بررسی درخواست",
  "THE DETAILS.": "جزئیات.",
  "COPY INQUIRY": "کپی درخواست",
  "Copy unavailable. Select the details above to copy them manually.":
    "کپی ممکن نیست. جزئیات بالا را انتخاب کنید و دستی کپی کنید.",
  "Inquiry copied. It has not been sent.": "درخواست کپی شد، اما ارسال نشده است.",
  "A business contact email has not been supplied. Online delivery is not available. You can save a local preview only; nothing is sent and no appointment is confirmed.":
    "ایمیل سالن ثبت نشده و ارسال آنلاین ممکن نیست. فقط می‌توانید پیش‌نمایش را روی دستگاه ذخیره کنید؛ چیزی ارسال نمی‌شود و وقت تأیید نشده است.",
  "SAVE LOCAL PREVIEW": "ذخیرهٔ پیش‌نمایش محلی",
  "EDIT DETAILS": "ویرایش جزئیات",
  "01 / YOUR INQUIRY": "۰۱ / درخواست شما",
  SERVICE: "خدمت",
  "Choose your experience": "تجربهٔ خود را انتخاب کنید",
  "PHONE · OPTIONAL": "تلفن · اختیاری",
  "PREFERRED DATE · OPTIONAL": "تاریخ پیشنهادی · اختیاری",
  "PREFERRED TIME · OPTIONAL": "ساعت پیشنهادی · اختیاری",
  "MESSAGE · OPTIONAL": "پیام · اختیاری",
  "Tell us what you have in mind.": "از خواسته‌هایتان بگویید.",
  "An email draft is prepared after review. Availability and pricing are confirmed by the business.":
    "پس از بررسی، پیش‌نویس ایمیل آماده می‌شود. قیمت و زمان را سالن تأیید می‌کند.",
  "No business email is configured. This is a local preview only, not an online submission.":
    "ایمیل سالن ثبت نشده است. این فقط پیش‌نمایش روی دستگاه است، نه ارسال آنلاین.",
  "REVIEW YOUR INQUIRY": "بررسی درخواست",
  "00 / AI BEAUTY ADVISOR": "۰۰ / مشاور زیبایی هوش مصنوعی",
  "NOT SURE WHERE TO START?": "از کجا شروع کنیم؟",
  "YOUR BEAUTY GOALS": "خواسته‌های زیبایی شما",
  "e.g. A refined look that still feels bold": "مثلاً ظاهری ظریف اما جسورانه",
  "PREFERENCES · OPTIONAL": "ترجیحات · اختیاری",
  "Colours, finish, style": "رنگ، جلوه، سبک",
  "OCCASION · OPTIONAL": "مناسبت · اختیاری",
  "Wedding, evening, everyday": "عروسی، مهمانی، روزمره",
  "THINKING…": "در حال بررسی…",
  "GET A RECOMMENDATION": "دریافت پیشنهاد",
  "SUGGESTED FOR YOU": "پیشنهاد برای شما",
  "Draft message:": "پیش‌نویس پیام:",
  "AI-generated suggestion, not professional advice. The salon confirms suitability, pricing and availability.":
    "پیشنهاد هوش مصنوعی، نه مشاورهٔ تخصصی. تناسب خدمت، قیمت و زمان را سالن تأیید می‌کند.",
  "USE IN MY INQUIRY": "استفاده در درخواست من",
  "Check your answers": "پاسخ‌های خود را بررسی کنید",
  "The advisor is unavailable right now. You can still choose a service below.":
    "مشاور فعلاً در دسترس نیست. می‌توانید از پایین صفحه یک خدمت انتخاب کنید.",
  "AI credits are used up for now. Please choose a service manually.":
    "اعتبار هوش مصنوعی فعلاً تمام شده است. لطفاً خدمت را خودتان انتخاب کنید.",
  "The advisor is busy. Please wait a moment and try again.":
    "مشاور مشغول است. کمی صبر کنید و دوباره تلاش کنید.",
  "The advisor is unavailable.": "مشاور در دسترس نیست.",
  "AI advisor is not configured.": "مشاور هوش مصنوعی راه‌اندازی نشده است.",
  "No matching service was recommended. Please try again.":
    "خدمت مناسبی پیشنهاد نشد. دوباره تلاش کنید.",
  "Address to be added": "آدرس هنوز ثبت نشده",
  "Phone to be added": "تلفن هنوز ثبت نشده",
  "Email to be added": "ایمیل هنوز ثبت نشده",
  "Opening hours to be added": "ساعات کاری هنوز ثبت نشده",
  Overview: "نمای کلی",
  Services: "خدمات",
  Pricing: "قیمت‌ها",
  Gallery: "گالری",
  "Before / after": "قبل و بعد",
  "Booking requests": "درخواست‌های رزرو",
  "Contact information": "اطلاعات تماس",
  "Brand appearance": "ظاهر برند",
  "Changes saved on this device.": "تغییرات روی این دستگاه ذخیره شد.",
  "Changes updated for this visit.": "تغییرات برای این بازدید اعمال شد.",
  "Choose a JPG, PNG or WebP image smaller than 1.5 MB.":
    "عکس JPG، PNG یا WebP با حجم کمتر از ۱٫۵ مگابایت انتخاب کنید.",
  "This image could not be read. Try another file.": "عکس خوانده نشد؛ فایل دیگری انتخاب کنید.",
  "REPLACE IMAGE": "تعویض عکس",
  "THE CONTROL ROOM.": "اتاق کنترل.",
  PREVIEW: "پیش‌نمایش",
  "Admin sections": "بخش‌های مدیریت",
  SERVICES: "خدمات",
  "GALLERY IMAGES": "عکس‌های گالری",
  "DEMO REQUESTS": "درخواست‌های نمایشی",
  "All content is a replaceable concept. This overview reflects this device only.":
    "تمام محتوا مفهومی و قابل تعویض است. این نمای کلی فقط اطلاعات همین دستگاه را نشان می‌دهد.",
  "ADD SERVICE": "افزودن خدمت",
  "Pricing on inquiry": "قیمت با استعلام",
  "ADD IMAGE": "افزودن عکس",
  "Replaceable concept image · max 1.5 MB": "تصویر مفهومی قابل تعویض · حداکثر ۱٫۵ مگابایت",
  "No demo requests on this device yet.": "هنوز درخواستی روی این دستگاه ثبت نشده است.",
  "Removed service": "خدمت حذف‌شده",
  "DEMO REQUEST · NOT A CONFIRMED APPOINTMENT": "درخواست نمایشی · وقت تأییدشده نیست",
  "Delete this local demo request?": "این درخواست نمایشی از دستگاه حذف شود؟",
  "Social links must be valid HTTPS addresses.":
    "پیوند شبکه‌های اجتماعی باید نشانی معتبر HTTPS باشد.",
  "SAVE CONTACT DETAILS": "ذخیرهٔ اطلاعات تماس",
  "ACCENT COLOR": "رنگ تأکیدی",
  "Accent color": "رنگ تأکیدی",
  "BRAND STORY": "داستان برند",
  "SAVE BRAND STORY": "ذخیرهٔ داستان برند",
  "EDIT SERVICE": "ویرایش خدمت",
  "Replaceable demo content and sample pricing.":
    "محتوای نمایشی قابل ویرایش؛ قیمت‌ها را تنها بر اساس اطلاعات سالن وارد کنید.",
  "Enter a service title and valid details.": "عنوان خدمت و جزئیات معتبر وارد کنید.",
  "Service image preview": "پیش‌نمایش عکس خدمت",
  "SAVE SERVICE": "ذخیرهٔ خدمت",
  "GALLERY IMAGE": "عکس گالری",
  "Preview and save a local demo image.": "پیش‌نمایش و ذخیرهٔ عکس روی این دستگاه.",
  "Enter an image title.": "عنوان عکس را وارد کنید.",
  TITLE: "عنوان",
  CATEGORY: "دسته",
  "Gallery image preview": "پیش‌نمایش عکس گالری",
  "SAVE IMAGE": "ذخیرهٔ عکس",
  DESCRIPTION: "توضیح",
  PRICE: "قیمت",
  DURATION: "مدت",
  HOURS: "ساعات کاری",
  INSTAGRAM: "اینستاگرام",
  TIKTOK: "تیک‌تاک",
  " · SAMPLE": " · نمونه",
  "FRONTEND DEMO · This page is public and not secure. Changes and requests are local to this device. Do not enter sensitive information. A production admin requires authentication, authorization and shared storage.":
    "مدیریت نمایشی · این صفحه عمومی است و امنیت مدیریتی ندارد. تغییرات و درخواست‌ها فقط روی همین دستگاه‌اند. اطلاعات حساس وارد نکنید. مدیریت واقعی به ورود امن، تعیین دسترسی و ذخیره‌سازی مشترک نیاز دارد.",
  "Accent updates preview immediately across this device. Photography is generated concept imagery; uploaded replacements remain local.":
    "تغییر رنگ فوراً در سایت روی این دستگاه دیده می‌شود. عکس‌ها مفهومی و ساخته‌شده با هوش مصنوعی‌اند؛ عکس‌های جایگزین فقط روی همین دستگاه می‌مانند.",
  "Page not found": "صفحه پیدا نشد",
  "The page you're looking for doesn't exist or has been moved.":
    "این صفحه وجود ندارد یا جابه‌جا شده است.",
  "Go home": "بازگشت به خانه",
  "This page didn't load": "این صفحه بارگذاری نشد",
  "Something went wrong on our end. You can try refreshing or head back home.":
    "مشکلی پیش آمده است. دوباره تلاش کنید یا به صفحهٔ اصلی برگردید.",
  "Try again": "تلاش دوباره",

  "Choose a service": "یک خدمت انتخاب کنید",
  "Enter your name": "نام خود را وارد کنید",
  "Enter a valid email": "یک ایمیل معتبر وارد کنید",
  "Enter a valid date": "تاریخ معتبر وارد کنید",
  "Enter a valid time": "ساعت معتبر وارد کنید",
  "Keep your message under 1,000 characters": "پیام باید کمتر از ۱۰۰۰ نویسه باشد",
  "Please add a message": "لطفاً پیام خود را بنویسید",
  "Choose a listed service to inquire about": "یکی از خدمات فهرست‌شده را انتخاب کنید",
  "Tell us a little about your goals": "کمی درباره‌ی هدف‌تان بنویسید",
  "Local storage is unavailable. Changes will last only for this visit.":
    "حافظه‌ی مرورگر در دسترس نیست. تغییرات فقط در همین بازدید می‌ماند.",
  "Could not save on this device. Changes last only for this visit.":
    "ذخیره روی این دستگاه ممکن نشد. تغییرات فقط در همین بازدید می‌ماند.",
};

/** Default service and gallery copy; business-edited text is shown as entered. */
const content: Record<string, string> = {
  "Address to be added": "آدرس هنوز ثبت نشده",
  "Phone to be added": "تلفن هنوز ثبت نشده",
  "Email to be added": "ایمیل هنوز ثبت نشده",
  "Opening hours to be added": "ساعات کاری هنوز ثبت نشده",

  "NAIL ART": "طراحی ناخن",
  "HAIR STYLING": "حالت‌دهی مو",
  MAKEUP: "آرایش",
  SKINCARE: "مراقبت پوست",
  MANICURE: "مانیکور",
  PEDICURE: "پدیکور",
  NAILS: "ناخن",
  HAIR: "مو",
  ALL: "همه",
  "Small details. A bold statement. Sculptural designs made for your individuality.":
    "جزئیات کوچک، بیانی جسورانه. طرح‌هایی حجمی برای فردیت شما.",
  "Effortless movement, striking silhouettes. Your next signature look.":
    "حرکتی بی‌زحمت و فرمی چشمگیر. استایل امضای بعدی شما.",
  "From understated radiance to unapologetic expression.": "از درخششی آرام تا بیانی بی‌پروا.",
  "A moment to reset. A ritual dedicated to your skin.":
    "لحظه‌ای برای تازه شدن؛ آیینی برای پوست شما.",
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
    m: (en: string | undefined) => (en && fa ? (messages[en] ?? en) : (en ?? "")),
    c: (en: string) => (fa ? (content[en] ?? en) : en),
  };
}
