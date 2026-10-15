import type { LucideIcon, LucideProps } from 'lucide-react';
import { cn } from '../cn';

const sizes = { xs: 14, sm: 16, md: 20, lg: 24, xl: 32 } as const;
export type IconSize = keyof typeof sizes;

export type IconProps = Omit<LucideProps, 'size' | 'ref'> & {
  icon: LucideIcon;
  size?: IconSize;
  /** Accessible name. Omit for decorative icons next to visible text (hidden from AT). */
  label?: string;
};

/** lucide-react wrapper: consistent sizes/stroke, decorative by default (PLAN §6.4: SVG icons only). */
export function Icon({
  icon: Glyph,
  size = 'md',
  label,
  className,
  strokeWidth = 1.75,
  ...props
}: IconProps) {
  const a11y = label
    ? ({ role: 'img', 'aria-label': label } as const)
    : ({ 'aria-hidden': true, focusable: false } as const);
  return (
    <Glyph
      size={sizes[size]}
      strokeWidth={strokeWidth}
      className={cn('shrink-0', className)}
      {...a11y}
      {...props}
    />
  );
}
