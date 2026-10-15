/**
 * i18n (PLAN §4.2 / §6.3). Namespaces are JSON files under `locales/<lng>/<ns>.json`, loaded lazily
 * through `import.meta.glob` + i18next-resources-to-backend: dropping a new namespace file needs no
 * change here. Components call `useTranslation('<ns>')`; shared strings use `t('common:…')`;
 * error toasts use `t(`errors:${err.code}`, { defaultValue: err.message })`.
 */
import i18n from 'i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { initReactI18next } from 'react-i18next';

export const SUPPORTED_LANGUAGES = ['en', 'hi'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_NAMESPACES = ['common', 'errors'] as const;
const STORAGE_KEY = 'dl_lang';

type JsonModule = { default: Record<string, unknown> };
const loaders = import.meta.glob<JsonModule>('./locales/*/*.json');

/** All namespace names that exist for English (useful for tests / preloading). */
export const availableNamespaces: string[] = Object.keys(loaders)
  .filter((p) => p.startsWith('./locales/en/'))
  .map((p) => p.replace('./locales/en/', '').replace('.json', ''));

function initialLanguage(): Language {
  try {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored))
      return stored as Language;
  } catch {
    // Storage unavailable (private mode) — fall back to English.
  }
  return 'en';
}

export const i18nReady = i18n
  .use(
    resourcesToBackend(async (lng: string, ns: string) => {
      const load = loaders[`./locales/${lng}/${ns}.json`];
      if (!load) return {};
      const mod = await load();
      return mod.default;
    }),
  )
  .use(initReactI18next)
  .init({
    lng: initialLanguage(),
    fallbackLng: 'en',
    supportedLngs: [...SUPPORTED_LANGUAGES],
    ns: [...DEFAULT_NAMESPACES],
    defaultNS: 'common',
    fallbackNS: 'common',
    load: 'languageOnly',
    returnNull: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: true },
    showSupportNotice: false,
  });

i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') document.documentElement.lang = lng;
});

export function setLanguage(lng: Language): Promise<unknown> {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // ignore storage failures
  }
  return i18n.changeLanguage(lng);
}

export default i18n;
