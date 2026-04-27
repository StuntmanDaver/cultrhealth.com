---
gsd_state_version: 1.0
milestone: null
milestone_name: null
status: between_milestones
last_updated: "2026-04-27T19:15:00.000Z"
last_activity: 2026-04-27 — v1.0 closed; awaiting /gsd-new-milestone for v2.0 Stripe→CorePay
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-27)

**Core value:** HIPAA-compliant telehealth for GLP-1 weight loss medications, wellness peptides, and longevity optimization.
**Current focus:** Between milestones — v1.0 (cultrclub-web Cloudflare migration) shipped Apr 22 2026; v2.0 (Stripe → CorePay/Authorize.Net replacement) is planned and awaiting milestone scaffolding.

## Current Position

Phase: — (no active milestone)
Status: Awaiting `/gsd-new-milestone`
Last activity: 2026-04-27 — v1.0 milestone closed

## Deferred Items

Items acknowledged and deferred at v1.0 close on 2026-04-27. These are **not** part of any GSD milestone — they live in `.planning/quick/` and `.planning/debug/` for ad-hoc execution.

| Category | Item | Status |
|---|---|---|
| debug | creator-revenue-admin-sync | awaiting_human_verify |
| debug | join-page-returning-members | awaiting_human_verify |
| quick_task | 1-optimize-creator-portal-ux-content-group | missing |
| quick_task | 2-end-to-end-test-jon-collins-creator-acco | missing |
| quick_task | 260329-upf-make-the-entire-website-extremely-hipaa- | missing |
| quick_task | 260330-i46-club-order-fulfillment-pipeline-in-admin | missing |
| quick_task | 260331-fpi-audit-admin-dashboard-fix-fulfillment-sy | missing |
| quick_task | 260415-uma-add-ability-to-delete-customers-and-memb | missing |
| quick_task | 3-change-jon-collins-jon21-coupon-to-10-cu | missing |
| quick_task | 4-admin-revenue-chart-date-filters | missing |
| quick_task | 5-admin-order-search-customer-detail | missing |
| quick_task | 6-admin-member-lifecycle | missing |
| quick_task | 7-create-a-methodical-system-to-check-the- | missing |

## Accumulated Context

### Recent Milestone Decisions (v1.0)

Full record archived in `.planning/milestones/v1.0-ROADMAP.md`. Summary:

| Decision | Rationale |
|---|---|
| `@neondatabase/serverless` with `fullResults: true` | Preserves `.rows` / `.rowCount` shape — zero call-site changes |
| `nodejs_compat` flag in wrangler.toml | Resolves all crypto/Buffer issues without code changes |
| `images.unoptimized: true` | No image optimization server on Cloudflare Pages |
| `ADMIN_BASE_URL` env var for approval links | Approval emails must link to cultrhealth.com admin, not cultrclub.com |
| Vercel alias removal via API (not dashboard) | Dashboard removal silently re-attaches on next deploy |
| `join.cultrhealth.com` retired (NXDOMAIN, not 301) | Cleaner — no stale traffic to maintain |

### Open Blockers

None.

### Next Steps

1. `/gsd-new-milestone` — scaffold v2.0 Stripe → CorePay replacement
   - Source plan: `/Users/davidk/.claude/plans/async-petting-fern.md`
   - 8 phases (0 — Skills through 7 — Hardening)
2. Optional: `/gsd-cleanup` — archive orphan phase directories under `.planning/phases/` (`01-foundation`, `02-checkout-integration`, `03-kit-registration`) which predate v1.0 and were never folded into a roadmap.
