import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/noir-data";
import { InfoPage } from "@/components/noir/info-page";

export const Route = createFileRoute("/journal")({
  head: () => pageHead("The Journal", "NOIR PINK editorial notes on beauty rituals, care and self-expression."),
  component: () => (
    <InfoPage
      eyebrow={["THE JOURNAL", "ژورنال"]}
      title={["NOTES ON BEAUTY.", "یادداشت‌هایی درباره‌ی زیبایی."]}
      note={["Editorial sample copy. Replace with the salon’s own articles.", "متن نمونه‌ی ژورنال؛ با مقاله‌های خود سالن جایگزین شود."]}
      blocks={[
        { en: ["Skin first, always", "Every look starts with prepared skin: cleanse, hydrate, then build colour slowly."], fa: ["همیشه اول پوست", "هر ظاهری با پوست آماده شروع می‌شود: پاک‌سازی، آبرسانی و بعد رنگ، آرام و لایه‌لایه."] },
        { en: ["The quiet power of a neutral nail", "Clean shapes and soft tones read as confident, not plain."], fa: ["قدرت آرام یک ناخن ساده", "فرم تمیز و رنگ ملایم حس اعتمادبه‌نفس می‌دهد، نه سادگی."] },
        { en: ["Hair that moves with you", "Ask for a style that suits how you actually live day to day."], fa: ["مویی که با شما حرکت می‌کند", "سبکی بخواهید که با زندگی روزمره‌ی واقعی شما هماهنگ باشد."] },
        { en: ["Makeup for the occasion", "Bring a photo of your outfit and lighting; it shapes the whole look."], fa: ["میکاپ مناسب مراسم", "عکسی از لباس و نور محل مراسم بیاورید؛ کل ظاهر را شکل می‌دهد."] },
      ]}
    />
  ),
});
