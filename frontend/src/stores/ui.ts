import { create, type StoreApi, type UseBoundStore } from 'zustand';

export type LuxLevel = 100 | 500 | 1000 | 10000;

export type Toast = {
  id: string;
  tone: 'info' | 'success' | 'error';
  title: string;
  description?: string;
  durationMs?: number;
};

export interface UIState {
  cartDrawerOpen: boolean;
  openCartDrawer(): void;
  closeCartDrawer(): void;
  toggleCartDrawer(): void;
  mobileNavOpen: boolean;
  setMobileNavOpen(open: boolean): void;
  /** LuxSlider writes; ambience/background read. */
  luxLevel: LuxLevel;
  setLuxLevel(level: LuxLevel): void;
  toasts: Toast[];
  pushToast(t: Omit<Toast, 'id'>): string;
  dismissToast(id: string): void;
}

const MAX_TOASTS = 4;
let toastSeq = 0;

export const useUIStore: UseBoundStore<StoreApi<UIState>> = create<UIState>()((set) => ({
  cartDrawerOpen: false,
  openCartDrawer: () => set({ cartDrawerOpen: true, mobileNavOpen: false }),
  closeCartDrawer: () => set({ cartDrawerOpen: false }),
  toggleCartDrawer: () => set((s) => ({ cartDrawerOpen: !s.cartDrawerOpen, mobileNavOpen: false })),

  mobileNavOpen: false,
  setMobileNavOpen: (open) =>
    set((s) => ({ mobileNavOpen: open, cartDrawerOpen: open ? false : s.cartDrawerOpen })),

  luxLevel: 100,
  setLuxLevel: (level) => set({ luxLevel: level }),

  toasts: [],
  pushToast: (t) => {
    toastSeq += 1;
    const id = `toast-${Date.now().toString(36)}-${toastSeq}`;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }].slice(-MAX_TOASTS) }));
    return id;
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));
