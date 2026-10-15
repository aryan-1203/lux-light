import { cssVar } from '../tokens';
import { litLayer } from './lit';
import { LampSvg, type LampIllustrationProps } from './shared';

/** Dawnlit Desk — slim rectangular light face on a weighted stand. */
export function LampDesk({ lit = true, kelvin = 5500, title, className }: LampIllustrationProps) {
  return (
    <LampSvg title={title} className={className} kelvin={kelvin}>
      {(ids) => (
        <>
          <ellipse
            cx="200"
            cy="200"
            rx="200"
            ry="200"
            fill={`url(#${ids.glow})`}
            {...litLayer(lit)}
          />
          <ellipse
            cx="200"
            cy="452"
            rx="150"
            ry="22"
            fill={`url(#${ids.floor})`}
            {...litLayer(lit)}
          />
          {/* stand */}
          <rect x="190" y="330" width="20" height="104" rx="10" fill={`url(#${ids.body})`} />
          <rect x="120" y="428" width="160" height="24" rx="12" fill={`url(#${ids.body})`} />
          <rect
            x="120"
            y="428"
            width="160"
            height="24"
            rx="12"
            fill="none"
            style={{ stroke: cssVar('border-strong', 0.5) }}
          />
          {/* head */}
          <rect x="95" y="70" width="210" height="280" rx="28" fill={`url(#${ids.body})`} />
          <rect
            x="95"
            y="70"
            width="210"
            height="280"
            rx="28"
            fill="none"
            style={{ stroke: cssVar('border-strong', 0.6) }}
            strokeWidth="1.5"
          />
          <rect
            x="111"
            y="86"
            width="178"
            height="248"
            rx="18"
            style={{ fill: cssVar('surface-2') }}
          />
          <rect
            x="111"
            y="86"
            width="178"
            height="248"
            rx="18"
            fill={`url(#${ids.face})`}
            {...litLayer(lit)}
          />
          {/* diffuser lines */}
          <g style={{ stroke: cssVar('bg', 0.08) }} strokeWidth="1">
            {[126, 156, 186, 216, 246, 276, 306].map((y) => (
              <line key={y} x1="125" x2="275" y1={y} y2={y} />
            ))}
          </g>
          {/* control dots */}
          <g>
            {[176, 200, 224].map((cx, i) => (
              <circle
                key={cx}
                cx={cx}
                cy="342"
                r="3.5"
                style={{ fill: lit && i === 2 ? cssVar('sunrise-strong') : cssVar('muted', 0.6) }}
              />
            ))}
          </g>
        </>
      )}
    </LampSvg>
  );
}
