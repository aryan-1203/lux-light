import { defineCollection, defineConfig, s } from "velite";

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
  collections: { legal },
  mdx: {
    // Plain Markdown + the one component we render (Note); nothing else.
    remarkPlugins: [],
    rehypePlugins: [],
  },
});
