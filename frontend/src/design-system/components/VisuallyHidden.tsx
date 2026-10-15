import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../cn';

export type VisuallyHiddenProps = HTMLAttributes<HTMLSpanElement> & {
  /** Becomes visible when focused (e.g. skip links). */
  focusable?: boolean;
};

/** Content for screen readers only. */
export const VisuallyHidden = forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  function VisuallyHidden({ className, focusable = false, ...props }, ref) {
    return (
      <span
        ref={ref}
        className={cn(focusable ? 'sr-only focus:not-sr-only' : 'sr-only', className)}
        {...props}
      />
    );
  },
);
