"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Slow, pausable marquee. CSS transform loop on a duplicated track (off the main thread).
 * Pauses on hover, on keyboard focus within, when off-screen, when the tab is hidden, and via
 * the visible button. Under reduced motion it becomes a static, horizontally scrollable row.
 */
export function Marquee({
  children,
  secondsPerLoop = 60,
  label,
  className,
}: {
  children: ReactNode;
  secondsPerLoop?: number;
  label: string;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [offscreen, setOffscreen] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let visible = true;
    let inView = true;
    const sync = () => setOffscreen(!visible || !inView);
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    const onVisibility = () => {
      visible = document.visibilityState === "visible";
      sync();
    };
    io.observe(el);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const running = !paused && !offscreen;

  return (
    <div ref={rootRef} className={cn("group/marquee relative", className)} role="region" aria-label={label}>
      <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)] motion-reduce:overflow-x-auto motion-reduce:[mask-image:none]">
        <div
          className="flex w-max [animation:marquee_var(--marquee-s)_linear_infinite] gap-4 group-focus-within/marquee:[animation-play-state:paused]! group-hover/marquee:[animation-play-state:paused]! motion-reduce:[animation:none]"
          style={{
            ["--marquee-s" as string]: `${secondsPerLoop}s`,
            animationPlayState: running ? "running" : "paused",
          }}
        >
          <div className="flex gap-4">{children}</div>
          <div className="flex gap-4 motion-reduce:hidden" aria-hidden>
            {children}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        className="mt-6 inline-flex h-11 cursor-pointer items-center gap-2 rounded-pill border border-hairline px-4 text-small text-ink-muted transition-[color,border-color,scale] duration-[var(--dur-micro)] ease-out active:scale-[0.97] motion-reduce:hidden hover-fine:border-line-strong/50 hover-fine:text-ink"
      >
        {paused ? <Play aria-hidden className="size-3.5" /> : <Pause aria-hidden className="size-3.5" />}
        {paused ? "Play" : "Pause"} stories
      </button>
    </div>
  );
}
