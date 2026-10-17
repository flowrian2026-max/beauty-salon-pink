import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/noir-data";
import { Intro } from "@/components/noir/site-shell";
import { ContactContent } from "@/components/noir/contact";
import { useT } from "@/lib/i18n";
export const Route = createFileRoute("/contact")({
  head: () =>
    pageHead(
      "Let’s connect",
      "Contact the NOIR PINK concept. Editable contact placeholders and a clearly labeled demo message form.",
    ),
  component: ContactPage,
});
function ContactPage() {
  const { t } = useT();
  return (
    <>
      <Intro eyebrow={t("START A CONVERSATION", "گفت‌وگو را شروع کنید")} title={t("YOUR WORLD. OUR CANVAS.", "دنیای شما، بوم ما.")} />
      <div className="page-content">
        <ContactContent />
      </div>
    </>
  );
}
