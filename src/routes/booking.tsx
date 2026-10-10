import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { pageHead } from "@/lib/noir-data";
import { Intro } from "@/components/noir/site-shell";
import { BookingForm } from "@/components/noir/booking";
export const Route = createFileRoute("/booking")({
  validateSearch: z.object({ service: z.string().max(100).optional() }),
  head: () =>
    pageHead(
      "Book your experience",
      "Choose a NOIR PINK service and submit a local demo booking request. No real appointment is confirmed.",
    ),
  component: BookingPage,
});
function BookingPage() {
  const { service } = Route.useSearch();
  return (
    <>
      <Intro eyebrow="SOMETHING EXTRAORDINARY STARTS HERE" title="MAKE SPACE FOR YOU." />
      <div className="page-content form-layout">
        <aside>
          <h2>YOUR NEXT EXPRESSION.</h2>
          <p>
            A considered moment. A fresh perspective. Choose the experience that feels like you.
          </p>
          <p className="sample-note">
            PROTOTYPE BOOKING
            <br />
            Requests are saved locally on this device only. No availability is checked, no real
            salon is contacted, and no payment is required.
          </p>
        </aside>
        <BookingForm initialService={service} />
      </div>
    </>
  );
}
