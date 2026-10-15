import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../cn';
import { Icon } from './Icon';

export type EmptyStateProps = {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  /** Recovery path (button/link) — every empty or error state needs one. */
  action?: ReactNode;
  /** Use role="alert" for failures that the user should hear immediately. */
  tone?: 'neutral' | 'error';
  className?: string;
  headingLevel?: 2 | 3;
};

/** Empty / error state with a clear next action. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  tone = 'neutral',
  className,
  headingLevel = 2,
}: EmptyStateProps) {
  const H = `h${headingLevel}` as const;
  return (
    <div
      role={tone === 'error' ? 'alert' : undefined}
      className={cn('flex flex-col items-center gap-4 px-4 py-12 text-center', className)}
    >
      {icon ? (
        <span
          className={cn(
            'inline-flex size-14 items-center justify-center rounded-full bg-surface-2',
            tone === 'error' ? 'text-danger' : 'text-sunrise-strong',
          )}
        >
          <Icon icon={icon} size="lg" />
        </span>
      ) : null}
      <H className="font-display text-2xl font-semibold text-fg">{title}</H>
      {description ? <p className="max-w-prose text-base text-muted">{description}</p> : null}
      {action ? <div className="mt-2 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  );
}
