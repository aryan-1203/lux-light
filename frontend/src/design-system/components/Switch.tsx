import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../cn';
import { useFieldA11y } from '../hooks/useFieldA11y';
import { FieldMessages, type FieldBaseProps } from './Field';

export type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role'> &
  Omit<FieldBaseProps, 'hideLabel'>;

/** On/off toggle: a native checkbox with role="switch" (Space toggles, RHF-compatible). */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, helperText, error, containerClassName, className, id, ...props },
  ref,
) {
  const a11y = useFieldA11y({ id, helperText, error, describedBy: props['aria-describedby'] });
  return (
    <div className={containerClassName}>
      <label
        htmlFor={a11y.id}
        className="flex min-h-touch cursor-pointer items-center justify-between gap-4 py-1"
      >
        <span className="text-base text-fg">{label}</span>
        <span className="relative inline-flex h-7 w-12 shrink-0 items-center">
          <input
            ref={ref}
            type="checkbox"
            role="switch"
            className={cn(
              'peer absolute inset-0 cursor-pointer appearance-none rounded-full border border-border-strong bg-surface-3 transition-colors duration-fast checked:border-sunrise checked:bg-sunrise disabled:cursor-not-allowed disabled:opacity-50',
              className,
            )}
            {...props}
            {...a11y.controlProps}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1 size-5 rounded-full bg-fg shadow-card transition-transform duration-ui ease-out peer-checked:translate-x-5 peer-checked:bg-on-sunrise"
          />
        </span>
      </label>
      <FieldMessages
        helperId={a11y.helperId}
        helperText={helperText}
        errorId={a11y.errorId}
        error={error}
      />
    </div>
  );
});
