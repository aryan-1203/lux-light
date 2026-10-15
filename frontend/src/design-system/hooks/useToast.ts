import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/api/client';
import { useUIStore, type Toast } from '@/stores/ui';

type ToastInput = Omit<Toast, 'id' | 'tone'>;

/** Imperative toast helpers bound to useUIStore. */
export function useToast() {
  const pushToast = useUIStore((s) => s.pushToast);
  const dismiss = useUIStore((s) => s.dismissToast);
  return useMemo(
    () => ({
      info: (t: ToastInput) => pushToast({ ...t, tone: 'info' }),
      success: (t: ToastInput) => pushToast({ ...t, tone: 'success' }),
      error: (t: ToastInput) => pushToast({ ...t, tone: 'error' }),
      dismiss,
    }),
    [pushToast, dismiss],
  );
}

/** Returns a handler that shows a translated error toast for any thrown error (ApiError aware). */
export function useApiErrorToast() {
  const { t } = useTranslation('errors');
  const pushToast = useUIStore((s) => s.pushToast);
  return (err: unknown, title?: string) => {
    const message = isApiError(err)
      ? t(err.code, { defaultValue: err.message })
      : t('UNKNOWN_ERROR');
    return pushToast(
      title ? { tone: 'error', title, description: message } : { tone: 'error', title: message },
    );
  };
}
