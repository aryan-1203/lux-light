/**
 * Research data for the "science" section of the site.
 *
 * Every figure here comes from the source named by its `sourceId` (see `sources` below).
 * These describe published research on bright light therapy in general. None of it is
 * a claim about our lamp. Under ASCI guidance and the Drugs & Magic Remedies Act, copy
 * built on this file must not say the product treats, cures, prevents or diagnoses anything.
 * Attribute findings to the study and point people to a doctor.
 *
 * Checked October 2026. Where a full text could not be opened, figures were taken from the
 * PubMed abstract (see notes on each block).
 */

export type Source = {
  id: string;
  short: string;
  title: string;
  authors?: string;
  publisher: string;
  year: number;
  url: string;
};

export const sources: Source[] = [
  {
    id: "lam2016",
    short: "Lam et al., 2016",
    title:
      "Efficacy of Bright Light Treatment, Fluoxetine, and the Combination in Patients With Nonseasonal Major Depressive Disorder: A Randomized Clinical Trial",
    authors:
      "Lam RW, Levitt AJ, Levitan RD, Michalak EE, Cheung AH, Morehouse R, Ramasubbu R, Yatham LN, Tam EM",
    publisher: "JAMA Psychiatry 73(1):56-63",
    year: 2016,
    url: "https://pubmed.ncbi.nlm.nih.gov/26580307/",
  },
  {
    id: "pjrek2020",
    short: "Pjrek et al., 2020",
    title:
      "The Efficacy of Light Therapy in the Treatment of Seasonal Affective Disorder: A Meta-Analysis of Randomized Controlled Trials",
    authors:
      "Pjrek E, Friedrich ME, Cambioli L, Dold M, Jäger F, Komorowski A, Lanzenberger R, Kasper S, Winkler D",
    publisher: "Psychotherapy and Psychosomatics 89(1):17-24",
    year: 2020,
    url: "https://pubmed.ncbi.nlm.nih.gov/31574513/",
  },
  {
    id: "brown2022",
    short: "Brown et al., 2022",
    title:
      "Recommendations for daytime, evening, and nighttime indoor light exposure to best support physiology, sleep, and wakefulness in healthy adults",
    authors:
      "Brown TM, Brainard GC, Cajochen C, Czeisler CA, Hanifin JP, Lockley SW, Lucas RJ, Münch M, O'Hagan JB, Peirson SN, Price LLA, Roenneberg T, Schlangen LJM, Skene DJ, Spitschan M, Vetter C, Zee PC, Wright KP Jr",
    publisher: "PLoS Biology 20(3):e3001571",
    year: 2022,
    url: "https://pubmed.ncbi.nlm.nih.gov/35298459/",
  },
  {
    id: "kogan1998",
    short: "Kogan & Guilford, 1998",
    title: "Side Effects of Short-Term 10,000-Lux Light Therapy",
    authors: "Kogan AO, Guilford PM",
    publisher: "American Journal of Psychiatry 155(2):293-294",
    year: 1998,
    url: "https://pubmed.ncbi.nlm.nih.gov/9464216/",
  },
  {
    id: "yale",
    short: "Yale Winter Depression Research Clinic",
    title: "How Should I Get Treatment for SAD?",
    authors: "Winter Depression Research Clinic (director Paul Desan, MD, PhD)",
    publisher: "Yale School of Medicine, Department of Psychiatry",
    year: 2025, // page footer: "Updated February 4, 2025"
    url: "https://medicine.yale.edu/psychiatry/research/clinics-and-programs/winter-depression/treatment/",
  },
  {
    id: "params",
    short: "Oldham, Oldham & Desan, 2019",
    title:
      "Commercially Available Phototherapy Devices for Treatment of Depression: Physical Characteristics of Emitted Light",
    authors: "Oldham MA, Oldham MB, Desan PH",
    publisher: "Psychiatric Research and Clinical Practice 1(2):49-57",
    year: 2019,
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9175704/",
  },
  {
    id: "fpnotebook",
    short: "FPnotebook",
    title: "Light Therapy",
    publisher: "Family Practice Notebook (fpnotebook.com)",
    year: 2025, // page is undated; it cites a 2025 study, so this is the earliest year it can reflect
    url: "https://fpnotebook.com/Psych/Depress/LghtThrpy.htm",
  },
  {
    id: "edmonds",
    short: "UBC Mood Disorders Centre SAD FAQ (via Edmonds College)",
    title: "Frequently Asked Questions about Seasonal Affective Disorder (SAD)",
    authors: "UBC Hospital Mood Disorders Centre (Raymond W. Lam)",
    publisher: "Edmonds College Counseling Center (reproduced UBC handout)",
    year: 2002, // PDF creation date; the handout itself is undated
    url: "https://edmonds.edu/student-services/counseling-and-wellness/counseling-center/documents/SADFAQ.pdf",
  },
  {
    id: "npr",
    short: "NPR (via GPB), 2025",
    title:
      "Exposure to bright light can help fend off winter blues. The time to start is now",
    authors: "Allison Aubrey",
    publisher: "NPR, republished by Georgia Public Broadcasting",
    year: 2025,
    url: "https://www.gpb.org/news/2025/09/29/prone-winter-depression-starting-light-therapy-now-can-help",
  },
];

/* ------------------------------------------------------------------ */
/* Lam et al. 2016: four-arm trial in nonseasonal depression           */
/* Figures from the PubMed abstract. Response and remission are the    */
/* trial's secondary outcomes; percentages are as printed there.       */
/* ------------------------------------------------------------------ */

export type Arm = {
  id: "placebo" | "fluoxetine" | "light" | "combo";
  label: string;
  n: number;
  response: number;
  remission: number;
};

export const lam2016: {
  sourceId: "lam2016";
  participants: number;
  weeks: number;
  protocol: string;
  scale: string;
  arms: Arm[];
  takeaway: string;
  caveat: string;
} = {
  sourceId: "lam2016",
  participants: 122,
  weeks: 8,
  protocol:
    "10,000-lux fluorescent white light box for 30 minutes a day in the early morning. Fluoxetine dose was 20 mg a day. Placebo groups used an inactive negative ion generator and/or a placebo pill.",
  scale:
    "Montgomery-Åsberg Depression Rating Scale (MADRS). Response means a drop of at least 50% in the score; remission means a score of 10 or less at week 8.",
  arms: [
    { id: "placebo", label: "Placebo (inactive device + placebo pill)", n: 30, response: 33.3, remission: 30.0 },
    { id: "fluoxetine", label: "Fluoxetine (inactive device + fluoxetine)", n: 31, response: 29.0, remission: 19.4 },
    { id: "light", label: "Light (light box + placebo pill)", n: 32, response: 50.0, remission: 43.8 },
    { id: "combo", label: "Light + fluoxetine", n: 29, response: 75.9, remission: 58.6 },
  ],
  takeaway:
    "In a 2016 eight-week trial of 122 adults with nonseasonal depression, 30 minutes of 10,000-lux morning light, alone or combined with fluoxetine, did better than placebo, and the combination had the most consistent effect.",
  caveat:
    "This was one trial with about 30 people per group, aged 19 to 60, with at least moderate depression, diagnosed and followed by psychiatrists. Fluoxetine alone did not beat placebo here. The results describe a supervised clinical protocol, not any consumer lamp.",
};

/* ------------------------------------------------------------------ */
/* Pjrek et al. 2020: meta-analysis of randomised trials in SAD        */
/* Figures from the PubMed abstract (the Epistemonikos page blocked    */
/* automated access).                                                  */
/* ------------------------------------------------------------------ */

export const pjrek2020: {
  sourceId: "pjrek2020";
  trials: number;
  participants: number;
  metric: string;
  value: number;
  ciLow: number;
  ciHigh: number;
  takeaway: string;
  caveat: string;
} = {
  sourceId: "pjrek2020",
  trials: 16,
  participants: 559,
  metric: "Risk ratio for treatment response, bright light vs placebo (95% CI)",
  value: 1.42,
  ciLow: 1.08,
  ciHigh: 1.85,
  takeaway:
    "A 2020 meta-analysis of randomised trials in seasonal affective disorder found that people given bright light were about 1.4 times as likely to respond as those given a placebo (16 trials, 559 patients).",
  caveat:
    "The review included 19 trials in all. On depression scores the effect was modest (standardised mean difference -0.37, 95% CI -0.63 to -0.12; 18 trials, 610 patients). The authors reported moderate heterogeneity, a moderate-to-high risk of bias and mostly small-to-medium trials, and called for larger high-quality studies.",
};

/* ------------------------------------------------------------------ */
/* Kogan & Guilford 1998: side effects of 10,000-lux light             */
/* Only the abstract was reachable. It gives the overall rates below   */
/* and says headache and eye or vision problems were the most common,  */
/* but does not give a percentage for each symptom, so none is listed. */
/* ------------------------------------------------------------------ */

export const sideEffects: {
  sourceId: string;
  participants: number;
  items: { label: string; percent: number }[];
  takeaway: string;
} = {
  sourceId: "kogan1998",
  participants: 70,
  items: [
    { label: "Reported at least one side effect", percent: 45.7 },
    { label: "Reported two or more side effects", percent: 12.9 },
  ],
  takeaway:
    "In a 1998 study of 70 people with seasonal depression using 10,000-lux light, 45.7% reported a side effect, most often headache or eye or vision problems, and almost all were mild, passed quickly and did not interrupt treatment.",
};

/* ------------------------------------------------------------------ */
/* Brown et al. 2022: consensus targets for indoor light               */
/* Melanopic EDI is measured at the eye, in the vertical plane, about  */
/* 1.2 m from the floor (seated eye level). Hours are illustrative.    */
/* ------------------------------------------------------------------ */

export type LightWindow = {
  id: "day" | "evening" | "sleep";
  label: string;
  startHour: number;
  endHour: number;
  bound: "min" | "max";
  melanopicEdi: number;
  text: string;
};

export const brown2022: { sourceId: "brown2022"; windows: LightWindow[]; takeaway: string } = {
  sourceId: "brown2022",
  windows: [
    {
      id: "day",
      label: "Daytime",
      startHour: 7,
      endHour: 20,
      bound: "min",
      melanopicEdi: 250,
      text: "At least 250 lux melanopic EDI at the eye through the day, using daylight first where possible.",
    },
    {
      id: "evening",
      label: "Evening",
      startHour: 20,
      endHour: 23,
      bound: "max",
      melanopicEdi: 10,
      text: "No more than 10 lux melanopic EDI, starting at least 3 hours before bedtime, ideally from warmer light with less short-wavelength content.",
    },
    {
      id: "sleep",
      label: "Sleep",
      startHour: 23,
      endHour: 7,
      bound: "max",
      melanopicEdi: 1,
      text: "As dark as possible: no more than 1 lux melanopic EDI. If you need light to move around at night, keep it under 10 lux.",
    },
  ],
  takeaway:
    "A 2022 expert consensus recommended bright days (at least 250 lux melanopic EDI), dim evenings (under 10 lux from 3 hours before bed) and dark nights (under 1 lux); the clock times shown assume waking at 07:00 and sleeping at 23:00 and are only illustrative.",
};

/* ------------------------------------------------------------------ */
/* Intensity x time trade-off                                          */
/* ------------------------------------------------------------------ */

export const doseEquivalence: {
  sourceId: string;
  points: { lux: number; minutes: number }[];
  note: string;
} = {
  sourceId: "yale",
  points: [
    { lux: 10000, minutes: 30 },
    { lux: 5000, minutes: 60 },
    { lux: 2500, minutes: 120 },
  ],
  note:
    "Yale's clinic describes 30 minutes at 10,000 lux as equivalent to 1 hour at 5,000 lux or 2 hours at 2,500 lux. FPnotebook cites the same 2,500-lux/2-hour and 10,000-lux/30-minute protocols, and the UBC handout gives 45-60 minutes at 5,000 lux and 1-2 hours at 2,500 lux. It is a rough clinical rule, not an exact formula.",
};

/* ------------------------------------------------------------------ */
/* Lux ladder (log scale)                                              */
/* `lux` is the plotting position. Where a source gives a range, the   */
/* value sits inside that range and `display` shows the range itself.  */
/* The darkest rung uses the Brown 2022 sleep target (melanopic EDI).  */
/* None of the sources gives a moonlight figure, so moonlight is left  */
/* out.                                                                */
/* ------------------------------------------------------------------ */

export const luxReference: { id: string; label: string; lux: number; display: string; sourceId?: string }[] = [
  { id: "bedroom", label: "Dark bedroom, as recommended for sleep", lux: 1, display: "1 lux or less", sourceId: "brown2022" },
  { id: "evening-home", label: "Typical home in the evening", lux: 30, display: "About 30 lux", sourceId: "brown2022" },
  { id: "home", label: "Typical home interior", lux: 100, display: "50-200 lux", sourceId: "params" },
  { id: "office", label: "Office", lux: 300, display: "200-400 lux", sourceId: "params" },
  { id: "overcast", label: "Overcast day outdoors", lux: 1000, display: "About 1,000 lux", sourceId: "params" },
  { id: "therapy", label: "Light therapy level used in trials", lux: 10000, display: "10,000 lux", sourceId: "lam2016" },
  { id: "clear-day", label: "Clear day outdoors", lux: 20000, display: "10,000-30,000 lux", sourceId: "params" },
  { id: "sunny", label: "Bright sunny day", lux: 50000, display: "50,000 lux or more", sourceId: "edmonds" },
];

/* ------------------------------------------------------------------ */
/* Protocol used in research and clinic guidance                       */
/* ------------------------------------------------------------------ */

export const protocol: {
  lux: number;
  minutes: [number, number];
  distanceCm: [number, number];
  timing: string;
  gaze: string;
  sourceIds: string[];
} = {
  lux: 10000,
  // 30 minutes in Lam 2016 and most guidance; Yale and NPR note some people need 45.
  minutes: [30, 45],
  // Yale: manufacturer-specified distance, "typically 11 to 30 inches" (about 28-76 cm).
  distanceCm: [28, 76],
  timing:
    "Soon after waking, at about the same time every day including weekends. Yale's clinic suggests finishing before 8 a.m. where possible.",
  gaze:
    "You don't look straight at the light. Keep it in your field of view, slightly above eye level and angled down, while you read or eat.",
  sourceIds: ["lam2016", "yale", "params", "npr", "fpnotebook"],
};

/* ------------------------------------------------------------------ */
/* How light reaches the body clock                                    */
/* ------------------------------------------------------------------ */

export const mechanism: { step: string; detail: string; sourceId?: string }[] = [
  {
    step: "Light enters the eye",
    detail: "The effects researchers study come through the eyes, not the skin.",
    sourceId: "edmonds",
  },
  {
    step: "Melanopsin cells respond",
    detail:
      "A small set of retinal cells called ipRGCs contain melanopsin, a pigment most sensitive to blue-green light near 480 nm.",
    sourceId: "brown2022",
  },
  {
    step: "A direct line to the brain",
    detail:
      "These cells send signals straight to the hypothalamus along a nerve pathway known as the retinohypothalamic tract.",
    sourceId: "params",
  },
  {
    step: "The master clock",
    detail:
      "The signal reaches the suprachiasmatic nucleus (SCN), the body's master clock, which keeps daily rhythms in step.",
    sourceId: "params",
  },
  {
    step: "Timing and alertness",
    detail:
      "Through this route, light affects the timing of the body clock, melatonin release, sleep and alertness.",
    sourceId: "brown2022",
  },
];

/* ------------------------------------------------------------------ */
/* Who should check with a doctor first, and general safety notes      */
/* ------------------------------------------------------------------ */

export const cautions: { text: string; sourceId?: string }[] = [
  {
    text: "If you feel low most days, see a doctor first. Some physical conditions, such as thyroid problems, can look like depression.",
    sourceId: "edmonds",
  },
  {
    text: "Bipolar disorder: bright light can, rarely, trigger hypomania or mania, so use it only under the care of a clinician who treats mood disorders.",
    sourceId: "yale",
  },
  {
    text: "Thoughts of suicide or self-harm: talk to a doctor or a crisis line now. Clinical guidance says light therapy should be supervised because of this risk.",
    sourceId: "params",
  },
  {
    text: "Eye conditions: Yale's clinic does not recommend bright light for people with retinal disease such as macular degeneration, or with diabetes, and suggests people over 65 see an eye doctor first.",
    sourceId: "yale",
  },
  {
    text: "Light-sensitising medicines: some antibiotics (such as doxycycline or ciprofloxacin), sulfonamides, antimalarials, some painkillers and some psychiatric drugs. Ask your doctor if you've been told to avoid sunlight.",
    sourceId: "yale",
  },
  {
    text: "Mild effects such as headache, eyestrain, nausea or feeling edgy can happen at first. They usually ease with time, by sitting a little farther away or by shortening sessions.",
    sourceId: "edmonds",
  },
  {
    text: "Using bright light late in the day can make it harder to fall asleep, so keep sessions to the morning.",
    sourceId: "fpnotebook",
  },
  {
    text: "Light-therapy boxes are built to filter out UV. Tanning beds are not a substitute: the effect comes through the eyes, and UV is harmful to them.",
    sourceId: "edmonds",
  },
  {
    text: "You don't stare at the light. It only needs to be in your field of view.",
    sourceId: "yale",
  },
];

/* ------------------------------------------------------------------ */
/* Common myths, checked against the sources                           */
/* ------------------------------------------------------------------ */

export const myths: { myth: string; fact: string; sourceId: string }[] = [
  {
    myth: "You need a full-spectrum lamp.",
    fact: "Yale's clinic says there is no research to support full-spectrum bulbs, and that certain parts of the spectrum matter more than the full spectrum. Trials such as Lam 2016 used white fluorescent light boxes.",
    sourceId: "yale",
  },
  {
    myth: "Bluer light works better.",
    fact: "A 2019 device study found no evidence that short-wavelength (blue) light works better than enough broad-spectrum white light, and noted that strongly blue devices may add needless risk to the retina.",
    sourceId: "params",
  },
  {
    myth: "If the box says 10,000 lux, that's what you get.",
    fact: "Lux is measured where you sit, and it falls as you move away from the lamp. In a test of 24 devices, some sold as 10,000-lux only reached it at unreasonably close range; 7 met the study's criteria.",
    sourceId: "params",
  },
  {
    myth: "Any time of day works just as well.",
    fact: "Clinic guidance is to start soon after waking, every day at about the same time. Yale notes it may not work if you sleep in at weekends.",
    sourceId: "yale",
  },
];
