import { cssVar } from '../tokens';
import { litLayer } from './lit';
import { LampSvg, type LampIllustrationProps } from './shared';

/** Dawnlit Go — pocketable rounded lamp with a fold-out stand and USB-C port. */
export function LampGo({ lit = true, kelvin = 5500, title, className }: LampIllustrationProps) {
  return (
    <LampSvg title={title} className={className} kelvin={kelvin}>
      {(ids) => (
        <>
          <ellipse
            cx="200"
            cy="230"
            rx="170"
            ry="190"
            fill={`url(#${ids.glow})`}
            {...litLayer(lit)}
          />
          <ellipse
            cx="200"
            cy="440"
            rx="120"
            ry="18"
            fill={`url(#${ids.floor})`}
            {...litLayer(lit)}
          />
          {/* fold-out stand */}
          <path
            d="M228 330 L262 432"
            strokeWidth="10"
            strokeLinecap="round"
            style={{ stroke: cssVar('surface-3') }}
          />
          {/* body */}
          <rect x="125" y="110" width="150" height="320" rx="44" fill={`url(#${ids.body})`} />
          <rect
            x="125"
            y="110"
            width="150"
            height="320"
            rx="44"
            fill="none"
            strokeWidth="1.5"
            style={{ stroke: cssVar('border-strong', 0.6) }}
          />
          <rect
            x="139"
            y="124"
            width="122"
            height="250"
            rx="32"
            style={{ fill: cssVar('surface-2') }}
          />
          <rect
            x="139"
            y="124"
            width="122"
            height="250"
            rx="32"
            fill={`url(#${ids.face})`}
            {...litLayer(lit)}
          />
          {/* USB-C port + power button */}
          <rect x="186" y="398" width="28" height="9" rx="4.5" style={{ fill: cssVar('bg') }} />
          <rect
            x="275"
            y="190"
            width="5"
            height="34"
            rx="2.5"
            style={{ fill: lit ? cssVar('sunrise-strong') : cssVar('muted', 0.5) }}
          />
          {/* lanyard loop */}
          <path
            d="M175 110 C175 78 225 78 225 110"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            style={{ stroke: cssVar('surface-3') }}
          />
        </>
      )}
    </LampSvg>
  );
}
