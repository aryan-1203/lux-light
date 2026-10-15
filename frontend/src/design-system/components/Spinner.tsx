import { useTranslation } from 'react-i18next';
import { cn } from '../cn';

export type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  /** Announced label; pass `null` when a parent already announces busy state. */
  label?: string | null;
  className?: string;
};

const px = { sm: 16, md: 24, lg: 40 } as const;

export function Spinner({ size = 'md', label, className }: SpinnerProps) {
  const { t } = useTranslation('common');
  const text = label === undefined ? t('status.loading') : label;
  const d = px[size];
  return (
    <span
      role={text ? 'status' : undefined}
      className={cn('inline-flex items-center justify-center', className)}
    >
      <svg
        width={d}
        height={d}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="animate-spin motion-reduce:animate-none"
      >
        <circle
          cx="12"
          cy="12"
          r="9.5"
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeWidth="2.5"
        />
        <path
          d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {text ? <span className="sr-only">{text}</span> : null}
    </span>
  );
}
