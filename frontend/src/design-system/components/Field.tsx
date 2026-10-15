import type { ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { cn } from '../cn';
import { Icon } from './Icon';

export type FieldBaseProps = {
  /** Visible label (required — placeholders are not labels). */
  label: ReactNode;
  /** Visually hide the label (still announced). Use sparingly, e.g. search inputs with an icon. */
  hideLabel?: boolean;
  helperText?: ReactNode;
  /** Inline error message (e.g. RHF `errors.email?.message`). Sets aria-invalid. */
  error?: string;
  containerClassName?: string;
};

export const controlClasses =
  'block w-full min-h-touch rounded-md border border-border-strong bg-surface-2 px-4 py-2.5 text-base text-fg placeholder:text-muted transition-[border-color,box-shadow] duration-fast ease-out hover:border-muted focus-visible:border-sunrise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50 read-only:border-dashed aria-[invalid=true]:border-danger';

export function FieldLabel({
  htmlFor,
  required,
  hidden,
  children,
  className,
}: {
  htmlFor: string;
  required?: boolean;
  hidden?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        hidden ? 'sr-only' : 'mb-1.5 block font-display text-sm font-medium text-fg',
        className,
      )}
    >
      {children}
      {required ? (
        <span aria-hidden="true" className="ml-0.5 text-sunrise-strong">
          *
        </span>
      ) : null}
    </label>
  );
}

/** Helper + inline error below a control. The live wrapper announces errors as they appear. */
export function FieldMessages({
  helperId,
  helperText,
  errorId,
  error,
}: {
  helperId?: string;
  helperText?: ReactNode;
  errorId?: string;
  error?: string;
}) {
  return (
    <>
      {helperText ? (
        <p id={helperId} className="mt-1.5 text-sm text-muted">
          {helperText}
        </p>
      ) : null}
      <div aria-live="polite">
        {error ? (
          <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-sm text-danger">
            <Icon icon={CircleAlert} size="sm" className="mt-0.5" />
            <span>{error}</span>
          </p>
        ) : null}
      </div>
    </>
  );
}
