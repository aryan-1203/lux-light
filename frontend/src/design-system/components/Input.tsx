import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../cn';
import { useFieldA11y } from '../hooks/useFieldA11y';
import { controlClasses, FieldLabel, FieldMessages, type FieldBaseProps } from './Field';

export type InputProps = InputHTMLAttributes<HTMLInputElement> &
  FieldBaseProps & {
    /** Decorative adornments inside the control (icons, "+91"). */
    leading?: ReactNode;
    trailing?: ReactNode;
  };

/**
 * Text input with visible label, helper and inline error. RHF-friendly:
 * `<Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />`
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hideLabel,
    helperText,
    error,
    containerClassName,
    leading,
    trailing,
    className,
    id,
    required,
    ...props
  },
  ref,
) {
  const a11y = useFieldA11y({ id, helperText, error, describedBy: props['aria-describedby'] });
  return (
    <div className={containerClassName}>
      <FieldLabel htmlFor={a11y.id} required={required} hidden={hideLabel}>
        {label}
      </FieldLabel>
      <div className="relative">
        {leading ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
            {leading}
          </span>
        ) : null}
        <input
          ref={ref}
          required={required}
          className={cn(
            controlClasses,
            leading ? 'pl-11' : undefined,
            trailing ? 'pr-12' : undefined,
            className,
          )}
          {...props}
          {...a11y.controlProps}
        />
        {trailing ? (
          <span className="absolute inset-y-0 right-1 flex items-center">{trailing}</span>
        ) : null}
      </div>
      <FieldMessages
        helperId={a11y.helperId}
        helperText={helperText}
        errorId={a11y.errorId}
        error={error}
      />
    </div>
  );
});
