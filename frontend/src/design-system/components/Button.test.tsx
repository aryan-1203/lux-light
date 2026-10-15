import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Link } from 'react-router-dom';
import { renderWithProviders } from '@/test/utils';
import { Button } from './Button';
import { MagneticButton } from './MagneticButton';

describe('Button', () => {
  it('renders a type=button by default and handles clicks', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(<Button onClick={onClick}>Add to cart</Button>);
    const btn = screen.getByRole('button', { name: 'Add to cart' });
    expect(btn).toHaveAttribute('type', 'button');
    await user.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('blocks clicks and sets aria-busy while loading', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <Button loading onClick={onClick}>
        Pay now
      </Button>,
    );
    const btn = screen.getByRole('button', { name: /pay now/i });
    expect(btn).toHaveAttribute('aria-busy', 'true');
    await user.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders the child element with asChild (router links)', () => {
    renderWithProviders(
      <Button asChild variant="secondary">
        <Link to="/shop">Shop</Link>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Shop' });
    expect(link).toHaveAttribute('href', '/shop');
    expect(link.className).toMatch(/min-h-touch/);
  });

  it('keeps a 44px minimum touch target in every size', () => {
    renderWithProviders(
      <>
        <Button size="sm">S</Button>
        <Button size="icon" aria-label="Icon">
          i
        </Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'S' }).className).toMatch(/min-h-touch/);
    expect(screen.getByRole('button', { name: 'Icon' }).className).toMatch(/size-touch/);
  });
});

describe('MagneticButton', () => {
  it('renders an accessible button (static when hover/pointer effects are unavailable)', () => {
    renderWithProviders(<MagneticButton>Find your routine</MagneticButton>);
    expect(screen.getByRole('button', { name: 'Find your routine' })).toBeInTheDocument();
  });
});
