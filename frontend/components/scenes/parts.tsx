import type { CSSProperties, ReactNode } from "react";
import { pose } from "./pose";
import { LampDefs, LampLight } from "./LampArt";

type Beats = [number, number, number, number, number];

/**
 * An arm hanging straight down from the shoulder (sx, sy): upper arm 40, forearm 38, hand at sy + 82.
 * `upper` is the shoulder angle per beat, `fore` the elbow bend on top of it. Children sit at the hand.
 */
export function Arm({
  sx,
  sy,
  upper,
  fore,
  sleeve,
  skin,
  hand,
  typing,
}: {
  sx: number;
  sy: number;
  upper: Beats;
  fore: Beats;
  sleeve: string;
  skin: string;
  hand?: ReactNode;
  /** Tap at a keyboard once the scene reaches its action beat; the value staggers two hands. */
  typing?: number;
}) {
  return (
    <g {...pose({ r: upper, at: `${sx}px ${sy}px` })}>
      <line x1={sx} y1={sy} x2={sx} y2={sy + 40} stroke={sleeve} strokeWidth="13" strokeLinecap="round" />
      <g {...pose({ r: fore, at: `${sx}px ${sy + 40}px` })}>
        <g className={typing === undefined ? undefined : "s-type"} style={{ "--i": typing } as CSSProperties}>
          <line x1={sx} y1={sy + 40} x2={sx} y2={sy + 77} stroke={skin} strokeWidth="9.5" strokeLinecap="round" />
          <circle cx={sx} cy={sy + 82} r="6.5" fill={skin} />
          {hand}
        </g>
      </g>
    </g>
  );
}

/** Closed eye (a lid line) and open eye (a dot), swapped per beat. `open` is 1 where the eye is open. */
export function Eye({ x, y, open }: { x: number; y: number; open: Beats }) {
  const shut = open.map((v) => 1 - v) as Beats;
  return (
    <>
      <path
        {...pose({ o: shut })}
        d={`M${x - 4} ${y} q4 3 8 0`}
        stroke="#2a1a14"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <circle {...pose({ o: open })} cx={x} cy={y} r="2.1" fill="#2a1a14" />
    </>
  );
}

/** Night tint over the room, the lit panel above it and the light it throws. */
export function Light({ id, lamp, panel }: { id: string; lamp: [number, number]; panel: [number, number] }) {
  return (
    <>
      <defs>
        <LampDefs id={id} />
      </defs>
      <rect className="s-dim" width="360" height="640" fill="#10142f" />
      <g className="s-on" transform={`translate(${lamp[0]} ${lamp[1]})`}>
        <LampLight />
      </g>
      <g className="s-glow" style={{ mixBlendMode: "screen" }}>
        <circle cx={panel[0]} cy={panel[1]} r="330" fill={`url(#${id}-glow)`} />
        {[0, 1, 2, 3, 4].map((i) => (
          <circle
            key={i}
            className="s-mote"
            style={{ "--i": i } as CSSProperties}
            cx={panel[0] + 50 + i * 26}
            cy={panel[1] + 30 + ((i * 37) % 70)}
            r={i % 2 ? 1.2 : 1.6}
            fill="#fff3d0"
            opacity="0.8"
          />
        ))}
      </g>
    </>
  );
}
