import { cssVar } from '../tokens';
import { litLayer } from './lit';
import { LampSvg, type LampIllustrationProps } from './shared';

/** Dawnlit Panel — large square light panel on a kickstand. */
export function LampPanel({ lit = true, kelvin = 5500, title, className }: LampIllustrationProps) {
  return (
    <LampSvg title={title} className={className} kelvin={kelvin}>
      {(ids) => (
        <>
          <ellipse
            cx="200"
            cy="215"
            rx="200"
            ry="215"
            fill={`url(#${ids.glow})`}
            {...litLayer(lit)}
          />
          <ellipse
            cx="200"
            cy="460"
            rx="175"
            ry="22"
            fill={`url(#${ids.floor})`}
            {...litLayer(lit)}
          />
          {/* kickstand legs */}
          <path
            d="M150 400 L120 456 M250 400 L280 456"
            strokeWidth="12"
            strokeLinecap="round"
            style={{ stroke: cssVar('surface-3') }}
          />
          {/* frame */}
          <rect x="50" y="60" width="300" height="350" rx="22" fill={`url(#${ids.body})`} />
          <rect
            x="50"
            y="60"
            width="300"
            height="350"
            rx="22"
            fill="none"
            strokeWidth="1.5"
            style={{ stroke: cssVar('border-strong', 0.6) }}
          />
          <rect
            x="66"
            y="76"
            width="268"
            height="318"
            rx="12"
            style={{ fill: cssVar('surface-2') }}
          />
          <rect
            x="66"
            y="76"
            width="268"
            height="318"
            rx="12"
            fill={`url(#${ids.face})`}
            {...litLayer(lit)}
          />
          {/* LED grid hint */}
          <g style={{ fill: cssVar('bg', 0.06) }}>
            {Array.from({ length: 7 }, (_, r) =>
              Array.from({ length: 6 }, (_, c) => (
                <circle key={`${r}-${c}`} cx={95 + c * 42} cy={105 + r * 44} r="2.5" />
              )),
            )}
          </g>
          <rect
            x="182"
            y="398"
            width="36"
            height="5"
            rx="2.5"
            style={{ fill: lit ? cssVar('sunrise-strong') : cssVar('muted', 0.5) }}
          />
        </>
      )}
    </LampSvg>
  );
}
