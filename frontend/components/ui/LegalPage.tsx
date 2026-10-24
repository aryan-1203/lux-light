import { getLegal } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { MDXContent } from "./MDXContent";

export function LegalPage({ slug }: { slug: "privacy" | "terms" }) {
  const doc = getLegal(slug);
  return (
    <article id="legal" className="bg-bg text-fg">
      <div className="container-x pt-[calc(var(--nav-h)+clamp(48px,8vw,112px))] pb-[var(--section-y)]">
        <header className="max-w-[760px]">
          <p className="kicker">Last updated {formatDate(doc.updated)}</p>
          <h1 className="mt-4 text-display">{doc.title}</h1>
          <p className="mt-6 text-body-l text-fg-muted">{doc.summary}</p>
        </header>
        <div className="prose mt-14">
          <MDXContent code={doc.body} />
        </div>
      </div>
    </article>
  );
}
