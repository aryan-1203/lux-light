/**
 * Product figures. Every value marked `verify: true` is a PLACEHOLDER until final product testing
 * and must be checked before launch. The flag is an internal checklist; nothing is shown on the site.
 */

export type Figure<T> = { value: T; verify: boolean; note?: string };

export const lux = {
  /** Peak illuminance at the stated distance. */
  peak: { value: 10000, verify: true } as Figure<number>,
  /** Distance at which the peak figure is measured. */
  measuredAtCm: { value: 30, verify: true, note: "Confirm with the lab report." } as Figure<number>,
  /** Rough reference figures used in the hero story and the lux ladder. */
  indoorTypical: {
    value: 300,
    verify: true,
    note: "Typical home/office lighting; ranges ~100–500 lux.",
  } as Figure<number>,
  earlyMorningOutdoor: { value: 5000, verify: true } as Figure<number>,
};

export const usage = {
  distanceIn: { value: [8, 24] as [number, number], verify: false },
  distanceCm: { value: [20, 60] as [number, number], verify: false },
  sessionMin: { value: [20, 30] as [number, number], verify: false },
};

/** Rough illuminance references for the lux ladder. All need verifying against a published source. */
export const luxLadder: { id: string; label: string; lux: number; display: string; verify: boolean; lamp?: boolean }[] =
  [
    { id: "evening", label: "Living room, evening", lux: 80, display: "50–150", verify: true },
    { id: "office", label: "Typical office desk", lux: 400, display: "300–500", verify: true },
    { id: "overcast", label: "Overcast monsoon sky", lux: 3000, display: "1,000–5,000", verify: true },
    {
      id: "lamp",
      label: "This lamp, at the recommended distance",
      lux: 10000,
      display: "10,000",
      verify: true,
      lamp: true,
    },
    { id: "sun", label: "Clear midday sun", lux: 100000, display: "50,000–1,00,000", verify: true },
  ];

export const colourModes = [
  { id: "warm", label: "Warm", kelvin: 2700, note: "Soft and golden. Easy on the eyes earlier in the day." },
  { id: "neutral", label: "Neutral", kelvin: 4000, note: "Clean daylight white for a desk." },
  { id: "cool", label: "Cool", kelvin: 6500, note: "Crisp, bright morning light." },
] as const;

export type SpecRow = { label: string; value: string; verify: boolean };

/** /the-lamp specification table. PLACEHOLDERS until final hardware. */
export const specRows: { group: string; rows: SpecRow[] }[] = [
  {
    group: "Light",
    rows: [
      { label: "Illuminance", value: "10,000 lux at 30 cm", verify: true },
      { label: "UV output", value: "UV-free LEDs (filtered diffuser)", verify: true },
      { label: "Colour temperature", value: "Warm 2700K · Neutral 4000K · Cool 6500K", verify: true },
      { label: "Brightness", value: "5 levels", verify: true },
      { label: "Flicker", value: "Flicker-free driver", verify: true },
      { label: "Colour rendering", value: "CRI ≥ 90", verify: true },
    ],
  },
  {
    group: "Design",
    rows: [
      { label: "Panel", value: "Portrait, 3:4, frosted diffuser", verify: false },
      { label: "Size", value: "≈ 30 × 22 × 1.8 cm", verify: true },
      { label: "Weight", value: "≈ 650 g", verify: true },
      { label: "Stand", value: "Slim fold-out kickstand, two angles", verify: true },
      { label: "Finish", value: "Warm white", verify: false },
    ],
  },
  {
    group: "Power & controls",
    rows: [
      { label: "Power", value: "USB-C, 5V ⎓ 3A adapter included", verify: true },
      { label: "Timer", value: "15 / 30 / 45 / 60 min auto-off", verify: true },
      { label: "Controls", value: "Touch buttons: power, mode, brightness, timer", verify: true },
      { label: "Memory", value: "Remembers your last mode and level", verify: true },
    ],
  },
  {
    group: "Care",
    rows: [
      { label: "Warranty", value: "1 year (placeholder)", verify: true },
      { label: "Certifications", value: "BIS registration in progress (placeholder)", verify: true },
    ],
  },
];

export const inTheBox = [
  "The lamp",
  "Fold-out stand (attached)",
  "USB-C cable, 1.5 m",
  "USB-C power adapter",
  "Quick-start card",
];

export type CompareCell = { value: string; good?: boolean };
/** Lamp vs an ordinary desk lamp vs outdoor light. */
export const comparison: { feature: string; lamp: CompareCell; desk: CompareCell; outdoor: CompareCell }[] = [
  {
    feature: "Brightness where you sit",
    lamp: { value: "10,000 lux at 30 cm", good: true },
    desk: { value: "≈ 300–1,000 lux" },
    outdoor: { value: "1,000–1,00,000 lux", good: true },
  },
  {
    feature: "UV exposure",
    lamp: { value: "UV-free", good: true },
    desk: { value: "Negligible", good: true },
    outdoor: { value: "Yes, varies by hour" },
  },
  {
    feature: "Available before sunrise or on foggy days",
    lamp: { value: "Any time", good: true },
    desk: { value: "Any time", good: true },
    outdoor: { value: "Weather and season permitting" },
  },
  {
    feature: "Designed for a 20–30 minute morning session",
    lamp: { value: "Yes, with timer", good: true },
    desk: { value: "No" },
    outdoor: { value: "If you can get outside" },
  },
  {
    feature: "Colour temperature options",
    lamp: { value: "Warm · Neutral · Cool", good: true },
    desk: { value: "Usually one" },
    outdoor: { value: "Changes through the day" },
  },
  {
    feature: "Fits on a desk",
    lamp: { value: "Slim, portable", good: true },
    desk: { value: "Yes", good: true },
    outdoor: { value: "—" },
  },
];
