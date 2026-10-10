import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/noir-data";
import { Admin } from "@/components/noir/admin";
export const Route = createFileRoute("/admin")({
  head: () => ({
    ...pageHead(
      "Demo control room",
      "Public frontend-only NOIR PINK demo administrator. Manage local services, images, prices and requests.",
    ),
    meta: [
      ...pageHead(
        "Demo control room",
        "Public frontend-only NOIR PINK demo administrator. Manage local services, images, prices and requests.",
      ).meta,
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});
