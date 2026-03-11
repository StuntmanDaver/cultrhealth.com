# Codebase Structure

**Analysis Date:** 2026-03-11

## Directory Layout

```
project-root/
├── app/                          # Next.js 14 App Router (pages + API routes)
│   ├── page.tsx                  # Homepage (server component, inline sections)
│   ├── layout.tsx                # Root layout (fonts, GA, LayoutShell)
│   ├── globals.css               # Global Tailwind base styles
│   ├── error.tsx                 # Error boundary
│   ├── not-found.tsx             # 404 page
│   ├── robots.ts                 # Dynamic robots.txt
│   ├── sitemap.ts                # Dynamic sitemap
│   │
│   ├── (marketing pages)
│   ├── pricing/                  # Pricing page
│   ├── how-it-works/             # How It Works
│   ├── faq/                      # FAQ
│   ├── quiz/                     # Recommendation quiz
│   ├── science/                  # Blog / Science library
│   ├── community/                # Curator.io social feed
│   ├── therapies/                # Therapies overview
│   ├── tools/                    # Health tools
│   ├── legal/                    # Privacy, Terms, Medical Disclaimer
│   │
│   ├── (authenticated member pages)
│   ├── login/                    # Magic-link login
│   ├── dashboard/                # Member dashboard
│   ├── intake/                   # Multi-step medical intake form
│   ├── library/                  # Peptide library + member shop
│   ├── renewal/                  # Subscription renewal flow
│   ├── track/                    # Daily tracking
│   ├── success/                  # Post-checkout success
│   │
│   ├── (checkout)
│   ├── join/[tier]/              # Tier-specific checkout (club/core/catalyst/concierge)
│   ├── join-club/                # CULTR Club landing (join.cultrhealth.com alias)
│   │
│   ├── (portal — phone OTP auth)
│   ├── portal/login/             # Phone OTP login
│   ├── portal/dashboard/         # Patient portal dashboard
│   │
│   ├── (creator affiliate)
│   ├── creators/                 # Creator program landing
│   ├── creators/apply/           # Creator application
│   ├── creators/login/           # Creator login
│   ├── creators/[slug]/          # Public creator profile
│   ├── creators/portal/          # Authenticated creator dashboard (8 sub-pages)
│   │
│   ├── (admin)
│   ├── admin/                    # Admin dashboard
│   ├── admin/club-orders/        # Club order management
│   ├── admin/creators/           # Creator management + approvals
│   ├── admin/intakes/            # Intake form viewer
│   │
│   ├── (provider)
│   ├── provider/protocol-builder/ # AI-powered protocol builder
│   │
│   ├── (redirect/tracking)
│   ├── r/[slug]/                 # Affiliate click tracking redirect
│   ├── products/                 # Redirects → /pricing (301 in next.config.js)
│   │
│   └── api/                      # API routes (80+ endpoints)
│       ├── auth/                 # Magic-link auth (magic-link, verify, logout)
│       ├── portal/               # Phone OTP auth (send-otp, verify-otp, refresh, logout)
│       ├── checkout/             # Stripe + BNPL checkout (route, product, affirm, klarna, authorize-net)
│       ├── stripe/checkout/      # Stripe-specific checkout endpoint
│       ├── webhook/              # Webhook handlers (stripe, affirm, klarna, authorize-net, quickbooks)
│       ├── creators/             # Creator portal API (apply, profile, dashboard, links, codes, earnings, network, payouts, support)
│       ├── admin/                # Admin API (analytics, club-orders, creators, intakes, orders)
│       ├── club/                 # CULTR Club (signup, orders, validate-coupon, login)
│       ├── intake/               # Intake form (questions, submit, upload)
│       ├── member/               # Member API (profile, orders, files, medical-records, transactions, consult-*)
│       ├── portal/               # Portal session API
│       ├── lmn/                  # Lab Management Numbers (list, generate, [lmnNumber])
│       ├── protocol/generate/    # AI protocol generation
│       ├── meal-plan/            # AI meal plans
│       ├── quote/                # Product quote generation
│       ├── renewal/              # Subscription renewal (check, submit)
│       ├── track/                # Click tracking + daily tracking
│       ├── quickbooks/           # QuickBooks OAuth (auth, callback)
│       ├── supplement-order/     # Supplement order endpoint
│       ├── cron/                 # Scheduled jobs (approve-commissions, update-tiers)
│       └── waitlist/             # Waitlist signup
│
├── components/
│   ├── ui/                       # Reusable primitives (6 files)
│   ├── site/                     # Marketing site chrome (11 files)
│   ├── intake/                   # Intake form steps (14 files)
│   ├── creators/                 # Creator portal components (6 files)
│   ├── library/                  # Member library components (5 files)
│   ├── payments/                 # Payment provider UIs (6 files)
│   ├── dashboard/                # Health dashboard widgets (2 files)
│   └── sections/                 # UNUSED legacy sections (9 files — do not use)
│
├── lib/
│   ├── config/                   # Configuration constants (11 files)
│   ├── contexts/                 # React Context providers (2 files)
│   ├── creators/                 # Creator affiliate logic (3 files)
│   ├── invoice/                  # Invoice generation (4 files)
│   ├── lmn/                      # LMN generation (5 files)
│   ├── payments/                 # Payment provider APIs (4 files)
│   ├── auth.ts                   # Member/admin JWT auth
│   ├── portal-auth.ts            # Portal OTP JWT auth
│   ├── portal-db.ts              # Portal database operations
│   ├── db.ts                     # Core database client + queries
│   ├── asher-med-api.ts          # Asher Med external API client
│   ├── resend.ts                 # Email service wrapper
│   ├── quickbooks.ts             # QuickBooks OAuth2 integration
│   ├── analytics.ts              # GA4 event tracking helpers
│   ├── validation.ts             # Zod schemas
│   ├── utils.ts                  # cn() utility (clsx + tailwind-merge)
│   ├── intake-utils.ts           # Intake form utilities (buildPartnerNote, formatMedicationsList)
│   ├── resilience.ts             # withRetry(), biomarker scoring engine
│   ├── rate-limit.ts             # API rate limiting
│   ├── turnstile.ts              # Cloudflare Turnstile verification
│   ├── cart-context.tsx          # Shopping cart React context
│   ├── blog-content.ts           # Blog markdown loading (gray-matter + marked)
│   ├── library-content.ts        # Library content loading
│   ├── protocol-templates.ts     # Treatment protocol templates
│   ├── calorie-calculator.ts     # Calorie calculation
│   ├── peptide-calculator.ts     # Peptide dosage calculator
│   └── data-normalization.ts     # Data normalization utilities
│
├── content/
│   ├── blog/                     # 12 science article markdown files
│   └── library/                  # 6 peptide library markdown files
│
├── migrations/                   # SQL migration files (run manually)
│   └── *.sql                     # 002–015 (canonical), with duplicates from macOS copy artifacts
│
├── tests/                        # Vitest test suite
│   ├── setup.ts
│   ├── api/
│   ├── components/
│   ├── integration/
│   └── lib/
│
├── public/                       # Static assets (images, logos, SVGs)
│   ├── images/                   # Hero and lifestyle images
│   └── creators/brand-kit/       # Creator brand assets
│
├── scripts/
│   └── run-migration.mjs         # Manual DB migration runner
│
├── middleware.ts                 # Edge middleware (hostname rewriting for join.cultrhealth.com)
├── next.config.js                # Next.js config (caching headers, redirects, image formats)
├── tailwind.config.ts            # Tailwind theme (brand colors, fonts, animations)
├── tsconfig.json                 # TypeScript config (strict: false, allowJs: true)
├── vitest.config.js              # Vitest config
└── vercel.json                   # Vercel cron job configuration
```

## Directory Purposes

**`app/` — Pages and API Routes:**
- All routing via Next.js App Router file-system conventions
- Server components by default; `'use client'` only in `*Client.tsx` files
- API routes: `route.ts` with named exports `GET`, `POST`, etc.
- Key sub-trees: `app/creators/portal/` (8-page creator dashboard), `app/library/` (member shop + calculators + content), `app/admin/` (admin panel)

**`components/ui/` — Design System Primitives:**
- `Button.tsx`: `primary`/`secondary`/`ghost` variants, `sm`/`md`/`lg` sizes, `isLoading` prop, all `rounded-full`
- `ScrollReveal.tsx`: IntersectionObserver animation wrapper
- `Aura.tsx`: Decorative gradient blobs
- `Input.tsx`, `Spinner.tsx`, `SectionWrapper.tsx`

**`components/site/` — Site Chrome:**
- `Header.tsx`: Floating pill navbar with scroll morphing
- `Footer.tsx`: Two-tier footer with social icons
- `LayoutShell.tsx` + `LayoutShellClient.tsx`: Conditionally wraps pages with Header/Footer
- Other marketing components: `PricingCard.tsx`, `FAQAccordion.tsx`, `CTASection.tsx`, `ComparisonTable.tsx`, `ClubBanner.tsx`, `NewsletterSignup.tsx`, `CommunityFeed.tsx`, `ProductCard.tsx`

**`components/sections/` — DEAD CODE:**
- 9 files (Hero, Services, About, HowItWorks, Results, Pricing, Testimonials, FAQ, Waitlist)
- Not imported anywhere — homepage builds all sections inline in `app/page.tsx`
- Do not import or extend these files

**`lib/config/` — Central Configuration (read-only constants):**
- `plans.ts`: `PLANS` array + `PlanTier` type + `STRIPE_CONFIG`
- `affiliate.ts`: Commission rates, tier thresholds, Creator/AffiliateCode/TrackingLink types
- `social-proof.ts`: `TESTIMONIALS`, `PROVIDERS`, `TRUST_METRICS`, `TRUST_BADGES`
- `product-catalog.ts`: SKUs, prices (70% markup applied), stock status
- `product-to-asher-mapping.ts`: SKU → Asher Med product ID mapping
- `links.ts`: `LINKS` object with all external URLs and internal routes
- `payments.ts`: Payment provider configuration
- `tax.ts`: `FL_TAX_RATE = 0.075`, `calculateTaxCents()`, `calculateTaxDollars()`

**`lib/creators/` — Creator Affiliate Domain:**
- `attribution.ts`: Cookie serialization, token generation, `resolveAttribution()`
- `commission.ts`: `processOrderAttribution()` — direct/override/cap calculation
- `db.ts`: All DB queries for creator-related tables (creators, affiliate_codes, tracking_links, click_events, order_attributions, commission_ledger, payouts)

**`migrations/` — Database Schema:**
- Canonical files: `002_orders_table.sql` through `015_club_orders_tax.sql`
- Files with ` 2.sql`, ` 3.sql` etc. suffixes are macOS duplicate artifacts — ignore them
- Run manually: `node scripts/run-migration.mjs`

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root HTML shell, font loading, GA injection
- `middleware.ts`: Only edge middleware — hostname rewriting for `join.cultrhealth.com`
- `app/page.tsx`: Homepage (inline sections, dynamic imports for below-fold)

**Authentication:**
- `lib/auth.ts`: `verifyAuth()`, `verifyCreatorAuth()`, `verifyAdminAuth()`, `getMembershipTier()`, `getSession()`
- `lib/portal-auth.ts`: `verifyPortalSession()`, `createPortalAccessToken()`, `createPortalRefreshToken()`
- `app/api/auth/magic-link/route.ts`: Sends magic link email
- `app/api/auth/verify/route.ts`: Verifies token, creates session cookie
- `app/api/portal/send-otp/route.ts`: Sends Twilio OTP
- `app/api/portal/verify-otp/route.ts`: Verifies OTP, creates dual JWT cookies

**Database:**
- `lib/db.ts`: Core database functions (waitlist, membership, orders, intake, sessions)
- `lib/portal-db.ts`: Portal session database functions
- `lib/creators/db.ts`: All creator affiliate database functions

**External Integrations:**
- `lib/asher-med-api.ts`: Asher Med patient/order API client
- `lib/resend.ts`: Transactional email templates and sending
- `lib/quickbooks.ts`: QuickBooks OAuth2 token management, invoice/customer creation
- `lib/payments/affirm-api.ts`, `lib/payments/klarna-api.ts`, `lib/payments/authorize-net-api.ts`: BNPL APIs

**Configuration:**
- `lib/config/plans.ts`: Membership tiers, Stripe IDs, library access per tier
- `lib/config/affiliate.ts`: Creator types, commission config, tier thresholds
- `lib/config/product-catalog.ts`: Full peptide product catalog with SKUs

**Core Utilities:**
- `lib/utils.ts`: `cn()` function (clsx + tailwind-merge) — use for all className construction
- `lib/validation.ts`: Zod schemas for API input validation
- `lib/rate-limit.ts`: `apiLimiter.check()` for rate-gating API routes
- `lib/resilience.ts`: `withRetry()` and `isTransientDbError()` for external API calls

**Key Webhook:**
- `app/api/webhook/stripe/route.ts`: Subscription lifecycle, membership creation, commission attribution

**Cron Jobs:**
- `app/api/cron/approve-commissions/route.ts`: Approves commissions after 30-day window
- `app/api/cron/update-tiers/route.ts`: Recalculates creator tiers and active member counts

## Naming Conventions

**Files:**
- Page files: `page.tsx` (server), `layout.tsx` (server), `route.ts` (API)
- Client counterparts: `[FeatureName]Client.tsx` — e.g., `IntakeFormClient.tsx`, `ShopClient.tsx`
- Components: PascalCase — e.g., `CreatorSidebar.tsx`, `TierGate.tsx`
- Library utilities: camelCase — e.g., `auth.ts`, `asher-med-api.ts`, `portal-db.ts`
- Config files: kebab-case — e.g., `product-catalog.ts`, `social-proof.ts`

**Directories:**
- `app/`: kebab-case route segments matching URL paths
- `components/`: kebab-case domain groups (`site/`, `intake/`, `creators/`)
- `lib/`: kebab-case domain groups (`config/`, `creators/`, `payments/`)

**Exports:**
- Components: Named exports preferred (e.g., `export function Button`) — some use default export
- Config constants: SCREAMING_SNAKE_CASE (e.g., `PLANS`, `TRUST_BADGES`, `COMMISSION_CONFIG`)
- Types: PascalCase (e.g., `PlanTier`, `Creator`, `CommissionResult`)

**API Routes:**
- Named HTTP verb exports: `export async function GET(request: NextRequest)`
- Dynamic segments: `[slug]`, `[tier]`, `[id]`, `[orderId]`, `[lmnNumber]`

## Where to Add New Code

**New Marketing Page:**
- Create: `app/[route-name]/page.tsx` (server component)
- If interactive: Extract to `app/[route-name]/[FeatureName]Client.tsx`
- Add to Header nav in `components/site/Header.tsx` if needed

**New API Endpoint:**
- Create: `app/api/[domain]/[action]/route.ts`
- Always call `verifyAuth()` / `verifyCreatorAuth()` / `verifyAdminAuth()` at top
- Add rate limiting via `lib/rate-limit.ts:apiLimiter.check()` for mutation endpoints

**New UI Component:**
- Reusable primitive → `components/ui/[Component].tsx`
- Marketing/site-wide → `components/site/[Component].tsx`
- Domain-specific → `components/[domain]/[Component].tsx`
- Always use `cn()` from `lib/utils.ts` for className construction

**New Configuration Constant:**
- Add to appropriate `lib/config/*.ts` file (never hardcode in components or API routes)
- If new config file needed: `lib/config/[domain].ts`

**New Database Operations:**
- Core tables (users, subscriptions, orders): `lib/db.ts`
- Creator tables: `lib/creators/db.ts`
- Portal tables: `lib/portal-db.ts`
- New domain: `lib/[domain]-db.ts`

**New DB Migration:**
- Create: `migrations/0NN_[description].sql` (sequential number)
- Run: `node scripts/run-migration.mjs`

**New Content:**
- Blog post: `content/blog/[slug].md` (with gray-matter frontmatter)
- Library article: `content/library/[slug].md`

**New External Integration:**
- Create client: `lib/[service-name].ts` with typed functions
- Add env vars to `.env.example` and document in CLAUDE.md
- Never call external APIs directly from pages or components — always via `lib/`

## Special Directories

**`.planning/`:**
- Purpose: GSD planning docs (phases, codebase maps, research)
- Generated: No (hand-maintained and agent-written)
- Committed: Yes

**`.next/`:**
- Purpose: Next.js build output and cache
- Generated: Yes (by `npm run build` or `npm run dev`)
- Committed: No

**`migrations/`:**
- Purpose: SQL schema migration files
- Note: Files with space-number suffixes (e.g., `002_orders_table 2.sql`) are macOS copy artifacts — use only the canonical file without suffix
- Canonical range: `002` through `015`
- Committed: Yes (canonical files only)

**`_archive/` and `archive/`:**
- Purpose: Archived/deprecated files
- Committed: Yes
- Status: Do not import from or modify

**`public/images/`:**
- Purpose: Hero and lifestyle images served by Next.js Image component
- Note: `.vercelignore` was previously misconfigured to exclude these — fixed with `!/public/images` negative pattern
- Committed: Yes

---

*Structure analysis: 2026-03-11*
