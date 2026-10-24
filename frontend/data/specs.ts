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

/** Datasheet in the lamp section. PLACEHOLDERS until final hardware (form factor per the 2026-10-24 reference). */
export const specRows: { group: string; rows: SpecRow[] }[] = [
  {
    group: "Light",
    rows: [
      { label: "Illuminance", value: "10,000 lux at 30 cm", verify: true },
      { label: "UV", value: "Filtered by the diffuser", verify: true },
      { label: "Colour", value: "Neutral white, about 4000–5000 K", verify: true },
      { label: "Brightness", value: "Stepless dial", verify: true },
      { label: "Flicker", value: "Flicker-free driver", verify: true },
    ],
  },
  {
    group: "Build",
    rows: [
      { label: "Panel", value: "Landscape, frosted diffuser, ≈ 38 × 29 cm", verify: true },
      { label: "Arm", value: "Brushed-aluminium gooseneck", verify: false },
      { label: "Base", value: "Weighted, ≈ 22 × 20 cm footprint", verify: true },
      { label: "Height", value: "≈ 55–60 cm, adjustable", verify: true },
      { label: "Finish", value: "Gloss white", verify: false },
    ],
  },
  {
    group: "Power & care",
    rows: [
      { label: "Power", value: "Mains adapter included", verify: true },
      { label: "Timer", value: "Auto-off after 30 min", verify: true },
      { label: "Warranty", value: "Confirmed before launch", verify: true },
      { label: "Certification", value: "BIS registration in progress", verify: true },
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
