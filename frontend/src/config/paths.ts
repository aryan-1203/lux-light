/** Route builders — use these instead of string literals so links stay in sync with routes.tsx. */
export type PolicySlug = 'privacy' | 'terms' | 'refund' | 'shipping';

export const paths = {
  home: () => '/',
  science: () => '/science',
  quiz: () => '/quiz',
  shop: (categorySlug?: string) => (categorySlug ? `/shop/${categorySlug}` : '/shop'),
  product: (slug: string) => `/products/${slug}`,
  cart: () => '/cart',
  checkout: () => '/checkout',
  orderSuccess: (orderNumber: string, token?: string) =>
    `/order/${encodeURIComponent(orderNumber)}/success${token ? `?token=${encodeURIComponent(token)}` : ''}`,
  track: (orderNumber?: string) =>
    orderNumber ? `/track?order=${encodeURIComponent(orderNumber)}` : '/track',
  login: (next?: string) => (next ? `/login?next=${encodeURIComponent(next)}` : '/login'),
  signup: (next?: string) => (next ? `/signup?next=${encodeURIComponent(next)}` : '/signup'),
  account: () => '/account',
  accountOrders: () => '/account/orders',
  accountOrder: (orderNumber: string) => `/account/orders/${encodeURIComponent(orderNumber)}`,
  accountAddresses: () => '/account/addresses',
  accountProfile: () => '/account/profile',
  blog: () => '/blog',
  blogPost: (slug: string) => `/blog/${slug}`,
  faq: () => '/faq',
  contact: () => '/contact',
  policy: (policy: PolicySlug) => `/policies/${policy}`,
  admin: () => '/admin',
} as const;
