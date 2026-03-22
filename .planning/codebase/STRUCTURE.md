# Codebase Structure

**Analysis Date:** 2026-03-22

## Directory Layout

```
project-root/
├── app/                          # Next.js 14 App Router — all pages and API routes
│   ├── page.tsx                  # Homepage (server component, all sections inline)
│   ├── layout.tsx                # Root layout (fonts, GA, LayoutShell, MeshBackground)
│   ├── globals.css               # Global Tailwind + custom keyframes
│   ├── api/                      # 80+ API route handlers (route.ts files)
│   ├── portal/                   # Member portal (phone OTP auth, labs, orders)
│   ├── creators/portal/          # Creator affiliate portal
│   ├── admin/                    # Admin panel (order/creator/club management)
│   ├── join/                     # Checkout flow (also served at join.cultrhealth.com)
│   ├── intake/                   # Medical intake multi-step form
│   ├── library/                  # Members content library + shop
│   ├── science/                  # Public blog/science articles
│   └── [other pages]/            # pricing, quiz, faq, how-it-works, therapies, tools, etc.
│
├── components/                   # Reusable React components
│   ├── ui/                       # Design system primitives
│   ├── site/                     # Marketing site chrome and sections
│   ├── portal/                   # Member portal components
│   ├── creators/                 # Creator portal components
│   ├── intake/                   # Medical intake form components
│   ├── library/                  # Member library components
│   ├── payments/                 # Payment provider components
│   ├── dashboard/                # Health dashboard widgets
│   ├── admin/                    # Admin panel components
│   └── sections/                 # LEGACY — not imported anywhere, do not use
│
├── lib/                          # Business logic, utilities, DB, external clients
│   ├── config/                   # Static configuration constants (plans, products, etc.)
│   ├── contexts/                 # React Context providers
│   ├── creators/                 # Creator affiliate logic (commission, attribution, DB)
│   ├── invoice/                  # Invoice PDF generation
│   ├── lmn/                      # Lab Management Number generation
│   ├── payments/                 # Payment provider API clients
│   ├── siphox/                   # SiPhox Health lab integration
│   ├── auth.ts                   # JWT auth for member/creator/admin
│   ├── portal-auth.ts            # JWT auth for phone OTP portal (dual-token)
│   ├── db.ts                     # Core DB queries (Vercel Postgres)
│   ├── asher-med-api.ts          # Asher Med HIPAA API client
│   ├── quickbooks.ts             # QuickBooks Online OAuth2 client
│   ├── resend.ts                 # Resend email service wrapper
│   ├── resilience.ts             # withRetry(), biomarker scoring engine
│   ├── rate-limit.ts             # IP rate limiting (in-memory + Redis)
│   ├── analytics.ts              # GA4 event tracking helpers
│   ├── cart-context.tsx          # Shopping cart React Context + reducer
│   ├── utils.ts                  # cn() (clsx + tailwind-merge), brandify(), etc.
│   └── validation.ts             # Zod validation schemas
│
├── content/                      # Markdown content (gray-matter frontmatter)
│   ├── blog/                     # Science/blog articles (12 .md files)
│   └── library/                  # Peptide library content (6 .md files)
│
├── migrations/                   # SQL migration files (run via scripts/run-migration.mjs)
├── tests/                        # Vitest test suite
├── public/                       # Static assets (images, logos, robots.txt, llms.txt)
├── scripts/                      # Utility scripts (run-migration.mjs)
├── middleware.ts                 # Edge middleware (join.cultrhealth.com subdomain rewrite)
├── next.config.js                # Next.js config (image formats, caching headers, redirects)
├── tailwind.config.ts            # Tailwind config (custom colors, fonts, keyframes)
├── tsconfig.json                 # TypeScript config (strict: false, @/ alias)
└── vercel.json                   # Vercel deploy config (cron schedules)
```

## Directory Purposes

**`app/`:**
- Purpose: All Next.js pages and API routes
- Contains: Server components (`page.tsx`), Client components (`*Client.tsx`), layouts (`layout.tsx`), API handlers (`route.ts`)
- Key files: `app/layout.tsx` (root), `app/page.tsx` (homepage), `app/middleware.ts` does NOT live here — it's at root

**`app/api/`:**
- Purpose: All HTTP API endpoints
- Contains: `route.ts` files with `export async function GET/POST(request: NextRequest)`
- Structure: Grouped by domain — `auth/`, `checkout/`, `creators/`, `club/`, `admin/`, `portal/`, `intake/`, `webhook/`, `cron/`, `track/`

**`app/portal/`:**
- Purpose: Member portal with phone OTP authentication
- Contains: `login/`, `dashboard/`, `labs/`, `intake/`, `renewal/`, `documents/`, `profile/`
- Key files: `app/portal/layout.tsx` (client-side auth guard + sidebar + activity-based token refresh)

**`app/creators/portal/`:**
- Purpose: Creator affiliate portal
- Contains: `dashboard/`, `earnings/`, `network/`, `payouts/`, `share/`, `campaigns/`, `resources/`, `settings/`, `support/`
- Key files: `app/creators/portal/layout.tsx` (auth check on mount, wraps `CreatorProvider`)

**`app/join/`:**
- Purpose: Checkout flow (membership + CULTR Club free tier)
- Contains: `layout.tsx` (loads payment provider SDKs), `page.tsx` (Club signup), `[tier]/page.tsx` (paid tiers)
- Note: Also served at `join.cultrhealth.com` via `middleware.ts` rewrite

**`components/ui/`:**
- Purpose: Design system primitives — use these everywhere
- Contains: `Button.tsx`, `Input.tsx`, `Aura.tsx`, `ScrollReveal.tsx`, `SectionWrapper.tsx`, `Spinner.tsx`, `WavyBackground.tsx`, `TrustMarquee.tsx` (from `components/site/` but referenced as ui), `TextShimmer.tsx`, `Marquee.tsx`, `MeshBackground.tsx`, `MeshBackgroundDynamic.tsx`, `NavDock.tsx`
- Key files: `components/ui/Button.tsx` — use `variant` prop (`primary`/`secondary`/`ghost`) + `size` prop (`sm`/`md`/`lg`) + `isLoading` prop; all buttons are `rounded-full`

**`components/site/`:**
- Purpose: Marketing site components (Header, Footer, sections)
- Contains: `Header.tsx`, `Footer.tsx`, `LayoutShell.tsx`, `LayoutShellClient.tsx`, `PricingCard.tsx`, `FAQAccordion.tsx`, `TestimonialsSection.tsx`, `TrustMarquee.tsx`, `CTASection.tsx`, `ClubBanner.tsx`, `NewsletterSignup.tsx`, `TherapiesGrid.tsx`, `MarketingHero.tsx`, etc.
- Note: `components/Footer.tsx`, `components/Navigation.tsx`, `components/WaitlistForm.tsx` at root level are LEGACY — never use

**`components/portal/`:**
- Purpose: Member portal UI (labs results, sidebar, kit management)
- Contains: `PortalSidebar.tsx`, `LabsResultsView.tsx`, `BiomarkerCategoryCard.tsx`, `BiomarkerDetailModal.tsx`, `KitDetailCard.tsx`, `KitRegistrationForm.tsx`, `KitTimeline.tsx`, `ReferenceRangeBar.tsx`, `PrelaunchCodesSection.tsx`

**`components/intake/`:**
- Purpose: Medical intake multi-step form components (12 files)
- Contains: All form step components + `index.ts` barrel export
- Key files: Use `components/intake/index.ts` for imports, not individual paths

**`lib/config/`:**
- Purpose: Business constants — plans, products, pricing, affiliate config, social proof
- Contains: Pure TypeScript constants; no side effects, no DB calls
- Key files: `plans.ts` (tier definitions + Stripe IDs), `affiliate.ts` (commission rates + types), `product-catalog.ts` (SKUs + prices), `social-proof.ts` (TESTIMONIALS, PROVIDERS, TRUST_BADGES), `coupons.ts` (club coupons), `therapies.ts`, `siphox-biomarkers.ts`

**`lib/siphox/`:**
- Purpose: SiPhox Health at-home lab kit integration
- Contains: `client.ts` (API client), `db.ts` (results storage), `schemas.ts` (Zod schemas), `types.ts`, `biomarkers.ts`, `fulfillment.ts`, `kit-lifecycle.ts`, `reports.ts`, `errors.ts`

**`content/`:**
- Purpose: Markdown source content rendered at runtime via gray-matter + marked
- Contains: Blog posts (12 files in `content/blog/`) + peptide library categories (6 files in `content/library/`)
- Pattern: Files have YAML frontmatter (`title`, `description`, `date`, `category`) loaded by `lib/blog-content.ts` and `lib/library-content.ts`

**`migrations/`:**
- Purpose: SQL schema evolution files
- Contains: Numbered SQL files (`002` through `024`)
- Note: Run manually via `node scripts/run-migration.mjs`; no automatic migration runner

**`tests/`:**
- Purpose: Vitest test suite
- Contains: `api/`, `components/`, `integration/`, `lib/` subdirectories + `setup.ts` + `vitest.d.ts`

**`public/`:**
- Purpose: Static assets served directly
- Contains: `images/` (hero + lifestyle photos), `creators/brand-kit/` (SVG logos), root-level logos, `robots.txt`, `llms.txt`

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout — fonts, GA, global wrappers
- `app/page.tsx`: Homepage server component
- `middleware.ts`: Edge middleware for subdomain routing
- `vercel.json`: Cron job schedules

**Auth:**
- `lib/auth.ts`: Member/creator/admin JWT auth + `getMembershipTier()`
- `lib/portal-auth.ts`: Phone OTP portal dual-token auth

**Database:**
- `lib/db.ts`: Core entity queries (users, memberships, orders, intakes)
- `lib/creators/db.ts`: Creator/affiliate table queries
- `lib/portal-db.ts`: Portal OTP sessions
- `lib/siphox/db.ts`: Lab results storage
- `migrations/`: SQL schema files (024 files, latest: `024_prelaunch_codes.sql`)

**Configuration:**
- `lib/config/plans.ts`: Membership tier definitions, Stripe price IDs, library access matrix
- `lib/config/affiliate.ts`: Commission rates, tiers, FTC disclosure templates
- `lib/config/product-catalog.ts`: Peptide product SKUs, pricing (70% markup), stock status
- `lib/config/coupons.ts`: `validateCouponUnified()` + 6 CLUB_COUPONS definitions
- `lib/config/social-proof.ts`: TESTIMONIALS, PROVIDERS, TRUST_METRICS, TRUST_BADGES

**External Services:**
- `lib/asher-med-api.ts`: Asher Med HIPAA partner API (patient + order management)
- `lib/quickbooks.ts`: QuickBooks Online OAuth2 (customers, invoices, payments)
- `lib/resend.ts`: Transactional email with `escapeHtml` XSS protection
- `lib/siphox/client.ts`: SiPhox Health at-home lab API

**Utilities:**
- `lib/utils.ts`: `cn()`, `brandify()`, `getCookieDomain()`
- `lib/resilience.ts`: `withRetry()`, `isTransientDbError()`, biomarker scoring engine
- `lib/rate-limit.ts`: `rateLimit()` factory + `apiLimiter` singleton
- `lib/analytics.ts`: GA4 event helpers (`trackPageView`, `trackCheckout`, `trackPurchase`)

**UI Primitives:**
- `components/ui/Button.tsx`: All buttons in codebase
- `components/ui/ScrollReveal.tsx`: Scroll-triggered IntersectionObserver animations
- `components/ui/WavyBackground.tsx`: Canvas-based animated wavy background
- `components/ui/MeshBackgroundDynamic.tsx`: SSR-safe global mesh gradient background

**Layouts:**
- `components/site/LayoutShell.tsx` + `LayoutShellClient.tsx`: Conditionally shows Header/Footer (hides on `/creators/portal`, `/admin`, `/join-club`, `/join`)
- `app/portal/layout.tsx`: Phone OTP auth guard + sidebar + token refresh
- `app/creators/portal/layout.tsx`: Creator auth check + `CreatorProvider` + sidebar
- `app/join/layout.tsx`: Payment provider SDK loader

## Naming Conventions

**Files:**
- Pages: `page.tsx` (server component)
- Client components: `[Name]Client.tsx` (co-located with page, `'use client'` at top)
- Route handlers: `route.ts` (named exports `GET`, `POST`)
- Layouts: `layout.tsx`
- Barrel exports: `index.ts`

**Directories:**
- App routes: `kebab-case` matching URL slug (e.g., `how-it-works/`, `join-club/`)
- Dynamic segments: `[paramName]/` in brackets (e.g., `[tier]/`, `[sku]/`, `[slug]/`)
- Component groups: `PascalCase` filenames inside `kebab-case` directories
- Private route segments: `_components/`, `_data/` (not route-accessible, used in `app/creators/portal/resources/`)

**Components:**
- React components: `PascalCase.tsx`
- Context files: `[Domain]Context.tsx` in `lib/contexts/`
- Config constants: `camelCase.ts` in `lib/config/` (exports `UPPER_CASE` constants + TypeScript types)

## Where to Add New Code

**New Marketing Page:**
- Create `app/[page-slug]/page.tsx` (server component with `export const metadata`)
- Add interactive parts as `app/[page-slug]/[PageName]Client.tsx`
- Register in `components/site/Header.tsx` nav links if needed

**New API Endpoint:**
- Create `app/api/[domain]/[action]/route.ts`
- Export named functions `GET` or `POST` (both accepted by Next.js)
- Call `verifyAuth(request)` or `verifyAdminAuth(request)` from `lib/auth.ts` at top
- Put business logic in `lib/` — keep route handler thin

**New Database Table:**
- Create `migrations/[NNN]_description.sql` (increment number)
- Run `node scripts/run-migration.mjs`
- Add typed query functions to the appropriate `lib/***/db.ts` file

**New UI Component:**
- Shared primitive → `components/ui/[ComponentName].tsx`
- Marketing/site section → `components/site/[ComponentName].tsx`
- Domain-specific → `components/[domain]/[ComponentName].tsx`

**New Config Constant:**
- Add to relevant file in `lib/config/` (or create new `lib/config/[domain].ts`)
- Export as `UPPER_CASE` constant with TypeScript type

**New External Integration:**
- Create `lib/[service-name]-api.ts` or `lib/[service-name]/client.ts` for complex integrations
- Add API routes in `app/api/[service-name]/`
- Add env vars to `env.example` and document in CLAUDE.md

**New Content (Blog Post):**
- Add `content/blog/[slug].md` with YAML frontmatter (`title`, `description`, `date`, `author`, `category`)
- Auto-discoverable by `lib/blog-content.ts`

## Special Directories

**`.planning/`:**
- Purpose: GSD planning documents (phases, codebase analysis, roadmap, requirements)
- Generated: No — hand-authored + AI-generated
- Committed: Yes

**`.agents/` and `.agent/`:**
- Purpose: Agent skill definitions (marketing, CRO, SEO, ad creative, etc.)
- Generated: No
- Committed: Yes

**`.ralph/`:**
- Purpose: Ralph autonomous development loop state files
- Generated: Partially (logs, progress.json, status.json are runtime-generated)
- Committed: Partially (config files yes, logs no)

**`_archive/`:**
- Purpose: Archived legacy files
- Generated: No
- Committed: Yes (but never import from here)

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes (`npm install`)
- Committed: No (in `.gitignore`)

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes (`npm run build` or `npm run dev`)
- Committed: No

---

*Structure analysis: 2026-03-22*
