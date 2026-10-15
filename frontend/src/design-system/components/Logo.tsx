import { useId } from 'react';
import { BRAND_NAME } from '@/config/brand';
import { cn } from '../cn';
import { cssVar } from '../tokens';

/** Sunrise-over-horizon mark (same geometry as public/favicon.svg). Decorative. */
export function LogoMark({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn('size-8', className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={`lg${uid}`} cx="50%" cy="64%" r="55%">
          <stop offset="0" style={{ stopColor: cssVar('daylight'), stopOpacity: 0.9 }} />
          <stop offset="0.45" style={{ stopColor: cssVar('sunrise-strong'), stopOpacity: 0.45 }} />
          <stop offset="1" style={{ stopColor: cssVar('sunrise'), stopOpacity: 0 }} />
        </radialGradient>
        <linearGradient id={`ls${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: cssVar('daylight') }} />
          <stop offset="1" style={{ stopColor: cssVar('sunrise') }} />
        </linearGradient>
      </defs>
      <circle cx="32" cy="41" r="27" fill={`url(#lg${uid})`} />
      <path d="M14 41a18 18 0 0 1 36 0z" fill={`url(#ls${uid})`} />
      <rect x="9" y="44" width="46" height="3.5" rx="1.75" style={{ fill: cssVar('sunrise') }} />
      <rect
        x="18"
        y="50.5"
        width="28"
        height="3"
        rx="1.5"
        style={{ fill: cssVar('sunrise'), opacity: 0.5 }}
      />
    </svg>
  );
}

/** Mark + wordmark (brand name from config/brand.ts). */
export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      {showWordmark ? (
        <span className="font-display text-xl font-bold tracking-tight text-fg">{BRAND_NAME}</span>
      ) : (
        <span className="sr-only">{BRAND_NAME}</span>
      )}
    </span>
  );
}
