"use client";

/**
 * Procedural model of the 10,000-lux lamp, built in code (no model files), in real-world metres.
 *
 * Origin: floor level, centre of the base. +Y is up, the panel faces +Z (towards the user).
 * Overall height ≈ 0.57 m at the default 24° tilt.
 *
 * The diffuser is emissive (drives bloom) and carries a RectAreaLight the size of the light-emitting
 * area, so the lamp genuinely lights the desk, the base and anything placed in front of it.
 */

import { RoundedBox } from "@react-three/drei";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/* ------------------------------------------------------------------------------------------ */
/* Dimensions (metres)                                                                        */
/* ------------------------------------------------------------------------------------------ */

export const LAMP = {
  base: { w: 0.22, d: 0.2, t: 0.016, r: 0.032 },
  column: { w: 0.05, d: 0.06, h: 0.14, z: -0.05 },
  panel: { w: 0.38, h: 0.29, d: 0.042, r: 0.034, bezel: 0.0115 },
  /** Hinge (top of the collar) in lamp space. The panel rotates about X through this point. */
  hinge: new THREE.Vector3(0, 0.37, -0.056),
  /** Panel centre and face plane, in the hinge's local frame (before tilt). */
  panelCenterY: 0.1,
  panelBackZ: 0.014,
  armRadius: 0.0105,
} as const;

const PANEL_FACE_Z = LAMP.panelBackZ + LAMP.panel.d;
const DIFFUSER_W = LAMP.panel.w - 2 * LAMP.panel.bezel;
const DIFFUSER_H = LAMP.panel.h - 2 * LAMP.panel.bezel;
const COLUMN_TOP = LAMP.base.t + LAMP.column.h;
const COLUMN_FRONT_Z = LAMP.column.z + LAMP.column.d / 2;

/** Useful world-space anchors (lamp space) for cameras and lights, for a given tilt in degrees. */
export function lampAnchors(tilt = 24) {
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(tilt));
  const toWorld = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).applyQuaternion(q).add(LAMP.hinge);
  const panelCenter = toWorld(0, LAMP.panelCenterY, PANEL_FACE_Z);
  const panelNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
  return {
    panelCenter,
    panelNormal,
    /** Top-right corner of the panel face (viewer's left when facing the lamp). */
    panelCorner: toWorld(LAMP.panel.w / 2, LAMP.panelCenterY + LAMP.panel.h / 2, PANEL_FACE_Z),
    panelTop: toWorld(0, LAMP.panelCenterY + LAMP.panel.h / 2, LAMP.panelBackZ),
    dial: new THREE.Vector3(0, LAMP.base.t + 0.085, COLUMN_FRONT_Z),
    columnTop: new THREE.Vector3(0, COLUMN_TOP, LAMP.column.z),
    armMid: armCurve().getPointAt(0.5),
    baseCenter: new THREE.Vector3(0, LAMP.base.t / 2, 0),
    height: toWorld(0, LAMP.panelCenterY + LAMP.panel.h / 2, LAMP.panelBackZ).y,
  };
}

/* ------------------------------------------------------------------------------------------ */
/* Colour temperature                                                                         */
/* ------------------------------------------------------------------------------------------ */

/** Black-body approximation (Tanner Helland), returned as an sRGB-authored THREE.Color. */
export function kelvinToColor(kelvin: number, target = new THREE.Color()) {
  const t = THREE.MathUtils.clamp(kelvin, 1000, 40000) / 100;
  const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const c = (v: number) => THREE.MathUtils.clamp(v, 0, 255) / 255;
  return target.setRGB(c(r), c(g), c(b), THREE.SRGBColorSpace);
}

/* ------------------------------------------------------------------------------------------ */
/* Geometry helpers                                                                           */
/* ------------------------------------------------------------------------------------------ */

function roundedRectShape(w: number, h: number, r: number, seg = 14) {
  // Explicit, duplicate-free outline with true circular corners: bevelled extrusions stay clean.
  const pts: THREE.Vector2[] = [];
  const corners: [number, number, number][] = [
    [w / 2 - r, -h / 2 + r, -Math.PI / 2],
    [w / 2 - r, h / 2 - r, 0],
    [-w / 2 + r, h / 2 - r, Math.PI / 2],
    [-w / 2 + r, -h / 2 + r, Math.PI],
  ];
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (i / seg) * (Math.PI / 2);
      pts.push(new THREE.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
    }
  }
  return new THREE.Shape(pts);
}

/** A rounded-rect slab, extruded along +Z from `z0` to `z0 + depth`, with a soft edge bevel. */
function roundedSlab(w: number, h: number, depth: number, r: number, bevel: number, z0 = 0) {
  const shape = roundedRectShape(w - 2 * bevel, h - 2 * bevel, Math.max(0.001, r - bevel));
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: depth - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 8,
    curveSegments: 28,
  });
  g.translate(0, 0, z0 + bevel);
  // ExtrudeGeometry is non-indexed (flat facets). The slab is bevelled all round, so weld it and
  // use area-weighted smooth normals (avoids corner artefacts from the fan-triangulated caps).
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  const welded = mergeVertices(g, 1e-6);
  g.dispose();
  welded.computeVertexNormals();
  return welded;
}

/** ShapeGeometry with UVs remapped to 0–1 over its bounding box. */
function shapeWithUnitUVs(shape: THREE.Shape, segments = 24) {
  const g = new THREE.ShapeGeometry(shape, segments);
  g.computeBoundingBox();
  const bb = g.boundingBox!;
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
  }
  uv.needsUpdate = true;
  return g;
}

/** Diffuser emission map: even, a touch brighter in the centre, gently softer at the very edge. */
function diffuserTexture() {
  const W = 320;
  const H = 244;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(W, H);
  const smooth = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const u = (i + 0.5) / W;
      const v = (j + 0.5) / H;
      const dx = (u - 0.5) * 2;
      const dy = (v - 0.5) * 2 * 0.92;
      const r = Math.sqrt(dx * dx + dy * dy);
      const edge = Math.min(u, 1 - u, (v * H) / W, ((1 - v) * H) / W);
      let k = 1 - 0.2 * smooth(0.05, 1.25, r);
      k *= 0.86 + 0.14 * smooth(0, 0.045, edge);
      // Tiny per-pixel dither keeps the 8-bit gradient from banding once bloomed.
      const val = Math.round(THREE.MathUtils.clamp(k * 255 + (Math.random() - 0.5) * 1.5, 0, 255));
      const o = (j * W + i) * 4;
      img.data[o] = val;
      img.data[o + 1] = val;
      img.data[o + 2] = val;
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** A knurled ring for the dial: cylinder with alternating radial ridges. */
function knurledCylinder(radius: number, height: number, ridges = 60) {
  const g = new THREE.CylinderGeometry(radius, radius, height, ridges * 2, 1, false);
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const a = Math.atan2(v.z, v.x);
    const rr = Math.hypot(v.x, v.z);
    if (rr > radius * 0.98) {
      const k = Math.round(((a + Math.PI) / (2 * Math.PI)) * ridges * 2) % 2 === 0 ? 1 : 0.965;
      pos.setXYZ(i, Math.cos(a) * radius * k, v.y, Math.sin(a) * radius * k);
    }
  }
  g.computeVertexNormals();
  return g;
}

/** The gooseneck's centre line, column top → collar. */
function armCurve() {
  return new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, COLUMN_TOP - 0.004, LAMP.column.z - 0.004),
      new THREE.Vector3(0, 0.2, LAMP.column.z - 0.018),
      new THREE.Vector3(0, 0.255, LAMP.column.z - 0.036),
      new THREE.Vector3(0, 0.305, LAMP.column.z - 0.032),
      new THREE.Vector3(0, LAMP.hinge.y - 0.034, LAMP.hinge.z),
    ],
    false,
    "centripetal",
  );
}

let rectAreaReady = false;
function ensureRectAreaLights() {
  if (rectAreaReady) return;
  RectAreaLightUniformsLib.init();
  rectAreaReady = true;
}

/* ------------------------------------------------------------------------------------------ */
/* Component                                                                                  */
/* ------------------------------------------------------------------------------------------ */

export type LampModelProps = Omit<ThreeElements["group"], "ref"> & {
  /** 0–1: diffuser emission and the strength of the light it casts. */
  power?: number;
  /**
   * Optional live power source (e.g. a motion MotionValue). When given it overrides `power` and is
   * read every frame, so scroll-driven changes never re-render React. The host must invalidate()
   * the canvas when it changes if the frameloop is "demand".
   */
  powerSource?: { get(): number };
  /** Panel tilt in degrees (top towards the user). */
  tilt?: number;
  /** Colour temperature of the light, 2700–6500 K. */
  kelvin?: number;
  /** Peak luminance of the panel's RectAreaLight at power 1 (scene-dependent). */
  lightIntensity?: number;
  /** Peak emissive intensity of the diffuser at power 1 (> 1 feeds bloom). */
  glow?: number;
  /** Cast and receive shadow-map shadows. */
  shadows?: boolean;
};

export default function LampModel({
  power = 1,
  powerSource,
  tilt = 24,
  kelvin = 6000,
  lightIntensity = 20,
  glow = 1.7,
  shadows = false,
  ...group
}: LampModelProps) {
  ensureRectAreaLights();

  const lightColor = useMemo(() => kelvinToColor(kelvin), [kelvin]);

  const geo = useMemo(() => {
    const { base, panel } = LAMP;

    // Base plate: rounded square slab lying flat.
    const basePlate = roundedSlab(base.w, base.d, base.t, base.r, 0.0045);
    basePlate.rotateX(-Math.PI / 2); // extrusion +Z → +Y; shape Y → −Z
    // After the rotation the slab spans y ∈ [0, t].

    // Panel shell, front face at z = 0 (before offset).
    const shell = roundedSlab(panel.w, panel.h, panel.d, panel.r, 0.0085, -panel.d);
    // Rear housing: a shallower, smaller tray that gives the back its tapered, moulded depth.
    const rear = roundedSlab(panel.w * 0.86, panel.h * 0.8, 0.024, 0.06, 0.0115, -panel.d - 0.016);

    const diffShape = roundedRectShape(DIFFUSER_W, DIFFUSER_H, panel.r - panel.bezel * 0.75);
    const diffuser = shapeWithUnitUVs(diffShape, 24);

    // Dark shadow-gap between bezel and diffuser.
    const gapOuter = roundedRectShape(DIFFUSER_W + 0.005, DIFFUSER_H + 0.005, panel.r - panel.bezel * 0.75 + 0.0025);
    gapOuter.holes.push(roundedRectShape(DIFFUSER_W - 0.0004, DIFFUSER_H - 0.0004, panel.r - panel.bezel * 0.75));
    const gap = new THREE.ShapeGeometry(gapOuter, 24);

    // Mould seam around the shell's side.
    const seamPts = roundedRectShape(panel.w + 0.0004, panel.h + 0.0004, panel.r)
      .getSpacedPoints(320)
      .map((p) => new THREE.Vector3(p.x, p.y, -panel.d * 0.42));
    seamPts.pop();
    const seam = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(seamPts, true), 640, 0.00055, 8, true);

    // Gooseneck: a gentle C that bows towards the back, column top → collar.
    const curve = armCurve();
    const armEnd = curve.getPointAt(1);
    const arm = new THREE.TubeGeometry(curve, 120, LAMP.armRadius, 28, false);
    const armTangent = curve.getTangentAt(1);

    const knurl = knurledCylinder(0.0128, 0.0075, 48);

    return { basePlate, shell, rear, diffuser, gap, seam, arm, armEnd, armTangent, knurl };
  }, []);

  const emissiveMap = useMemo(() => diffuserTexture(), []);

  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => g instanceof THREE.BufferGeometry && g.dispose());
      emissiveMap.dispose();
    },
    [geo, emissiveMap],
  );

  const diffuserMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const ledMat = useRef<THREE.MeshStandardMaterial>(null);
  const rectLight = useRef<THREE.RectAreaLight>(null);
  useFrame(() => {
    if (!powerSource) return;
    const v = THREE.MathUtils.clamp(powerSource.get(), 0, 1);
    if (diffuserMat.current) diffuserMat.current.emissiveIntensity = v * glow;
    if (ledMat.current) ledMat.current.emissiveIntensity = v * 1.6;
    if (rectLight.current) rectLight.current.intensity = v * lightIntensity;
  });

  const p = THREE.MathUtils.clamp(powerSource ? powerSource.get() : power, 0, 1);
  const { base, column, hinge } = LAMP;

  // Collar orientation: aligned with the end of the gooseneck.
  const collarQuat = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), geo.armTangent),
    [geo.armTangent],
  );
  const collarLen = 0.04;
  const collarPos = geo.armEnd.clone().addScaledVector(geo.armTangent, collarLen / 2 - 0.004);

  const shell = (
    <meshPhysicalMaterial
      color="#f2f1ec"
      roughness={0.34}
      clearcoat={0.85}
      clearcoatRoughness={0.14}
      specularIntensity={0.6}
    />
  );
  const shellMatte = <meshPhysicalMaterial color="#ecebe6" roughness={0.5} clearcoat={0.3} clearcoatRoughness={0.3} />;
  const chrome = <meshPhysicalMaterial color="#eef0f3" metalness={1} roughness={0.2} />;
  const brushed = <meshPhysicalMaterial color="#d6d8dc" metalness={1} roughness={0.3} anisotropy={0.75} />;
  const sh = { castShadow: shadows, receiveShadow: shadows };

  return (
    <group {...group}>
      {/* Base plate */}
      <mesh geometry={geo.basePlate} {...sh}>
        {shell}
      </mesh>
      {/* Soft rubber foot line just under the base so it doesn't float on light floors. */}
      <mesh position={[0, 0.0012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[base.w - 0.012, base.d - 0.012]} />
        <meshStandardMaterial color="#3a3836" roughness={0.9} />
      </mesh>

      {/* Column */}
      <RoundedBox
        args={[column.w, column.h, column.d]}
        radius={0.012}
        smoothness={6}
        position={[0, base.t + column.h / 2, column.z]}
        {...sh}
      >
        {shell}
      </RoundedBox>
      {/* Column cap where the gooseneck enters */}
      <mesh position={[0, COLUMN_TOP - 0.001, column.z - 0.004]} {...sh}>
        <cylinderGeometry args={[0.0165, 0.0185, 0.014, 40]} />
        {shellMatte}
      </mesh>

      {/* Front dial: dark recess, knurled aluminium ring, brushed face, indicator. */}
      <group position={[0, base.t + 0.085, COLUMN_FRONT_Z]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.0002]}>
          <cylinderGeometry args={[0.0152, 0.0152, 0.0012, 48]} />
          <meshStandardMaterial color="#2b2926" roughness={0.6} />
        </mesh>
        <mesh geometry={geo.knurl} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.004]} {...sh}>
          {chrome}
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.0078]}>
          <cylinderGeometry args={[0.0112, 0.0118, 0.0006, 48]} />
          <meshPhysicalMaterial color="#dfe2e6" metalness={1} roughness={0.34} anisotropy={0.6} />
        </mesh>
        <mesh position={[0, 0.0066, 0.0083]}>
          <boxGeometry args={[0.0013, 0.0052, 0.0006]} />
          <meshStandardMaterial color="#3a3835" roughness={0.5} />
        </mesh>
        {/* Status LED, below the dial */}
        <mesh position={[0, -0.024, 0.0004]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.0008, 0.0008, 0.0012, 16]} />
          <meshStandardMaterial ref={ledMat} color="#222" emissive={lightColor} emissiveIntensity={p * 1.6} roughness={0.3} />
        </mesh>
      </group>

      {/* Side knob (left side of the column) */}
      <group position={[-column.w / 2, base.t + column.h - 0.026, column.z + 0.008]}>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.004, 0, 0]} {...sh}>
          <cylinderGeometry args={[0.0062, 0.0068, 0.008, 32]} />
          {chrome}
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.0082, 0, 0]}>
          <sphereGeometry args={[0.0062, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          {chrome}
        </mesh>
      </group>

      {/* Gooseneck */}
      <mesh geometry={geo.arm} {...sh}>
        {brushed}
      </mesh>
      {/* Collar at the top of the gooseneck */}
      <mesh position={collarPos} quaternion={collarQuat} {...sh}>
        <cylinderGeometry args={[0.0148, 0.0142, collarLen, 40]} />
        {shell}
      </mesh>

      {/* Panel, hinged */}
      <group position={hinge} rotation={[THREE.MathUtils.degToRad(tilt), 0, 0]}>
        {/* Hinge boss on the back of the panel */}
        <RoundedBox args={[0.074, 0.06, 0.034]} radius={0.012} smoothness={5} position={[0, 0.006, 0.006]} {...sh}>
          {shell}
        </RoundedBox>

        <group position={[0, LAMP.panelCenterY, PANEL_FACE_Z]}>
          <mesh geometry={geo.shell} {...sh}>
            {shell}
          </mesh>
          <mesh geometry={geo.rear} {...sh}>
            {shell}
          </mesh>
          <mesh geometry={geo.seam}>
            <meshStandardMaterial color="#b9b6ae" roughness={0.6} />
          </mesh>
          <mesh geometry={geo.gap} position={[0, 0, 0.0004]}>
            <meshStandardMaterial color="#5d5a55" roughness={0.8} />
          </mesh>
          <mesh geometry={geo.diffuser} position={[0, 0, 0.0009]}>
            <meshPhysicalMaterial
              ref={diffuserMat}
              color="#f7f5f0"
              roughness={0.62}
              emissive={lightColor}
              emissiveMap={emissiveMap}
              emissiveIntensity={p * glow}
              toneMapped
            />
          </mesh>
          {/* Always mounted (intensity 0 when off) so switching on never recompiles shaders. */}
          <rectAreaLight
            ref={rectLight}
            args={[lightColor, p * lightIntensity, DIFFUSER_W, DIFFUSER_H]}
            color={lightColor}
            intensity={p * lightIntensity}
            width={DIFFUSER_W}
            height={DIFFUSER_H}
            position={[0, 0, 0.003]}
            rotation={[0, Math.PI, 0]}
          />
        </group>
      </group>
    </group>
  );
}

/** Panel dimensions of the light-emitting area, for scenes that want to add matching lights. */
export const DIFFUSER = { w: DIFFUSER_W, h: DIFFUSER_H, faceZ: PANEL_FACE_Z } as const;
