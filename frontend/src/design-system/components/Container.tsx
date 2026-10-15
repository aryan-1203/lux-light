import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../cn';

export type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  size?: 'content' | 'narrow' | 'prose' | 'full';
};

const widths = {
  content: 'max-w-content',
  narrow: 'max-w-narrow',
  prose: 'max-w-prose',
  full: 'max-w-none',
} as const;

/** Horizontal rhythm: centred, fluid gutter (16px on phones → 40px desktop). */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container(
  { size = 'content', className, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cn('mx-auto w-full px-gutter', widths[size], className)} {...props} />
  );
});
