# Codebase Structure

**Analysis Date:** 2026-03-10

## Directory Layout

```
/Users/davidk/Documents/Dev-Projects/App-Ideas/Cultr\ Health\ Website/
├── app/                          # Next.js 14 App Router (61 page routes, 72 API endpoints)
│   ├── page.tsx                  # Homepage (server component with dynamic imports)
│   ├── layout.tsx                # Root layout (fonts, GA, LayoutShell wrapper)
│   ├── globals.css               # Global styles (reset, Tailwind directives)
│   ├── error.tsx                 # Error boundary
│   ├── not-found.tsx             # 404 page
│   ├── robots.ts                 # SEO robots.txt generator
│   ├── sitemap.ts                # SEO sitemap generator
│   │
│   ├── pricing/page.tsx          # Pricing page
│   ├── quiz/page.tsx + QuizClient.tsx
│   ├── how-it-works/page.tsx     # How It Works
│   ├── faq/page.tsx              # FAQ page
│   ├── community/page.tsx        # Curator.io social feed
│   ├── science/page.tsx + [slug]/page.tsx  # Blog articles
│   ├── legal/ (privacy, terms)
│   │
│   ├── join/                     # Checkout flow (Stripe payment link)
│   │   ├── layout.tsx
│   │   ├── [tier]/page.tsx       # Tier-specific checkout (core, catalyst, concierge, club)
│   │   └── JoinLandingClient.tsx
│   │
│   ├── intake/                   # Medical intake forms
│   │   ├── page.tsx              # Wrapper
│   │   ├── IntakeFormClient.tsx  # Multi-step form controller + context provider
│   │   └── success/page.tsx
│   │
│   ├── library/                  # Members library (tier-gated)
│   │   ├── page.tsx              # Library landing
│   │   ├── layout.tsx            # Library layout
│   │   ├── [category]/page.tsx   # metabolic, repair, growth-factors, bioregulators
│   │   ├── calorie-calculator/
│   │   ├── dosing-calculator/
│   │   ├── peptide-faq/
│   │   ├── cart/                 # Shopping cart
│   │   └── shop/                 # Members shop
│   │
│   ├── login/page.tsx            # Magic link login
│   ├── dashboard/page.tsx        # Member dashboard
│   ├── renewal/                  # Subscription renewal flow
│   ├── track/daily/page.tsx      # Daily tracking
│   │
│   ├── provider/                 # Provider tools (access-controlled)
│   │   └── protocol-builder/     # AI protocol builder
│   │
│   ├── creators/                 # Creator affiliate portal
│   │   ├── page.tsx              # Landing
│   │   ├── login/page.tsx
│   │   ├── apply/page.tsx        # Application form
│   │   ├── pending/page.tsx
│   │   ├── [slug]/page.tsx       # Public creator profiles
│   │   └── portal/               # Authenticated portal
│   │       ├── layout.tsx        # Auth + CreatorContext
│   │       ├── dashboard/page.tsx
│   │       ├── earnings/page.tsx
│   │       ├── network/page.tsx
│   │       ├── payouts/page.tsx
│   │       ├── share/page.tsx
│   │       ├── campaigns/page.tsx
│   │       ├── resources/page.tsx
│   │       ├── settings/page.tsx
│   │       └── support/page.tsx
│   │
│   ├── admin/                    # Admin panel
│   │   ├── page.tsx
│   │   ├── AdminDashboardClient.tsx
│   │   ├── orders/[orderNumber]/fulfill/route.ts
│   │   ├── club-orders/
│   │   │   ├── page.tsx
│   │   │   └── ClubOrdersClient.tsx
│   │   └── creators/
│   │       ├── page.tsx
│   │       ├── approvals/page.tsx
│   │       └── campaigns/page.tsx
│   │
│   └── api/                      # API Routes (72 endpoints)
│       ├── auth/
│       │   ├── magic-link/route.ts
│       │   ├── verify/route.ts
│       │   └── logout/route.ts
│       ├── checkout/
│       │   ├── route.ts          # Stripe payment link redirect
│       │   ├── product/route.ts
│       │   ├── affirm/
│       │   ├── klarna/
│       │   └── authorize-net/
│       ├── webhook/
│       │   ├── stripe/route.ts
│       │   ├── affirm/route.ts
│       │   ├── klarna/route.ts
│       │   └── authorize-net/route.ts
│       ├── creators/
│       │   ├── apply/route.ts
│       │   ├── dashboard/route.ts
│       │   ├── links/route.ts
│       │   ├── codes/route.ts
│       │   ├── earnings/
│       │   └── [many more...]
│       ├── club/
│       │   ├── signup/route.ts
│       │   └── orders/route.ts
│       ├── admin/
│       │   ├── analytics/route.ts
│       │   ├── club-orders/[orderId]/approve/route.ts
│       │   └── creators/[...operations]
│       ├── intake/
│       │   ├── submit/route.ts
│       │   └── upload/route.ts
│       ├── protocol/generate/route.ts  # AI protocol generation
│       ├── r/[slug]/route.ts      # Click tracking redirect
│       ├── cron/                  # Scheduled tasks
│       │   ├── approve-commissions/route.ts
│       │   └── update-tiers/route.ts
│       └── [many more...]
│
├── components/                   # React components (61 files)
│   ├── ui/                       # Reusable UI primitives (6 files)
│   │   ├── Button.tsx            # Variants: primary, secondary, ghost; isLoading state
│   │   ├── Input.tsx
│   │   ├── Aura.tsx              # Decorative gradient blobs
│   │   ├── ScrollReveal.tsx      # Scroll-triggered animations
│   │   ├── SectionWrapper.tsx    # Section layout wrapper
│   │   └── Spinner.tsx
│   │
│   ├── site/                     # Marketing site components (11 files)
│   │   ├── Header.tsx            # Floating navbar (morphs on scroll)
│   │   ├── Footer.tsx
│   │   ├── LayoutShell.tsx       # Wrapper for header/footer
│   │   ├── LayoutShellClient.tsx # Client wrapper (hides chrome on /admin, /creators/portal, /join)
│   │   ├── PricingCard.tsx
│   │   ├── ComparisonTable.tsx
│   │   ├── FAQAccordion.tsx
│   │   ├── NewsletterSignup.tsx
│   │   ├── ClubBanner.tsx
│   │   ├── CommunityFeed.tsx
│   │   └── CTASection.tsx
│   │
│   ├── intake/                   # Intake form components (13 files)
│   │   ├── PersonalInfoForm.tsx
│   │   ├── PhysicalMeasurementsForm.tsx
│   │   ├── CurrentMedicationsForm.tsx
│   │   ├── GLP1HistoryForm.tsx
│   │   ├── TreatmentPreferencesForm.tsx
│   │   ├── [... 8 more form components]
│   │
│   ├── payments/                 # Payment provider components (6 files)
│   │   ├── PaymentMethodSelector.tsx
│   │   ├── AffirmCheckoutButton.tsx
│   │   ├── KlarnaWidget.tsx
│   │   ├── AuthorizeNetForm.tsx
│   │   └── BNPLBadge.tsx
│   │
│   ├── creators/                 # Creator portal components (6 files)
│   │   ├── AnalyticsCharts.tsx   # Recharts visualization
│   │   ├── CreatorHeader.tsx
│   │   ├── CreatorSidebar.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── Milestones.tsx
│   │   └── NotificationBell.tsx
│   │
│   ├── library/                  # Library components (5 files)
│   │   ├── TierGate.tsx          # Access control by plan tier
│   │   ├── CategoryGrid.tsx
│   │   ├── MasterIndex.tsx
│   │   └── [2 more]
│   │
│   ├── dashboard/                # Health dashboard (2 files)
│   │   ├── BiologicalAgeCard.tsx
│   │   └── BiomarkerTrends.tsx
│   │
│   └── sections/                 # Legacy components (9 files, NOT USED)
│
├── lib/                          # Business logic & utilities (49 files)
│   ├── config/                   # Configuration constants (11 files)
│   │   ├── plans.ts              # Membership tiers + Stripe config
│   │   ├── products.ts           # Product definitions
│   │   ├── product-catalog.ts    # Peptide catalog with SKUs & prices
│   │   ├── quiz.ts               # Quiz question/answer config
│   │   ├── affiliate.ts          # Commission tiers, FTC disclosures
│   │   ├── links.ts              # Centralized URL registry
│   │   ├── social-proof.ts       # Testimonials, trust badges
│   │   ├── payments.ts           # Payment provider config
│   │   ├── asher-med.ts
│   │   ├── product-to-asher-mapping.ts
│   │   └── coupons.ts
│   │
│   ├── contexts/                 # React Context providers (2 files)
│   │   ├── intake-form-context.tsx    # Multi-step form state
│   │   └── JoinCartContext.tsx        # Shopping cart state
│   │
│   ├── creators/                 # Affiliate business logic (3 files)
│   │   ├── attribution.ts        # Click tracking, cookie serialization
│   │   ├── commission.ts         # Commission calculation engine
│   │   └── db.ts                 # Creator database operations
│   │
│   ├── payments/                 # Payment provider APIs (4 files)
│   │   ├── affirm-api.ts
│   │   ├── klarna-api.ts
│   │   ├── authorize-net-api.ts
│   │   └── payment-types.ts
│   │
│   ├── invoice/                  # Invoice generation (4 files)
│   │   ├── invoice-generator.tsx
│   │   ├── invoice-template.tsx
│   │   ├── invoice-types.ts
│   │   └── index.ts
│   │
│   ├── lmn/                      # Lab Management Number system (5 files)
│   │   ├── lmn-generator.tsx
│   │   ├── lmn-template.tsx
│   │   ├── lmn-eligibility.ts
│   │   ├── lmn-types.ts
│   │   └── index.ts
│   │
│   ├── db.ts                     # Database connection & queries (Neon PostgreSQL)
│   ├── auth.ts                   # JWT token management, session handling
│   ├── asher-med-api.ts          # Asher Med API client
│   ├── resend.ts                 # Resend email service wrapper
│   ├── quickbooks.ts             # QuickBooks OAuth2 integration
│   ├── library-content.ts        # Load & render markdown library content
│   ├── analytics.ts              # Google Analytics event tracking
│   ├── validation.ts             # Zod schemas for forms & APIs
│   ├── rate-limit.ts             # Upstash Redis rate limiting
│   ├── resilience.ts             # Retry patterns, circuit breaker
│   ├── turnstile.ts              # Cloudflare bot protection
│   ├── utils.ts                  # cn() utility (clsx + tailwind-merge)
│   ├── protocol-templates.ts     # Treatment protocol templates
│   ├── calorie-calculator.ts     # Calorie calculation algorithms
│   ├── peptide-calculator.ts     # Dosage calculator
│   ├── blog-content.ts           # Blog post loading (gray-matter)
│   ├── data-normalization.ts     # Data transformation utilities
│   ├── cart-context.tsx          # Shopping cart React Context
│   └── stores/                   # Empty directory
│
├── middleware.ts                 # Edge middleware (rewrites join.cultrhealth.com → /join)
├── migrations/                   # Database migrations (SQL) (11 files)
│   ├── 001_init.sql
│   ├── 002_orders_table.sql
│   ├── 003_lmn_table.sql
│   ├── [...more migrations]
│   └── 012_drop_healthie_columns.sql
│
├── content/                      # Markdown content (gray-matter frontmatter)
│   ├── blog/                     # Science/blog articles (12 posts)
│   │   ├── biomarker-basics.md
│   │   ├── glp1-beyond-weight-loss.md
│   │   └── [10 more]
│   └── library/                  # Peptide library content (6 files)
│       ├── metabolic.md
│       ├── repair-recovery.md
│       └── [4 more]
│
├── public/                       # Static assets
│   ├── images/                   # Hero & lifestyle images (14+ files)
│   │   ├── hero-cultr-diverse-women.png
│   │   ├── lifestyle-man-smiling.webp
│   │   └── [12 more]
│   ├── creators/brand-kit/       # Creator brand assets
│   │   ├── cultr-logo-dark.svg
│   │   ├── cultr-logo-white.svg
│   │   └── cultr-brand-colors.json
│   ├── cultr-logo-*.svg
│   ├── robots.txt
│   └── llms.txt
│
├── tests/                        # Test suite (Vitest + React Testing Library)
│   ├── setup.ts                  # Test setup (mocks, globals)
│   ├── api/
│   │   └── protocol-generate.test.ts
│   ├── components/
│   │   └── TierGate.test.tsx
│   ├── lib/
│   │   ├── auth.test.ts
│   │   ├── plans.test.ts
│   │   └── protocol-templates.test.ts
│   └── integration/
│       └── protocol-engine.test.ts
│
├── scripts/                      # Utility scripts
│   └── run-migration.mjs         # Database migration runner
│
├── .planning/                    # GSD planning documents
│   └── codebase/                 # Codebase analysis (this directory)
│       ├── ARCHITECTURE.md
│       └── STRUCTURE.md
│
├── .env.example                  # Environment variable template
├── .vercelignore                 # Vercel build exclusions (fixed: includes images)
├── .eslintrc.json                # ESLint configuration
├── .prettierrc                   # Prettier config (2 spaces)
├── tsconfig.json                 # TypeScript config (strict: false, allowJs: true)
├── next.config.js                # Next.js configuration (caching headers, redirects)
├── package.json                  # Dependencies + scripts
├── package-lock.json             # Dependency lock file
├── vitest.config.js              # Vitest test runner config
├── postcss.config.js             # PostCSS (Tailwind, autoprefixer)
├── tailwind.config.ts            # Tailwind CSS config (brand colors)
└── README.md                     # Project documentation
```

## Directory Purposes

**`app/`** — Next.js App Router pages and API routes. Pages are server components by default; interactive sections extracted to `*Client.tsx` files. API routes implement REST endpoints with middleware (auth, rate limiting). Total: 61 page routes, 72 API endpoints.

**`components/`** — React components organized by domain. UI primitives in `ui/`, marketing site components in `site/`, form components in `intake/`, portal-specific components in `creators/`, etc. All components use Tailwind CSS (no CSS modules). Button component manually manages variants (not CVA).

**`lib/`** — Business logic, utilities, and configuration. Core subdirectories: `config/` (constants), `creators/` (affiliate logic), `contexts/` (React Context providers), `payments/` (payment provider APIs), `invoice/` and `lmn/` (document generation). Utilities include database client, auth, external API wrappers.

**`migrations/`** — SQL database migration files. Run sequentially via `scripts/run-migration.mjs`. 11 migrations total, latest: `012_drop_healthie_columns.sql` (removes Healthie integration columns). Migrations use raw SQL on Neon PostgreSQL.

**`content/`** — Markdown files with gray-matter frontmatter. Blog posts in `blog/`, library content in `library/`. Loaded at runtime via `gray-matter` + `marked` + `DOMPurify`. Not compiled into bundle.

**`public/`** — Static assets served at root. Images in `images/` (optimized by Next.js Image component), SVGs in root and `creators/brand-kit/`. Robots.txt and sitemaps generated dynamically in `app/robots.ts` and `app/sitemap.ts`.

**`tests/`** — Vitest test suite with React Testing Library. Test files co-located with source (no separate `__tests__` directory). 8 test files covering auth, components, library content, protocol templates, API endpoints.

**`scripts/`** — Utility scripts. `run-migration.mjs` executes SQL migrations sequentially on Neon PostgreSQL.

**`.planning/codebase/`** — GSD codebase mapping documents (ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, STACK.md, INTEGRATIONS.md, CONCERNS.md). Used by planner/executor to navigate and understand codebase.

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout (fonts, GA, LayoutShell wrapper)
- `app/page.tsx`: Homepage (all sections inline, dynamic imports for below-fold)
- `middleware.ts`: Edge middleware (rewrites `join.cultrhealth.com` → `/join`)

**Configuration:**
- `lib/config/plans.ts`: Membership tiers, Stripe product/price IDs
- `lib/config/affiliate.ts`: Commission rates, tiers, FTC disclosures
- `lib/config/social-proof.ts`: Testimonials, trust badges, providers
- `lib/config/products.ts`: Product definitions, peptide catalog

**Core Logic:**
- `lib/db.ts`: PostgreSQL client, query builders, table creation
- `lib/auth.ts`: JWT token management, session handling, magic link flows
- `lib/asher-med-api.ts`: Asher Med API client (patients, orders, uploads)
- `lib/creators/commission.ts`: Commission calculation engine
- `lib/creators/attribution.ts`: Click tracking and attribution logic

**Checkout & Payments:**
- `app/api/checkout/route.ts`: Stripe payment link redirect
- `app/api/webhook/stripe/route.ts`: Stripe webhook handler (subscriptions, payments)
- `app/api/checkout/affirm/`, `klarna/`, `authorize-net/`: BNPL provider APIs

**Intake Forms:**
- `app/intake/IntakeFormClient.tsx`: Multi-step form controller + state
- `lib/contexts/intake-form-context.tsx`: Form state provider
- `components/intake/`: Form step components (13 files)

**Creators Portal:**
- `app/creators/portal/layout.tsx`: Portal layout with CreatorContext
- `lib/creators/db.ts`: Creator database operations
- `components/creators/`: Portal components (analytics, sidebar, etc.)

**Admin:**
- `app/admin/page.tsx`: Admin dashboard
- `app/api/admin/`: Admin API routes (approvals, payouts, analytics)

**Library & Content:**
- `app/library/page.tsx`: Library landing
- `lib/library-content.ts`: Markdown loading and rendering
- `components/library/TierGate.tsx`: Tier-based access control
- `content/library/`: Markdown library content

## Naming Conventions

**Files:**
- Pages: `page.tsx` (Next.js convention)
- Client components: `*Client.tsx` (e.g., `QuizClient.tsx`, `IntakeFormClient.tsx`)
- API routes: `route.ts` (Next.js convention)
- Layout wrappers: `layout.tsx`
- Components: PascalCase (e.g., `Button.tsx`, `Header.tsx`, `PricingCard.tsx`)
- Context providers: `*Context.tsx` (e.g., `intake-form-context.tsx`)
- Utilities/services: camelCase (e.g., `auth.ts`, `asher-med-api.ts`, `rate-limit.ts`)
- Styles: Tailwind utilities only (no CSS files except `globals.css`)
- Tests: `*.test.ts` or `*.test.tsx`

**Directories:**
- Feature directories: kebab-case if multi-word (e.g., `intake-forms/`, `club-orders/`)
- Component categories: plural nouns (e.g., `components/`, `lib/creators/`, `lib/payments/`)
- API groupings: domain-based (e.g., `/api/checkout/`, `/api/creators/`, `/api/webhook/`)

## Where to Add New Code

**New Feature Endpoint:**
- Implementation: `app/api/[domain]/[resource]/route.ts` (follow domain grouping pattern)
- Types: Add interface to appropriate file in `lib/config/` or create new `lib/[domain]/types.ts`
- Database: Add query functions to `lib/db.ts` or `lib/[domain]/db.ts`
- Tests: Create `tests/api/[feature].test.ts`

**New Component/Module:**
- Component: `components/[category]/ComponentName.tsx` (PascalCase)
- If client-only: add `'use client'` directive at top
- Styles: Use Tailwind utilities in `className` prop
- Exports: Named export, import in pages/other components with path alias `@/components/[...]`

**New Page/Route:**
- Page: `app/[feature]/page.tsx` (wraps optional `*Client.tsx` for interactivity)
- Layout: `app/[feature]/layout.tsx` (shared UI for route group)
- Metadata: Add `export const metadata` in server component if SEO needed
- Protected routes: Check session token at top of page or in middleware

**New Library/Utility:**
- Pure logic: `lib/[domain]/utility.ts` (e.g., `lib/creators/commission.ts`)
- Database operations: `lib/[domain]/db.ts` (e.g., `lib/db.ts` for users, `lib/creators/db.ts` for creators)
- API clients: `lib/[service]-api.ts` (e.g., `lib/asher-med-api.ts`)
- Contexts: `lib/contexts/[feature]-context.tsx`
- Types: Inline in file or separate `types.ts` file

**New Configuration:**
- Constants: `lib/config/[domain].ts` (e.g., `lib/config/plans.ts`, `lib/config/affiliate.ts`)
- Import: Re-export from files to consolidate (e.g., `lib/config/plans.ts` exports `PLANS`)

**Testing:**
- Co-located: Tests live in `tests/` directory, mirroring source structure
- File pattern: `[feature].test.ts` or `[component].test.tsx`
- Setup: Use `tests/setup.ts` for mocks and global configuration

## Special Directories

**`_archive/`** — Archived/legacy code not in use. Safe to delete.

**`lib/stores/`** — Empty directory, no files. Intended for future state management (Zustand, Jotai) but currently using React Context only.

**`components/sections/`** — 9 legacy components (Hero, Services, About, HowItWorks, Results, Pricing, Testimonials, FAQ, Waitlist). NOT IMPORTED anywhere. Homepage builds sections inline in `app/page.tsx`. Safe to delete.

**`migrations/`** — Database migration files must be run sequentially in order. Each migration creates or alters tables. Production: run migrations AFTER deploying code. Development: run via `node scripts/run-migration.mjs` when pulling schema changes.

**`content/`** — NOT committed as compiled/bundled assets. Markdown files loaded at runtime by `lib/library-content.ts` and `lib/blog-content.ts`. Allows updating content without redeploying if served from external source.

---

*Structure analysis: 2026-03-10*
