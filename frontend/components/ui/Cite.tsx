import { citeNumber, type CitedId } from "@/lib/citations";

/** Superscript footnote link to the sources list in the footer. */
export function Cite({ id }: { id: CitedId }) {
  const n = citeNumber(id);
  return (
    <a
      href={`#src-${id}`}
      aria-label={`Source ${n}`}
      className="relative ml-0.5 align-super text-[0.7em] font-medium text-accent-fg no-underline hover-fine:underline"
    >
      [{n}]
    </a>
  );
}
