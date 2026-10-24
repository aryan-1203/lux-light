"use client";

/**
 * Interactive 3D lamp for the product section.
 *
 * Load it client-only:
 *   const LampViewer = dynamic(() => import("@/components/lamp/LampViewer"), { ssr: false });
 *   <LampViewer power={p} background="night" className="h-[70vh] w-full" />
 *
 * - Slow idle turntable (a gentle sway, not a full spin), off under prefers-reduced-motion.
 * - Drag horizontally to turn it (±60°); it springs back on release. Vertical drags scroll the page.
 * - Renders only while on screen (IntersectionObserver), and on demand when nothing is moving.
 */

import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, ToneMapping } from "@react-three/postprocessing";
import type { MotionValue } from "motion/react";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import * as THREE from "three";
import LampModel from "./LampModel";

export type LampViewerProps = {
  /** 0–1. Static power (default 1). Ignored when `powerValue` is given. */
  power?: number;
  /**
   * 0–1, read every frame without re-rendering React (e.g. a scroll-linked motion value).
   * Changes wake the canvas even when it renders on demand.
   */
  powerValue?: MotionValue<number>;
  /** Colour temperature, 2700–6500 K. Default 6000. */
  kelvin?: number;
  className?: string;
  /**
   * "night": pre-dawn #07080d with a floor that catches the light. "paper": daylight #f6f1e7.
   * "transparent": no backdrop (alpha canvas) for a page-controlled background; daylight-ish
   * studio lighting, shadow only. Default "night".
   */
  background?: "night" | "paper" | "transparent";
};

const BG = { night: "#07080d", paper: "#f6f1e7", transparent: "transparent" } as const;
const BASE_ANGLE = -0.45; // three-quarter view
const MAX_DRAG = Math.PI / 3; // ±60°
const FOV = 28;

/** Mutable turntable state shared by the DOM pointer handlers and the render loop. */
class TurnController {
  private active = false;
  private startX = 0;
  private startOffset = 0;
  private offset = 0;
  private velocity = 0;
  private clock = 0;
  private wake: () => void = () => {};

  setWake(fn: () => void) {
    this.wake = fn;
  }
  down(x: number) {
    this.active = true;
    this.startX = x;
    this.startOffset = this.offset;
    this.velocity = 0;
    this.wake();
  }
  move(x: number, width: number) {
    if (!this.active) return;
    this.offset = THREE.MathUtils.clamp(this.startOffset + ((x - this.startX) / width) * Math.PI * 1.1, -MAX_DRAG, MAX_DRAG);
    this.wake();
  }
  up() {
    this.active = false;
    this.wake();
  }
  /** Advances the idle sway and the spring; returns the angle and whether it is still moving. */
  step(delta: number, spin: boolean) {
    const dt = Math.min(delta, 1 / 20);
    if (spin && !this.active) this.clock += dt;
    if (!this.active) {
      // Underdamped spring back to the idle pose.
      const k = 38;
      const c = 2 * Math.sqrt(k) * 0.72;
      this.velocity += (-k * this.offset - c * this.velocity) * dt;
      this.offset += this.velocity * dt;
      if (Math.abs(this.offset) < 1e-4 && Math.abs(this.velocity) < 1e-4) {
        this.offset = 0;
        this.velocity = 0;
      }
    }
    const idle = spin ? Math.sin(this.clock * 0.22) * 0.5 : 0;
    return { angle: BASE_ANGLE + idle + this.offset, moving: this.active || this.offset !== 0 };
  }
}

const reducedQuery = "(prefers-reduced-motion: reduce)";
function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(reducedQuery);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function LampViewer({ power = 1, powerValue, kelvin = 6000, className, background = "night" }: LampViewerProps) {
  const night = background === "night";
  const wrap = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const reduced = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(reducedQuery).matches,
    () => false,
  );
  const [turn] = useState(() => new TurnController());

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    turn.down(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => turn.move(e.clientX, e.currentTarget.clientWidth || 600);
  const onPointerUp = () => turn.up();

  return (
    <div
      ref={wrap}
      className={className}
      style={{ position: "relative", touchAction: "pan-y", cursor: "grab", background: BG[background] }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="img"
      aria-label="3D model of the lamp: a large glowing light panel on a curved arm and white base. Drag to turn it."
    >
      <Canvas
        dpr={[1, 1.75]}
        frameloop={inView ? (reduced ? "demand" : "always") : "never"}
        camera={{ fov: FOV, near: 0.05, far: 20, position: [0, 0.38, 2] }}
        gl={{ antialias: false, stencil: false, alpha: background === "transparent", powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
        tabIndex={-1}
      >
        {background !== "transparent" && <color attach="background" args={[BG[background]]} />}
        {powerValue && <WakeOnChange value={powerValue} />}
        <Framing />
        <Lighting background={background} />
        <Turntable turn={turn} spin={!reduced}>
          <LampModel
            power={power}
            powerSource={powerValue}
            kelvin={kelvin}
            lightIntensity={night ? 22 : 12}
            glow={night ? 1.7 : 1.5}
          />
        </Turntable>
        {night && <NightFloor />}
        <ContactShadows
          position={[0, 0.0006, 0]}
          scale={night ? 1.4 : 1}
          resolution={512}
          blur={night ? 2.4 : 2.8}
          far={night ? 0.6 : 0.35}
          opacity={night ? 0.75 : 0.35}
          color={night ? "#000000" : "#3d2c1c"}
        />
        <EffectComposer multisampling={4}>
          <Bloom
            mipmapBlur
            intensity={night ? 0.6 : 0.3}
            luminanceThreshold={0.9}
            luminanceSmoothing={0.25}
            radius={0.7}
          />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <>{background !== "transparent" && <Noise premultiply={false} blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.12} />}</>
        </EffectComposer>
      </Canvas>
    </div>
  );
}

export default LampViewer;

/* ------------------------------------------------------------------------------------------ */

/** Keeps the whole lamp in frame for any aspect ratio. */
function Framing() {
  const get = useThree((s) => s.get);
  const size = useThree((s) => s.size);
  useLayoutEffect(() => {
    const cam = get().camera as THREE.PerspectiveCamera;
    const aspect = size.width / Math.max(1, size.height);
    const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    // Fit ~0.8 m tall and ~0.62 m wide (panel swing included).
    const dist = Math.max(0.4 / tan, 0.31 / (tan * aspect)) + 0.2;
    cam.position.set(0, 0.36 + dist * 0.06, dist);
    cam.lookAt(0, 0.29, 0);
    cam.updateProjectionMatrix();
    get().invalidate();
  }, [get, size]);
  return null;
}

function Turntable({ turn, spin, children }: { turn: TurnController; spin: boolean; children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => turn.setWake(() => invalidate()), [turn, invalidate]);

  useFrame((_, delta) => {
    const { angle, moving } = turn.step(delta, spin);
    if (group.current) group.current.rotation.y = angle;
    // In demand mode (reduced motion) keep rendering until the spring settles.
    if (moving) invalidate();
  });

  return <group ref={group}>{children}</group>;
}

/** Re-render the (demand-mode) canvas whenever the motion value moves. */
function WakeOnChange({ value }: { value: MotionValue<number> }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => value.on("change", () => invalidate()), [value, invalidate]);
  return null;
}

function Lighting({ background }: { background: "night" | "paper" | "transparent" }) {
  if (background !== "night") {
    return (
      <Environment resolution={256} frames={1} environmentIntensity={background === "paper" ? 1 : 0.85}>
        <Lightformer form="rect" intensity={2.4} color="#fff3e2" position={[-2.2, 2.4, 2.6]} scale={[2.6, 2.6, 1]} target={[0, 0.3, 0]} />
        <Lightformer form="rect" intensity={0.9} color="#fff8f0" position={[2.6, 1.2, 1.6]} scale={[1.6, 2.4, 1]} target={[0, 0.3, 0]} />
        <Lightformer form="rect" intensity={1.4} color="#ffffff" position={[0, 3.2, 0]} scale={[3, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.6} color="#ffe9cc" position={[1.4, 1.4, -2.6]} scale={[1.2, 2.6, 1]} target={[0, 0.3, 0]} />
        <Lightformer form="rect" intensity={0.6} color="#f6f1e7" position={[0, -1, 0]} scale={[6, 6, 1]} target={[0, 0.3, 0]} />
      </Environment>
    );
  }
  return (
    <Environment resolution={256} frames={1} environmentIntensity={0.55}>
      <Lightformer form="rect" intensity={2.2} color="#ffd9b0" position={[2.2, 1.4, -1.6]} scale={[1.2, 2.4, 1]} target={[0, 0.3, 0]} />
      <Lightformer form="rect" intensity={0.9} color="#9fb2ff" position={[-2.6, 0.9, -0.6]} scale={[0.8, 2.2, 1]} target={[0, 0.3, 0]} />
      <Lightformer form="rect" intensity={0.35} color="#ffffff" position={[0, 3, 0.6]} scale={[3, 3, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={0.25} color="#ffe2c0" position={[-1.6, 0.6, 2.4]} scale={[2, 1.4, 1]} target={[0, 0.3, 0]} />
    </Environment>
  );
}

/** Dark matte floor that receives the panel's light and fades into the background. */
function NightFloor() {
  const alpha = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "#fff");
    g.addColorStop(0.15, "#fff");
    g.addColorStop(0.75, "#222");
    g.addColorStop(1, "#000");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);
  useEffect(() => () => alpha.dispose(), [alpha]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[2.5, 64]} />
      <meshStandardMaterial color="#11131a" roughness={0.72} alphaMap={alpha} transparent depthWrite={false} />
    </mesh>
  );
}
