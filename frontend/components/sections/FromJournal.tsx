import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { latestPosts } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PostCard } from "@/components/journal/PostCard";

export function FromJournal() {
  const posts = latestPosts(3);
  return (
    <section aria-labelledby="journal-title" className="section-y">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <SectionHeading
              id="journal-title"
              eyebrow="From the journal"
              title={
                <>
                  Notes on <em>light</em>.
                </>
              }
            />
          </Reveal>
          <Link
            href="/journal"
            className="group inline-flex min-h-11 items-center gap-2 text-small font-semibold text-ink transition-colors duration-[var(--dur-micro)] hover-fine:text-sun-800"
          >
            All posts{" "}
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform duration-[var(--dur-ui)] ease-out group-hover:translate-x-0.5"
            />
          </Link>
        </div>
        <ul className="mt-12 grid gap-6 md:mt-16 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <Reveal as="li" key={post.slug} index={i}>
              <PostCard post={post} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
