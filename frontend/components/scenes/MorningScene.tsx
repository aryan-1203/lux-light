import { LampBody } from "./LampArt";
import { Arm, Eye, Light } from "./parts";
import { pose, show } from "./pose";

const SKIN = "#9c6340";
const SKIN_BACK = "#83512f";
const HAIR = "#23171a";
const TOP = "#d47b62";
const TOP_BACK = "#b8644e";
const PJ = "#56607e";

const LAMP: [number, number] = [20, 270];

/** 6:45 am, a dark bedroom. She sits up rubbing her eyes, switches the lamp on, breathes, stretches. */
export function MorningScene() {
  return (
    <>
      <defs>
        <linearGradient id="m-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8ea2d2" />
          <stop offset="0.6" stopColor="#f3c3a4" />
          <stop offset="1" stopColor="#ffd8a0" />
        </linearGradient>
      </defs>
      {/* Room */}
      <rect width="360" height="470" fill="#f0dcc6" />
      <rect y="470" width="360" height="170" fill="#c99f7a" />
      <path d="M0 470 H360" stroke="#b48a66" strokeWidth="3" />
      <ellipse cx="170" cy="572" rx="150" ry="26" fill="#e3c6a5" />
      {/* Window with the dawn outside */}
      <rect x="208" y="84" width="128" height="190" rx="6" fill="#fbf4ea" />
      <rect x="216" y="92" width="112" height="174" rx="3" fill="url(#m-sky)" />
      <circle cx="292" cy="268" r="20" fill="#ffe6b5" />
      <rect x="216" y="252" width="112" height="16" fill="#e9c08f" opacity="0.5" />
      <path d="M272 92 V266 M216 178 H328" stroke="#fbf4ea" strokeWidth="5" />
      <path d="M196 70 H352" stroke="#a37c5a" strokeWidth="4" strokeLinecap="round" />
      <path d="M200 72 Q214 160 204 300 L226 300 Q222 170 226 72 Z" fill="#e2c39b" />
      <path d="M318 72 Q322 170 318 300 L342 300 Q350 160 344 72 Z" fill="#e2c39b" />
      {/* Bed */}
      <rect x="342" y="300" width="22" height="182" rx="7" fill="#a5754e" />
      <rect x="150" y="446" width="200" height="34" rx="4" fill="#a5754e" />
      <rect x="156" y="478" width="10" height="14" fill="#8a603e" />
      <rect x="146" y="398" width="204" height="52" rx="12" fill="#f7f0e7" />
      <ellipse cx="318" cy="388" rx="30" ry="12" fill="#fffaf3" />
      <path d="M214 396 Q262 386 350 398 L350 452 L222 452 Q210 430 214 396 Z" fill="#88a1bf" />
      <path d="M236 404 Q270 414 300 404" stroke="#7690b0" strokeWidth="2" fill="none" />
      {/* Bedside table */}
      <rect x="18" y="398" width="110" height="10" rx="3" fill="#b8865c" />
      <rect x="24" y="408" width="98" height="58" rx="3" fill="#c9976a" />
      <path d="M30 436 H116" stroke="#b07f55" strokeWidth="2" />
      <circle cx="73" cy="422" r="2.5" fill="#8a603e" />
      <rect x="28" y="466" width="8" height="8" fill="#a5754e" />
      <rect x="110" y="466" width="8" height="8" fill="#a5754e" />

      <g transform={`translate(${LAMP[0]} ${LAMP[1]})`}>
        <LampBody />
      </g>

      {/* Her legs */}
      <path d="M194 405 L152 410" stroke={PJ} strokeWidth="30" strokeLinecap="round" />
      <path d="M152 410 L148 474" stroke={PJ} strokeWidth="22" strokeLinecap="round" />
      <path d="M146 482 L130 484" stroke={SKIN} strokeWidth="10" strokeLinecap="round" />

      {/* Upper body leans from the hip */}
      <g {...pose({ r: [-12, -25, 0, 4, 0], y: [0, 0, -2, 0, 0], at: "192px 404px" })}>
        <Arm
          sx={194}
          sy={330}
          upper={[60, 30, 0, 160, 0]}
          fore={[135, 20, 40, 12, 40]}
          sleeve={TOP_BACK}
          skin={SKIN_BACK}
        />
        <path d="M203 302 Q210 318 206 332 L196 336 Z" fill={HAIR} />
        <path d="M172 334 Q170 318 184 316 L200 318 Q212 322 211 338 L213 404 Q192 413 171 404 Z" fill={TOP} />
        <rect x="179" y="298" width="10" height="22" rx="4" fill={SKIN} />
        <g {...pose({ r: [-14, -4, 6, 10, 0], at: "185px 308px" })}>
          <path d="M170 278 Q176 262 192 266 Q206 272 205 292 L208 326 Q198 334 191 324 L193 300 Z" fill={HAIR} />
          <circle cx="180" cy="288" r="19" fill={SKIN} />
          <path d="M162 290 Q160 268 182 266 Q198 266 202 282 Q188 274 174 279 Q166 283 163 292 Z" fill={HAIR} />
          <path d="M161.5 290 q-3.5 3 -0.5 5" stroke={SKIN_BACK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <Eye x={168} y={286} open={[0, 1, 0, 0, 1]} />
          <path {...show(1, 1, 1, 0, 0)} d="M164 300 h5" stroke="#5a2b1f" strokeWidth="1.6" strokeLinecap="round" />
          <path
            {...show(0, 0, 0, 1, 1)}
            d="M163 298.5 q3.5 3.5 7.5 0"
            stroke="#5a2b1f"
            strokeWidth="1.7"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="173" cy="295" r="3" fill="#d9776a" opacity="0.35" />
        </g>
        <Arm sx={186} sy={328} upper={[70, 88, 0, 168, 0]} fore={[127, 2, 43, 8, 43]} sleeve={TOP} skin={SKIN} />
      </g>

      <Light id="m" lamp={LAMP} panel={[LAMP[0] + 53, LAMP[1] + 26]} />
    </>
  );
}
