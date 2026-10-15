import { lazy, Suspense, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  BRAND_LEGAL_NAME,
  BRAND_NAME,
  SOCIAL_LINKS,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
} from '@/config/brand';
import { env } from '@/config/env';
import { GrainOverlay } from '@/design-system';
import { useUIStore } from '@/stores/ui';
import Footer from './Footer';
import Header from './Header';
import PageTransition from './PageTransition';
import RouteAnnouncer from './RouteAnnouncer';
import ScrollToTop from './ScrollToTop';
import SkipLink, { MAIN_CONTENT_ID } from './SkipLink';

// Overlays load on first use (keeps dialogs/focus-trap code and toasts off the critical path).
const CartDrawer = lazy(() => import('@/features/cart/CartDrawer'));
const MobileNav = lazy(() => import('./MobileNav'));
const Toaster = lazy(() => import('./Toaster'));

/** True once `flag` has been true at least once (mount-on-first-use, then keep mounted for exit animations). */
function useLatch(flag: boolean): boolean {
  const [latched, setLatched] = useState(flag);
  useEffect(() => {
    if (flag) setLatched(true);
  }, [flag]);
  return latched || flag;
}

const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: BRAND_NAME,
  legalName: BRAND_LEGAL_NAME,
  url: env.siteUrl,
  logo: `${env.siteUrl}/icons/icon-512.png`,
  sameAs: SOCIAL_LINKS.map((s) => s.href),
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: SUPPORT_EMAIL,
      telephone: SUPPORT_PHONE,
      areaServed: 'IN',
    },
  ],
};

/** Storefront chrome: skip link, header, animated route outlet, footer, drawers, toasts, a11y helpers. */
export default function AppShell() {
  const showCart = useLatch(useUIStore((s) => s.cartDrawerOpen));
  const showNav = useLatch(useUIStore((s) => s.mobileNavOpen));
  const showToasts = useLatch(useUIStore((s) => s.toasts.length > 0));

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(organizationLd)}</script>
      </Helmet>
      <SkipLink />
      <ScrollToTop />
      <div className="relative flex min-h-dvh flex-col">
        <Header />
        <main id={MAIN_CONTENT_ID} tabIndex={-1} className="relative flex-1 outline-none">
          <PageTransition />
        </main>
        <Footer />
      </div>
      <Suspense fallback={null}>
        {showNav ? <MobileNav /> : null}
        {showCart ? <CartDrawer /> : null}
        {showToasts ? <Toaster /> : null}
      </Suspense>
      <RouteAnnouncer />
      <GrainOverlay />
    </>
  );
}
