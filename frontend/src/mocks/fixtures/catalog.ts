/**
 * Catalog fixtures mirroring DB_SCHEMA §10 seed data (slugs, SKUs, prices, stock after demo orders).
 * Product photos don't exist yet → images: [] (UI falls back to the SVG lamp illustrations).
 */
import type {
  Category,
  ProductCard,
  ProductDetail,
  ProductVariant,
  StockStatus,
} from '@/api/types';

const DISCLAIMER = 'Not a medical device. Consult a doctor for medical conditions.';
const SEED_TIME = '2026-10-01T04:30:00Z';

export const categories: Category[] = [
  {
    id: 1,
    slug: 'desk-lamps',
    name: 'Desk lamps',
    description: 'Compact 10,000 lux lamps for your desk routine.',
    image_url: null,
    sort_order: 1,
    product_count: 1,
  },
  {
    id: 2,
    slug: 'panels',
    name: 'Light panels',
    description: 'Large, room-filling 10,000 lux panels.',
    image_url: null,
    sort_order: 2,
    product_count: 1,
  },
  {
    id: 3,
    slug: 'portable',
    name: 'Portable',
    description: 'Bright mornings that travel with you.',
    image_url: null,
    sort_order: 3,
    product_count: 1,
  },
];

type VariantSeed = {
  id: number;
  productId: number;
  sku: string;
  k: number;
  kLabel: string;
  bundle: 'solo' | 'duo' | 'floor_stand' | 'travel_case';
  bundleLabel: string;
  price: number;
  compareAt: number | null;
  onHand: number;
  isDefault: boolean;
};

/** Stock = on_hand after demo orders (DB_SCHEMA §10.1); low_stock_threshold 10. */
export const variantSeeds: VariantSeed[] = [
  {
    id: 1,
    productId: 1,
    sku: 'DL-DESK-4000-SOLO',
    k: 4000,
    kLabel: 'Warm-neutral',
    bundle: 'solo',
    bundleLabel: 'Solo',
    price: 499900,
    compareAt: null,
    onHand: 40,
    isDefault: false,
  },
  {
    id: 2,
    productId: 1,
    sku: 'DL-DESK-4000-DUO',
    k: 4000,
    kLabel: 'Warm-neutral',
    bundle: 'duo',
    bundleLabel: 'Duo pack',
    price: 899900,
    compareAt: 999800,
    onHand: 6,
    isDefault: false,
  },
  {
    id: 3,
    productId: 1,
    sku: 'DL-DESK-5500-SOLO',
    k: 5500,
    kLabel: 'Daylight',
    bundle: 'solo',
    bundleLabel: 'Solo',
    price: 499900,
    compareAt: null,
    onHand: 120,
    isDefault: true,
  },
  {
    id: 4,
    productId: 1,
    sku: 'DL-DESK-5500-DUO',
    k: 5500,
    kLabel: 'Daylight',
    bundle: 'duo',
    bundleLabel: 'Duo pack',
    price: 899900,
    compareAt: 999800,
    onHand: 30,
    isDefault: false,
  },
  {
    id: 5,
    productId: 1,
    sku: 'DL-DESK-6500-SOLO',
    k: 6500,
    kLabel: 'Cool',
    bundle: 'solo',
    bundleLabel: 'Solo',
    price: 499900,
    compareAt: null,
    onHand: 60,
    isDefault: false,
  },
  {
    id: 6,
    productId: 1,
    sku: 'DL-DESK-6500-DUO',
    k: 6500,
    kLabel: 'Cool',
    bundle: 'duo',
    bundleLabel: 'Duo pack',
    price: 899900,
    compareAt: 999800,
    onHand: 20,
    isDefault: false,
  },
  {
    id: 7,
    productId: 2,
    sku: 'DL-PANEL-5500-SOLO',
    k: 5500,
    kLabel: 'Daylight',
    bundle: 'solo',
    bundleLabel: 'Solo',
    price: 799900,
    compareAt: null,
    onHand: 45,
    isDefault: true,
  },
  {
    id: 8,
    productId: 2,
    sku: 'DL-PANEL-5500-STAND',
    k: 5500,
    kLabel: 'Daylight',
    bundle: 'floor_stand',
    bundleLabel: 'With floor stand',
    price: 949900,
    compareAt: null,
    onHand: 15,
    isDefault: false,
  },
  {
    id: 9,
    productId: 2,
    sku: 'DL-PANEL-6500-SOLO',
    k: 6500,
    kLabel: 'Cool',
    bundle: 'solo',
    bundleLabel: 'Solo',
    price: 799900,
    compareAt: null,
    onHand: 25,
    isDefault: false,
  },
  {
    id: 10,
    productId: 2,
    sku: 'DL-PANEL-6500-STAND',
    k: 6500,
    kLabel: 'Cool',
    bundle: 'floor_stand',
    bundleLabel: 'With floor stand',
    price: 949900,
    compareAt: null,
    onHand: 0,
    isDefault: false,
  },
  {
    id: 11,
    productId: 3,
    sku: 'DL-GO-5500-SOLO',
    k: 5500,
    kLabel: 'Daylight',
    bundle: 'solo',
    bundleLabel: 'Solo',
    price: 349900,
    compareAt: null,
    onHand: 80,
    isDefault: true,
  },
  {
    id: 12,
    productId: 3,
    sku: 'DL-GO-5500-CASE',
    k: 5500,
    kLabel: 'Daylight',
    bundle: 'travel_case',
    bundleLabel: 'With travel case',
    price: 399900,
    compareAt: null,
    onHand: 35,
    isDefault: false,
  },
];

export const LOW_STOCK_THRESHOLD = 10;

export function stockStatus(available: number): StockStatus {
  if (available <= 0) return 'out_of_stock';
  if (available <= LOW_STOCK_THRESHOLD) return 'low_stock';
  return 'in_stock';
}

function toVariant(v: VariantSeed, available = v.onHand): ProductVariant {
  return {
    id: v.id,
    sku: v.sku,
    name: `${v.kLabel} ${v.k}K · ${v.bundleLabel}`,
    colour_temperature_k: v.k,
    colour_temperature_label: `${v.k}K ${v.kLabel}`,
    bundle: v.bundle,
    bundle_label: v.bundleLabel,
    price_paise: v.price,
    compare_at_price_paise: v.compareAt,
    stock_status: stockStatus(available),
    is_default: v.isDefault,
  };
}

const ratings = {
  1: [5, 5, 5, 5, 4, 4],
  2: [4, 4, 5],
  3: [4, 3, 5],
} as const;

function ratingSummary(productId: 1 | 2 | 3) {
  const list = ratings[productId];
  const dist = { star_1: 0, star_2: 0, star_3: 0, star_4: 0, star_5: 0 };
  for (const r of list) dist[`star_${r}` as keyof typeof dist] += 1;
  const sum = list.reduce<number>((a, b) => a + b, 0);
  return {
    average: Math.round((sum / list.length) * 10) / 10,
    count: list.length,
    distribution: dist,
  };
}

type ProductSeed = Omit<
  ProductDetail,
  'variants' | 'options' | 'default_variant_id' | 'rating' | 'images'
> & {
  id: 1 | 2 | 3;
  is_featured: boolean;
};

const productSeeds: ProductSeed[] = [
  {
    id: 1,
    slug: 'dawnlit-desk',
    name: 'Dawnlit Desk — 10,000 lux desk lamp',
    tagline: 'Your own sunrise, right on your desk.',
    description_md: `A slim 10,000 lux lamp designed for daily wellness routines at your desk. Sit 30–40 cm away during breakfast, email or your first call, and let bright, even light help you feel more awake.\n\n- Diffused, UV-free LED panel\n- Three colour temperatures: warm-neutral, daylight and cool\n- Three brightness levels and a 10-minute session timer\n\n*${DISCLAIMER}*`,
    highlights: [
      '10,000 lux at 30–40 cm',
      'UV-free diffused LED',
      '3 brightness levels',
      'Built-in 10/20/30-min timer',
      'Tilting head for easy positioning',
    ],
    specs: [
      { label: 'Brightness', value: '10,000 lux at 35 cm' },
      { label: 'Light source', value: 'Diffused LED, UV-free' },
      { label: 'Colour temperature', value: '4000K / 5500K / 6500K' },
      { label: 'Power', value: '24 W, 100–240 V adapter' },
      { label: 'Dimensions', value: '32 × 22 × 6 cm' },
      { label: 'Weight', value: '1.1 kg' },
    ],
    badges: ['Bestseller'],
    category: { id: 1, slug: 'desk-lamps', name: 'Desk lamps' },
    warranty_months: 12,
    return_window_days: 30,
    seo: {
      title: 'Dawnlit Desk — 10,000 lux desk lamp',
      description:
        'A slim 10,000 lux desk lamp designed for daily wellness routines. UV-free, three colour temperatures, built-in timer.',
      og_image_url: null,
    },
    is_featured: true,
  },
  {
    id: 2,
    slug: 'dawnlit-panel',
    name: 'Dawnlit Panel — large 10,000 lux panel',
    tagline: 'Room-filling brightness for your morning routine.',
    description_md: `A large, even 10,000 lux panel that fills your morning with bright light. Place it 45–55 cm away while you read, stretch or plan your day.\n\n- Wide diffuser for a comfortable, even glow\n- Daylight and cool colour temperatures\n- Optional floor stand for living rooms and studios\n\n*${DISCLAIMER}*`,
    highlights: [
      '10,000 lux at 45–55 cm',
      'Large, even diffuser',
      'UV-free LED',
      'Kickstand + optional floor stand',
      'Memory for last brightness setting',
    ],
    specs: [
      { label: 'Brightness', value: '10,000 lux at 50 cm' },
      { label: 'Light source', value: 'Diffused LED array, UV-free' },
      { label: 'Colour temperature', value: '5500K / 6500K' },
      { label: 'Power', value: '36 W, 100–240 V adapter' },
      { label: 'Dimensions', value: '48 × 36 × 4 cm' },
      { label: 'Weight', value: '2.4 kg' },
    ],
    badges: ['Most light'],
    category: { id: 2, slug: 'panels', name: 'Light panels' },
    warranty_months: 12,
    return_window_days: 30,
    seo: {
      title: 'Dawnlit Panel — large 10,000 lux panel',
      description:
        'Room-filling 10,000 lux light panel designed for daily wellness routines. Even, UV-free light with an optional floor stand.',
      og_image_url: null,
    },
    is_featured: true,
  },
  {
    id: 3,
    slug: 'dawnlit-go',
    name: 'Dawnlit Go — portable travel lamp',
    tagline: 'Bright mornings that fit in your bag.',
    description_md: `A pocketable 10,000 lux lamp for hotel rooms, shift schedules and early flights. USB-C powered, with a fold-out stand.\n\n- 10,000 lux at 20–25 cm\n- USB-C power (works with most power banks)\n- Optional hard-shell travel case\n\n*${DISCLAIMER}*`,
    highlights: [
      '10,000 lux at 20–25 cm',
      'USB-C powered',
      'Fold-out stand',
      'UV-free diffused LED',
      'Weighs just 300 g',
    ],
    specs: [
      { label: 'Brightness', value: '10,000 lux at 22 cm' },
      { label: 'Light source', value: 'Diffused LED, UV-free' },
      { label: 'Colour temperature', value: '5500K' },
      { label: 'Power', value: 'USB-C, 5 V / 3 A' },
      { label: 'Dimensions', value: '16 × 9 × 2 cm' },
      { label: 'Weight', value: '300 g' },
    ],
    badges: [],
    category: { id: 3, slug: 'portable', name: 'Portable' },
    warranty_months: 12,
    return_window_days: 30,
    seo: {
      title: 'Dawnlit Go — portable 10,000 lux lamp',
      description:
        'A pocketable, USB-C powered 10,000 lux lamp designed for daily wellness routines on the move.',
      og_image_url: null,
    },
    is_featured: false,
  },
];

export function buildProductDetail(
  productId: number,
  availability?: Map<number, number>,
): ProductDetail {
  const seed = productSeeds.find((p) => p.id === productId);
  if (!seed) throw new Error(`Unknown product ${productId}`);
  const variants = variantSeeds
    .filter((v) => v.productId === productId)
    .map((v) => toVariant(v, availability?.get(v.id) ?? v.onHand));
  const kelvins = [...new Map(variants.map((v) => [v.colour_temperature_k, v])).values()];
  const bundles = [...new Map(variants.map((v) => [v.bundle, v])).values()];
  const { is_featured: _featured, ...rest } = seed;
  return {
    ...rest,
    images: [],
    variants,
    options: {
      colour_temperatures: kelvins.map((v) => ({
        kelvin: v.colour_temperature_k,
        label: v.colour_temperature_label,
      })),
      bundles: bundles.map((v) => ({ code: v.bundle, label: v.bundle_label })),
    },
    default_variant_id: variants.find((v) => v.is_default)?.id ?? variants[0]?.id ?? 0,
    rating: ratingSummary(seed.id),
  };
}

export function toProductCard(p: ProductDetail): ProductCard {
  const minPrice = Math.min(...p.variants.map((v) => v.price_paise));
  const cheapest = p.variants.filter((v) => v.price_paise === minPrice);
  const compare = cheapest.map((v) => v.compare_at_price_paise).find((c) => c != null) ?? null;
  const statuses = p.variants.map((v) => v.stock_status);
  const stock: StockStatus = statuses.every((s) => s === 'out_of_stock')
    ? 'out_of_stock'
    : statuses.includes('in_stock')
      ? 'in_stock'
      : 'low_stock';
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    category: p.category,
    price_from_paise: minPrice,
    compare_at_price_from_paise: compare,
    primary_image: p.images[0] ?? null,
    rating: p.rating,
    stock_status: stock,
    badges: p.badges,
    default_variant_id: p.default_variant_id,
  };
}

export const products: ProductDetail[] = productSeeds.map((p) => buildProductDetail(p.id));
export const productCards: ProductCard[] = products.map(toProductCard);
export const featuredProductIds: number[] = productSeeds
  .filter((p) => p.is_featured)
  .map((p) => p.id);
export { SEED_TIME, DISCLAIMER };
