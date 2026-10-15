import { describe, expect, it } from 'vitest';
import { allocateProRata, mockState } from './state';

describe('mockState.cart pricing (mirrors PLAN §1.8)', () => {
  it('prices a desk lamp with free shipping and inclusive GST', () => {
    expect(mockState.cart.add(3, 1)).toBeNull();
    const cart = mockState.cart.view();
    expect(cart.item_count).toBe(1);
    expect(cart.totals).toMatchObject({
      subtotal_paise: 499900,
      shipping_paise: 0,
      total_paise: 499900,
      tax_included_paise: 499900 - 423644,
      amount_to_free_shipping_paise: 0,
    });
  });

  it('applies WELCOME10 (10%, cap ₹500) and rejects stacking SUNRISE500', () => {
    mockState.cart.add(3, 1);
    expect(mockState.cart.applyPromo('welcome10')).toBeNull();
    expect(mockState.cart.view().totals.discount_paise).toBe(49990);
    expect(mockState.cart.applyPromo('SUNRISE500')).toBe('PROMO_NOT_STACKABLE');
    expect(mockState.cart.applyPromo('WELCOME10')).toBe('PROMO_ALREADY_APPLIED');
  });

  it('enforces min order, stock and line limits', () => {
    mockState.cart.add(11, 1); // Go ₹3,499
    expect(mockState.cart.applyPromo('SUNRISE500')).toBe('PROMO_MIN_ORDER');
    expect(mockState.cart.add(10, 1)).toBe('OUT_OF_STOCK');
    expect(mockState.cart.add(11, 5)).toBe('CART_LINE_LIMIT');
    expect(mockState.cart.add(999, 1)).toBe('VARIANT_NOT_FOUND');
  });

  it('adds COD fee and shipping below threshold', () => {
    const empty = mockState.cart.view('cod');
    expect(empty.totals.cod_fee_paise).toBe(0);
    mockState.cart.add(11, 1);
    expect(mockState.cart.view('cod').totals.cod_fee_paise).toBe(4900);
  });

  it('resets', () => {
    mockState.cart.add(3, 2);
    mockState.reset();
    expect(mockState.cart.view().items).toHaveLength(0);
  });
});

describe('allocateProRata', () => {
  it('distributes exactly', () => {
    const parts = allocateProRata(100, [1, 1, 1]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(100);
    expect(parts).toEqual([34, 33, 33]);
  });
});
