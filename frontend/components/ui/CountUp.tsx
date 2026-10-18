"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { ease } from "@/lib/motion";

const nf = new Intl.NumberFormat("en-IN");

/**
 * Counts the numeric part of a display string ("~90", "300", "60+", "1,00,000") up from zero once,
 * when it scrolls into view. Prefix/suffix stay put; digits are written straight to the DOM.
 */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduce = useReducedMotion();
  const match = value.match(/^(\D*)([\d,.]+)(.*)$/);

  useEffect(() => {
    if (!inView || reduce || !match || !ref.current) return;
    const [, prefix, digits, suffix] = match;
    const target = parseFloat(digits.replace(/,/g, ""));
    const decimals = digits.includes(".") ? digits.split(".")[1].length : 0;
    const el = ref.current;
    const controls = animate(0, target, {
      duration: 1.1,
      ease: ease.out,
      onUpdate: (v) => {
        const n = decimals ? v.toFixed(decimals) : nf.format(Math.round(v));
        el.textContent = `${prefix}${n}${suffix}`;
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
