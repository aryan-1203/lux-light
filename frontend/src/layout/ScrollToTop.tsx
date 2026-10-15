import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { useLenis } from '@/design-system';

/**
 * Resets scroll on navigation (PUSH/REPLACE). Back/forward (POP) keeps the browser's restored
 * position; `#hash` links scroll to their target.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();
  const lenis = useLenis();

  useLayoutEffect(() => {
    if (navType === 'POP') return;
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  }, [pathname, hash, navType, lenis]);

  return null;
}
