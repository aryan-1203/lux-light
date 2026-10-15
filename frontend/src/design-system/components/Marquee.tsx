import { Pause, Play } from 'lucide-react';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../cn';
import { useReducedMotionSafe } from '../motion';
import { Icon } from './Icon';

export type MarqueeProps = {
  /** Items rendered in a row; duplicated once (aria-hidden) for a seamless loop. */
  children: ReactNode;
  /** Seconds per loop. */
  duration?: number;
  /** Accessible name for the region. */
  label: string;
  className?: string;
  /** Show the pause/play control (WCAG 2.2.2). Default true. */
  showControl?: boolean;
};

/**
 * Infinite CSS marquee (transform only). Pauses on hover and keyboard focus within, has a
 * pause button, and renders static/wrapped under prefers-reduced-motion.
 */
export function Marquee({
  children,
  duration = 40,
  label,
  className,
  showControl = true,
}: MarqueeProps) {
  const { t } = useTranslation('common');
  const reduce = useReducedMotionSafe();
  const [paused, setPaused] = useState(false);

  if (reduce) {
    return (
      <section
        aria-label={label}
        className={cn('flex flex-wrap items-center justify-center gap-x-10 gap-y-4', className)}
      >
        {children}
      </section>
    );
  }

  return (
    <section aria-label={label} className={cn('group relative flex items-center', className)}>
      <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
        <div
          className={cn(
            'flex w-max animate-marquee group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused]',
            paused && '[animation-play-state:paused]',
          )}
          style={{ '--marquee-duration': `${duration}s` } as CSSProperties}
        >
          <div className="flex shrink-0 items-center gap-10 pr-10">{children}</div>
          <div
            className="flex shrink-0 items-center gap-10 pr-10"
            aria-hidden="true"
            ref={(el) => el?.setAttribute('inert', '')}
          >
            {children}
          </div>
        </div>
      </div>
      {showControl ? (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          aria-label={paused ? t('actions.playAnimation') : t('actions.pauseAnimation')}
          className="ml-2 inline-flex size-touch shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-fast hover:bg-surface-2 hover:text-fg"
        >
          <Icon icon={paused ? Play : Pause} size="sm" />
        </button>
      ) : null}
    </section>
  );
}
