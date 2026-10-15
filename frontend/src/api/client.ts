/**
 * Typed API client (PLAN §4.2, owner 6).
 *
 * - `api` is an openapi-fetch client over the generated `paths`; every call goes through `apiFetch`.
 * - Cookies are first-party (same origin via Vite proxy / nginx), sent with `credentials: 'include'`.
 * - Unsafe methods carry `X-CSRF-Token` (double-submit against the readable `dl_csrf` cookie).
 * - 401 AUTH_TOKEN_EXPIRED → single-flight POST /auth/refresh → retry once; refresh failure →
 *   session cache cleared (`queryKeys.me` → null) and the original 401 surfaces as ApiError.
 * - 403 CSRF_FAILED → ensureCsrfToken(true) → retry once.
 * - Network failures surface as ApiError(status 0, code NETWORK_ERROR).
 */
import createClient, { type Client } from 'openapi-fetch';
import type { components, paths } from './schema';
import { queryClient } from './queryClient';
import { queryKeys } from './queryKeys';

export type Schemas = components['schemas'];
type ErrorResponseBody = Schemas['ErrorResponse'];

const CSRF_COOKIE = 'dl_csrf';
const CSRF_HEADER = 'X-CSRF-Token';
const API_PREFIX = '/api/v1';
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
/** Endpoints that must never trigger the refresh/retry dance (avoid loops). */
const NO_REFRESH_PATHS = [
  '/auth/refresh',
  '/auth/login',
  '/auth/signup',
  '/auth/otp/verify',
  '/auth/logout',
];

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown> | null;

  constructor(status: number, body: ErrorResponseBody | null, fallbackMessage?: string) {
    super(body?.error.message ?? fallbackMessage ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = body?.error.code ?? (status === 0 ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR');
    this.details = body?.error.details ?? null;
  }
}

export function isApiError(e: unknown, code?: string): e is ApiError {
  return e instanceof ApiError && (code === undefined || e.code === code);
}

export function isErrorResponse(value: unknown): value is ErrorResponseBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;
  const err = (value as { error: unknown }).error;
  return (
    typeof err === 'object' &&
    err !== null &&
    typeof (err as { code?: unknown }).code === 'string' &&
    typeof (err as { message?: unknown }).message === 'string'
  );
}

/** Throws ApiError for any non-2xx result, otherwise returns `data`. */
export function unwrap<T>(r: { data?: T; error?: unknown; response: Response }): T {
  if (r.error !== undefined || !r.response.ok) {
    throw new ApiError(r.response.status, isErrorResponse(r.error) ? r.error : null);
  }
  return r.data as T;
}

// ---------------------------------------------------------------- CSRF

let csrfMemo: string | null = null;
let csrfInFlight: Promise<string> | null = null;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

/** Current CSRF token: the `dl_csrf` cookie (authoritative), else the last issued token. */
export function getCsrfToken(): string | null {
  return readCookie(CSRF_COOKIE) ?? csrfMemo;
}

function origin(): string {
  return typeof window !== 'undefined' && window.location ? window.location.origin : '';
}

/**
 * Makes sure a CSRF token exists (GET /api/v1/auth/csrf when the cookie is missing, or always
 * when `force`). Single-flight: concurrent callers share one request.
 */
export function ensureCsrfToken(force = false): Promise<string> {
  const existing = getCsrfToken();
  if (existing && !force) return Promise.resolve(existing);
  if (csrfInFlight) return csrfInFlight;
  csrfInFlight = (async () => {
    try {
      const res = await fetch(`${origin()}${API_PREFIX}/auth/csrf`, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const body = (await res.json().catch(() => null)) as Schemas['CsrfTokenResponse'] | null;
      if (!res.ok) throw new ApiError(res.status, isErrorResponse(body) ? body : null);
      csrfMemo = body?.csrf_token ?? null;
      const token = readCookie(CSRF_COOKIE) ?? csrfMemo;
      if (!token) throw new ApiError(res.status, null, 'CSRF token missing from response');
      return token;
    } catch (e) {
      throw toApiError(e);
    } finally {
      csrfInFlight = null;
    }
  })();
  return csrfInFlight;
}

// ---------------------------------------------------------------- refresh

let refreshInFlight: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const token = await ensureCsrfToken();
      const res = await fetch(`${origin()}${API_PREFIX}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json', [CSRF_HEADER]: token },
      });
      if (!res.ok) return false;
      const body = (await res.json().catch(() => null)) as Schemas['AuthResponse'] | null;
      if (body?.user) queryClient.setQueryData(queryKeys.me, body.user);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

/** Called when the session cannot be refreshed: continue as guest. */
function onSessionLost(): void {
  queryClient.setQueryData(queryKeys.me, null);
}

// ---------------------------------------------------------------- fetch wrapper

function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  if (e instanceof DOMException && e.name === 'AbortError') throw e;
  return new ApiError(0, null, 'Network error — check your connection and try again.');
}

async function readErrorCode(res: Response): Promise<string | null> {
  if (res.ok) return null;
  try {
    const body: unknown = await res.clone().json();
    return isErrorResponse(body) ? body.error.code : null;
  } catch {
    return null;
  }
}

/** fetch used by `api` (also usable directly for non-JSON endpoints such as invoice PDFs). */
export async function apiFetch(input: Request): Promise<Response> {
  const method = input.method.toUpperCase();
  const unsafe = UNSAFE_METHODS.has(method);
  const pathname = new URL(input.url, origin() || 'http://localhost').pathname;
  const canRefresh = !NO_REFRESH_PATHS.some((p) => pathname.endsWith(p));
  // Buffer the body once so the request can be replayed.
  const body = unsafe ? await input.arrayBuffer() : undefined;

  const send = async (): Promise<Response> => {
    const headers = new Headers(input.headers);
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
    if (unsafe) headers.set(CSRF_HEADER, await ensureCsrfToken());
    try {
      return await fetch(input.url, {
        method,
        headers,
        body: body && body.byteLength > 0 ? body : undefined,
        credentials: 'include',
        signal: input.signal,
      });
    } catch (e) {
      throw toApiError(e);
    }
  };

  let res = await send();

  if (res.status === 403 && (await readErrorCode(res)) === 'CSRF_FAILED') {
    await ensureCsrfToken(true);
    res = await send();
  }

  if (res.status === 401 && canRefresh && (await readErrorCode(res)) === 'AUTH_TOKEN_EXPIRED') {
    if (await refreshSession()) {
      res = await send();
    } else {
      onSessionLost();
    }
  }

  return res;
}

export const api: Client<paths> = createClient<paths>({
  baseUrl: origin(),
  fetch: apiFetch,
});

/** Test helper: forget cached CSRF/refresh state between tests. */
export function __resetClientState(): void {
  csrfMemo = null;
  csrfInFlight = null;
  refreshInFlight = null;
}
