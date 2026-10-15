/**
 * Route table (PLAN §2.2). Every page is a lazy chunk with a default export.
 * Storefront pages render inside AppShell (header/footer/transitions); /admin/* has its own shell.
 */
import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import RequireAuth from '@/features/auth/RequireAuth';
import AppShell from '@/layout/AppShell';
import ErrorBoundary from '@/layout/ErrorBoundary';
import RouteFallback from '@/layout/RouteFallback';

const HomePage = lazy(() => import('@/pages/Home/HomePage'));
const SciencePage = lazy(() => import('@/pages/Science/SciencePage'));
const QuizPage = lazy(() => import('@/pages/Quiz/QuizPage'));
const ShopPage = lazy(() => import('@/pages/Shop/ShopPage'));
const ProductPage = lazy(() => import('@/pages/Product/ProductPage'));
const CartPage = lazy(() => import('@/pages/Cart/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/Checkout/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('@/pages/OrderSuccess/OrderSuccessPage'));
const TrackOrderPage = lazy(() => import('@/pages/TrackOrder/TrackOrderPage'));
const LoginPage = lazy(() => import('@/pages/Auth/LoginPage'));
const SignupPage = lazy(() => import('@/pages/Auth/SignupPage'));
const AccountPage = lazy(() => import('@/pages/Account/AccountPage'));
const BlogListPage = lazy(() => import('@/pages/Blog/BlogListPage'));
const BlogPostPage = lazy(() => import('@/pages/Blog/BlogPostPage'));
const FAQPage = lazy(() => import('@/pages/FAQ/FAQPage'));
const ContactPage = lazy(() => import('@/pages/Contact/ContactPage'));
const PolicyPage = lazy(() => import('@/pages/Policies/PolicyPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFound/NotFoundPage'));
const AdminApp = lazy(() => import('@/admin/AdminApp'));

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/science', element: <SciencePage /> },
      { path: '/quiz', element: <QuizPage /> },
      { path: '/shop', element: <ShopPage /> },
      { path: '/shop/:categorySlug', element: <ShopPage /> },
      { path: '/products/:slug', element: <ProductPage /> },
      { path: '/cart', element: <CartPage /> },
      { path: '/checkout', element: <CheckoutPage /> },
      { path: '/order/:orderNumber/success', element: <OrderSuccessPage /> },
      { path: '/track', element: <TrackOrderPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      {
        path: '/account/*',
        element: (
          <RequireAuth>
            <AccountPage />
          </RequireAuth>
        ),
      },
      { path: '/blog', element: <BlogListPage /> },
      { path: '/blog/:slug', element: <BlogPostPage /> },
      { path: '/faq', element: <FAQPage /> },
      { path: '/contact', element: <ContactPage /> },
      { path: '/policies/:policy', element: <PolicyPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/admin/*',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <RequireAuth roles={['staff', 'admin']}>
            <AdminApp />
          </RequireAuth>
        </Suspense>
      </ErrorBoundary>
    ),
  },
];
