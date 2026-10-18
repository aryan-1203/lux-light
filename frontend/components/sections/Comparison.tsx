import { Check, Minus } from "lucide-react";
import { comparison, type CompareCell } from "@/data/specs";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";

/** This lamp vs an ordinary desk lamp vs outdoor light. Scrolls inside its own frame on small screens. */
export function Comparison({ withHeading = true }: { withHeading?: boolean }) {
  return (
    <section
      aria-labelledby={withHeading ? "compare-title" : undefined}
      aria-label={withHeading ? undefined : "Comparison"}
      className={withHeading ? "section-y" : ""}
    >
      <div className="container-x">
        {withHeading && (
          <Reveal>
            <SectionHeading
              id="compare-title"
              eyebrow="How it compares"
              title={
                <>
                  Not just another <em>desk lamp</em>.
                </>
              }
              lede="Sunlight is the gold standard, when you can get it. The lamp brings its brightness to your desk, on your schedule."
            />
          </Reveal>
        )}

        <Reveal className={cn("relative", withHeading && "mt-12 md:mt-16")}>
          <div className="-mx-[var(--gutter)] [scrollbar-width:thin] overflow-x-auto px-[var(--gutter)] pb-2">
            <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left">
              <caption className="sr-only">Comparison of this lamp, an ordinary desk lamp and outdoor light</caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 z-10 w-[28%] bg-paper py-4 pr-4 align-bottom font-mono text-label font-medium tracking-[0.08em] text-ink-muted uppercase"
                  >
                    Feature
                  </th>
                  <th
                    scope="col"
                    className="w-[24%] rounded-t-md bg-sun-50 px-5 py-4 align-bottom text-small font-semibold text-ink"
                  >
                    This lamp
                  </th>
                  <th scope="col" className="w-[24%] px-5 py-4 align-bottom text-small font-semibold text-ink">
                    Ordinary desk lamp
                  </th>
                  <th scope="col" className="w-[24%] px-5 py-4 align-bottom text-small font-semibold text-ink">
                    Outdoor light
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr key={row.feature}>
                    <th
                      scope="row"
                      className="sticky left-0 z-10 border-t border-hairline bg-paper py-4 pr-4 text-small font-medium text-ink"
                    >
                      {row.feature}
                    </th>
                    <Cell cell={row.lamp} highlight last={i === comparison.length - 1} />
                    <Cell cell={row.desk} />
                    <Cell cell={row.outdoor} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Cell({ cell, highlight, last }: { cell: CompareCell; highlight?: boolean; last?: boolean }) {
  return (
    <td
      className={cn(
        "border-t border-hairline px-5 py-4 text-small",
        highlight ? "bg-sun-50 text-ink" : "text-ink-muted",
        highlight && last && "rounded-b-md",
      )}
    >
      <span className="flex items-start gap-2">
        {cell.good ? (
          <Check
            aria-hidden
            className={cn("mt-0.5 size-4 shrink-0", highlight ? "text-sun-800" : "text-ink/60")}
            strokeWidth={2.25}
          />
        ) : (
          <Minus aria-hidden className="mt-0.5 size-4 shrink-0 text-ink/30" strokeWidth={2} />
        )}
        <span>{cell.value}</span>
      </span>
    </td>
  );
}
