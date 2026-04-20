# Codebase Structure

*Last updated: 2026-04-20*
*Scope: cultrhealth.com + cultrclub.com*

## Repo Layout (Two Sibling Apps)

```
/Users/davidk/Documents/Dev-Projects/App-Ideas/
├── Cultr Health Website/   # cultrhealth.com — Vercel / Next.js 14
└── cultrclub-web/          # cultrclub.com  — Cloudflare Pages / Next.js 15
```

Both repos are independent (separate `package.json`, `.git`, and deploy pipelines). They share one Neon Postgres database (schema owned by the cultrhealth.com repo's `migrations/`).

---

## cultrhealth.com — `Cultr Health Website/`

### Top-Level

```
Cultr Health Website/
├── app/                    # Next.js 14 App Router — pages, APIs, layouts (~45 pages, 118 API routes)
├── components/             # React components (organized by domain)
├── lib/                    # Business logic, config, integrations, DB helpers
├── migrations/             # SQL migrations (~60 files — single source of schema truth for both apps)
├── tests/                  # Vitest + RTL (smoke, integration, components, lib, api)
├── e2e/                    # Playwright E2E specs
├── scripts/                # One-off maintenance and setup scripts
├── content/                # Markdown content (library + legacy blog)
├── public/                 # Static assets (images, logos, PDFs)
├── docs/                   # Internal documentation
├── hooks/                  # Ralph agent hooks
├── .claude/                # Claude Code agent config (commands, hooks, skills-lock)
├── .agent/  .agents/       # Agent/skills manifests (typescript-expert, codex, etc.)
├── .ralph/ .ralphrc        # Ralph autonomous dev loop config
├── middleware.ts           # Session idle timeout + canonical host + legacy-host 404 shim
├── next.config.js          # Image optimization, CSP, caching headers, redirects
├── vercel.json             # Cron schedules + deploy-disabled main branch
├── tailwind.config.ts      # Design tokens (brand colors, aura-*, cultr-*)
├── package.json            # Next.js 14, Stripe, @vercel/postgres, jose, Resend, Zod, AI SDK
├── CLAUDE.md               # Canonical AI/contributor guide (self-correcting)
├── .cursorrules            # 23-section guardrails for Cursor IDE
└── CHANGELOG.md            # Human-readable deploy history
```

### `app/` — Routes & APIs

```
app/
├── page.tsx                        # Homepage (server component; sections built inline; dynamic imports below fold)
├── layout.tsx                      # Root layout: fonts, GA, MeshBackgroundDynamic, LayoutShell
├── globals.css                     # Tailwind base + brand utilities
├── error.tsx  not-found.tsx
├── robots.ts  sitemap.ts           # SEO
├── opengraph-image.png  twitter-image.png
│
├── admin/                          # Admin panel (role-gated)
│   ├── page.tsx + AdminDashboardClient.tsx
│   ├── club-orders/                # Full pipeline UI (PIPELINE_ORDER from lib/admin-club-orders.ts)
│   ├── creators/                   # approvals/, coupons/, payouts/
│   ├── customers/                  # Customer master list + detail modal
│   ├── dosing-rules/               # AI dosing-engine rules admin
│   ├── intakes/                    # Intake review + manual processing
│   ├── inventory/                  # 3-tab per-site product inventory editor
│   ├── marketing/                  # waitlist/, quiz-leads
│   ├── members/                    # Member management (edit/delete; force-delete with orders)
│   └── orders/                     # All-orders mixed list (club rows distinguished from product rows)
│
├── api/                            # 118 route.ts files (see ARCHITECTURE.md for full category map)
│   ├── admin/                      # analytics, asher-dashboard, club-members, club-orders/[orderId],
│   │                               #   creators/[id]/{approve,reject,payouts/batch,codes}, customers,
│   │                               #   cron-status, dosing-rules, intakes, inventory, members, orders,
│   │                               #   prelaunch-codes, qr-scans, restore-session, siphox-smoke
│   ├── auth/                       # magic-link, verify, logout, dev-login (staging only)
│   ├── checkout/                   # route.ts (subscription), product/, subscription/, corepay/
│   ├── club/                       # check-member, event, login, orders, signup, validate-coupon
│   ├── creators/                   # apply, magic-link, verify-login, verify-email, dashboard,
│   │                               #   profile, links, codes, network, payouts, earnings/{overview,
│   │                               #   orders,ledger}, leaderboard, labs, dosing, support, results
│   ├── cron/                       # approve-commissions, update-tiers, stale-orders,
│   │                               #   siphox-fulfillment, siphox-results, siphox-status-sync, asher-sync
│   ├── intake/submit/              # Submit medical intake
│   ├── lmn/                        # list, generate, [lmnNumber]
│   ├── meal-plan/  protocol/generate/  # AI endpoints
│   ├── member/                     # profile, orders, files, labs, medical-records, results,
│   │                               #   transactions, dosing
│   ├── onboarding/status/          # Post-checkout onboarding state
│   ├── portal/                     # send-otp, verify-otp, refresh, logout, labs, results,
│   │                               #   documents, orders, profile, stacking-content
│   ├── protocol/generate/
│   ├── quickbooks/{auth,callback}/ # OAuth2 flow
│   ├── quiz/submit/                # POST submit, PATCH lead-mirror (waitlist table)
│   ├── quote/                      # Quote generator
│   ├── stock/                      # Inventory lookup
│   ├── supplement-order/           # Supplement reorders
│   ├── track/                      # click, daily, qr-scan
│   ├── waitlist/
│   └── webhook/                    # stripe/, quickbooks/, healthie/, calendly/ (signature-verified)
│
├── creators/                       # Creator-facing pages
│   ├── page.tsx                    # Program landing
│   ├── apply/  login/  pending/
│   ├── [slug]/page.tsx             # Public creator profile
│   └── portal/                     # Authenticated portal (hidden from site chrome)
│       ├── dashboard/  earnings/  network/  payouts/  share/  campaigns/
│       ├── resources/  settings/  support/  labs/  dosing-calculator/
│
├── members/                        # Member library (was /library; redirects preserved)
│   ├── page.tsx  [category]/
│   ├── shop/page.tsx + ShopClient.tsx + [sku]/
│   ├── cart/  quote-success/
│   ├── consultations/              # Telehealth (Calendly embed)
│   ├── labs/  lab-instructions/
│   ├── calorie-calculator/  dosing-calculator/  peptide-faq/  stacking-guides/
│
├── portal/                         # Siphox/labs customer portal (separate from /members)
│   ├── login/  dashboard/  labs/  documents/  profile/  stacking/
│
├── intake/                         # Medical intake (multi-step)
│   ├── page.tsx + IntakeFormClient.tsx
│   └── success/
│
├── onboarding/                     # Post-checkout onboarding flow
├── success/                        # Stripe success landing
├── login/                          # Member login + choose-area selector
├── dashboard/                      # Member dashboard
│
├── quiz/  therapies/  pricing/  how-it-works/  faq/  tools/  community/
├── legal/                          # privacy, terms, medical-disclaimer, provider-credentials
├── science/  science/[slug]/       # 301-redirected to / (LegitScript compliance shim)
├── products/                       # 301-redirected to /pricing
├── terms/                          # Legacy terms shim
│
├── go/[destination]/route.ts       # QR code redirect w/ device + geo analytics
├── r/[slug]/route.ts               # LEGACY creator tracking link; primary now on cultrclub.com/<slug>
│
└── join/                           # **LEGACY — see "Deprecated" section below**
    ├── page.tsx  layout.tsx  JoinLandingClient.tsx
    └── [tier]/page.tsx
```

### `components/` — React components (organized by domain)

```
components/
├── ui/                             # Primitives
│   ├── Aura.tsx  Button.tsx  Input.tsx  Spinner.tsx
│   ├── ScrollReveal.tsx  SectionWrapper.tsx  PageTransition.tsx
│   ├── WavyBackground.tsx  MeshBackground.tsx  MeshBackgroundDynamic.tsx
│   ├── Marquee.tsx  TextShimmer.tsx  ParallaxReveal.tsx
│   ├── CalendlyEmbed.tsx  HoverCard.tsx  NavDock.tsx
│   └── apple-cards-carousel.tsx    # Shared carousel primitive
│
├── site/                           # Marketing site chrome + sections
│   ├── Header.tsx  Footer.tsx  LayoutShell.tsx  LayoutShellClient.tsx
│   ├── MarketingHero.tsx  CTASection.tsx  FAQAccordion.tsx
│   ├── PricingCard.tsx  ComparisonTable.tsx  TherapiesGrid.tsx
│   ├── HowItWorksSteps.tsx  TherapyGoalFilter.tsx  TrustStrip.tsx
│   ├── TrustMarquee.tsx  TestimonialsSection.tsx  SocialProofBadge.tsx
│   ├── ProductCard.tsx  CommunityFeed.tsx (Curator.io)
│   ├── NewsletterSignup.tsx  LeadCapturePrompt.tsx  ClubBanner.tsx
│   ├── BiomarkerExplainer.tsx  BiomarkerScroll.tsx
│
├── admin/                          # Admin layouts + shared admin widgets
│   ├── AdminLayoutClient.tsx  AdminSidebar.tsx
│   ├── MetricCard.tsx  PrelaunchCodesSection.tsx
│   └── ClubOrderBulkActions.tsx  ClubOrderStageControls.tsx
│
├── compliance/                     # LegitScript components
│   ├── ConsentModal.tsx  FDAStatusBadge.tsx  FloridaStateGate.tsx
│   ├── PrescriptionDisclaimer.tsx  TestimonialDisclaimer.tsx
│   └── DispensingPharmacyInfo.tsx
│
├── creators/                       # Creator portal UI
│   ├── CreatorHeader.tsx  CreatorSidebar.tsx
│   ├── AnalyticsCharts.tsx (only Recharts consumer)
│   ├── Leaderboard.tsx  Milestones.tsx  NotificationBell.tsx
│
├── dashboard/                      # Member biomarker dashboard
│   ├── BiologicalAgeCard.tsx  BiomarkerTrends.tsx
│
├── intake/                         # Multi-step intake
│   ├── IntakeFormClient.tsx  TypeformStep.tsx
│
├── library/                        # Member library widgets
│   ├── MemberSidebar.tsx  MemberDashboard.tsx
│   ├── CategoryGrid.tsx  MasterIndex.tsx  ProductCatalog.tsx  TierGate.tsx
│   ├── MedicalRecords.tsx  MemberFiles.tsx  MyProviders.tsx  TransactionHistory.tsx
│
├── payments/                       # Payment provider UI
│   ├── CorePayForm.tsx  PaymentMethodSelector.tsx  PaymentProviderLoader.tsx
│
├── portal/                         # Siphox labs portal
│   ├── PortalSidebar.tsx
│   ├── KitEmptyState.tsx  KitDetailCard.tsx  KitRegistrationForm.tsx  KitTimeline.tsx
│   ├── LabsResultsView.tsx
│   ├── BiomarkerCategoryCard.tsx  BiomarkerDetailModal.tsx  ReferenceRangeBar.tsx
│
├── dosing-ai/                      # AI dosing engine UI
│   ├── AiDosingEnginePanel.tsx  AiDosingQuestionFlow.tsx  RecommendationCard.tsx
│
└── CultrBackground.tsx             # Top-level background wrapper
```

### `lib/` — Business logic & integrations

```
lib/
├── auth.ts                         # JWT sign/verify (jose), cookie helpers
├── db.ts                           # @vercel/postgres wrapper; NUMERIC coercion helpers
├── utils.ts                        # cn() (clsx + tailwind-merge)
├── validation.ts                   # Zod schemas
├── rate-limit.ts                   # apiLimiter, formLimiter, strictLimiter (Upstash/memory)
├── resilience.ts                   # Retry + circuit breaker
├── resend.ts                       # Email templates, escapeHtml, brandedEmailHeader/Footer
├── contacts.ts  mailchimp.ts       # Mailchimp sync
├── turnstile.ts                    # Cloudflare Turnstile verification
├── analytics.ts                    # GA event wrapper
├── hipaa-logger.ts                 # Safe logger — never logs PHI
├── cron-logger.ts                  # startCronRun() → cron_runs table
├── intake-utils.ts                 # Intake data normalization
├── data-normalization.ts  phone.ts # Shared normalizers
├── admin-club-orders.ts            # PIPELINE_ORDER, PIPELINE_STATUSES (canonical pipeline)
├── admin-types.ts  admin-utils.ts
├── library-content.ts  protocol-templates.ts  calorie-calculator.ts
├── peptide-calculator.ts           # Syringe-visualization dosage calc
├── cart-context.tsx                # Member shop cart context
├── quickbooks.ts                   # QBO OAuth2 + invoicing
├── asher-med-api.ts                # Historical Asher Med client (removed Apr 4 2026; kept for audits)
├── portal-auth.ts  portal-db.ts  portal-orders.ts  # Siphox portal
├── blog-content.ts                 # LEGACY — blog removed Apr 2026
│
├── config/                         # Static configuration sources of truth
│   ├── affiliate.ts                # Commission rates, tier config, FTC disclosures
│   ├── asher-med.ts                # Historical integration config
│   ├── compliance.ts               # JURISDICTION_STATEMENT (Florida-only)
│   ├── coupons.ts                  # CLUB_COUPONS + validateCouponUnified()
│   ├── feature-flags.ts
│   ├── join-therapies.ts           # Club storefront catalog + bundle discount math
│   ├── links.ts                    # Central URL registry (no join.cultrhealth.com)
│   ├── owner-emails.ts             # Admin-aggregate exclusions
│   ├── payments.ts                 # Payment provider config
│   ├── plans.ts                    # Membership tiers (Club, Core, Catalyst+, Concierge)
│   ├── product-catalog.ts          # Members shop catalog
│   ├── product-to-asher-mapping.ts # Legacy mapping
│   ├── products.ts                 # Product defs
│   ├── quiz.ts                     # Quiz question/answer config
│   ├── siphox-biomarkers.ts
│   ├── social-proof.ts             # Testimonials, providers, trust badges
│   ├── tax.ts                      # FL_TAX_RATE, calculateTaxDollars
│   ├── therapies.ts  us-states.ts
│   └── vitamin-catalog.ts
│
├── contexts/                       # React Context providers
│   ├── CreatorContext.tsx
│   └── JoinCartContext.tsx
│
├── creators/                       # Creator affiliate business logic
│   ├── attribution.ts              # Click tracking, cookie resolution
│   ├── commission.ts               # Direct + override commission engine, ledger lifecycle
│   └── db.ts                       # Creator DB ops (getCreatorById, approveEligibleCommissions, etc.)
│
├── healthie/                       # Healthie EHR client
│   ├── index.ts  client.ts  queries.ts  mutations.ts  schemas.ts  types.ts
│   ├── patient-sync.ts  lab-sync.ts  portal-mapper.ts  webhooks.ts
│
├── siphox/                         # Siphox labs integration
│   ├── index.ts  client.ts  db.ts  errors.ts  schemas.ts  types.ts
│   ├── biomarkers.ts  kit-lifecycle.ts  reports.ts  fulfillment.ts
│
├── dosing-engine/                  # AI-powered peptide dosing recommender
│   ├── engine.ts  types.ts  validation.ts  conversions.ts
│   └── config/                     # Rule definitions
│
├── invoice/                        # PDF invoice generation
│   ├── index.ts  invoice-generator.tsx  invoice-template.tsx  invoice-types.ts
│
├── lmn/                            # Lab Management Numbers (PDF docs)
│   ├── index.ts  lmn-generator.tsx  lmn-template.tsx  lmn-types.ts  lmn-eligibility.ts
│
├── payments/                       # Payment provider APIs
│   ├── corepay-gateway.ts  payment-types.ts
│
└── utils/                          # Small helpers
    ├── health.ts  phone.ts
```

### `migrations/` — SQL files (schema source of truth for both apps)

| File | Purpose |
|---|---|
| `002_orders_table.sql` | Main `orders` table |
| `003_lmn_table.sql` | LMN records |
| `004_payment_provider.sql` | Multi-provider payments |
| `005_rejuvenation_data.sql` | Historical biomarker data |
| `006_fix_constraints.sql` | Schema constraint fixes |
| `007_stripe_idempotency.sql` | Stripe webhook dedup |
| `008_asher_med_tables.sql` | Asher Med tables (kept for historical audit) |
| `009_creator_affiliate_portal.sql` | Full creator system (8 tables) |
| `010_club_orders.sql` | `club_members` + `club_orders` |
| `010_consult_requests.sql` | Consultation bookings |
| `011_quickbooks_tokens.sql` | QBO OAuth storage |
| `012_club_orders_coupon.sql` | Club order coupon fields |
| `012_drop_healthie_columns.sql` | Drop Healthie remnants |
| `013_commission_overhaul.sql` | Rewritten commission ledger logic |
| `014_portal_sessions.sql` | Siphox portal sessions |
| `015_club_orders_tax.sql` | Tax fields on club orders |
| `016_stripe_promotion_codes.sql` | Stripe promo code sync |
| `017_club_member_address.sql` | Address columns on club members |
| `018_club_orders_attribution.sql` | `attributed_creator_id`, `attribution_method` |
| `019_uploaded_files_patient_id.sql` | Patient file linkage |
| `020_siphox_tables.sql` | Siphox kit tables |
| `021_siphox_fulfillment_columns.sql` | Fulfillment columns |
| `022_siphox_results_notification.sql` | Result-ready notification state |
| `023_qr_scans.sql` | QR scan analytics |
| `024_prelaunch_codes.sql` | Prelaunch program (+ **critical** fix: creator coupons were silently failing before this) |
| `025_jon21_discount_10.sql` | JON21 coupon rate = 10% |
| `026_stewart1_discount_consolidation.sql` | STEWART1 consolidation |
| `027_member_creator_age_gender.sql` | Age + gender on club_members / creators |
| `027_siphox_relax_fk.sql` | Relax Siphox FK |
| `028_club_orders_token_expiry.sql` | `token_expires_at` on approvals |
| `029_cron_runs.sql` | Cron execution log |
| `029_telehealth_consultations.sql` | Day-level consult table |
| `030_remove_cascade_medical_records.sql` | Drop CASCADE to protect PHI |
| `030_stewart1_discount_20.sql` | STEWART1 rate update |
| `031_memberships_email.sql` | Membership email mapping |
| `032_club_orders_shipment.sql` | Shipment fields |
| `033_club_order_fulfillment.sql` | Fulfillment status refinements |
| `034_product_inventory.sql` | `product_inventory` (status + qty) |
| `035_quiz_responses.sql` | Quiz response capture |
| `036_add_creator_hannah_goldy.sql` | Seed |
| `037_generic_ehr_identity.sql` | EHR-agnostic identity layer |
| `038_membership_shipping_address.sql` | Shipping data on memberships |
| `039_siphox_ehr_linkage.sql` | Siphox↔EHR linkage |
| `040_member_onboarding.sql` | Post-checkout onboarding state |
| `041_add_creator_cole_sidner.sql` | Seed |
| `042_add_creator_cameron_donahue.sql` | Seed |
| `043_add_bac_water_inventory.sql` | Inventory seed |
| `044_seed_shop_product_inventory.sql` | Inventory seed |
| `045_visitor_tracking.sql` | First-touch UTM tracking |
| `046_add_membership_codes_cole_cameron.sql` | Seed |
| `047_cleanup_cole_sidner_codes.sql` | Cleanup |
| `048_add_igf1_lr3_inventory.sql` | Inventory seed |
| `049_dosing_rules_engine.sql` | AI dosing rules table |
| `050_invoice_sent_at.sql` | Invoice timestamp |
| `051_add_restocking_soon_status.sql` | 4th stock status (`restocking_soon`) |
| `052_club_orders_coupon_discount_usd.sql` | USD coupon discount on club orders |
| `053_inventory_site_source.sql` | `site_source` column + composite uniqueness — **the key to cultrhealth↔cultrclub inventory separation** |
| `055_seed_current_shop_inventory.sql` | Inventory seed |
| `056_quiz_lead_capture.sql` | Lead-capture columns on `quiz_responses` |
| `backfill_click_conversions.sql` | One-off backfill |
| `backfill_creator_attributions.sql` | One-off backfill |

Note: some numbers are duplicated (e.g. two `010_*`, two `027_*`, two `029_*`, two `030_*`, two `037_*`, two `038_*`, two `039_*`, two `040_*`). These were split-file migrations run sequentially; `037_generic_ehr_identity 2.sql`, `038_membership_shipping_address 2.sql`, `039_siphox_ehr_linkage 2.sql`, and `040_member_onboarding 2.sql` exist as re-runnable duplicates with a ` 2.sql` suffix. Flag for cleanup but treat live naming as canonical.

### `tests/` — Vitest + RTL + Playwright hand-off

```
tests/
├── setup.ts  vitest.d.ts
├── api/                            # API route tests
├── components/                     # React component tests
│   ├── AppleCardsCarousel.test.tsx  ClubOrdersTab.test.tsx  ConsentModal.test.tsx
│   ├── BiomarkerCategoryCard.test.tsx  BiomarkerDetailModal.test.tsx
│   ├── FloridaStateGate.test.tsx  HomePageHero.test.tsx
│   ├── IntakeFormClient.test.tsx  JoinCartContext.test.tsx  JoinLandingClient.test.tsx
│   ├── KitRegistrationForm.test.tsx  KitTimeline.test.tsx
│   ├── LabsClient.test.tsx  LabsResultsView.test.tsx
│   ├── OnboardingClient.test.tsx  OrdersClient.test.tsx
│   ├── PortalLogin.test.tsx  TierGate.test.tsx
├── integration/                    # Cross-module + real-DB tests
│   ├── intake-submission-e2e.test.ts
│   ├── coupon-attribution-e2e.test.ts
│   ├── creator-e2e-jon-collins.test.ts
│   ├── protocol-engine.test.ts
│   └── healthie-availability-diagnosis.test.ts
├── lib/                            # Pure-function tests
├── smoke/                          # Prod-like smoke tests
│   ├── critical-pages.test.ts  critical-apis.test.ts
│   ├── middleware-session-timeout.test.ts
│   └── join-routing.test.ts
└── healthie-url-diagnosis.test.ts
```

E2E specs live in `e2e/` (Playwright; includes `e2e/admin/`, `e2e/join/`, `e2e/visual/`).

### `content/` — Markdown content

```
content/
├── blog/                           # LEGACY — removed Apr 2026 for LegitScript compliance; directory remains
└── library/                        # Peptide library articles (gray-matter + marked + DOMPurify)
    ├── index.md  bioregulators.md  growth-factors.md  metabolic.md
    ├── products.md  repair-recovery.md  lab-instructions.md  stack-guides.md
```

### `scripts/` — Maintenance & setup

```
scripts/
├── run-migration.mjs               # Execute a specific SQL file in migrations/
├── setup-stripe.ts                 # One-time Stripe product/price bootstrap
├── audit-admin-data.mjs            # Admin data integrity audit
├── backfill-club-order-statuses.mjs
├── cleanup-stale-club-orders.mjs
├── run-crons-manual.mjs            # Manually invoke cron endpoints
├── sync-stripe-promo-codes.mjs     # Push affiliate_codes → Stripe promo codes
├── generate-business-card.mjs  generate-cream-logo.mjs  generate-media-kit.tsx
├── site-health-check.mjs           # Called via `npm run check:health`
├── set-creator-slug.mjs  test-consult-email.mjs  test-coupon.ts
├── fonts/                          # Raw font assets for PDF generation
├── _tmp_stewart.mjs  _tmp_stripe.mjs  # Temporary scratch scripts (should not be committed long-term)
```

---

## cultrclub.com — `cultrclub-web/`

### Top-Level

```
cultrclub-web/
├── app/                            # Next.js 15 App Router — all routes edge runtime
├── components/                     # Minimal shared UI (only Button + apple-cards-carousel today)
├── lib/                            # Edge-safe helpers (DB, auth, utils, integrations)
├── hooks/                          # React hooks
├── types/                          # Local type declarations (fetch.d.ts)
├── public/                         # Static assets + _headers + robots disallow stack
├── middleware.ts                   # Canonical redirect + stealth headers + UTM capture
├── next.config.js                  # CSP + X-Robots-Tag + images.unoptimized
├── wrangler.toml                   # Cloudflare Pages config; nodejs_compat flag
├── tailwind.config.ts              # Same brand tokens as cultrhealth.com
├── package.json                    # Next 15.5.2, @neondatabase/serverless, jose, stripe, resend, lucide
├── worker-configuration.d.ts       # Generated Cloudflare Worker types
└── .wrangler/                      # Wrangler build artifacts (gitignored)
```

### `app/` — Routes

```
app/
├── layout.tsx                      # Root layout. metadata.title = '—' (stealth); robots: all false; HubSpot script
├── page.tsx                        # SERVER component — reads cultr_club_visitor cookie → verifyClubVisitorToken
│                                   #   → SELECT from club_members → passes serverMember prop
├── JoinLandingClient.tsx           # 1,477-line client component — cart, carousel, modals, coupon, checkout
├── globals.css
├── robots.ts                       # Programmatic robots.txt — preview-bot allowlist + catch-all disallow
│
├── [slug]/route.ts                 # Edge tracking-link handler (creator slug → click_events → cookie)
│
├── api/                            # All edge runtime ('export const runtime = "edge"')
│   ├── club/
│   │   ├── check-member/route.ts   # Email-based member lookup (post-signup refresh)
│   │   ├── signup/route.ts         # Create club_members row
│   │   ├── login/route.ts          # Email+phone login → issue cultr_club_visitor JWT (anti-enumeration)
│   │   ├── orders/route.ts         # Checkout: validates coupon/stock/bundle, HMAC approval token,
│   │   │                           #   transactional upsert of member + club_orders, writes order_attributions
│   │   ├── validate-coupon/route.ts # Unified coupon validator (CLUB_COUPONS + DB affiliate_codes)
│   │   └── event/route.ts          # Analytics beacon
│   ├── stock/route.ts              # Public stock status; prefers site_source='cultrclub'
│   └── health/route.ts             # Health probe
│
└── tv/                             # Signage/display screens (no chrome; full-bleed media)
    ├── page.tsx  1/  2/  3/  banner/  video-1/  video-2/
```

### `components/`

```
components/
└── ui/
    ├── Button.tsx                  # Mirrors cultrhealth.com Button variants
    └── apple-cards-carousel.tsx    # Carousel primitive for the storefront
```

Everything else (checkout UI, signup modal, login modal, cart, carousel shell) is inlined in `app/JoinLandingClient.tsx`.

### `lib/`

```
lib/
├── db.ts                           # Proxy-wrapped neon(POSTGRES_URL, { fullResults: true }) + createPool()
├── auth.ts                         # createClubVisitorToken / verifyClubVisitorToken (jose, 90-day)
├── utils.ts                        # cn(), getCookieDomain(hostname), parseCookieJson()
├── rate-limit.ts                   # formLimiter, strictLimiter (edge-safe)
├── turnstile.ts                    # Cloudflare Turnstile verify
├── resend.ts                       # escapeHtml, brandedEmailHeader/Footer, EMAIL_FONT_IMPORT
├── mailchimp.ts                    # syncContactToMailchimp
│
├── config/
│   ├── affiliate.ts                # COMMISSION_CONFIG, tier helpers (mirror of cultrhealth.com)
│   ├── coupons.ts                  # CLUB_COUPONS + validateCouponUnified()
│   ├── join-therapies.ts           # Product catalog + BUNDLE_DISCOUNT_RATE + getJoinCouponPolicy +
│   │                               #   normalizeJoinCartItems + calculateBundleDiscount
│   └── tax.ts                      # FL_TAX_RATE, calculateTaxDollars, TAX_RATE_LABEL
│
├── contexts/
│   └── JoinCartContext.tsx
│
└── creators/
    ├── attribution.ts              # resolveAttribution, handleClickTracking, serializeAttributionCookie
    ├── commission.ts               # calculateOverrideCommission + shared helpers
    └── db.ts                       # Creator DB ops (subset of cultrhealth.com's; only what edge paths need)
```

### `hooks/`

```
hooks/
└── use-outside-click.ts            # Click-outside detector for modals/dropdowns
```

### `middleware.ts`

Three concerns (see ARCHITECTURE for details):

1. Canonical `www.cultrclub.com → cultrclub.com` 301 redirect.
2. Stealth `X-Robots-Tag` + security headers (excluding the preview-bot allowlist).
3. First-touch UTM capture into `cultr_visitor_ctx` cookie on `.cultrclub.com`.

### Cloudflare-Specific Files

| File | Role |
|---|---|
| `wrangler.toml` | `compatibility_flags = ["nodejs_compat"]`, `pages_build_output_dir = ".vercel/output/static"` |
| `public/_headers` | Cloudflare Pages headers for **static assets** (Pages drops `next.config.js` `headers()` for static routes — this file fills the gap) |
| `.wrangler/` | Wrangler local build cache (gitignored) |
| `.vercel/output/static/` | `@cloudflare/next-on-pages` build output (gitignored) |
| `worker-configuration.d.ts` | Auto-generated worker type definitions |
| `types/fetch.d.ts` | Edge-runtime fetch typing shim |

### `public/`

```
public/
├── _headers                        # Cloudflare Pages static-asset headers (X-Robots-Tag, CSP, etc.)
├── cultr-health-logo.png           # Shared brand logo
├── og-image.png  twitter-card.png  # Social preview assets (match cultrhealth.com)
├── images/                         # Product photography
│   └── products/
├── pdfs/                           # Downloadable product docs
│   └── products/
└── tv/                             # Video/image assets for /tv screens
```

---

## Legacy / Deprecated Code

Items still present in the tree that are **superseded or to be removed**. None of these should be treated as current architectural elements.

### cultrhealth.com

| Path | Status | Action |
|---|---|---|
| `app/join/` (including `page.tsx`, `layout.tsx`, `JoinLandingClient.tsx`, `[tier]/page.tsx`) | **Legacy** — the customer storefront now lives at cultrclub.com. The bare `/join` route is 301-redirected to `/pricing` by `next.config.js`, and the `middleware.ts` legacy-host shim 404s any `join.*` traffic. | Remove after confirming no internal links reference `/join/*` (in particular confirm the members portal and admin tooling don't). The `lib/contexts/JoinCartContext.tsx` is still exported from this app's `lib/` but the *live* cart context consumer is cultrclub.com — audit before deleting. |
| `app/r/[slug]/route.ts` | **Legacy** — creator tracking authority moved to `cultrclub.com/<slug>`. This handler still serves residual clicks that hit the cultrhealth domain. | Keep until 100% of distributed creator links resolve via cultrclub.com; then remove. |
| `components/sections/` | **Unused** — 9 files (Hero, Services, About, HowItWorks, Results, Pricing, Testimonials, FAQ, Waitlist) not imported anywhere. Homepage builds sections inline in `app/page.tsx`. | Safe to delete. |
| `components/Footer.tsx`, `components/Navigation.tsx`, `components/WaitlistForm.tsx` (root-level) | **Legacy** — superseded by `components/site/` equivalents. | Safe to delete after import scan. |
| `lib/stores/` | **Empty directory.** | Safe to delete. |
| `lib/blog-content.ts` | **Legacy** — blog removed Apr 2026 (LegitScript compliance). | Safe to delete once no stragglers import it. |
| `lib/asher-med-api.ts` | **Historical** — Asher Med integration fully removed Apr 4 2026; kept for audit trace. | Consider moving to `archive/`. |
| `content/blog/` | **Legacy** — markdown removed / redirected; directory may remain empty. | Safe to delete. |
| `app/science/`, `app/science/[slug]/` | **Shim** — 301-redirected to `/` in `next.config.js` for LegitScript compliance. Route files still exist. | Keep redirects; can remove route files. |
| `app/products/`, `app/terms/` | **Shim** — `app/products/` 301-redirects to `/pricing`; `app/terms/` is a sibling of `/legal/terms` (de-duplicate). | Consolidate to `/legal/terms`. |
| `class-variance-authority` in `package.json` | **Unused** — never imported. | Remove dependency. |
| Migrations with ` 2.sql` suffix (`037_generic_ehr_identity 2.sql`, `038_membership_shipping_address 2.sql`, `039_siphox_ehr_linkage 2.sql`, `040_member_onboarding 2.sql`) | **Duplicates** — likely macOS copy artifacts. | Verify against DB migration log; delete duplicates that weren't run. |
| `scripts/_tmp_stewart.mjs`, `scripts/_tmp_stripe.mjs` | **Scratch** — ad-hoc debugging scripts. | Delete. |
| `.next/`, `.vercel/`, `tsconfig.tsbuildinfo`, `node_modules/` in repo root | Build artifacts | Keep gitignored. |
| `/api/cron/asher-sync` | **Historical** — Asher Med removed. | Remove endpoint + cron entry. |

### cultrclub.com

| Path | Status | Action |
|---|---|---|
| `.placeholder` | Empty marker file from initial repo setup. | Safe to delete. |
| `.wrangler/`, `.vercel/output/`, `.next/` | Build artifacts | Gitignored; keep. |

---

## Where to Add New Code

### cultrhealth.com

| Need | Location |
|---|---|
| New admin page | `app/admin/<feature>/page.tsx` + `AdminClient.tsx`; add nav link to `components/admin/AdminSidebar.tsx` |
| New admin API | `app/api/admin/<feature>/route.ts`; wrap with `requireAdmin()` |
| New member-facing page | `app/members/<feature>/` |
| New creator portal page | `app/creators/portal/<feature>/page.tsx`; add to `CreatorSidebar.tsx` |
| New compliance copy | `components/compliance/` + `lib/config/compliance.ts` |
| New config constant | `lib/config/<domain>.ts` (create a new file rather than dumping into `plans.ts` or similar) |
| New shared helper | `lib/utils.ts` for pure utilities; `lib/utils/<topic>.ts` for bigger modules |
| New SQL migration | `migrations/NNN_description.sql` (use next available integer; run `node scripts/run-migration.mjs`) |
| New cron job | `app/api/cron/<name>/route.ts`, authenticate with `CRON_SECRET`, wrap in `startCronRun()`, add to `vercel.json` |
| New webhook | `app/api/webhook/<provider>/route.ts`; verify signature; dedup via `stripe_idempotency`-style table if applicable |
| New test (unit) | `tests/lib/<module>.test.ts` or `tests/components/<Component>.test.tsx` |
| New test (integration) | `tests/integration/<flow>.test.ts` |
| New Playwright spec | `e2e/<feature>/` |

### cultrclub.com

| Need | Location |
|---|---|
| New storefront section | Inline in `app/JoinLandingClient.tsx`; extract to `components/ui/` only when reused across `app/tv/` or similar |
| New public API | `app/api/<feature>/route.ts` — must `export const runtime = 'edge'` |
| Schema change | **Add the migration in `Cultr Health Website/migrations/`** (the cultrhealth repo owns the schema). Deploy that migration, then consume the new column here. |
| Config constant | `lib/config/<domain>.ts` |
| Signage / display screen | `app/tv/<name>/page.tsx` + assets under `public/tv/` |

---

*Structure analysis: 2026-04-20*
