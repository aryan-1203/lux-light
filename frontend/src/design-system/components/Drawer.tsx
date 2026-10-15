import * as RadixDialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../cn';
import { useLenisLock } from '../hooks/useLenis';
import { useReturnFocus } from '../hooks/useReturnFocus';
import { overlayFade, slideFrom, transitions } from '../motion';
import { Button } from './Button';
import { Icon } from './Icon';

export type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  hideTitle?: boolean;
  description?: ReactNode;
  side?: 'right' | 'left' | 'bottom';
  children?: ReactNode;
  /** Pinned footer (totals, CTA). */
  footer?: ReactNode;
  /** Extra header content next to the title (e.g. item count). */
  headerAside?: ReactNode;
  className?: string;
  /** Accessible id hook for tests / e2e. */
  'data-testid'?: string;
};

const panelPosition = {
  right: 'inset-y-0 right-0 h-dvh w-full max-w-md border-l',
  left: 'inset-y-0 left-0 h-dvh w-full max-w-sm border-r',
  bottom: 'inset-x-0 bottom-0 max-h-[88dvh] w-full rounded-t-2xl border-t',
} as const;

/**
 * Off-canvas panel (Radix Dialog semantics): focus trap, Esc, scroll lock (+ Lenis paused),
 * focus return, spring slide (transform only).
 */
export function Drawer({
  open,
  onOpenChange,
  title,
  hideTitle,
  description,
  side = 'right',
  children,
  footer,
  headerAside,
  className,
  'data-testid': testId,
}: DrawerProps) {
  const { t } = useTranslation('common');
  useLenisLock(open);
  const onCloseAutoFocus = useReturnFocus(open);
  const slide = slideFrom[side];
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <RadixDialog.Portal forceMount>
            <RadixDialog.Overlay asChild forceMount>
              <motion.div
                {...overlayFade}
                className="fixed inset-0 z-overlay bg-bg/70 backdrop-blur-sm"
              />
            </RadixDialog.Overlay>
            <RadixDialog.Content
              asChild
              forceMount
              {...(description ? {} : { 'aria-describedby': undefined })}
              onCloseAutoFocus={onCloseAutoFocus}
            >
              <motion.div
                initial={slide.initial}
                animate={slide.animate}
                exit={{ ...slide.exit, transition: transitions.uiExit }}
                transition={transitions.sheet}
                data-lenis-prevent=""
                data-testid={testId}
                className={cn(
                  'fixed z-drawer flex flex-col border-border bg-surface shadow-overlay',
                  panelPosition[side],
                  className,
                )}
              >
                <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3 pt-safe">
                  <div className="flex min-w-0 items-center gap-3">
                    <RadixDialog.Title
                      className={cn(
                        'truncate font-display text-xl font-semibold text-fg',
                        hideTitle && 'sr-only',
                      )}
                    >
                      {title}
                    </RadixDialog.Title>
                    {headerAside}
                  </div>
                  <RadixDialog.Close asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t('actions.close')}
                      className="-mr-2"
                    >
                      <Icon icon={X} />
                    </Button>
                  </RadixDialog.Close>
                </div>
                {description ? (
                  <RadixDialog.Description className="px-5 pt-3 text-sm text-muted">
                    {description}
                  </RadixDialog.Description>
                ) : null}
                <div className="scrollbar-thin flex-1 overflow-y-auto overscroll-contain px-5 py-4">
                  {children}
                </div>
                {footer ? (
                  <div className="border-t border-border px-5 pt-4 pb-safe">{footer}</div>
                ) : null}
              </motion.div>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        ) : null}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}
