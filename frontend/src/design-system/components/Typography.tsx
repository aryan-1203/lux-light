import { createElement, forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../cn';

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingSize = 'hero' | 'display' | '5xl' | '4xl' | '3xl' | '2xl' | 'xl' | 'lg';

const defaultSize: Record<HeadingLevel, HeadingSize> = {
  1: '4xl',
  2: '3xl',
  3: '2xl',
  4: 'xl',
  5: 'lg',
  6: 'lg',
};

const headingSize: Record<HeadingSize, string> = {
  hero: 'text-hero font-bold',
  display: 'text-display font-bold',
  '5xl': 'text-5xl font-bold',
  '4xl': 'text-4xl font-semibold',
  '3xl': 'text-3xl font-semibold',
  '2xl': 'text-2xl font-semibold',
  xl: 'text-xl font-semibold',
  lg: 'text-lg font-semibold',
};

export type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  /** Semantic level (document outline). Visual size is independent: `size`. */
  level: HeadingLevel;
  size?: HeadingSize;
  glow?: boolean;
};

/** One h1 per page; never skip levels — choose `size` for looks. */
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { level, size, glow, className, ...props },
  ref,
) {
  return createElement(`h${level}`, {
    ref,
    className: cn(
      'font-display text-fg',
      headingSize[size ?? defaultSize[level]],
      glow && 'text-glow',
      className,
    ),
    ...props,
  });
});

export type TextProps = HTMLAttributes<HTMLElement> & {
  as?: 'p' | 'span' | 'div' | 'small' | 'strong' | 'em' | 'figcaption' | 'li';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  tone?: 'default' | 'muted' | 'accent' | 'danger' | 'success';
  /** Uppercase tracking label style ("eyebrow"). */
  eyebrow?: boolean;
};

const textSizes = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
} as const;

const tones = {
  default: 'text-fg',
  muted: 'text-muted',
  accent: 'text-sunrise-strong',
  danger: 'text-danger',
  success: 'text-success',
} as const;

export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  { as = 'p', size = 'base', tone = 'default', eyebrow, className, ...props },
  ref,
) {
  return createElement(as, {
    ref,
    className: cn(
      textSizes[size],
      tones[tone],
      eyebrow && 'font-display text-xs font-medium uppercase tracking-[0.2em]',
      className,
    ),
    ...props,
  });
});
