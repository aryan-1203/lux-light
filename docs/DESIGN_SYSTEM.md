# Dawnlit Design System

Owner: **6 Frontend Foundation**. Source of truth for tokens: `frontend/src/design-system/tokens.ts`
(consumed by `tailwind.config.ts`, which injects colours as CSS variables on `:root`).
Import everything from `@/design-system`.

Direction (DECISIONS → design system): **Scroll-Triggered Storytelling** on a **Dark Mode (OLED)** base,
minimal glow, light is the hero (warm amber → daylight gradients from the lamp). Space Grotesk headings +
DM Sans body. Mobile-first (375 / 768 / 1024 / 1440), 44 px touch targets, WCAG 2.2 AA.

---

## 1. ui-ux-pro-max queries run and what was applied

| Query | Result used | Applied as |
|---|---|---|
| `--design-system "premium wellness dark immersive"` (orchestrator) | Scroll storytelling, OLED dark, Space Grotesk + DM Sans, gold accent | Palette, type, motion tiers (DECISIONS) |
| `"focus visible keyboard" --domain ux` | Visible focus ring on every control incl. modals; never remove outline without replacement | Global `:focus-visible` 2 px `focus` ring + offset 2; inputs swap to `ring-focus`; programmatic focus targets (`tabindex=-1`) have no ring |
| `"touch target size" --domain ux` | 44 pt iOS / 48 dp Android; WCAG 2.2 web min 24 px | Every interactive size ≥ 44 px (`min-h-touch`, `size-touch`); footer/contact links padded; axe `target-size` passes |
| `"skeleton loading" --domain ux` | Stable skeleton with `aria-busy`, no flicker | `Skeleton` (decorative, shimmer off under reduced motion) + `RouteFallback` reserving page-like space; groups use `aria-busy` + sr-only status |
| `"form label error" --domain ux` | Errors announced (`aria-live` / `role=alert`), submit feedback | Field messages live region; `aria-invalid` + `aria-describedby` (error first, then helper); `Button loading` |
| `"reduced motion animation" --domain ux` | Respect `prefers-reduced-motion`; animate 1–2 key elements per view | `MotionConfig reducedMotion="user"`, `useReducedMotionSafe()`, CSS kill-switch, Lenis off, Marquee static, spotlight/counter/stagger disabled |
| `"modal focus trap escape" --domain ux` | Focus visible inside modals, 2 px / 3:1 indicator | Radix Dialog (trap, Esc, `aria-modal`) + `useReturnFocus` (focus back to opener even without `Dialog.Trigger`) |
| `"live region toast status" --domain ux` | Atomic contextual status ("3 items in cart"); auto-dismiss 3–5 s | Persistent `role=status` / `role=alert` regions announce latest toast; cart count is in the button's accessible name, not a bare live number; toasts 4–8 s, paused on hover/focus |
| `"code splitting lazy bundle" --domain react` | Dynamic import heavy components; conditional loading | Every route `React.lazy`; CartDrawer / MobileNav / Toaster load on first use; Lenis dynamically imported after first paint; three.js isolated chunk |
| `"rerender memo context" --domain react` | Derived booleans (`useMediaQuery`) instead of continuous values; narrow deps | `useMediaQuery` / `useIsTouch` via `useSyncExternalStore`; header "scrolled" boolean via rAF-throttled listener |
| `"dark mode tokens focus" --stack html-tailwind` | `focus-visible:ring-2`, semantic tokens | Tokens as CSS variables with opacity support (`bg-sunrise/20`); lint rule bans hex literals outside tokens |
| `"lazy suspense error boundary"`, `"useEffect cleanup listener"` --stack react | lazy routes, ErrorBoundary per section, effect cleanup | `PageTransition` wraps each route in `ErrorBoundary` (resets on route change) + `Suspense`; all listeners/rAF cleaned up |
| `references/quick-reference.md` §1–§9 | exit faster than enter, stagger 30–50 ms, spring for drag/magnetic, transform/opacity only, `min-h-dvh`, tabular numbers, no emoji icons, error recovery paths | Motion tokens, `stagger(0.045)`, springs, `tabular-nums` prices/counters, lucide icons only, `EmptyState` always has an action |

No query returned an empty result; nothing in this document is an unverified fallback.

---

## 2. Colour tokens

Tailwind classes: `bg-<token>`, `text-<token>`, `border-<token>`, with opacity `bg-sunrise/20`. Raw value for
SVG/canvas/three.js: `cssVar('sunrise', 0.4)` → `rgb(var(--color-sunrise) / 0.4)`, or `colors.sunrise` (hex).

| Token | Hex | Use |
|---|---|---|
| `bg` | `#0A0908` | Page background (OLED near-black) |
| `surface` | `#141210` | Cards, drawers, footer, solid header |
| `surface-2` | `#1E1A16` | Inputs, toasts, hovered cards |
| `surface-3` | `#28231D` | Pressed / active tab |
| `border` | `#2E2822` | Decorative hairlines (no meaning) |
| `border-strong` | `#7A6F63` | Control borders (inputs, checkboxes) — WCAG 1.4.11 |
| `fg` | `#F5F1EA` | Primary text |
| `muted` | `#A8A096` | Secondary text (on bg / surface / surface-2 only) |
| `sunrise` | `#F5A524` | Primary CTA background, accents |
| `sunrise-strong` | `#FFB84D` | CTA hover, links, accent text |
| `sunrise-deep` | `#C2410C` | Gradient depth only (decorative, never text) |
| `daylight` | `#FFF4D6` | Lamp light / brightest highlight |
| `on-sunrise` | `#0A0908` | Text/icons on sunrise/daylight |
| `danger` | `#F87171` | Errors, destructive |
| `success` | `#4ADE80` | Success |
| `info` | `#93C5FD` | Informational |
| `focus` | `#FFD27A` | Focus ring |

Kelvin tints for illustrations / lux experience: `kelvinTint(4000|5500|6500)`.

### Verified contrast (WCAG 2.x; enforced by `src/design-system/contrast.test.ts`)

| Foreground on background | Ratio | Requirement |
|---|---|---|
| fg / bg | **17.67:1** | body ≥ 7 (AAA target) |
| fg / surface | 16.60:1 | ≥ 7 |
| fg / surface-2 | 15.36:1 | ≥ 7 |
| fg / surface-3 | 13.83:1 | ≥ 7 |
| muted / bg | 7.71:1 | ≥ 4.5 |
| muted / surface | 7.24:1 | ≥ 4.5 |
| muted / surface-2 (placeholders, helper) | 6.70:1 | ≥ 4.5 |
| on-sunrise / sunrise (primary CTA) | 9.75:1 | ≥ 4.5 |
| on-sunrise / sunrise-strong (CTA hover) | 11.57:1 | ≥ 4.5 |
| sunrise / bg | 9.75:1 | ≥ 4.5 |
| sunrise-strong / bg (links) | 11.57:1 | ≥ 4.5 |
| sunrise-strong / surface | 10.87:1 | ≥ 4.5 |
| danger / bg · surface · surface-2 | 7.19 · 6.76 · 6.25:1 | ≥ 4.5 |
| success / bg · surface | 11.42 · 10.72:1 | ≥ 4.5 |
| info / surface-2 | 9.59:1 | ≥ 4.5 |
| focus / bg · surface | 13.98 · 13.13:1 | ≥ 3 (non-text) |
| border-strong / bg · surface · surface-2 | 4.06 · 3.81 · 3.53:1 | ≥ 3 (non-text) |

Rules: muted text only on `bg`/`surface`/`surface-2`; never put text on `sunrise-deep`; colour never carries
meaning alone (errors have an icon + text, stock badges have words).

---

## 3. Typography

`font-display` = Space Grotesk Variable, `font-sans` = DM Sans Variable — self-hosted via `@fontsource-variable`
(no third-party CSS), `font-display: swap`, latin subset preloaded by the `dawnlit:preload-fonts` Vite plugin.

| Class | Size (375 → 1440 px) | Line height | Use |
|---|---|---|---|
| `text-xs` | 12 px | 16 px | Eyebrows, legal, badges (never body) |
| `text-sm` | 14 px | 1.35 rem | Helper text, meta |
| `text-base` | 16 px | 1.6 | Body (minimum for body + inputs: no iOS zoom) |
| `text-lg` | 17 → 19 px | 1.6 | Lead paragraphs |
| `text-xl` | 19 → 22 px | 1.5 | Card titles |
| `text-2xl` | 22 → 28 px | 1.3 | h3 |
| `text-3xl` | 28 → 40 px | 1.15 | h2 |
| `text-4xl` | 34 → 56 px | 1.08 | h1 (default) |
| `text-5xl` | 40 → 72 px | 1.04 | Feature h1 |
| `text-display` | 44 → 96 px | 1.0 | Chapter titles |
| `text-hero` | 48 → 120 px | 0.95 | Home hero only |

`<Heading level={1..6} size="…">` separates semantics from size (one h1 per page, no skipped levels).
`<Text tone="muted|accent|danger|success" eyebrow>`. Headings use `text-wrap: balance`; long tokens wrap.
`.text-glow` / `.text-gradient-sunrise` for the hero only (sparingly).

## 4. Spacing, radii, elevation, layers, breakpoints

- Spacing: Tailwind 4 px scale + `px-gutter` (16 → 40 px), `py-section` (64 → 128 px), `py-section-sm`,
  `h-header` (64 px), `min-h-touch`/`size-touch` (44 px). `Container` = `max-w-content` (1280 px) + gutter;
  `size="narrow" | "prose"` for reading widths.
- Radii: `rounded-sm` 6 · `rounded`/`md` 10 · `lg` 16 · `xl` 24 · `2xl` 32 · `full`. Buttons are pills.
- Shadows: `shadow-card`, `shadow-raised`, `shadow-overlay`; glows `shadow-glow-sm` (primary CTA), `shadow-glow`
  (hover), `shadow-glow-lg` (the lamp). Glow is reserved for CTAs and the light source.
- z-index (never arbitrary): `below -1 · base 0 · raised 10 · spotlight 15 · sticky 30 · header 40 · overlay 50 ·
  drawer 60 · modal 70 · toast 80 · skiplink 90 · grain 95`.
- Breakpoints: `xs 375 · sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1440`. Mobile-first; no horizontal scroll
  (`body { overflow-x: clip }`, verified 0 px overflow at 412 px).
- Safe areas: `pt-safe`, `pb-safe` (header, drawers, toasts, footer).

## 5. Motion

| Token (`durations`, seconds in `motion.ts`; ms in Tailwind `duration-*`) | Value | Use |
|---|---|---|
| `micro` | 150 ms | press/hover colour |
| `fast` | 200 ms | small state changes, exits |
| `ui` | 280 ms | toggles, overlays, toasts |
| `slow` | 420 ms | reveals (`fadeUp`) |
| `page` | 600 ms | route enter, word reveal |
| `cinematic` | 900 ms | hero / counters |

Easings (`ease.*`, Tailwind `ease-*`): `out` (0.16,1,0.3,1) enter · `in` (0.7,0,0.84,0) exit · `inOut` ·
`sunrise` (0.22,1,0.36,1) signature. Springs: `magnetic`, `sheet`, `pop`. Exit ≈ 50–65 % of enter.

Variants (`@/design-system`): `fadeUp`, `fadeIn`, `scaleIn`, `stagger(step=0.045, delay)`, `reveal` (masked word
rise), `pageTransition`, `slideFrom.{left,right,bottom}`, `overlayFade`, `transitions.*`.

Rules: transform/opacity only; ≤ 2 key animated elements per view; everything interruptible; content
readable with all motion off.
**Framer usage:** App wraps everything in `<LazyMotion features={domAnimation}>` + `<MotionConfig reducedMotion="user">`.
Prefer `m.div` (light) in new code; `motion.*` works but pulls the full feature bundle into that page's chunk
(fine for lazy pages, avoid in always-loaded layout code). Hooks (`useScroll`, `useTransform`, `useInView`) are
unaffected. `useReducedMotionSafe()` must gate pointer-follow, parallax/scrub, particles, loops and counters.

Reduced motion behaviour: Framer strips transforms (opacity crossfades remain), CSS animations/transitions
collapse to 0.01 ms, Lenis is never started, `Marquee` renders static wrapped content (no duplicate, no
control), `CursorSpotlight` renders nothing, `StaggerText` renders plain text, `AnimatedCounter` shows the final value.

## 6. Component inventory

All exported from `@/design-system` (files in `src/design-system/components/`). Every component is keyboard
operable and has unit tests (`*.test.tsx`).

| Component | Purpose / notes |
|---|---|
| `Button` | `variant` primary · secondary · ghost · link · danger; `size` sm · md · lg · icon (all ≥ 44 px); `loading` (spinner, `aria-busy`, clicks blocked, width stable); `leadingIcon`/`trailingIcon`; `asChild` → `<Button asChild><Link to="/shop">Shop</Link></Button>`. `buttonVariants()` for custom elements. |
| `MagneticButton` | Button body follows the pointer (spring, transform only); static on touch + reduced motion. |
| `Input`, `Textarea`, `Select`, `Checkbox`, `Switch` (`role=switch`), `Radio` + `RadioGroup` (fieldset/legend) | forwardRef + spread `register()` from RHF. Visible `label` required (`hideLabel` only for icon search), `helperText`, `error` → `aria-invalid` + `aria-describedby`, live error region, `required` asterisk. Inputs are 16 px (no iOS zoom). Pass `autoComplete`, `inputMode`. |
| `Field` helpers | `FieldLabel`, `FieldMessages`, `controlClasses`, `useFieldA11y()` for custom controls. |
| `Badge` | tones neutral · sunrise · success · danger · info · outline. |
| `Card` | `interactive` (lift + glow border), `padding`, `elevation`; use stretched links for whole-card targets (see `ProductCard`). |
| `Accordion` | Radix; headings + buttons, arrow/Home/End; `items=[{id,title,content}]`, `type`, `headingLevel`. |
| `Tabs` | Radix; roving tabindex, arrow keys; `label` required. |
| `Dialog` | Radix modal: focus trap, Esc, scroll lock + Lenis pause, focus return, sheet on mobile / centred ≥ sm; `dismissible={false}` for payment in progress; `footer`. |
| `Drawer` | Same semantics; `side` right · left · bottom; spring in / fast tween out; `headerAside`, `footer`. |
| `ToastRegion` | Bound to `useUIStore`; use `useToast()` / `useApiErrorToast()`. |
| `Skeleton`, `Spinner` | Loading; reserve space via `style={{ aspectRatio }}` or sizes. |
| `EmptyState` | Empty / error state with mandatory recovery `action`; `tone="error"` → `role=alert`. |
| `Container`, `Section` | Layout rhythm. |
| `Heading`, `Text`, `VisuallyHidden` | Typography + sr-only. |
| `Price` | `paise`, `compareAtPaise` (strike + sr "Originally"), `from`, `showSavings`, sizes; tabular numerals. |
| `Rating` / `RatingInput` | Read-only stars with one accessible label; 1–5 radio picker for review forms. |
| `Icon` | lucide-react wrapper: sizes xs–xl, decorative by default, `label` → `role=img`. |
| `Logo`, `LogoMark` | Sunrise mark + wordmark from `config/brand.ts`. |
| `CursorSpotlight` | Radial light following the pointer (rAF, translate3d only); `mode="viewport" | "contained"`. Off on touch/reduced motion. |
| `GrainOverlay` | Static SVG film grain (rendered globally by AppShell at 4.5 % opacity). |
| `SmoothScrollProvider` | Lenis (lazy-loaded, wheel only); `useLenis()`, `useLenisLock(open)`; add `data-lenis-prevent` to inner scrollers. |
| `StaggerText` | Word-by-word masked reveal; reads as one phrase to AT; `immediate` or in-view. |
| `AnimatedCounter` | Counts up in view without re-rendering per frame; width reserved; SR gets final value. |
| `Marquee` | CSS loop, pauses on hover/focus, pause button (WCAG 2.2.2), duplicate copy `aria-hidden` + `inert`. |
| `PageStub` | Phase-2 placeholder page. |
| Illustrations | `LampDesk`, `LampPanel`, `LampGo`, `ProductIllustration slug lit kelvin title` — 400×500 (4:5) SVG, lit/unlit opacity transition, kelvin tint; decorative unless `title`. Use as product-image fallback. |

Hooks / utils: `cn()` (clsx + tailwind-merge aware of custom tokens), `formatINR(paise)` ("₹4,999", "₹499.90"),
`formatDate(iso, opts)` (Asia/Kolkata), `formatLux(n)`, `formatNumber(n)` (en-IN), `useMediaQuery`, `useIsTouch`,
`useToast`, `useApiErrorToast`, `useReducedMotionSafe`, `useReturnFocus`.

## 7. Layout (`src/layout/`)

`AppShell` (skip link → sticky `Header` → `<main id="main-content">` with `PageTransition` → `Footer`; lazy
`MobileNav`, `CartDrawer`, `Toaster` on first use; `RouteAnnouncer`; `ScrollToTop`; `GrainOverlay`; Organization
JSON-LD). `Seo` (title `${title} · Dawnlit`, home = brand + tagline, canonical, OG/Twitter, JSON-LD, `noindex`).
`PageTransition` keys by pathname (`/account/*` as one key) and keeps the exiting page on its own location.
`ErrorBoundary` + `RouteFallback` per route. Hero sections that should sit under the transparent header use
`-mt-header pt-header`.

## 8. Accessibility rules (binding for all frontend agents)

1. Landmarks + one `h1` per page; route change focuses the `h1` and announces the title.
2. Never remove focus outlines; custom controls use `focus-visible:ring-2 ring-focus ring-offset-2 ring-offset-bg`.
3. Touch targets ≥ 44 × 44 px with ≥ 8 px gaps; icon-only buttons need `aria-label`.
4. Forms: visible labels, `autocomplete`, `inputMode`, inline errors, error summary focused on submit.
5. Overlays: `Dialog` / `Drawer` only (focus trap, Esc, return focus).
6. Announce async results via toasts (`role=status` / `alert`) — never move focus for them.
7. Images: meaningful `alt` or `alt=""`; always `width`/`height` or an aspect-ratio box (CLS < 0.1).
8. Motion: respect reduced motion (see §5); no flashing > 3/s; moving content has a pause control.
9. Icons: lucide-react only, no emoji. Colours: tokens only (ESLint blocks hex literals).
10. Copy: compliance guardrail (PLAN §6.5); disclaimer string only from `DISCLAIMER` in `config/brand.ts`.
