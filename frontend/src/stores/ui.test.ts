import { describe, expect, it } from 'vitest';
import { useUIStore } from './ui';

describe('useUIStore', () => {
  it('opens the cart drawer and closes the mobile nav', () => {
    useUIStore.getState().setMobileNavOpen(true);
    useUIStore.getState().openCartDrawer();
    expect(useUIStore.getState().cartDrawerOpen).toBe(true);
    expect(useUIStore.getState().mobileNavOpen).toBe(false);
    useUIStore.getState().toggleCartDrawer();
    expect(useUIStore.getState().cartDrawerOpen).toBe(false);
  });

  it('pushes and dismisses toasts with unique ids (max 4 kept)', () => {
    const ids = Array.from({ length: 5 }, (_, i) =>
      useUIStore.getState().pushToast({ tone: 'info', title: `t${i}` }),
    );
    expect(new Set(ids).size).toBe(5);
    expect(useUIStore.getState().toasts.map((t) => t.title)).toEqual(['t1', 't2', 't3', 't4']);
    useUIStore.getState().dismissToast(ids[4] as string);
    expect(useUIStore.getState().toasts).toHaveLength(3);
  });

  it('stores the lux level', () => {
    useUIStore.getState().setLuxLevel(10000);
    expect(useUIStore.getState().luxLevel).toBe(10000);
  });
});
