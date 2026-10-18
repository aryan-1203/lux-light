"use client";

import { useSyncExternalStore } from "react";

/** Tiny shared UI state (menu open, a form field focused) without a context provider. */
type UIState = { menuOpen: boolean; fieldFocused: boolean };

let state: UIState = { menuOpen: false, fieldFocused: false };
const listeners = new Set<() => void>();

export function setUI(patch: Partial<UIState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const serverState: UIState = { menuOpen: false, fieldFocused: false };

export function useUI<T>(select: (s: UIState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(serverState),
  );
}
