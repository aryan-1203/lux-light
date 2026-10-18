import { siteConfig } from "@/site.config";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const num = new Intl.NumberFormat("en-IN");

/** ₹4,999 */
export function formatINR(value: number): string {
  return inr.format(value);
}

/** 10,000 */
export function formatNumber(value: number): string {
  return num.format(value);
}

/** 18 Oct 2026 */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}

/** Replaces {batch} / {price} tokens in config copy. */
export function fillOfferTokens(text: string): string {
  return text
    .replaceAll("{batch}", formatNumber(siteConfig.launchBatchSize))
    .replaceAll("{price}", formatINR(siteConfig.priceDisplay));
}

export function whatsappHref(message?: string): string {
  const base = `https://wa.me/${siteConfig.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
