import { Quote } from "lucide-react";
import { featuredTestimonialId, testimonials, type Testimonial } from "@/data/testimonials";
import { Marquee } from "@/components/ui/Marquee";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

function PlaceholderBadge() {
  return (
    <span className="inline-flex items-center rounded-pill border border-sun-600/50 bg-sun-50 px-2.5 py-0.5 font-mono text-[10px] tracking-[0.08em] text-sun-800 uppercase">
      Placeholder
    </span>
  );
}

export function StoryCard({ t }: { t: Testimonial }) {
  return (
    <figure className="flex h-full w-[min(84vw,360px)] shrink-0 flex-col justify-between rounded-card border border-hairline bg-paper p-6">
      <div>
        <PlaceholderBadge />
        <blockquote className="mt-4 text-body text-ink">{t.quote}</blockquote>
      </div>
      <figcaption className="mt-6 text-small">
        <span className="font-semibold text-ink">{t.name}</span>
        <span className="text-ink-muted">
          {" "}
          · {t.role}, {t.city}
        </span>
      </figcaption>
    </figure>
  );
}

/** One featured story + a slow, pausable marquee. Every entry is a labelled placeholder until real reviews arrive. */
export function Stories() {
  const featured = testimonials.find((t) => t.id === featuredTestimonialId) ?? testimonials[0];
  const rest = testimonials.filter((t) => t.id !== featured.id);

  return (
    <section aria-labelledby="stories-title" className="section-y overflow-hidden bg-linen/60">
      <div className="container-x">
        <Reveal>
          <SectionHeading
            id="stories-title"
            eyebrow="Stories"
            title={
              <>
                Mornings, <em>retold</em>.
              </>
            }
          />
        </Reveal>

        <Reveal className="mt-12 rounded-card border border-hairline bg-paper p-7 md:mt-16 md:p-12">
          <figure>
            <div className="flex items-center justify-between gap-4">
              <Quote aria-hidden className="size-8 text-sun-600" strokeWidth={1.5} />
              <PlaceholderBadge />
            </div>
            <blockquote className="mt-6 max-w-[30ch] font-display text-display-m text-ink">{featured.quote}</blockquote>
            <figcaption className="mt-8 text-body">
              <span className="font-semibold text-ink">{featured.name}</span>
              <span className="text-ink-muted">
                {" "}
                · {featured.role}, {featured.city}
              </span>
            </figcaption>
          </figure>
        </Reveal>
      </div>

      <div className="container-x mt-6">
        <Marquee label="More stories" secondsPerLoop={70}>
          {rest.map((t) => (
            <StoryCard key={t.id} t={t} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}
