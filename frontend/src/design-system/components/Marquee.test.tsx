import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import { Marquee } from './Marquee';

describe('Marquee', () => {
  it('duplicates content for the loop (hidden + inert) and can be paused', async () => {
    const { user } = renderWithProviders(
      <Marquee label="Our promise">
        <span>12-month warranty</span>
      </Marquee>,
    );
    expect(screen.getByRole('region', { name: 'Our promise' })).toBeInTheDocument();
    const copies = screen.getAllByText('12-month warranty');
    expect(copies).toHaveLength(2);
    expect(copies[1]?.parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(copies[1]?.parentElement).toHaveAttribute('inert');
    const pause = screen.getByRole('button', { name: 'Pause animation' });
    await user.click(pause);
    expect(screen.getByRole('button', { name: 'Play animation' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
