import { useTranslation } from 'react-i18next';

export const MAIN_CONTENT_ID = 'main-content';

/** First focusable element: jumps past the header to <main>. */
export default function SkipLink() {
  const { t } = useTranslation('common');
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only z-skiplink rounded-full bg-sunrise px-5 py-3 font-display font-medium text-on-sunrise focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
    >
      {t('a11y.skipToContent')}
    </a>
  );
}
