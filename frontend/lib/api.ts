const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

let warmed = false;

/**
 * Wakes the API ahead of a submit. Render's free plan sleeps after 15 idle minutes and takes ~30–60 s
 * to wake, so we ping /api/health as soon as a form is near, once per page load. Fire-and-forget.
 */
export function warmApi(): void {
  if (warmed || typeof window === "undefined") return;
  warmed = true;
  fetch(apiUrl("/api/health"), { mode: "no-cors", cache: "no-store" }).catch(() => {});
}
