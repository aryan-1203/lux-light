import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';
import { fontSize, shadows, zIndex } from './tokens';

/** tailwind-merge that knows our custom token names (so `text-hero` isn't mistaken for a colour). */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: Object.keys(fontSize) }],
      shadow: [{ shadow: Object.keys(shadows) }],
      z: [{ z: Object.keys(zIndex) }],
    },
  },
});

/** Compose class names; later Tailwind classes win over earlier conflicting ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
