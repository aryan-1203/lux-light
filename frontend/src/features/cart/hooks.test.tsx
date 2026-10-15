import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { createQueryClient } from '@/api/queryClient';
import { queryKeys } from '@/api/queryKeys';
import { useUIStore } from '@/stores/ui';
import {
  useAddToCart,
  useApplyPromo,
  useCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from './hooks';

function setup() {
  const client = createQueryClient();
  client.setDefaultOptions({ queries: { retry: false } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

describe('cart hooks (against MSW fallbacks)', () => {
  it('adds, updates, applies a promo and removes — writing the cart cache each time', async () => {
    const { client, wrapper } = setup();
    const { result } = renderHook(
      () => ({
        cart: useCart(),
        add: useAddToCart(),
        update: useUpdateCartItem(),
        remove: useRemoveCartItem(),
        promo: useApplyPromo(),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.cart.data?.item_count).toBe(0));

    await act(() => result.current.add.mutateAsync({ variantId: 3 }));
    expect(useUIStore.getState().cartDrawerOpen).toBe(true);
    const lineId =
      client.getQueryData<{ items: Array<{ id: number }> }>(queryKeys.cart(null))?.items[0]?.id ??
      -1;
    await waitFor(() => expect(result.current.cart.data?.item_count).toBe(1));

    await act(() => result.current.update.mutateAsync({ itemId: lineId, quantity: 2 }));
    await waitFor(() => expect(result.current.cart.data?.totals.subtotal_paise).toBe(999800));

    await act(() => result.current.promo.mutateAsync({ code: 'welcome10' }));
    await waitFor(() => expect(result.current.cart.data?.totals.discount_paise).toBe(50000));

    await act(() => result.current.remove.mutateAsync({ itemId: lineId }));
    await waitFor(() => expect(result.current.cart.data?.items).toHaveLength(0));
  });

  it('surfaces contract error codes as ApiError', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useAddToCart(), { wrapper });
    await expect(
      result.current.mutateAsync({ variantId: 10, openDrawer: false }),
    ).rejects.toMatchObject({
      code: 'OUT_OF_STOCK',
      status: 409,
    });
  });
});
