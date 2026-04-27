# CULTR Health

## What This Is

A HIPAA-compliant telehealth platform for GLP-1 weight-loss medications, wellness peptides, and longevity optimization, delivered through a tiered membership model and supported by a member-facing affiliate creator program. The product spans two domains — `cultrhealth.com` (paid memberships, intake, provider scheduling, members area, admin dashboard) and `cultrclub.com` (the free CULTR Club tier — education, product orders, member recognition).

## Core Value

> **"Change the CULTR, rebrand yourself."** Patients get licensed-provider access, real lab results, and personalized peptide protocols — without the gatekeeping of traditional clinics or the guesswork of consumer wellness brands.

## Architecture

```
cultrhealth.com (Vercel)              cultrclub.com (Cloudflare Pages)
─────────────────────────             ────────────────────────────────
  Next.js 14 App Router                 Next.js 14 App Router
  Node.js runtime                       Cloudflare Workers runtime
  @vercel/postgres                      @neondatabase/serverless
  Paid memberships, intake,             Free CULTR Club —
  members area, admin                   landing, signup, product orders
            │                                       │
            └──────────────┬────────────────────────┘
                           │
                     Neon PostgreSQL
                  (shared by both apps)
```

## Requirements

### Validated

- ✓ Standalone `cultrclub-web` Next.js 14 app on Cloudflare Pages — v1.0
- ✓ `@vercel/postgres` → `@neondatabase/serverless` with `fullResults: true` shim — v1.0
- ✓ Edge runtime everywhere on cultrclub-web — v1.0
- ✓ `cultrclub.com` production live, sharing Neon DB with cultrhealth.com admin — v1.0
- ✓ `join.cultrhealth.com` retired (NXDOMAIN) — v1.0

### Active (v2.0 — Stripe → CorePay replacement)

- [ ] Replace Stripe with Authorize.Net (CorePay merchant credentials) end-to-end
- [ ] Build `corepay-api`, `healthie-api`, `corpay-crossborder` Claude skills (refresh `siphox-api`)
- [ ] Custom `/portal/billing` self-service portal (cancel / pause / resume / update card)
- [ ] HMAC-SHA512 webhook handler for `net.authorize.*` events
- [ ] CULTR-internal coupon engine (replaces Stripe coupon resolution for FOUNDER15 / FIRSTMONTH / creator codes)
- [ ] Hard cutover migration of existing Stripe subscribers (re-onboarding flow with 30-day window)
- [ ] DB migration: rename `stripe_*` columns to provider-agnostic `provider_*`
- [ ] Sentry observability across CorePay webhooks + checkout

### Active (longer-term, post-v2.0)

- [ ] Provider dashboard (`/app/provider/`) — patient queue, real-time updates via Healthie subscriptions
- [ ] Lab → Calendly / Healthie scheduling auto-route based on provider availability
- [ ] In-members-area telehealth video (Daily.co or Healthie's built-in)
- [ ] Twilio SMS for kit-shipped + results-ready notifications

### Out of Scope

- Mobile native app — web is primary
- Insurance billing — Stripe direct-pay model continues post-CorePay (single-currency, US consumers)
- Corpay Cross-Border integration — captured as a Claude reference skill only; reserved for future creator international payouts
- BNPL providers (Affirm / Klarna / Authorize.Net Direct) — already removed pre-v1.0
- Asher Med integration — already removed (Apr 4 2026)

## Context

### Current state (post-v1.0)

- **cultrhealth.com:** ~400 source files, Next.js 14 + TypeScript (strict: false), Tailwind, Stripe ^20.2.0, Resend, Cloudflare Turnstile, AI SDK v6 for protocol generation. Hosted on Vercel.
- **cultrclub.com:** Standalone Cloudflare Pages app sharing the Neon DB. Cloudflare Workers runtime via `@cloudflare/next-on-pages`.
- **Database:** Neon PostgreSQL (60 migrations through 060). Shared by both apps + admin.
- **Integrations live:** Stripe (subscription billing), SiPhox (blood-test kits — known auth-header bug pending fix), Calendly (scheduling, single-link), Resend (email), QuickBooks (invoicing), Mailchimp (audience tagging).
- **Integrations gated:** Healthie EHR (waiting on Plus-plan API key), Corpay Cross-Border (reference only).

### User feedback themes

- Members want clearer kit-status visibility — `/portal/labs` exists but isn't surfaced from the member dashboard.
- Provider notifications for new signups / completed intakes are missing — only Calendly bookings notify the team.

### Known technical debt

- SiPhox client uses `Bearer` instead of `Token` auth header (`lib/siphox/client.ts:80`) — silent 401s on every call.
- Patient identity fragmented across 5 ID spaces (no unified `patients` table).
- Migration `029_telehealth_consultations.sql` created tables that no current code references (Cal.com / Daily.co code was removed).
- Three orphan phase directories (`01-foundation`, `02-checkout-integration`, `03-kit-registration`) under `.planning/phases/` predate v1.0 and were never folded into a roadmap. Candidates for `/gsd-cleanup`.

## Key Decisions

| Decision | Milestone | Outcome |
|---|---|---|
| Standalone `cultrclub-web` repo at `~/Dev-Projects/App-Ideas/cultrclub-web/` | v1.0 | ✓ Good — clean separation enabled fast Cloudflare iteration without risking cultrhealth.com |
| `@neondatabase/serverless` with `fullResults: true` | v1.0 | ✓ Good — preserved call-site shape, zero downstream changes |
| `nodejs_compat` flag in wrangler.toml | v1.0 | ✓ Good — resolved all crypto/Buffer issues without code changes |
| `images.unoptimized: true` for Cloudflare Pages | v1.0 | ✓ Good — required for CF Pages, no observable user-facing impact |
| `ADMIN_BASE_URL` env var routes approval emails to cultrhealth.com | v1.0 | ✓ Good — kept admin on Vercel, free tier on Cloudflare |
| Excluded paid checkout from cultrclub-web | v1.0 | ✓ Good — kept the cutover scope small; paid upgrades link to cultrhealth.com/pricing |
| `join.cultrhealth.com` retired (NXDOMAIN, not 301) | v1.0 | ✓ Good — eliminated stale-traffic maintenance |
| Vercel domain alias removal via API (not dashboard) | v1.0 | ⚠️ Lesson — dashboard removal silently re-attaches on next deploy. Always use API. |
| Replace Stripe with Authorize.Net (CorePay) — full strip-and-replace | v2.0 | — Pending |
| Hard cutover for existing Stripe subscribers (re-onboarding flow) | v2.0 | — Pending; ~50% churn risk accepted |

## Constraints

- **HIPAA compliance:** No PHI in logs or error messages. Patient data lives in Neon + Healthie EHR (when enabled). All file uploads via presigned S3 URLs.
- **Cloudflare Pages limits:** ~3 MiB bundle size, no Node.js native APIs except via `nodejs_compat` flag.
- **Florida-only jurisdiction (telehealth):** Services available in 30 U.S. states; medications shippable to all states except California.
- **PCI scope:** Card data tokenized client-side via Stripe.js (today) / Accept.js (post-v2.0). Server never touches PAN.
- **Brand typography:** CULTR / CULTR HEALTH always Playfair Display; slogan "rebrand" lowercase italic.

---
*Last updated: 2026-04-27 after v1.0 milestone close*
*Previous milestone scope archived in `.planning/milestones/v1.0-ROADMAP.md`*
