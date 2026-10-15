import { motion } from 'framer-motion';
import { createElement, type ElementType } from 'react';
import { cn } from '../cn';
import { reveal, stagger, useReducedMotionSafe } from '../motion';

export type StaggerTextProps = {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  wordClassName?: string;
  /** Seconds between words. */
  staggerBy?: number;
  delay?: number;
  /** Animate on mount instead of when scrolled into view. */
  immediate?: boolean;
};

/**
 * Word-by-word masked reveal. The element keeps the full sentence as its accessible text
 * (words are aria-hidden, a visually hidden copy is read), so screen readers hear one phrase.
 * Reduced motion: plain text.
 */
export function StaggerText({
  text,
  as = 'span',
  className,
  wordClassName,
  staggerBy = 0.06,
  delay = 0,
  immediate = false,
}: StaggerTextProps) {
  const reduce = useReducedMotionSafe();
  if (reduce) return createElement(as, { className }, text);

  const words = text.split(/\s+/).filter(Boolean);
  const MotionTag = motion[as] as ElementType;
  return (
    <MotionTag
      className={className}
      variants={stagger(staggerBy, delay)}
      initial="hidden"
      {...(immediate
        ? { animate: 'visible' }
        : { whileInView: 'visible', viewport: { once: true, amount: 0.6 } })}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className="inline-block overflow-hidden pb-[0.08em] align-bottom"
          >
            <motion.span
              variants={reveal}
              className={cn('inline-block will-change-transform', wordClassName)}
            >
              {word}
            </motion.span>
            {i < words.length - 1 ? ' ' : null}
          </span>
        ))}
      </span>
    </MotionTag>
  );
}
