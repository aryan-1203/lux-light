"use client";

/**
 * Dev-only still-render stage. One "product photo" per `?shot=<id>`, full viewport.
 * `scripts/render-stills.mjs` opens each shot, waits for `[data-ready="1"]` and screenshots it.
 */

import {
  AccumulativeShadows,
  ContactShadows,
  Environment,
  Lightformer,
  RandomizedLight,
  RoundedBox,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { memo, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import * as THREE from "three";
import LampModel, { lampAnchors } from "@/components/lamp/LampModel";
import LampViewer from "@/components/lamp/LampViewer";

type V3 = [number, number, number];

type Shot = {
  id: string;
  w: number;
  h: number;
  kit: "night" | "paper" | "desk" | "macro";
  cam: { pos: V3; target: V3; fov: number; /** Lens shift as a fraction of the frame (+x right, +y down). */ shift?: [number, number] };
  lamp: { power: number; tilt?: number; kelvin?: number; rotY?: number; pos?: V3; light?: number; glow?: number };
  exposure: number;
  bloom: { intensity: number; threshold: number; radius?: number };
  dof?: { target: V3; range: number; bokeh: number };
  vignette?: number;
  /** Background gradient centre in frame UV (0–1, y down). */
  bgCenter?: [number, number];
  /** Scales the studio's ambient/environment light (paper kit). */
  ambient?: number;
  /** Publish projected anatomy points as `data-anchors` (% of width/height). */
  anchors?: boolean;
};

const A = lampAnchors(24);

/** Deterministic Park–Miller PRNG so every render of a shot is identical. */
function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const NIGHT_HERO: Omit<Shot, "id" | "w" | "h" | "cam"> = {
  kit: "night",
  lamp: { power: 1, rotY: -0.5 },
  exposure: 1,
  bloom: { intensity: 0.95, threshold: 0.78, radius: 0.85 },
  vignette: 0.55,
};

/** Switch-off / switch-on pair: identical camera, only power and ambient differ. */
const SWITCH_CAM: Shot["cam"] = { pos: [0.62, 0.44, 1.95], target: [0, 0.29, 0], fov: 25 };

export const SHOTS: Shot[] = [
  {
    ...NIGHT_HERO,
    id: "hero-desktop",
    w: 1920,
    h: 1200,
    cam: { pos: [0.6, 0.42, 1.78], target: [0, 0.3, 0], fov: 26, shift: [0.2, 0.02] },
    bgCenter: [0.7, 0.42],
  },
  {
    ...NIGHT_HERO,
    id: "hero-mobile",
    w: 1080,
    h: 1600,
    cam: { pos: [0.66, 0.4, 2.0], target: [0, 0.3, 0], fov: 34, shift: [0, 0.18] },
    bgCenter: [0.5, 0.64],
  },
  {
    ...NIGHT_HERO,
    id: "og",
    w: 1200,
    h: 630,
    cam: { pos: [0.6, 0.42, 1.78], target: [0, 0.3, 0], fov: 25, shift: [0.22, 0.02] },
    bgCenter: [0.72, 0.45],
  },
  {
    id: "desk-dawn",
    w: 1600,
    h: 1200,
    kit: "desk",
    cam: { pos: [0.62, 0.43, 1.32], target: [0.02, 0.3, -0.12], fov: 34 },
    lamp: { power: 1, rotY: -0.5, pos: [0.3, 0, -0.1], light: 24, kelvin: 5600 },
    exposure: 1,
    bloom: { intensity: 0.55, threshold: 0.85, radius: 0.7 },
    vignette: 0.45,
  },
  {
    id: "front-studio",
    w: 1600,
    h: 1600,
    kit: "paper",
    cam: { pos: [0.28, 0.4, 2.15], target: [0, 0.3, 0], fov: 22 },
    lamp: { power: 1, rotY: -0.08, light: 12, glow: 1.25 },
    exposure: 1.65,
    bloom: { intensity: 0.35, threshold: 0.9, radius: 0.6 },
    vignette: 0.25,
  },
  {
    id: "profile",
    w: 1200,
    h: 1600,
    kit: "paper",
    cam: { pos: [2.1, 0.34, 0.12], target: [0, 0.3, 0.02], fov: 24 },
    lamp: { power: 0.9, rotY: 0.38, light: 9, glow: 1.25 },
    exposure: 1.65,
    bloom: { intensity: 0.35, threshold: 0.9, radius: 0.6 },
    vignette: 0.25,
  },
  {
    id: "switch-off",
    w: 1080,
    h: 1440,
    kit: "paper",
    cam: SWITCH_CAM,
    lamp: { power: 0, rotY: -0.42, light: 12 },
    ambient: 0.5,
    exposure: 1.65,
    bloom: { intensity: 0.35, threshold: 0.9, radius: 0.6 },
    vignette: 0.3,
  },
  {
    id: "switch-on",
    w: 1080,
    h: 1440,
    kit: "paper",
    cam: SWITCH_CAM,
    lamp: { power: 1, rotY: -0.42, light: 10, glow: 1.25 },
    ambient: 0.85,
    exposure: 1.65,
    bloom: { intensity: 0.45, threshold: 0.85, radius: 0.7 },
    vignette: 0.3,
  },
  {
    id: "anatomy",
    w: 1600,
    h: 1200,
    kit: "paper",
    // Long lens, pure side-on: near-orthographic.
    cam: { pos: [6.2, 0.3, 0.02], target: [0, 0.3, 0.02], fov: 7.6 },
    lamp: { power: 1, rotY: 0, light: 12, glow: 1.25 },
    exposure: 1.65,
    bloom: { intensity: 0.35, threshold: 0.9, radius: 0.6 },
    vignette: 0.15,
    anchors: true,
  },
  {
    id: "detail-dial",
    w: 1600,
    h: 1200,
    kit: "macro",
    cam: { pos: [0.13, 0.115, 0.23], target: [A.dial.x - 0.006, A.dial.y - 0.022, A.dial.z], fov: 24 },
    lamp: { power: 1, rotY: 0 },
    exposure: 1,
    bloom: { intensity: 0.5, threshold: 0.85, radius: 0.7 },
    dof: { target: [A.dial.x, A.dial.y, A.dial.z + 0.008], range: 0.035, bokeh: 5 },
    vignette: 0.5,
    bgCenter: [0.5, 0.35],
  },
  {
    id: "detail-panel",
    w: 1600,
    h: 1200,
    kit: "macro",
    cam: {
      pos: [A.panelCorner.x + 0.25, A.panelCorner.y - 0.02, A.panelCorner.z + 0.25],
      target: [A.panelCorner.x - 0.06, A.panelCorner.y - 0.045, A.panelCorner.z - 0.01],
      fov: 30,
    },
    lamp: { power: 1, rotY: 0 },
    exposure: 1,
    bloom: { intensity: 0.6, threshold: 0.85, radius: 0.75 },
    dof: { target: [A.panelCorner.x, A.panelCorner.y - 0.02, A.panelCorner.z], range: 0.06, bokeh: 6 },
    vignette: 0.5,
    bgCenter: [0.5, 0.5],
  },
];

/* ------------------------------------------------------------------------------------------ */

const subscribe = () => () => {};
const getSearch = () => window.location.search;

export default function RenderStage() {
  const search = useSyncExternalStore(subscribe, getSearch, () => "");
  const params = new URLSearchParams(search);
  const id = params.get("shot");
  const [ready, setReady] = useState(false);
  const [anchors, setAnchors] = useState<string>();
  const shot = SHOTS.find((s) => s.id === id);

  // `?viewer=night|paper|transparent[&power=0.6]` previews the interactive LampViewer.
  const viewer = params.get("viewer");
  if (viewer === "night" || viewer === "paper" || viewer === "transparent") {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: viewer === "transparent" ? "linear-gradient(#17110c, #6b5a48 55%, #f6f1e7)" : undefined,
        }}
      >
        <LampViewer background={viewer} power={Number(params.get("power") ?? 1)} className="size-full" />
      </div>
    );
  }

  if (!id || !shot) {
    return (
      <main style={{ padding: 24, fontFamily: "monospace", background: "#07080d", color: "#fff6e3", minHeight: "100dvh" }}>
        <p>Pick a shot:</p>
        <ul>
          {SHOTS.map((s) => (
            <li key={s.id}>
              <a href={`?shot=${s.id}`} style={{ color: "#ffc861" }}>
                {s.id}
              </a>{" "}
              ({s.w}×{s.h})
            </li>
          ))}
        </ul>
      </main>
    );
  }

  return (
    <div data-ready={ready ? "1" : "0"} data-shot={shot.id} data-anchors={anchors} style={{ position: "fixed", inset: 0, background: "#000" }}>
      <Canvas
        dpr={typeof window === "undefined" ? 2 : window.devicePixelRatio}
        gl={{ preserveDrawingBuffer: true, antialias: true, powerPreference: "high-performance", stencil: false }}
        camera={{ near: 0.02, far: 40, fov: shot.cam.fov, position: shot.cam.pos }}
        shadows
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = shot.exposure;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.shadowMap.type = shot.kit === "paper" ? THREE.VSMShadowMap : THREE.PCFShadowMap;
        }}
      >
        <ShotCamera shot={shot} />
        <Scene shot={shot} />
        <EffectComposer multisampling={8}>
          <>{shot.dof ? <DepthOfField target={shot.dof.target} focusRange={shot.dof.range} bokehScale={shot.dof.bokeh} resolutionScale={1} /> : null}</>
          <Bloom
            mipmapBlur
            intensity={shot.bloom.intensity}
            luminanceThreshold={shot.bloom.threshold}
            luminanceSmoothing={0.25}
            radius={shot.bloom.radius ?? 0.7}
          />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Vignette eskil={false} offset={0.3} darkness={shot.vignette ?? 0.3} />
          <Noise premultiply={false} blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.07} />
        </EffectComposer>
        {shot.anchors && <AnchorReporter onReport={setAnchors} />}
        <ReadySignal frames={shot.kit === "night" || shot.kit === "macro" ? 45 : 110} onReady={() => setReady(true)} />
      </Canvas>
    </div>
  );
}

function ReadySignal({ frames, onReady }: { frames: number; onReady: () => void }) {
  const n = useRef(0);
  const done = useRef(false);
  useFrame(() => {
    n.current += 1;
    if (!done.current && n.current >= frames) {
      done.current = true;
      onReady();
    }
  });
  return null;
}

/** Projects the anatomy points to % of the frame (for positioning callout labels). */
function AnchorReporter({ onReport }: { onReport: (json: string) => void }) {
  const n = useRef(0);
  useFrame(({ camera }) => {
    n.current += 1;
    if (n.current !== 10) return;
    const pts = { panelFace: A.panelCenter, gooseneckMid: A.armMid, dial: A.dial, base: A.baseCenter, top: A.panelTop };
    const out: Record<string, [number, number]> = {};
    for (const [k, v] of Object.entries(pts)) {
      const p = v.clone().project(camera);
      out[k] = [+((p.x * 0.5 + 0.5) * 100).toFixed(1), +((-p.y * 0.5 + 0.5) * 100).toFixed(1)];
    }
    onReport(JSON.stringify(out));
  });
  return null;
}

function ShotCamera({ shot }: { shot: Shot }) {
  const get = useThree((s) => s.get);
  const size = useThree((s) => s.size);
  useLayoutEffect(() => {
    const cam = get().camera as THREE.PerspectiveCamera;
    cam.position.set(...shot.cam.pos);
    cam.fov = shot.cam.fov;
    cam.lookAt(...shot.cam.target);
    const [sx, sy] = shot.cam.shift ?? [0, 0];
    if (sx || sy) cam.setViewOffset(size.width, size.height, -sx * size.width, -sy * size.height, size.width, size.height);
    else cam.clearViewOffset();
    cam.updateProjectionMatrix();
  }, [get, shot, size]);
  return null;
}

/* ------------------------------------------------------------------------------------------ */
/* Scenes                                                                                     */
/* ------------------------------------------------------------------------------------------ */

/**
 * Memoised: drei's AccumulativeShadows resets its accumulated shadow on every re-render, so the
 * scene must not re-render when the stage flips `data-ready`.
 */
const Scene = memo(function Scene({ shot }: { shot: Shot }) {
  const l = shot.lamp;
  const lamp = (
    <LampModel
      power={l.power}
      tilt={l.tilt ?? 24}
      kelvin={l.kelvin ?? 6000}
      lightIntensity={l.light ?? 16}
      glow={l.glow ?? 2.6}
      position={l.pos ?? [0, 0, 0]}
      rotation={[0, l.rotY ?? 0, 0]}
      shadows
    />
  );
  switch (shot.kit) {
    case "night":
      return <NightKit shot={shot}>{lamp}</NightKit>;
    case "macro":
      return <MacroKit shot={shot}>{lamp}</MacroKit>;
    case "paper":
      return <PaperKit shot={shot}>{lamp}</PaperKit>;
    case "desk":
      return <DeskKit shot={shot}>{lamp}</DeskKit>;
  }
});

/** Screen-space radial gradient as the scene background. */
function GradientBackground({ stops, center = [0.5, 0.5], radius = 0.85 }: { stops: string[]; center?: [number, number]; radius?: number }) {
  const size = useThree((s) => s.size);
  const tex = useMemo(() => {
    const W = 1024;
    const H = Math.round((W * size.height) / size.width);
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(center[0] * W, center[1] * H, 0, center[0] * W, center[1] * H, radius * Math.max(W, H));
    stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [size.width, size.height, stops, center, radius]);
  return <primitive attach="background" object={tex} />;
}

/** Floor disc that fades to transparent at the rim so it melts into the background. */
function FadeFloor({ color, radius = 3, roughness = 0.8, inner = 0.15 }: { color: string; radius?: number; roughness?: number; inner?: number }) {
  const alpha = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    g.addColorStop(0, "#fff");
    g.addColorStop(inner, "#fff");
    g.addColorStop(0.75, "#222");
    g.addColorStop(1, "#000");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    return new THREE.CanvasTexture(c);
  }, [inner]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[radius, 96]} />
      <meshStandardMaterial color={color} roughness={roughness} alphaMap={alpha} transparent depthWrite={false} />
    </mesh>
  );
}

function NightKit({ shot, children }: { shot: Shot; children: ReactNode }) {
  return (
    <>
      <GradientBackground stops={["#151824", "#0e111a", "#0a0c12", "#07080d"]} center={shot.bgCenter} radius={0.75} />
      <Environment resolution={1024} frames={1} environmentIntensity={0.55}>
        <Lightformer form="rect" intensity={2.2} color="#ffd9b0" position={[2.2, 1.4, -1.6]} scale={[1.2, 2.4, 1]} target={[0, 0.3, 0]} />
        <Lightformer form="rect" intensity={0.9} color="#9fb2ff" position={[-2.6, 0.9, -0.6]} scale={[0.8, 2.2, 1]} target={[0, 0.3, 0]} />
        <Lightformer form="rect" intensity={0.35} color="#ffffff" position={[0, 3, 0.6]} scale={[3, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.25} color="#ffe2c0" position={[-1.6, 0.6, 2.4]} scale={[2, 1.4, 1]} target={[0, 0.3, 0]} />
        <Lightformer form="rect" intensity={0.3} color="#ffe2c0" position={[0.4, 0.3, 2.6]} scale={[4, 1.6, 1]} target={[0, 0.2, 0]} />
      </Environment>
      {children}
      <FadeFloor color="#24252b" radius={3} roughness={0.42} />
      <ContactShadows position={[0, 0.0006, 0]} scale={1.4} resolution={1024} blur={2.4} far={0.6} opacity={0.75} color="#000" />
    </>
  );
}

function MacroKit({ shot, children }: { shot: Shot; children: ReactNode }) {
  // Warm bokeh points scattered behind the subject, along the camera's line of sight.
  const dots = useMemo(() => {
    const pos = new THREE.Vector3(...shot.cam.pos);
    const tgt = new THREE.Vector3(...shot.cam.target);
    const dir = tgt.clone().sub(pos).normalize();
    const u = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
    const v = new THREE.Vector3().crossVectors(u, dir).normalize();
    const out: { p: V3; s: number; c: THREE.Color }[] = [];
    const rnd = seeded(7);
    for (let i = 0; i < 34; i++) {
      const d = 1.8 + rnd() * 1.4;
      const c = tgt
        .clone()
        .addScaledVector(dir, d)
        .addScaledVector(u, (rnd() - 0.5) * d * 1.3)
        .addScaledVector(v, (rnd() - 0.5) * d * 0.9);
      const col = new THREE.Color(rnd() > 0.35 ? "#ffad5e" : "#ffe0b0").multiplyScalar(1.4 + rnd() * 2);
      out.push({ p: [c.x, c.y, c.z], s: 0.006 + rnd() * 0.01, c: col });
    }
    return out;
  }, [shot.cam.pos, shot.cam.target]);
  const front = new THREE.Vector3(...shot.cam.pos).sub(new THREE.Vector3(...shot.cam.target)).normalize().multiplyScalar(2);
  return (
    <>
      <GradientBackground stops={["#2a1d14", "#1a120d", "#110c09", "#0a0706"]} center={shot.bgCenter} radius={0.8} />
      <Environment resolution={1024} frames={1} environmentIntensity={0.7}>
        <Lightformer form="rect" intensity={3} color="#ffd2a1" position={[1.4, 0.8, 0.6]} scale={[0.25, 1.8, 1]} target={[0, 0.2, 0]} />
        <Lightformer form="rect" intensity={2} color="#ffe6c8" position={[-1.2, 0.6, 1]} scale={[0.25, 1.6, 1]} target={[0, 0.2, 0]} />
        <Lightformer form="rect" intensity={0.5} color="#ffffff" position={[0, 2.5, 0.5]} scale={[2, 2, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.2} color="#ff9a55" position={[0, 0.8, -2]} scale={[3, 1, 1]} target={[0, 0.3, 0]} />
        {/* Soft frontal flag so brushed metal faces read silver, not black */}
        <Lightformer form="rect" intensity={1.2} color="#ffe9d2" position={[front.x, front.y + 0.5, front.z]} scale={[3.5, 2, 1]} target={shot.cam.target} />
        <Lightformer form="rect" intensity={0.8} color="#ffe9d2" position={[-front.x, 0.6, front.z]} scale={[3.5, 2, 1]} target={shot.cam.target} />
      </Environment>
      {children}
      {dots.map((d, i) => (
        <mesh key={i} position={d.p}>
          <sphereGeometry args={[d.s, 16, 12]} />
          <meshBasicMaterial color={d.c} toneMapped={false} />
        </mesh>
      ))}
      <FadeFloor color="#1e1712" radius={2.5} roughness={0.55} inner={0.05} />
      <ContactShadows position={[0, 0.0006, 0]} scale={1.2} resolution={1024} blur={2} far={0.5} opacity={0.7} color="#000" />
    </>
  );
}

/** Seamless cyclorama: flat floor that curves up into a back wall. */
function useSweepGeometry(width = 8, floorDepth = 4, radius = 1.2, height = 4, back = -1.2) {
  return useMemo(() => {
    const prof: THREE.Vector2[] = [];
    // Profile in (z, y): front of floor → curve → wall top.
    const zFront = back + floorDepth;
    const zCurve = back + radius;
    const steps = 48;
    prof.push(new THREE.Vector2(zFront, 0));
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * (Math.PI / 2);
      prof.push(new THREE.Vector2(zCurve - Math.sin(a) * radius, radius - Math.cos(a) * radius));
    }
    prof.push(new THREE.Vector2(back, height));
    const cols = 2;
    const pos: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i < prof.length; i++) {
      for (let j = 0; j <= cols; j++) {
        pos.push(-width / 2 + (j / cols) * width, prof[i].y, prof[i].x);
      }
    }
    for (let i = 0; i < prof.length - 1; i++) {
      for (let j = 0; j < cols; j++) {
        const a = i * (cols + 1) + j;
        const b = a + cols + 1;
        idx.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, [width, floorDepth, radius, height, back]);
}

function PaperKit({ shot, children }: { shot: Shot; children: ReactNode }) {
  const amb = shot.ambient ?? 1;
  const sweep = useSweepGeometry(14, 10, 1.2, 6, -2.2);
  // Turn the cyclorama so its wall is always behind the lamp as seen from the camera.
  const facing = Math.atan2(shot.cam.pos[0], shot.cam.pos[2]);
  return (
    <>
      <color attach="background" args={["#f6f1e7"]} />
      <Environment resolution={1024} frames={1} environmentIntensity={amb}>
        <Lightformer form="rect" intensity={2.4} color="#fff3e2" position={[-2.2, 2.4, 2.6]} scale={[2.6, 2.6, 1]} target={[0, 0.3, 0]} />
        <Lightformer form="rect" intensity={0.9} color="#fff8f0" position={[2.6, 1.2, 1.6]} scale={[1.6, 2.4, 1]} target={[0, 0.3, 0]} />
        <Lightformer form="rect" intensity={1.4} color="#ffffff" position={[0, 3.2, 0]} scale={[3, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.6} color="#ffe9cc" position={[1.4, 1.4, -2.6]} scale={[1.2, 2.6, 1]} target={[0, 0.3, 0]} />
        <Lightformer form="rect" intensity={0.6} color="#f6f1e7" position={[0, -1, 0]} scale={[6, 6, 1]} target={[0, 0.3, 0]} />
        <Lightformer form="rect" intensity={0.8} color="#fffaf2" position={[shot.cam.pos[0] * 1.5, 0.5, shot.cam.pos[2] * 1.5]} scale={[2.5, 1.6, 1]} target={[0, 0.3, 0]} />
        {/* Low white cards left and right so brushed/chrome parts read silver from any angle */}
        <Lightformer form="rect" intensity={0.9} color="#fffaf2" position={[-2.6, 0.4, 1.2]} scale={[3, 1.6, 1]} target={[0, 0.3, 0]} />
        <Lightformer form="rect" intensity={0.6} color="#fffaf2" position={[2.6, 0.4, 1.2]} scale={[3, 1.6, 1]} target={[0, 0.3, 0]} />
      </Environment>
      {/* Key: a big soft source above-left; VSM gives a smooth penumbra. */}
      <directionalLight
        position={[-1.2, 2.8, 1.4]}
        intensity={1.1 * amb}
        color="#fff1dc"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-radius={14}
        shadow-blurSamples={24}
        shadow-bias={-0.0004}
        shadow-camera-left={-1}
        shadow-camera-right={1}
        shadow-camera-top={1}
        shadow-camera-bottom={-1}
        shadow-camera-near={0.5}
        shadow-camera-far={8}
      />
      <mesh geometry={sweep} rotation={[0, facing, 0]} receiveShadow>
        <meshStandardMaterial color="#f3ece0" roughness={0.95} />
      </mesh>
      {children}
      <ContactShadows position={[0, 0.0009, 0]} scale={1.2} resolution={1024} blur={1.6} far={0.25} opacity={0.4} color="#3d2c1c" />
    </>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Desk scene                                                                                 */
/* ------------------------------------------------------------------------------------------ */

function woodTexture() {
  const W = 2048;
  const H = 512;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#94622f";
  ctx.fillRect(0, 0, W, H);
  const rnd = seeded(11);
  // Planks
  const planks = 4;
  for (let p = 0; p < planks; p++) {
    const y0 = (p / planks) * H;
    const tone = 0.85 + rnd() * 0.3;
    ctx.fillStyle = `rgba(${Math.round(150 * tone)},${Math.round(102 * tone)},${Math.round(50 * tone)},1)`;
    ctx.fillRect(0, y0, W, H / planks);
    // Grain lines
    for (let i = 0; i < 70; i++) {
      const y = y0 + rnd() * (H / planks);
      const amp = 2 + rnd() * 6;
      const freq = 0.002 + rnd() * 0.004;
      const phase = rnd() * 10;
      const dark = rnd() > 0.5;
      ctx.strokeStyle = dark ? `rgba(60,32,16,${0.08 + rnd() * 0.22})` : `rgba(170,110,66,${0.05 + rnd() * 0.12})`;
      ctx.lineWidth = 0.6 + rnd() * 2.2;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 16) {
        const yy = y + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 3.1 + phase) * amp * 0.3;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    // Seam between planks
    ctx.fillStyle = "rgba(35,18,8,0.55)";
    ctx.fillRect(0, y0, W, 1.5);
  }
  // Fine noise
  const img = ctx.getImageData(0, 0, W, H);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rnd() - 0.5) * 10;
    img.data[i] += n;
    img.data[i + 1] += n * 0.8;
    img.data[i + 2] += n * 0.6;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function skyTexture() {
  const W = 1024;
  const H = 768;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#0d1730");
  g.addColorStop(0.3, "#1f2f5a");
  g.addColorStop(0.52, "#53507a");
  g.addColorStop(0.66, "#b06a6a");
  g.addColorStop(0.76, "#ff8a3d");
  g.addColorStop(0.84, "#ffc861");
  g.addColorStop(1, "#ffd99a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // A low sun glow just under the horizon.
  const sg = ctx.createRadialGradient(W * 0.62, H * 0.86, 0, W * 0.62, H * 0.86, W * 0.45);
  sg.addColorStop(0, "rgba(255,214,140,0.9)");
  sg.addColorStop(1, "rgba(255,170,90,0)");
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, W, H);
  // Distant city skyline: flat roofs, water tanks, a few trees.
  const rnd = seeded(5);
  ctx.fillStyle = "#2a2338";
  let x = 0;
  while (x < W) {
    const bw = 30 + rnd() * 90;
    const bh = H * (0.1 + rnd() * 0.12);
    ctx.fillRect(x, H - bh, bw + 1, bh);
    if (rnd() > 0.55) ctx.fillRect(x + bw * 0.3, H - bh - 12, 18, 12); // water tank
    if (rnd() > 0.7) {
      ctx.beginPath();
      ctx.arc(x + bw * 0.8, H - bh - 10, 18 + rnd() * 16, 0, Math.PI * 2);
      ctx.fill();
    }
    x += bw;
  }
  // A few warm windows lit before dawn
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = rnd() > 0.5 ? "rgba(255,190,110,0.85)" : "rgba(255,230,170,0.7)";
    ctx.fillRect(rnd() * W, H - H * 0.02 - rnd() * H * 0.08, 4, 5);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Mug({ position, rotation = 0 }: { position: V3; rotation?: number }) {
  const geo = useMemo(() => {
    // Outer wall up, rounded rim, inner wall down (thickness 5 mm).
    const pts: THREE.Vector2[] = [];
    const R = 0.041;
    const Hh = 0.094;
    pts.push(new THREE.Vector2(0, 0.0005));
    pts.push(new THREE.Vector2(R - 0.006, 0));
    pts.push(new THREE.Vector2(R - 0.0015, 0.0015));
    pts.push(new THREE.Vector2(R, 0.006));
    for (let i = 1; i <= 10; i++) pts.push(new THREE.Vector2(R + 0.0015 * Math.sin((i / 10) * Math.PI), 0.006 + (i / 10) * (Hh - 0.01)));
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * Math.PI;
      pts.push(new THREE.Vector2(R - 0.0025 + Math.cos(a) * 0.0025, Hh - 0.004 + Math.sin(a) * 0.0025));
    }
    pts.push(new THREE.Vector2(R - 0.005, Hh - 0.012));
    pts.push(new THREE.Vector2(R - 0.0055, 0.012));
    pts.push(new THREE.Vector2(0, 0.009));
    return new THREE.LatheGeometry(pts, 96);
  }, []);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshPhysicalMaterial color="#f1e8d8" roughness={0.2} clearcoat={0.7} clearcoatRoughness={0.12} side={THREE.DoubleSide} />
      </mesh>
      {/* Chai */}
      <mesh position={[0, 0.074, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.0352, 48]} />
        <meshPhysicalMaterial color="#9a5f32" roughness={0.15} clearcoat={1} />
      </mesh>
      {/* Handle */}
      <mesh position={[0.046, 0.05, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <torusGeometry args={[0.022, 0.0058, 20, 48, Math.PI]} />
        <meshPhysicalMaterial color="#f1e8d8" roughness={0.2} clearcoat={0.7} clearcoatRoughness={0.12} />
      </mesh>
    </group>
  );
}

function Book({ size, color, position, rotY = 0 }: { size: V3; color: string; position: V3; rotY?: number }) {
  const [w, h, d] = size;
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <RoundedBox args={[w, h, d]} radius={0.0025} smoothness={3} position={[0, h / 2, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color={color} roughness={0.6} clearcoat={0.15} />
      </RoundedBox>
      {/* Page block, visible on the three open sides */}
      <mesh position={[0.003, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.004, h - 0.004, d - 0.006]} />
        <meshStandardMaterial color="#ece2cc" roughness={0.9} />
      </mesh>
    </group>
  );
}

function SnakePlant({ position }: { position: V3 }) {
  const pot = useMemo(() => {
    const pts = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.058, 0),
      new THREE.Vector2(0.07, 0.11),
      new THREE.Vector2(0.078, 0.112),
      new THREE.Vector2(0.079, 0.135),
      new THREE.Vector2(0.071, 0.137),
      new THREE.Vector2(0.068, 0.125),
      new THREE.Vector2(0, 0.125),
    ];
    return new THREE.LatheGeometry(pts, 64);
  }, []);
  const leaves = useMemo(() => {
    const out: { geo: THREE.BufferGeometry; rot: V3; pos: V3 }[] = [];
    const rnd = seeded(3);
    for (let i = 0; i < 9; i++) {
      const h = 0.28 + rnd() * 0.22;
      const w = 0.05 + rnd() * 0.022;
      const s = new THREE.Shape();
      s.moveTo(-w * 0.35, 0);
      s.bezierCurveTo(-w * 0.6, h * 0.35, -w * 0.55, h * 0.75, 0, h);
      s.bezierCurveTo(w * 0.55, h * 0.75, w * 0.6, h * 0.35, w * 0.35, 0);
      const g = new THREE.ExtrudeGeometry(s, { depth: 0.002, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.001, bevelSegments: 2, curveSegments: 16 });
      // Gentle cupping + lean
      const p = g.attributes.position;
      for (let k = 0; k < p.count; k++) {
        const x = p.getX(k);
        const y = p.getY(k);
        p.setZ(k, p.getZ(k) + (x * x) * 6 + (y * y) * 0.18);
      }
      g.computeVertexNormals();
      const a = (i / 9) * Math.PI * 2 + rnd() * 0.5;
      out.push({ geo: g, rot: [-0.12 - rnd() * 0.22, a, (rnd() - 0.5) * 0.2], pos: [Math.cos(a) * 0.012, 0.12, Math.sin(a) * 0.012] });
    }
    return out;
  }, []);
  return (
    <group position={position}>
      <mesh geometry={pot} castShadow receiveShadow>
        <meshStandardMaterial color="#b4613b" roughness={0.88} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.118, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.067, 40]} />
        <meshStandardMaterial color="#2b1e15" roughness={1} />
      </mesh>
      {leaves.map((l, i) => (
        <mesh key={i} geometry={l.geo} position={l.pos} rotation={l.rot} castShadow>
          <meshPhysicalMaterial color={i % 2 ? "#3f7040" : "#4f8048"} roughness={0.45} clearcoat={0.3} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function DeskKit({ shot, children }: { shot: Shot; children: ReactNode }) {
  const wood = useMemo(() => woodTexture(), []);
  const sky = useMemo(() => skyTexture(), []);
  const lampPos = new THREE.Vector3(...(shot.lamp.pos ?? [0, 0, 0]));
  const panel = A.panelCenter.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), shot.lamp.rotY ?? 0).add(lampPos);
  const panelN = A.panelNormal.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), shot.lamp.rotY ?? 0);
  const shadowFrom = panel.clone().addScaledVector(panelN, 0.05);

  const wallZ = -0.42;
  const win = { x: -0.32, y0: 0.16, y1: 1.12, w: 0.86 };
  const wallColor = "#cdb596";
  const frame = "#3b2618";

  return (
    <>
      <color attach="background" args={["#0b0a0c"]} />
      <Environment resolution={1024} frames={1} environmentIntensity={0.5}>
        {/* Window: cool-violet sky with an amber horizon */}
        <Lightformer form="rect" intensity={1.4} color="#7f86c4" position={[-0.3, 1.2, -1.5]} scale={[1.4, 1, 1]} target={[0, 0.3, 0]} />
        <Lightformer form="rect" intensity={2} color="#ff9d57" position={[-0.3, 0.5, -1.5]} scale={[1.4, 0.4, 1]} target={[0, 0.3, 0]} />
        {/* Warm bounce from the lamp side of the room */}
        <Lightformer form="rect" intensity={0.6} color="#ffd9a8" position={[1.6, 0.8, 1]} scale={[1.5, 1.5, 1]} target={[0, 0.3, 0]} />
        <Lightformer form="rect" intensity={0.25} color="#ffe8cc" position={[0, 2.5, 1]} scale={[3, 3, 1]} target={[0, 0, 0]} />
      </Environment>

      {/* Window light spilling in */}
      <rectAreaLight
        args={["#9aa0d8", 2.2, win.w, win.y1 - win.y0]}
        position={[win.x, (win.y0 + win.y1) / 2, wallZ - 0.02]}
        rotation={[0, Math.PI, 0]}
      />
      <rectAreaLight args={["#ff9a50", 3, win.w, 0.2]} position={[win.x, win.y0 + 0.12, wallZ - 0.02]} rotation={[0, Math.PI, 0]} />

      {/* Desk top */}
      <mesh position={[0, -0.0175, 0.02]} receiveShadow castShadow>
        <boxGeometry args={[1.9, 0.035, 0.86]} />
        <meshPhysicalMaterial map={wood} roughness={0.42} clearcoat={0.35} clearcoatRoughness={0.25} />
      </mesh>

      {/* Back wall with a window opening */}
      <group>
        <mesh position={[0, -0.6, wallZ]} receiveShadow>
          <boxGeometry args={[4, 1.2 + win.y0 * 2, 0.06]} />
          <meshStandardMaterial color={wallColor} roughness={0.95} />
        </mesh>
        <mesh position={[0, win.y1 + 1, wallZ]} receiveShadow>
          <boxGeometry args={[4, 2, 0.06]} />
          <meshStandardMaterial color={wallColor} roughness={0.95} />
        </mesh>
        <mesh position={[win.x - win.w / 2 - 1, (win.y0 + win.y1) / 2, wallZ]} receiveShadow>
          <boxGeometry args={[2, win.y1 - win.y0, 0.06]} />
          <meshStandardMaterial color={wallColor} roughness={0.95} />
        </mesh>
        <mesh position={[win.x + win.w / 2 + 1, (win.y0 + win.y1) / 2, wallZ]} receiveShadow>
          <boxGeometry args={[2, win.y1 - win.y0, 0.06]} />
          <meshStandardMaterial color={wallColor} roughness={0.95} />
        </mesh>
        {/* Sill */}
        <mesh position={[win.x, win.y0 - 0.01, wallZ + 0.03]} castShadow receiveShadow>
          <boxGeometry args={[win.w + 0.12, 0.02, 0.12]} />
          <meshStandardMaterial color="#d8c6aa" roughness={0.7} />
        </mesh>
        {/* Teak frame, mullion and transom */}
        {[
          { p: [win.x, win.y0 + 0.02, wallZ] as V3, s: [win.w, 0.04, 0.07] as V3 },
          { p: [win.x, win.y1 - 0.02, wallZ] as V3, s: [win.w, 0.04, 0.07] as V3 },
          { p: [win.x - win.w / 2 + 0.02, (win.y0 + win.y1) / 2, wallZ] as V3, s: [0.04, win.y1 - win.y0, 0.07] as V3 },
          { p: [win.x + win.w / 2 - 0.02, (win.y0 + win.y1) / 2, wallZ] as V3, s: [0.04, win.y1 - win.y0, 0.07] as V3 },
          { p: [win.x, (win.y0 + win.y1) / 2, wallZ] as V3, s: [0.035, win.y1 - win.y0, 0.06] as V3 },
          { p: [win.x, win.y1 - 0.24, wallZ] as V3, s: [win.w, 0.03, 0.06] as V3 },
        ].map((b, i) => (
          <mesh key={i} position={b.p} castShadow receiveShadow>
            <boxGeometry args={b.s} />
            <meshPhysicalMaterial color={frame} roughness={0.5} clearcoat={0.3} />
          </mesh>
        ))}
        {/* Iron grille */}
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={`g${i}`} position={[win.x - win.w / 2 + 0.1 + (i * (win.w - 0.2)) / 5, (win.y0 + win.y1) / 2 - 0.1, wallZ - 0.06]} castShadow>
            <cylinderGeometry args={[0.0035, 0.0035, win.y1 - win.y0 - 0.25, 10]} />
            <meshStandardMaterial color="#1c1b1d" roughness={0.5} metalness={0.6} />
          </mesh>
        ))}
        {/* Sky beyond */}
        <mesh position={[win.x, 0.8, -1.6]}>
          <planeGeometry args={[2.8, 1.9]} />
          <meshBasicMaterial map={sky} color={new THREE.Color(1.25, 1.25, 1.25)} />
        </mesh>
      </group>

      {children}

      <Mug position={[0.02, 0, 0.2]} rotation={-0.7} />
      {/* Notebook with a pencil */}
      <group position={[0.26, 0, 0.24]} rotation={[0, 0.5, 0]}>
        <RoundedBox args={[0.15, 0.011, 0.21]} radius={0.002} smoothness={3} position={[0, 0.0055, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#b98d5c" roughness={0.85} />
        </RoundedBox>
        <mesh position={[0.05, 0.0112, 0]}>
          <boxGeometry args={[0.004, 0.0006, 0.21]} />
          <meshStandardMaterial color="#2b2320" roughness={0.6} />
        </mesh>
        <mesh position={[-0.02, 0.0155, 0.01]} rotation={[Math.PI / 2, 0, 0.5]} castShadow>
          <cylinderGeometry args={[0.0035, 0.0035, 0.17, 6]} />
          <meshStandardMaterial color="#d9a521" roughness={0.5} />
        </mesh>
      </group>
      <Book size={[0.24, 0.032, 0.17]} color="#6b2430" position={[-0.27, 0, 0.12]} rotY={0.12} />
      <Book size={[0.22, 0.026, 0.155]} color="#2b3a67" position={[-0.265, 0.032, 0.115]} rotY={0.05} />
      <Book size={[0.2, 0.03, 0.14]} color="#c8962e" position={[-0.27, 0.058, 0.12]} rotY={0.2} />
      <SnakePlant position={[-0.62, 0, -0.2]} />

      <AccumulativeShadows temporal frames={90} position={[0, 0.0006, 0]} scale={2.2} color="#2a160a" opacity={0.9} alphaTest={0.7}>
        <RandomizedLight amount={8} radius={0.3} ambient={0.4} intensity={1.4} position={[shadowFrom.x, shadowFrom.y, shadowFrom.z]} bias={0.0008} mapSize={2048} size={2} />
        <RandomizedLight amount={4} radius={0.8} ambient={0.4} intensity={0.6} position={[win.x, 1.2, -1.6]} bias={0.0008} mapSize={1024} size={2} />
      </AccumulativeShadows>
    </>
  );
}
