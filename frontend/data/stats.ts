/**
 * Figures for the Home "problem" section and the /why-india page.
 * Every stat is UNVERIFIED (verify: true) until a human checks it against the source named in sourceHint.
 * Keep claims modest and hedged; prefer ranges and "roughly".
 */

export type Stat = {
  id: string;
  value: string;
  unit?: string;
  label: string;
  context: string;
  verify: true;
  sourceHint: string;
};

export const problemStats: Stat[] = [
  {
    id: "time-indoors",
    value: "~90",
    unit: "%",
    label: "Roughly how much of the day many city dwellers spend indoors.",
    context:
      "Surveys of urban adults often find most waking hours are spent inside homes, offices and vehicles. Figures vary by city, season and type of work.",
    verify: true,
    sourceHint:
      "Time-use surveys (e.g. National Statistical Office Time Use Survey) and indoor-environment studies cited by environmental health agencies",
  },
  {
    id: "indoor-vs-daylight",
    value: "300",
    unit: "lux",
    label: "Roughly what a typical office or home desk receives.",
    context:
      "Indoor lighting is often in the range of 100–500 lux, while even an overcast sky outdoors can reach several thousand. Our eyes adjust so well that we rarely notice the gap.",
    verify: true,
    sourceHint:
      "Bureau of Indian Standards interior illumination code and Illuminating Engineering Society recommended light levels",
  },
  {
    id: "winter-daylight-north",
    value: "~10–11",
    unit: "hours",
    label: "Roughly the length of a midwinter day in Delhi, often greyed by fog.",
    context:
      "North-Indian winters bring shorter days, and dense fog can hang over many mornings in December and January. On those days, little direct sunlight gets through until late morning.",
    verify: true,
    sourceHint:
      "Sunrise and sunset tables (e.g. Positional Astronomy Centre, IMD) and India Meteorological Department fog bulletins",
  },
];

export const indiaStats: Stat[] = [
  {
    id: "office-hours",
    value: "9+",
    unit: "hours",
    label: "A common length for an office day once commutes are added.",
    context:
      "Many salaried workers spend a long working day indoors, with metro or road commutes that start or end in the dark during winter.",
    verify: true,
    sourceHint:
      "Periodic Labour Force Survey (Ministry of Statistics and Programme Implementation) and urban commute surveys",
  },
  {
    id: "it-bpm-workforce",
    value: "5M+",
    unit: "people",
    label: "Roughly the size of India's IT and business-services workforce.",
    context:
      "A large share of this workforce supports clients in other time zones, which often means late evenings or night shifts.",
    verify: true,
    sourceHint: "NASSCOM industry reports on IT-BPM workforce size",
  },
  {
    id: "night-shift-workers",
    value: "Millions",
    label: "People in India who regularly work outside daytime hours.",
    context:
      "Night and rotating shifts are common across healthcare, IT services, BPO, logistics, security and manufacturing.",
    verify: true,
    sourceHint: "Periodic Labour Force Survey and occupational health studies on shift work in India",
  },
  {
    id: "monsoon-months",
    value: "~4",
    unit: "months",
    label: "The typical span of the south-west monsoon across much of India.",
    context:
      "From roughly June to September, many regions see long runs of heavy, overcast skies, with less direct sunlight than the dry months.",
    verify: true,
    sourceHint: "India Meteorological Department monsoon reports and climatology",
  },
  {
    id: "fog-days-north",
    value: "Weeks",
    label: "Dense fog can return across the Indo-Gangetic plains for weeks each winter.",
    context:
      "The number of foggy days varies a lot from year to year and city to city. Some winters see long unbroken runs of fog in December and January.",
    verify: true,
    sourceHint: "India Meteorological Department fog bulletins and winter season reports",
  },
  {
    id: "wfh-hybrid",
    value: "1 in 4",
    label: "Roughly how many office workers in large cities work from home at least part of the week.",
    context:
      "Hybrid and remote work became far more common after 2020, and home workspaces are often lit for comfort rather than brightness.",
    verify: true,
    sourceHint: "Industry surveys on hybrid work in India (e.g. staffing-firm and NASSCOM workplace reports)",
  },
];
