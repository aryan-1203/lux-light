"use client";

import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useId, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { duration, ease, exitOf } from "@/lib/motion";
import { cn } from "@/lib/cn";

export type AccordionItem = { id: string; title: ReactNode; content: ReactNode };

/**
 * Disclosure list. Height animates via Motion (height: "auto"), content fades with a small rise.
 * Items open independently. Buttons carry aria-expanded / aria-controls.
 */
export function Accordion({ items, className }: { items: AccordionItem[]; className?: string }) {
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <ul className={cn("border-t border-hairline", className)}>
      {items.map((item) => (
        <Row key={item.id} item={item} open={open.has(item.id)} onToggle={() => toggle(item.id)} />
      ))}
    </ul>
  );
}

function Row({ item, open, onToggle }: { item: AccordionItem; open: boolean; onToggle: () => void }) {
  const id = useId();
  const reduce = useReducedMotion();

  return (
    <li className="border-b border-hairline">
      <h3 className="font-sans text-base">
        <button
          type="button"
          id={`${id}-btn`}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          className="group flex w-full cursor-pointer items-start justify-between gap-6 py-5 text-left text-[1.0625rem] leading-snug font-medium text-ink md:py-6 md:text-title"
        >
          <span className="transition-colors duration-[var(--dur-micro)] ease-[ease] hover-fine:text-sun-800">
            {item.title}
          </span>
          <span
            aria-hidden
            className={cn(
              "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-hairline transition-[rotate,background-color,border-color] duration-[var(--dur-ui)] ease-out",
              open ? "rotate-45 border-sun-400 bg-sun-50" : "group-hover:border-line-strong/50",
            )}
          >
            <Plus className="size-3.5" strokeWidth={2} />
          </span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            key="panel"
            id={`${id}-panel`}
            role="region"
            aria-labelledby={`${id}-btn`}
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: {
                height: { duration: reduce ? 0 : duration.ui + 0.06, ease: ease.drawer },
                opacity: { duration: duration.ui, ease: ease.out, delay: reduce ? 0 : 0.04 },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: { duration: reduce ? 0 : exitOf(duration.ui), ease: ease.drawer },
                opacity: { duration: exitOf(duration.micro), ease: ease.out },
              },
            }}
            className="overflow-hidden"
          >
            <div className="max-w-[62ch] pr-12 pb-6 text-body text-ink-muted">{item.content}</div>
          </m.div>
        )}
      </AnimatePresence>
    </li>
  );
}
