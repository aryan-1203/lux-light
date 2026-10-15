import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { Schemas } from '@/api/client';
import { paths } from '@/config/paths';
import { Badge, Card, cn, Price, ProductIllustration, Rating } from '@/design-system';

/**
 * Product listing card (PLAN §4.2 — stub by Foundation, owned by Frontend Commerce).
 * Whole card is one link target (stretched link on the title); media box reserves 4:5 (no CLS).
 */
export default function ProductCard(props: {
  product: Schemas['ProductCard'];
  priority?: boolean;
  className?: string;
}): JSX.Element {
  const { product, priority = false, className } = props;
  const { t } = useTranslation('common');
  const img = product.primary_image;
  const srcSet = img?.renditions.map((r) => `${r.url} ${r.width}w`).join(', ');

  return (
    <Card
      as="article"
      interactive
      padding="none"
      className={cn('group overflow-hidden', className)}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-sunrise-radial">
        {img ? (
          <img
            src={img.url}
            srcSet={srcSet || undefined}
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            width={img.width}
            height={img.height}
            alt={img.alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-slow ease-out group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
          />
        ) : (
          <ProductIllustration slug={product.slug} className="p-6" />
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {product.badges.map((b) => (
            <Badge key={b} tone="sunrise">
              {b}
            </Badge>
          ))}
          {product.stock_status === 'out_of_stock' ? (
            <Badge tone="danger">{t('stock.out_of_stock')}</Badge>
          ) : null}
          {product.stock_status === 'low_stock' ? (
            <Badge tone="outline">{t('stock.low_stock')}</Badge>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-2 p-5">
        <h3 className="font-display text-xl font-semibold leading-snug text-fg">
          <Link
            to={paths.product(product.slug)}
            className="after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-focus"
          >
            {product.name}
          </Link>
        </h3>
        <p className="text-sm text-muted">{product.tagline}</p>
        {product.rating.count > 0 ? (
          <Rating value={product.rating.average} count={product.rating.count} size="sm" />
        ) : null}
        <Price
          paise={product.price_from_paise}
          compareAtPaise={product.compare_at_price_from_paise}
          from
          className="mt-1"
        />
      </div>
    </Card>
  );
}
