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
      {/* The panel switches on */}
      <div aria-hidden className="relative mb-10 aspect-[4/3] w-28">
        <m.div
          className="absolute inset-[-120%] rounded-full bg-[radial-gradient(closest-side,rgb(255_244_214/0.95),rgb(255_214_140/0.4)_45%,transparent_75%)]"
          initial={{ opacity: 0, transform: "scale(0.85)" }}
          animate={{ opacity: 1, transform: "scale(1)" }}
          transition={{ duration: reduce ? 0.2 : 1.1, ease: ease.out, delay: reduce ? 0 : 0.2 }}
        />
        <div className="absolute inset-0 rounded-[12px] border border-line bg-[#f1ece2] shadow-[0_18px_36px_-18px_rgb(80_60_30/0.6)]" />
        <m.div
          className="absolute inset-[7px] rounded-[7px] bg-[radial-gradient(110%_90%_at_50%_45%,#fff,#fff8ea_45%,#ffe7b8)]"
          initial={{ opacity: 0.08 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduce ? 0.2 : 0.7, ease: ease.out, delay: reduce ? 0 : 0.1 }}
        />
      </div>

      <h3 ref={headingRef} tabIndex={-1} className="text-display text-fg outline-none">
        You’re on the list{first ? `, ${first}` : ""}.
      </h3>
      <p className="mt-4 max-w-[44ch] text-body-l text-fg-muted">
        Thank you. We’ll reach out with founding-batch details before anyone else. Say hello on WhatsApp and we’ll
        pick up the conversation there.
      </p>
      {leadId && (
        <p className="mt-6 font-mono text-small text-fg">
          Your reference{" "}
          <span className="ml-1 rounded-[6px] border border-line bg-bg-raise px-2 py-1 tracking-[0.08em]">{leadId}</span>
        </p>
      )}
      <a
        href={whatsappHref(message)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("whatsapp_click", { from: "form_success" })}
        className="mt-8 inline-flex h-14 items-center gap-2.5 rounded-pill bg-[#1f7a4d] px-7 text-base font-medium text-white transition-[scale] duration-[var(--dur-press)] ease-out active:scale-[0.97]"
      >
        <WhatsAppIcon className="size-5 text-white" /> Continue on WhatsApp
      </a>
    </div>
  );
}
