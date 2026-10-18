"use client";

import { useEffect, useState } from "react";
import { whatsappHref } from "@/lib/format";
import { setUI, useUI } from "@/lib/ui-store";
import { cn } from "@/lib/cn";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { track } from "@/lib/analytics";

const FIELD = "input, select, textarea, [contenteditable='true']";

/**
 * Floating WhatsApp entry point. Safe-area aware; steps aside while a form field is focused
 * (so it never covers the keyboard or a submit button) and while the mobile menu is open.
 */
export function WhatsAppFab() {
  const menuOpen = useUI((s) => s.menuOpen);
  const fieldFocused = useUI((s) => s.fieldFocused);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onIn = (e: FocusEvent) => {
      if (e.target instanceof Element && e.target.matches(FIELD)) setUI({ fieldFocused: true });
    };
    const onOut = (e: FocusEvent) => {
      const next = e.relatedTarget;
      if (!(next instanceof Element && next.matches(FIELD))) setUI({ fieldFocused: false });
    };
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    // Arrive after the page has settled so it never competes with the first paint.
    const t = window.setTimeout(() => setReady(true), 1200);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
      window.clearTimeout(t);
    };
  }, []);

  const hidden = !ready || menuOpen || fieldFocused;

  return (
    <a
      id="wa-fab"
      href={whatsappHref("Hi! I'd like to know more about the lamp.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      onClick={() => track("whatsapp_click", { from: "fab" })}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      data-hidden={hidden ? "" : undefined}
      className={cn(
        "group fixed z-40 flex h-14 items-center gap-2 rounded-pill border border-hairline bg-paper pr-4 pl-3.5 text-ink shadow-lift",
        "right-[max(16px,env(safe-area-inset-right))] bottom-[max(16px,env(safe-area-inset-bottom))] sm:right-6 sm:bottom-6",
        "transition-[opacity,transform,translate,scale] duration-[var(--dur-ui)] ease-out active:scale-[0.97]",
        "data-[hidden]:pointer-events-none data-[hidden]:translate-y-2 data-[hidden]:scale-[0.96] data-[hidden]:opacity-0 data-[hidden]:duration-[170ms]",
        "max-sm:w-14 max-sm:justify-center max-sm:px-0",
      )}
    >
      <WhatsAppIcon className="size-6 text-[#1a9e4b]" />
      <span className="text-[0.9375rem] font-semibold max-sm:sr-only">Chat with us</span>
    </a>
  );
}
