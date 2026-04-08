# Playwright E2E Test Suite — Design Spec

**Date:** 2026-04-05
**Status:** Approved
**Scope:** Comprehensive end-to-end testing across all CULTR Health staging environments

---

## Overview

A full-coverage Playwright E2E test suite for CULTR Health covering page loads, functional flows, visual verification, and brand consistency across:

- `staging.cultrhealth.com` (public site, members area, admin panel)
- `join.cultrhealth.com` (CULTR Club landing + checkout)
- Creator portal (`staging.cultrhealth.com/creators/portal`)
- Member portal (`staging.cultrhealth.com/portal`, `/members`)
- Admin panel (`staging.cultrhealth.com/admin`)

**Grand total: ~418 tests across 42 test files + 3 fixture files.**

---

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Test scope | Full: page loads + functional flows + visual verification | Maximum coverage requested |
| Authentication | Hybrid: test auth flows directly + inject tokens for downstream tests | Speed for most tests, auth flow coverage in dedicated tests |
| Visual testing | Screenshots for human review + structural assertions (no pixel-diff) | Low maintenance, catches broken elements without baseline churn |
| Stateful operations | Hybrid: submit non-destructive forms, stop before payment | No Stripe charges created, staging data is disposable |
| File structure | Granular by feature, grouped by area (~42 files) | Individually runnable, parallelizable, clear failure reports |

---

## Playwright Config Updates

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 90000,
  retries: 1,
  fullyParallel: true,
  reporter: [
    ['html', { open: 'never', outputFolder: 'test-results/report' }],
    ['list'],
  ],
  use: {
    baseURL: 'https://staging.cultrhealth.com',
    screenshot: 'on',
    trace: 'on-first-retry',
    video: 'on-first-retry',
  },
  projects: [
    // Functional tests — desktop only (fast)
    {
      name: 'functional',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /visual\//,
    },
    // Visual tests — all breakpoints
    { name: 'Desktop 1920', use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } }, testMatch: /visual\//, },
    { name: 'Desktop 1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }, testMatch: /visual\//, },
    { name: 'Desktop 1280', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } }, testMatch: /visual\//, },
    { name: 'Laptop 1024', use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 } }, testMatch: /visual\//, },
    { name: 'Tablet 768', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } }, testMatch: /visual\//, },
    // Mobile tests — select functional tests
    {
      name: 'Mobile',
      use: { ...devices['iPhone 14'] },
      testMatch: [/navigation/, /homepage/, /responsive/],
    },
  ],
});
```

---

## Project Structure

```
e2e/
├── fixtures/
│   ├── auth.ts                    # Auth helpers: login flows, token injection, role setup
│   ├── brand.ts                   # Brand assertion helpers: colors, fonts, images
│   └── screenshots.ts            # Screenshot capture helpers with naming conventions
│
├── public/                        # staging.cultrhealth.com — unauthenticated
│   ├── homepage.spec.ts           # Hero, sections, CTAs, dynamic imports
│   ├── navigation.spec.ts         # Header links, footer links, mobile menu
│   ├── pricing.spec.ts            # Pricing cards, plan comparison, CTAs
│   ├── quiz.spec.ts               # Quiz flow, question progression, results
│   ├── therapies.spec.ts          # Therapy cards, FDA badges, disclaimers
│   ├── how-it-works.spec.ts       # Steps, content, CTAs
│   ├── faq.spec.ts                # Accordion expand/collapse
│   ├── community.spec.ts          # Curator.io feed tabs
│   ├── tools.spec.ts              # Tools hub, calculator pages
│   ├── legal.spec.ts              # Privacy, terms, medical disclaimer, provider credentials
│   └── redirects.spec.ts          # /products→/pricing, /library→/members, /science→/
│
├── auth/                          # Authentication flows
│   ├── member-login.spec.ts       # Magic link flow (staging bypass)
│   ├── creator-login.spec.ts      # Creator magic link + auto-provision
│   ├── portal-login.spec.ts       # Phone OTP flow
│   └── session-timeout.spec.ts    # 30-min idle timeout (HIPAA)
│
├── join/                          # join.cultrhealth.com
│   ├── landing.spec.ts            # Club landing page, signup modal
│   ├── checkout-tiers.spec.ts     # Core/Catalyst/Concierge checkout pages
│   ├── consent-modal.spec.ts      # Scroll-gated consent, FDA badges
│   └── domain-rewriting.spec.ts   # Middleware: join.* → /join-club rewrite
│
├── members/                       # Authenticated member area
│   ├── library.spec.ts            # Library landing, category pages
│   ├── shop.spec.ts               # Shop listing, product detail pages
│   ├── cart.spec.ts               # Cart add/remove, quote generation
│   ├── tools.spec.ts              # Dosing calculator, calorie calculator
│   ├── consultations.spec.ts      # Consultation booking
│   └── portal-dashboard.spec.ts   # Portal dashboard, profile, documents
│
├── intake/                        # Medical intake flow
│   └── intake-flow.spec.ts        # Multi-step form, all 12 steps, submission
│
├── creators/                      # Creator area
│   ├── public-pages.spec.ts       # /creators landing, /creators/apply, /creators/[slug]
│   ├── application-flow.spec.ts   # Full creator application submission
│   ├── portal-dashboard.spec.ts   # Dashboard metrics, getting started
│   ├── portal-earnings.spec.ts    # Earnings, commissions, ledger
│   ├── portal-share.spec.ts       # Tracking links, coupon codes
│   ├── portal-network.spec.ts     # Referral network, overrides
│   └── portal-settings.spec.ts    # Settings, support, resources, payouts
│
├── admin/                         # Admin panel
│   ├── dashboard.spec.ts          # Analytics, revenue chart, metrics
│   ├── orders.spec.ts             # Order management, club orders
│   ├── customers.spec.ts          # Customer list, detail modal
│   ├── creators-management.spec.ts # Creator approvals, coupons, payouts
│   ├── intakes.spec.ts            # Intake management
│   └── marketing.spec.ts          # Marketing dashboard, waitlist
│
└── visual/                        # Cross-cutting visual/brand tests
    ├── brand-consistency.spec.ts  # Colors, fonts, logo across all pages
    ├── responsive-layout.spec.ts  # No overflow, no broken layouts per breakpoint
    └── images-assets.spec.ts      # All images load, no broken src, alt text
```

---

## Fixture Files

### `e2e/fixtures/auth.ts`

```
loginAsMember(page, email?)       — Calls staging magic link bypass, sets JWT cookie
loginAsCreator(page, email?)      — Calls creator magic link bypass, sets creator JWT cookie
loginAsAdmin(page, email?)        — Calls magic link with admin email (default: stewart@cultrhealth.com), sets admin cookie
loginViaPortal(page, phone?)      — Calls portal OTP flow with 123456 staging bypass
injectMemberSession(context)      — Sets pre-built JWT directly in browser context (fast path for downstream tests)
injectCreatorSession(context)     — Pre-built creator JWT injection (uses staging auto-provisioned creator)
injectAdminSession(context)       — Pre-built admin JWT injection (stewart@cultrhealth.com)

Test emails (staging bypass handles all):
- Member: test-member@cultrhealth.com (any email works on staging)
- Creator: stewart@cultrhealth.com (auto-provisioned team email)
- Admin: stewart@cultrhealth.com (team email with admin role)
```

### `e2e/fixtures/brand.ts`

```
assertBrandColors(page)           — Checks primary (#2A4542) / cream (#FDFBF7) / sage (#B7E4C7) in computed styles
assertFontsLoaded(page)           — Checks Playfair Display + Inter loaded via document.fonts
assertLogoVisible(page)           — Checks cultr-health-logo.png visible and loaded
assertNoOverflow(page)            — Checks document.documentElement.scrollWidth <= window.innerWidth
assertNoConsoleErrors(page)       — Collects page.on('console') errors, asserts none
```

### `e2e/fixtures/screenshots.ts`

```
captureFullPage(page, name)       — Saves full-page screenshot to test-results/screenshots/{name}-{viewport}.png
captureElement(page, selector, name) — Saves element screenshot
Naming convention: {area}/{page}-{breakpoint}.png
```

---

## Exhaustive Test List

### PUBLIC MARKETING SITE (11 files, ~131 tests)

#### `e2e/public/homepage.spec.ts` (25 tests)

1. Page loads with 200 status, no console errors
2. Hero section visible — desktop: h1 "Change the CULTR, rebrand yourself."
3. Hero section visible — mobile: h1 with same tagline text
4. Hero image loads (`hero-cultr-diverse-women.png`) with correct alt text
5. Hero CTA "Take the Quiz" button exists and links to `/quiz`
6. Hero CTA "Compare Plans" button exists and links to `/pricing`
7. TrustStrip component renders below hero
8. Lifestyle section — 3 video cards visible (Confidence, Endurance, Freedom)
9. Lifestyle videos have `<source>` elements with `.mp4` src
10. "Find Your Protocol" CTA links to `/quiz`
11. How It Works section — 4 step cards render (Quiz, Blood Test, Provider, Protocol)
12. "Learn More" CTA links to `/how-it-works`
13. Comparison table — 6 feature rows, 3 columns (Feature, Standard Care, CULTR)
14. TrustMarquee loads (dynamic import)
15. Creator CTA section — "Learn More" links to `/creators`
16. Pricing section — 3 PricingCards render (Core, Catalyst, Concierge) — not Club
17. ClubBanner renders above pricing cards
18. "View All Plans" CTA links to `/pricing`
19. "Take the quiz" link in pricing section links to `/quiz`
20. NewsletterSignup renders with email input and submit button
21. Trust badges bar — HIPAA, Encryption, Providers, Pharmacy badges visible
22. TestimonialsSection loads with testimonial cards
23. Provider profiles render with images, names, credentials
24. Final CTA section — "Stop guessing. Start optimizing." renders
25. Full-page screenshot captured

#### `e2e/public/navigation.spec.ts` (22 tests)

1. Header renders with CULTR Health logo (`cultr-health-logo.png`)
2. Logo links to `/` (homepage)
3. Left nav: "Pricing" link → `/pricing`
4. Left nav: "Core Therapies" link → `/therapies`
5. Left nav: "How It Works" link → `/how-it-works`
6. Left nav: "Tools" link → `/tools`
7. Right nav: "Members" link → `/portal/login`
8. Right nav: "Creators" link → `/creators`
9. Right nav: "Community" link → `/community`
10. "Get Started" CTA button → `/quiz`
11. Active state highlight on current page nav link
12. Scroll morph — header transitions from full-width to floating pill after scrollY > 50
13. Scrolled header has `max-w-[1080px]`, `rounded-[60px]`, backdrop-blur
14. Mobile hamburger menu toggle — opens drawer
15. Mobile drawer shows all nav links
16. Mobile drawer locks body scroll (`overflow: hidden`)
17. Footer trust badges: HIPAA Compliant, 256-bit Encryption, Licensed Providers, Licensed Pharmacy
18. Footer "Products" links: Pricing, Membership Plans, Pricing FAQ
19. Footer "Learn" links: How It Works, Resources, FAQ
20. Footer "Contact" links: Creators, Creator Program, Contact Us (mailto), Manage Account
21. Footer social icons: Instagram, Facebook, LinkedIn, TikTok, YouTube — correct hrefs, `target="_blank"`
22. Footer legal links: Privacy, Terms, Medical Disclaimer + DispensingPharmacyInfo

#### `e2e/public/pricing.spec.ts` (15 tests)

1. Page loads at `/pricing` with 200 status
2. Hero heading visible: "Choose the level of support that fits your goals"
3. Value props section: 29 Biomarkers, Direct Access, Peptide Protocols, HIPAA Compliant
4. 4 plan cards render: Club ($0), Core ($199), Catalyst+ ($499), Concierge ($1,099)
5. Catalyst+ card has "featured" badge/indicator
6. Each plan card has CTA button
7. Plan CTAs link to correct `/join/[tier]` routes
8. PrescriptionDisclaimer component visible
9. Plan features list renders for each card
10. ClubBanner free tier promotion renders
11. FAQ section (anchor `#faq`) expands/collapses
12. Plans anchor (`#plans`) scrolls to correct section
13. ROSCA disclosure text visible
14. Mobile layout — cards stack vertically
15. Full-page screenshot

#### `e2e/public/quiz.spec.ts` (12 tests)

1. Page loads at `/quiz` with 200 status
2. First question renders with options
3. Clicking an answer advances to next question
4. Progress indicator updates with each step
5. Can navigate back to previous question
6. All questions render without errors through full flow
7. Results page shows recommended plan/therapy
8. Results CTA links to relevant next step (pricing/join)
9. No console errors during quiz flow
10. Mobile layout — questions full-width, buttons tappable
11. Quiz state persists through the flow (answers not lost)
12. Screenshot of results page

#### `e2e/public/therapies.spec.ts` (10 tests)

1. Page loads at `/therapies` with 200 status
2. Hero heading: "Protocols tailored to your goals"
3. "How protocols are chosen" — 5-column grid renders
4. Therapy cards render for available therapies
5. FDAStatusBadge renders on each therapy card with correct status color
6. PrescriptionDisclaimer visible
7. Therapy cards have images that load
8. CTAs: "Take the Quiz" → `/quiz`, "Compare Plans" → `/pricing`
9. Mobile layout — cards stack properly
10. Full-page screenshot

#### `e2e/public/how-it-works.spec.ts` (8 tests)

1. Page loads at `/how-it-works` with 200 status
2. Hero heading: "From quiz to clinician-guided plan in a few simple steps"
3. Timeline stats: 24-48 hrs, 29 biomarkers, 60+ peptides, unlimited messaging
4. "Safety is our priority" compliance section with checkmarks
5. HowItWorksSteps component renders 5 steps
6. CTA buttons: "Take the Quiz" → `/quiz`, "View Pricing" → `/pricing`
7. TrustMarquee renders
8. Full-page screenshot

#### `e2e/public/faq.spec.ts` (7 tests)

1. Page loads at `/faq` with 200 status
2. FAQ heading visible: "Frequently asked questions"
3. Category sections: Membership, Medical & Telehealth, Products & Protocols, Support & Safety
4. Multiple FAQ items render as collapsed accordions
5. Clicking an FAQ item expands it, shows answer text
6. Clicking an expanded FAQ item collapses it
7. Full-page screenshot

#### `e2e/public/community.spec.ts` (6 tests)

1. Page loads at `/community` with 200 status
2. Page heading visible: "Our Community"
3. Social media links: Instagram, TikTok, YouTube with correct external hrefs
4. CommunityFeed section renders or shows "Coming Soon"
5. CTASection renders with "Take the Quiz" link
6. Full-page screenshot

#### `e2e/public/tools.spec.ts` (10 tests)

1. Tools hub page loads at `/tools` with 200 status, "Protocol Tools" heading
2. Tool cards visible: Dosing Calculator, Calorie & Macro Calculator
3. `/tools/dosing-calculator` loads, calculator UI renders
4. Dosing calculator — input fields accept values, calculation updates
5. `/tools/calorie-calculator` loads, form renders
6. Calorie calculator — fill inputs, result calculates
7. `/tools/stacking-guides` loads (if present)
8. `/tools/peptide-faq` loads (if present)
9. All tool pages have navigation back to `/tools`
10. Screenshots of each tool page

#### `e2e/public/legal.spec.ts` (8 tests)

1. `/legal/privacy` loads with 200, has heading
2. Privacy page has substantial text content (not empty)
3. `/legal/terms` loads with 200, has heading
4. Terms page has substantial text content
5. `/legal/medical-disclaimer` loads with 200, has heading
6. Medical disclaimer mentions 48 states availability
7. `/legal/provider-credentials` loads with 200
8. All legal pages have consistent layout

#### `e2e/public/redirects.spec.ts` (8 tests)

1. `/products` → 301 redirect to `/pricing`
2. `/products/anything` → 301 redirect to `/pricing`
3. `/library` → 301 redirect to `/members`
4. `/library/metabolic` → 301 redirect to `/members/metabolic`
5. `/science` → 301 redirect to `/`
6. `/science/any-article` → 301 redirect to `/`
7. `/consultations` → 301 redirect to `/members/consultations`
8. `/join` on staging.cultrhealth.com → rewritten to not-found

---

### AUTHENTICATION (4 files, ~33 tests)

#### `e2e/auth/member-login.spec.ts` (10 tests)

1. `/login` loads with 200, shows "Member Login" heading
2. Email input renders with correct placeholder
3. Submit with empty email shows validation error
4. Submit with invalid email format shows error
5. Submit valid email → loading spinner appears on button
6. Staging bypass: POST `/api/auth/magic-link` returns token in response
7. After magic link sent, success message with CheckCircle icon appears
8. "Use a different email" link resets form to idle state
9. URL error params render correctly: `?error=expired_link` shows message
10. URL error params: `?error=invalid_link`, `?error=no_subscription`

#### `e2e/auth/creator-login.spec.ts` (9 tests)

1. `/creators/login` loads with 200, shows "Creator Login" heading
2. Email input renders
3. Submit with empty email shows validation
4. Submit valid email → loading state (Loader2 spinner)
5. Staging bypass: POST `/api/creators/magic-link` returns redirect URL
6. Success state shows CheckCircle and confirmation message
7. "Send another link" button resets form
8. Dev mode: "Open Portal (Dev Mode)" link appears with redirectUrl
9. Error params: `?error=no_account`, `?error=inactive_account` render messages

#### `e2e/auth/portal-login.spec.ts` (10 tests)

1. `/portal/login` loads with 200
2. Phone number input renders with input mask
3. Submit phone → OTP input appears (6-digit boxes)
4. OTP input accepts 6 digits
5. Staging bypass: OTP `123456` accepted
6. Successful OTP → redirect to `/portal/dashboard`
7. Invalid OTP shows error message
8. "Resend code" functionality works
9. Back button from OTP returns to phone input
10. Full-page screenshot of login form

#### `e2e/auth/session-timeout.spec.ts` (4 tests)

1. Authenticated request to `/members` with valid session → 200
2. Request to `/members` without session cookie → redirect to login
3. Request to `/admin` without session → redirect to `/login?redirect=/admin`
4. Request to `/creators/portal` without session → redirect to creator login

---

### JOIN / CHECKOUT (4 files, ~39 tests)

#### `e2e/join/landing.spec.ts` (10 tests)

1. `join.cultrhealth.com` loads, shows club landing page
2. Page has no site header/footer chrome (minimal layout)
3. Signup modal opens on CTA click
4. Signup modal fields: name, email, phone, address fields
5. Submit signup → POST `/api/club/signup` with form data
6. Success state shows confirmation message
7. Signup data persists in localStorage
8. Signup data persists in cookie
9. Mobile layout — modal is full-screen
10. Full-page screenshot

#### `e2e/join/checkout-tiers.spec.ts` (16 tests)

1. `/join/core` loads with Core plan details
2. `/join/catalyst` loads with Catalyst+ plan details
3. `/join/concierge` loads with Concierge plan details
4. `/join/club` loads with Club plan details
5. Plan name and price displayed correctly on each tier page
6. Customer info form renders: email, first name, last name, phone
7. Email validation — required, format check
8. First name + last name — required fields
9. Payment method selector shows Stripe option
10. Stripe CardElement renders within payment form
11. Consent checkbox present with MEMBERSHIP_DISCLAIMER text
12. Cannot proceed without checking consent
13. Add-on options visible (blood tests, doctor consultation)
14. Selecting add-on updates displayed total
15. Form fills correctly but STOPS before payment submission
16. Screenshot of filled checkout form per tier

#### `e2e/join/consent-modal.spec.ts` (8 tests)

1. ConsentModal opens when triggered
2. Modal has scrollable content area
3. Consent checkbox is disabled until user scrolls to bottom
4. Scrolling to bottom enables the checkbox
5. Checking checkbox enables "I Consent" button
6. FDA badges render per tier (tier-specific content)
7. Body scroll is locked while modal is open
8. Close button / overlay click closes modal

#### `e2e/join/domain-rewriting.spec.ts` (5 tests)

1. `join.cultrhealth.com/` → serves club landing content (not 404)
2. `join.cultrhealth.com/api/*` passes through (not rewritten)
3. `join.cultrhealth.com/creators/*` passes through
4. `staging.cultrhealth.com/join` → shows not-found (blocked on non-join domain)
5. UTM params on join domain set `cultr_visitor_ctx` cookie

---

### MEMBERS AREA (6 files, ~53 tests)

#### `e2e/members/library.spec.ts` (10 tests)

1. `/members` with auth → shows LibraryContent (not login gate)
2. `/members` without auth → shows LibraryLogin
3. Library landing shows category grid
4. Category links navigate to `/members/[category]`
5. `/members/metabolic` loads category content
6. `/members/repair-recovery` loads category content
7. `/members/growth-factors` loads category content
8. `/members/bioregulators` loads category content
9. TierGate restricts content based on membership level
10. Screenshot of library landing

#### `e2e/members/shop.spec.ts` (12 tests)

1. `/members/shop` with Core+ auth → shows ShopClient
2. Product grid renders with product cards
3. Each product card shows: name, price, image, stock status
4. Product images load (no broken `src`)
5. Search input filters products by name
6. Category dropdown filters products by category
7. Clicking product card → navigates to `/members/shop/[sku]`
8. Product detail page loads with full product info
9. "Add to Cart" button works on product cards
10. Product prices display correctly
11. Stock status badges render (in-stock, out-of-stock)
12. Screenshot of shop grid

#### `e2e/members/cart.spec.ts` (8 tests)

1. `/members/cart` loads with auth
2. Empty cart shows empty state message
3. Adding product from shop → appears in cart
4. Cart shows product name, quantity, line total
5. Quantity increment/decrement updates totals
6. Remove item from cart works
7. Cart total calculates correctly
8. Quote generation CTA is present

#### `e2e/members/tools.spec.ts` (8 tests)

1. `/members/dosing-calculator` loads with auth
2. Dosing calculator renders syringe visualization
3. Input fields accept values and update calculation
4. `/members/calorie-calculator` loads
5. Calorie calculator form renders with all inputs
6. Filling calorie calculator → shows result
7. `/members/stacking-guides` loads
8. `/members/peptide-faq` loads with FAQ content

#### `e2e/members/consultations.spec.ts` (5 tests)

1. `/members/consultations` loads with auth
2. Consultation booking UI renders
3. Available time slots or booking widget visible
4. Booking form fields render
5. Screenshot of consultations page

#### `e2e/members/portal-dashboard.spec.ts` (10 tests)

1. `/portal/dashboard` loads with auth
2. Dashboard shows member welcome/greeting
3. Order history section renders
4. Biomarker/health metrics visible (if applicable)
5. `/portal/profile` loads, shows profile form
6. Profile form has editable fields
7. `/portal/documents` loads, shows document list
8. `/portal/stacking` loads
9. Portal navigation links work correctly
10. Screenshot of dashboard

---

### INTAKE FLOW (1 file, ~20 tests)

#### `e2e/intake/intake-flow.spec.ts` (20 tests)

1. `/intake` loads with auth
2. IntakeProgress component shows step indicators
3. Step 1 — PersonalInfoForm: name, DOB, gender (Male/Female only) fields render
4. Step 1 — Validation: required fields enforced
5. Step 2 — ShippingAddressForm: address fields render
6. Step 3 — MedicationSelector: 10 medication cards render
7. Step 3 — Medication cards show images, descriptions, compliance badges
8. Step 3 — Selecting medication highlights card
9. Step 4 — PhysicalMeasurementsForm: height, weight, etc.
10. Step 5 — GoalsMotivationForm: 8 questions render
11. Step 5 — Primary goal, urgency slider (1-10), top symptoms (max 3)
12. Step 6 — WellnessQuestionnaire renders
13. Step 7 — GLP1HistoryForm renders
14. Step 8 — CurrentMedicationsForm renders
15. Step 9 — TreatmentPreferencesForm renders
16. Step 10 — ConsentForms: signature capture renders
17. Step 11 — IDUploader: file upload UI renders (staging mock)
18. Step 12 — ReviewSummary: all entered data displayed
19. Full form submission → POST `/api/intake/submit`
20. `/intake/success` loads after successful submission

---

### CREATOR PORTAL (7 files, ~58 tests)

#### `e2e/creators/public-pages.spec.ts` (8 tests)

1. `/creators` loads with 200 — hero heading visible
2. "Three ways to earn" commission cards render
3. Commission rates match config (10% direct, 2-8% override)
4. "Apply Now" CTA → `/creators/apply`
5. "Creator Login" CTA → `/creators/login`
6. Bonus window callout ("first 6 months") visible
7. `/creators/[slug]` with demo creator → profile renders
8. Full-page screenshot of `/creators`

#### `e2e/creators/application-flow.spec.ts` (10 tests)

1. `/creators/apply` loads with form
2. Form fields: Full Name, Email, Phone, Age, Gender, Social Handle, Bio, Recruiter Code
3. Full Name is required — submit without it shows error
4. Email is required — submit without it shows error
5. `?ref=CODE` auto-populates Recruiter Code field
6. Fill all fields → submit → POST `/api/creators/apply`
7. Success state: CheckCircle icon + confirmation message
8. Auto-approved path (staging team emails) → shows dashboard link
9. `/creators/pending` loads for pending applications
10. Screenshot of application form filled

#### `e2e/creators/portal-dashboard.spec.ts` (10 tests)

1. `/creators/portal/dashboard` loads with creator auth
2. No site header/footer (portal layout)
3. CreatorSidebar renders with navigation groups (PROMOTE, MONEY, GROW, ACCOUNT)
4. CreatorHeader renders with performance metrics
5. Dashboard: Performance section visible
6. Dashboard: Commissions section visible
7. Dashboard: Growth section visible
8. Getting Started checklist renders (dynamic)
9. Sidebar navigation links all resolve (click each → no 404)
10. Screenshot of creator dashboard

#### `e2e/creators/portal-earnings.spec.ts` (7 tests)

1. `/creators/portal/earnings` loads
2. Earnings overview section renders
3. Commission ledger table renders
4. Attributed orders list renders
5. Earnings figures display (even if $0 for new creators)
6. Commission status badges (pending, approved, paid) render
7. Screenshot of earnings page

#### `e2e/creators/portal-share.spec.ts` (8 tests)

1. `/creators/portal/share` loads
2. Tracking links section renders
3. Each tracking link shows URL + copy button
4. Copy button copies link to clipboard
5. Coupon codes section renders
6. Coupon codes show code + discount percentage
7. Link destinations include: Homepage, Pricing, GLP-1, Quiz, FAQ
8. Screenshot of share page

#### `e2e/creators/portal-network.spec.ts` (5 tests)

1. `/creators/portal/network` loads
2. Referral network section renders
3. Override commission rates displayed by tier
4. Recruit list renders (may be empty for new creators)
5. Screenshot of network page

#### `e2e/creators/portal-settings.spec.ts` (10 tests)

1. `/creators/portal/settings` loads
2. Profile settings form renders
3. Payout method selector (Stripe Connect / bank / PayPal) visible
4. `/creators/portal/support` loads
5. Support ticket form renders
6. `/creators/portal/resources` loads with resource list
7. Resource cards link to `/creators/portal/resources/[slug]`
8. `/creators/portal/payouts` loads
9. Payout history table renders (may be empty)
10. `/creators/portal/campaigns` loads

---

### ADMIN PANEL (6 files, ~49 tests)

#### `e2e/admin/dashboard.spec.ts` (12 tests)

1. `/admin` with admin auth → dashboard loads
2. `/admin` without auth → redirect to login
3. Metric cards render (revenue, orders, members, etc.)
4. Revenue time series chart renders (Recharts)
5. Period selector (30/60/90 days) changes displayed data
6. Invoice aging table renders
7. Cron status monitor renders
8. GET `/api/admin/analytics` returns valid JSON
9. No console errors on dashboard
10. Dashboard loads within 10 seconds (performance)
11. Mobile layout — metric cards stack
12. Screenshot of admin dashboard

#### `e2e/admin/orders.spec.ts` (10 tests)

1. `/admin/orders` loads with order list
2. Order table shows: order number, customer, status, date, amount
3. Order status badges render with correct colors
4. Order search/filter functionality works
5. Order pagination works
6. `/admin/club-orders` loads
7. Club orders list renders with status (pending/approved/rejected)
8. Expandable order detail rows work
9. Approve button visible on pending club orders
10. Screenshot of orders page

#### `e2e/admin/customers.spec.ts` (7 tests)

1. `/admin/customers` loads with customer list
2. Customer table renders with columns
3. Customer detail modal opens on row click
4. Customer detail shows order history, subscription info
5. `/admin/members` loads
6. Member management table renders
7. Screenshot of customers page

#### `e2e/admin/creators-management.spec.ts` (10 tests)

1. `/admin/creators` loads with creator list
2. Creator table shows: name, status, tier, commission rate
3. `/admin/creators/approvals` loads with pending applications
4. Approve/reject buttons visible on pending creators
5. `/admin/creators/coupons` loads with coupon list
6. Coupon table shows: code, creator, discount, usage count
7. `/admin/creators/payouts` loads with payout history
8. Payout table shows: creator, amount, status, date
9. Creator link performance section (clicks, conversions)
10. Screenshot of creator management

#### `e2e/admin/intakes.spec.ts` (5 tests)

1. `/admin/intakes` loads with intake list
2. Intake table renders with submission data
3. Intake detail expandable row or modal works
4. Status filtering works
5. Screenshot of intakes page

#### `e2e/admin/marketing.spec.ts` (5 tests)

1. `/admin/marketing` loads
2. Marketing dashboard metrics render
3. `/admin/marketing/waitlist` loads with waitlist entries
4. Waitlist table renders with email, date columns
5. `/admin/inventory` loads with inventory data

---

### VISUAL / BRAND (3 files, ~35 tests)

#### `e2e/visual/brand-consistency.spec.ts` (15 tests)

1. CULTR Health logo loads on every page (`cultr-health-logo.png`)
2. Logo is not broken/missing on any public page
3. `font-display` (Playfair Display) loads — headings use it
4. `font-body` (Inter) loads — body text uses it
5. Brand primary color `#2A4542` used on buttons
6. Brand cream background `#FDFBF7` on page body
7. Sage accent `#B7E4C7` used on badges/accents
8. Footer dark section uses grad-dark styling
9. All `<Button variant="primary">` elements have `rounded-full`
10. "CULTR" text in Playfair Display, "Health" subtitle correct
11. Homepage h1: "rebrand" is lowercase italic
12. Social handles point to `@cultrhealth` on all platforms
13. No `cultr-copper` or `cultr-charcoal` colors used (deprecated tokens)
14. DispensingPharmacyInfo present in footer
15. "48 states" availability text in footer

#### `e2e/visual/responsive-layout.spec.ts` (10 tests, run at all 5 breakpoints)

1. No horizontal scrollbar / overflow-x on homepage
2. No horizontal overflow on pricing page
3. No horizontal overflow on therapies page
4. No horizontal overflow on quiz pages
5. No text truncation cutting off content
6. No overlapping elements on any page
7. Images don't overflow their containers
8. Mobile nav drawer covers full viewport
9. Cards/grids reflow correctly (3-col → 2-col → 1-col)
10. Full-page screenshots at each breakpoint for key pages

#### `e2e/visual/images-assets.spec.ts` (10 tests)

1. All `<img>` tags on homepage have non-empty `src` that resolves (no 404)
2. All `<img>` tags have non-empty `alt` text
3. Hero image `hero-cultr-diverse-women.png` loads and renders
4. Lifestyle videos (`.mp4`) load without errors
5. Product images in shop load (no broken thumbnails)
6. Creator brand kit assets exist: `cultr-logo-dark.png`, `cultr-logo-white.png`
7. Footer logo renders with inverted filter
8. No mixed content warnings (HTTP images on HTTPS)
9. OG image (`og-image.png`) accessible
10. Favicon loads

---

## Summary

| Area | Files | Tests |
|---|---|---|
| Public marketing site | 11 | ~131 |
| Authentication | 4 | ~33 |
| Join / Checkout | 4 | ~39 |
| Members area | 6 | ~53 |
| Intake flow | 1 | ~20 |
| Creator portal | 7 | ~58 |
| Admin panel | 6 | ~49 |
| Visual / Brand | 3 | ~35 |
| **Total** | **42 files** | **~418 tests** |

Plus 3 fixture/helper files (`auth.ts`, `brand.ts`, `screenshots.ts`).

---

## NPM Script

```json
{
  "test:e2e": "npx playwright test",
  "test:e2e:public": "npx playwright test e2e/public/",
  "test:e2e:auth": "npx playwright test e2e/auth/",
  "test:e2e:join": "npx playwright test e2e/join/",
  "test:e2e:members": "npx playwright test e2e/members/",
  "test:e2e:intake": "npx playwright test e2e/intake/",
  "test:e2e:creators": "npx playwright test e2e/creators/",
  "test:e2e:admin": "npx playwright test e2e/admin/",
  "test:e2e:visual": "npx playwright test e2e/visual/",
  "test:e2e:report": "npx playwright show-report test-results/report"
}
```
