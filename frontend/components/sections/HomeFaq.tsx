import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { faqGroups, homeFaqIds } from "@/data/faq";
import { Accordion } from "@/components/ui/Accordion";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function homeFaqItems() {
  return homeFaqIds.flatMap((ref) => {
    const [groupId, index] = ref.split(":");
    const item = faqGroups.find((g) => g.id === groupId)?.items[Number(index)];
    return item ? [item] : [];
  });
}

export function HomeFaq() {
  const items = homeFaqItems();
  return (
    <section aria-labelledby="faq-title" className="section-y">
      <div className="container-x grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <SectionHeading
            id="faq-title"
            eyebrow="FAQ"
            title={
              <>
                Good <em>questions</em>.
              </>
            }
          />
          <Link
            href="/faq"
            className="group mt-6 inline-flex min-h-11 items-center gap-2 text-small font-semibold text-ink transition-colors duration-[var(--dur-micro)] hover-fine:text-sun-800"
          >
            See all questions{" "}
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform duration-[var(--dur-ui)] ease-out group-hover:translate-x-0.5"
            />
          </Link>
        </Reveal>
        <Reveal className="lg:col-span-8">
          <Accordion items={items.map((it, i) => ({ id: `home-${i}`, title: it.q, content: it.a }))} />
        </Reveal>
      </div>
    </section>
  );
}
