import { useTranslation } from 'react-i18next';
import { cn } from '../cn';
import { formatINR } from '../format';

export type PriceProps = {
  paise: number;
  /** Original price; shown struck-through when greater than `paise`. */
  compareAtPaise?: number | null;
  /** Prefix "From" (listing cards with variant price ranges). */
  from?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show "Save ₹X" when discounted. */
  showSavings?: boolean;
  className?: string;
};

const sizes = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-2xl',
  xl: 'text-3xl',
} as const;

/** INR price with optional compare-at strike (screen readers hear "Original price ₹X, now ₹Y"). */
export function Price({
  paise,
  compareAtPaise,
  from,
  size = 'md',
  showSavings,
  className,
}: PriceProps) {
  const { t } = useTranslation('common');
  const discounted = compareAtPaise != null && compareAtPaise > paise;
  return (
    <span
      className={cn('inline-flex flex-wrap items-baseline gap-x-2 gap-y-1', className)}
      data-numeric=""
    >
      {from ? <span className="text-sm text-muted">{t('price.from')}</span> : null}
      <span className={cn('font-display font-semibold tabular-nums text-fg', sizes[size])}>
        {discounted ? <span className="sr-only">{t('price.current')} </span> : null}
        {formatINR(paise)}
      </span>
      {discounted ? (
        <>
          <s className="text-sm tabular-nums text-muted decoration-muted/70">
            <span className="sr-only">{t('price.original')} </span>
            {formatINR(compareAtPaise)}
          </s>
          {showSavings ? (
            <span className="text-sm font-medium text-success">
              {t('price.save', { amount: formatINR(compareAtPaise - paise) })}
            </span>
          ) : null}
        </>
      ) : null}
    </span>
  );
}
