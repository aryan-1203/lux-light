import type { CSSProperties } from "react";
import { siteConfig } from "@/site.config";
import { lux } from "@/data/specs";
import { formatNumber } from "@/lib/format";
import { Cite } from "@/components/ui/Cite";

const MAX = lux.peak.value;
const ROWS = [
  { label: "Typical home", value: 100, display: "50–200" },
  { label: "Office desk", value: 300, display: "200–400" },
  { label: "Overcast day", value: 1000, display: "≈ 1,000" },
  { label: `${siteConfig.brandName}, at ${lux.measuredAtCm.value} cm`, value: MAX, display: formatNumber(MAX), lamp: true },
];

/**
 * Linear scale on purpose: on a log axis a room and the lamp look like neighbours. Drawn to scale,
 * indoor light is a sliver, which is the point.
 */
export function LuxGap() {
  return (
    <figure data-reveal="" className="flex flex-col rounded-lg bg-bg-raise p-6 shadow-soft sm:p-8">
      <figcaption>
        <p className="text-title font-medium">Light at your eyes</p>
        <p className="mt-1 text-small text-fg-muted">Lux, drawn to scale</p>
      </figcaption>
      <ul className="mt-8 grid gap-5">
        {ROWS.map((r, k) => (
          <li key={r.label}>
            <div className="flex items-baseline justify-between gap-4 text-small">
              <span className={r.lamp ? "font-medium text-fg" : "text-fg-muted"}>{r.label}</span>
              <span className={`bar-label tabular ${r.lamp ? "font-medium text-accent-fg" : "text-fg-muted"}`} style={{ "--d": `${k * 0.12}s` } as CSSProperties}>
                {r.display} lux
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-pill bg-[rgb(31_27_22/0.05)]">
              <div
                className={`bar-x h-full rounded-pill ${r.lamp ? "bg-[linear-gradient(90deg,#ffd27a,#ffb938_50%,#ff9a5a)]" : "bg-[#d9cfc1]"}`}
                style={{ "--v": Math.max(r.value / MAX, 0.012), "--d": `${k * 0.12}s` } as CSSProperties}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-auto pt-8 text-[0.8125rem] text-fg-muted">
        Indoor levels from published reviews.
        <Cite id="params" /> A clear day outdoors reaches 10,000–30,000 lux.
      </p>
    </figure>
  );
}
