# Codebase Concerns

**Analysis Date:** 2026-03-11

---

## Tech Debt

**macOS Copy Artifacts (114 files):**
- Issue: macOS Finder copy artifacts like `page 2.tsx`, `page 3.tsx`, `ClubOrdersClient 2.tsx`, etc. persist across the entire codebase — a prior cleanup pass removed 140 such files but the problem has recurred.
- Files: `app/admin/club-orders/page 2.tsx`, `app/admin/club-orders/ClubOrdersClient 2.tsx`, `app/creators/portal/layout 2.tsx`, `app/library/peptide-faq/PeptideFAQContent 2.tsx`, `app/track/daily/page 3.tsx`, and 109 more.
- Impact: Build artifact bloat, risk of Next.js picking up duplicate page definitions, confusing directory listings. Spaces in filenames cause issues with certain CLI tools.
- Fix approach: Run `find . -name "* [0-9].tsx" -o -name "* [0-9].ts" | grep -v node_modules | xargs rm` then add a pre-commit lint rule or `.gitignore` pattern to block future copies.

**Legacy/Unused Component Directories:**
- Issue: `components/sections/` (9 files: Hero, Services, About, HowItWorks, Results, Pricing, Testimonials, FAQ, Waitlist) and three root-level components (`components/Footer.tsx`, `components/Navigation.tsx`, `components/WaitlistForm.tsx`) are not imported anywhere in the codebase.
- Files: `components/sections/Hero.tsx`, `components/sections/Services.tsx`, `components/sections/About.tsx`, `components/sections/HowItWorks.tsx`, `components/sections/Results.tsx`, `components/sections/Pricing.tsx`, `components/sections/Testimonials.tsx`, `components/sections/FAQ.tsx`, `components/sections/Waitlist.tsx`, `components/Footer.tsx`, `components/Navigation.tsx`, `components/WaitlistForm.tsx`
- Impact: Increases cognitive overhead. Developers may edit the wrong file. Increases build analysis surface.
- Fix approach: Delete all 12 files. The active equivalents live in `components/site/`.

**Unused Dependency (`class-variance-authority`):**
- Issue: `class-variance-authority` ^0.7.1 is in `package.json` but is never imported anywhere. All button variant logic uses manual objects + `cn()` instead.
- Files: `package.json`
- Impact: Adds to bundle analysis noise; confuses future developers who may expect CVA patterns.
- Fix approach: `npm uninstall class-variance-authority`.

**Empty `lib/stores/` Directory:**
- Issue: `lib/stores/` directory exists but contains no files and is not referenced anywhere.
- Files: `lib/stores/`
- Impact: Low — cosmetic only.
- Fix approach: Remove the directory.

**`lib/data-normalization.ts` Potentially Unused in App:**
- Issue: `lib/data-normalization.ts` (586 lines) defines biomarker normalization utilities but no file in `app/` imports from it. It appears to be infrastructure built ahead of a feature that hasn't launched.
- Files: `lib/data-normalization.ts`
- Impact: Dead code at 586 lines adds maintenance burden without value.
- Fix approach: Verify no usage, then either delete or move to a `_future/` holding area if planned for upcoming biomarker feature.

**`strict: false` in TypeScript Config:**
- Issue: `tsconfig.json` sets `"strict": false`, disabling null checks, implicit any checks, and other safety guards. Combined with `"allowJs": true`, this permits silent type holes throughout the codebase.
- Files: `tsconfig.json`
- Impact: Type errors can slip through. Several patterns use `as any` casts (13 in `app/`) that would be caught under strict mode.
- Fix approach: Enable `strict: true` and work through errors incrementally. Start with `lib/` utilities, then API routes.

**Legacy `moduleResolution: "node"` in TypeScript Config:**
- Issue: `tsconfig.json` uses `"moduleResolution": "node"` (legacy). Modern Next.js recommends `"bundler"` resolution for correct ESM/CJS interop.
- Files: `tsconfig.json`
- Impact: Subtle import resolution mismatches in edge cases, particularly with packages that export different CJS/ESM bundles.
- Fix approach: Change to `"moduleResolution": "bundler"` and test build.

---

## Known Bugs

**Creator Earnings: `lastMonthEarnings` Calculation is Wrong:**
- Symptoms: `lastMonthEarnings` is computed as `lastMonthStats.totalCommission - thisMonthStats.totalCommission` — subtracting this month from last month rather than computing last month in isolation with a date range query.
- Files: `app/api/creators/earnings/overview/route.ts` line 39
- Trigger: Any creator who earned commissions this month will see a negative or incorrect `lastMonthEarnings` value on the Earnings Overview page.
- Workaround: None — the value is displayed in the creator portal Earnings section.
- Fix approach: Add a `getCommissionSummaryByCreatorSince(id, start, end)` function to `lib/creators/db.ts` that queries `commission_ledger` with date boundaries, and use it for `thisMonthEarnings` and `lastMonthEarnings`.

**Creator Earnings: `thisMonthEarnings` / `lastMonthEarnings` Exclude Override Commissions:**
- Symptoms: Monthly earnings figures only count direct commissions from `order_attributions` (via `getCreatorOrderStats`), not override/recruitment commissions from `commission_ledger`. `lifetimeEarnings` correctly includes all streams.
- Files: `app/api/creators/earnings/overview/route.ts` lines 27-39
- Trigger: Creators with active recruits generating overrides will see artificially low monthly earnings.
- Workaround: None — documented as a known TODO in the route file.

**Asher Med Patient ID Ambiguity:**
- Symptoms: `createNewOrder()` returns `AsherApiSuccess<AsherPatient>`, so `result.data.id` is the **patient ID** not an order ID. This value is then used in two ways: (1) sent to `updateOrderApproval(result.data.id, ...)` which expects an order ID, and (2) stored as `asher_patient_id` in the local DB. The PATCH to Asher Med likely fails silently.
- Files: `app/api/intake/submit/route.ts` lines 183, 204, 254; `lib/asher-med-api.ts` line 379
- Trigger: Every new intake form submission — the partner note PATCH call uses the wrong ID type.
- Workaround: PATCH fails inside a `try/catch` so intake succeeds, but the partner note is never sent to Asher Med.
- Fix approach: Confirm actual Asher Med API behavior via their docs/sandbox. If the new-order endpoint returns a patient-only response, investigate if there is a separate order ID in the response payload or if a subsequent order-lookup call is needed before PATCH.

**Mailchimp Integration is Broken:**
- Symptoms: The Mailchimp API key stored in environment variables is invalid (returns 401). Club member signups silently fail Mailchimp sync.
- Files: `app/api/club/signup/route.ts` lines 122-143
- Trigger: Every `POST /api/club/signup` call attempts Mailchimp sync via `syncToMailchimp()` which fails silently via `.catch()`.
- Workaround: Error is swallowed; user signup still succeeds but is not added to the Mailchimp audience.
- Fix approach: Regenerate the Mailchimp API key from the Mailchimp dashboard and update `MAILCHIMP_API_KEY` in both Vercel projects.

---

## Security Considerations

**Order Fulfillment Route Has No Proper Authentication:**
- Risk: `POST /api/admin/orders/[orderNumber]/fulfill` and `GET /api/admin/orders/[orderNumber]/fulfill` use a simple header secret (`x-admin-secret` vs `ADMIN_SECRET` env var) instead of the JWT-based `verifyAdminAuth` used by all other admin routes. Critically, the check is only enforced when `NODE_ENV === 'production'` — anyone on staging can call this endpoint without any credentials.
- Files: `app/api/admin/orders/[orderNumber]/fulfill/route.ts` lines 27-35, 180-187
- Current mitigation: `NODE_ENV === 'production'` gate exists, but `ADMIN_SECRET` is not defined in the known environment variable inventory, suggesting it may not be set.
- Recommendations: Replace the `x-admin-secret` check with `verifyAdminAuth(request)` to match all other admin routes. Remove the `NODE_ENV` gate.

**Development Mode Auto-Grants Admin Session:**
- Risk: `getSession()` in `lib/auth.ts` returns a hardcoded admin session (`role: 'admin'`) when `NODE_ENV === 'development'`. Any developer running locally has full admin access without authentication.
- Files: `lib/auth.ts` lines 96-99
- Current mitigation: Only affects `NODE_ENV === 'development'` builds.
- Recommendations: Acceptable for local dev, but document clearly. Ensure `NODE_ENV` is never `development` on any deployed environment.

**Magic Link Rate Limiter Uses In-Memory State (Serverless Unsafe):**
- Risk: `lib/auth.ts` implements rate limiting for magic link requests via a module-level `Map<string, number>`. In a serverless environment (Vercel), each function invocation may run in a different process, making this rate limit completely ineffective — an attacker can send unlimited magic link requests.
- Files: `lib/auth.ts` lines 112-138
- Current mitigation: Upstash Redis is listed as optional but may not be configured. The `lib/rate-limit.ts` module supports Redis but the magic link limiter in `lib/auth.ts` uses its own independent in-memory implementation.
- Recommendations: Replace with `lib/rate-limit.ts` backed by Upstash Redis. Ensure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set in production.

**Staging Authentication Bypass Has No Hard Production Guard:**
- Risk: The staging bypass in `lib/auth.ts` (`getSession()` returning concierge tier for `customerId === 'staging_customer'`) and the magic link bypass (any email gets a token on staging) rely on `NEXT_PUBLIC_SITE_URL` containing `"staging"`. If `NEXT_PUBLIC_SITE_URL` is misconfigured on production to include the word "staging", the bypass would activate on production.
- Files: `lib/auth.ts` lines 173-178; `app/api/auth/magic-link/route.ts` lines 29-41; `app/api/portal/send-otp/route.ts` line 42; `app/api/portal/verify-otp/route.ts` line 52
- Current mitigation: Controlled by env var. Bypass is intentional for testing.
- Recommendations: Add a secondary hard guard using `NODE_ENV === 'production'` to block staging bypasses, or switch to an explicit `ENABLE_STAGING_BYPASS=true` env var that is only set on staging.

**No Security Headers (CSP, X-Frame-Options, HSTS):**
- Risk: `next.config.js` only defines cache-control headers. There are no Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, or HSTS headers. This is particularly concerning for a HIPAA-adjacent application.
- Files: `next.config.js` lines 30-91
- Current mitigation: Vercel may add some default headers, but application-level headers are absent.
- Recommendations: Add security headers to the `headers()` function in `next.config.js`. At minimum: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.

**Intake Form Has No Bot Protection:**
- Risk: `POST /api/intake/submit` has no Turnstile or rate limit check. A bot could submit thousands of fake intake forms, creating fake Asher Med patient records and incurring API costs.
- Files: `app/api/intake/submit/route.ts`
- Current mitigation: Turnstile is only used on the waitlist (`app/api/waitlist/route.ts`). Creator apply route also lacks Turnstile.
- Recommendations: Add Cloudflare Turnstile verification to intake submit and creator apply routes. The `lib/turnstile.ts` utility and `@marsidev/react-turnstile` are already installed.

**Club Member Export Endpoint Uses Weak Bearer Token Auth:**
- Risk: `GET /api/admin/club-members/export/route.ts` authenticates by comparing the raw `Authorization: Bearer <token>` header against `CLUB_ORDER_APPROVAL_SECRET || JWT_SECRET`. Sharing the JWT secret as a bearer token is poor practice — compromise of the export token compromises session authentication.
- Files: `app/api/admin/club-members/export/route.ts` lines 7-17
- Current mitigation: Token check is implemented; endpoint is not publicly documented.
- Recommendations: Switch to `verifyAdminAuth(request)` consistent with all other admin routes.

---

## Performance Bottlenecks

**`lib/protocol-templates.ts` is 4,074 Lines:**
- Problem: The entire protocol template library is a single file with inline data structures, scoring algorithms, and catalog entries. It is imported by multiple routes and the ProtocolBuilderClient.
- Files: `lib/protocol-templates.ts`
- Cause: No splitting or lazy loading — the full 4K+ line module loads on any page that imports a single function.
- Improvement path: Split into `protocol-catalog.ts` (static peptide data), `protocol-scoring.ts` (matching algorithms), and `protocol-templates.ts` (template definitions). Use dynamic imports where only partial data is needed.

**`lib/resend.ts` is 1,495 Lines with All Email Templates Bundled:**
- Problem: All 15+ email templates are defined as inline HTML strings in a single file. Every API route that sends any email loads the entire module.
- Files: `lib/resend.ts`
- Cause: Monolithic email module.
- Improvement path: Split templates into separate files under `lib/emails/` and dynamically import only the needed template function.

**Payout Batch Route Uses N+1 Database Queries:**
- Problem: `POST /api/admin/creators/payouts/batch` iterates over all active creators in a `for` loop, executing `getApprovedCommissionsForPayout(creator.id)` as a separate DB query per creator, then `createPayout()` and one `updateCommissionStatus()` per commission.
- Files: `app/api/admin/creators/payouts/batch/route.ts` lines 33-83
- Cause: Sequential DB queries in a loop.
- Improvement path: Batch commission fetching with a single `WHERE creator_id = ANY($1)` query; use a transaction for the payout + commission-status updates.

---

## Fragile Areas

**Stripe Webhook: `plan_tier` Falls Back to `'unknown'`:**
- Files: `app/api/webhook/stripe/route.ts` line 175
- Why fragile: If `session.metadata.plan_tier` is not set at Stripe checkout session creation, the membership record is created with `plan_tier = 'unknown'`. This silently corrupts the membership tier and the member gets no library access.
- Safe modification: Ensure every Stripe checkout session creation call passes `metadata.plan_tier`. Add a validation log before the `createMembership` call to alert if the tier is unknown.
- Test coverage: No tests for the Stripe webhook handler.

**Creator Commission Cap Logic: 25% Cap Duration is From `creator_start_date`:**
- Files: `lib/creators/commission.ts`, `lib/config/affiliate.ts`
- Why fragile: The 25% total cap applies for 6 months from `creator_start_date`. After 6 months the cap drops to 10% (no stacking). If `creator_start_date` is NULL (creators approved before the field was added), commission calculations may behave unexpectedly.
- Safe modification: Ensure `creator_start_date` is populated via backfill migration before the 6-month window expires for any creator.
- Test coverage: Commission tests exist in integration suite but do not cover the 6-month rollover edge case.

**Club Order Approval Flow: No Payment Automation:**
- Files: `app/api/admin/club-orders/[orderId]/approve/route.ts` lines 231-235
- Why fragile: After admin approves a club order, the customer is told "payment link within 1-2 business days" and admin must manually send payment details. This is an entirely manual step with no code path — if admin forgets, the customer receives no payment link and the order stalls.
- Safe modification: Version 2 TODO at line 231 describes automated Stripe payment link generation. Implement before scaling club orders.
- Test coverage: None for the approval flow.

**Asher Med API Client Has No Request Idempotency:**
- Files: `lib/asher-med-api.ts`
- Why fragile: `createNewOrder()` and `createRenewalOrder()` have no idempotency keys. If the intake form submission network times out after Asher Med receives the request but before the client receives the response, a retry will create a duplicate patient/order.
- Safe modification: Add an idempotency key header (e.g., hash of patient email + DOB + timestamp rounded to 5 minutes) if Asher Med API supports it.
- Test coverage: No test for duplicate submission behavior.

**In-Memory Rate Limiter Falls Back Silently:**
- Files: `lib/rate-limit.ts` lines 47-58
- Why fragile: When Redis is unavailable, the rate limiter silently falls back to an in-memory store. On Vercel serverless, this means rate limiting does not work across invocations. There is no alerting when Redis is down.
- Safe modification: Add a warning log when the Redis client cannot be created, so ops team is alerted.
- Test coverage: Rate limiter behavior under Redis failure is not tested.

**Middleware Only Handles `join.cultrhealth.com` Rewriting:**
- Files: `middleware.ts`
- Why fragile: The middleware contains no authentication enforcement. All route protection is done per-API-route. If a new page route is added under `/library/` or `/admin/` without explicit `getSession()` / `verifyAuth()` calls, it will be publicly accessible. There is no central auth guard.
- Safe modification: Consider adding lightweight middleware-level auth checks for `/admin/*`, `/creators/portal/*`, and `/library/*` to provide a defense-in-depth layer.
- Test coverage: Middleware behavior is not tested.

---

## Scaling Limits

**Vercel Postgres (`@vercel/postgres`) Connection Limits:**
- Current capacity: Neon PostgreSQL serverless with `@vercel/postgres` SDK. Neon's free/hobby tiers limit concurrent connections.
- Limit: High-concurrency traffic (many simultaneous requests) will hit Postgres connection pool limits, resulting in `too many connections` errors (referenced in `lib/resilience.ts` line 784).
- Scaling path: Enable Neon connection pooling (PgBouncer). The `POSTGRES_URL` should point to the pooled endpoint.

**Creator Payout Batch is Synchronous:**
- Current capacity: Works for small creator counts (< ~50).
- Limit: `POST /api/admin/creators/payouts/batch` runs all payout creation sequentially in a `for` loop within a single serverless function invocation. At 200+ creators, this will hit Vercel's 60-second function timeout.
- Scaling path: Process payouts in background jobs (Vercel Cron + queue) rather than a single synchronous request.

---

## Dependencies at Risk

**Twilio Env Vars Not Yet Set in Production:**
- Risk: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_VERIFY_SERVICE_SID` are not listed as configured env vars in the Vercel `cultrhealth-com` project. The OTP phone login flow (`/portal/login`) is live in code but will crash on production because the staging bypass checks `NEXT_PUBLIC_SITE_URL.includes('staging')`.
- Impact: `POST /api/portal/send-otp` will throw `Error: Access to api.twilio.com failed` on production.
- Migration plan: Configure the three Twilio env vars in Vercel production environment before enabling the `/portal/login` route in production.

**Stripe API Version Pinned to Unreleased API:**
- Risk: `app/api/webhook/stripe/route.ts` line 7 uses `apiVersion: '2026-02-25.clover'`. This is a very recent/beta API version string.
- Impact: May break if Stripe deprecates this version or if behavior changes in patch releases.
- Migration plan: Pin to a stable, GA Stripe API version (e.g., `2024-06-20`).

**QuickBooks OAuth Refresh Token Expiry:**
- Risk: QuickBooks Online refresh tokens expire after 100 days of inactivity. If the QB integration is not used for 100 days, the token in the `quickbooks_tokens` table becomes invalid and all club order approvals fail silently (QB integration gracefully degrades).
- Impact: Club orders are approved but no QB invoice is created. Admin must manually re-authenticate via `/api/quickbooks/auth`.
- Migration plan: Implement a QB token health-check cron job (weekly) that attempts a token refresh to keep it alive.

---

## Missing Critical Features

**Creator Payout Disbursement Has No Actual Money Transfer:**
- Problem: The payout batch route (`app/api/admin/creators/payouts/batch/route.ts`) creates `payout` records in the database and marks commissions as `paid`, but does not actually initiate any money transfer — no Stripe Connect transfer, no PayPal payout, no bank transfer API call. Payouts are purely accounting records.
- Blocks: Creators cannot receive actual payments through the portal. Admin must manually transfer money outside the system.

**`/portal/*` Route Authentication Not Enforced in Middleware:**
- Problem: The member portal (`/portal/login`, future `/portal/dashboard`) has authentication logic in individual API routes but no middleware or layout-level server-side auth guard for the portal page routes. A user who navigates directly to any future `/portal/dashboard` URL without a valid session could potentially access UI before the client-side redirect kicks in.
- Blocks: Full production launch of the portal flow.

---

## Test Coverage Gaps

**Stripe Webhook Handler — Untested:**
- What's not tested: `handleCheckoutCompleted`, `handleSubscriptionUpdated`, `handleSubscriptionDeleted`, `handlePaymentFailed`, `handleChargeRefunded`, commission attribution on checkout, portfolio entry creation.
- Files: `app/api/webhook/stripe/route.ts` (817 lines)
- Risk: Silent regressions in subscription lifecycle, commission attribution, and membership creation could go undetected.
- Priority: High

**Creator Commission Engine — Partial Coverage:**
- What's not tested: The 6-month bonus window rollover (25% → 10% cap), attribution break rule on subscription cancel, override commission calculation with edge cases (recruits at tier boundaries).
- Files: `lib/creators/commission.ts`, `lib/creators/attribution.ts`
- Risk: Commission miscalculations that either underpay creators or overpay (exceeding the 25% cap).
- Priority: High

**Admin API Routes — No Tests:**
- What's not tested: Creator approve/reject, payout batch, intake viewer, club order approval, order fulfillment.
- Files: `app/api/admin/creators/[id]/approve/route.ts`, `app/api/admin/creators/[id]/reject/route.ts`, `app/api/admin/creators/payouts/batch/route.ts`, `app/api/admin/club-orders/[orderId]/approve/route.ts`, `app/api/admin/orders/[orderNumber]/fulfill/route.ts`
- Risk: Admin actions (approval, payout, fulfillment) could silently fail or produce incorrect state changes.
- Priority: High

**Payment Provider Webhooks — No Tests:**
- What's not tested: Affirm, Klarna, Authorize.net webhook handlers.
- Files: `app/api/webhook/affirm/route.ts`, `app/api/webhook/klarna/route.ts`, `app/api/webhook/authorize-net/route.ts`
- Risk: Failed order status updates after BNPL payment events go undetected.
- Priority: Medium

**Authorize.net Fraud Events — No Notification Path:**
- What's not tested (and not implemented): `handleFraudHeld()` in the Authorize.net webhook has a `// TODO: Send notification to admin for manual review` comment but does nothing. Fraud-held transactions are silently dropped.
- Files: `app/api/webhook/authorize-net/route.ts` line 162
- Risk: Fraudulent transactions held by Authorize.net are not reviewed and may auto-expire.
- Priority: Medium

---

*Concerns audit: 2026-03-11*
