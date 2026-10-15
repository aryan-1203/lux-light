import { Banknote, CreditCard, Landmark, Smartphone, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  BRAND_NAME,
  COMPLIANCE,
  DISCLAIMER,
  SOCIAL_LINKS,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  TAGLINE,
} from '@/config/brand';
import { paths } from '@/config/paths';
import { Container, Icon, Logo } from '@/design-system';

const linkClass =
  'inline-flex min-h-touch items-center text-sm text-muted transition-colors duration-fast hover:text-fg md:min-h-0 md:py-1.5';

export default function Footer() {
  const { t } = useTranslation('common');
  const year = new Date().getFullYear();

  const columns = [
    {
      id: 'shop',
      title: t('footer.shop'),
      links: [
        { to: paths.shop(), label: t('footer.allLamps') },
        { to: paths.shop('desk-lamps'), label: t('footer.deskLamps') },
        { to: paths.shop('panels'), label: t('footer.panels') },
        { to: paths.shop('portable'), label: t('footer.portable') },
      ],
    },
    {
      id: 'learn',
      title: t('footer.learn'),
      links: [
        { to: paths.science(), label: t('nav.science') },
        { to: paths.quiz(), label: t('nav.quiz') },
        { to: paths.blog(), label: t('nav.blog') },
        { to: paths.faq(), label: t('nav.faq') },
      ],
    },
    {
      id: 'support',
      title: t('footer.support'),
      links: [
        { to: paths.contact(), label: t('nav.contact') },
        { to: paths.track(), label: t('nav.track') },
        { to: paths.policy('shipping'), label: t('footer.shippingPolicy') },
        { to: paths.policy('refund'), label: t('footer.refundPolicy') },
      ],
    },
    {
      id: 'legal',
      title: t('footer.legal'),
      links: [
        { to: paths.policy('privacy'), label: t('footer.privacyPolicy') },
        { to: paths.policy('terms'), label: t('footer.terms') },
      ],
    },
  ];

  const payments = [
    { icon: Smartphone, label: t('footer.payments.upi') },
    { icon: CreditCard, label: t('footer.payments.cards') },
    { icon: Landmark, label: t('footer.payments.netbanking') },
    { icon: Wallet, label: t('footer.payments.wallets') },
    { icon: Banknote, label: t('footer.payments.cod') },
  ];

  return (
    <footer className="border-t border-border bg-surface pb-safe">
      <Container className="grid gap-10 py-section-sm lg:grid-cols-[1.4fr_2fr]">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-sm text-base text-muted">{TAGLINE}</p>
          <p
            className="max-w-sm rounded-lg border border-border bg-surface-2 p-4 text-sm text-fg"
            data-testid="footer-disclaimer"
          >
            {DISCLAIMER}
          </p>
          <address className="flex flex-col text-sm not-italic text-muted">
            <a
              className="inline-flex min-h-touch items-center hover:text-fg"
              href={`mailto:${SUPPORT_EMAIL}`}
            >
              {SUPPORT_EMAIL}
            </a>
            <a
              className="inline-flex min-h-touch items-center hover:text-fg"
              href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`}
            >
              {SUPPORT_PHONE}
            </a>
          </address>
        </div>

        <nav aria-label={t('footer.navLabel')} className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {columns.map((col) => (
            <div key={col.id}>
              <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-[0.16em] text-fg">
                {col.title}
              </h2>
              <ul>
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className={linkClass}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </Container>

      <Container className="grid gap-6 border-t border-border py-8 md:grid-cols-2">
        <section aria-labelledby="footer-compliance" className="text-xs text-muted">
          <h2
            id="footer-compliance"
            className="mb-2 font-display text-xs font-semibold uppercase tracking-[0.16em] text-fg"
          >
            {t('footer.complianceTitle')}
          </h2>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
            <div>
              <dt className="sr-only">{t('footer.compliance.importer')}</dt>
              <dd>{COMPLIANCE.importerName}</dd>
            </div>
            <div>
              <dt className="sr-only">{t('footer.compliance.address')}</dt>
              <dd>{COMPLIANCE.importerAddress}</dd>
            </div>
            <div>
              <dt className="sr-only">{t('footer.compliance.iec')}</dt>
              <dd>{COMPLIANCE.iec}</dd>
            </div>
            <div>
              <dt className="sr-only">{t('footer.compliance.bis')}</dt>
              <dd>{COMPLIANCE.bisRegistration}</dd>
            </div>
            <div>
              <dt className="sr-only">{t('footer.compliance.gstin')}</dt>
              <dd>{COMPLIANCE.gstin}</dd>
            </div>
            <div>
              <dt className="sr-only">{t('footer.compliance.origin')}</dt>
              <dd>{COMPLIANCE.countryOfOrigin}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="footer-payments" className="md:justify-self-end">
          <h2
            id="footer-payments"
            className="mb-2 font-display text-xs font-semibold uppercase tracking-[0.16em] text-fg"
          >
            {t('footer.paymentsTitle')}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {payments.map((p) => (
              <li
                key={p.label}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-fg"
              >
                <Icon icon={p.icon} size="xs" className="text-sunrise-strong" />
                {p.label}
              </li>
            ))}
          </ul>
        </section>
      </Container>

      <Container className="flex flex-col gap-3 border-t border-border py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{t('footer.copyright', { year, brand: BRAND_NAME })}</p>
        <ul className="flex gap-1" aria-label={t('footer.social')}>
          {SOCIAL_LINKS.map((s) => (
            <li key={s.id}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-touch items-center px-2 hover:text-fg"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </footer>
  );
}
