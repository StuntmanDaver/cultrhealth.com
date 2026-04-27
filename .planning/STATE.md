---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Stripe to CorePay (Authorize.Net) replacement
status: planning
last_updated: "2026-04-27T22:43:41.564Z"
last_activity: 2026-04-27
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
**Current focus:** v2.0 — Strip Stripe and replace with Authorize.Net (CorePay merchant). Source plan: `/Users/davidk/.claude/plans/async-petting-fern.md`

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-04-27 — Milestone v2.0 started

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

1. Research v2.0 domain (Authorize.Net ARB / CIM / webhooks specifics) — 4 parallel agents
2. Define REQUIREMENTS.md cross-checked against the approved plan
3. Spawn gsd-roadmapper for ROADMAP.md
4. After roadmap approval: `/gsd-plan-phase 6` to start Phase 6 — Skills (or whichever number the roadmapper assigns)
