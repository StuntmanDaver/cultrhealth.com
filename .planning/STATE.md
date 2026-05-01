---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Stripe to Corepay (Authorize.Net gateway) replacement
status: Roadmap drafted; awaiting plan-phase invocation.
last_updated: "2026-05-01T23:21:11.796Z"
last_activity: 2026-04-27 — ROADMAP.md drafted, 75 REQs mapped across Phases 6–13
progress:
  total_phases: 8
  completed_phases: 0
  total_plans: 18
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-27)

**Core value:** HIPAA-compliant telehealth for GLP-1 weight loss medications, wellness peptides, and longevity optimization.
**Current focus:** v2.0 — Strip Stripe and replace with Authorize.Net via the existing Corepay merchant ISO. (Corepay = corepay.net merchant ISO; Authorize.Net = underlying gateway. Corpay = unrelated Fleetcor B2B product, NOT in scope.) Source plan: `/Users/davidk/.claude/plans/async-petting-fern.md`

## Current Position

Phase: 6 — Skills (not started)
Plan: —
Status: Roadmap drafted; awaiting plan-phase invocation.
Last activity: 2026-04-27 — ROADMAP.md drafted, 75 REQs mapped across Phases 6–13

## Roadmap Summary

v2.0 spans **Phases 6–13** (8 phases, ~18 plans estimated):

| Phase | Name | REQ Count | Plans (est.) |
|---|---|---|---|
| 6 | Skills | 5 | 1 |
| 7 | Schema + Gateway Plumbing | 13 | 3 |
| 8 | Subscription Lifecycle Core | 8 | 2 |
| 9 | Coupon Engine | 11 | 2 |
| 10 | Self-Service Portal UI | 14 | 3 |
| 11 | Receipts + Dunning Ladder | 11 | 2 |
| 12 | Migration Cutover | 10 | 2 |
| 13 | Refunds + Reporting + Hardening | 14 | 3 |
| **Totals** | | **76** | **18** |

> **2026-04-28 update:** REQ total raised 75 → 76 after second double-check pass surfaced LFC-08 (`lib/auth.ts` Stripe-fallback for subscription lookup is a behavioral integration). HRD-07/HRD-08 scope corrected to list all 12 Stripe-importing files / 19 init sites. PLB-04 macOS-dup file list corrected (037/038/039/040 not 057/058/059). Phase boundaries unchanged.

**Hard sandbox gate before Phase 7:** Open questions Q1–Q6 from `.planning/research/SUMMARY.md` §6 must be resolved in CorePay sandbox before backend build starts.

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

### v2.0 Locked Architectural Decisions

(From `.planning/research/SUMMARY.md` §4 — these are NOT open questions for planning.)

| Decision | Why |
|---|---|
| Do NOT install `authorizenet` npm package | Axios CVE, CJS-only, breaks edge runtime; extend `gatewayFetch()` instead |
| Both webhook handlers run in parallel during migration | Killing Stripe handler day 1 orphans in-flight events |
| One CIM customer profile per email lifetime, many payment profiles | ARB references customer + payment profile by ID — clean pause/resume |
| Card update default: Path B (new payment profile + ARBUpdate) | Path A cascade unverified; default to unambiguous path |
| Void Stripe invoices BEFORE `subscriptions.cancel()` | Skipping void risks double-charge from in-flight invoice |
| Vercel Fluid Compute (300s) — no async pattern needed for checkout | Sequential ARB calls fit in 3-8s |
| Coupon source-of-truth: `coupon_redemptions` at redeem time | Decouple from Stripe coupon model |
| Webhook side effects extracted to `lib/webhooks/dispatcher.ts` | DRY across providers |

### Open Blockers

**Pre-Phase-7 sandbox gate** — Q1–Q6 from `.planning/research/SUMMARY.md` §6:

1. Q1: CIM payment profile cascade to ARB? (Path A vs Path B default)
2. Q2: Vercel Fluid Compute on staging?
3. Q3: Existing Sentry project on cultrhealth.com?
4. Q4: Account Updater enabled on CorePay merchant?
5. Q5: CIM payment profile retention policy?
6. Q6: Authorize.Net first-charge limitation? (ARB day-1 charge?)

### Next Steps

1. Resolve Q1–Q6 in CorePay sandbox (block Phase 7)
2. `/gsd-plan-phase 6` — Skills (independently shippable; doesn't block on sandbox gate)
3. `/gsd-plan-phase 7` — Schema + Gateway Plumbing (after sandbox)
4. Continue through Phase 13 in dependency order
