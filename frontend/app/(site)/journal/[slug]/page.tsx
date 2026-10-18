import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { allPosts, categoryLabels, getPost, relatedPosts } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { siteConfig } from "@/site.config";
import { articleLd } from "@/lib/jsonld";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { JsonLd } from "@/components/ui/JsonLd";
import { MDXContent } from "@/components/ui/MDXContent";
import { PostCard } from "@/components/journal/PostCard";
import { CtaBand } from "@/components/sections/CtaBand";

export function generateStaticParams() {
  return allPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/journal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: post.url },
    openGraph: {
      type: "article",
      title: `${post.title} · ${siteConfig.brandName}`,
      description: post.excerpt,
      url: post.url,
      publishedTime: post.date,
    },
  };
}

// The slug is URL data: keep it behind a Suspense boundary so client navigations between posts
// render the shell instantly. Every post is still fully prerendered via generateStaticParams.
export default function PostPage({ params }: PageProps<"/journal/[slug]">) {
  return (
    <Suspense fallback={<div className="container-x min-h-[80svh] pt-[clamp(40px,6vw,88px)]" aria-busy="true" />}>
      <Post params={params} />
    </Suspense>
  );
}

async function Post({ params }: { params: PageProps<"/journal/[slug]">["params"] }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const related = relatedPosts(post, 3);
  const showToc = post.toc.length >= 3;

  return (
    <>
      <JsonLd data={articleLd(post)} />
      <article>
        <header className="container-x pt-[clamp(40px,6vw,88px)]">
          <Link
            href="/journal"
            className="group inline-flex min-h-11 items-center gap-2 text-small font-medium text-ink-muted transition-colors duration-[var(--dur-micro)] hover-fine:text-ink"
          >
            <ArrowLeft
              aria-hidden
              className="size-4 transition-transform duration-[var(--dur-ui)] ease-out group-hover:-translate-x-0.5"
            />
            Journal
          </Link>
          <div className="mt-8 max-w-[860px]">
            <p className="flex flex-wrap items-center gap-3 font-mono text-label tracking-[0.08em] text-ink-muted uppercase">
              <span className="text-sun-800">{categoryLabels[post.category].replace(/s$/, "")}</span>
              <span aria-hidden>·</span>
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span aria-hidden>·</span>
              <span>{post.readingTime} min read</span>
            </p>
            <h1 className="mt-5 text-display-l text-ink">{post.title}</h1>
            <p className="mt-6 max-w-[56ch] text-body-l text-ink-muted">{post.excerpt}</p>
          </div>
          <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-card border border-hairline bg-linen md:mt-14 md:aspect-[21/9]">
            <Image
              src={post.cover}
              alt={post.coverAlt}
              fill
              priority
              sizes="(min-width: 1280px) 1240px, 100vw"
              className="object-cover"
            />
          </div>
        </header>

        <div className="container-x mt-12 grid gap-12 pb-[var(--section-y)] md:mt-16 lg:grid-cols-12">
          {showToc && (
            <nav aria-label="On this page" className="hidden lg:col-span-3 lg:block">
              <div className="sticky top-[calc(var(--nav-h)+32px)]">
                <p className="font-mono text-label tracking-[0.08em] text-ink-muted uppercase">On this page</p>
                <ol className="mt-4 space-y-2 border-l border-hairline">
                  {post.toc.map((h) => (
                    <li key={h.url}>
                      <a
                        href={h.url}
                        className="-ml-px block border-l border-transparent py-1 pl-4 text-small text-ink-muted transition-colors duration-[var(--dur-micro)] hover-fine:border-ink hover-fine:text-ink"
                      >
                        {h.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            </nav>
          )}
          <div className={showToc ? "lg:col-span-8 lg:col-start-5" : "lg:col-span-8 lg:col-start-3"}>
            <div className="prose">
              <MDXContent code={post.body} />
            </div>
            <Disclaimer className="mt-14 max-w-[680px]" />
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="section-y border-t border-hairline bg-linen/50">
          <div className="container-x">
            <h2 id="related-title" className="text-display-m text-ink">
              Keep <em>reading</em>
            </h2>
            <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <li key={p.slug}>
                  <PostCard post={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <div className="pt-[var(--section-y)]">
        <CtaBand />
      </div>
    </>
  );
}
