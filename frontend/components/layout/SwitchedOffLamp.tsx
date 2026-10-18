"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * 404 lamp: switched off. Hover (or a first tap on touch) switches it on; clicking it takes you home.
 */
export function SwitchedOffLamp() {
  const [on, setOn] = useState(false);
  return (
    <Link
      href="/"
      aria-label="Switch the lamp on and go back home"
      onPointerEnter={(e) => e.pointerType === "mouse" && setOn(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setOn(false)}
      onFocus={() => setOn(true)}
      onBlur={() => setOn(false)}
      onClick={(e) => {
        if (!on) {
          e.preventDefault();
          setOn(true);
        }
      }}
      data-on={on ? "" : undefined}
      className="group relative block aspect-[3/4] w-[min(44vw,200px)] rounded-[14%] outline-offset-8 transition-[scale] duration-[var(--dur-press)] ease-out active:scale-[0.97]"
    >
      <span
        aria-hidden
        className="absolute inset-[-90%] rounded-full bg-[radial-gradient(closest-side,rgb(255_244_214/0.95),rgb(255_226_160/0.45)_45%,transparent_75%)] opacity-0 transition-opacity duration-500 ease-out group-data-[on]:opacity-100"
      />
      <span
        aria-hidden
        className="absolute inset-0 rounded-[14%] border border-ink/10 bg-[linear-gradient(160deg,#f3eee6,#ddd4c5)] shadow-[0_30px_60px_-30px_rgb(80_60_30/0.45)]"
      />
      <span aria-hidden className="absolute inset-[6%] overflow-hidden rounded-[10%] bg-[#e7e1d6]">
        <span
          className={cn(
            "absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,#fff,#fffaf0_40%,#fff1cf_75%,#ffe2a0)] opacity-0 transition-opacity duration-500 ease-out group-data-[on]:opacity-100",
          )}
        />
      </span>
      <span
        aria-hidden
        className="absolute top-[18%] -right-[3px] size-[5px] rounded-full bg-ink/20 transition-colors duration-300 group-data-[on]:bg-sun-400 group-data-[on]:shadow-[0_0_6px_1px_rgb(255_200_87/0.9)]"
      />
    </Link>
  );
}
