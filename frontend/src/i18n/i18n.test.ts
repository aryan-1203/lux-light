import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import errorsEn from './locales/en/errors.json';

const planPath = resolve(__dirname, '../../../docs/PLAN.md');
const localesDir = resolve(__dirname, 'locales');

function planErrorCodes(): string[] {
  const plan = readFileSync(planPath, 'utf8');
  const section = plan.slice(plan.indexOf('### 6.2 Error code catalogue'), plan.indexOf('### 6.3'));
  return [...section.matchAll(/^\| ([A-Z][A-Z0-9_]+)(?: †)? \|/gm)].map((m) => m[1] as string);
}

describe('i18n resources', () => {
  it('has an English message for every error code in PLAN §6.2', () => {
    const codes = planErrorCodes();
    expect(codes.length).toBeGreaterThan(80);
    const missing = codes.filter((c) => !(c in errorsEn));
    expect(missing).toEqual([]);
  });

  it('has a Hindi file for every English namespace', () => {
    const en = readdirSync(resolve(localesDir, 'en')).sort();
    const hi = readdirSync(resolve(localesDir, 'hi')).sort();
    expect(hi).toEqual(en);
  });

  it('never hard-codes the brand name in locale strings (PLAN §6.3)', () => {
    for (const lng of ['en', 'hi']) {
      for (const file of readdirSync(resolve(localesDir, lng))) {
        expect(readFileSync(resolve(localesDir, lng, file), 'utf8')).not.toMatch(/Dawnlit/);
      }
    }
  });

  it('resolves common and errors namespaces lazily', () => {
    expect(i18n.t('common:nav.quiz')).toBe('Find your routine');
    expect(i18n.t('errors:PROMO_EXPIRED')).toBe('That code has expired.');
    expect(i18n.t('common:header.cartLabel', { count: 1 })).toBe('Cart, 1 item');
  });
});
