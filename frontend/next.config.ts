import type { NextConfig } from "next";

// Velite compiles content/ (MDX) into typed data in .velite/. `npm run build` runs it before
// `next build`; in dev we start it here in watch mode so edits to posts hot-reload.
if (process.argv.includes("dev") && !process.env.VELITE_STARTED) {
  process.env.VELITE_STARTED = "1";
  void import("velite").then((m) => m.build({ watch: true, clean: false }));
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The site became one page (2026-10-24). Old routes point at the matching section so links from
  // earlier posts, ads and search results still land somewhere useful. Temporary (307), so a page
  // can come back later without browsers holding on to a cached permanent redirect.
  async redirects() {
    const to = (source: string, destination: string) => ({ source, destination, permanent: false });
    return [
      to("/early-access", "/#join"),
      to("/the-lamp", "/#why"),
      to("/how-it-works", "/#why"),
      to("/why-india", "/#why"),
      to("/faq", "/#faq"),
      to("/stories", "/"),
      to("/about", "/"),
      to("/journal", "/#why"),
      to("/journal/:slug*", "/#why"),
    ];
  },
  experimental: {
    // ~18 KB of CSS inlined into <head>: no render-blocking stylesheet request on first visit.
    inlineCss: true,
  },
};

export default nextConfig;
