import { ChevronDown } from 'lucide-react';
import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../cn';
import { useFieldA11y } from '../hooks/useFieldA11y';
import { controlClasses, FieldLabel, FieldMessages, type FieldBaseProps } from './Field';
import { Icon } from './Icon';

export type SelectOption = { value: string; label: string; disabled?: boolean };

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> &
  FieldBaseProps & {
    options?: SelectOption[];
    /** Adds a first empty option (e.g. "Select a state"). */
    placeholder?: string;
  };

/** Native select (best on mobile: OS picker, full keyboard + AT support). */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    hideLabel,
    helperText,
    error,
    containerClassName,
    className,
    id,
    required,
    options,
    placeholder,
    children,
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
        <select
          ref={ref}
          required={required}
          className={cn(controlClasses, 'appearance-none pr-11', className)}
          {...props}
          {...a11y.controlProps}
        >
          {placeholder !== undefined ? (
            <option value="" disabled={required}>
              {placeholder}
            </option>
          ) : null}
          {options?.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
          {children}
        </select>
        <Icon
          icon={ChevronDown}
          size="md"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        />
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
