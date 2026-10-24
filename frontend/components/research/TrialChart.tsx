"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { lam2016 } from "@/data/science";
import { Cite } from "@/components/ui/Cite";
import { cn } from "@/lib/cn";

const SHORT: Record<string, string> = {
  placebo: "Placebo",
  fluoxetine: "Medication",
  light: "Light",
  combo: "Light + medication",
};

const METRICS = {
  response: { tab: "Responded", noun: "responded", note: "depression score down by half or more" },
  remission: { tab: "In remission", noun: "were in remission", note: "depression score of 10 or less" },
} as const;
type Metric = keyof typeof METRICS;

const TICKS = [0, 25, 50, 75, 100];

/**
 * Lam et al. 2016: the four arms of the trial at week 8, one measure at a time. Light arms are
 * drawn in sunrise colours, the others in grey; the dashed line marks the placebo group.
 */
export function TrialChart() {
  const [metric, setMetric] = useState<Metric>("response");
  const arms = lam2016.arms;
  const placebo = arms.find((a) => a.id === "placebo")![metric];
  const light = arms.find((a) => a.id === "light")![metric];
  const m = METRICS[metric];

  return (
    <figure data-reveal="" className="flex h-full flex-col rounded-lg bg-bg-raise p-6 shadow-soft sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <figcaption>
          <p className="text-title font-medium">A randomised trial, four groups</p>
          <p className="mt-1 text-small text-fg-muted">
            {lam2016.participants} adults, {lam2016.weeks} weeks, 30 min of 10,000-lux light each morning
            <Cite id="lam2016" />
          </p>
        </figcaption>
        <div role="group" aria-label="Measure" className="inline-flex shrink-0 self-start rounded-pill bg-bg-tint p-1">
          {(Object.keys(METRICS) as Metric[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={metric === k}
              onClick={() => setMetric(k)}
              className={cn(
                "h-9 rounded-pill px-4 text-small transition-[background-color,color,box-shadow] duration-[var(--dur-ui)]",
                metric === k ? "bg-bg-raise font-medium text-fg shadow-soft" : "text-fg-muted hover-fine:text-fg",
              )}
            >
              {METRICS[k].tab}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-body-l">
        <span className="tabular font-medium text-accent-fg">{Math.round(light)}%</span> of the light group {m.noun},{" "}
        against <span className="tabular">{Math.round(placebo)}%</span> on placebo.
      </p>

      {/* Plot: y gridlines, a placebo reference line, four bars with direct labels */}
      <div
        className="relative mt-8 ml-8 h-[240px] sm:h-[260px]"
        role="img"
        aria-label={arms.map((a) => `${SHORT[a.id]}: ${Math.round(a[metric])}% ${m.noun}`).join("; ")}
      >
        {TICKS.map((t) => (
          <div
            key={t}
            aria-hidden
            className={cn("absolute inset-x-0 border-t", t ? "border-line" : "border-line-strong")}
            style={{ bottom: `${t}%` }}
          >
            <span className="tabular absolute -left-8 w-6 -translate-y-1/2 text-right text-[0.75rem] text-fg-muted">
              {t}%
            </span>
          </div>
        ))}
        <div
          aria-hidden
          className="absolute inset-x-0 z-[1] border-t-[1.5px] border-dashed border-fg-faint transition-[bottom] duration-700 ease-out"
          style={{ bottom: `${placebo}%` }}
        />

        <div className="absolute inset-0 grid grid-cols-4 gap-3 sm:gap-6">
          {arms.map((a, k) => {
            const lit = a.id === "light" || a.id === "combo";
            const v = a[metric];
            return (
              <div key={a.id} className="group relative flex h-full flex-col items-center justify-end">
                <span
                  className={cn("bar-label tabular mb-2 text-small", lit ? "font-medium text-fg" : "text-fg-muted")}
                  style={{ "--d": `${k * 0.1}s` } as CSSProperties}
                >
                  {Math.round(v)}%
                </span>
                <div
                  className="relative w-full max-w-[72px]"
                  style={{ height: `${v}%`, transition: "height 700ms var(--ease-out)" }}
                >
                  <div
                    className={cn(
                      "bar-y absolute inset-0 rounded-t-[6px]",
                      lit ? "bg-[linear-gradient(180deg,#ffc56b,#ff9a5a)]" : "bg-[#ddd3c6]",
                    )}
                    style={{ "--v": 1, "--d": `${k * 0.1}s` } as CSSProperties}
                  />
                </div>
                {/* Hover note */}
                <div className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-10 w-max max-w-[220px] -translate-x-1/2 rounded-sm bg-fg px-3 py-2 text-[0.75rem] leading-snug text-bg opacity-0 transition-opacity duration-[var(--dur-micro)] group-hover:opacity-100 max-sm:hidden">
                  <span className="block font-medium">{a.label}</span>
                  {a.n} people · {Math.round(a.response)}% responded · {Math.round(a.remission)}% in remission
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div aria-hidden className="mt-3 ml-8 grid grid-cols-4 gap-3 text-center text-[0.8125rem] leading-snug sm:gap-6">
        {arms.map((a) => {
          const lit = a.id === "light" || a.id === "combo";
          return (
            <span key={a.id} className={lit ? "font-medium text-fg" : "text-fg-muted"}>
              {SHORT[a.id]}
              <span className="block text-[0.75rem] font-normal text-fg-muted">n={a.n}</span>
            </span>
          );
        })}
      </div>

      <ul aria-hidden className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-[0.8125rem] text-fg-muted">
        <li className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-[3px] bg-[linear-gradient(180deg,#ffc56b,#ff9a5a)]" />
          With bright light
        </li>
        <li className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-[3px] bg-[#ddd3c6]" />
          Without
        </li>
        <li className="inline-flex items-center gap-2">
          <span className="w-4 border-t-[1.5px] border-dashed border-fg-faint" />
          Placebo level
        </li>
      </ul>

      <details className="faq group/t mt-5 border-t border-line pt-1">
        <summary className="flex min-h-11 cursor-pointer list-none items-center text-small font-medium text-fg-muted hover-fine:text-fg [&::-webkit-details-marker]:hidden">
          See the numbers
        </summary>
        <table className="tabular mb-2 w-full text-left text-small">
          <thead className="text-fg-muted">
            <tr className="border-b border-line">
              <th className="py-2 font-normal">Group</th>
              <th className="py-2 text-right font-normal">People</th>
              <th className="py-2 text-right font-normal">Responded</th>
              <th className="py-2 text-right font-normal">Remission</th>
            </tr>
          </thead>
          <tbody>
            {arms.map((a) => (
              <tr key={a.id} className="border-b border-line last:border-0">
                <td className="py-2 pr-3">{a.label}</td>
                <td className="py-2 text-right">{a.n}</td>
                <td className="py-2 text-right">{a.response}%</td>
                <td className="py-2 text-right">{a.remission}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <p className="mt-auto pt-6 text-[0.8125rem] text-fg-muted">
        {m.tab}: {m.note}, on the MADRS scale. Adults with non-seasonal depression, treated and followed by
        psychiatrists. The trial tested light therapy in general, not this lamp.
      </p>
    </figure>
  );
}
