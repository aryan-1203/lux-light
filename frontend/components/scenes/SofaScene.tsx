import type { CSSProperties } from "react";
import { LampBody } from "./LampArt";
import { Arm, Eye, Light } from "./parts";
import { pose, show } from "./pose";

const SKIN = "#a06a47";
const SKIN_BACK = "#86553a";
const HAIR = "#2a1d1c";
const KURTA = "#e2aa45";
const KURTA_BACK = "#c99230";
const PANTS = "#6d5170";

const LAMP: [number, number] = [15, 265];

function Cup({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          className="s-steam"
          style={{ "--i": i } as CSSProperties}
          d={`M${x - 3 + i * 3} ${y - 14} q-3 -5 0 -10 q3 -5 0 -10`}
          stroke="#ffffff"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
      ))}
      <path d={`M${x - 6} ${y - 6} h12 l-1.5 12 h-9 Z`} fill="#f6efe6" />
      <path d={`M${x - 6} ${y - 6} h12`} stroke="#b4673d" strokeWidth="3" />
      <path d={`M${x + 5.5} ${y - 3} q5 1 3 6 q-1 2 -4 2`} stroke="#f6efe6" strokeWidth="2" fill="none" />
    </g>
  );
}

/** Sunday morning, living room. Drained on the sofa, she switches the lamp on, breathes, picks up her chai. */
export function SofaScene() {
  return (
    <>
      <defs>
        <linearGradient id="s-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c6d4e8" />
          <stop offset="1" stopColor="#f6dfc0" />
        </linearGradient>
      </defs>
      {/* Room */}
      <rect width="360" height="450" fill="#ead6c6" />
      <rect y="450" width="360" height="190" fill="#b88a63" />
      <path d="M0 450 H360" stroke="#a37a55" strokeWidth="3" />
      <ellipse cx="200" cy="560" rx="160" ry="28" fill="#c98f6f" opacity="0.55" />
      {/* Window, a framed print */}
      <rect x="26" y="70" width="100" height="150" rx="5" fill="#f8f2ea" />
      <rect x="33" y="77" width="86" height="136" rx="2" fill="url(#s-sky)" />
      <path d="M76 77 V213" stroke="#f8f2ea" strokeWidth="4" />
      <rect x="214" y="160" width="96" height="76" rx="3" fill="#f7efe4" stroke="#b08a66" strokeWidth="4" />
      <circle cx="244" cy="196" r="14" fill="#e9a25a" opacity="0.8" />
      <path d="M222 228 q30 -30 50 -8 q16 -14 32 4 V228 Z" fill="#7d9b86" opacity="0.8" />
      {/* Floor plant */}
      <path d="M326 452 h28 l-4 -34 h-20 Z" fill="#c58a62" />
      <path d="M340 418 q-20 -30 -8 -70 q12 30 8 70 q4 -40 22 -60 q2 40 -22 60" fill="#6e9a6a" />
      {/* Sofa */}
      <rect x="286" y="300" width="64" height="142" rx="20" fill="#68869a" />
      <rect x="160" y="400" width="172" height="40" rx="12" fill="#7a98ab" />
      <rect x="164" y="436" width="182" height="32" rx="6" fill="#5d798c" />
      <rect x="172" y="468" width="9" height="12" fill="#4b4038" />
      <rect x="330" y="468" width="9" height="12" fill="#4b4038" />
      <rect x="290" y="340" width="26" height="62" rx="10" transform="rotate(-10 303 371)" fill="#e7c9a0" />
      {/* Side table */}
      <rect x="18" y="395" width="102" height="8" rx="4" fill="#8c6a4f" />
      <rect x="64" y="403" width="10" height="58" fill="#7a5b43" />
      <ellipse cx="69" cy="463" rx="24" ry="5" fill="#7a5b43" />

      <g transform={`translate(${LAMP[0]} ${LAMP[1]})`}>
        <LampBody />
      </g>
      <g {...show(1, 1, 1, 1, 0)}>
        <Cup x={110} y={389} />
      </g>

      {/* Her legs */}
      <path d="M234 405 L186 409" stroke={PANTS} strokeWidth="30" strokeLinecap="round" />
      <path d="M186 409 L182 470" stroke={PANTS} strokeWidth="22" strokeLinecap="round" />
      <path d="M181 478 L165 480" stroke="#7b4a3a" strokeWidth="10" strokeLinecap="round" />

      <g {...pose({ r: [18, -30, 6, -34, 6], y: [0, 0, -2, 0, 0], at: "232px 404px" })}>
        <Arm
          sx={236}
          sy={336}
          upper={[0, 20, -5, 20, 15]}
          fore={[20, 30, 45, 40, 135]}
          sleeve={KURTA_BACK}
          skin={SKIN_BACK}
        />
        <path d="M210 342 Q209 324 224 322 L238 322 Q252 326 251 344 L256 412 Q232 421 207 412 Z" fill={KURTA} />
        <path d="M222 322 q7 9 14 0" stroke="#c99230" strokeWidth="2" fill="none" />
        <rect x="221" y="303" width="10" height="22" rx="4" fill={SKIN} />
        <g {...pose({ r: [10, -4, 4, -6, 0], at: "226px 310px" })}>
          <circle cx="243" cy="296" r="10" fill={HAIR} />
          <circle cx="222" cy="290" r="19" fill={SKIN} />
          <path
            d="M204 290 Q202 270 224 268 Q244 268 244 290 Q244 300 240 304 L238 290 Q226 276 210 282 Q206 286 205 293 Z"
            fill={HAIR}
          />
          <path d="M226 270 Q234 271 238 278" stroke="#9a9090" strokeWidth="1.4" fill="none" opacity="0.8" />
          <circle cx="211" cy="279" r="1.6" fill="#b2302a" />
          <path d="M203.5 292 q-3.5 3 -0.5 5" stroke={SKIN_BACK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <Eye x={210} y={288} open={[0, 1, 0, 1, 1]} />
          <path
            {...show(1, 0, 0, 0, 0)}
            d="M206 302.5 q3 -2 6 0"
            stroke="#5a2b1f"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
          <path {...show(0, 1, 1, 1, 0)} d="M206 301 h5.5" stroke="#5a2b1f" strokeWidth="1.6" strokeLinecap="round" />
          <path
            {...show(0, 0, 0, 0, 1)}
            d="M205.5 299.5 q3.5 3.5 7.5 0"
            stroke="#5a2b1f"
            strokeWidth="1.7"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="215" cy="297" r="3" fill="#d9776a" opacity="0.3" />
        </g>
        <Arm
          sx={228}
          sy={334}
          upper={[5, 141, 0, 97, 10]}
          fore={[25, 0, 45, 0, 140]}
          sleeve={KURTA}
          skin={SKIN}
          hand={
            <g {...show(0, 0, 0, 0, 1)}>
              <g transform="rotate(-156 228 416)">
                <Cup x={228} y={412} />
              </g>
            </g>
          }
        />
      </g>

      <Light id="s" lamp={LAMP} panel={[LAMP[0] + 53, LAMP[1] + 26]} />
    </>
  );
}
