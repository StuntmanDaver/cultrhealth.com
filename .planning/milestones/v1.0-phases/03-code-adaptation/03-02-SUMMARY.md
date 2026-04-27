---
phase: "03-code-adaptation"
plan: "03-02"
subsystem: "api-runtime"
tags: ["cloudflare", "edge-runtime", "middleware", "pool-swap", "cookie-fix"]
dependency_graph:
  requires: ["03-01"]
  provides: ["edge-runtime-all-routes", "utm-middleware", "admin-base-url"]
  affects:
    - app/api/club/event/route.ts
    - app/api/club/check-member/route.ts
    - app/api/stock/route.ts
    - app/page.tsx
    - middleware.ts
tech_stack:
  added: []
  patterns:
    - "export const runtime = 'edge' on all API routes and page"
    - "UTM first-touch tracking in middleware with cultrclub.com domain scoping"
    - "ADMIN_BASE_URL env var for admin panel links vs customer-facing siteUrl"
key_files:
  created:
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/middleware.ts
  modified:
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/app/api/club/event/route.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/app/api/club/check-member/route.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/app/api/stock/route.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/app/page.tsx
decisions:
  - "Tasks 1-5 were already completed in a prior run — only edge runtime + middleware remained"
  - "stock/route.ts: removed export const dynamic = force-dynamic and revalidate = 0 (not valid in edge runtime) when adding export const runtime = 'edge'"
  - "middleware.ts: UTM-only, no host detection, no HIPAA session timeout — cultrclub.com is a single-domain app"
metrics:
  duration: "~4 minutes"
  completed: "2026-04-14T03:45:00Z"
  tasks_completed: 4
  files_changed: 5
---

# Phase 03 Plan 02: Pool Swap, Admin URL Fix, Cookie Fix, Edge Runtime, Middleware Summary

**One-liner:** Added `export const runtime = 'edge'` to all remaining API routes and page, created UTM-only middleware scoped to `.cultrclub.com`, removed incompatible Next.js dynamic/revalidate directives from stock route.

## Tasks Completed

| Task | Description | Status |
|---|---|---|
| 1 | Pool swap in orders/route.ts + commission.ts | Pre-done (already applied) |
| 2 | ADMIN_BASE_URL in orders/route.ts | Pre-done (already applied) |
| 3 | Welcome email link → cultrclub.com in signup/route.ts | Pre-done (already applied) |
| 4 | Cookie domain fix in JoinLandingClient.tsx | Pre-done (no hardcoded .cultrhealth.com found) |
| 5 | getCookieDomain() in lib/utils.ts | Pre-done (already correct) |
| 6 | Add edge runtime to event, check-member, stock routes + page.tsx | Done |
| 7 | Write simplified middleware.ts (UTM tracking only) | Done |
| 8 | Verify zero @vercel/postgres imports | CLEAN — only comment in lib/db.ts |
| 9 | Commit in cultrclub-web | Done — cdece02 |

## Commits

| Repo | Hash | Message |
|---|---|---|
| cultrclub-web | cdece02 | refactor(cloudflare): Pool swap, admin URL, cookie fix, edge runtime, middleware |

## Verification Results

- `grep -r "from '@vercel/postgres'" app/ lib/` → CLEAN
- `grep -r "db.connect()" app/ lib/` → CLEAN
- All 6 API routes have `export const runtime = 'edge'` (signup, orders, event, check-member, stock, health)
- `app/page.tsx` has `export const runtime = 'edge'`
- `middleware.ts` exists with UTM first-touch tracking, `.cultrclub.com` domain scoping, no HIPAA logic
- `ADMIN_BASE_URL` used in orders/route.ts for approval email links
- `getCookieDomain()` returns `.cultrclub.com` for cultrclub.com URLs
- Welcome email in signup/route.ts links to `https://cultrclub.com`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed incompatible Next.js directives from stock/route.ts**
- **Found during:** Task 6
- **Issue:** `export const dynamic = 'force-dynamic'` and `export const revalidate = 0` are Node.js runtime directives not valid in Cloudflare edge runtime. Keeping them alongside `export const runtime = 'edge'` would cause build warnings or runtime errors on Workers.
- **Fix:** Removed both directives when adding `export const runtime = 'edge'`. The NO_CACHE_HEADERS object already handles caching at the HTTP response level, making the Next.js directives redundant.
- **Files modified:** `app/api/stock/route.ts`
- **Commit:** cdece02

**2. [Pre-done] Tasks 1–5 already applied**
- Tasks 1–5 (Pool swap, ADMIN_BASE_URL, signup email link, cookie domain, getCookieDomain) were all already applied in cultrclub-web before this agent ran. Verified each file; no edits needed.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced. Middleware only reads cookies and sets first-touch UTM cookie (httpOnly: false, intentional for client-side analytics read).

## Self-Check: PASSED

- middleware.ts exists at `/Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/middleware.ts`
- cdece02 commit verified in cultrclub-web git log
- All 6 target routes confirmed to have `export const runtime = 'edge'`
- Zero actual `@vercel/postgres` imports remain (comment in lib/db.ts is not an import)
