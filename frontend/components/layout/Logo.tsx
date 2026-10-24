import { siteConfig } from "@/site.config";
import { cn } from "@/lib/cn";

/** The lamp's panel, seen from the front, glowing. */
export function LogoGlyph({ className, lit = true }: { className?: string; lit?: boolean }) {
  return (
    <svg viewBox="0 0 28 24" className={cn("shrink-0", className)} aria-hidden fill="none">
      <rect x="1" y="1" width="26" height="19" rx="5" stroke="currentColor" strokeWidth="2" />
      <rect x="4.5" y="4.5" width="19" height="12" rx="2.5" fill={lit ? "var(--sun)" : "currentColor"} opacity={lit ? 1 : 0.25} />
      <path d="M14 20v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-fg", className)}>
      <LogoGlyph className="h-[20px] w-auto" />
      <span className="text-[1.25rem] leading-none font-medium tracking-[-0.02em]">{siteConfig.brandName}</span>
    </span>
  );
}
