import { cn } from '../cn';
import { LampDesk } from './LampDesk';
import { LampGo } from './LampGo';
import { LampPanel } from './LampPanel';
import type { LampIllustrationProps } from './shared';

export type ProductIllustrationProps = LampIllustrationProps & {
  /** Product slug (dawnlit-desk / dawnlit-panel / dawnlit-go) or category slug. */
  slug: string;
};

/** Picks the lamp illustration for a product — the fallback when no product photo exists. */
export function ProductIllustration({ slug, className, ...props }: ProductIllustrationProps) {
  const cls = cn('h-full w-full', className);
  if (slug.includes('panel')) return <LampPanel className={cls} {...props} />;
  if (slug.includes('go') || slug.includes('portable'))
    return <LampGo className={cls} {...props} />;
  return <LampDesk className={cls} {...props} />;
}
