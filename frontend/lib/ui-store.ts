"use client";

import { useSyncExternalStore } from "react";

/** Tiny shared UI state without a context provider. Written by <ScrollSpy />. */
type UIState = {
  /** the hero has scrolled away */
  pastHero: boolean;
  /** the waitlist form is on screen */
  joinVisible: boolean;
};

const initial: UIState = { pastHero: false, joinVisible: false };

let state: UIState = initial;
const listeners = new Set<() => void>();

export function setUI(patch: Partial<UIState>) {
  const next = { ...state, ...patch };
  if (next.pastHero === state.pastHero && next.joinVisible === state.joinVisible) return;
  state = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useUI<T>(select: (s: UIState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(initial),
  );
}
