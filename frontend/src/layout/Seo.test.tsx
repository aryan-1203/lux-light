import { render, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Seo from './Seo';

function renderSeo(path: string, el: JSX.Element) {
  render(
    <HelmetProvider>
      <MemoryRouter
        initialEntries={[path]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        {el}
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe('Seo', () => {
  it('formats the title, canonical, OG tags and JSON-LD', async () => {
    renderSeo(
      '/products/dawnlit-desk',
      <Seo
        title="Dawnlit Desk"
        description="A slim 10,000 lux desk lamp."
        ogType="product"
        jsonLd={{ '@type': 'Product', name: 'Dawnlit Desk' }}
      />,
    );
    await waitFor(() => expect(document.title).toBe('Dawnlit Desk · Dawnlit'));
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'http://localhost:5173/products/dawnlit-desk',
    );
    expect(document.querySelector('meta[property="og:type"]')).toHaveAttribute(
      'content',
      'product',
    );
    expect(document.querySelector('meta[property="og:image"]')).toHaveAttribute(
      'content',
      'http://localhost:5173/og/default.jpg',
    );
    const ld = document.querySelector('script[type="application/ld+json"]');
    expect(JSON.parse(ld?.textContent ?? '{}')).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Product',
    });
  });

  it('uses brand + tagline on home and supports noindex', async () => {
    renderSeo('/', <Seo title="Home" description="x" noindex />);
    await waitFor(() => expect(document.title).toBe('Dawnlit · Your own sunrise, on demand.'));
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    );
  });
});
