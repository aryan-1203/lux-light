import type { components } from './schema';

type PaymentMethod = components['schemas']['PaymentMethod'];
type Params = Record<string, unknown>;

/**
 * Query keys (PLAN §4.2). Invalidate whole families with the prefix, e.g.
 * `queryClient.invalidateQueries({ queryKey: ['cart'] })`.
 * Admin keys live under ['admin', …] — the Admin agent adds entries to `queryKeys.admin`
 * (or builds keys starting with `queryKeys.admin.all()`).
 */
export const queryKeys: {
  me: readonly ['auth', 'me'];
  cart: (paymentMethod?: PaymentMethod | null) => readonly ['cart', PaymentMethod | null];
  products: (params?: Params) => readonly ['products', Params];
  product: (slug: string) => readonly ['product', string];
  relatedProducts: (slug: string) => readonly ['product', string, 'related'];
  productReviews: (slug: string, params?: Params) => readonly unknown[];
  reviews: (params?: Params) => readonly unknown[];
  categories: readonly ['categories'];
  faqs: (category?: string) => readonly unknown[];
  blogPosts: (params?: Params) => readonly unknown[];
  blogPost: (slug: string) => readonly ['blog', string];
  myOrders: (page?: number) => readonly unknown[];
  order: (orderNumber: string) => readonly ['order', string];
  addresses: readonly ['addresses'];
  pincode: (pincode: string) => readonly ['pincode', string];
  admin: { [key: string]: (...args: never[]) => readonly unknown[] };
} = {
  me: ['auth', 'me'] as const,
  cart: (paymentMethod = null) => ['cart', paymentMethod ?? null] as const,
  products: (params = {}) => ['products', params] as const,
  product: (slug) => ['product', slug] as const,
  relatedProducts: (slug) => ['product', slug, 'related'] as const,
  productReviews: (slug, params = {}) => ['product', slug, 'reviews', params] as const,
  reviews: (params = {}) => ['reviews', params] as const,
  categories: ['categories'] as const,
  faqs: (category) => ['faqs', category ?? 'all'] as const,
  blogPosts: (params = {}) => ['blog', 'list', params] as const,
  blogPost: (slug) => ['blog', slug] as const,
  myOrders: (page = 1) => ['orders', 'mine', page] as const,
  order: (orderNumber) => ['order', orderNumber] as const,
  addresses: ['addresses'] as const,
  pincode: (pincode) => ['pincode', pincode] as const,
  admin: {
    all: () => ['admin'] as const,
  },
};
