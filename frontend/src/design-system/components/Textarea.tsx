import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../cn';
import { useFieldA11y } from '../hooks/useFieldA11y';
import { controlClasses, FieldLabel, FieldMessages, type FieldBaseProps } from './Field';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldBaseProps;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    hideLabel,
    helperText,
    error,
    containerClassName,
    className,
    id,
    required,
    rows = 4,
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
      <textarea
        ref={ref}
        rows={rows}
        required={required}
        className={cn(controlClasses, 'min-h-[7rem] resize-y leading-relaxed', className)}
        {...props}
        {...a11y.controlProps}
      />
      <FieldMessages
        helperId={a11y.helperId}
        helperText={helperText}
        errorId={a11y.errorId}
        error={error}
      />
    </div>
  );
});
