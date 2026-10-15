import { Power } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProductDetail } from '@/api/types';
import { Button, cn, Icon, ProductIllustration } from '@/design-system';

export interface ProductViewerProps {
  product: ProductDetail;
  /** Keeps colour toggle in sync with the PDP variant picker. */
  selectedVariantId?: number;
  onColourTemperatureChange?: (kelvin: number) => void;
  /** Start in "on" state. */
  initialLit?: boolean;
  layout?: 'hero' | 'pdp';
  className?: string;
}

/**
 * Product viewer (PLAN §4.2 — placeholder by Foundation, owned by Frontend Experience).
 * Honors every prop: illustration per product, colour-temperature toggle, on/off light-up.
 */
export default function ProductViewer(props: ProductViewerProps): JSX.Element {
  const {
    product,
    selectedVariantId,
    onColourTemperatureChange,
    initialLit = true,
    layout = 'pdp',
    className,
  } = props;
  const { t } = useTranslation('common');
  const [lit, setLit] = useState(initialLit);
  const selected = product.variants.find((v) => v.id === selectedVariantId);
  const [localKelvin, setLocalKelvin] = useState<number>(
    selected?.colour_temperature_k ?? product.options.colour_temperatures[0]?.kelvin ?? 5500,
  );
  const kelvin = selected?.colour_temperature_k ?? localKelvin;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border border-border bg-surface',
          layout === 'hero' ? 'aspect-[4/5] md:aspect-square' : 'aspect-[4/5]',
        )}
      >
        <ProductIllustration
          slug={product.slug}
          lit={lit}
          kelvin={kelvin}
          title={t('viewer.illustrationAlt', { name: product.name })}
          className="p-8"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant={lit ? 'primary' : 'secondary'}
          size="sm"
          aria-pressed={lit}
          onClick={() => setLit((v) => !v)}
          leadingIcon={<Icon icon={Power} size="sm" />}
        >
          {lit ? t('viewer.turnOff') : t('viewer.turnOn')}
        </Button>
        <div
          role="group"
          aria-label={t('viewer.colourTemperature')}
          className="flex flex-wrap gap-2"
        >
          {product.options.colour_temperatures.map((opt) => (
            <Button
              key={opt.kelvin}
              size="sm"
              variant={opt.kelvin === kelvin ? 'secondary' : 'ghost'}
              aria-pressed={opt.kelvin === kelvin}
              onClick={() => {
                setLocalKelvin(opt.kelvin);
                onColourTemperatureChange?.(opt.kelvin);
              }}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
