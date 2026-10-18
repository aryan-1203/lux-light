import { journal, legal } from "#site/content";

export type Post = (typeof journal)[number];
export type Category = Post["category"];

export const categoryLabels: Record<Category, string> = {
  guide: "Guides",
  article: "Articles",
  news: "News",
};

export function allPosts(): Post[] {
  return [...journal].sort((a, b) => b.date.localeCompare(a.date));
}

export function latestPosts(n = 3): Post[] {
  return allPosts()
    .filter((p) => p.category !== "news")
    .slice(0, n);
}

export function getPost(slug: string): Post | undefined {
  return journal.find((p) => p.slug === slug);
}

export function relatedPosts(post: Post, n = 2): Post[] {
  const others = allPosts().filter((p) => p.slug !== post.slug);
  const same = others.filter((p) => p.category === post.category);
  return [...same, ...others.filter((p) => p.category !== post.category)].slice(0, n);
}

export function getLegal(slug: "privacy" | "terms") {
  const doc = legal.find((d) => d.slug === slug);
  if (!doc) throw new Error(`Missing legal page: ${slug}`);
  return doc;
}
