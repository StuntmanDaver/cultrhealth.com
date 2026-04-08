# CLAUDE.md

This file provides guidance to Claude Code when working with the CULTR Health Website codebase.

---

## Repository Overview

**CULTR Health** is a HIPAA-compliant telehealth platform for GLP-1 weight loss medications, wellness peptides, and longevity optimization. Built with Next.js 14 App Router, TypeScript, Tailwind CSS, and integrated with Asher Med Partner Portal, Stripe payments, and a full creator affiliate system.

- **Production URL:** https://cultrhealth.com (waitlist site, `production` branch)
- **Staging URL:** https://staging.cultrhealth.com (full app, `staging` branch)
- **Join Club URL:** https://join.cultrhealth.com (CULTR Club landing page, `staging` branch, subdomain alias via middleware)
- **Hosting:** Vercel (automatic deployments per branch)
- **Brand Tagline:** "Change the CULTR, rebrand yourself."
- **Social Handle:** @cultrhealth (all platforms)

---

## Technology Stack

### Frontend
- **Framework:** Next.js ^14.2.0 (App Router)
- **Language:** TypeScript ^5.4.0 (`strict: false` in tsconfig — uses `allowJs`, `skipLibCheck`)
- **Styling:** Tailwind CSS ^3.4.3 with `@tailwindcss/typography` plugin
- **Fonts:** Fraunces (display/serif), Playfair Display (headings), Inter (body/sans)
- **Icons:** Lucide React ^0.563.0 (+ custom TikTok/YouTube SVGs in Footer)
- **Class Utilities:** clsx ^2.1.1 + tailwind-merge ^3.4.0 → `cn()` helper in `lib/utils.ts`
- **Charts:** Recharts ^3.7.0 (used only in `components/creators/AnalyticsCharts.tsx`)
- **Forms:** Native React state management + Zod ^3.23.0 validation
- **State:** React Context API (`CreatorContext`, `IntakeFormContext`, `CartContext`)
- **Animations:** Tailwind keyframes (fadeIn, slideUp, float, shimmer, scaleIn, blurIn, bounceSubtle, glowPulse)
- **PDF Generation:** @react-pdf/renderer ^4.3.2 (invoices, LMN documents)
- **Markdown:** gray-matter ^4.0.3 (frontmatter parsing) + marked ^17.0.1 (rendering) + DOMPurify ^3.3.1 (sanitization)

### Backend
- **Runtime:** Node.js 18+
- **Database:** Neon PostgreSQL accessed via @vercel/postgres ^0.10.0 SDK
- **Authentication:** JWT tokens via `jose` ^6.1.3 library
- **Email:** Resend ^4.0.0 (transactional emails)
- **Payments:** Stripe ^20.2.0 (subscriptions) + Affirm, Klarna, Authorize.net (BNPL)
- **Bot Protection:** Cloudflare Turnstile (@marsidev/react-turnstile ^1.0.2)
- **AI:** AI SDK v6 (@ai-sdk/openai ^3.0.21, @ai-sdk/react ^3.0.61, `ai` ^6.0.59) — protocol generation, meal plans
- **Caching/Rate Limiting:** Upstash Redis (optional)
- **File Storage:** AWS S3 via Asher Med presigned URLs
- **Analytics:** Google Analytics 4 (via NEXT_PUBLIC_GA_MEASUREMENT_ID)
- **Validation:** Zod schemas (`lib/validation.ts`)

### External Integrations
| Integration | Purpose | Auth Method |
|---|---|---|
| **Asher Med Partner Portal** | HIPAA-compliant patient onboarding, order fulfillment | X-API-KEY header |
| **Stripe** | Subscription payments, checkout sessions, webhooks | Secret key + webhook signing |
| **Resend** | Welcome emails, order confirmations, creator notifications | API key |
| **Cloudflare Turnstile** | Bot protection on forms | Secret key |
| **Curator.io** | Social media feed aggregation (Community page) | Feed IDs via env vars |
| **Google Analytics** | Page tracking, conversion events | Measurement ID |
| **QuickBooks Online** | Invoice creation, customer management, payment recording for club orders | OAuth2 (tokens in DB) |

### Dev Dependencies
- **Testing:** Vitest ^4.0.18 + @testing-library/react ^16.3.2 + @testing-library/jest-dom ^6.9.1
- **Build Analysis:** @next/bundle-analyzer ^16.1.6
- **Linting:** ESLint ^8.57.0 + eslint-config-next ^14.2.0
- **CSS:** PostCSS ^8.4.38 + autoprefixer ^10.4.19
- **DOM:** jsdom ^27.4.0 (test environment)
- **React Plugin:** @vitejs/plugin-react ^5.1.2

**Note:** `class-variance-authority` ^0.7.1 is listed in `package.json` dependencies but is NOT currently imported or used anywhere in the codebase. Button and other components use manual variant objects with the `cn()` utility.

---

## Brand Design System

### Colors (defined in `tailwind.config.ts`)
| Token | Hex | Usage |
|---|---|---|
| `brand-primary` / `forest` | `#2A4542` | Primary text, backgrounds, buttons |
| `forest-light` / `brand-primaryLight` | `#3A5956` | Hover states |
| `forest-dark` / `brand-primaryHover` | `#1F3533` | Pressed states |
| `brand-cream` / `cream` | `#FDFBF7` | Page backgrounds, body bg |
| `cream-dark` / `brand-creamDark` | `#F5F0E8` | Card backgrounds |
| `sage` | `#B7E4C7` | Accent, badges |
| `mint` | `#D8F3DC` | Highlights, trust badges bg |
| `aura-*` | Various | Decorative gradient colors (purple, lavender, sage, mint, orange, peach, yellow) |
| `cultr-*` | Various | Legacy aliases (cultr-forest, cultr-sage, cultr-mint, cultr-offwhite, cultr-text, cultr-textMuted) |

### Typography
- **Display/Headings:** `font-fraunces` or `font-display` (Playfair Display)
- **Body text:** `font-body` / `font-sans` (Inter)
- Font CSS variables set on `<html>`: `--font-fraunces`, `--font-display`, `--font-body`

### Compliance Components (`components/compliance/`)
| Component | Description |
|---|---|
| `ConsentModal.tsx` | Informed consent modal for checkout — scroll-gated checkbox + IntersectionObserver, FDA badges per tier, body scroll lock. Props: isOpen, onClose, onConsent, tierSlug |
| `PrescriptionDisclaimer.tsx` | Reusable Rx disclaimer with Shield icon. Used on therapies + pricing pages |
| `FDAStatusBadge.tsx` | FDA status badge per therapy (color-coded by status). Props: therapyId, showDisclaimer |
| `TestimonialDisclaimer.tsx` | Testimonial results disclaimer. Used in testimonial sections |
| `DispensingPharmacyInfo.tsx` | St. Luke Compounding Pharmacy info block. Used in footer |

### UI Components (`components/ui/`)
| Component | Description |
|---|---|
| `Button.tsx` | Variants: `primary`, `secondary`, `ghost`. Sizes: `sm`, `md`, `lg`. All variants use `rounded-full`. Has `isLoading` state with spinner. Uses `cn()` (clsx + tailwind-merge), NOT CVA. |
| `Input.tsx` | Styled form inputs |
| `Aura.tsx` | Decorative gradient blobs for visual effects |
| `ScrollReveal.tsx` | Intersection Observer animation wrapper with configurable delay, direction, duration |
| `SectionWrapper.tsx` | Consistent section padding/spacing |
| `Spinner.tsx` | Loading spinner |

---

## Project Structure

```
app/                              # Next.js 14 App Router
├── page.tsx                      # Homepage (inline sections — see "Homepage Architecture" below)
├── layout.tsx                    # Root layout (fonts, GA script, LayoutShell)
├── globals.css                   # Global styles
├── error.tsx                     # Error boundary
├── not-found.tsx                 # 404 page
├── robots.ts                     # SEO robots.txt generator
├── sitemap.ts                    # SEO sitemap generator
├── opengraph-image.png           # Default OG image
├── twitter-image.png             # Twitter card image
│
├── pricing/page.tsx              # Pricing page
├── quiz/                         # Interactive recommendation quiz
│   ├── page.tsx
│   └── QuizClient.tsx
├── how-it-works/page.tsx         # How It Works page
├── faq/page.tsx                  # FAQ page
├── community/page.tsx            # Community social feed (Curator.io integration)
├── (science/ removed Apr 2026 — LegitScript compliance, redirects to /)
├── products/page.tsx             # Redirects to /pricing (301 via next.config.js)
├── success/page.tsx              # Post-checkout success
├── login/page.tsx                # Member login (magic link)
├── dashboard/page.tsx            # Member dashboard
│
├── join/                         # Checkout flow (bare /join redirects to /pricing)
│   ├── layout.tsx
│   └── [tier]/page.tsx           # Tier-specific checkout (core, catalyst, concierge, club) — includes ConsentModal
│
├── intake/                       # Medical intake forms
│   ├── page.tsx
│   ├── IntakeFormClient.tsx      # Multi-step form controller
│   └── success/page.tsx
│
├── library/                      # Member resource library
│   ├── page.tsx                  # Main library landing
│   ├── layout.tsx                # Library layout
│   ├── LibraryContent.tsx        # Content renderer
│   ├── LibraryLogin.tsx          # Auth gate
│   ├── [category]/page.tsx       # Category pages (metabolic, repair, growth-factors, bioregulators)
│   ├── calorie-calculator/       # Calorie calculator tool
│   ├── dosing-calculator/        # Peptide dosing calculator
│   ├── peptide-faq/              # Peptide FAQ section
│   ├── cart/                     # Shopping cart
│   ├── quote-success/            # Quote confirmation
│   └── shop/                     # Members shop
│       ├── page.tsx
│       ├── ShopClient.tsx
│       ├── QuickOrderClient.tsx
│       └── [sku]/                # Product detail pages
│
├── renewal/                      # Subscription renewal flow
│   ├── page.tsx
│   ├── RenewalFormClient.tsx
│   └── success/page.tsx
│
├── track/daily/page.tsx          # Daily tracking
│
├── provider/                     # Provider tools (access-controlled)
│   └── protocol-builder/         # Treatment protocol builder
│       ├── page.tsx
│       └── ProtocolBuilderClient.tsx
│
├── creators/                     # Creator affiliate portal
│   ├── page.tsx                  # Creator program landing
│   ├── login/page.tsx            # Creator login
│   ├── apply/page.tsx            # Creator application form
│   ├── pending/page.tsx          # Application pending page
│   ├── [slug]/page.tsx           # Public creator profile pages
│   └── portal/                   # Authenticated creator dashboard
│       ├── layout.tsx            # Portal layout (auth + CreatorContext)
│       ├── page.tsx              # Portal root (redirects to dashboard)
│       ├── dashboard/page.tsx    # Analytics & overview
│       ├── earnings/page.tsx     # Commission tracking & ledger
│       ├── network/page.tsx      # Referral network & override commissions
│       ├── payouts/page.tsx      # Payout history
│       ├── share/page.tsx        # Tracking links & coupon codes
│       ├── campaigns/page.tsx    # Campaign management & commission bonuses
│       ├── resources/            # Marketing materials & brand kit
│       │   ├── page.tsx
│       │   └── [slug]/page.tsx
│       ├── settings/page.tsx     # Account settings
│       └── support/page.tsx      # Help & support
│
├── join-club/                    # CULTR Club landing page (join.cultrhealth.com)
│   ├── layout.tsx                # Minimal layout — no site chrome (header/footer)
│   ├── page.tsx
│   └── JoinLandingClient.tsx     # Full landing + signup modal (localStorage + cookie persistence)
│
├── admin/                        # Admin panel
│   ├── page.tsx
│   ├── AdminDashboardClient.tsx
│   ├── orders/[orderNumber]/fulfill/route.ts
│   ├── club-orders/
│   │   ├── page.tsx              # Club orders management (HMAC-protected approvals)
│   │   └── ClubOrdersClient.tsx
│   └── creators/
│       ├── page.tsx              # Creator management
│       ├── approvals/page.tsx    # Application reviews
│       ├── campaigns/page.tsx    # Campaign management
│       └── payouts/page.tsx      # Payout processing
│
├── r/[slug]/route.ts             # Click tracking redirect handler (sets attribution cookies)
│
├── legal/
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   └── medical-disclaimer/page.tsx
│
└── api/                          # API Routes (72 endpoints)
    ├── auth/
    │   ├── magic-link/route.ts   # Send magic link email
    │   ├── verify/route.ts       # Verify magic link token
    │   └── logout/route.ts       # Clear session
    │
    ├── checkout/
    │   ├── route.ts              # Create Stripe checkout session
    │   ├── product/route.ts      # Product checkout
    │   ├── affirm/               # Affirm BNPL (checkout + capture)
    │   ├── klarna/               # Klarna BNPL (session + order)
    │   └── authorize-net/        # Authorize.net (standard + product)
    │
    ├── stripe/checkout/route.ts  # Stripe checkout endpoint
    │
    ├── webhook/
    │   ├── stripe/route.ts       # Stripe webhook handler
    │   ├── affirm/route.ts       # Affirm webhook
    │   ├── klarna/route.ts       # Klarna webhook
    │   └── authorize-net/route.ts # Authorize.net webhook
    │
    ├── creators/
    │   ├── apply/route.ts        # Creator application submission
    │   ├── magic-link/route.ts   # Creator login magic link
    │   ├── verify-login/route.ts # Verify creator login
    │   ├── verify-email/route.ts # Verify creator email
    │   ├── dashboard/route.ts    # Dashboard metrics
    │   ├── profile/route.ts      # Creator profile CRUD
    │   ├── links/route.ts        # Tracking links CRUD
    │   ├── codes/route.ts        # Coupon codes CRUD
    │   ├── network/route.ts      # Network/recruits data
    │   ├── payouts/route.ts      # Payout history
    │   ├── support/tickets/route.ts # Support ticket creation
    │   └── earnings/
    │       ├── overview/route.ts # Earnings summary
    │       ├── orders/route.ts   # Attributed orders
    │       └── ledger/route.ts   # Commission ledger
    │
    ├── club/
    │   ├── signup/route.ts       # Club member signup (cookie, email confirmation)
    │   └── orders/route.ts       # Club order submission (HMAC approval tokens)
    │
    ├── admin/
    │   ├── analytics/route.ts    # Admin analytics
    │   ├── club-orders/
    │   │   ├── route.ts          # List all club orders
    │   │   └── [orderId]/approve/route.ts  # HMAC-protected order approval
    │   └── creators/
    │       ├── pending/route.ts  # Pending applications
    │       ├── codes/route.ts    # Manage creator codes
    │       ├── [id]/approve/route.ts
    │       ├── [id]/reject/route.ts
    │       └── payouts/batch/route.ts
    │
    ├── intake/
    │   ├── questions/route.ts    # Intake form questions
    │   ├── submit/route.ts       # Submit intake form
    │   └── upload/route.ts       # File upload (ID, consent)
    │
    ├── lmn/                      # Lab Management Numbers
    │   ├── list/route.ts
    │   ├── generate/route.ts
    │   └── [lmnNumber]/route.ts
    │
    ├── member/
    │   ├── profile/route.ts      # Member profile
    │   └── orders/route.ts       # Member order history
    │
    ├── protocol/generate/route.ts # AI-powered protocol generation
    ├── meal-plan/route.ts         # AI-powered meal plans
    ├── quote/route.ts             # Product quote generation
    │
    ├── renewal/
    │   ├── check/route.ts        # Check renewal eligibility
    │   └── submit/route.ts       # Submit renewal
    │
    ├── track/
    │   ├── click/route.ts        # Track affiliate clicks
    │   └── daily/route.ts        # Daily tracking data
    │
    ├── cron/
    │   ├── approve-commissions/route.ts  # Auto-approve commissions after 30-day window
    │   └── update-tiers/route.ts         # Auto-update creator tiers by recruit count
    │
    └── waitlist/route.ts                  # Waitlist signup
```

### Components Directory (`components/`)
```
components/
├── ui/                           # Reusable UI primitives (6 files)
│   ├── Aura.tsx                  # Decorative gradient blobs
│   ├── Button.tsx                # Button with variants (primary/secondary/ghost), sizes (sm/md/lg), isLoading, rounded-full
│   ├── Input.tsx                 # Styled form input
│   ├── ScrollReveal.tsx          # Scroll-triggered animations (IntersectionObserver)
│   ├── SectionWrapper.tsx        # Section layout wrapper
│   └── Spinner.tsx               # Loading spinner
│
├── site/                         # Marketing site components (11 files)
│   ├── Header.tsx                # Floating pill navbar (morphs on scroll, 1080px max-width, 60px border-radius, backdrop-blur)
│   ├── Footer.tsx                # Two-tier footer (trust badges + links + social icons incl. TikTok/YouTube SVGs)
│   ├── LayoutShell.tsx           # Conditional header/footer wrapper (hides on /creators/portal and /admin)
│   ├── CommunityFeed.tsx         # Curator.io social feed widget (client component, tabbed: Instagram/TikTok/YouTube)
│   ├── PricingCard.tsx           # Pricing tier card (dynamically imported on homepage)
│   ├── ProductCard.tsx           # Product display card
│   ├── ComparisonTable.tsx       # Plan comparison table
│   ├── CTASection.tsx            # Call-to-action section (used at bottom of homepage)
│   ├── FAQAccordion.tsx          # Expandable FAQ (dynamically imported on homepage)
│   ├── NewsletterSignup.tsx      # Email signup form (dynamically imported on homepage)
│   └── ClubBanner.tsx            # CULTR Club promo banner (dynamically imported on homepage)
│
├── sections/                     # Page section components (9 files — NOT imported anywhere, likely legacy/unused)
│   ├── Hero.tsx
│   ├── Services.tsx
│   ├── About.tsx
│   ├── HowItWorks.tsx
│   ├── Results.tsx
│   ├── Pricing.tsx
│   ├── Testimonials.tsx
│   ├── FAQ.tsx
│   └── Waitlist.tsx
│
├── intake/                       # Medical intake form components (13 files)
│   ├── index.ts                  # Barrel export
│   ├── PersonalInfoForm.tsx
│   ├── PhysicalMeasurementsForm.tsx
│   ├── CurrentMedicationsForm.tsx
│   ├── GLP1HistoryForm.tsx
│   ├── TreatmentPreferencesForm.tsx
│   ├── MedicationSelector.tsx
│   ├── ShippingAddressForm.tsx
│   ├── WellnessQuestionnaire.tsx
│   ├── ConsentForms.tsx
│   ├── IDUploader.tsx
│   ├── IntakeProgress.tsx
│   └── ReviewSummary.tsx
│
├── library/                      # Member library components (5 files)
│   ├── CategoryGrid.tsx          # Category navigation grid
│   ├── MasterIndex.tsx           # Full peptide/protocol index
│   ├── MemberDashboard.tsx       # Member dashboard widget
│   ├── ProductCatalog.tsx        # Product listing
│   └── TierGate.tsx              # Tier-based access control component
│
├── payments/                     # Payment provider components (6 files)
│   ├── PaymentMethodSelector.tsx # Payment method chooser (Stripe/Affirm/Klarna/Authorize.net)
│   ├── PaymentProviderLoader.tsx # Dynamic script loader for payment providers
│   ├── AffirmCheckoutButton.tsx  # Affirm BNPL checkout button
│   ├── KlarnaWidget.tsx          # Klarna payment widget
│   ├── AuthorizeNetForm.tsx      # Authorize.net credit card form
│   └── BNPLBadge.tsx             # "Buy Now Pay Later" badge
│
├── creators/                     # Creator portal components (6 files)
│   ├── CreatorHeader.tsx         # Portal header with performance metrics
│   ├── CreatorSidebar.tsx        # Portal navigation sidebar
│   ├── AnalyticsCharts.tsx       # Performance visualization (only file using Recharts)
│   ├── Leaderboard.tsx           # Creator rankings
│   ├── Milestones.tsx            # Achievement badge system
│   └── NotificationBell.tsx      # Real-time notification dropdown
│
├── dashboard/                    # Health dashboard components (2 files)
│   ├── BiologicalAgeCard.tsx     # Biological age display
│   └── BiomarkerTrends.tsx       # Biomarker trend charts
│
└── (legacy root-level — superseded by components/site/)
    ├── Footer.tsx
    ├── Navigation.tsx
    └── WaitlistForm.tsx
```

### Library Directory (`lib/`)
```
lib/
├── config/                       # Configuration files (11 files)
│   ├── affiliate.ts              # Affiliate types, commission config (10% direct, 20% cap), tier config, FTC disclosures
│   ├── asher-med.ts              # Asher Med API configuration
│   ├── links.ts                  # Centralized URL registry (social, internal routes, external services)
│   ├── payments.ts               # Payment provider configuration
│   ├── plans.ts                  # Membership tiers: Club ($0), Core ($199), Catalyst+ ($499), Concierge ($1099)
│   ├── product-catalog.ts        # Peptide product catalog with SKUs, prices (70% markup), stock status
│   ├── product-to-asher-mapping.ts # SKU → Asher Med product mapping
│   ├── products.ts               # Product definitions
│   ├── quiz.ts                   # Quiz question/answer configuration
│   └── social-proof.ts           # Testimonials, providers, trust metrics, trust badges
│
├── contexts/                     # React Context providers (2 files)
│   ├── CreatorContext.tsx         # Creator portal state (profile, metrics, auth)
│   └── intake-form-context.tsx   # Multi-step intake form state
│
├── creators/                     # Creator affiliate business logic (3 files)
│   ├── attribution.ts            # Cookie-based click tracking & attribution (30-day window)
│   ├── commission.ts             # Commission engine: 10% direct, 2-8% override, 20% total cap
│   └── db.ts                     # Creator database operations (Vercel Postgres)
│
├── invoice/                      # Invoice generation system (4 files)
│   ├── index.ts
│   ├── invoice-generator.tsx
│   ├── invoice-template.tsx
│   └── invoice-types.ts
│
├── lmn/                          # Lab Management Number system (5 files)
│   ├── index.ts
│   ├── lmn-eligibility.ts
│   ├── lmn-generator.tsx
│   ├── lmn-template.tsx
│   └── lmn-types.ts
│
├── payments/                     # Payment provider APIs (4 files)
│   ├── affirm-api.ts
│   ├── authorize-net-api.ts
│   ├── klarna-api.ts
│   └── payment-types.ts
│
├── stores/                       # State management (directory exists but empty)
│
├── analytics.ts                  # Analytics event tracking
├── asher-med-api.ts              # Asher Med API client (orders, patients, uploads)
├── auth.ts                       # JWT auth utilities (sign, verify, middleware)
├── (blog-content.ts removed Apr 2026 — blog deleted for LegitScript compliance)
├── calorie-calculator.ts         # Calorie calculation algorithms
├── cart-context.tsx              # Shopping cart React context
├── data-normalization.ts         # Data normalization utilities
├── db.ts                         # Database connection & query utilities (@vercel/postgres)
├── library-content.ts            # Library content loading & rendering
├── peptide-calculator.ts         # Peptide dosage calculator (syringe visualization)
├── protocol-templates.ts         # Treatment protocol templates
├── quickbooks.ts                 # QuickBooks Online OAuth2 integration (customers, invoices, payments)
├── rate-limit.ts                 # API rate limiting
├── resend.ts                     # Resend email service wrapper
├── resilience.ts                 # Retry patterns, circuit breaker for external APIs
├── turnstile.ts                  # Cloudflare Turnstile verification
├── utils.ts                      # cn() utility function (clsx + tailwind-merge)
└── validation.ts                 # Zod validation schemas
```

### Other Directories
```
migrations/                       # SQL database migrations (11 files)
├── 002_orders_table.sql
├── 003_lmn_table.sql
├── 004_payment_provider.sql
├── 005_rejuvenation_data.sql
├── 006_fix_constraints.sql
├── 007_stripe_idempotency.sql
├── 008_asher_med_tables.sql
├── 009_creator_affiliate_portal.sql
├── 010_club_orders.sql           # club_members + club_orders tables
├── 010_consult_requests.sql      # consult_requests table
└── 011_quickbooks_tokens.sql     # quickbooks_tokens OAuth storage

content/                          # Markdown content (gray-matter frontmatter)
├── (blog/ removed Apr 2026 — LegitScript compliance)
└── library/                      # Peptide library content (6 files)
    ├── index.md
    ├── bioregulators.md
    ├── growth-factors.md
    ├── metabolic.md
    ├── products.md
    └── repair-recovery.md

scripts/
└── run-migration.mjs             # Database migration runner

tests/                            # Test suite (Vitest + React Testing Library)
├── setup.ts                      # Test setup file
├── vitest.d.ts                   # Vitest type declarations
├── api/
│   └── protocol-generate.test.ts
├── components/
│   └── TierGate.test.tsx
├── integration/
│   └── protocol-engine.test.ts
└── lib/
    ├── auth.test.ts
    ├── library-content.test.ts
    ├── plans.test.ts
    └── protocol-templates.test.ts

public/                           # Static assets
├── cultr-health-logo.png         # Official CULTR Health logo (forest green on transparent)
├── og-image.png
├── robots.txt
├── llms.txt                      # LLM crawler info
├── images/                       # Hero & lifestyle images (14+ files)
│   ├── email-logo-cream.png      # Cream variant of official logo (for email dark backgrounds)
│   ├── hero-banner-desktop.png
│   ├── hero-banner-mobile.png
│   ├── hero-girls-warming-up.png
│   ├── hero-lifestyle-group.png
│   ├── hero-man-athletic.png
│   ├── hero-man-sunset.jpg
│   ├── hero-woman-running.jpg
│   ├── hero-women-lifestyle.png
│   ├── lifestyle-achievement.png
│   ├── lifestyle-girl-running.png
│   ├── lifestyle-man-smiling.png
│   ├── lifestyle-man-workout.jpg
│   ├── lifestyle-woman-running-new.jpg
│   └── lifestyle-woman-running.jpg
└── creators/brand-kit/           # Creator brand assets
    ├── cultr-brand-colors.json
    ├── cultr-logo-dark.png       # Official logo for creator downloads
    └── cultr-logo-white.png      # White variant for creator downloads
```

---

## Homepage Architecture (`app/page.tsx`)

The homepage is a single server component that builds all sections inline (does NOT import from `components/sections/`). It uses `next/dynamic` for lazy-loaded below-fold components.

**Section order:**
1. **Hero** — Full-bleed background image, gradient overlay, h1 tagline, subtext, dual CTA: "Take the Quiz" (primary Button) + "See Plans" (ghost Button with white border)
2. **Results / Lifestyle** — 3-column image grid (Confidence, Endurance, Freedom), "Find Your Protocol" CTA
3. **How It Works** — 3-step cards (Take the quiz → Talk to a provider → Get treated)
4. **Comparison Table** — CULTR vs. Standard Care (inline grid, 6 feature rows)
5. **Pricing Preview** — PricingCard components for each tier (dynamically imported)
6. **CULTR Club Banner** — Free tier promotion (dynamically imported)
7. **Trust & Testimonials** — Trust badges (TRUST_BADGES from social-proof.ts), star rating, testimonial cards, provider profiles
8. **FAQ** — 4-item FAQAccordion (dynamically imported)
9. **Newsletter** — NewsletterSignup (dynamically imported)
10. **Final CTA** — CTASection ("Stop guessing. Start optimizing.")

**Imports from `lib/config/social-proof.ts`:** TESTIMONIALS, PROVIDERS, TRUST_METRICS, TRUST_BADGES

---

## Key Features by Domain

### 1. Public Marketing Site
- **Pages:** Homepage, Pricing, How It Works, FAQ, Community, Quiz, Therapies, Tools
- **Science/Blog:** Removed Apr 2026 for LegitScript compliance (redirects to `/`)
- **Community (`app/community/page.tsx`):** Curator.io-powered social feed with tabbed layout (Instagram, TikTok, YouTube). Shows "Coming Soon" when feed IDs not configured in env vars.
- **LegitScript Compliance:** ConsentModal on checkout, FDA badges on therapy cards, ROSCA disclosure on pricing, state availability (48 states) on medical disclaimer, PrescriptionDisclaimer on therapies + pricing, LegitScript seal placeholder in footer (env: `NEXT_PUBLIC_LEGITSCRIPT_SEAL_ID`)

### 2. Membership Plans (defined in `lib/config/plans.ts`)
| Tier | Slug | Price | Best For | BNPL | Featured |
|---|---|---|---|---|---|
| **CULTR Club** | `club` | $0/mo | Education & discovery | No | No |
| **CULTR Core** | `core` | $199/mo | Single therapy (GLP-1 or TRT) | Yes | No |
| **CULTR Catalyst+** | `catalyst` | $499/mo | Peptide stacking & optimization | Yes | **Yes** |
| **CULTR Concierge** | `concierge` | $1,099/mo | White-glove, regenerative & executive care | Yes | No |

Stripe config includes customer portal (`bpc_1StZxKC1JUIZB7aRXhaSarRI`), coupon codes (FOUNDER15: 15% off forever, FIRSTMONTH: 50% off first month).

### 3. Patient Experience
- Multi-step medical intake forms (12 form components in `components/intake/`)
- ID upload, consent signature capture (presigned S3 URLs via Asher Med)
- Member dashboard with order tracking
- Renewal flow for recurring prescriptions

### 4. Members Library & Shop
- Peptide protocol library (metabolic, repair, growth factors, bioregulators)
- Dosing calculator with syringe visualization
- Calorie calculator
- Members shop with product catalog (peptides, blends, accessories — prices include 70% markup)
- Shopping cart with quote generation
- Tier-gated content access via `TierGate` component

### 5. Provider Tools
- Protocol builder (AI-powered via AI SDK, access-controlled by `PROTOCOL_BUILDER_ALLOWED_EMAILS`)
- Treatment planning interface

### 6. Creator Affiliate Portal (defined in `lib/config/affiliate.ts`)
- **Application:** Multi-step form with platform/social verification
- **Dashboard:** Real-time earnings, click tracking, conversion metrics
- **Tracking:** Custom links with cookie-based attribution (30-day window, cookie: `cultr_attribution`)
- **Coupon codes:** Unique discount codes with usage tracking
- **Commission engine:** 10% direct rate, 2-8% override (tiered by recruits), 20% total cap
- **Tiers:** Starter (0 recruits, 0% override) → Bronze (5, 2%) → Silver (10, 4%) → Gold (15, 6%) → Platinum (20, 8%)
- **Payouts:** Net-30 schedule, $50 minimum, Stripe Connect or bank transfer or PayPal
- **Commission approval:** 30-day delay (refund window) before approval
- **Campaigns:** Bonus commission campaigns
- **Leaderboard:** Creator rankings
- **Milestones:** Achievement badge system
- **FTC Compliance:** Built-in disclosure templates (short: `#ad #CULTRpartner`, standard, full)
- **Link destinations:** Homepage, Pricing, GLP-1 Info, Quiz, FAQ

### 7. Admin Panel
- Creator application review (approve/reject with reasons)
- Payout processing (batch payouts)
- Campaign management
- Order management & fulfillment
- Club orders management (expandable list, HMAC-protected one-click approval links)
- Analytics dashboard
- All admin actions logged in `admin_actions` table

### 8. Payment Processing
| Provider | Type | Usage |
|---|---|---|
| **Stripe** | Primary | Subscriptions, one-time payments, webhooks, customer portal |
| **Affirm** | BNPL | Buy Now Pay Later (sandbox/production toggle) |
| **Klarna** | BNPL | Buy Now Pay Later (sandbox/production toggle) |
| **Authorize.net** | Credit Card | Direct card processing |

Feature flags: `NEXT_PUBLIC_ENABLE_KLARNA`, `NEXT_PUBLIC_ENABLE_AFFIRM`

---

## Database Schema

### Core Tables
- **users** — Customer accounts
- **subscriptions** — Stripe subscription tracking
- **orders** — Patient orders and fulfillment status
- **intake_forms** — Medical intake data
- **lmns** — Lab Management Numbers

### Creator Affiliate Tables (8 tables, migration `009_creator_affiliate_portal.sql`)
- **creators** — Creator profiles, status (`pending`|`active`|`paused`|`rejected`), tier, override rate, payout method
- **affiliate_codes** — Unique referral codes (discount type: percentage|fixed, usage tracking)
- **tracking_links** — Generated tracking URLs with UTM parameters (source, medium, campaign)
- **click_events** — Click tracking data with attribution tokens, session IDs, IP hashes, expiry
- **order_attributions** — Order-to-creator mapping (method: link_click|coupon_code|manual, commission details)
- **commission_ledger** — Commission records (type: direct|override|adjustment, status: pending|approved|paid|reversed)
- **payouts** — Payout history (status: pending|processing|completed|failed)
- **admin_actions** — Audit log for all admin actions

### CULTR Club Tables (migration `010_club_orders.sql`)
- **club_members** — Club signups (email, name, phone, referral source, cookie token)
- **club_orders** — Club product orders (status: `pending`|`approved`|`rejected`, HMAC approval token)

### Integration Tables
- **quickbooks_tokens** — QuickBooks Online OAuth2 tokens (access + refresh, realm ID, expiry)

### Payment Tables
- **stripe_idempotency** — Stripe request idempotency (migration `007`)
- **payment_provider** — Multi-provider payment records (migration `004`)

### Other Tables
- **asher_med_tables** — Asher Med integration data (migration `008`)
- **rejuvenation_data** — Rejuvenation data (migration `005`)

---

## Authentication & Authorization

### User Types
| Role | Auth Method | Entry Route | Protected Area |
|---|---|---|---|
| **Patients/Members** | JWT via magic link | `/login` | `/library`, `/intake`, `/dashboard`, `/renewal` |
| **Providers** | JWT + email allowlist | `/login` | `/provider/protocol-builder` |
| **Creators** | Separate JWT (creator-specific) | `/creators/login` | `/creators/portal/*` |
| **Admins** | JWT + admin role check | `/admin` | `/admin/*` |

### Security
- JWT token authentication (`jose` library, HS256)
- HIPAA-compliant data handling (no PHI logging)
- Bot protection (Cloudflare Turnstile on forms)
- Secure file uploads (presigned URLs with expiration)
- Rate limiting on API endpoints (`lib/rate-limit.ts`)
- Resilience patterns for external APIs (`lib/resilience.ts`)
- Input sanitization (DOMPurify for rendered markdown)
- Club order approvals secured via HMAC-signed tokens (30-min expiry)

### Staging Authentication Bypass
On `staging.cultrhealth.com`, the magic link flow is bypassed for ease of testing:
- **Any email** returns the magic link token directly in the API response (no email sent)
- **Team emails** (`stewart@cultrhealth.com`, `erik@threepointshospitality.com`, + 3 others) are auto-provisioned: DB records created on first login, auto-approved as creators
- Controlled by checking `process.env.NEXT_PUBLIC_SITE_URL` for `staging` in the hostname

---

## Environment Variables

### Required
| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe API key (sk_test_... or sk_live_...) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification (whsec_...) |
| `POSTGRES_URL` | PostgreSQL connection string (Neon via Vercel Postgres) |
| `JWT_SECRET` | JWT token signing (32+ chars) |
| `SESSION_SECRET` | Session encryption (32+ chars) |
| `ASHER_MED_API_KEY` | Asher Med partner authentication |
| `ASHER_MED_PARTNER_ID` | Asher Med partner ID |
| `ASHER_MED_API_URL` | Asher Med endpoint (sandbox or production) |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (for redirects, emails) |

### Optional
| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Resend email service (re_...) |
| `FROM_EMAIL` / `FOUNDER_EMAIL` | Email sender addresses |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile bot protection |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Redis caching/rate limiting |
| `KLARNA_API_KEY` / `KLARNA_API_SECRET` / `KLARNA_API_URL` | Klarna BNPL |
| `NEXT_PUBLIC_KLARNA_CLIENT_ID` | Klarna client-side ID |
| `AFFIRM_PRIVATE_API_KEY` / `AFFIRM_API_URL` | Affirm BNPL |
| `NEXT_PUBLIC_AFFIRM_PUBLIC_KEY` / `NEXT_PUBLIC_AFFIRM_SCRIPT_URL` | Affirm client-side |
| `NEXT_PUBLIC_ENABLE_KLARNA` / `NEXT_PUBLIC_ENABLE_AFFIRM` | BNPL feature flags (true/false) |
| `PROTOCOL_BUILDER_ALLOWED_EMAILS` | Comma-separated provider access control |
| `STAGING_ACCESS_EMAILS` | Comma-separated, bypass subscription check for testing |
| `QUICKBOOKS_CLIENT_ID` / `QUICKBOOKS_CLIENT_SECRET` | QuickBooks Online OAuth2 app credentials |
| `QUICKBOOKS_REDIRECT_URI` | QuickBooks OAuth2 callback URL |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 measurement ID |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console verification |
| `NEXT_PUBLIC_LEGITSCRIPT_SEAL_ID` | LegitScript verification seal (post-certification) |
| `NEXT_PUBLIC_CURATOR_FEED_INSTAGRAM` | Curator.io Instagram feed ID |
| `NEXT_PUBLIC_CURATOR_FEED_TIKTOK` | Curator.io TikTok feed ID |
| `NEXT_PUBLIC_CURATOR_FEED_YOUTUBE` | Curator.io YouTube feed ID |
| `ASHER_MED_ENVIRONMENT` | production or sandbox |

---

## Build & Development Commands

```bash
# Install dependencies
npm install

# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Production server (requires build)
npm start

# Lint (ESLint with Next.js config)
npm run lint

# Bundle analysis
npm run analyze     # ANALYZE=true next build

# Run tests (Vitest)
npm test
npm test -- --watch
npm test -- --coverage

# Run database migration
node scripts/run-migration.mjs

# Setup Stripe products (one-time)
npm run setup:stripe
```

### Vitest Configuration (`vitest.config.js`)
- Environment: `jsdom`
- Plugin: `@vitejs/plugin-react`
- Setup file: `tests/setup.ts`
- Test files: `tests/**/*.test.{ts,tsx}`
- Coverage: V8 provider, reports text/json/html, includes `lib/**/*.ts` and `app/**/*.{ts,tsx}`
- Path alias: `@/` maps to project root (`__dirname`)

---

## Deployment

### Branch Strategy
| Branch | Environment | URL |
|---|---|---|
| `production` | Production | cultrhealth.com |
| `staging` | Staging | staging.cultrhealth.com + join.cultrhealth.com |
| `main` | Base branch (for PRs) | — |

**Note:** `join.cultrhealth.com` is a Vercel domain alias for the `staging` deployment. The `middleware.ts` rewrites the join host root path (`/`) to `/join` and lets non-root join paths pass through unchanged.

### Deployment Flow
1. Push to `staging` or `production` branch
2. Vercel auto-builds and deploys
3. Environment variables configured per environment in Vercel dashboard
4. Database migrations run manually via `node scripts/run-migration.mjs`

### next.config.js Settings
- `reactStrictMode: true`
- `removeConsole` in production builds
- `optimizePackageImports: ['lucide-react']`
- Image formats: AVIF + WebP
- Caching headers:
  - HTML pages: `public, max-age=0, s-maxage=60, stale-while-revalidate=0` (always fresh)
  - Images/fonts: `public, max-age=31536000, immutable` (1 year cache)
- Redirects: `/products` → `/pricing`, `/products/*` → `/pricing`, `/join` → `/pricing`, `/science` → `/`, `/science/*` → `/` (all 301 permanent)

---

## Navigation & Layout Architecture

### Header (`components/site/Header.tsx`)
Floating pill navbar that morphs on scroll via `requestAnimationFrame`:
- **Trigger:** `window.scrollY > 50`
- **Unscrolled:** Full-width bar, `bg-brand-cream/[0.97]`, `h-[68px]`, `rounded-none`, `backdrop-blur-sm`
- **Scrolled:** Floating pill, `max-w-[1080px]`, `bg-brand-cream/[0.88]`, `h-[54px]`, `rounded-[60px]`, `backdrop-blur-[20px]`, shadow
- **Left nav links:** Take the Quiz (`/quiz`), Pricing (`/pricing`), Therapies (`/therapies`), How It Works (`/how-it-works`), Tools (`/tools`)
- **Right nav links:** Members (`/library`, has ChevronDown dropdown indicator), Creators (`/creators`), Community (`/community`)
- **Active state:** Current route highlighted with `bg-brand-primary/[0.08]` rounded bg on matching nav link
- **CTA:** "Get Started" button (links to `/quiz`, `bg-brand-primary`, `rounded-full`, `text-white`)
- **Logo:** "CULTR" text with "Health" subtitle that fades out on scroll (opacity → 0, max-h → 0)
- **Mobile:** Animated 3-bar hamburger → drawer, locks body scroll (`document.body.style.overflow = 'hidden'`)

### Layout Shell (`components/site/LayoutShell.tsx`)
- Shows Header + Footer on all routes
- **HIDE_CHROME_PREFIXES:** `/creators/portal`, `/admin`, `/join-club`
- Main content: `pt-20 min-h-[calc(100vh-80px)]` when chrome is visible, `min-h-screen` when hidden

### Creator Portal Layout (`app/creators/portal/layout.tsx`)
- Uses `CreatorSidebar` for navigation
- Uses `CreatorHeader` for top bar with performance metrics
- Wrapped in `CreatorContext` provider for shared state

### Centralized Links (`lib/config/links.ts`)
```typescript
LINKS = {
  asherPartnerPortal: 'https://asherweightloss.com',
  stripeCustomerPortal: 'https://billing.stripe.com/p/login/...',
  supportEmail: 'support@cultrhealth.com',
  instagram: 'https://instagram.com/cultrhealth',
  twitter: 'https://twitter.com/cultrhealth',
  tiktok: 'https://tiktok.com/@cultrhealth',
  youtube: 'https://youtube.com/@cultrhealth',
  login: '/login',
  pricing: '/pricing',
  success: '/success',
}
```

---

## Agents, Skills, and Plugins

### Claude Code Configuration (`.claude/`)
```
.claude/
├── commands/
│   └── pre-deploy.md             # /pre-deploy slash command — full 12-step deployment checklist
├── hooks/
│   ├── run-tests.sh
│   ├── type-check.sh
│   ├── code-audit.sh
│   └── marketing-check.sh
└── settings.local.json           # Local permission settings
```

### Slash Commands (`.claude/commands/`)
| Command | Description |
|---|---|
| `/pre-deploy` | 12-step pre-deployment checklist: TypeScript, tests, lint, console stmts, HIPAA scan, secrets check, build, env vars, site health, git status, DB migrations, bundle size. Outputs PASS/FAIL/WARN summary table with READY/BLOCKED verdict. Accepts optional arg: `staging` (default) or `production`. |

**Allowed permissions** (`.claude/settings.local.json`):
- `WebFetch` for: docs.klarna.com, docs.affirm.com, docs.google.com, Google Sheets (doc-08-68-sheets.googleusercontent.com)
- `WebSearch` — enabled globally
- `Bash` for: `npx tsc`, `npx next dev`, `xargs kill`, `git status`, `vercel` (all subcommands), `git add`, `git commit`, `git push`

### PostToolUse Hooks (`.claude/hooks/`)
Three hooks run automatically after every `Write` or `Edit` tool call on `.ts`/`.tsx` files:

| Hook | Script | Timeout | What it does |
|---|---|---|---|
| **Test** | `run-tests.sh` | 120s | Runs `npx vitest run` — blocks Claude (exit 2) if tests fail |
| **Simulation** | `type-check.sh` | 60s | Runs `npx tsc --noEmit` — blocks Claude if type errors found in changed file |
| **Code Audit** | `code-audit.sh` | 60s | ESLint + console.log detection + HIPAA PHI logging check + hardcoded secrets scan + TODO/FIXME markers — blocks on lint errors, PHI risks, or secrets |

**Hook behavior:**
- Hooks only trigger for `.ts`/`.tsx` files (skip configs, markdown, images)
- Test hook skips test files themselves (prevents infinite loops)
- Exit code `0` = pass (Claude continues), exit code `2` = block (Claude must fix before proceeding)
- Configured in `.claude/settings.local.json` under `hooks.PostToolUse`

### MCP Server Configuration (`.cursor/mcp.json`)
Currently empty (`"mcpServers": {}`). MCP servers can be configured here for Cursor IDE integration.

### Claude-Mem Plugin (MCP — Persistent Memory)
Cross-session memory database available via MCP tools for recalling past work, decisions, and research:

| Tool | Purpose |
|---|---|
| `mcp__plugin_claude-mem_mcp-search__search` | Search past observations by query, project, type, date range |
| `mcp__plugin_claude-mem_mcp-search__timeline` | Get context around a specific observation (anchor ID or query) |
| `mcp__plugin_claude-mem_mcp-search__get_observations` | Fetch full details for specific observation IDs |
| `mcp__plugin_claude-mem_mcp-search__save_memory` | Save new observations/memories |

**3-Layer Workflow (always follow):**
1. `search(query)` → Get index with IDs (~50-100 tokens/result)
2. `timeline(anchor=ID)` → Get context around interesting results
3. `get_observations([IDs])` → Fetch full details ONLY for filtered IDs
Never fetch full details without filtering first. 10x token savings.

**Observation types:** `session-request`, `bugfix` (red), `feature` (purple), `refactor`, `change`, `discovery` (blue), `decision`

### Available Skills (invoked via Skill tool)
| Skill | Trigger | Description |
|---|---|---|
| `keybindings-help` | User asks about keyboard shortcuts, rebinding keys | Customize `~/.claude/keybindings.json` |
| `codex` | "Use codex to...", "codex exec", "codex resume" | Delegate code analysis, refactoring, or automated editing to OpenAI Codex CLI |
| `claude-mem:do` | "Execute this plan" | Execute an implementation plan using subagents |
| `claude-mem:make-plan` | "Make a plan for..." | Create an implementation plan with documentation discovery |
| `claude-mem:mem-search` | "Did we already solve this?", "How did we do X last time?" | Search persistent cross-session memory database |

### Codex CLI Skill (`~/.claude/skills/codex/`)
**Prerequisite:** OpenAI Codex CLI installed globally (`npm install -g @openai/codex`)
- **Models:** `gpt-5.3-codex-spark` (default/fast), `gpt-5.3-codex` (balanced), `gpt-5.2` (legacy)
- **Reasoning effort:** `xhigh`, `high`, `medium`, `low`
- **Sandbox modes:** `read-only` (analysis), `workspace-write` (local edits), `danger-full-access` (unrestricted)
- **Resume sessions:** `echo "prompt" | codex exec --skip-git-repo-check resume --last 2>/dev/null`
- **Always uses:** `--skip-git-repo-check`, `--full-auto`, `2>/dev/null` (suppress thinking tokens)
- **Critical:** Treat Codex output as colleague feedback, not authority — verify against your own knowledge

### IDE Diagnostics (MCP)
| Tool | Purpose |
|---|---|
| `mcp__ide__getDiagnostics` | Get language diagnostics from VS Code (TypeScript errors, warnings) |
| `mcp__ide__executeCode` | Execute Python code in Jupyter kernel |

### TypeScript Expert Agent (`.agents/skills/typescript-expert/`)
**Trigger:** Any TypeScript/JavaScript issue — type gymnastics, build performance, debugging, architectural decisions.

**SKILL.md Configuration:**
- **Name:** `typescript-expert`
- **Category:** Framework
- **Display:** TypeScript (blue)
- **Bundle:** `[typescript-type-expert, typescript-build-expert]`

**Capabilities:**
- Project setup analysis (TypeScript/Node versions, tooling ecosystem, monorepo detection)
- Advanced type system expertise (branded types, conditional types, template literal types, mapped types)
- Type checking & build performance optimization (skipLibCheck, incremental, project references)
- Migration expertise (JS→TS, CJS→ESM, ESLint→Biome, linter migration decision matrices)
- Complex error resolution ("inferred type cannot be named", "excessive stack depth", module resolution)
- Monorepo management (Nx vs Turborepo decision matrix, project references)
- Modern tooling (Biome vs ESLint, Vitest type testing)
- Code review checklist (type safety, performance, module system, error handling)

**Sub-specializations (delegate when appropriate):**
| Sub-agent | Use When |
|---|---|
| `typescript-build-expert` | Deep webpack/vite/rollup bundler internals |
| `typescript-module-expert` | ESM/CJS migration, circular dependency analysis |
| `typescript-type-expert` | Type performance profiling, compiler internals |

**Reference Files:**
| File | Path | Description |
|---|---|---|
| TypeScript Cheatsheet | `.agents/skills/typescript-expert/references/typescript-cheatsheet.md` | Quick reference: primitives, generics, utility types, conditional types, template literals, mapped types, type guards, branded types, discriminated unions, module declarations, tsconfig essentials |
| Utility Types Library | `.agents/skills/typescript-expert/references/utility-types.ts` | Reusable type library: Brand, Result/Option types, Deep* utilities (DeepReadonly, DeepPartial, DeepRequired, DeepMutable), object utilities (KeysOfType, PickByType, PartialBy, Merge), array utilities (NonEmptyArray, Tuple), function utilities (AsyncFunction, Promisify), string utilities (Split, Join, PathOf), union utilities (UnionToIntersection, UnionToTuple), validation (AssertEqual, IsNever, IsAny), JSON utilities (JsonValue, Jsonify), exhaustive check helpers |
| Strict TSConfig | `.agents/skills/typescript-expert/references/tsconfig-strict.json` | Maximum strictness template: all strict flags, noUncheckedIndexedAccess, exactOptionalPropertyTypes, ESNext module, bundler resolution, ES2022 target, path aliases |
| Diagnostic Script | `.agents/skills/typescript-expert/scripts/ts_diagnostic.py` | Python script: checks TypeScript/Node versions, analyzes tsconfig settings, detects tooling (Biome/ESLint/Prettier/Vitest/Jest/Turborepo/Nx), monorepo check, `any` usage count, type assertion count, type check performance metrics |

### TypeScript Advanced Types Skill (`.agents/skills/typescript-advanced-types/`)
**Trigger:** Complex type-level programming, generic components, type-safe APIs, form validation.

**SKILL.md Covers:**
- Generics (basic, constrained, multiple type params)
- Conditional types (basic, distributive, nested, infer keyword)
- Mapped types (basic, key remapping, filtering)
- Template literal types (string manipulation, path building)
- Utility types (all built-in: Partial, Required, Pick, Omit, Record, Extract, Exclude, NonNullable, ReturnType, Parameters, Awaited)
- Advanced patterns:
  1. Type-safe event emitter
  2. Type-safe API client (path + method → response type)
  3. Builder pattern with compile-time completeness check
  4. Deep Readonly/Partial
  5. Type-safe form validation
  6. Discriminated unions + state machines
- Type inference techniques (infer keyword, type guards, assertion functions)
- Type testing (AssertEqual, ExpectError)

### Ralph Autonomous Development Agent (`.ralph/`)
Ralph is an autonomous AI development loop system installed in this project for continuous development cycles.

**Configuration Files:**
```
.ralph/
├── PROMPT.md                     # Development instructions (project type: TypeScript/Next.js)
├── AGENT.md                      # Build/run instructions (npm install, npm run dev, npm test)
├── ARCHITECTURE.md               # Full architecture documentation (tech stack, structure, integrations)
├── fix_plan.md                   # Prioritized task list with checkboxes
├── progress.json                 # Loop progress: {"status": "completed", "timestamp": "..."}
├── status.json                   # Real-time: loop_count, calls_made, last_action, exit_reason
├── logs/                         # Execution logs (timestamped)
├── .call_count                   # API call counter
├── .circuit_breaker_state        # Circuit breaker state (CLOSED/HALF_OPEN/OPEN)
├── .circuit_breaker_history      # Circuit breaker transition history
├── .ralph_session                # Current session ID
├── .ralph_session_history        # Session transition history
├── .loop_start_sha               # Git SHA at loop start
├── .last_reset                   # Last rate limit reset time
└── .exit_signals                 # Exit signal tracking
```

**Project Configuration (`.ralphrc`):**
```bash
PROJECT_NAME="cultr-waitlist"
PROJECT_TYPE="typescript"
MAX_CALLS_PER_HOUR=100
CLAUDE_TIMEOUT_MINUTES=15
CLAUDE_OUTPUT_FORMAT="json"
ALLOWED_TOOLS="Write,Read,Edit,Bash(git *),Bash(npm *),Bash(pytest),Bash(ls *),Bash(cd *),Bash(cat *),Bash(echo *),Bash(mkdir *),Bash(rm *),Bash(mv *),Bash(cp *),Bash(node *),Bash(npx *)"
SESSION_CONTINUITY=true
SESSION_EXPIRY_HOURS=24
TASK_SOURCES="github,local"
GITHUB_TASK_LABEL="ralph-task"
CB_NO_PROGRESS_THRESHOLD=3
CB_SAME_ERROR_THRESHOLD=5
CB_OUTPUT_DECLINE_THRESHOLD=70
```

**Ralph Status Reporting:** Each loop iteration ends with a `RALPH_STATUS` block containing STATUS, TASKS_COMPLETED, FILES_MODIFIED, TESTS_STATUS, WORK_TYPE, EXIT_SIGNAL, and RECOMMENDATION.

**Full Ralph Documentation:** See `ralph-claude-code/CLAUDE.md` for comprehensive Ralph system docs including loop architecture, exit detection (dual-condition: completion indicators + EXIT_SIGNAL gate), circuit breaker patterns (auto-recovery, cooldown timer), session management, CLI configuration, test suite (490 tests), and library components.

---

## Development Guidelines

### Self-Correcting CLAUDE.md Rule
**Every time Claude gets something wrong about this project — a wrong file path, incorrect assumption, outdated pattern, misunderstood convention — add the correction directly to CLAUDE.md.** Do not just re-prompt or fix inline. Update this file so the correction persists across every future session, every subagent, and every teammate. Over time, CLAUDE.md becomes a precision-tuned instruction set that makes Claude increasingly effective. This applies to all contributors: when you spot Claude making a recurring mistake, codify the fix here.

### Code Standards
- TypeScript (tsconfig has `strict: false`, `allowJs: true` — be aware of loose type checking)
- Path alias: `@/*` maps to project root (defined in both `tsconfig.json` and `vitest.config.js`)
- Module resolution: `node` (NOT `bundler`)
- Functional React components with hooks (no class components)
- Tailwind utility-first CSS (no CSS modules or styled-components)
- Import pattern: React/Next → external libs → internal (`@/lib`, `@/components`)

### Key Patterns
- **Server/Client split:** Pages are server components by default; interactive parts extracted to `*Client.tsx` files (e.g., `QuizClient.tsx`, `IntakeFormClient.tsx`, `ShopClient.tsx`)
- **Dynamic imports:** Homepage uses `next/dynamic` for below-fold components (PricingCard, FAQAccordion, ClubBanner, NewsletterSignup) with loading skeletons
- **Button variants:** `primary` (forest bg, cream text), `secondary` (transparent, forest border), `ghost` (transparent, forest text). All use `rounded-full`. Has `isLoading` prop with built-in spinner. Managed via manual variant objects + `cn()` utility, NOT CVA.
- **Context providers:** State shared via React Context (`CreatorContext`, `IntakeFormContext`, `CartContext`)
- **API route pattern:** All API routes in `app/api/` follow Next.js App Router convention (`route.ts` with named exports `GET`, `POST`, etc.)
- **Markdown content:** Library content stored as `.md` files in `content/library/` with gray-matter frontmatter, rendered via `marked`, sanitized via DOMPurify. Blog content removed Apr 2026.
- **Social proof data:** Testimonials, providers, trust metrics, trust badges centralized in `lib/config/social-proof.ts`
- **Join catalog source:** `join.cultrhealth.com` product cards are driven by `lib/config/join-therapies.ts`; restoring `/join` page components alone does not restore the legacy join catalog.
- **Join catalog pricing:** Change retail amounts in `lib/config/join-therapies.ts` only; update any internal markdown that duplicates those dollar figures (e.g. `Peptides-Growth-Factors.md`, `Verification-Checklist.md`) and record the change in `CHANGELOG.md`.
- **Admin Analytics:** When querying admin analytics for coupon stats or creator commissions, ALWAYS combine data from `club_orders` (for club checkouts) AND `order_attributions` (for main site Stripe checkouts) using `UNION ALL` or similar to ensure no revenue or redemptions are missed.
- **Lifetime SQL Metrics:** When calculating "lifetime" metrics alongside period metrics in the same query, apply the date interval constraint conditionally per column (e.g., `SUM(CASE WHEN created_at >= ... THEN amount ELSE 0 END)`) rather than filtering the entire table in the `WHERE` clause.
- **Intake checkout linkage:** Preserve checkout `session_id` across `/success` → `/onboarding` → `/intake` → `/login` so custom intake submissions can reattach to the originating `pending_intakes` row. `app/api/intake/submit` must also fall back to the latest pending intake by authenticated email when the session id is absent.
- **Intake scheduling handoff:** After a successful custom intake submission, redirect to `/onboarding` with `next=schedule` while preserving `session_id` when present. `OnboardingClient` must keep the schedule CTA active even if `/api/onboarding/status` is stale or temporarily unavailable.
- **Member magic-link fallback:** `app/api/auth/verify/route.ts` must default post-login redirects to `/dashboard`, not `/members`, because `/members` is not a valid landing page.
- **Creator staging login rate limit:** `app/api/creators/magic-link/route.ts` must skip magic-link rate limiting for staging/dev bypass emails so Safari/WebKit retries and E2E logins do not fail spuriously.
- **Intake payload compatibility:** Custom intake submissions must persist `dateOfBirth`, `gender`, structured `shippingAddress`, `personalInformation`, and `medicationPackages` inside `pending_intakes.intake_data`; downstream member, portal, and medical-record readers rely on those keys.
- **Club visitor session:** `cultr_club_visitor` is a signed minimal session token used only to recover the join member record server-side. Never store full club profile data (phone, address, age, gender) in client-readable cookies or localStorage, and never trust raw browser JSON for member hydration.
- **Join coupon precedence:** Built-in `CLUB_COUPONS` values shadow DB coupon rows on `join.cultrhealth.com`; admin-created affiliate/company codes must not reuse those normalized values.
- **Admin coupon removal:** Permanently delete coupon codes only when they have no historical usage and no `order_attributions` references. Otherwise deactivate them so creator ROI and attribution history remain intact.

### HIPAA Compliance
- Never log PHI (Protected Health Information)
- Sanitize user input (DOMPurify for rendered content)
- Use HTTPS for all communications
- Encrypt sensitive data at rest
- Presigned URLs for file uploads (expiring)

### Testing
- **Framework:** Vitest ^4.0.18 with React Testing Library
- **Coverage target:** Critical user paths (auth, checkout, intake forms)
- **Test location:** `tests/` directory organized by type (`api/`, `components/`, `integration/`, `lib/`)
- **Run:** `npm test`
- **7 test files** covering: auth, plans, protocol templates, library content, TierGate component, protocol generation API, protocol engine integration

---

## Cursor IDE Rules (`.cursorrules`)

An exhaustive `.cursorrules` file exists at the project root with 23 sections of guardrails for Cursor AI. It is automatically loaded by Cursor for all AI interactions and covers:

- **Tech stack lock** — explicit "DO NOT introduce" list preventing dependency drift
- **HIPAA compliance** — mandatory rules with correct/incorrect code examples
- **Database rules** — @vercel/postgres NUMERIC coercion, SQL patterns (make_interval, IS DISTINCT FROM, COUNT(*)::integer, ::float8)
- **Brand design system** — color tokens, typography, undefined tokens to avoid (cultr-copper, cultr-charcoal)
- **Deployment safety** — `vercel --prod` incident prevention, branch strategy
- **Code patterns** — server/client split, imports, Button usage, cn() utility, API route template, auth functions
- **Known bugs** — 8 previously fixed bugs with "DO NOT reintroduce" warnings
- **Common mistakes** — explicit DO/DON'T guardrails checklist
- **Domain-specific** — membership tiers/pricing, creator affiliate system, consultations, QuickBooks, email rules

**Keep `.cursorrules` in sync with CLAUDE.md** — when adding new patterns or fixing bugs, update both files.

---

## Known Technical Debt

### Legacy/Deprecated Code
- **Root-level components** (`components/Footer.tsx`, `components/Navigation.tsx`, `components/WaitlistForm.tsx`) — Legacy, superseded by `components/site/` equivalents.
- **`components/sections/`** (9 files: Hero, Services, About, HowItWorks, Results, Pricing, Testimonials, FAQ, Waitlist) — NOT imported anywhere. The homepage builds all sections inline in `app/page.tsx`. These are legacy/unused.
- **`class-variance-authority`** — Listed in `package.json` dependencies but never imported or used.
- **`lib/stores/`** — Directory exists but is empty.

### Configuration Notes
- `strict: false` in `tsconfig.json` — not running in strict TypeScript mode
- `moduleResolution: "node"` — using legacy Node resolution, not modern `bundler` resolution
- No `middleware.ts` — no edge middleware configured
- No `vercel.json` — using defaults + `next.config.js` headers/redirects
- Database is Neon PostgreSQL (not native Vercel Postgres), accessed via `@vercel/postgres` SDK

---

## File Summary Statistics

| Category | Count |
|---|---|
| Page routes | ~45 pages |
| API endpoints | 72 routes |
| React components | 61 files |
| Library/utility files | 49 files |
| Database migrations | 8 SQL files |
| Content (library only, blog removed) | 6 markdown files |
| Tests | 8 test files |
| Public assets | 22 files |
| Config files (root) | ~29 files |
| Agent/skill files | 8 files |
| Ralph config files | 18 files |
| **Total source files** | **~400+ files** |
