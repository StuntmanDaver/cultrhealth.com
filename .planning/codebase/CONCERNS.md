# Codebase Concerns

**Analysis Date:** 2026-03-22

---

## Security Considerations

### Admin Order Fulfillment — Inconsistent Authentication
- Risk: Two endpoints use a weak `x-admin-secret` header check instead of the session-based admin auth used everywhere else. In non-production environments (NODE_ENV !== 'production'), the check is skipped entirely — unauthenticated requests succeed.
- Files: `app/api/admin/orders/[orderNumber]/fulfill/route.ts` (lines 29–35, 181–187)
- Current mitigation: Secret header in production, but zero auth in development/staging
- Recommendation: Replace with `verifyAdminAuth()` from `lib/auth.ts`, consistent with `app/api/admin/intakes/route.ts` and `app/api/admin/club-orders/route.ts`

### Staging Auth Bypasses Granted to All Users
- Risk: `isStaging()` in `lib/auth.ts` returns `true` for any `NEXT_PUBLIC_SITE_URL` containing "staging" — granting every user admin/provider/creator access on the staging deployment. If staging is accidentally linked publicly or env var mismatches, real users gain elevated privileges.
- Files: `lib/auth.ts` (lines 151–154, 185, 265, 381), `app/api/auth/magic-link/route.ts` (line 38), `app/api/auth/verify/route.ts` (line 31), `app/api/portal/verify-otp/route.ts` (lines 52–54)
- Current mitigation: Staging URL is gated via Vercel environment; not public-facing
- Recommendation: Require staging bypass to be an explicit allowlist (env var) rather than all-users-on-staging; remove the blanket `if (isStaging()) return true` pattern from `isProviderEmail()`

### Authorize.net Webhook Silently Skips Signature Verification
- Risk: `verifyWebhookSignature()` returns `true` when `AUTHORIZE_NET_WEBHOOK_SIGNATURE_KEY` is not set. Any unauthenticated POST to `/api/webhook/authorize-net` is accepted as valid, allowing forged payment events.
- Files: `lib/payments/authorize-net-api.ts` (line in `verifyWebhookSignature`), `app/api/webhook/authorize-net/route.ts`
- Current mitigation: None — missing env var = open endpoint
- Recommendation: Return `false` (reject) when key is not configured, not `true`; log a critical startup warning if key is absent in production

### OTP Bypass Code `123456` Active on Staging
- Risk: Anyone who knows the bypass code (`123456`) can authenticate as any phone number on staging, including patients with real data if staging ever runs against the production database.
- Files: `app/api/portal/verify-otp/route.ts` (lines 52–67)
- Current mitigation: Staging DB is separate; bypass only on `isStaging || isLocalDev`
- Recommendation: Ensure staging never points to production Asher Med or Postgres; document the bypass explicitly and add a startup log warning

### Hardcoded Team Email Lists (DRY Violation + Security Surface)
- Risk: `TEAM_EMAILS` is defined as a hardcoded array in 5 separate files. Any change to team membership requires updating all 5 locations — easy to miss, creating privilege drift.
- Files: `lib/auth.ts` (line 143), `app/api/auth/magic-link/route.ts` (line 21), `app/api/auth/verify/route.ts` (line 14), `app/api/creators/magic-link/route.ts` (line 4), `app/api/creators/verify-login/route.ts` (line 5)
- Current mitigation: None
- Recommendation: Centralize into a single constant in `lib/auth.ts` and import it; or move entirely to `STAGING_ACCESS_EMAILS` env var

### Missing Rate Limiting on Medical Intake Submission
- Risk: `/api/intake/submit` and `/api/intake/upload` have no rate limiting. A bot can submit unlimited intake forms, creating Asher Med patient records and consuming file storage quota.
- Files: `app/api/intake/submit/route.ts`, `app/api/intake/upload/route.ts`
- Current mitigation: Cloudflare Turnstile is only applied to the waitlist form (`app/api/waitlist/route.ts`); intake forms do not use it
- Recommendation: Add `formLimiter` from `lib/rate-limit.ts` to both intake routes

### Club Signup Has No Bot Protection
- Risk: `/api/club/signup` has no Turnstile, no rate limit, and no auth. A bot can flood the club_members table and trigger Mailchimp API calls and welcome emails.
- Files: `app/api/club/signup/route.ts`
- Current mitigation: None
- Recommendation: Add Turnstile verification and `formLimiter`

---

## Tech Debt

### Development Mode Auto-Grants Admin Role to All Requests
- Issue: `getSession()` and `verifyAuth()` in `lib/auth.ts` both return a hardcoded admin session in `NODE_ENV === 'development'`. Any unauthenticated API call in local dev succeeds with full admin access.
- Files: `lib/auth.ts` (lines 100–102, 295–303)
- Impact: Cannot test unauthorized/forbidden flows locally; mistakes in auth logic go undetected until staging
- Fix approach: Use a real dev token or a BYPASS_AUTH env flag that must be explicitly set

### TEAM_EMAILS Duplicated Across 5 Files
- Issue: See Security section above. Also a DRY violation — team roster must be maintained in 5 places.
- Files: `lib/auth.ts`, `app/api/auth/magic-link/route.ts`, `app/api/auth/verify/route.ts`, `app/api/creators/magic-link/route.ts`, `app/api/creators/verify-login/route.ts`
- Impact: Inconsistency when team changes; person removed from one file still has access via others
- Fix approach: Define `TEAM_EMAILS` once in `lib/auth.ts`, export it, import in the 4 API route files

### `COMMISSION_CONFIG.totalCapRate` Discrepancy (25% vs 20%)
- Issue: `CLAUDE.md` and inline documentation state the total commission cap is 20%, but `lib/config/affiliate.ts` line 230 sets `totalCapRate: 25.00`. The TIER_CONFIGS also shows Gold tier at 10% direct + 20% override = 30%, not 25%.
- Files: `lib/config/affiliate.ts` (lines 225–252, 274–279)
- Impact: Creators may be over- or under-paid depending on which value is enforced in `lib/creators/commission.ts`
- Fix approach: Audit actual commission calculations in `lib/creators/commission.ts` against both values; align constant with intended cap and document

### `lib/protocol-templates.ts` Is 4,074 Lines With Dead Code Section
- Issue: File has a "ORIGINAL PROTOCOL TEMPLATES (below)" comment at line 3,561 separating a legacy section from the active symptom-engine code. Both sections export different structures.
- Files: `lib/protocol-templates.ts` (lines 1–1655 symptom engine, 1656–3560 catalog, 3561–4074 original templates)
- Impact: Very large file is hard to navigate; unclear which section is authoritative for which feature; increases bundle size
- Fix approach: Split into `lib/symptom-protocols.ts`, `lib/peptide-catalog.ts`, and `lib/protocol-templates.ts` (original only)

### `components/sections/` — 9 Unused Components
- Issue: `components/sections/` (Hero, Services, About, HowItWorks, Results, Pricing, Testimonials, FAQ, Waitlist) are not imported anywhere in `app/`. Homepage builds all sections inline in `app/page.tsx`.
- Files: All 9 files in `components/sections/`
- Impact: ~800 lines of dead code in the bundle; Tailwind content scan includes them — risk of stale token artifacts
- Fix approach: Delete the directory; verify no external tooling references them

### Legacy Root Components Still Present
- Issue: `components/Footer.tsx`, `components/Navigation.tsx`, `components/WaitlistForm.tsx` use undefined color tokens (`cultr-copper`, `cultr-charcoal`, `cultr-lightgray`, `cultr-black`) that are not in `tailwind.config.ts`.
- Files: `components/Footer.tsx`, `components/Navigation.tsx`, `components/WaitlistForm.tsx`, `components/ui/Spinner.tsx`
- Impact: Tailwind renders these as transparent/invisible; `Spinner` uses `cultr-copper` so spinner color is always wrong
- Fix approach: Delete legacy root components; update `Spinner.tsx` to use `brand-primary` or `forest` token

### Undefined Color Tokens in Active Files
- Issue: `cultr-copper` and `cultr-cream` (the old dark-background `cultr-cream`, distinct from the current `cream` token) appear in active production files. `cultr-copper` has no definition in `tailwind.config.ts`.
- Files: `app/science/page.tsx` (line 75), `app/creators/[slug]/page.tsx` (lines 41, 61), `components/ui/Spinner.tsx` (line 18), `components/site/ComparisonTable.tsx` (line 81)
- Impact: Elements render with no background/border color (transparent fallback)
- Fix approach: Replace `cultr-copper` → `sage` or `brand-primary`; replace `cultr-cream` → `cream` in affected files

### `class-variance-authority` Listed as Dependency but Never Used
- Issue: `package.json` includes `class-variance-authority` in dependencies but it is never imported anywhere in the codebase.
- Files: `package.json`
- Impact: Adds ~15KB to install, misleads future developers into thinking CVA is the component variant pattern
- Fix approach: Remove from `package.json`; confirm Button and other components intentionally use manual variant objects + `cn()`

### `lib/stores/` Directory Is Empty
- Issue: `lib/stores/` exists but contains no files — likely a placeholder for planned Zustand/Jotai state.
- Files: `lib/stores/` (empty directory)
- Impact: None, but noise in directory tree
- Fix approach: Delete empty directory or add a README if the store pattern is planned

### Mailchimp Integration Has Invalid API Key
- Issue: Per project memory, the `MAILCHIMP_API_KEY` env var is invalid/expired. The sync is fire-and-forget so it fails silently on every Club signup, but the `console.warn` will surface in logs.
- Files: `app/api/club/signup/route.ts` (line 52, syncToMailchimp call)
- Impact: Club members are not synced to email marketing list; welcome automations do not trigger
- Fix approach: Regenerate Mailchimp API key and update Vercel env var

### In-Memory Rate Limiter Does Not Survive Serverless Cold Starts
- Issue: When `UPSTASH_REDIS_REST_URL` is not configured, rate limiting falls back to an in-memory `Map`. On serverless (Vercel), each function invocation gets a fresh process — the in-memory store is reset on every cold start. Rate limits are ineffective in production without Redis.
- Files: `lib/rate-limit.ts` (lines 47–98, createMemoryRateLimiter)
- Impact: Magic link, waitlist, OTP, and creator apply endpoints can be spammed if Upstash is not configured
- Fix approach: Ensure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set in production Vercel project; add startup warning if missing in production

### `lib/auth.ts` Makes Two Separate Stripe API Calls Per Page Load
- Issue: `getMembershipTier()` calls `stripe.subscriptions.list()` twice (once for `active`, once for `trialing`) when DB lookup fails. 20 pages call this function on every page render.
- Files: `lib/auth.ts` (lines 209–221)
- Impact: Each DB cache miss triggers 2 Stripe API round-trips (~200–400ms each), degrading TTFB
- Fix approach: Use a single `stripe.subscriptions.list({ customer, status: 'all', limit: 5 })` and filter client-side; or better, ensure `POSTGRES_URL` is always set so DB cache is used

---

## Known Bugs

### `Spinner` Component Renders Invisible in Most Contexts
- Symptoms: Loading spinners appear with no visible color on cream backgrounds
- Files: `components/ui/Spinner.tsx` (line 18 — uses `border-cultr-copper` which is undefined)
- Trigger: Any component that renders `<Spinner />` (portal layout, Button isLoading state)
- Workaround: None currently

### `components/site/ComparisonTable.tsx` Checkmarks Have No Color
- Symptoms: Check icons in the comparison table on the homepage render with no color
- Files: `components/site/ComparisonTable.tsx` (line 81 — uses `text-cultr-copper`)
- Trigger: Homepage visible to all users
- Workaround: None

---

## Performance Bottlenecks

### `lib/protocol-templates.ts` — 4,074 Lines Imported at Module Level
- Problem: The entire file (all 3 protocol sections, ~3,500 data entries) is imported synchronously wherever any protocol function is used. This inflates the server-side module bundle.
- Files: `lib/protocol-templates.ts`
- Cause: All exports are at module scope with no lazy loading
- Improvement path: Split into sub-modules; import only what each consumer needs

### `getMembershipTier()` Lacks Caching — Called on Every Page Render
- Problem: Each of the ~20 pages that call `getMembershipTier()` issues a DB query or Stripe API call on every request. No session-level or request-level cache.
- Files: `lib/auth.ts` (lines 173–236)
- Cause: No caching layer between the function and the external services
- Improvement path: Cache tier in JWT session payload on login; only re-check on subscription events (webhook) rather than every request

### `lib/resend.ts` — 1,859 Lines Including All Email HTML Inline
- Problem: All email templates are defined as large inline HTML strings in a single file. This is loaded on every API route that sends any email.
- Files: `lib/resend.ts`
- Cause: No template files or lazy loading
- Improvement path: Extract individual templates to `lib/email/templates/` directory; load only what's needed per route

---

## Fragile Areas

### Authorize.net Webhook Missing Notification Handlers
- Files: `app/api/webhook/authorize-net/route.ts` (lines 162, 266)
- Why fragile: Two event handlers (`handleFraudHeld`, `handleSubscriptionExpiring`) have TODO stubs — no admin notification, no customer notification. Fraud holds and expiring subscriptions are silently ignored.
- Safe modification: Add Resend email calls in the TODO placeholders; test against Authorize.net sandbox
- Test coverage: No tests for the webhook handler

### SiPhox Labs Kit-to-Patient Matching Is Approximate
- Files: `app/api/portal/labs/route.ts` (line 137 comment)
- Why fragile: Lab results are matched to patients by most-recent order, not by kit ID. For patients with multiple kits this produces incorrect results. The TODO explicitly notes this is a v1 approximation.
- Safe modification: Only change alongside a migration to `kit_id`-based matching
- Test coverage: `tests/api/portal-labs.test.ts` exists but tests the approximate path

### QuickBooks Token Rotation — Env Var Goes Stale After First Use
- Files: `lib/quickbooks.ts` (lines 38–59)
- Why fragile: QB OAuth2 rotates the refresh token on every use. The initial `QUICKBOOKS_REFRESH_TOKEN` env var becomes invalid after the first rotation; subsequent cold starts must read from the `qb_tokens` DB table. If the DB is unavailable at cold start, QB integration breaks silently.
- Safe modification: Never delete `qb_tokens` table rows; always preserve last known refresh token
- Test coverage: None

### Portal Auth Is Client-Side Only (No Server Middleware)
- Files: `app/portal/layout.tsx` (client-side `AuthGuard`), `middleware.ts`
- Why fragile: Portal pages are protected by a client-side `useEffect` auth check that redirects to `/portal/login`. The middleware does not enforce portal session. A user who disables JavaScript or directly fetches the page HTML bypasses the redirect (server renders the page shell without PHI, but the risk surface exists).
- Safe modification: Add server-side cookie check in a `app/portal/*/page.tsx` server component wrapper
- Test coverage: `tests/components/PortalLogin.test.tsx`, `tests/components/PortalDashboard.test.tsx`

### Magic Link Rate Limiter Uses In-Memory Store
- Files: `lib/auth.ts` (lines 116–141, `checkRateLimit`)
- Why fragile: The `magicLinkRequests` Map is process-local. On Vercel, concurrent invocations and cold starts each have their own Map — the rate limit does not work across instances.
- Safe modification: Replace with the `formLimiter` from `lib/rate-limit.ts` (which uses Redis when configured)
- Test coverage: `tests/lib/auth.test.ts` covers it but only in a single-process test environment

---

## Scaling Limits

### In-Memory Rate Limiting
- Current capacity: Effective per-process only; useless across multiple Vercel function instances
- Limit: Any traffic beyond a single serverless instance can bypass rate limits
- Scaling path: Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in all environments

### `lib/db.ts` — `ensureWaitlistTable()` Runs on Every Waitlist Request
- Current capacity: Functions correctly; adds one DDL query per cold start
- Limit: At scale, many simultaneous cold starts cause DDL contention on Neon Postgres
- Scaling path: Remove runtime `CREATE TABLE IF NOT EXISTS`; rely on migrations only

---

## Dependencies at Risk

### `@paper-design/shaders-react` at Pre-Release Version
- Risk: Version `^0.0.71` — pre-1.0 with breaking changes expected; installed with `--legacy-peer-deps`
- Impact: `components/ui/MeshBackground.tsx` (site-wide background shader) may break on minor upgrades
- Migration plan: Pin to exact version; test manually before upgrading

### `twilio` — Env Vars Not Yet Set for Production
- Risk: Twilio env vars (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`) are noted as not yet configured for production
- Impact: Portal phone OTP completely non-functional in production; users cannot log in to portal
- Migration plan: Provision Twilio Verify service; add env vars to Vercel production project

### Duplicate `framer-motion` + `motion` in Dependencies
- Risk: Both `framer-motion` and `motion` (a rebranded/slimmer version) are in `package.json`, likely increasing bundle size unnecessarily
- Impact: Both packages ship animation runtimes; they share the same codebase but have separate install footprints
- Migration plan: Consolidate to `motion` only (newer API) or `framer-motion` only; update 4 component imports

---

## Missing Critical Features

### No Route-Level Authentication Middleware
- Problem: Auth is enforced per-page (server components) and per-API-route. No centralized middleware guards `/library/*`, `/portal/*`, `/admin/*`, or `/creators/portal/*` at the edge.
- Blocks: Cannot easily add auth logging, IP allowlisting, or session refresh at the network layer
- Fix: Extend `middleware.ts` to check cookies for protected route prefixes; redirect to login at edge before page renders

### No Database Migration Runner in CI/CD
- Problem: Migrations must be run manually with `node scripts/run-migration.mjs`. There is no automatic migration on deploy.
- Blocks: Staging deployments can run code against a schema that is behind the migration state
- Fix: Add migration step to Vercel deploy hook or GitHub Actions workflow

### Authorize.net and Authorize.net Product Checkout Missing Turnstile/Rate Limiting
- Problem: `/api/checkout/authorize-net` has `apiLimiter` but no Turnstile. `/api/checkout/authorize-net/product` has `apiLimiter` but the product endpoint accepts raw card data from the client — particularly sensitive.
- Files: `app/api/checkout/authorize-net/route.ts`, `app/api/checkout/authorize-net/product/route.ts`
- Blocks: PCI compliance expectation of bot protection on card submission endpoints

---

## Test Coverage Gaps

### No Tests for Admin API Routes
- What's not tested: All 10+ routes in `app/api/admin/` — creators approvals/rejections, club order approval, analytics, payout batch processing
- Files: `app/api/admin/` (entire directory)
- Risk: Admin actions (approve creator, reject application, batch payout) could break silently
- Priority: High

### No Tests for Stripe Webhook Handler
- What's not tested: `app/api/webhook/stripe/route.ts` (874 lines, handles subscription lifecycle, payment failures, cancellations)
- Files: `app/api/webhook/stripe/route.ts`
- Risk: Webhook bug could corrupt membership state for all subscribers
- Priority: High

### No Tests for Creator Commission Engine (Real Calculations)
- What's not tested: `lib/creators/commission.ts` — actual commission math, self-referral detection, cap enforcement, bonus window logic
- Files: `lib/creators/commission.ts`, `lib/config/affiliate.ts`
- Risk: Commission calculation errors result in over/under payment to creators; hard to detect without test assertions
- Priority: High

### No Tests for QuickBooks Integration
- What's not tested: `lib/quickbooks.ts` — token refresh, customer creation, invoice creation, payment recording
- Files: `lib/quickbooks.ts`
- Risk: QB integration silently fails; club orders approved but no invoice created for billing
- Priority: Medium

### No Tests for Payment Webhooks (Affirm, Klarna, Authorize.net)
- What's not tested: `app/api/webhook/affirm/route.ts`, `app/api/webhook/klarna/route.ts`, `app/api/webhook/authorize-net/route.ts`
- Files: All three webhook routes
- Risk: Failed webhook handling leaves orders in incorrect status
- Priority: Medium

---

*Concerns audit: 2026-03-22*
