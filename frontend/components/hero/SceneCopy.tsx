"use client";

import { m, useTransform, type MotionValue } from "motion/react";
import type { ReactNode } from "react";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import { chipsReveal, copyWindows, windowed, type SceneId } from "./timeline";

export const HERO_CHIPS = ["UV-free", "3 colour modes", "20–30 min mornings"] as const;

/** Scene copy, shared with the reduced-motion version. */
export const SCENE_COPY: Record<SceneId, { eyebrow: string; title: ReactNode; body?: string }> = {
  predawn: {
    eyebrow: "6:00 AM · before sunrise",
    title: "We live in a land of sunshine. Most of our days are spent indoors.",
  },
  sunrise: {
    eyebrow: "Sunrise",
    title: (
      <>
        Bring the <em className="italic">morning</em> indoors.
      </>
    ),
    body: "Bright morning light is how the day says it has begun. Most of us miss it, at a desk, behind glass.",
  },
  reveal: {
    eyebrow: "The lamp",
    title: (
      <>
        We folded the sunrise into <em className="italic">this</em>.
      </>
    ),
    body: "A slim panel of soft, even light, made for your desk.",
  },
  ignition: {
    eyebrow: "10,000 lux",
    title: (
      <>
        Ten thousand lux. <em className="italic">Zero</em> UV.
      </>
    ),
  },
  settle: {
    eyebrow: "The ritual",
    title: (
      <>
        Sunrise, <em className="italic">on demand</em>.
      </>
    ),
    body: "Twenty to thirty minutes in the morning, 8–24 inches away, off to one side. That's all it asks.",
  },
};

function useWindow(progress: MotionValue<number>, id: SceneId) {
  const [a, b] = copyWindows[id];
  const opacity = useTransform(progress, (p) => windowed(p, a, b));
  const transform = useTransform(opacity, (o) => `translateY(${(1 - o) * 10}px)`);
  const filter = useTransform(opacity, (o) => (o > 0.995 ? "none" : `blur(${(1 - o) * 4}px)`));
  const visibility = useTransform(opacity, (o) => (o < 0.02 ? "hidden" : "visible"));
  return { opacity, transform, filter, visibility };
}

function Block({
  progress,
  id,
  children,
  className,
}: {
  progress: MotionValue<number>;
  id: SceneId;
  children: ReactNode;
  className?: string;
}) {
  const style = useWindow(progress, id);
  return (
    <m.div className={cn("absolute inset-x-0 top-0", className)} style={style} data-scene={id}>
      {children}
    </m.div>
  );
}

function Title({ as: Tag = "h2", children }: { as?: "h1" | "h2"; children: ReactNode }) {
  return (
    <Tag className="max-w-[15ch] text-[clamp(2.375rem,1.4rem+4.2vw,5.25rem)] leading-[1.02] tracking-[-0.035em] text-ink">
      {children}
    </Tag>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow mb-4 !text-ink md:mb-5">{children}</p>;
}

function Body({ children }: { children: ReactNode }) {
  return <p className="mt-5 max-w-[40ch] text-body-l text-ink md:mt-6">{children}</p>;
}

function ChipRow({ progress }: { progress: MotionValue<number> }) {
  return (
    <ul className="mt-7 flex flex-wrap gap-2">
      {HERO_CHIPS.map((chip, i) => (
        <ChipItem key={chip} progress={progress} index={i} label={chip} />
      ))}
    </ul>
  );
}

function ChipItem({ progress, index, label }: { progress: MotionValue<number>; index: number; label: string }) {
  const opacity = useTransform(progress, (p) => chipsReveal(p, index));
  const transform = useTransform(opacity, (o) => `translateY(${(1 - o) * 10}px) scale(${0.96 + o * 0.04})`);
  return (
    <m.li style={{ opacity, transform }}>
      <Chip tone="glass">{label}</Chip>
    </m.li>
  );
}

export function SceneCopy({ progress }: { progress: MotionValue<number> }) {
  const c = SCENE_COPY;
  return (
    <div className="hero-copy relative h-full">
      <Block progress={progress} id="predawn">
        <Eyebrow>{c.predawn.eyebrow}</Eyebrow>
        <Title as="h1">{c.predawn.title}</Title>
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Button href="#early-access" size="lg">
            Join early access
          </Button>
          <span className="inline-flex items-center gap-2 font-mono text-label tracking-[0.08em] text-ink-muted uppercase">
            <ArrowDown aria-hidden className="size-3.5" strokeWidth={1.75} /> Scroll for sunrise
          </span>
        </div>
      </Block>

      <Block progress={progress} id="sunrise">
        <p lang="hi" aria-hidden className="mb-2 font-deva text-[1.375rem] leading-none text-sun-800">
          सुप्रभात
        </p>
        <span className="sr-only">Good morning.</span>
        <Eyebrow>{c.sunrise.eyebrow}</Eyebrow>
        <Title>{c.sunrise.title}</Title>
        <Body>{c.sunrise.body}</Body>
      </Block>

      <Block progress={progress} id="reveal">
        <Eyebrow>{c.reveal.eyebrow}</Eyebrow>
        <Title>{c.reveal.title}</Title>
        <Body>{c.reveal.body}</Body>
      </Block>

      <Block progress={progress} id="ignition">
        <Eyebrow>{c.ignition.eyebrow}</Eyebrow>
        <Title>{c.ignition.title}</Title>
        <ChipRow progress={progress} />
      </Block>

      <Block progress={progress} id="settle">
        <Eyebrow>{c.settle.eyebrow}</Eyebrow>
        <Title>{c.settle.title}</Title>
        <Body>{c.settle.body}</Body>
        <div className="mt-7 flex flex-wrap gap-2.5 sm:mt-8 sm:gap-3">
          <Button href="#early-access" size="lg" className="max-sm:h-12 max-sm:px-5">
            Join early access
          </Button>
          <Button href="/how-it-works" size="lg" variant="secondary" className="max-sm:h-12 max-sm:px-5">
            How it works
          </Button>
        </div>
      </Block>
    </div>
  );
}
