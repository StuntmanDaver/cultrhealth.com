# cultrhealth.com → Cloudflare Pages Migration

*Design doc — 2026-04-20*

## Summary

Migrate `cultrhealth.com` from Vercel to Cloudflare Pages in a new sibling repo `cultrhealth-web/`, mirroring the pattern that `cultrclub-web/` used for `cultrclub.com`. Completes "Phase 2" of the platform consolidation flagged in `.planning/PROJECT.md`. Same-day aggressive cutover; fix-forward posture. All pages, images, API endpoints, and the admin dashboard preserved. Deprecated `app/join-club/` tree and its middleware are deleted during extraction.

## Goals

- `cultrhealth.com` served by Cloudflare Pages from a new `cultrhealth-web` repo.
- Feature parity with today's Vercel-hosted site (~45 pages, 72 API routes, admin, creator portal, intake, telehealth, members, legal).
- `cultrclub.com` integration unbroken after cutover (shared Neon DB, admin approval links, HMAC tokens).
- Legacy `app/join-club/` subsystem removed as part of extraction (absorbs the pending Phase 05-02 cleanup from the cultrclub-web migration project).
- Recent `staging` branch commits (quiz lead capture v2, HubSpot embed, admin member mgmt, inventory site separation, Calendly, Florida jurisdiction, Stewart 20%) carried into the new repo.

## Non-Goals

- Dependency upgrades beyond what Cloudflare compatibility requires.
- Schema changes to the shared Neon DB.
- New features or UX changes during migration.
- Two-platform "hybrid" architecture (all routes run on Cloudflare).
- Automated blue-green traffic splitting. Cutover is a single DNS flip.

## Strategic Decisions

| # | Decision | Rationale |
|---|---|---|
| Q1 | **Fork-and-migrate** — new `cultrhealth-web` repo on Cloudflare Pages, Vercel kept as 30-day standby | Mirrors proven cultrclub-web pattern; parallel validation; clean DNS-flip rollback |
| Q2 | **Clean-and-migrate** — legacy code deleted at extraction time, absorbs Phase 05-02 cleanup | `app/join-club/` + `isJoinHost` middleware are fully orphaned since cultrclub.com exists as its own app; no value in porting dead code |
| Q3 | **Inline risk spikes** — test `@react-pdf/renderer` and AI SDK streaming during Block 6 of execution, not as a separate upfront phase | Same-day pace doesn't allow for a 2-day dedicated spike; fallback plan documented per dep so pivots are cheap |
| Q4 | **Same-day aggressive cutover** — 9–11 hours focused work; fix-forward during post-cutover window | User is solo, hands-on, and has cultrclub-web experience; cost of watching live is lower than cost of multi-week soak |

## Hard Requirements

1. **Recent-work preservation.** `cultrhealth-web` initializes from HEAD of `staging` at migration start. Any commits that land on `staging` during the migration window get rebased into `cultrhealth-web` before DNS flip.
2. **Cross-app integrity with cultrclub.com.** `cultrclub-web`'s `ADMIN_BASE_URL=https://cultrhealth.com` does not change. Admin endpoint paths stay identical (`/api/admin/club-orders/[orderId]/approve`, `/admin/club-orders`, etc.). Pre-cutover validation must include an end-to-end cultrclub-web → new cultrhealth-web admin approval flow against the new Cloudflare staging deploy.
3. **No double-cron.** Vercel Cron for `approve-commissions` and `update-tiers` must be disabled at DNS flip. Cloudflare Cron Triggers in `wrangler.toml` take over.
4. **Clean rollback path.** Vercel project stays paused (not deleted) for 30 days post-cutover. DNS TTL lowered to 300s 24 h ahead of cutover so rollback propagates fast.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       BEFORE (today)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  cultrclub.com             cultrhealth.com                  │
│  ─────────────             ──────────────                    │
│  Cloudflare Pages          Vercel (Node.js)                  │
│  cultrclub-web repo        Cultr Health Website repo         │
│         │                          │                         │
│         └──────────┬───────────────┘                         │
│                    │                                         │
│             Neon PostgreSQL                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     AFTER (this migration)                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  cultrclub.com             cultrhealth.com                  │
│  ─────────────             ──────────────                    │
│  Cloudflare Pages          Cloudflare Pages (edge)           │
│  cultrclub-web repo        cultrhealth-web repo              │
│         │                          │                         │
│         └──────────┬───────────────┘                         │
│                    │                                         │
│             Neon PostgreSQL (unchanged)                      │
│                                                              │
│  Vercel: paused, 30-day rollback standby                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Runtime model:** Cloudflare Workers edge everywhere (`export const runtime = 'edge'`) with `nodejs_compat` flag for `Buffer`/`crypto`/`stream` dependencies.

**DB access:** `@neondatabase/serverless` with `fullResults: true`; `createPool()` + `Pool.connect()` for transactions; NUMERIC coercion retained.

**Static assets & images:** Cloudflare Pages static handler; `images.unoptimized: true` (no Vercel Image Optimization on edge).

**Cron:** Cloudflare Cron Triggers defined in `wrangler.toml`, dispatched to a scheduled handler that forwards to the existing `/api/cron/*` routes with an auth header.

**Cache headers:** Former `next.config.js` `headers()` config ported to a `_headers` file (Cloudflare Pages drops `headers()` at build time).

**Session cookies:** domain derived from request hostname via `getCookieDomain()` (ported from cultrclub-web); never via `NEXT_PUBLIC_SITE_URL`.

## Breaking Points Register

### 🔴 Tier 1 — Silent failures (check explicitly; no stack trace, wrong result, data/money loss)

**DB / data layer**
1. `@vercel/postgres` → `@neondatabase/serverless` swap. **Must** call `neon(DATABASE_URL, { fullResults: true })`. Without it, `.rows` and `.rowCount` are silently empty/wrong on every query.
2. Transactions: `db.connect()` → `createPool()` + `Pool.connect()` pattern. Forgetting = "transaction" becomes three independent statements with no rollback.
3. NUMERIC coercion: `@neondatabase/serverless` still returns NUMERIC as strings; every `parseFloat()` / `Number()` call stays required.
4. SQL tag import path: ~30+ files import `sql` from `@vercel/postgres`. Every import must swap (missing one is loud; leaving template tag behavior inconsistent is silent).

**Payments**
5. Stripe webhook signature verification (`stripe.webhooks.constructEvent()`, HMAC-SHA256) under `nodejs_compat`. Test with `stripe trigger` against staging before cutover.
6. Affirm webhook HMAC.
7. Klarna webhook HMAC.
8. Authorize.net webhook HMAC.
9. Commission ledger lifecycle: any dropped webhook stops commission flow. Club orders defer commission to shipment; a missed webhook can undercount or over-pay creators.
10. `crypto.timingSafeEqual`: must verify buffer lengths match first or it throws `TypeError: Input buffers must have the same length`. Applies to HMAC approval-token verification on club-order admin endpoints.

**Cookies / auth**
11. `response.headers.append('Set-Cookie', …)` on `NextResponse` — never. Must use `response.cookies.set()` / `response.cookies.delete()`. Grep audit: should be zero occurrences.
12. Cookie domain derivation must come from request hostname, not `NEXT_PUBLIC_SITE_URL`. Port `getCookieDomain()` from cultrclub-web.
13. Admin "Login As" session masquerade uses `cultr_admin_return_v2` cookie + restore-session endpoint — verify set/clear on edge.
14. Ghost-session-prevention rule: never create multiple `Set-Cookie` headers with same name but different domains — use distinct cookie names (e.g. `v2`) for migrations.

**Cron**
15. Vercel Cron doesn't exist on Cloudflare. `app/api/cron/approve-commissions/route.ts` and `app/api/cron/update-tiers/route.ts` won't fire automatically after cutover. Need Cloudflare Cron Triggers in `wrangler.toml`.
16. Dual-cron risk during cutover: Vercel Cron must be disabled at the moment DNS flips, or both old and new fire and commissions can be approved twice.

### 🟡 Tier 2 — Loud failures (5xx, build warnings, route not found)

**Runtime / framework**
17. Missing `export const runtime = 'edge'` on any of 72 API routes. Use a codemod, not manual edits.
18. `next.config.js` `headers()` is dropped on Cloudflare Pages. Current cache headers (`public, max-age=0, s-maxage=60, stale-while-revalidate=0` for HTML; `immutable` for assets) must move to a `_headers` file.
19. `next.config.js` `redirects()`: `/products → /pricing`, `/products/* → /pricing`, `/join → /pricing`, `/science → /`, `/science/* → /`. Supported by `next-on-pages`; verify post-build.
20. `images.unoptimized: true` required. `<Image>` without this errors on edge.
21. `optimizePackageImports: ['lucide-react']` — should survive; verify.
22. `removeConsole` in production — should survive (already preserves `error`/`warn` per Mar 27 fix).

**Middleware**
23. Middleware matcher semantics on Cloudflare Workers differ slightly from Vercel edge middleware. Review `middleware.ts` matcher config during adaptation.
24. `isJoinHost` + `HIDE_CHROME_HOSTNAMES` deletion — delete entirely during extraction (clean-and-migrate). Missing this = carrying dead code.

**Deps with edge-compat risk**
25. `@react-pdf/renderer` — **big unknown.** Wraps `pdfkit` with Node `fs`/`stream`/`Buffer`; ~2MB bundle. May work with `nodejs_compat`, may exceed Workers bundle size, may misrender fonts. Fallback: `pdf-lib` (edge-native, ~300KB, different API — invoice/LMN templates need rewrite). Worst case: proxy to a tiny Vercel Fluid Compute endpoint.
26. AI SDK streaming (`streamText` in `app/api/protocol/generate/`, `app/api/meal-plan/`). Designed for edge; verify in Block 6.
27. `gray-matter` + `marked` + `DOMPurify` — pure JS; should work; verify.
28. `@react-pdf/renderer` font loading (`Font.register()` on TTF). Fonts may need inlining as base64 or moving to R2.

**Environment / secrets**
29. ~20+ env vars re-entered in Cloudflare Pages UI: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, Affirm/Klarna/Authorize.net keys, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `JWT_SECRET`, `SESSION_SECRET`, `DATABASE_URL` (Neon), `POSTGRES_URL` (alias if still referenced), QuickBooks OAuth (`QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET`, `QUICKBOOKS_REDIRECT_URI`), Curator feed IDs, `NEXT_PUBLIC_GA_MEASUREMENT_ID`. Audit against `docs/env-vars-go-live.md`. Asher Med vars removed (per Apr 4 removal).
30. `NEXT_PUBLIC_SITE_URL` set per environment: `https://cultrhealth.com` (prod), `https://staging.cultrhealth.com` (staging) or preview-URL.
31. QuickBooks OAuth redirect URI registered in QB developer dashboard — verify the value points to the cultrhealth.com domain (not a Vercel-specific URL).
32. Stripe webhook endpoint URL in Stripe dashboard — verify it uses `cultrhealth.com/api/webhook/stripe` (not Vercel-specific). Same for Affirm/Klarna/Authorize.net webhook endpoints.
33. `ADMIN_BASE_URL` in cultrclub-web env — unchanged at `https://cultrhealth.com`.

**Uploads / storage**
34. Intake file uploads (`app/api/intake/upload/route.ts`). Asher Med was removed Apr 4 — verify current upload destination.
35. `@react-pdf/renderer` invoice/LMN download flow depends on #25.

**Telehealth / integrations**
36. Calendly webhook endpoint (Apr 12 replacement for Healthie) — verify edge compatibility.
37. Daily.co / WebRTC telehealth — client-side only; unaffected by edge migration; verify.

**Observability**
38. Vercel Analytics / Speed Insights not used — skip.
39. No Sentry — errors visible in Cloudflare Pages logs. Know where to look.

### 🟢 Tier 3 — Annoying but non-blocking

40. `robots.ts` + `sitemap.ts` Next.js generated routes — verify edge output correct.
41. Static asset paths (`/cultr-health-logo.png`, `/og-image.png`) — Cloudflare Pages static handler; verify.
42. Content markdown in `content/library/*.md` — read at build time via `gray-matter`; should work.
43. HubSpot embed (Apr 19 commit) — client-side only.
44. Curator.io social feed — client-side.
45. Google Analytics 4 — client-side.
46. Recent commits rebase — just before cutover: `git pull origin staging` on cultrhealth-web, resolve conflicts, redeploy staging preview.

### Deployment / DNS

47. Cloudflare Pages project creation (`cultrhealth-web`).
48. Build command: `npx @cloudflare/next-on-pages@1`.
49. Output directory: `.vercel/output/static` (next-on-pages emits this).
50. `nodejs_compat` compat flag in `wrangler.toml`.
51. DNS apex: `cultrhealth.com` A or CNAME flip from Vercel to Cloudflare Pages. CNAME flattening.
52. DNS www: `www.cultrhealth.com` → apex redirect (Cloudflare handles automatically).
53. DNS staging: `staging.cultrhealth.com` CNAME to Cloudflare preview URL.
54. SSL cert auto-issued by Cloudflare within minutes.
55. Lower TTL to 300s 24 h before cutover.
56. Vercel production deployment: paused (not deleted) for 30-day standby.
57. Vercel Cron: disabled at cutover.

### Cross-app integrity (cultrclub.com keeps working)

58. `ADMIN_BASE_URL=https://cultrhealth.com` in cultrclub-web env — unchanged.
59. Admin endpoint paths in cultrhealth-web identical to current Vercel paths.
60. HMAC approval token verification under `nodejs_compat`.
61. Shared Neon DB — zero schema changes.
62. Attribution cookies per-hostname — no cross-impact.
63. Club-order lifecycle emails contain `cultrhealth.com/admin/...` links that must render on Cloudflare.

## Compressed Execution Order (same-day)

| Block | Duration | Work |
|---|---|---|
| **0. Prep** | 30m | Clone/copy to `cultrhealth-web/`; `git init`; point to new remote. Delete legacy: `app/join-club/`, `components/sections/`, root `components/Footer.tsx`/`Navigation.tsx`/`WaitlistForm.tsx`, `lib/stores/` (empty), `class-variance-authority` from deps, `isJoinHost` + `HIDE_CHROME_HOSTNAMES` code, `tests/api/club-*` fixtures for the retired subdomain. |
| **1. Config skeleton** | 30m | `wrangler.toml` with `nodejs_compat` + Cron Triggers. `_headers` file ported from `next.config.js`. `next.config.js` edits: `images.unoptimized: true`, remove `headers()`, keep redirects. `package.json` scripts: `build:cf`, `preview`, `deploy:staging`, `deploy:prod`. |
| **2. DB layer** | 45m | Rewrite `lib/db.ts` with `neon({ fullResults: true })`. Codemod `@vercel/postgres` → `@neondatabase/serverless` across ~30+ files. Fix transaction handlers to use `createPool()` + `Pool.connect()`. |
| **3. Runtime declarations** | 30m | Script-add `export const runtime = 'edge'` to 72 routes. Verify via grep post-script. |
| **4. Middleware + cookies** | 45m | Delete `isJoinHost` + `HIDE_CHROME_HOSTNAMES` blocks. Port `getCookieDomain()` from cultrclub-web. Audit `response.cookies.set` usage. |
| **5. Cron adapter** | 30m | `workers/cron.ts` scheduled handler that HTTP-forwards to existing `/api/cron/*` routes. Add Cron Triggers to `wrangler.toml` (`0 0 * * *` for approve-commissions, appropriate schedule for update-tiers). |
| **6. Risky-dep spike** | 1–2h | Preview-deploy and test `@react-pdf/renderer`. If fails → pivot to `pdf-lib` (rework invoice/LMN templates) or Vercel Fluid Compute proxy. Verify AI SDK streaming in `/api/protocol/generate/` and `/api/meal-plan/`. |
| **7. Cloudflare Pages setup** | 30m | Create project. Enter ~20 env vars (list in Tier 2 #29). Connect repo. |
| **8. Staging deploy + smoke** | 1h | `staging.cultrhealth.com` up. Validation V1–V6. |
| **9. Payment + AI validation** | 1h | Validation V7–V11 (one real Stripe test-mode checkout, other 3 processors at minimum verified to receive webhooks). |
| **10. Cron + cross-app** | 30m | V12–V15 (both crons manually triggered, cultrclub → new cultrhealth-web admin approval round-trip, QB OAuth refresh, Calendly webhook). |
| **11. DNS cutover** | 15m | Flip apex + www DNS. Disable Vercel Cron. |
| **12. Post-cutover watch** | 2h | Monitor Cloudflare logs for 5xx. Verify Stripe/Affirm/Klarna/Authorize.net webhook deliveries succeed. Watch first cron fire. |

**Total: 9–11 hours of focused work.** Block 6 is the wildcard; if `@react-pdf/renderer` requires a full library swap, add 2–3h for template rework.

## Pre-Cutover Validation Checklist

| # | Check | Must pass |
|---|---|---|
| V1 | Home page loads | 🔴 |
| V2 | Quiz → lead capture → admin Quiz Leads tab | 🟡 |
| V3 | Magic link login (member + admin + creator) | 🔴 |
| V4 | Admin dashboard loads all tabs | 🔴 |
| V5 | Creator portal loads dashboard + earnings | 🔴 |
| V6 | Intake form submission (full flow) | 🟡 |
| V7 | One Stripe test-mode checkout end-to-end | 🔴 |
| V8 | Affirm / Klarna / Authorize.net each with 1 test transaction | 🟡 |
| V9 | PDF invoice generation (or fallback path) | 🟡 |
| V10 | AI protocol generation streams correctly | 🟡 |
| V11 | Turnstile widget renders + validates | 🔴 |
| V12 | Both crons fire at next scheduled time (manually trigger) | 🔴 |
| V13 | cultrclub.com → new cultrhealth-web admin approval round-trip | 🔴 |
| V14 | QuickBooks OAuth refresh flow | 🟡 |
| V15 | Calendly webhook arrives + emails fire | 🟡 |
| V16 | Static assets (logo, images, OG) load at expected paths | 🟢 |

**Minimum gates before DNS flip:** V3, V7, V12, V13. These four cover 80% of silent-failure surface.

## Rollback Plan

**Trigger:** any Tier-1 silent failure discovered post-cutover (lost webhook, missed cron, payment drop, auth outage).

**Steps:**
1. Re-enable Vercel production deployment (paused, not deleted — takes ~2 min).
2. Re-enable Vercel Cron (via Vercel dashboard).
3. Flip DNS apex + www back to Vercel A record. With TTL at 300s, propagation < 5 min.
4. File post-mortem against the specific Tier-1 failure mode.
5. Re-attempt migration once root cause understood and fix validated on cultrhealth-web staging preview.

**Rollback window:** 30 days. After 30 days with no regressions, delete Vercel project.

## Testing Strategy

- Automated tests (`vitest` in the cultrhealth-web repo) run locally during adaptation; passing tests are required before Block 8.
- No new test suites added for this migration — parity is verified via the validation checklist (V1–V16), not new automation.
- Playwright E2E suite (per `docs/superpowers/specs/2026-04-05-playwright-e2e-suite-design.md`) runs against `staging.cultrhealth.com` post-deploy if time allows; not blocking.
- Stripe webhook validation via `stripe trigger` CLI.
- Cron validation via manual schedule trigger (one-shot `* * * * *` for testing, then revert to production schedule).

## Success Criteria

1. `cultrhealth.com` serves from Cloudflare Pages (verified: `curl -I https://cultrhealth.com` shows `server: cloudflare`).
2. All 16 validation checks pass.
3. Zero silent Tier-1 failures in the first 48 hours post-cutover.
4. cultrclub.com admin approval flow works end-to-end through the new cultrhealth-web admin endpoints.
5. Both cron jobs (`approve-commissions`, `update-tiers`) fire at their next scheduled times via Cloudflare Cron Triggers; Vercel Cron disabled.
6. No `@vercel/postgres` imports remain in `cultrhealth-web` (verified: `grep -r '@vercel/postgres' cultrhealth-web/` returns zero matches).
7. All `/api/*` routes declare `export const runtime = 'edge'`.
8. `CLAUDE.md` and `.cursorrules` in cultrhealth-web updated to reflect Cloudflare architecture (can be follow-up commit; not cutover-blocking).

## Known Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `@react-pdf/renderer` fails on edge | Medium | Invoice/LMN PDFs unavailable | Block 6 spike; fallback to `pdf-lib` or Vercel proxy function |
| Hidden `@vercel/postgres` usage pattern | Medium | Silent query failure | Grep audit + `fullResults: true` standardization in Block 2 |
| Stripe webhook signature verification edge-case | Low | Silent drop of payments | `stripe trigger` test against staging in Block 9 |
| DNS TTL cache delays rollback | Low | Extended outage if rollback needed | Lower TTL to 300s 24h ahead |
| Dual-cron during cutover window | Low | Duplicate commission approvals | Disable Vercel Cron as first step of Block 11 |
| Recent commits lost during migration | Low | Feature regression | Final `git pull origin staging` + rebase before Block 11 |
| Cloudflare Workers bundle size exceeded | Low | Build fails | Known — `@react-pdf/renderer` is the likely offender; handled in Block 6 |

## Open Questions (address during execution, not blocking)

- Does `staging.cultrhealth.com` DNS already exist, or does it need creating during Block 7?
- Is there a specific `NEXT_PUBLIC_LEGITSCRIPT_SEAL_ID` value that must ship unchanged?
- Playwright E2E suite — run pre-cutover against staging or skip for same-day pace?
- Post-cutover: update `.cursorrules` / `CLAUDE.md` in the same PR as migration, or separate commit?

## Follow-up Work (not blocking cutover)

- Update `CLAUDE.md` to reflect Cloudflare architecture (runtime declarations, _headers file, Cron Triggers).
- Update `.cursorrules` to remove Vercel-specific guidance and add Cloudflare gotchas.
- Delete Vercel project after 30-day standby.
- Archive the original `Cultr Health Website` repo or redirect to `cultrhealth-web`.
- Close the cultrclub-web Phase 05-02 plan (absorbed into this migration).
- Update `.planning/STATE.md` to reflect Phase 2 completion.
