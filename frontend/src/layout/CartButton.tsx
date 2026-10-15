import { ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Icon } from '@/design-system';
import { useCart } from '@/features/cart/hooks';
import { useUIStore } from '@/stores/ui';

/** Header cart trigger with item-count badge (count is part of the accessible name). */
export default function CartButton() {
  const { t } = useTranslation('common');
  const { data } = useCart();
  const open = useUIStore((s) => s.openCartDrawer);
  const count = data?.item_count ?? 0;
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={open}
      aria-label={t('header.cartLabel', { count })}
      aria-haspopup="dialog"
      data-testid="cart-button"
    >
      <Icon icon={ShoppingBag} />
      {count > 0 ? (
        <span
          key={count}
          aria-hidden="true"
          className="absolute right-0.5 top-0.5 inline-flex min-w-5 animate-pop items-center justify-center rounded-full bg-sunrise px-1 text-xs font-semibold tabular-nums leading-5 text-on-sunrise"
        >
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Button>
  );
}
