"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { canUseWebGLHero, isWebGLForced, whenIdle } from "./capability";
import type { StageLayout } from "./LampScene";
import { HeroStage2D } from "./HeroStage2D";
import { HeroStatic } from "./HeroStatic";
import { LuxCounter } from "./LuxCounter";
import { LuxMeter } from "./LuxMeter";
import { SceneCopy } from "./SceneCopy";
import { SkyLayers } from "./SkyLayers";
import { useHeroProgress } from "./useHeroProgress";

/**
 * "The horizon was a lamp": a pinned, scroll-scrubbed story (≈400svh desktop, 250svh mobile).
 * All copy is server-rendered DOM text; the first headline is the LCP element and never waits
 * for JS or WebGL. Under prefers-reduced-motion a static, un-pinned version is shown instead.
 */
export function Hero() {
  return (
    <>
      <div className="motion-reduce:hidden">
        <HeroScroll />
      </div>
      <div className="hidden motion-reduce:block">
        <HeroStatic />
      </div>
      <div id="after-hero" tabIndex={-1} className="outline-none" />
    </>
  );
}

type SceneComponent = ComponentType<{
  progress: ReturnType<typeof useHeroProgress>;
  layout: React.RefObject<StageLayout>;
  onReady: () => void;
  onFail: () => void;
  governor?: boolean;
}>;

function HeroScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const progress = useHeroProgress(sectionRef);
  const layout = useStageLayout(stageRef);
  const [Scene, setScene] = useState<SceneComponent | null>(null);
  const [webglReady, setWebglReady] = useState(false);

  // The one Devanagari word appears in scene 2; fetch its font while the visitor reads scene 1.
  useEffect(
    () =>
      whenIdle(() => {
        const family = getComputedStyle(document.documentElement).getPropertyValue("--font-tiro-deva").trim();
        if (family) document.fonts.load(`400 1em ${family}`, "सुप्रभात").catch(() => {});
      }, 3000),
    [],
  );

  // Progressive enhancement: load the WebGL scene only on capable devices, once the page is idle.
  useEffect(() => {
    if (!canUseWebGLHero()) return;
    return whenIdle(() => {
      import("./LampScene").then((m) => setScene(() => m.default)).catch(() => setScene(null));
    });
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Introduction"
      className="hero-stage relative -mt-[var(--nav-h)] h-[200svh] lg:h-[300svh]"
    >
      <a
        href="#after-hero"
        className="sr-only z-30 rounded-pill bg-ink px-5 py-3 text-[0.9375rem] font-semibold text-paper focus:not-sr-only focus:absolute focus:top-[calc(var(--nav-h)+12px)] focus:left-[var(--gutter)]"
      >
        Skip intro
      </a>

      <div ref={stageRef} className="sticky top-0 h-[100svh] overflow-hidden">
        <div
          data-hero-probe
          aria-hidden
          className="pointer-events-none invisible absolute top-[var(--horizon-y)] left-[var(--lamp-x)] h-[var(--panel-h)] w-px"
        />
        <SkyLayers progress={progress} />
        {Scene && (
          <div
            className="absolute inset-0 transition-opacity duration-[600ms] ease-out"
            style={{ opacity: webglReady ? 1 : 0 }}
          >
            <Scene
              progress={progress}
              layout={layout}
              onReady={() => setWebglReady(true)}
              onFail={() => {
                setWebglReady(false);
                setScene(null);
              }}
              governor={!isWebGLForced()}
            />
          </div>
        )}
        <HeroStage2D progress={progress} webgl={webglReady} />

        <div className="container-x relative z-10 h-full">
          <div className="absolute top-[calc(var(--nav-h)+28px)] right-[calc(var(--gutter)+14px)] bottom-0 left-[var(--gutter)] lg:top-[26svh] lg:right-auto lg:w-[46%] lg:max-w-[600px]">
            <SceneCopy progress={progress} />
          </div>
        </div>

        {/* Phones/tablets: centred just under the lamp, always above the fold. Desktop: top-right corner. */}
        <div className="absolute inset-x-[var(--gutter)] top-[calc(var(--horizon-y)+var(--panel-h)/2+20px)] z-10 flex justify-center text-center lg:inset-x-auto lg:top-[calc(var(--nav-h)+32px)] lg:right-[calc(var(--gutter)+40px)] lg:block lg:text-right">
          <LuxCounter progress={progress} />
        </div>

        <div className="absolute top-1/2 right-[max(10px,env(safe-area-inset-right))] z-10 -translate-y-1/2 lg:right-6">
          <LuxMeter progress={progress} />
        </div>
      </div>
    </section>
  );
}

/** Reads the stage's CSS-variable layout in px (shared with the WebGL scene). */
function useStageLayout(stageRef: React.RefObject<HTMLDivElement | null>) {
  const layout = useRef<StageLayout>({
    width: 1440,
    height: 900,
    lampX: 950,
    horizonY: 522,
    panelH: 468,
    s5ShiftN: -0.15,
    s5Scale: 0.56,
  });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const probe = stage.querySelector<HTMLElement>("[data-hero-probe]");
    const measure = () => {
      if (!probe) return;
      const cs = getComputedStyle(stage);
      layout.current = {
        width: stage.clientWidth,
        height: stage.clientHeight,
        lampX: probe.offsetLeft,
        horizonY: probe.offsetTop,
        panelH: probe.offsetHeight,
        s5ShiftN: parseFloat(cs.getPropertyValue("--s5-shift-n")) || 0,
        s5Scale: parseFloat(cs.getPropertyValue("--s5-scale")) || 0.6,
      };
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [stageRef]);

  return layout;
}
