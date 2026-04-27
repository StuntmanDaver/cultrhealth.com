# Technical Concerns

*Last updated: 2026-04-27*
*Scope: cultrhealth.com (this repo, deployed to staging on Vercel + production on Cloudflare Pages via sibling repo `cultrhealth-web`)*

> **Deploy reality check (verified 2026-04-27):**
> - This repo (`/Cultr Health Website/`) deploys `staging` branch to Vercel only (`staging.cultrhealth.com`).
> - Production (`cultrhealth.com` + `www`) runs on **Cloudflare Pages** from sibling repo `cultrhealth-web/main` — *not* from this repo.
> - The legacy `production` branch on Vercel is no longer the live production source. `vercel.json:4-7` disables auto-deploy for `main`/`master`.
> - `join.cultrhealth.com` was retired Apr 22 2026 — the subdomain no longer resolves.
> - Cron jobs in `vercel.json` only run on the Vercel staging deployment. **Production crons must be configured separately on Cloudflare** (sibling repo) — risk if missed.

---

## CRITICAL

### C1. macOS-duplicate `.env` files leaking secrets into git status

**Where:** Repo root.
- `.env 2.cf-import` (untracked)
- `.env 2.vercel-all` (untracked)
- `.env 4.vercel-all` (untracked)
- `.env.cf-import` (untracked)
- `.env.vercel-all` (untracked)

**Why it matters:** `.gitignore` lines 21-23 cover only `.env`, `.env.production`, and `.env*.local`. The Finder-collision filenames (`.env 2.*`, `.env 4.*`) and the unsuffixed exports (`.env.cf-import`, `.env.vercel-all`) match **none** of the existing patterns and will be staged by an unwary `git add -A`. These files were created during the recent CF Pages env-var pull and almost certainly contain `STRIPE_SECRET_KEY`, `JWT_SECRET`, `POSTGRES_URL`, `RESEND_API_KEY`, etc.

**Mitigation:** Treat as a near-miss. Delete the files immediately and append `.env*.cf-import`, `.env*.vercel-all`, `.env *` (with literal space) to `.gitignore`.

**Outstanding:** Audit `git log -p` for accidental commits of any `.env *` artifact in the past 60 days.

---

### C2. macOS-duplicate source files (`* 2.tsx`, `* 2.sql`) in working tree

**Where:**
- `components/dosing-calculator/SyringeMeter 2.tsx`
- `migrations/037_generic_ehr_identity 2.sql`
- `migrations/038_membership_shipping_address 2.sql`
- `migrations/039_siphox_ehr_linkage 2.sql`
- `migrations/040_member_onboarding 2.sql`
- `migrations/057_signup_coupon_codes 2.sql`
- `migrations/058_add_creator_jonas_machado 2.sql`
- `migrations/058_add_creator_jonas_machado 4.sql`
- `migrations/059_update_jonas_machado_commission 2.sql`
- `.claude/skills/siphox-api/SKILL 2.md`
- `docs/superpowers/plans/2026-04-20-cultrhealth-cloudflare-migration {2,3,4}.md`
- `docs/superpowers/specs/2026-04-20-cultrhealth-cloudflare-migration-design 2.md`

**Why it matters:** Next.js will attempt to compile `SyringeMeter 2.tsx` alongside `SyringeMeter.tsx`. Two files exporting the same default symbol can cause name collisions in the bundle, broken HMR, or silently shipped duplicate components. Duplicated migration files are worse — running `node scripts/run-migration.mjs` against the wrong copy can apply a subtly different schema.

**Mitigation:** Delete every `* 2.*`, `* 3.*`, `* 4.*` artifact before next commit. Add a pre-commit hook: `find . -regex '.*[[:space:]][2-9]\.\(tsx\|ts\|sql\|md\)$' -not -path './node_modules/*'` should return zero.

---

### C3. Florida-only jurisdiction gate is built but **NOT wired** into the funnel

**Where:**
- Component exists: `components/compliance/FloridaStateGate.tsx`
- Tests exist: `tests/components/FloridaStateGate.test.tsx`
- `JURISDICTION_STATEMENT` referenced in: `app/legal/medical-disclaimer/page.tsx:113`, `app/legal/privacy/page.tsx:40`, `app/legal/provider-credentials/page.tsx:142`, `components/site/Footer.tsx:199`
- **Zero usage in `app/quiz/`, `app/intake/`, `app/join/`, or any checkout API** (verified by grep — no hits for `FloridaStateGate` or `stateCode`/`isFlorida`/`residenceState` in any of those folders).

**Why it matters:** Per memory `project_florida_jurisdiction_apr14.md` tasks 10-12 ("gate quiz/intake/checkout") were planned but never shipped. Today a user from any U.S. state can complete the quiz → intake → checkout path. Legal exposure for prescribing outside Florida; LegitScript prerequisite gap.

**Mitigation:** None at the funnel level. Footer disclaimer is the only customer-facing notice.

**Outstanding:** Wire `<FloridaStateGate>` into `QuizClient.tsx` (entry), `IntakeFormClient.tsx` (state question), and as a server-side check on `/api/intake/submit`, `/api/quote`, `/api/checkout/*`.

---

### C4. ConsentModal is mounted only on `/join/[tier]` — a route the middleware blocks

**Where:**
- `app/join/[tier]/page.tsx:10` imports `ConsentModal`
- `app/join/[tier]/page.tsx:599` renders it
- `middleware.ts:25-27` rewrites every `/join` request on non-local hosts to `/not-found`
- `next.config.js:177-180` 301-redirects `/join` → `/pricing` and `/join/:path*` → `/pricing`
- **Zero other consumers** of `ConsentModal` in production routes (verified by grep).

**Why it matters:** The LegitScript-mandated informed-consent gate is effectively dead code in production. New checkout paths (Stripe direct, BNPL, club orders) do not show consent UI before payment. This was a regression introduced when the `join.cultrhealth.com` subdomain was retired and `/join` redirected to `/pricing`.

**Mitigation:** None. The compliance components/`PrescriptionDisclaimer.tsx`, `FDAStatusBadge.tsx`, footer disclosures are static page chrome, not pre-payment gates.

**Outstanding:** Either (a) restore the consent modal on the active `/pricing` checkout flow (every `lib/payments/*` provider), or (b) move the consent step to the intake form before any checkout link is rendered, or (c) document explicitly that the legal team accepts pre-purchase footer disclaimer in lieu of a modal gate.

---

### C5. Cross-domain link rule violations — `getJoinCheckoutUrl()` and `https://cultrclub.com/*` still wired into cultrhealth.com

**Where (verified by grep, 22 hits):**
- `lib/config/links.ts:29-30` — `DEFAULT_JOIN_SITE_URL = 'https://cultrclub.com'`, `DEFAULT_STAGING_JOIN_SITE_URL = 'https://staging.cultrclub.com'`
- `lib/config/links.ts:50-61` — `getJoinCheckoutUrl()` builds outbound URLs to `cultrclub.com/join/[tier]`
- `components/site/PricingCard.tsx:11, 117, 153` — uses `getJoinCheckoutUrl()` on the public pricing page
- `app/creators/portal/dashboard/page.tsx:371`, `app/creators/portal/share/page.tsx:203, 306, 374, 376`, `app/creators/portal/campaigns/page.tsx:56` — creator-portal generates `cultrclub.com` links
- `app/creators/[slug]/page.tsx:58` — creator landing pages issue `cultrclub.com` links
- `app/api/admin/creators/add/route.ts:34`, `app/api/admin/creators/[id]/approve/route.ts:43` — admin creator provisioning embeds `cultrclub.com` tracking links
- `app/api/club/signup/route.ts:198` — welcome email body links to `cultrclub.com`
- `app/admin/AdminDashboardClient.tsx:273, 585`, `app/admin/inventory/InventoryClient.tsx:28`, `app/admin/creators/coupons/CouponsClient.tsx:63, 317`, `app/admin/marketing/MarketingClient.tsx:350` — admin UI labels (text-only; not user-facing redirects)

**Why it matters:** Memory `feedback_no_cultrclub_links.md` is tagged a HARD RULE: cultrhealth.com customer flows must stay on-domain. Public pricing card sending users to `cultrclub.com` is the largest exposure — every `Get Started` click leaves the cultrhealth domain mid-funnel.

**Mitigation:** Admin/internal labels (analytics dashboards, CSV exports) are acceptable. Creator-portal share-link generation is acceptable because creators *intend* to share `cultrclub.com` URLs. The violations are:
1. `components/site/PricingCard.tsx` on the public marketing site — high-priority fix.
2. Welcome-email CTA in `app/api/club/signup/route.ts:198` — medium priority; fine if the user is already a cultrclub.com signup but wrong if the signup originated on cultrhealth.com.

**Outstanding:** Audit each of the 9 source-code call sites and decide which must redirect to in-domain `/pricing`, `/intake`, `/success` paths.

---

### C6. Production deployment requires manual two-step build → deploy with no preview gate

**Where:**
- This repo's `package.json` has no `build:cf` or `deploy:prod` scripts (verified — only `dev`, `build`, `start`, `lint`, `analyze`, `setup:stripe`, `check:health`, `test:smoke`, `test:e2e*`).
- Per memory `reference_cultrhealth_deploy_pipeline.md`: production builds happen in sibling repo `cultrhealth-web/`, command is `npm run build:cf && npm run deploy:prod`, and Node 20 is required (Node 22 may break the build).
- Per memory `feedback_cfpages_build_uses_workdir.md`: CF Pages reads the **working directory**, not git HEAD. Missing files silently 404 every affected route on production.
- Per memory `feedback_nop_hardlink_truncation.md`: `@cloudflare/next-on-pages` can truncate `public/` binaries (MP4, large images) to 64 KB via hardlinks shared with `.vercel/output/static/`. After `build:cf`, source files must be re-checked-out and re-copied into the output dir, then file sizes verified.

**Why it matters:** Three failure modes:
1. Building from a dirty working tree silently ships uncommitted files (or omits committed files that aren't checked out).
2. Forgetting the post-build asset-restore step ships truncated binaries to production.
3. No CI/CD gate. A solo deployer running the wrong commands at 1 a.m. can publish anything to production.

**Mitigation:** Documented procedure in memory + sibling-repo CLAUDE.md. No automation. No staging→production promotion gate. No preview-URL convention.

**Outstanding:**
- Add a build-time check: `git status --porcelain` must be empty before `build:cf` proceeds.
- Add a post-build size-verification step (`find .vercel/output/static/public -size 64c -name '*.mp4'`).
- Move CF Pages deploy into GitHub Actions with `pages-action`.
- Document Node 20 pin in `package.json` `engines` block.

---

### C7. Production crons live in `vercel.json` — they DO NOT run on Cloudflare Pages

**Where:** `vercel.json:9-34` declares 6 crons:
- `/api/cron/siphox-fulfillment` (every 15 min)
- `/api/cron/siphox-results` (hourly)
- `/api/cron/siphox-status-sync` (every 30 min)
- `/api/cron/approve-commissions` (2 a.m. daily)
- `/api/cron/update-tiers` (3 a.m. daily)
- `/api/cron/stale-orders` (noon daily)

**Why it matters:** This `vercel.json` lives in the cultr-website repo, which now only deploys staging to Vercel. Production runs on Cloudflare Pages out of `cultrhealth-web/`. Unless those crons were re-implemented as Cloudflare Cron Triggers in the sibling repo, **production never runs them**. Concrete fallout:
- `approve-commissions` not running → commissions sit `pending` forever; creators don't get paid.
- `update-tiers` not running → recruit-count milestones don't trigger tier upgrades.
- `siphox-*` crons not running → kit fulfillment, result polling, status sync all stall.
- `stale-orders` not running → stale-order cleanup never fires.

**Mitigation:** Unknown without inspecting `cultrhealth-web/wrangler.toml` (out of scope for this concern doc, lives in a different repo).

**Outstanding:** Verify production crons are configured via Cloudflare Cron Triggers. If not, this is an active production outage being masked by manual ops.

---

### C8. Two production sources of truth (Vercel `production` branch + Cloudflare Pages from sibling repo)

**Where:**
- This repo: `production` branch still exists and historically deployed to Vercel. Per memory it was retired in favor of CF Pages.
- Sibling repo: `cultrhealth-web/main` is the new authoritative production source.
- `middleware.ts:6-22` still has Vercel-canonicalization logic (`isProductionDeployment = process.env.VERCEL_ENV === 'production'` rewrites `*.vercel.app` → `cultrhealth.com`) — left over from the Vercel-production era.

**Why it matters:** Anyone who runs `vercel --prod` from this repo (per memory `feedback_vercel_deploy_safety.md`, the Mar 23 incident) can re-establish Vercel as a production source and create a split-brain. The Vercel CLI still has the production project linked.

**Mitigation:**
- `vercel.json:4-7` disables `git.deploymentEnabled.main` and `master` (verified).
- Memory hard rule: `NEVER vercel --prod from wrong branch`.
- No automated guardrail.

**Outstanding:** Either (a) detach the Vercel production project from this repo entirely, or (b) leave it as a documented disaster-recovery fallback and add a giant warning at the top of `package.json` and CLAUDE.md. Today the rule is in CLAUDE.md but not enforced.

---

## HIGH

### H1. Edge runtime constraints not enforced by lint or build

**Where applies:** Sibling repo `cultrhealth-web/` (production) — but the same source files live in *this* repo and any omission propagates on next sync.

**Constraints (per memory `feedback_cf_pages_edge_compat_gotchas.md`):**
- Every `app/**/route.ts` and SSR-fetching page must declare `export const runtime = 'edge'` or fall back to Node runtime, which CF Pages cannot execute → 500 on production, works locally.
- Neon access requires `fullResults: true` for `.rows`/`.rowCount` shape parity with `@vercel/postgres`.
- `nodejs_compat` must be set in `wrangler.toml` to satisfy Node `crypto`/`Buffer` imports.
- `dompurify` is unreliable in CF Workers — see H2.
- 3 MiB Worker bundle limit (compressed) — large dependencies (gsap, three, recharts) push close to the ceiling.
- `images.unoptimized: true` is mandatory because there is no image optimizer at the edge.
- `next.config.js` `headers()` is silently dropped — must use `_headers` (static) + middleware (SSR).
- Cookie domain must be derived from `request.headers.get('host')`, not `process.env.NEXT_PUBLIC_SITE_URL` (env vars are stale on preview deploys).
- Node 20 required for build.

**Why it matters:** None of these are enforced by ESLint or any pre-commit hook in this repo. A new route file added on the staging branch and synced to `cultrhealth-web/main` without `export const runtime = 'edge'` will 500 on production with no local indication.

**Mitigation:** Documented in memory, repeated in CLAUDE.md `feedback_cf_pages_edge_compat_gotchas.md`. No automated check.

**Outstanding:** Add an ESLint rule or a pre-deploy grep: `grep -rL "runtime = 'edge'" app/api/**/route.ts` must be empty.

---

### H2. DOMPurify on server-rendered markdown is fragile under CF Workers

**Where:**
- `lib/library-content.ts:3-9` constructs DOMPurify via `jsdom`-backed window.
- `app/science/[slug]/page.tsx:13-18` does the same (this route is 301-redirected by `next.config.js:183-189` but the file still ships in the bundle).

**Why it matters:** Per memory `feedback_cf_pages_edge_compat_gotchas.md`, DOMPurify is unreliable in the CF Workers runtime because `jsdom` is a Node-only dependency that the bundler can't ship to the edge. On staging (Vercel/Node) the code works; on production (CF Pages/edge) it can throw at request time. `lib/library-content.ts` is consumed by the members library (`/members/library/*`) which **is** a SSR page on production.

**Mitigation:** None at the runtime boundary. The risk is that a member browsing `/members/library` triggers the DOMPurify path and it crashes server-side.

**Outstanding:** Either (a) replace DOMPurify with an edge-safe sanitizer (e.g., `sanitize-html` configured for Workers), or (b) pre-sanitize at build time and ship plain HTML.

---

### H3. `app/science/[slug]/` and `lib/blog-content.ts` are dead code that still ships

**Where:**
- `app/science/page.tsx`, `app/science/[slug]/page.tsx`, `app/science/blog-content.css` — all present in the working tree.
- `lib/blog-content.ts` — present.
- `content/blog/` — 10 markdown files present (tb500-tissue-repair, fasting-metabolic-health, sleep-and-recovery, mitochondrial-health, peptide-stacking, thyroid-deep-dive, testosterone-optimization, nad-and-longevity, inflammation-markers, biomarker-basics).
- `next.config.js:182-190` — 301 redirects `/science` and `/science/:slug` to `/`.

**Why it matters:** CLAUDE.md states "Blog content removed Apr 2026" but only the redirects were added. The route handlers, content files, and library are still in the bundle. Two risks:
1. A future deploy that drops the redirects silently re-publishes potentially non-LegitScript-compliant medical content.
2. Bundle includes JSDOM + marked + DOMPurify + frontmatter parsing that isn't reachable, eating into the 3 MiB CF Workers limit.

**Mitigation:** Redirects in `next.config.js` are the only guard.

**Outstanding:** Delete `app/science/`, `lib/blog-content.ts`, `content/blog/`, and the `/science` redirects together in one commit.

---

### H4. Staging auth bypass legacy fallback still active

**Where:**
- `lib/auth.ts:222-231` — `isStaging()` checks `process.env.STAGING_MODE === 'true'` first, then falls back to `process.env.NEXT_PUBLIC_SITE_URL.includes('staging')`.
- `app/api/auth/verify/route.ts:26-32` — duplicate of the same check.
- TODOs in both files: "TODO: remove this once STAGING_MODE=true is confirmed set on staging in Vercel."

**Why it matters:** The legacy fallback uses `NEXT_PUBLIC_SITE_URL`, a *build-time-embedded* env var. If a production deployment ever ships with `NEXT_PUBLIC_SITE_URL` accidentally pointing at a `staging-*.vercel.app` host (or any string containing `staging`), the bypass fires:
- Any email gets its magic-link token returned in the API response body.
- Team emails (`OWNER_EMAILS` + `legitscript@cultrhealth.com`, see `lib/auth.ts:217-220`) auto-provision as creators with no email-verification step.

**Mitigation:** Production env in Cloudflare Pages must set `STAGING_MODE` unset/empty *and* `NEXT_PUBLIC_SITE_URL=https://cultrhealth.com`. Both must be true.

**Outstanding:** Delete the legacy fallback in both files in one commit (the in-code TODO has been outstanding long enough).

---

### H5. Bot protection (Turnstile) covers only the waitlist endpoint

**Where verified by grep of `app/api/`:**
- `app/api/waitlist/route.ts:17-31` — only API route invoking `verifyTurnstileToken`.

**Endpoints accepting public input WITHOUT Turnstile:**
- `app/api/quiz/submit` — quiz lead capture (already a known abuse vector)
- `app/api/intake/submit` — medical intake submission
- `app/api/creators/apply` — creator application (PII intake)
- `app/api/club/signup` — club member signup (mitigated by `formLimiter` rate limiter, see `app/api/club/signup/route.ts:29-31`)
- `app/api/club/orders` — club order creation
- `app/api/auth/magic-link` — magic-link issuance (rate-limited but not bot-protected)
- `app/api/creators/magic-link` — creator magic-link

**Why it matters:** Bots can drain SMS/email budget (Resend, Twilio), poison analytics, fill the DB with fake intakes, and brute-force coupon codes. Rate limiting (`lib/rate-limit.ts`) helps but does not stop distributed bot traffic.

**Mitigation:** `lib/rate-limit.ts` is wired on club signup, club login, club check-member, magic-link routes (verified via grep). No Turnstile.

**Outstanding:** Wire Turnstile on `quiz/submit`, `intake/submit`, `creators/apply`, `club/signup`, and `club/orders`. Sibling repo `cultrclub-web` already uses Turnstile per memory.

---

### H6. JWT/HMAC secrets have no rotation strategy

**Where:** `lib/auth.ts` (JWT_SECRET), `lib/healthie/webhooks.ts` (HEALTHIE_WEBHOOK_SECRET), `app/api/admin/club-orders/[orderId]/status/route.ts:36-37` (JWT_SECRET reused for HMAC), `app/api/admin/club-orders/[orderId]/approve/route.ts` (HMAC tokens), `lib/auth.ts` (SESSION_SECRET).

**Why it matters:**
- Rotating any of these immediately invalidates every active session and every magic-link/HMAC token in flight.
- No dual-secret verifier exists (`JWT_SECRET_PREVIOUS` + `JWT_SECRET` accepted side-by-side for 24 h).
- `JWT_SECRET` is reused as the HMAC key for status-token verification — same secret, two purposes, one rotation event invalidates both.

**Mitigation:** None.

**Outstanding:** Add a `verifyTokenWithRotation()` helper that tries `JWT_SECRET` first then `JWT_SECRET_PREVIOUS`. Same for `SESSION_SECRET`. Document the rotation runbook.

---

### H7. Stale documentation actively misleads contributors

**Where:**
- `AGENTS.md:13` — "Join Club URL: https://join.cultrhealth.com" (subdomain retired Apr 22 2026).
- `AGENTS.md:14` — "Hosting: Vercel (automatic deployments per branch)" (production is on CF Pages now).
- `README.md:3` — references `join.cultrhealth.com`.
- `CLAUDE.md:13`, `CLAUDE.md:199` (and 4 other places per existing CONCERNS doc) — same.
- `.cursorrules` — likely contains the same stale references (verified line count: 565 lines).

**Why it matters:** Cursor IDE auto-loads `.cursorrules` for every AI session. New contributors and AI assistants read CLAUDE.md/AGENTS.md as gospel. They will reintroduce `cultrclub.com` redirects, scaffold `/join-club` routes, and assume Vercel is production — every one of which is wrong as of 2026-04-27.

**Mitigation:** None at runtime. Memory `feedback_self_correcting_claudemd.md` codifies the patch-on-mistake rule, but it requires a human to notice.

**Outstanding:** Patch `AGENTS.md`, `README.md`, `CLAUDE.md`, and `.cursorrules` in one PR to reflect:
1. `join.cultrhealth.com` is RETIRED.
2. Production = Cloudflare Pages from sibling repo.
3. Staging = Vercel from this repo.

---

### H8. `next.config.js` `headers()` is the only CSP source — silently dropped on Cloudflare Pages

**Where:** `next.config.js:35-` declares `Content-Security-Policy`, `X-Frame-Options`, `Referrer-Policy`, etc. via `async headers()`.

**Why it matters:** Per memory `feedback_cloudflare_pages_headers_gotcha.md`, `@cloudflare/next-on-pages` does **not** ship the `headers()` array. On production:
- Static files: `public/_headers` would deliver them — but **`public/_headers` does not exist in this repo** (verified: `ls public/_headers` returns "No such file or directory").
- SSR responses: only middleware can set headers — `middleware.ts` does not set CSP.

**Result:** Production Worker-rendered responses ship **without CSP, X-Frame-Options, or Referrer-Policy**.

**Mitigation:** Sibling repo `cultrhealth-web/` may have its own `_headers` file. Cannot verify from this repo.

**Outstanding:** Confirm `cultrhealth-web/public/_headers` exists with the same security headers as `next.config.js`. Either way, copy CSP into `middleware.ts` for SSR responses.

---

### H9. Commission ledger lifecycle is correct, but only because cancel/refund handlers are exhaustive — and there is no test

**Where (verified by grep):**
- Checkout: `app/api/club/orders/route.ts` calls `processOrderAttribution({ skipCommissionLedger: true })` — defers commission writes until ship.
- Ship transition: `app/api/admin/club-orders/[orderId]/status/route.ts:261-262` calls `recordCommissionsForShippedOrder()`.
- Rollback from shipped: `app/api/admin/club-orders/[orderId]/status/route.ts:294, 317` calls `reverseCommissionsForAttribution()`.
- Dismiss: `app/api/admin/club-orders/[orderId]/dismiss/route.ts:43` calls `reverseCommissionsForAttribution()`.
- Stripe refund: `app/api/webhook/stripe/route.ts:983` calls `handleRefundReversal()` (which delegates to `reverseCommissionsForAttribution`).
- Cron: `lib/creators/db.ts:1106-1145` — `approveEligibleCommissions()` correctly excludes club_order-linked attributions whose order is not yet `shipped`/`fulfilled`.

**Why it matters:** Every cancel/dismiss/refund path calls the reversal helper — *currently*. Any new admin path that mutates order state (e.g. a future "mark order failed" button) that forgets to call `reverseCommissionsForAttribution()` will silently leave commissions earned on undone work.

**Mitigation:** Code review only. No test covering "every order-state mutation must call the reversal helper."

**Outstanding:** Add an integration test: for every distinct exit transition out of `shipped`/`fulfilled`, assert that `commission_ledger.status` for the linked attribution becomes `reversed`.

---

### H10. Owner email exclusion uses `OWNER_EMAILS_PG_ARRAY` but is not applied uniformly

**Where (verified by grep):**
- Filter applied in: `app/api/admin/creators/payouts/batch/route.ts:34`, `lib/db.ts:792, 901, 906, 1173, 1245, 1271, 1304, 1324`.
- Filter NOT applied: any direct `sql\`SELECT ... FROM creators...\`` query that doesn't go through the helpers in `lib/db.ts`. Several admin routes (e.g. `app/api/admin/creators/pending/route.ts`, `app/api/admin/creators/[id]/approve/route.ts`) read creators directly.

**Why it matters:** Owner accounts (`erik@`, `alex@`, `tony@`, `david@`, `erik@threepointshospitality.com`) appear in creator lists, payouts batches, and analytics aggregates whenever a query bypasses `lib/db.ts`. Stewart is intentionally **not** in the exclusion list (per `lib/config/owner-emails.ts:17-19` comment) — that part is correct.

**Mitigation:** None systematically. Per-query enforcement.

**Outstanding:** Wrap raw `creators` reads in admin code paths through helpers that apply the filter, or add a database VIEW `creators_marketplace` with the filter baked in.

---

## MEDIUM

### M1. Loose TypeScript configuration

**Where:** `tsconfig.json` (verified):
- `strict: false`, `allowJs: true`, `skipLibCheck: true`, `noImplicitAny` not set, `strictNullChecks` not set, `noUncheckedIndexedAccess` not set.
- `moduleResolution: "node"` — legacy, not modern `bundler`.
- No `target` declared (defaults to ES5 per Next.js).

**Why it matters:** Silent type regressions. Every NUMERIC-coercion bug (memory `project_checkout_numeric_fix_mar27.md`), every nullable-field crash, every implicit-any drift goes undetected at the type layer. Migration to Next 15 (already on cultrclub-web) will require modern `bundler` resolution.

**Mitigation:** Vitest tests + manual review.

**Outstanding:** Staged strictness. Enable `strictNullChecks` on `lib/auth.ts`, `lib/creators/commission.ts`, `lib/db.ts` first; ratchet up.

---

### M2. `@vercel/postgres` returns NUMERIC as strings — coercion must be manual

**Where:** Documented hard rule in CLAUDE.md, `.cursorrules`, and memory `feedback_vercel_numeric_coercion.md` after a Mar 27 production crash on creator-coupon orders.

**Why it matters:** Writing `row.amount + row.discount` returns string concatenation, not arithmetic. Inserting a `parseFloat`'d string back into a NUMERIC column without `::numeric` cast can break.

**Mitigation:** Convention only. Spot-check via grep:
```bash
grep -rn '\.amount\s*[+\-]' --include='*.ts'
grep -rn '\.rate\s*\*' --include='*.ts'
```

**Outstanding:** Add a typed wrapper around `sql\`...\`` that auto-coerces NUMERIC columns. No such wrapper exists.

---

### M3. Admin analytics SQL conventions documented but not enforced

**Where:** CLAUDE.md hard rules (verified) — copy-paste here:
- "ALWAYS combine data from `club_orders` AND `order_attributions` using `UNION ALL` or similar"
- "When calculating 'lifetime' metrics alongside period metrics in the same query, apply the date interval constraint conditionally per column (e.g., `SUM(CASE WHEN created_at >= ... THEN amount ELSE 0 END)`)"
- "use `make_interval()`, `IS DISTINCT FROM`, `COUNT(*)::integer`, `::float8`"

**Verification:** `make_interval` confirmed in `app/api/admin/qr-scans/export/route.ts:59`. No comprehensive audit of every admin route was performed.

**Why it matters:** Past incidents — coupon analytics under-counting (memory `project_coupon_analytics_bugfixes_mar17.md`), lifetime-vs-period drift (memory `project_admin_dashboard_features_mar24.md`). Every new analytics column that violates the pattern silently undercounts revenue or commissions.

**Mitigation:** Code review.

**Outstanding:** Per-route SQL audit on `app/api/admin/analytics/`.

---

### M4. No centralized error tracking (Sentry / equivalent)

**Where (verified by grep):** zero hits for `Sentry`/`sentry` in `*.ts`/`*.tsx`/`*.json` of source code.

**Why it matters:** Errors land in two separate places — Vercel deploy logs (staging) and Cloudflare Pages Functions logs (production). No alerting on p99 latency, no error-rate threshold alerts, no breadcrumb context. When production emits a 500, you find out from a customer.

**Mitigation:** Google Analytics is installed but is frontend-only.

**Outstanding:** Add Sentry on both apps. Configure release tracking and alerting on error-rate / p99 latency.

---

### M5. Pharmacy-partner TODOs return stubs in critical paths

**Where (verified by grep):**
- `app/api/member/orders/route.ts:79` — order list returns empty array
- `app/api/member/profile/route.ts:119, 194` — profile fields return null
- `app/api/portal/profile/route.ts:107` — portal profile stubbed
- `app/api/portal/documents/route.ts:3, 54, 147` — documents return empty
- `app/api/member/files/route.ts:60` — files return empty
- `app/api/member/medical-records/route.ts:113` — medical records stubbed
- `app/api/protocol/generate/route.ts:26` — patient verification BYPASSED
- `app/api/intake/submit/route.ts:13` — routing note only
- `app/api/webhook/stripe/route.ts:831` — cancellation notification to pharmacy not wired

**Why it matters:** Member-facing pages render empty states because the integration was severed. `app/api/protocol/generate/route.ts:26` is HIGH severity in its own right — patient verification is the explicit security check, and it's bypassed.

**Mitigation:** None until a new pharmacy partner is wired. Members see empty dashboards.

**Outstanding:** Either wire the new pharmacy partner integration, or replace stubs with explicit "coming soon" UI rather than empty arrays that look like data loss.

---

### M6. `app/api/admin/club-orders/[orderId]/approve/route.ts:484` — V2 TODO for automated payment links

**Where:** Same file. "TODO (Version 2): Implement Option A — Automated Payment Link."

**Why it matters:** Approvals currently hand-roll payment collection. As club-order volume grows, manual intervention is a scaling ceiling.

**Mitigation:** Manual ops.

**Outstanding:** Tracked. Not blocking.

---

### M7. `app/api/portal/labs/route.ts:138` — kit-id matching not implemented

**Where:** Same file. "TODO: v2 — match by kitId instead of updating most-recent order."

**Why it matters:** Works for members holding a single SiPhox kit. Breaks (silently writes to the wrong order) when a member has two or more active kits.

**Mitigation:** None. Today's user base mostly has one kit.

**Outstanding:** Phase 03-kit-registration plan covers this.

---

### M8. Stripe API version drift between cultrhealth.com and cultrclub.com

**Where:**
- This repo: `package.json` declares `stripe: ^20.2.0`.
- Sibling repo `cultrclub-web`: `stripe: ^22.0.1`.

**Why it matters:** Different SDK majors imply different default Stripe API versions. Webhook events emitted at one version may not parse cleanly at the other. Per CLAUDE.md and existing CONCERNS doc, Stripe API version should be pinned explicitly in both clients to a known major (e.g. `2024-09-30.acacia`).

**Mitigation:** Both clients use the same Stripe account, so webhook signatures verify either way; payload shape is the risk.

**Outstanding:** Pin `apiVersion: '2024-09-30.acacia'` (or current) explicitly in `lib/stripe.ts` (or wherever the Stripe client is instantiated) in both repos.

---

### M9. `.playwright-mcp/` artifacts written into working tree, not gitignored

**Where:**
- Directory `.playwright-mcp/` contains 14 files (console-* logs and page-*.yml dumps from 2026-04-25).
- `.gitignore` does not match `.playwright-mcp` (verified).

**Why it matters:** Playwright traces can include URL paths, query params, request bodies — potentially capturing tokens or session IDs. Any developer running `git add -A` ships them.

**Mitigation:** None. The files are present and untracked.

**Outstanding:** Add `.playwright-mcp/` to `.gitignore` and delete the existing files.

---

### M10. Many uncommitted source files modified (staging branch)

**Where (per `git status`):**
- `lib/cart-context.tsx` (modified)
- `lib/config/coupons.ts` (modified)
- `app/api/admin/club-orders/[orderId]/approve/route.ts` (modified)
- `app/api/admin/club-orders/[orderId]/status/route.ts` (modified)
- `app/api/club/orders/route.ts` (modified)
- `app/tools/dosing-calculator/{,[slug]/}page.tsx` (modified)
- `app/tools/dosing-calculator/[slug]/preset-content.ts` (modified)
- `package.json` + `package-lock.json` (modified)
- `AGENTS.md`, `CHANGELOG.md`, `README.md`, `design.md`, `.planning/STATE.md` (modified)

**Why it matters:** The CF Pages build-from-working-directory rule (memory `feedback_cfpages_build_uses_workdir.md`) means a production build right now would ship these uncommitted changes. If the deployer builds without `git status` clean, the production tree drifts from `cultrhealth-web/main`.

**Mitigation:** Procedure-only. No automation.

**Outstanding:** Commit or stash before any production build. Add the `git status --porcelain` check from C6 above.

---

### M11. `image.unoptimized: true` not set in this repo's `next.config.js`

**Where:** `next.config.js:25-29` (verified) sets `formats: ['image/avif', 'image/webp']`, `deviceSizes`, `imageSizes`, but **does not** set `unoptimized: true`.

**Why it matters:** When this repo's source is synced to `cultrhealth-web/` for the next CF Pages build, the deployer must remember to flip `unoptimized: true` (or sibling repo's `next.config.js` must override). Per memory, image optimization does not run at the edge — `unoptimized: true` is mandatory on production. Otherwise `<Image>` tags resolve to the Next.js image optimizer route, which 500s on CF Pages.

**Mitigation:** Sibling repo carries the correct config. Risk is on next sync.

**Outstanding:** Either (a) split out a CF-specific `next.config.cf.js`, or (b) detect CF at build time, or (c) document the diff explicitly.

---

### M12. Test coverage gaps

**Where:** `tests/` directory contains 91 test files (`find tests -name '*.test.*' | wc -l`). Distribution by area:
- `tests/api/` — API route coverage (auth, intake, attribution, etc.)
- `tests/components/` — including `ConsentModal.test.tsx`, `FloridaStateGate.test.tsx` (covering components NOT wired into the funnel — see C3, C4)
- `tests/integration/` — protocol engine
- `tests/lib/` — auth, plans, library-content, protocol-templates, siphox, etc.
- `tests/smoke/` — smoke tests for routes
- `e2e/` — Playwright (separate runner, `npm run test:e2e`)

**Gaps:**
- No tests for the CF Pages migration constraints (edge runtime declarations, _headers).
- No tests for the new SEO routes (`/tools/dosing-calculator`, `/tools/dosing-calculator/[slug]`) added per memory `project_peptide_calculator_seo_apr25.md`.
- No regression test asserting "every cancel/dismiss/refund path calls `reverseCommissionsForAttribution()`" (see H9).

**Mitigation:** Spot-check via test runs.

**Outstanding:** Add edge-runtime grep test, dosing-calculator page snapshot, commission-reversal integration test.

---

### M13. Untracked SUMMARY.md files in `.planning/phases/` may indicate stale plan state

**Where (per git status):**
- `.planning/phases/04-deploy-validate/04-01-SUMMARY.md` (untracked)
- `.planning/phases/04-deploy-validate/04-02-SUMMARY.md` (untracked)
- `.planning/phases/05-production-cutover/05-01-SUMMARY.md` (untracked)
- `.planning/phases/05-production-cutover/05-02-SUMMARY.md` (untracked)

**Why it matters:** `STATE.md` says project is at 73% / Phase 03 executing. The presence of untracked Phase 04 and Phase 05 summary files (which document completion of those phases) suggests STATE.md is out of sync.

**Mitigation:** None.

**Outstanding:** Reconcile STATE.md with the actual phase progress and commit the summaries.

---

## LOW

### L1. Documentation sync duty between CLAUDE.md, AGENTS.md, README.md, .cursorrules

**Why it matters:** All four files describe project state. Drift is constant. The "self-correcting CLAUDE.md" rule (memory `feedback_self_correcting_claudemd.md`) prescribes patches but only after a contributor notices.

**Outstanding:** One-time PR to align all four after the CF Pages migration settles, then enforce via PR template checklist.

---

### L2. Loose Node module resolution

**Where:** `tsconfig.json:13` — `moduleResolution: "node"`.

**Why it matters:** ESM/CJS interop friction with newer libs (`jose`, `ai` SDK 6, etc.). Next 15 prefers `bundler` resolution. cultrclub-web is on Next 15 already; this repo will need the bump eventually.

**Mitigation:** None.

**Outstanding:** Migrate to `moduleResolution: "bundler"` as part of the Next 15 upgrade.

---

### L3. `class-variance-authority` not in dependencies but referenced in docs

**Where:** Verified — `class-variance-authority` is **not** in `package.json` `dependencies`. CLAUDE.md, AGENTS.md, `.cursorrules`, `.planning/codebase/STACK.md`, `.planning/codebase/CONVENTIONS.md` all still reference it.

**Why it matters:** Docs claim a dependency that doesn't exist. Future contributors searching for variant patterns will hit dead-end suggestions.

**Outstanding:** Scrub references from all five files.

---

### L4. Empty `lib/stores/` and stale `components/sections/` references in CLAUDE.md

**Where:**
- `lib/stores/` — does not exist (verified).
- `components/sections/` — does not exist (verified).
- CLAUDE.md still lists both under Known Technical Debt.

**Outstanding:** Remove from CLAUDE.md.

---

### L5. Legacy root-level component files no longer present

**Where:**
- `components/Footer.tsx` — does not exist.
- `components/Navigation.tsx` — does not exist.
- `components/WaitlistForm.tsx` — does not exist.
- The existing CONCERNS doc (now superseded) listed them as legacy debt; they are already cleaned up.

**Outstanding:** None — resolved. Remove the entries from any CLAUDE.md / AGENTS.md descriptions of `components/`.

---

### L6. FTC affiliate disclosure templates exist but no runtime verification

**Where:** `lib/config/affiliate.ts` ships short / standard / full disclosure templates. Creators agree at application; no per-post compliance check.

**Why it matters:** Reputational risk if a creator posts without disclosure; FTC enforcement is per-post, not per-account.

**Mitigation:** Application-time agreement.

**Outstanding:** Optional — add a per-login disclosure-acknowledgment checkpoint or a periodic creator-content audit.

---

### L7. GSAP commercial license

**Where:** `gsap@^3.14.2` in `package.json`.

**Why it matters:** GSAP's standard license is free for non-commercial use. Commercial usage of certain plugins requires Club GreenSock. Verify which GSAP modules are actually imported.

**Outstanding:** Audit GSAP imports; confirm license obligation.

---

### L8. No formal BAA tracking in repo

**Where:** Not in repo.

**Why it matters:** HIPAA Business Associate Agreements should be filed for every third-party that touches PHI: Neon, Vercel, Cloudflare, Resend, Stripe, Calendly, SiPhox, Twilio, OpenAI (if AI SDK touches medical context), AWS S3.

**Mitigation:** Tracked outside the repo.

**Outstanding:** Confirm BAA list is current with legal.

---

### L9. Console-log noise in webhook handlers (no PHI, but high volume)

**Where (verified):** 71 `console.log` calls in `app/api/`. Spot-checked — none log PHI fields. Examples:
- `app/api/webhook/stripe/route.ts:427, 825, 945` — context strings only.
- `app/api/club/orders/route.ts:391` and `app/api/admin/club-orders/[orderId]/approve/route.ts:364` — log internal order numbers (acceptable per existing convention).

**Why it matters:** Cloudflare Pages logs every console line; high-volume webhook noise increases log cost and dilutes signal.

**Mitigation:** `next.config.js:11-14` strips `console.log` in production builds (keeps `error`/`warn`). On CF Pages, the Workers runtime applies the same strip via Next bundler.

**Outstanding:** Verify the strip applies on CF Pages build (`@cloudflare/next-on-pages` should respect `compiler.removeConsole`).

---

### L10. `app/join/` route tree still present despite middleware blocking

**Where:**
- `app/join/[tier]/page.tsx`, `app/join/JoinLandingClient.tsx`, `app/join/layout.tsx`, `app/join/page.tsx` — all present.
- `middleware.ts:25-27` blocks all `/join` requests on non-local hosts.
- `next.config.js:177-180` 301-redirects `/join` → `/pricing`.
- `lib/config/join-therapies.ts` and `lib/contexts/JoinCartContext.tsx` exist as supporting modules.

**Why it matters:** Dead code in the bundle. The route exists only to support a retired subdomain and a now-inactive consent gate (see C4). Bundle bloat for no user benefit.

**Outstanding:** Delete the `app/join/` tree, `lib/config/join-therapies.ts`, `lib/contexts/JoinCartContext.tsx`, the related test file, and the middleware/redirect entries together. (Phase 05-02 plan covers this — see `.planning/phases/05-production-cutover/05-02-PLAN.md`.)

---

### L11. Recent FAQ schema parity work is correct, but not protected by a test

**Where:**
- `components/site/FAQAccordion.tsx:36-52` always renders the answer in the DOM (verified) — required for Google FAQPage rich-snippet eligibility per memory `feedback_faq_schema_dom_parity.md`.
- Recent commit `2e92ca8` added schema↔visible parity for `/faq`.

**Why it matters:** Future refactors (e.g. switching to a `{open && ...}` conditional render for performance) will silently break FAQPage rich snippets.

**Mitigation:** Comment in `FAQAccordion.tsx:36-39` documents the constraint.

**Outstanding:** Add a test asserting that `<FAQAccordion items={[{question, answer}]}/>` renders the answer text in `screen.getByText()` even when collapsed.

---

### L12. Healthie scheduling URL fragility

**Where:** Memory `Healthie scheduling URLs` entry in CLAUDE.md.

**Why it matters:** When a Healthie booking link includes `provider_ids`, it must also include `org_level=true` or the calendar can show no availability. Hardcoding `appt_type_ids` can hide newly schedulable types. No lint / runtime check enforces this.

**Mitigation:** CLAUDE.md guardrail.

**Outstanding:** Add a Zod validator on Healthie URL construction that requires `org_level=true` whenever `provider_ids` is present.

---

*End of CONCERNS.md.*

*Re-verify on every CF Pages production deploy, every Phase 05-02 milestone, and every new admin/checkout route.*
