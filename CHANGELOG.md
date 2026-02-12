# Changelog

All notable changes to the Cultr Health Website project are documented in this file.

---

## [2026-02-12] - Shop Product Descriptions, Homepage Polish & Brand Consistency

### Added

#### Quick Order Shop (`/library/shop`)
- **Product benefit descriptions** — added concise 1-2 sentence benefit descriptions to all 58 peptide products in the catalog covering mechanism of action and target use case
- **Desktop hover tooltips** — hovering over a product thumbnail reveals a tooltip with the benefit description (dark green bg, white text, fade-in animation)
- **Mobile inline descriptions** — descriptions display inline below the product name on mobile (capped at 2 lines via `line-clamp-2`)
- **Brand color consistency** — updated Quick Order component to use consistent brand color classes throughout

### Changed

#### Homepage
- **Hero section** — updated gradient overlay opacity and CTA button visibility
- **Section ordering** — repositioned creator CTA, pricing, and testimonials sections
- **Removed** — hero feature badges and foam green section for cleaner layout
- **Image alignment** — fixed vertical alignment issues in hero banner

#### Footer
- **Brand consistency** — updated footer to match homepage design system

### Files Modified
- `lib/config/product-catalog.ts` — added `description` field to all 58 products with benefit summaries
- `app/library/shop/QuickOrderClient.tsx` — added hover tooltip (desktop) and inline description (mobile) UI
- `app/page.tsx` — homepage section reordering and hero polish
- `app/globals.css` — brand style updates
- `components/site/Footer.tsx` — footer brand alignment
- `app/library/shop/page.tsx` — shop page updates

---

## [2026-02-11] - Hero Image Update & OG Social Sharing Improvements

### Changed

#### Homepage Hero
- **Hero image** — replaced lifestyle group photo with "girls warming up" athletic lifestyle photo featuring diverse women in activewear with large "CULTR" text backdrop
- **Hero layout** — changed from 2-column grid (text left, image right on desktop) to full-width background image approach for better visual impact
- **Image positioning** — uses `object-cover` with `object-[center_20%]` on mobile to keep subjects visible on smaller screens
- **Gradient overlay** — added left-to-right gradient overlay (`from-cultr-forest/80` via `cultr-forest/40` to `transparent`) for text legibility while showcasing the full image
- **Hero height** — responsive height: `min-h-[600px]` (mobile), `min-h-[700px]` (tablet), `min-h-[85vh]` (desktop)

#### Social Sharing (iMessage/Twitter/LinkedIn)
- **OG images** — replaced dynamic text-only generator (`opengraph-image.tsx`) with static 1200x630 hero photo
- **Twitter card** — replaced dynamic text-only generator (`twitter-image.tsx`) with static 1200x630 hero photo
- **Share thumbnails** — links shared in iMessage, Slack, Twitter, LinkedIn now display the girls warming up photo instead of plain "CULTR" text

### Fixed

#### Cache Control
- **HTML page caching** — added `Cache-Control: public, max-age=0, s-maxage=60, stale-while-revalidate=0` header to prevent users from seeing stale cached content
- **CDN behavior** — CDN revalidates every 60 seconds and never serves stale content to end users (fixes "old site still showing" issue)

### Files Modified
- `app/page.tsx` — hero section layout redesign
- `next.config.js` — added HTML page cache-control headers
- `public/images/hero-girls-warming-up.png` — new hero image
- `app/opengraph-image.png` — static OG image (was `opengraph-image.tsx` - dynamic)
- `app/twitter-image.png` — static Twitter card image (was `twitter-image.tsx` - dynamic)

### Files Deleted
- `app/opengraph-image.tsx` — removed dynamic OG image generator
- `app/twitter-image.tsx` — removed dynamic Twitter card generator

---

## [2026-02-10] - Brand Typography, Homepage Redesign, Creator Resources & Navbar Update

### Fixed
- **Brand typography site-wide** — Playfair Display (`font-display`) was not applying to heading-like text in non-semantic elements (`div`, `span`, `td`, `th`). Added `th` to the CSS base layer heading rule in `globals.css` and added `font-display` to 20+ individual elements across 11 files: trust badges, lifestyle image badges, step labels, pricing badges, mobile menu section headers, footer trust badges, quiz labels, and comparison table headers.

### Changed

#### Homepage
- **Hero image** — replaced with group lifestyle activewear photo
- **Hero heading** — now reads "Real results. No nonsense."
- **"How It Works" heading** — changed to "Three steps to *rebrand* yourself." with italicized "rebrand"
- **Removed "What's included" features grid section** entirely
- **"How It Works" background** — changed from `bg-white` to `bg-cultr-offwhite` for better visual separation from adjacent Comparison Table section
- **Removed star ratings/reviews** from trust badge bar

#### Navbar
- **Logo** — now displays stacked "CULTR" with "Health" subtitle underneath, right-aligned
- **Scroll animation** — "Health" subtitle fades out and collapses (opacity + max-height transition) when navbar enters compact pill mode on scroll

#### Spacing (site-wide)
- **Hero sections**: `py-32 md:py-44` → `py-20 md:py-28` (homepage, pricing, how-it-works, creators)
- **Content sections**: `py-32` → `py-16 md:py-20`
- **Section headings**: `mb-20` → `mb-12`
- **CTA sections**: `py-20` → `py-12`

### Added

#### Creator Portal Resources
- **Dynamic resource pages** — all 16 resource cards in the creator portal are now clickable with full content at `/creators/portal/resources/[slug]`
  - **Content Kit**: Short-Form Hooks, Long-Form Scripts, Email Templates, Caption Templates
  - **Brand Assets**: Logo Pack, Brand Colors, Photography, Brand Guidelines
  - **Compliance**: FTC Disclosure Guide, Approved Claims, Health Claims Policy, Terms of Service
  - **Education**: GLP-1 Overview, Peptide Protocols, Membership Tiers, FAQ Cheat Sheet
- **`app/creators/portal/resources/[slug]/page.tsx`** — dynamic route with copy-to-clipboard functionality for templates and color swatches, 404 handling for unknown slugs

### Files Modified
- `app/globals.css` — added `th` to base heading font rule
- `app/page.tsx` — hero image, heading, removed sections, font-display fixes, spacing
- `app/how-it-works/page.tsx` — font-display fix, spacing
- `app/pricing/page.tsx` — spacing
- `app/creators/page.tsx` — font-display fix, spacing
- `app/science/page.tsx` — font-display fixes
- `app/quiz/QuizClient.tsx` — font-display fixes
- `app/creators/portal/resources/page.tsx` — made cards clickable with Links
- `components/site/Header.tsx` — logo redesign, font-display fixes
- `components/site/Footer.tsx` — font-display fix
- `components/site/ComparisonTable.tsx` — font-display fix
- `components/site/PricingCard.tsx` — font-display fix
- `components/site/ClubBanner.tsx` — font-display fix
- `public/images/hero-lifestyle-group.png` — replaced image file

### Files Added
- `app/creators/portal/resources/[slug]/page.tsx` — creator resource detail pages

---

## [2026-02-08b] - Floating Pill Navbar, Button Fixes & Deployment Setup

### Added
- **"Creators" nav link** in site header navigation for Creator program discoverability
- **Scroll-to-pill navbar animation** — full-width bar morphs into a centered floating pill (1080px max, 60px border-radius) on scroll with backdrop blur and elevated shadow
- **Scroll-reactive sizing** — logo, nav links, CTA button, and navbar height all shrink smoothly on scroll using 0.5s cubic-bezier transitions
- **Animated mobile hamburger** — three-bar icon animates to X with rotation transforms (replaces icon swap)
- **Mobile drawer** — full-screen overlay below navbar with grouped sections, uppercase labels, and Sign In + Get Started CTAs
- **Brand-cream navbar backgrounds** — `brand-cream/[0.97]` (unscrolled) and `brand-cream/[0.88]` (scrolled pill) with backdrop blur for readability over dark hero sections

### Fixed
- **Catalyst+ "Join" button invisible** — added white text/border overrides for the featured pricing card's secondary button on dark background
- **Creator "Apply Now" button invisible** — same fix on /creators page bottom CTA section
- **Navbar invisible over dark sections** — fixed invalid Tailwind opacity syntax (`bg-white/97` → `bg-white/[0.97]`) that caused transparent backgrounds

### Changed
- **Site header redesign** — replaced underline hover animation with rounded bg-fill hover, replaced Button component CTA with inline styled pill button
- **Nav link hover style** — bg-fill on hover (`bg-brand-primary/[0.07]`) instead of expanding underline
- **Creator login/apply/pending pages** now show site-wide navbar and footer (removed from `HIDE_CHROME_PREFIXES`)
- **Homepage hero images** updated from athletic man to women lifestyle photo across hero, mobile, and results sections
- **Logo** simplified to "CULTR" only (removed "Health" suffix from navbar)
- **Waitlist site** (production) — moved "HEALTH" text slightly down below CULTR logo (`-mt-2` → `mt-1`)

### Deployment
- **staging.cultrhealth.com** — configured as Vercel alias for staging branch deployments
- **cultrhealth.com** — remains on waitlist (production branch), rolled back after accidental prod deploy

---

## [2026-02-08] - Creator Affiliate Portal & Homepage Updates

### Added

#### Creator Affiliate Portal (Full V1)
- **Database Schema** - 8 new tables: creators, affiliate_codes, tracking_links, click_events, order_attributions, commission_ledger, payouts, admin_actions
  - **`migrations/009_creator_affiliate_portal.sql`** - Complete migration with indexes and constraints
- **Backend Libraries**
  - **`lib/creators/db.ts`** - Creator CRUD, tracking links, affiliate codes, commission queries, payout management
  - **`lib/creators/attribution.ts`** - Click tracking, cookie management, attribution logic, email redaction
  - **`lib/creators/commission.ts`** - Commission calculation engine with 20% cap, override system, refund reversal
  - **`lib/config/affiliate.ts`** - Affiliate configuration (rates, tiers, thresholds, type definitions)
  - **`lib/contexts/CreatorContext.tsx`** - React context for portal state management
- **Creator API Routes (13 endpoints)**
  - **`app/api/creators/apply/route.ts`** - Application submission with rate limiting
  - **`app/api/creators/verify-email/route.ts`** - Email verification with magic link
  - **`app/api/creators/magic-link/route.ts`** - Creator-specific passwordless login
  - **`app/api/creators/verify-login/route.ts`** - Login verification and session creation
  - **`app/api/creators/profile/route.ts`** - Creator profile CRUD
  - **`app/api/creators/dashboard/route.ts`** - Dashboard metrics with tier progression
  - **`app/api/creators/links/route.ts`** - Tracking link management
  - **`app/api/creators/codes/route.ts`** - Affiliate coupon codes
  - **`app/api/creators/earnings/overview/route.ts`** - Earnings summary
  - **`app/api/creators/earnings/orders/route.ts`** - Attributed orders with email redaction
  - **`app/api/creators/earnings/ledger/route.ts`** - Commission ledger entries
  - **`app/api/creators/network/route.ts`** - Network metrics and recruit list
  - **`app/api/creators/payouts/route.ts`** - Payout history and configuration
  - **`app/api/creators/support/tickets/route.ts`** - Support ticket submission
- **Tracking & Attribution**
  - **`app/api/track/click/route.ts`** - Server-side click tracking with 30-day cookie
  - **`app/r/[slug]/route.ts`** - Referral redirect route
- **Admin API Routes**
  - **`app/api/admin/creators/pending/route.ts`** - Approval queue
  - **`app/api/admin/creators/[id]/approve/route.ts`** - Creator approval with auto-provisioning
  - **`app/api/admin/creators/[id]/reject/route.ts`** - Creator rejection with audit logging
  - **`app/api/admin/creators/codes/route.ts`** - Code management
  - **`app/api/admin/creators/payouts/batch/route.ts`** - Batch payout processing
- **Cron Jobs**
  - **`app/api/cron/approve-commissions/route.ts`** - Daily commission approval (30-day hold)
  - **`app/api/cron/update-tiers/route.ts`** - Daily tier recalculation
- **Creator Portal Frontend (8 sections)**
  - **`app/creators/portal/layout.tsx`** - Portal layout with sidebar, header, auth protection
  - **`app/creators/portal/dashboard/page.tsx`** - Dashboard with metrics, tier progress, quick actions
  - **`app/creators/portal/share/page.tsx`** - Share & Earn with link generator and coupon codes
  - **`app/creators/portal/earnings/page.tsx`** - Earnings overview, orders, commission ledger
  - **`app/creators/portal/network/page.tsx`** - Network recruiting with tier milestones
  - **`app/creators/portal/payouts/page.tsx`** - Payout history and method configuration
  - **`app/creators/portal/resources/page.tsx`** - FTC compliance, brand kit, content support
  - **`app/creators/portal/support/page.tsx`** - Support ticket submission
  - **`app/creators/portal/settings/page.tsx`** - Profile and payout settings
  - **`components/creators/CreatorSidebar.tsx`** - Portal sidebar navigation
  - **`components/creators/CreatorHeader.tsx`** - Portal header with real-time metrics
- **Creator Onboarding Pages**
  - **`app/creators/page.tsx`** - Creator program landing page
  - **`app/creators/apply/page.tsx`** - Application form
  - **`app/creators/login/page.tsx`** - Magic link login with error handling
  - **`app/creators/pending/page.tsx`** - Pending approval status page
- **Admin Creator Pages**
  - **`app/admin/creators/page.tsx`** - Creator management dashboard
  - **`app/admin/creators/approvals/page.tsx`** - Approval queue interface
  - **`app/admin/creators/payouts/page.tsx`** - Payout run builder

#### Homepage & Site-Wide Updates
- **`components/site/ClubBanner.tsx`** - CULTR Club free tier signup banner
- **`components/site/LayoutShell.tsx`** - Conditional header/footer rendering per route
- **CULTR Creator CTA** - Added to homepage between FAQ and newsletter sections
- **ClubBanner** - Added above pricing cards on homepage (matching pricing page pattern)
- **Hero image** - Replaced sunset silhouette with athletic man photo
- **Footer** - Added "Creator Program" link under Contact column

#### Other New Files
- **`lib/config/quiz.ts`** - Health quiz configuration
- **`lib/config/social-proof.ts`** - Testimonials, providers, trust metrics
- **`app/quiz/page.tsx`** - Health quiz page
- **`public/images/hero-man-athletic.png`** - New hero image

### Modified

#### Authentication
- **`lib/auth.ts`** - Added `creatorId` and `role` to session tokens, added `verifyCreatorAuth()` middleware

#### Layout & Navigation
- **`app/layout.tsx`** - Replaced direct Header/Footer with `LayoutShell` for route-conditional rendering
- **`app/creators/page.tsx`** - Added "Already a creator? Log in" links
- **`components/site/Footer.tsx`** - Added Creator Program link
- **`app/page.tsx`** - Added ClubBanner, Creator CTA section, replaced hero image with `object-top` positioning

#### Stripe Integration
- **`app/api/webhook/stripe/route.ts`** - Extended for creator order attribution and commission calculation

### Dev Mode
- All creator API endpoints return mock data in development mode for testing without database
- Portal is browsable at `/creators/portal/dashboard` with sample metrics, links, orders, and recruits

---

## [2026-01-29] - AI Meal Plan Generator with Modal & Export Features

### Added

#### New Features
- **AI Meal Plan Generator** - OpenAI-powered meal plan generation based on user's calculated macros
  - **`app/api/meal-plan/route.ts`** - Streaming AI API endpoint for meal plan generation
  - **`app/library/calorie-calculator/`** - Full calorie & macro calculator with AI meal planning
    - **`CalorieCalculatorClient.tsx`** - Interactive calculator with modal UI (1,123 lines)
    - **`page.tsx`** - Server-side wrapper page
  - Beautiful modal popup with real-time streaming content
  - Export to PDF with professional formatting and CULTR branding
  - Copy to clipboard for Google Docs/Word
  - Regenerate functionality for new meal plans

#### Calorie Calculator Features
- Multiple BMR formulas (Mifflin-St Jeor, Harris-Benedict, Katch-McArdle)
- Activity level adjustments (Sedentary to Extra Active)
- Goal-based calorie targets (Aggressive Cut to Bulk)
- Customizable macro splits (Balanced, High Protein, Low Carb, Keto)
- Visual macro breakdown with donut chart
- Responsive design with sticky results panel

#### Payment Integrations (BNPL)
- **Affirm Integration**
  - **`app/api/checkout/affirm/checkout/route.ts`** - Affirm checkout endpoint
  - **`app/api/checkout/affirm/capture/route.ts`** - Affirm payment capture
  - **`app/api/webhook/affirm/route.ts`** - Affirm webhook handler
  - **`components/payments/AffirmCheckoutButton.tsx`** - Affirm checkout button
  - **`lib/payments/affirm-api.ts`** - Affirm API utilities

- **Klarna Integration**
  - **`app/api/checkout/klarna/session/route.ts`** - Klarna session creation
  - **`app/api/checkout/klarna/order/route.ts`** - Klarna order management
  - **`app/api/webhook/klarna/route.ts`** - Klarna webhook handler
  - **`components/payments/KlarnaWidget.tsx`** - Klarna payment widget
  - **`lib/payments/klarna-api.ts`** - Klarna API utilities

#### Payment Components
- **`components/payments/BNPLBadge.tsx`** - Buy Now, Pay Later badge component
- **`components/payments/PaymentMethodSelector.tsx`** - Payment method selection UI
- **`components/payments/PaymentProviderLoader.tsx`** - Payment script loader
- **`app/api/checkout/product/route.ts`** - Product checkout endpoint
- **`lib/config/payments.ts`** - Payment providers configuration
- **`lib/payments/payment-types.ts`** - Payment type definitions

#### UI Components
- **`components/ui/Aura.tsx`** - Decorative aura component for visual effects
- **`components/ui/Input.tsx`** - Reusable input component
- **`components/library/MemberDashboard.tsx`** - Member dashboard component

#### Configuration & Utilities
- **`lib/calorie-calculator.ts`** - Core calculation logic for BMR, TDEE, and macros
- **`lib/config/healthie.ts`** - Healthie API configuration

#### Documentation
- **`BNPL-TESTING-GUIDE.md`** - Buy Now Pay Later testing guide
- **`design.md`** - Design system and component documentation (453 lines)
- **`docs/BNPL-MERCHANT-SETUP.md`** - Merchant setup guide for BNPL
- **`docs/BNPL-MOBILE-SDK.md`** - Mobile SDK integration guide

### Modified

#### Design System Updates
- Updated color palette with new cultr-mint, cultr-sage, cultr-forest colors
- Enhanced gradient styles and animations
- Improved typography with font-display and font-body classes
- Added aura effects and glass morphism styles

#### Component Updates
- Enhanced all section components with new design system
- Updated navigation and footer with improved styling
- Improved button variants and hover states
- Enhanced pricing cards with BNPL badge support
- Updated cart and shop components with new design

### Environment Variables Added
```
OPENAI_API_KEY - OpenAI API key for meal plan generation
KLARNA_API_KEY - Klarna API key
KLARNA_API_SECRET - Klarna API secret
KLARNA_API_URL - Klarna API endpoint
NEXT_PUBLIC_KLARNA_CLIENT_ID - Klarna client ID
NEXT_PUBLIC_ENABLE_KLARNA - Enable/disable Klarna
AFFIRM_PRIVATE_API_KEY - Affirm private API key
NEXT_PUBLIC_AFFIRM_PUBLIC_KEY - Affirm public key
AFFIRM_API_URL - Affirm API endpoint
NEXT_PUBLIC_AFFIRM_SCRIPT_URL - Affirm script URL
NEXT_PUBLIC_ENABLE_AFFIRM - Enable/disable Affirm
```

### Dependencies Added
- `@ai-sdk/openai` - OpenAI integration for AI SDK
- `@ai-sdk/react` - React hooks for AI streaming
- `ai` - Vercel AI SDK for streaming text
- `marked` - Markdown parser for meal plan rendering

### Technical Improvements
- Implemented streaming API responses for real-time content delivery
- Added proper error handling and logging for AI endpoints
- Enhanced modal component with escape key and backdrop close
- Improved responsive design across all screen sizes
- Added print-optimized PDF export functionality

---

## [2026-01-27] - Initial Full Application Release

### Commit: `316c14a` - Add full Cultr Health Website application
### Commit: `7cd64fe` - Rename documentation files to remove CANLAB prefix

---

### Added

#### Core Application Structure
- **Next.js App Router** - Full application structure with app directory routing
- **`app/layout.tsx`** - Root layout with global providers
- **`app/page.tsx`** - Homepage with hero, services, and call-to-action sections
- **`app/globals.css`** - Global styles and Tailwind CSS utilities

#### API Routes
- **`app/api/auth/magic-link/route.ts`** - Magic link authentication endpoint
- **`app/api/auth/verify/route.ts`** - Token verification endpoint
- **`app/api/auth/logout/route.ts`** - User logout endpoint
- **`app/api/checkout/route.ts`** - Stripe checkout session creation
- **`app/api/quote/route.ts`** - Quote request submission
- **`app/api/waitlist/route.ts`** - Waitlist signup endpoint
- **`app/api/webhook/stripe/route.ts`** - Stripe webhook handler for payment events
- **`app/api/protocol/generate/route.ts`** - AI-powered protocol generation

#### Public Pages
- **`app/faq/page.tsx`** - Frequently asked questions page
- **`app/how-it-works/page.tsx`** - Service explanation page
- **`app/pricing/page.tsx`** - Pricing tiers and plans
- **`app/products/page.tsx`** - Product catalog page
- **`app/login/page.tsx`** - User login page
- **`app/success/page.tsx`** - Post-checkout success page
- **`app/join/[tier]/page.tsx`** - Dynamic tier join page

#### Legal Pages
- **`app/legal/terms/page.tsx`** - Terms of service
- **`app/legal/privacy/page.tsx`** - Privacy policy
- **`app/legal/medical-disclaimer/page.tsx`** - Medical disclaimer

#### Library Section (Member-Only)
- **`app/library/page.tsx`** - Library landing page
- **`app/library/layout.tsx`** - Library layout with authentication
- **`app/library/LibraryContent.tsx`** - Main library content component
- **`app/library/LibraryLogin.tsx`** - Library authentication component
- **`app/library/[category]/page.tsx`** - Dynamic category pages

#### Library Features
- **`app/library/shop/page.tsx`** - Product shop page
- **`app/library/shop/ShopClient.tsx`** - Shop client component with filtering
- **`app/library/shop/[sku]/page.tsx`** - Individual product page
- **`app/library/shop/[sku]/ProductDetailClient.tsx`** - Product detail client component
- **`app/library/cart/page.tsx`** - Shopping cart page
- **`app/library/cart/CartClient.tsx`** - Cart management component
- **`app/library/quote-success/page.tsx`** - Quote submission success page
- **`app/library/dosing-calculator/page.tsx`** - Dosing calculator page
- **`app/library/dosing-calculator/DosingCalculatorClient.tsx`** - Interactive dosing calculator (587 lines)

#### Provider Tools
- **`app/provider/protocol-builder/page.tsx`** - Protocol builder page
- **`app/provider/protocol-builder/ProtocolBuilderClient.tsx`** - Protocol builder tool (742 lines)

#### UI Components
- **`components/Navigation.tsx`** - Main navigation component
- **`components/Footer.tsx`** - Site footer component
- **`components/WaitlistForm.tsx`** - Waitlist signup form

#### Section Components
- **`components/sections/Hero.tsx`** - Hero section
- **`components/sections/About.tsx`** - About section
- **`components/sections/Services.tsx`** - Services section
- **`components/sections/HowItWorks.tsx`** - How it works section
- **`components/sections/Pricing.tsx`** - Pricing section
- **`components/sections/Results.tsx`** - Results/testimonials section
- **`components/sections/Testimonials.tsx`** - Customer testimonials
- **`components/sections/FAQ.tsx`** - FAQ section
- **`components/sections/Waitlist.tsx`** - Waitlist section

#### Site Components
- **`components/site/Header.tsx`** - Site header
- **`components/site/Footer.tsx`** - Site footer
- **`components/site/CTASection.tsx`** - Call-to-action section
- **`components/site/ComparisonTable.tsx`** - Feature comparison table
- **`components/site/FAQAccordion.tsx`** - FAQ accordion component
- **`components/site/NewsletterSignup.tsx`** - Newsletter signup form
- **`components/site/PricingCard.tsx`** - Pricing card component
- **`components/site/ProductCard.tsx`** - Product card component

#### Reusable UI Components
- **`components/ui/Button.tsx`** - Button component with variants
- **`components/ui/Spinner.tsx`** - Loading spinner component
- **`components/ui/ScrollReveal.tsx`** - Scroll reveal animation component
- **`components/ui/SectionWrapper.tsx`** - Section wrapper component

#### Library Components
- **`components/library/TierGate.tsx`** - Tier-based content gating

#### Library/Utility Functions
- **`lib/auth.ts`** - Authentication utilities (JWT, sessions, magic links)
- **`lib/db.ts`** - Database utilities (Vercel Postgres)
- **`lib/cart-context.tsx`** - Shopping cart React context
- **`lib/healthie-api.ts`** - Healthie API integration
- **`lib/library-content.ts`** - Library content management
- **`lib/peptide-calculator.ts`** - Peptide dosing calculations
- **`lib/protocol-templates.ts`** - Protocol templates (4,120 lines)
- **`lib/rate-limit.ts`** - Rate limiting utilities
- **`lib/resend.ts`** - Email sending via Resend (791 lines)
- **`lib/turnstile.ts`** - Cloudflare Turnstile verification
- **`lib/utils.ts`** - General utilities
- **`lib/validation.ts`** - Input validation schemas

#### Configuration
- **`lib/config/links.ts`** - Navigation links configuration
- **`lib/config/plans.ts`** - Subscription plans configuration
- **`lib/config/products.ts`** - Products configuration
- **`lib/config/product-catalog.ts`** - Full product catalog (678 lines)

#### Content (Markdown)
- **`content/library/index.md`** - Library index content
- **`content/library/products.md`** - Products content
- **`content/library/bioregulators.md`** - Bioregulators information
- **`content/library/growth-factors.md`** - Growth factors information
- **`content/library/metabolic.md`** - Metabolic peptides information
- **`content/library/repair-recovery.md`** - Repair & recovery information

#### Documentation Files
- **`Master-Index.md`** - Master index of peptides and products (374 lines)
- **`Peptides-Bioregulators.md`** - Bioregulators documentation (506 lines)
- **`Peptides-Growth-Factors.md`** - Growth factors documentation (2,039 lines)
- **`Peptides-Metabolic.md`** - Metabolic peptides documentation (347 lines)
- **`Peptides-Repair.md`** - Repair peptides documentation (868 lines)
- **`Verification-Checklist.md`** - Verification checklist (358 lines)
- **`products.md`** - Products documentation (1,953 lines)
- **`CULTR_End_to_End_Checklist.md`** - End-to-end project checklist (644 lines)

#### Test Suite
- **`tests/setup.ts`** - Test setup and configuration
- **`tests/vitest.d.ts`** - Vitest type definitions
- **`tests/api/protocol-generate.test.ts`** - Protocol generation API tests
- **`tests/components/TierGate.test.tsx`** - TierGate component tests
- **`tests/integration/protocol-engine.test.ts`** - Protocol engine integration tests
- **`tests/lib/auth.test.ts`** - Authentication utility tests
- **`tests/lib/healthie-api.test.ts`** - Healthie API tests
- **`tests/lib/library-content.test.ts`** - Library content tests
- **`tests/lib/plans.test.ts`** - Plans configuration tests
- **`tests/lib/protocol-templates.test.ts`** - Protocol templates tests

#### Configuration Files
- **`.gitignore`** - Git ignore rules
- **`package.json`** - NPM dependencies and scripts
- **`package-lock.json`** - NPM lock file (9,417 lines)
- **`tsconfig.json`** - TypeScript configuration
- **`tailwind.config.ts`** - Tailwind CSS configuration
- **`postcss.config.js`** - PostCSS configuration
- **`vitest.config.js`** - Vitest test runner configuration
- **`env.example`** - Environment variables template

#### Assets
- **`public/cultr-logo-black.png`** - Cultr logo (black version)
- **`CultrLogo Black.png`** - Cultr logo (root directory)

---

### File Renames (Commit `7cd64fe`)

| Original Name | New Name |
|---------------|----------|
| `CANLAB-Master-Index.md` | `Master-Index.md` |
| `CANLAB-Peptides-Bioregulators.md` | `Peptides-Bioregulators.md` |
| `CANLAB-Peptides-Growth-Factors.md` | `Peptides-Growth-Factors.md` |
| `CANLAB-Peptides-Metabolic.md` | `Peptides-Metabolic.md` |
| `CANLAB-Peptides-Repair.md` | `Peptides-Repair.md` |
| `CANLAB-Verification-Checklist.md` | `Verification-Checklist.md` |
| `canlabintl_products.md` | `products.md` |

---

### Summary Statistics

- **Total Files Added:** 112
- **Total Lines of Code:** 36,306
- **API Endpoints:** 8
- **React Components:** 35+
- **Test Files:** 10
- **Documentation Files:** 8

---

### Dependencies Added

#### Production
- Next.js (App Router)
- React / React DOM
- Tailwind CSS
- Stripe (payments)
- Resend (email)
- Jose (JWT handling)
- Zod (validation)
- @vercel/postgres (database)

#### Development
- TypeScript
- Vitest (testing)
- @testing-library/react
- PostCSS
- Autoprefixer

---

### Environment Variables Required

```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
JWT_SECRET
SESSION_SECRET
RESEND_API_KEY
FROM_EMAIL
FOUNDER_EMAIL
POSTGRES_URL
HEALTHIE_API_KEY
HEALTHIE_API_URL
NEXT_PUBLIC_SITE_URL
TURNSTILE_SECRET_KEY
UPSTASH_REDIS_REST_URL (optional)
UPSTASH_REDIS_REST_TOKEN (optional)
PROTOCOL_BUILDER_ALLOWED_EMAILS
```

See `env.example` for full template.
