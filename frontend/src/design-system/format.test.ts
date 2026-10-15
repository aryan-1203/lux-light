import { describe, expect, it } from 'vitest';
import { formatDate, formatINR, formatLux, formatNumber } from './format';

describe('formatINR', () => {
  it('formats whole rupees without paise', () => {
    expect(formatINR(499900)).toBe('₹4,999');
  });
  it('shows paise when present', () => {
    expect(formatINR(49990)).toBe('₹499.90');
  });
  it('uses Indian digit grouping (lakh)', () => {
    expect(formatINR(1_000_000_00)).toBe('₹10,00,000');
  });
  it('can force zero paise', () => {
    expect(formatINR(499900, { showZeroPaise: true })).toBe('₹4,999.00');
  });
  it('handles zero and negatives', () => {
    expect(formatINR(0)).toBe('₹0');
    expect(formatINR(-50000)).toBe('-₹500');
  });
});

describe('formatDate', () => {
  it('formats in Asia/Kolkata', () => {
    // 20:00 UTC on 14 Oct is 01:30 IST on 15 Oct.
    expect(formatDate('2026-10-14T20:00:00Z')).toBe('15 Oct 2026');
  });
  it('accepts Intl options', () => {
    expect(
      formatDate('2026-10-14T20:00:00Z', { hour: '2-digit', minute: '2-digit', hour12: false }),
    ).toBe('01:30');
  });
  it('returns the input for invalid dates', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

describe('formatLux / formatNumber', () => {
  it('formats lux with grouping', () => {
    expect(formatLux(10000)).toBe('10,000 lux');
    expect(formatLux(100)).toBe('100 lux');
  });
  it('formats plain numbers en-IN', () => {
    expect(formatNumber(123456)).toBe('1,23,456');
  });
});
