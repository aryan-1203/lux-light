import { motion, useMotionValue, useSpring } from 'framer-motion';
import { forwardRef, useRef, type PointerEvent } from 'react';
import { cn } from '../cn';
import { useIsTouch } from '../hooks/useMediaQuery';
import { transitions, useReducedMotionSafe } from '../motion';
import { Button, type ButtonProps } from './Button';

export type MagneticButtonProps = ButtonProps & {
  /** Max travel in px toward the pointer. */
  strength?: number;
  wrapperClassName?: string;
};

/**
 * Button whose body follows the pointer with a spring (transform only). Static on touch
 * devices and under prefers-reduced-motion — then it's a plain Button.
 */
export const MagneticButton = forwardRef<HTMLButtonElement, MagneticButtonProps>(
  function MagneticButton({ strength = 10, wrapperClassName, ...buttonProps }, ref) {
    const reduce = useReducedMotionSafe();
    const touch = useIsTouch();
    const wrapper = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const sx = useSpring(x, transitions.magnetic);
    const sy = useSpring(y, transitions.magnetic);
    const enabled = !reduce && !touch && !buttonProps.disabled;

    if (!enabled) {
      return (
        <div className={cn('inline-flex', wrapperClassName)}>
          <Button ref={ref} {...buttonProps} />
        </div>
      );
    }

    const onMove = (e: PointerEvent<HTMLDivElement>) => {
      const el = wrapper.current;
      if (!el || e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      x.set(Math.max(-1, Math.min(1, dx)) * strength);
      y.set(Math.max(-1, Math.min(1, dy)) * strength);
    };
    const onLeave = () => {
      x.set(0);
      y.set(0);
    };

    return (
      <motion.div
        ref={wrapper}
        className={cn('-m-2 inline-flex p-2', wrapperClassName)}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ x: sx, y: sy }}
        data-magnetic=""
      >
        <Button ref={ref} {...buttonProps} />
      </motion.div>
    );
  },
);
