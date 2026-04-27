# Codebase Structure

*Last updated: 2026-04-27*
*Scope: cultrhealth.com (this repo) + cultrhealth-web (sibling, CF Pages prod) + cultrclub.com*

## Repo Layout (Three Sibling Apps)

```
/Users/davidk/Documents/Dev-Projects/App-Ideas/
├── Cultr Health Website/   # cultrhealth.com SOURCE — authored here; deployed two ways
├── cultrhealth-web/        # cultrhealth.com — Cloudflare Pages production mirror (sibling repo, branch `main`)
└── cultrclub-web/          # cultrclub.com  — Cloudflare Pages / Next.js 15
```

**Cultr Health Website/** is the canonical source repo. **cultrhealth-web/** is a sibling repo containing the build artifacts and CF Pages config (`build:cf`, `deploy:prod`, `wrangler.toml`); it is what deploys to `cultrhealth.com` production. Pushes to `staging` branch of *this* repo deploy to `staging.cultrhealth.com` on Vercel. There is no GitHub auto-deploy for production — `npm run build:cf && npm run deploy:prod` is run manually from `cultrhealth-web/` on Node 20.

All three apps share one Neon Postgres database (schema owned by **this repo's** `migrations/`).

---

## cultrhealth.com — `Cultr Health Website/`

### Top-Level

```
Cultr Health Website/
├── app/                    # Next.js 14 App Router — pages, APIs, layouts (~82 page.tsx, 120 API routes)
├── components/             # React components organized by domain (97 .tsx)
├── lib/                    # Business logic, config, integrations, DB helpers
├── migrations/             # SQL migrations (76 files including duplicates — single source of schema truth)
├── tests/                  # Vitest + RTL (smoke, integration, components, lib, api) — 91 test files
├── e2e/                    # Playwright E2E specs
├── scripts/                # One-off maintenance + setup scripts
├── content/                # Markdown content (library + legacy blog files still on disk)
├── public/                 # Static assets (images, logos, PDFs, fonts)
├── docs/                   # Internal documentation
├── hooks/                  # Ralph agent hooks
├── .planning/              # GSD workspace (STATE.md, PROJECT.md, phases/, codebase/)
├── .claude/                # Claude Code agent config (commands, hooks, skills, worktrees)
├── .agent/  .agents/       # Agent/skills manifests (typescript-expert, codex, etc.)
├── .ralph/ .ralphrc        # Ralph autonomous dev loop config
├── middleware.ts           # Session idle timeout + canonical host + legacy-/join 404 shim
├── next.config.js          # Image optimization, CSP, caching headers, redirects
├── vercel.json             # Cron schedules + deploy-disabled main/master branches (staging only)
├── tailwind.config.ts      # Design tokens (brand colors, aura-*, cultr-*)
├── package.json            # Next.js 14, Stripe, @vercel/postgres, jose, Resend, Zod, AI SDK
├── CLAUDE.md               # Canonical AI/contributor guide (self-correcting)
├── .cursorrules            # 23-section guardrails for Cursor IDE
└── CHANGELOG.md            # Human-readable deploy history
```

The `cultrhealth-web/` sibling repo contains the same `app/`/`components/`/`lib/`/etc. tree plus a few CF-specific additions: `build:cf` and `deploy:prod` scripts in `package.json`, a `wrangler.toml`, and a `scripts/build-cf-safe.mjs` post-build asset-restoration helper. Edits should generally land in this repo first and then sync.

### `app/` — Routes & APIs

```
app/
├── page.tsx                        # Homepage (~511 lines, server component, sections inline; dynamic imports below fold)
├── layout.tsx                      # Root layout: fonts, GA, MeshBackgroundDynamic, LayoutShell
├── globals.css                     # Tailwind base + brand utilities
├── error.tsx  not-found.tsx
├── robots.ts  sitemap.ts           # SEO — sitemap drives /tools/dosing-calculator/[slug] preset pages
├── opengraph-image.png  twitter-image.png
│
├── admin/                          # Admin panel (role-gated, no site chrome)
│   ├── page.tsx + AdminDashboardClient.tsx
│   ├── club-orders/                # Full pipeline UI (PIPELINE_ORDER from lib/admin-club-orders.ts)
│   ├── creators/                   # approvals/, coupons/, payouts/
│   ├── customers/                  # Customer master list + detail modal
│   ├── dosing-rules/               # AI dosing-engine rules admin
│   ├── intakes/                    # Intake review + manual processing
│   ├── inventory/                  # 3-tab per-site product inventory editor
│   ├── marketing/                  # MarketingClient.tsx + waitlist/ (Quiz Leads + Marketing dashboards)
│   ├── members/                    # Member management (edit/delete; force-delete with orders)
│   └── orders/                     # ClubOrdersTab.tsx, OrdersClient.tsx, PendingApprovalTab.tsx
│
├── api/                            # 120 route.ts files
│   ├── admin/                      # analytics, asher-dashboard, club-members, club-orders/[orderId],
│   │                               #   creators/[id]/{approve,reject,payouts/batch,codes}, customers,
│   │                               #   cron-status, dosing-rules, intakes, inventory, members, orders,
│   │                               #   prelaunch-codes, qr-scans, restore-session, siphox-smoke
│   ├── auth/                       # magic-link, verify, logout, dev-login (staging only)
│   ├── checkout/                   # route.ts (subscription), product/, subscription/, corepay/
│   ├── club/                       # check-member, event, login, orders, signup, validate-coupon
│   ├── creators/                   # apply, magic-link, verify-login, verify-email, dashboard,
│   │                               #   profile, links, codes, network, payouts, earnings, leaderboard,
│   │                               #   labs, dosing, support, results
│   ├── cron/                       # approve-commissions, update-tiers, stale-orders,
│   │                               #   siphox-fulfillment, siphox-results, siphox-status-sync, asher-sync
│   ├── dosing-calculator/          # instruction-pdf/ (server-rendered PDF for the public calculator)
│   ├── intake/submit/              # Submit medical intake
│   ├── lmn/                        # list, generate, [lmnNumber]
│   ├── meal-plan/  protocol/generate/  # AI endpoints
│   ├── member/                     # profile, orders, files, labs, medical-records, results,
│   │                               #   transactions, dosing
│   ├── onboarding/status/          # Post-checkout onboarding state
│   ├── portal/                     # send-otp, verify-otp, refresh, logout, labs, results,
│   │                               #   documents, orders, profile, stacking-content
│   ├── protocol/generate/          # AI protocol generation
│   ├── quickbooks/{auth,callback}/ # OAuth2 flow
│   ├── quiz/submit/                # POST submit, PATCH lead-mirror (waitlist table)
│   ├── quote/                      # Quote generator
│   ├── stock/                      # Inventory lookup
│   ├── supplement-order/           # Supplement reorders
│   ├── track/                      # click, daily, identify, qr-scan
│   ├── waitlist/
│   └── webhook/                    # stripe/, quickbooks/, healthie/, calendly/ (signature-verified)
│
├── creators/                       # Creator-facing pages
│   ├── page.tsx  template.tsx      # Program landing
│   ├── apply/  login/  pending/
│   ├── [slug]/page.tsx             # Public creator profile
│   └── portal/                     # Authenticated portal (hidden from site chrome)
│       ├── layout.tsx  loading.tsx  page.tsx
│       ├── dashboard/  earnings/  network/  payouts/  share/  campaigns/
│       ├── resources/  settings/  support/  labs/  dosing-calculator/
│
├── members/                        # Member library (replaces /library; 301 redirects preserved)
│   ├── page.tsx + LibraryContent.tsx + LibraryLogin.tsx + LibrarySidebarShell.tsx
│   ├── layout.tsx  loading.tsx
│   ├── [category]/                 # Category landing pages
│   ├── shop/                       # Members shop (catalog, [sku] detail)
│   ├── cart/  quote-success/
│   ├── consultations/              # Telehealth (Calendly embed)
│   ├── labs/  lab-instructions/    # Siphox lab access
│   ├── calorie-calculator/  dosing-calculator/  peptide-faq/  stacking-guides/
│
├── portal/                         # Siphox/labs customer portal (separate from /members)
│   ├── layout.tsx
│   └── login/  dashboard/  labs/  documents/  profile/  stacking/
│
├── intake/                         # Medical intake (multi-step)
│   ├── page.tsx                    # Page imports IntakeFormClient from components/intake
│   └── success/
│
├── onboarding/                     # Post-checkout onboarding flow
│   ├── page.tsx + OnboardingClient.tsx
├── success/                        # Stripe success landing
├── login/                          # Member login + choose-area selector
│   ├── page.tsx
│   └── choose-area/                # Login destination chooser
│
├── quiz/  therapies/  pricing/  how-it-works/  faq/  community/
│
├── tools/                          # **Public SEO-driven calculator family (Apr 25 2026 overhaul)**
│   ├── page.tsx                    # /tools landing
│   └── dosing-calculator/
│       ├── page.tsx                # Server-rendered landing w/ 4 JSON-LD schemas
│       ├── seo-content.ts          # Single source of truth for FAQ, HowTo, cross-sells
│       ├── PublicDosingCalculatorClient.tsx
│       ├── DosingCalculatorClient.tsx
│       └── [slug]/                 # Per-peptide preset pages (13 slugs)
│           ├── page.tsx
│           └── preset-content.ts   # 13 entries: semaglutide, tirzepatide, retatrutide,
│                                   #   bpc-157, tb-500, ghk-cu, glutathione, nad,
│                                   #   sermorelin, cjc-1295-ipamorelin, tesamorelin-ipamorelin,
│                                   #   pt-141, oxytocin
│
├── legal/                          # privacy, terms, medical-disclaimer (provider-credentials etc.)
├── science/                        # **Shim** — 301-redirected to / via next.config.js (LegitScript)
├── products/                       # **Shim** — 301-redirected to /pricing
├── terms/                          # **Shim sibling of /legal/terms — to consolidate**
│
├── go/[destination]/route.ts       # QR code redirect w/ device + geo analytics
├── r/[slug]/route.ts               # LEGACY creator tracking link; primary now on cultrclub.com/<slug>
│
└── join/                           # **LEGACY** — middleware 404s on public hosts (subdomain retired Apr 22 2026)
```

### `components/` — React components

```
components/
├── ui/                             # Primitives (18 files)
│   ├── apple-cards-carousel.tsx  Aura.tsx  Button.tsx  Input.tsx  Spinner.tsx
│   ├── ScrollReveal.tsx  SectionWrapper.tsx  PageTransition.tsx
│   ├── WavyBackground.tsx  MeshBackground.tsx  MeshBackgroundDynamic.tsx
│   ├── Marquee.tsx  TextShimmer.tsx  ParallaxReveal.tsx
│   ├── CalendlyEmbed.tsx  HoverCard.tsx  NavDock.tsx  UserIdentifier.tsx
│
├── site/                           # Marketing site chrome + sections (23 files)
│   ├── Header.tsx  Footer.tsx  LayoutShell.tsx  LayoutShellClient.tsx
│   ├── MarketingHero.tsx  CTASection.tsx  FAQAccordion.tsx
│   ├── PricingCard.tsx  ComparisonTable.tsx  TherapiesGrid.tsx
│   ├── HowItWorksSteps.tsx  TherapyGoalFilter.tsx  TrustStrip.tsx
│   ├── TrustMarquee.tsx  TestimonialsSection.tsx  SocialProofBadge.tsx
│   ├── ProductCard.tsx  CommunityFeed.tsx (Curator.io)
│   ├── NewsletterSignup.tsx  LeadCapturePrompt.tsx  ClubBanner.tsx
│   ├── BiomarkerExplainer.tsx  BiomarkerScroll.tsx
│   #
│   # FAQAccordion was modified Apr 26 to render answers in static HTML (CSS-collapse +
│   # aria-hidden) instead of conditional render so Google FAQPage rich snippets work.
│
├── admin/                          # Admin layouts + shared admin widgets (6 files)
│   ├── AdminLayoutClient.tsx  AdminSidebar.tsx
│   ├── ClubOrderBulkActions.tsx  ClubOrderStageControls.tsx
│   ├── MetricCard.tsx  PrelaunchCodesSection.tsx
│
├── compliance/                     # LegitScript components (6 files)
│   ├── ConsentModal.tsx  FDAStatusBadge.tsx  FloridaStateGate.tsx
│   ├── PrescriptionDisclaimer.tsx  TestimonialDisclaimer.tsx
│   └── DispensingPharmacyInfo.tsx
│
├── creators/                       # Creator portal UI (6 files)
│   ├── CreatorHeader.tsx  CreatorSidebar.tsx
│   ├── AnalyticsCharts.tsx (only Recharts consumer)
│   ├── Leaderboard.tsx  Milestones.tsx  NotificationBell.tsx
│
├── dashboard/                      # Member biomarker dashboard (2 files)
│   ├── BiologicalAgeCard.tsx  BiomarkerTrends.tsx
│
├── dosing-ai/                      # AI dosing engine UI (3 files)
│   ├── AiDosingEnginePanel.tsx  AiDosingQuestionFlow.tsx  RecommendationCard.tsx
│
├── dosing-calculator/              # **Shared calculator (NEW since Apr 22)** — used by 3 host pages
│   ├── DosingCalculator.tsx        # Main interactive component
│   ├── SyringeMeter.tsx            # U-100 visual meter
│   ├── SyringeMeter 2.tsx          # ⚠ macOS duplicate — flag for cleanup
│   ├── CapacityWarningBanner.tsx
│   ├── InstructionCard.tsx
│   ├── TherapyPlanCard.tsx
│   ├── TherapyPresetPicker.tsx
│   └── WeightBasedDoseCard.tsx
│
├── intake/                         # Multi-step intake (2 files)
│   ├── IntakeFormClient.tsx  TypeformStep.tsx
│
├── library/                        # Member library widgets (10 files)
│   ├── MemberSidebar.tsx  MemberDashboard.tsx
│   ├── CategoryGrid.tsx  MasterIndex.tsx  ProductCatalog.tsx  TierGate.tsx
│   ├── MedicalRecords.tsx  MemberFiles.tsx  MyProviders.tsx  TransactionHistory.tsx
│
├── payments/                       # Payment provider UI (3 files)
│   ├── CorePayForm.tsx  PaymentMethodSelector.tsx  PaymentProviderLoader.tsx
│
├── portal/                         # Siphox labs portal (9 files)
│   ├── PortalSidebar.tsx
│   ├── KitEmptyState.tsx  KitDetailCard.tsx  KitRegistrationForm.tsx  KitTimeline.tsx
│   ├── LabsResultsView.tsx
│   ├── BiomarkerCategoryCard.tsx  BiomarkerDetailModal.tsx  ReferenceRangeBar.tsx
│
└── CultrBackground.tsx             # Top-level background wrapper
```

The previously-noted root-level legacy components (`Footer.tsx`, `Navigation.tsx`, `WaitlistForm.tsx`) are no longer present — cleaned up. The legacy `components/sections/` directory is also gone. `components/dosing-calculator/` is a new domain folder added during the SEO overhaul.

### `lib/` — Business logic & integrations

```
lib/
├── admin-club-orders.ts            # PIPELINE_ORDER, PIPELINE_STATUSES, NEXT_ACTIONS (canonical pipeline)
├── admin-types.ts  admin-utils.ts
├── analytics.ts                    # GA + Microsoft Clarity event wrapper
├── asher-med-api.ts                # Historical Asher Med client (removed Apr 4 2026; kept for audits)
├── auth.ts                         # JWT sign/verify (jose), cookie helpers
├── blog-content.ts                 # LEGACY — blog removed Apr 2026
├── calorie-calculator.ts
├── cart-context.tsx                # Member shop cart context
├── contacts.ts  mailchimp.ts       # Mailchimp + contact sync
├── cron-logger.ts                  # startCronRun() → cron_runs table
├── data-normalization.ts           # Shared normalizers
├── db.ts                           # @vercel/postgres wrapper; NUMERIC coercion helpers
├── hipaa-logger.ts                 # Safe logger — never logs PHI
├── intake-utils.ts                 # Intake data normalization
├── library-content.ts
├── peptide-calculator.ts           # Syringe-visualization dosage calc
├── portal-auth.ts  portal-db.ts  portal-orders.ts  # Siphox portal session helpers
├── protocol-templates.ts
├── quickbooks.ts                   # QBO OAuth2 + invoicing
├── rate-limit.ts                   # apiLimiter, formLimiter, strictLimiter (Upstash/memory)
├── resend.ts                       # Email templates, escapeHtml, brandedEmailHeader/Footer
├── resilience.ts                   # Retry + circuit breaker
├── turnstile.ts                    # Cloudflare Turnstile verification
├── utils.ts                        # cn() (clsx + tailwind-merge)
├── validation.ts                   # Zod schemas
│
├── config/                         # Static configuration sources of truth (21 files)
│   ├── affiliate.ts                # Commission rates, tier config, FTC disclosures
│   ├── asher-med.ts                # Historical integration config
│   ├── calculator-presets.ts       # Therapy preset catalog for the dosing calculator
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
├── contexts/                       # React Context providers (2 files)
│   ├── CreatorContext.tsx
│   └── JoinCartContext.tsx
│
├── creators/                       # Creator affiliate business logic (3 files)
│   ├── attribution.ts              # Click tracking, cookie resolution
│   ├── commission.ts               # Direct + override commission engine, ledger lifecycle
│   └── db.ts                       # Creator DB ops (getCreatorById, approveEligibleCommissions, etc.)
│
├── dosing-calculator/              # Calculator helpers (NEW)
│   ├── instruction-card-pdf.tsx    # @react-pdf rendering for /api/dosing-calculator/instruction-pdf
│   └── url-state.ts                # Shareable calculator state in URL params
│
├── dosing-engine/                  # AI-powered peptide dosing recommender
│   ├── engine.ts  types.ts  validation.ts  conversions.ts
│   └── config/                     # Rule definitions
│
├── healthie/                       # Healthie EHR client (10 files)
│   ├── index.ts  client.ts  queries.ts  mutations.ts  schemas.ts  types.ts
│   ├── patient-sync.ts  lab-sync.ts  portal-mapper.ts  webhooks.ts
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
├── siphox/                         # Siphox labs integration (10 files)
│   ├── index.ts  client.ts  db.ts  errors.ts  schemas.ts  types.ts
│   ├── biomarkers.ts  kit-lifecycle.ts  reports.ts  fulfillment.ts
│
└── utils/                          # Small helpers
    ├── health.ts  phone.ts
```

The previously-noted `lib/stores/` empty directory is no longer present.

### `migrations/` — SQL files (schema source of truth for all three apps)

76 files including macOS-style ` 2.sql` / ` 4.sql` duplicates. Migration runner: `node scripts/run-migration.mjs`.

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
| `024_prelaunch_codes.sql` | Prelaunch program (+ critical creator-coupon fix) |
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
| `053_inventory_site_source.sql` | `site_source` column + composite uniqueness — key to cultrhealth↔cultrclub inventory separation |
| `055_seed_current_shop_inventory.sql` | Inventory seed |
| `056_quiz_lead_capture.sql` | Lead-capture columns on `quiz_responses` |
| **`057_signup_coupon_codes.sql`** | **NEW** — `coupon_code` columns on `waitlist` and `club_members` |
| **`058_add_creator_jonas_machado.sql`** | **NEW** — Seed creator Jonas Machado + JM20 code |
| **`059_update_jonas_machado_commission.sql`** | **NEW** — Bump Jonas commission to 20% |
| `060_fix_mary_cooper_commission.sql` | Align Mary Cooper's commission_rate with her 20% codes |
| `061_backfill_coupon_discount_usd.sql` | Backfill `club_orders.coupon_discount_usd` for missed rows |
| `062_order_attributions_discount_snapshot.sql` | Snapshot `discount_rate` on attribution rows for stable historical ROI |
| `backfill_click_conversions.sql` | One-off backfill |
| `backfill_creator_attributions.sql` | One-off backfill |

**macOS duplicates flagged for cleanup** (untracked in git status, ` 2.sql` / ` 4.sql` suffix): `037_generic_ehr_identity 2.sql`, `038_membership_shipping_address 2.sql`, `039_siphox_ehr_linkage 2.sql`, `040_member_onboarding 2.sql`, `057_signup_coupon_codes 2.sql`, `058_add_creator_jonas_machado 2.sql`, `058_add_creator_jonas_machado 4.sql`, `059_update_jonas_machado_commission 2.sql`, `059_update_jonas_machado_commission 4.sql`. Treat the unsuffixed file as canonical; delete duplicates after verifying against the DB migration log.

### `tests/` — Vitest + RTL + Playwright hand-off (91 test files)

```
tests/
├── setup.ts  vitest.d.ts
├── api/                            # API route tests (32 files: admin/, club/, creators/, portal/, etc.)
├── components/                     # React component tests (24 files)
│   ├── AppleCardsCarousel.test.tsx  ClubOrdersTab.test.tsx  ClubOrderBulkActions.test.tsx
│   ├── ClubOrderStageControls.test.tsx  ConsentModal.test.tsx  CouponsClient.test.tsx
│   ├── BiomarkerCategoryCard.test.tsx  BiomarkerDetailModal.test.tsx
│   ├── FloridaStateGate.test.tsx  HomePageHero.test.tsx
│   ├── IntakeFormClient.test.tsx  JoinCartContext.test.tsx  JoinLandingClient.test.tsx
│   ├── KitEmptyState.test.tsx  KitRegistrationForm.test.tsx  KitTimeline.test.tsx
│   ├── LabsClient.test.tsx  LabsResultsView.test.tsx
│   ├── MemberLogin.test.tsx  OnboardingClient.test.tsx  OrdersClient.test.tsx
│   ├── PortalDashboard.test.tsx  PortalLogin.test.tsx  TierGate.test.tsx
├── integration/                    # Cross-module + real-DB tests
│   ├── intake-submission-e2e.test.ts
│   ├── coupon-attribution-e2e.test.ts
│   ├── creator-e2e-jon-collins.test.ts
│   ├── protocol-engine.test.ts
│   └── healthie-availability-diagnosis.test.ts
├── lib/                            # Pure-function tests + sub-bundles
│   ├── auth.test.ts  coupons.test.ts  plans.test.ts  links.test.ts
│   ├── biomarker-mapping.test.ts  library-content.test.ts  mailchimp.test.ts
│   ├── peptide-calculator.test.ts  protocol-templates.test.ts
│   ├── portal-auth.test.ts  portal-db.test.ts  portal-orders.test.ts
│   ├── kit-lifecycle.test.ts  report-processing.test.ts
│   ├── siphox-biomarkers.test.ts  siphox-client.test.ts  siphox-db.test.ts
│   ├── siphox-fulfillment.test.ts  siphox-schemas.test.ts
│   ├── creator-links-sync.test.ts  creator-order-stats-sync.test.ts
│   ├── creator-payout-lifecycle.test.ts  admin-creator-metrics-sync.test.ts
│   ├── join-therapies.test.ts
│   ├── dosing-calculator/          # Sub-bundle
│   └── dosing-engine/              # Sub-bundle
├── smoke/                          # Prod-like smoke tests
│   ├── critical-pages.test.ts  critical-apis.test.ts
│   └── middleware-session-timeout.test.ts
└── healthie-url-diagnosis.test.ts
```

E2E specs live in `e2e/` (Playwright; includes `e2e/admin/`, `e2e/dashboards/`, `e2e/fixtures/`, `e2e/join/`, `e2e/visual/`, plus `healthie-availability-diagnosis.spec.ts` and `hero-alignment.spec.ts`).

### `content/` — Markdown content

```
content/
├── blog/                           # **LEGACY** — markdown files still on disk but routes were removed
│                                   # Apr 2026 for LegitScript compliance. /science 301s to /. Files:
│                                   # biomarker-basics, fasting-metabolic-health, glp1-beyond-weight-loss,
│                                   # inflammation-markers, mitochondrial-health, nad-and-longevity,
│                                   # peptide-stacking, sleep-and-recovery, tb500-tissue-repair,
│                                   # testosterone-optimization, thyroid-deep-dive, understanding-bpc-157
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
├── _tmp_creator_signups.mjs  _tmp_stewart.mjs  _tmp_stripe.mjs   # Scratch — should not be committed
```

The sibling `cultrhealth-web/` repo additionally has `scripts/build-cf-safe.mjs` (post-build asset restoration to recover from next-on-pages hardlink truncation) and `scripts/generate-library-content.mjs` (run as `prebuild` so the library MD is bundled into the CF Pages build output).

### `.planning/` — GSD workspace

```
.planning/
├── STATE.md                        # Active milestone state (v1.0, executing Phase 03)
├── PROJECT.md                      # Phase 1: cultrclub-web Cloudflare migration
├── codebase/                       # ARCHITECTURE.md + STRUCTURE.md (this file)
└── phases/
    ├── 01-bootstrap/  02-source-extraction/  03-code-adaptation/
    ├── 04-deploy-validate/  05-production-cutover/   # cultrclub-web phases (in-flight + done)
    ├── 01-foundation/  02-checkout-integration/  03-kit-registration/
    │   # ↑ NEW since Apr 22 — three untracked phase scaffolds for an upcoming milestone.
    │   #   Each contains the standard PLAN/SUMMARY/CONTEXT/RESEARCH/VALIDATION/VERIFICATION
    │   #   files plus macOS ` 2.md` duplicates to clean up.
```

### `.claude/` — Claude Code agent config

```
.claude/
├── commands/                       # Slash commands (e.g. /pre-deploy)
├── hooks/                          # PostToolUse hooks (run-tests, type-check, code-audit)
├── skills/                         # ~40 marketing/SEO/CRO skills (siphox-api, schema-markup,
│                                   #   programmatic-seo, copywriting, etc.)
├── worktrees/                      # Git worktrees for parallel agents
├── settings.local.json             # Allowed tools / WebFetch domains
└── (assorted email-flow + implementation summaries — short-lived working docs)
```

---

## cultrclub.com — `cultrclub-web/`

### Top-Level

```
cultrclub-web/
├── app/                            # Next.js 15 App Router — all routes edge runtime
├── components/                     # Minimal shared UI (Button + apple-cards-carousel)
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
├── layout.tsx                      # metadata.title = '—' (stealth); robots: all false; HubSpot script
├── page.tsx                        # SERVER component — reads cultr_club_visitor cookie → verifyClubVisitorToken
│                                   #   → SELECT from club_members → passes serverMember prop
├── JoinLandingClient.tsx           # ~1,477-line client component — cart, carousel, modals, coupon, checkout
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

### Cloudflare-Specific Files

| File | Role |
|---|---|
| `wrangler.toml` | `compatibility_flags = ["nodejs_compat"]`, `pages_build_output_dir = ".vercel/output/static"` |
| `public/_headers` | Cloudflare Pages headers for **static assets** (Pages drops `next.config.js` `headers()` for static routes) |
| `.wrangler/` | Wrangler local build cache (gitignored) |
| `.vercel/output/static/` | `@cloudflare/next-on-pages` build output (gitignored) |
| `worker-configuration.d.ts` | Auto-generated worker type definitions |
| `types/fetch.d.ts` | Edge-runtime fetch typing shim |

The `cultrhealth-web/` sibling repo has the same set of CF-specific files, plus a `workers/cron.ts` that wires up scheduled triggers (cron handlers defined as routes here forward through that worker).

---

## Legacy / Deprecated Code

Items still in the tree that are superseded or to be removed.

### cultrhealth.com (this repo)

| Path | Status | Action |
|---|---|---|
| `app/join/` (page.tsx, layout.tsx, JoinLandingClient.tsx, [tier]/page.tsx) | **Legacy** — customer storefront now lives at cultrclub.com. `next.config.js` 301-redirects `/join` → `/pricing`; middleware 404s any `/join*` traffic on production hosts. The `join.cultrhealth.com` subdomain was retired Apr 22 2026. | Remove after confirming no internal links reference `/join/*`. |
| `app/r/[slug]/route.ts` | **Legacy** — creator tracking authority moved to `cultrclub.com/<slug>`. Still serves residual clicks landing on cultrhealth.com. | Keep until 100% of distributed creator links resolve via cultrclub.com. |
| `components/dosing-calculator/SyringeMeter 2.tsx` | **macOS duplicate** of `SyringeMeter.tsx` (untracked). | Delete. |
| `lib/blog-content.ts` | **Legacy** — blog removed Apr 2026 (LegitScript compliance). | Safe to delete once no stragglers import it. |
| `lib/asher-med-api.ts` | **Historical** — Asher Med integration fully removed Apr 4 2026; kept for audit trace. | Consider moving to `archive/`. |
| `content/blog/*.md` | **Legacy** — markdown files still on disk but no routes consume them. | Safe to delete after final compliance review. |
| `app/science/`, `app/science/[slug]/` | **Shim** — 301-redirected to `/` in `next.config.js`. Route files still exist. | Keep redirects; can remove route files. |
| `app/products/`, `app/terms/` | **Shim** — `app/products/` 301s to `/pricing`; `app/terms/` is a sibling of `/legal/terms`. | Consolidate to `/legal/terms`. |
| `class-variance-authority` in `package.json` | Currently NOT in dependencies (already removed). | (No action needed.) |
| Migrations with ` 2.sql` / ` 4.sql` suffix | **Duplicates** — macOS Finder copy artifacts. Listed in git status as untracked. | Verify against DB migration log; delete duplicates that weren't run. |
| `scripts/_tmp_*.mjs` | **Scratch** — ad-hoc debugging scripts. | Delete. |
| `.next/`, `.vercel/`, `tsconfig.tsbuildinfo`, `node_modules/` | Build artifacts | Keep gitignored. |
| `/api/cron/asher-sync` | **Historical** — Asher Med removed. | Remove endpoint + cron entry. |
| `production` git branch | **Decommissioned** — previously deployed to Vercel production; cultrhealth.com is now CF Pages from `cultrhealth-web/main`. | Keep for archival; do not deploy from. |

The previously-listed legacy artifacts that have **already been removed** since the Apr 22 snapshot: root-level `components/Footer.tsx`, `components/Navigation.tsx`, `components/WaitlistForm.tsx`, the entire `components/sections/` directory, and the empty `lib/stores/` directory.

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
| New admin page | `app/admin/<feature>/page.tsx` + `<Feature>Client.tsx`; add nav link to `components/admin/AdminSidebar.tsx` |
| New admin API | `app/api/admin/<feature>/route.ts`; wrap with `requireAdmin()` |
| New member-facing page | `app/members/<feature>/` |
| New creator portal page | `app/creators/portal/<feature>/page.tsx`; add to `CreatorSidebar.tsx` |
| New SEO landing page | `app/<topic>/page.tsx` (server component) + `app/sitemap.ts` entry. If it has a FAQ schema, the visible JSX and JSON-LD must read from a single content file (see `app/tools/dosing-calculator/seo-content.ts` for the canonical pattern). |
| New per-peptide calculator preset | Append to `PRESET_PAGES` in `app/tools/dosing-calculator/[slug]/preset-content.ts` and to `PRESETS` in `lib/config/calculator-presets.ts`. Sitemap picks it up automatically. |
| New compliance copy | `components/compliance/` + `lib/config/compliance.ts` |
| New config constant | `lib/config/<domain>.ts` (create a new file rather than dumping into `plans.ts` or similar) |
| New shared helper | `lib/utils.ts` for pure utilities; `lib/utils/<topic>.ts` for bigger modules; topic-specific subdirs (`lib/dosing-calculator/`, `lib/dosing-engine/`, `lib/healthie/`, etc.) |
| New SQL migration | `migrations/NNN_description.sql` (use next available integer; current head is `062`); run via `node scripts/run-migration.mjs`. |
| New cron job | `app/api/cron/<name>/route.ts`, authenticate with `CRON_SECRET`, wrap in `startCronRun()`, add to `vercel.json` AND register in the CF Pages dashboard's Cron Triggers (production crons live on the Worker, not Vercel). |
| New webhook | `app/api/webhook/<provider>/route.ts`; verify signature; dedup via `stripe_idempotency`-style table if applicable |
| New test (unit) | `tests/lib/<module>.test.ts` or `tests/components/<Component>.test.tsx` |
| New test (integration) | `tests/integration/<flow>.test.ts` |
| New Playwright spec | `e2e/<feature>/` |

### cultrclub.com

| Need | Location |
|---|---|
| New storefront section | Inline in `app/JoinLandingClient.tsx`; extract to `components/ui/` only when reused across `app/tv/` or similar |
| New public API | `app/api/<feature>/route.ts` — must `export const runtime = 'edge'` |
| Schema change | **Add the migration in `Cultr Health Website/migrations/`** (this repo owns the schema). Deploy that migration, then consume the new column from cultrclub-web. |
| Config constant | `lib/config/<domain>.ts` |
| Signage / display screen | `app/tv/<name>/page.tsx` + assets under `public/tv/` |

---

*Structure analysis: 2026-04-27*
