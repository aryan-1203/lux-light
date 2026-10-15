import { useCallback, useLayoutEffect, useRef } from 'react';

/**
 * Remembers what had focus when an overlay opened and restores it on close (WCAG 2.4.3).
 * Radix only does this automatically when its own <Dialog.Trigger> is used; our overlays are
 * usually opened from the store (cart button, menu button), so we capture it ourselves.
 * Layout effect → runs before Radix's FocusScope moves focus inside the content.
 */
export function useReturnFocus(open: boolean) {
  const previous = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (open && typeof document !== 'undefined') {
      previous.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
  }, [open]);
  return useCallback((event: Event) => {
    const target = previous.current;
    if (target && target.isConnected) {
      event.preventDefault();
      target.focus({ preventScroll: true });
    }
  }, []);
}
