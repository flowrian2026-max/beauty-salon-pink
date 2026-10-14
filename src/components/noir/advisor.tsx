import { useState } from "react";
import { ArrowRight, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRecommendation, advisorInput } from "@/lib/advisor.functions";
import { useDemo } from "./demo-provider";

export type Suggestion = { serviceId: string; message: string };

export function BeautyAdvisor({ onApply }: { onApply: (s: Suggestion) => void }) {
  const { data } = useDemo();
  const [form, setForm] = useState({ goals: "", preferences: "", occasion: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rec, setRec] = useState<{ serviceId: string; reason: string; inquiryMessage: string } | null>(null);
  const service = rec && data.services.find((s) => s.id === rec.serviceId);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const input = { ...form, services: data.services.map(({ id, title, description }) => ({ id, title, description })) };
    const parsed = advisorInput.safeParse(input);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || "Check your answers"); return; }
    setLoading(true); setError(""); setRec(null);
    try {
      const res = await getRecommendation({ data: parsed.data });
      if (res.ok) setRec(res); else setError(res.error);
    } catch { setError("The advisor is unavailable right now. You can still choose a service below."); }
    finally { setLoading(false); }
  }

  return <section className="noir-form advisor" aria-labelledby="advisor-title">
    <span className="eyebrow">00 / AI BEAUTY ADVISOR</span>
    <h2 id="advisor-title">NOT SURE WHERE TO START?</h2>
    <form onSubmit={ask} noValidate className="grid gap-4">
      <label className="field">YOUR BEAUTY GOALS<textarea value={form.goals} maxLength={600} onChange={(e) => setForm({ ...form, goals: e.target.value })} placeholder="e.g. A refined look that still feels bold" /></label>
      <div className="form-row">
        <label className="field">PREFERENCES · OPTIONAL<input value={form.preferences} maxLength={400} onChange={(e) => setForm({ ...form, preferences: e.target.value })} placeholder="Colours, finish, style" /></label>
        <label className="field">OCCASION · OPTIONAL<input value={form.occasion} maxLength={200} onChange={(e) => setForm({ ...form, occasion: e.target.value })} placeholder="Wedding, evening, everyday" /></label>
      </div>
      {error && <p role="alert" className="error-text">{error}</p>}
      <Button type="submit" disabled={loading}>{loading ? "THINKING…" : "GET A RECOMMENDATION"} <Wand2 /></Button>
    </form>
    {rec && service && <div className="review" role="status">
      <span className="eyebrow">SUGGESTED FOR YOU</span>
      <h3>{service.title}</h3>
      <p>{rec.reason}</p>
      <p className="sample-note">Draft message: “{rec.inquiryMessage}”</p>
      <p className="sample-note">AI-generated suggestion, not professional advice. The salon confirms suitability, pricing and availability.</p>
      <Button onClick={() => onApply({ serviceId: service.id, message: rec.inquiryMessage })}>USE IN MY INQUIRY <ArrowRight /></Button>
    </div>}
  </section>;
}
