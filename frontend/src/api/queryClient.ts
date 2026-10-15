import { QueryClient } from '@tanstack/react-query';

/** Status codes that will not succeed on retry. */
function isClientError(error: unknown): boolean {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === 'number' && status >= 400 && status < 500;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => !isClientError(error) && failureCount < 2,
      },
      mutations: { retry: false },
    },
  });
}

/** App-wide singleton (also used by the API client to clear the session on refresh failure). */
export const queryClient = createQueryClient();
