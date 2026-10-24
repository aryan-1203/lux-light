/**
 * The lamp, drawn flat for the scenes: a tilted landscape panel on a gooseneck, a column with the
 * dial, a square base. Local box is 100 × 132 with the base resting on y = 130, so a scene places it
 * with translate(x, floorY - 130).
 */
const PANEL = "M8 10 Q8 4 14 4 L88 1 Q95 1 95.5 8 L98.5 40 Q98.5 46.5 92 47 L20 50.5 Q13.5 50.5 13 44 Z";
const DIFFUSER =
  "M13.5 11 Q13.5 8 17 8 L85.5 5.5 Q90 5.5 90.5 9.5 L93 38.5 Q93 42.5 89 42.8 L22.5 45.8 Q18.5 45.8 18 42 Z";

export function LampBody() {
  return (
    <g>
      <path
        d="M14 122 L64 114.5 L93 120 L42 128.5 Z"
        fill="#efebe5"
        stroke="#d2ccc2"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M14 122 L42 128.5 L93 120 L93 123 L42 131.5 L14 125 Z" fill="#cdc6bb" />
      <path
        d="M53 81 C53 70 57.5 66 55.5 57 C54.5 53 52.5 51 52.5 48"
        stroke="#76716c"
        strokeWidth="3.2"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="46" y="79" width="15" height="43" rx="3" fill="#f2efea" stroke="#d2ccc2" strokeWidth="1.2" />
      <rect x="44.5" y="77" width="18" height="5" rx="2.5" fill="#e4e0d9" />
      <circle cx="53.5" cy="100" r="3.8" fill="#9a9690" stroke="#77736e" strokeWidth="1" />
      <path d={PANEL} fill="#e9e5de" stroke="#cfc8be" strokeWidth="1.4" strokeLinejoin="round" />
      <path d={DIFFUSER} fill="#d9d5ce" />
    </g>
  );
}

/** The lit diffuser. Drawn above the room's night tint so it reads as the light source. */
export function LampLight() {
  return (
    <g>
      <path d={PANEL} fill="none" stroke="#fff2d0" strokeWidth="3" strokeLinejoin="round" opacity="0.7" />
      <path d={DIFFUSER} fill="#fffbf1" />
      <path d={DIFFUSER} fill="url(#lampSheen)" />
    </g>
  );
}

/** Gradients the lamp and its light use. One copy per scene SVG, ids prefixed per scene. */
export function LampDefs({ id }: { id: string }) {
  return (
    <>
      <radialGradient id={`${id}-glow`}>
        <stop offset="0" stopColor="#fff4d6" stopOpacity="0.95" />
        <stop offset="0.25" stopColor="#ffe2a6" stopOpacity="0.55" />
        <stop offset="0.6" stopColor="#ffc87a" stopOpacity="0.18" />
        <stop offset="1" stopColor="#ffc87a" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="lampSheen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="1" stopColor="#ffe9b8" stopOpacity="0.5" />
      </linearGradient>
    </>
  );
}
