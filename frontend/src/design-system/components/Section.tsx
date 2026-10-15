import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../cn';

export type SectionProps = HTMLAttributes<HTMLElement> & {
  spacing?: 'default' | 'sm' | 'none';
  tone?: 'bg' | 'surface' | 'transparent';
  as?: 'section' | 'div' | 'aside' | 'article';
};

/** Vertical rhythm block. Give it `aria-labelledby` pointing at its heading for landmarks. */
export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  { spacing = 'default', tone = 'transparent', as: Comp = 'section', className, ...props },
  ref,
) {
  return (
    <Comp
      ref={ref as never}
      className={cn(
        'relative',
        spacing === 'default' && 'py-section',
        spacing === 'sm' && 'py-section-sm',
        tone === 'bg' && 'bg-bg',
        tone === 'surface' && 'bg-surface',
        className,
      )}
      {...props}
    />
  );
});
