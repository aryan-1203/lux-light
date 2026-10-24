import { legal } from "#site/content";

export function getLegal(slug: "privacy" | "terms") {
  const doc = legal.find((d) => d.slug === slug);
  if (!doc) throw new Error(`Missing legal page: ${slug}`);
  return doc;
}
