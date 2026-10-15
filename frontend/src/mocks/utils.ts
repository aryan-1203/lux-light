import { HttpResponse } from 'msw';
import type { ErrorResponse } from '@/api/types';

/** apiPath('/cart') → '/api/v1/cart' (relative: matches the page origin in browser and jsdom). */
export function apiPath(path: string): string {
  return `/api/v1${path.startsWith('/') ? path : `/${path}`}`;
}

const DEFAULT_MESSAGES: Record<number, string> = {
  400: 'Bad request',
  401: 'Authentication required',
  403: 'Forbidden',
  404: 'Not found',
  409: 'Conflict',
  422: 'Unprocessable entity',
  429: 'Too many requests',
  500: 'Internal error',
  502: 'Bad gateway',
};

/**
 * Contract-shaped error response: {"error": {code, message, details}}.
 * Typed as HttpResponse<never> so it unions cleanly with a handler's success type
 * (`return ok ? HttpResponse.json<Cart>(cart) : errorJson(409, 'OUT_OF_STOCK')`).
 */
export function errorJson(
  status: number,
  code: string,
  message?: string,
  details: Record<string, unknown> | null = null,
): HttpResponse<never> {
  const body: ErrorResponse = {
    error: { code, message: message ?? DEFAULT_MESSAGES[status] ?? code, details },
  };
  return HttpResponse.json(body, {
    status,
    headers: status === 429 ? { 'Retry-After': '30' } : undefined,
  }) as unknown as HttpResponse<never>;
}

/** Server-style pagination over an in-memory list using `page` / `page_size` query params. */
export function paginate<T>(
  items: T[],
  url: URL | string,
): { items: T[]; page: number; page_size: number; total: number } {
  const u = typeof url === 'string' ? new URL(url) : url;
  const page = Math.max(1, Number(u.searchParams.get('page') ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(u.searchParams.get('page_size') ?? 20) || 20));
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    page,
    page_size: pageSize,
    total: items.length,
  };
}

/** Mimics the backend CSRF middleware: unsafe methods need X-CSRF-Token (value not checked in mocks). */
export function csrfError(request: Request) {
  const unsafe = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method.toUpperCase());
  if (unsafe && !request.headers.get('X-CSRF-Token'))
    return errorJson(403, 'CSRF_FAILED', 'CSRF token missing');
  return null;
}

/** Simulated latency for dev (0 in tests). */
export function mockDelay(): number {
  return import.meta.env.MODE === 'test' ? 0 : 250;
}
