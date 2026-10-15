import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin, type ProxyOptions } from 'vite';

/**
 * Preload the two latin variable-font files (self-hosted via @fontsource-variable) so headings
 * and body text don't wait for CSS parsing → font discovery. Only the latin subsets are preloaded.
 */
function preloadFonts(): Plugin {
  const wanted = [
    /space-grotesk-latin-wght-normal.*\.woff2$/,
    /dm-sans-latin-wght-normal.*\.woff2$/,
  ];
  return {
    name: 'dawnlit:preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        if (!ctx.bundle) return [];
        const files = Object.keys(ctx.bundle).filter((f) => wanted.some((re) => re.test(f)));
        return files.map((f) => ({
          tag: 'link',
          attrs: { rel: 'preload', href: `/${f}`, as: 'font', type: 'font/woff2', crossorigin: '' },
          injectTo: 'head',
        }));
      },
    },
  };
}

const API_TARGET = process.env.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:8000';

/** Same-origin proxy (PLAN §1.1): cookies + CSRF stay first-party in dev and preview. */
const proxy: Record<string, ProxyOptions> = Object.fromEntries(
  ['/api', '/media', '/sitemap.xml', '/robots.txt'].map((path) => [
    path,
    { target: API_TARGET, changeOrigin: false, xfwd: true },
  ]),
);

/**
 * Vendor chunking. Only libraries needed on first paint go to `vendor`;
 * heavy optional libraries get their own lazily-loaded chunks so `/` stays small.
 */
function manualChunks(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined;
  if (
    /node_modules\/(three|@react-three|three-stdlib|troika-|maath|meshline|camera-controls)/.test(
      id,
    )
  )
    return 'three';
  if (/node_modules\/(recharts|d3-|victory-vendor|internmap|decimal\.js-light)/.test(id))
    return 'admin-vendor';
  // Framer Motion is deliberately NOT forced into one chunk: the shell only needs `m` +
  // domAnimation (LazyMotion), and Rollup keeps the rest (drag/layout/`motion` proxy) in lazy
  // chunks next to the pages that use it. Lenis is dynamically imported after first paint.
  if (/node_modules\/lenis\//.test(id)) return 'motion';
  if (
    /node_modules\/(react|react-dom|scheduler|react-router|react-router-dom|@remix-run|@tanstack\/react-query|@tanstack\/query-core|zustand|use-sync-external-store|react-helmet-async|react-fast-compare|invariant|shallowequal|i18next|react-i18next|i18next-resources-to-backend|openapi-fetch|clsx|tailwind-merge)\//.test(
      id,
    )
  )
    return 'vendor';
  return undefined;
}

export default defineConfig({
  plugins: [react(), preloadFonts()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173, strictPort: true, proxy },
  preview: { port: 4173, strictPort: true, proxy },
  build: {
    target: 'es2020',
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: { manualChunks },
    },
  },
});
