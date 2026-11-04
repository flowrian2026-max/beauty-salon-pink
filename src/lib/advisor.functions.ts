import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const advisorInput = z.object({
  goals: z.string().trim().min(5, "Tell us a little about your goals").max(600),
  preferences: z.string().trim().max(400),
  occasion: z.string().trim().max(200),
  language: z.enum(["en", "fa"]).default("en"),
  services: z
    .array(
      z.object({
        id: z.string().max(100),
        title: z.string().max(70),
        description: z.string().max(300),
      }),
    )
    .min(1)
    .max(30),
});

export const getRecommendation = createServerFn({ method: "POST" })
  .validator((d: unknown) => advisorInput.parse(d))
  .handler(async ({ data }) => {
    const { recommendService } = await import("./advisor.server");
    try {
      return { ok: true as const, ...(await recommendService(data)) };
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      const message =
        status === 402
          ? "AI credits are used up for now. Please choose a service manually."
          : status === 429
            ? "The advisor is busy. Please wait a moment and try again."
            : e instanceof Error
              ? e.message
              : "The advisor is unavailable.";
      console.error("advisor error", status, e);
      return { ok: false as const, error: message };
    }
  });
