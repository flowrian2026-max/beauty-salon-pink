import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/noir-data";
import { ConsultationPlanner } from "@/components/noir/consultation-planner";

export const Route = createFileRoute("/consultation")({
  head: () => pageHead("Personal consultation", "Explore your preferences and prepare a personal NOIR PINK beauty consultation inquiry."),
  component: ConsultationPlanner,
});