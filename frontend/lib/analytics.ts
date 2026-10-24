/**
 * Provider-agnostic analytics. Events: form_start, form_submit, whatsapp_click, hero_complete.
 * Provider is chosen with NEXT_PUBLIC_ANALYTICS_PROVIDER (plausible | ga4 | none). The Meta Pixel runs
 * alongside whichever is chosen when NEXT_PUBLIC_META_PIXEL_ID is set.
 */
export type AnalyticsEvent = "form_start" | "form_submit" | "whatsapp_click" | "hero_complete";

type Props = Record<string, string | number | boolean>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Props }) => void;
    gtag?: (command: "event", event: string, params?: Props) => void;
    fbq?: (command: "track" | "trackCustom", event: string, params?: Props) => void;
  }
}

const provider = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER ?? "none";

/** Our events → Meta's standard events, so ad sets can optimise for them. */
const META_EVENTS: Partial<Record<AnalyticsEvent, string>> = {
  form_submit: "Lead",
  whatsapp_click: "Contact",
};

export function track(event: AnalyticsEvent, props?: Props) {
  if (typeof window === "undefined") return;
  try {
    const meta = META_EVENTS[event];
    if (meta) window.fbq?.("track", meta);
    else if (event === "form_start") window.fbq?.("trackCustom", "FormStart");
    if (provider === "plausible") window.plausible?.(event, props ? { props } : undefined);
    else if (provider === "ga4") window.gtag?.("event", event, props);
    else if (process.env.NODE_ENV === "development") console.debug("[analytics]", event, props ?? "");
  } catch {
    /* analytics must never break the page */
  }
}
