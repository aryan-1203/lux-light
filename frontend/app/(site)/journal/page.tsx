import { pageMetadata } from "@/lib/metadata";
import { allPosts } from "@/lib/content";
import { PageHeader } from "@/components/ui/PageHeader";
import { JournalIndex } from "@/components/journal/JournalIndex";
import { CtaBand } from "@/components/sections/CtaBand";

export const metadata = pageMetadata({
  title: "Journal",
  description: "Guides, articles and news about light, mornings and routine, written for Indian homes and offices.",
  path: "/journal",
});

export default function JournalPage() {
  return (
    <>
      <PageHeader
        eyebrow="Journal"
        title={
          <>
            Notes on <em>light</em>.
          </>
        }
        lede="Guides, articles and news about light, mornings and routine. Plain language, no hype."
      />
      <section className="container-x pb-[var(--section-y)]">
        <JournalIndex posts={allPosts()} />
      </section>
      <CtaBand />
    </>
  );
}
