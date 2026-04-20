# Technical Concerns

*Last updated: 2026-04-20*
*Scope: cultrhealth.com (Vercel / Next.js 14) + cultrclub.com (Cloudflare Pages / Next.js 15 @ edge)*

---

## Section 1 — Known Technical Debt (cultrhealth.com)

**Legacy root-level components (superseded):**
- `components/Footer.tsx` — superseded by `components/site/Footer.tsx`
- `components/Navigation.tsx` — superseded by `components/site/Header.tsx`
- `components/WaitlistForm.tsx` — superseded by `components/site/NewsletterSignup.tsx`
- Impact: Contributors can accidentally import the legacy variants; duplicated behavior drifts from the real site chrome. Fix: delete these three files after a cross-repo import audit.

**Legacy `components/sections/` directory — RESOLVED:**
- `ls components/sections/` returns "No such file or directory." The 9 files referenced by the old debt note (`Hero.tsx`, `Services.tsx`, `About.tsx`, `HowItWorks.tsx`, `Results.tsx`, `Pricing.tsx`, `Testimonials.tsx`, `FAQ.tsx`, `Waitlist.tsx`) no longer exist. `CLAUDE.md` still documents them — CLAUDE.md should be updated to drop the reference.

**Empty `lib/stores/` directory — RESOLVED:**
- `ls lib/stores/` returns "No such file or directory." `CLAUDE.md` lists it under "Known Technical Debt" — that entry is stale and should be removed from CLAUDE.md.

**`class-variance-authority` — RESOLVED in production deps:**
- Not present in current `package.json` `dependencies` block (grep confirms it appears only in `.planning/codebase/*` docs, `CHANGELOG.md`, `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, and an orphaned `.claude/worktrees/agent-a3e154df/package.json`). Safe to delete the worktree package.json and scrub stale references from the docs listed above.

**Loose TypeScript configuration (`tsconfig.json`):**
- `strict: false`, `allowJs: true`, `skipLibCheck: true`, `moduleResolution: "node"` (not `bundler`), `noEmit: true`, `incremental: true`.
- Impact: No `noImplicitAny`, no `strictNullChecks`, no `noUncheckedIndexedAccess`. Silent type regressions possible in heavily interdependent modules (intake, commission, checkout).
- Fix path: staged strictness — enable `strictNullChecks` first on `lib/auth.ts`, `lib/creators/commission.ts`, `lib/db.ts`, then ratchet up.

**Legacy Node module resolution:**
- `moduleResolution: "node"` instead of modern `bundler`.
- Impact: ESM/CJS interop quirks with ESM-only libs (e.g., `jose`, newer `ai` SDK). Next.js 14 tolerates it, but upgrading to Next 15 (as cultrclub-web already did) will expose module resolution mismatches.

**Documentation sync duty:**
- `.cursorrules` (500+ lines of guardrails) and `CLAUDE.md` must stay in lockstep. The self-correcting CLAUDE.md rule at `CLAUDE.md` line ~1023 applies to both files. Cursor IDE auto-loads `.cursorrules` for every AI session; stale rules silently mis-direct the IDE.

**Lingering pharmacy-partner TODOs (post-Asher Med removal, Apr 4 2026):**
All the following `TODO: Reconnect to new pharmacy partner` sites still return stubs/empty arrays and must be wired when the next pharmacy integration ships:
- `app/api/member/orders/route.ts:79`
- `app/api/member/profile/route.ts:119`, `:194`
- `app/api/portal/profile/route.ts:107`
- `app/api/portal/documents/route.ts:3`, `:54`, `:147`
- `app/api/member/files/route.ts:60`
- `app/api/member/medical-records/route.ts:113`
- `app/api/protocol/generate/route.ts:26` (patient verification is bypassed)
- `app/api/intake/submit/route.ts:13` (routing note only — submission itself still writes to `pending_intakes`)
- `app/api/webhook/stripe/route.ts:831` (cancellation notification to pharmacy not wired)

**Staging-mode legacy fallback in `lib/auth.ts`:**
- `lib/auth.ts:227-228`: "Legacy fallback: keep working for deployments that haven't set STAGING_MODE yet. TODO: remove this once STAGING_MODE=true is confirmed set on staging in Vercel."
- Impact: Any production deployment that *accidentally* sets `STAGING_MODE=true` (or any env that looks like staging) can bypass auth. Confirm Vercel env is correct and delete the legacy branch in `lib/auth.ts` and `app/api/auth/verify/route.ts:31`.

**`app/api/admin/club-orders/[orderId]/approve/route.ts:484`:**
- `TODO (Version 2): Implement Option A — Automated Payment Link`. Currently approvals hand-roll payment collection — a scaling risk as club-order volume grows.

**`app/api/portal/labs/route.ts:138`:**
- `TODO: v2 — match by kitId instead of updating most-recent order`. Works for single-kit users only; breaks when members hold two or more active SiPhox kits.

---

## Section 2 — Deprecated Code to Remove (HIGH PRIORITY)

> ⚠️ **All items here are legacy artifacts from the retired `join.cultrhealth.com` subdomain alias.** That subdomain is scheduled for 301-redirect to `cultrclub.com` in Phase 05-02 of the active migration. The customer store today is `cultrclub.com` (standalone Cloudflare Pages app at `/Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/`). All listed artifacts should be deleted once Phase 05-02 ships.

### 2.1 — Middleware host detection (`middleware.ts`)
File: `/Users/davidk/Documents/Dev-Projects/App-Ideas/Cultr Health Website/middleware.ts`
- Lines 8-12: `isJoinHost` constant detecting the retired hostnames (`join.cultrhealth.com`, `join.staging.cultrhealth.com`, `join.localhost[:port]`).
- Lines 29-32: `if (isJoinHost) { return NextResponse.rewrite(new URL('/not-found', request.url)) }` — currently serves 404 for requests to those hostnames.
- Lines 35-37: `if (request.nextUrl.pathname.startsWith('/join') && !isJoinHost && !isLocalDevHost)` — blocks `/join` path on non-join hosts.
- **Action:** Phase 05-02 Plan (`.planning/phases/05-production-cutover/05-02-PLAN.md`) deletes both blocks once Cloudflare DNS 301 is in place.

### 2.2 — Entire app route tree for the retired subdomain
- `app/join-club/` — **ALREADY DELETED**. `ls app/join-club/` returns "No such file or directory." The route tree described in `CLAUDE.md:199` (JoinLandingClient.tsx, page.tsx, layout.tsx) no longer exists in this repo. CLAUDE.md and AGENTS.md still reference it and must be scrubbed.
- `app/join/` — **STILL PRESENT**. Contents: `[tier]/` (tier checkout), `JoinLandingClient.tsx`, `layout.tsx`, `page.tsx`. This route is gated by middleware (blocked on public non-join hosts, 404 on the retired hostname) and redirected by `next.config.js:175` (`/join → /pricing`). It exists *only* to serve the retired subdomain. Phase 05-02 will remove it along with the middleware detection.

### 2.3 — Product catalog config
- `lib/config/join-therapies.ts` — **STILL PRESENT**. Drives the retired landing-page carousel; no longer consumed by any public surface on `cultrhealth.com` (the domain redirects `/join` → `/pricing`). Active consumers:
  - `components/site/TherapiesGrid.tsx:11` imports `BUNDLE_DISCOUNT_RATE` (used on `/therapies` — this coupling should be broken; `/therapies` should have its own discount constant).
  - `lib/contexts/JoinCartContext.tsx:4` imports cart helpers for `/join` pages (those pages are being retired).
  - `tests/lib/join-therapies.test.ts:3` locks the legacy catalog order — delete when catalog is deleted.
  - `app/join/JoinLandingClient.tsx:9` — retires with the `/join` tree.
- **Action:** After Phase 05-02, delete `lib/config/join-therapies.ts`, `lib/contexts/JoinCartContext.tsx`, `app/join/`, and the related test. Move `BUNDLE_DISCOUNT_RATE` to a dedicated constants file if `/therapies` still needs it.

### 2.4 — Cached artifacts / stock sync aware of the retired subdomain
- `app/api/admin/inventory/route.ts:92` — calls `revalidatePath('/join-club')` when admin inventory changes. The `/join-club` path no longer exists; this `revalidatePath` call is a no-op. Remove the line.
- `app/api/stock/route.ts` — excludes `cultrclub` rows so the retired subdomain never reads cultrclub-specific stock (per `CHANGELOG.md:46`). Inverse-filter can be simplified once Phase 05-02 ships.
- `migrations/010_club_orders.sql`, `migrations/017_club_member_address.sql`, `migrations/034_product_inventory.sql`, `migrations/043_add_bac_water_inventory.sql`, `migrations/045_visitor_tracking.sql`, `migrations/048_add_igf1_lr3_inventory.sql` — schema created for the retired landing page. Migrations cannot be deleted, but inline comments naming the retired subdomain should be updated to name `cultrclub.com` as the live consumer for future readers.

### 2.5 — Test files
- `tests/api/club-orders-catalog-sync.test.ts` — 7 hits setting `host: 'join.cultrhealth.com'` in request headers. Tests cover behavior that Phase 05-02 will retire.
- `tests/api/club-session-cookie.test.ts:40` — 1 hit setting `NEXT_PUBLIC_SITE_URL = 'https://join.cultrhealth.com'`.
- `tests/smoke/join-routing.test.ts` — 4 hits across lines 24, 28, 34, 43-44 asserting routing against the retired hostname.
- **Action:** Delete after Phase 05-02. If we keep any assertion, rewrite it to assert the 301 redirect to `cultrclub.com`.

### 2.6 — Documentation references (grep inventory)
`CLAUDE.md` and `AGENTS.md`:
- `CLAUDE.md:13`, `199`, `776`, `780`, `1059`, `1073`
- `AGENTS.md:13`, `192`, `778`, `782`, `1009`, `1022`
- Both files describe the retired subdomain as a "Join Club URL" next to the production URL. Rewrite to name `cultrclub.com` as the customer store and list the retired subdomain only under "Deprecated." `CLAUDE.md:816` / `AGENTS.md:818` also list `/join-club` under `HIDE_CHROME_PREFIXES` — stale; the route tree is already deleted.

`CHANGELOG.md` — 30+ historical entries. Leave history intact; do not rewrite past changelogs.

`.cursorrules:405` — lists `/join-club/*` in a chrome-suppression hint. Delete this line.
`.cursorrules:525-526` — tells Cursor that the retired subdomain's product cards come from `lib/config/join-therapies.ts`. Delete these lines once Section 2.3 is executed.

`.planning/debug/join-page-returning-members.md` — historical debug log. Leave intact.
`.planning/debug/creator-revenue-admin-sync.md:34` — passing reference; leave intact.
`.planning/phases/02-source-extraction/*`, `.planning/phases/05-production-cutover/*` — planning docs that drive the migration itself. Leave intact.

`docs/HIGH-LEVERAGE-IMPROVEMENTS.md:13,95`, `docs/superpowers/specs/2026-04-05-legitscript-full-certification-design.md:309,348`, `docs/superpowers/specs/2026-04-05-playwright-e2e-suite-design.md:113` — scrub the retired subdomain mention once Phase 05-02 ships.

`components/site/LayoutShellClient.tsx:8` — `HIDE_CHROME_HOSTNAMES = ['join.cultrhealth.com', 'join.staging.cultrhealth.com', 'join.localhost']`. Dead array once middleware 404s the hostname. Delete along with middleware Block 1.

### 2.7 — Public assets / env vars / Next config redirects
- `public/join-club/` — **does not exist**. `ls public/join-club` returns "No such file or directory."
- `next.config.js` redirects: lines 143-192. The only retired-subdomain-specific redirect is `/join → /pricing` at line 176-180; comment at line 175 explicitly names the retired subdomain. Leave the `/join → /pricing` redirect in place — it protects legacy bookmarks after Phase 05-02 — but remove the comment naming the retired subdomain once the domain DNS is flipped.
- Env var names: `NEXT_PUBLIC_SITE_URL` is used in both apps; the only concern is accidental retention of the retired subdomain URL as the value in a Vercel staging env. Verify during Phase 05-02 cutover.

---

## Section 3 — Known Technical Debt (cultrclub.com)

**Every route must declare edge runtime:**
- Grep confirms `export const runtime = 'edge'` on all 11 current route files (`app/[slug]/route.ts`, `app/page.tsx`, `app/robots.ts`, and 8 `app/api/club/*` + `app/api/stock/route.ts` + `app/api/health/route.ts`).
- Impact: Any newly added route that omits `export const runtime = 'edge'` silently falls back to Node runtime, which Cloudflare Pages does not execute → 500 on production, works locally. There is no lint rule enforcing this. Fix: add an ESLint rule or a pre-commit grep that asserts `export const runtime = 'edge'` appears in every `app/**/route.ts` and every page that issues a server-side fetch.

**`next.config.js` `headers()` is silently dropped on Cloudflare Pages:**
- `cultrclub-web/next.config.js` declares a CSP plus security headers via `async headers()`. The Cloudflare Pages adapter (`@cloudflare/next-on-pages`) does **not** ship the `headers()` array. All of those headers are delivered instead by:
  - `public/_headers` for static files (verified present, 6 lines long).
  - `middleware.ts` for dynamic Worker/SSR responses (sets `X-Robots-Tag`, `Referrer-Policy`, `X-Frame-Options`, `X-Content-Type-Options`).
- Gap: the `next.config.js` `Content-Security-Policy` is **not** applied on Worker-rendered responses because middleware does not set CSP. Either remove the deceptive `next.config.js headers()` block or port CSP into `middleware.ts`.

**Cookie domain must come from request hostname, not env var:**
- `middleware.ts:55` — `const domain = hostname.includes('cultrclub.com') ? '.cultrclub.com' : undefined`.
- This is the correct pattern (documented in memory: `feedback_cloudflare_pages_headers_gotcha.md`). Any future edit that reverts to `new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname` will re-break cross-domain cookies under preview deployments where the env var is stale.
- `lib/resend.ts:43, 2030, 2067`, `lib/creators/attribution.ts:130`, `app/api/club/orders/route.ts:342` all fall back to `process.env.NEXT_PUBLIC_SITE_URL`; in edge runtime the env var can be unset on preview deploys. `lib/utils.ts:37-43` already implements the "prefer request hostname" pattern — the same helper should be used everywhere a site URL is built.

**`images.unoptimized: true`:**
- `next.config.js` + wrangler setup means there is no image optimization server. All `<Image>` components fall back to raw URLs. Impact: larger payloads to mobile, no AVIF/WebP generation, no responsive srcset. Fix path: route image optimization through Cloudflare Images or add a lightweight image resizer.

**`ADMIN_BASE_URL` env var is required for cross-domain approval links:**
- Approval email links from `cultrclub.com` point back to `cultrhealth.com/admin/*`. If `ADMIN_BASE_URL` is missing on Cloudflare Pages, approval emails render broken links. Validate in both staging + production secrets.

**Dependency mismatch vs sibling repo:**
- cultrclub-web uses `next@15.5.2`, `stripe@^22.0.1`, `@neondatabase/serverless@^0.9.0`; cultrhealth.com uses `next@^14.2.0`, `stripe@^20.2.0`, `@vercel/postgres@^0.10.0`. The two repos share a Neon database and JWT/session secrets but drift on SDK versions. A Stripe API version mismatch between webhooks (cultrhealth webhook on `20.2.0`, cultrclub checkout on `22.0.1`) can silently alter event payloads — pin Stripe API versions explicitly in both clients.

**Tailwind base fonts + brand tokens must be kept in sync:**
- `cultrclub-web/tailwind.config.ts` is a subset of the cultrhealth tailwind config. Brand color drift is easy and will show up as different shades of forest/cream across the two domains. Manual audit only; no shared config import.

**No test framework, no linter:**
- `cultrclub-web/package.json` has no `vitest`, no `@testing-library/*`, no `playwright`, no ESLint, no Prettier, no Biome. Phase 04 (`deploy-validate`) is meant to address this, but until it lands every change ships untested and unlinted.

---

## Section 4 — Security Concerns (both apps)

**HIPAA — no PHI logging:**
- Greps of `app/api/**` in cultrhealth.com for `console.log` near PHI fields (email/phone/dob/ssn) return no matches. Email alone is not classic PHI under HIPAA Safe Harbor. Keep enforcing via the `code-audit.sh` hook that already flags "PHI logging check."
- Risk: webhook handlers (`app/api/webhook/stripe/route.ts:427`, `:825`, `:945`) log context strings like "Welcome email sent for subscription" — fine, no PHI; but `console.log('[...] for ${orderNumber}')` in `app/api/club/orders/route.ts:390` + `app/api/admin/club-orders/[orderId]/approve/route.ts:361` emits internal identifiers. Internal order numbers are acceptable but should be spot-audited quarterly.

**JWT secret rotation strategy — not documented:**
- `JWT_SECRET` and `SESSION_SECRET` are static env vars with no rotation plan. Rotating them invalidates every active session and every magic-link token in flight. Plan: add a dual-secret verification helper that accepts `JWT_SECRET` *or* `JWT_SECRET_PREVIOUS` for 24h, then retire the old one. No such helper exists today.

**`cultr_club_visitor` signed session token:**
- CLAUDE.md line 1069: "never store full profile in client-readable cookies." Current codebase complies: the cookie in cultrclub-web middleware (`cultr_visitor_ctx`) holds only UTM attribution and referrer, not PII. Keep this invariant when extending the flow.

**HMAC `timingSafeEqual` buffer-length check:**
- Documented in CLAUDE.md as a hard rule after a past `TypeError: Input buffers must have the same length` crash. Any new HMAC verification code must wrap `timingSafeEqual` with an explicit length compare. No lint rule enforces it.

**Staging auth bypass — must never leak to production (cultrhealth.com):**
- `lib/auth.ts` auto-provisions team emails (`stewart@cultrhealth.com`, `erik@threepointshospitality.com`, and 3 others) on the staging host; any email on staging gets its magic-link token returned in the API response body.
- Guard: `process.env.STAGING_MODE === 'true'` (line 226). Legacy fallback at line 227-228 still treats hostnames containing `staging` as staging. If the production domain ever accidentally resolves via a `staging-*.vercel.app` host during deployment, the bypass could fire. Delete the legacy fallback now that `STAGING_MODE` is set in Vercel (per the in-code TODO).
- `app/api/auth/verify/route.ts:31` has the same legacy fallback — remove both in one commit.

**Bot protection gaps — incomplete Turnstile coverage:**
- Grep of `app/api/**` in cultrhealth.com shows Turnstile verification only in `app/api/waitlist/route.ts`. Other public endpoints (quiz lead capture, club signup, creator apply, consult requests) should be audited. Club signup on cultrclub-web *does* use Turnstile (confirmed via `@marsidev/react-turnstile` import in `lib/turnstile.ts`).
- **Action:** Add Turnstile checks on `app/api/quiz/submit`, `app/api/intake/submit`, `app/api/creators/apply`, `app/api/supplement-order`, and any renewal endpoint.

**DOMPurify on rendered markdown:**
- Library content is loaded via gray-matter + marked + DOMPurify (`lib/library-content.ts`). DOMPurify runs server-side. Correct, but verify whenever a new markdown-rendering surface is added — bypassing the helper is how XSS gets reintroduced.

**`app/api/protocol/generate/route.ts:26` — patient verification bypassed:**
- `TODO: Reconnect patient verification to new pharmacy partner`. Until reconnected, the protocol generator trusts the authenticated member's JWT only — acceptable but must be logged as a deliberate trust assumption.

**Cross-domain cookie leakage risk:**
- `middleware.ts` in cultrhealth.com sets cookies with `domain: '.cultrhealth.com'` — these do **not** propagate to `cultrclub.com`. Good. Ensure no future code tries `domain: '.cultr.com'` or similar parent domain.

**Never use `response.headers.append('Set-Cookie', ...)` in Next `NextResponse`:**
- Documented as a hard rule in CLAUDE.md after the Safari ghost-session incident. Always use `response.cookies.set()` / `response.cookies.delete()`. No lint rule enforces it — audit any new middleware edits.

---

## Section 5 — Performance Concerns (both apps)

**Homepage bundle size on cultrhealth.com:**
- `app/page.tsx` uses `next/dynamic` for below-fold components (PricingCard, FAQAccordion, ClubBanner, NewsletterSignup). `optimizePackageImports: ['lucide-react', 'recharts', 'zod']` is set in `next.config.js:21`. Effective today; re-run `npm run analyze` after any large UI addition (hero redesign, MeshGradient swap).
- Risk: `@paper-design/shaders-react` (MeshBackground) pulls in WebGL/Three; `three@^0.183.2` is in deps. Check whether `three` is tree-shaken or if MeshBackground ships it eagerly.

**Edge cold-start on cultrclub.com:**
- Cloudflare Workers cold-start is typically sub-50ms but can spike on first regional request. Vercel `Fluid Compute` does not apply. Every route is edge-only; no opportunity for Node long-running worker warmth. Monitor p99 latency on `/api/club/orders` and `/api/club/signup` under load.

**N+1 risk in admin analytics:**
- CLAUDE.md rule: "When querying admin analytics for coupon stats or creator commissions, ALWAYS combine data from `club_orders` AND `order_attributions` using `UNION ALL` or similar." No automated verification. Any admin query that forgets the UNION silently undercounts. Spot-check `app/api/admin/analytics/route.ts` on every change.
- CLAUDE.md rule: "parallel queries over UNION ALL" where appropriate — `Promise.all([...])` with independent queries is faster than a monolithic UNION for unrelated aggregates.

**Lifetime vs period metrics — conditional-column pattern:**
- Required pattern: `SUM(CASE WHEN created_at >= ... THEN amount ELSE 0 END)` in a single query, **not** a separate `WHERE created_at >= ...` run. Violating this pattern is why admin dashboards previously reported stale "lifetime" numbers. Any new analytics column must follow the pattern.

**`@vercel/postgres` NUMERIC coercion (cultrhealth.com):**
- Returns NUMERIC columns as strings. Every arithmetic read must wrap with `Number()` or `parseFloat()`. Casting in SQL (`::float8` or `::integer`) is the preferred idiom. Past commission-crash incident (Mar 27 2026) traced to missing cast. No lint rule; rely on grep audits + targeted tests.

**Tracking/analytics write amplification:**
- `click_events` table is written on every `/r/[slug]` redirect. High-traffic creators can generate thousands of writes per day. Verify `click_events` has an effective retention policy and that analytics reads use indexes on `(creator_id, created_at)` rather than full scans.

**Image assets:**
- `public/images/` holds 14+ hero-class JPG/PNGs. `next.config.js` serves AVIF + WebP formats but the source files are JPG/PNG; `<Image>` transcodes on Vercel. On cultrclub-web where `images.unoptimized: true`, the same assets are served raw — that path is slower to mobile.

---

## Section 6 — Operational Risks

**Production deploy safety — `vercel --prod` incident Mar 23 2026:**
- The CLI deploys the **local directory**, not the git branch. Running `vercel --prod` from a checkout of `staging` deploys staging code to production. Documented in `feedback_vercel_deploy_safety.md`. **Production deploys must go via `git push origin production` or Vercel Dashboard promotion.** No other path is allowed.

**Production promotion is cherry-pick, not merge:**
- `production` diverged from `staging` (same commit titles, different SHAs). Promote via `git checkout -B tmp-prod origin/production && git cherry-pick <sha> && git push origin tmp-prod:production`. Never force-push (`feedback_prod_promotion_cherrypick.md`).

**Two-app deploy coordination:**
- cultrhealth.com → Vercel (branches: `main`, `staging`, `production`).
- cultrclub.com → Cloudflare Pages (branches: `main` for production, `staging` for preview), deploy via `npm run deploy:prod` or `deploy:staging` calling `wrangler pages deploy`.
- Env vars live in two different dashboards with different UIs, no shared config. Shared secrets (`POSTGRES_URL`, `JWT_SECRET`, HMAC keys, Stripe webhook secrets) must be kept identical or cross-domain auth breaks silently.
- A checklist for every env-var rotation: (1) Vercel for cultrhealth, (2) Cloudflare Pages for cultrclub — failing to do both produces asymmetric breakage.

**Database migrations run manually:**
- `node scripts/run-migration.mjs` — no automation, no rollback, no transaction wrapper. Migrations 001-056 have been applied in order. Every new migration must be checked in + run + verified against both Neon staging and production.

**Environment parity between the two apps:**
- Both apps hit the same Neon DB. Drifting schemas (a column exists on staging but not production, or the inverse) is the primary operational risk. Mitigation: every migration file must be applied to both staging and production before any deploy that depends on it.

**Monitoring / observability:**
- Grep for `Sentry`/`sentry` in cultrhealth.com: no dependency; only matches are in worktree README and marketing intelligence docs. **There is no centralized error tracking.** Errors land in Vercel deploy logs and Cloudflare Pages Functions logs — each must be checked separately. No alerting on p99 latency, no error-rate threshold alerts.
- Google Analytics 4 is installed but is only frontend event tracking, not server error telemetry.
- **Recommendation:** add Sentry (or similar) on both apps before next major launch.

**Middleware as single point of failure (cultrhealth.com):**
- `middleware.ts` in cultrhealth.com was recently expanded (session idle timeout + retired-subdomain 404). Edits ship immediately and affect every request. Test middleware changes on staging before merging.

---

## Section 7 — Compliance Risks

**HIPAA:**
- Telehealth consultations (Calendly + video on members' side), PHI in `intake_forms`, `orders`, `medical_records`, presigned S3 URLs for ID + consent uploads.
- Session idle timeout (30 min) is enforced in `middleware.ts:40-106`. Cookies are HttpOnly, Secure in production, SameSite=Lax.
- No formal BAA tracking in the repo. Active BAAs should be filed separately (Neon, Vercel, Cloudflare, Resend, Stripe, Calendly, SiPhox — confirmed needed).

**LegitScript:**
- ConsentModal on checkout (`components/compliance/ConsentModal.tsx`), FDA badges on therapy cards (`FDAStatusBadge.tsx`), ROSCA disclosure on pricing, Florida-only state availability, PrescriptionDisclaimer on therapies + pricing. `NEXT_PUBLIC_LEGITSCRIPT_SEAL_ID` is a placeholder until LegitScript certifies the site.
- `/science` and `/blog` were removed Apr 2026 explicitly for LegitScript compliance. Do not restore without re-review.
- Any future content page must pass a LegitScript content review before shipping.

**FDA — compounded medication disclosures:**
- Every medication card in `components/intake/MedicationSelector.tsx` carries "Compounded in the USA" + "Prescription Only" pill badges. Verify these render on any new medication added to the catalog.

**FTC — affiliate disclosure:**
- `lib/config/affiliate.ts` ships three disclosure templates (short: `#ad #CULTRpartner`, standard, full). Creators agree to them at application; no runtime verification that creators actually use them. Reputational risk if a creator posts without disclosure. Consider: add a policy acknowledgment checkpoint on every login.

**Florida-only jurisdiction:**
- `FloridaStateGate` component created Apr 14 2026 but tasks 10-12 (gate quiz/intake/checkout) are **still pending** per memory (`project_florida_jurisdiction_apr14.md`). Until those ship, a user from outside Florida can complete the funnel. Legal risk.

---

## Section 8 — In-Progress / Blocked

**Source of truth:** `.planning/STATE.md` (cultrhealth.com repo).

**Milestone:** v1.0, status `executing`, `73%` complete (11 of 15 plans, 6 of 8 phases done). Last update `2026-04-17T22:55:54Z`.
**Current focus:** Phase 03 — `code-adaptation` (cultrclub.com cutover migration). Plan 1 of 2. Status `Executing Phase 03` / last activity `2026-04-14 -- Phase 03 execution started`.

**Active migration:** `/Users/davidk/.claude/plans/snazzy-humming-treasure.md` — five-phase cultrclub.com migration.

**Remaining phases (per phase folders):**
- Phase 04 — `deploy-validate` (in `.planning/phases/04-deploy-validate/`).
- Phase 05 — `production-cutover`:
  - Plan 05-01 — cultrclub.com go-live.
  - Plan 05-02 — cultrhealth.com middleware cleanup + retired-subdomain 301 redirect. **Gate:** cultrclub.com must pass 24h monitoring after Plan 05-01.

**Parallel in-flight work:**
- Phase `01-foundation/`, Phase `02-checkout-integration/`, Phase `03-kit-registration/` — these are SiPhox-integration phases, not the cultrclub migration phases. They live under the same `.planning/phases/` folder with overlapping numbers (both 01/02/03). Status `executing` per STATE.md; new since Apr 14.

**Identified blockers:**
- "Unknown if SiPhox supports report-completion webhooks" (`.planning/phases/03-kit-registration/03-RESEARCH.md:355`) — blocks the kit-registration lifecycle. Workaround: polling.
- Florida-only jurisdiction gate tasks 10-12 pending — blocks full LegitScript prerequisite list.
- Pharmacy partner TODO (Section 1) — every `Reconnect to new pharmacy partner` call returns a stub. Blocks post-intake fulfillment automation.

**Quick tasks recently completed:** edit/delete members from admin dashboard (`260415-kwb` / `260415-uma`).

---

## Section 9 — Dependency Risks

### cultrhealth.com (`package.json`)

**Major/minor deltas vs current upstream (captured 2026-04-20; verify against `npm outdated` before any upgrade):**

| Package | Current | Risk |
|---|---|---|
| `next` | `^14.2.0` | Next 15 is available. cultrclub-web is already on 15.5.2. Upgrading cultrhealth.com catches the repos up but requires App Router migration checks. |
| `stripe` | `^20.2.0` | cultrclub-web is on `^22.0.1`. API version mismatch between webhook verifier and checkout sessions is a silent-break risk. Align both repos. |
| `@vercel/postgres` | `^0.10.0` | Stable; unlikely to move. The long-term plan is to migrate to `@neondatabase/serverless` (already used in cultrclub-web) for runtime uniformity. |
| `typescript` | `^5.4.0` | Several TS5 minor releases behind; low risk. |
| `zod` | `^3.23.0` | Zod 4 is available with breaking changes. Plan explicitly before upgrading. |
| `eslint` | `^8.57.0` | ESLint 9 is current. eslint-config-next `^14.2.0` constrains the upgrade. |
| `three` | `^0.183.2` | Rapid release cadence; bundle-size regression risk on any upgrade. Re-run `npm run analyze` after bumping. |
| `react` / `react-dom` | `^18.2.0` | React 19 is available; Next 15 supports it. Leave alone until Next 15 migration lands. |
| `@react-pdf/renderer` | `^4.3.2` | Infrequent updates; check for CVE advisories periodically. |
| `twilio` | `^5.12.2` | Keep current — SMS is a compliance-sensitive path. |
| `ai` / `@ai-sdk/openai` / `@ai-sdk/react` | `^6.0.59` / `^3.0.21` / `^3.0.61` | AI SDK 6 is rapidly evolving; treat as a watched dependency. |
| `gsap` | `^3.14.2` | License: free for non-commercial; commercial usage needs a Club GreenSock license. Verify compliance. |

**Confirmed unused / removable:**
- `class-variance-authority` — **not in `package.json` dependencies.** Remove stale references from `.planning/codebase/STACK.md`, `.planning/codebase/CONVENTIONS.md`, `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, and the orphaned `.claude/worktrees/agent-a3e154df/package.json` + `package-lock.json`.

**Worktree cleanup:**
- `.claude/worktrees/agent-a3e154df/` is an orphaned agent worktree dating from pre-Apr 2026. Delete the directory entirely.

### cultrclub-web (`package.json`)

| Package | Current | Risk |
|---|---|---|
| `next` | `15.5.2` | Ahead of sibling repo. Watch for Cloudflare Pages adapter compatibility (`@cloudflare/next-on-pages@^1.13.0`). |
| `stripe` | `^22.0.1` | Ahead of sibling repo. Pin API version explicitly in both clients to prevent webhook drift. |
| `@neondatabase/serverless` | `^0.9.0` | Stable; `fullResults: true` is mandatory for `.rows`/`.rowCount` shape parity with `@vercel/postgres`. |
| `framer-motion` | `^11.0.0` | Sibling uses `^12.36.0` — intentional mismatch (cultrclub-web hasn't bumped). Not a runtime risk; cosmetic only. |
| Stripe API version | implicit | Pin to a known major (e.g., `2024-09-30.acacia`) in both repos. |

**Missing testing toolchain:**
- cultrclub-web has **no test framework installed**. No `vitest`, no `@testing-library/*`, no `playwright`. Every change ships untested. Phase 04 (`deploy-validate`) covers this, but the risk is ongoing until Phase 04 lands.

**Missing linting toolchain:**
- cultrclub-web has **no ESLint, no Prettier, no Biome**. Sibling repo has ESLint. Add at minimum a pre-commit TypeScript check (`tsc --noEmit`) and a basic ESLint config.

---

*Document ends. Re-run the retired-subdomain grep inventory after each migration phase to confirm deprecation surface is shrinking.*
