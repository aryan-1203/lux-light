import { getLegal } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { MDXContent } from "./MDXContent";

export function LegalPage({ slug }: { slug: "privacy" | "terms" }) {
  const doc = getLegal(slug);
  return (
    <article className="container-x pt-[clamp(40px,7vw,96px)] pb-[var(--section-y)]">
      <header className="max-w-[680px]">
        <p className="eyebrow">Last updated {formatDate(doc.updated)}</p>
        <h1 className="mt-4 text-display-l text-ink">{doc.title}</h1>
        <p className="mt-6 text-body-l text-ink-muted">{doc.summary}</p>
      </header>
      <div className="prose mt-12">
        <MDXContent code={doc.body} />
      </div>
    </article>
  );
}
