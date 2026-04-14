---
phase: "03-code-adaptation"
plan: "03-01"
subsystem: "database"
tags: ["neon", "cloudflare", "db-migration", "sql-import-swap"]
dependency_graph:
  requires: ["02-02"]
  provides: ["neon-sql-client", "database-error-class"]
  affects: ["lib/creators/db.ts", "app/api/club/*", "app/api/stock/route.ts"]
tech_stack:
  added: ["@neondatabase/serverless neon() with fullResults:true"]
  patterns: ["fullResults:true for .rows/.rowCount shape parity with @vercel/postgres"]
key_files:
  created: []
  modified:
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/lib/db.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/lib/creators/db.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/app/api/club/signup/route.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/app/api/club/event/route.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/app/api/club/check-member/route.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/app/api/stock/route.ts
decisions:
  - "neon() with fullResults:true preserves .rows and .rowCount result shape from @vercel/postgres — mandatory for zero-change callers"
  - "app/page.tsx required no change — had no @vercel/postgres import"
  - "createPool exported for transaction-only use (Pool.connect() pattern)"
metrics:
  duration: "~3 minutes"
  completed: "2026-04-14T03:19:27Z"
  tasks_completed: 4
  files_changed: 6
---

# Phase 03 Plan 01: lib/db.ts Rewrite + SQL Import Swaps Summary

**One-liner:** Rewrote `lib/db.ts` with `@neondatabase/serverless` `neon()` using `fullResults:true` and swapped all `@vercel/postgres` sql imports to `@/lib/db` in 5 affected files.

## Tasks Completed

| Task | Description | Status |
|---|---|---|
| 1 | Rewrite lib/db.ts with neon() + fullResults:true + createPool + DatabaseError | Done |
| 2 | Swap @vercel/postgres imports in 5 files (creators/db.ts + 4 API routes) | Done |
| 3 | Verify grep returns CLEAN on all 6 target files | Done — CLEAN |
| 4 | Commit in cultrclub-web | Done — e3980fc |

## Commits

| Repo | Hash | Message |
|---|---|---|
| cultrclub-web | e3980fc | refactor(db): rewrite lib/db.ts with @neondatabase/serverless + swap sql imports |

## Verification Results

- `lib/db.ts` exports `sql` (NeonQueryFunction<false, true>), `createPool`, `DatabaseError`
- `neon()` called with `{ fullResults: true }` — result shape matches @vercel/postgres (.rows, .rowCount)
- All 5 files with @vercel/postgres sql imports updated to `@/lib/db`
- `app/page.tsx` had no @vercel/postgres import — no change needed
- grep on all 6 target files returns CLEAN

## Deviations from Plan

None — plan executed exactly as written.

`app/page.tsx` was listed as one of the 6 files to check but had no `@vercel/postgres` import (it only imports `JoinLandingClient`). The grep verified it clean without any edit needed.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED

- lib/db.ts exists with correct neon() + fullResults:true implementation
- e3980fc commit verified in cultrclub-web git log
- All 6 target files clean of @vercel/postgres imports
