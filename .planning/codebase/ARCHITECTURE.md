# Architecture

*Last updated: 2026-04-20*
*Scope: cultrhealth.com + cultrclub.com*

## System Overview

CULTR runs as **two sibling Next.js applications** that share a single **Neon Postgres** database. The apps are deployed to different platforms and serve different traffic profiles.

| Domain | Repo | Platform | Role |
|---|---|---|---|
| `cultrhealth.com` | `Cultr Health Website/` | Vercel | Marketing site, patient intake, member library, provider tools, creator affiliate portal, admin panel, telehealth, compliance |
| `cultrclub.com` | `cultrclub-web/` | Cloudflare Pages | Standalone customer-facing CULTR Club storefront — stealth (noindex), URL-only access |

Both apps are Next.js 14+ App Router with TypeScript and Tailwind, and both talk to the same Neon Postgres instance. **There is no live cross-subdomain rewriting today**: each app owns its hostname and cookies. The only cross-app surface is the shared DB and a small number of **HMAC-signed email deep links** (from cultrclub → admin approvals on cultrhealth).

```
                     ┌─────────────────────────┐
                     │   Neon Postgres (DB)    │
                     │  single shared instance │
                     └──────────┬──────────────┘
                                │
            ┌───────────────────┴───────────────────┐
            │                                       │
   ┌────────▼──────────┐                  ┌─────────▼───────────┐
   │  cultrhealth.com  │   HMAC email     │   cultrclub.com     │
   │     (Vercel)      │◄─────link─────── │  (Cloudflare Pages) │
   │                   │    approvals     │                     │
   │  Admin + Creators │                  │   Customer Store    │
   │  Intake + Members │                  │   (stealth site)    │
   │  Telehealth + Rx  │                  │                     │
   └───────────────────┘                  └─────────────────────┘
```

---

## cultrhealth.com Architecture

### Framework & Runtime
- **Next.js 14** App Router on **Vercel** (Node.js runtime).
- **TypeScript** (`strict: false`, `allowJs: true`, `moduleResolution: "node"`).
- Path alias `@/*` → project root.
- Global security headers + CSP configured in `next.config.js`.
- `reactStrictMode: true`, `removeConsole` in production (preserves `error`/`warn`).

### Server vs Client Component Split
- Pages are **server components by default**. Interactive logic is pulled into `*Client.tsx` siblings.
- Homepage (`app/page.tsx`, 511 lines) is a server component that builds sections inline and uses `next/dynamic` for below-fold lazy loads (PricingCard, FAQAccordion, ClubBanner, NewsletterSignup).
- Auth-gated pages fetch session state server-side, then hydrate client contexts (`CreatorContext`, `JoinCartContext`, intake contexts) for interactive state.
- File convention: `Page.tsx` (server) + `PageClient.tsx` (client). Examples: `app/quiz/QuizClient.tsx`, `app/intake/IntakeFormClient.tsx`, `app/members/shop/ShopClient.tsx`, `app/admin/*/AdminClient.tsx`.

### Auth Flows

Four distinct auth tracks, each with its own JWT namespace and cookie:

| Track | Entry | Cookie / Token | Gate |
|---|---|---|---|
| **Patients / members** | `app/login/` | `cultr_session_v2` + `cultr_last_activity_v2` (JWT via `jose`, HS256) | Issued after magic link through `app/api/auth/magic-link/route.ts` → `app/api/auth/verify/route.ts` |
| **Creators** | `app/creators/login/` | Separate creator JWT; issued by `app/api/creators/magic-link/route.ts` + `app/api/creators/verify-login/route.ts` | Additional `app/api/creators/verify-email/route.ts` for email confirmation links |
| **Admins** | `app/admin/` | Same `cultr_session_v2` cookie + admin role lookup on every request | `requireAdmin()` helper; `app/api/admin/restore-session/route.ts` handles the "Login As" masquerade round-trip (uses `cultr_admin_return_v2` cookie) |
| **Providers** | `app/login/` | Patient JWT + email allowlist check | `PROTOCOL_BUILDER_ALLOWED_EMAILS` env var; gates `app/provider/*` + protocol builder routes |

Magic-link issuance uses `lib/resend.ts`. JWT utilities live in `lib/auth.ts`. Portal-specific session logic (Siphox/lab portal) lives in `lib/portal-auth.ts` and `lib/portal-db.ts`.

### API Route Organization (118 `route.ts` files under `app/api/`)

| Category | Location | Responsibilities |
|---|---|---|
| **Auth** | `app/api/auth/` | Magic link send/verify, logout, dev-login bypass (staging only) |
| **Checkout** | `app/api/checkout/` | Stripe subscription, one-off product, CorePay |
| **Webhooks** | `app/api/webhook/{stripe,quickbooks,healthie,calendly}/` | Signed webhook handlers — signature verification + idempotency via `stripe_idempotency` table |
| **Creators** | `app/api/creators/` | Apply, magic-link, verify, dashboard, profile, links, codes, network, payouts, earnings, leaderboard, labs, dosing, support, results |
| **Admin** | `app/api/admin/` | analytics, asher-dashboard, club-members, club-orders, creators (approve/reject/codes/payouts), customers, dosing-rules, intakes, inventory, members, orders, prelaunch-codes, qr-scans, restore-session, siphox-smoke, cron-status |
| **Club** | `app/api/club/` | Internal mirror of cultrclub.com endpoints (check-member, event, login, orders, signup, validate-coupon) for admin flows and the legacy `/join` page |
| **Intake** | `app/api/intake/submit/` | Submit medical intake form |
| **LMN** | `app/api/lmn/` | Lab Management Number generation / listing / detail |
| **Member** | `app/api/member/` | Member-scoped reads (profile, orders, files, labs, medical-records, results, transactions, dosing) |
| **Portal (labs)** | `app/api/portal/` | Siphox portal auth (send-otp/verify-otp/refresh/logout) + labs/results/documents/orders/profile/stacking-content |
| **Quickbooks** | `app/api/quickbooks/{auth,callback}/` | OAuth2 flow for invoice integration |
| **Track** | `app/api/track/` | Creator click, daily health tracking, QR scan capture |
| **Quiz** | `app/api/quiz/submit/` | Quiz submission + PATCH lead-mirror into `waitlist` (requires `::text` cast on email in CASE WHEN per memory) |
| **Onboarding** | `app/api/onboarding/status/` | Post-checkout onboarding state |
| **Misc** | `app/api/{waitlist,quote,stock,supplement-order,meal-plan,protocol}/` | Waitlist signup, quote generator, inventory lookup, supplement reorders, AI meal plans, AI protocol generation |
| **Cron** | `app/api/cron/` | Scheduled jobs (see below) |

### Cron Jobs (`vercel.json`)

| Path | Schedule | Purpose |
|---|---|---|
| `/api/cron/siphox-fulfillment` | `*/15 * * * *` | Pull Siphox kit fulfillment status |
| `/api/cron/siphox-results` | `0 * * * *` | Hourly Siphox lab-results sync |
| `/api/cron/siphox-status-sync` | `*/30 * * * *` | Siphox order status sync |
| `/api/cron/approve-commissions` | `0 2 * * *` | Promote eligible commissions to `approved` after 30-day refund window; revert self-referrals |
| `/api/cron/update-tiers` | `0 3 * * *` | Recompute creator tier based on active recruit count |
| `/api/cron/stale-orders` | `0 12 * * *` | Flag / clean up orders stuck in intermediate states |
| `/api/cron/asher-sync` | *(unscheduled)* | Historical Asher Med integration (Asher Med fully removed Apr 4 2026) |

All cron handlers authenticate with `Authorization: Bearer $CRON_SECRET`. Each invocation is wrapped in `startCronRun()` from `lib/cron-logger.ts` which writes to the `cron_runs` table (migration `029_cron_runs.sql`).

### Middleware (`middleware.ts`)

The root middleware handles HIPAA-grade idle timeout and canonical-host redirects. It does **not** perform any live subdomain rewriting for a join host — that infrastructure is shut down and the shim below simply 404s any residual traffic.

Responsibilities:
1. **Canonical host redirect** — any `*.vercel.app` production deployment 308s to `https://cultrhealth.com`.
2. **Legacy host / path 404 shim** — any request whose host matches the decommissioned `join.*` pattern (or whose path starts with `/join` on a non-local host) is rewritten to `/not-found`. This is cleanup for DNS residue, not an architectural routing layer.
3. **Session idle timeout** — on authenticated route prefixes (`/members`, `/intake`, `/dashboard`, `/admin`, `/provider`, `/creators/portal`, `/api/member`, `/api/intake`, `/api/admin`, `/api/provider`, `/api/creators`), checks `cultr_last_activity_v2` cookie. If >30 min stale, clears both session cookies (honoring `.cultrhealth.com` domain suffix so production ghost sessions can't resurrect) and redirects to the right login (`/creators/login` for creator portal, `/login` otherwise).
4. **Activity heartbeat** — for authenticated sessions inside the window, refreshes `cultr_last_activity_v2` on every request.

### Deployment Flow

| Git branch | Vercel environment | URL |
|---|---|---|
| `production` | Production | `https://cultrhealth.com` |
| `staging` | Preview (Staging) | `https://staging.cultrhealth.com` |
| `main` | Base branch for PRs — **deploy disabled** in `vercel.json` | — |

`vercel.json` explicitly sets `git.deploymentEnabled.main = false` and `.master = false` to prevent accidental deploys. Production promotion is done via `git cherry-pick` onto `production` (the `production` branch has diverged SHAs from `staging` even when commit titles match — never force-push).

---

## cultrclub.com Architecture

### Framework & Runtime
- **Next.js 15.5.2** App Router on **Cloudflare Pages** via `@cloudflare/next-on-pages`.
- Every route opts into **`export const runtime = 'edge'`** — a build requirement because Cloudflare Pages cannot run Node.js routes.
- `wrangler.toml` sets `compatibility_flags = ["nodejs_compat"]` — resolves Node `crypto` / `Buffer` polyfills for edge code.
- `next.config.js` sets `images.unoptimized: true` (Cloudflare Pages has no Next Image optimizer).
- Fonts: Fraunces, Playfair Display, Inter (same trio as cultrhealth.com).

### Database Access
- Uses **`@neondatabase/serverless`** (`neon()`), **not** `@vercel/postgres`.
- `lib/db.ts` wraps `neon(POSTGRES_URL, { fullResults: true })` in a lazy-init `Proxy` so the function supports both tagged-template calls and `.query()`-style use while only initializing when `POSTGRES_URL` is set.
- `fullResults: true` is **mandatory** — it makes the result shape `{ rows, rowCount, command, fields }` compatible with the `@vercel/postgres` code paths that are mirrored in `lib/creators/*` (shared helpers copied from cultrhealth.com).
- A WebSocket-transport `Pool` is exported via `createPool()` — used only where a multi-statement transaction (`BEGIN`/`COMMIT`) is required (order placement, member upsert).

### Route Structure
- `app/page.tsx` — server component; reads `cultr_club_visitor` cookie, verifies via `lib/auth.ts:verifyClubVisitorToken`, fetches matching `club_members` row, and passes `serverMember` prop into `JoinLandingClient.tsx`. This is the **SSR recognition flow** so known members skip the signup modal even if localStorage was cleared.
- `app/JoinLandingClient.tsx` (1,477 lines) — client component: full cart UI, carousel, signup/login modals, coupon validation, bundle discount math, checkout submit.
- `app/[slug]/route.ts` — edge handler for creator tracking links (e.g. `cultrclub.com/stewart1`). Validates `/^[a-zA-Z0-9-]{1,64}$/`, looks up `tracking_links` row, writes `click_events`, sets `cultr_attribution` cookie on `.cultrclub.com`, 302s to home or coupon-applied cart.
- `app/robots.ts` — programmatic robots.txt with explicit disallows for all known search/LLM/SEO bots, an allow-list for preview bots (iMessage, Slack, Twitter, Discord, WhatsApp, Telegram, LinkedIn, Reddit, Pinterest), and a `*: disallow: /` catch-all.
- `app/tv/` — static `/tv`, `/tv/1`, `/tv/2`, `/tv/3`, `/tv/banner`, `/tv/video-1`, `/tv/video-2` screens for in-office / signage playback.
- `app/api/club/` — six endpoints: `check-member`, `signup`, `login`, `orders`, `validate-coupon`, `event`.
- `app/api/stock/route.ts` — public product inventory lookup. Prefers `site_source = 'cultrclub'` row; falls back to legacy `join_cultrhealth` row per therapy.
- `app/api/health/route.ts` — simple health probe.

### Auth Flow
- No magic-link flow. Members identify themselves with **email + phone** via `app/api/club/login/route.ts`, which issues a 90-day signed `cultr_club_visitor` JWT via `lib/auth.ts:createClubVisitorToken`.
- The cookie holds **only the email claim** (and token type marker). All richer profile data (phone, address, age, gender) is fetched server-side from `club_members` on page load — never trusted from client storage.
- On the customer domain, cookies are scoped to `.cultrclub.com` via `lib/utils.ts:getCookieDomain(hostname)`.
- **Anti-enumeration:** the login endpoint returns the **same** generic response whether or not the email exists, so attackers can't use it as a member-existence probe.

### Middleware (`middleware.ts`)
Runs on every non-API, non-`_next/static`, non-`_next/image`, non-`favicon.ico` request. Responsibilities:
1. **`www.cultrclub.com` → `cultrclub.com` 301 redirect** (canonical apex; keeps only one hostname in CT logs / passive DNS).
2. **Crawler blackout headers** — on every response except well-known preview bots, sets `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex, nocache`.
3. **Standard security headers** — `Referrer-Policy: no-referrer`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`. CSP is set separately via `next.config.js` + `public/_headers`.
4. **First-touch UTM capture** — on first visit (no `cultr_visitor_ctx` cookie), serializes UTM params + referrer + landing path into a non-HTTP-only 30-day cookie scoped to `.cultrclub.com`.

### Stealth / Anti-Indexing Stack

cultrclub.com is a **URL-only, non-discoverable** site. Blocking happens at five layers so that bots ignoring one are caught by another:

1. `app/robots.ts` — programmatic robots.txt.
2. `public/_headers` — Cloudflare Pages applies these headers to **static assets** (Pages drops `next.config.js` `headers()` output for static routes — key gotcha).
3. `next.config.js` `headers()` — applies `X-Robots-Tag` and CSP to **SSR'd HTML**.
4. `middleware.ts` — final layer; enforces the preview-bot allow-list so iMessage/Slack previews still render thumbnails.
5. `app/layout.tsx` metadata — `robots: { index: false, follow: false, ... }` + generic `title: '—'` so browser tabs / anti-preview scrapers don't leak the brand.

### `ADMIN_BASE_URL` env var
cultrclub-web needs to build absolute URLs pointing at the cultrhealth.com admin (email approval links, some order detail redirects). The `ADMIN_BASE_URL` env var (e.g. `https://cultrhealth.com`) is used in place of `NEXT_PUBLIC_SITE_URL` — which would incorrectly point back at the customer domain.

### Deployment Flow

| Git branch | Cloudflare Pages env | URL |
|---|---|---|
| `main` | Production | `https://cultrclub.com` (www → apex 301) |
| `staging` | Preview | `https://staging.cultrclub.com` |

Build command: `npm run build:cf` → `npx @cloudflare/next-on-pages@1` → writes `.vercel/output/static` → `npx wrangler pages deploy .vercel/output/static --branch=<name>`.

---

## Shared Data Model (Neon Postgres)

Both apps read/write the same database. Migrations live in the `cultrhealth.com` repo (`migrations/*.sql`, ~60 files). cultrclub-web never defines schema.

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
| `creators` | Profile; status (`pending`/`active`/`paused`/`rejected`); tier; override rate; payout method; `recruiter_id` |
| `affiliate_codes` | Coupon codes (discount type, `code_type` `membership`/`product`/`general`, usage tracking, `stripe_coupon_id` / `stripe_promotion_code_id` for sync) |
| `tracking_links` | Slug-based tracking URLs with UTM params |
| `click_events` | Click tracking w/ attribution tokens, session IDs, IP hashes, `converted` flag |
| `order_attributions` | Order → creator mapping (`method`: `link_click`/`coupon_code`/`manual`; records `codeId`, `codeType`, `isSelfReferral`) |
| `commission_ledger` | Commission records (`direct`/`override`/`adjustment`; `pending`/`approved`/`paid`/`reversed`) |
| `payouts` | Payout history |
| `admin_actions` | Audit log |
| `prelaunch_codes` | One-off prelaunch promo program (`024_prelaunch_codes.sql`) |
| `qr_scans` | QR redirect analytics (`023_qr_scans.sql`) |

### Club / cultrclub.com Tables

| Table | Purpose |
|---|---|
| `club_members` | Club signups — name, email, phone, `source`, `social_handle`, `signup_type` (membership vs products), address fields, `age`, `gender` |
| `club_orders` | Club orders — pipeline stages: `pending_approval` → `approved` → `needs_payment` → `paid` → `fulfilled` → `shipped` → `delivered`. Holds `approval_token`, `token_expires_at`, `attributed_creator_id`, `attribution_method`, `coupon_code`, `coupon_discount_usd`, tax, shipment data |

Relevant migrations: `010_club_orders.sql`, `012_club_orders_coupon.sql`, `015_club_orders_tax.sql`, `017_club_member_address.sql`, `018_club_orders_attribution.sql`, `027_member_creator_age_gender.sql`, `028_club_orders_token_expiry.sql`, `032_club_orders_shipment.sql`, `033_club_order_fulfillment.sql`, `045_visitor_tracking.sql`, `052_club_orders_coupon_discount_usd.sql`.

Pipeline stages + transitions must come from `lib/admin-club-orders.ts` (`PIPELINE_ORDER`, `PIPELINE_STATUSES`) — never hardcoded per-component.

### Shared Inventory & Storefront

| Table | Purpose |
|---|---|
| `product_inventory` | Stock status + quantity per therapy; `site_source` column partitions rows by which storefront owns them (`cultrclub` vs `join_cultrhealth`) |

Migrations: `034_product_inventory.sql`, `043_add_bac_water_inventory.sql`, `044_seed_shop_product_inventory.sql`, `048_add_igf1_lr3_inventory.sql`, `051_add_restocking_soon_status.sql` (adds `restocking_soon` to the `stock_status` CHECK constraint), `053_inventory_site_source.sql` (composite unique `(therapy_id, site_source)`), `055_seed_current_shop_inventory.sql`.

### Telehealth / Consultations / EHR / Labs

| Table | Purpose |
|---|---|
| `consult_requests` | Consultation bookings (`010_consult_requests.sql`) |
| `telehealth_consultations` | Day-level consult state (`029_telehealth_consultations.sql`) |
| `memberships_email` | Membership → email mapping (`031_memberships_email.sql`) |
| `membership_shipping_address` | Shipping data for memberships (`038_membership_shipping_address.sql`) |
| `generic_ehr_identity` | EHR-agnostic identity mapping (`037_generic_ehr_identity.sql`) |
| `siphox_*` | Siphox kit lifecycle + results (`020_siphox_tables.sql`, `021_siphox_fulfillment_columns.sql`, `022_siphox_results_notification.sql`, `027_siphox_relax_fk.sql`, `039_siphox_ehr_linkage.sql`) |

### Integrations & Misc

| Table | Purpose |
|---|---|
| `quickbooks_tokens` | OAuth2 access/refresh tokens + realm (`011_quickbooks_tokens.sql`) |
| `quiz_responses` | Quiz answers + lead-capture columns (`035_quiz_responses.sql`, `056_quiz_lead_capture.sql`) |
| `waitlist` | Marketing waitlist (seeded pre-migration) |
| `member_onboarding` | Post-checkout onboarding state (`040_member_onboarding.sql`) |
| `portal_sessions` | Siphox/labs portal sessions (`014_portal_sessions.sql`) |
| `cron_runs` | Cron execution history (`029_cron_runs.sql`) |
| `dosing_rules_engine` | AI dosing rules configuration (`049_dosing_rules_engine.sql`) |
| `invoice_sent_at` | Invoice delivery timestamp (`050_invoice_sent_at.sql`) |

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
| **HMAC approval email** | cultrclub.com → cultrhealth.com | `app/api/club/orders/route.ts` computes an HMAC-SHA256 (`WebCrypto`) over `${orderNumber}:${email}:${expiresAt}` with `JWT_SECRET` and a 48-hour TTL. Admin endpoint on cultrhealth.com verifies with `crypto.timingSafeEqual` — buffer-length equality must be checked first to avoid a `TypeError` crash. |
| **Email deep links → admin UI** | cultrclub.com / admin mail → cultrhealth.com | When email-link actions hit a missing field (e.g. shipping tracking number), the API route redirects into the UI (`?tab=club-orders&openShipping=[orderId]`) rather than returning raw JSON |
| **Cross-domain cookies** | None | `.cultrhealth.com` cookies are scoped to cultrhealth; `.cultrclub.com` cookies are scoped to cultrclub. Identity crosses the apps only via the shared DB. |
| **Tracking link authority** | cultrclub.com is primary | Creator slugs resolve at `cultrclub.com/<slug>` (edge route). cultrhealth.com's legacy `app/r/[slug]/route.ts` still serves direct creator-link clicks that land on the cultrhealth.com domain. |

### Cookie Safety Rules (from prior incidents)
- **Never** use `response.headers.append('Set-Cookie', ...)` on Vercel — it gets merged into a comma-separated string and Safari/Chrome silently reject. Always use `response.cookies.set()` / `response.cookies.delete()`.
- Cookie domain must be derived from the **request hostname**, not from `NEXT_PUBLIC_SITE_URL` env var.
- Session cookies ship with distinct names (`v2`) rather than trying to clear host + domain variants simultaneously.

---

## Deployment Architecture

| App | Git Branch | Environment | URL | Notes |
|---|---|---|---|---|
| cultrhealth.com | `production` | Vercel Production | `https://cultrhealth.com` | Cherry-pick-only promotion; never force-push |
| cultrhealth.com | `staging` | Vercel Preview | `https://staging.cultrhealth.com` | Full app incl. admin; staging auth bypass for test emails |
| cultrhealth.com | `main` | — (disabled) | — | `vercel.json` forbids deploys; used only for PR base |
| cultrclub.com | `main` | Cloudflare Pages Production | `https://cultrclub.com` (www→apex 301) | `@cloudflare/next-on-pages`, edge runtime everywhere |
| cultrclub.com | `staging` | Cloudflare Pages Preview | `https://staging.cultrclub.com` | Same build; different env vars |

**Critical deploy rules:**
- **Never** use `vercel --prod` from a terminal — the CLI deploys the local working directory, not the branch. Production deploys happen via git push to the `production` branch or via the Vercel dashboard's "Promote to Production" action.
- **Never** force-push to `production` on cultrhealth.com. The `production` branch's commit SHAs legitimately diverge from `staging` even when titles match.
- Cloudflare Pages deploys with `@cloudflare/next-on-pages` — Next.js headers config in `next.config.js` is **dropped for static routes**; the `_headers` file + middleware carry those headers.
- Neon DB connection string is set in both Vercel (`POSTGRES_URL`) and Cloudflare Pages (`POSTGRES_URL`). The serverless driver is HTTPS-fetch based, not WebSocket, so edge routes work natively.

---

## Error Handling & Compliance

**Error handling** follows `try { ... } catch (error) { console.error(...) }` + return a typed `NextResponse.json({ error }, { status })`. Internal errors never surface raw DB messages to users.

**HIPAA compliance:**
- `lib/hipaa-logger.ts` (cultrhealth.com) is the safe logger; never log PHI fields.
- DOMPurify sanitizes any rendered user-authored HTML/markdown before display.
- File uploads go through pre-signed URLs with short TTLs.
- 30-minute session idle timeout enforced in middleware on all authenticated prefixes.
- Rate limiting via `lib/rate-limit.ts` (Upstash Redis if configured, in-memory fallback otherwise).
- Resilience helpers (`lib/resilience.ts`) wrap external API calls in retry + circuit-breaker patterns.

---

*Architecture analysis: 2026-04-20*
