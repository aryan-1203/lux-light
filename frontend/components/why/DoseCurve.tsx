import type { CSSProperties } from "react";
import { doseEquivalence } from "@/data/science";
import { formatNumber } from "@/lib/format";
import { Cite } from "@/components/ui/Cite";

const X_MAX = 11000;
const Y_MAX = 135;
const x = (lux: number) => (lux / X_MAX) * 100;
const y = (min: number) => 100 - (min / Y_MAX) * 100;

// The clinic rule is lux × minutes ≈ constant (300,000 lux-minutes), so the curve is a hyperbola.
const DOSE = 10000 * 30;
const CURVE = Array.from({ length: 41 }, (_, i) => {
  const lux = 2300 + (i / 40) * (10600 - 2300);
  return `${i ? "L" : "M"}${x(lux).toFixed(2)} ${y(DOSE / lux).toFixed(2)}`;
}).join(" ");

const LABEL: Record<number, string> = { 2500: "2 hours", 5000: "1 hour", 10000: "30 min" };

/** Yale's rule of thumb: the brighter the light, the shorter the session. */
export function DoseCurve() {
  const pts = doseEquivalence.points;
  return (
    <figure data-reveal="" className="flex flex-col rounded-lg bg-bg-raise p-6 shadow-soft sm:p-8">
      <figcaption>
        <p className="text-title font-medium">Brighter light, shorter sessions</p>
        <p className="mt-1 text-small text-fg-muted">
          Minutes needed for the same dose of light
          <Cite id="yale" />
        </p>
      </figcaption>

      <div className="relative mt-8 mr-2 mb-7 ml-9 h-[210px]">
        {/* Grid and axes */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
          className="absolute inset-0 size-full overflow-visible"
        >
          {[30, 60, 120].map((m) => (
            <line
              key={m}
              x1="0"
              x2="100"
              y1={y(m)}
              y2={y(m)}
              stroke="rgb(31 27 22 / 0.08)"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <line x1="0" x2="100" y1="100" y2="100" stroke="rgb(31 27 22 / 0.28)" vectorEffect="non-scaling-stroke" />
        </svg>
        {/* The curve, wiped in left to right once revealed */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
          className="wipe absolute inset-0 size-full overflow-visible"
        >
          <defs>
            <linearGradient id="dose-line" x1="0" x2="1">
              <stop offset="0" stopColor="#d9cfc1" />
              <stop offset="1" stopColor="#ff9a5a" />
            </linearGradient>
          </defs>
          <path
            d={CURVE}
            fill="none"
            stroke="url(#dose-line)"
            strokeWidth="2.5"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {/* Y labels */}
        {[30, 60, 120].map((m) => (
          <span
            key={m}
            className="tabular absolute -left-9 w-7 -translate-y-1/2 text-right text-[0.75rem] text-fg-muted"
            style={{ top: `${y(m)}%` }}
          >
            {m}
          </span>
        ))}
        <span className="absolute -top-6 -left-9 text-[0.75rem] text-fg-muted">min</span>
        {/* Points, with a label and a hover note each */}
        {pts.map((p, k) => {
          const lamp = p.lux === 10000;
          return (
            <div
              key={p.lux}
              className="group absolute size-0"
              style={{ left: `${x(p.lux)}%`, top: `${y(p.minutes)}%` }}
            >
              <span
                className={`bar-label absolute top-1/2 left-1/2 block -translate-1/2 rounded-full border-2 border-bg-raise ${lamp ? "size-4 bg-apricot shadow-[0_0_0_6px_rgb(255_154_90/0.2)]" : "size-3 bg-[#cbbfae]"}`}
                style={{ "--d": `${0.3 + k * 0.25}s` } as CSSProperties}
              />
              <span
                className={`bar-label absolute bottom-3 text-small whitespace-nowrap ${lamp ? "right-0 font-medium text-fg" : "left-2 text-fg-muted"}`}
                style={{ "--d": `${0.3 + k * 0.25}s` } as CSSProperties}
              >
                {LABEL[p.lux]}
              </span>
              <span
                className={`pointer-events-none absolute top-4 z-10 w-max max-w-[180px] rounded-sm bg-fg px-2.5 py-1.5 text-[0.75rem] text-bg opacity-0 transition-opacity duration-[var(--dur-micro)] group-hover:opacity-100 ${lamp ? "right-0" : "left-1/2 -translate-x-1/2"}`}
              >
                {formatNumber(p.lux)} lux for {p.minutes} minutes
              </span>
              {/* Bigger hit area than the dot */}
              <span className="absolute -top-5 -left-5 size-10" />
            </div>
          );
        })}
        {/* X labels */}
        {[2500, 5000, 10000].map((l) => (
          <span
            key={l}
            className="tabular absolute -bottom-7 -translate-x-1/2 text-[0.75rem] text-fg-muted"
            style={{ left: `${x(l)}%` }}
          >
            {formatNumber(l)}
          </span>
        ))}
      </div>
      <p className="text-right text-[0.75rem] text-fg-muted">lux at your eyes</p>

      <p className="mt-auto pt-6 text-[0.8125rem] text-fg-muted">
        Clinic guidance treats 30 minutes at 10,000 lux like an hour at 5,000 or two hours at 2,500. A rough rule, not
        an exact formula.
      </p>
    </figure>
  );
}
