import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/noir-data";
import { ConsultationPlanner } from "@/components/noir/consultation-planner";

export const Route = createFileRoute("/occasions")({
  head: () => pageHead("The occasion edit", "Plan a beauty inquiry around your wedding, evening event or photo session with NOIR PINK."),
  component: () => <ConsultationPlanner occasionMode />,
});