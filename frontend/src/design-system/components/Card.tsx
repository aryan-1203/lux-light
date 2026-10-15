import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../cn';

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  as?: 'div' | 'article' | 'section';
  /** Hover lift + border glow (use when the whole card is a link target). */
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  elevation?: 'surface' | 'surface-2';
};

const pads = { none: '', sm: 'p-4', md: 'p-5 md:p-6', lg: 'p-6 md:p-8' } as const;

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { as: Comp = 'div', interactive, padding = 'md', elevation = 'surface', className, ...props },
  ref,
) {
  return (
    <Comp
      ref={ref as never}
      className={cn(
        'relative rounded-xl border border-border shadow-card',
        elevation === 'surface' ? 'bg-surface' : 'bg-surface-2',
        pads[padding],
        interactive &&
          'transition-[transform,border-color,box-shadow] duration-ui ease-out focus-within:border-sunrise/40 hover:-translate-y-1 hover:border-sunrise/40 hover:shadow-raised motion-reduce:hover:translate-y-0',
        className,
      )}
      {...props}
    />
  );
});
