import { cn } from '../cn';

export type GrainOverlayProps = {
  /** 0–1; keep ≤ 0.06 so text contrast is unaffected. */
  opacity?: number;
  /** 'fixed' covers the viewport; 'absolute' covers the positioned parent. */
  position?: 'fixed' | 'absolute';
  className?: string;
};

/** Static film-grain texture (no animation → zero ongoing paint cost). Decorative only. */
export function GrainOverlay({
  opacity = 0.045,
  position = 'fixed',
  className,
}: GrainOverlayProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('grain pointer-events-none inset-0 z-grain', position, className)}
      style={{ opacity }}
    />
  );
}
