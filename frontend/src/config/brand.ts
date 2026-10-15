/**
 * Brand strings — the ONLY place the brand name/tagline/legal placeholders live on the frontend
 * (DECISIONS: a rename is a 2-file change: this file + backend env BRAND_NAME/BRAND_LEGAL_NAME).
 * Values marked "placeholder" must be provided by the owner before launch (LAUNCH_CHECKLIST).
 */
export const BRAND_NAME = 'Dawnlit';
export const TAGLINE = 'Your own sunrise, on demand.';
export const BRAND_LEGAL_NAME = 'Dawnlit (placeholder legal name)';

/** Exact compliance disclaimer (DECISIONS / PLAN §6.5) — never paraphrase. */
export const DISCLAIMER = 'Not a medical device. Consult a doctor for medical conditions.';

export const SUPPORT_EMAIL = 'support@dawnlit.in'; // placeholder
export const SUPPORT_PHONE = '+91 00000 00000'; // placeholder
export const SUPPORT_HOURS = 'Mon–Sat, 10:00–18:00 IST';

export const SOCIAL_LINKS: ReadonlyArray<{
  id: 'instagram' | 'youtube' | 'x' | 'linkedin';
  label: string;
  href: string;
}> = [
  { id: 'instagram', label: 'Instagram', href: 'https://instagram.com/' }, // placeholder handle
  { id: 'youtube', label: 'YouTube', href: 'https://youtube.com/' }, // placeholder
  { id: 'x', label: 'X (Twitter)', href: 'https://x.com/' }, // placeholder
];

/** BIS / import compliance placeholder block shown in the footer (owner fills before launch). */
export const COMPLIANCE = {
  importerName: 'Importer name — to be added',
  importerAddress: 'Importer address — to be added',
  iec: 'IEC — to be added',
  bisRegistration: 'BIS R-number — to be added',
  gstin: 'GSTIN 27AAAAA0000A1Z5 (placeholder)',
  countryOfOrigin: 'Country of origin: China',
} as const;

export const WARRANTY_MONTHS = 12;
export const RETURN_WINDOW_DAYS = 30;
