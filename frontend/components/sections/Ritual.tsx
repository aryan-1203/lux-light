"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const STEPS = [
  {
    n: "01",
    title: "Sit 8–24 inches away",
    body: "About an arm’s length, 20–60 cm. Closer is brighter; the lamp’s 10,000 lux is measured at the recommended distance.",
  },
  {
    n: "02",
    title: "20–30 minutes, ideally in the morning",
    body: "With your chai, your inbox or the newspaper. Earlier is better; skip bright light in the late evening.",
  },
  {
    n: "03",
    title: "Off to one side, never stared at",
    body: "Place it to the side of your view so the light reaches your eyes indirectly. Carry on with what you’re doing.",
  },
] as const;

/** Three sticky steps: on desktop the illustration stays pinned and changes with the step in view. */
export function Ritual() {
  const [active, setActive] = useState(0);

  return (
    <section aria-labelledby="ritual-title" className="section-y">
      <div className="container-x">
        <Reveal>
          <SectionHeading
            id="ritual-title"
            eyebrow="The ritual"
            title={
              <>
                Three habits. <em>That’s</em> the whole manual.
              </>
            }
          />
        </Reveal>

        <div className="mt-12 lg:mt-4 lg:grid lg:grid-cols-2 lg:gap-16">
          <div className="hidden lg:block">
            <div className="sticky top-[calc(var(--nav-h)+12svh)] flex h-[64svh] items-center justify-center rounded-card border border-hairline bg-linen">
              {[DistanceArt, ClockArt, ViewArt].map((Art, i) => (
                <div
                  key={i}
                  aria-hidden
                  className={cn(
                    "absolute inset-0 grid place-items-center transition-[opacity,scale] duration-[var(--dur-sheet)] ease-out",
                    active === i ? "scale-100 opacity-100" : "scale-[0.97] opacity-0",
                  )}
                >
                  <Art />
                </div>
              ))}
            </div>
          </div>

          <ol>
            {STEPS.map((step, i) => (
              <Step key={step.n} index={i} onActive={setActive}>
                <div
                  aria-hidden
                  className="mb-8 grid aspect-[4/3] place-items-center rounded-card border border-hairline bg-linen lg:hidden"
                >
                  {i === 0 ? <DistanceArt /> : i === 1 ? <ClockArt /> : <ViewArt />}
                </div>
                <p className="font-mono text-label tracking-[0.08em] text-sun-800">{step.n}</p>
                <h3 className="mt-3 text-display-m text-ink">{step.title}</h3>
                <p className="mt-4 max-w-[46ch] text-body-l text-ink-muted">{step.body}</p>
              </Step>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Step({ index, onActive, children }: { index: number; onActive: (i: number) => void; children: ReactNode }) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { amount: 0.6 });
  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);
  return (
    <li ref={ref} className="py-10 lg:flex lg:min-h-[62svh] lg:flex-col lg:justify-center lg:py-0">
      <Reveal>{children}</Reveal>
    </li>
  );
}

/* ---------------- Illustrations (line art, palette only) ---------------- */

function DistanceArt() {
  return (
    <svg viewBox="0 0 320 220" className="w-[78%] max-w-[420px]" fill="none">
      <path d="M20 180 H300" stroke="#1c1b19" strokeOpacity="0.18" />
      <rect x="44" y="70" width="60" height="80" rx="8" fill="#fffaf0" stroke="#1c1b19" strokeOpacity="0.25" />
      <rect x="50" y="76" width="48" height="68" rx="5" fill="url(#ra-glow)" />
      <path d="M74 150 L66 180" stroke="#1c1b19" strokeOpacity="0.25" strokeWidth="3" strokeLinecap="round" />
      <circle cx="252" cy="104" r="20" fill="#f4eee4" stroke="#1c1b19" strokeOpacity="0.3" />
      <path d="M226 180 C 230 140, 274 140, 278 180" fill="#f4eee4" stroke="#1c1b19" strokeOpacity="0.3" />
      <path
        d="M110 96 Q 170 40 228 96"
        stroke="#9a5f12"
        strokeWidth="1.6"
        strokeDasharray="0.1 6"
        strokeLinecap="round"
      />
      <text x="168" y="52" textAnchor="middle" className="fill-ink font-mono text-[11px]">
        8–24 in
      </text>
      <text x="168" y="36" textAnchor="middle" className="fill-ink-muted font-mono text-[9px]">
        20–60 cm
      </text>
      <defs>
        <radialGradient id="ra-glow">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#fff1cf" />
          <stop offset="1" stopColor="#ffe2a0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/** Rounded so server and browser trig output serialise identically (no hydration mismatch). */
const r2 = (n: number) => Math.round(n * 100) / 100;

function ClockArt() {
  // 20–30 minutes highlighted on a clock face
  const arc = (from: number, to: number, r: number) => {
    const a0 = ((from / 60) * 360 - 90) * (Math.PI / 180);
    const a1 = ((to / 60) * 360 - 90) * (Math.PI / 180);
    return `M ${r2(160 + r * Math.cos(a0))} ${r2(110 + r * Math.sin(a0))} A ${r} ${r} 0 0 1 ${r2(160 + r * Math.cos(a1))} ${r2(110 + r * Math.sin(a1))}`;
  };
  return (
    <svg viewBox="0 0 320 220" className="w-[78%] max-w-[420px]" fill="none">
      <circle cx="160" cy="110" r="76" fill="#fffaf0" stroke="#1c1b19" strokeOpacity="0.2" />
      <path d={arc(0, 30, 76)} stroke="#ffe7a8" strokeWidth="10" strokeLinecap="round" />
      <path d={arc(0, 20, 76)} stroke="#ffc857" strokeWidth="10" strokeLinecap="round" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((i * 30 - 90) * Math.PI) / 180;
        return (
          <path
            key={i}
            d={`M ${r2(160 + 62 * Math.cos(a))} ${r2(110 + 62 * Math.sin(a))} L ${r2(160 + 68 * Math.cos(a))} ${r2(110 + 68 * Math.sin(a))}`}
            stroke="#1c1b19"
            strokeOpacity="0.3"
          />
        );
      })}
      <text x="160" y="108" textAnchor="middle" className="fill-ink font-mono text-[18px]">
        20–30
      </text>
      <text x="160" y="128" textAnchor="middle" className="fill-ink-muted font-mono text-[10px]">
        MINUTES
      </text>
      <circle cx="262" cy="46" r="12" fill="#ffc857" />
      <text x="262" y="78" textAnchor="middle" className="fill-ink-muted font-mono text-[9px]">
        MORNING
      </text>
    </svg>
  );
}

function ViewArt() {
  // Top-down: a person's field of view, lamp placed off to one side
  return (
    <svg viewBox="0 0 320 220" className="w-[78%] max-w-[420px]" fill="none">
      <path d="M160 190 L60 40 A 180 180 0 0 1 260 40 Z" fill="#fff8e6" />
      <path d="M160 190 L60 40 M160 190 L260 40" stroke="#1c1b19" strokeOpacity="0.15" strokeDasharray="3 5" />
      <path d="M160 190 L160 40" stroke="#1c1b19" strokeOpacity="0.25" />
      <text x="160" y="32" textAnchor="middle" className="fill-ink-muted font-mono text-[9px]">
        YOUR SCREEN / BOOK
      </text>
      <rect x="84" y="70" width="34" height="8" rx="3" transform="rotate(-30 101 74)" fill="#ffe7a8" stroke="#e8962e" />
      <path d="M100 84 L120 120" stroke="#e8962e" strokeOpacity="0.5" strokeDasharray="2 4" />
      <text x="70" y="104" textAnchor="middle" className="fill-sun-800 font-mono text-[9px]">
        LAMP
      </text>
      <circle cx="160" cy="190" r="14" fill="#f4eee4" stroke="#1c1b19" strokeOpacity="0.3" />
      <text x="160" y="214" textAnchor="middle" className="fill-ink-muted font-mono text-[9px]">
        YOU
      </text>
    </svg>
  );
}
