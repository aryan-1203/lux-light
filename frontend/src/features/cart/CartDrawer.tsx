import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { CartLine } from '@/api/types';
import { paths } from '@/config/paths';
import {
  Button,
  Drawer,
  EmptyState,
  formatINR,
  Icon,
  Price,
  ProductIllustration,
  Skeleton,
  useApiErrorToast,
} from '@/design-system';
import { useUIStore } from '@/stores/ui';
import { useCart, useRemoveCartItem, useUpdateCartItem } from './hooks';

function CartLineRow({ line }: { line: CartLine }) {
  const { t } = useTranslation('common');
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const showError = useApiErrorToast();
  const busy = update.isPending || remove.isPending;
  const setQty = (quantity: number) =>
    update.mutate({ itemId: line.id, quantity }, { onError: (e) => showError(e) });

  return (
    <li className="flex gap-4 py-4" aria-busy={busy || undefined}>
      <div className="aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-md bg-surface-2">
        {line.image ? (
          <img
            src={line.image.url}
            alt={line.image.alt}
            width={line.image.width}
            height={line.image.height}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <ProductIllustration slug={line.product_slug} className="p-1.5" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          to={paths.product(line.product_slug)}
          className="font-display font-medium text-fg hover:text-sunrise-strong"
        >
          {line.product_name}
        </Link>
        <p className="text-sm text-muted">{line.variant_name}</p>
        {line.warnings.map((w) => (
          <p key={w.code} className="text-sm text-danger">
            {w.message}
          </p>
        ))}
        <div className="mt-1 flex items-center justify-between gap-2">
          <div
            className="flex items-center rounded-full border border-border-strong"
            role="group"
            aria-label={t('cart.quantityFor', { name: line.product_name })}
          >
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('cart.decrease')}
              disabled={busy || line.quantity <= 1}
              onClick={() => setQty(line.quantity - 1)}
            >
              <Icon icon={Minus} size="sm" />
            </Button>
            <span className="min-w-6 text-center tabular-nums" aria-live="polite">
              {line.quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('cart.increase')}
              disabled={busy || line.quantity >= line.max_quantity}
              onClick={() => setQty(line.quantity + 1)}
            >
              <Icon icon={Plus} size="sm" />
            </Button>
          </div>
          <Price paise={line.line_total_paise} size="sm" />
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('cart.remove', { name: line.product_name })}
        disabled={busy}
        onClick={() => remove.mutate({ itemId: line.id }, { onError: (e) => showError(e) })}
        className="-mr-2 self-start text-muted"
      >
        <Icon icon={Trash2} size="sm" />
      </Button>
    </li>
  );
}

/** Animated cart drawer (PLAN §4.2 — stub by Foundation, owned by Frontend Commerce). No props. */
export default function CartDrawer(): JSX.Element {
  const { t } = useTranslation('common');
  const open = useUIStore((s) => s.cartDrawerOpen);
  const close = useUIStore((s) => s.closeCartDrawer);
  const { data: cart, isPending, isError, refetch } = useCart();
  const count = cart?.item_count ?? 0;
  const totals = cart?.totals;

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => (o ? undefined : close())}
      title={t('cart.title')}
      headerAside={<span className="text-sm text-muted">{t('cart.itemCount', { count })}</span>}
      data-testid="cart-drawer"
      footer={
        cart && cart.items.length > 0 && totals ? (
          <div className="flex flex-col gap-3">
            {totals.amount_to_free_shipping_paise > 0 ? (
              <p className="text-sm text-muted">
                {t('cart.freeShippingRemaining', {
                  amount: formatINR(totals.amount_to_free_shipping_paise),
                })}
              </p>
            ) : (
              <p className="text-sm text-success">{t('cart.freeShippingUnlocked')}</p>
            )}
            <div className="flex items-baseline justify-between">
              <span className="text-muted">{t('cart.subtotal')}</span>
              <span className="font-display text-xl font-semibold tabular-nums">
                {formatINR(totals.subtotal_paise)}
              </span>
            </div>
            <p className="text-xs text-muted">{t('cart.taxNote')}</p>
            <Button asChild fullWidth size="lg">
              <Link to={paths.checkout()} onClick={close}>
                {t('cart.checkout')}
              </Link>
            </Button>
            <Button asChild variant="link" fullWidth>
              <Link to={paths.cart()} onClick={close}>
                {t('cart.viewCart')}
              </Link>
            </Button>
          </div>
        ) : null
      }
    >
      {isPending ? (
        <div aria-busy="true" className="flex flex-col gap-4">
          <span className="sr-only">{t('status.loading')}</span>
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="aspect-[4/5] w-20" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton shape="text" className="w-3/4" />
                <Skeleton shape="text" className="w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          tone="error"
          headingLevel={3}
          title={t('cart.loadError')}
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              {t('actions.retry')}
            </Button>
          }
        />
      ) : cart.items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          headingLevel={3}
          title={t('cart.empty')}
          description={t('cart.emptyHint')}
          action={
            <Button asChild>
              <Link to={paths.shop()} onClick={close}>
                {t('actions.shopLamps')}
              </Link>
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-border">
          {cart.items.map((line) => (
            <CartLineRow key={line.id} line={line} />
          ))}
        </ul>
      )}
    </Drawer>
  );
}
