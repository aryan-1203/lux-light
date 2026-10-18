import { siteConfig } from "@/site.config";
import { cn } from "@/lib/cn";

type GlyphProps = {
  className?: string;
  /** Fill the sun with the accent colour; otherwise everything is currentColor. */
  tone?: "mono" | "sun";
  /** Lamp "on" state, used by the 404 page and the form success state. */
  lit?: boolean;
  title?: string;
};

/** A sun (circle) inside a lamp (3:4 rounded rectangle). */
export function LogoGlyph({ className, tone = "sun", lit = true, title }: GlyphProps) {
  const sunFill = tone === "sun" && lit ? "var(--sun-400)" : "currentColor";
  return (
    <svg
      viewBox="0 0 24 32"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="none"
    >
      <rect x="1.25" y="1.25" width="21.5" height="29.5" rx="5.25" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="12" cy="14" r="5.25" fill={sunFill} opacity={lit ? 1 : 0.28} />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-ink", className)}>
      <LogoGlyph className="h-[26px] w-auto" />
      <span
        className="font-display text-[1.375rem] leading-none tracking-[-0.02em]"
        style={{ fontVariationSettings: '"opsz" 24' }}
      >
        {siteConfig.brandName}
      </span>
    </span>
  );
}
