import { useState, type CSSProperties, type PointerEvent } from "react";
import { MoveHorizontal } from "lucide-react";
import { useDemo } from "./demo-provider";
import { comparisonSplit } from "@/lib/noir-data";
export function Comparison() {
  const { data } = useDemo();
  const [split, setSplit] = useState(50);
  const [dragging, setDragging] = useState(false);
  function move(e: PointerEvent<HTMLInputElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    setSplit(comparisonSplit(e.clientX, box.left, box.width));
  }
  return (
    <>
      <div className={`comparison ${dragging ? "is-dragging" : ""}`} style={{ "--split": `${split}%` } as CSSProperties}>
        <img
          className="comparison-before"
          src={data.before}
          alt="Before manicure — natural nails, replaceable concept image"
          width="1600"
          height="1024"
          loading="lazy"
        />
        <img
          className="comparison-after"
          src={data.after}
          alt="After manicure — the same hand with pink polish, replaceable concept image"
          width="1600"
          height="1024"
          loading="lazy"
        />
        <div className="compare-divider">
          <span>
            <MoveHorizontal size={20} />
          </span>
        </div>
        <span className="compare-label before">BEFORE</span>
        <span className="compare-label after">AFTER</span>
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
          onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e); }}
          onPointerUp={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) {
              move(e);
              e.currentTarget.releasePointerCapture(e.pointerId);
            }
            setDragging(false);
          }}
          onPointerCancel={() => setDragging(false)}
          onLostPointerCapture={() => setDragging(false)}
          aria-label="Before and after image comparison"
          aria-valuetext={`${Math.round(split)}% before, ${Math.round(100 - split)}% after`}
        />
      </div>
      <p className="sample-note">
        AI MANICURE CONCEPT · Same scene, nail-only edit. Not a real customer result. Both images are replaceable in Demo Admin.
      </p>
    </>
  );
}
