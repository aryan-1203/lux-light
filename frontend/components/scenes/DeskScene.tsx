import { LampBody } from "./LampArt";
import { Arm, Eye, Light } from "./parts";
import { pose, show } from "./pose";

const SKIN = "#8f5a3a";
const SKIN_BACK = "#774829";
const HAIR = "#1d1513";
const SHIRT = "#5e8577";
const SHIRT_BACK = "#4b6d61";
const PANTS = "#3b4252";

const LAMP: [number, number] = [80, 268];

/** 9:30 am, working from home. He's slumped and yawning, switches the lamp on, sits up and gets typing. */
export function DeskScene() {
  return (
    <>
      <defs>
        <linearGradient id="d-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9cfe6" />
          <stop offset="1" stopColor="#efe2c9" />
        </linearGradient>
      </defs>
      {/* Room */}
      <rect width="360" height="440" fill="#e7e0d4" />
      <rect y="440" width="360" height="200" fill="#b98d66" />
      <path d="M0 440 H360" stroke="#a37a55" strokeWidth="3" />
      {/* Window with blinds */}
      <rect x="18" y="84" width="112" height="176" rx="5" fill="#f8f4ee" />
      <rect x="25" y="91" width="98" height="162" rx="2" fill="url(#d-sky)" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <path key={i} d={`M25 ${100 + i * 9} H123`} stroke="#f8f4ee" strokeWidth="2.5" opacity="0.9" />
      ))}
      {/* Shelf, books, a plant */}
      <path d="M220 172 H344" stroke="#a37a55" strokeWidth="5" strokeLinecap="round" />
      <rect x="230" y="130" width="10" height="40" rx="1.5" fill="#c9705b" />
      <rect x="241" y="136" width="9" height="34" rx="1.5" fill="#e0b25c" />
      <rect x="251" y="126" width="11" height="44" rx="1.5" fill="#6f8aa6" />
      <rect x="264" y="140" width="9" height="30" rx="1.5" transform="rotate(14 268 170)" fill="#b9a28a" />
      <path d="M312 170 h22 l-3 -18 h-16 Z" fill="#c58a62" />
      <path d="M323 152 q-12 -16 -4 -30 q6 12 4 30 q2 -18 14 -26 q0 18 -14 26" fill="#6e9a6a" />
      {/* Desk */}
      <rect x="30" y="398" width="300" height="12" rx="3" fill="#c79a6b" />
      <rect x="40" y="410" width="10" height="150" fill="#ad835a" />
      <rect x="310" y="410" width="10" height="150" fill="#ad835a" />
      <rect x="40" y="380" width="16" height="18" rx="3" fill="#e9e3da" />
      <path d="M56 385 q7 2 0 9" stroke="#e9e3da" strokeWidth="3" fill="none" />
      {/* Chair */}
      <rect x="316" y="348" width="13" height="100" rx="6" fill="#3d4250" />
      <rect x="250" y="436" width="76" height="13" rx="5" fill="#454b5b" />
      <rect x="284" y="449" width="7" height="72" fill="#5b6070" />
      <path d="M252 526 H326" stroke="#5b6070" strokeWidth="6" strokeLinecap="round" />
      <circle cx="254" cy="533" r="5" fill="#3d4250" />
      <circle cx="324" cy="533" r="5" fill="#3d4250" />

      <g transform={`translate(${LAMP[0]} ${LAMP[1]})`}>
        <LampBody />
      </g>

      {/* His legs, under the desk */}
      <path d="M286 437 L238 441" stroke={PANTS} strokeWidth="30" strokeLinecap="round" />
      <path d="M238 441 L240 518" stroke={PANTS} strokeWidth="22" strokeLinecap="round" />
      <path d="M240 526 L222 528" stroke="#2b2b31" strokeWidth="12" strokeLinecap="round" />

      <g {...pose({ r: [14, -28, -2, -6, -6], y: [0, 0, -2, 0, 0], at: "285px 436px" })}>
        <Arm
          sx={291}
          sy={362}
          upper={[5, 20, 42, 42, 42]}
          fore={[35, 30, 48, 48, 48]}
          sleeve={SHIRT_BACK}
          skin={SKIN_BACK}
          typing={1}
        />
        <path d="M265 370 Q265 354 280 352 L293 352 Q306 356 305 372 L307 436 Q286 445 265 436 Z" fill={SHIRT} />
        <rect x="277" y="334" width="10" height="22" rx="4" fill={SKIN} />
        <path d="M273 352 l8 10 l8 -10" stroke="#4b6d61" strokeWidth="2" fill="none" />
        <g {...pose({ r: [14, 0, -2, -8, -8], at: "282px 340px" })}>
          <circle cx="277" cy="321" r="19.5" fill={SKIN} />
          <path
            d="M258 328 Q262 342 276 342 Q286 341 292 332 Q282 337 271 336 Q262 334 258 326 Z"
            fill="#2c1d17"
            opacity="0.55"
          />
          <path
            d="M257 318 Q256 299 278 299 Q299 300 298 318 Q297 326 293 331 L291 316 Q277 310 262 317 Z"
            fill={HAIR}
          />
          <path d="M290 320 q5 1 4 7 q-2 4 -5 2" fill={SKIN_BACK} />
          <path d="M258.5 322 q-3.5 3 -0.5 5" stroke={SKIN_BACK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <Eye x={265} y={318} open={[0, 1, 0, 1, 1]} />
          <ellipse {...show(1, 0, 0, 0, 0)} cx="263" cy="333" rx="3" ry="4.5" fill="#4a2018" />
          <path {...show(0, 1, 1, 0, 0)} d="M260 333 h5.5" stroke="#4a2018" strokeWidth="1.6" strokeLinecap="round" />
          <path
            {...show(0, 0, 0, 1, 1)}
            d="M259.5 331.5 q3.5 3.5 7.5 0"
            stroke="#4a2018"
            strokeWidth="1.7"
            fill="none"
            strokeLinecap="round"
          />
        </g>
        <Arm
          sx={284}
          sy={362}
          upper={[10, 156, 40, 40, 40]}
          fore={[40, 0, 50, 50, 50]}
          sleeve={SHIRT}
          skin={SKIN}
          typing={0}
        />
      </g>

      {/* Laptop, in front of his hands */}
      <path d="M170 396 L158 336 L164 334 L176 394 Z" fill="#3a3f47" />
      <rect x="166" y="392" width="78" height="6" rx="2" fill="#a2a8ae" />

      <Light id="d" lamp={LAMP} panel={[LAMP[0] + 53, LAMP[1] + 26]} />
    </>
  );
}
