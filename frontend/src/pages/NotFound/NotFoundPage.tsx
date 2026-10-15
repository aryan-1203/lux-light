import { Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { paths } from '@/config/paths';
import { Button, Container, Heading, Icon, Text } from '@/design-system';
import Seo from '@/layout/Seo';

/** 404 (★ owner: 8 Frontend Commerce). */
export default function NotFoundPage() {
  const { t } = useTranslation('common');
  return (
    <>
      <Seo title={t('notFound.title')} description={t('notFound.description')} noindex />
      <Container
        size="narrow"
        className="flex min-h-[70dvh] flex-col items-start justify-center gap-6 py-section"
      >
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-surface-2 text-sunrise-strong">
          <Icon icon={Compass} size="lg" />
        </span>
        <Text eyebrow tone="accent">
          404
        </Text>
        <Heading level={1} size="5xl">
          {t('notFound.title')}
        </Heading>
        <Text tone="muted" size="lg">
          {t('notFound.description')}
        </Text>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to={paths.shop()}>{t('actions.shopLamps')}</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to={paths.home()}>{t('actions.backHome')}</Link>
          </Button>
        </div>
      </Container>
    </>
  );
}
