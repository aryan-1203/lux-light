import { Check } from 'lucide-react';
import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../cn';
import { useFieldA11y } from '../hooks/useFieldA11y';
import { FieldMessages, type FieldBaseProps } from './Field';
import { Icon } from './Icon';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> &
  Omit<FieldBaseProps, 'hideLabel'>;

/** Native checkbox (RHF `register` works directly); the whole row is a ≥44px target. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, helperText, error, containerClassName, className, id, ...props },
  ref,
) {
  const a11y = useFieldA11y({ id, helperText, error, describedBy: props['aria-describedby'] });
  return (
    <div className={containerClassName}>
      <label
        htmlFor={a11y.id}
        className="group flex min-h-touch cursor-pointer items-center gap-3 py-1"
      >
        <span className="relative inline-flex size-5 shrink-0">
          <input
            ref={ref}
            type="checkbox"
            className={cn(
              'peer size-5 cursor-pointer appearance-none rounded-sm border border-border-strong bg-surface-2 transition-colors duration-fast checked:border-sunrise checked:bg-sunrise disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger',
              className,
            )}
            {...props}
            {...a11y.controlProps}
          />
          <Icon
            icon={Check}
            size="sm"
            strokeWidth={3}
            className="pointer-events-none absolute left-0.5 top-0.5 text-on-sunrise opacity-0 transition-opacity duration-fast peer-checked:opacity-100"
          />
        </span>
        <span className="text-base text-fg">{label}</span>
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
