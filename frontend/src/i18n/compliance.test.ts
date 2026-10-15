import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DISCLAIMER } from '@/config/brand';

/** PLAN §6.5 banned terms (the exact disclaimer sentence is whitelisted). */
const BANNED = [
  /\bcure[sd]?\b/i,
  /\btreat(s|ment|ing)?\b/i,
  /\bprevent(s|ion)?\b/i,
  /\bdiagnos/i,
  /\btherap(y|eutic)\b/i,
  /\bheal(s|ing)?\b/i,
  /\bSAD\b/,
  /seasonal affective/i,
  /\bdepression\b/i,
  /\binsomnia\b/i,
  /\bdisorder\b/i,
  /clinically proven/i,
  /medical-grade/i,
];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

describe('compliance copy', () => {
  it('uses the exact disclaimer', () => {
    expect(DISCLAIMER).toBe('Not a medical device. Consult a doctor for medical conditions.');
  });

  const src = resolve(__dirname, '..');
  const files = [
    ...walk(resolve(src, 'i18n/locales')),
    ...walk(resolve(src, 'mocks/fixtures')),
    resolve(src, 'config/brand.ts'),
  ];
  it.each(files.map((f) => [f.replace(src, 'src')]))('%s has no banned health claims', (rel) => {
    const text = readFileSync(resolve(src, '..', rel), 'utf8').replaceAll(DISCLAIMER, '');
    const hits = BANNED.filter((re) => re.test(text)).map(String);
    expect(hits).toEqual([]);
  });
});
