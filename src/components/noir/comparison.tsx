import { useState, type CSSProperties } from "react";
import { MoveHorizontal } from "lucide-react";
import { useDemo } from "./demo-provider";
export function Comparison() {
  const { data } = useDemo();
  const [split, setSplit] = useState(50);
  return (
    <>
      <div className="comparison" style={{ "--split": `${split}%` } as CSSProperties}>
        <img
          className="comparison-before"
          src={data.before}
          alt="Before — replaceable concept image"
          width="1600"
          height="1104"
          loading="lazy"
        />
        <img
          className="comparison-after"
          src={data.after}
          alt="After — replaceable concept image"
          width="1600"
          height="1104"
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
          onChange={(e) => setSplit(Number(e.target.value))}
          aria-label="Before and after image comparison"
          aria-valuetext={`${split}% before, ${100 - split}% after`}
        />
      </div>
      <p className="sample-note">
        CONCEPT COMPARISON · Replaceable AI-generated sample imagery, not a real customer
        transformation.
      </p>
    </>
  );
}
