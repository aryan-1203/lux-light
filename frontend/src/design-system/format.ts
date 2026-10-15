/**
 * Display formatting (PLAN §4.2). Money is integer paise everywhere; only formatINR turns it
 * into text. Dates display in Asia/Kolkata.
 */
const inrWhole = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const inrPaise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const plainNumber = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** 499900 → "₹4,999"; 49990 → "₹499.90"; showZeroPaise → "₹4,999.00". */
export function formatINR(paise: number, opts?: { showZeroPaise?: boolean }): string {
  const value = Math.round(paise) / 100;
  const hasPaise = Math.round(paise) % 100 !== 0;
  return (hasPaise || opts?.showZeroPaise ? inrPaise : inrWhole).format(value);
}

const DEFAULT_DATE: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
};

/** ISO string → "15 Oct 2026" in IST (pass options for time, weekday, etc.). */
export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-IN', {
    ...(opts ?? DEFAULT_DATE),
    timeZone: 'Asia/Kolkata',
  }).format(date);
}

/** 10000 → "10,000 lux". */
export function formatLux(lux: number): string {
  return `${plainNumber.format(lux)} lux`;
}

/** 12345 → "12,345" (en-IN grouping). */
export function formatNumber(n: number): string {
  return plainNumber.format(n);
}
