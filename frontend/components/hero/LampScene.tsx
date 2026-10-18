"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import type { BloomEffect } from "postprocessing";
import type { MotionValue } from "motion/react";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import {
  horizonGlow,
  horizonSpan,
  lampOpen,
  lampTurn,
  lerp,
  panelGlow,
  panelHalo,
  range,
  settle,
  skyDawn,
  skyPaper,
  skySunrise,
  smooth,
  spillOpacity,
  spillScale,
  standVisible,
  sunClipped,
  sunOffset,
  sunOpacity,
  sunScale,
} from "./timeline";

/** Stage layout in CSS px, measured by the parent from the same CSS variables the 2D layer uses. */
export type StageLayout = {
  width: number;
  height: number;
  lampX: number;
  horizonY: number;
  panelH: number;
  s5ShiftN: number;
  s5Scale: number;
};

type Props = {
  progress: MotionValue<number>;
  layout: RefObject<StageLayout>;
  onReady: () => void;
  /** The device can't keep up: hand the story back to the 2D layer. */
  onFail: () => void;
  /** Frame-budget fallback (off only for QA via ?hero=3d). */
  governor?: boolean;
};

const FOV = 30;
const CAM_Z = 10;
const DEPTH = 0.032; // panel thickness as a fraction of its height (slim)
const deg = THREE.MathUtils.degToRad;

export default function LampScene({ progress, layout, onReady, onFail, governor = true }: Props) {
  const [probing, setProbing] = useState(true);
  const [dpr, setDpr] = useState<[number, number]>([1, 1.75]);
  const [bloom, setBloom] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setProbing(false), 1400);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <Canvas
      flat
      dpr={dpr}
      frameloop={probing ? "always" : "demand"}
      camera={{ fov: FOV, position: [0, 0, CAM_Z], near: 0.1, far: 60 }}
      gl={{ antialias: false, alpha: false, stencil: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onFail();
        });
      }}
      aria-hidden
      tabIndex={-1}
    >
      <Story
        progress={progress}
        layout={layout}
        probing={probing}
        onReady={onReady}
        onSlow={(stage) => {
          if (!governor) return;
          if (stage === "degrade") {
            setBloom(false);
            setDpr([1, 1]);
          } else onFail();
        }}
      />
      {bloom && (
        <EffectComposer multisampling={0}>
          <BloomDriver progress={progress} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

/* ------------------------------------------------------------------------------------------ */

function BloomDriver({ progress }: { progress: MotionValue<number> }) {
  const ref = useRef<BloomEffect>(null);
  useFrame(() => {
    const p = progress.get();
    if (!ref.current) return;
    const sunPhase = range(p, 0.2, 0.3) * (1 - range(p, 0.56, 0.64));
    ref.current.intensity = Math.max(0.55 * sunPhase, lerp(0.2, 0.85, panelGlow(p)));
  });
  return <Bloom ref={ref} mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.15} intensity={0.4} radius={0.62} />;
}

/* ------------------------------------------------------------------------------------------ */

function Story({
  progress,
  layout,
  probing,
  onReady,
  onSlow,
}: {
  progress: MotionValue<number>;
  layout: RefObject<StageLayout>;
  probing: boolean;
  onReady: () => void;
  onSlow: (stage: "degrade" | "fail") => void;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const size = useThree((s) => s.size);

  const sky = useRef<THREE.ShaderMaterial>(null);
  const horizon = useRef<THREE.Mesh>(null);
  const horizonMat = useRef<THREE.MeshBasicMaterial>(null);
  const sun = useRef<THREE.Group>(null);
  const sunMat = useRef<THREE.MeshBasicMaterial>(null);
  const sunGlowMat = useRef<THREE.MeshBasicMaterial>(null);
  const lampRoot = useRef<THREE.Group>(null);
  const lampTilt = useRef<THREE.Group>(null);
  const diffuserMat = useRef<THREE.MeshStandardMaterial>(null);
  const dotMat = useRef<THREE.MeshStandardMaterial>(null);
  const stand = useRef<THREE.Mesh>(null);
  const standMat = useRef<THREE.MeshStandardMaterial>(null);
  const halo = useRef<THREE.Mesh>(null);
  const haloMat = useRef<THREE.MeshBasicMaterial>(null);
  const spill = useRef<THREE.Mesh>(null);
  const spillMat = useRef<THREE.MeshBasicMaterial>(null);

  const glowTex = useMemo(
    () => radialTexture(["#ffffff", "#fff4d6", "rgba(255,231,168,0.35)", "rgba(255,231,168,0)"]),
    [],
  );
  const haloTex = useMemo(
    () =>
      radialTexture(["rgba(255,251,238,1)", "rgba(255,226,160,0.6)", "rgba(255,214,130,0.18)", "rgba(255,214,130,0)"]),
    [],
  );
  const panelTex = useMemo(() => radialTexture(["#ffffff", "#fffbf0", "#fff0cc", "#ffe4a6"], [0.5, 0.48], 0.72), []);
  const clipPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  // Re-render only when the story moves (demand frameloop).
  useEffect(() => progress.on("change", () => invalidate()), [progress, invalidate]);
  useEffect(() => invalidate(), [size, invalidate]);

  const ready = useRef(false);
  const samples = useRef<number[]>([]);
  const degraded = useRef(false);

  useFrame((state, delta) => {
    const L = layout.current;
    const p = progress.get();
    const visH = 2 * CAM_Z * Math.tan(deg(FOV / 2));
    const wpp = visH / size.height; // world units per CSS px
    const toX = (px: number) => (px - size.width / 2) * wpp;
    const toY = (px: number) => (size.height / 2 - px) * wpp;

    const panelH = L.panelH * wpp;
    const panelW = panelH * 0.75;
    const ax = toX(L.lampX);
    const ay = toY(L.horizonY);

    /* Sky */
    if (sky.current) {
      sky.current.uniforms.uDawn.value = skyDawn(p);
      sky.current.uniforms.uSunrise.value = skySunrise(p);
      sky.current.uniforms.uPaper.value = skyPaper(p);
    }

    /* Horizon → lamp edge */
    if (horizon.current && horizonMat.current) {
      const span = horizonSpan(p);
      const left = lerp(L.lampX - L.panelH * 0.375, 0, span);
      const right = lerp(L.lampX + L.panelH * 0.375, size.width, span);
      const thickPx = lerp(1.4, L.panelH * DEPTH, smooth(range(p, 0.47, 0.53)));
      horizon.current.position.set(toX((left + right) / 2), ay, 0.05);
      horizon.current.scale.set((right - left) * wpp, thickPx * wpp, 1);
      // Hands over to the real panel edge, which is visible edge-on from 0.52.
      horizonMat.current.opacity = horizonGlow(p) * (1 - range(p, 0.52, 0.545));
      horizon.current.visible = horizonMat.current.opacity > 0.002;
    }

    /* Sun */
    if (sun.current && sunMat.current && sunGlowMat.current) {
      const d = L.panelH * 0.32;
      const centerPx = L.horizonY - d / 2 + sunOffset(p) * d;
      sun.current.position.set(ax, toY(centerPx), 0.3);
      sun.current.scale.setScalar(d * wpp * sunScale(p));
      const o = sunOpacity(p);
      sunMat.current.opacity = o;
      sunGlowMat.current.opacity = o * 0.9;
      sun.current.visible = o > 0.002;
      clipPlane.current.constant = -ay;
      const planes = sunClipped(p) ? [clipPlane.current] : null;
      sunMat.current.clippingPlanes = planes;
      sunGlowMat.current.clippingPlanes = planes;
    }

    /* Lamp */
    const t = settle(p);
    if (lampRoot.current && lampTilt.current) {
      lampRoot.current.position.set(ax + panelW * L.s5ShiftN * t, ay, 0);
      lampRoot.current.scale.setScalar(panelH * lerp(1, L.s5Scale, t));
      lampRoot.current.visible = p >= 0.52;
      // The camera sits above the lamp, so "edge-on" needs a few extra degrees to hide the face.
      const open = lampOpen(p);
      const viewTilt = THREE.MathUtils.radToDeg(Math.atan2(Math.abs(ay), CAM_Z));
      lampTilt.current.rotation.set(-deg(open + viewTilt * (open / 90)), deg(lampTurn(p)), 0, "YXZ");
    }
    if (diffuserMat.current) diffuserMat.current.emissiveIntensity = lerp(0.14, 1.45, panelGlow(p));
    if (dotMat.current) dotMat.current.emissiveIntensity = 2.5 * range(p, 0.66, 0.7);
    if (stand.current && standMat.current) {
      standMat.current.opacity = standVisible(p);
      stand.current.visible = standMat.current.opacity > 0.01;
    }

    /* Halo + spill */
    if (halo.current && haloMat.current) {
      halo.current.position.set(ax + panelW * L.s5ShiftN * t, ay, -0.4);
      halo.current.scale.set(panelW * 4.6 * lerp(1, L.s5Scale, t), panelH * 3.6 * lerp(1, L.s5Scale, t), 1);
      haloMat.current.opacity = panelHalo(p) * 0.9;
      halo.current.visible = haloMat.current.opacity > 0.002;
    }
    if (spill.current && spillMat.current) {
      const s = Math.max(size.width, size.height) * 2.3 * wpp * spillScale(p);
      spill.current.position.set(ax, ay, -1);
      spill.current.scale.set(s, s, 1);
      spillMat.current.opacity = spillOpacity(p);
      spill.current.visible = spillMat.current.opacity > 0.002;
    }

    /* Readiness + frame-budget governor */
    if (!ready.current) {
      ready.current = true;
      requestAnimationFrame(onReady);
    }
    if (delta > 0 && delta < 0.1) {
      samples.current.push(delta);
      if (samples.current.length > 45) samples.current.shift();
    }
    if (!probing && samples.current.length >= 45) {
      const avg = samples.current.reduce((a, b) => a + b, 0) / samples.current.length;
      if (avg > 1 / 42) {
        samples.current = [];
        if (!degraded.current) {
          degraded.current = true;
          onSlow("degrade");
        } else onSlow("fail");
      }
    }
    void state;
  });

  // During the opening probe, a clearly slow device goes straight back to 2D.
  useEffect(() => {
    if (probing) return;
    const s = samples.current;
    if (s.length > 20) {
      const sorted = [...s].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      if (median > 1 / 40) onSlow("fail");
    }
    samples.current = [];
  }, [probing, onSlow]);

  return (
    <>
      {/* Sky: the same stacked gradients as the 2D layer, crossfaded in a shader */}
      <mesh frustumCulled={false} renderOrder={-10}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={sky}
          depthTest={false}
          depthWrite={false}
          uniforms={{ uDawn: { value: 0 }, uSunrise: { value: 0 }, uPaper: { value: 0 } }}
          vertexShader={SKY_VERT}
          fragmentShader={SKY_FRAG}
        />
      </mesh>

      <ambientLight intensity={1.5} color="#fff8ee" />
      <directionalLight position={[-3, 4, 6]} intensity={1.5} color="#fffaf2" />
      <directionalLight position={[4, -1, 3]} intensity={0.35} color="#ffe9c9" />

      {/* Light spill */}
      <mesh ref={spill} renderOrder={-5}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial ref={spillMat} map={glowTex} transparent depthWrite={false} opacity={0} />
      </mesh>

      {/* Halo behind the lit panel */}
      <mesh ref={halo} renderOrder={-4}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial ref={haloMat} map={haloTex} transparent depthWrite={false} opacity={0} />
      </mesh>

      {/* Horizon line */}
      <mesh ref={horizon}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial ref={horizonMat} color={new THREE.Color(1.6, 1.55, 1.42)} transparent depthWrite={false} />
      </mesh>

      {/* Lamp: modelled at unit height, scaled to --panel-h */}
      <group ref={lampRoot} visible={false}>
        <group ref={lampTilt}>
          <RoundedBox args={[0.75, 1, DEPTH]} radius={0.012} smoothness={4}>
            <meshStandardMaterial
              color="#f4ede2"
              roughness={0.5}
              metalness={0}
              emissive="#fff6ea"
              emissiveIntensity={0.12}
            />
          </RoundedBox>
          {/* Frosted diffuser */}
          <RoundedBox args={[0.67, 0.91, 0.004]} radius={0.0018} smoothness={2} position={[0, 0, DEPTH / 2 + 0.0005]}>
            <meshStandardMaterial
              ref={diffuserMat}
              color="#f7f3ec"
              roughness={0.92}
              emissive="#ffffff"
              emissiveMap={panelTex}
              emissiveIntensity={0.14}
            />
          </RoundedBox>
          {/* Power dot on the right edge */}
          <mesh position={[0.375 + 0.0006, 0.3, 0]} rotation={[0, Math.PI / 2, 0]}>
            <circleGeometry args={[0.006, 20]} />
            <meshStandardMaterial ref={dotMat} color="#e8962e" emissive="#ffc857" emissiveIntensity={0} />
          </mesh>
          {/* Slim kickstand */}
          <mesh ref={stand} position={[0, -0.2, -DEPTH / 2 - 0.09]} rotation={[deg(-16), 0, 0]}>
            <boxGeometry args={[0.05, 0.5, 0.012]} />
            <meshStandardMaterial ref={standMat} color="#e2d9ca" roughness={0.6} transparent opacity={0} />
          </mesh>
        </group>
      </group>

      {/* Sun */}
      <group ref={sun} visible={false}>
        <mesh position={[0, 0, -0.01]} scale={4.6}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial ref={sunGlowMat} map={glowTex} transparent depthWrite={false} opacity={0} />
        </mesh>
        <mesh>
          <circleGeometry args={[0.5, 64]} />
          <meshBasicMaterial ref={sunMat} color={new THREE.Color(1.5, 1.42, 1.22)} transparent opacity={0} />
        </mesh>
      </group>
    </>
  );
}

/* ------------------------------------------------------------------------------------------ */

/** Radial gradient texture. `reach` is the gradient radius as a fraction of the texture size;
 *  keep it ≤ 0.5 for sprites so the gradient is fully transparent before the quad's edges. */
function radialTexture(stops: [string, string, string, string], center: [number, number] = [0.5, 0.5], reach = 0.5) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const [cx, cy] = [center[0] * size, center[1] * size];
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * reach);
  g.addColorStop(0, stops[0]);
  g.addColorStop(0.38, stops[1]);
  g.addColorStop(0.65, stops[2]);
  g.addColorStop(1, stops[3]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const SKY_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.9999, 1.0);
  }
`;

// Colours are the CSS gradient stops (sRGB), converted to linear before output so the
// pipeline's colour-space handling lands them exactly where the 2D layer has them.
const SKY_FRAG = /* glsl */ `
  uniform float uDawn;
  uniform float uSunrise;
  uniform float uPaper;
  varying vec2 vUv;

  vec3 hex(float r, float g, float b) { return vec3(r, g, b) / 255.0; }

  vec3 grad4(float t, vec3 c0, float p0, vec3 c1, float p1, vec3 c2, float p2, vec3 c3, float p3) {
    if (t <= p1) return mix(c0, c1, smoothstep(p0, p1, t));
    if (t <= p2) return mix(c1, c2, smoothstep(p1, p2, t));
    return mix(c2, c3, smoothstep(p2, p3, t));
  }

  vec3 toLinear(vec3 c) {
    return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
  }

  void main() {
    float t = 1.0 - vUv.y; // 0 at the top, like the CSS gradients
    vec3 base = grad4(t, hex(223.,232.,238.), 0.0, hex(230.,238.,243.), 0.55, hex(234.,240.,242.), 0.8, hex(238.,241.,241.), 1.0);
    vec3 dawn = grad4(t, hex(233.,236.,239.), 0.0, hex(243.,225.,219.), 0.48, hex(246.,217.,207.), 0.66, hex(251.,227.,196.), 1.0);
    vec3 rise = grad4(t, hex(251.,238.,230.), 0.0, hex(253.,230.,201.), 0.45, hex(255.,231.,168.), 0.7, hex(255.,244.,214.), 1.0);
    vec3 paper = hex(251.,248.,243.);
    vec3 col = mix(base, dawn, uDawn);
    col = mix(col, rise, uSunrise);
    col = mix(col, paper, uPaper);
    gl_FragColor = vec4(toLinear(col), 1.0);
    #include <colorspace_fragment>
  }
`;
