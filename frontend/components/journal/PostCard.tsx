import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/content";
import { categoryLabels } from "@/lib/content";
import { formatDate } from "@/lib/format";

export function PostCard({ post, priority = false }: { post: Post; priority?: boolean }) {
  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-[8/5] overflow-hidden rounded-card border border-hairline bg-linen">
        <Image
          src={post.cover}
          alt={post.coverAlt}
          fill
          sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
          priority={priority}
          className="object-cover transition-[scale] duration-[600ms] ease-out group-hover:scale-[1.02]"
        />
      </div>
      <div className="mt-5 flex items-center gap-3 font-mono text-[0.6875rem] tracking-[0.08em] text-ink-muted uppercase">
        <span className="text-sun-800">{categoryLabels[post.category].replace(/s$/, "")}</span>
        <span aria-hidden>·</span>
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span aria-hidden>·</span>
        <span>{post.readingTime} min read</span>
      </div>
      <h3 className="mt-3 text-heading text-ink">
        <Link href={post.url} className="after:absolute after:inset-0 after:content-['']">
          <span className="bg-[linear-gradient(var(--sun-200),var(--sun-200))] bg-[length:0%_40%] bg-left-bottom bg-no-repeat transition-[background-size] duration-[var(--dur-sheet)] ease-out group-hover:bg-[length:100%_40%]">
            {post.title}
          </span>
        </Link>
      </h3>
      <p className="mt-3 text-small text-ink-muted">{post.excerpt}</p>
    </article>
  );
}
