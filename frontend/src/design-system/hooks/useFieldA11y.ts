import { useId } from 'react';

/**
 * Wires a control to its label, helper text and inline error (WCAG 1.3.1 / 3.3.1):
 * `aria-invalid` + `aria-describedby` (error first, then helper).
 */
export function useFieldA11y(opts: {
  id?: string;
  helperText?: unknown;
  error?: unknown;
  describedBy?: string;
}) {
  const autoId = useId();
  const id = opts.id ?? `f${autoId.replace(/:/g, '')}`;
  const helperId = opts.helperText ? `${id}-help` : undefined;
  const errorId = opts.error ? `${id}-error` : undefined;
  const describedBy = [errorId, helperId, opts.describedBy].filter(Boolean).join(' ') || undefined;
  return {
    id,
    helperId,
    errorId,
    controlProps: {
      id,
      'aria-invalid': opts.error ? (true as const) : undefined,
      'aria-describedby': describedBy,
    },
  };
}
