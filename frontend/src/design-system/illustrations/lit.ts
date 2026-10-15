import type { CSSProperties } from 'react';

/** Opacity-only transition for lit/unlit layers. */
export const litLayer = (lit: boolean): { style: CSSProperties } => ({
  style: { opacity: lit ? 1 : 0, transition: 'opacity 600ms cubic-bezier(0.22, 1, 0.36, 1)' },
});
