import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../cn';
import { FieldMessages } from './Field';

export type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode;
  description?: ReactNode;
};

/** Native radio; group several with the same `name` inside <RadioGroup>. */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, description, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? `r${autoId.replace(/:/g, '')}`;
  const labelId = `${inputId}-label`;
  const descId = description ? `${inputId}-desc` : undefined;
  return (
    <label htmlFor={inputId} className="flex min-h-touch cursor-pointer items-start gap-3 py-2">
      <input
        ref={ref}
        id={inputId}
        type="radio"
        aria-labelledby={labelId}
        aria-describedby={descId}
        className={cn(
          'mt-0.5 size-5 shrink-0 cursor-pointer appearance-none rounded-full border border-border-strong bg-surface-2 transition-[border-width,border-color] duration-fast checked:border-[6px] checked:border-sunrise disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
      <span className="flex flex-col">
        <span id={labelId} className="text-base text-fg">
          {label}
        </span>
        {description ? (
          <span id={descId} className="text-sm text-muted">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
});

export type RadioGroupProps = {
  legend: ReactNode;
  hideLegend?: boolean;
  helperText?: ReactNode;
  error?: string;
  required?: boolean;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
  children: ReactNode;
};

/** fieldset + legend wrapper with group-level helper/error. */
export function RadioGroup({
  legend,
  hideLegend,
  helperText,
  error,
  required,
  orientation = 'vertical',
  className,
  children,
}: RadioGroupProps) {
  const autoId = useId();
  const base = `rg${autoId.replace(/:/g, '')}`;
  const helperId = helperText ? `${base}-help` : undefined;
  const errorId = error ? `${base}-error` : undefined;
  return (
    <fieldset
      className={className}
      aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
      aria-invalid={error ? true : undefined}
      aria-required={required || undefined}
    >
      <legend
        className={cn(hideLegend ? 'sr-only' : 'mb-1 font-display text-sm font-medium text-fg')}
      >
        {legend}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-sunrise-strong">
            *
          </span>
        ) : null}
      </legend>
      <div
        className={cn(
          'flex',
          orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap gap-x-6',
        )}
      >
        {children}
      </div>
      <FieldMessages helperId={helperId} helperText={helperText} errorId={errorId} error={error} />
    </fieldset>
  );
}
