"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { colourModes } from "@/data/specs";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Bento of the lamp's features. Each card has one micro-interaction that explains the feature:
 * hover (fine pointers), tap (touch) or keyboard focus switches it on.
 */
export function MeetTheLamp() {
  return (
    <section aria-labelledby="meet-title" className="section-y bg-linen/60">
      <div className="container-x">
        <Reveal>
          <SectionHeading
            id="meet-title"
            eyebrow="Meet the lamp"
            title={
              <>
                Everything a morning needs. <em>Nothing</em> it doesn’t.
              </>
            }
            lede="A slim panel, a few honest controls and light you can feel at your desk."
          />
        </Reveal>

        <div className="mt-12 grid auto-rows-[minmax(240px,auto)] gap-4 md:mt-16 md:grid-cols-2 lg:grid-cols-4">
          <Reveal index={0} className="md:col-span-2 lg:row-span-2">
            <LuxCard />
          </Reveal>
          <Reveal index={1}>
            <UvCard />
          </Reveal>
          <Reveal index={2}>
            <ModesCard />
          </Reveal>
          <Reveal index={3}>
            <BrightnessCard />
          </Reveal>
          <Reveal index={4}>
            <TimerCard />
          </Reveal>
          <Reveal index={5} className="md:col-span-2 lg:col-span-4">
            <SlimCard />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------------- */

function useActive() {
  const [active, setActive] = useState(false);
  const handlers = {
    onPointerEnter: (e: React.PointerEvent) => e.pointerType === "mouse" && setActive(true),
    onPointerLeave: (e: React.PointerEvent) => e.pointerType === "mouse" && setActive(false),
    onClick: (e: React.MouseEvent) => {
      // Taps toggle; mouse clicks are already covered by hover.
      if ((e.nativeEvent as PointerEvent).pointerType !== "mouse") setActive((a) => !a);
    },
    onFocus: () => setActive(true),
    onBlur: () => setActive(false),
  };
  return [active, handlers] as const;
}

function BentoCard({
  title,
  body,
  children,
  active,
  handlers,
  hint,
  className,
}: {
  title: ReactNode;
  body: ReactNode;
  children: ReactNode;
  active: boolean;
  handlers: ReturnType<typeof useActive>[1];
  hint: string;
  className?: string;
}) {
  return (
    <div
      tabIndex={0}
      role="group"
      aria-label={typeof title === "string" ? title : undefined}
      data-active={active ? "" : undefined}
      {...handlers}
      className={cn(
        "group/card relative flex h-full flex-col overflow-hidden rounded-card border border-hairline bg-paper p-6 outline-offset-4 transition-[border-color] duration-[var(--dur-ui)] ease-out select-none data-[active]:border-line-strong/40 md:p-7",
        className,
      )}
    >
      <div className="relative flex-1">{children}</div>
      <div className="relative mt-6">
        <h3 className="font-sans text-title font-semibold text-ink">{title}</h3>
        <p className="mt-1.5 text-small text-ink-muted">{body}</p>
        <p className="mt-3 font-mono text-[0.6875rem] tracking-[0.08em] text-ink-muted/80 uppercase [@media(hover:hover)_and_(pointer:fine)]:hidden">
          {hint}
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------------- */

function LuxCard() {
  const [active, handlers] = useActive();
  return (
    <BentoCard
      title="10,000 lux"
      body="At the recommended distance, bright enough for your eyes to read it as morning."
      active={active}
      handlers={handlers}
      hint="Tap to switch on"
      className="min-h-[420px]"
    >
      <div
        aria-hidden
        className="absolute inset-[-30%] rounded-full bg-[radial-gradient(closest-side,rgb(255_244_214/0.95),rgb(255_226_160/0.45)_45%,transparent_75%)] opacity-0 transition-opacity duration-500 ease-out group-data-[active]/card:opacity-100"
      />
      <div className="relative flex h-full flex-col justify-between gap-8 sm:flex-row sm:items-end">
        <p className="font-mono text-ink">
          <span className="tabular block text-[clamp(3.5rem,2.2rem+5vw,6.5rem)] leading-none tracking-[-0.04em]">
            {formatNumber(10000)}
          </span>
          <span className="mt-2 block text-label tracking-[0.08em] text-ink-muted uppercase">lux · UV-free</span>
        </p>
        <div aria-hidden className="relative mx-auto aspect-[3/4] w-[min(46%,190px)] sm:mx-0">
          <div className="absolute inset-0 rounded-[14%] border border-ink/10 bg-[linear-gradient(160deg,#f7f2ea,#e6ddce)] shadow-[0_24px_48px_-28px_rgb(80_60_30/0.5)]" />
          <div className="absolute inset-[6%] overflow-hidden rounded-[10%] bg-[#f1ece3]">
            <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,#fff,#fffaf0_40%,#fff1cf_75%,#ffe2a0)] opacity-20 transition-opacity duration-500 ease-out group-data-[active]/card:opacity-100" />
          </div>
        </div>
      </div>
    </BentoCard>
  );
}

function UvCard() {
  const [active, handlers] = useActive();
  return (
    <BentoCard
      title="UV-free"
      body="LEDs and a diffuser that leave out ultraviolet. No tan, and no vitamin D either: just bright, visible light."
      active={active}
      handlers={handlers}
      hint="Tap to filter"
    >
      <div aria-hidden className="pt-2">
        <div className="relative flex h-12 overflow-hidden rounded-md">
          <div className="relative w-[18%] bg-[linear-gradient(90deg,#5b3f8f,#8b6cc7)] transition-opacity duration-[var(--dur-ui)] ease-out group-data-[active]/card:opacity-15">
            <span className="absolute inset-0 grid place-items-center font-mono text-[10px] text-white/90">UV</span>
          </div>
          <div className="flex-1 bg-[linear-gradient(90deg,#6f8fe0,#7fd3c5_25%,#d9e86b_45%,#ffd36b_60%,#ff9f5a_80%,#e86a4a)]" />
          <div className="w-[12%] bg-[linear-gradient(90deg,#c9503a,#7a2a20)] opacity-60" />
          <span className="absolute inset-y-0 left-0 w-[18%] origin-left scale-x-0 bg-[repeating-linear-gradient(135deg,transparent_0_5px,rgb(28_27_25/0.35)_5px_6px)] transition-[scale] duration-[var(--dur-sheet)] ease-out group-data-[active]/card:scale-x-100" />
        </div>
        <div className="mt-2 flex justify-between font-mono text-[10px] tracking-[0.06em] text-ink-muted uppercase">
          <span>380 nm</span>
          <span className="opacity-0 transition-opacity duration-[var(--dur-ui)] group-data-[active]/card:opacity-100">
            UV filtered
          </span>
          <span>750 nm</span>
        </div>
      </div>
    </BentoCard>
  );
}

function ModesCard() {
  const [active, handlers] = useActive();
  const [index, setIndex] = useState(1);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % colourModes.length), 900);
    return () => window.clearInterval(id);
  }, [active]);
  const tints = ["rgb(255 210 150 / 0.5)", "rgb(255 246 228 / 0.6)", "rgb(226 236 255 / 0.65)"];

  return (
    <BentoCard
      title="3 colour modes"
      body="Warm, neutral or cool. Pick what suits the hour and the task."
      active={active}
      handlers={handlers}
      hint="Tap to cycle"
    >
      <div
        aria-hidden
        className="absolute inset-[-40%] rounded-full transition-[background-color] duration-500 ease-[ease]"
        style={{ backgroundColor: tints[index], filter: "blur(40px)" }}
      />
      <ul aria-hidden className="relative flex gap-3 pt-2">
        {colourModes.map((m, i) => (
          <li key={m.id} className="flex flex-1 flex-col items-center gap-2">
            <span
              className={cn(
                "aspect-square w-full max-w-14 rounded-full border transition-[scale,box-shadow] duration-[var(--dur-ui)] ease-out",
                i === index ? "scale-100 shadow-[0_0_0_3px_var(--paper),0_0_0_4.5px_var(--ink)]" : "scale-90",
                m.id === "warm" && "border-[#f0c48a] bg-[#ffd9a0]",
                m.id === "neutral" && "border-[#eee3cc] bg-[#fff6e6]",
                m.id === "cool" && "border-[#d6e2f5] bg-[#eaf2ff]",
              )}
            />
            <span className="tabular font-mono text-[10px] tracking-[0.06em] text-ink-muted">{m.kelvin}K</span>
          </li>
        ))}
      </ul>
    </BentoCard>
  );
}

function BrightnessCard() {
  const [active, handlers] = useActive();
  const level = active ? 5 : 2;
  return (
    <BentoCard
      title="5 brightness levels"
      body="Start gentle, build to full. The lamp remembers where you left it."
      active={active}
      handlers={handlers}
      hint="Tap to brighten"
    >
      <div aria-hidden className="flex h-24 items-end gap-2 pt-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className="relative flex-1 overflow-hidden rounded-[6px] bg-ink/[0.06]"
            style={{ height: `${28 + n * 14}%` }}
          >
            <span
              className="absolute inset-0 origin-bottom rounded-[6px] bg-[linear-gradient(0deg,var(--sun-400),var(--sun-200))] transition-[scale] duration-[var(--dur-ui)] ease-out"
              style={{ scale: n <= level ? "1 1" : "1 0", transitionDelay: active ? `${(n - 1) * 60}ms` : "0ms" }}
            />
          </span>
        ))}
      </div>
    </BentoCard>
  );
}

function TimerCard() {
  const [active, handlers] = useActive();
  const textRef = useRef<HTMLSpanElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const text = textRef.current;
    const ring = ringRef.current;
    if (!text || !ring) return;
    const render = (minutes: number) => {
      const m = Math.floor(minutes);
      const s = Math.floor((minutes - m) * 60);
      text.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      ring.style.strokeDashoffset = String(100 - (minutes / 60) * 100);
    };
    if (!active) {
      render(60);
      return;
    }
    // A minute-long countdown played back in 2.4 s: 60:00 → 15:00.
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 2400);
      render(60 - 45 * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <BentoCard
      title="15–60 min timer"
      body="Set it and forget it. The lamp switches itself off when your session ends."
      active={active}
      handlers={handlers}
      hint="Tap to start"
    >
      <div aria-hidden className="flex items-center gap-5 pt-2">
        <svg viewBox="0 0 40 40" className="size-20 -rotate-90">
          <circle cx="20" cy="20" r="15.9" fill="none" stroke="rgb(28 27 25 / 0.08)" strokeWidth="3" />
          <circle
            ref={ringRef}
            cx="20"
            cy="20"
            r="15.9"
            fill="none"
            stroke="var(--sun-600)"
            strokeWidth="3"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset="0"
          />
        </svg>
        <span ref={textRef} className="tabular font-mono text-[2rem] leading-none text-ink">
          60:00
        </span>
      </div>
    </BentoCard>
  );
}

function SlimCard() {
  const [active, handlers] = useActive();
  return (
    <BentoCard
      title="Slim and portable"
      body="About as thick as a paperback, light enough for a laptop bag. Desk at home, desk at work."
      active={active}
      handlers={handlers}
      hint="Tap to measure"
      className="lg:flex-row lg:items-end lg:gap-12"
    >
      <div
        aria-hidden
        className="relative flex h-40 items-end justify-center gap-10 sm:justify-start lg:h-full lg:min-h-40"
      >
        {/* Side profile on its stand */}
        <div className="relative h-36 w-24">
          <div className="absolute bottom-0 left-1/2 h-px w-28 -translate-x-1/2 bg-ink/20" />
          <div className="absolute bottom-0 left-[44%] h-32 w-[7px] origin-bottom rounded-[3px] bg-[linear-gradient(90deg,#efe7da,#d9cfbf)] transition-[rotate] duration-[var(--dur-sheet)] ease-out group-data-[active]/card:-rotate-[10deg]" />
          <div className="absolute bottom-0 left-[46%] h-16 w-[3px] origin-bottom rotate-[24deg] rounded-full bg-[#d9cfbf]" />
        </div>
        {/* Thickness callout */}
        <div className="mb-6">
          <div className="tabular flex items-center gap-2 font-mono text-small text-ink">
            <span className="inline-block h-px w-10 origin-left scale-x-50 bg-ink transition-[scale] duration-[var(--dur-sheet)] ease-out group-data-[active]/card:scale-x-100" />
            ≈ 1.8 cm
          </div>
          <p className="tabular mt-2 font-mono text-small text-ink-muted">≈ 650 g</p>
        </div>
      </div>
    </BentoCard>
  );
}
