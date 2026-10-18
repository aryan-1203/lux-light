import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { stagger as staggerStep } from "@/lib/motion";

type Props = HTMLAttributes<HTMLElement> & {
  /** Delay in seconds, added to the stagger index. */
  delay?: number;
  /** Stagger index (× 40ms). */
  index?: number;
  as?: "div" | "li" | "section" | "article";
  children?: ReactNode;
};

/**
 * One-shot section reveal (12px rise + fade, ease-out), done in CSS. A single IntersectionObserver
 * (<RevealObserver />, mounted once in the layout) flips `data-revealed`. No per-element JS, so it
 * costs nothing to hydrate. Reduced motion: opacity only. No JS: visible (see the noscript rule).
 */
export function Reveal({ delay = 0, index, as = "div", style, children, ...rest }: Props) {
  const Tag = as;
  const d = delay + (index ?? 0) * staggerStep;
  return (
    <Tag data-reveal="" style={d ? ({ ...style, "--reveal-delay": `${d}s` } as CSSProperties) : style} {...rest}>
      {children}
    </Tag>
  );
}
