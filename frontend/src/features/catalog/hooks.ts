/** Catalog hooks (PLAN §4.2 — stub by Foundation, owned by Frontend Commerce). */
import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api, unwrap, type ApiError, type Schemas } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { ProductDetail, ProductSort } from '@/api/types';

export type ProductListParams = {
  category?: string;
  sort?: ProductSort;
  q?: string;
  /** The contract has no `featured` filter: `featured: true` maps to `sort=featured`. */
  featured?: boolean;
  page?: number;
  page_size?: number;
};

export function useProducts(
  params?: ProductListParams,
): UseQueryResult<Schemas['ProductListPage'], ApiError> {
  const { featured, ...rest } = params ?? {};
  const query = { ...rest, sort: rest.sort ?? (featured ? 'featured' : undefined) };
  return useQuery<Schemas['ProductListPage'], ApiError>({
    queryKey: queryKeys.products(params ?? {}),
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/api/v1/products', { params: { query }, signal })),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useProduct(slug: string): UseQueryResult<ProductDetail, ApiError> {
  return useQuery<ProductDetail, ApiError>({
    queryKey: queryKeys.product(slug),
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/api/v1/products/{slug}', { params: { path: { slug } }, signal })),
    enabled: slug.length > 0,
    staleTime: 60_000,
  });
}

export function useCategories(): UseQueryResult<Schemas['CategoryListResponse'], ApiError> {
  return useQuery<Schemas['CategoryListResponse'], ApiError>({
    queryKey: queryKeys.categories,
    queryFn: async ({ signal }) => unwrap(await api.GET('/api/v1/categories', { signal })),
    staleTime: 5 * 60_000,
  });
}
