# Technology Stack

*Last updated: 2026-04-20*
*Scope: cultrhealth.com + cultrclub.com*

This document maps the technology stack across two sibling applications that share a single Neon Postgres database:

- **cultrhealth.com** — main/provider site (admin, creator portal, intake, telehealth) hosted on Vercel.
- **cultrclub.com** — standalone customer-facing product store hosted on Cloudflare Pages via `@cloudflare/next-on-pages`.

Both apps are written in TypeScript with `strict: false`, `allowJs: true`, `moduleResolution: "node"`, path alias `@/*` → project root, and share the CULTR brand tokens (forest `#2B4542`, cream `#FCFBF7`, sage, mint).

---

## cultrhealth.com Stack

**Repository:** `/Users/davidk/Documents/Dev-Projects/App-Ideas/Cultr Health Website/`
**Package name:** `cultr-waitlist` (legacy name — now the full-stack main app)

### Framework & Runtime
- **Next.js** `^14.2.0` — App Router, server components + RSC streaming
- **React** `^18.2.0` / **React-DOM** `^18.2.0`
- **Node.js** 18+ (Vercel serverless functions default)
- **TypeScript** `^5.4.0` — `tsconfig.json` with `strict: false`, `allowJs: true`, `skipLibCheck: true`, `module: "esnext"`, `moduleResolution: "node"`, target `ES2017`
- `reactStrictMode: true` in `next.config.js`

### Hosting
- **Vercel** — auto-deploys per git branch
  - `production` → cultrhealth.com (canonicalized from `*.vercel.app` via `middleware.ts`)
  - `staging` → staging.cultrhealth.com
  - `main` → base branch used for PRs
- `middleware.ts` enforces:
  - 308 redirect of `*.vercel.app` production deployments to `cultrhealth.com`
  - 404 rewrite of the legacy `join.*` subdomain host (deprecated route — see CONCERNS)
  - 30-min HIPAA idle-timeout on authenticated sessions
- `vercel.json` is absent; caching + security headers are defined in `next.config.js` (CSP, HSTS, Permissions-Policy, X-Frame-Options: DENY).

### Database Access
- **@vercel/postgres** `^0.10.0` — tagged-template `sql` client backed by Neon Postgres
- NUMERIC columns return as strings; always `Number(...)` / `parseFloat(...)` before math (see CONVENTIONS).
- Connection via `POSTGRES_URL` env var.

### Authentication
- **jose** `^6.1.3` — HS256 JWT signing/verification
- JWT secrets: `JWT_SECRET`, `SESSION_SECRET` (32+ chars)
- Four distinct user types: patients/members (magic link), providers (magic link + email allowlist), creators (separate JWT), admins (JWT + role check)
- Cookie naming: uses versioned names (e.g. `cultr_admin_return_v2`) to avoid the Vercel Edge `Set-Cookie.append()` bug

### Payments (active providers only)
- **stripe** `^20.2.0` — subscriptions, checkout, customer portal, webhooks
  - `@stripe/stripe-js` `^8.7.0`, `@stripe/react-stripe-js` `^5.6.0` (client)
- **CorePay** — Authorize.Net-backed ARB subscriptions via `lib/payments/corepay-gateway.ts`
  - Endpoint: `app/api/checkout/corepay/route.ts`
- Bitcoin / crypto via NOWPayments — removed (per CLAUDE.md Mar 30 2026)
- Affirm / Klarna / Authorize.net direct card — removed (per CLAUDE.md Mar 30 2026). SDK packages still listed in some dev docs but no runtime code paths import them.

### Email / Messaging
- **resend** `^4.0.0` — transactional email client (`lib/resend.ts`); branded header/footer helpers `brandedEmailHeader`, `brandedEmailFooter`, `EMAIL_FONT_IMPORT`
- All user-supplied strings must flow through `escapeHtml()` before interpolation (see CONVENTIONS).
- **twilio** `^5.12.2` — SMS OTP in portal login flow (`app/api/portal/send-otp/route.ts`, `verify-otp/route.ts`)
- **Mailchimp** — direct REST API integration via `lib/mailchimp.ts` (Basic auth with API key). Audience sync + tag-only operations.

### Lab / EHR / Scheduling
- **SiPhox Health** — REST API client in `lib/siphox/client.ts` (Bearer token, Zod schema validation, 6 subdomain modules: biomarkers, fulfillment, kit-lifecycle, reports)
- **Healthie** — GraphQL EHR client in `lib/healthie/` (10 files: client, mutations, queries, portal-mapper, webhooks). Staging + prod endpoints. Integration code complete but waiting on API-key activation from Healthie (per memory).
- **Calendly** — webhook handler at `app/api/webhook/calendly/route.ts` (query-param `?secret=` auth matched against `CALENDLY_WEBHOOK_SECRET`). Replaced the Healthie scheduling embed per memory Apr 12 2026.
- **Asher Med** — lib files remain (`lib/asher-med-api.ts`, `lib/config/asher-med.ts`, `lib/config/product-to-asher-mapping.ts`) but no runtime app routes call them (LegitScript removal Apr 4 2026; see CONCERNS).

### AI / Content
- **ai** `^6.0.59`, **@ai-sdk/openai** `^3.0.21`, **@ai-sdk/react** `^3.0.61` — used in `app/api/meal-plan/route.ts`, `app/api/member/dosing/explain/route.ts`, `app/api/creators/dosing/explain/route.ts`
- **@react-pdf/renderer** `^4.3.2` — invoice + LMN PDF generation (`lib/invoice/`, `lib/lmn/`)
- **gray-matter** `^4.0.3` + **marked** `^17.0.1` + **dompurify** `^3.3.1` — Markdown content (`content/library/*.md`) render pipeline with XSS sanitization

### UI / Styling
- **tailwindcss** `^3.4.3` + **@tailwindcss/typography** `^0.5.19` + **autoprefixer** `^10.4.19` + **postcss** `^8.4.38`
- **tailwind-merge** `^3.5.0` + **clsx** `^2.1.1` — composed into `cn()` in `lib/utils.ts`
- **lucide-react** `^0.563.0` (tree-shaken via `experimental.optimizePackageImports`)
- **recharts** `^3.7.0` — used only in `components/creators/AnalyticsCharts.tsx`
- **framer-motion** `^12.36.0` + **motion** `^12.36.0` — animations
- **gsap** `^3.14.2`, **three** `^0.183.2`, **simplex-noise** `^4.0.3` — hero/WavyBackground animations
- **@paper-design/shaders-react** `^0.0.71` — `MeshGradient` fullscreen shader background (`components/ui/MeshBackgroundDynamic.tsx`, `ssr: false`)
- **input-otp** `^1.4.2` — OTP input UI
- **@marsidev/react-turnstile** `^1.0.2` — Cloudflare Turnstile widget
- Fonts via `next/font/google`: **Fraunces** (serif), **Playfair Display** (display — mandatory for `CULTR`/`CULTR HEALTH` wordmarks), **Inter** (body)

### State Management
- React Context API — `CreatorContext`, `IntakeFormContext` (in `lib/contexts/` and `app/intake/`), `CartContext` (`lib/cart-context.tsx`), `JoinCartContext` (`lib/contexts/JoinCartContext.tsx` — legacy join page only)
- **jotai** `^2.19.0` — installed, used sparingly for atomic UI state
- No Redux, no Zustand, no SWR/React Query

### Form Validation
- **zod** `^3.23.0` — `lib/validation.ts` Zod schemas + server-side validation for all API inputs

### Caching / Rate Limiting
- **Upstash Redis** — optional; rate limiter in `lib/rate-limit.ts` falls back to in-memory when `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are unset

### File Storage / Uploads
- **@aws-sdk/client-s3** `^3.1019.0`, **@aws-sdk/s3-request-presigner** `^3.1019.0` — declared in `package.json` for presigned upload URLs; no direct S3Client usage in current app routes (historical use tied to Asher Med uploads).
- Current uploads flow through SiPhox and Healthie integrations directly.

### QR / PDF Generation
- **qrcode** `^1.5.4` (+ `@types/qrcode`), **sharp** `^0.34.5` — QR code scan tracking (`app/api/go/[destination]/route.ts`, migration 023)

### Other
- **uuid** `^13.0.0`, **dotenv** `^17.2.3`, **ts-node** `^10.9.2` (scripts only)

### Build & Tooling
```bash
npm run dev            # next dev
npm run build          # next build
npm run start          # next start
npm run lint           # next lint (eslint ^8.57.0 + eslint-config-next ^14.2.0)
npm run analyze        # ANALYZE=true next build (@next/bundle-analyzer ^16.1.6)
npm run setup:stripe   # ts-node scripts/setup-stripe.ts
npm run check:health   # node scripts/site-health-check.mjs
```
- `next.config.js` — `compiler.removeConsole` excludes `error`/`warn` in prod; `optimizePackageImports: ['lucide-react', 'recharts', 'zod']`; images `formats: ['image/avif', 'image/webp']`.

### Testing
- **vitest** `^4.0.18` — config at `vitest.config.js`; environment `jsdom`; setup `tests/setup.ts`; coverage v8
- **@testing-library/react** `^16.3.2`, **@testing-library/jest-dom** `^6.9.1`, **@testing-library/dom** `^10.4.1`
- **@vitejs/plugin-react** `^5.1.2`, **jsdom** `^27.4.0`
- **@playwright/test** `^1.58.2` — E2E (projects: Desktop Chrome/Safari, Mobile Chrome/Safari); scripts `test:e2e`, `test:e2e:join`, `test:e2e:admin`, `test:e2e:visual`, `test:e2e:mobile`, `test:e2e:webkit`

---

## cultrclub.com Stack

**Repository:** `/Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/`
**Package name:** `cultrclub-web`

### Framework & Runtime
- **Next.js** `15.5.2` (note: ahead of the main app's 14.x)
- **React** `^18.3.0` / **React-DOM** `^18.3.0`
- **TypeScript** `^5.4.0` — `tsconfig.json` with `strict: false`, `allowJs: true`, `module: "esnext"`, `moduleResolution: "node"`, target `ES2017`, path alias `@/*` → project root
- **`export const runtime = 'edge'`** declared on every route file — required for Cloudflare Pages Workers. Verified in:
  - `app/page.tsx`
  - `app/robots.ts`
  - `app/[slug]/route.ts`
  - `app/api/stock/route.ts`
  - `app/api/health/route.ts`
  - `app/api/club/login/route.ts`
  - `app/api/club/signup/route.ts`
  - `app/api/club/orders/route.ts`
  - `app/api/club/event/route.ts`
  - `app/api/club/check-member/route.ts`
  - `app/api/club/validate-coupon/route.ts`

### Hosting
- **Cloudflare Pages** (Workers runtime)
- **@cloudflare/next-on-pages** `^1.13.0` — Next.js adapter; build script `build:cf` runs `npx @cloudflare/next-on-pages@1`
- **wrangler** `^4.81.0` (devDep) — preview + deploy CLI
- `wrangler.toml`:
  ```toml
  name = "cultrclub"
  compatibility_date = "2024-09-23"
  compatibility_flags = ["nodejs_compat"]
  pages_build_output_dir = ".vercel/output/static"
  ```
- **`nodejs_compat`** flag is critical — it's what makes `jose`, `crypto.subtle`, and `Buffer` work on Cloudflare Workers
- Deploy scripts (from `package.json`):
  - `deploy:staging` → `wrangler pages deploy .vercel/output/static --branch=staging`
  - `deploy:prod` → `wrangler pages deploy .vercel/output/static --branch=main`
- Preview: `wrangler pages dev .vercel/output/static`

### Cloudflare Pages Peculiarities
- `next.config.js` `headers()` runs in Node at build time on Pages — **static asset headers must be duplicated in `public/_headers`** (see `public/_headers`).
- Middleware (`middleware.ts`) handles header injection for SSR'd responses because `next.config.js` `headers()` output is not always honored on Pages Worker responses.
- `next.config.js` disables Next image optimization: `images: { unoptimized: true }` (required — Cloudflare Pages has no Next image optimizer).

### Database Access
- **@neondatabase/serverless** `^0.9.0` — HTTP-based Neon client (no TCP, works on Workers)
- `lib/db.ts` wraps `neon(POSTGRES_URL, { fullResults: true })` in a lazy Proxy so the connection is only opened at request time. `fullResults: true` is **critical** — returns `{ rows, rowCount, command, fields }` matching `@vercel/postgres` result shape so both codebases' SQL patterns stay compatible.
- Exports both the tagged-template `sql` client and a `createPool()` factory (uses `Pool` for pg-compatible transactions).
- Custom `DatabaseError` class.

### Authentication
- **jose** `^6.1.3` — HS256 JWT `club_visitor` token (90-day expiry) in `lib/auth.ts`
- Secrets: `SESSION_SECRET` || `JWT_SECRET` fallback. Token payload: `{ email, type: 'club_visitor' }`.
- Cookie `cultr_visitor_ctx` on the `.cultrclub.com` domain for UTM first-touch tracking (set in `middleware.ts`).

### Payments
- **stripe** `^22.0.1` — server-side SDK (note: ahead of main app's 20.x)
- No direct `@stripe/stripe-js` client package — checkout is server-initiated (Stripe Checkout redirect).

### Email
- **resend** `^4.0.0` — `lib/resend.ts` with branded email helpers (header/footer/font import). Same `escapeHtml()` sanitization contract as the main app.
- **Mailchimp** — `lib/mailchimp.ts` uses `crypto.subtle.digest('MD5', ...)` (Web Crypto, not Node `crypto`) to compute subscriber hash — Worker-safe. Upsert + tag operations identical in shape to the main app's Mailchimp helper.

### UI / Styling
- **tailwindcss** `^3.4.3` + **@tailwindcss/typography** `^0.5.0` + **autoprefixer** `^10.4.19` + **postcss** `^8.4.38`
- **tailwind-merge** `^3.4.0` + **clsx** `^2.1.1` — shared `cn()` utility in `lib/utils.ts`
- **lucide-react** `^0.563.0`
- **framer-motion** `^11.0.0` (note: main app runs `^12.x`)
- **@marsidev/react-turnstile** `^1.0.2`
- Fonts via `next/font/google`: **Fraunces**, **Playfair Display**, **Inter** (same set as main app; brand consistency)

### State Management
- React Context — `lib/contexts/JoinCartContext.tsx` (useReducer + localStorage persistence)
- No jotai, no Redux

### Routing
- Single marketing/commerce page at `app/page.tsx` (+ `JoinLandingClient.tsx`) serving the cultrclub.com landing + cart
- Dynamic tracking redirect: `app/[slug]/route.ts` (GET) — handles creator-affiliate tracking links, sets attribution cookie, redirects to destination
- `app/robots.ts` — edge-runtime robots.txt generator (returns blanket `noindex, nofollow`)
- `app/tv/{1,2,3,banner,video-1,video-2}` — static TV ad landing pages
- Admin ops, creator portal, intake, and members dashboard **do not live here** — those are all served by the main `cultrhealth.com` app.

### Middleware (`middleware.ts`)
- 301 `www.cultrclub.com` → `cultrclub.com`
- Injects `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex, nocache` on all SSR responses **except** for known link-preview bots (iMessage, Slack, Twitter, Discord, LinkedIn, Pinterest, WhatsApp, etc.) so link previews still render thumbnails.
- Sets `Referrer-Policy: no-referrer`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff` on every response.
- First-touch UTM capture: writes `cultr_visitor_ctx` cookie on `.cultrclub.com` with `{s, m, c, t, n, r, l, ts}` payload (source/medium/campaign/term/content/referrer/landing/timestamp).
- Matcher excludes `api`, `_next/static`, `_next/image`, `favicon.ico`.

### Security Headers
- Dual-layer: `public/_headers` (static assets, Cloudflare-native) + `next.config.js` `headers()` (Worker responses when honored) + middleware (always applied).
- CSP: tight allow-list — `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com`; `frame-src 'self' https://challenges.cloudflare.com` (no Stripe frames because checkout redirects, no Calendly/Healthie frames because club has no scheduling).
- Stealth posture: blanket `noindex, nofollow, noarchive, nosnippet` at HTTP layer + HTML `<meta>` + `robots.ts` + `_headers`. `<title>` intentionally set to `—` so browser tabs / non-preview crawlers don't see brand.

### Build & Tooling
```bash
npm run dev              # next dev (local, Node runtime)
npm run build            # next build (standard Next output)
npm run build:cf         # @cloudflare/next-on-pages — generates .vercel/output/static
npm run preview          # wrangler pages dev .vercel/output/static
npm run deploy:staging   # wrangler pages deploy ... --branch=staging
npm run deploy:prod      # wrangler pages deploy ... --branch=main
```
- No ESLint config in `devDependencies` — relies on `next dev` warnings only.
- No Vitest / Playwright — no test suite in this repo.

### Testing
- None configured in `cultrclub-web/`. E2E/smoke coverage for cultrclub.com flows lives in the main repo's `tests/smoke/` and `e2e/` (Playwright).

---

## Shared / Cross-App

### Database (single Neon Postgres instance)
Both apps read/write the same tables via `POSTGRES_URL`. Key shared tables (migrations in `Cultr Health Website/migrations/`):

| Table | Notes |
|---|---|
| `users`, `memberships`, `member_onboarding` | Shared member identity (migration 031, 040) |
| `club_members`, `club_orders` | Club signups + orders (migrations 010, 012, 015, 017, 018, 028, 032, 033, 052) |
| `product_inventory` | `site_source` column (migration 053) distinguishes `cultrclub` vs `join_cultrhealth`; composite unique `(therapy_id, site_source)` — cultrclub orders filter `COALESCE(site_source, 'join_cultrhealth') = 'cultrclub'` (`app/api/club/orders/route.ts`) |
| `creators`, `affiliate_codes`, `tracking_links`, `click_events`, `order_attributions`, `commission_ledger`, `payouts` | Creator affiliate system (migration 009 + extensions 013, 018, 024, 025, 026, 030, 036, 041, 042, 046, 047) — written to by **both** cultrhealth admin and cultrclub checkout + tracking |
| `quiz_responses` | Quiz leads (migration 035, 056) — written by main app |
| `visitor_tracking` | UTM first-touch + session data (migration 045) |
| `quickbooks_tokens` | OAuth storage (migration 011) — main app only |
| `stripe_idempotency` | Dedupe webhook replays (migration 007) |
| `siphox_*` | SiPhox kit lifecycle (migrations 020-022, 027, 039) — main app only |
| `telehealth_consultations` | Cal.com + Daily.co bookings (migration 029) — main app only |
| `dosing_rules`, `dosing_rules_engine` | Protocol builder rules (migration 049) — main app only |
| `admin_actions` | Audit log for all admin mutations |
| `qr_scans` | QR redirect tracking (migration 023) — main app only |
| `prelaunch_codes` | One-time launch coupons (migration 024) |
| `cron_runs` | Cron execution history (migration 029) |

### Shared Brand Tokens
- Identical `tailwind.config.ts` color palette + typography stack in both repos (`brand-primary #2B4542`, `cream #FCFBF7`, sage, mint, aura-*, cultr-* legacy aliases).
- Shared Google Fonts: Fraunces + Playfair Display + Inter.
- `cn()` utility (clsx + tailwind-merge) duplicated in each repo's `lib/utils.ts`.

### Shared Business-Logic Patterns
- Both repos implement `validateCouponUnified()` in their `lib/config/coupons.ts` — checks built-in staff/company `CLUB_COUPONS` first, then DB-backed `affiliate_codes`. Built-in coupon values shadow DB rows (per CLAUDE.md "Join coupon precedence").
- Both repos implement the same creator-attribution cookie model (`cultr_attribution` on `.cultrhealth.com` / `.cultrclub.com`, 30-day window, signed token). Each writes `click_events` and `order_attributions` to the shared DB.
- HMAC-signed approval tokens for club-order status transitions (30-min expiry; use `crypto.timingSafeEqual` with buffer-length check).

### Shared Authentication Model (Cross-Domain)
- Cookie domain set per request hostname — **never from `NEXT_PUBLIC_SITE_URL` env** (per CLAUDE.md Cloudflare Pages gotcha).
- No single SSO — each app issues its own JWT cookie (`cultr_session`, `cultr_creator_session`, `cultr_admin_session`, `cultr_visitor_ctx`, `cultr_club_visitor`).
- `cultrclub.com` club login mints a minimal `club_visitor` JWT (90d) scoped to email recovery only. Full member profile data is **never** serialized into client-readable cookies or localStorage.

### Shared External Vendors
- Neon Postgres (primary data store)
- Resend (transactional email)
- Stripe (payments / customer portal)
- Cloudflare Turnstile (bot protection)
- Mailchimp (marketing audience sync)

---

## Version Drift Between Apps

| Package | cultrhealth.com | cultrclub.com |
|---|---|---|
| `next` | `^14.2.0` | `15.5.2` |
| `react` / `react-dom` | `^18.2.0` | `^18.3.0` |
| `stripe` | `^20.2.0` | `^22.0.1` |
| `framer-motion` | `^12.36.0` | `^11.0.0` |
| `tailwind-merge` | `^3.5.0` | `^3.4.0` |
| Postgres client | `@vercel/postgres ^0.10.0` (TCP pool) | `@neondatabase/serverless ^0.9.0` (HTTP) |

Version drift is intentional: the Cloudflare Workers runtime constrains cultrclub.com to Edge-compatible packages, while the main app uses the broader Node 18 Vercel runtime. Keep this drift explicit — do not assume a package in one repo exists in the other.
