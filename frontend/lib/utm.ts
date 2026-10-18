"use client";

/**
 * First-touch attribution: on the first page view of a session we remember UTM parameters,
 * the landing page and the referrer, and attach them to form submissions.
 */
const KEY = "first-touch";

export type FirstTouch = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  landing_page?: string;
  referrer?: string;
};

const clip = (v: string | null | undefined) => (v ? v.slice(0, 300) : undefined);

export function captureFirstTouch() {
  try {
    if (sessionStorage.getItem(KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const data: FirstTouch = {
      utm_source: clip(params.get("utm_source")),
      utm_medium: clip(params.get("utm_medium")),
      utm_campaign: clip(params.get("utm_campaign")),
      landing_page: clip(window.location.pathname + window.location.search),
      referrer: clip(
        document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer : "",
      ),
    };
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage blocked: attribution is best-effort */
  }
}

export function getFirstTouch(): FirstTouch {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as FirstTouch;
  } catch {
    /* ignore */
  }
  return { landing_page: clip(window.location.pathname), referrer: clip(document.referrer) };
}
