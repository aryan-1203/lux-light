import { BadgeCheck, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RETURN_WINDOW_DAYS, WARRANTY_MONTHS } from '@/config/brand';
import { FREE_SHIPPING_THRESHOLD_PAISE } from '@/config/constants';
import { formatINR, Icon } from '@/design-system';

/** 30-day returns + warranty strip (stub by Foundation, owned by Frontend Experience; reused by 8). */
export default function TrustStrip(): JSX.Element {
  const { t } = useTranslation('common');
  const items = [
    { icon: RotateCcw, label: t('trust.returns', { days: RETURN_WINDOW_DAYS }) },
    { icon: ShieldCheck, label: t('trust.warranty', { months: WARRANTY_MONTHS }) },
    {
      icon: Truck,
      label: t('trust.freeShipping', { amount: formatINR(FREE_SHIPPING_THRESHOLD_PAISE) }),
    },
    { icon: BadgeCheck, label: t('trust.securePayments') },
  ];
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label={t('trust.label')}>
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
        >
          <Icon icon={item.icon} className="text-sunrise-strong" />
          <span className="text-sm text-fg">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
