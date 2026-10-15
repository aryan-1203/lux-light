import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductIllustration } from './ProductIllustration';

describe('ProductIllustration', () => {
  it('is decorative by default and labelled when titled', () => {
    const { container } = render(<ProductIllustration slug="dawnlit-go" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    render(
      <ProductIllustration slug="dawnlit-panel" title="Dawnlit Panel, switched on" kelvin={6500} />,
    );
    expect(screen.getByRole('img', { name: 'Dawnlit Panel, switched on' })).toBeInTheDocument();
  });

  it('uses unique gradient ids per instance', () => {
    const { container } = render(
      <>
        <ProductIllustration slug="dawnlit-desk" />
        <ProductIllustration slug="dawnlit-desk" lit={false} />
      </>,
    );
    const ids = [...container.querySelectorAll('radialGradient')].map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
