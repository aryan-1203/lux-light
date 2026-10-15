import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/mocks/server';
import { apiPath, errorJson } from '@/mocks/utils';
import { api, ApiError, ensureCsrfToken, getCsrfToken, isApiError, unwrap } from './client';
import { queryClient } from './queryClient';
import { queryKeys } from './queryKeys';

const user = {
  id: 9,
  email: 'a@b.c',
  full_name: 'A',
  phone: null,
  role: 'customer' as const,
  email_verified: true,
  has_password: true,
  marketing_opt_in: false,
  created_at: '2026-10-01T00:00:00Z',
};

describe('ensureCsrfToken', () => {
  it('fetches /auth/csrf once when no cookie exists (single-flight)', async () => {
    let calls = 0;
    server.use(
      http.get(apiPath('/auth/csrf'), () => {
        calls += 1;
        return HttpResponse.json({ csrf_token: 'tok-1' });
      }),
    );
    const [a, b] = await Promise.all([ensureCsrfToken(), ensureCsrfToken()]);
    expect(a).toBe('tok-1');
    expect(b).toBe('tok-1');
    expect(calls).toBe(1);
    expect(getCsrfToken()).toBe('tok-1');
  });

  it('prefers the dl_csrf cookie', async () => {
    document.cookie = 'dl_csrf=cookie-token; path=/';
    expect(await ensureCsrfToken()).toBe('cookie-token');
  });
});

describe('apiFetch', () => {
  it('sends X-CSRF-Token on unsafe methods only', async () => {
    document.cookie = 'dl_csrf=abc; path=/';
    const seen: Record<string, string | null> = {};
    server.use(
      http.get(apiPath('/cart'), ({ request }) => {
        seen.get = request.headers.get('X-CSRF-Token');
        return HttpResponse.json({});
      }),
      http.post(apiPath('/cart/items'), ({ request }) => {
        seen.post = request.headers.get('X-CSRF-Token');
        return HttpResponse.json({});
      }),
    );
    await api.GET('/api/v1/cart');
    await api.POST('/api/v1/cart/items', { body: { variant_id: 3, quantity: 1 } });
    expect(seen.get).toBeNull();
    expect(seen.post).toBe('abc');
  });

  it('retries once after CSRF_FAILED with a fresh token', async () => {
    document.cookie = 'dl_csrf=stale; path=/';
    const tokens: Array<string | null> = [];
    server.use(
      http.get(apiPath('/auth/csrf'), () => {
        document.cookie = 'dl_csrf=fresh; path=/';
        return HttpResponse.json({ csrf_token: 'fresh' });
      }),
      http.post(apiPath('/cart/promos'), ({ request }) => {
        const tok = request.headers.get('X-CSRF-Token');
        tokens.push(tok);
        return tok === 'fresh' ? HttpResponse.json({ ok: true }) : errorJson(403, 'CSRF_FAILED');
      }),
    );
    const r = await api.POST('/api/v1/cart/promos', { body: { code: 'WELCOME10' } });
    expect(r.response.status).toBe(200);
    expect(tokens).toEqual(['stale', 'fresh']);
  });

  it('refreshes once (single-flight) on AUTH_TOKEN_EXPIRED and retries', async () => {
    document.cookie = 'dl_csrf=abc; path=/';
    let refreshed = 0;
    let authed = false;
    server.use(
      http.post(apiPath('/auth/refresh'), () => {
        refreshed += 1;
        authed = true;
        return HttpResponse.json({ user, is_new_user: false, cart_merged: false });
      }),
      http.get(apiPath('/auth/me'), () =>
        authed ? HttpResponse.json(user) : errorJson(401, 'AUTH_TOKEN_EXPIRED'),
      ),
    );
    const [a, b] = await Promise.all([api.GET('/api/v1/auth/me'), api.GET('/api/v1/auth/me')]);
    expect(a.data?.email).toBe('a@b.c');
    expect(b.data?.email).toBe('a@b.c');
    expect(refreshed).toBe(1);
    expect(queryClient.getQueryData(queryKeys.me)).toEqual(user);
  });

  it('clears the session when refresh fails and surfaces the 401', async () => {
    document.cookie = 'dl_csrf=abc; path=/';
    queryClient.setQueryData(queryKeys.me, user);
    server.use(
      http.post(apiPath('/auth/refresh'), () => errorJson(401, 'AUTH_REFRESH_INVALID')),
      http.get(apiPath('/auth/me'), () => errorJson(401, 'AUTH_TOKEN_EXPIRED')),
    );
    const r = await api.GET('/api/v1/auth/me');
    expect(r.response.status).toBe(401);
    expect(queryClient.getQueryData(queryKeys.me)).toBeNull();
    expect(() => unwrap(r)).toThrow(ApiError);
  });

  it('maps network failures to ApiError NETWORK_ERROR', async () => {
    server.use(http.get(apiPath('/categories'), () => HttpResponse.error()));
    await expect(api.GET('/api/v1/categories')).rejects.toSatisfy((e) =>
      isApiError(e, 'NETWORK_ERROR'),
    );
  });
});

describe('unwrap / ApiError', () => {
  it('returns data on success and throws typed errors otherwise', async () => {
    const ok = await api.GET('/api/v1/categories');
    expect(unwrap(ok).items.length).toBe(3);
    const notFound = await api.GET('/api/v1/products/{slug}', {
      params: { path: { slug: 'nope' } },
    });
    try {
      unwrap(notFound);
      expect.unreachable();
    } catch (e) {
      expect(isApiError(e, 'PRODUCT_NOT_FOUND')).toBe(true);
      expect((e as ApiError).status).toBe(404);
    }
  });
});
