import { useT } from "@/lib/i18n";
import { useState, type CSSProperties, type PointerEvent } from "react";
import { MoveHorizontal } from "lucide-react";
import { useDemo } from "./demo-provider";
import { comparisonSplit } from "@/lib/noir-data";
export function Comparison() {
  const { m, t } = useT();
  const { data } = useDemo();
  const [split, setSplit] = useState(50);
  const [dragging, setDragging] = useState(false);
  function move(e: PointerEvent<HTMLInputElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    setSplit(comparisonSplit(e.clientX, box.left, box.width));
  }
  return (
    <>
      <div
        className={`comparison ${dragging ? "is-dragging" : ""}`}
        style={{ "--split": `${split}%` } as CSSProperties}
      >
        <img
          className="comparison-before"
          src={data.before}
          alt={m("Before makeup \u2014 bare natural face, replaceable concept image")}
          width="1264"
          height="848"
          loading="lazy"
        />
        <img
          className="comparison-after"
          src={data.after}
          alt={m(
            "After makeup \u2014 the same face with editorial pink makeup, replaceable concept image",
          )}
          width="1264"
          height="848"
          loading="lazy"
        />
        <div className="compare-divider">
          <span>
            <MoveHorizontal size={20} />
          </span>
        </div>
        <span className="compare-label before">{m("BEFORE")}</span>
        <span className="compare-label after">{m("AFTER")}</span>
        <input
          type="range"
          min="0"
          max="100"
          value={split}
          step="0.1"
          onChange={(e) => setSplit(Number(e.target.value))}
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.focus();
            e.currentTarget.setPointerCapture(e.pointerId);
            setDragging(true);
            move(e);
          }}
          onPointerMove={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e);
          }}
          onPointerUp={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) {
              move(e);
              e.currentTarget.releasePointerCapture(e.pointerId);
            }
            setDragging(false);
          }}
          onPointerCancel={() => setDragging(false)}
          onLostPointerCapture={() => setDragging(false)}
          aria-label={m("Before and after image comparison")}
          aria-valuetext={t(
            `${Math.round(split)}% before, ${Math.round(100 - split)}% after`,
            `${Math.round(split)}٪ قبل، ${Math.round(100 - split)}٪ بعد`,
          )}
        />
      </div>
      <p className="sample-note">
        {m(
          "AI MAKEUP CONCEPT · Same face and scene, makeup-only edit. Not a real customer result. Both images are replaceable in Demo Admin.",
        )}
      </p>
    </>
  );
}
