import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { MAIN_CONTENT_ID } from './SkipLink';

/**
 * On client-side navigation: announces the new page title (polite live region) and moves focus to
 * the page's h1 (or <main>) so keyboard and screen-reader users start at the new content (PLAN §6.4).
 * Waits for the lazy page + transition to render (polls briefly for the h1).
 */
export default function RouteAnnouncer() {
  const { t } = useTranslation('common');
  const { pathname } = useLocation();
  const [message, setMessage] = useState('');
  // Previous pathname (not a 'first run' flag: StrictMode runs effects twice on mount).
  const previous = useRef(pathname);

  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    let attempts = 0;
    let timer = 0;
    const tryFocus = () => {
      attempts += 1;
      const main = document.getElementById(MAIN_CONTENT_ID);
      const h1 = main?.querySelector('h1');
      if (h1 || attempts > 20) {
        const target = (h1 ?? main) as HTMLElement | null;
        if (target) {
          if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }
        setMessage(t('a11y.navigatedTo', { title: document.title }));
        return;
      }
      timer = window.setTimeout(tryFocus, 75);
    };
    timer = window.setTimeout(tryFocus, 75);
    return () => window.clearTimeout(timer);
  }, [pathname, t]);

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}
