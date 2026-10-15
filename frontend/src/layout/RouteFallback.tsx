import { useTranslation } from 'react-i18next';
import { Container, Skeleton } from '@/design-system';

/** Suspense fallback for lazy routes: reserves page-like space (no layout jump when content lands). */
export default function RouteFallback() {
  const { t } = useTranslation('common');
  return (
    <Container className="min-h-[70dvh] py-section" aria-busy="true">
      <span role="status" className="sr-only">
        {t('status.loadingPage')}
      </span>
      <Skeleton shape="text" className="mb-4 h-4 w-28" />
      <Skeleton className="mb-6 h-12 w-3/4 max-w-xl" />
      <Skeleton shape="text" className="mb-2 w-full max-w-prose" />
      <Skeleton shape="text" className="mb-10 w-2/3 max-w-prose" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} style={{ aspectRatio: '4 / 5' }} />
        ))}
      </div>
    </Container>
  );
}
