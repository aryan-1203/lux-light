/**
 * Single source of truth for brand, offer and contact details.
 * Every mention of the brand name, price, phone number or offer in the UI must read from here.
 */

export const siteConfig = {
  brandName: "Brand",
  tagline: "Sunrise, on your desk.",
  description:
    "A 10,000-lux, UV-filtered light panel for Indian mornings. Thirty minutes with your chai. Join the waitlist for the founding batch.",

  /** Production origin, used for metadata, sitemap and OG URLs. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "en-IN",

  /** WhatsApp number in international format, digits only (no +, spaces or dashes). PLACEHOLDER. */
  whatsappNumber: "919999999999",

  /** Launch price in INR (whole rupees). Rendered via formatINR(). PLACEHOLDER. */
  priceDisplay: 4999,
  /** Price before the early-access offer, for a struck-through comparison. null to hide. PLACEHOLDER. */
  priceCompare: 6999 as number | null,
  /** Units in the founding batch. Factual figure only, never inflated. PLACEHOLDER. */
  launchBatchSize: 500,

  offer: {
    /** Short line for the announcement bar. Bump `id` whenever the text changes so dismissals reset. */
    id: "founding-batch-v1",
    announcement: "Founding batch: early-access pricing for the first {batch} lamps.",
    /** *word* renders as an italic accent. */
    headline: "Be first in line for the *founding batch*.",
    perks: [
      "Early-access price, locked in",
      "Priority delivery from the first batch",
      "Set-up help from our team on WhatsApp",
    ],
  },

  contact: {
    email: "hello@example.com",
    /** Shown in the footer. PLACEHOLDER. */
    city: "Bengaluru, India",
  },

  socials: [
    { label: "Instagram", href: "https://instagram.com/" },
    { label: "YouTube", href: "https://youtube.com/" },
    { label: "LinkedIn", href: "https://linkedin.com/" },
    { label: "X", href: "https://x.com/" },
  ],

  /** Budget ranges offered in the interest form. */
  budgetRanges: ["Under ₹4,000", "₹4,000–₹6,000", "₹6,000–₹9,000", "Above ₹9,000", "Not sure yet"],
} as const;

export type SiteConfig = typeof siteConfig;

/** Sections of the one-page site. Hrefs are absolute so they also work from /privacy and /terms. */
export const navLinks = [
  { id: "why", href: "/#why", label: "Why light" },
  { id: "research", href: "/#research", label: "Research" },
  { id: "faq", href: "/#faq", label: "FAQ" },
] as const;

export const joinHref = "/#join";

export const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;
