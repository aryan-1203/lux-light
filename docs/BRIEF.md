# Original Project Brief (verbatim requirements; placeholders resolved in DECISIONS.md)

BUSINESS CONTEXT
- Brand: {{BRAND_NAME}} → "Dawnlit" (tagline: "Your own sunrise, on demand."). We import 10,000 lux light therapy lamps from China and sell under our own brand in India.
- Audience: health-conscious Indians aged 21-50, Gen Z and millennials. Mobile-first (80%+ traffic from phones).
- Goal: visually unforgettable site that educates, builds trust, and converts visitors into buyers.
- Products: start with 3 SKUs (desk lamp, panel, portable travel lamp) with variants (color temperature, bundle). Prices in INR, GST-inclusive.
- Compliance guardrail: no claims that the product cures, treats or diagnoses any disease. Use wording like "supports", "helps you feel", "designed for daily wellness routines". Add a clear disclaimer: "Not a medical device. Consult a doctor for medical conditions." Add a placeholder for BIS / import compliance details in the footer.

TECH STACK (fixed)
Frontend: React 18 + TypeScript (strict), Vite, Tailwind CSS, Framer Motion (primary animation library), React Router, TanStack Query, Zustand (cart/UI state), React Hook Form + Zod, Lenis smooth scroll. Optional: React Three Fiber for a 3D glowing lamp in the hero if performance budget allows (lazy-loaded, with static fallback).
Backend: Python 3.12, FastAPI, SQLAlchemy 2.0 + Alembic migrations, Pydantic v2, PyMySQL/asyncmy, JWT auth (access + refresh, httpOnly cookies), passlib/argon2, Celery or FastAPI BackgroundTasks + Redis for async jobs (emails, WhatsApp, invoices).
Database: MySQL 8 (InnoDB, utf8mb4). Use transactions and row-level locking (SELECT ... FOR UPDATE) for stock reservation.
Payments: Razorpay (UPI, cards, netbanking, wallets, EMI). Create orders server-side, verify signature server-side, handle webhooks idempotently. Keys only via environment variables. Test mode by default.
Infra: Docker + docker-compose (frontend, backend, mysql, redis), .env.example, GitHub Actions CI (lint, typecheck, test, build).

DESIGN DIRECTION ("extreme" but fast)
Concept: "Your own sunrise, on demand." Dark, premium, cinematic UI where light is the hero.
- Hero: full-screen dark scene where a lamp glows and the page lights up as the user scrolls or moves the cursor (radial light follow-cursor effect, bloom, grain, subtle particles).
- Interactive "Lux Slider": user drags from 100 -> 500 -> 1,000 -> 10,000 lux and the whole page ambience, brightness and copy change, comparing indoor lighting, overcast day, sunny morning and our lamp.
- Scroll-driven storytelling (Framer Motion useScroll/useTransform): "Why mornings feel hard" -> "How light affects your body clock" -> "10 minutes a day" -> product reveal. Keep all science statements generic and cited with footnotes to reputable sources; no medical claims.
- 3D/360-style product viewer with hotspots, color-temperature toggle, and a "turn it on" light-up animation.
- "Find your routine" quiz (3-5 questions: wake time, work style, screen time, goal) that recommends a product and a daily light-routine plan, then adds it to the cart.
- Magnetic buttons, cursor spotlight, parallax, staggered text reveals, marquee of trust badges, animated counters, page transitions (AnimatePresence), animated cart drawer, confetti on order success.
- Social proof: reviews wall, UGC-style carousel, FAQ accordion, comparison table vs. generic lamps, 30-day return and warranty strip.
- Required: prefers-reduced-motion fallback, 60fps on mid-range Android, Lighthouse mobile performance >= 85 (lazy-load heavy assets, use WebP/AVIF, code-split routes, avoid layout shift), accessibility WCAG AA, keyboard navigation, alt text.
- Language: English first, structure code with i18n so Hindi can be added later.

FUNCTIONAL SCOPE
Storefront pages: Home, Product Listing, Product Detail, Science/Why Light, Quiz, Cart drawer + Cart page, Checkout (address, pincode serviceability, promo, payment), Order Success, Order Tracking, Login/Signup (email + OTP optional), My Account (orders, addresses), Blog list + post, FAQ, Contact, Policies (Privacy, Terms, Refund, Shipping).
Cart: add/remove/update, persistent for guests (merged on login), live stock validation, price recalculation on the server (never trust client prices).
Promo codes: percentage and flat discounts, min order value, max discount cap, usage limit total and per user, start/end dates, first-order-only, product/category restriction, stackable flag. Validate server-side; show clear error messages in UI; animated "coupon applied" state. Seed codes: WELCOME10, SUNRISE500.
Inventory: SKU-level stock, variant stock, low-stock threshold, stock reservation during checkout (release after timeout), stock decrement on payment success, restock/adjustment log, purchase batches from supplier (landed cost: unit price, shipping, duty, GST) to compute margin.
Payments: Razorpay order create -> checkout.js -> verify signature -> mark paid. Webhook endpoint for payment.captured / failed / refund events, idempotent, with signature verification. Support COD with a configurable fee and pincode eligibility. Refund flow from admin.
Orders: statuses (pending, paid, packed, shipped, out_for_delivery, delivered, cancelled, refunded, returned), status history, customer-facing tracking timeline.
Shipping: Shiprocket (or Delhivery) adapter behind an interface: pincode serviceability + ETA, create shipment, AWB, tracking webhook. If no credentials are present, use a mock adapter so everything still runs locally.
GST invoices: auto-generate PDF invoice (GSTIN, HSN code, CGST/SGST/IGST split by state, invoice numbering) on payment success; downloadable from account and admin.
Notifications: transactional email (order confirmed, shipped, delivered) and WhatsApp (via a provider-agnostic adapter, mock by default). Abandoned cart email job.
Admin dashboard (separate protected route /admin, role-based access): sales overview charts, orders list with filters and status updates, product/variant CRUD with image upload, inventory and stock adjustments, promo code manager, customers list, reviews moderation, blog CMS (markdown), shipment and refund actions, CSV export.
SEO and content: meta tags and Open Graph per page, sitemap.xml, robots.txt, JSON-LD (Product, Review, FAQ, Organization), clean URLs, image optimization, a few seeded blog posts (e.g. "Morning light routine for desk workers") written within the compliance guardrail.

DATABASE (MySQL) - minimum tables
users, addresses, products, product_variants, product_images, categories, inventory, stock_movements, suppliers, purchase_batches, carts, cart_items, promo_codes, promo_redemptions, orders, order_items, order_status_history, payments, refunds, shipments, invoices, reviews, blog_posts, quiz_results, notifications_log, audit_log. Add proper indexes, foreign keys, unique constraints (e.g. SKU, order number, invoice number, razorpay_payment_id), and Alembic migrations plus seed scripts with realistic demo data.

API REQUIREMENTS
REST under /api/v1 with OpenAPI docs. Generate TypeScript types/client from the OpenAPI schema (openapi-typescript) so frontend and backend never drift. Consistent error format, pagination, rate limiting on auth, promo and payment endpoints, request validation everywhere, CORS locked to configured origins.

SECURITY
Server-side price and promo calculation, signature verification for Razorpay, webhook idempotency, hashed passwords, httpOnly secure cookies, CSRF protection for cookie auth, input sanitization, SQL injection safe (ORM only), admin RBAC, secrets only in env, audit log for admin actions, no PII in logs.

QUALITY GATES (after each phase, fix until clean)
backend (ruff, mypy, pytest), frontend (eslint, tsc --noEmit, vitest, vite build), docker-compose up, Alembic upgrade, seed, and a Playwright run of: browse -> quiz -> add to cart -> apply promo -> checkout with Razorpay TEST payment -> order success -> invoice download -> admin sees order -> admin marks shipped.
Do not skip tests, silence errors, or hard-code results. Never fabricate API keys; use .env.example and clearly mark what the owner must provide.

DELIVERABLES
Working repo; README with one-command local setup (docker compose up) and how to switch to live keys; .env.example; seeded demo data; API docs; test reports; /docs/LAUNCH_CHECKLIST.md (Razorpay live KYC, domain, SSL, GSTIN/HSN setup, courier account, WhatsApp provider, legal pages, BIS/import compliance, analytics and Meta pixel placeholders).
