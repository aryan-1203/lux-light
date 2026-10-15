import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import { Accordion } from './Accordion';
import { Tabs } from './Tabs';

describe('Accordion', () => {
  it('toggles with keyboard and exposes aria-expanded inside headings', async () => {
    const { user } = renderWithProviders(
      <Accordion
        items={[
          { id: 'a', title: 'What does 10,000 lux mean?', content: 'Lux measures light.' },
          { id: 'b', title: 'How far should I sit?', content: '30–40 cm.' },
        ]}
      />,
    );
    const first = screen.getByRole('button', { name: 'What does 10,000 lux mean?' });
    expect(first.closest('h3')).not.toBeNull();
    expect(first).toHaveAttribute('aria-expanded', 'false');
    first.focus();
    await user.keyboard('{Enter}');
    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Lux measures light.')).toBeVisible();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'How far should I sit?' })).toHaveFocus();
  });
});

describe('Tabs', () => {
  it('switches panels with arrow keys', async () => {
    const { user } = renderWithProviders(
      <Tabs
        label="Product details"
        items={[
          { id: 'specs', label: 'Specs', content: 'Spec table' },
          { id: 'box', label: 'In the box', content: 'Lamp, adapter' },
        ]}
      />,
    );
    expect(screen.getByRole('tablist', { name: 'Product details' })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Specs' }));
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'In the box' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Lamp, adapter');
  });
});
