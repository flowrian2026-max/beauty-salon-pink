import { useState } from "react";
import { ArrowRight, Check, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bookingSchema, businessEmail, inquiryEmail, type Booking } from "@/lib/noir-data";
import { useDemo } from "./demo-provider";
export function BookingForm({ initialService }: { initialService?: string | undefined }) {
  const { data, update, storageError } = useDemo();
  const [form, setForm] = useState({ service: initialService || "", name: "", email: "", phone: "", date: "", time: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"edit" | "review" | "done">("edit");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const service = data.services.find(s => s.id === form.service);
  const recipient = businessEmail(data.contact.email);
  const summary = `Service: ${service?.title || form.service}\nName: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone || "Not supplied"}\nPreferred date: ${form.date || "Flexible"}\nPreferred time: ${form.time || "Flexible"}\nMessage: ${form.message || "None"}`;
  const emailUrl = recipient ? inquiryEmail(recipient, "NOIR PINK booking inquiry", summary) : undefined;
  function change(key: keyof typeof form, value: string) {
    setForm({ ...form, [key]: value }); setErrors({ ...errors, [key]: "" });
  }
  function review(e: React.FormEvent) {
    e.preventDefault();
    const result = bookingSchema.safeParse(form);
    if (!result.success) { setErrors(Object.fromEntries(result.error.issues.map(i => [i.path[0], i.message]))); return; }
    if (!service) { setErrors({ service: "Choose a listed service to inquire about" }); return; }
    setForm(result.data); setStep("review");
  }
  function saveDemo() {
    const result = bookingSchema.safeParse(form);
    if (!result.success || !service) { setStep("edit"); return; }
    const booking: Booking = { ...result.data, id: crypto.randomUUID() };
    setSaved(update({ ...data, bookings: [...data.bookings, booking] })); setStep("done");
  }
  const details = [["Service", service?.title], ["Name", form.name], ["Email", form.email], ["Phone", form.phone || "Not supplied"], ["Preferred date", form.date || "Flexible"], ["Preferred time", form.time || "Flexible"], ["Message", form.message || "None"]];
  if (step === "done") return <div className="status" role="status">
    <Check className="text-primary mb-4" /><h2>{saved ? "LOCAL PREVIEW SAVED." : "PREVIEW RECORDED FOR THIS VISIT."}</h2>
    <p>{service?.title} · {form.date || "Flexible date"}</p>
    <p>Nothing has been sent. No appointment is confirmed. {saved ? "This inquiry stays on this device only." : storageError}</p>
    <Button variant="outline" className="mt-5" onClick={() => { setStep("edit"); setCopied(false); }}>ANOTHER INQUIRY <ArrowRight /></Button>
  </div>;
  if (step === "review") return <div className="review">
    <span className="eyebrow">02 / REVIEW YOUR INQUIRY</span><h2>THE DETAILS.</h2>
    <dl>{details.map(([label,value]) => <div key={label} className="contents"><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    {emailUrl ? <>
      <p className="sample-note">Send to {recipient} from your email app. Opening a draft does not submit your inquiry; press Send there. The business must confirm availability.</p>
      <Button asChild><a href={emailUrl}>OPEN EMAIL INQUIRY <Mail /></a></Button>
      <Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(summary); setCopied(true); } catch { setErrors({ delivery: "Copy unavailable. Select the details above to copy them manually." }); } }}>COPY INQUIRY</Button>
      {copied && <p role="status">Inquiry copied. It has not been sent.</p>}
      {errors["delivery"] && <p role="alert" className="error-text">{errors["delivery"]}</p>}
    </> : <>
      <p className="sample-note">A business contact email has not been supplied. Online delivery is not available. You can save a local preview only; nothing is sent and no appointment is confirmed.</p>
      <Button onClick={saveDemo}>SAVE LOCAL PREVIEW <ArrowRight /></Button>
    </>}
    <Button variant="ghost" onClick={() => setStep("edit")}><ArrowLeft /> EDIT DETAILS</Button>
  </div>;
  return <form className="noir-form" onSubmit={review} noValidate>
    <span className="eyebrow">01 / YOUR INQUIRY</span>
    <label className="field">SERVICE<select value={form.service} onChange={e => change("service",e.target.value)} required aria-invalid={Boolean(errors["service"])} aria-describedby="service-error">
      <option value="">Choose your experience</option>{data.services.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
    </select>{errors["service"] && <span id="service-error" role="alert" className="error-text">{errors["service"]}</span>}</label>
    <label className="field">YOUR NAME<input value={form.name} onChange={e => change("name",e.target.value)} autoComplete="name" maxLength={100} required aria-invalid={Boolean(errors["name"])} aria-describedby="name-error" />{errors["name"] && <span id="name-error" role="alert" className="error-text">{errors["name"]}</span>}</label>
    <div className="form-row">
      <label className="field">EMAIL<input type="email" value={form.email} onChange={e => change("email",e.target.value)} autoComplete="email" maxLength={255} required aria-invalid={Boolean(errors["email"])} aria-describedby="email-error" />{errors["email"] && <span id="email-error" role="alert" className="error-text">{errors["email"]}</span>}</label>
      <label className="field">PHONE · OPTIONAL<input type="tel" value={form.phone} onChange={e => change("phone",e.target.value)} autoComplete="tel" maxLength={30} /></label>
    </div>
    <div className="form-row">
      <label className="field">PREFERRED DATE · OPTIONAL<input type="date" value={form.date} onChange={e => change("date",e.target.value)} aria-invalid={Boolean(errors["date"])} />{errors["date"] && <span role="alert" className="error-text">{errors["date"]}</span>}</label>
      <label className="field">PREFERRED TIME · OPTIONAL<input type="time" value={form.time} onChange={e => change("time",e.target.value)} aria-invalid={Boolean(errors["time"])} />{errors["time"] && <span role="alert" className="error-text">{errors["time"]}</span>}</label>
    </div>
    <label className="field">MESSAGE · OPTIONAL<textarea value={form.message} onChange={e => change("message",e.target.value)} maxLength={1000} placeholder="Tell us what you have in mind." /></label>
    <p className="sample-note">{recipient ? "An email draft is prepared after review. Availability and pricing are confirmed by the business." : "No business email is configured. This is a local preview only, not an online submission."}</p>
    <Button type="submit">REVIEW YOUR INQUIRY <ArrowRight /></Button>
    {storageError && <p className="error-text">{storageError}</p>}
  </form>;
}
