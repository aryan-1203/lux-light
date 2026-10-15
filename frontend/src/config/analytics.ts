import { env } from './env';

/**
 * Analytics placeholders (GA4 / Meta Pixel). No-ops until VITE_GA_ID / VITE_META_PIXEL_ID are set
 * and the owner wires the vendor snippet + consent banner (LAUNCH_CHECKLIST).
 */
export type AnalyticsEvent =
  | { name: 'page_view'; path: string }
  | { name: 'add_to_cart'; variantId: number; valuePaise: number }
  | { name: 'begin_checkout'; valuePaise: number }
  | { name: 'purchase'; orderNumber: string; valuePaise: number }
  | { name: 'quiz_complete'; productSlug: string };

export const analyticsEnabled = Boolean(env.gaId || env.metaPixelId);

export function track(event: AnalyticsEvent): void {
  if (!analyticsEnabled) return;
  if (env.isDev) console.debug('[analytics]', event);
}
