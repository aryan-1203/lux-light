"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";

function playFromStart(el: HTMLElement) {
  for (const a of el.getAnimations({ subtree: true })) {
    a.currentTime = 0;
    a.play();
  }
}

function rewind(el: HTMLElement) {
  for (const a of el.getAnimations({ subtree: true })) {
    a.pause();
    a.currentTime = 0;
  }
}

/**
 * A 9:16 card holding one illustrated scene, sized like a phone video so filmed clips can replace the
 * drawings later without changing the layout. The scene waits on its first frame and plays the moment
 * the card is properly on screen; once the card has left the screen it rewinds, so it plays again next
 * time. The button replays it on demand.
 */
export function Scene({
  time,
  title,
  text,
  label,
  delay = 0,
  children,
}: {
  time: string;
  title: string;
  text: string;
  /** What the drawing shows, for screen readers. */
  label: string;
  delay?: number;
  children: ReactNode;
}) {
  const art = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = art.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio >= 0.4 && !el.hasAttribute("data-play")) {
          el.setAttribute("data-play", "");
          playFromStart(el);
        } else if (!e.isIntersecting && el.hasAttribute("data-play")) {
          el.removeAttribute("data-play");
          rewind(el);
        }
      },
      { threshold: [0, 0.4] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <figure
      data-reveal=""
      className="w-[78vw] max-w-[340px] shrink-0 snap-center md:w-auto md:max-w-none"
      style={{ "--reveal-delay": `${delay * 0.12}s` } as CSSProperties}
    >
      <div
        ref={art}
        className="scene relative aspect-[9/16] overflow-hidden rounded-lg bg-[#efe3d3] shadow-soft"
        style={{ "--scene-delay": `${delay * 0.2}s` } as CSSProperties}
      >
        <svg
          viewBox="20 40 320 569"
          role="img"
          aria-label={label}
          className="size-full"
          preserveAspectRatio="xMidYMid slice"
        >
          {children}
        </svg>
        <p className="tabular absolute top-3 left-3 rounded-pill bg-[rgb(255_255_255/0.82)] px-3 py-1 text-[0.8125rem] font-medium backdrop-blur">
          {time}
        </p>
        <button
          type="button"
          onClick={() => art.current && playFromStart(art.current)}
          aria-label={`Play the ${title.toLowerCase()} scene again`}
          className="absolute top-2 right-2 grid size-11 place-items-center rounded-full text-fg-muted transition-colors duration-[var(--dur-micro)] active:scale-95 hover-fine:text-fg"
        >
          <span className="grid size-8 place-items-center rounded-full bg-[rgb(255_255_255/0.82)] backdrop-blur">
            <RotateCcw aria-hidden className="size-4" strokeWidth={1.75} />
          </span>
        </button>
      </div>
      <figcaption className="mt-4 px-1">
        <p className="text-title font-medium">{title}</p>
        <p className="mt-1 text-small text-fg-muted">{text}</p>
      </figcaption>
    </figure>
  );
}
