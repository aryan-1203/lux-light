# DESIGN.md — Pre-launch site for a 10,000 lux lamp (India)

Status: **draft for approval** · Owner: design engineering · Last updated: 2026-10-18

The source of truth for how the site looks, reads and moves. Code tokens live in
`frontend/styles/tokens.css` (CSS) and `frontend/lib/motion.ts` (motion); both must match this file.

Inputs used: the project brief; `ui-ux-pro-max` (design system: *Scroll-Triggered Storytelling*
pattern, minimal/Swiss style, spacious density; landing pattern *Waitlist / Coming Soon*;
UX rules for forms, progress and contrast; Next.js and three.js stack rules);
`emil-design-eng` / `apple-design` (motion, easing, interaction craft); Apple HIG thinking for
hierarchy and restraint. The reference sites were used for pacing and structure only, see §12.
Where ui-ux-pro-max suggested Cormorant/Montserrat and a black-and-gold palette, the brief's
fonts and palette win. Those suggestions are recorded here only so nobody re-litigates them.

---

## 1. Principles

1. **Light is the hero.** Every visual idea is about light arriving: cool to warm, dim to
   bright, a horizon turning into an object. If a section does not serve that idea, it is quiet.
2. **Restraint over decoration.** One idea per section, one accent per view, generous air.
   Hierarchy comes from size, then weight, then colour.
3. **Calm confidence.** Indian English, short sentences, never salesy. Wellness language only (§10).
4. **Motion explains or responds, nothing else.** If a motion is not guiding attention,
   explaining the product, or giving feedback, it is removed.
5. **Fast on a ₹15k Android over 4G.** Text paints first, the 3D layer arrives later, and
   nothing important depends on WebGL.

---

## 2. Colour

### 2.1 Tokens (from the brief, unchanged)

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#FBF8F3` | Page background |
| `--linen` | `#F4EEE4` | Cards, form surfaces, warm sections |
| `--ink` | `#1C1B19` | Primary text, primary button fill |
| `--ink-muted` | `#6B665E` | Secondary text |
| `--hairline` | `#E7E0D4` | 1px dividers and card borders (decorative only, never the sole affordance) |
| `--sun-50` | `#FFF8E6` | Tints, chip backgrounds |
| `--sun-200` | `#FFE7A8` | Sunrise sky end-stop, highlight wash |
| `--sun-400` | `#FFC857` | Accent fills (lamp panel, meter fill, selected chips) |
| `--sun-600` | `#E8962E` | Accent **graphics only** (icons ≥24px, rules, glyph); never text on light |
| `--dawn-rose` | `#F6D9CF` | Sunrise mid-stop |
| `--sky-mist` | `#E6EEF3` | Pre-dawn only (hero scene 1) |
| Glow | `radial-gradient(closest-side, #FFFFFF 0%, #FFF4D6 45%, transparent 100%)` | Light spill |

### 2.2 Proposed additions (functional, not new brand colours)

| Token | Hex | Why |
|---|---|---|
| `--sun-800` | `#9A5F12` | **Accessible accent text** (eyebrows, inline links on hover, price), 4.93:1 on paper. `sun-600` is only 2.24:1, so it cannot carry text. |
| `--danger` | `#B42318` | Form errors (≥4.5:1 on paper and linen) |
| `--success` | `#2F6B3E` | Success text |
| `--focus` | `--ink` | Focus ring: 2px ink outline, 2px offset in paper |

### 2.3 Contrast audit (WCAG 2.2 AA, computed)

| Pair | Ratio | Verdict |
|---|---|---|
| ink / paper | 16.25 | ✅ all text |
| ink-muted / paper | 5.38 | ✅ body |
| ink-muted / linen | 4.93 | ✅ body |
| ink-muted / sky-mist | 4.85 | ✅ body |
| ink-muted / sun-200 | 4.68 | ✅ body (tight, so don't go lighter) |
| **ink-muted / dawn-rose** | **4.27** | ⚠️ large text only. The sunrise scene uses `--ink` for small text. |
| ink / sun-400 | 11.19 | ✅ text on accent buttons/chips |
| paper / ink (primary button) | 16.25 | ✅ |
| sun-600 / paper | 2.24 | ❌ text. Graphics ≥3:1 only against dark; used decoratively here. |
| hairline / paper | 1.24 | Decorative. Inputs also get a 1px `#B9B0A2`-class border (≥3:1) for affordance. |

Rule: text that sits on the animated hero gradient is checked against the **worst** frame it
can appear over, not the best.

### 2.4 Surfaces

- 1px hairlines instead of shadows. Cards: `background: var(--linen); border: 1px solid var(--hairline)`.
- One shadow token only, `--lift`: `0 1px 0 var(--hairline), 0 12px 32px -12px rgb(28 27 25 / 0.12)`.
  Used on the floating WhatsApp button, the open mobile sheet and the nav once scrolled.
- **Grain:** a static inline SVG `feTurbulence` data URI on warm sections, `opacity: 0.035`,
  `mix-blend-mode: multiply`, `pointer-events: none`. Never animated.
- **Frosted glass:** nav bar only. `background: rgb(251 248 243 / 0.72); backdrop-filter: blur(16px) saturate(1.4)`,
  with a solid-paper fallback under `@supports not (backdrop-filter: blur(1px))`.
- No dark mode in v1 (`color-scheme: light`).

---

## 3. Typography

All fonts load through `next/font/google`: self-hosted, `display: 'swap'`, Latin subset (plus
Devanagari for Tiro only), with variable axes where available. Fallback metrics are adjusted
automatically to avoid CLS.

| Role | Family | Settings |
|---|---|---|
| Display / headlines | **Newsreader** (variable, `opsz` 6–72, wght 200–800, italic) | `font-optical-sizing: auto`, weight 400 for display, 500 for h3. *Italic* for one emotional accent word per headline ("Bring the *morning* indoors"). |
| UI / body | **Hanken Grotesk** (variable, wght 100–900) | 400 body, 500 UI labels, 600 buttons/emphasis. |
| Data / labels / lux | **IBM Plex Mono** (400, 500) | `font-variant-numeric: tabular-nums`; labels uppercase `+0.08em` tracking. |
| Accent (once) | **Tiro Devanagari Hindi** | Exactly one use: "सुप्रभात" in hero scene 2, with `lang="hi"`, size ≤ body-l, and `aria-hidden` paired with an English sr-only "Good morning". |

Banned: Inter, Roboto, Poppins, Montserrat, SF Pro.

### 3.1 Fluid scale (360 → 1440px viewport)

| Token | Size (`clamp`) | Line-height | Tracking | Family/weight |
|---|---|---|---|---|
| `display-xl` | `clamp(2.75rem, 1.55rem + 5.3vw, 6.25rem)` (44→100px) | 1.0 | -0.04em | Newsreader 400 |
| `display-l` | `clamp(2.25rem, 1.45rem + 3.5vw, 4.5rem)` (36→72) | 1.04 | -0.035em | Newsreader 400 |
| `display-m` (h2) | `clamp(1.875rem, 1.4rem + 2.1vw, 3.25rem)` (30→52) | 1.08 | -0.03em | Newsreader 400 |
| `heading` (h3) | `clamp(1.375rem, 1.2rem + 0.8vw, 1.875rem)` (22→30) | 1.2 | -0.02em | Newsreader 400 |
| `title` | `1.25rem` (20) | 1.3 | -0.01em | Hanken 600 |
| `body-l` | `clamp(1.125rem, 1.05rem + 0.35vw, 1.3125rem)` (18→21) | 1.55 | 0 | Hanken 400 |
| `body` | `1.0625rem` (17) | 1.55 | 0 | Hanken 400 |
| `small` | `0.9375rem` (15) | 1.5 | 0 | Hanken 400 |
| `label` | `0.75rem` (12) | 1.3 | +0.08em, uppercase | Plex Mono 500 |
| `numeral-xl` | `clamp(3.5rem, 2rem + 6.5vw, 8rem)` | 0.95 | -0.04em | Plex Mono 400, tabular |

Rules: body measure ≤ 65ch (`max-width: 65ch` on prose). Headlines get `text-wrap: balance`,
paragraphs get `text-wrap: pretty`. Minimum text size is 12px (labels only); inputs are ≥16px so iOS doesn't zoom.
Numbers in copy use the en-IN format (₹4,999 · 10,000 lux). Prices always come from config via
`Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })`.

---

## 4. Space, grid, radii

- **8pt grid.** Scale `--space-{1..12}`: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160, 200px (4 and 12 are half-steps for tight UI only).
- **Section rhythm:** `padding-block: clamp(96px, 12vw, 160px)`. Inside a section, heading → body 24px, body → CTA 32–48px.
- **Container:** `max-width: 1240px`. Gutters 16px (≤480), 24px (≤1024), 40px (above). Prose column 680px.
- **Grid:** 4 columns on mobile, 8 on tablet, 12 on desktop, with 16/24/32px gaps.
- **Breakpoints (QA widths):** 360, 390, 768, 1024, 1440, 1920. Mobile-first; no horizontal scroll at 360.
- **Radii:** `--r-sm 10px` (inputs, small chips) · `--r-md 16px` (buttons-as-cards, menus) · `--r-card clamp(20px, 2vw, 28px)` · `--r-pill 999px` (buttons, chips) · lamp panel radius proportional to its size (≈9% of the panel width).
- **Touch targets** ≥ 44×44px with 8px separation. Safe areas use `env(safe-area-inset-*)` on the nav, sheet and floating button.

---

## 5. Logo

- **Glyph:** a 3:4 rounded rectangle (lamp, stroke 1.5 units, radius ≈ 22% of width) with a
  filled circle (sun) centred slightly above the middle. A single-colour SVG using `currentColor`;
  the sun takes `--sun-400` in the colour variant.
- **Wordmark:** `brandName` from `site.config.ts`, set in Newsreader 500, `-0.02em`, optical size 24.
  Rendered as HTML text next to the SVG glyph (so it uses the real font and is accessible text),
  inside `<Logo />`. `<LogoGlyph />` is exported separately for the favicon (`app/icon.svg`),
  OG images and the 404 page.
- Clear space = the glyph's sun diameter on all sides. Minimum glyph size 16px.

---

## 6. Motion system

Implemented in `frontend/lib/motion.ts`. Every component imports from it, with no ad-hoc curves.

### 6.1 Curves

| Name | Value | Use |
|---|---|---|
| `ease.out` | `cubic-bezier(0.23, 1, 0.32, 1)` | Enters, presses, reveals, UI state (default) |
| `ease.inOut` | `cubic-bezier(0.77, 0, 0.175, 1)` | Things moving on screen (tab pill, sheet content shift) |
| `ease.drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | Mobile sheet, accordion height |
| `ease` (CSS keyword) | — | Hover colour/background changes |
| `linear` | — | Marquee, scroll-scrubbed values (scroll *is* the easing) |

`ease-in` is never used for UI.

### 6.2 Durations

| Token | ms | Use |
|---|---|---|
| `press` | 140 | Button `:active` scale 0.97 |
| `micro` | 180 | Hover, chips, toggles, focus |
| `ui` | 240 | Menus, accordions, tabs, field errors |
| `sheet` | 360 | Mobile menu sheet (enter); exit 240 |
| `reveal` | 560 | Section entrance (marketing context, allowed to be longer) |
| Exit | ≈ 0.7× enter | Exits are always faster |

### 6.3 Springs (Apple-style params)

| Name | Config | Use |
|---|---|---|
| `spring.ui` | `{ type: 'spring', duration: 0.4, bounce: 0.12 }` | Layout animations, pill indicator |
| `spring.slider` | `{ stiffness: 220, damping: 30, mass: 0.8 }` | Try-the-light glow and panel tint |
| `spring.follow` | `{ stiffness: 140, damping: 22, mass: 0.6 }` | Hover-follow, lamp tilt on pointer |
| `spring.land` | `{ type: 'spring', duration: 0.9, bounce: 0.22 }` | Lux counter landing on 10,000 (gentle overshoot) |
| `spring.scroll` | `{ stiffness: 400, damping: 60, restDelta: 0.0005 }` | Smoothing hero scroll progress (`useSpring`) |

### 6.4 Rules

1. Animate `transform` and `opacity` only. Hero exceptions: `filter` (blur ≤ 8px), colour and the
   WebGL uniforms. Never animate width, height, top, padding or margin during scroll.
2. Gradients are never interpolated. Sky changes are **stacked gradient layers crossfaded by opacity**.
3. Continuous values (scroll, slider) bypass React: motion values → `style` / textContent /
   three.js uniforms. No `setState` per frame. No per-frame CSS-variable writes on large parents
   (inherited-variable recalc); write to the element that changes.
4. Enter from `opacity: 0` plus `translateY(12px)` (8–16px range) or `scale(0.96)`. Never from scale 0.
5. Reveals trigger **once** (`whileInView`, `viewport: { once: true, margin: '0px 0px -12% 0px' }`).
   Stagger 40ms (30–60). Stagger never blocks interaction.
6. Hover effects only inside `@media (hover: hover) and (pointer: fine)`.
7. Interruptible UI uses CSS transitions or springs, not keyframes.
8. Keyboard-triggered actions (Esc to close, tab focus) are instant or ≤ 150ms.
9. Press feedback: `scale(0.97)` on everything pressable.
10. Constant motion (marquee) is pausable (button plus hover/focus pause), pauses when off-screen or the tab is hidden, and is static under reduced motion.

### 6.5 Reduced motion (`prefers-reduced-motion: reduce`)

- The hero becomes a **static, un-pinned story**: five stacked frames (final state of each scene)
  that crossfade in (opacity only, 240ms) as they enter. No scrubbing, no parallax, no Lenis.
- Reveals become opacity-only fades (no translate). Marquee becomes a static grid. The counter
  shows its final value. Springs become `duration: 0` or short opacity transitions.
- All content and CTAs remain reachable and readable. Verified with motion off.

### 6.6 Smooth scroll

Lenis on desktop pointer devices only (`syncTouch: false`), so touch keeps native scrolling and
iOS rubber-banding. One RAF loop: Lenis is driven from Motion's `frame` loop
(`frame.update(({ timestamp }) => lenis.raf(timestamp), true)`), so `useScroll` and Lenis never
disagree within a frame. Disabled under reduced motion. Anchor links and the "Skip intro"
link go through `lenis.scrollTo` with native fallback.

---

## 7. The hero — "The horizon was a lamp"

### 7.1 Architecture

```
<section hero> (height: 400svh desktop / 250svh mobile; 100svh under reduced motion → stacked frames)
  <div sticky top:0 h:100svh>
    <SkyLayers/>        CSS: sky-mist, dawn-rose, sun-200, paper layers crossfaded by progress
    <HeroFallback/>     SVG/CSS 2D lamp + sun. SSR, always present first.
    <LampScene/>        R3F canvas, dynamic(ssr:false), mounted after idle, crossfades over the fallback when ready
    <SceneCopy/>        DOM text for all 5 scenes (SSR, in reading order), crossfaded by progress
    <LuxCounter/>       Plex Mono, tabular-nums, corner
    <LuxMeter/>         thin vertical progress on the right edge (scaleY, origin bottom)
  </div>
</section>
```

- **LCP is DOM text** (scene 1 headline), server-rendered and painted immediately. WebGL never blocks it.
- **Progressive enhancement:** the 2D fallback is the baseline for everyone. `LampScene` loads only
  when all of these hold: WebGL2 available, not `saveData`, `deviceMemory ≥ 4` (when exposed),
  `hardwareConcurrency ≥ 6` on mobile / `≥ 4` on desktop, no reduced motion, and a first-frame
  probe ≥ 45fps. Otherwise the 2D story stays.
- The canvas is code-split (three, R3F, drei, postprocessing ≈ separate chunk), loaded with
  `requestIdleCallback` after hydration, and rendered with `frameloop="demand"`: frames are invalidated
  only when scroll progress changes or a transition is running. It is paused when the hero is
  off-screen or the tab is hidden. `dpr={[1, 1.75]}`, drei `PerformanceMonitor` steps the dpr down and
  disables bloom on sustained drops.
- **Scroll source:** `useScroll({ target: hero, offset: ['start start', 'end end'] })` → `useSpring(spring.scroll)`
  → one `progress` motion value that drives everything (CSS layers, copy, counter, meter, three.js
  uniforms via `useMotionValueEvent` → refs). Scene-local progress uses `useTransform(progress, [a, b], [0, 1], { clamp: true })`.
- A visually-hidden **"Skip intro"** link at the top of the hero jumps keyboard and screen-reader users past the pinned section.

### 7.2 Scene map

| Scene | Progress | Visual | Copy (DOM) | Lux counter |
|---|---|---|---|---|
| 1 Pre-dawn | 0 → 0.20 | Sky-mist page. A 1px glowing horizon line across the centre (blurred twin underneath for glow). | "We live in a land of sunshine. Most of our days are spent indoors." | `~300 lux · typical indoor light` [VERIFY] |
| 2 Sunrise | 0.20 → 0.45 | A soft sun disc rises above the horizon (translateY plus glow). Sky crossfades sky-mist → dawn-rose → sun-200. "सुप्रभात" appears small and fades out. | "Bring the *morning* indoors." | Climbs 300 → ~5,000 (linear to scroll, rendered via textContent) |
| 3 Reveal | 0.45 → 0.65 | The camera orbits ~90° (2D: `rotateY` on a preserve-3d lamp). The "horizon" resolves into the lamp's edge seen side-on; the sun descends into the frosted panel and merges (scale ↓ + opacity → panel emissive ↑). | "We folded the sunrise into this." | Holds while the sun merges |
| 4 Ignition | 0.65 → 0.85 | Panel switches on: emissive 0.2 → 1.6, bloom 0 → ~0.9, a radial light-spill layer scales 0.9 → 1 and fades in, and the background settles to paper. | Three chips stagger in: "UV-free", "3 colour modes", "20–30 min mornings" | Crossing 0.78 triggers a one-shot `spring.land` to **10,000** (gentle overshoot). Scrolling back reverses with scrub. |
| 5 Settle | 0.85 → 1.00 | Lamp turns to a 3/4 angle beside an abstract desk (mug = cylinder + torus, laptop = two thin slabs). A dotted arc labelled "8–24 in" (sub-label "20–60 cm") draws in (`pathLength`). | Primary "Join early access" · secondary "How it works" | 10,000 |

Copy is placeholder and gets refined in phase 2. Scene copy crossfades with an 8px translate and
`filter: blur(4px → 0)` to mask the swap (emil: blur bridges crossfades). Only one scene's copy is
`aria-hidden="false"` at a time for SR users; all are in the DOM order for no-JS / reduced motion.

### 7.3 Lamp model (procedural, no assets)

- **Panel:** `RoundedBox` 3:4 portrait (≈ 0.9 × 1.2 × 0.06 units), radius ≈ 0.08, warm-white bezel material
  (`MeshPhysicalMaterial`, roughness 0.5, color `#F6F1E8`).
- **Diffuser:** an inset plane with `MeshPhysicalMaterial` (transmission off for perf; roughness 0.9, a subtle
  noise normal map generated in a shader), `emissive #FFF4D6`, `emissiveIntensity` driven by scroll and
  colour temperature (also reused in Try-the-light).
- **Kickstand:** slim angled bar (≈ 12°) behind the panel. **Power dot:** small sphere on the right edge,
  emissive only when the lamp is on.
- Lighting: one soft key `RectAreaLight` + ambient. Environment: none (avoids HDR downloads).
- **Postprocessing:** `EffectComposer` (`multisampling={0}` on mobile) + `Bloom` (`mipmapBlur`,
  `luminanceThreshold 0.85`, intensity from scroll). Optional `Vignette` at very low strength.
- **2D fallback lamp:** the same proportions in SVG/CSS (`preserve-3d`, `rotateY`), with the panel glow
  as layered radial gradients whose **opacity** (not colour) changes.

### 7.4 Mobile (250svh)

Same five scenes with compressed ranges and camera framing for portrait (the lamp sits lower; copy at
the top third). The counter moves to the top-left; the meter stays at the right edge, 2px wide.

---

### 7.5 As built (phase 2)

- `components/hero/timeline.ts` holds every scroll → value mapping as pure functions; the 2D layer (`useTransform`) and the WebGL scene (`useFrame`) read the same functions, so the two versions stay in lockstep.
- Layout is static CSS variables on `.hero-stage` per breakpoint (`--lamp-x`, `--horizon-y`, `--panel-h`, `--panel-w`, `--sun-d`, `--s5-shift-n`, `--s5-scale`); motion only drives transforms and opacity. The WebGL scene measures the same variables, so the 3D lamp lands exactly where the 2D one does.
- The desk scene (surface line, mug, laptop, 8–24 in arc) is a line-art SVG overlay shared by both versions; the mug is hidden below 768px.
- Scene 1 carries a "Join early access" CTA so a CTA is server-rendered and visible immediately (brief §5); scene 5 has the primary/secondary pair.
- WebGL: idle-loaded chunk (~264 KB gz), `frameloop="demand"` after a 1.4s probe, bloom threshold 1.0 (only HDR emitters bloom, never the paper background), a frame-budget governor (degrade: bloom off + dpr 1; then fall back to 2D), context-loss fallback. QA overrides: `?hero=2d`, `?hero=3d`.
- Reduced motion: a static, un-pinned hero (lit lamp in 3/4 view + the five scenes as readable cards).
- Fonts: Newsreader italic is a separate, non-preloaded instance warmed on idle; critical font preload ≈ 187 KB.

### 7.6 Changes after review

- Hero length: 200svh (phones/tablets) and 300svh (desktop), so each scene changes with less scrolling.
- Phone layout: horizon at 56%, lux readout centred under the lamp (always above the fold), compact CTAs in scene 5.
- WebGL: desktop (fine pointer) only, fetched after the first scroll; phones always get the 2D story.
- Reveals are CSS transitions toggled by a single IntersectionObserver (no per-element JS). Motion uses `LazyMotion` + `m` with async features.
- Newsreader is self-hosted at weight 400 (h3 now 400 too) with optical sizes 20–72.

## 8. Component inventory

`components/ui/`: **Button** (primary ink / accent sun-400 / secondary outline / ghost; sizes md, lg; pill; press 0.97; loading state with spinner and width lock) ·
**IconButton** · **Card** (linen, hairline, `--r-card`; optional interactive lift) · **Chip** (static / toggle / removable) ·
**Accordion** (Motion layout + `AnimatePresence`; height via layout animation; button with `aria-expanded`/`aria-controls`) ·
**Marquee** (CSS transform loop, duplicated track, pause button, hover/focus pause, off-screen pause, reduced-motion static) ·
**Field** (label above, helper, error with `aria-describedby`, success tick; 16px inputs) ·
**Select** (native `<select>` styled for mobile reliability; state list) · **Checkbox** · **ChipGroup** (multi-select as toggle chips, `role="group"`) ·
**RadioCards** · **ProgressBar** (scaleX, spring) · **Tabs** (journal filters; animated pill via `layoutId`) · **Tooltip** (rare) ·
**SectionHeading** (eyebrow label + display heading + lede) · **Reveal** (whileInView wrapper honouring reduced motion) ·
**Disclaimer** · **Prose** (MDX styles) · **SpecTable** · **ComparisonTable** (sticky first column on mobile, horizontal scroll inside its own container only).

Global: **Logo/LogoGlyph** · **AnnouncementBar** (dismissible, remembers dismissal per version) · **Nav** (frosted; hides on scroll down and shows on scroll up after the hero; `aria-current`) ·
**MobileSheet** (full-screen, staggered links 40ms, focus trap, Esc, body scroll lock, safe areas) · **Footer** (links, newsletter, socials, disclaimer) ·
**WhatsAppFab** (bottom-right, safe-area aware; hides while any form field is focused and while the mobile sheet is open) · **SkipLink**.

Hero: **LampScene**, **HeroFallback**, **SkyLayers**, **SceneCopy**, **LuxCounter**, **LuxMeter**, **DeskScene**, **DistanceArc**.

Icons: `lucide-react` at 1.5px stroke, 20/24px. A custom inline SVG for the WhatsApp mark. No emoji as icons.

---

## 9. Section-level interaction notes (Home)

| Section | Interaction (purpose) |
|---|---|
| Problem | Oversized mono numbers count up once on view (explain scale); statements reveal staggered. Stats marked VERIFY. |
| Meet the lamp (bento) | Each card has one feedback micro-interaction: the 10,000 lux card glows on hover; UV-free shows a UV wavelength bar being blocked; colour temps cycle swatches on hover; brightness steps fill; timer counts down 60→15 on hover (mono, tabular); slim shows a side-profile thickness rule. Touch: tap toggles the same state. |
| Try the light | Slider 2700K→6500K and brightness (1–5). **Springs** drive the opacity of a warm and a cool glow layer (crossfaded, not recoloured) plus the lamp panel tint. Keyboard: arrow keys step 100K; values are announced (`aria-valuetext="4000 kelvin, neutral"`). |
| The ritual | Three sticky steps. The left illustration crossfades between states (distance arc / clock / field-of-view cone) while the copy scrolls. Reduced motion: stacked. |
| A day with light | Horizontal timeline: scroll-linked translateX on desktop, native horizontal scroll-snap on touch. 7 AM / afternoon / evening (lamp off). |
| Comparison | Static table. Row highlight on hover; the lamp column is emphasised with linen and an ink rule. |
| Stories | One featured story plus a slow marquee (pausable). Placeholder rules in §10. |
| Journal | Three latest cards; cover image `next/image` AVIF/WebP with lazy load. |
| FAQ | Accordion; one open at a time is optional (default: independent). |
| Early access | Short form (name, phone, city, interest) plus a WhatsApp button. Success = the lamp glyph switches on. |

---

## 10. Content & voice rules

- **Voice:** calm, warm, confident Indian English. Short sentences. Concrete over clever. No exclamation marks, no
  urgency tricks or fake scarcity (the batch size comes from config and is factual).
- **Wellness only:** "supports mood, energy and routine". Never treat, cure, diagnose, prevent; never name a
  condition as an outcome (depression, SAD, insomnia); no vitamin D claims (UV-free).
- **Visible disclaimer** in the footer, on /how-it-works, /the-lamp, /faq and the form: *Not a medical device. If you
  have bipolar disorder, an eye condition, or take photosensitising medication, check with your doctor before use.*
- **VERIFY markers:** every unconfirmed statistic or spec carries `verify: true` in its data file as an internal
  pre-launch checklist. Nothing renders on the site (the on-page badges were removed on 2026-10-18 at the user's request).
- **Testimonials:** every entry has `placeholder: true` and a `PLACEHOLDER — replace with real customer review`
  note in `data/testimonials.ts`. See the open question in PLAN.md on production behaviour.
- **Formats:** INR via en-IN (₹4,999); dates `18 Oct 2026`; times "7 AM"; distance "8–24 in (20–60 cm)".

---

## 11. Accessibility checklist (design-level)

Semantic landmarks (`header`, `nav`, `main`, `footer`); one `h1` per page; skip link; visible focus (2px ink, 2px offset)
on every interactive element; no hover-only information; all motion has a reduced-motion path; the hero copy is real text;
the counter has a static SR equivalent ("Up to 10,000 lux") with no live announcements while scrubbing; form errors are
inline, linked via `aria-describedby`, announced through a polite `aria-live` region; colour is never the only signal;
alt text on all imagery (decorative SVG `aria-hidden`); target size ≥ 44px; zoom never disabled.

---

## 12. Reference-site takeaways

From a text-level study of goayo.com (light-therapy glasses, long direct-response page) and
sundaylight.cc (ceiling fixture, short calm page). Inspiration only: no copy, imagery, layouts or
brand elements reused. Neither sells a desk lamp, so only the explanation techniques carry over.

**Adapt:**
1. **A lux ladder.** Indian home → office → monsoon-overcast sky → midday sun, with our lamp placed on it.
   It goes in /how-it-works and as a compact strip in the Home "Problem" section. Values are [VERIFY].
2. **Always pair 10,000 lux with its distance.** This is the most honest technique on either site. The counter's
   final label reads "10,000 lux · at [X] cm" with the distance taken from `specs.ts` [VERIFY].
3. **Three-step mechanism in plain words** (light → eyes → body clock) on /how-it-works, with every term glossed
   inline. No jargon left unexplained.
4. **Calm pacing, few CTAs.** Sunday-style: about one primary CTA per 2–3 sections, never shouty. The hero CTA
   anchors to the embedded form.
5. **One clear offer block** (founding batch, price from config, what early access gets you), placed beside
   the form, with a trust row: UV-free, flicker-free [VERIFY], warranty [placeholder], reply-on-WhatsApp promise.
6. **Long-form science reads as an essay with numbered references.** The journal and /how-it-works use a footnote style.
7. **Safety in plain sight.** A dedicated FAQ group "Who should check with a doctor first", plus the visible disclaimer near claims.

**Avoid:**
1. Strong benefit claims in the hero contradicted by a buried footer disclaimer (seen on one reference).
   We keep "supports" language everywhere and put a short wellness note near the claims.
2. Unsourced statistics, press logos or celebrity proof we can't verify. A number either has a source or is
   marked VERIFY and doesn't ship.
3. Hiding safety information or the price. The price (from config) is easy to find on Home and /the-lamp.
