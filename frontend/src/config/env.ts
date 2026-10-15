/** Typed access to Vite env vars (PLAN §1.13). Analytics IDs are placeholders (no-op when empty). */
const raw = import.meta.env;

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export const env = {
  apiMock: raw.VITE_API_MOCK === 'true',
  siteUrl: stripTrailingSlash(raw.VITE_SITE_URL || 'http://localhost:5173'),
  enable3d: raw.VITE_ENABLE_3D === 'true',
  gaId: raw.VITE_GA_ID || '',
  metaPixelId: raw.VITE_META_PIXEL_ID || '',
  isDev: raw.DEV,
  isProd: raw.PROD,
  mode: raw.MODE,
} as const;

export type Env = typeof env;
