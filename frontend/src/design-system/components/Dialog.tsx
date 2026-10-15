import * as RadixDialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../cn';
import { useLenisLock } from '../hooks/useLenis';
import { useReturnFocus } from '../hooks/useReturnFocus';
import { overlayFade, scaleIn } from '../motion';
import { Button } from './Button';
import { Icon } from './Icon';

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  /** Visually hide the title (still the accessible name). */
  hideTitle?: boolean;
  description?: ReactNode;
  children?: ReactNode;
  /** Sticky action row. */
  footer?: ReactNode;
  /** Optional trigger element (focus returns to it on close either way). */
  trigger?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Prevent closing on overlay click / Esc (e.g. payment in progress). */
  dismissible?: boolean;
  className?: string;
};

const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' } as const;

/**
 * Modal dialog (Radix): focus trap, Esc closes, scroll lock (+ Lenis paused), aria-modal,
 * focus returns to the trigger. Enter/exit animated with AnimatePresence (scale+fade).
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  hideTitle,
  description,
  children,
  footer,
  trigger,
  size = 'md',
  dismissible = true,
  className,
}: DialogProps) {
  const { t } = useTranslation('common');
  useLenisLock(open);
  const onCloseAutoFocus = useReturnFocus(open);
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger> : null}
      <AnimatePresence>
        {open ? (
          <RadixDialog.Portal forceMount>
            <RadixDialog.Overlay asChild forceMount>
              <motion.div
                {...overlayFade}
                className="fixed inset-0 z-overlay bg-bg/75 backdrop-blur-sm"
              />
            </RadixDialog.Overlay>
            <div className="pointer-events-none fixed inset-0 z-modal flex items-end justify-center p-0 sm:items-center sm:p-6">
              <RadixDialog.Content
                asChild
                forceMount
                {...(description ? {} : { 'aria-describedby': undefined })}
                onCloseAutoFocus={onCloseAutoFocus}
                onEscapeKeyDown={(e) => {
                  if (!dismissible) e.preventDefault();
                }}
                onPointerDownOutside={(e) => {
                  if (!dismissible) e.preventDefault();
                }}
                onInteractOutside={(e) => {
                  if (!dismissible) e.preventDefault();
                }}
              >
                <motion.div
                  variants={scaleIn}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  data-lenis-prevent=""
                  className={cn(
                    'pointer-events-auto relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-overlay sm:rounded-2xl',
                    widths[size],
                    className,
                  )}
                >
                  <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
                    <div>
                      <RadixDialog.Title
                        className={cn(
                          'font-display text-2xl font-semibold text-fg',
                          hideTitle && 'sr-only',
                        )}
                      >
                        {title}
                      </RadixDialog.Title>
                      {description ? (
                        <RadixDialog.Description className="mt-1 text-base text-muted">
                          {description}
                        </RadixDialog.Description>
                      ) : null}
                    </div>
                    {dismissible ? (
                      <RadixDialog.Close asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t('actions.close')}
                          className="-mr-2 -mt-2"
                        >
                          <Icon icon={X} />
                        </Button>
                      </RadixDialog.Close>
                    ) : null}
                  </div>
                  <div className="scrollbar-thin flex-1 overflow-y-auto px-6 pb-6">{children}</div>
                  {footer ? (
                    <div className="flex flex-wrap justify-end gap-3 border-t border-border px-6 pt-4 pb-safe">
                      {footer}
                    </div>
                  ) : null}
                </motion.div>
              </RadixDialog.Content>
            </div>
          </RadixDialog.Portal>
        ) : null}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}
