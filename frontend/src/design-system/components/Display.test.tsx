import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useUIStore } from '@/stores/ui';
import { renderWithProviders } from '@/test/utils';
import { AnimatedCounter } from './AnimatedCounter';
import { Badge } from './Badge';
import { Price } from './Price';
import { Rating } from './Rating';
import { Skeleton } from './Skeleton';
import { Spinner } from './Spinner';
import { StaggerText } from './StaggerText';
import { ToastRegion } from './ToastRegion';
import { Heading, Text } from './Typography';

describe('Price', () => {
  it('shows compare-at strike and savings with screen-reader context', () => {
    renderWithProviders(<Price paise={899900} compareAtPaise={999800} showSavings />);
    expect(screen.getByText('₹8,999')).toBeInTheDocument();
    expect(screen.getByText('₹9,998').closest('s')).not.toBeNull();
    expect(screen.getByText('Save ₹999')).toBeInTheDocument();
    expect(screen.getByText('Originally')).toHaveClass('sr-only');
  });

  it('hides compare-at when not discounted and supports "From"', () => {
    renderWithProviders(<Price paise={499900} compareAtPaise={null} from />);
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(document.querySelector('s')).toBeNull();
  });
});

describe('Rating', () => {
  it('exposes one accessible label', () => {
    renderWithProviders(<Rating value={4.67} count={6} />);
    expect(
      screen.getByRole('img', { name: 'Rated 4.7 out of 5 from 6 reviews' }),
    ).toBeInTheDocument();
  });
});

describe('Typography, Badge, Skeleton, Spinner', () => {
  it('renders semantic heading levels independent of size', () => {
    renderWithProviders(
      <>
        <Heading level={2} size="display">
          Your own sunrise
        </Heading>
        <Text tone="muted">Body</Text>
        <Badge tone="success">In stock</Badge>
        <Skeleton />
        <Spinner />
      </>,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Your own sunrise' })).toHaveClass(
      'text-display',
    );
    expect(screen.getByText('Body')).toHaveClass('text-muted');
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
  });
});

describe('StaggerText & AnimatedCounter', () => {
  it('reads as one phrase for assistive tech', () => {
    renderWithProviders(<StaggerText as="h2" text="Why mornings feel hard" immediate />);
    expect(screen.getByRole('heading', { name: /Why mornings feel hard/ })).toBeInTheDocument();
  });

  it('exposes the final counter value to screen readers', () => {
    renderWithProviders(<AnimatedCounter value={10000} />);
    expect(screen.getAllByText('10,000').length).toBeGreaterThan(0);
  });
});

describe('ToastRegion', () => {
  it('renders toasts from the store, announces them and dismisses', async () => {
    const { user } = renderWithProviders(<ToastRegion />);
    act(() => {
      useUIStore
        .getState()
        .pushToast({ tone: 'success', title: 'Coupon applied', description: 'You saved ₹500' });
      useUIStore.getState().pushToast({ tone: 'error', title: 'Payment failed' });
    });
    expect(screen.getByRole('status')).toHaveTextContent('Coupon applied. You saved ₹500');
    expect(screen.getByRole('alert')).toHaveTextContent('Payment failed');
    const dismiss = screen.getAllByRole('button', { name: 'Dismiss notification' });
    await user.click(dismiss[0] as HTMLElement);
    expect(useUIStore.getState().toasts.map((t) => t.title)).toEqual(['Payment failed']);
  });
});
