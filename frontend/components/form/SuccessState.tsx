"use client";

import { m, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { siteConfig } from "@/site.config";
import { whatsappHref } from "@/lib/format";
import { track } from "@/lib/analytics";
import { ease } from "@/lib/motion";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

/**
 * Confirmation: the little lamp switches on, a calm message, and the hand-off to WhatsApp with
 * the visitor's name and lead ID prefilled so the team can find their details instantly.
 */
export function SuccessState({ name, leadId }: { name: string; leadId: string }) {
  const reduce = useReducedMotion();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const first = name.trim().split(/\s+/)[0] ?? "";

  useEffect(() => headingRef.current?.focus(), []);

  const message = `Hi ${siteConfig.brandName} team! I'm ${name.trim()}. I just joined early access${
    leadId ? ` (ID ${leadId})` : ""
  }. I'd love to know more about the founding batch.`;

  return (
    <div className="flex flex-col items-start">
      <div aria-hidden className="relative mb-8 h-24 w-[72px]">
        <m.div
          className="absolute inset-[-140%] rounded-full bg-[radial-gradient(closest-side,rgb(255_244_214/0.95),rgb(255_226_160/0.45)_45%,transparent_75%)]"
          initial={{ opacity: 0, transform: "scale(0.9)" }}
          animate={{ opacity: 1, transform: "scale(1)" }}
          transition={{ duration: reduce ? 0.2 : 0.9, ease: ease.out, delay: reduce ? 0 : 0.25 }}
        />
        <div className="absolute inset-0 rounded-[12px] border border-ink/10 bg-[linear-gradient(160deg,#f7f2ea,#e6ddce)] shadow-[0_18px_36px_-20px_rgb(80_60_30/0.55)]" />
        <div className="absolute inset-[6px] overflow-hidden rounded-[8px] bg-[#efe9df]">
          <m.div
            className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,#fff,#fffaf0_40%,#fff1cf_75%,#ffe2a0)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduce ? 0.2 : 0.6, ease: ease.out, delay: reduce ? 0 : 0.15 }}
          />
        </div>
      </div>

      <h2 ref={headingRef} tabIndex={-1} className="text-display-m text-ink outline-none">
        You’re on the list{first ? `, ${first}` : ""}.
      </h2>
      <p className="mt-4 max-w-[46ch] text-body-l text-ink-muted">
        Thank you. We’ll share founding-batch details soon. Say hello on WhatsApp and we’ll pick up the conversation
        there.
      </p>
      {leadId && (
        <p className="mt-5 font-mono text-small text-ink">
          Your reference: <span className="rounded-[6px] bg-sun-50 px-2 py-1 tracking-[0.06em]">{leadId}</span>
        </p>
      )}
      <a
        href={whatsappHref(message)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("whatsapp_click", { from: "form_success" })}
        className="mt-8 inline-flex h-[52px] items-center gap-2.5 rounded-pill bg-ink px-6 text-base font-semibold text-paper transition-[scale,background-color] duration-[var(--dur-press)] ease-out active:scale-[0.97] hover-fine:bg-[#33312d]"
      >
        <WhatsAppIcon className="size-5 text-[#4ade80]" /> Continue on WhatsApp
      </a>
    </div>
  );
}
