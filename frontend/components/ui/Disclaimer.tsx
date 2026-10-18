import { Info } from "lucide-react";
import { cn } from "@/lib/cn";

export const DISCLAIMER_TEXT =
  "Not a medical device. If you have bipolar disorder, an eye condition, or take medication that makes you sensitive to light, check with your doctor before use.";

export function Disclaimer({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <aside
      aria-label="Wellness disclaimer"
      className={cn(
        "flex gap-3 rounded-md border border-hairline bg-linen/70 text-ink-muted",
        compact ? "p-3 text-[0.8125rem] leading-relaxed" : "p-4 text-small",
        className,
      )}
    >
      <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-muted" strokeWidth={1.75} />
      <p>
        <span className="font-medium text-ink">Wellness product. </span>
        {DISCLAIMER_TEXT}
      </p>
    </aside>
  );
}
