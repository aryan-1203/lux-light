import { Slot, Slottable } from '@radix-ui/react-slot';
import { forwardRef, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from 'react';
import { cn } from '../cn';
import { buttonVariants, type ButtonSize, type ButtonVariant } from './buttonStyles';
import { Spinner } from './Spinner';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Shows a spinner, sets aria-busy and blocks clicks (keeps the label for width stability). */
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  /**
   * Render the single child element instead of a <button> (e.g. a router <Link>):
   * `<Button asChild><Link to="/shop">Shop</Link></Button>`.
   */
  asChild?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth,
    loading = false,
    leadingIcon,
    trailingIcon,
    asChild = false,
    className,
    disabled,
    children,
    type,
    onClick,
    ...props
  },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      className={buttonVariants({ variant, size, fullWidth, className })}
      {...(asChild ? {} : { type: type ?? 'button', disabled })}
      aria-busy={loading || undefined}
      aria-disabled={asChild && disabled ? true : undefined}
      data-loading={loading || undefined}
      onClick={
        loading || (asChild && disabled)
          ? (e: MouseEvent<HTMLButtonElement>) => e.preventDefault()
          : onClick
      }
      {...props}
    >
      {loading ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size="sm" label={null} />
        </span>
      ) : null}
      {asChild ? (
        <Slottable>{children}</Slottable>
      ) : (
        <span className={cn('inline-flex items-center gap-2', loading && 'invisible')}>
          {leadingIcon}
          {children}
          {trailingIcon}
        </span>
      )}
    </Comp>
  );
});
