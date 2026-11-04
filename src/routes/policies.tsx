import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/noir-data";
import { InfoPage } from "@/components/noir/info-page";

export const Route = createFileRoute("/policies")({
  head: () => pageHead("Visit & privacy", "How NOIR PINK handles inquiries, visits and the information you share."),
  component: () => (
    <InfoPage
      eyebrow={["GOOD TO KNOW", "خوب است بدانید"]}
      title={["VISIT & PRIVACY.", "مراجعه و حریم خصوصی."]}
      note={["Placeholder policy. The salon’s official terms will replace this text.", "متن موقت است و با شرایط رسمی سالن جایگزین می‌شود."]}
      blocks={[
        { en: ["Your information", "This preview stores inquiries only in your own browser. Nothing is sent to a server."], fa: ["اطلاعات شما", "این نسخه درخواست‌ها را فقط در مرورگر خودتان نگه می‌دارد و چیزی به سرور ارسال نمی‌شود."] },
        { en: ["Confirmations", "A visit is only confirmed once the salon replies to you."], fa: ["تأیید وقت", "وقت شما فقط پس از پاسخ سالن قطعی می‌شود."] },
        { en: ["Changes", "Let the salon know as early as possible if your plans change."], fa: ["تغییر برنامه", "اگر برنامه‌تان تغییر کرد، هرچه زودتر به سالن خبر دهید."] },
        { en: ["Sensitivities", "Mention allergies or skin sensitivities in your inquiry."], fa: ["حساسیت‌ها", "حساسیت پوستی یا آلرژی را در درخواست خود بنویسید."] },
      ]}
    />
  ),
});
