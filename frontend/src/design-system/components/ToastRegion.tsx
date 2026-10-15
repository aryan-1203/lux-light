import { AnimatePresence, motion } from 'framer-motion';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore, type Toast } from '@/stores/ui';
import { cn } from '../cn';
import { transitions } from '../motion';
import { Icon } from './Icon';

const DEFAULT_DURATION = { info: 5000, success: 4000, error: 8000 } as const;
const toneIcon = { info: Info, success: CircleCheck, error: CircleAlert } as const;
const toneClass = {
  info: 'text-info',
  success: 'text-success',
  error: 'text-danger',
} as const;

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const { t } = useTranslation('common');
  const [paused, setPaused] = useState(false);
  const remaining = useRef(toast.durationMs ?? DEFAULT_DURATION[toast.tone]);
  const startedAt = useRef(0);

  useEffect(() => {
    if (paused || remaining.current <= 0) return;
    startedAt.current = Date.now();
    const timer = window.setTimeout(() => onDismiss(toast.id), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [paused, toast.id, onDismiss]);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: transitions.ui }}
      exit={{ opacity: 0, scale: 0.98, transition: transitions.uiExit }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto flex w-full items-start gap-3 rounded-lg border border-border bg-surface-2 p-4 shadow-overlay"
    >
      <Icon icon={toneIcon[toast.tone]} className={cn('mt-0.5', toneClass[toast.tone])} />
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-medium text-fg">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-sm text-muted">{toast.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label={t('actions.dismiss')}
        className="-m-2 inline-flex size-touch shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-fast hover:bg-surface-3 hover:text-fg"
      >
        <Icon icon={X} size="sm" />
      </button>
    </motion.li>
  );
}

/**
 * Toast region bound to useUIStore (PLAN §6.4): visual toasts + persistent role=status /
 * role=alert live regions that announce the latest message; never steals focus.
 * Auto-dismiss (4–8s by tone), paused while hovered or focused.
 */
export function ToastRegion() {
  const { t } = useTranslation('common');
  const toasts = useUIStore((s) => s.toasts);
  const dismiss = useUIStore((s) => s.dismissToast);
  const text = (x?: Toast) => (x ? [x.title, x.description].filter(Boolean).join('. ') : '');
  const lastPolite = text([...toasts].reverse().find((x) => x.tone !== 'error'));
  const lastAlert = text([...toasts].reverse().find((x) => x.tone === 'error'));
  return (
    <section
      aria-label={t('a11y.notifications')}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-toast flex justify-center p-4 pb-safe sm:inset-x-auto sm:right-0 sm:justify-end"
    >
      {/* Persistent live regions: announcements without moving focus (WCAG 4.1.3). */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {lastPolite}
      </div>
      <div role="alert" aria-atomic="true" className="sr-only">
        {lastAlert}
      </div>
      <ol className="flex w-full max-w-sm flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </ol>
    </section>
  );
}
