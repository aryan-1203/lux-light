import { AnimatePresence, m, useIsPresent } from 'framer-motion';
import { Suspense, useRef } from 'react';
import {
  UNSAFE_LocationContext,
  useLocation,
  useNavigationType,
  useOutlet,
} from 'react-router-dom';
import { pageTransition } from '@/design-system';
import ErrorBoundary from './ErrorBoundary';
import RouteFallback from './RouteFallback';

/** Sections with nested routing transition as one page (sub-tabs don't replay the page transition). */
function transitionKey(pathname: string): string {
  if (pathname.startsWith('/account')) return '/account';
  return pathname;
}

/**
 * While present: renders the live outlet. While exiting: keeps rendering the outlet *and location*
 * it had when it was last present, so the leaving page neither swaps content nor reacts to the
 * next URL (e.g. auth guards redirecting again).
 */
function PresenceOutlet() {
  const outlet = useOutlet();
  const location = useLocation();
  const navigationType = useNavigationType();
  const isPresent = useIsPresent();
  const snapshot = useRef({ outlet, location, navigationType });
  if (isPresent) snapshot.current = { outlet, location, navigationType };
  return (
    <UNSAFE_LocationContext.Provider
      value={{
        location: snapshot.current.location,
        navigationType: snapshot.current.navigationType,
      }}
    >
      {snapshot.current.outlet}
    </UNSAFE_LocationContext.Provider>
  );
}

/**
 * Route transition: AnimatePresence keyed by location (fade + slight rise; exit faster than enter).
 * Under reduced motion, MotionConfig reduces it to an opacity crossfade.
 */
export default function PageTransition() {
  const location = useLocation();
  const key = transitionKey(location.pathname);
  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div key={key} variants={pageTransition} initial="initial" animate="animate" exit="exit">
        <ErrorBoundary resetKey={key}>
          <Suspense fallback={<RouteFallback />}>
            <PresenceOutlet />
          </Suspense>
        </ErrorBoundary>
      </m.div>
    </AnimatePresence>
  );
}
