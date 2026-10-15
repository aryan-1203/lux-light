import { cn } from '../cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const base =
  'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-display font-medium tracking-tight transition-[transform,background-color,color,border-color,box-shadow,opacity] duration-fast ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 aria-disabled:opacity-45 touch-manipulation';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-sunrise text-on-sunrise shadow-glow-sm hover:bg-sunrise-strong hover:shadow-glow focus-visible:shadow-glow',
  secondary:
    'border border-border-strong bg-surface/60 text-fg hover:border-sunrise/70 hover:bg-surface-2',
  ghost: 'text-fg hover:bg-surface-2',
  link: 'text-sunrise-strong underline-offset-4 hover:underline active:scale-100',
  danger: 'border border-danger/60 bg-transparent text-danger hover:bg-danger/10',
};

/** Every size keeps a ≥44px hit area (link variant pads its hit area instead). */
const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-touch rounded-full px-4 text-sm',
  md: 'min-h-touch rounded-full px-6 text-base',
  lg: 'min-h-[3.25rem] rounded-full px-8 text-lg',
  icon: 'size-touch rounded-full p-0',
};

export function buttonVariants(opts?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}): string {
  const variant = opts?.variant ?? 'primary';
  const size = opts?.size ?? 'md';
  return cn(
    base,
    variants[variant],
    variant === 'link' ? 'min-h-touch px-1 text-base' : sizes[size],
    opts?.fullWidth && 'w-full',
    opts?.className,
  );
}
