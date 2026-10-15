import { QueryClientProvider } from '@tanstack/react-query';
import { domAnimation, LazyMotion, MotionConfig } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { queryClient } from '@/api/queryClient';
import i18n from '@/i18n';
import SmoothScroll from '@/layout/SmoothScroll';
import { routes } from './routes';

const router = createBrowserRouter(routes, {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});

const QueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools })),
    )
  : null;

/** Blank dark frame while the first translations load (avoids a flash of keys). */
function BootFallback() {
  return <div className="min-h-dvh bg-bg" aria-busy="true" />;
}

export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <LazyMotion features={domAnimation}>
            <MotionConfig reducedMotion="user">
              <SmoothScroll>
                <Suspense fallback={<BootFallback />}>
                  <RouterProvider router={router} future={{ v7_startTransition: true }} />
                </Suspense>
              </SmoothScroll>
            </MotionConfig>
          </LazyMotion>
        </I18nextProvider>
        {QueryDevtools ? (
          <Suspense fallback={null}>
            <QueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
          </Suspense>
        ) : null}
      </QueryClientProvider>
    </HelmetProvider>
  );
}
