import { Star } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../cn';
import { formatNumber } from '../format';

const starSize = { sm: 14, md: 18, lg: 22 } as const;

export type RatingProps = {
  /** 0–5, fractional allowed (e.g. 4.6). */
  value: number;
  count?: number;
  size?: keyof typeof starSize;
  showValue?: boolean;
  className?: string;
};

/** Read-only star rating with a single accessible label ("Rated 4.6 out of 5, 12 reviews"). */
export function Rating({ value, count, size = 'md', showValue = false, className }: RatingProps) {
  const { t } = useTranslation('common');
  const v = Math.max(0, Math.min(5, value));
  const rounded = Math.round(v * 10) / 10;
  const label =
    count === undefined
      ? t('rating.label', { value: rounded })
      : t('rating.labelWithCount', { value: rounded, count, formattedCount: formatNumber(count) });
  return (
    <span role="img" aria-label={label} className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative inline-flex" aria-hidden="true">
        <span className="flex text-border-strong">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} size={starSize[size]} strokeWidth={1.5} />
          ))}
        </span>
        <span
          className="absolute inset-0 flex overflow-hidden text-sunrise"
          style={{ width: `${(v / 5) * 100}%` }}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              size={starSize[size]}
              strokeWidth={1.5}
              fill="currentColor"
              className="shrink-0"
            />
          ))}
        </span>
      </span>
      {showValue || count !== undefined ? (
        <span aria-hidden="true" className="text-sm tabular-nums text-muted">
          {showValue ? rounded.toFixed(1) : null}
          {count !== undefined ? ` (${formatNumber(count)})` : null}
        </span>
      ) : null}
    </span>
  );
}

export type RatingInputProps = {
  name: string;
  value: number | null;
  onChange: (value: number) => void;
  legend: string;
  error?: string;
};

/** Accessible 1–5 star picker built from native radios (arrow keys work). */
export function RatingInput({ name, value, onChange, legend, error }: RatingInputProps) {
  const { t } = useTranslation('common');
  const base = useId().replace(/:/g, '');
  return (
    <fieldset
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${base}-err` : undefined}
    >
      <legend className="mb-1 font-display text-sm font-medium text-fg">{legend}</legend>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className="inline-flex size-touch cursor-pointer items-center justify-center"
          >
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="peer sr-only"
            />
            <span className="sr-only">{t('rating.stars', { count: n })}</span>
            <Star
              aria-hidden="true"
              size={28}
              strokeWidth={1.5}
              className={cn(
                'rounded-sm transition-colors duration-fast peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus',
                value !== null && n <= value ? 'fill-sunrise text-sunrise' : 'text-border-strong',
              )}
            />
          </label>
        ))}
      </div>
      {error ? (
        <p id={`${base}-err`} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
