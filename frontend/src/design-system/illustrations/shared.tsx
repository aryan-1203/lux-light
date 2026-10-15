import { useId, type ReactNode } from 'react';
import { cssVar, kelvinTint } from '../tokens';

export type LampIllustrationProps = {
  /** Lamp switched on (glow + light face). */
  lit?: boolean;
  /** Colour temperature tint of the light face (4000 / 5500 / 6500). */
  kelvin?: number;
  /** Accessible label; omit for decorative use (aria-hidden). */
  title?: string;
  className?: string;
};

/** Shared gradient defs + accessible <svg> wrapper. viewBox is 400×500 (4:5) for every lamp. */
export function LampSvg({
  title,
  className,
  children,
  kelvin = 5500,
}: {
  title?: string;
  className?: string;
  kelvin?: number;
  children: (ids: { glow: string; face: string; body: string; floor: string }) => ReactNode;
}) {
  const uid = useId().replace(/:/g, '');
  const ids = { glow: `g${uid}`, face: `f${uid}`, body: `b${uid}`, floor: `fl${uid}` };
  const tint = kelvinTint(kelvin);
  return (
    <svg
      viewBox="0 0 400 500"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id={ids.glow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: tint, stopOpacity: 0.85 }} />
          <stop offset="35%" style={{ stopColor: cssVar('sunrise-strong'), stopOpacity: 0.35 }} />
          <stop offset="70%" style={{ stopColor: cssVar('sunrise-deep'), stopOpacity: 0.08 }} />
          <stop offset="100%" style={{ stopColor: cssVar('bg'), stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id={ids.face} cx="50%" cy="38%" r="75%">
          <stop offset="0%" style={{ stopColor: cssVar('daylight') }} />
          <stop offset="55%" style={{ stopColor: tint }} />
          <stop offset="100%" style={{ stopColor: cssVar('sunrise-strong') }} />
        </radialGradient>
        <linearGradient id={ids.body} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" style={{ stopColor: cssVar('surface-3') }} />
          <stop offset="100%" style={{ stopColor: cssVar('surface') }} />
        </linearGradient>
        <radialGradient id={ids.floor} cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: cssVar('sunrise'), stopOpacity: 0.35 }} />
          <stop offset="100%" style={{ stopColor: cssVar('bg'), stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      {children(ids)}
    </svg>
  );
}
