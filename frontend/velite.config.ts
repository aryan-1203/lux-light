import { defineCollection, defineConfig, s } from "velite";

/** Journal posts: content/journal/<slug>.mdx */
const journal = defineCollection({
  name: "Post",
  pattern: "journal/**/*.mdx",
  schema: s
    .object({
      title: s.string().max(120),
      slug: s.path().transform((p) => p.replace(/^journal\//, "")),
      excerpt: s.string().max(200),
      category: s.enum(["guide", "article", "news"]),
      date: s.isodate(),
      readingTime: s.number().int().positive(),
      cover: s.string(),
      coverAlt: s.string(),
      toc: s.toc(),
      body: s.mdx(),
    })
    .transform((data) => ({ ...data, url: `/journal/${data.slug}` })),
});

/** Legal pages: content/legal/<slug>.mdx */
const legal = defineCollection({
  name: "Legal",
  pattern: "legal/*.mdx",
  schema: s.object({
    title: s.string(),
    slug: s.path().transform((p) => p.replace(/^legal\//, "")),
    updated: s.isodate(),
    summary: s.string(),
    body: s.mdx(),
  }),
});

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: { journal, legal },
  mdx: {
    // Plain Markdown + the one component we render (Note); nothing else.
    remarkPlugins: [],
    rehypePlugins: [],
  },
});
