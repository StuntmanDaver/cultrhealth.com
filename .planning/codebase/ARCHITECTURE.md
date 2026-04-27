<!-- refreshed: 2026-04-27 -->
# Architecture

*Last updated: 2026-04-27*
*Scope: cultrhealth.com (CF Pages prod + Vercel staging) + cultrclub.com*

## System Overview

CULTR runs as **two sibling Next.js applications** that share a single **Neon Postgres** database. The cultrhealth.com app additionally has a **dual-host topology** where production and staging serve from different platforms.

| Surface | Source | Hosting | Role |
|---|---|---|---|
| `cultrhealth.com` (+ `www.`) | Sibling repo `cultrhealth-web/` (branch `main`) | **Cloudflare Pages** via `@cloudflare/next-on-pages` | Public production: marketing, intake, members, creators, admin, telehealth, compliance |
| `staging.cultrhealth.com` | This repo, branch `staging` | **Vercel** | Staging — full app including admin; staging auth bypass for test emails |
| `cultrclub.com` | Repo `cultrclub-web/` (branch `main`) | Cloudflare Pages | Standalone customer-facing CULTR Club storefront — stealth (noindex), URL-only access |

All three apps are Next.js 14+ App Router with TypeScript and Tailwind, and all three talk to the same Neon Postgres instance. The cross-app surfaces are: (1) the shared DB, (2) HMAC-signed email deep links from cultrclub.com → cultrhealth.com admin approvals, and (3) coupon / attribution rows that are written by cultrclub.com but consumed by cultrhealth.com admin dashboards.

`join.cultrhealth.com` was retired Apr 22 2026 — DNS no longer resolves, the Vercel domain alias was detached, and the `middleware.ts` legacy-host shim now 404s any residual `/join*` traffic that lands on the public production hosts.

```
                              ┌─────────────────────────┐
                              │   Neon Postgres (DB)    │
                              │  single shared instance │
                              └──┬─────────┬─────────┬──┘
                                 │         │         │
        ┌────────────────────────┘         │         └────────────────────────┐
        │                                  │                                  │
┌───────▼────────────────┐   ┌─────────────▼───────────────┐   ┌──────────────▼──────┐
│  cultrhealth.com (CF)  │   │ staging.cultrhealth.com (V) │   │   cultrclub.com     │
│  Cloudflare Pages      │   │      Vercel (Node)          │   │ (Cloudflare Pages)  │
│  edge runtime          │   │      Node runtime           │   │   edge runtime      │
│  built from            │   │      built from             │   │   built from        │
│  cultrhealth-web/main  │   │      this repo / staging    │   │   cultrclub-web     │
│                        │   │                             │   │                     │
│  Public + Admin +      │   │  Same app surface as prod   │   │  Customer Store     │
│  Creators + Intake     │   │  + dev-login bypass         │   │  (stealth site)     │
│  + Members + Telehealth│   │                             │   │                     │
└──────────┬─────────────┘   └─────────────┬───────────────┘   └──────────┬──────────┘
           │                               │                              │
           └───────────────────────────────┴──────────────────────────────┘
                              HMAC-signed email approval links
                              cultrclub.com → cultrhealth.com admin
```

---

## cultrhealth.com Architecture

### Source vs Deploy Targets

This repo is the **canonical source** for the cultrhealth.com app. It is consumed two different ways:

1. **Production (Cloudflare Pages):** Code is mirrored into the sibling repo `/Users/davidk/Documents/Dev-Projects/App-Ideas/cultrhealth-web/` (GitHub: `StuntmanDaver/cultrhealth-web`, branch `main`). There is **no GitHub auto-deploy** — production deploys are explicit:
   ```
   npm run build:cf    # @cloudflare/next-on-pages — writes .vercel/output/static
   npm run deploy:prod # wrangler pages deploy --project-name=cultrhealth --branch=main
   ```
   Build requires Node 20. The build reads the working-directory tree, not git HEAD, so a `git status` check before building is mandatory. After a CF build, large `public/` binaries (MP4, etc.) can be hardlink-truncated to 64KB by next-on-pages — restore from source with `git checkout` + `cp` into the output dir before deploying.

2. **Staging (Vercel):** Pushes to the `staging` branch of this repo trigger a Vercel build. Production-branch deploys on Vercel are explicitly disabled via `vercel.json` (`git.deploymentEnabled.main = false`, `.master = false`).

The two deployments share environment variables and the same Neon DB. Differences are confined to: edge-runtime constraints on CF Pages, and the staging-only auth bypass on Vercel.

### Framework & Runtime
- **Next.js ^14.2.0** App Router.
- **TypeScript** ^5.4.0 (`strict: false`, `allowJs: true`, `moduleResolution: "node"`).
- Path alias `@/*` → project root.
- Global security headers + CSP configured in `next.config.js`.
- `reactStrictMode: true`, `removeConsole` in production (preserves `error`/`warn`).
- `optimizePackageImports: ['lucide-react', 'recharts', 'zod']`.

### CF Pages-Specific Constraints

When the same code runs on Cloudflare Pages it must respect Worker-runtime limits:
- **Neon DB**: when called from edge code, `neon()` MUST use `fullResults: true` so the result shape (`{ rows, rowCount, command, fields }`) matches the `@vercel/postgres` code that this repo writes against.
- **Node `crypto`/`Buffer`**: resolved via the `nodejs_compat` flag in `wrangler.toml` on cultrhealth-web. Without it, anything that pulls `crypto` (HMAC verification, JWT, attribution token signing) breaks silently at runtime.
- **DOMPurify**: unreliable in some edge contexts — sanitization paths that traverse Worker code need explicit fallbacks.
- **Image optimization**: CF Pages has no Next image optimizer; `images.unoptimized: true` is set on the prod build.
- **Bundle size**: 3 MiB Worker bundle limit — large client-only libraries (Recharts, three.js) must remain dynamically imported.
- **`headers()` in `next.config.js`**: dropped for static routes by next-on-pages. Static-asset headers must be carried by `public/_headers`; SSR'd HTML headers are still honored. Middleware is still authoritative for runtime headers.

### Server vs Client Component Split
- Pages are **server components by default**. Interactive logic is pulled into `*Client.tsx` siblings.
- Homepage (`app/page.tsx`, ~511 lines) is a server component that builds sections inline and uses `next/dynamic` for below-fold lazy loads (PricingCard, FAQAccordion, ClubBanner, NewsletterSignup).
- Auth-gated pages fetch session state server-side, then hydrate client contexts (`CreatorContext`, `JoinCartContext`, intake contexts) for interactive state.
- File convention: `Page.tsx` (server) + `PageClient.tsx` (client). Examples: `app/quiz/QuizClient.tsx`, `app/intake/IntakeFormClient.tsx` (the actual implementation lives in `components/intake/IntakeFormClient.tsx`), `app/members/shop/ShopClient.tsx`, `app/admin/AdminDashboardClient.tsx`.
- The dosing calculator is the canonical example of **shared component, three host pages**: a single `<DosingCalculator />` in `components/dosing-calculator/DosingCalculator.tsx` is delegated to from public, members, and creator portal versions:
  - `app/tools/dosing-calculator/PublicDosingCalculatorClient.tsx`
  - `app/members/dosing-calculator/DosingCalculatorClient.tsx`
  - `app/creators/portal/dosing-calculator/CreatorDosingCalculatorClient.tsx`

### Auth Flows

Four distinct auth tracks, each with its own JWT namespace and cookie:

| Track | Entry | Cookie / Token | Gate |
|---|---|---|---|
| **Patients / members** | `app/login/` | `cultr_session_v2` + `cultr_last_activity_v2` (JWT via `jose`, HS256) | Issued after magic link through `app/api/auth/magic-link/route.ts` → `app/api/auth/verify/route.ts` |
| **Creators** | `app/creators/login/` | Separate creator JWT; issued by `app/api/creators/magic-link/route.ts` + `app/api/creators/verify-login/route.ts` | Additional `app/api/creators/verify-email/route.ts` for email confirmation links (supports both browser-clicked GET and JSON POST) |
| **Admins** | `app/admin/` | Same `cultr_session_v2` cookie + admin role lookup on every request | `requireAdmin()` helper; `app/api/admin/restore-session/route.ts` handles the "Login As" masquerade round-trip via the `cultr_admin_return_v2` cookie |
| **Providers** | `app/login/` | Patient JWT + email allowlist check | `PROTOCOL_BUILDER_ALLOWED_EMAILS` env var; gates protocol builder + provider routes |

Magic-link issuance uses `lib/resend.ts`. JWT utilities live in `lib/auth.ts`. Portal-specific session logic for the Siphox/labs portal lives in `lib/portal-auth.ts` and `lib/portal-db.ts` — distinct from the four tracks above.

A separate **portal/labs** auth track lives at `app/portal/` with OTP-based login (`app/api/portal/send-otp` + `verify-otp`) for kit-only customers who don't have a full member account.

### API Route Organization (120 `route.ts` files under `app/api/`)

| Category | Location | Responsibilities |
|---|---|---|
| **Auth** | `app/api/auth/` | magic-link, verify, logout, dev-login (staging only) |
| **Checkout** | `app/api/checkout/` | route.ts (subscription), product/, subscription/, corepay/ |
| **Webhooks** | `app/api/webhook/{stripe,quickbooks,healthie,calendly}/` | Signed webhook handlers — signature verification + idempotency via `stripe_idempotency` table |
| **Creators** | `app/api/creators/` | apply, magic-link, verify-login, verify-email, dashboard, profile, links, codes, network, payouts, earnings, leaderboard, labs, dosing, support, results |
| **Admin** | `app/api/admin/` | analytics, asher-dashboard, club-members, club-orders, creators (approve/reject/codes/payouts), customers, cron-status, dosing-rules, intakes, inventory, members, orders, prelaunch-codes, qr-scans, restore-session, siphox-smoke |
| **Club** | `app/api/club/` | check-member, event, login, orders, signup, validate-coupon — internal mirror of cultrclub.com endpoints (used by admin tooling) |
| **Intake** | `app/api/intake/submit/` | Submit medical intake form |
| **LMN** | `app/api/lmn/` | Lab Management Number generation / listing / detail |
| **Member** | `app/api/member/` | Member-scoped reads (profile, orders, files, labs, medical-records, results, transactions, dosing) |
| **Portal (labs)** | `app/api/portal/` | Siphox portal auth (send-otp/verify-otp/refresh/logout) + labs/results/documents/orders/profile/stacking-content |
| **Quickbooks** | `app/api/quickbooks/{auth,callback}/` | OAuth2 flow for invoice integration |
| **Track** | `app/api/track/` | click, daily, identify, qr-scan |
| **Quiz** | `app/api/quiz/submit/` | POST submit, PATCH lead-mirror into `waitlist` (requires `::text` cast on email in CASE WHEN) |
| **Onboarding** | `app/api/onboarding/status/` | Post-checkout onboarding state |
| **Dosing Calculator** | `app/api/dosing-calculator/instruction-pdf/` | Server-rendered PDF instruction card for the public calculator |
| **Misc** | `app/api/{waitlist,quote,stock,supplement-order,meal-plan,protocol/generate}/` | Waitlist signup, quote generator, inventory lookup, supplement reorders, AI meal plans, AI protocol generation |
| **Cron** | `app/api/cron/` | Scheduled jobs (see below) |

### Cron Jobs (`vercel.json` + Cloudflare Pages dashboard)

On Vercel (staging) crons are declared in `vercel.json`. On CF Pages production, the same paths are wired through the dashboard's Cron Triggers + a Worker `scheduled()` handler that forwards to the path with `CRON_SECRET` bearer auth.

| Path | Schedule | Purpose |
|---|---|---|
| `/api/cron/siphox-fulfillment` | `*/15 * * * *` | Pull Siphox kit fulfillment status |
| `/api/cron/siphox-results` | `0 * * * *` | Hourly Siphox lab-results sync |
| `/api/cron/siphox-status-sync` | `*/30 * * * *` | Siphox order status sync |
| `/api/cron/approve-commissions` | `0 2 * * *` | Promote eligible commissions to `approved` after 30-day refund window; revert self-referrals |
| `/api/cron/update-tiers` | `0 3 * * *` | Recompute creator tier based on active recruit count |
| `/api/cron/stale-orders` | `0 12 * * *` | Flag / clean up orders stuck in intermediate states |
| `/api/cron/asher-sync` | *(unscheduled)* | Historical Asher Med integration (Asher Med fully removed Apr 4 2026) |

All cron handlers authenticate with `Authorization: Bearer $CRON_SECRET`. Each invocation is wrapped in `startCronRun()` from `lib/cron-logger.ts` which writes to the `cron_runs` table.

### Middleware (`middleware.ts`)

The root middleware handles HIPAA-grade idle timeout, canonical-host redirects, and the legacy-join 404 shim. It does not perform any live subdomain rewriting.

Responsibilities:
1. **Canonical host redirect** — any `*.vercel.app` production deployment 308s to `https://cultrhealth.com`. Only triggers when `VERCEL_ENV === 'production'` so staging Vercel previews still work.
2. **Legacy `/join*` 404 shim** — any request whose path starts with `/join` on a non-local host is rewritten to `/not-found`. This is cleanup for a decommissioned subdomain — not an architectural routing layer. The CF Pages production middleware version omits the canonical-host block (irrelevant on Pages).
3. **Session idle timeout** — on authenticated route prefixes (`/members`, `/intake`, `/dashboard`, `/admin`, `/provider`, `/creators/portal`, `/api/member`, `/api/intake`, `/api/admin`, `/api/provider`, `/api/creators`), checks `cultr_last_activity_v2` cookie. If >30 min stale, clears both session cookies (honoring `.cultrhealth.com` domain suffix so production ghost sessions can't resurrect) and redirects to the right login (`/creators/login` for creator portal, `/login` otherwise). API requests get a `401 Session timeout` JSON instead.
4. **Activity heartbeat** — for authenticated sessions inside the window, refreshes `cultr_last_activity_v2` on every request.

### SEO Surface — `/tools/dosing-calculator` Family

The `/tools/dosing-calculator` route is the centerpiece of the SEO long-tail strategy (Apr 25 2026 overhaul) and is built around a strict schema↔visible-text parity contract:

- `app/tools/dosing-calculator/page.tsx` — server-rendered landing page with 4 JSON-LD schemas (`Calculator`, `MedicalWebPage`, `FAQPage`, `HowTo`).
- `app/tools/dosing-calculator/seo-content.ts` — single source of truth for FAQ items, HowTo steps, peptide cross-sells, references. Both the visible JSX and the JSON-LD schemas import from this file. Google requires schema text to match visible text word-for-word.
- `app/tools/dosing-calculator/[slug]/page.tsx` — dynamic per-peptide preset pages (13 of them: `semaglutide`, `tirzepatide`, `retatrutide`, `bpc-157`, `tb-500`, `ghk-cu`, `glutathione`, `nad`, `sermorelin`, `cjc-1295-ipamorelin`, `tesamorelin-ipamorelin`, `pt-141`, `oxytocin`).
- `app/tools/dosing-calculator/[slug]/preset-content.ts` — content table for each slug (title, meta description, intro, worked example, per-peptide FAQ, related slugs).
- `app/tools/dosing-calculator/PublicDosingCalculatorClient.tsx` — public-facing calculator client wrapper.
- `components/dosing-calculator/DosingCalculator.tsx` — the shared interactive calculator delegated to by all three host pages.
- `components/dosing-calculator/SyringeMeter.tsx` — visual U-100 syringe component (and a stale macOS dup at `SyringeMeter 2.tsx` flagged for cleanup).
- `components/site/FAQAccordion.tsx` — modified Apr 26 to render answer text in static HTML (CSS-collapse + `aria-hidden` instead of conditional render) so Google FAQPage rich-snippet eligibility is preserved.
- `app/sitemap.ts` — emits one entry per `PRESET_PAGES` slug (priority 0.7) plus the calculator landing (priority 0.8). `/login` was dropped from the sitemap (commit 8182a44) because it isn't a useful entry surface for crawlers.

Note that `/login` still exists as a route (`app/login/page.tsx`) — only the sitemap entry was removed. `/science` and the legacy blog routes were removed for LegitScript compliance and 301-redirect to `/` via `next.config.js`.

### Deployment Flow Summary

| Target | Source | Trigger | Command / mechanism |
|---|---|---|---|
| `cultrhealth.com` (prod, CF Pages) | sibling `cultrhealth-web/main` | **Manual** — no auto-deploy | `npm run build:cf && npm run deploy:prod` (Node 20) |
| `staging.cultrhealth.com` (Vercel) | this repo, `staging` branch | git push to `staging` | Vercel auto-build |
| this repo, `main` / `master` | — | **Disabled** in `vercel.json` | — (PR base only) |
| this repo, `production` branch | — | **Decommissioned** | The Apr 22 cutover moved prod to CF Pages. The `production` branch is no longer wired to anything, but commits there should still match staging via cherry-pick if used for archival reasons. |

**Critical deploy rules:**
- **Never** use `vercel --prod` from a terminal — the CLI deploys the local working directory, not the branch. (Historical incident on Mar 23 2026: staging accidentally deployed to production.)
- **Never** force-push to `production`; SHAs legitimately diverge from `staging`.
- For CF Pages, always `git status` before `build:cf` — the build reads the working tree, not git HEAD; missing page files silently 404 all affected routes.
- After `build:cf`, verify large `public/` asset sizes — next-on-pages can hardlink-truncate MP4/binary assets to 64KB.

---

## cultrclub.com Architecture

### Framework & Runtime
- **Next.js 15.5.2** App Router on **Cloudflare Pages** via `@cloudflare/next-on-pages`.
- Every route opts into **`export const runtime = 'edge'`** — required because Cloudflare Pages cannot run Node.js routes.
- `wrangler.toml` sets `compatibility_flags = ["nodejs_compat"]` — resolves Node `crypto` / `Buffer` polyfills for edge code.
- `next.config.js` sets `images.unoptimized: true`.
- Fonts: Fraunces, Playfair Display, Inter (same trio as cultrhealth.com).

### Database Access
- Uses **`@neondatabase/serverless`** (`neon()`), **not** `@vercel/postgres`.
- `lib/db.ts` wraps `neon(POSTGRES_URL, { fullResults: true })` in a lazy-init `Proxy` so the function supports both tagged-template calls and `.query()`-style use while only initializing when `POSTGRES_URL` is set.
- `fullResults: true` is **mandatory** — it makes the result shape `{ rows, rowCount, command, fields }` compatible with the `@vercel/postgres` code paths mirrored in `lib/creators/*` (shared helpers copied from cultrhealth.com).
- A WebSocket-transport `Pool` is exported via `createPool()` — used only where a multi-statement transaction (`BEGIN`/`COMMIT`) is required (order placement, member upsert).

### Route Structure
- `app/page.tsx` — server component; reads `cultr_club_visitor` cookie, verifies via `lib/auth.ts:verifyClubVisitorToken`, fetches matching `club_members` row, and passes `serverMember` prop into `JoinLandingClient.tsx`.
- `app/JoinLandingClient.tsx` — client component (~1,477 lines): full cart UI, carousel, signup/login modals, coupon validation, bundle discount math, checkout submit.
- `app/[slug]/route.ts` — edge handler for creator tracking links (e.g. `cultrclub.com/stewart1`). Validates `/^[a-zA-Z0-9-]{1,64}$/`, looks up `tracking_links` row, writes `click_events`, sets `cultr_attribution` cookie on `.cultrclub.com`, 302s to home or coupon-applied cart.
- `app/robots.ts` — programmatic robots.txt with explicit disallows for all known search/LLM/SEO bots, an allow-list for preview bots (iMessage, Slack, Twitter, Discord, WhatsApp, Telegram, LinkedIn, Reddit, Pinterest), and a `*: disallow: /` catch-all.
- `app/tv/` — static `/tv`, `/tv/1`, `/tv/2`, `/tv/3`, `/tv/banner`, `/tv/video-1`, `/tv/video-2` screens for in-office / signage playback.
- `app/api/club/` — six endpoints: `check-member`, `signup`, `login`, `orders`, `validate-coupon`, `event`.
- `app/api/stock/route.ts` — public product inventory lookup. Prefers `site_source = 'cultrclub'` row; falls back to legacy `join_cultrhealth` row per therapy.
- `app/api/health/route.ts` — simple health probe.

### Auth Flow
- No magic-link flow. Members identify themselves with **email + phone** via `app/api/club/login/route.ts`, which issues a 90-day signed `cultr_club_visitor` JWT via `lib/auth.ts:createClubVisitorToken`.
- The cookie holds **only the email claim** (and token type marker). All richer profile data (phone, address, age, gender) is fetched server-side from `club_members` on page load — never trusted from client storage.
- Cookies are scoped to `.cultrclub.com` via `lib/utils.ts:getCookieDomain(hostname)`.
- **Anti-enumeration:** the login endpoint returns the **same** generic response whether or not the email exists.

### Middleware (`middleware.ts`)
1. **`www.cultrclub.com` → `cultrclub.com` 301 redirect.**
2. **Crawler blackout headers** — sets `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex, nocache` on every response except for the preview-bot allow-list.
3. **Standard security headers** — `Referrer-Policy: no-referrer`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`. CSP is set separately via `next.config.js` + `public/_headers`.
4. **First-touch UTM capture** — on first visit (no `cultr_visitor_ctx` cookie), serializes UTM params + referrer + landing path into a non-HTTP-only 30-day cookie scoped to `.cultrclub.com`.

### Stealth / Anti-Indexing Stack

cultrclub.com is a **URL-only, non-discoverable** site. Blocking happens at five layers:

1. `app/robots.ts` — programmatic robots.txt.
2. `public/_headers` — Cloudflare Pages applies these headers to **static assets** (Pages drops `next.config.js` `headers()` for static routes).
3. `next.config.js` `headers()` — applies `X-Robots-Tag` and CSP to **SSR'd HTML**.
4. `middleware.ts` — final layer; enforces the preview-bot allow-list.
5. `app/layout.tsx` metadata — `robots: { index: false, follow: false, ... }` + generic `title: '—'`.

### `ADMIN_BASE_URL` env var
cultrclub-web needs to build absolute URLs pointing at the cultrhealth.com admin (email approval links, some order detail redirects). The `ADMIN_BASE_URL` env var (e.g. `https://cultrhealth.com`) is used in place of `NEXT_PUBLIC_SITE_URL` — which would incorrectly point back at the customer domain.

---

## Shared Data Model (Neon Postgres)

All three apps read/write the same database. Migrations live in this repo (`migrations/*.sql`, **76 files** including macOS duplicates). cultrclub-web never defines schema.

### Core Tables

| Table | Purpose | Migration |
|---|---|---|
| `users` | Member/patient accounts | (seeded pre-migration) |
| `subscriptions` | Stripe subscription state | (seeded pre-migration) |
| `orders` | Main-site patient orders | `002_orders_table.sql` |
| `intake_forms` / `pending_intakes` | Medical intake submissions | `008_asher_med_tables.sql`, `019_uploaded_files_patient_id.sql`, `030_remove_cascade_medical_records.sql` |
| `lmns` | Lab Management Numbers | `003_lmn_table.sql` |
| `payment_provider` | Multi-provider payment rows | `004_payment_provider.sql` |
| `stripe_idempotency` | Stripe webhook dedup | `007_stripe_idempotency.sql` |
| `rejuvenation_data` | Historical biomarker data | `005_rejuvenation_data.sql` |

### Creator Affiliate System (`009_creator_affiliate_portal.sql` + extensions)

| Table | Purpose |
|---|---|
| `creators` | Profile; status (`pending`/`active`/`paused`/`rejected`); tier; override rate; commission rate; payout method; `recruiter_id` |
| `affiliate_codes` | Coupon codes (discount type, `code_type` `membership`/`product`/`general`, usage tracking, `stripe_coupon_id` / `stripe_promotion_code_id` for sync) |
| `tracking_links` | Slug-based tracking URLs with UTM params |
| `click_events` | Click tracking with attribution tokens, session IDs, IP hashes, `converted` flag |
| `order_attributions` | Order → creator mapping. As of `062_order_attributions_discount_snapshot.sql`, includes `discount_rate` snapshot at attribution time so historical Creator ROI numbers don't drift when a coupon's current discount value is later changed. |
| `commission_ledger` | Commission records (`direct`/`override`/`adjustment`; `pending`/`approved`/`paid`/`reversed`) |
| `payouts` | Payout history |
| `admin_actions` | Audit log |
| `prelaunch_codes` | One-off prelaunch promo program (`024_prelaunch_codes.sql`) |
| `qr_scans` | QR redirect analytics (`023_qr_scans.sql`) |

### Club / cultrclub.com Tables

| Table | Purpose |
|---|---|
| `club_members` | Club signups — name, email, phone, `source`, `social_handle`, `signup_type` (membership vs products), address fields, `age`, `gender`, `coupon_code` (`057_signup_coupon_codes.sql`) |
| `club_orders` | Club orders — pipeline stages: `pending_approval` → `approved` → `invoice_sent` → `needs_payment` → `paid` → `waiting_to_ship` → `shipped` → `fulfilled`. Holds `approval_token`, `token_expires_at`, `attributed_creator_id`, `attribution_method`, `coupon_code`, `coupon_discount_usd`, tax, shipment data |

Pipeline stages + transitions must come from `lib/admin-club-orders.ts` (`PIPELINE_ORDER`, `PIPELINE_STATUSES`, `NEXT_ACTIONS`) — never hardcoded per-component.

### Shared Inventory & Storefront

| Table | Purpose |
|---|---|
| `product_inventory` | Stock status + quantity per therapy. `site_source` column partitions rows by which storefront owns them (`cultrclub` vs `join_cultrhealth`). `restocking_soon` is a 4th valid stock status alongside `in_stock`/`low_stock`/`out_of_stock`. |

### Telehealth / Consultations / EHR / Labs

| Table | Purpose |
|---|---|
| `consult_requests` | Consultation bookings (`010_consult_requests.sql`) |
| `telehealth_consultations` | Day-level consult state (`029_telehealth_consultations.sql`) |
| `memberships_email` | Membership → email mapping (`031_memberships_email.sql`) |
| `membership_shipping_address` | Shipping data for memberships (`038_membership_shipping_address.sql`) |
| `generic_ehr_identity` | EHR-agnostic identity mapping (`037_generic_ehr_identity.sql`) |
| `siphox_*` | Siphox kit lifecycle + results (`020_siphox_tables.sql`, `021`, `022`, `027_siphox_relax_fk.sql`, `039_siphox_ehr_linkage.sql`) |

### Integrations & Misc

| Table | Purpose |
|---|---|
| `quickbooks_tokens` | OAuth2 access/refresh tokens + realm (`011_quickbooks_tokens.sql`) |
| `quiz_responses` | Quiz answers + lead-capture columns (`035_quiz_responses.sql`, `056_quiz_lead_capture.sql`) |
| `waitlist` | Marketing waitlist (seeded pre-migration). `coupon_code` column added in `057_signup_coupon_codes.sql`. |
| `member_onboarding` | Post-checkout onboarding state (`040_member_onboarding.sql`) |
| `portal_sessions` | Siphox/labs portal sessions (`014_portal_sessions.sql`) |
| `cron_runs` | Cron execution history (`029_cron_runs.sql`) |
| `dosing_rules_engine` | AI dosing rules configuration (`049_dosing_rules_engine.sql`) |

### Recent Migrations (since Apr 22 2026)

| Migration | Purpose |
|---|---|
| `057_signup_coupon_codes.sql` | Adds `coupon_code` column to both `waitlist` and `club_members` to capture the coupon code surfaced during signup (used by admin for source attribution). |
| `058_add_creator_jonas_machado.sql` | Seeds creator `jonasmachaddo@gmail.com`, tracking link `jonasmachado`, primary product code `JM20` (20% off products). |
| `059_update_jonas_machado_commission.sql` | Bumps Jonas' `commission_rate` from 10% → 20%. |
| `060_fix_mary_cooper_commission.sql` | Aligns Mary Cooper's `commission_rate` with the 20% her affiliate codes have always discounted at — fixes admin display drift. |
| `061_backfill_coupon_discount_usd.sql` | Backfills `club_orders.coupon_discount_usd` for rows that were created after `052` but skipped persistence (older code paths, dismissed/cancelled states). Keeps the persisted column authoritative instead of relying on the SQL formula fallback. |
| `062_order_attributions_discount_snapshot.sql` | Adds `order_attributions.discount_rate` so historical Creator ROI numbers don't shift when a coupon's discount value later changes (e.g. STEWART1 moved 10% → 20%). `getCreatorROI` now `COALESCE(oa.discount_rate, ac.discount_value)`. |

### Cross-App Attribution Flow

1. Creator shares `cultrclub.com/stewart1` (or a code like `STEWART1`).
2. Customer lands → cultrclub-web `app/[slug]/route.ts` inserts a `click_events` row + sets `cultr_attribution` cookie on `.cultrclub.com`.
3. Customer checks out → `app/api/club/orders/route.ts` calls shared helpers in `lib/creators/attribution.ts` + `lib/creators/db.ts` to look up the cookie / coupon code and insert an `order_attributions` row. Per the **Commission Ledger Lifecycle**, club orders deliberately pass `skipCommissionLedger: true` at this stage — the commission ledger is NOT written until the order ships.
4. Admin approves via HMAC email link (or UI) on cultrhealth.com → `app/api/admin/club-orders/[orderId]/route.ts` transitions status.
5. When the order reaches **`shipped`**, the admin transition calls `recordCommissionsForShippedOrder()` — idempotent; no-op if already written.
6. 30 days later, `cron/approve-commissions` promotes eligible commissions to `approved`. For club-linked attributions it only approves if `club_orders.status IN ('shipped', 'fulfilled')`.
7. On any rollback (status change back from shipped/fulfilled, cancel, dismiss, Stripe refund), `reverseCommissionsForAttribution()` is called so creators never keep commission for reversed work.

### Retroactive Attribution
When an admin approves an order with a previously-unattributed coupon code, the system re-scans `affiliate_codes` to see if the code now belongs to an active creator and, if so, back-fills `order_attributions.attributed_creator_id`. Prevents lost commission when an internal promo code is handed off to a real affiliate.

### Owner Email Exclusion
`lib/config/owner-emails.ts` holds accounts whose orders are filtered out of admin creator-network aggregates, commission/revenue/conversion panels, coupon attribution tables, and payout batches. Stewart (`stewart@cultrhealth.com`) is deliberately **not** on the list — he operates a live creator code (STEWART1) and is expected to appear in dashboards.

---

## Cross-App Communication

| Channel | Direction | Mechanism |
|---|---|---|
| **Shared DB writes** | cultrclub.com → cultrhealth.com admin | Every club order, member signup, and attribution is a DB row the admin reads |
| **HMAC approval email** | cultrclub.com → cultrhealth.com | `app/api/club/orders/route.ts` computes HMAC-SHA256 (`WebCrypto`) over `${orderNumber}:${email}:${expiresAt}` with `JWT_SECRET` and a 48-hour TTL. Admin endpoint on cultrhealth.com verifies with `crypto.timingSafeEqual` — buffer-length equality must be checked first to avoid a `TypeError` crash. |
| **Email deep links → admin UI** | cultrclub.com / admin mail → cultrhealth.com | When email-link actions hit a missing field (e.g. shipping tracking number), the API route redirects into the UI (`?tab=club-orders&openShipping=[orderId]`) rather than returning raw JSON |
| **Cross-domain cookies** | None | `.cultrhealth.com` cookies are scoped to cultrhealth; `.cultrclub.com` cookies are scoped to cultrclub. Identity crosses the apps only via the shared DB. |
| **Tracking link authority** | cultrclub.com is primary | Creator slugs resolve at `cultrclub.com/<slug>` (edge route). cultrhealth.com's legacy `app/r/[slug]/route.ts` still serves residual clicks that land on the cultrhealth.com domain. |

### Cookie Safety Rules (from prior incidents)
- **Never** use `response.headers.append('Set-Cookie', ...)` — gets merged into a comma-separated string and Safari/Chrome silently reject. Always use `response.cookies.set()` / `response.cookies.delete()`.
- Cookie domain must be derived from the **request hostname**, not from `NEXT_PUBLIC_SITE_URL` env var.
- Session cookies ship with distinct names (`v2`) rather than trying to clear host + domain variants simultaneously.

---

## External Integration Boundaries

| Service | Purpose | Boundary file(s) |
|---|---|---|
| **Stripe** | Subscriptions + webhooks | `app/api/checkout/`, `app/api/webhook/stripe/`, idempotency via `stripe_idempotency` table |
| **Resend** | Transactional email | `lib/resend.ts` (escapeHtml, brandedEmailHeader/Footer) |
| **QuickBooks Online** | Invoices + payment recording | `lib/quickbooks.ts`, `app/api/quickbooks/{auth,callback}/`, `app/api/webhook/quickbooks/` |
| **Cloudflare Turnstile** | Bot protection on forms | `lib/turnstile.ts` |
| **AI SDK v6 + OpenAI** | Protocol generation, meal plans, AI dosing rules | `app/api/protocol/generate/`, `app/api/meal-plan/`, `lib/dosing-engine/` |
| **Curator.io** | Social feed aggregation | `components/site/CommunityFeed.tsx` |
| **Calendly** | Telehealth scheduling embed + webhook | `components/ui/CalendlyEmbed.tsx`, `app/api/webhook/calendly/` |
| **Healthie** | EHR (currently dormant; ready when Plus plan API access is enabled) | `lib/healthie/`, `app/api/webhook/healthie/` |
| **Siphox** | Lab kit fulfillment + results | `lib/siphox/`, `app/api/cron/siphox-*` |
| **Mailchimp** | Newsletter + lead sync | `lib/mailchimp.ts`, `lib/contacts.ts` |
| **AWS S3** | Presigned-URL file uploads (intake IDs, consent) | `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` |
| **Twilio** | SMS (auth helpers / portal flows) | `twilio` SDK |
| **Microsoft Clarity** | Session replay + analytics (added Apr 24 2026) | Inline script in root layout; identify wired through `app/api/track/identify/` |

External calls are wrapped in retry + circuit-breaker patterns from `lib/resilience.ts` and rate-limited via `lib/rate-limit.ts` (Upstash if `UPSTASH_REDIS_REST_*` configured, in-memory fallback otherwise).

---

## Error Handling & Compliance

**Error handling** follows `try { ... } catch (error) { console.error(...) }` + return a typed `NextResponse.json({ error }, { status })`. Internal errors never surface raw DB messages to users.

**HIPAA compliance:**
- `lib/hipaa-logger.ts` is the safe logger — never log PHI fields.
- DOMPurify sanitizes any rendered user-authored HTML/markdown before display. (Note: DOMPurify behavior on the CF Pages edge runtime is unreliable in some contexts — verify per-route on prod.)
- File uploads go through pre-signed S3 URLs with short TTLs.
- 30-minute session idle timeout enforced in middleware on all authenticated prefixes.
- Rate limiting via `lib/rate-limit.ts`.
- Resilience helpers (`lib/resilience.ts`) wrap external API calls in retry + circuit-breaker patterns.
- LegitScript surface: `ConsentModal` on checkout, `FDAStatusBadge` on therapy cards, `PrescriptionDisclaimer` on therapies + pricing, Florida-only `JURISDICTION_STATEMENT` in `lib/config/compliance.ts`, `FloridaStateGate` on regulated flows. `/science` and blog routes were removed and 301 to `/`.

---

*Architecture analysis: 2026-04-27*
