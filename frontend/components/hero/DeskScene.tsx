"use client";

import { m, useTransform, type MotionValue } from "motion/react";
import { usage } from "@/data/specs";
import { arcDraw, deskReveal } from "./timeline";

/**
 * Settle scene: an abstract desk (surface line, mug, laptop) and a dotted arc showing the
 * 8–24 in sitting distance. Drawn in an SVG whose units are tied to the settled lamp:
 * 100 units = the settled panel width, the lamp's centre sits at (110, 100).
 */
export function DeskScene({ progress }: { progress: MotionValue<number> }) {
  const reveal = useTransform(progress, deskReveal);
  const rise = useTransform(progress, (p) => `translateY(${(1 - deskReveal(p)) * 6}px)`);
  const draw = useTransform(progress, arcDraw);
  const labelAlpha = useTransform(progress, (p) => arcDraw(p) ** 2);
  const [inMin, inMax] = usage.distanceIn.value;
  const [cmMin, cmMax] = usage.distanceCm.value;

  return (
    <svg
      viewBox="0 0 350 200"
      fill="none"
      className="absolute [top:calc(var(--horizon-y)-var(--desk-w)*100/350)] [left:calc(var(--lamp-x)+var(--panel-w)*var(--s5-shift-n)-var(--desk-w)*110/350)] [height:calc(var(--desk-w)*200/350)] [width:var(--desk-w)] overflow-visible [--desk-w:calc(var(--panel-w)*var(--s5-scale)*3.5)]"
    >
      <defs>
        <linearGradient id="desk-fade" x1="0" x2="1">
          <stop offset="0" stopColor="#1c1b19" stopOpacity="0" />
          <stop offset="0.12" stopColor="#1c1b19" stopOpacity="0.22" />
          <stop offset="0.88" stopColor="#1c1b19" stopOpacity="0.22" />
          <stop offset="1" stopColor="#1c1b19" stopOpacity="0" />
        </linearGradient>
        <mask id="arc-draw" maskUnits="userSpaceOnUse">
          <m.path d="M152 92 Q 238 30 324 92" stroke="#fff" strokeWidth="6" style={{ pathLength: draw }} />
        </mask>
      </defs>

      {/* Desk surface: the horizon, come back as a tabletop */}
      <m.path d="M-20 167 H 370" stroke="url(#desk-fade)" strokeWidth="1.2" style={{ pathLength: reveal }} />

      <m.g style={{ opacity: reveal, transform: rise }}>
        {/* Mug (hidden on small screens) */}
        <g className="max-md:hidden">
          <path
            d="M20 139 h26 v20 a8 8 0 0 1 -8 8 h-10 a8 8 0 0 1 -8 -8 z"
            fill="#f4eee4"
            stroke="#1c1b19"
            strokeOpacity="0.35"
            strokeWidth="1.2"
          />
          <path d="M20 145 h-4 a5 5 0 0 0 0 10 h4" stroke="#1c1b19" strokeOpacity="0.35" strokeWidth="1.2" />
        </g>
        {/* Laptop, side view */}
        <path d="M200 165.5 H 318" stroke="#1c1b19" strokeOpacity="0.4" strokeWidth="3" strokeLinecap="round" />
        <path d="M205 164 L 189 94" stroke="#1c1b19" strokeOpacity="0.4" strokeWidth="3" strokeLinecap="round" />
        {/* Where you sit */}
        <circle cx="336" cy="96" r="4" fill="#e8962e" />
      </m.g>

      {/* Distance arc: dotted, drawn in through a mask */}
      <path
        d="M152 92 Q 238 30 324 92"
        stroke="#9a5f12"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="0.1 6"
        mask="url(#arc-draw)"
      />
      <m.g style={{ opacity: labelAlpha }}>
        <text x="238" y="47" textAnchor="middle" className="fill-ink font-mono text-[11px] tracking-[0.06em]">
          {`${inMin}–${inMax} in`}
        </text>
        <text x="238" y="20" textAnchor="middle" className="fill-ink-muted font-mono text-[9px] tracking-[0.06em]">
          {`${cmMin}–${cmMax} cm`}
        </text>
      </m.g>
    </svg>
  );
}
