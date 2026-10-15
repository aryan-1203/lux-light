# Launch checklist — Dawnlit (India D2C)

Everything the owner must do (or confirm with a professional) before taking real orders. Technical
deployment steps are in [`DEPLOYMENT.md`](DEPLOYMENT.md); key switching in the [README](../README.md#switching-to-live-keys).

> This checklist is practical guidance, not legal or tax advice. Items marked **(CA)**, **(lawyer)**
> or **(importer/consultant)** must be confirmed by that professional; rules and thresholds change.

Legend: `[ ]` to do · the env var or file to update is shown in `code`.

---

## 1. Business identity

- [ ] Legal entity decided and registered (Pvt Ltd / LLP / proprietorship); PAN, bank current account.
- [ ] Brand name final; trademark search and application (Class 11 — lighting apparatus) filed.
- [ ] Brand placeholders replaced: `frontend/src/config/brand.ts` (name, tagline, legal name, support
      contacts, social links, compliance block) and env `BRAND_NAME`, `BRAND_LEGAL_NAME`
      ([README → Renaming the brand](../README.md#renaming-the-brand)).
- [ ] Registered address and customer-care details in `SELLER_ADDRESS`, `SUPPORT_EMAIL`,
      `SUPPORT_PHONE` and on the Contact page.

## 2. Payments — Razorpay

- [ ] Razorpay account created under the legal entity; **KYC submitted and activated** (PAN, GSTIN,
      bank account, business proof, website with live policy pages — Razorpay reviews the site).
- [ ] Settlement bank account verified; settlement cycle (T+2 default) noted; payout reports
      reconciled with admin orders for the first week.
- [ ] Payment methods enabled and tested in **test mode**: UPI (collect + intent/QR), cards
      (Visa/Mastercard/RuPay), netbanking, wallets, **EMI / cardless EMI** (activation may need a
      separate request), Pay Later as desired.
- [ ] International cards: decide (off by default).
- [ ] Test mode end-to-end with `rzp_test_` keys: successful payment, failed payment, retry, refund
      from admin, webhook delivery visible in the dashboard.
- [ ] **Webhooks** — create separately in test and live mode:
      URL `https://<domain>/api/v1/payments/webhook/razorpay`; events `payment.captured`,
      `payment.failed`, `order.paid`, `refund.processed`, `refund.failed`; secret = `RAZORPAY_WEBHOOK_SECRET`.
- [ ] **Test → live switch:** live keys `rzp_live_…` in `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`,
      live webhook secret in `RAZORPAY_WEBHOOK_SECRET`, `PAYMENT_PROVIDER=razorpay`, `ENV=production`;
      redeploy; `GET /api/v1/health` shows `"payment_gateway": "razorpay"`.
- [ ] One real low-value live order paid and refunded successfully.
- [ ] Brand logo and name set in Razorpay checkout settings; statement descriptor checked.
- [ ] COD: fee (`COD_FEE_PAISE`, default ₹49), maximum order value (`COD_MAX_ORDER_PAISE`, default
      ₹10,000) and courier COD pincodes confirmed.

## 3. Domain, DNS, SSL/TLS

- [ ] Domain registered (e.g. `.in` / `.com`) with registrar lock + 2FA on the registrar account.
- [ ] DNS: `A`/`AAAA` for the site → server (or CDN); apex ↔ `www` redirect decided (`infra/caddy/Caddyfile`).
- [ ] TLS certificate issued (Caddy automatic Let's Encrypt, or CDN/ALB); HTTP → HTTPS redirect works;
      HSTS enabled; SSL Labs grade A.
- [ ] `CORS_ORIGINS`, `PUBLIC_SITE_URL`, `VITE_SITE_URL` = `https://<domain>`; frontend image rebuilt.
- [ ] `CAA` record limiting issuers (e.g. `letsencrypt.org`) — optional hardening.

## 4. GST and invoicing

- [ ] **GSTIN** obtained (mandatory for e-commerce sellers regardless of turnover) and set in
      `SELLER_GSTIN`; `SELLER_STATE_CODE` matches the registered state (drives CGST+SGST vs IGST).
- [ ] **HSN 9405** for the lamps and the **GST rate (default 18 %) confirmed with your CA (CA)** for
      each product incl. accessories (floor stand, travel case); update per-product GST rate in admin
      if different.
- [ ] Invoice series `DL/<FY>/<000001>` acceptable to your CA (one series per financial year,
      gap-free); invoice layout reviewed (GSTIN, HSN, place of supply, tax split, legal name, address).
- [ ] **E-invoicing (IRN/QR)**: currently mandatory only above the aggregate-turnover threshold
      (₹5 crore at the time of writing) and for B2B invoices — track turnover with your CA and plan
      integration with an IRP/GSP before crossing it **(CA)**.
- [ ] **TCS under GST (s.52)** applies only when selling through marketplaces; not for this own-site
      store — confirm if you also list on Amazon/Flipkart **(CA)**.
- [ ] Returns calendar (GSTR-1, GSTR-3B) and invoice archive retention set up (see DEPLOYMENT §7).
- [ ] Import GST/duty credits: purchase batches entered in admin with landed cost (unit price,
      freight, duty, IGST) for margin reporting; ITC claims handled by your CA.

## 5. Shipping and courier

- [ ] Courier aggregator account (Shiprocket — integrated; or Delhivery via a new adapter) KYC done.
- [ ] Pickup address added and verified; nickname set in `SHIPROCKET_PICKUP_LOCATION`;
      API user credentials in `SHIPROCKET_EMAIL` / `SHIPROCKET_PASSWORD`.
- [ ] Tracking webhook → `https://<domain>/api/v1/shipping/webhook/shiprocket` with header
      `X-Webhook-Token: <SHIPPING_WEBHOOK_TOKEN>`.
- [ ] **COD remittance** cycle, bank account and early-COD charges understood; reconciliation process
      for COD collected vs remitted.
- [ ] Package dimensions/weights per variant verified against real packed boxes (volumetric weight).
- [ ] RTO (return-to-origin) handling, NDR process and damaged-in-transit claims documented.
- [ ] Shipping fee rules confirmed: free above ₹999 (`FREE_SHIPPING_THRESHOLD_PAISE`), else ₹79
      (`SHIPPING_FEE_PAISE`).

## 6. WhatsApp and email notifications

- [ ] WhatsApp Business API provider chosen (Gupshup, Interakt, Twilio, 360dialog, …); Meta business
      verification done; display name approved.
- [ ] Message **templates approved** by Meta for: order confirmed, shipped, out for delivery,
      delivered, OTP (if used); opt-in captured at checkout.
- [ ] `WHATSAPP_PROVIDER_URL` / `WHATSAPP_API_KEY` set and the HTTP adapter mapped to the provider's API.
- [ ] Transactional email provider (SES, Postmark, SendGrid, ZeptoMail …) set up; `SMTP_*` configured.
- [ ] Sending domain authenticated: **SPF**, **DKIM**, **DMARC** (`p=none` → monitor → `quarantine`);
      test messages land in Gmail/Outlook inboxes, not spam.
- [ ] Abandoned-cart emails only to customers who opted in to marketing; unsubscribe link works.

## 7. Legal pages and consumer protection

- [ ] **Lawyer review (lawyer)** of Privacy Policy, Terms of Use, Refund/Return Policy and Shipping
      Policy (`/policies/privacy|terms|refund|shipping`).
- [ ] Privacy Policy compliant with the **Digital Personal Data Protection Act, 2023** and its rules:
      purposes of processing, consent and withdrawal, data principal rights, retention, grievance
      contact, processors (payment, courier, email, WhatsApp, analytics); consent banner for
      non-essential cookies/analytics.
- [ ] **Consumer Protection (E-Commerce) Rules, 2020**: legal name, registered address, customer-care
      contacts, **grievance officer** name/designation/contact on the site; acknowledge complaints
      within 48 h and resolve within one month; return/refund/exchange, warranty, delivery and
      cancellation terms shown before purchase; total price breakdown; no fake reviews.
- [ ] Country of origin shown on product pages and listings.
- [ ] Refund timelines in the policy match operations (Razorpay refunds take 5–7 working days).

## 8. Product compliance — imports, BIS, Legal Metrology

- [ ] **IEC (Importer Exporter Code)** from DGFT in the entity's name; set in the footer compliance
      block (`frontend/src/config/brand.ts` → `COMPLIANCE.iec`).
- [ ] **BIS Compulsory Registration Scheme (CRS)** for LED products: LED luminaires / lamps and LED
      drivers/adaptors are under CRS (e.g. **IS 10322** series for LED luminaires, **IS 16102** for
      self-ballasted LED lamps, **IS 15885** for LED control gear). **Have the importer/consultant
      confirm the exact standard(s) for each model and accessory (importer/consultant)**; register
      each model/manufacturer before import; the R-number and Standard Mark must be on the product
      and packaging → `COMPLIANCE.bisRegistration`.
- [ ] Customs: correct classification (HSN 9405) and duty confirmed by your customs broker; BIS
      registration checked at import clearance.
- [ ] **Legal Metrology (Packaged Commodities) Rules, 2011** declarations on every retail package
      **and** on the online listing: name and address of manufacturer/packer/**importer**, common
      or generic name, **net quantity** (number of units), month and year of manufacture/import,
      **MRP inclusive of all taxes**, **country of origin**, **customer care** contact (phone/email);
      Legal Metrology registration as importer of packaged commodities if required in your state.
- [ ] E-waste (EPR) registration under the E-Waste (Management) Rules, 2022 for electrical products
      (importers are producers) **(consultant)**.
- [ ] Product safety: warranty card, user manual (eye-safety distance, usage time), UV-free claims
      supported by test reports.

## 9. Marketing claims (medical-claims review)

- [ ] All site copy, blog posts, product descriptions, ads and WhatsApp/email templates reviewed
      against the guardrail: **no** claims to cure, treat, prevent or diagnose any disease (no "SAD
      treatment", "cures insomnia", "treats depression"). Use "supports", "helps you feel",
      "designed for daily wellness routines".
- [ ] Disclaimer present exactly: "Not a medical device. Consult a doctor for medical conditions."
- [ ] Reviewed against the **Drugs and Magic Remedies (Objectionable Advertisements) Act, 1954**,
      the **ASCI Code** (incl. health-claim and influencer guidelines — #ad disclosures) and the
      Consumer Protection Act's misleading-advertisement provisions **(lawyer)**.
- [ ] Science footnotes cite reputable sources; testimonials are real and verifiable.
- [ ] Confirm with a regulatory consultant that the product is not regulated as a medical device under
      the Medical Devices Rules, 2017 given the final marketing positioning **(consultant)**.

## 10. Analytics, pixels and consent

- [ ] GA4 property created → `VITE_GA_ID` (G-…); key events: `add_to_cart`, `begin_checkout`,
      `purchase`, `quiz_complete` (already emitted via `frontend/src/config/analytics.ts`).
- [ ] Meta Pixel → `VITE_META_PIXEL_ID`; **Conversions API** (server-side `Purchase` events from the
      backend with event-id deduplication) — placeholder, to be implemented.
- [ ] Vendor snippets wired in `frontend/src/config/analytics.ts` **only after consent**; consent
      banner + preference storage in place (DPDP Act).
- [ ] CSP switched to the analytics variant in `frontend/nginx.conf`; frontend image rebuilt.
- [ ] Google Search Console + Bing Webmaster: domain verified, `https://<domain>/sitemap.xml` submitted;
      `robots.txt` checked (admin/account/checkout disallowed).
- [ ] Google Merchant Center (optional) product feed.

## 11. Operations, backups and monitoring

- [ ] Production `.env` complete (`ENV=production`; startup guard passes); stored in a password manager.
- [ ] Demo data purged / never seeded in production (`python -m app.seeds --purge-demo` on staging).
- [ ] Real product photos, descriptions, specs, prices and stock entered in admin; placeholder images gone.
- [ ] Nightly DB + storage backups shipped off-box; **one restore tested** (DEPLOYMENT §7).
- [ ] Uptime monitoring on `/` and `/api/v1/health`; worker liveness alert; disk alert at 80 %.
- [ ] Error tracking (Sentry or similar) — placeholder; add SDKs with PII scrubbing.
- [ ] Log retention decided; no PII in logs verified (spot-check JSON logs after a test order).
- [ ] Support inbox, WhatsApp support number and response SLAs staffed for launch week.

## 12. Security

- [ ] All secrets random and unique: `SECRET_KEY`, `MOCK_PAYMENT_SECRET`, `SHIPPING_WEBHOOK_TOKEN`,
      `RAZORPAY_WEBHOOK_SECRET`, MySQL passwords — generated with
      `python3 -c "import secrets; print(secrets.token_urlsafe(48))"`.
- [ ] Seed admin/staff passwords changed after first login; one named account per staff member;
      ex-staff disabled promptly.
- [ ] Secret rotation procedure documented (rotating `SECRET_KEY` logs everyone out; rotate Razorpay
      keys from the dashboard, then update `.env` and redeploy).
- [ ] Admin **2FA** — roadmap item; until then restrict `/admin` by IP/VPN if practical.
- [ ] `docs/SECURITY_REVIEW.md` findings resolved; Dependabot PRs reviewed weekly.
- [ ] Server: SSH keys only, firewall (22 restricted, 80/443 open), automatic security updates.
- [ ] 2FA on every vendor account: registrar, DNS/CDN, Razorpay, Shiprocket, email provider,
      WhatsApp provider, GitHub, cloud provider.

## 13. Performance

- [ ] CDN in front of the site (Cloudflare/CloudFront/Bunny): cache `/assets/*` and `/media/*`, never
      `/api/*`; webhook paths excluded from bot challenges.
- [ ] Lighthouse mobile ≥ 85 on `/`, `/shop`, `/products/dawnlit-desk` against the production URL
      (record in `docs/TEST_REPORT.md`).
- [ ] Real product images uploaded at adequate resolution (renditions generated by the backend);
      hero media compressed (AVIF/WebP).
- [ ] `VITE_ENABLE_3D` decision made based on mid-range Android testing.

## 14. Go-live smoke test (production, after deploy)

Run on a phone (4G) and a desktop. Use a real card/UPI for one low-value order and refund it.

- [ ] `https://<domain>` loads over HTTPS with a valid certificate; `http://` redirects.
- [ ] `GET /api/v1/health` → `status: ok`, `database: true`, `payment_gateway: razorpay`,
      `shipping_provider: shiprocket`.
- [ ] `/sitemap.xml` and `/robots.txt` served with production URLs; `/api/docs` returns 404.
- [ ] Browse home → science → quiz → recommended product → add to cart (cart drawer animates).
- [ ] Pincode check on checkout shows ETA; non-serviceable pincode shows a clear message.
- [ ] Apply a real launch promo code; invalid code shows the right error.
- [ ] Sign up / log in (and OTP login if enabled); guest cart merges after login.
- [ ] Pay with Razorpay (UPI and card); order success page; order visible in account.
- [ ] Order confirmation email and WhatsApp received; GST invoice PDF downloads with correct GSTIN,
      HSN, tax split (try one intra-state and one inter-state address).
- [ ] Razorpay webhook delivery shows `200` in the dashboard.
- [ ] Admin: order visible on dashboard, mark packed → create shipment (AWB) → shipped; customer
      receives shipped notification; tracking page updates.
- [ ] Admin refund of the test order → Razorpay refund created → order refunded → customer notified.
- [ ] COD order on an eligible pincode → confirmation without payment.
- [ ] Stock decrements after payment; low-stock indicator correct.
- [ ] Footer shows legal name, address, grievance officer, BIS/IEC/importer details, disclaimer.
- [ ] Security headers present (`curl -I https://<domain>/` → CSP, HSTS, X-Content-Type-Options,
      Referrer-Policy, Permissions-Policy, X-Frame-Options).
- [ ] Backups ran overnight; monitoring alerts tested once.
