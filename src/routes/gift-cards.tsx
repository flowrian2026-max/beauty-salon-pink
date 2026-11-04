import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/noir-data";
import { InfoPage } from "@/components/noir/info-page";

export const Route = createFileRoute("/gift-cards")({
  head: () => pageHead("Gift a moment", "Ask NOIR PINK about gifting a beauty experience to someone special."),
  component: () => (
    <InfoPage
      eyebrow={["GIFTING", "هدیه"]}
      title={["GIFT A MOMENT.", "یک لحظه هدیه دهید."]}
      note={["Gift cards are arranged by inquiry. No online payment is taken on this site.", "کارت هدیه از طریق درخواست هماهنگ می‌شود. پرداخت آنلاینی در این سایت انجام نمی‌شود."]}
      blocks={[
        { en: ["Choose an experience", "Nail art, hair, makeup or skincare — or let them decide."], fa: ["یک تجربه انتخاب کنید", "ناخن، مو، میکاپ یا پوست؛ یا انتخاب را به خودشان بسپارید."] },
        { en: ["Send an inquiry", "Mention it is a gift and who it is for in your message."], fa: ["درخواست بفرستید", "در پیام بنویسید که هدیه است و برای چه کسی."] },
        { en: ["The salon arranges the rest", "Details and value are confirmed directly with you."], fa: ["بقیه با سالن", "جزئیات و مبلغ مستقیم با شما هماهنگ می‌شود."] },
      ]}
    />
  ),
});
