import { RefreshCw, TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Container, EmptyState, Icon } from '@/design-system';

/** Default ErrorBoundary fallback with a retry and a way home. */
export default function ErrorFallback({ onReset }: { onReset: () => void }) {
  const { t } = useTranslation('common');
  return (
    <Container className="py-section">
      <EmptyState
        icon={TriangleAlert}
        tone="error"
        headingLevel={2}
        title={t('errorBoundary.title')}
        description={t('errorBoundary.description')}
        action={
          <>
            <Button onClick={onReset} leadingIcon={<Icon icon={RefreshCw} size="sm" />}>
              {t('actions.retry')}
            </Button>
            <Button asChild variant="secondary">
              <a href="/">{t('actions.backHome')}</a>
            </Button>
          </>
        }
      />
    </Container>
  );
}
