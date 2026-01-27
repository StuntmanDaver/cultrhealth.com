# Changelog

All notable changes to the Cultr Health Website project are documented in this file.

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
