---
phase: "05-production-cutover"
plan: "05-01"
subsystem: "production-cutover"
tags: ["cultrclub.com", "cloudflare-pages", "production", "dns", "ssl"]
dependency_graph:
  requires: ["04-02"]
  provides: ["cultrclub-com-live"]
  affects: []
tech_stack:
  added: ["cultrclub.com production domain", "Cloudflare Pages production branch"]
  patterns: ["www → apex 301", "production env vars (NEXT_PUBLIC_SITE_URL=https://cultrclub.com)"]
key_files:
  created: []
  modified: []
decisions:
  - "cultrclub.com served from Cloudflare Pages production branch (cultrclub-web/main)"
  - "Production env vars set distinct from staging — NEXT_PUBLIC_SITE_URL = https://cultrclub.com"
  - "www.cultrclub.com → cultrclub.com via 301; SSL issued by Cloudflare"
  - "Crawler/LLM blackout maintained: robots.txt disallow + X-Robots-Tag + middleware noindex"
metrics:
  completed: "2026-04-22T00:00:00Z"
  tasks_completed: 4
  files_changed: 0
backfilled: true
backfilled_note: "Backfilled 2026-04-27 during /gsd-complete-milestone v1.0 close. Original cutover landed Apr 22 2026 per memory project_cultrhealth_cloudflare_migration_apr20 + reference_cultrhealth_deploy_pipeline."
---

# Phase 05 Plan 01: cultrclub.com Production Go-Live Summary

**One-liner:** Pointed cultrclub.com at Cloudflare Pages production branch — apex + www serving live, SSL active, all production env vars set.

## Tasks Completed

| Task | Description | Status |
|---|---|---|
| 1 | cultrclub.com DNS + nameservers managed by Cloudflare | Done |
| 2 | Custom domain attached to cultrclub-web Pages production branch | Done |
| 3 | Production env vars set (NEXT_PUBLIC_SITE_URL = https://cultrclub.com) | Done |
| 4 | SSL certificate issued and active for cultrclub.com + www | Done |

## Verification Results

- cultrclub.com loads the live app from Cloudflare Pages production
- www.cultrclub.com 301-redirects to cultrclub.com (apex canonical)
- SSL valid (Cloudflare Universal SSL)
- Production env vars active (verified by api/club/signup behavior + welcome email links)

## Known Stubs

None.

## Threat Flags

None — no new endpoints; existing crawler blackout preserved.

## Self-Check: PASSED

- cultrclub.com confirmed live Apr 22 2026
- SSL + DNS healthy
- 24h monitoring window cleared before unblocking 05-02
