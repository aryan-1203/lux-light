"use client";

import { m, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef } from "react";
import { Lamp2D } from "./Lamp2D";
import { DeskScene } from "./DeskScene";
import {
  horizonGlow,
  horizonOpacity,
  horizonSpan,
  horizonThickness,
  lampOpen,
  lampTurn,
  lampVisible,
  panelHalo,
  settle,
  standVisible,
  lerp,
  panelGlow,
  range,
  spillOpacity,
  spillScale,
  sunClipped,
  sunOffset,
  sunOpacity,
  sunScale,
} from "./timeline";

/**
 * The 2D (SVG/CSS) telling of the story. Rendered for everyone first; the WebGL scene, when allowed,
 * fades in on top and this layer steps back. Layout comes from static CSS variables on the stage
 * (--lamp-x, --horizon-y, --panel-h, --panel-w, --sun-d, --s5-shift); motion only drives transforms/opacity.
 */
export function HeroStage2D({ progress, webgl = false }: { progress: MotionValue<number>; webgl?: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null);
  // Measured layout (px): stage width and the lamp panel's left/right edges at rest.
  const stageW = useMotionValue(1440);
  const lampLeft = useMotionValue(800);
  const lampRight = useMotionValue(1100);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const probe = stage.querySelector<HTMLElement>("[data-panel-probe]");
    const measure = () => {
      if (!probe || !stage.offsetWidth) return;
      const center = probe.offsetLeft;
      const half = probe.offsetWidth / 2;
      stageW.set(stage.offsetWidth);
      lampLeft.set(center - half);
      lampRight.set(center + half);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [stageW, lampLeft, lampRight]);

  /* Horizon → lamp edge: both ends travel inward until the line is exactly the panel's width */
  const horizonTransform = useTransform(() => {
    const span = horizonSpan(progress.get());
    const w = stageW.get();
    const left = lerp(lampLeft.get(), 0, span);
    const right = lerp(lampRight.get(), w, span);
    return `translateX(${left}px) scaleX(${(right - left) / w})`;
  });
  const coreTransform = useTransform(progress, (p) => `scaleY(${horizonThickness(p)})`);
  const horizonHaze = useTransform(progress, (p) => 1 - range(p, 0.45, 0.5));
  const horizonAlpha = useTransform(progress, (p) => horizonOpacity(p) * horizonGlow(p));

  /* Sun */
  const sunTransform = useTransform(progress, (p) => `translateY(${sunOffset(p) * 100}%) scale(${sunScale(p)})`);
  const sunAlpha = useTransform(progress, sunOpacity);
  const sunClip = useTransform(progress, (p) =>
    sunClipped(p) ? "inset(-200vh -100vw 0px -100vw)" : "inset(-200vh -100vw -200vh -100vw)",
  );

  /* Lamp */
  const lampSettle = useTransform(progress, (p) => {
    const t = settle(p);
    return `translateX(calc(var(--panel-w) * var(--s5-shift-n) * ${t})) scale(calc(1 + (var(--s5-scale) - 1) * ${t}))`;
  });
  const lampTransform = useTransform(progress, (p) => `rotateY(${lampTurn(p)}deg) rotateX(${lampOpen(p)}deg)`);
  const lampAlpha = useTransform(progress, lampVisible);
  const glow = useTransform(progress, panelGlow);
  const powerOn = useTransform(progress, (p) => range(p, 0.66, 0.7));
  const stand = useTransform(progress, standVisible);
  const halo = useTransform(progress, panelHalo);

  /* Light spill */
  const spillAlpha = useTransform(progress, spillOpacity);
  const spillTransform = useTransform(progress, (p) => `translate(-50%, -50%) scale(${spillScale(p)})`);

  return (
    <div ref={stageRef} aria-hidden className="hero-2d absolute inset-0">
      {/* Width probe for the horizon contraction */}
      <div
        data-panel-probe
        className="pointer-events-none invisible absolute left-[var(--lamp-x)] h-0 w-[var(--panel-w)]"
      />

      {/* Everything the WebGL scene can take over; the desk overlay stays in both modes */}
      <div className="absolute inset-0 transition-opacity duration-[600ms] ease-out" style={{ opacity: webgl ? 0 : 1 }}>
        {/* Light spill */}
        <m.div
          className="absolute top-[var(--horizon-y)] left-[var(--lamp-x)] size-[170vmax] rounded-full [background:var(--glow)]"
          style={{ opacity: spillAlpha, transform: spillTransform }}
        />

        {/* Horizon line, which becomes the lamp's edge */}
        <m.div
          className="absolute inset-x-0 top-[var(--horizon-y)] h-px origin-left"
          style={{ transform: horizonTransform, opacity: horizonAlpha }}
        >
          <m.div
            className="absolute inset-x-0 -inset-y-[10px] bg-[linear-gradient(180deg,transparent,rgb(255_236_190/0.75),transparent)] blur-[6px]"
            style={{ opacity: horizonHaze }}
          />
          <div className="absolute inset-x-0 -inset-y-[1px] bg-[linear-gradient(180deg,transparent,rgb(255_248_230/0.95),transparent)]" />
          <m.div
            className="absolute inset-0 bg-white shadow-[0_0_10px_2px_rgb(255_255_255/0.9)]"
            style={{ transform: coreTransform }}
          />
        </m.div>

        {/* Lamp */}
        <div className="absolute top-[var(--horizon-y)] left-[var(--lamp-x)] -translate-x-1/2 -translate-y-1/2 [perspective:1600px]">
          {/* Halo behind the lit panel */}
          <m.div
            className="absolute top-[calc(var(--panel-h)*-0.8)] left-[calc(var(--panel-w)*-1.2)] h-[calc(var(--panel-h)*2.6)] w-[calc(var(--panel-w)*3.4)] rounded-full bg-[radial-gradient(closest-side,rgb(255_251_238/1),rgb(255_226_160/0.6)_38%,rgb(255_214_130/0.18)_65%,transparent_100%)]"
            style={{ opacity: halo, transform: lampSettle }}
          />

          <m.div style={{ transform: lampSettle, opacity: lampAlpha }} className="[transform-style:preserve-3d]">
            <Lamp2D transform={lampTransform} glow={glow} powerOn={powerOn} stand={stand} />
          </m.div>
        </div>

        {/* Sun: above the lamp so it visibly sinks into the panel; clipped by the horizon until risen */}
        <m.div className="absolute top-0 left-[var(--lamp-x)] h-[var(--horizon-y)] w-0" style={{ clipPath: sunClip }}>
          <m.div
            className="absolute bottom-0 left-[calc(var(--sun-d)/-2)] size-[var(--sun-d)]"
            style={{ transform: sunTransform, opacity: sunAlpha }}
          >
            <div className="absolute inset-[-120%] rounded-full bg-[radial-gradient(closest-side,rgb(255_244_214/0.85),rgb(255_231_168/0.35)_45%,transparent_100%)]" />
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_45%,#ffffff_0%,#fff6dc_45%,#ffe2a0_100%)] shadow-[0_0_40px_10px_rgb(255_236_190/0.8)]" />
          </m.div>
        </m.div>
      </div>

      {/* Desk scene (settle): shared by the 2D and WebGL versions */}
      <DeskScene progress={progress} />
    </div>
  );
}
