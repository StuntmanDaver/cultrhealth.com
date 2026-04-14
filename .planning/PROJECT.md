# cultrclub-web — Cloudflare Pages Migration

## What This Is

Extract the CULTR Club join experience from `cultrhealth.com` into a standalone Next.js 14 app deployed to **Cloudflare Pages** at `cultrclub.com`. The free CULTR Club tier (landing, signup, product orders, member recognition) gets its own dedicated domain and deployment. Admin dashboard on `cultrhealth.com` (Vercel) stays unchanged — both apps share the same Neon PostgreSQL database.

This is **Phase 1 of 2** in a full Cloudflare migration:
- **Phase 1 (this project):** `cultrclub.com` standalone app
- **Phase 2 (future):** Full `cultrhealth.com` + admin migration to Cloudflare

## Core Value

The CULTR Club experience lives at `cultrclub.com` — its own brand, domain, and deployment — while sharing the same database and admin tooling as `cultrhealth.com`. Zero disruption to existing members or operations during migration.

## Requirements

See: REQUIREMENTS.md

## Architecture

```
cultrclub.com (Cloudflare Pages)          cultrhealth.com (Vercel)
────────────────────────────────          ────────────────────────
  Next.js 14 App Router                    Full app (unchanged)
  Cloudflare Workers runtime               Node.js runtime
  @neondatabase/serverless                 @vercel/postgres
         │                                        │
         └──────────────┬─────────────────────────┘
                        │
                  Neon PostgreSQL
          (club_members, club_orders,
           product_inventory, visitor_events,
           affiliate/creator tables, etc.)
```

## Scope — In

- `app/join-club/` landing + signup modal
- `app/api/club/signup/route.ts` — member signup
- `app/api/club/orders/route.ts` — product orders
- `app/api/club/event/route.ts` — analytics events
- `app/api/club/check-member/route.ts` — returning member check
- `app/api/stock/route.ts` — inventory
- `app/api/health/route.ts` — NEW: health ping
- All supporting lib files, components, hooks, assets

## Scope — Out

- Paid Stripe/CorePay checkout (`app/join/[tier]/page.tsx`) — links to cultrhealth.com/pricing
- Stripe SDK, CorePayForm, PaymentProviderLoader, ConsentModal, corepay-gateway.ts
- compliance.ts, payment-types.ts, plans.ts (not needed on free-club-only app)
- Admin dashboard — stays on cultrhealth.com
- Any routes outside the club/join flow

## New Repo

**Repo name:** `cultrclub-web`
**Location:** `/Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/`
**Runtime:** Cloudflare Workers (via `@cloudflare/next-on-pages`)
**Build:** `npx @cloudflare/next-on-pages@1`
**Database:** `@neondatabase/serverless` with `fullResults: true` (matches @vercel/postgres result shape)

## Key Technical Constraints

- `neon()` MUST use `fullResults: true` — otherwise `.rows` and `.rowCount` break silently
- `nodejs_compat` flag in wrangler.toml resolves ALL crypto/Buffer issues (no code changes needed for attribution.ts, mailchimp.ts, etc.)
- `images.unoptimized: true` in next.config.js — no image optimization server on Cloudflare Pages
- `export const runtime = 'edge'` on all API route files
- `ADMIN_BASE_URL` env var routes approval email links back to `cultrhealth.com`
- Cookie domain: `.cultrclub.com` (not `.cultrhealth.com`)
- All transactions: use `Pool.connect()` pattern (not `db.connect()` from @vercel/postgres)

## Constraints

- **Never touch `join.cultrhealth.com` production** until `staging.join.cultrhealth.com` (on Cloudflare) is fully validated
- Vercel stays live throughout the migration
- Admin dashboard on cultrhealth.com requires no code changes
- Same Neon DB — no schema changes needed

---
*Created: 2026-04-13 — replacing SiPhox integration project*
