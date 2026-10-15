import { describe, expect, it } from 'vitest';
import { colors, type ColorToken } from './tokens';

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
}

function contrast(a: ColorToken, b: ColorToken): number {
  const [l1, l2] = [luminance(colors[a]), luminance(colors[b])].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (l1 + 0.05) / (l2 + 0.05);
}

/** [foreground, background, minimum ratio, usage] — documented in docs/DESIGN_SYSTEM.md. */
const pairs: Array<[ColorToken, ColorToken, number, string]> = [
  ['fg', 'bg', 7, 'body text'],
  ['fg', 'surface', 7, 'text on cards'],
  ['fg', 'surface-2', 7, 'text in inputs'],
  ['fg', 'surface-3', 7, 'text on pressed/active'],
  ['muted', 'bg', 4.5, 'secondary text'],
  ['muted', 'surface', 4.5, 'secondary text on cards'],
  ['muted', 'surface-2', 4.5, 'placeholders/helper in inputs'],
  ['on-sunrise', 'sunrise', 4.5, 'primary CTA label'],
  ['on-sunrise', 'sunrise-strong', 4.5, 'CTA hover label'],
  ['sunrise', 'bg', 4.5, 'accent text'],
  ['sunrise-strong', 'bg', 4.5, 'links / accent text'],
  ['sunrise-strong', 'surface', 4.5, 'links on cards'],
  ['danger', 'bg', 4.5, 'error text'],
  ['danger', 'surface', 4.5, 'error text on cards'],
  ['danger', 'surface-2', 4.5, 'error text in toasts'],
  ['success', 'bg', 4.5, 'success text'],
  ['success', 'surface', 4.5, 'success text on cards'],
  ['info', 'surface-2', 4.5, 'info icon/text'],
  ['focus', 'bg', 3, 'focus ring (non-text, 1.4.11)'],
  ['focus', 'surface', 3, 'focus ring on cards'],
  ['border-strong', 'bg', 3, 'control borders (1.4.11)'],
  ['border-strong', 'surface', 3, 'control borders on cards'],
  ['border-strong', 'surface-2', 3, 'input borders'],
];

describe('colour tokens meet WCAG contrast', () => {
  it.each(pairs)('%s on %s ≥ %s:1 (%s)', (fg, bg, min) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(min);
  });
});
