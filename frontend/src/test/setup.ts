import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { __resetClientState } from '@/api/client';
import { queryClient } from '@/api/queryClient';
import i18n, { DEFAULT_NAMESPACES, i18nReady } from '@/i18n';
import { server } from '@/mocks/server';
import { mockState } from '@/mocks/state';
import { useUIStore } from '@/stores/ui';

// jsdom gaps used by the design system.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    // Plain functions (not vi.fn): `restoreMocks` would wipe mock implementations between tests.
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

class MockObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): [] {
    return [];
  }
}
if (!('IntersectionObserver' in window)) {
  Object.defineProperty(window, 'IntersectionObserver', { writable: true, value: MockObserver });
}
if (!('ResizeObserver' in window)) {
  Object.defineProperty(window, 'ResizeObserver', { writable: true, value: MockObserver });
}
window.scrollTo = (() => undefined) as typeof window.scrollTo;
Element.prototype.scrollIntoView = () => undefined;

const initialUI = useUIStore.getState();

beforeAll(async () => {
  server.listen({ onUnhandledRequest: 'error' });
  await i18nReady;
  await i18n.loadNamespaces([...DEFAULT_NAMESPACES]);
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  mockState.reset();
  queryClient.clear();
  __resetClientState();
  useUIStore.setState(initialUI, true);
  document.cookie.split('; ').forEach((c) => {
    const name = c.split('=')[0];
    if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
});

afterAll(() => server.close());
