"use client";

import { forwardRef, useId, type ComponentProps, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

/* Shared look: 56px tall, 16px text (no iOS zoom), visible label above, error below. */
const control =
  "block h-14 w-full rounded-sm border border-line-strong/70 bg-bg-raise px-4 text-base text-fg placeholder:text-fg-muted/70 transition-[border-color,box-shadow] duration-[var(--dur-micro)] ease-[ease] focus-visible:border-[#f5a524] focus-visible:shadow-[0_0_0_4px_rgb(255_185_56/0.25)] focus-visible:outline-none aria-[invalid=true]:border-danger";

type FieldShellProps = {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  children: ReactNode;
  className?: string;
};

export function FieldShell({ id, label, error, hint, optional, children, className }: FieldShellProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 flex items-baseline justify-between gap-3 text-small font-medium text-fg">
        {label}
        {optional && <span className="text-[0.8125rem] font-normal text-fg-muted">Optional</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-[0.8125rem] text-fg-muted">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <p id={id} className={cn("text-[0.8125rem] text-danger", message ? "mt-1.5" : "sr-only")} aria-live="polite">
      {message}
    </p>
  );
}

type InputProps = Omit<ComponentProps<"input">, "id"> & {
  label: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  prefix?: string;
};

export const TextField = forwardRef<HTMLInputElement, InputProps>(function TextField(
  { label, error, hint, optional, prefix, className, ...rest },
  ref,
) {
  const id = useId();
  const describedBy = [hint && !error ? `${id}-hint` : null, `${id}-error`].filter(Boolean).join(" ");
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} optional={optional} className={className}>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-mono text-base text-fg-muted">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(control, prefix && "pl-14")}
          {...rest}
        />
      </div>
    </FieldShell>
  );
});

type SelectProps = Omit<ComponentProps<"select">, "id"> & {
  label: string;
  error?: string;
  options: readonly string[];
  placeholder?: string;
};

/** Native select: the most reliable picker on phones. */
export const SelectField = forwardRef<HTMLSelectElement, SelectProps>(function SelectField(
  { label, error, options, placeholder = "Select…", className, ...rest },
  ref,
) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} className={className}>
      <div className="relative">
        <select
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-error`}
          defaultValue=""
          className={cn(control, "cursor-pointer appearance-none pr-11 invalid:text-fg-muted")}
          required
          {...rest}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-fg-muted"
        />
      </div>
    </FieldShell>
  );
});

/* ---------- Choice groups (checkbox chips, radio cards) ---------- */

type Option = { value: string; label: string };

export function ChipGroup({
  legend,
  options,
  value,
  onChange,
  onBlur,
  error,
}: {
  legend: string;
  options: readonly Option[];
  value: string[];
  onChange: (next: string[]) => void;
  onBlur?: () => void;
  error?: string;
}) {
  const id = useId();
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <fieldset aria-describedby={`${id}-error`} aria-invalid={error ? true : undefined}>
      <legend className="mb-3 text-small font-medium text-fg">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const checked = value.includes(o.value);
          return (
            <label
              key={o.value}
              className={cn(
                "relative inline-flex h-11 cursor-pointer items-center gap-2 rounded-pill border px-4 text-small font-medium transition-[background-color,border-color,color,scale] duration-[var(--dur-micro)] ease-out select-none active:scale-[0.97] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-fg",
                checked
                  ? "border-[#f5a524] bg-glow text-fg"
                  : "border-line-strong/60 bg-bg-raise text-fg hover-fine:border-fg/50",
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => toggle(o.value)}
                onBlur={onBlur}
              />
              <span
                aria-hidden
                className={cn(
                  "grid size-4 place-items-center rounded-full border transition-[background-color,border-color] duration-[var(--dur-micro)]",
                  checked ? "border-sun bg-sun text-fg" : "border-line-strong",
                )}
              >
                {checked && <Check className="size-3" strokeWidth={3} />}
              </span>
              {o.label}
            </label>
          );
        })}
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </fieldset>
  );
}

export function RadioCards({
  legend,
  name,
  options,
  value,
  onChange,
  onBlur,
  error,
  columns = 3,
}: {
  legend: string;
  name: string;
  options: readonly Option[];
  value?: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  columns?: 2 | 3;
}) {
  const id = useId();
  return (
    <fieldset aria-describedby={`${id}-error`} aria-invalid={error ? true : undefined}>
      <legend className="mb-3 text-small font-medium text-fg">{legend}</legend>
      <div className={cn("grid gap-2", columns === 3 ? "grid-cols-3" : "grid-cols-2")}>
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={cn(
                "flex min-h-[52px] cursor-pointer items-center justify-center rounded-sm border px-3 text-center text-small font-medium transition-[background-color,border-color,scale] duration-[var(--dur-micro)] ease-out select-none active:scale-[0.98] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-fg",
                checked
                  ? "border-[#f5a524] bg-glow text-fg"
                  : "border-line-strong/60 bg-bg-raise text-fg hover-fine:border-fg",
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                className="sr-only"
                checked={checked}
                onChange={() => onChange(o.value)}
                onBlur={onBlur}
              />
              {o.label}
            </label>
          );
        })}
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </fieldset>
  );
}

type CheckboxProps = Omit<ComponentProps<"input">, "id" | "type"> & { label: ReactNode; error?: string };

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxProps>(function CheckboxField(
  { label, error, className, ...rest },
  ref,
) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="group flex cursor-pointer items-start gap-3 text-small text-fg">
        <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={`${id}-error`}
            className="peer size-5 cursor-pointer appearance-none rounded-[6px] border border-line-strong bg-bg-raise transition-[background-color,border-color] duration-[var(--dur-micro)] checked:border-accent-fg checked:bg-accent-fg aria-[invalid=true]:border-danger"
            {...rest}
          />
          <Check
            aria-hidden
            className="pointer-events-none absolute size-3.5 text-bg opacity-0 transition-opacity duration-[var(--dur-micro)] peer-checked:opacity-100"
            strokeWidth={3}
          />
        </span>
        <span className="leading-snug">{label}</span>
      </label>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
});
