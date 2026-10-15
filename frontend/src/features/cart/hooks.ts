/**
 * Cart hooks (PLAN §4.2 — stub by Foundation, owned by Frontend Commerce).
 * All mutations resolve to the new Cart and write it into the ['cart', …] cache.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { api, unwrap, type ApiError } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { Cart, PaymentMethod } from '@/api/types';
import { useUIStore } from '@/stores/ui';

function writeCart(qc: QueryClient, cart: Cart): void {
  qc.setQueryData(queryKeys.cart(cart.payment_method ?? null), cart);
  if (cart.payment_method) qc.setQueryData(queryKeys.cart(null), cart);
  // Other payment-method views of the cart are now stale (totals differ by COD fee).
  void qc.invalidateQueries({
    queryKey: ['cart'],
    predicate: (q) => q.queryKey[1] !== (cart.payment_method ?? null) && q.queryKey[1] !== null,
  });
}

export function useCart(opts?: {
  paymentMethod?: PaymentMethod | null;
}): UseQueryResult<Cart, ApiError> {
  const paymentMethod = opts?.paymentMethod ?? null;
  return useQuery<Cart, ApiError>({
    queryKey: queryKeys.cart(paymentMethod),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/v1/cart', {
          params: { query: paymentMethod ? { payment_method: paymentMethod } : {} },
          signal,
        }),
      ),
    staleTime: 15_000,
  });
}

export function useAddToCart(): UseMutationResult<
  Cart,
  ApiError,
  { variantId: number; quantity?: number; openDrawer?: boolean }
> {
  const qc = useQueryClient();
  const openCartDrawer = useUIStore((s) => s.openCartDrawer);
  return useMutation<
    Cart,
    ApiError,
    { variantId: number; quantity?: number; openDrawer?: boolean }
  >({
    mutationFn: async ({ variantId, quantity = 1 }) =>
      unwrap(await api.POST('/api/v1/cart/items', { body: { variant_id: variantId, quantity } })),
    onSuccess: (cart, vars) => {
      writeCart(qc, cart);
      if (vars.openDrawer ?? true) openCartDrawer();
    },
  });
}

export function useUpdateCartItem(): UseMutationResult<
  Cart,
  ApiError,
  { itemId: number; quantity: number }
> {
  const qc = useQueryClient();
  return useMutation<Cart, ApiError, { itemId: number; quantity: number }>({
    mutationFn: async ({ itemId, quantity }) =>
      unwrap(
        await api.PATCH('/api/v1/cart/items/{item_id}', {
          params: { path: { item_id: itemId } },
          body: { quantity },
        }),
      ),
    onSuccess: (cart) => writeCart(qc, cart),
  });
}

export function useRemoveCartItem(): UseMutationResult<Cart, ApiError, { itemId: number }> {
  const qc = useQueryClient();
  return useMutation<Cart, ApiError, { itemId: number }>({
    mutationFn: async ({ itemId }) =>
      unwrap(
        await api.DELETE('/api/v1/cart/items/{item_id}', { params: { path: { item_id: itemId } } }),
      ),
    onSuccess: (cart) => writeCart(qc, cart),
  });
}

export function useApplyPromo(): UseMutationResult<Cart, ApiError, { code: string }> {
  const qc = useQueryClient();
  return useMutation<Cart, ApiError, { code: string }>({
    mutationFn: async ({ code }) =>
      unwrap(await api.POST('/api/v1/cart/promos', { body: { code: code.trim().toUpperCase() } })),
    onSuccess: (cart) => writeCart(qc, cart),
  });
}

export function useRemovePromo(): UseMutationResult<Cart, ApiError, { code: string }> {
  const qc = useQueryClient();
  return useMutation<Cart, ApiError, { code: string }>({
    mutationFn: async ({ code }) =>
      unwrap(await api.DELETE('/api/v1/cart/promos/{code}', { params: { path: { code } } })),
    onSuccess: (cart) => writeCart(qc, cart),
  });
}
