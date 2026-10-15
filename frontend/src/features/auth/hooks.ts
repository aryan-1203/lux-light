/**
 * Session hooks (PLAN §4.2 — stub by Foundation, owned by Frontend Commerce).
 * `queryKeys.me` holds UserProfile | null (null = guest). The API client sets it to null when a
 * refresh fails, and to the refreshed user when a refresh succeeds.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { api, isApiError, unwrap, type ApiError } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { UserProfile, UserRole } from '@/api/types';

export function useSession(): {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
} {
  const query = useQuery<UserProfile | null, ApiError>({
    queryKey: queryKeys.me,
    queryFn: async ({ signal }) => {
      try {
        return unwrap(await api.GET('/api/v1/auth/me', { signal }));
      } catch (e) {
        if (isApiError(e) && e.status === 401) return null;
        throw e;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
  const user = query.data ?? null;
  return {
    user,
    isLoading: query.isPending,
    isAuthenticated: user !== null,
    role: user?.role ?? null,
  };
}

export function useLogout(): UseMutationResult<void, ApiError, void> {
  const qc = useQueryClient();
  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      const r = await api.POST('/api/v1/auth/logout');
      if (!r.response.ok) unwrap(r);
    },
    onSettled: () => {
      qc.setQueryData(queryKeys.me, null);
      void qc.invalidateQueries({ queryKey: ['cart'] });
      qc.removeQueries({ queryKey: ['orders'] });
      qc.removeQueries({ queryKey: queryKeys.addresses });
    },
  });
}
