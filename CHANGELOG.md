## [2026-04-04] - Server-Side Returning Member Recognition (join.cultrhealth.com)

### Problem
Returning members on join.cultrhealth.com were shown the signup modal every visit. Recognition was entirely client-side (localStorage + cookie) — clearing browser data, new device, or expired cookie meant the system had no fallback to check the database.

### New: 3-Layer Member Recognition
- **SSR (page.tsx):** Reads `cultr_club_visitor` cookie at render time, verifies member exists in `club_members` DB, passes verified data as `serverMember` prop — zero modal flash for returning members
- **Client cascade (JoinLandingClient.tsx):** 6-priority recognition: serverMember > localhost bypass > localStorage > client cookie > has-ordered flag > API fallback check
- **Email onBlur (SignupModal):** When a user types their email and tabs out, checks DB for existing member. Shows "Welcome Back!" banner with first name if found

### New Endpoint: `GET /api/club/check-member`
- **Cookie mode** (no params): reads cookie, returns full member data (trusted session)
- **Email mode** (`?email=...`): returns only `{ firstName, exists: true }` — no PII exposed
- Always returns HTTP 200 for email lookups (anti-enumeration)

### Security Hardening (from deep audit)
- Email-based lookups never return phone, address, age, gender, or social handle
- Anti-enumeration: email lookups always return 200 (both found and not-found)
- Client-side cookie now includes `Secure` flag on HTTPS
- Login API uses explicit `SELECT` columns instead of `SELECT *`
- Signup API cookie now includes `signupType`, `age`, `gender` for consistent schema
- `ClubMember` age/gender made optional to prevent fabricated defaults for legacy members

### Loading State
- Pulsing CULTR logo shown during Priority 6 async server check (prevents bare-page flash)

### Files Changed
- `app/join/page.tsx` — server component with `getServerMember()` DB lookup
- `app/join/JoinLandingClient.tsx` — 6-priority cascade, email onBlur, loading screen
- `app/api/club/check-member/route.ts` — new endpoint
- `app/api/club/login/route.ts` — explicit SELECT, age/gender in response, 90-day cookie
- `app/api/club/signup/route.ts` — cookie schema updated
- 28/28 test files passing, 380/380 tests, 0 TypeScript errors

---

## [2026-04-04] - LegitScript Compliance Foundation + Asher Med Removal

### Asher Med Integration Removed
- Deleted 9 core files: API client (`lib/asher-med-api.ts`), config (`lib/config/asher-med.ts`), product mapping, documentation, scripts, admin dashboard section, cron sync route
- Refactored 14 API routes to use local DB only — no external Asher Med API calls
- Extracted reusable utilities to `lib/utils/phone.ts`, `lib/utils/health.ts`, `lib/config/us-states.ts`
- Updated 12 test files to match new local-DB-only behavior
- Database columns (`asher_patient_id`, `asher_orders`) retained — no destructive migration
- 61 files changed, net -2,045 lines removed

### New Pharmacy Partner: St. Luke Compounding Pharmacy
- **Address:** 9338 Little Rd, New Port Richey, FL 34654
- **Phone:** (727) 416-2006 · **Fax:** (727) 416-2007 · **Toll-Free:** (877) 310-5668
- **FL Pharmacy License:** PH 32747 (expires Feb 28, 2027)
- Centralized in `lib/config/compliance.ts` — single source of truth

### LegitScript Compliance Components
- `components/compliance/FDAStatusBadge.tsx` — color-coded FDA status per therapy
- `components/compliance/DispensingPharmacyInfo.tsx` — full + compact variants with fax/toll-free
- `components/compliance/TestimonialDisclaimer.tsx` — standardized disclaimer text
- Footer: dispensing pharmacy info section added (LegitScript Standard 4 requirement)
- Footer: "Provider Credentials" link added to legal links
- Footer: compounded medication disclaimer clause added
- Testimonials section: disclaimer wired below scrolling columns

### Therapy & Product Claim Qualification
- All 11 therapy descriptions qualified with "not FDA-approved" and clinical trial citations
- Semaglutide: STEP 1 trial citation, "14.9% body weight reduction"
- Tirzepatide: SURMOUNT-1 trial citation, "up to 22.5% body weight reduction"
- Retatrutide: flagged as "investigational", Phase 2 trial citation
- Melanotan 2: flagged with "FDA has issued consumer warnings"
- Removed superlatives: "most potent", "powerhouse", "clinically proven", "maximum results"
- Fixed "FDA-studied" language on Tesamorelin to accurate regulatory disclosure
- All descriptions include "individual results vary" and "prescribed when clinically appropriate"

### Legal Pages Rewritten
- **Medical Disclaimer** (`/legal/medical-disclaimer`): comprehensive rewrite with St. Luke pharmacy block, compounded medication section, FDA MedWatch reporting link, educational content disclaimer
- **Privacy Policy** (`/legal/privacy`): rewritten with HIPAA compliance sections, data processor table (St. Luke, Healthie, Stripe, Vercel/Neon, Resend, SiPhox, Cloudflare) with BAA status, breach notification, data retention (7-year), user rights (access, correction, restriction, accounting, deletion, portability)
- **Provider Credentials** (`/legal/provider-credentials`): new page with provider profiles, pharmacy license PH 32747, FL DOH verification link

### LegitScript Audit Plan
- Created `docs/LEGITSCRIPT-AUDIT-PLAN.md` — exhaustive 17-section audit covering all 9 LegitScript standards, page-by-page checklist for 77+ pages, FDA status matrix for all medications, risk register, 6-week implementation timeline

### Files Changed
- 9 files deleted, 43 files modified, 8 new files created
- 48/48 test files passing, 608/608 tests, 0 TypeScript errors

---

## [2026-04-04] - Trust Strip on join.cultrhealth.com

### Pharmaceutical credentialing strip added to join page hero zone
- Added a responsive trust strip between the slogan banner and the "Browse & Build" section on `join.cultrhealth.com`.
- Three trust signals: **Pharmaceutical-Grade APIs**, **Green-listed · Third-party tested**, **Made in the USA**.
- Mobile: explicit `flex-col` centered vertical stack — no wrapping surprises, each badge on its own line.
- Desktop (`sm+`): horizontal row with `|` pipe dividers, `select-none` so dividers aren't copyable.
- Uses `bg-brand-primary` (same as slogan section above) with a `border-white/[0.07]` hairline separator — maintains the unified dark hero zone.
- `Check` icon (sage) already imported from lucide-react — no new dependencies.

### Files Changed
- `app/join/JoinLandingClient.tsx` — trust strip section inserted between slogan banner and browse section

---

## [2026-04-04] - Bac Water Shipping Upsell (Stock-Aware)

### Shipping Warning Banner on join.cultrhealth.com
- When cart contains **only** bacteriostatic water (qty < 4), an amber warning banner appears: "Shipping: ~$15".
- If stock >= 4: shows "Upgrade to 4x Bac Water" button ($119.96 for free shipping). Button sets qty to exactly 4.
- If stock < 4: shows informational message ("Only N available — free shipping requires 4+") with no upgrade button.
- Banner hidden when: other products in cart, qty already >= 4, or bac water is out of stock.
- Works on both desktop sidebar cart and mobile cart overlay (shared `CartSummaryPanel`).
- `stockData` prop threaded from `JoinLandingInner` → `CartSummaryPanel` and `MobileCartOverlay`.

### Files Changed
- `app/join/JoinLandingClient.tsx` — AlertTriangle import, stockData prop plumbing, shipping warning banner with inventory-aware branching

---

## [2026-04-04] - Cole Sidner Code Cleanup + Admin Coupons UX + Club Session Persistence

### Cole Sidner Creator Code Cleanup
- **Deleted** stale `COLESIDNER` and `COLESIDNER10` affiliate codes from database (Migration 047).
- These were auto-generated by staging provisioning which derived codes from the email (`cole.sidner@gmail.com` → `COLESIDNER`) instead of the proper full name split.
- **Correct codes confirmed:** `COLE` (primary, membership, 10% off) + `COLE10` (secondary, product, 10% off).
- Cole's commission rate: 20%. Tracking link `/r/cole` active with 3 clicks.
- Full E2E verification: `validateCouponUnified`, `processOrderAttribution`, admin dashboard, creator portal, recurring payment handler — all resolve correctly.
- No orphaned order_attributions or commission_ledger entries.

### Admin Coupons Page UX Improvements
- **Tracking Links** and **Coupon Codes** sections now always render (even when empty) — previously hidden entirely when no data, making the "+ Create Coupon" button inaccessible.
- Empty states show helpful placeholder text.
- Export CSV button conditionally shown only when data exists.
- `fetchAnalytics` loading spinner only shown on initial load, not background refreshes.

### Admin Coupon Code Management Fixes
- `POST /api/admin/creators/codes` now passes `code_type` parameter (was defaulting to undefined).
- `PATCH /api/admin/creators/codes` now syncs active/inactive toggle to Stripe promotion codes (was DB-only).

### Club Session Persistence (90-day cookies)
- `cultr_club_visitor` cookie extended from 7 days to 90 days across all paths: signup, login, client-side.
- Cross-domain cookie sharing: client-side cookie now sets `domain=.cultrhealth.com` for `join.cultrhealth.com` ↔ `staging.cultrhealth.com`.
- Order submission no longer clears member data — returning customers stay logged in.

### Migrations
- **047_cleanup_cole_sidner_codes.sql** — DELETE stale COLESIDNER/COLESIDNER10, confirm COLE/COLE10 state.
- **046_add_membership_codes_cole_cameron.sql** — Add COLE + CAM primary membership codes.
- **041_add_creator_cole_sidner.sql** — Initial Cole Sidner creator + COLE10 product code.
- **042_add_creator_cameron_donahue.sql** — Initial Cameron Donahue creator + CAM10 product code.

### Files Changed
- `app/admin/creators/coupons/CouponsClient.tsx` — always-visible sections, empty states
- `app/api/admin/creators/codes/route.ts` — code_type passthrough, Stripe active sync on PATCH
- `app/api/club/login/route.ts` — 90-day cookie
- `app/api/club/signup/route.ts` — 90-day cookie
- `app/join/JoinLandingClient.tsx` — 90-day cross-domain cookie, keep member data post-order
- `migrations/041_add_creator_cole_sidner.sql` — new
- `migrations/042_add_creator_cameron_donahue.sql` — new
- `migrations/046_add_membership_codes_cole_cameron.sql` — new
- `migrations/047_cleanup_cole_sidner_codes.sql` — new

---

## [2026-04-04] - Visitor Tracking + Admin Customer Enhancements

### Admin Customer Table — 4 New Columns
- **Converted** — green "Yes" / amber "No" badge. Excludes cancelled/rejected orders (consistent with revenue queries).
- **AOV (Average Order Value)** — computed from valid orders only. Uses `::float8` cast for @vercel/postgres.
- **Browser** — Chrome, Safari, Firefox, Edge, Opera (parsed from User-Agent on signup).
- **Device Type** — mobile / tablet / desktop badge (blue / indigo / gray).
- All 4 columns are sortable and included in CSV export.
- Sort function now handles boolean fields explicitly (was falling through to string comparison).

### Visitor Tracking Data Pipeline — Deployed
- **Migration 045** was already run (14 columns on `club_members`, `visitor_events` table, 7 indexes). But the **code that writes to those columns was never deployed** — it was sitting in uncommitted local changes.
- Now deployed: signup route captures browser/device/UTM/IP hash, client collects visitor context on mount, middleware sets first-touch `cultr_visitor_ctx` cookie, event API writes to `visitor_events`.
- Existing 120 members have NULL browser/device — new signups will populate correctly.

### SQL Query Improvements
- `getAllCustomersForAdmin()` refactored from correlated subqueries to a single LEFT JOIN subquery (more efficient).
- `converted` and `avg_order_value` use `COUNT/SUM FILTER (WHERE status NOT IN ('cancelled', 'rejected'))` — only counts real orders.
- `order_count` and `total_spent` unchanged (still count all orders for backward compatibility).

### Files Changed
- `lib/admin-types.ts` — 4 new fields on `CustomerAdminRow`
- `lib/db.ts` — `getAllCustomersForAdmin()` LEFT JOIN + FILTER rewrite
- `app/admin/customers/CustomersClient.tsx` — 4 columns, boolean sort, CSV export
- `app/api/club/signup/route.ts` — visitor context extraction + DB write (deployed)
- `app/join/JoinLandingClient.tsx` — visitor context collection (deployed)
- `middleware.ts` — `cultr_visitor_ctx` cookie (deployed)
- `app/api/club/event/route.ts` — visitor_events POST endpoint (deployed)

---

## [2026-04-03] - Add Bacteriostatic Water to join.cultrhealth.com

### New Product
- **Bacteriostatic Water (30 ML) — $29.99** added to Enhancement section on join.cultrhealth.com
- Product image upscaled to 2040x2040 PNG to match existing product images
- Links to existing catalog SKU `BACWATER-30ML`

### Bug Fix
- **Card price display:** `.toFixed(0)` rounded $29.99 to $30 on product cards. Now shows decimals for non-whole prices while keeping whole-number display ($340, $225, etc.) for existing products.

### Files Changed
- `lib/config/join-therapies.ts` — added bacteriostatic-water entry in Enhancement section
- `app/join/JoinLandingClient.tsx` — fixed price formatting for decimal prices
- `public/images/products/bacteriostatic-water.png` — product image (2040x2040)

---

## [2026-04-01] - Full Website Audit + 3 Bug Fixes + HIPAA Hardening

### Bug Fixes
- **ID Upload broken on staging (CRITICAL):** `app/api/intake/upload/route.ts` — `shouldMock` logic required `!ASHER_MED_API_KEY` but staging has the key set for other Asher Med calls. The presigned URL endpoint specifically fails on staging. Changed to mock on `isDevelopment || isStaging` regardless of API key presence. Previous fix (commit e63d89a) was reverted; this restores and improves it.
- **Creator login loop for team emails (CRITICAL):** `staging_creator` placeholder (non-UUID string) caused `getCreatorById()` to throw a Postgres type error → profile 500 → portal redirects to login → infinite loop. Fixed in 3 places:
  - `app/api/creators/profile/route.ts` — GET/PUT now resolve `staging_creator` via email lookup instead of crashing
  - `app/api/creators/verify-login/route.ts` — Retries DB email lookup before falling back to `staging_creator`
- **HIPAA: PHI in intake error logs:** `app/api/intake/submit/route.ts` — Removed `asherError.response` from console.error (Asher Med API error responses may contain patient data)
- **Hardcoded Stripe test key:** `app/join/[tier]/page.tsx` — Removed hardcoded `pk_test_*` fallback; now uses empty string if env var not set

### Critical Path Audit (all PASS)
- Member auth (magic link + staging bypass + idle timeout)
- Creator auth (magic link + auto-provisioning)
- Stripe checkout + webhook (signature verification + idempotency)
- Club signup/login/orders (transactional writes, stock validation, HMAC tokens, commission attribution)
- Intake form (12 steps, upload, consent, submit to Asher Med)
- PHI logging scan across all API routes
- join.cultrhealth.com (middleware rewrite, cookies, full flow)

### Build Verification
- TypeScript: 0 errors
- Tests: 666/666 passing
- Build: clean, no warnings

### Audit Findings (documented, not yet fixed)
- Intake submit missing field format validation (email, phone, DOB not validated before Asher Med)
- In-memory rate limiting won't distribute across serverless instances
- TEAM_EMAILS list duplicated across 5 files
- Intake form data in localStorage (PHI accessible via XSS)
- Member magic link email uses off-brand copper color (#B87333)
- No ESLint config file

### Files Changed
- `app/api/intake/upload/route.ts` — staging mock logic
- `app/api/creators/profile/route.ts` — staging_creator email fallback
- `app/api/creators/verify-login/route.ts` — retry DB lookup before placeholder
- `app/api/intake/submit/route.ts` — PHI removed from error logs
- `app/join/[tier]/page.tsx` — hardcoded Stripe key removed

---

## [2026-03-30] - Pricing & Checkout Flow Overhaul

### Pricing Cards
- Core price: "Starting at" label above `$149*` with discrete superscript asterisk
- "Final monthly amount depends on selected therapy." note below price
- "2 Add-Ons" → "2 Add-on Therapies" on Catalyst and Concierge cards
- Doctor visit frequency disclaimers added: Core every 6 months, Catalyst every 4 months, Concierge every 6 months
- Therapy selection hover text changed from "Select →" to "Join →"

### Checkout Flow
- Product image moved into dark hero banner next to title (desktop), mobile fallback in product section
- Product detail section uses mint/sage (`grad-mint`) color palette with description, benefits, and disclaimer per therapy
- "Best For" section removed from checkout page
- Blood test kit + doctor visit grouped under "Onboarding Fee" subheading in order summary
- Each Core therapy page (Semaglutide, Tirzepatide, Retatrutide) shows individualized content

### Payment Methods
- Klarna and Affirm removed from payment selector and all checkout handler code
- Coinbase Commerce removed from payment selector
- Cherry Financing renamed to "Financing - by Cherry"

### Pricing Page
- Comparison table: Catalyst physician follow-up updated from "Every 6 months" to "Every 4 months"

---

## [2026-03-30] - Gold-Standard Club Order Fulfillment Pipeline

### Full Lifecycle Tracking (Migration 033)
- New DB columns on `club_orders`: `paid_at`, `fulfilled_at`, `tracking_carrier`, `tracking_number`, `tracking_url`
- Status pipeline: pending_approval → approved → invoice_sent → paid → shipped → fulfilled
- Status update API (`/api/admin/club-orders/[orderId]/status`) with validated transitions and concurrent-safety

### Admin Dashboard — Fulfillment Pipeline UI
- Pipeline visualization bar with clickable stage counts and arrows
- Status filter pills (All / Active / Cancelled / Completed / per-stage)
- Context-aware action buttons: Approve → Mark Paid → Mark Shipped (with tracking form) → Mark Fulfilled
- Order timeline with green dots and timestamps for each lifecycle stage
- Aging badges: yellow (>48h) and red (>96h) stale indicators on order rows
- Activity log (audit trail) in expanded order view — who changed status, when, via dashboard or email

### HMAC Email Action Links — Full Lifecycle from Inbox
- Partner can advance orders through entire pipeline via email buttons (same HMAC pattern as existing approve link)
- Admin emails include next-action button at every stage: Mark Paid → Mark Shipped → Mark Fulfilled
- 48-hour token expiry, timing-safe verification, GET handler for email link clicks

### Customer Status Notification Emails
- Branded emails at each transition: "Payment Confirmed", "Your Order Has Shipped" (with tracking link + carrier), "Order Complete"
- Uses existing CULTR email design system (Playfair Display headers, branded footer)

### Stale Order Alerts (Cron)
- `/api/cron/stale-orders` — daily digest email (12:00 UTC / 8am ET) listing all orders stuck >48h in any active status
- Orders grouped by stage, >96h highlighted in red
- Activated in `vercel.json` cron schedule

### Audit Trail
- Every status change logged to `admin_actions` table with actor (email or `email_link`), transition details, and method
- Activity log API: `GET /api/admin/club-orders/[orderId]/activity`
- Analytics API now returns `clubOrderFulfillment` counts for dashboard pipeline

### Files Added
- `migrations/033_club_order_fulfillment.sql` — fulfillment tracking columns
- `app/api/admin/club-orders/[orderId]/activity/route.ts` — activity log endpoint
- `app/api/cron/stale-orders/route.ts` — stale order detection + digest email

### Files Modified
- `app/admin/orders/PendingApprovalTab.tsx` — complete rewrite: pipeline UI, actions, timeline, activity log, aging badges
- `app/api/admin/club-orders/[orderId]/status/route.ts` — HMAC auth, email notifications, audit logging
- `app/api/admin/club-orders/route.ts` — returns tracking/fulfillment columns, improved sort
- `app/api/admin/analytics/route.ts` — added fulfillment counts
- `lib/db.ts` — added `getClubOrderFulfillmentCounts()`
- `lib/admin-types.ts` — added `clubOrderFulfillment` to `AnalyticsData`
- `vercel.json` — added stale-orders cron (daily 12:00 UTC)

---

## [2026-03-30] - Pricing Layout + Hero Copy Fixes

### Homepage & Pricing
- Moved CULTR Club banner above paid plan cards on homepage pricing section (was below)
- Removed trailing phrase "and advanced support when appropriate" from hero subtitle
- CULTR Club already correctly positioned above plans on `/pricing` page — no change needed there

---

## [2026-03-30] - Cursor AI Rules File (.cursorrules)

### New File
- Created `.cursorrules` — exhaustive 23-section guardrail ruleset for Cursor IDE AI
- Synthesized from CLAUDE.md, CHANGELOG.md, and `.planning/codebase/` analysis documents

### Sections
- Project identity, tech stack lock (DO NOT introduce list), HIPAA compliance (mandatory PHI rules)
- File naming conventions, code patterns (server/client split, imports, Button, cn(), API routes, auth functions)
- Database rules (@vercel/postgres NUMERIC coercion, make_interval(), IS DISTINCT FROM, COUNT(*)::integer)
- Tailwind brand design system (color tokens, undefined tokens to avoid, typography rules)
- Deployment safety (vercel --prod incident prevention, branch strategy)
- Membership tiers & pricing (current as of Mar 29: Core $149*, Catalyst+ $499, Concierge $1,049)
- Creator affiliate system (commission model, active coupons, attribution cookies)
- Known bugs & tech debt (8 fixed bugs to never reintroduce, dead code warnings, TEAM_EMAILS duplication)
- Testing, email, middleware, env vars, performance, security rules
- Join page (overflow-x-hidden Carousel), Provider tools (Protocol Builder tiers), Consultations (Cal.com/Daily.co/S3), QuickBooks (token rotation)

### Files Added
- `.cursorrules` — 23 guardrail sections (~350 lines)

---

## [2026-03-29] - Telehealth Consultations (Cal.com + Daily.co + S3)

### Video Consultation System
- Full telehealth integration: Cal.com scheduling embed + Daily.co video rooms + AWS S3 recording storage
- Patient self-service booking at `/members/consultations` with tier-gated limits (Club=0, Core=1/mo, Catalyst+=2/mo, Concierge=unlimited)
- Hybrid video: patients join embedded branded room, providers get direct Daily.co link via email
- Recording with consent: checkbox required before join, declined consent disables recording via API
- Post-call provider notes form (reason, outcome, next steps, internal notes)

### Database & Backend
- Migration 029: extends `consult_requests` with 17 columns, new `consultation_recordings`, `consultation_notes`, `consultation_webhook_events` tables
- Migration 030: removes ON DELETE CASCADE for HIPAA record retention (RESTRICT)
- 19 database query functions in `lib/consultations-db.ts`
- API clients: `lib/cal.ts`, `lib/daily.ts`, `lib/s3-recordings.ts`
- 5 branded email functions: booking confirmation (patient + provider), 1hr reminder, completion, recording ready

### Webhooks & Cron
- Cal.com webhook: BOOKING_CREATED (creates room + DB + emails), BOOKING_CANCELLED, BOOKING_RESCHEDULED (atomic update)
- Daily.co webhook: meeting.ended (completion + email), recording.ready-to-download (S3 upload + Daily.co delete)
- HMAC signature verification with buffer length check (prevents timingSafeEqual crash)
- Idempotency tracking via `consultation_webhook_events` table
- Cron: `/api/cron/consultation-reminders` every 15 min (requires CRON_SECRET)

### API Routes (12 new)
- Patient: list, book eligibility, detail + meeting token, cancel, notes, recording presigned URL
- Provider: list schedule, mark complete + notes
- Admin: list with filters, detail with recording metadata
- Meeting token generated for both `scheduled` and `in_progress` status (allows rejoin)

### Frontend
- 9 components: BookingEmbed, ConsultationTypeSelector, TierGateConsultation, VideoRoom, WaitingRoom, PostCallSummary, ProviderNotesForm, ConsultationCard, RecordingPlayer
- Pages: `/members/consultations` (booking), `/members/consultations/[id]` (video room with state machine), `/members/consultations/history`, provider schedule + detail, admin overview
- Admin sidebar: "Consultations" under CUSTOMERS group
- Member dashboard: upcoming consultation card + "Book Consultation" CTA

### Security & HIPAA
- All routes auth-gated (JWT session + ownership check)
- Webhook HMAC verification with timing-safe comparison
- S3 SSE-S3 encryption, presigned URLs with 1hr expiry
- No PHI in console.error — error.message extraction only
- Recording consent timestamp stored, room recording disabled via API on decline

### Environment Variables (new)
- CALCOM_API_KEY, CALCOM_WEBHOOK_SECRET, NEXT_PUBLIC_CALCOM_ORG_SLUG
- DAILY_API_KEY, DAILY_WEBHOOK_SECRET
- CONSULTATION_S3_BUCKET, CONSULTATION_S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

### Dependencies
- @calcom/embed-react, @daily-co/daily-react, @daily-co/daily-js, jotai
- @aws-sdk/client-s3, @aws-sdk/s3-request-presigner

## [2026-03-29] - Protocol Builder: All-Tier Access

### Tiered Access Model
- Protocol Builder available to ALL members (was provider-only)
- Club/Core: browse mode — view templates, goal recommendations, protocol previews
- Catalyst+/Concierge: full builder — configure parameters, N=1 tracking, submit protocols
- Providers: always full access with "Provider" badge
- TierGate wraps parameter configuration section with upgrade CTA overlay
- Patient ID input hidden in browse mode, submit replaced with "Upgrade to Build Protocols"

### Members Area Integration
- Moved from PROVIDER sidebar section to TOOLS (visible to all tiers)
- Header rebranded: cream bg, brand-primary text, rounded cards (was dark provider theme)
- `protocolBuilder: 'browse' | 'full' | false` added to `LibraryAccess` type
- Layout passes tier through shell → sidebar for TierGate evaluation
- `email` prop now included in protocol submit payload as `generatedBy`

### Pricing Updates
- Pricing comparison table: new "Protocol Builder" row — Browse (Core), Full Builder (Catalyst+/Concierge)
- Plan feature strings: "Protocol Builder (browse)" for Club/Core, "Full Protocol Builder" for Catalyst+/Concierge

### Fixes
- `getLibraryAccess` fallback in auth.ts updated with `protocolBuilder: false`
- Dashboard DEFAULT_ACCESS updated
- All test LibraryAccess objects updated (library-content.test.ts, plans.test.ts)
- plans.test.ts now validates `protocolBuilder` value per tier
- handleSubmit typed as React.SyntheticEvent (was FormEvent, used as onClick)

## [2026-03-29] - Asher Med Portal URL Fix
- Updated Patient Portal link from `asherweightloss.com` (Cloudflare Error 1000) to `partners.joinasher.com`
- Updated in: `components/library/MyProviders.tsx`, `lib/config/links.ts`, `lib/config/asher-med.ts`

## [2026-03-29] - Provider Dashboard Phase A: Dashboard + Patients + Schedule

### Provider Dashboard Home (`/provider`)
- New `ProviderDashboardClient.tsx` with 4 metric cards (Today's Consults, Pending Intakes, Patients This Month, Active Patients)
- Today's Agenda section with linked ConsultationCards
- Recent Intakes table showing pending intake submissions
- Quick Actions row: Consultations, Patient Records, Protocol Builder

### Provider Context
- New `lib/contexts/ProviderContext.tsx` following CreatorContext pattern
- Parallel data fetching via `Promise.all()` for metrics, consultations, intakes
- `useProvider()` hook for shared state across provider pages
- `ProviderLayoutClient` now wraps children in `ProviderProvider`

### Patient Management
- New `/provider/patients` page with searchable, filterable, paginated patient list
- Tier filter dropdown (Core, Catalyst, Concierge, Club)
- Patient names extracted from intake_data JSONB
- New `/provider/patients/[id]` detail page with 5 sections:
  - Intake data viewer (structured rendering of JSONB: personal info, address, measurements, goals, medications)
  - Order history table from `asher_orders`
  - Consultation history with inline provider notes
  - Lab results from SiPhox (if available)

### API Routes (4 new)
- `GET /api/provider/dashboard` — 4 parallel metric queries
- `GET /api/provider/intakes` — pending intakes with status/limit filters
- `GET /api/provider/patients` — patient list with search, tier filter, LATERAL JOINs for latest order/consultation
- `GET /api/provider/patients/[id]` — composite patient record (membership + intakes + orders + consultations + labs)

### Consultation Enhancements
- Day/Week toggle on `/provider/consultations` (segment control UI)
- Week view groups consultations by date with today highlighted (`border-l-4 border-cultr-forest`)
- Added `?days=` param to provider consultations API for date range queries
- ConsultationCard: new `providerView` prop routes links to `/provider/consultations/[id]`

### Sidebar Updates
- Provider sidebar expanded from 2 to 4 items: Dashboard, Consultations, Patients, Protocol Builder
- Dashboard active state only matches exact `/provider` path
- Logo links to `/provider` (was `/provider/consultations`)

### HIPAA Compliance
- All 4 new API routes gated by `verifyAuth()` + `isProviderEmail()`
- No PHI in console.error — removed raw error logging from new routes
- Patient detail uses internal membership IDs in URLs, not emails
- Parameterized SQL via `@vercel/postgres` tagged templates
- `COUNT(*)::integer` casts to avoid NUMERIC string coercion

## [2026-03-29] - Members Area Route Rename & Provider Sidebar

### Route Rename: /library → /members
- Renamed `app/library/` → `app/members/` — all member-facing pages now live under `/members`
- Updated ~100 route references across 40+ files (sidebar nav, page links, API auth redirects, webhook email URLs, payment cancel URLs, Affirm item URLs, Resend email links)
- Added 301 permanent redirects: `/library` → `/members` and `/library/:path*` → `/members/:path*`
- HIPAA no-cache headers, robots.txt disallow, and LayoutShell HIDE_CHROME all updated

### Consultations Integrated into Members Area
- Moved orphaned `app/consultations/` into `app/members/consultations/` — now renders within MemberSidebar
- Updated all internal links, email URLs (Cal.com webhook, Daily.co webhook, cron reminders), and ConsultationCard action links
- Added 301 redirect: `/consultations/:path*` → `/members/consultations/:path*`

### Provider Sidebar & Layout
- New `components/provider/ProviderSidebar.tsx` with Consultations + Protocol Builder nav
- New `components/provider/ProviderLayoutClient.tsx` with mobile hamburger + email display
- New `app/provider/layout.tsx` with server-side auth gating (redirects non-providers)
- Added `/provider` to HIDE_CHROME_PREFIXES and HIPAA no-cache headers
- Simplified provider page files (auth now handled by layout)

### Video Consultation Camera/Mic Fix
- Fixed `Permissions-Policy` header: global rule blocked `camera=()` and `microphone=()`
- Added override rules for `/members/consultations/:id*` and `/provider/consultations/:id*` allowing `camera=(self), microphone=(self)` for Daily.co video calls

### Test Fixes
- Fixed `KitEmptyState` test: updated expected price from `$199/mo` to `$149/mo` (Core pricing change)
- Fixed `KitRegistrationForm` tests: added required-reading checkbox interactions before form submission
- Result: 50/50 test files, 666/666 tests passing

## [2026-03-29] - Email Branding & Logo Fix

### Consultation Email Rebranding
- Consultation request emails (customer + admin) rebranded from old black/dark theme to CULTR design system
- Now uses `brandedEmailHeader('dark')`, `brandedEmailFooter()`, `EMAIL_FONT_IMPORT` — matching order confirmation emails
- Playfair Display headings, Inter body text, forest/cream/sage/mint color palette
- Mint status badges replacing old gold-on-black action boxes

### Email Logo Localhost Fix
- **Bug:** `brandedEmailHeader()` used `NEXT_PUBLIC_SITE_URL` directly for logo image URLs — on local dev this resolved to `http://localhost:3000`, causing broken logos in all emails sent from local/dev environments
- **Fix:** Added `getEmailSiteUrl()` helper in `lib/resend.ts` that falls back to `https://staging.cultrhealth.com` when URL is localhost or missing
- All 5 occurrences of the pattern across `lib/resend.ts` updated to use the new helper
- Affects: branded header logo, subscription expiring email, kit fulfillment email, results ready email, SiPhox failure alert

## [2026-03-29] - Core Selection Flow & Pricing Overhaul

### Pricing Model Changes
- **CULTR Core** — Price changed from $199 to $149* (starting price, varies by therapy)
- **CULTR Concierge** — Renamed from "CULTR Curated", price changed from $1,099 to $1,049
- **All paid plans** — Now begin with an initial 2-month clinical protocol (minimum commitment)
- **Core therapy options** — Semaglutide ($149/mo), Tirzepatide ($199/mo), Retatrutide ($239/mo)
- **Concierge** — Blood test + doctor visit now included (not add-on)

### Expandable Core Pricing Card
- Core card shows `$149*` with asterisk microcopy explaining variable pricing
- "Learn more" button expands card to reveal 3 therapy options with CULTR-branded vial images
- Each therapy card links to `/join/core?therapy=[slug]` for direct checkout
- Smooth CSS transition (max-height + opacity) on expand/collapse
- Non-Core cards unchanged — direct checkout CTA

### Checkout Redesign
- Order summary reframed as "Your initial 2-month clinical protocol"
- Dynamic totals: Core $508-$688 (by therapy), Catalyst+ $1,208, Concierge $2,098
- Concierge shows blood test + doctor visit as "included" (not additive)
- Required consent checkbox for 2-month commitment acknowledgment
- Optional marketing opt-in checkbox
- Submit button: "Start my protocol — $X today"
- Consent gate on all payment methods (Stripe, Authorize.net, CorePay, Klarna, Affirm, NOWPayments)
- `amountCents` corrected to use `todayTotal` instead of `plan.price`

### Terminology & Copy
- All "CULTR Curated" → "CULTR Concierge" across 15+ files
- All "clinical cycle" → "clinical protocol"
- All "cancel anytime" replaced with protocol-aware language
- All "no long-term contracts" removed from FAQ/How It Works
- Pricing page FAQ replaced with 6 new entries matching 2-month protocol model
- Global microcopy added below pricing cards
- Comparison table updated: $149*, $499, $1,049; Concierge lab test "Included"
- Creator resources updated with correct pricing and cancel language

### Files Modified (20+)
- `lib/config/plans.ts` — CORE_THERAPIES, plan prices/names/features/disclaimers
- `components/site/PricingCard.tsx` — Expand/collapse, therapy cards, disclaimer
- `app/join/[tier]/page.tsx` — Order summary, consent, dynamic totals, therapy param
- `app/pricing/page.tsx` — Section copy, comparison table, FAQ, microcopy
- `lib/config/quiz.ts`, `lib/config/social-proof.ts`, `lib/config/products.ts` — Price updates
- `components/site/ComparisonTable.tsx` — Curated → Concierge
- `app/faq/page.tsx`, `app/how-it-works/page.tsx` — Cancel language aligned
- `app/creators/page.tsx`, `app/creators/[slug]/page.tsx` — Price + name updates
- `app/creators/portal/resources/_data/` — 4 files: cancel language, pricing
- `app/science/page.tsx`, `scripts/generate-media-kit.tsx` — Name + price updates
- `app/admin/members/MembersClient.tsx`, `components/portal/KitEmptyState.tsx` — Price updates
- `public/images/therapies/` — 3 vial images added (semaglutide, tirzepatide, retatrutide)

---

## [2026-03-29] - Members Dashboard Brand Alignment

### Dashboard Rebranding
- **Page wrapper** — Replaced `bg-gray-50` with `bg-brand-cream`, header now uses brand tokens (`text-brand-primary`, `border-brand-primary/10`, `font-display`)
- **Removed sticky header overlap** — Dashboard had `sticky top-0 z-10` header that collided with site-wide Header from LayoutShell; now scrolls normally with content
- **MemberDashboard hero** — `from-stone-900 to-stone-800` gradient → `from-brand-primary to-forest-dark` (forest green)
- **All cards** — `bg-white border-stone-200` → `bg-cream-dark border-brand-primary/10` throughout (orders, LMN modal, protocol tools, provider resources, shop)
- **All text** — `text-stone-900/700/500/400/300` → `text-brand-primary` with opacity variants (`/50`, `/40`, `/30`, `/20`)
- **All buttons** — `bg-stone-900 rounded-lg` → `bg-brand-primary rounded-full hover:bg-forest-light` (brand spec)
- **LMN modal** — `bg-white` → `bg-brand-cream`, emerald accents → `bg-mint`/`bg-brand-primary`, download button now `rounded-full`
- **LMN count badge** — `bg-emerald-500` → `bg-sage text-brand-primary`
- **Peptide FAQ icon** — `bg-teal-100 text-teal-700` → `bg-mint text-brand-primary` (brand accent)
- **Provider Resources upgrade messages** — Fixed "Curated" → "Concierge" (correct tier name)

### ConsultationCard Branding
- Card background `bg-white` → `bg-cream-dark` to match dashboard cards
- Unknown status fallback `bg-gray-100 text-gray-600` → `bg-brand-primary/5 text-brand-primary/60`
- Exported `ConsultationCardData` interface for reuse

### Consultation Config
- `cancelled` status in `CONSULTATION_STATUSES` — `bg-gray-100 text-gray-600` → `bg-brand-primary/5 text-brand-primary/60`

### Files Modified
- `app/dashboard/page.tsx` — Page background, header, spinner branding
- `components/library/MemberDashboard.tsx` — Full rebrand (~75 class changes)
- `components/consultations/ConsultationCard.tsx` — Card background, fallback status, exported interface
- `lib/config/consultations.ts` — Cancelled status brand colors

---

## [2026-03-29] - Payment Providers + Admin Orders Overhaul + Creator Labs Dashboard

### New Payment Providers
- **CorePay (Authorize.Net gateway)** — New primary card processor with Accept.js tokenization (`CorePayForm.tsx`), API route (`/api/checkout/corepay`), and config (`COREPAY_CONFIG` in `lib/config/payments.ts`)
- **NOWPayments (Bitcoin)** — Crypto payment support via NOWPayments API (`lib/payments/nowpayments-api.ts`), checkout route (`/api/checkout/nowpayments`), webhook handler (`/api/webhook/nowpayments`), invoice cron (`/api/cron/nowpayments-invoices`), and `CryptoPaymentWidget.tsx`
- **Coming Soon providers** — Cherry and Coinbase Commerce feature flags added (`CHERRY_ENABLED`, `COINBASE_COMMERCE_ENABLED`)
- **PaymentMethodSelector** — Rebuilt to show active providers first (CorePay, NOWPayments) then "Coming Soon" badges for Stripe, Klarna, Affirm, Cherry, Coinbase
- **Join page** — Updated default payment method to CorePay when enabled; added Bitcoin checkout flow

### Admin Orders Overhaul
- **Tabbed Orders page** — All Orders / Pending Approval tabs with URL param support (`?tab=pending`), pending count badge
- **PendingApprovalTab** — New dedicated component for pending club order approvals
- **Club Orders "View all" link** — Now routes to `/admin/orders?tab=pending` instead of `/admin/club-orders`
- **Admin Dashboard** — External Tools section repositioned above Club Orders (was at bottom of page)

### Creator Portal — Labs Integration
- **Labs status card** — New `LabsStatusCard` on creator dashboard showing kit status, results summary, and phone requirement prompt
- **Creator labs API** — New endpoints: `/api/creators/labs` (kit status), `/api/creators/results` (biomarker results)
- **Creator labs page** — New `/creators/portal/labs` page for biomarker testing
- **Creator sidebar** — Added Labs navigation link

### Other Changes
- **Coupon config** — Updated coupon validation and configuration
- **Authorize.net API** — Minor fixes to `lib/payments/authorize-net-api.ts`
- **Portal labs** — `LabsClient.tsx` and `LabsResultsView.tsx` updates
- **KitRegistrationForm** — Minor updates

### Files Added
- `app/admin/orders/PendingApprovalTab.tsx`
- `app/api/checkout/corepay/route.ts`
- `app/api/checkout/nowpayments/route.ts`
- `app/api/cron/nowpayments-invoices/route.ts`
- `app/api/webhook/nowpayments/route.ts`
- `app/api/creators/labs/route.ts`
- `app/api/creators/results/route.ts`
- `app/creators/portal/labs/page.tsx`
- `components/payments/CorePayForm.tsx`
- `components/payments/CryptoPaymentWidget.tsx`
- `lib/payments/nowpayments-api.ts`

### Files Modified
- `app/admin/AdminDashboardClient.tsx` — External Tools repositioned, Club Orders link updated
- `app/admin/orders/OrdersClient.tsx` — Tabbed layout with pending approval tab
- `app/admin/orders/page.tsx` — Suspense wrapper for searchParams
- `app/join/[tier]/page.tsx` — CorePay + NOWPayments checkout flows
- `components/payments/PaymentMethodSelector.tsx` — New providers + Coming Soon states
- `lib/config/payments.ts` — CorePay, NOWPayments, Cherry, Coinbase Commerce configs
- `lib/payments/payment-types.ts` — New provider types
- `app/creators/portal/dashboard/page.tsx` — Labs status card
- `components/creators/CreatorSidebar.tsx` — Labs nav link
- Plus 10 other files with minor updates

---

## [2026-03-28] - Homepage Hero Responsive Alignment + Typography Fix

### Hero Text Positioning
- **Hero headline now anchored over the bending girl across all viewports** — Previously `left-[32%]` was fixed from 768px to 2560px+ while `object-cover object-center` cropped the image differently at each size, causing the headline to drift away from the girl.
- **Image focal point** — Changed from `object-center` to `object-[25%_center]` to anchor the crop on the bending girl (~25% from left edge of image), stabilizing her rendered position across all aspect ratios.
- **Responsive text positioning** — Replaced fixed `left-[32%]` with breakpoint-specific values: `left-[30%] lg:left-[30%] xl:left-[29%] 2xl:left-[28%]` so text tracks the girl from tablet to ultrawide.
- **Graduated font sizing** — Changed from `text-6xl lg:text-7xl` (2-step) to `text-5xl lg:text-6xl xl:text-7xl` (3-step) to prevent text overflow on tablets.
- **Text block constraint** — Added `max-w-[420px] lg:max-w-[480px]` to prevent sprawl on large screens.

### Typography Fix
- **Care path heading reduced** — `h2` ("Get matched to a personalized care path...") scaled down from `text-2xl md:text-5xl` to `text-xl md:text-3xl lg:text-4xl` for better proportion with the video cards below.

### Testing
- Added Playwright hero alignment test (`e2e/hero-alignment.spec.ts`) verifying text stays at 28-30% from left across 5 viewports (768px, 1024px, 1280px, 1440px, 1920px).
- Playwright config (`playwright.config.ts`) added with 5 viewport projects targeting staging.cultrhealth.com.

### Files Modified
- `app/page.tsx` — Hero image `object-position`, text positioning, font sizing, care path heading
- `playwright.config.ts` — New Playwright config
- `e2e/hero-alignment.spec.ts` — New hero alignment test

---

## [2026-03-27] - Creator Coupon Checkout Fix + NUMERIC Type Audit

### Critical Fixes
- **Creator coupon orders returning 500** — Orders using creator coupon codes (JON21, STEWART1, etc.) crashed with `invalid input syntax for type integer: "20.00"`. Root cause: `@vercel/postgres` returns `NUMERIC(8,2)` columns as strings. `affiliate_codes.discount_value` flowed as `"20.00"` into `club_orders.discount_percent INTEGER`. Staff coupons (OWNER, CULTR10) were unaffected since their discounts are JS number literals. **13 customer orders failed over 24 hours before detection.**
- **Override commission rate coercion** — `recruiter.override_rate` (NUMERIC string) was assigned directly to a `number` variable in `calculateOverrideCommission()` without `Number()` conversion, causing silent string arithmetic in override commission calculations.
- **Silent 500 errors on staging** — `next.config.js` had `removeConsole: true` which strips ALL console output (including `console.error`) on Vercel. Changed to `{ exclude: ['error', 'warn'] }` so server-side errors are visible in Vercel runtime logs.

### Full NUMERIC Audit
Verified every NUMERIC column read in the codebase. All other paths already use `Number()` or `parseFloat()`:
- `lib/creators/commission.ts` — `commission_rate` (line 144), `override_rate` (line 325)
- `app/api/admin/club-orders/[orderId]/approve/route.ts` — `tax_amount_usd`, `subtotal_usd`, `discount_percent`, `commission_rate`
- `app/api/admin/creators/update/route.ts` — `commission_rate`, `override_rate` via `parseFloat()`
- `lib/creators/db.ts` — All reads via `parseFloat()` at point of access
- `lib/db.ts` — All reads via `parseFloat()` at point of access
- All dashboard/network/leaderboard/earnings routes — `Number()` conversions

### Files Modified
- `lib/config/coupons.ts` — `Math.floor(Number(affiliateCode.discount_value))` on all 3 return paths
- `app/api/club/orders/route.ts` — `Math.floor(Number(couponResult.discount))` defense-in-depth
- `lib/creators/commission.ts` — `Number(recruiter.override_rate)` in `calculateOverrideCommission()`
- `next.config.js` — `removeConsole: { exclude: ['error', 'warn'] }`

---

## [2026-03-26] - Creator Commission System Audit & 5-Bug Fix

### Critical Fixes
- **BUG 1 (CRITICAL): Quote-only orders now get commissions on approval** — Previously, orders with `subtotal_usd = NULL` (quote-only carts) never triggered commission creation on approval. Now the approve route captures the QB invoice total and uses it as `effectiveSubtotal` for commission calculation, also writing it back to `club_orders.subtotal_usd`.
- **BUG 2 (CRITICAL): Override/recruiter commissions on approval** — The approve route only created direct commissions, never override. Extracted shared `calculateOverrideCommission()` and `insertCommissionLedgerEntries()` helpers in `lib/creators/commission.ts`, used by both `processOrderAttribution()` and the approve route.
- **BUG 3 (HIGH): `staging_creator` auth fallback logging** — `verifyCreatorAuth()` silently swallowed DB errors and returned `creatorId: 'staging_creator'` (invalid UUID). Now logs errors and warnings when this fallback fires.
- **BUG 4 (HIGH): Commission cron jobs now scheduled** — `approve-commissions` (2am daily) and `update-tiers` (3am daily) were missing from `vercel.json`. All commissions were stuck at `pending` forever.
- **BUG 5 (MEDIUM): QB `createInvoice` now returns invoice total** — `TotalAmt` from QB API response is now captured and returned, enabling BUG 1 fix.

### Database Audit Findings
- 30 real club orders exist — all used staff codes (OWNER, CULTRSTAFF, CULTRFAM, CULTR10, MARY20)
- Zero orders used creator codes (JON21, STEWART1) — dashboards legitimately empty
- Jon Collins: 171 clicks (108 unique IPs), 0 conversions
- Ran tier update cron manually — fixed 5 creators with `override_rate = 0%` → `5%` (Starter tier default)

### Files Modified
- `lib/quickbooks.ts` — `createInvoice()` returns `total` (from QB `TotalAmt` or local calculation)
- `lib/creators/commission.ts` — New `calculateOverrideCommission()` + `insertCommissionLedgerEntries()` shared helpers; refactored `processOrderAttribution()` to use them
- `app/api/admin/club-orders/[orderId]/approve/route.ts` — Uses invoice total for commission, calls shared helper for direct + override
- `lib/auth.ts` — Error/warning logging on `staging_creator` fallback
- `vercel.json` — Added `approve-commissions` + `update-tiers` cron schedules

### New Files
- `scripts/run-crons-manual.mjs` — One-shot script to run commission approval + tier update crons directly (bypasses CRON_SECRET auth)

---

## [2026-03-26] - Creator Link Performance Tracking (Admin Dashboard)

### New Features
- **Creator Link Performance section** — New section in the admin Overview dashboard showing clicks, conversions, non-converted visitors, and conversion rate per creator. Respects the existing period selector (7/30/90/365 days). Section hidden when no click data exists for the selected period.
- Summary cards: Total Clicks, Converted, Non-Converted, overall Conv. Rate (color-coded green ≥15% / yellow 10–14% / red <10%)
- Per-creator table sorted by total clicks (highest traffic first), with color-coded conv. rate per row. Totals row shown when >1 creator.

### Implementation Notes
- No new DB tables — surfaces existing `click_events.converted` boolean that was already being tracked but never displayed
- `getCreatorLinkPerformance(days)` SQL uses `ROUND(...)::float8` cast to ensure PostgreSQL `numeric` type is returned as a JS number (not string) by `@vercel/postgres`
- `make_interval(days => ${days})` — consistent with all other time-range queries in `lib/db.ts`

### Files Modified
- `lib/admin-types.ts` — Added `CreatorLinkPerformanceRow` interface + `creatorLinkPerformance` field to `AnalyticsData`
- `lib/db.ts` — Added `getCreatorLinkPerformance(days)` function
- `app/api/admin/analytics/route.ts` — Added to parallel `Promise.all`, included in response
- `app/admin/AdminDashboardClient.tsx` — New UI section after Operational Health, before Club Orders

---

## [2026-03-24] - Admin Dashboard Top 5 Features + SQL Hardening

### New Features
- **Revenue time-series chart** — Recharts ComposedChart with dual Y-axis (revenue area + orders line), auto-bucketing (daily/weekly/monthly based on period)
- **Date range filters** — From/To date pickers on Creator Network, Tracking Links, Coupon Codes, and Customer Master List tables
- **Member lifecycle management** — 3 new API endpoints: cancel (Stripe cancellation + audit log), pause (Stripe pause_collection with resume date), upgrade (Stripe tier change with proration). Admin dashboard member table with search, status filter, and action modals.
- **Customer detail views** — Clickable Customer Master List rows open full profile modal with tabbed view (Overview/Orders/Activity). Pulls from 5 tables: club_members, club_orders, orders, memberships, pending_intakes.
- **Order search & filtering** — New `/api/admin/orders` endpoint with text search (order number, email), status filter, date range, pagination. Replaces static "Recent Orders" section.

### Bug Fixes
- **Creator ROI discount formula** — `getCreatorROI()` was calculating discount as `revenue * rate / 100` but revenue is post-discount. Fixed to `revenue * rate / (100 - rate)`.
- **Customer detail 500 error** — Removed `payment_provider` column reference (doesn't exist in orders schema). Added `.catch()` fallbacks so missing tables don't crash the entire profile.
- **Revenue chart empty data** — `WHERE status != 'rejected'` excluded NULL-status orders. Fixed with `IS DISTINCT FROM`.

### SQL Pattern Hardening (@vercel/postgres compatibility)
- Replaced 9x `CAST(${days + ' days'} AS INTERVAL)` → `make_interval(days => ${days})` in `getQrScanStats()` — JS string concat in CAST is unreliable with prepared statements
- Replaced 3x `INTERVAL '1 day' * ${days}` → `make_interval()` in `getCouponStats()`, `getCreatorCommissionStats()`, `createPrelaunchCode()`
- Replaced `(status IS NULL OR status != 'rejected')` → `IS DISTINCT FROM` in `getRevenueTimeSeries()`
- Split CTE UNION ALL into parallel queries with JS merge for order search (duplicate param indices in UNION ALL)
- Replaced `IS NULL` conditional pattern with `ILIKE '%'` wildcard-all in order search
- Split parameterized `date_trunc(${bucket}, ...)` into 3 literal queries (daily/weekly/monthly)
- All interval parameters now consistently use `make_interval()` across the entire codebase

### New Files
- `app/api/admin/orders/route.ts` — Order search/filter/pagination endpoint
- `app/api/admin/customers/[email]/route.ts` — Full customer profile endpoint
- `app/api/admin/members/[customerId]/cancel/route.ts` — Stripe subscription cancellation
- `app/api/admin/members/[customerId]/pause/route.ts` — Stripe subscription pause
- `app/api/admin/members/[customerId]/upgrade/route.ts` — Stripe tier upgrade

### Files Modified
- `lib/db.ts` — 6 new functions (getRevenueTimeSeries, searchOrders, getCustomerFullProfile, getAllMembershipsForAdmin, getCreatorROI fix), 15 SQL pattern fixes
- `lib/creators/db.ts` — 1 SQL pattern fix (make_interval)
- `app/api/admin/analytics/route.ts` — Added revenueTimeSeries + allMemberships to response
- `app/admin/AdminDashboardClient.tsx` — Revenue chart, date filters, member management, customer detail modal, order search section

---

## [2026-03-23] - SiPhox Integration Health Check + Asher Med Compatibility

### SiPhox Critical Fixes
- **FK constraint violation (silent data loss)** — `siphox_kit_orders.siphox_customer_id` FK caused INSERT to silently fail when customer doesn't exist yet (pending state). Migration 027 drops FK constraint. Confirmed via Neon SQL console.
- **Missing isSiphoxConfigured() guards** — Function existed but was never called. Without `SIPHOX_API_KEY`, fulfillment attempts threw unhandled errors. Added guards to `triggerSiphoxFulfillment()`, `processDeferredOrders()`, `retryFailedOrders()`.
- **Undocumented env vars** — `SIPHOX_API_KEY`, `SIPHOX_API_URL`, `CRON_SECRET`, `BLOOD_TEST_STRIPE_PRICE_ID` added to `.env.example` and `docs/env-vars-go-live.md`.

### Asher Med API Compatibility (included in same deploy)
- ID type handling fixes, HIPAA patient filtering safety net, createNewOrder response parsing
- See previous changelog entry for full Asher Med details

### Admin Improvements
- **Creator update API** — New `PATCH /api/admin/creators/update` endpoint for commission_rate, override_rate, status changes with audit logging
- **Coupon code management** — Admin dashboard improvements for creator code management

### Deployment Incident & Recovery
- **Incident:** `vercel --prod` CLI accidentally deployed staging (full app) to production (waitlist-only site cultrhealth.com)
- **Root cause:** Vercel CLI deploys local directory, not git branch. Was on `staging` branch when `--prod` was run.
- **Recovery:** Promoted previous waitlist deployment back to production within minutes. No lasting impact.
- **Prevention:** Production deploys must go through git push to `production` branch or Vercel Dashboard promotion — never via `vercel --prod` CLI.

### Database
- Migration 027 (`siphox_relax_fk.sql`) — Drops FK constraints on `siphox_kit_orders` and `siphox_reports`
- Migrations 020-022 confirmed present (siphox_customers, siphox_kit_orders, siphox_reports tables)

### Env Vars Confirmed Set in Vercel
- `SIPHOX_API_KEY` — Set
- `CRON_SECRET` — Set

### Files Changed (23 files)
- `migrations/027_siphox_relax_fk.sql` (new)
- `lib/siphox/fulfillment.ts` — isSiphoxConfigured() guards
- `app/api/admin/creators/update/route.ts` (new) — Creator update endpoint
- `app/api/admin/creators/codes/route.ts` — Coupon management improvements
- `app/admin/AdminDashboardClient.tsx` — Portal link + coupon UI improvements
- `lib/asher-med-api.ts`, `lib/portal-auth.ts`, `lib/portal-db.ts`, `lib/portal-orders.ts` — ID/type fixes
- `app/api/intake/submit/route.ts`, `app/api/member/orders/route.ts`, `app/api/member/profile/route.ts` — Defensive ID handling
- `app/api/member/medical-records/route.ts`, `app/api/portal/orders/route.ts`, `app/api/portal/orders/[id]/route.ts` — Patient filtering
- `app/api/admin/orders/[orderNumber]/fulfill/route.ts`, `app/api/webhook/stripe/route.ts` — Type consistency
- `app/portal/dashboard/DashboardClient.tsx` — useState type fix
- `lib/db.ts` — ID handling
- `.env.example`, `docs/env-vars-go-live.md` — Env var documentation
- `tests/lib/siphox-fulfillment.test.ts` — Test updates

---

## [2026-03-23] - Creator Coupon Rate Changes + Admin Dashboard Audit

### Creator Coupon Updates
- **Jon Collins (JON21):** Customer discount reduced from 20% → 10%. Commission rate remains 20%. Migration 025.
- **Stewart (STEWART1):** Customer discount reduced from 20% → 10%, code_type changed to `general` (works for all order types). STEWART110 deactivated (consolidated into STEWART1). Commission rate remains 20%. Migration 026.

### Admin Dashboard Bugfix
- **Creator ROI discount formula** — Fixed `getCreatorROI()` in `lib/db.ts` to correctly back-calculate discount amounts from post-discount revenue. Was: `revenue * rate / 100` (understated). Now: `revenue * rate / (100 - rate)` (correct).

### Admin Dashboard Audit
- Comprehensive audit confirmed 35+ working features across main page and 5 sub-pages
- All CRUD operations verified: creator edit, coupon create/toggle, order fulfillment, prelaunch codes
- All CSV exports working: creators, customers, orders, coupons, tracking links
- Identified top 10 missing features for future implementation (revenue charts, date filters, member lifecycle, customer detail views, order search)

### Files Changed
- `migrations/025_jon21_discount_10.sql` — JON21 discount_value 20 → 10
- `migrations/026_stewart1_discount_consolidation.sql` — STEWART1 discount 20 → 10, type → general; STEWART110 deactivated
- `lib/db.ts` — Creator ROI discount formula fix
- `tests/integration/creator-e2e-jon-collins.test.ts` — Updated fixture to match new 10% discount

---

## [2026-03-23] - Asher Med API Compatibility Fixes

### Critical Fixes
- **ID type handling** — Removed `parseInt()` calls on Asher Med IDs across 5 API routes; IDs now passed as-is to support both numeric and UUID formats
- **Patient order filtering (HIPAA)** — Added client-side patient filtering safety net in all 4 `getOrders()` consumers to prevent cross-patient data exposure if API ignores `patientId` query param
- **createNewOrder response parsing** — Now handles both flat (`data.id`) and nested (`data.patient.id`) response shapes from Asher Med API

### Moderate/Minor Fixes
- **URL config unification** — API client now respects `ASHER_MED_ENVIRONMENT` setting instead of using duplicate URL lookup
- **Admin portal link** — Fixed link from API endpoint URL to actual partner portal UI

### Documentation
- `.env.example` — Added all Asher Med environment variables with descriptions
- `docs/env-vars-go-live.md` — Updated Asher Med configuration section

### Files Changed
- `lib/asher-med-api.ts` — Response parsing, URL unification, patient filtering safety net
- `lib/portal-auth.ts`, `lib/portal-db.ts`, `lib/portal-orders.ts` — ID type consistency (string | number)
- `app/api/intake/submit/route.ts` — Flexible response shape handling
- `app/api/member/orders/route.ts`, `app/api/member/profile/route.ts`, `app/api/member/medical-records/route.ts` — Defensive ID handling
- `app/api/portal/orders/route.ts`, `app/api/portal/orders/[id]/route.ts` — Patient filtering + ID fixes
- `app/admin/AdminDashboardClient.tsx` — Portal link fix + coupon code management improvements
- `lib/db.ts` — ID handling updates
- `app/api/webhook/stripe/route.ts` — ID type consistency

---

## [2026-03-23] - Admin Dashboard Operational Intelligence

### Operational Health Metrics
- Added conditional Operational Health row: intake completion rate, refund rate, BNPL payment method breakdown
- Cards only render when underlying data exists (graceful handling of missing tables)

### Invoice Aging
- New section showing all pending club orders with days-waiting color-coded badges (green <=3d, yellow 3-7d, red >7d)
- Summary badges: total pending, oldest wait, average wait

### Revenue by Tier + Creator ROI
- Revenue by Tier: per-membership-plan revenue cards (auto-activates when memberships table exists)
- Creator ROI table: discount given vs commission earned per creator, net profit/cost color-coded

### Creator Portal Enhancements
- Link Performance table in creator dashboard: per-link conversion rates (slug, destination, clicks, conversions, rate)
- Earnings trend indicator on commission card: up/down arrow comparing this month vs last month

### Files Changed
- `lib/db.ts` — 6 new query functions (getInvoiceAging, getRefundStats, getRevenueByTier, getBnplAdoption, getCreatorROI, getIntakeFunnel)
- `lib/creators/db.ts` — getCreatorLinkStats, getCreatorEarningsTrend
- `app/api/admin/analytics/route.ts` — Extended with 6 new data sources
- `app/admin/AdminDashboardClient.tsx` — 4 new sections + conditional rendering
- `app/api/creators/dashboard/route.ts` — Returns linkStats + earningsTrend with .catch() fallbacks
- `lib/contexts/CreatorContext.tsx` — Added linkStats + earningsTrend to context
- `app/creators/portal/dashboard/page.tsx` — Link Performance table + earnings trend indicator

---

## [2026-03-22] - Admin Dashboard Complete Overhaul

### New Metric Cards
- Total Customers, Pending Invoices, Active Creators (3 new cards, 7 total)

### New Data View Sections
- **Creator Network** — searchable table of all creators (name, email, status, tier, commission rate, recruits, codes, revenue)
- **All Tracking Links** — table with summary badges (slug, creator, destination, clicks, conversions, conv. rate)
- **All Coupon Codes** — table with type badges (code, creator, type, discount, uses, revenue, Stripe synced, active)
- **Customer Master List** — searchable table of all club members (name, email, phone, location, type, source, orders, total spent)

### Files Changed
- `lib/db.ts` — 5 new query functions (getAllCreatorsForAdmin, getAllTrackingLinksForAdmin, getAllAffiliateCodesForAdmin, getAllCustomersForAdmin, getAdminDashboardCounts)
- `app/api/admin/analytics/route.ts` — Extended with 5 new data sources
- `app/admin/AdminDashboardClient.tsx` — 4 new searchable table sections + 3 new metric cards

---

## [2026-03-22] - Creator Provisioning + Coupon System Critical Fix

### Creator: Jon Collins
- Provisioned `teamjoncollins21@gmail.com` as active creator
- Custom coupon code `JON21` (20% off) — single code for all orders
- Custom commission rate: 20% (vs default 10%)
- Tracking links: `/r/joncollins441` (default) + `/r/jon21`

### Creator: Stewart — 20% Upgrade
- Updated `stewart@cultrhealth.com` to 20% discount on codes `STEWART1`/`STEWART110` and 20% commission
- Deactivated typo account `stewart@cultrheath.com` codes (`STEWART`/`STEWART10` at 10%) to prevent confusion

### Critical Bug Fix — Migration 024
- `affiliate_codes` table was missing `expires_at`, `max_uses`, `program_type`, `created_by_admin` columns
- This caused ALL creator coupon codes to silently fail validation (getAffiliateCodeByCode threw DB error, caught by try/catch)
- Fix: Ran migration 024 to add missing columns

### Commission Engine — Per-Creator Rates
- Commission engine now uses per-creator `commission_rate` from DB instead of hardcoded 10%
- Null-safe check: `creator?.commission_rate != null` (handles hypothetical 0% rate)
- All other creators remain at 10% via DB column default

### Approval Email Fix
- Order confirmation emails (customer + admin) now show coupon discount breakdown
- Back-calculates pre-discount subtotal from stored discount_percent

### E2E Test
- 24-test suite covering full Jon Collins creator pipeline: coupon validation, click tracking, order attribution, commission calculation, dashboard/earnings APIs, admin analytics

### Files Changed
- `lib/creators/commission.ts` — Per-creator commission rate
- `app/api/admin/club-orders/[orderId]/approve/route.ts` — Coupon discount in approval emails
- `lib/config/coupons.ts` — validateCouponUnified (already existed, now works with migration 024)
- `tests/integration/creator-e2e-jon-collins.test.ts` — New 24-test E2E suite

---

## [2026-03-22] - Intake Medication Badges

### Medication Selector — Compliance Badges
- Added "Compounded in the USA" and "Prescription Only" badges to all 10 medication cards in the intake form (Step 3)
- Subtle pill-style labels below dosage line using `text-[10px]` with forest/5 background
- File: `components/intake/MedicationSelector.tsx`

---

## [2026-03-22] - Join Page Two-Row Grid + "Compounded in the USA" Badges

### Enhancement Section — Two-Row Layout
- Enhancement section (8 products) on join.cultrhealth.com now renders in two rows instead of a single-row carousel
- **Mobile:** Two stacked `Carousel` instances (4 items each) using the existing `MobileCarousel` swipe/translateX mechanism — required because page wrapper has `overflow-x-hidden` which blocks CSS overflow scrolling
- **Desktop:** 2-row horizontally scrollable grid (paired columns) with arrow controls
- Card `compact` mode: smaller dimensions (300×180px mobile, 400×260px desktop)
- Cut section (3 items) retains the existing single carousel
- Removed decorative ambient light effect blobs (white/sage quarter-circles) from card corners

### Card Hydration Fix
- Changed card face from `motion.button` to `motion.div` with `role="button"` — fixes HTML nesting violation (`<button>` inside `<button>`) that caused React hydration error

### "Compounded in the USA" Badge
- Added "Compounded in the USA" badge across all product views:
  - Join page carousel cards (apple-cards-carousel.tsx)
  - Therapies grid (TherapiesGrid.tsx)
  - Members shop product cards (ShopClient.tsx)
  - Product detail pages (ProductDetailClient.tsx)
  - Product catalog (ProductCatalog.tsx)

### Files Changed
- `app/join/JoinLandingClient.tsx` — `TwoRowLayout` component (two stacked Carousels on mobile, paired-column scroll on desktop), compact card flag
- `components/ui/apple-cards-carousel.tsx` — `compact` prop on Card, `motion.div` hydration fix, ambient blobs removed, "Compounded in the USA" label
- `components/site/TherapiesGrid.tsx` — Compounded badge
- `app/library/shop/ShopClient.tsx` — Compounded badge
- `app/library/shop/[sku]/ProductDetailClient.tsx` — Compounded badge
- `components/library/ProductCatalog.tsx` — Compounded badge

---

## [2026-03-22] - Creator Portal Production Readiness: Tracking Links + E2E Test

### Creator Portal — Tracking Links Fix
- Tracking links in creator Share page now display `join.cultrhealth.com/r/{slug}` instead of `staging.cultrhealth.com`
- Link destinations updated to valid join domain paths (`/join/core`, `/join/catalyst`, `/join/concierge`, `/join/club`)
- Coupon code descriptions reference `join.cultrhealth.com`
- Custom URL helper text updated

### Creator Coupon Attribution — Real-DB E2E Test
- New integration test: `tests/integration/coupon-attribution-e2e.test.ts` (14 tests)
- Hits real staging Neon database — zero mocks
- Covers full chain: `validateCouponUnified` → `resolveAttribution` → `processOrderAttribution` → dashboard stats
- Verifies: 10% direct commission, override commission for recruiter, self-referral detection, paused creator blocking, code usage tracking, dashboard metrics aggregation
- Test data isolated per run with unique prefix, auto-cleaned in afterAll

### Files Changed
- `app/creators/portal/share/page.tsx` — baseUrl → `join.cultrhealth.com`, coupon descriptions updated
- `lib/config/affiliate.ts` — LINK_DESTINATIONS updated to join domain checkout paths
- `tests/integration/coupon-attribution-e2e.test.ts` — New real-DB E2E test (14 tests)

---

## [2026-03-22] - Phase 3: Core Marketing Page Rewrites

### Summary
Integrated shared components (MarketingHero, TrustStrip, SocialProofBadge, TherapyGoalFilter, HowItWorksSteps) into all 5 core marketing pages. Applied strategy doc copy, added new sections, and improved conversion paths.

### Homepage (`app/page.tsx`)
- Added value prop + proof line to desktop hero
- Added `TrustStrip` after hero (replaced inline trust badges bar)
- Added `SocialProofBadge` on mobile
- Rewritten 3-step copy (Take the Quiz → Meet Your Provider → Your Protocol Arrives)
- CTA updated: "See Plans" → "Compare Plans"

### Pricing (`app/pricing/page.tsx`)
- Replaced inline hero with `MarketingHero` (strategy doc copy)
- Added `SocialProofBadge` below hero
- Added CORE/Enhancement glossary section
- Added therapy unlock matrix (7 therapy categories × 3 plan tiers)

### Therapies (`app/therapies/page.tsx`)
- Replaced inline hero with `MarketingHero`
- Added "How protocols are chosen" explainer (5 factors)
- Added `TherapyGoalFilter` for goal-based browsing
- New `TherapiesClient.tsx` client wrapper for filter state
- Added "Learn the Science" secondary CTA
- Title fixed: "Core Therapies" → "Therapies"

### How It Works (`app/how-it-works/page.tsx`)
- Replaced image hero with `MarketingHero` (consistent dark gradient)
- Replaced 4-step inline process with 5-step `HowItWorksSteps` component
- Added state availability + proof line in hero
- Added `SocialProofBadge`

### Science (`app/science/page.tsx`)
- Replaced inline hero with `MarketingHero`
- Added 4 "Start Here" curated collections
- Added author attribution on all blog cards (Editorial Team + Dr. Ali Saberi, MD)
- Fixed newsletter CTA: "Join CULTR Health" → quiz CTA
- Added `SocialProofBadge`

### Files Changed (8 files)
- `app/page.tsx` — TrustStrip, SocialProofBadge, value prop, step copy
- `app/pricing/page.tsx` — MarketingHero, glossary, therapy matrix
- `app/therapies/page.tsx` — MarketingHero, goal filter, protocol explainer
- `app/therapies/TherapiesClient.tsx` — New client wrapper
- `app/how-it-works/page.tsx` — MarketingHero, 5-step HowItWorksSteps
- `app/science/page.tsx` — MarketingHero, Start Here, author attribution
- `app/faq/page.tsx` — Minor cleanup
- `app/layout.tsx` — Minor cleanup

---

## [2026-03-22] - Website Overhaul V1: Data Fixes, Shared Components, Creators Page Revamp

### Summary
V1 of the marketing site overhaul based on two strategy documents (Route-by-Route Implementation Checklist + College Town Expansion Playbook). Fixed data inconsistencies, created 6 reusable marketing components, and fully rewrote the /creators page to reflect the complete creator program.

### Data Fixes
- **Pricing bug**: How-It-Works page showed `$99-$499/month` — corrected to `$199/month`
- **Provider placeholder**: Removed "New Provider Coming Soon" from `social-proof.ts`
- **Safety claim**: Replaced inaccurate "24/7 emergency guidance" with defensible copy
- **Badge logic**: Set CULTR Club `isRecommended: false` (was incorrectly recommended over paid plans)
- **Footer links**: "Partner" now links to `/creators` (was `/pricing`), "Manage Account" to `/portal/login` (was `/login`)

### New Shared Components (6 files)
- **`SocialProofBadge.tsx`**: Compact badge showing member count + rating (pill/inline variants)
- **`TrustStrip.tsx`**: Horizontal 5-item trust icons strip (light/dark variants)
- **`MarketingHero.tsx`**: Reusable hero with badge, title, subtitle, proof line, CTAs
- **`TherapyGoalFilter.tsx`**: Goal-based filter chips with `filterByGoal()` utility
- **`HowItWorksSteps.tsx`**: 3-step and 5-step process component
- **`LeadCapturePrompt.tsx`**: Email capture with 3 variants (results/save/next-steps)

### Creators Page Full Rewrite
- **Fixed wrong override rates**: Was hardcoded 2%/4%/6%/8%, now pulls from `TIER_CONFIGS` (actual: 5%/10%/15%/20%)
- All commission data sourced from `COMMISSION_CONFIG` and `TIER_CONFIGS` — rates can never drift
- 10 sections: Hero, 3 Commission Streams, 6-Month Bonus Window, How It Works, Tier Progression, What You Get (8 features), Payout Details, Creator Tracks, FTC Compliance, Apply CTA

### Files Changed (11 files)
- `app/creators/page.tsx` — Full rewrite (264 → 430+ lines)
- `app/how-it-works/page.tsx` — Pricing + safety claim fixes
- `components/site/Footer.tsx` — Link fixes
- `lib/config/plans.ts` — Club isRecommended fix
- `lib/config/social-proof.ts` — Provider placeholder removed
- `components/site/SocialProofBadge.tsx` — New
- `components/site/TrustStrip.tsx` — New
- `components/site/MarketingHero.tsx` — New
- `components/site/TherapyGoalFilter.tsx` — New
- `components/site/HowItWorksSteps.tsx` — New
- `components/site/LeadCapturePrompt.tsx` — New

---

## [2026-03-18] - Creator Commission Admin Dashboard + Logout Buttons

### Summary
Added creator commission metrics to admin dashboard, admin layout with auth guard and logout, and creator portal logout button. Deep audit fixed SQL logic bug in active creator counting, missing status colors, and enhanced attribution error logging.

### New Features
- **`lib/db.ts`**: `getCreatorCommissionStats(days)` — aggregates `commission_ledger` by status (pending/approved/paid/lifetime) + counts creators by status. Active creator count excludes reversed-only creators via `COUNT(DISTINCT CASE WHEN status != 'reversed')`.
- **`app/admin/AdminDashboardClient.tsx`**: Creator Program section with 4 colored summary cards (Pending, Approved, Paid, Active Creators), creator status pills with proper colors, "Manage Creators" link to `/admin/creators`
- **`app/admin/layout.tsx`**: Server-side admin auth guard with redirect to `/login?redirect=/admin`
- **`app/admin/AdminTopBar.tsx`**: Top bar showing admin email + logout button
- **`components/creators/CreatorSidebar.tsx`**: Logout button with loading state in creator portal sidebar

### Bug Fixes
- **`getStatusColor` missing creator statuses**: `paused` → yellow, `rejected` → red (both previously fell through to neutral gray, making them indistinguishable)
- **`active_creators` SQL logic**: `COUNT(DISTINCT cl.beneficiary_creator_id)` counted creators with ONLY reversed commissions as "active". Fixed to `COUNT(DISTINCT CASE WHEN cl.status != 'reversed' THEN cl.beneficiary_creator_id END)`
- **Attribution error logging**: Enhanced with `codeType` and `customerEmail` fields for complete manual recovery from Vercel logs when `processOrderAttribution()` fails

### Files Changed (6 files)
- `lib/db.ts` — New `getCreatorCommissionStats()` + `CreatorCommissionStats` interface
- `app/api/admin/analytics/route.ts` — Wired creator stats into Promise.all
- `app/admin/AdminDashboardClient.tsx` — Creator Program section, `getStatusColor` fix, Manage Creators link
- `app/api/club/orders/route.ts` — Structured attribution error logging
- `app/admin/layout.tsx` — New: admin layout with auth guard
- `app/admin/AdminTopBar.tsx` — New: admin top bar with logout
- `components/creators/CreatorSidebar.tsx` — Logout button

---

## [2026-03-18] - QR Code Scan Tracking & Business Card

### Summary
Added QR code scan tracking infrastructure for physical business cards. Scans route through `/go/[destination]` → `/api/track/qr-scan` which captures device, browser, OS, geo location, and hashed IP before redirecting. Analytics integrated into admin dashboard with metrics, breakdowns, and recent scans table.

### New Features
- **QR redirect handler** (`app/go/[destination]/route.ts`): Routes scans through tracking API before redirecting to destination
- **Scan tracking API** (`app/api/track/qr-scan/route.ts`): Captures device type, browser, OS, geo location (via Vercel headers), and hashed IP for privacy-safe analytics
- **Admin dashboard analytics** (`app/admin/AdminDashboardClient.tsx`): QR scan metrics section with 4 metric cards, breakdowns by destination/OS/browser, top locations, recent scans table
- **Migration 023** (`migrations/023_qr_scans.sql`): `qr_scans` table with 5 indexes (executed on staging DB)
- **Destination map**: instagram, tiktok, youtube, website, quiz, pricing — extensible via `QR_DESTINATIONS`

### Business Card
- **Print-ready PDF** (`cultr_business_card.pdf`): 3.5" × 2" with 0.125" bleed
- **Generation script** (`scripts/generate-business-card.mjs`): @react-pdf/renderer + sharp + qrcode
- **Brand logo**: Actual CULTR SVG letterform paths rendered via sharp for pixel-perfect output
- **HEALTH subtitle**: Font-size 10, Helvetica, natural spacing, positioned below CULTR under the R
- **QR code**: Forest green on white, links to `staging.cultrhealth.com/go/instagram?source=business_card`
- **Brand fonts**: Playfair Display (headings) + Inter (body) — TTF files in `scripts/fonts/`

### Brand Fixes
- **Logo SVGs** (`cultr-logo-*-health.svg`): Changed HEALTH text font-family from `Georgia, serif` to `Inter, -apple-system, sans-serif` (3 files)
- **Email fixes**: `mailto:` encoding fix in supplement-order, opacity→color fix in creator-apply email header

### Files Changed (12 files)
- `app/go/[destination]/route.ts` — New: QR redirect handler
- `app/api/track/qr-scan/route.ts` — New: scan tracking + device parsing
- `migrations/023_qr_scans.sql` — New: qr_scans table + indexes
- `lib/db.ts` — Added `getQrScanStats()` + `QrScanStats` interface
- `app/api/admin/analytics/route.ts` — QR scan stats in analytics payload
- `app/admin/AdminDashboardClient.tsx` — QR scan analytics dashboard section
- `cultr_business_card.pdf` — Regenerated with tracking QR + brand logo
- `scripts/generate-business-card.mjs` — PDF generator (sharp + @react-pdf/renderer)
- `scripts/fonts/` — Playfair Display + Inter TTF files
- `public/cultr-logo-*-health.svg` — Inter font for HEALTH text (3 files)
- `app/api/creators/apply/route.ts` — Email template color fix
- `app/api/supplement-order/route.ts` — mailto: link encoding fix

### Dev Dependencies Added
- `qrcode` ^1.5.4, `sharp` (SVG→PNG conversion)

---

## [2026-03-18] - Email Security: XSS Prevention in All Email Templates

### Summary
Added centralized `escapeHtml()` utility to `lib/resend.ts` and applied it across all 7 email-sending API routes. All user-controlled data (names, addresses, item names, coupon codes, phone numbers) is now sanitized before injection into HTML email templates.

### Security Fix
- **`lib/resend.ts`**: Added `escapeHtml()` function that handles `&`, `<`, `>`, `"`, `'` characters
- **7 API routes patched**: `club/signup`, `club/orders`, `admin/club-orders/approve`, `creators/apply`, `creators/support/tickets`, `member/consult-request`, `supplement-order`, `webhook/quickbooks`

### Also Added
- Email client compatibility improvements: `lang` attribute, `color-scheme` meta tags, RGBA → solid hex border colors
- `sendResultsReadyEmail()` function in `lib/resend.ts` for SiPhox results notification

### Files Changed (8 files)
- `lib/resend.ts` — `escapeHtml()` utility + `sendResultsReadyEmail()`
- `app/api/club/signup/route.ts` — Welcome email escaped
- `app/api/club/orders/route.ts` — Customer + admin emails escaped
- `app/api/admin/club-orders/[orderId]/approve/route.ts` — Approval email escaped
- `app/api/creators/apply/route.ts` — Application emails escaped
- `app/api/creators/support/tickets/route.ts` — Ticket emails escaped
- `app/api/member/consult-request/route.ts` — Consult emails escaped
- `app/api/supplement-order/route.ts` — Order emails escaped
- `app/api/webhook/quickbooks/route.ts` — Payment emails escaped

---

## [2026-03-18] - Phase 04-02 & 04-03: Labs Results UI, Dashboard Widgets & Notification Cron

### Summary
Completed and deployed SiPhox Labs Dashboard Phases 04-02 (results UI) and 04-03 (dashboard widgets + results notification cron). Members can now view biomarker results organized by body system with color-coded reference ranges, and receive automatic email notifications when new results are processed.

### Phase 04-02: Labs Results UI
- **`components/portal/LabsResultsView.tsx`**: Full results display with category tabs, biomarker counts, and drill-down navigation
- **`components/portal/BiomarkerCategoryCard.tsx`**: Category cards showing optimal/attention counts with expandable biomarker lists
- **`components/portal/BiomarkerDetailModal.tsx`**: Detailed biomarker view with value, status, reference range, and description
- **`components/portal/ReferenceRangeBar.tsx`**: Color-coded range visualization (green=optimal, yellow=normal, red=high/low)
- **`app/portal/labs/LabsClient.tsx`**: Integrated results view into labs page

### Phase 04-03: Dashboard Widgets + Notifications
- **`app/portal/dashboard/DashboardClient.tsx`**: Kit card shows biomarker summary stats (total tested, optimal count, needs attention count) when results are ready; Club tier members see "Upgrade your plan to unlock blood testing" message
- **`app/api/cron/siphox-results/route.ts`**: Hourly cron job that finds customers with unnotified reports and sends results-ready emails, batch limit 50, CRON_SECRET auth
- **`lib/siphox/db.ts`**: `getCustomersWithUnnotifiedReports()` and `markResultsNotified()` for dedup tracking
- **`lib/resend.ts`**: `sendResultsReadyEmail()` with dark theme, biomarker stats row, CTA button
- **`vercel.json`**: Added cron schedule `0 * * * *`
- **`migrations/022_siphox_results_notification.sql`**: Adds `last_notified_report_id` + `results_notified_at` columns to `siphox_customers`

### Tests
- 3 new test files: `BiomarkerCategoryCard.test.tsx`, `BiomarkerDetailModal.test.tsx`, `LabsResultsView.test.tsx`
- All 570+ tests passing

### Coupon Analytics (also in this deploy)
- `lib/db.ts`: `getCouponStats()` function for admin analytics
- `app/api/admin/analytics/route.ts`: Wired coupon stats into analytics API
- `app/admin/AdminDashboardClient.tsx`: Coupon performance metrics with creator attribution display

### Files Changed (31 files)
- 21 modified, 10 new files — see commit `551a603` for full diff

---

## [2026-03-17] - Admin Coupon Analytics: Bug Fixes & Creator Attribution

### Summary
Fixed critical bugs in admin dashboard coupon analytics that caused incorrect type classification and broken creator code detection. Added creator name display to club orders admin view.

### Critical Bugfixes
- **`lib/db.ts` getCouponStats() SQL**: `co.attributed_creator_id` was in GROUP BY but **missing from SELECT** — caused `row.attributed_creator_id` to always be `undefined`, silently breaking creator code detection (all creator codes showed as generic "Promo" instead of "Creator (Name)")
- **`app/admin/AdminDashboardClient.tsx` type classification**: Hardcoded `staffCodes` array only had 3 of 6 `CLUB_COUPONS` entries (OWNER, CULTRSTAFF, CULTRFAM) — CULTR10, SUMMER20, MARY20 incorrectly showed as "Promo" with no label distinction from unknown codes. Replaced with `INTERNAL_COUPON_LABELS` map covering all 6 codes
- **`app/admin/AdminDashboardClient.tsx` creator detection**: Used `!!coupon.creator_name` (from LEFT JOIN) as creator signal — if a creator record was deleted, their codes silently lost the "Creator" badge. Now uses `!!coupon.attributed_creator_id` (stored at order time, survives creator deletion)

### Improvements
- **3-tier badge system**: Purple badges for creator codes, yellow for staff/owner/family codes, green for promo codes (previously all non-creator codes were green)
- **`app/api/admin/club-orders/route.ts`**: Added `LEFT JOIN creators` to include `creator_name` in club orders API response
- **`app/admin/club-orders/ClubOrdersClient.tsx`**: Expanded order detail now shows creator name inline: "Creator referral (Mary Smith)" instead of just "Creator referral"
- **Performance**: Moved `INTERNAL_COUPON_LABELS` constant to module scope (was recreated on every table row render)

### Coupon Amounts Verified (all 6 CLUB_COUPONS)
| Code | Discount | Admin Badge |
|------|----------|-------------|
| OWNER | 60% | Yellow "Owner" |
| CULTRSTAFF | 30% | Yellow "Staff" |
| CULTRFAM | 20% | Yellow "Family" |
| CULTR10 | 10% | Green "Promo" |
| SUMMER20 | 20% | Green "Promo" |
| MARY20 | 20% | Green "Promo" |
| Creator codes | 10% (default) | Purple "Creator (Name)" |

### Files Changed (4 files)
- `lib/db.ts` — Added `attributed_creator_id` to CouponStatRow interface, SELECT clause, and row mapping
- `app/admin/AdminDashboardClient.tsx` — Fixed type classification logic, added `attributed_creator_id` to interface, module-level `INTERNAL_COUPON_LABELS`, 3-tier badge colors
- `app/api/admin/club-orders/route.ts` — LEFT JOIN creators for creator_name
- `app/admin/club-orders/ClubOrdersClient.tsx` — Added `creator_name` to interface and expanded view display

---

## [2026-03-17] - Phase 04-01: Biomarker Catalog & Report Processing Pipeline

### Summary
Built the biomarker mapping system and report fetching/processing pipeline for the Labs Dashboard. Also fixed 5 Phase 3 bugs found during audit.

### New Features (Phase 04-01)
- **Biomarker catalog** (`lib/siphox/biomarkers.ts`): 50 SiPhox biomarkers mapped to 7 body-system categories (heart, metabolic, hormonal, inflammation, thyroid, nutritional, extended) with display names, abbreviations, units, descriptions, and sort orders
- **Report processing pipeline** (`lib/siphox/reports.ts`): Fetch→cache→process pipeline — fetches from SiPhox API, caches new reports in DB, computes biomarker statuses (optimal/normal/low/high/critical/na), organizes by category with summary stats
- **Results API endpoint** (`app/api/portal/results/route.ts`): Authenticated GET endpoint with three-tier error handling — DB failures and API failures gracefully degrade to empty state instead of 500s
- **35 new tests**: Biomarker catalog integrity (16), report processing logic (13), API endpoint behavior (6) — all 538 tests passing

### Phase 3 Bugfixes
- **LabsClient.tsx line 32**: Fixed 401 response leaving infinite loading spinner — now sets `isLoading(false)` before return
- **LabsClient.tsx line 90**: Simplified redundant `showEmptyState` condition from `!hasKitOrders && (!data?.siphoxCustomerId || !hasKitOrders)` to `!hasKitOrders`
- **KitRegistrationForm.tsx line 76**: Added 1.5s delay before `onSuccess()` callback so success message is visible before parent re-renders
- **POST /api/portal/labs route.ts line 109**: Wrapped `getSiphoxCustomerByPhone` in try-catch for `SiphoxDatabaseError`, returns 503 gracefully
- **reports.ts computeStatus**: Fixed status mapping — 'normal' and 'acceptable' now correctly map to 'normal' (was incorrectly mapping to 'optimal')

---

## [2026-03-16] - Asher Med Integration Audit Fixes

### Summary
Security, data access, and dashboard display fixes identified through a comprehensive audit of the Asher Med Partner Portal integration.

### Critical Security Fixes
- **Profile route auth** (`app/api/member/profile/route.ts`): Replaced `JSON.parse(sessionCookie.value)` with proper JWT verification via `verifySessionToken()` in both GET and PUT handlers — raw JSON parse would throw on JWT tokens, breaking auth
- **Membership query scoping** (`app/api/member/profile/route.ts`): Added `WHERE stripe_customer_id = ${customerId}` filter — previous query returned the most recent membership globally, potentially leaking another user's tier/subscription status
- **Patient ID vs Order ID** (`app/api/intake/submit/route.ts`): `createNewOrder()` returns a patient ID, not an order ID. Fixed `updateOrderApproval()` to first fetch orders via `getOrders({ patientId })` to resolve the actual order ID before sending the partner note PATCH

### Dashboard Display Fixes
- **Dashboard page** (`app/dashboard/page.tsx`): Now fetches user profile client-side and passes real `tier`, `email`, and `libraryAccess` to MemberDashboard — was hardcoded as `tier={null} email=""`
- **Order field alignment** (`components/library/MemberDashboard.tsx`): Changed `Order` interface from `{ orderId, medication }` to `{ orderNumber, medicationName }` matching the actual API response shape
- **Missing status configs** (`components/library/MemberDashboard.tsx`): Added `approved`, `denied`, `waitingRoom`, `prescribed` to `STATUS_CONFIG` — orders in these Asher Med statuses were all falling back to the pending icon

### HIPAA Compliance
- Removed debug `console.log` statements from intake submit route (medication mapping logs, DB update confirmations)
- Replaced `console.error(error)` with `console.error(error.message)` to avoid logging full error objects that could contain PHI
- Converted Asher Med API catch blocks to empty catches where error details aren't needed

---

## [2026-03-16] - Science Blog Article Images

### Summary
Replaced green gradient placeholders on the `/science` page with real article images for the 3 featured posts.

### Changes
- **New images:** `public/blog/nad-longevity.png`, `public/blog/biomarker-basics.png`, `public/blog/glp1-metabolic.png`
- **BlogCard component** (`app/science/page.tsx`): Replaced `BookOpen` icon placeholder with `next/image` using `fill` + `object-cover`, added hover zoom (`scale-105`), responsive `sizes` attribute, mint/sage gradient fallback for posts without images
- **Frontmatter:** Updated image extensions from `.jpg` → `.png` in `nad-and-longevity.md`, `biomarker-basics.md`, `glp1-beyond-weight-loss.md`

---

## [2026-03-15] - Biomarker Explainer + OWNER Coupon

### Biomarker Explainer Link
- **New component:** `components/site/BiomarkerExplainer.tsx` — client component, "See what we test ›" link opens modal with SiPhox Health embedded biomarker iframe
- **Integrated on:** PricingCard (auto-detects "lab test" features), `/pricing` comparison table + "Comprehensive Lab Panels" card, `/` homepage comparison table, `/how-it-works` "Comprehensive Lab Testing" card

### OWNER Coupon
- **Code:** `OWNER` — 60% off, label "Owner Discount"
- **File:** `lib/config/coupons.ts` — added to `CLUB_COUPONS` map
- **Full coupon list:** OWNER (60%), CULTRSTAFF (30%), CULTRFAM (20%), CULTR10 (10%)
- **Admin email:** Already shows discounted subtotal, coupon line, tax on discounted amount, and final total — no changes needed

---

## [2026-03-15] - Therapies Page Redesign + Site-Wide Brand Consistency

### Summary
Redesigned the `/therapies` page from text-only cards to a premium interactive product showcase with vial images, hover-to-expand interactions, and brand-consistent design. Updated Tools, Creators, Community, and Library Login pages to match the established brand pattern across all marketing pages.

### Therapies Page (`app/therapies/page.tsx`)
- **New data model:** Replaced `THERAPY_SECTIONS` (2 sections, 15 therapies) with flat `THERAPY_PRODUCTS` array (10 core products with specs, tags, short + long descriptions)
- **New component:** `components/site/TherapiesGrid.tsx` — client component with expandable cards, image hover zoom (`scale-110`), `glass-card`/`border-gradient`/`glow-card` styling, staggered ScrollReveal animations
- **Layout:** Hero → TrustMarquee → bridge → Product Grid → bridge → CTA → Medical Disclaimer → CTASection
- **Removed:** "Physician use only" badges, "60+ therapies" banner, `Flame`/`Zap`/`Lock` icons, old section-based grid
- **Image:** Replaced `semax-selank.png` with clean CULTR-branded vial photo

### Brand Consistency Updates
- **Tools page** (`app/tools/page.tsx`) — Rewrote hero from flat `bg-brand-primary` to `grad-dark-glow` with badge pill, ScrollReveal, TrustMarquee, bridge, `glass-card` tool cards, CTASection footer
- **Creators page** (`app/creators/page.tsx`) — Added TrustMarquee after hero, bridges between section transitions
- **Community page** (`app/community/page.tsx`) — Added TrustMarquee after hero, bridge before feed section
- **Library Login** (`app/library/LibraryLogin.tsx`) — Updated hero from `grad-dark` to `grad-dark-glow`, added badge pill + ScrollReveal

### Brand Pattern (now consistent across all marketing pages)
Hero (`grad-dark-glow`) → Badge pill → TrustMarquee → Bridges → Content sections → CTASection

### Files
- `lib/config/therapies.ts` — Complete rewrite (new `TherapyProduct` interface)
- `components/site/TherapiesGrid.tsx` — New client component
- `app/therapies/page.tsx` — Restructured layout
- `app/tools/page.tsx` — Brand consistency rewrite
- `app/creators/page.tsx` — Added TrustMarquee + bridges
- `app/community/page.tsx` — Added TrustMarquee + bridge
- `app/library/LibraryLogin.tsx` — Updated hero styling
- `public/images/products/semax-selank.png` — Replaced with clean vial image

---

## [2026-03-15] - Site-Wide Visual Consistency: WavyBackground + TrustMarquee

### Summary
Added WavyBackground canvas animation and TrustMarquee trust logo band to all marketing pages for visual consistency. Removed sticky category filter on science page. Enabled WavyBackground canvas on mobile (previously disabled).

### Changes
- **`app/science/page.tsx`** — Removed `sticky top-16 z-40` from category filter. Added WavyBackground "Rebrand yourself" CTA break between articles and newsletter. Added TrustMarquee after CTA break.
- **`app/faq/page.tsx`** — Wrapped FAQ accordion section in WavyBackground. Added TrustMarquee between FAQ and "Still have questions".
- **`app/how-it-works/page.tsx`** — Wrapped "Four steps to transformation" section in WavyBackground. Added TrustMarquee between "What's Included" and FAQ.
- **`app/pricing/page.tsx`** — Wrapped comparison table section in WavyBackground.
- **`components/ui/WavyBackground.tsx`** — Removed `isMobile` guard entirely; canvas animation now runs on all devices (mobile + desktop). Simplified component, removed mobile static fallback.

### Result
TrustMarquee (dark forest band, scrolling logos) now appears on `/science`, `/faq`, `/how-it-works` in addition to existing `/` and `/pricing`. WavyBackground animated waves visible on all screen sizes across all five pages.

---

## [2026-03-15] - SiPhox Health Integration: Phase 1 Foundation

### Summary
Built the complete server-side foundation for SiPhox Health blood test kit integration. API client library with Zod-validated responses, database migration with 3 tables, data access layer, and biomarker mapping config. Phase 2 context captured for checkout integration.

### New Files
- `lib/siphox/client.ts` — Typed API client with Bearer auth, generic request wrapper, Zod validation on all responses
- `lib/siphox/schemas.ts` — 6 Zod schemas for SiPhox API responses (customers, orders, kits, reports, biomarkers, credits) with `.passthrough()` safety
- `lib/siphox/types.ts` — TypeScript types inferred from Zod schemas via `z.infer`
- `lib/siphox/errors.ts` — `SiphoxApiError` class for structured error handling
- `lib/siphox/db.ts` — 9 database functions for CRUD on siphox_customers, siphox_kit_orders, siphox_reports tables
- `lib/siphox/index.ts` — Barrel export for all SiPhox modules
- `lib/config/siphox-biomarkers.ts` — 53 biomarker mappings across 7 categories (Metabolic, Heart, Hormonal, Inflammation, Thyroid, Nutritional, Extended)
- `migrations/020_siphox_tables.sql` — 3 tables (siphox_customers, siphox_kit_orders, siphox_reports) with 6 indexes and foreign keys

### Modified Files
- `lib/resend.ts` — Added `sendLowCreditAlert(balance, threshold)` for admin notification when SiPhox credits < 5
- `tests/setup.ts` — Added SIPHOX_API_KEY and SIPHOX_API_URL test env vars

### Tests
- 81 new tests (14 client, 23 schema, 14 biomarker, 30 DB)
- 409 total tests, zero regressions

### Planning Artifacts
- `.planning/phases/01-foundation/` — CONTEXT, RESEARCH, VALIDATION, 2 PLANs, 2 SUMMARYs, VERIFICATION (all passed)
- `.planning/phases/02-checkout-integration/02-CONTEXT.md` — Phase 2 decisions captured (address resolution, retry logic, refund handling, cron design)

---

## [2026-03-15] - UI Improvements: Testimonials, Marquee, Trust Badges, TextShimmer

### Summary
Replaced static testimonials grid with an animated scrolling column layout, added a trust logo marquee, a trust badges bar, and a TextShimmer welcome greeting on member and creator dashboards. All components are mobile-optimized.

### New Components
- `components/ui/TextShimmer.tsx` — Animated shimmer text with brand colors (forest base, sage highlight). Motion components defined at module level to prevent remount. Used as personalized welcome on dashboards.
- `components/ui/Marquee.tsx` — Reusable CSS keyframe marquee (left/right/up/down, pause-on-hover, fade edges)
- `components/site/TrustMarquee.tsx` — Trust logo marquee on dark forest background with 7 cream SVG logos
- `components/site/TestimonialsSection.tsx` — 3-column animated scrolling testimonials (framer-motion, per-column speeds 15/19/17s, spring hover lift, initials avatars, sage star ratings)
- `public/images/trust-logos/` — 8 cream SVG logos (CLIA, CAP, LegitScript, Trustpilot, Prenuvo, Path, Spio Health, CULTR Health)

### Homepage Changes (`app/page.tsx`)
- Replaced static testimonials grid with `TestimonialsSection`
- Added trust badges bar (HIPAA Compliant, 256-bit Encryption, Licensed Providers, Licensed Pharmacy) between newsletter and testimonials
- `TrustMarquee` placed above CULTR Creator CTA section

### Pricing Page (`app/pricing/page.tsx`)
- `TrustMarquee` added below pricing packages, above Creator CTA

### Portal Dashboards
- Member dashboard: shows `Welcome back, {firstName}` shimmer once prefill resolves; falls back to plain "Your Dashboard"
- Creator dashboard: `Welcome back, {firstName}` shimmer using `useCreator` context name
- Local dev OTP bypass: any phone + code `123456` skips Twilio + Asher Med, sets valid session, redirects to dashboard

### Mobile Optimizations
- Testimonial cards: `p-5 md:p-8`, `w-[85vw] max-w-xs md:w-full`
- Column height capped: `max-h-[480px] md:max-h-[740px]`
- Trust marquee logo spacing: `mx-6 md:mx-12`
- Trust badges bar: `gap-x-8 gap-y-3 md:gap-x-12` for clean wrapping

### Modified Files
- `app/page.tsx`, `app/pricing/page.tsx`, `app/portal/dashboard/DashboardClient.tsx`
- `app/creators/portal/dashboard/page.tsx`
- `app/api/portal/send-otp/route.ts`, `app/api/portal/verify-otp/route.ts`

---

## [2026-03-15] - MeshGradient Shader Background

### Summary
Replaced the CSS aurora animation background with an animated MeshGradient WebGL shader using CULTR brand colors. All existing page content and layout is unchanged.

### Changes
- Installed `@paper-design/shaders-react` ^0.0.71
- Created `components/ui/MeshBackground.tsx` — `'use client'` component rendering `MeshGradient` with brand colors (`#FDFBF7` cream, `#B7E4C7` sage, `#2A4542` forest, `#D8F3DC` mint, `#3A5956` forest-light), speed 0.2, fixed full-screen z-index -1
- Created `components/ui/MeshBackgroundDynamic.tsx` — `next/dynamic` wrapper with `ssr: false` for SSR compatibility
- Updated `app/layout.tsx` to use `MeshBackgroundDynamic` instead of `.aurora-layer` div

### Modified (3 files)
- `app/layout.tsx`, `components/ui/MeshBackground.tsx`, `components/ui/MeshBackgroundDynamic.tsx`

---

## [2026-03-14] - Intake MedicationSelector: Image Hover Expansion + Descriptions

### Summary
Enhanced the intake form medication selector with inline descriptions for all 10 medications and image preview on hover (desktop) / tap (mobile) for better product visibility.

### Medication Descriptions
- Added concise, patient-facing descriptions to all 10 medications (Semaglutide, Tirzepatide, R3TA, GHK-CU, TESA/IPA, CJC1295/IPA, NAD+, Semax/Selank, BPC157/TB500, Melanotan 2)
- Descriptions rendered inline below dosage text (`text-xs text-forest-muted/80`)

### Image Hover Expansion
- **Desktop:** Hovering over product thumbnail shows 176px enlarged preview via Tailwind named group (`group/image`) with `animate-fade-in`
- **Mobile:** Tapping thumbnail toggles enlarged preview via `expandedImageId` state; tap again to dismiss
- Thumbnails bumped to `w-14 h-14` on mobile for better touch visibility
- `pointer-events-none` on overlays to prevent click interference
- `cursor-zoom-in` on desktop thumbnails

### Modified (1 file)
- `components/intake/MedicationSelector.tsx`

---

## [2026-03-11] - Join Page: Address Fields, Signup Type, Creator Coupon Attribution, UI Polish

### Summary
Enhanced join.cultrhealth.com signup with address collection, membership/products intent selector, unified coupon validation (staff + creator affiliate codes), and creator attribution on club orders. Various UI polish for mobile.

### Join Page Signup Form
- Added shipping address fields (street, city, state, ZIP) — required on signup
- Added "Membership" vs "Products Only" intent selector
- First/Last name now side-by-side on desktop
- Modal scrollable on small screens (rounded-t on mobile, full rounded on desktop)
- Sticky logo header while scrolling form

### Creator Coupon Attribution on Club Orders
- `validateCouponUnified()` in `lib/config/coupons.ts` — checks staff coupons first, then creator affiliate codes in DB
- Club orders now track `attributed_creator_id` and `attribution_method` in DB
- Creator commission processing triggered on attributed orders via `processOrderAttribution()`
- Admin email shows "Referred by {creator}" when a creator code is used
- Cart UI shows "Referred by {creator}" under applied coupon badge
- `validate-coupon` API returns creator info for display

### Database Migrations
- **017:** `address_street`, `address_city`, `address_state`, `address_zip` on `club_members`
- **018:** `attributed_creator_id`, `attribution_method` on `club_orders`; `signup_type` on `club_members`

### UI Polish
- Hero banner: 16:9 aspect ratio with overlay text and tagline
- Non-featured card images: 4:3 aspect on mobile, square on desktop
- Hover tooltips hidden on mobile (touch devices)

### Modified (6 files)
- `app/join/JoinLandingClient.tsx`, `app/api/club/signup/route.ts`, `app/api/club/login/route.ts`
- `app/api/club/orders/route.ts`, `app/api/club/validate-coupon/route.ts`, `lib/config/coupons.ts`

### Added (2 files)
- `migrations/017_club_member_address.sql`, `migrations/018_club_orders_attribution.sql`

---

## [2026-03-11] - Product Images Update & Intake Form Medication Mapping Fix

### Summary
Replaced 8 product vial images with new branded CULTR photos across join page, intake form, and shop. Fixed critical intake form bug where 8 of 10 medications silently failed Asher Med submission due to mismatched mapping IDs.

### Product Images
- Replaced 8 vial photos in `public/images/products/`: BPC157/TB500, GHK-CU, Melanotan 2, NAD+, Semaglutide, TESA/IPA, Tirzepatide, CJC1295/IPA
- Added `imageUrl` to 10 shop products in `lib/config/product-catalog.ts`
- Added product vial thumbnails to intake form MedicationSelector

### Intake Form Medication Mapping (Critical Bug Fix)
- **Root cause:** MedicationSelector used IDs like `semaglutide` but `PRODUCT_TO_ASHER_MED_MAP` only had catalog IDs like `glp1-semaglutide` — only `ghk-cu` and `nad-plus` actually mapped
- Added all 10 MedicationSelector IDs to `lib/config/product-to-asher-mapping.ts`
- Added 4 new MEDICATION_OPTIONS (R3TA, TESA/IPA, CJC1295/IPA, Melanotan 2) using Asher Med `'Other'` type in `lib/config/asher-med.ts`
- Fixed `ReviewSummary.tsx` to use `selectedMedications` (plural array) instead of `selectedMedication` (singular)
- Fixed GLP-1 detection in `IntakeFormClient.tsx` to include R3TA

### Modified (7 files)
- `lib/config/product-to-asher-mapping.ts`, `lib/config/asher-med.ts`
- `lib/config/product-catalog.ts`
- `components/intake/MedicationSelector.tsx`, `components/intake/ReviewSummary.tsx`
- `app/intake/IntakeFormClient.tsx`
- `app/join/JoinLandingClient.tsx`

---

## [2026-03-11] - Creator Portal Production-Ready: Remove Fake Data, Optimize UX, Fix Coupon Codes

### Summary
Complete creator portal production readiness pass. Removed all mock/fake data from 6 API routes, optimized dashboard UX with grouped sections, fixed coupon code generation for staging auto-provisioning, and cleared placeholder campaigns.

### Fake Data Removed (6 API routes)
- `app/api/creators/dashboard/route.ts` — removed `isStagingCreator` mock with fake metrics (1247 clicks, 38 orders, etc.)
- `app/api/creators/earnings/overview/route.ts` — removed mock earnings ($1482 lifetime)
- `app/api/creators/earnings/orders/route.ts` — removed 5 fake order rows
- `app/api/creators/earnings/ledger/route.ts` — removed 5 fake commission entries
- `app/api/creators/network/route.ts` — removed 12 fake recruits + 3 fake portfolio entries
- `app/api/creators/profile/route.ts` — removed staging_creator mock profile
- All routes now query real DB only (203 lines of mock data deleted)

### Creator Portal UX Optimization
- Dashboard organized into 3 labeled sections: Performance, Commissions, Growth
- Dynamic Getting Started checklist reflects actual creator state (links, codes, clicks, orders)
- Removed fabricated leaderboard (fake competitor data) — replaced with Creator Tip card
- Removed synthetic NotificationBell from header
- Full-width analytics chart (no longer split with leaderboard)
- Sidebar reorganized: PROMOTE, MONEY, GROW, ACCOUNT groups

### Share Page & Campaigns
- Fixed `(code as any).code_type` type cast — uses typed `code.code_type` directly
- Inline per-code descriptions (membership vs product purpose)
- Campaign date-awareness: auto-expires past endDate campaigns
- Cleared 4 hardcoded placeholder campaigns (empty state shows until real campaigns added)

### Coupon Code Fix
- `app/api/creators/verify-login/route.ts` — staging auto-provisioning now creates dual codes (membership + product) with collision handling, matching the real approval flow (was only creating 1 generic code)

### Modified (10 files)
- `app/api/creators/dashboard/route.ts`, `earnings/overview/route.ts`, `earnings/orders/route.ts`, `earnings/ledger/route.ts`, `network/route.ts`, `profile/route.ts`
- `app/creators/portal/dashboard/page.tsx`, `share/page.tsx`, `campaigns/page.tsx`
- `components/creators/CreatorHeader.tsx`, `CreatorSidebar.tsx`
- `app/api/creators/verify-login/route.ts`

### Tests
- 253 total passing, 0 type errors, 0 regressions

---

## [2026-03-11] - Wire Goals & Motivation Data to Asher Med + Admin Viewer

### Summary
Goals & Motivation form data (8 questions) was previously collected but silently dropped on submission. Now wired to all 4 destinations: Asher Med wellnessQuestionnaire, Asher Med partnerNote, database JSONB, and admin intake viewer.

### Changes
- `app/api/intake/submit/route.ts` — merged 9 goals fields into `wellnessQuestionnaire` with `goals_` prefix (arrays joined to comma-separated strings); added `goalsMotivation` to `pending_intakes.intake_data` JSONB merge
- `lib/intake-utils.ts` — added "GOALS & MOTIVATION" section at top of `buildPartnerNote()` (before treatment preferences) with all 8 fields formatted for provider readability
- `app/admin/intakes/IntakeViewerClient.tsx` — added expandable "Goals & Motivation" detail section between Treatment Preferences and Partner Note, displaying all 9 fields

### Asher Med API Field Mapping
- Channel A (wellnessQuestionnaire): `goals_primary_result`, `goals_why_seeking_help_now`, `goals_top_symptoms`, `goals_priority_problem_to_solve`, `goals_urgency_1_to_10`, `goals_what_have_you_tried`, `goals_how_did_you_hear_about_us`, `goals_what_made_you_trust_us`, `goals_barriers_to_follow_through`
- Channel B (partnerNote): formatted text section at top of note

### Tests
- 253 total passing, 0 type errors, 0 regressions

---

## [2026-03-11] - Fix Intake Build Error, Upload Staging Bypass, Goals & Motivation Step

### Summary
Fixed Vercel build failure caused by non-route exports in `app/api/intake/submit/route.ts`. Added staging bypass for file uploads (ID + consent signatures) when Asher Med API key is not configured. Added new Goals & Motivation intake step with 8 client engagement questions.

### Build Fix
- Moved `formatMedicationsList` and `buildPartnerNote` from route file to `lib/intake-utils.ts` — Next.js disallows non-route exports from route files
- Updated test imports to match new location

### Staging Upload Bypass
- `app/api/intake/upload/route.ts` — returns mock presigned URLs on staging when `ASHER_MED_API_KEY` is absent (same pattern as OTP staging bypass)
- `components/intake/ConsentForms.tsx` — added `isMockUpload` check to skip S3 PUT for mock URLs (IDUploader already had this)
- Only triggers when API key is missing AND environment is dev/staging — production fails loudly if misconfigured

### New: Goals & Motivation Form
- `components/intake/GoalsMotivationForm.tsx` — 8 questions: primary goal, why now, top symptoms (max 3), priority problem, urgency (1-10 scale), previous attempts, discovery source, barriers
- Added as required step after Physical Measurements, before Wellness Questionnaire
- Removed duplicate questions from WellnessQuestionnaire (weight loss history, weight management goals)
- ReviewSummary displays all 8 goals fields

### Modified (8 files)
- `app/api/intake/submit/route.ts` — imports from lib/intake-utils
- `app/api/intake/upload/route.ts` — staging mock bypass
- `app/intake/IntakeFormClient.tsx` — GoalsMotivationForm routing
- `components/intake/ConsentForms.tsx` — mock upload handling
- `components/intake/WellnessQuestionnaire.tsx` — removed 2 duplicate questions
- `components/intake/ReviewSummary.tsx` — goals section
- `lib/config/asher-med.ts` — goals step config
- `lib/contexts/intake-form-context.tsx` — goals validation + step order

### New (2 files)
- `lib/intake-utils.ts` — extracted formatMedicationsList + buildPartnerNote
- `components/intake/GoalsMotivationForm.tsx` — 8-question engagement form

### Tests
- 253 total passing, 0 regressions

---

## [2026-03-11] - Sync Vercel Env Vars, Recover Lost Data, Remove Dead Code

### Summary
Synced 29 missing environment variables (including POSTGRES_URL) to the active `cultrhealth-com` Vercel project, fixing silent database write failures since ~Mar 4. Recovered 2 real customers and 3 orders from Resend email history. Removed 143 dead files (Healthie remnants + 140 duplicate route files). Added go-live env var checklist.

### Root Cause
The active Vercel project (`cultrhealth-com`) only had 7 of 36 required env vars. Code guards DB writes with `if (process.env.POSTGRES_URL)` which silently skipped all inserts.

### Data Recovered
- **Allison Cooper** (marycooper2004@gmail.com) — 2 orders: R3TA+GHK-CU ($388), R3TA ($272)
- **Madison** (maddiegacree@gmail.com) — 1 signup + 1 order: R3TA ($272)
- All orders status `pending_approval` with CULTRFAM 20% coupon

### Dead Code Removed (143 files)
- `lib/config/healthie.ts` — Orphaned Healthie platform config
- `tests/lib/healthie-api.test.ts` — Tests for already-deleted module
- `app/api/healthie/sso-token/route.ts` — Dead SSO endpoint
- 140 duplicate `route N.ts` files across `app/api/` (macOS copy artifacts)

### New (1 file)
- `docs/env-vars-go-live.md` — Exhaustive env var checklist (10 critical, 7 security, 12 optional, 17 BNPL)

### Verified
- Live staging test: club signup returns `memberId` (DB write working)
- Live staging test: club order returns `orderId` + both emails sent
- 239 tests passing, 0 regressions

### Known Issue
- `MAILCHIMP_API_KEY` on Vercel is invalid (401) — needs new key from Mailchimp dashboard

---

## [2026-03-11] - Fix Intake Data Sync to Asher Med + Admin Intake Viewer

### Summary
Fixed intake form data not fully reaching Asher Med providers. Partner notes with treatment preferences and medications are now sent via PATCH after order creation. Added admin intake viewer at `/admin/intakes`.

### Bugs Fixed
- `buildPartnerNote()` was missing `bestTimeToContact`, `pharmacyPreference`, and `customSolution` fields
- Current medications formatting produced `[object Object]` instead of `"Name - Dosage - Frequency"`
- Partner note was only stored locally — never sent to Asher Med

### New (4 files)
- `app/api/admin/intakes/route.ts` — Admin API: pending_intakes LEFT JOIN LATERAL asher_orders (case-insensitive, deduped)
- `app/admin/intakes/page.tsx` — Admin server component with auth guard
- `app/admin/intakes/IntakeViewerClient.tsx` — Expandable row UI: patient info, medications, treatment prefs, partner note, Asher status
- `tests/api/intake-submit.test.ts` — 14 tests for buildPartnerNote and formatMedicationsList

### Modified (2 files)
- `app/api/intake/submit/route.ts` — Enriched partner note, fixed medications format, PATCH to Asher Med, JSONB enrichment
- `app/admin/AdminDashboardClient.tsx` — Added Intake Submissions + Club Orders to Quick Links

### Tests
- 253 total passing (14 new, 0 regressions)

---

## [2026-03-11] - Sales Tax Implementation (7.5% — Alachua County, FL)

### Summary
Added 7.5% Florida sales tax (6% state + 1.5% county surtax) across all 6 payment flows, club order emails, and the join page cart UI.

### New (2 files)
- `lib/config/tax.ts` — Centralized tax utility: FL_TAX_RATE (0.075), TAX_RATE_LABEL, calculateTaxCents, calculateTaxDollars
- `migrations/015_club_orders_tax.sql` — Adds `tax_rate` and `tax_amount_usd` columns to `club_orders` table

### Modified (8 files)
- `app/api/checkout/product/route.ts` — Stripe: `automatic_tax: { enabled: true }` on checkout sessions
- `app/api/club/orders/route.ts` — Server-side tax calc, DB storage, tax line in customer + admin emails
- `app/api/admin/club-orders/[orderId]/approve/route.ts` — Reads tax from DB, tax line in approval emails (customer + admin)
- `lib/payments/klarna-api.ts` — Per-line tax in buildOrderLines, tax-inclusive order_amount/order_tax_amount
- `app/api/checkout/klarna/order/route.ts` — Tax-inclusive totalAmount for DB storage
- `lib/payments/affirm-api.ts` — Sets tax_amount, adds tax to total in checkout config
- `lib/payments/authorize-net-api.ts` — Tax object on transactions, tax-inclusive amounts on transactions + subscriptions
- `app/join/JoinLandingClient.tsx` — Cart UI shows Subtotal → Sales Tax (7.5%) → Total

### Manual Dashboard Steps Required
- **Stripe:** Enable Stripe Tax → Add FL tax registration → Enable on each Payment Link
- **QuickBooks:** Enable automatic sales tax → Set FL nexus

### Migration
- `015_club_orders_tax.sql` run on staging Neon DB

---

## [2026-03-11] - Phone OTP Portal Authentication (Phase 1)

### Summary
New member authentication system using phone number + SMS OTP via Twilio Verify. Members authenticate at `/portal/login` with a dual-token JWT session (15-min access + 7-day refresh). Three verification outcomes: patient found (dashboard), known phone without patient (intake redirect), or never-seen phone (support message). Fully coexists with existing magic link auth.

### New (12 files)
- `lib/portal-auth.ts` — Dual-token JWT session management (8 exported functions, separate cookie namespace)
- `lib/portal-db.ts` — Portal session DB helpers (upsert, get by phone, update patient ID)
- `migrations/014_portal_sessions.sql` — `portal_sessions` table with phone_e164 unique index
- `app/api/portal/send-otp/route.ts` — Phone validation, dual rate limiting (IP + phone), Twilio Verify SMS
- `app/api/portal/verify-otp/route.ts` — OTP verification, 3-way patient resolution, session creation
- `app/api/portal/refresh/route.ts` — Silent access token refresh from refresh cookie
- `app/api/portal/logout/route.ts` — Clears both portal cookies (idempotent)
- `app/portal/login/page.tsx` — Server component entry point
- `app/portal/login/PortalLoginClient.tsx` — Phone input (US mask), 6-digit OTP boxes, slide transitions, support message
- `app/portal/layout.tsx` — Auth guard with activity-based session refresh
- `app/portal/dashboard/page.tsx` — Placeholder portal dashboard
- `tests/` — 50 new tests across 7 files (portal-auth, portal-db, send-otp, verify-otp, logout, refresh, PortalLogin component)

### Modified (4 files)
- `components/site/Header.tsx` — "Members" nav link now points to `/portal/login`
- `components/site/LayoutShellClient.tsx` — Hides site chrome on `/portal/*` routes
- `lib/config/links.ts` — Added `portalLogin` and `portalDashboard` entries
- `app/api/intake/submit/route.ts` — Auto-links portal session with new Asher Med patient ID after intake

### Packages Added
- `twilio` — Twilio SDK for Verify API
- `input-otp` — 6-digit OTP input component with autocomplete='one-time-code'

### Environment Variables Required (Production)
- `TWILIO_ACCOUNT_SID` — Twilio Console
- `TWILIO_AUTH_TOKEN` — Twilio Console
- `TWILIO_VERIFY_SERVICE_SID` — Create Verify Service in Twilio Console

### Staging Notes
- send-otp skips Twilio call entirely on staging
- verify-otp accepts code `123456` on staging
- Migration 014 run on staging Neon DB

---

## [2026-03-11] - Intake Form Updates

### Summary
Simplified intake form gender options and replaced dynamic medication selector with curated product list.

### Modified (2 files)
- `components/intake/PersonalInfoForm.tsx` — Removed "Other/Prefer not to say" gender option (Male/Female only)
- `components/intake/MedicationSelector.tsx` — Replaced dynamic product catalog with flat list of 10 specific medications: Semaglutide, Tirzepatide, R3TA, GHK-CU, TESA/IPA, CJC1295/IPA, NAD+, Semax/Selank, BPC157/TB500, Melanotan 2

---

## [2026-03-10] - Creator Commission System Overhaul

### Summary
Complete restructuring of the creator affiliate commission model from flat 10% + old override tiers to a three-stream system: direct membership (10%), direct product (10%), and recruitment override (5-20% tiered). Includes dual coupon codes, portfolio tracking, 25% total cap during 6-month bonus window, and attribution break on subscription cancellation.

### New (3 files)
- `migrations/013_commission_overhaul.sql` — Adds `code_type` to affiliate_codes, `active_member_count`/`commission_rate`/`creator_start_date` to creators, `is_subscription`/`subscription_payment_number` to order_attributions, new `creator_customer_portfolio` table
- Dual coupon code system: `{LASTNAME}` (membership) + `{LASTNAME}10` (product) auto-generated on approval
- Portfolio-based subscription lifecycle tracking with attribution break rule

### Rewritten (6 files)
- **`lib/config/affiliate.ts`** — New 4-tier config (Starter 5%, Bronze 10%, Silver 15%, Gold 20%), 25% total cap, 6-month bonus window, `isInBonusWindow()`/`getBonusWindowDaysLeft()`/`generateCreatorCodes()` helpers
- **`lib/creators/commission.ts`** — Three-stream engine with dynamic cap (25% during bonus, 10% after), re-signup attribution blocking, portfolio-based active member recalculation
- **`app/api/admin/creators/[id]/approve/route.ts`** — Auto-generates dual coupon codes with collision handling
- **`app/api/cron/update-tiers/route.ts`** — Updated for portfolio-based active member counting
- **`app/creators/portal/dashboard/page.tsx`** — Bonus window banner, commission breakdown, active member metrics
- **`app/creators/portal/network/page.tsx`** — Two-tab layout (Recruited Creators + Customer Portfolio), updated tier milestones

### Modified (10 files)
- `lib/creators/db.ts` — 8 new portfolio CRUD functions, commission breakdown query, `creator_start_date` set on approval
- `lib/creators/attribution.ts` — Added `codeType` to `ResolvedAttribution`
- `app/api/webhook/stripe/route.ts` — Portfolio entry on checkout, recurring payment tracking, attribution break on cancel
- `app/api/checkout/product/route.ts` — Passes attribution cookie as `client_reference_id`
- `app/api/creators/dashboard/route.ts` — Returns bonus window, commission breakdown, active members
- `app/api/creators/network/route.ts` — Returns portfolio data alongside recruits
- `app/creators/portal/earnings/page.tsx` — Commission model explainer, ledger type filters
- `app/creators/portal/share/page.tsx` — Dual code labels (Membership Code / Product Code)
- `components/creators/Milestones.tsx` — Recruitment-based milestones (First Recruit, Bronze/Silver/Gold Network)
- `components/creators/CreatorHeader.tsx` — Active Members metric, override rate in tier badge

### Bugs Fixed During Audit
- **Static total cap** — Commission cap was always 25%; now dynamic (25% during bonus, 10% after)
- **Missing creator_start_date** — New creators had NULL start date; now set on first approval
- **Incomplete collision check** — Dual code creation now checks both codes before insert

### Database Migration
- Migration 013 run on staging Neon database (requires migration 009 as prerequisite)

---

## [2026-03-10] - Asher Med Full Integration & Healthie Removal

### Summary
Completed full migration from Healthie EHR to Asher Med EMR. Removed all Healthie code, rewrote critical API routes, updated email templates, and created DB migration to drop legacy columns.

### Deleted (9 files)
- `lib/healthie-api.ts`, `lib/healthie-sso.ts`, `lib/config/healthie.ts`
- `app/api/healthie/sso-token/route.ts`, `app/api/webhook/healthie/route.ts`
- `tests/lib/healthie-api.test.ts`
- `docs/HEALTHIE-SSO-IMPLEMENTATION.md`, `docs/HEALTHIE-SSO-SETUP.md`, `docs/HEALTHIE-SSO-QUICKSTART.md`

### Rewritten (3 files)
- **`app/api/webhook/stripe/route.ts`** — Removed Healthie patient creation; looks up asher_patient_id from DB; welcome email uses dashboard URL; subscription deletion calls Asher Med updatePatient
- **`app/api/protocol/generate/route.ts`** — Removed Healthie care plan/document creation; stores protocols locally in DB with protocol_notes column
- **`app/api/checkout/product/route.ts`** — Replaced Healthie Stripe Connect flow with direct Stripe Checkout Sessions

### Modified (~15 files)
- `lib/db.ts` — healthie_patient_id → asher_patient_id (number), removed 'healthie' from payment_provider union
- `lib/resend.ts` — healthiePortalUrl → dashboardUrl, updated button labels and portal references
- `lib/data-normalization.ts` — Renamed HealthieLabResultInput → LabResultInput, transformHealthieResults → transformLabResults, processHealthieLabResults → processLabResults
- `lib/invoice/invoice-template.tsx` — Renamed healthie provider label to legacy
- `app/admin/AdminDashboardClient.tsx` — Healthie link → Asher Med Portal link
- `app/library/cart/CartClient.tsx` — Updated Stripe key env var, redirects to Stripe Checkout
- `app/join/[tier]/page.tsx` — Updated Stripe key env var and comments
- `app/provider/protocol-builder/ProtocolBuilderClient.tsx` — patientHealthieId → patientId, updated labels
- `app/api/track/daily/route.ts` — healthie_patient_id → asher_patient_id
- `app/legal/privacy/page.tsx` — Healthie → Asher Med in HIPAA section
- `components/dashboard/BiomarkerTrends.tsx` — Removed Healthie mention
- `tests/api/protocol-generate.test.ts` — Rewrote for Asher Med API mocks
- `tests/setup.ts` — HEALTHIE env vars → ASHER_MED env vars
- `.env.example`, `env.example` — Removed all HEALTHIE variables
- `CLAUDE.md` — Removed all Healthie references from documentation

### Migration Created
- `migrations/012_drop_healthie_columns.sql` — Adds asher_patient_id columns, copies data, drops healthie_patient_id columns (run post-deploy)

### Post-Migration Audit (Mar 10)
Full codebase audit verified migration completeness:
- **14 interfaces** — all use `asher_patient_id: number` (not string)
- **19 SQL functions** — all reference `asher_patient_id` column
- **13 email functions** — all use `dashboardUrl` (not `healthiePortalUrl`)
- **3 API routes** — fully rewritten, no Healthie imports
- **9 deleted files** — confirmed removed from disk
- **0 Healthie references** in active TS/TSX code (only "healthier" in unused legacy About.tsx)
- `docs/README.md` updated to remove broken Healthie SSO doc links
- Minor: `lib/db.ts:207` has dead code (String() in unused dynamic query path) — no functional impact

### Verification
- TypeScript: passes clean
- Build: passes clean
- Tests: 7 files, 171 tests, all passing
- Grep healthie in *.ts/*.tsx: 0 results

---

## [2026-03-05] - Mailchimp Configuration Audit & Deployment Readiness

### Summary
Completed comprehensive environment variable audit for the CULTR Club email flow. Verified all required Mailchimp environment variables, documented fallbacks, and identified critical Vercel configuration gaps. All code is deployed and tested on staging; ready to configure Mailchimp environment variables and execute end-to-end testing.

### Documentation
- **Environment Audit Complete** — Identified 3 critical Mailchimp vars missing from Vercel, 1 important var with fallback, and verified existing Resend/database configurations
- **Testing Plan Created** — 5-touchpoint email flow verification checklist including signup welcome, order confirmation, admin approval request, auto-logout gate, and customer approval confirmation
- **Deployment Plan** — Add MAILCHIMP_API_KEY, MAILCHIMP_AUDIENCE_ID, MAILCHIMP_SERVER_PREFIX to Vercel staging environment
- **Memory Updated** — Full audit results documented in cross-session memory for future reference

### Technical Details
- **Critical vars** — MAILCHIMP_API_KEY, MAILCHIMP_AUDIENCE_ID, MAILCHIMP_SERVER_PREFIX (silent degradation if missing)
- **Verify in Vercel** — JWT_SECRET (returns 500 if missing; must exist)
- **Optional vars** — NEXT_PUBLIC_SITE_URL, ADMIN_APPROVAL_EMAIL (have safe fallbacks)
- **Current status** — ✅ Code deployed to staging, ✅ Email infrastructure hardened with independent error handling, ✅ Admin approval links working with one-click functionality
- **Next step** — Add Mailchimp vars to Vercel staging and execute comprehensive email flow testing

---

## [2026-03-05] - Join Page Mobile Responsive Design Fixes

### Summary
Fixed three critical mobile layout issues on the join landing page (`join.cultrhealth.com`): hero image now shows full CULTR watermark without cropping, hero text moved from image overlay to dedicated section, and featured R3TA product card image now displays centered and enlarged on mobile for parity with other product cards.

### Changed

#### Hero Banner Layout
- **Hero image container** — Changed from fixed viewport height (`h-[45vh]`) to aspect ratio container (`aspect-[4/3]`) on mobile; desktop reverts to fixed height (`md:h-[50vh]`)
- **Result** — CULTR watermark text no longer crops on right edge of mobile screens (375px viewports)

#### Hero Text Section
- **Text overlay removal** — Removed absolutely-positioned text overlay from inside hero image
- **Dedicated content section** — Created separate "Hero Copy Section" below banner with:
  - Cream background (`bg-brand-cream`) with bottom border
  - Dark text styling (`text-brand-primary` and `text-brand-secondary`)
  - Responsive padding (`px-6 py-8 md:px-8 md:py-12`)
  - Preserved scroll reveal animations for visual consistency
- **Result** — Clean typographic hierarchy; text no longer competes visually with hero image

#### Featured Card (R3TA) Image Display
- **Image container responsiveness** — Changed from fixed small dimensions (`w-32 h-32 md:w-40 md:h-40`) to:
  - Mobile: `w-full flex items-center justify-center py-10` (centered, full-width)
  - Desktop: `md:w-40 md:h-40 md:flex-shrink-0` (reverts to side-by-side layout)
- **Image render size** — Increased from 160px to 220px on mobile
- **Image optimization** — Added `unoptimized` flag for compatibility
- **Result** — R3TA product image displays at visual parity with non-featured cards on mobile

### Technical Details
- **File modified** — `app/join/JoinLandingClient.tsx`
  - Lines 127-156: Hero image + hero copy section
  - Lines 354-369: Featured card image container
- **Build status** — ✅ Compiles successfully with `npm run build`
- **Deployment** — Staged on branch `staging` and ready at `join.cultrhealth.com/join`
- **Commit** — b0c2173 "feat: increase product image sizes on mobile for better visibility"

---

## [2026-02-26] - CULTR Club Landing Page, QuickBooks, Care Team & Brand Finalization

### Summary
Launched `join.cultrhealth.com` as a standalone CULTR Club landing page with full signup, order, and admin approval flow. Added QuickBooks Online integration for invoice management. Finalized care team to Dr. Ali Saberi MD (Medical Director) and Belinda Ruiz FNP. Completed CULTR logo brand standardization by removing all letter-spacing — relying on natural Playfair Display kerning. Hardened staging authentication with environment-aware team email bypass.

### Added

#### CULTR Club Landing Page (`join.cultrhealth.com`)
- **`app/join-club/JoinLandingClient.tsx`** — Full landing page UI with hero, value props, product showcase, pricing, and signup modal with bot protection (Cloudflare Turnstile)
- **`app/join-club/page.tsx`** — Server component wrapper for the join-club route
- **`app/join-club/layout.tsx`** — Minimal layout suppressing site chrome (header/footer) for focused conversion experience
- **`components/site/LayoutShellClient.tsx`** — Added `/join-club` to chrome suppression prefixes
- **Signup persistence** — `localStorage` primary storage with `cookie` fallback; prevents re-showing signup modal to returning members
- **Cookie-based member detection** — `cultr_club_member` cookie set server-side after successful signup

#### Club Orders System
- **`app/api/club/signup/route.ts`** — Club signup API; inserts member record, sets session cookie, sends Resend confirmation email
- **`app/api/club/orders/route.ts`** — Order submission with HMAC-signed approval tokens (30-min expiry) and Resend admin notification
- **`app/api/admin/club-orders/route.ts`** — Admin endpoint to list all pending/approved/rejected club orders
- **`app/api/admin/club-orders/[orderId]/approve/route.ts`** — HMAC-protected one-click approval link handler
- **`app/admin/club-orders/page.tsx`** — Admin club orders page with authentication gate
- **`app/admin/club-orders/ClubOrdersClient.tsx`** — Expandable order list with inline approval/rejection actions
- **`migrations/010_club_orders.sql`** — `club_members` and `club_orders` tables

#### QuickBooks Integration
- **`lib/quickbooks.ts`** — Full QuickBooks Online OAuth2 integration; token refresh with error handling, customer/invoice creation, payment recording
- **`migrations/011_quickbooks_tokens.sql`** — `quickbooks_tokens` table for OAuth token persistence

#### Care Team
- **`public/images/provider-ali-saberi.jpg`** — Dr. Ali Saberi MD photo asset
- **`public/images/provider-belinda-ruiz.jpg`** — Belinda Ruiz FNP photo asset

#### Navigation & Pages
- **Therapies page** (`app/therapies/page.tsx`) — Core Therapies landing page
- **Core Therapies navbar link** — Added to site header navigation
- **Active page highlighting** — Current route highlighted in navbar links

### Changed

#### Care Team / Social Proof
- **`lib/config/social-proof.ts`** — Removed all placeholder providers; care team now contains only Dr. Ali Saberi MD (Medical Director) and Belinda Ruiz FNP
- **Provider photo sizing** — Increased from `w-20` to `w-36` for better visual presence on homepage
- **DEA Licensed badge** — Removed from care team display
- **Trust badges** — Combined "Licensed 503A Pharmacy" into "Licensed Providers" badge for simpler presentation

#### Brand Typography — CULTR Logo Letter-Spacing
- **Complete removal of letter-spacing** — All `tracking-[0.08em]` Tailwind classes removed from 35+ JSX component files
- **Email templates** — `letter-spacing: 0.08em` inline CSS changed to `letter-spacing: 0` across all Resend transactional emails, API route handlers, and confirmation flows
- **PDF documents** — `letterSpacing: 2` removed from invoice template and LMN template (React PDF)
- **Result** — CULTR brand name now renders with natural Playfair Display kerning on all surfaces (web, email, PDF)

#### Staging Authentication
- **Environment-aware bypass** — Staging site allows any email to authenticate without sending actual emails (returns magic link directly in response)
- **Hardcoded team whitelist** — 5 team emails (`stewart@cultrhealth.com`, `erik@threepointshospitality.com`, etc.) guaranteed portal access by auto-creating DB records if missing
- **Auto-approval** — `erik@` and `stewart@` are auto-approved on creator signup without admin review
- **Staging resilience** — Creator login gracefully handles missing DB records for bypass emails

#### Styling & UX
- **Homepage hero** — Repositioned copy over center figure with left-justified text layout
- **Homepage sections** — Merged Creator CTA, Newsletter, and Testimonials into continuous dark zone for visual cohesion
- **Mobile transparency** — Light sections use transparent backgrounds on mobile for continuous scroll flow
- **Pricing update** — Removed physician consult line item; blood work changed to "At-Home Lab Test ($135)"

### Fixed
- **CULTR logo font on join-club page** — Was loading raw Playfair Display instead of Next.js-optimized CSS variable; fixed to use `var(--font-display)`
- **Session cookie persistence** — Fixed cookie not being set correctly on login redirects
- **Creator login for staging bypass users** — Auto-creates minimal DB record when bypass email has no DB row
- **Leaderboard missing props** — Fixed `Leaderboard` component receiving wrong prop shape from dashboard route

### Files Modified
- `app/page.tsx` — Hero layout, care team section, trust badges, dark zone merge
- `app/join-club/JoinLandingClient.tsx` — Signup persistence, font fix, full page build
- `app/api/auth/magic-link/route.ts` — Staging bypass + team email whitelist
- `app/api/creators/magic-link/route.ts` — Staging bypass for creator login
- `lib/config/social-proof.ts` — Providers array trimmed to 2; DEA badge removed
- `lib/quickbooks.ts` — Improved token refresh error handling
- `lib/resend.ts` — Removed letter-spacing from all email templates
- `lib/invoice/invoice-template.tsx` — Removed letterSpacing from PDF logo style
- `lib/lmn/lmn-template.tsx` — Removed letterSpacing from PDF logo style
- `components/creators/Leaderboard.tsx` — Fixed prop types
- `components/site/LayoutShellClient.tsx` — Added join-club to chrome suppression list
- `components/site/Header.tsx` — Active page highlighting, Core Therapies link, removed letter-spacing

---

## [2026-02-12] - Gold-Standard Performance Optimization

### Summary
Comprehensive performance overhaul targeting load times, bundle size, caching, and architecture. Images reduced from ~30MB to ~1.8MB total deploy weight. Added edge caching for marketing pages. Refactored LayoutShell to reduce client-side hydration. Extracted blog CSS from global bundle. Removed dead dependency.

### Changed

#### Phase 1: Image Optimization
- **Hero banner desktop** — converted from PNG (7.4MB) to WebP (327KB), quality lowered from 90 to 75 (gradient overlay makes difference invisible)
- **Hero banner mobile** — converted from PNG (112KB) to WebP (48KB)
- **Lifestyle images** — converted all 3 lifestyle images from PNG/JPG to WebP:
  - `lifestyle-girl-running`: 2.1MB → 152KB
  - `lifestyle-woman-running-new`: 1.1MB → 255KB
  - `lifestyle-man-smiling`: 565KB → 33KB
- **OG image** — resized from 4.7MB to 774KB (1200x630)
- **Logo** — optimized `cultr-logo-black.png` from 1.9MB to 214KB (resized to 800px width)
- **Archived 9 unused images** (~14MB) to `/archive/images/` — grep confirmed zero source code references: `hero-girls-warming-up.png`, `hero-lifestyle-group.png`, `hero-woman-running.jpg`, `hero-man-sunset.jpg`, `lifestyle-woman-running.jpg`, `hero-women-lifestyle.png`, `hero-man-athletic.png`, `lifestyle-achievement.png`, `lifestyle-man-workout.jpg`

#### Phase 2: Edge Caching & ISR
- **Tiered cache headers** — replaced blanket `s-maxage=0` with intelligent caching:
  - Marketing pages (`/pricing`, `/how-it-works`, `/faq`, `/community`, `/science`, `/legal/*`, `/creators`, `/quiz`): 1hr edge cache + 24hr stale-while-revalidate
  - Homepage (`/`): 5min edge cache + 1hr stale-while-revalidate
  - Authenticated pages (`/dashboard`, `/library`, `/intake`, `/renewal`, `/admin`, `/creators/portal`): `private, no-cache, no-store` (HIPAA compliance)
- **ISR (Incremental Static Regeneration)** — added `export const revalidate = 3600` to 8 pages: homepage, pricing, how-it-works, faq, community, science index, science/[slug], creators

#### Phase 3: LayoutShell Architecture Refactor
- **Server/client split** — `LayoutShell.tsx` converted from `'use client'` to server component
- **New `LayoutShellClient.tsx`** — thin client wrapper (~28 lines) handles only pathname-based chrome visibility
- **Footer now renders as server component** — zero client JS for footer on every page
- **Reduced hydration scope** — previously all children were forced into client boundary

#### Phase 4: Dependency & Bundle Cleanup
- **Removed `class-variance-authority`** — confirmed unused (zero imports in codebase)
- **Expanded `optimizePackageImports`** — added `recharts` and `zod` alongside existing `lucide-react`
- **Wired up `@next/bundle-analyzer`** — `npm run analyze` now produces visual bundle breakdown

#### Phase 5: CSS Optimization
- **Extracted blog CSS** — moved ~250 lines of `.blog-content` styles from `globals.css` to `app/science/blog-content.css`, imported only in `app/science/[slug]/page.tsx`
- **Added `prefers-reduced-motion`** — `.glow-card` pseudo-element effects hidden for users with reduced motion preference

#### Phase 6: Additional Wins
- **Removed ScrollReveal from hero** — above-fold content no longer wrapped in unnecessary IntersectionObserver
- **Added `loading.tsx` skeletons** — instant loading UI for `/library` and `/creators/portal` routes
- **Added DNS prefetch** — `js.stripe.com` and `cdn.curator.io` hints in root layout

### Added
- `components/site/LayoutShellClient.tsx` — thin client wrapper for pathname-based layout chrome
- `app/science/blog-content.css` — extracted blog content styles (route-scoped)
- `app/library/loading.tsx` — loading skeleton for library routes
- `app/creators/portal/loading.tsx` — loading skeleton for creator portal routes
- `public/images/hero-banner-desktop.webp` — compressed hero image (327KB)
- `public/images/hero-banner-mobile.webp` — compressed mobile hero (48KB)
- `public/images/lifestyle-girl-running.webp` — compressed lifestyle image (152KB)
- `public/images/lifestyle-man-smiling.webp` — compressed lifestyle image (33KB)
- `public/images/lifestyle-woman-running-new.webp` — compressed lifestyle image (255KB)
- `archive/images/` — archived original unoptimized images (not deployed)

### Removed
- `class-variance-authority` from `package.json` (unused dependency)
- 14 unoptimized PNG/JPG images from `public/images/` (archived, not deleted)
- ~250 lines of `.blog-content` CSS from `globals.css` (moved to route-scoped file)

### Files Modified
- `app/page.tsx` — WebP image paths, quality=75, ISR export, ScrollReveal removed from hero
- `app/globals.css` — blog CSS extracted, reduced-motion glow-card rule added
- `app/layout.tsx` — DNS prefetch hints for Stripe and Curator.io
- `app/community/page.tsx` — ISR export
- `app/creators/page.tsx` — ISR export
- `app/faq/page.tsx` — ISR export
- `app/how-it-works/page.tsx` — ISR export
- `app/pricing/page.tsx` — ISR export
- `app/science/page.tsx` — ISR export
- `app/science/[slug]/page.tsx` — ISR export, blog CSS import
- `components/site/LayoutShell.tsx` — converted to server component
- `next.config.js` — tiered cache headers, bundle analyzer, optimizePackageImports
- `package.json` — removed class-variance-authority
- `public/cultr-logo-black.png` — optimized (1.9MB → 214KB)
- `public/og-image.png` — optimized (4.7MB → 774KB)

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

## [2026-04-03] - Healthie EMR Integration + Production Migration

### Added
- **Healthie GraphQL Client** (`lib/healthie/`) — 8-file integration library with client, mutations, queries, schemas, types, webhooks, patient sync, and lab sync
- **Calendly Webhook** (`app/api/webhook/calendly/`) — HMAC-SHA256 verified, creates Healthie appointments
- **Healthie Webhook** (`app/api/webhook/healthie/`) — handles form completion, appointment, and document events
- **Onboarding Flow** (`app/onboarding/`) — 5-step post-checkout wizard (Welcome, Blood Test, Intake, Schedule, Complete)
- **Onboarding API** (`app/api/onboarding/status/`) — tracks member progress through onboarding
- **Feature Flags** (`lib/config/feature-flags.ts`) — `USE_HEALTHIE` toggle for dual-running during transition
- **CorePay Gateway** (`lib/payments/corepay-gateway.ts`) — extracted Authorize.Net ARB subscription logic for CorePay
- **4 Database Migrations** (037-040): generic EHR identity columns, membership shipping address, SiPhox EHR linkage, member onboarding table

### Removed
- **Provider Portal** — entire `app/provider/` directory (dashboard, patients, consultations, protocol builder). Providers now use Healthie dashboard directly.
- **Custom Intake System** — 14 components in `components/intake/`, IntakeFormClient, intake-form-context. Replaced with Healthie SDK embed placeholder.
- **Custom Consultation System** — 9 components in `components/consultations/`, Cal.com/Daily.co integration (BookingEmbed, VideoRoom, etc.), 6 API routes, webhooks, libs (cal.ts, daily.ts, consultations-db.ts, s3-recordings.ts). Replaced with Calendly.
- **Dead Payment Providers** — Cherry, Klarna, Affirm, Authorize.Net (legacy), NOWPayments, Coinbase Commerce. ~18 files deleted. CorePay + Stripe remain.
- **Renewal Flow** — `app/renewal/` directory and API routes (Healthie handles renewals)
- **npm packages** — `@calcom/embed-react`, `@daily-co/daily-js`, `@daily-co/daily-react`
- **Cron jobs** — `asher-sync`, `consultation-reminders` removed from vercel.json

### Changed
- **Product Catalog** — curated from 58 to 30 peptides (top GLP-1s, repair, growth, blends, neuropeptides + accessories)
- **Member Sidebar** — removed Renewal, Protocol Builder, Provider Schedule links
- **Dashboard** — removed consultation fetch/display (uses Calendly placeholder now)
- **CSP Headers** — removed Affirm, Klarna, Daily.co domains
- **Portal Dashboard** — updated dead links (/portal/intake → /intake, /portal/renewal → /members/consultations)
- **SiPhox Fulfillment** — address resolution now checks memberships.shipping_address first, falls back to pending_intakes
- **SiPhox Results Cron** — pushes lab results to Healthie after notification

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
