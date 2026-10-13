import { ArrowUpRight } from "lucide-react";
import { useDemo } from "./demo-provider";
import { BookLink } from "./site-shell";
export function Services({ preview = false }: { preview?: boolean }) {
  const { data } = useDemo();
  return (
    <>
      <div className="service-grid">
        {data.services.slice(0, preview ? 4 : undefined).map((s, i) => (
          <article className="service-item" key={s.id} data-reveal>
            <div className="service-image">
              <img
                src={s.image}
                alt={s.title + " — sample beauty concept"}
                loading="lazy"
                width="864"
                height="1104"
              />
              <span className="service-number">0{i + 1} /</span>
            </div>
            <div className="service-caption">
              <h3>{s.title}</h3>
              <ArrowUpRight size={23} className="text-primary" />
            </div>
            <p>{s.description}</p>
            {(
              <>
                <div className="service-meta">
                  <span>{s.price || "PRICING ON INQUIRY"}</span>
                  {s.duration && <span>{s.duration}</span>}
                </div>
                <BookLink service={s.id} />
              </>
            )}
          </article>
        ))}
      </div>
      <p className="sample-note">
        AI-generated concept photography.{" "}
        Service details and availability are confirmed on inquiry.
      </p>
    </>
  );
}
