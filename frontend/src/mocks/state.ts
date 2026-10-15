/**
 * In-memory mock backend state shared by every MSW handler. `mockState.reset()` restores the seed
 * (called after each unit test). Pricing mirrors PLAN §1.8 (GST-inclusive, free shipping ≥ ₹999,
 * COD fee ₹49) closely enough for UI work — the real server stays authoritative.
 */
import type { AppliedPromo, Cart, CartLine, PaymentMethod, UserProfile } from '@/api/types';
import { buildProductDetail, stockStatus, variantSeeds } from './fixtures/catalog';
import { promos } from './fixtures/promos';
import { publicUser, users } from './fixtures/users';

const FREE_SHIPPING_THRESHOLD = 99_900;
const SHIPPING_FEE = 7_900;
const COD_FEE = 4_900;
const COD_MAX = 1_000_000;
const MAX_QTY = 5;
const GST_RATE = 18;

export type MockErrorCode =
  | 'VARIANT_NOT_FOUND'
  | 'OUT_OF_STOCK'
  | 'INSUFFICIENT_STOCK'
  | 'CART_LINE_LIMIT'
  | 'CART_ITEM_NOT_FOUND'
  | 'CART_EMPTY'
  | 'PROMO_NOT_FOUND'
  | 'PROMO_ALREADY_APPLIED'
  | 'PROMO_MIN_ORDER'
  | 'PROMO_NOT_STACKABLE'
  | 'PROMO_CART_LIMIT';

const roundHalfUpDiv = (n: number, d: number) => Math.floor((2 * n + d) / (2 * d));
const taxIn = (gross: number) => gross - roundHalfUpDiv(gross * 100, 100 + GST_RATE);

/** Largest-remainder allocation (Σ == amount), like core.money.allocate_pro_rata. */
export function allocateProRata(amount: number, weights: number[]): number[] {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total === 0) return weights.map(() => 0);
  const raw = weights.map((w) => (amount * w) / total);
  const floors = raw.map(Math.floor);
  let rest = amount - floors.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (rest <= 0) break;
    floors[i] = (floors[i] ?? 0) + 1;
    rest -= 1;
  }
  return floors;
}

type Line = { id: number; variantId: number; quantity: number };

function createCart() {
  let lines: Line[] = [];
  let promoCodes: string[] = [];
  let nextId = 1;
  let updatedAt: string | null = null;
  const stock = new Map(variantSeeds.map((v) => [v.id, v.onHand]));
  const touch = () => {
    updatedAt = new Date().toISOString();
  };

  function subtotal(): number {
    return lines.reduce(
      (sum, l) => sum + (variantSeeds.find((v) => v.id === l.variantId)?.price ?? 0) * l.quantity,
      0,
    );
  }

  function evaluatePromos(sub: number): { applied: AppliedPromo[]; discount: number } {
    let remaining = sub;
    const applied = promoCodes.map((code): AppliedPromo => {
      const p = promos.find((x) => x.code === code);
      if (!p)
        return {
          code,
          title: code,
          discount_type: 'flat',
          discount_paise: 0,
          applicable: false,
          error_code: 'PROMO_NOT_FOUND',
          message: 'Code not found',
        };
      if (sub < p.min_order_paise) {
        return {
          code,
          title: p.title,
          discount_type: p.discount_type,
          discount_paise: 0,
          applicable: false,
          error_code: 'PROMO_MIN_ORDER',
          message: 'Cart subtotal is below the minimum for this code',
        };
      }
      const raw =
        p.discount_type === 'percentage'
          ? Math.min(
              roundHalfUpDiv(remaining * (p.percent_off ?? 0), 100),
              p.max_discount_paise ?? Number.MAX_SAFE_INTEGER,
            )
          : Math.min(p.amount_off_paise ?? 0, remaining);
      remaining -= raw;
      return {
        code,
        title: p.title,
        discount_type: p.discount_type,
        discount_paise: raw,
        applicable: true,
        error_code: null,
        message: null,
      };
    });
    return { applied, discount: sub - remaining };
  }

  return {
    stock,
    view(paymentMethod: PaymentMethod | null = null): Cart {
      const sub = subtotal();
      const { applied, discount } = evaluatePromos(sub);
      const lineSubs = lines.map(
        (l) => (variantSeeds.find((v) => v.id === l.variantId)?.price ?? 0) * l.quantity,
      );
      const lineDiscounts = allocateProRata(discount, lineSubs);
      const items: CartLine[] = lines.map((l, i) => {
        const seed = variantSeeds.find((v) => v.id === l.variantId);
        if (!seed) throw new Error(`variant ${l.variantId} missing`);
        const product = buildProductDetail(seed.productId, stock);
        const variant = product.variants.find((v) => v.id === seed.id);
        const available = stock.get(seed.id) ?? 0;
        const lineSub = lineSubs[i] ?? 0;
        const lineDisc = lineDiscounts[i] ?? 0;
        return {
          id: l.id,
          variant_id: seed.id,
          product_id: seed.productId,
          product_slug: product.slug,
          product_name: product.name,
          variant_name: variant?.name ?? seed.sku,
          sku: seed.sku,
          image: null,
          unit_price_paise: seed.price,
          compare_at_price_paise: seed.compareAt,
          quantity: l.quantity,
          max_quantity: Math.max(1, Math.min(MAX_QTY, available)),
          line_subtotal_paise: lineSub,
          line_discount_paise: lineDisc,
          line_total_paise: lineSub - lineDisc,
          stock_status: stockStatus(available),
          warnings:
            available <= 0
              ? [{ code: 'OUT_OF_STOCK', message: 'This item is out of stock.' }]
              : l.quantity > available
                ? [
                    {
                      code: 'INSUFFICIENT_STOCK',
                      message: 'Only a few left — please reduce the quantity.',
                    },
                  ]
                : [],
        };
      });
      const net = sub - discount;
      const shipping = items.length === 0 || net >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
      const codFee = paymentMethod === 'cod' && items.length > 0 ? COD_FEE : 0;
      const total = net + shipping + codFee;
      const compareSavings = items.reduce(
        (s, l) =>
          s +
          (l.compare_at_price_paise
            ? (l.compare_at_price_paise - l.unit_price_paise) * l.quantity
            : 0),
        0,
      );
      const tax =
        items.reduce((s, l) => s + taxIn(l.line_total_paise), 0) + taxIn(shipping) + taxIn(codFee);
      return {
        id: items.length > 0 ? 1 : null,
        items,
        item_count: items.reduce((n, l) => n + l.quantity, 0),
        promos: applied,
        totals: {
          subtotal_paise: sub,
          discount_paise: discount,
          shipping_paise: shipping,
          cod_fee_paise: codFee,
          total_paise: total,
          tax_included_paise: tax,
          savings_paise: compareSavings + discount,
          free_shipping_threshold_paise: FREE_SHIPPING_THRESHOLD,
          amount_to_free_shipping_paise:
            items.length === 0
              ? FREE_SHIPPING_THRESHOLD
              : Math.max(0, FREE_SHIPPING_THRESHOLD - net),
        },
        notices: [],
        payment_method: paymentMethod,
        cod_available: net + shipping + COD_FEE <= COD_MAX,
        currency: 'INR',
        updated_at: updatedAt,
      };
    },
    add(variantId: number, quantity = 1): MockErrorCode | null {
      const seed = variantSeeds.find((v) => v.id === variantId);
      if (!seed) return 'VARIANT_NOT_FOUND';
      const available = stock.get(variantId) ?? 0;
      if (available <= 0) return 'OUT_OF_STOCK';
      const existing = lines.find((l) => l.variantId === variantId);
      const next = (existing?.quantity ?? 0) + quantity;
      if (next > MAX_QTY) return 'CART_LINE_LIMIT';
      if (next > available) return 'INSUFFICIENT_STOCK';
      if (existing) existing.quantity = next;
      else lines.push({ id: nextId++, variantId, quantity });
      touch();
      return null;
    },
    update(itemId: number, quantity: number): MockErrorCode | null {
      const line = lines.find((l) => l.id === itemId);
      if (!line) return 'CART_ITEM_NOT_FOUND';
      if (quantity > MAX_QTY) return 'CART_LINE_LIMIT';
      if (quantity > (stock.get(line.variantId) ?? 0)) return 'INSUFFICIENT_STOCK';
      if (quantity <= 0) lines = lines.filter((l) => l.id !== itemId);
      else line.quantity = quantity;
      touch();
      return null;
    },
    remove(itemId: number): MockErrorCode | null {
      if (!lines.some((l) => l.id === itemId)) return 'CART_ITEM_NOT_FOUND';
      lines = lines.filter((l) => l.id !== itemId);
      touch();
      return null;
    },
    applyPromo(rawCode: string): MockErrorCode | null {
      const code = rawCode.trim().toUpperCase();
      const promo = promos.find((p) => p.code === code && p.is_active);
      if (!promo) return 'PROMO_NOT_FOUND';
      if (lines.length === 0) return 'CART_EMPTY';
      if (promoCodes.includes(code)) return 'PROMO_ALREADY_APPLIED';
      if (subtotal() < promo.min_order_paise) return 'PROMO_MIN_ORDER';
      const attached = promoCodes.map((c) => promos.find((p) => p.code === c));
      if (attached.length > 0 && (!promo.stackable || attached.some((p) => p && !p.stackable)))
        return 'PROMO_NOT_STACKABLE';
      if (promoCodes.length >= 3) return 'PROMO_CART_LIMIT';
      promoCodes.push(code);
      touch();
      return null;
    },
    removePromo(code: string): void {
      promoCodes = promoCodes.filter((c) => c !== code.toUpperCase());
      touch();
    },
    clear(): void {
      lines = [];
      promoCodes = [];
      touch();
    },
    reset(): void {
      lines = [];
      promoCodes = [];
      nextId = 1;
      updatedAt = null;
      stock.clear();
      for (const v of variantSeeds) stock.set(v.id, v.onHand);
    },
  };
}

function createSession() {
  let user: UserProfile | null = null;
  return {
    get user() {
      return user;
    },
    login(email: string, password?: string): UserProfile | null {
      const found = users.find(
        (u) =>
          u.email === email.toLowerCase() && (password === undefined || u.password === password),
      );
      user = found ? publicUser(found) : null;
      return user;
    },
    loginAs(u: UserProfile | null): void {
      user = u;
    },
    logout(): void {
      user = null;
    },
  };
}

const resetHooks: Array<() => void> = [];
/** Domain handler modules register their own state reset (called by mockState.reset()). */
export function onMockReset(fn: () => void): void {
  resetHooks.push(fn);
}

export const mockState = {
  session: createSession(),
  cart: createCart(),
  /** Extra per-domain state owners can attach (orders, addresses…): reset it in their own handlers module. */
  reset(): void {
    this.session.logout();
    this.cart.reset();
    for (const fn of resetHooks) fn();
  },
};
