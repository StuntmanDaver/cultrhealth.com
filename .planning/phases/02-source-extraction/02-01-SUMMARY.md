---
phase: "02-source-extraction"
plan: "02-01"
subsystem: "app-routes"
tags: ["extraction", "join-club", "api", "club", "stock", "health"]
dependency_graph:
  requires: ["01-01"]
  provides: ["app/page.tsx", "app/api/club/*", "app/api/stock", "app/api/health"]
  affects: ["03-cloudflare-adaptation"]
tech_stack:
  added: []
  patterns: ["next-app-router", "edge-runtime", "vercel-postgres-raw-copy"]
key_files:
  created:
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/app/page.tsx
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/app/JoinLandingClient.tsx
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/app/api/club/signup/route.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/app/api/club/orders/route.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/app/api/club/event/route.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/app/api/club/check-member/route.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/app/api/stock/route.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/app/api/health/route.ts
  modified: []
decisions:
  - "Copied JoinLandingClient.tsx alongside page.tsx — the server component was a thin wrapper, the real UI is in the client component"
  - "app/api/health/route.ts created as new edge-runtime file (not a copy) returning { ok: true }"
  - "Task 3 skipped per plan — join-club layout.tsx excluded (minimal layout.tsx from 01-01 is correct)"
  - "All API routes copied verbatim with @vercel/postgres imports intact — Phase 3 will swap to @neondatabase/serverless"
metrics:
  duration: "~8 minutes"
  completed: "2026-04-14"
  tasks_completed: 5
  tasks_skipped: 1
  files_created: 8
---

# Phase 02 Plan 01: Extract App Routes Summary

## One-liner

Raw copy of CULTR Club join landing page and all 5 club/stock API routes from cultrhealth-website into cultrclub-web, plus new health ping endpoint.

## What Was Built

Extracted the complete CULTR Club join experience into cultrclub-web:

- **`app/page.tsx`** — Root page for cultrclub.com, thin server component wrapper importing JoinLandingClient
- **`app/JoinLandingClient.tsx`** — Full join landing UI: therapy catalog grid, signup modal, add-to-cart, sticky cart summary panel, mobile cart overlay
- **`app/api/club/signup/route.ts`** — Club member signup: DB upsert with full visitor context tracking, 90-day cookie, welcome email via Resend, Mailchimp sync
- **`app/api/club/orders/route.ts`** — Club order submission: coupon validation, stock check, DB transaction (member upsert + order insert + inventory decrement), HMAC approval token, dual email (customer + admin), creator attribution, Mailchimp sync
- **`app/api/club/event/route.ts`** — Visitor analytics events: sessionId + eventType routing, writes to `visitor_events` table
- **`app/api/club/check-member/route.ts`** — Member recognition: dual mode (signed cookie = full data, email param = minimal first name only for anti-enumeration)
- **`app/api/stock/route.ts`** — Product inventory: reads `product_inventory` table, no-cache headers
- **`app/api/health/route.ts`** — New file: simple `export const runtime = 'edge'` health ping returning `{ ok: true }`

## Deviations from Plan

**Task 3 skipped as planned.** The plan itself notes to skip copying join-club layout.tsx — the minimal layout.tsx from Phase 1 (01-01) is correct.

**JoinLandingClient.tsx added (unlisted but necessary).** The source `app/join-club/page.tsx` was a one-line wrapper importing `JoinLandingClient`. Including only `page.tsx` without the client component would leave a broken import. JoinLandingClient.tsx (513 lines) was copied alongside page.tsx as part of the same logical unit. This is not a deviation from intent — the plan says "copy the join landing page" and both files are required for that to work.

**Source files recovered from git history.** The `app/join-club/` directory was deleted in commit `357c857` (Rename CULTR Concierge tier to CULTR Curated). Page.tsx and JoinLandingClient.tsx were recovered from `357c857^` (the parent commit). The API routes (`app/api/club/*`, `app/api/stock/`) still exist in the source repo and were copied directly.

## Known Stubs

None. All files are raw copies with functional logic. API routes still import `@vercel/postgres` which will be swapped to `@neondatabase/serverless` in Phase 3.

## Threat Flags

None. No new network endpoints beyond what was already in cultrhealth-website. The health route is read-only and returns no sensitive data.

## Self-Check: PASSED

All 8 files created and committed in cultrclub-web:
- app/page.tsx: FOUND
- app/JoinLandingClient.tsx: FOUND
- app/api/club/signup/route.ts: FOUND
- app/api/club/orders/route.ts: FOUND
- app/api/club/event/route.ts: FOUND
- app/api/club/check-member/route.ts: FOUND
- app/api/stock/route.ts: FOUND
- app/api/health/route.ts: FOUND

Commit `8491515` verified in cultrclub-web git log.
