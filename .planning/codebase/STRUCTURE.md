# Codebase Structure

**Analysis Date:** 2026-05-15

## Repository Note

This repo (`Cultr Health Website`) is the legacy Vercel-era staging/workbench. Active production code lives in sibling repos:
- `cultrhealth-web` (branch `main`) → cultrhealth.com (Cloudflare Pages)
- `cultrclub-web` (branch `main`) → cultrclub.com (Cloudflare Pages)

Port active changes to those repos. Do not treat this repo as the production source.

## Directory Layout

```
project-root/
├── app/                    # Next.js 14 App Router (pages + API routes)
│   ├── api/                # 72+ API route handlers
│   ├── admin/              # Admin panel
│   ├── creators/           # Creator program + portal
│   ├── intake/             # Medical intake forms
│   ├── join/               # Checkout flow
│   ├── join-club/          # Legacy Club landing (active: cultrclub-web)
│   ├── members/            # Member library, shop, tools
│   ├── portal/             # Member portal
│   ├── pricing/            # Pricing page
│   ├── quiz/               # Recommendation quiz
│   ├── tools/              # Public tools (dosing calculator, etc.)
│   ├── layout.tsx          # Root layout (fonts, GA, LayoutShell)
│   ├── page.tsx            # Homepage (all sections inline)
│   └── globals.css         # Global styles
│
├── components/             # React components organized by domain
│   ├── ui/                 # Primitive UI components (Button, Input, etc.)
│   ├── site/               # Marketing site chrome (Header, Footer, etc.)
│   ├── compliance/         # HIPAA/legal compliance components
│   ├── payments/           # Payment provider components
│   ├── intake/             # Medical intake form steps
│   ├── library/            # Member library components
│   ├── creators/           # Creator portal UI
│   ├── portal/             # Member portal UI
│   ├── dashboard/          # Health dashboard widgets
│   ├── admin/              # Admin panel components
│   ├── referral/           # Member referral program
│   ├── dosing-calculator/  # Shared dosing calculator
│   └── sections/           # LEGACY — not imported anywhere (unused)
│
├── lib/                    # Business logic and utilities
│   ├── config/             # All domain constants and configuration
│   ├── contexts/           # React Context providers
│   ├── creators/           # Creator affiliate logic (commission, attribution, db)
│   ├── payments/           # Payment provider API adapters
│   ├── invoice/            # Invoice PDF generation
│   ├── lmn/                # Lab Management Number system
│   ├── siphox/             # SiPhox lab results integration
│   ├── healthie/           # Healthie EHR integration (audit-ready)
│   ├── dosing-engine/      # Dosing rules engine
│   ├── utils/              # Sub-utilities directory
│   ├── auth.ts             # JWT auth (magic link + session)
│   ├── db.ts               # Neon PostgreSQL query functions
│   ├── portal-auth.ts      # Creator portal auth (separate JWT flow)
│   ├── portal-db.ts        # Creator portal DB queries
│   ├── portal-orders.ts    # Club/portal order logic
│   ├── validation.ts       # Zod validation schemas
│   ├── rate-limit.ts       # API rate limiting
│   ├── resilience.ts       # Retry + circuit breaker for external APIs
│   ├── resend.ts           # Resend email service wrapper
│   ├── quickbooks.ts       # QuickBooks OAuth2 integration
│   ├── analytics.ts        # GA event tracking helpers
│   ├── hipaa-logger.ts     # HIPAA-safe server logging
│   ├── admin-club-orders.ts # PIPELINE_ORDER, PIPELINE_STATUSES (canonical)
│   ├── admin-types.ts      # Admin shared types
│   ├── cart-context.tsx    # Shopping cart React context
│   └── utils.ts            # cn() helper (clsx + tailwind-merge)
│
├── migrations/             # SQL migration files (66+ files)
├── content/                # Markdown content
│   └── library/            # Peptide library articles (6 .md files)
├── tests/                  # Vitest test suite
│   ├── api/                # API route tests
│   ├── components/         # Component tests
│   ├── integration/        # Integration tests
│   └── lib/                # Library unit tests
├── public/                 # Static assets
│   ├── images/             # Hero + lifestyle images
│   └── creators/brand-kit/ # Creator brand assets
├── scripts/                # One-off scripts
│   └── run-migration.mjs   # Database migration runner
├── .claude/                # Claude Code configuration
│   ├── commands/           # Slash commands (/pre-deploy)
│   └── hooks/              # PostToolUse hooks (tests, type-check, audit)
├── .agents/skills/         # Marketing + growth agent skills
├── .planning/              # GSD planning workspace
│   └── codebase/           # Codebase map documents (this directory)
├── .ralph/                 # Ralph autonomous dev loop state
├── next.config.js          # Next.js configuration
├── tailwind.config.ts      # Tailwind + design tokens
├── tsconfig.json           # TypeScript config (strict: false, allowJs: true)
├── vitest.config.js        # Vitest test configuration
├── package.json            # Dependencies
└── CLAUDE.md               # Project instructions for Claude Code
```

## Directory Purposes

**`app/`:**
- Purpose: All Next.js App Router pages, layouts, and API routes
- Key pattern: Pages are Server Components by default; interactive parts are `*Client.tsx` siblings
- Entry: `app/layout.tsx` (root), `app/page.tsx` (homepage)

**`app/api/`:**
- Purpose: All HTTP API endpoints (72+ routes)
- Organization: By domain — `auth/`, `checkout/`, `creators/`, `admin/`, `club/`, `member/`, `webhook/`, `cron/`
- Pattern: Each subdomain has a `route.ts` with named `GET`/`POST` exports

**`components/ui/`:**
- Purpose: Reusable primitive components
- Key files: `Button.tsx` (variants: primary/secondary/ghost, all `rounded-full`, has `isLoading`), `Input.tsx`, `ScrollReveal.tsx`, `Aura.tsx`, `SectionWrapper.tsx`, `Spinner.tsx`
- Note: Uses `cn()` + manual variant objects. `class-variance-authority` is installed but NOT used.

**`components/site/`:**
- Purpose: Marketing site chrome and shared marketing components
- Key files: `Header.tsx` (floating pill navbar), `Footer.tsx`, `LayoutShell.tsx` (conditional chrome), `PricingCard.tsx`, `ClubBanner.tsx`, `TrustMarquee.tsx`, `VisitorTracker.tsx`

**`components/compliance/`:**
- Purpose: HIPAA/LegitScript compliance UI
- Key files: `ConsentModal.tsx` (scroll-gated checkout consent), `FDAStatusBadge.tsx`, `PrescriptionDisclaimer.tsx`, `TestimonialDisclaimer.tsx`, `DispensingPharmacyInfo.tsx`

**`components/sections/` (LEGACY — DO NOT USE):**
- Purpose: Legacy page sections — Hero, Services, About, HowItWorks, Results, Pricing, Testimonials, FAQ, Waitlist
- Status: Not imported anywhere. Homepage builds all sections inline in `app/page.tsx`.
- Action: Do not add new code here. Create in `components/site/` instead.

**`lib/config/`:**
- Purpose: All domain constants — single source of truth for rates, IDs, catalog, copy
- Key files: `plans.ts` (membership tiers + Stripe IDs), `affiliate.ts` (commission rates + tier thresholds), `social-proof.ts` (testimonials, trust badges), `payments.ts` (payment provider config), `product-catalog.ts` (peptide SKUs + prices), `plans.ts` (tier access rules)
- Rule: Never inline config values in pages or API routes — always import from here

**`lib/creators/`:**
- Purpose: Creator affiliate system business logic
- Files: `commission.ts` (direct/override commission math), `attribution.ts` (cookie tracking), `db.ts` (all creator DB queries)

**`migrations/`:**
- Purpose: SQL migration files run via `node scripts/run-migration.mjs`
- Status: 66+ files; naming convention is numeric prefix (001-066) then descriptive slug
- Note: Run manually — no auto-migration on deploy

**`tests/`:**
- Purpose: Vitest test suite
- Organization: Mirrors source structure (`api/`, `components/`, `integration/`, `lib/`)
- Config: `vitest.config.js` — jsdom env, `@/` alias to project root, coverage via V8

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout — fonts, GA script, LayoutShell, VisitorTracker
- `app/page.tsx`: Homepage — all sections inline, `next/dynamic` for below-fold components
- `app/creators/portal/layout.tsx`: Creator portal layout — auth check, CreatorContext, sidebar/header
- `app/join/[tier]/page.tsx`: Checkout flow — ConsentModal, payment providers
- `app/intake/IntakeFormClient.tsx`: Multi-step medical intake form controller

**Configuration:**
- `lib/config/plans.ts`: Membership tiers (club/core/catalyst/concierge), Stripe IDs, library access
- `lib/config/affiliate.ts`: Commission rates, tier thresholds, FTC disclosures
- `lib/config/social-proof.ts`: TESTIMONIALS, PROVIDERS, TRUST_METRICS, TRUST_BADGES
- `lib/config/links.ts`: Centralized URL registry — social, internal routes, external services
- `lib/config/owner-emails.ts`: Owner email list — filtered out of admin aggregates
- `tailwind.config.ts`: Brand design tokens (forest, cream, sage, mint, aura-*)

**Core Logic:**
- `lib/auth.ts`: All JWT operations — `createMagicLinkToken`, `verifyMagicLinkToken`, `createSessionToken`, `getSession`, `requireAuth`, `requireAdmin`
- `lib/db.ts`: All core PostgreSQL queries — memberships, orders, waitlist, intake forms
- `lib/creators/commission.ts`: `processOrderAttribution`, `recordCommissionsForShippedOrder`, `reverseCommissionsForAttribution`
- `lib/creators/attribution.ts`: `resolveAttribution` — reads `cultr_attribution` cookie
- `lib/admin-club-orders.ts`: `PIPELINE_ORDER`, `PIPELINE_STATUSES` — canonical club order lifecycle
- `lib/validation.ts`: Zod schemas for API input validation
- `lib/resilience.ts`: `withRetry`, circuit breaker for Asher Med and other external APIs

**Testing:**
- `tests/setup.ts`: Vitest + React Testing Library setup
- `vitest.config.js`: Test runner config
- `tests/lib/auth.test.ts`: Auth utility tests
- `tests/lib/plans.test.ts`: Plan config tests
- `tests/components/TierGate.test.tsx`: Tier gate component tests
- `tests/integration/protocol-engine.test.ts`: Protocol engine integration test

## Naming Conventions

**Files:**
- Page components: `page.tsx` (App Router convention)
- Interactive client components: `*Client.tsx` (e.g., `QuizClient.tsx`, `IntakeFormClient.tsx`)
- Route handlers: `route.ts`
- Layout files: `layout.tsx`
- Configuration: camelCase descriptive (e.g., `social-proof.ts`, `product-catalog.ts`)
- Database migrations: `NNN_descriptive_name.sql` (numeric prefix)

**Components:**
- PascalCase (`Button`, `ConsentModal`, `TrustMarquee`)
- Feature prefix for portal components (`CreatorHeader`, `CreatorSidebar`)

**Exported constants:**
- UPPER_SNAKE_CASE for config objects (`PLANS`, `COMMISSION_CONFIG`, `TRUST_BADGES`, `PIPELINE_ORDER`)
- PascalCase for types and interfaces (`Plan`, `PlanTier`, `LibraryAccess`)

## Where to Add New Code

**New marketing page:**
- Page: `app/[route]/page.tsx` (Server Component)
- Interactive parts: `app/[route]/[Name]Client.tsx`
- Shared UI: `components/site/[ComponentName].tsx`

**New API endpoint:**
- Route handler: `app/api/[domain]/[action]/route.ts`
- Business logic: `lib/[domain].ts` or `lib/[domain]/[module].ts`
- Input validation: add Zod schema to `lib/validation.ts`

**New member portal feature:**
- Page: `app/members/[feature]/page.tsx`
- Components: `components/library/[FeatureName].tsx` or `components/portal/[FeatureName].tsx`

**New creator portal feature:**
- Page: `app/creators/portal/[feature]/page.tsx` (within portal layout for auth)
- API: `app/api/creators/[feature]/route.ts`
- Components: `components/creators/[FeatureName].tsx`

**New admin feature:**
- Page: `app/admin/[feature]/page.tsx` with client: `app/admin/[feature]/[Name]Client.tsx`
- API: `app/api/admin/[feature]/route.ts`

**New domain config:**
- Add to `lib/config/[domain].ts` — never hardcode in pages or API routes

**New database table:**
- Add migration: `migrations/NNN_descriptive_name.sql`
- Add query functions: `lib/db.ts` (core) or `lib/creators/db.ts` (creator domain)
- Add TypeScript interface next to query functions

**New UI primitive:**
- Add to `components/ui/[ComponentName].tsx`
- Use `cn()` from `lib/utils.ts` for class merging
- Follow Button.tsx pattern: manual variant objects, not CVA

**New test:**
- Unit test for lib function: `tests/lib/[filename].test.ts`
- Component test: `tests/components/[ComponentName].test.tsx`
- Integration test: `tests/integration/[feature].test.ts`
- API route test: `tests/api/[route].test.ts`

## Special Directories

**`.claude/`:**
- Purpose: Claude Code configuration — slash commands, PostToolUse hooks
- Generated: No
- Committed: Yes
- Key: Hooks in `.claude/hooks/` run after every `.ts`/`.tsx` edit (tests, type-check, audit)

**`.agents/skills/`:**
- Purpose: Marketing and growth agent skill definitions (CRO, copywriting, SEO, email, ads)
- Generated: No
- Committed: Yes

**`.planning/`:**
- Purpose: GSD planning workspace — phase plans, codebase maps
- Generated: By GSD commands
- Committed: Yes

**`.ralph/`:**
- Purpose: Ralph autonomous dev loop state files, logs, circuit breaker state
- Generated: By Ralph
- Committed: Yes (state files), logs may be gitignored

**`public/images/`:**
- Purpose: Hero and lifestyle images served statically
- Note: All images should have explicit `width` and `height`. Use `loading="eager"` + `fetchpriority="high"` for hero only; `loading="lazy"` for below-fold.

**`migrations/`:**
- Purpose: SQL migrations run manually
- Generated: No
- Committed: Yes
- Run: `node scripts/run-migration.mjs`

---

*Structure analysis: 2026-05-15*
