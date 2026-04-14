---
phase: "02-source-extraction"
plan: "02-02"
subsystem: "cultrclub-web"
tags: ["source-extraction", "lib", "components", "assets", "cloudflare"]
dependency_graph:
  requires: ["02-01"]
  provides: ["lib files", "components", "static assets"]
  affects: ["phase-03-cloudflare-adaptation"]
tech_stack:
  added: []
  patterns:
    - "Trimmed auth.ts to club visitor token functions only"
    - "lib/db.ts as DatabaseError placeholder pending Phase 3 rewrite"
    - "Binary assets copied via bash cp"
key_files:
  created:
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/lib/auth.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/lib/db.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/lib/utils.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/lib/resend.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/lib/mailchimp.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/lib/rate-limit.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/lib/turnstile.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/lib/config/join-therapies.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/lib/config/coupons.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/lib/config/tax.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/lib/config/affiliate.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/lib/creators/db.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/lib/creators/attribution.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/lib/creators/commission.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/lib/contexts/JoinCartContext.tsx
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/components/ui/Button.tsx
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/components/ui/apple-cards-carousel.tsx
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/hooks/use-outside-click.ts
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/public/cultr-health-logo.png
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/public/images/email-logo-cream.png
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/public/images/products/ (24 PNGs)
  modified:
    - /Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/app/JoinLandingClient.tsx
decisions:
  - "auth.ts trimmed to club visitor token functions only — member/creator/admin JWT stripped out"
  - "lib/db.ts written as DatabaseError placeholder; Phase 3 will rewrite to @neondatabase/serverless"
  - "JoinLandingClient.tsx sourced from app/join/ (richer version with carousel + coupon support) not the empty app/join-club/ directory"
  - "creators/ files copied as-is — sql import swap (@vercel/postgres -> @neondatabase/serverless) deferred to Phase 3"
  - "nodejs_compat flag in wrangler.toml will resolve crypto/Buffer usage in mailchimp.ts and attribution.ts without code changes"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-14"
  tasks_completed: 10
  files_created: 44
---

# Phase 02 Plan 02: Extract Lib Files, Components, and Static Assets Summary

## One-liner

Copied 15 lib files (trimmed auth.ts to club visitor only, stub db.ts), 2 UI components, 1 hook, JoinLandingClient.tsx, and 26 static assets from cultrhealth-website into cultrclub-web.

## What Was Built

All supporting lib files, components, hooks, and static assets required by the CULTR Club join experience were extracted from the source repo into cultrclub-web. These are raw copies; Cloudflare-specific adaptation (replacing @vercel/postgres with @neondatabase/serverless, adding `export const runtime = 'edge'`, etc.) happens in Phase 3.

### Files Extracted

**lib root (6 files):**
- `lib/auth.ts` — trimmed to `createClubVisitorToken` + `verifyClubVisitorToken` only
- `lib/db.ts` — new placeholder with `DatabaseError` class
- `lib/utils.ts` — `cn()`, `parseCookieJson()`, `getCookieDomain()`, `brandify()`
- `lib/resend.ts` — full email service (branded templates, notifications)
- `lib/mailchimp.ts` — Mailchimp contact sync (uses crypto/Buffer; resolved by nodejs_compat)
- `lib/rate-limit.ts` — in-memory + Upstash Redis rate limiting
- `lib/turnstile.ts` — Cloudflare Turnstile verification

**lib/config (4 files):**
- `join-therapies.ts` — full therapy catalog for join.cultrhealth.com
- `coupons.ts` — CLUB_COUPONS + validateCouponUnified()
- `tax.ts` — FL 7.5% tax rate
- `affiliate.ts` — types, commission config, tier config, FTC disclosures

**lib/creators (3 files):**
- `db.ts` — all creator DB operations (uses @vercel/postgres sql; Phase 3 will swap)
- `attribution.ts` — click tracking, cookie helpers, attribution resolution
- `commission.ts` — commission calculation + ledger entry helpers

**lib/contexts:**
- `JoinCartContext.tsx` — shopping cart React context for join flow

**components/ui:**
- `Button.tsx` — brand button (primary/secondary/ghost, framer-motion)
- `apple-cards-carousel.tsx` — carousel component used in join landing

**hooks:**
- `use-outside-click.ts` — click-outside detection for modals

**app:**
- `JoinLandingClient.tsx` — full join landing (carousel, cart, coupon, signup modal, stock)

**public assets:**
- `cultr-health-logo.png` — official CULTR Health logo
- `images/email-logo-cream.png` — cream logo variant for email
- `images/products/` — 24 product PNGs (vial images + COA images)

## Commits

| Hash | Message |
|------|---------|
| 8a03a3a | feat(02-02): extract lib files, components, and static assets |

## Deviations from Plan

### Auto-resolved Source File Location

**Found during:** Task 8 (Copy JoinLandingClient)

**Issue:** The plan specified `app/join-club/JoinLandingClient.tsx` as the source, but that directory exists in the source repo with zero files (empty directory from March 2026). The actual JoinLandingClient lives at `app/join/JoinLandingClient.tsx` and is a more complete version with Apple Cards carousel, real-time stock data, coupon support, and visitor tracking.

**Fix:** Copied from `app/join/JoinLandingClient.tsx` instead. This is the correct file — it's the one that the cultrclub-web `app/page.tsx` imports.

**Files modified:** `app/JoinLandingClient.tsx`

## Known Stubs

- `lib/db.ts` — intentional placeholder. Only exports `DatabaseError` class. Phase 3 will fully rewrite this to use `@neondatabase/serverless` with `fullResults: true`.
- `lib/creators/db.ts` — imports `@vercel/postgres` sql which will fail on Cloudflare. Phase 3 will swap the import.
- `lib/creators/commission.ts` — imports `db` from `@vercel/postgres`. Phase 3 will swap.

## Threat Flags

None. All files copied from internal source repo. No new network endpoints introduced in this plan.

## Self-Check: PASSED

- lib/auth.ts: FOUND, exports createClubVisitorToken + verifyClubVisitorToken only
- lib/db.ts: FOUND, DatabaseError placeholder
- lib/config/join-therapies.ts: FOUND
- lib/creators/attribution.ts: FOUND
- public/cultr-health-logo.png: FOUND
- public/images/products/: 24 PNGs FOUND
- commit 8a03a3a: FOUND in git log
