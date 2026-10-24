#!/usr/bin/env node
/**
 * Render the lamp "product photography" stills to public/renders/<id>.jpg.
 *
 * The stills come from the procedural 3D lamp (components/lamp/LampModel.tsx), staged per shot in
 * the dev-only route app/lab/renders (RenderStage.tsx). This script opens each shot in headless
 * Chrome with the GPU enabled, waits for `[data-ready="1"]`, and saves a JPEG.
 *
 * Re-run (from frontend/, with the dev server running, e.g. `npm run dev`):
 *
 *   node scripts/render-stills.mjs                     # all shots, against http://localhost:3000
 *   node scripts/render-stills.mjs hero-desktop og     # only some shots
 *   BASE_URL=http://localhost:3100 node scripts/render-stills.mjs
 *
 * Shot sizes below must match SHOTS in app/lab/renders/RenderStage.tsx (the page itself does not
 * care about the size; it frames each shot for whatever viewport it gets).
 *
 * Dependencies: playwright-core is not a project dependency. The script uses it if it resolves;
 * otherwise set PLAYWRIGHT_CORE_DIR to a folder whose node_modules contains it, or let the script
 * install it once into the OS temp dir. Browser: installed Google Chrome (channel "chrome"), or
 * set CHROME_PATH to any Chromium binary (e.g. ~/Library/Caches/ms-playwright/chromium-1194/...).
 *
 * Output: the viewport is half the target size at deviceScaleFactor 2, so the canvas renders at
 * the full target resolution. JPEG quality starts at 90 and steps down only if a file would exceed
 * MAX_KB (next/image re-encodes them anyway).
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SHOTS = [
  { id: "hero-desktop", w: 1920, h: 1200 },
  { id: "hero-mobile", w: 1080, h: 1600 },
  { id: "og", w: 1200, h: 630 },
  { id: "desk-dawn", w: 1600, h: 1200 },
  { id: "front-studio", w: 1600, h: 1600 },
  { id: "profile", w: 1200, h: 1600 },
  { id: "switch-off", w: 1080, h: 1440 },
  { id: "switch-on", w: 1080, h: 1440 },
  { id: "anatomy", w: 1600, h: 1200 },
  { id: "detail-dial", w: 1600, h: 1200 },
  { id: "detail-panel", w: 1600, h: 1200 },
];

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const MAX_KB = Number(process.env.MAX_KB ?? 450);
const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "../public/renders");

async function loadPlaywright() {
  try {
    return await import("playwright-core");
  } catch {
    /* fall through */
  }
  const dirs = [process.env.PLAYWRIGHT_CORE_DIR, path.join(os.tmpdir(), "luxlight-render-deps")].filter(Boolean);
  for (const dir of dirs) {
    try {
      return createRequire(path.join(dir, "noop.js"))("playwright-core");
    } catch {
      /* try next */
    }
  }
  const dir = path.join(os.tmpdir(), "luxlight-render-deps");
  console.log(`Installing playwright-core into ${dir} …`);
  mkdirSync(dir, { recursive: true });
  if (!existsSync(path.join(dir, "package.json"))) writeFileSync(path.join(dir, "package.json"), "{}");
  execSync("npm i --silent --no-audit --no-fund playwright-core@1.56.1", { cwd: dir, stdio: "inherit" });
  return createRequire(path.join(dir, "noop.js"))("playwright-core");
}

const { chromium } = await loadPlaywright();

const only = process.argv.slice(2);
const shots = only.length ? SHOTS.filter((s) => only.includes(s.id)) : SHOTS;
if (!shots.length) {
  console.error(`No matching shots. Known: ${SHOTS.map((s) => s.id).join(", ")}`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }),
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-webgl", "--disable-gpu-sandbox"],
});

let failed = 0;
for (const shot of shots) {
  const context = await browser.newContext({
    viewport: { width: shot.w / 2, height: shot.h / 2 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.error(`  [${shot.id}] page error:`, e.message));
  page.on("console", (m) => {
    if (m.type() === "error") console.error(`  [${shot.id}] console:`, m.text());
  });
  const t0 = Date.now();
  try {
    await page.goto(`${BASE_URL}/lab/renders?shot=${shot.id}`, { waitUntil: "load", timeout: 120_000 });
    await page.waitForSelector('[data-ready="1"]', { timeout: 120_000 });
    // Hide the Next.js dev-tools badge.
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
    await page.waitForTimeout(300);
    const anchors = await page.getAttribute("[data-shot]", "data-anchors");
    if (anchors) console.log(`  ${shot.id} anchors (% of width, % of height): ${anchors}`);
    const file = path.join(outDir, `${shot.id}.jpg`);
    let quality = 90;
    for (;;) {
      await page.screenshot({ path: file, type: "jpeg", quality, scale: "device" });
      const kb = statSync(file).size / 1024;
      if (kb <= MAX_KB || quality <= 70) {
        console.log(`✓ ${shot.id}  ${shot.w}×${shot.h}  q${quality}  ${kb.toFixed(0)} KB  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
        break;
      }
      quality -= 4;
    }
  } catch (e) {
    failed++;
    console.error(`✗ ${shot.id}: ${e.message}`);
  }
  await context.close();
}

await browser.close();
process.exit(failed ? 1 : 0);
