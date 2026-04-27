# CULTR Health Website

HIPAA-compliant telehealth platform for GLP-1 weight loss medications, wellness peptides, and longevity optimization. Includes a full e-commerce club (join.cultrhealth.com), creator affiliate portal, member portal, and admin panel.

---

## Overview

CULTR Health connects members with physician-supervised GLP-1 and peptide therapies through a seamless digital experience. The platform handles:

- **Membership subscriptions** via Stripe (Core, Catalyst+, Concierge)
- **Free CULTR Club** at join.cultrhealth.com — product orders without a subscription
- **Medical intake forms** with ID upload and consent capture
- **Member portal** — dashboard, labs, documents, stacking guides
- **Creator affiliate system** with click tracking, coupon codes, and tiered commissions
- **Admin panel** — orders, club orders, creators, customers, analytics, inventory

---

## Features

- Marketing site: homepage, pricing, how-it-works, FAQ, quiz, community, therapies, tools
- CULTR Club e-commerce (join.cultrhealth.com) — free club membership with product orders
- Membership tiers: Club ($0), Core ($199/mo), Catalyst+ ($499/mo), Concierge ($1,099/mo)
- Member portal (`/portal`) — dashboard, SiPhox labs integration, documents, stacking guides
- Medical intake forms with ID upload (presigned S3 URLs)
- Creator affiliate portal (`/creators/portal`) — links, coupon codes, commissions, payouts, campaigns
- Admin panel (`/admin`) — orders, club orders, creator management, customers, analytics, inventory
- AI-powered protocol builder and meal plans (AI SDK v6)
- Peptide dosing calculator with syringe visualization
- Calorie calculator
- QuickBooks Online integration for invoicing
- BNPL checkout: Affirm, Klarna, Authorize.net

---

## Tech Stack

### Frontend
- **Framework:** Next.js ^14.2.0 (App Router)
- **Language:** TypeScript ^5.4.0 (`strict: false`)
- **Styling:** Tailwind CSS ^3.4.3
- **Icons:** Lucide React ^0.563.0
- **State:** React Context API (CreatorContext, IntakeFormContext, CartContext)
- **Forms:** Native React state + Zod ^3.23.0 validation
- **PDF:** @react-pdf/renderer ^4.3.2

### Backend
- **Database:** Neon PostgreSQL via @vercel/postgres ^0.10.0 (raw SQL, no ORM)
- **Auth:** JWT via `jose` ^6.1.3 (magic link flow)
- **Email:** Resend ^4.0.0
- **Payments:** Stripe ^20.2.0 + Affirm + Klarna + Authorize.net
- **Bot protection:** Cloudflare Turnstile
- **AI:** AI SDK v6 (`@ai-sdk/openai`, `ai`)
- **Invoicing:** QuickBooks Online OAuth2

### Testing & Tooling
- **Tests:** Vitest ^4.0.18 + React Testing Library
- **Linting:** ESLint ^8.57.0 + eslint-config-next
- **Bundle analysis:** @next/bundle-analyzer

---

## Getting Started

### Prerequisites

- Node.js 18+
- Neon PostgreSQL database (or Vercel Postgres)
- Stripe account (test mode for development)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials (see Environment Setup below)

# 3. Run database migrations
node scripts/run-migration.mjs

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Setup

### Required

```env
# Database
POSTGRES_URL=postgres://...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Auth
JWT_SECRET=                        # openssl rand -base64 32
SESSION_SECRET=                    # openssl rand -base64 32

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Optional

```env
# Email
RESEND_API_KEY=re_...
FROM_EMAIL=hello@cultrhealth.com
FOUNDER_EMAIL=founder@cultrhealth.com

# Bot protection
TURNSTILE_SECRET_KEY=...

# BNPL (feature-flagged)
NEXT_PUBLIC_ENABLE_KLARNA=false
NEXT_PUBLIC_ENABLE_AFFIRM=false
KLARNA_API_KEY=...
AFFIRM_PRIVATE_API_KEY=...

# QuickBooks
QUICKBOOKS_CLIENT_ID=...
QUICKBOOKS_CLIENT_SECRET=...
QUICKBOOKS_REDIRECT_URI=...

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...

# Caching / rate limiting
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Access control
PROTOCOL_BUILDER_ALLOWED_EMAILS=provider@example.com
STAGING_ACCESS_EMAILS=tester@example.com
```

---

## Project Structure

```
app/                  # Next.js App Router (~45 page routes)
├── admin/            # Admin panel
├── api/              # 72 API route handlers
├── creators/         # Creator affiliate portal + public profiles
├── intake/           # Medical intake forms
├── join/[tier]/      # Checkout flow
├── join-club/        # CULTR Club landing (join.cultrhealth.com)
├── library/          # Member resource library + shop
├── portal/           # Member dashboard
└── ...               # Pricing, quiz, how-it-works, FAQ, legal, etc.

components/           # React components
├── ui/               # Primitives: Button, Input, Aura, ScrollReveal, Spinner
├── site/             # Header, Footer, LayoutShell, PricingCard, etc.
├── creators/         # Creator portal components
├── intake/           # Medical intake form components
├── payments/         # Payment provider components
└── ...

lib/                  # Business logic & utilities
├── config/           # Plans, products, affiliate, coupons, links, etc.
├── creators/         # Attribution, commission engine, creator DB ops
├── invoice/          # Invoice generation
├── payments/         # Affirm, Klarna, Authorize.net API clients
├── db.ts             # Database connection & query utilities
├── auth.ts           # JWT utilities
├── quickbooks.ts     # QuickBooks OAuth2 integration
└── ...

migrations/           # 62+ SQL migration files (run via scripts/run-migration.mjs)
content/library/      # Peptide library markdown content
tests/                # Vitest test suite
scripts/              # run-migration.mjs
```

---

## Development Commands

```bash
npm run dev           # Start dev server (http://localhost:3000)
npm run build         # Production build
npm start             # Start production server (requires build)
npm run lint          # ESLint
npm run analyze       # Bundle size analysis (ANALYZE=true next build)

# Tests
npx vitest run        # Run all tests once
npx vitest --watch    # Watch mode
npx vitest run --coverage

# Database
node scripts/run-migration.mjs   # Run pending SQL migrations
```

---

## Deployment

### Branch Strategy

| Branch | Environment | URL |
|---|---|---|
| `production` | Production | cultrhealth.com + join.cultrhealth.com |
| `staging` | Staging | staging.cultrhealth.com |
| `main` | Base (PRs only) | — |

Vercel auto-deploys on push to `staging` and `production` branches.

`join.cultrhealth.com` is a Vercel domain alias pointing at the `production` deployment.

### Deployment Rules

- **Deploy to production:** push to the `production` branch (via PR or cherry-pick from `staging`)
- **NEVER** run `vercel --prod` from the CLI — it deploys your local working directory to production regardless of branch
- **Run migrations manually** after each deploy: `node scripts/run-migration.mjs`
- **Post-deploy checklist:** see `.claude/commands/pre-deploy.md` (run `/pre-deploy` in Claude Code)

### Promoting staging to production

```bash
# Cherry-pick a specific commit from staging to production
git checkout -B tmp-prod origin/production
git cherry-pick <sha>
git push origin tmp-prod:production
```

---

## AI Tooling

This project is configured for multiple AI coding assistants. When updating conventions, keep all three files in sync.

| File | Purpose |
|---|---|
| `CLAUDE.md` | Claude Code instructions — canonical project rules, architecture, patterns, known bugs |
| `AGENTS.md` | OpenAI Codex CLI instructions |
| `.cursorrules` | Cursor IDE guardrails (23 sections: HIPAA, brand, DB, deploy, security, patterns) |

### Claude Code Slash Commands

- `/pre-deploy` — 12-step pre-deployment checklist (TypeScript, tests, lint, HIPAA scan, secrets, build, env vars, migrations, bundle size)

---

## License

Proprietary — CULTR Health © 2026
