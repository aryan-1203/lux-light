import type { CSSProperties } from "react";
import { pjrek2020 } from "@/data/science";
import { Cite } from "@/components/ui/Cite";

const LO = 0.6;
const HI = 2.2;
const pos = (v: number) => `${((v - LO) / (HI - LO)) * 100}%`;

/** Pjrek et al. 2020: the pooled risk ratio with its confidence interval, drawn on a number line. */
export function MetaAnalysis() {
  const { value, ciLow, ciHigh, trials, participants } = pjrek2020;
  return (
    <figure data-reveal="" className="flex flex-col rounded-lg bg-bg-raise p-6 shadow-soft sm:p-8">
      <figcaption>
        <p className="text-title font-medium">Across 16 trials</p>
        <p className="mt-1 text-small text-fg-muted">
          A 2020 meta-analysis in seasonal depression
          <Cite id="pjrek2020" />
        </p>
      </figcaption>
      <p className="mt-6 flex items-baseline gap-2">
        <span className="tabular text-display font-medium">{value.toFixed(2)}×</span>
        <span className="text-small text-fg-muted">as likely to respond</span>
      </p>
      <p className="mt-1 text-small text-fg-muted">
        People given bright light, compared with placebo ({trials} trials, {participants} patients).
      </p>

      {/* Number line: 1 means no difference; the bar is the 95% confidence interval */}
      <div
        className="relative mt-9 mb-6 h-8"
        role="img"
        aria-label={`Risk ratio ${value}, 95% confidence interval ${ciLow} to ${ciHigh}. A value of 1 would mean no difference.`}
      >
        <div aria-hidden className="absolute inset-x-0 top-1/2 border-t border-line-strong" />
        <div
          aria-hidden
          className="absolute top-0 bottom-0 border-l-[1.5px] border-dashed border-fg-faint"
          style={{ left: pos(1) }}
        >
          <span className="absolute top-full left-0 mt-1.5 -translate-x-1/2 text-[0.75rem] whitespace-nowrap text-fg-muted">
            1 = no difference
          </span>
        </div>
        <div
          aria-hidden
          className="bar-x absolute top-1/2 h-2 -translate-y-1/2 rounded-pill bg-[linear-gradient(90deg,#ffd27a,#ff9a5a)]"
          style={{ left: pos(ciLow), width: `calc(${pos(ciHigh)} - ${pos(ciLow)})`, "--v": 1 } as CSSProperties}
        />
        <div
          aria-hidden
          className="bar-label absolute top-1/2 size-4 -translate-1/2 rounded-full border-2 border-bg-raise bg-[#e8742c]"
          style={{ left: pos(value) }}
        >
          <span className="tabular absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 text-[0.75rem] font-medium whitespace-nowrap">
            {ciLow}–{ciHigh}
          </span>
        </div>
      </div>
      <p className="mt-auto pt-6 text-[0.8125rem] text-fg-muted">
        The bar is the 95% confidence range. The authors called the effect modest and asked for larger, high-quality
        trials.
      </p>
    </figure>
  );
}
