import { screen } from '@testing-library/react';
import type * as FramerMotion from 'framer-motion';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import { CursorSpotlight } from './CursorSpotlight';
import { Marquee } from './Marquee';
import { StaggerText } from './StaggerText';

vi.mock('framer-motion', async (importOriginal) => ({
  ...(await importOriginal<typeof FramerMotion>()),
  useReducedMotion: () => true,
}));

describe('prefers-reduced-motion', () => {
  it('Marquee renders static content without duplicates or controls', () => {
    renderWithProviders(
      <Marquee label="Trusted by">
        <span>30-day returns</span>
      </Marquee>,
    );
    expect(screen.getAllByText('30-day returns')).toHaveLength(1);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('CursorSpotlight is not rendered', () => {
    const { container } = renderWithProviders(<CursorSpotlight />);
    expect(container).toBeEmptyDOMElement();
  });

  it('StaggerText renders plain text', () => {
    renderWithProviders(<StaggerText as="p" text="Ten minutes a day" />);
    expect(screen.getByText('Ten minutes a day').tagName).toBe('P');
  });
});
