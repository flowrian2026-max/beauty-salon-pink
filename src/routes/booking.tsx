import { useT } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { pageHead } from "@/lib/noir-data";
import { Intro } from "@/components/noir/site-shell";
import { BookingForm } from "@/components/noir/booking";
import { BeautyAdvisor, type Suggestion } from "@/components/noir/advisor";
import { useState } from "react";
export const Route = createFileRoute("/booking")({
  validateSearch: z.object({ service: z.string().max(100).optional() }),
  head: () =>
    pageHead(
      "Book your experience",
       "Review your NOIR PINK booking inquiry. Email handoff when contact details are configured; no appointment is automatically confirmed.",
    ),
  component: BookingPage,
});
function BookingPage() {
  const { m, c, t, lang } = useT();
  const { service } = Route.useSearch();
  const [suggestion, setSuggestion] = useState<Suggestion & { n: number }>();
  return (
    <>
      <Intro eyebrow="SOMETHING EXTRAORDINARY STARTS HERE" title="MAKE SPACE FOR YOU." />
      <div className="page-content form-layout">
        <aside>
          <h2>{m("YOUR NEXT EXPRESSION.")}</h2>
          <p>{m("A considered moment. A fresh perspective. Choose the experience that feels like you.")}</p>
          <p className="sample-note">{m("BY INQUIRY")}<br />
            Tell us what you have in mind. Preferred dates are requests, not reserved appointments.
            Where a business email is supplied, you can send your inquiry from your email app.
            Until then, this is a clearly labeled local preview.
          </p>
        </aside>
        <div className="grid gap-10">
          <BeautyAdvisor onApply={(s) => { setSuggestion((p) => ({ ...s, n: (p?.n ?? 0) + 1 })); requestAnimationFrame(() => document.getElementById("inquiry-form")?.scrollIntoView({ behavior: "smooth" })); }} />
          <div id="inquiry-form">
            <BookingForm key={suggestion?.n ?? 0} initialService={suggestion?.serviceId ?? service} initialMessage={suggestion?.message} />
          </div>
        </div>
      </div>
    </>
  );
}
