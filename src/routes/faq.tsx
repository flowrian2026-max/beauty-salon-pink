import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/noir-data";
import { InfoPage } from "@/components/noir/info-page";

export const Route = createFileRoute("/faq")({
  head: () => pageHead("Questions, answered", "Answers to common questions about NOIR PINK inquiries, services and visits."),
  component: () => (
    <InfoPage
      faq
      eyebrow={["BEFORE YOUR VISIT", "پیش از مراجعه"]}
      title={["QUESTIONS, ANSWERED.", "پاسخ پرسش‌ها."]}
      note={["General guidance only. The salon confirms every detail directly.", "این‌ها راهنمای کلی است. سالن همه‌ی جزئیات را مستقیم تأیید می‌کند."]}
      blocks={[
        { en: ["Is my appointment confirmed when I send the form?", "No. The form sends an inquiry. The salon replies to confirm a time."], fa: ["آیا با ارسال فرم وقتم قطعی می‌شود؟", "خیر. فرم فقط یک درخواست است و سالن برای تأیید زمان با شما تماس می‌گیرد."] },
        { en: ["How much does a service cost?", "Pricing depends on the look and is shared on inquiry."], fa: ["هزینه‌ی خدمات چقدر است؟", "قیمت به نوع کار بستگی دارد و هنگام پاسخ به درخواست اعلام می‌شود."] },
        { en: ["Not sure which service to choose?", "Try the beauty advisor on the booking page, or describe your goal in the message."], fa: ["نمی‌دانید کدام خدمت مناسب است؟", "از مشاور زیبایی در صفحه‌ی رزرو کمک بگیرید یا هدفتان را در پیام بنویسید."] },
        { en: ["Can I change or cancel a request?", "Yes — just reply to the salon’s message before your visit."], fa: ["می‌توانم درخواستم را تغییر دهم یا لغو کنم؟", "بله؛ کافی است پیش از مراجعه به پیام سالن پاسخ دهید."] },
        { en: ["Do you show real client results?", "Current images are AI-generated concepts and are labeled as such."], fa: ["آیا نتایج واقعی مشتری‌ها را نشان می‌دهید؟", "عکس‌های فعلی نمونه‌های مفهومی ساخته‌شده با هوش مصنوعی هستند و برچسب دارند."] },
      ]}
    />
  ),
});
