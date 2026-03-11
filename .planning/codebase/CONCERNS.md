# Codebase Concerns

**Analysis Date:** 2026-03-11

---

## Tech Debt

**`TEAM_EMAILS` Duplicated Across 5 Files:**
- Issue: The same hardcoded list of team email addresses is defined independently in `app/api/auth/magic-link/route.ts`, `app/api/auth/verify/route.ts`, `app/api/creators/magic-link/route.ts`, `app/api/creators/verify-login/route.ts`, and `lib/auth.ts`. Adding or removing a team member requires updating all 5 locations and they can silently drift out of sync.
- Files: `lib/auth.ts:140`, `app/api/auth/magic-link/route.ts:21`, `app/api/auth/verify/route.ts:13`, `app/api/creators/magic-link/route.ts:4`, `app/api/creators/verify-login/route.ts:4`
- Impact: Silent access-control divergence — a team member added to one file but not others either gets unexpected access or no access depending on the code path.
- Fix approach: Centralize in `lib/auth.ts` (already has the canonical list) and export; import from there in all four route files.

**`isStaging()` and Bypass Logic Re-Implemented Locally in Route Files:**
- Issue: Each auth route re-implements `isStaging()` and `isStagingBypassEmail()` locally instead of using the shared `lib/auth.ts` exports.
- Files: `app/api/auth/magic-link/route.ts:29-41`, `app/api/auth/verify/route.ts:21-33`, `app/api/creators/magic-link/route.ts:14-26`
- Impact: Logic inconsistency — if the staging detection rule changes, only `lib/auth.ts` might be updated.
- Fix approach: Remove local re-implementations; import the shared `isProviderEmail` and staging bypass helpers from `lib/auth.ts`.

**Inconsistent Admin Authorization Pattern Across API Routes:**
- Issue: Admin API routes use two different auth approaches. Creator management routes (`/api/admin/creators/*`) call `verifyAdminAuth(request)` from `lib/auth.ts`. Analytics, club-orders, and intake routes build an inline email allowlist check that duplicates the page server component logic.
- Files: `app/api/admin/analytics/route.ts:18-24`, `app/api/admin/club-orders/route.ts:13-17`, `app/api/admin/intakes/route.ts:13-17` vs `app/api/admin/creators/pending/route.ts:6`
- Impact: Easy to introduce a new admin endpoint using the weaker inline pattern.
- Fix approach: Standardize all admin API routes to call `verifyAdminAuth(request)`.

**Magic Link Auth Rate Limiter is In-Memory (Not Redis-Backed):**
- Issue: `lib/auth.ts` `checkRateLimit()` stores magic link timestamps in a module-level `Map`. In a serverless environment, every cold-start gets a fresh Map, rendering the rate limit ineffective across different function instances.
- Files: `lib/auth.ts:112-130`
- Impact: A determined attacker can enumerate valid subscriber emails across multiple requests, bypassing the 60-second cooldown.
- Fix approach: Replace with the Redis-backed limiter already available in `lib/rate-limit.ts` (used by checkout routes), which has in-memory fallback when Redis is absent.

**`lastMonthEarnings` Calculation is Mathematically Wrong (Known Bug):**
- Issue: The earnings overview endpoint computes `lastMonthEarnings = lastMonthStats.totalCommission - thisMonthStats.totalCommission`. This subtracts the current month's cumulative total from the prior month's full stats, producing negative or wildly inaccurate numbers for active creators.
- Files: `app/api/creators/earnings/overview/route.ts:39`
- Impact: Creator earnings dashboard shows incorrect "Last Month" figures.
- Fix approach: Add a `getCreatorOrderStats(id, start, end)` date-range overload and call it with `(lastMonthStart, thisMonthStart)` for the previous month window.

**Monthly Earnings Exclude Override Commissions (Known Inconsistency):**
- Issue: Monthly earnings figures come from `getCreatorOrderStats()` which queries `order_attributions` (direct commissions only). `lifetimeEarnings` comes from `getCommissionSummaryByCreator()` which queries `commission_ledger` (all streams). The two sources are intentionally inconsistent per the TODO comment.
- Files: `app/api/creators/earnings/overview/route.ts:27-32`
- Impact: Creators with recruits see lower-than-expected monthly totals; inconsistency between monthly and lifetime figures erodes trust.
- Fix approach: Add `getCommissionSummaryByCreatorSince(id, startDate, endDate)` querying `commission_ledger` with date boundaries.

**`STRIPE_SECRET_KEY` Initialized with Empty String Fallback:**
- Issue: `getStripe()` factory functions in four route files use `process.env.STRIPE_SECRET_KEY || ''`, which allows the Stripe SDK to instantiate with an empty key. API calls fail at runtime rather than at startup.
- Files: `app/api/webhook/stripe/route.ts:6`, `app/api/auth/magic-link/route.ts:8`, `app/api/auth/verify/route.ts:8`, `app/api/checkout/product/route.ts:7`
- Impact: Misconfigured production environments produce cryptic Stripe API errors instead of clear startup failures.
- Fix approach: Guard with `if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is required')` before constructing the client.

**TypeScript `strict: false` and Legacy `moduleResolution: "node"`:**
- Issue: `tsconfig.json` has `strict: false` and `moduleResolution: "node"` (legacy resolution). Both suppress classes of type errors that would be caught in strict mode.
- Files: `tsconfig.json:14`, `tsconfig.json:19`
- Impact: Nullability bugs, incorrect property access, and import resolution mismatches can slip past TypeScript at build time.
- Fix approach: Enable `strict: true` incrementally (add `strictNullChecks` first). Migrate `moduleResolution` to `bundler` when the Next.js version supports it.

**`class-variance-authority` Dependency Installed but Unused:**
- Issue: `class-variance-authority` is in `package.json` dependencies but no file imports it. Button variants use manual objects and the `cn()` utility.
- Files: `package.json` (dependencies)
- Impact: Adds bundle weight and signals design-system inconsistency to future contributors.
- Fix approach: `npm uninstall class-variance-authority`.

**`lib/stores/` Directory is Empty:**
- Issue: `lib/stores/` exists but contains no files.
- Files: `lib/stores/`
- Impact: Implies an unimplemented state management approach; confuses contributors.
- Fix approach: Delete the directory or populate it with intended stores.

**Admin Email Allowlist Falls Back to `PROTOCOL_BUILDER_ALLOWED_EMAILS`:**
- Issue: All admin pages and API routes use `process.env.ADMIN_ALLOWED_EMAILS || process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS || ''`. If `ADMIN_ALLOWED_EMAILS` is not set, provider-level users unexpectedly receive full admin access.
- Files: `app/admin/page.tsx:18`, `app/api/admin/analytics/route.ts:18`, `app/api/admin/club-orders/route.ts:13`, `app/api/admin/intakes/route.ts:13`
- Impact: Role boundary collapse — providers and admins are treated as the same group.
- Fix approach: Add `ADMIN_ALLOWED_EMAILS` to Vercel env vars and remove the `|| process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS` fallback.

---

## Known Bugs

**`result.data.id` from `createNewOrder()` May Be Patient ID, Not Order ID:**
- Symptoms: The PATCH call to `updateOrderApproval()` immediately after order creation may target the wrong Asher Med resource ID, silently failing.
- Files: `app/api/intake/submit/route.ts:181-189`
- Trigger: Every intake form submission.
- Workaround: The PATCH is wrapped in a try/catch and fails gracefully — intake submission succeeds but the partner note may not attach to the order in Asher Med.

**`lastMonthEarnings` Shows Incorrect Values:**
- Symptoms: On the creator earnings dashboard, "Last Month" earnings can display as negative or incorrect dollar amounts for creators with significant current-month revenue.
- Files: `app/api/creators/earnings/overview/route.ts:39`
- Trigger: Any creator who has earned commission in the current month.
- Workaround: None — `lifetimeEarnings` is accurate and can be cross-referenced.

**Authorize.net Webhook Missing Admin Notifications (TODO-Marked):**
- Symptoms: Payment declines and expiring subscriptions via Authorize.net trigger no admin alerts.
- Files: `app/api/webhook/authorize-net/route.ts:162`, `app/api/webhook/authorize-net/route.ts:266`
- Trigger: Failed Authorize.net payments; subscriptions nearing expiry.
- Workaround: Manual monitoring of the Authorize.net dashboard.

**Portal Dashboard is a Stub Page:**
- Symptoms: Authenticated patients who log in via phone OTP and land on `/portal/dashboard` see only "Your dashboard is being built. Check back soon." with a logout button.
- Files: `app/portal/dashboard/page.tsx`
- Trigger: Successful OTP login (any of the three auth paths).
- Workaround: Users must use `/library`, `/dashboard`, or `/member` pages via the main site.

---

## Security Considerations

**`/api/admin/orders/[orderNumber]/fulfill` Uses Weak Secret Header Auth:**
- Risk: The order fulfillment endpoint authenticates via an `x-admin-secret` header compared against `process.env.ADMIN_SECRET`. This check is skipped entirely in non-production environments (`NODE_ENV !== 'production'`), meaning development and staging allow unauthenticated order status changes. There is no JWT session or email allowlist check.
- Files: `app/api/admin/orders/[orderNumber]/fulfill/route.ts:29-35`, `:180-188`
- Current mitigation: `ADMIN_SECRET` env var check in production.
- Recommendations: Replace with `verifyAdminAuth(request)` from `lib/auth.ts` to match the pattern used by other admin routes. Remove the `NODE_ENV` production-only bypass.

**Intake Form Submit Has No Authentication or Rate Limiting:**
- Risk: `POST /api/intake/submit` accepts full PHI payloads (name, DOB, address, phone) from any unauthenticated caller, with no IP-based rate limiting. Any external party can submit intake data that reaches Asher Med's API.
- Files: `app/api/intake/submit/route.ts`
- Current mitigation: Asher Med API key is required server-side, so submissions do reach a gated external system.
- Recommendations: Add `verifyAuth(request)` (membership JWT check) and import `apiLimiter` from `lib/rate-limit.ts`.

**Intake Upload Has No Authentication:**
- Risk: `POST /api/intake/upload` returns presigned S3 URLs (via Asher Med) without checking any session token.
- Files: `app/api/intake/upload/route.ts`
- Current mitigation: Requires `ASHER_MED_API_KEY` configured; staging mock returns dummy URLs.
- Recommendations: Add `verifyAuth(request)` before calling Asher Med presigned URL endpoint.

**`isProviderEmail()` Returns `true` for ALL Users on Staging:**
- Risk: `lib/auth.ts:262` returns `true` from `isProviderEmail()` whenever `isStaging()` is true, granting admin-level privileges to any authenticated user on `staging.cultrhealth.com`. If staging URL detection fails (env var misconfigured) or staging is accidentally promoted, all users have admin access.
- Files: `lib/auth.ts:260-262`
- Current mitigation: Staging URL detection relies on `NEXT_PUBLIC_SITE_URL` containing the string "staging".
- Recommendations: Use a separate `STAGING_ADMIN_BYPASS=true` env var instead of URL-sniffing. Remove the blanket `if (isStaging()) return true` from `isProviderEmail()` and replace with explicit team email check only.

**Customer Email Addresses Logged in Vercel Production Logs:**
- Risk: Multiple API routes log customer email addresses to `console.log`. Vercel logs are accessible to anyone with dashboard access and are not HIPAA-safe storage.
- Files: `app/api/webhook/stripe/route.ts:161,295,501,520`, `app/api/club/signup/route.ts:168`, `app/api/admin/orders/[orderNumber]/fulfill/route.ts:112`, `app/api/creators/apply/route.ts:150,178`
- Current mitigation: Emails are not combined with medical data in the same log line.
- Recommendations: Replace logged email values with hashed or truncated identifiers in production log lines.

**Mailchimp API Key is Invalid:**
- Risk: `MAILCHIMP_API_KEY` in Vercel is expired/invalid (documented in MEMORY.md since Mar 10 2026), causing silent audience sync failures on every club signup.
- Files: `app/api/club/signup/route.ts:121-166`
- Current mitigation: `syncToMailchimp()` failure is caught non-fatally; signups succeed.
- Recommendations: Regenerate the API key from the Mailchimp dashboard and update the Vercel env var.

**Klarna and Affirm Default to Sandbox Endpoints:**
- Risk: Klarna defaults to `https://api.playground.klarna.com` and Affirm defaults to `https://sandbox.affirm.com` and `cdn1-sandbox.affirm.com`. If `KLARNA_API_URL`, `AFFIRM_API_URL`, or `NEXT_PUBLIC_AFFIRM_SCRIPT_URL` are not explicitly set in production, real orders would be processed against sandbox environments and funds never captured.
- Files: `lib/config/payments.ts:82,90,92`
- Current mitigation: Authorize.net correctly gates on an `AUTHORIZE_NET_ENVIRONMENT` env var — Klarna and Affirm do not have equivalent guards.
- Recommendations: Add production URL assertions for Klarna and Affirm matching the Authorize.net conditional pattern.

**Twilio Production Credentials Not Configured:**
- Risk: `app/api/portal/send-otp/route.ts` bypasses OTP on staging but requires `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_VERIFY_SERVICE_SID` for production. These are not yet set in the Vercel production environment.
- Files: `app/api/portal/send-otp/route.ts:47-54`, `app/api/portal/verify-otp/route.ts:56-60`
- Current mitigation: Staging bypass accepts any phone and code `123456`.
- Recommendations: Provision Twilio Verify service and add the three env vars to Vercel production before enabling the portal for real patients.

**`/api/quickbooks/callback` Renders OAuth Tokens in Browser HTML:**
- Risk: The QuickBooks OAuth callback route returns the `REALM_ID` and `REFRESH_TOKEN` values rendered in an HTML page visible in the browser and captured in browser history.
- Files: `app/api/quickbooks/callback/route.ts:110`
- Current mitigation: Route is behind admin allowlist check.
- Recommendations: Store tokens directly to DB on callback instead of displaying them; this is a one-time setup flow but tokens should never appear in HTML output.

---

## Performance Bottlenecks

**`recalculateAllTiers()` Cron Does Sequential N+1 DB Queries:**
- Problem: For each creator in `getAllActiveCreators()`, the function makes separate sequential calls to `updateCreatorRecruitCount(creator.id)`, `updateCreatorTier(...)`, and `updateCreatorActiveMemberCount(creator.id)` inside a `for` loop.
- Files: `lib/creators/commission.ts:182-210`
- Cause: No batching — each creator requires 2-3 DB round trips in sequence.
- Improvement path: Run creator updates in parallel batches using `Promise.all()`, or rewrite as a single SQL `UPDATE ... FROM` bulk statement.

**`lib/protocol-templates.ts` is 4,074 Lines of Inline Static Data:**
- Problem: A single file exports all protocol template data — 4,000+ lines of hardcoded object literals loaded on every server bundle.
- Files: `lib/protocol-templates.ts`
- Cause: All templates hardcoded inline with no pagination or lazy loading.
- Improvement path: Split into individual template files under `lib/protocols/` and import dynamically in the protocol builder route; or move to the database for query-time filtering.

**`lib/resend.ts` is 1,495 Lines (All Email Templates Inline):**
- Problem: Every email template is defined inline in a single file, making it large and expensive to parse on each import.
- Files: `lib/resend.ts`
- Cause: No template separation or lazy loading.
- Improvement path: Split email templates into separate files under `lib/emails/` and import them only where needed.

**`lib/db.ts` is 1,453 Lines — All DB Operations in One File:**
- Problem: All database functions for users, orders, memberships, protocol outcomes, resilience scores, LMNs, and Stripe idempotency live in one file.
- Files: `lib/db.ts`
- Cause: No domain-based splitting was done as the schema grew.
- Improvement path: Split into domain-specific files (`lib/db/memberships.ts`, `lib/db/orders.ts`, `lib/db/lmn.ts`, etc.) with a barrel export at `lib/db/index.ts`.

---

## Fragile Areas

**108 macOS Copy Artifact Files Still in Repository:**
- Files: 108 files matching `* 2.tsx`, `* 3.tsx`, `* 4.tsx` patterns across `app/admin/club-orders/`, `app/creators/portal/`, `app/library/`, `app/science/[slug]/`, `app/track/daily/`, `app/renewal/success/`, `app/intake/success/`, and `app/creators/portal/resources/_data/`. Also `app/opengraph-image 2-4.png`, `app/twitter-image 2-4.png`.
- Why fragile: Next.js App Router ignores `page 2.tsx` as a route (space breaks the name), but the files confuse contributors and inflate `find`/`grep` output. The `_data/*.tsx` duplicates are imported by exact name — a future refactor could accidentally import a stale copy.
- Safe modification: `find app -name "* [2-9].*" -delete` after verifying canonical files are correct.
- Test coverage: None.

**12 Legacy Unused Component Files Still in Repository:**
- Files: `components/sections/` (9 files: Hero.tsx, Services.tsx, About.tsx, HowItWorks.tsx, Results.tsx, Pricing.tsx, Testimonials.tsx, FAQ.tsx, Waitlist.tsx), `components/Footer.tsx`, `components/Navigation.tsx`, `components/WaitlistForm.tsx`
- Why fragile: Zero imports in the entire codebase. These are dead code that bloat the repo and confuse contributors looking for "the hero component", who might edit an unused file.
- Safe modification: Delete all 12 files — no import anywhere references them.
- Test coverage: None.

**QuickBooks Token Refresh Silently Returns `null` on Many Error Paths:**
- Files: `lib/quickbooks.ts` (12+ `return null` statements in token refresh and API call functions)
- Why fragile: Callers must handle `null` returns before chaining QuickBooks operations, but several call sites proceed without null-guarding, leading to runtime failures at invoice creation time.
- Safe modification: Add explicit `if (!result) throw new Error(...)` guards at call sites in `app/api/admin/club-orders/[orderId]/approve/route.ts`.
- Test coverage: No QuickBooks integration tests exist.

**Portal Dashboard is a Stub — Real Patients Hit a Dead End:**
- Files: `app/portal/dashboard/page.tsx`
- Why fragile: Patients who authenticate via the new Phone OTP flow reach a page with only a logout button. The portal auth infrastructure (OTP, JWT, refresh tokens, portal sessions table) is fully built but the destination page is a placeholder.
- Safe modification: Implement order tracking and intake CTA as described in `.planning/phases/02-dashboard-order-tracking`.
- Test coverage: None.

---

## Scaling Limits

**In-Memory Rate Limiters Reset on Each Serverless Cold Start:**
- Current capacity: Works within a single long-running server process.
- Limit: On Vercel's serverless infrastructure each function invocation may run in a fresh container, resetting the in-memory `Map`. High-traffic scenarios with concurrent containers bypass all rate limits.
- Scaling path: `lib/rate-limit.ts` already has Upstash Redis integration — set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel to activate the Redis backend automatically.

**`@vercel/postgres` SDK Creates New Connections Per Request:**
- Current capacity: Functional at current Neon free-tier limits.
- Limit: No connection pooling configuration is visible. Neon's free tier has a connection limit; high-concurrency serverless deployments can exhaust the pool.
- Scaling path: Enable Neon connection pooling (PgBouncer) at the Neon dashboard level; no code changes required.

---

## Dependencies at Risk

**`@vercel/postgres` Ties All DB Queries to Vercel Platform:**
- Risk: Every database query (`lib/db.ts`, `lib/creators/db.ts`, `lib/portal-db.ts`, inline route files) imports from `@vercel/postgres`. Migrating off Vercel hosting requires replacing every query.
- Impact: Full codebase DB layer change if platform is ever switched.
- Migration plan: Abstract behind a thin `lib/db/client.ts` wrapper that re-exports `sql` from `@vercel/postgres`. A future migration swaps only the wrapper.

**Mailchimp Integration Has No Valid API Key:**
- Risk: Every club signup silently skips audience list sync. The Mailchimp account is not receiving new signups.
- Impact: `app/api/club/signup/route.ts:121-166`
- Migration plan: Regenerate key from Mailchimp dashboard, or replace with Resend audience lists (already a dependency with a verified sending domain).

---

## Missing Critical Features

**Twilio Production OTP Not Configured:**
- Problem: The phone OTP portal auth system is fully built but requires `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_VERIFY_SERVICE_SID` in production Vercel env vars before it can serve real patients.
- Blocks: Launching the patient portal to production users.

**Club Order Payment Link Auto-Generation Not Implemented:**
- Problem: Club order approvals require manual QuickBooks invoice creation and manual payment link sharing. The `TODO (Version 2)` comment describes automated payment link generation on approval.
- Blocks: Scaling club order volume without additional manual admin effort.
- Files: `app/api/admin/club-orders/[orderId]/approve/route.ts:231`

**Authorize.net Webhook Admin Notifications Missing:**
- Problem: Failed Authorize.net payments and expiring subscriptions generate no admin notification email.
- Blocks: Timely response to payment failures for Authorize.net subscribers.
- Files: `app/api/webhook/authorize-net/route.ts:162,266`

---

## Test Coverage Gaps

**Admin Routes Entirely Untested:**
- What's not tested: All routes under `app/api/admin/` — creator approval/rejection, payout processing, club order approval, intake viewing, and order fulfillment.
- Files: `app/api/admin/`
- Risk: Admin actions could produce incorrect DB state (e.g., commission records marked `paid` without payment) with no test catching the regression.
- Priority: High

**QuickBooks Integration Untested:**
- What's not tested: `lib/quickbooks.ts` — token refresh, customer creation, invoice creation, payment recording.
- Files: `lib/quickbooks.ts`
- Risk: QuickBooks token expiry or API schema changes surface only at runtime during club order approval.
- Priority: High

**Creator Commission Engine Partially Untested:**
- What's not tested: `lib/creators/commission.ts` `processOrderAttribution()` — specifically the 25% cap logic within the 6-month bonus window, the `attribution_active` re-signup block, and multi-tier override calculation.
- Files: `lib/creators/commission.ts`
- Risk: Commission miscalculation affects creator payouts and can expose the company to under- or over-payment.
- Priority: High

**Payment Webhook Handlers Untested:**
- What's not tested: `app/api/webhook/stripe/route.ts` (817 lines), `app/api/webhook/authorize-net/route.ts`, `app/api/webhook/affirm/route.ts`, `app/api/webhook/klarna/route.ts`
- Files: `app/api/webhook/`
- Risk: Subscription lifecycle events (cancellation, renewal, payment failure) could silently misfire, leaving DB state inconsistent with Stripe's truth.
- Priority: High

**Intake Form Submission Flow Untested:**
- What's not tested: `app/api/intake/submit/route.ts` — medication ID mapping, Asher Med order creation, DB record writes, and partner note PATCH.
- Files: `app/api/intake/submit/route.ts`, `lib/intake-utils.ts`
- Risk: Any Asher Med API contract change goes undetected until a real patient submits a form.
- Priority: Medium

---

*Concerns audit: 2026-03-11*
