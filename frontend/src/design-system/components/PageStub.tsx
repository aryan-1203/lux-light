import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Seo from '@/layout/Seo';
import { ProductIllustration } from '../illustrations';
import { Button } from './Button';
import { Container } from './Container';
import { Heading, Text } from './Typography';

/** Phase-2 placeholder used by every page module until its owner implements it. */
export function PageStub({ name }: { name: string }) {
  const { t } = useTranslation('common');
  return (
    <>
      <Seo title={name} description={t('pageStub.description', { name })} noindex />
      <Container className="grid min-h-[70dvh] items-center gap-10 py-section md:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Text eyebrow tone="accent">
            {t('pageStub.eyebrow')}
          </Text>
          <Heading level={1} size="4xl">
            {name}
          </Heading>
          <Text tone="muted" size="lg">
            {t('pageStub.description', { name })}
          </Text>
          <div>
            <Button asChild variant="secondary">
              <Link to="/">{t('actions.backHome')}</Link>
            </Button>
          </div>
        </div>
        <div className="mx-auto aspect-[4/5] w-full max-w-xs">
          <ProductIllustration slug="dawnlit-desk" />
        </div>
      </Container>
    </>
  );
}
