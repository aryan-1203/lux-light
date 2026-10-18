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
  experimental: {
    // ~18 KB of CSS inlined into <head>: no render-blocking stylesheet request on first visit.
    inlineCss: true,
  },
};

export default nextConfig;
