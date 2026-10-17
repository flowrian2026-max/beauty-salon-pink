import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output } from "ai";
import { z } from "zod";

export const recommendationSchema = z.object({
  serviceId: z.string(),
  reason: z.string(),
  inquiryMessage: z.string(),
});

export async function recommendService(input: {
  goals: string;
  preferences: string;
  occasion: string;
  services: { id: string; title: string; description: string }[];
}) {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new Error("AI advisor is not configured.");
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  const catalog = input.services.map((s) => `- id: ${s.id} | ${s.title}: ${s.description}`).join("\n");
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    system:
      "You are the NOIR PINK beauty concierge. Recommend exactly one service from the catalog using its exact id. " +
      "Never invent prices, durations, availability, credentials, results or medical/skin treatment claims. " +
      "reason: 1-2 confident editorial sentences addressed to the visitor. " +
      "inquiryMessage: a short first-person message (max 600 characters) the visitor can send to the salon describing their goals, preferences and occasion, asking the salon to confirm suitability and availability.",
    prompt: `Catalog:\n${catalog}\n\nGoals: ${input.goals}\nPreferences: ${input.preferences || "None"}\nOccasion: ${input.occasion || "None"}`,
    output: Output.object({ schema: recommendationSchema }),
    maxRetries: 0,
    providerOptions: {
      openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] },
    },
  });
  const out = await result.output;
  if (!input.services.some((s) => s.id === out.serviceId)) throw new Error("No matching service was recommended. Please try again.");
  return { ...out, inquiryMessage: out.inquiryMessage.slice(0, 1000) };
}
