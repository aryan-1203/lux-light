/**
 * MSW handler registry (PLAN §4.2, owner 6). Domain handlers come first; the Foundation fallbacks
 * at the end only answer requests no domain handler matched, so the app shell (CSRF, session,
 * cart badge, catalog cards) works in `VITE_API_MOCK=true` mode from day one. Owners never need to
 * edit this file: implementing a route in their own module overrides the fallback.
 */
import { delay, http, HttpResponse, type HttpHandler } from 'msw';
import type {
  Cart,
  CategoryListResponse,
  CsrfTokenResponse,
  PaymentMethod,
  ProductDetail,
  ProductListPage,
  UserProfile,
} from '@/api/types';
import {
  buildProductDetail,
  categories,
  featuredProductIds,
  toProductCard,
  variantSeeds,
} from '../fixtures';
import { mockState, type MockErrorCode } from '../state';
import { apiPath, csrfError, errorJson, mockDelay, paginate } from '../utils';
import { accountHandlers } from './account';
import { adminHandlers } from './admin';
import { authHandlers } from './auth';
import { blogHandlers } from './blog';
import { cartHandlers } from './cart';
import { catalogHandlers } from './catalog';
import { checkoutHandlers } from './checkout';
import { contentHandlers } from './content';
import { ordersHandlers } from './orders';
import { quizHandlers } from './quiz';
import { reviewsHandlers } from './reviews';

const STATUS: Record<MockErrorCode, number> = {
  VARIANT_NOT_FOUND: 404,
  OUT_OF_STOCK: 409,
  INSUFFICIENT_STOCK: 409,
  CART_LINE_LIMIT: 422,
  CART_ITEM_NOT_FOUND: 404,
  CART_EMPTY: 409,
  PROMO_NOT_FOUND: 422,
  PROMO_ALREADY_APPLIED: 409,
  PROMO_MIN_ORDER: 422,
  PROMO_NOT_STACKABLE: 422,
  PROMO_CART_LIMIT: 422,
};

const cartOr = (code: MockErrorCode | null, pm: PaymentMethod | null = null) =>
  code ? errorJson(STATUS[code], code) : HttpResponse.json<Cart>(mockState.cart.view(pm));

function currentProducts(): ProductDetail[] {
  const ids = [...new Set(variantSeeds.map((v) => v.productId))];
  return ids.map((id) => buildProductDetail(id, mockState.cart.stock));
}

/** Minimal Foundation fallbacks (session, CSRF, cart, catalog). */
const fallbackHandlers: HttpHandler[] = [
  http.get(apiPath('/auth/csrf'), () =>
    HttpResponse.json<CsrfTokenResponse>(
      { csrf_token: 'mock-csrf-token' },
      { headers: { 'Set-Cookie': 'dl_csrf=mock-csrf-token; Path=/; SameSite=Lax' } },
    ),
  ),
  http.get(apiPath('/auth/me'), () => {
    const user = mockState.session.user;
    return user ? HttpResponse.json<UserProfile>(user) : errorJson(401, 'UNAUTHENTICATED');
  }),
  http.get(apiPath('/cart'), async ({ request }) => {
    await delay(mockDelay());
    const pm = new URL(request.url).searchParams.get('payment_method') as PaymentMethod | null;
    return HttpResponse.json<Cart>(mockState.cart.view(pm));
  }),
  http.post(apiPath('/cart/items'), async ({ request }) => {
    const denied = csrfError(request);
    if (denied) return denied;
    await delay(mockDelay());
    const body = (await request.json()) as { variant_id: number; quantity?: number };
    return cartOr(mockState.cart.add(body.variant_id, body.quantity ?? 1));
  }),
  http.patch(apiPath('/cart/items/:itemId'), async ({ request, params }) => {
    const denied = csrfError(request);
    if (denied) return denied;
    const body = (await request.json()) as { quantity: number };
    return cartOr(mockState.cart.update(Number(params.itemId), body.quantity));
  }),
  http.delete(apiPath('/cart/items/:itemId'), ({ request, params }) => {
    const denied = csrfError(request);
    if (denied) return denied;
    return cartOr(mockState.cart.remove(Number(params.itemId)));
  }),
  http.post(apiPath('/cart/promos'), async ({ request }) => {
    const denied = csrfError(request);
    if (denied) return denied;
    const body = (await request.json()) as { code: string };
    return cartOr(mockState.cart.applyPromo(body.code));
  }),
  http.delete(apiPath('/cart/promos/:code'), ({ request, params }) => {
    const denied = csrfError(request);
    if (denied) return denied;
    mockState.cart.removePromo(String(params.code));
    return cartOr(null);
  }),
  http.get(apiPath('/categories'), () =>
    HttpResponse.json<CategoryListResponse>({ items: categories }),
  ),
  http.get(apiPath('/products'), async ({ request }) => {
    await delay(mockDelay());
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const q = url.searchParams.get('q')?.toLowerCase();
    const sort = url.searchParams.get('sort') ?? 'featured';
    if (category && !categories.some((c) => c.slug === category))
      return errorJson(404, 'CATEGORY_NOT_FOUND');
    let cards = currentProducts()
      .filter((p) => !category || p.category.slug === category)
      .filter((p) => !q || `${p.name} ${p.tagline}`.toLowerCase().includes(q))
      .map(toProductCard);
    if (sort === 'price_asc') cards = cards.sort((a, b) => a.price_from_paise - b.price_from_paise);
    if (sort === 'price_desc')
      cards = cards.sort((a, b) => b.price_from_paise - a.price_from_paise);
    if (sort === 'rating') cards = cards.sort((a, b) => b.rating.average - a.rating.average);
    if (sort === 'featured')
      cards = cards.sort(
        (a, b) =>
          Number(featuredProductIds.includes(b.id)) - Number(featuredProductIds.includes(a.id)) ||
          a.id - b.id,
      );
    return HttpResponse.json<ProductListPage>(paginate(cards, url));
  }),
  http.get(apiPath('/products/:slug'), async ({ params }) => {
    await delay(mockDelay());
    const product = currentProducts().find((p) => p.slug === params.slug);
    return product
      ? HttpResponse.json<ProductDetail>(product)
      : errorJson(404, 'PRODUCT_NOT_FOUND');
  }),
];

export const handlers: HttpHandler[] = [
  ...authHandlers,
  ...accountHandlers,
  ...catalogHandlers,
  ...reviewsHandlers,
  ...blogHandlers,
  ...contentHandlers,
  ...quizHandlers,
  ...cartHandlers,
  ...checkoutHandlers,
  ...ordersHandlers,
  ...adminHandlers,
  ...fallbackHandlers,
];
