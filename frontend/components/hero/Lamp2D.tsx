"use client";

import { m, type MotionValue } from "motion/react";
import { cn } from "@/lib/cn";

/**
 * CSS 3D lamp: a 3:4 portrait panel with a warm-white bezel, frosted diffuser, slim kickstand and a
 * side power dot. Rotation and glow are driven by motion values from the parent.
 */
export function Lamp2D({
  transform,
  glow,
  powerOn,
  stand = 1,
  className,
}: {
  transform: MotionValue<string> | string;
  /** 0 → 1 diffuser emission. */
  glow: MotionValue<number> | number;
  powerOn: MotionValue<number> | number;
  stand?: MotionValue<number> | number;
  className?: string;
}) {
  return (
    <m.div
      className={cn("relative h-[var(--panel-h)] w-[var(--panel-w)] [transform-style:preserve-3d]", className)}
      style={{ transform }}
    >
      {/* Kickstand, behind the panel */}
      <m.div
        style={{ opacity: stand, boxShadow: "inset 0 0 0 1px rgb(28 27 25 / 0.06)" }}
        className="absolute bottom-[4%] left-1/2 h-[46%] w-[7%] [transform-origin:50%_0%] -translate-x-1/2 [transform:translateZ(calc(var(--panel-w)*-0.06))_rotateX(-16deg)] rounded-full bg-[#e4ddd1]"
      />

      {/* Right side face with the power dot (visible in the 3/4 view) */}
      <div className="absolute top-0 right-0 h-full w-[calc(var(--panel-w)*0.045)] origin-right [transform:rotateY(-90deg)] rounded-[3px] bg-[#d9cfbf]">
        <m.span
          className="absolute top-[18%] left-1/2 size-[5px] -translate-x-1/2 rounded-full bg-sun-400 shadow-[0_0_6px_1px_rgb(255_200_87/0.9)]"
          style={{ opacity: powerOn }}
        />
      </div>

      {/* Front: bezel */}
      <div
        className="absolute inset-0 rounded-[calc(var(--panel-w)*0.09)] bg-[linear-gradient(160deg,#f7f2ea_0%,#e6ddce_100%)]"
        style={{
          boxShadow:
            "inset 0 0 0 1px rgb(28 27 25 / 0.1), inset 0 1px 0 rgb(255 255 255 / 0.9), 0 30px 60px -30px rgb(80 60 30 / 0.4)",
        }}
      >
        {/* Diffuser: frosted, off-state */}
        <div className="absolute inset-[5.5%] overflow-hidden rounded-[calc(var(--panel-w)*0.06)] bg-[linear-gradient(180deg,#f8f5ef_0%,#efeae1_100%)] shadow-[inset_0_1px_3px_rgb(28_27_25/0.07)]">
          {/* Diffuser: lit. Opacity only. */}
          <m.div
            className="absolute inset-0 bg-[radial-gradient(130%_95%_at_50%_45%,#ffffff_0%,#fffcf3_38%,#fff1cf_70%,#ffe2a0_100%)]"
            style={{ opacity: glow }}
          />
          {/* Bright core */}
          <m.div className="absolute inset-[18%] rounded-full bg-white blur-[18px]" style={{ opacity: glow }} />
          {/* Fine frosted texture */}
          <div className="absolute inset-0 [background-image:var(--grain)] [background-size:120px_120px] opacity-[0.05] mix-blend-multiply" />
        </div>
      </div>
    </m.div>
  );
}
