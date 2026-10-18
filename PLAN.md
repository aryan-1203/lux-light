# PLAN.md — Build plan

Status: **approved 2026-10-18** · All six phases built (2026-10-18) · Companion to `DESIGN.md` · Last updated: 2026-10-18

Every phase ends with lint + typecheck + build (frontend) and ruff + pytest (backend), fixes for every error,
an `emil-design-eng` critique pass (Before/After table), and a short summary with the decisions I need from you.
I stop after each phase for review.

---

## 0. Decisions (with justification)

| Topic | Decision | Why |
|---|---|---|
| Framework | Next.js **16.4** (App Router, Turbopack, Cache Components + Partial Prefetching on), React 19.3, TS strict. `ensureStatic = 'navigation'` on the site layout keeps every page prerendered. | Latest stable as of 2026-10-18 |
| TypeScript | **TS 5.9** (what `create-next-app` 16.4 pins), strict | Matches Next's own toolchain; TS 7 can come later |
| Styling | Tailwind **4.3** with `@theme` tokens mapped from `styles/tokens.css` | Brief |
| Motion | `motion` **14.x** (`motion/react`) + Lenis **1.3**, synced via Motion's `frame` loop | One RAF loop, no drift between Lenis and `useScroll` |
| 3D | three 0.186 + @react-three/fiber 9.8 + drei 10.7 + @react-three/postprocessing 3.2, `dynamic(..., { ssr: false })`, separate chunk | Brief, and keeps the 3D bundle out of the LCP path |
| **MDX** | **Velite** (0.4, Zod schemas) | `next-mdx-remote` was **archived by HashiCorp in March 2026**, so I won't start a new site on it. Velite is actively maintained, gives Zod-typed frontmatter (the same validation tool as the form), outputs static typed data with no runtime MDX compile, runs as a pre-build/watch step that works with Turbopack, and supports `readingTime` and image processing for covers. |
| Forms | react-hook-form 7.90 + zod 4.6 + @hookform/resolvers 5.9. One schema in `frontend/lib/lead-schema.ts`, mirrored in `backend/app/schemas.py`, with a shared JSON fixture tested on both sides to catch drift. | Brief |
| Anti-spam | Honeypot + Cloudflare Turnstile (`@marsidev/react-turnstile`, managed/invisible mode). Server-side `siteverify` via httpx. Dev uses Cloudflare's published test keys. | Brief |
| Analytics | Thin `lib/analytics.ts` adapter: `provider: 'plausible' \| 'ga4' \| 'none'` from env; events `form_start`, `form_submit`, `whatsapp_click`, `hero_complete` | Brief |
| Icons | `lucide-react` + a custom WhatsApp SVG | No emoji icons |
| Backend | Python 3.12, FastAPI 0.143, Pydantic 2.14, pydantic-settings, gspread 6.2, google-auth, slowapi, httpx, openpyxl, uvicorn | Brief |
| Package manager | npm (pnpm isn't installed on this machine) | Local env |

---

## 1. Repo layout

```
/frontend
  site.config.ts                 brandName, tagline, whatsappNumber, priceDisplay, launchBatchSize, offer, budgets, socials
  app/
    layout.tsx                   fonts, metadata base, en-IN, analytics, Lenis provider
    (site)/page.tsx              Home
    (site)/how-it-works/ the-lamp/ why-india/ journal/ journal/[slug]/ stories/ faq/
    (site)/early-access/ about/ privacy/ terms/
    not-found.tsx                switched-off lamp
    sitemap.ts robots.ts icon.svg opengraph-image.tsx (+ per-route OG)
  components/hero/               LampScene, HeroFallback, SkyLayers, SceneCopy, LuxCounter, LuxMeter, DeskScene, DistanceArc, useHeroProgress, capability.ts
  components/ui/                 Button, IconButton, Card, Chip, ChipGroup, Accordion, Marquee, Field, Select, Checkbox, RadioCards, ProgressBar, Tabs, Reveal, SectionHeading, Disclaimer, Prose, SpecTable, ComparisonTable
  components/layout/             Nav, MobileSheet, AnnouncementBar, Footer, WhatsAppFab, SkipLink, Logo
  components/sections/           Problem, MeetTheLamp, TryTheLight, Ritual, DayWithLight, Comparison, Stories, FromJournal, Faq, EarlyAccessCta
  components/form/               LeadForm (full, 2-step), LeadFormShort, SuccessState, fields
  content/journal/*.mdx          6 guides/articles + 3 news
  data/testimonials.ts faq.ts specs.ts stats.ts states.ts
  lib/motion.ts lib/format.ts lib/analytics.ts lib/lead-schema.ts lib/utm.ts lib/whatsapp.ts lib/jsonld.ts
  styles/tokens.css styles/globals.css
  velite.config.ts  .env.example
/backend
  app/main.py config.py schemas.py
  app/routers/leads.py newsletter.py health.py
  app/services/sheets.py turnstile.py outbox.py dedupe.py
  scripts/export_leads_xlsx.py
  tests/
  requirements.txt  Dockerfile  .env.example
README.md                         incl. step-by-step Google Cloud setup
DESIGN.md  PLAN.md
.github/workflows/ci.yml          rewritten for the new apps
```

---

## 2. Phases

### Phase 1 — Foundation
- Replace leftovers from the previous build in the repo root: root `.env.example`, `.github/workflows/ci.yml`, `.github/dependabot.yml` (rewritten for the new layout); `.gitignore` extended. `.localdata/` (old local MySQL data, gitignored) is **left untouched**.
- Scaffold `/frontend` (create-next-app, strict TS, Tailwind 4, ESLint) and `/backend` (FastAPI skeleton, health route, settings, Dockerfile, pytest, ruff).
- `site.config.ts`, `tokens.css` → Tailwind `@theme`, fonts via next/font (Newsreader opsz, Hanken Grotesk, IBM Plex Mono, Tiro Devanagari Hindi with Devanagari subset).
- `lib/motion.ts`, Lenis provider, `Reveal`.
- Logo + glyph, Nav (frosted, hide-on-scroll), MobileSheet, AnnouncementBar, Footer with disclaimer, WhatsAppFab, SkipLink.
- Base UI kit: Button, Card, Chip, SectionHeading.
- All routes stubbed with metadata so navigation works end to end.
- **Exit:** build is green; nav/footer polished at all 6 widths; keyboard pass; emil critique.

### Phase 2 — Hero
- `HeroFallback` (2D story) first, fully working, which also gives reduced motion and the fallback for free.
- `useHeroProgress`, SkyLayers, SceneCopy, LuxCounter (textContent writes, spring landing), LuxMeter.
- `LampScene` (procedural lamp, desk, bloom), capability gating, idle loading, demand frameloop, PerformanceMonitor.
- **Exit:** 60fps on desktop Chrome and Safari; Android mid-range profile (CPU 4× throttle) stays smooth on the fallback; LCP is text and < 2.5s on throttled 4G; hero JS chunk size reported; reduced-motion version reviewed.

### Phase 3 — Home sections
Problem (with lux-ladder strip), Meet the lamp (bento + micro-interactions), Try the light, Ritual, A day with light,
Comparison, Stories, From the journal (temporary data until phase 4), FAQ, Early-access CTA (short form UI, wired to a
mocked endpoint until phase 5), Footer newsletter UI.
- **Exit:** every section at 6 widths, reduced motion, keyboard; emil critique; `break-ui` worst-case pass on the bento, cards and form.

### Phase 4 — Inner pages + journal
/how-it-works, /the-lamp, /why-india, /stories, /faq, /about, /privacy, /terms, 404. Velite setup, 6 MDX posts
(600–900 words each, wellness-safe, references section), 3 news posts, `/journal` filter tabs (Guides · Articles · News,
URL-synced `?category=`), `/journal/[slug]` with ToC, reading time and related posts. JSON-LD Article and FAQPage.
- **Exit:** content review list (VERIFY items and claims) handed to you.

### Phase 5 — Form, backend, Sheets, WhatsApp
- `/early-access` two-step form with progress, home short form, success state (lamp switches on), WhatsApp deep link with name + lead ID.
- Backend: `POST /api/leads` (Pydantic, Turnstile, honeypot, slowapi per-IP, dedupe by phone/email → update row, `lead_id` like `LX-7F3K9Q`, IST timestamps, `status="New"`), `POST /api/newsletter` (second tab), `GET /api/health`.
- Sheets service: exponential backoff with jitter on 429/5xx, plus a **durable outbox** (SQLite) that queues a failed write and retries it in the background. See risk R1.
- CORS allow-list from env; service-account JSON as a base64 env var.
- `scripts/export_leads_xlsx.py` (openpyxl, Abadi 9pt on every cell, bold header, frozen header, auto-fit widths).
- README Google Cloud walkthrough + Dockerfile (Cloud Run / Render / Railway).
- **Exit:** pytest covers validation parity, dedupe, honeypot, Turnstile failure, backoff, outbox replay; an end-to-end run against a real test sheet if you provide credentials (otherwise a fake gspread client).

### Phase 6 — Polish & QA
emil-design-eng + `review-animations` critique; ui-ux-pro-max pre-delivery checklist; axe + manual keyboard/screen-reader pass
(VoiceOver); Lighthouse mobile (target ≥ 90, LCP < 2.5s) on throttled 4G + mid-range Android; OG images per page, sitemap,
robots, JSON-LD validation; cross-device QA at 360/390/768/1024/1440/1920; `mobile-native` checklist (tap highlight, 100svh,
input zoom, safe areas).

---

## 3. Risks & mitigations

| # | Risk | Mitigation |
|---|---|---|
| **R1** | **"Never lose a submission" vs. ephemeral containers.** Cloud Run (and Render without a disk) wipe local files when an instance stops, so a local queue alone can still lose leads. | Recommended: **Render web service with a small persistent disk** for the SQLite outbox. If you choose Cloud Run: `max-instances=1`, `min-instances=1`, and every queued payload is also written to structured logs (Cloud Logging) so it can be replayed by a script. **Your call (Q2).** |
| R2 | Dedupe races and Sheets read quota (≈60 reads/min/user) | Single writer with an asyncio lock; an in-memory phone/email → row index loaded at startup, refreshed with a TTL and after each write; one instance recommended. |
| R3 | slowapi limits are per-instance memory | Fine with one instance; documented. Turnstile is the main spam defence. |
| R4 | Hero smoothness on low-end Android | Fallback-first architecture, strict capability gate, demand rendering, dpr cap, PerformanceMonitor, bloom off on regress. |
| R5 | Toolchain drift | Resolved: kept Next 16.4's pinned TS 5.9 / ESLint 9. `npm audit` shows 5 high in dev-only tooling (braces via eslint); 0 in production deps. |
| R6 | Velite is pre-1.0 | Small surface (one collection); content is plain MDX, so switching to `@next/mdx` later is cheap. |
| R7 | Abadi is a Microsoft font, not installed everywhere | openpyxl only sets the font name; Excel falls back where Abadi is missing. Documented. |
| R8 | Legal copy (privacy, terms, DPDP notice) | I draft plain-language templates aligned with the DPDP Act; **they need review by a lawyer before launch.** |
| R9 | Placeholder stats, specs and testimonials going live | `verify: true` flags in the data files (not shown on the site, removed 2026-10-18 at the user's request) and visible "Placeholder" labels on testimonials; both are on the launch checklist. |
| R10 | Brand name "Brand" in SEO metadata | Everything reads from config; flagged in the launch checklist. |

---

## 4. What I need from you

**Resolved (2026-10-18):** Q1 approved · Q2 **Render + persistent disk** · Q3 **show placeholder testimonials for now**,
each visibly labelled "Placeholder" in the UI and flagged in `data/testimonials.ts` (no build failure; R9 becomes a launch-checklist item).

**Small additions, all accepted:**
- `--sun-800 #9A5F12` for accessible accent text, plus danger/success tokens (DESIGN §2.2).
- A lux-ladder strip (Problem section + /how-it-works) and "10,000 lux at X cm" phrasing (DESIGN §12).
- Showing cm next to inches ("8–24 in (20–60 cm)").
- A "Skip intro" link on the pinned hero.

**Needed later (not blocking phase 1):** WhatsApp number · price and batch size · Turnstile keys (phase 5) · Google Cloud
project and sheet (phase 5) · real specs (distance at which 10,000 lux is measured, wattage, dimensions, warranty) · analytics provider choice.

**Git:** the previous Dawnlit project's 376 files are deleted in the working tree but not committed. I'll build on
`main` without committing unless you ask. When you want commits, I'll first commit the deletion separately as
"chore: remove previous Dawnlit build" so history stays readable.


---

## 5. As built (2026-10-18)

| Phase | Result |
|---|---|
| 1 Foundation | Done. Tailwind switched from the `@tailwindcss/turbopack` loader to `@tailwindcss/postcss` (the loader stopped hot-reloading CSS). |
| 2 Hero | Done. Heights shortened after review to **200svh phone / 300svh desktop**. WebGL loads on **desktop pointers only, after the first scroll**; phones and tablets get the 2D story. |
| 3 Home sections | Done: Problem (+ lux ladder), Meet the lamp (bento), Try the light, Ritual, A day with light, Comparison, Stories (labelled placeholders), Journal, FAQ, Early-access CTA (short form, lazy-loaded). |
| 4 Inner pages + journal | Done: /how-it-works, /the-lamp, /why-india, /journal (+ tabs, ?category=), /journal/[slug] (ToC, related, Article JSON-LD, OG image), /stories, /faq (FAQPage JSON-LD), /about, /privacy, /terms (MDX drafts), interactive 404. Velite chosen (next-mdx-remote is archived). |
| 5 Form + backend | Done: 2-step form + short form, Zod schema mirrored in Pydantic, Turnstile, honeypot, UTM/first-touch, success state → WhatsApp with name + lead ID. Backend: Sheets upsert/dedupe, IST timestamps, backoff + SQLite outbox, slowapi, CORS, xlsx export (Abadi 9), Render Blueprint. 95 backend tests. |
| 6 Polish | Done: emil critique fixes, reveals moved to CSS + one observer, LazyMotion, subset self-hosted Newsreader (opsz kept, weight 400, ~40 KB/style), inline CSS, sitemap/robots/OG/JSON-LD, analytics adapter (Plausible/GA4). Lighthouse mobile: Accessibility/Best practices/SEO **100** everywhere; Performance ≈ 88–91 on inner pages and ≈ 84–86 on Home (simulated throttling; observed LCP ≈ 0.1 s locally, CLS 0, TBT ≈ 10 ms). |

Still open: real content (brand, price, WhatsApp number, VERIFY figures, testimonials, team, legal review), a real-device
Android pass, and Home performance ≥ 90 under Lighthouse simulation (next lever: trimming hero/section client JS).
