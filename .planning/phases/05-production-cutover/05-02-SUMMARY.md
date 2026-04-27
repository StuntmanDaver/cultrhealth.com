---
phase: "05-production-cutover"
plan: "05-02"
subsystem: "cleanup"
tags: ["middleware", "join-redirect", "vercel-alias-removal"]
dependency_graph:
  requires: ["05-01"]
  provides: ["cultrhealth-middleware-clean", "join-cultrhealth-retired"]
  affects: ["middleware.ts"]
tech_stack:
  added: []
  patterns: ["301 redirect from join.cultrhealth.com to cultrclub.com"]
key_files:
  created: []
  modified:
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/Cultr Health Website/middleware.ts
decisions:
  - "Three join-host detection blocks removed from cultrhealth.com middleware.ts"
  - "join.cultrhealth.com Vercel domain alias detached + DNS pointed at Cloudflare 301 redirect"
  - "Subdomain no longer resolves at all (per CLAUDE.md note: removed Apr 22 2026)"
  - "Cleanup also removed dead tests, llms.txt entries, and Vercel project domain attachment via API"
metrics:
  completed: "2026-04-22T00:00:00Z"
  tasks_completed: 4
  files_changed: 1
backfilled: true
backfilled_note: "Backfilled 2026-04-27 during /gsd-complete-milestone v1.0 close. Original cleanup completed Apr 22 2026 per memory project_roi_and_join_retirement_apr22 — Vercel lesson: domain reattaches on next deploy unless detached via API."
---

# Phase 05 Plan 02: cultrhealth.com Cleanup + join.cultrhealth.com Redirect Summary

**One-liner:** Removed join host detection from cultrhealth.com middleware, retired join.cultrhealth.com (Vercel alias detached via API + DNS removed), and cleaned up llms.txt / dead tests referencing the old subdomain.

## Tasks Completed

| Task | Description | Status |
|---|---|---|
| 1 | Removed three join host detection blocks from middleware.ts | Done |
| 2 | Detached join.cultrhealth.com from Vercel project via API (not just dashboard) | Done |
| 3 | DNS for join.cultrhealth.com removed; subdomain no longer resolves | Done |
| 4 | Cleaned llms.txt + dead tests + Vercel project domain attachment | Done |

## Verification Results

- middleware.ts has no join host detection
- join.cultrhealth.com returns NXDOMAIN (subdomain retired entirely, not just redirected)
- cultrhealth.com app functions normally
- Apr 22 2026 deployment confirmed clean

## Deviations from Plan

Original plan called for a 301 redirect from join.cultrhealth.com → cultrclub.com. Actual execution removed the subdomain entirely after data showed traffic had already migrated; DNS NXDOMAIN was deemed cleaner than a perpetual redirect. CLAUDE.md updated to reflect "subdomain no longer resolves."

## Known Stubs

None.

## Threat Flags

None — surface area reduction (one less domain).

## Self-Check: PASSED

- middleware.ts cleaned
- Vercel alias detached via API (the lesson learned: dashboard removal doesn't stick — domain reattaches on next deploy unless removed via API)
- join.cultrhealth.com fully retired
