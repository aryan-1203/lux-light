import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelmetProvider } from 'react-helmet-async';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { queryClient } from '@/api/queryClient';
import { DISCLAIMER } from '@/config/brand';
import { mockState } from '@/mocks/state';
import { routes } from '@/routes';

function renderApp(path = '/') {
  const router = createMemoryRouter(routes, {
    initialEntries: [path],
    future: { v7_relativeSplatPath: true },
  });
  render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </QueryClientProvider>
    </HelmetProvider>,
  );
  return { router, user: userEvent.setup() };
}

describe('AppShell', () => {
  it('renders landmarks, skip link, primary nav and the exact disclaimer', async () => {
    renderApp('/');
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    for (const name of ['Shop', 'Science', 'Find your routine', 'Blog']) {
      expect(within(nav).getByRole('link', { name })).toBeInTheDocument();
    }
    expect(screen.getByTestId('footer-disclaimer')).toHaveTextContent(
      new RegExp(`^${DISCLAIMER.replace('.', '\\.')}$`),
    );
    expect(screen.getByText(/BIS R-number/)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('shows the cart count from the API and opens the cart drawer', async () => {
    mockState.cart.add(3, 2);
    const { user } = renderApp('/');
    const cartButton = await screen.findByRole('button', { name: 'Cart, 2 items' });
    await user.click(cartButton);
    const drawer = await screen.findByRole('dialog', { name: 'Your cart' });
    expect(
      await within(drawer).findByText('Dawnlit Desk — 10,000 lux desk lamp'),
    ).toBeInTheDocument();
  });

  it('lazy-loads every route in the PLAN route table', async () => {
    const expected: Array<[string, string]> = [
      ['/science', 'The science of light'],
      ['/quiz', 'Find your routine'],
      ['/shop', 'Shop'],
      ['/shop/panels', 'Shop'],
      ['/products/dawnlit-desk', 'Product'],
      ['/cart', 'Your cart'],
      ['/checkout', 'Checkout'],
      ['/order/DL-261015-ABC123/success', 'Order confirmed'],
      ['/track', 'Track your order'],
      ['/login', 'Log in'],
      ['/signup', 'Create account'],
      ['/blog', 'Journal'],
      ['/blog/what-is-lux', 'Article'],
      ['/faq', 'FAQ'],
      ['/contact', 'Contact us'],
      ['/policies/privacy', 'Policies'],
      ['/no-such-page', "We couldn't find that page"],
    ];
    const { router } = renderApp('/');
    await screen.findByRole('heading', { level: 1, name: 'Home' });
    for (const [path, title] of expected) {
      await router.navigate(path);
      await screen.findByRole('heading', { level: 1, name: title }, { timeout: 3000 });
      expect(router.state.location.pathname).toBe(path);
    }
  });

  it('redirects guests from /account to /login?next=', async () => {
    const { router } = renderApp('/account/orders');
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(router.state.location.search).toBe('?next=%2Faccount%2Forders');
  });

  it('shows a 403 view for customers on /admin', async () => {
    mockState.session.login('priya.demo@example.com');
    renderApp('/admin');
    expect(
      await screen.findByRole('heading', { name: "You don't have access to this page" }),
    ).toBeInTheDocument();
  });
});
