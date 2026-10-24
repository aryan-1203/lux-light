import { sources } from "@/data/science";

/** The sources this page actually cites, in footnote order. The footer lists exactly these. */
export const CITED = ["brown2022", "params", "yale", "lam2016", "pjrek2020", "kogan1998"] as const;
export type CitedId = (typeof CITED)[number];

export const citedSources = CITED.map((id) => {
  const s = sources.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown source: ${id}`);
  return s;
});

export const citeNumber = (id: CitedId) => CITED.indexOf(id) + 1;
