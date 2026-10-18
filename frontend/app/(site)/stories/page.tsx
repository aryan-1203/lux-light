import { featuredTestimonialId, testimonials } from "@/data/testimonials";
import { pageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { StoryCard } from "@/components/sections/Stories";
import { CtaBand } from "@/components/sections/CtaBand";

export const metadata = pageMetadata({
  title: "Stories",
  description: "Stories from people using the lamp. Real reviews from our founding batch will appear here.",
  path: "/stories",
});

export default function StoriesPage() {
  const ordered = [...testimonials].sort((a, b) =>
    a.id === featuredTestimonialId ? -1 : b.id === featuredTestimonialId ? 1 : 0,
  );
  return (
    <>
      <PageHeader
        eyebrow="Stories"
        title={
          <>
            Mornings, <em>retold</em>.
          </>
        }
        lede="Real stories from our founding batch will live here. Until then, these cards are clearly marked placeholders: we don’t publish made-up reviews."
      />
      <section className="container-x pb-[var(--section-y)]">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 [&_figure]:w-full">
          {ordered.map((t, i) => (
            <Reveal as="li" key={t.id} index={i}>
              <StoryCard t={t} />
            </Reveal>
          ))}
        </ul>
      </section>
      <CtaBand />
    </>
  );
}
