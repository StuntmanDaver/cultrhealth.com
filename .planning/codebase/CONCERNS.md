# Codebase Concerns

**Analysis Date:** 2025-02-26

## Tech Debt

### TypeScript Configuration — Loose Type Checking
- **Issue:** `tsconfig.json` has `"strict": false` with `"allowJs": true`, meaning the codebase runs in permissive mode. Type safety is not enforced across the entire codebase.
- **Files:** `tsconfig.json` (line 14)
- **Impact:** Type errors go undetected at compile time, leading to potential runtime errors. Many implicit `any` types may exist. Harder to refactor safely.
- **Fix approach:** Gradually migrate to `"strict": true`. Start by enabling individual strict flags (`noImplicitAny`, `strictNullChecks`) and incrementally fix violations. This is a multi-phase effort (10+ PRs).

### Unused Components — `components/sections/` Directory
- **Issue:** 9 component files exist in `components/sections/` but are NOT imported anywhere in the codebase (`Hero.tsx`, `Results.tsx`, `Pricing.tsx`, `Waitlist.tsx`, `HowItWorks.tsx`, `Services.tsx`, `Testimonials.tsx`, `FAQ.tsx`, `About.tsx`). The homepage (`app/page.tsx`) builds all sections inline without importing from this directory.
- **Files:** `components/sections/*.tsx` (9 files)
- **Impact:** Unused code takes up codebase real estate, adds to bundle size slightly, creates confusion about where components live. Dead code rot — these may diverge from current design system over time.
- **Fix approach:** Delete `components/sections/` directory entirely. If future dynamic component loading is needed, refactor properly with inline implementations or a new pattern.

### Unused Dependency — `class-variance-authority`
- **Issue:** `class-variance-authority` ^0.7.1 is listed in `package.json` dependencies but is NOT imported or used anywhere in the codebase. The `Button` component uses manual variant objects with `cn()` utility instead.
- **Files:** `package.json`, `components/ui/Button.tsx`
- **Impact:** Adds ~2KB to bundle unnecessarily. Dependency maintenance burden with no benefit.
- **Fix approach:** Remove from `package.json` with `npm uninstall class-variance-authority`. No code changes needed.

### Empty Directory — `lib/stores/`
- **Issue:** Directory exists but is completely empty. Likely a leftover from planning Zustand/Redux store architecture that was never implemented (Context API used instead).
- **Files:** `lib/stores/`
- **Impact:** Confuses developers looking for global state management. No functional impact.
- **Fix approach:** Delete the empty directory.

### Dead Code in `lib/db.ts`
- **Issue:** Lines 200-216 in `updateMembership()` build an `updates` array and collect values, but this code is never actually executed. The function uses a simpler SQL approach starting at line 223 with COALESCE. The `String()` conversion on line 207 is dead code.
- **Files:** `lib/db.ts` (lines 200-216)
- **Impact:** Low risk (code is not executed), but creates confusion during code review. Adds ~15 lines of unmaintained logic.
- **Fix approach:** Delete lines 200-216. Keep only the working COALESCE-based SQL update.

### Duplicate/Artifact Files from Editing
- **Issue:** Multiple "Page 2", "Page 3", "Page 4", "Page 5" variants of the same routes exist (e.g., `app/track/daily/page 2.tsx`, `app/track/daily/page 3.tsx`, etc.). Also seen in migrations, configs, and public assets. These appear to be artifacts from bulk file editing or incomplete cleanup.
- **Files:** At least 60+ duplicate files across `app/`, `migrations/`, public assets
- **Impact:** Clutters the file tree, increases confusion during navigation, and wastes disk space. No functional impact if the main `route.ts` and `page.tsx` files are correct.
- **Fix approach:** Delete all duplicate artifact files (those with " 2", " 3", " 4", " 5" in their names). Keep only the single correct version of each file. Can be automated with `find . -name "* 2.*" -o -name "* 3.*" | xargs rm`.

## Known Issues & Bugs

### Potential Race Condition in Club Order Approval
- **Problem:** In `app/api/admin/club-orders/[orderId]/approve/route.ts`, the order status is checked at line 66, but if two approval requests arrive simultaneously, both could pass the `pending_approval` check and attempt to update the order. The second one would update successfully, potentially creating duplicate emails and ledger entries.
- **Files:** `app/api/admin/club-orders/[orderId]/approve/route.ts` (lines 66-113)
- **Trigger:** Submit two approval requests for the same order ID within the same second (or click the email approval link twice rapidly).
- **Current behavior:** Both requests send emails and update the order. The second update overwrites the first. If QB invoice creation is added, duplicate invoices would be created.
- **Fix approach:** Use database-level transaction isolation. Wrap the status check + update in a transaction with `BEGIN` / `COMMIT`. Alternatively, use an `UPDATE ... SET status = 'approved' WHERE status = 'pending_approval'` atomic operation that returns the affected row count — if 0 rows affected, another approval already happened.

### Missing Email Configuration Validation
- **Problem:** Many API routes depend on `RESEND_API_KEY`, `FROM_EMAIL`, `FOUNDER_EMAIL`, and `ADMIN_APPROVAL_EMAIL` being set. Failures to send emails are caught and logged, but the API response to the user doesn't always indicate email failure.
- **Files:** `app/api/club/orders/route.ts` (lines 101-150), `app/api/admin/club-orders/[orderId]/approve/route.ts` (lines 90-102), etc.
- **Trigger:** Deploy to staging/production with missing or invalid email env vars.
- **Current behavior:** API returns 200 OK (order created), but customer never receives confirmation email. Customer is left unaware. Email error is only visible in server logs.
- **Fix approach:** Make email environment variables required. At service startup, validate that `RESEND_API_KEY` and email addresses are present. For club order routes, return a partial success response with flags: `{ success: true, orderCreated: true, customerEmailSent: false, adminEmailSent: false }`. Client can display a warning.

### Hardcoded JWT Fallback Secrets
- **Problem:** `lib/auth.ts` has hardcoded fallback secrets if env vars are missing: `'cultr-magic-link-secret-change-in-production'` and `'cultr-session-secret-change-in-production'`. These are weak and the same across all deployments if env vars aren't set.
- **Files:** `lib/auth.ts` (lines 7-12)
- **Impact:** In development, tokens are predictable. If `.env` is accidentally not set in production, users' session tokens could be forged.
- **Workaround:** Currently none (code doesn't warn or error).
- **Fix approach:** Throw an error at startup if `JWT_SECRET` or `SESSION_SECRET` are not set. Never provide a fallback. Add a startup validation function: `validateSecrets()` that runs in the root layout and throws if secrets are missing.

## Security Considerations

### HMAC Token Expiry Not Enforced
- **Issue:** In `app/api/admin/club-orders/[orderId]/approve/route.ts`, the approval token is generated with a timestamp embedded in it (line 59), but there's no expiry check on the token. The token is just compared for equality against the stored value.
- **Files:** `app/api/admin/club-orders/[orderId]/approve/route.ts` (line 59), `app/api/club/orders/route.ts` (line 59)
- **Impact:** An approval link sent in an email is valid indefinitely. If intercepted, it could be used days/months later. Should have a 30-minute expiry.
- **Current mitigation:** Tokens are one-per-order and tied to a specific email address.
- **Fix approach:** Parse the timestamp from the HMAC token payload. On validation, check `Date.now() - embeddedTimestamp > 30 * 60 * 1000` and reject if expired. Store both approval_token and approval_token_expires_at in the DB.

### QuickBooks OAuth Token Rotation Not Fully Validated
- **Issue:** `lib/quickbooks.ts` rotates OAuth2 refresh tokens on each API call. The new refresh token is stored in the DB. However, if the DB write fails after QB returns a new token, the new token is lost and the old (now-invalid) token remains in the DB. Subsequent calls will try to refresh with an invalid token.
- **Files:** `lib/quickbooks.ts` (lines 100-150, token refresh logic)
- **Impact:** QB API calls would start failing with "Invalid refresh token" errors. Orders wouldn't be created in QB. This would go unnoticed until the next order approval attempt. Manual recovery needed: restart the OAuth flow or manually update the DB token.
- **Workaround:** If this happens, QB token must be refreshed manually via the OAuth callback handler.
- **Fix approach:** Implement a retry mechanism for token storage failure. If DB write fails, log the new token to a fallback location (e.g., memory cache, logging service). On next call, attempt to use the in-memory token before trying the DB token. For production, consider using Vercel KV (Redis) as a secondary token store.

### No Rate Limiting on Sensitive Endpoints
- **Issue:** API endpoints like `/api/auth/verify`, `/api/club/orders`, and `/api/admin/club-orders/[orderId]/approve` have no rate limiting or brute-force protection.
- **Files:** `app/api/auth/verify/route.ts`, `app/api/club/orders/route.ts`, `app/api/admin/club-orders/[orderId]/approve/route.ts`
- **Impact:** Attackers could brute-force email-based auth tokens, spam club orders with garbage data, or repeatedly approve the same order.
- **Current mitigation:** Cloudflare Turnstile is used on forms, but API routes themselves have no checks. Magic link tokens expire in 15 minutes.
- **Fix approach:** Implement rate limiting using `lib/rate-limit.ts` (exists but may not be used on all endpoints). Suggested limits: 5 magic link requests per email per hour, 10 club orders per IP per hour, 20 approval attempts per order across all IPs per hour.

### Token Signature Verification Uses Default Secret on Staging
- **Issue:** On `staging.cultrhealth.com`, any email can login without sending/verifying a magic link (auth is bypassed). However, the bypass logic checks `process.env.NEXT_PUBLIC_SITE_URL` for "staging" in the hostname, which is client-visible. An attacker with knowledge of this pattern could potentially craft requests that trigger staging auth bypass.
- **Files:** `app/api/auth/verify/route.ts` (staging bypass logic)
- **Impact:** Low risk in practice (staging is not public), but an OPEN_SECRET in the codebase. If staging URL is ever advertised or leaked, auth is bypassed.
- **Workaround:** Staging is behind Vercel basic auth (if configured).
- **Fix approach:** Use a server-side environment variable to detect staging mode, not the public SITE_URL. Add `ENABLE_BYPASS_AUTH=true` (staging only) and check that instead.

## Performance Bottlenecks

### No Pagination on Long Database Queries
- **Issue:** Several queries do not limit result sets. For example, `getOrders()` or `listCreators()` could fetch thousands of rows if not manually limited.
- **Files:** `lib/db.ts`, `lib/creators/db.ts` (specific instances depend on implementation)
- **Impact:** If the database grows (e.g., 100K orders), unbounded queries could pull megabytes of data into memory, causing slowness and potential out-of-memory errors.
- **Fix approach:** Add `LIMIT` and `OFFSET` clauses to all list queries. Implement cursor-based pagination (preferred) or offset pagination. Update API responses to include `nextCursor` or `hasMore` flags.

### Recharts Bundle Included Only in One Component
- **Issue:** Recharts (3.7.0) is only used in `components/creators/AnalyticsCharts.tsx`. But it's in `dependencies`, not `devDependencies`, so it's bundled for all pages.
- **Files:** `components/creators/AnalyticsCharts.tsx`, `package.json`
- **Impact:** Adds ~80KB gzipped to the bundle for pages that don't use it. Dynamic import with lazy loading would reduce main bundle.
- **Fix approach:** Wrap `AnalyticsCharts` in `next/dynamic` with `ssr: false` in the analytics dashboard. Recharts will only load when that page is visited.

### No Image Optimization on User Uploads
- **Problem:** Files uploaded via intake forms (ID photos, consent signatures) are stored as-is in S3 via Asher Med presigned URLs. No image optimization (resize, compress, format conversion) happens server-side.
- **Files:** `app/api/intake/upload/route.ts`, `components/intake/IDUploader.tsx`
- **Impact:** Large image files from mobile cameras (5-10MB) go straight to S3. Bandwidth waste, storage costs. No user feedback on file size limits.
- **Fix approach:** Add client-side validation for file size (max 5MB). If larger, show error. Server-side, validate Content-Length header. For future enhancement, use sharp to optimize images before S3 upload.

## Fragile Areas

### Multi-Provider Payment Processing Without Atomic Transactions
- **Issue:** Payment provider webhooks (Stripe, Affirm, Klarna, Authorize.net) update the database, send emails, and potentially create QB invoices. If the webhook fails partway through, the state can be inconsistent (e.g., order marked as paid, but confirmation email never sent).
- **Files:** `app/api/webhook/stripe/route.ts`, `app/api/webhook/affirm/route.ts`, `app/api/webhook/klarna/route.ts`, `app/api/webhook/authorize-net/route.ts`
- **Impact:** Manual intervention needed to reconcile database state vs. payment provider state. Customers may not receive confirmation emails. Orders may be lost.
- **Workaround:** Idempotency checks exist for Stripe events. Others lack this.
- **Fix approach:** Refactor webhook handlers to use database transactions. Wrap the entire webhook logic in `BEGIN TRANSACTION` ... `COMMIT` or `ROLLBACK`. If any step fails, roll back all changes. Retry failed webhooks via a job queue (Bull, Temporal, or AWS SQS).

### Medical Intake Form State Spread Across Files
- **Issue:** The multi-step intake form state is managed via `IntakeFormContext` and persisted to the database, but there's also client-side `localStorage` state. If the DB and localStorage get out of sync (network error during submit), the user might submit stale data or duplicate their progress.
- **Files:** `lib/contexts/intake-form-context.tsx`, `app/intake/IntakeFormClient.tsx`, `components/intake/` (13 form components)
- **Impact:** Data loss or duplicate submissions. Users might re-enter data unnecessarily.
- **Fix approach:** Establish a single source of truth. On form load, fetch state from DB (not localStorage). On each step, save to DB immediately (debounced). Only use localStorage as a short-term backup for form-in-progress (< 1 hour). Clear localStorage on successful submission.

### Creator Affiliate Commission Logic — No Audit Trail for Overrides
- **Issue:** Admin can manually create commission adjustments, but there's no audit trail showing who made the adjustment, when, or why.
- **Files:** `lib/creators/commission.ts`, `app/api/admin/creators/[id]/...` (adjustment endpoints)
- **Impact:** If a commission error occurs, it's hard to trace the root cause. No accountability for manual adjustments.
- **Fix approach:** Add `commission_adjustment_reason` and `commission_adjusted_by_admin_email` columns to the commission ledger. Log all adjustments with a reason (e.g., "Refund reversal", "Manual correction"). Add an audit log view in the admin panel.

### Library Content Rendering — No XSS Protection on Markdown
- **Issue:** Markdown content from `content/blog/` and `content/library/` is rendered via `marked` and sanitized with `DOMPurify`. However, if DOMPurify is misconfigured or updated improperly, XSS is possible.
- **Files:** `lib/blog-content.ts`, `lib/library-content.ts`, usage in `app/science/[slug]/page.tsx`
- **Impact:** Admin could accidentally inject malicious scripts in blog posts. Users' browsers would execute them.
- **Current mitigation:** DOMPurify is used correctly (default config). No custom HTML is allowed.
- **Fix approach:** Lock DOMPurify to a specific version (currently 3.3.1). Add a pre-deployment test: render a sample blog post with known XSS payloads and verify they're stripped.

## Scaling Limits

### Database Connection Pool — No Explicit Management
- **Issue:** Every API route uses `@vercel/postgres` which creates pooled connections, but the pool size and timeout are not configured. Under high load, connections could be exhausted.
- **Files:** `lib/db.ts`, every `app/api/*/route.ts`
- **Impact:** If 100+ concurrent requests hit the DB simultaneously, connection pool could be exhausted, causing `ECONNREFUSED` errors.
- **Current state:** This is rarely an issue for staging/small production deployments (Neon allows 100+ connections per plan), but becomes critical at scale (1000+ concurrent users).
- **Scaling path:** Configure pool size in Vercel Postgres (Neon) dashboard. Implement query timeouts (`max_query_duration`). Add monitoring/alerts for connection exhaustion. Consider connection pooling via PgBouncer if scaling further.

### No Caching Strategy for Frequently Accessed Data
- **Issue:** Product catalog, trust metrics, pricing plans, and creator profiles are queried on every page load from the database with no caching.
- **Files:** `lib/config/product-catalog.ts`, `lib/config/social-proof.ts`, `lib/creators/db.ts` (creator profile queries)
- **Impact:** Database load increases linearly with traffic. Page load times suffer. At 10K DAU, database becomes a bottleneck.
- **Current mitigation:** Next.js ISR (incremental static regeneration) is used for some static pages.
- **Scaling path:** Implement Redis caching for: product catalog (TTL 1 hour), creator profiles (TTL 5 min), trust metrics (TTL 1 hour). Use Upstash Redis (env vars already exist but unused). Cache invalidation on admin updates.

### Stripe Webhook Processing Not Queued
- **Issue:** Stripe webhook handlers (`app/api/webhook/stripe/route.ts`) execute synchronously. If QB invoice creation or email sending is slow, the webhook handler blocks. If it times out (30s), Stripe may retry, leading to duplicate processing.
- **Files:** `app/api/webhook/stripe/route.ts` (handles checkout.session.completed, customer.subscription.updated, etc.)
- **Impact:** Slow webhooks = slow response to Stripe = Stripe retries = potential duplicate orders. High-traffic events (big sale) could cause cascading failures.
- **Fix approach:** Move webhook processing to a background job queue. Return 200 OK immediately, then process the event asynchronously. Use Bull (Redis-backed queue) or Vercel Edge Functions.

## Dependencies at Risk

### AI SDK Version Lock
- **Issue:** `ai` ^6.0.59, `@ai-sdk/openai` ^3.0.21, `@ai-sdk/react` ^3.0.61 are pinned. If OpenAI API changes, the SDK may break protocol generation and meal plan features.
- **Files:** `package.json`, `app/api/protocol/generate/route.ts`, `app/api/meal-plan/route.ts`
- **Impact:** Meal plans and protocol generation could break silently if the SDK has a bug or OpenAI deprecates endpoints.
- **Current mitigation:** None. Tests exist but are minimal.
- **Fix approach:** Monitor AI SDK releases. Pin to specific versions (not `^`). Add integration tests that actually call OpenAI (in a separate test suite, not in CI/CD). Have a rollback plan if SDK updates break the feature.

### Stripe API Version Mismatch
- **Issue:** `Stripe` ^20.2.0 is installed, but the webhook handler specifies API version `'2026-02-25.clover'` (line 7 of `app/api/webhook/stripe/route.ts`). This may not match the version installed.
- **Files:** `package.json`, `app/api/webhook/stripe/route.ts`
- **Impact:** If the Stripe SDK and API version don't align, webhook payload parsing could fail.
- **Fix approach:** Verify the installed Stripe SDK version supports the specified API version. Use `npm list stripe` to check. Update `app/api/webhook/stripe/route.ts` to use a supported version or remove the `apiVersion` override (use SDK default).

## Missing Critical Features

### No Webhook Retry or Dead Letter Queue
- **Issue:** If a webhook handler fails (e.g., email service down), there's no automatic retry or human-visible queue of failed webhooks.
- **Files:** All `app/api/webhook/*` handlers
- **Impact:** Failed payments are not reconciled. Customers miss confirmations. Manual DB cleanup needed.
- **Fix approach:** Implement a `failed_webhooks` table. On handler error, insert the raw webhook payload. Add a cron job to retry failed webhooks every 5 minutes for up to 24 hours. Alert admins to unresolved webhooks.

### No Audit Logging for Admin Actions
- **Issue:** Admin actions (create creator, approve order, adjust commission) are not logged. No trail of who did what, when, or why.
- **Files:** `app/admin/` routes
- **Impact:** If an admin accidentally deletes a creator or approves a fraudulent order, there's no way to investigate or recover.
- **Fix approach:** Add `admin_actions` logging (table already exists per CLAUDE.md). Log every admin action: user, action, resource, timestamp, outcome. View in admin dashboard. Keep logs for 1 year.

### No Two-Factor Authentication for Admin/Creator Accounts
- **Issue:** Admin and creator logins use only email-based magic links. No MFA (TOTP, hardware keys).
- **Files:** `app/api/auth/verify/route.ts`, `app/api/creators/magic-link/route.ts`
- **Impact:** If an admin's email is compromised, attacker can take over their account. Creators' accounts are similarly vulnerable.
- **Fix approach:** Implement TOTP MFA for admin accounts (required). For creators, offer optional MFA. Use a library like `speakeasy` for TOTP generation and validation.

## Test Coverage Gaps

### 71 API Routes, Only 7 Test Files
- **Untested:** Most of `app/api/` (Stripe webhooks, BNPL providers, creator endpoints, admin endpoints, intake processing)
- **Files:** `app/api/*` (71 endpoints), `tests/` (7 test files covering protocol generation, auth, plans, library content, TierGate component)
- **Risk:** Critical user flows (checkout, intake submission, order approval) have no automated test coverage. Regressions go undetected until production.
- **Priority:** High. Critical paths should have integration tests.
- **Fix approach:**
  1. Add integration tests for checkout flow (Stripe mock)
  2. Add tests for Affirm/Klarna webhook handlers
  3. Add tests for creator commission calculation
  4. Add tests for club order approval (atomic update)
  5. Aim for 60%+ coverage of `app/api/`

### No E2E Tests for Member Workflows
- **Untested:** Full user journey (signup → intake → checkout → dashboard → renewal)
- **Files:** No E2E test suite exists
- **Risk:** Member-facing features could break silently. Sign-up funnel could fail undetected.
- **Priority:** Medium (can be added gradually)
- **Fix approach:** Set up Playwright or Cypress. Write tests for: signup flow, intake form submission, checkout with Stripe (test mode), viewing orders in dashboard, renewal flow.

### No Load/Stress Tests
- **Untested:** How the system behaves under 1000+ concurrent users
- **Files:** None
- **Risk:** Database or API could become bottleneck at scale. Payment processing could be queued indefinitely.
- **Priority:** Medium (needed before scaling to production traffic)
- **Fix approach:** Use `k6` or Apache JMeter. Simulate: 100 concurrent signups, 50 concurrent checkouts, 20 concurrent admin approvals. Identify bottlenecks. Set performance budgets (p95 response time < 500ms).

---

*Concerns audit: 2025-02-26*
