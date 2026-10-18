import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Inner-page header: eyebrow → h1 → lede, with an optional visual on the right (desktop). */
export function PageHeader({
  eyebrow,
  title,
  lede,
  children,
  aside,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("relative overflow-hidden", className)}>
      <div
        aria-hidden
        className="absolute top-[-30%] right-[-15%] size-[60vmax] rounded-full opacity-60 [background:var(--glow)]"
      />
      <div
        className={cn(
          "container-x relative pt-[clamp(48px,8vw,112px)] pb-[clamp(48px,7vw,96px)]",
          aside && "grid items-center gap-12 lg:grid-cols-12",
        )}
      >
        <div className={aside ? "lg:col-span-7" : undefined}>
          <p className="eyebrow mb-4 md:mb-5">{eyebrow}</p>
          <h1 className="max-w-[18ch] text-display-l text-ink">{title}</h1>
          {lede && <p className="mt-6 max-w-[54ch] text-body-l text-ink-muted">{lede}</p>}
          {children}
        </div>
        {aside && <div className="lg:col-span-5">{aside}</div>}
      </div>
    </header>
  );
}
