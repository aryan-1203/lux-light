import { HeartHandshake, MapPin, ShieldCheck, User } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CtaBand } from "@/components/sections/CtaBand";

export const metadata = pageMetadata({
  title: "About",
  description:
    "The team bringing a 10,000 lux, UV-free lamp to Indian homes and offices, and what we promise to get right.",
  path: "/about",
});

// PLACEHOLDER team: replace names, roles and photos before launch.
const TEAM = [
  { name: "Founder name", role: "Co-founder · Product", note: "Placeholder bio: why mornings matter to them." },
  {
    name: "Founder name",
    role: "Co-founder · Operations",
    note: "Placeholder bio: building the supply chain in India.",
  },
  { name: "Team member", role: "Customer care", note: "Placeholder bio: the person who replies on WhatsApp." },
];

const PROMISES = [
  {
    icon: ShieldCheck,
    title: "Honest claims",
    body: "Wellness language only. We’ll never claim the lamp treats or cures anything.",
  },
  {
    icon: HeartHandshake,
    title: "Real reviews only",
    body: "No fake testimonials. Stories appear here when real customers share them.",
  },
  {
    icon: MapPin,
    title: "Built for India",
    body: "Indian plugs and power, Indian support hours, delivery across the country.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title={
          <>
            Why we’re bringing <em>light</em> home.
          </>
        }
        lede="We spent years in offices, on night shifts and through Delhi winters wondering why mornings felt so flat. This is the lamp we wanted, made for the way India works."
      />

      <section aria-labelledby="team-title" className="container-x pb-[var(--section-y)]">
        <Reveal>
          <SectionHeading
            id="team-title"
            eyebrow="The team"
            title={
              <>
                Small team, <em>long</em> mornings.
              </>
            }
          />
        </Reveal>
        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {TEAM.map((p, i) => (
            <Reveal as="li" key={i} index={i} className="rounded-card border border-hairline bg-paper p-6">
              <div className="grid aspect-square place-items-center rounded-md bg-linen" aria-hidden>
                <User className="size-10 text-ink/25" strokeWidth={1.25} />
              </div>
              <p className="mt-5 inline-flex rounded-pill border border-sun-600/50 bg-sun-50 px-2.5 py-0.5 font-mono text-[10px] tracking-[0.08em] text-sun-800 uppercase">
                Placeholder
              </p>
              <h3 className="mt-3 text-heading text-ink">{p.name}</h3>
              <p className="text-small text-ink-muted">{p.role}</p>
              <p className="mt-3 text-small text-ink-muted">{p.note}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      <section aria-labelledby="promise-title" className="section-y bg-linen/60">
        <div className="container-x">
          <Reveal>
            <SectionHeading
              id="promise-title"
              eyebrow="Our promises"
              title={
                <>
                  What we’ll <em>always</em> get right.
                </>
              }
            />
          </Reveal>
          <ul className="mt-12 grid gap-4 md:grid-cols-3">
            {PROMISES.map((p, i) => (
              <Reveal
                as="li"
                key={p.title}
                index={i}
                className="rounded-card border border-hairline bg-paper p-6 md:p-8"
              >
                <p.icon aria-hidden className="size-7 text-ink/70" strokeWidth={1.5} />
                <h3 className="mt-6 text-heading text-ink">{p.title}</h3>
                <p className="mt-3 text-small text-ink-muted">{p.body}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <div className="pt-[var(--section-y)]">
        <CtaBand />
      </div>
    </>
  );
}
