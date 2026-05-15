# Codebase Concerns

**Analysis Date:** 2026-05-15

---

## Tech Debt

**Legacy Repo Status (Critical Context):**
- Issue: This repo (`Cultr Health Website`) is the Vercel-era staging/workbench repo. Active production is served from the sibling repos `cultrhealth-web` and `cultrclub-web` on Cloudflare Pages. Changes here must be ported; they do not auto-deploy to production.
- Files: All files in this repo
- Impact: Work done here silently does not reach production unless manually ported
- Fix approach: Only use this repo as a workbench; always verify changes are ported to `cultrhealth-web`/`cultrclub-web` before marking work done

**Legacy `@vercel/postgres` SDK in 65 files:**
- Issue: The active production repos use Neon PostgreSQL with the Neon SDK (supports `fullResults: true` required for CF Pages edge). This repo still imports `@vercel/postgres` (`sql`, `db`) across 65 `.ts`/`.tsx` files.
- Files: `lib/db.ts`, `lib/creators/db.ts`, `app/api/webhook/stripe/route.ts`, `app/api/club/orders/route.ts`, and 61 others
- Impact: Incompatible with Cloudflare Pages edge runtime in production. Numeric values returned as strings — requires `Number()`/`parseFloat()` coercion before arithmetic (missing in several places).
- Fix approach: Migrate all `@vercel/postgres` imports to Neon SDK before porting any file to production repos

**Pharmacy Partner Integration Stubs (8 routes broken):**
- Issue: Asher Med was removed April 2026. Multiple API routes have `// TODO: Reconnect to new pharmacy partner` comments and return stub/empty data instead of real data.
- Files:
  - `app/api/member/profile/route.ts` (lines 127, 202) — patient data fetch stubbed
  - `app/api/member/medical-records/route.ts` (line 113) — returns `records: null`
  - `app/api/member/orders/route.ts` (line 79) — order status not live
  - `app/api/member/files/route.ts` (lines 38, 60) — returns `files: []`
  - `app/api/portal/documents/route.ts` (lines 3, 54, 146) — uploads/previews broken
  - `app/api/intake/submit/route.ts` (line 13) — intake not forwarded to pharmacy
  - `app/api/protocol/generate/route.ts` (line 26) — patient verification skipped
- Impact: Members see empty order history, no medical records, cannot upload documents. Intakes are not forwarded for clinical review. These are live member-facing features that silently fail.
- Fix approach: Integrate new pharmacy partner (SiPhox for labs is partially done; need fulfillment/prescription partner for prescriptions and documents)

**Oversized Files Exceeding 800-line Convention:**
- Issue: Several files far exceed the 800-line maximum from coding standards.
- Files:
  - `lib/protocol-templates.ts` — 4,055 lines
  - `lib/db.ts` — 3,529 lines (monolithic database functions — all domains in one file)
  - `lib/resend.ts` — 2,272 lines (22 email functions)
  - `lib/creators/db.ts` — 1,624 lines
  - `app/join/JoinLandingClient.tsx` — 1,527 lines
  - `app/api/webhook/stripe/route.ts` — 1,172 lines
  - `app/members/calorie-calculator/CalorieCalculatorClient.tsx` — 1,115 lines
- Impact: High cognitive load; hard to test, review, or modify individual sections without risk of regression
- Fix approach: Extract `lib/db.ts` by domain (members, creators, orders, club); split `lib/resend.ts` into per-domain email modules; split `app/api/webhook/stripe/route.ts` into handler functions

**Unused Code — `components/sections/` (9 files):**
- Issue: Nine legacy section components exist at `components/sections/` (Hero, Services, About, HowItWorks, Results, Pricing, Testimonials, FAQ, Waitlist) but are imported nowhere. The homepage builds all sections inline in `app/page.tsx`.
- Files: `components/sections/Hero.tsx`, `components/sections/Services.tsx`, `components/sections/About.tsx`, `components/sections/HowItWorks.tsx`, `components/sections/Results.tsx`, `components/sections/Pricing.tsx`, `components/sections/Testimonials.tsx`, `components/sections/FAQ.tsx`, `components/sections/Waitlist.tsx`
- Impact: Dead code increases repo size and confuses contributors
- Fix approach: Delete the entire `components/sections/` directory

**Unused Dependency — `class-variance-authority`:**
- Issue: `class-variance-authority` (CVA) is listed in `package.json` dependencies but is never imported in any file. Button and other components use manual variant objects with the `cn()` utility.
- Files: `package.json`
- Impact: Unnecessary bundle weight; false signal to developers that CVA is in use
- Fix approach: Remove from `package.json`

**Empty `lib/stores/` Directory:**
- Issue: `lib/stores/` exists but contains no files. Implies Zustand/Jotai was planned but never added.
- Files: `lib/stores/`
- Impact: Misleading directory structure
- Fix approach: Remove the empty directory or add the planned store

**Root-Level Legacy Components:**
- Issue: `components/Footer.tsx`, `components/Navigation.tsx`, `components/WaitlistForm.tsx` are superseded by `components/site/` equivalents but still exist.
- Files: `components/Footer.tsx`, `components/Navigation.tsx`, `components/WaitlistForm.tsx`
- Impact: Ambiguity about which component to use
- Fix approach: Delete the root-level legacy components

**`strict: false` TypeScript Configuration:**
- Issue: `tsconfig.json` has `strict: false`, `allowJs: true`, and `skipLibCheck: true`. This disables null checks, implicit any detection, and strict function types.
- Files: `tsconfig.json`
- Impact: Type errors that would be caught in strict mode silently pass. Combined with `allowJs: true`, JS files with no type safety are mixed into the codebase.
- Fix approach: Enable `strict: true` incrementally; fix revealed errors by domain area

**`console.log` Statements in Production API Routes:**
- Issue: `next.config.js` strips `console.log` in production builds (`removeConsole` excludes `error`/`warn`), but `app/api/webhook/stripe/route.ts` has ~20+ `console.log` calls that represent important business events (checkout completions, subscriptions). These are invisible in production.
- Files: `app/api/webhook/stripe/route.ts`, `app/api/webhook/quickbooks/route.ts`
- Impact: Business-critical events (purchases, subscription changes, refunds) have no observable log trail in production
- Fix approach: Replace `console.log` with a structured logger (e.g., pino) that persists through production, or promote to `console.warn`

**Staging Detection via URL String Match:**
- Issue: `lib/auth.ts` (line 229–230) and `app/api/auth/verify/route.ts` (line 48–49) detect staging by checking if `NEXT_PUBLIC_SITE_URL` contains the string "staging". This is a NEXT_PUBLIC_ variable baked at build time.
- Files: `lib/auth.ts`, `app/api/auth/verify/route.ts`
- Impact: A production build where `NEXT_PUBLIC_SITE_URL` accidentally contains "staging" would grant auth bypasses to all users. A TODO comment in `app/api/auth/verify/route.ts:47` acknowledges this needs removal once `STAGING_MODE=true` is confirmed in Vercel.
- Fix approach: Remove the NEXT_PUBLIC_SITE_URL fallback; rely solely on the server-side `STAGING_MODE` env var

---

## Security Concerns

**GA4 Tracking on Authenticated / PHI Pages:**
- Risk: `app/layout.tsx` loads Google Analytics 4 unconditionally on every page, including `/members/*`, `/intake`, `/dashboard`, `/admin`, and `/creators/portal`. GA4 collects URL paths and browsing behavior, which on healthcare pages constitutes PHI under HIPAA.
- Files: `app/layout.tsx` (lines 122–136)
- Current mitigation: None — GA4 fires on all routes
- Recommendations: Disable GA4 script on authenticated route prefixes (`/members`, `/intake`, `/dashboard`, `/admin`, `/creators/portal`); obtain a BAA with Google if analytics on public pages are required

**CSP Uses `'unsafe-inline'` and `'unsafe-eval'` for Scripts:**
- Risk: `next.config.js` CSP allows `'unsafe-inline'` and `'unsafe-eval'` in `script-src`, which largely defeats XSS protection.
- Files: `next.config.js` (line 52)
- Current mitigation: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` are present
- Recommendations: Migrate to nonce-based CSP to eliminate `'unsafe-inline'`; remove `'unsafe-eval'` after auditing dependencies

**`app/api/auth/dev-login` Endpoint:**
- Risk: `app/api/auth/dev-login/route.ts` creates a valid admin session without magic link authentication, gated only by `NODE_ENV === 'production'`.
- Files: `app/api/auth/dev-login/route.ts`
- Current mitigation: Returns 403 in production NODE_ENV
- Recommendations: Confirm this route does not exist in `cultrhealth-web` or `cultrclub-web`; add `ENABLE_DEV_LOGIN=true` env flag as a second explicit opt-in guard

**Admin Auth Pattern Not Centralized:**
- Risk: Admin authorization logic is duplicated across ~15 API routes. Each independently reads `ADMIN_ALLOWED_EMAILS || PROTOCOL_BUILDER_ALLOWED_EMAILS || ''`. If both env vars are unset, the default is an empty string, making all admin endpoints silently deny everyone.
- Files: `app/api/admin/customers/[email]/route.ts`, `app/api/admin/intakes/route.ts`, `app/api/admin/club-orders/route.ts`, `app/api/admin/club-orders/[orderId]/status/route.ts`, `app/api/admin/club-orders/[orderId]/approve/route.ts`, `app/api/admin/club-orders/[orderId]/dismiss/route.ts`, `app/api/admin/inventory/route.ts`, and 8 more
- Current mitigation: `ADMIN_ALLOWED_EMAILS` is documented in `.env.example`
- Recommendations: Centralize admin auth into a single `requireAdmin()` helper; fail loudly at startup if `ADMIN_ALLOWED_EMAILS` is not set

**Stripe SDK Initialized with Fallback Empty String:**
- Risk: Stripe is initialized with `process.env.STRIPE_SECRET_KEY || ''` in multiple admin routes. An empty string produces an SDK instance that silently fails at first API call rather than at startup.
- Files: `app/api/admin/creators/[id]/approve/route.ts`, `app/api/admin/members/[customerId]/cancel/route.ts`, `app/api/admin/members/[customerId]/upgrade/route.ts`, `app/api/admin/members/[customerId]/pause/route.ts`, `app/api/admin/members/add/route.ts`, `app/api/admin/creators/add/route.ts`
- Recommendations: Throw early if `STRIPE_SECRET_KEY` is absent; never use fallback empty string for secret keys

**Staging Auth Bypass Exposes Magic Link Tokens in API Response:**
- Risk: `app/api/auth/magic-link/route.ts` (line 168–173) returns the full magic link URL (containing a valid JWT token) in the JSON response body for staging-bypass emails.
- Files: `app/api/auth/magic-link/route.ts`
- Current mitigation: Bypass only triggers for `STAGING_ACCESS_EMAILS` or `isStaging()` hosts
- Recommendations: Acceptable for staging; ensure `STAGING_MODE` env var is never set on any production CF Pages deployment

**`/api/portal/stacking-content` Has No Auth Guard:**
- Risk: Returns premium library content (stacking guides) without any authentication check, despite being positioned under `/api/portal/`.
- Files: `app/api/portal/stacking-content/route.ts`
- Recommendations: Add `verifySessionToken` check matching other portal routes

---

## HIPAA / Compliance Concerns

**Missing BAAs for Several Data Processors (LegitScript Blocker):**
- Risk: HIPAA requires Business Associate Agreements with all vendors handling PHI. Not confirmed for: Resend (email with PHI in templates), Cloudflare Pages (hosting), Neon PostgreSQL (database containing medical intake data), Cloudflare Turnstile.
- Files: `lib/resend.ts`, `lib/db.ts`, and all API routes sending data to these services
- Current mitigation: AWS S3 (via former Asher Med), Stripe have standard healthcare BAAs
- Recommendations: Execute BAAs with Resend, Neon, and Cloudflare; document status in privacy policy

**No HIPAA Notice of Privacy Practices Page:**
- Risk: LegitScript Standard 6 (Privacy) requires a published NPP. Current privacy policy at `app/legal/privacy/page.tsx` may not meet this standard.
- Files: `app/legal/privacy/page.tsx`
- Recommendations: Create `/legal/hipaa-privacy-practices` with required NPP elements

**Missing Cookie Consent Banner:**
- Risk: GDPR/CCPA and LegitScript require explicit cookie consent for analytics tracking. No consent management platform or banner is implemented.
- Files: `app/layout.tsx`
- Recommendations: Add consent banner; conditionally load GA4 only after consent

**Public Dosing Calculator Without Medical Disclaimer Gate:**
- Risk: `/tools/dosing-calculator` is publicly accessible and provides dosing guidance. LegitScript audit plan (`docs/LEGITSCRIPT-AUDIT-PLAN.md`) flags this as HIGH RISK — implies medical advice.
- Files: `app/tools/dosing-calculator/page.tsx`, `app/tools/dosing-calculator/[slug]/page.tsx`
- Current mitigation: Informational disclaimer present; HowTo JSON-LD schema in place
- Recommendations: Add prominent "For educational purposes only — consult your provider" disclaimer above the calculator

**Stacking Guides Publicly Accessible:**
- Risk: `/tools/stacking-guides` provides peptide stacking recommendations publicly. LegitScript audit plan flags as HIGH RISK.
- Files: `app/tools/stacking-guides/page.tsx`
- Recommendations: Gate behind authentication or add mandatory medical advice disclaimer

**Dispensing Pharmacy Contact Info Missing from Website (LegitScript Blocker):**
- Risk: LegitScript Standard 4 requires the dispensing pharmacy's name, address, phone, and fax on the website. Listed as Risk R1 (CRITICAL — Application Rejection) in `docs/LEGITSCRIPT-AUDIT-PLAN.md`.
- Files: `components/site/Footer.tsx`, `app/how-it-works/page.tsx`
- Recommendations: Add St. Luke Compounding Pharmacy (or current partner) contact block to footer

**Testimonials Lack Required "Results May Vary" Disclaimers:**
- Risk: Testimonials in `lib/config/social-proof.ts` include specific weight loss claims ("Down 32 lbs in 4 months", "Went from 215 to 183") and NAD+ efficacy claims without standardized disclaimers. LegitScript Standard 8 requires these.
- Files: `lib/config/social-proof.ts`, `app/page.tsx`
- Recommendations: Add `"Individual results may vary. Testimonials reflect personal experiences and do not constitute guaranteed outcomes."` to every testimonial display

**Unsubstantiated Trust Metrics:**
- Risk: TRUST_METRICS in `lib/config/social-proof.ts` claims "4.9/5 stars (50+ reviews)" with no third-party platform backing. LegitScript Standard 8 requires substantiation.
- Files: `lib/config/social-proof.ts`
- Recommendations: Link to a verified third-party review platform (Trustpilot, Google Reviews) or soften the claims

---

## Performance Bottlenecks

**`lib/db.ts` — Monolithic 3,529-line Database Module:**
- Problem: All database operations for all domains are in a single file. Every import of any single DB function loads the entire 3,529-line module.
- Files: `lib/db.ts`
- Cause: Grew organically without domain decomposition
- Improvement path: Split by domain: `lib/db/members.ts`, `lib/db/orders.ts`, `lib/db/creators.ts`, `lib/db/club.ts`, `lib/db/intake.ts`

**No Abandoned Cart/Intake Email Recovery:**
- Problem: `pending_intakes` table tracks incomplete checkouts with 30-day expiry. `/api/cron/stale-orders/route.ts` exists but no recovery email logic is connected to it. Documented as the single highest-leverage missing feature in `docs/HIGH-LEVERAGE-IMPROVEMENTS.md`.
- Files: `app/api/cron/stale-orders/route.ts`, `lib/resend.ts`, `lib/db.ts`
- Cause: Email recovery sequences never built
- Improvement path: Add 3-email recovery sequence triggered from stale-orders cron using existing Resend infrastructure

**No Quiz Email Capture:**
- Problem: Quiz (`app/quiz/QuizClient.tsx`) collects zero contact information. All quiz-takers who do not click "Join" are lost permanently. Estimated to be the highest-leverage single fix in `docs/HIGH-LEVERAGE-IMPROVEMENTS.md`.
- Files: `app/quiz/QuizClient.tsx`, `lib/config/quiz.ts`
- Improvement path: Add email capture step after question 2-3; store in `waitlist_entries`; sync to Mailchimp with `quiz-started` tag

**No Meta Pixel / Google Ads Conversion Tracking:**
- Problem: GA4 events exist in `lib/analytics.ts` but no Facebook Pixel or Google Ads conversion tag. Cannot run paid advertising without this infrastructure.
- Files: `app/layout.tsx`, `lib/analytics.ts`
- Improvement path: Add Meta Pixel and Google Ads tag to `app/layout.tsx`

---

## Reliability Concerns

**CF Pages Edge Runtime — `fireAndForget()` Helper Missing in Legacy Repo:**
- Problem: In the active production repos (`cultrhealth-web`, `cultrclub-web`), a `fireAndForget()` helper in `lib/edge/wait-until.ts` was added (commits 01047b1, 15f416d) to prevent CF Pages from terminating pending Promises on `return response`. This helper does NOT exist in this legacy repo. Any code ported from here that uses async side effects after response will silently fail on CF Pages.
- Files: All API routes with post-response async work (email sends, Mailchimp sync, analytics events, ntfy notifications)
- Impact: Silent production failures — emails dropped, analytics calls lost
- Fix approach: When porting any route to production repos, audit for post-response async work and wrap with `fireAndForget()`

**Intake Submission Not Wired to Any Clinical System:**
- Problem: `app/api/intake/submit/route.ts` stores data in `pending_intakes` but does not forward to any pharmacy or clinical review system. Patients complete intake forms but no provider sees them automatically.
- Files: `app/api/intake/submit/route.ts`
- Trigger: Any member completing the intake form
- Workaround: Admin panel allows manual intake viewing at `app/admin/intakes/`

**Subscription Cancellation Pharmacy Notification Unimplemented:**
- Symptom: `app/api/webhook/stripe/route.ts` (line 920–921) logs `'Subscription cancelled — pharmacy partner notification pending integration'` but takes no action. Cancelled subscriptions may result in continued dispensing if the pharmacy is not notified through another channel.
- Files: `app/api/webhook/stripe/route.ts`

**Many Portal and Auth Routes Without Rate Limiting:**
- Problem: 30+ API routes lack rate limiting including portal routes and some auth-adjacent routes. The `lib/rate-limit.ts` module exists but is not applied uniformly.
- Files: `app/api/portal/refresh/route.ts`, `app/api/portal/logout/route.ts`, `app/api/portal/results/route.ts`, `app/api/portal/orders/route.ts`, `app/api/portal/labs/route.ts`, `app/api/club/event/route.ts`, `app/api/referral/me/route.ts`, `app/api/track/identify/route.ts`, and others
- Impact: Susceptible to brute-force and enumeration attacks
- Fix approach: Apply `lib/rate-limit.ts` consistently to all public-facing and lightly-authenticated routes

**SiPhox Labs Kit Matching is Fragile for Multi-Kit Members:**
- Symptom: `app/api/portal/labs/route.ts` (line 138) has `// TODO: v2 — match by kitId instead of updating most-recent order (fine for v1, users typically have 1 kit)`. Members with multiple lab kits will have the wrong order updated.
- Files: `app/api/portal/labs/route.ts`

---

## Scalability Concerns

**`lib/db.ts` — No Domain Decomposition:**
- Problem: All DB operations for members, creators, orders, club, intake, LMN, and waitlist are in a single 3,529-line file. No connection pooling configuration is visible.
- Files: `lib/db.ts`
- Scaling path: Split by domain; use Neon PgBouncer pooling mode for CF edge (already done in production repos)

**Commission Ledger and Click Events — No Archiving Strategy:**
- Problem: `commission_ledger` and `click_events` tables accumulate records indefinitely. No archiving, partitioning, or TTL policy exists.
- Files: `lib/creators/db.ts`, `migrations/009_creator_affiliate_portal.sql`
- Scaling path: Add date-based partitioning on `click_events`; archive `commission_ledger` rows older than 2 years

---

## Known Broken / Partially Implemented Features

**Member Medical Records — Always Returns `null`:**
- Symptom: `app/api/member/medical-records/route.ts` always returns `{ success: true, records: null }` because pharmacy partner is stubbed
- Files: `app/api/member/medical-records/route.ts`

**Member File Downloads — Always Returns `[]`:**
- Symptom: `app/api/member/files/route.ts` returns `{ success: true, files: [] }` — no files available to members
- Files: `app/api/member/files/route.ts`

**Document Upload Broken:**
- Symptom: `app/api/portal/documents/route.ts` has no active presigned URL generation or file upload to any storage backend
- Files: `app/api/portal/documents/route.ts`

**Member Order Status — Not Live:**
- Symptom: `app/api/member/orders/route.ts` returns DB-only order data without real-time status from pharmacy partner
- Files: `app/api/member/orders/route.ts`

---

## Test Coverage Gaps

**No Tests for Stripe Webhook Handlers:**
- What's not tested: `app/api/webhook/stripe/route.ts` (1,172 lines) handles checkout completion, subscription updates, refunds, and commission processing — zero test coverage
- Files: `app/api/webhook/stripe/route.ts`
- Risk: Silent regressions in commission calculation, subscription lifecycle, or refund processing
- Priority: High

**No Automated E2E Tests for Checkout Flow:**
- What's not tested: Full checkout from `/pricing` → `/join/[tier]` → Stripe → `/success` → `/onboarding` → `/intake`. `CHECKOUT-FLOW-TEST.md` documents manual test steps but no automated coverage exists.
- Files: `app/join/[tier]/page.tsx`, `app/api/checkout/route.ts`, `app/success/page.tsx`
- Risk: A regression in checkout flow blocks all new revenue with no automated detection
- Priority: Critical

**No Tests for Club Order Pipeline Status Transitions:**
- What's not tested: Commission deferral to shipment, HMAC approval, QuickBooks sync, email suppression flags in `app/api/admin/club-orders/[orderId]/status/route.ts`
- Files: `app/api/admin/club-orders/[orderId]/status/route.ts`
- Priority: High

**No Tests for Creator Commission Engine:**
- What's not tested: Direct commission, override commission, 20% total cap logic, and retroactive attribution
- Files: `lib/creators/commission.ts`, `lib/creators/attribution.ts`
- Priority: High

**Low Overall API Coverage — ~8 Routes Tested Out of 72:**
- What's not tested: ~64 of 72 API routes have no corresponding test. Many handle financial transactions, PHI, or authentication.
- Priority: High — prioritize checkout, auth, webhook, and intake routes

---

## Missing Critical Features

**No Abandoned Checkout Recovery Emails:**
- Problem: `pending_intakes` table tracks incomplete checkouts but no email recovery is triggered. The stale-orders cron exists but sends no emails.
- Blocks: Recovering 5–15% of abandoned checkouts (per `docs/HIGH-LEVERAGE-IMPROVEMENTS.md`)

**No Meta Pixel / Paid Acquisition Infrastructure:**
- Problem: Cannot run Facebook/Instagram or Google Ads campaigns without conversion tracking pixels
- Blocks: All paid advertising channels

**No Lifecycle / Drip Email Sequences:**
- Problem: Only transactional emails (welcome, order confirmation) exist in `lib/resend.ts`. No drip sequences, re-engagement, or renewal reminders.
- Blocks: Member retention and LTV optimization

**No A/B Testing Infrastructure:**
- Problem: No feature flags, no variant testing, no session replay tool
- Blocks: Conversion rate optimization

**No Third-Party Review Platform:**
- Problem: Self-hosted testimonials with "4.9/5 stars (50+ reviews)" have no verified external source (Trustpilot, Google Reviews)
- Blocks: LegitScript application (Standard 8 — substantiated claims); reduces trust signal vs. competitors with verified review counts

---

*Concerns audit: 2026-05-15*
