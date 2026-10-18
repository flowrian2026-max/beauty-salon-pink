import { useT } from "@/lib/i18n";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemo } from "./demo-provider";
import { contactSchema, safeSocial, businessEmail, inquiryEmail } from "@/lib/noir-data";
export function ContactContent() {
  const { m, c, t } = useT();
  const { data } = useDemo();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [draft, setDraft] = useState("");
  const recipient = businessEmail(data.contact.email);
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw = new FormData(e.currentTarget);
    const result = contactSchema.safeParse(Object.fromEntries(raw));
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    setDraft(inquiryEmail(data.contact.email, t("NOIR PINK contact inquiry", "پیام به NOIR PINK"), `${m("Name")}: ${result.data.name}\n${m("Email")}: ${result.data.email}\n\n${result.data.message}`) || "");
    setDone(true);
  }
  return (
    <div className="form-layout">
      <aside>
        <h2>{m("LET’S CONNECT.")}</h2>
        <p>{m("Your next expression starts with a conversation.")}</p>
        <dl className="contact-details">
          {[
            ["ADDRESS", data.contact.address],
            ["PHONE", data.contact.phone],
            ["EMAIL", data.contact.email],
            ["OPENING HOURS", data.contact.hours],
          ].map(([k, v]) => (
            <div key={k}>
              <dt>{m(k)}</dt>
              <dd>{k === "EMAIL" && recipient ? <a href={`mailto:${encodeURIComponent(recipient)}`}>{recipient}</a> : c(v)}</dd>
            </div>
          ))}
        </dl>
        <div className="admin-tools">
          {(["instagram", "tiktok"] as const).map((key) => {
            const url = safeSocial(data.contact[key]);
            return url ? (
              <Button asChild key={key} variant="outline">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {m(key.toUpperCase())} <ArrowUpRight />
                </a>
              </Button>
            ) : null;
          })}
        </div>
        {!recipient && <p className="sample-note">{m("Business contact details have not yet been supplied. Online delivery is unavailable.")}</p>}
      </aside>
      {done ? (
        <div className="status" role="status">
          <h2>{m(draft ? "YOUR EMAIL DRAFT IS READY." : "LOCAL MESSAGE PREVIEW.")}</h2>
          <p>
            {m(draft ? "Open your email app and press Send to deliver your inquiry. Nothing is sent automatically." : "Your message was validated but not sent or stored. A business email is needed for delivery.")}
          </p>
          {draft && <Button asChild className="mt-5"><a href={draft}>{m("OPEN EMAIL INQUIRY")}<ArrowUpRight /></a></Button>}
          <Button variant="outline" className="mt-5" onClick={() => setDone(false)}>{m("WRITE ANOTHER MESSAGE")}<ArrowUpRight />
          </Button>
        </div>
      ) : (
        <form className="noir-form" noValidate onSubmit={submit}>
          <label className="field">{m("YOUR NAME")}<input
              name="name"
              required
              maxLength={100}
              autoComplete="name"
              aria-invalid={Boolean(errors["name"])}
            />
            {errors["name"] && <span className="error-text">{m(errors["name"])}</span>}
          </label>
          <label className="field">{m("EMAIL")}<input
              name="email"
              type="email"
              required
              maxLength={255}
              autoComplete="email"
              aria-invalid={Boolean(errors["email"])}
            />
            {errors["email"] && <span className="error-text">{m(errors["email"])}</span>}
          </label>
          <label className="field">{m("YOUR MESSAGE")}<textarea
              name="message"
              required
              maxLength={1000}
              aria-invalid={Boolean(errors["message"])}
            />
            {errors["message"] && <span className="error-text">{m(errors["message"])}</span>}
          </label>
          <p className="sample-note">{m(recipient ? "Review your email draft before sending from your email app." : "Local preview only. No business email is configured; messages cannot be delivered.")}</p>
          <Button type="submit">{m("REVIEW YOUR MESSAGE")}<ArrowUpRight />
          </Button>
        </form>
      )}
    </div>
  );
}
