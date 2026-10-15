import { QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createQueryClient, queryClient as appQueryClient } from '@/api/queryClient';
import i18n from '@/i18n';

type Options = Omit<RenderOptions, 'wrapper'> & {
  /** Initial URL (MemoryRouter). */
  route?: string;
  /** Route pattern for params, e.g. '/products/:slug'. Defaults to '*'. */
  path?: string;
  /** Use the app-wide QueryClient (needed when code under test uses the API client's session reset). */
  useAppQueryClient?: boolean;
};

/** Renders with Router + React Query + Helmet + i18n; returns RTL utils and a userEvent instance. */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', path = '*', useAppQueryClient = false, ...opts }: Options = {},
) {
  const client = useAppQueryClient ? appQueryClient : createQueryClient();
  client.setDefaultOptions({
    queries: { retry: false, staleTime: 0 },
    mutations: { retry: false },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <HelmetProvider>
      <QueryClientProvider client={client}>
        <I18nextProvider i18n={i18n}>
          <MemoryRouter
            initialEntries={[route]}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <Routes>
              <Route path={path} element={children} />
            </Routes>
          </MemoryRouter>
        </I18nextProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
  return {
    user: userEvent.setup(),
    queryClient: client,
    ...render(ui, { wrapper: Wrapper, ...opts }),
  };
}
