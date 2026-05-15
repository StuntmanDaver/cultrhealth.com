<!-- refreshed: 2026-05-15 -->
# Architecture

**Analysis Date:** 2026-05-15

## System Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js 14 App Router                         │
│          Server Components (default) + Client Components         │
├──────────────────┬──────────────────┬────────────────────────────┤
│  Marketing Pages │  Member Portal   │  Creator Portal / Admin     │
│  `app/page.tsx`  │  `app/members/`  │  `app/creators/portal/`    │
│  `app/pricing/`  │  `app/intake/`   │  `app/admin/`              │
│  `app/quiz/`     │  `app/dashboard/`│  `app/portal/`             │
└────────┬─────────┴────────┬─────────┴──────────┬─────────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Routes (app/api/)                        │
│  auth/ · checkout/ · creators/ · admin/ · member/ · club/        │
│  intake/ · webhook/ · cron/ · portal/ · track/ · visitor/        │
└─────────────────────────────────────────────────────────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     lib/ Business Logic                          │
│   auth.ts · db.ts · creators/ · payments/ · invoice/ · lmn/      │
│   config/ · contexts/ · resilience.ts · validation.ts            │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  External Services                                               │
│  Neon PostgreSQL · Stripe · Resend · Asher Med · QuickBooks       │
│  Cloudflare Turnstile · SiPhox · Calendly · Google Analytics     │
└─────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Root Layout | Font loading, GA script, LayoutShell mount | `app/layout.tsx` |
| LayoutShell | Conditional header/footer (hidden on portal/admin/join-club) | `components/site/LayoutShell.tsx` |
| Homepage | All marketing sections inline — does NOT use `components/sections/` | `app/page.tsx` |
| Auth utilities | JWT sign/verify, magic link tokens, session cookies | `lib/auth.ts` |
| DB layer | All PostgreSQL queries via `@vercel/postgres` sql tag | `lib/db.ts` |
| Creator commission engine | Direct (10%), override (2-8%), 20% cap logic | `lib/creators/commission.ts` |
| Creator attribution | Cookie-based click tracking, 30-day window | `lib/creators/attribution.ts` |
| Creator DB ops | All creator-table queries, status transitions | `lib/creators/db.ts` |
| Plans config | Tier definitions, Stripe IDs, library access rules | `lib/config/plans.ts` |
| Affiliate config | Commission rates, tier thresholds, FTC disclosures | `lib/config/affiliate.ts` |
| Validation schemas | Zod schemas for all API input boundaries | `lib/validation.ts` |
| Rate limiting | Per-IP/per-email rate limiting for API routes | `lib/rate-limit.ts` |
| Resilience | Retry patterns, circuit breaker for external APIs | `lib/resilience.ts` |
| Admin club orders | `PIPELINE_ORDER`, `PIPELINE_STATUSES` for order lifecycle | `lib/admin-club-orders.ts` |

## Pattern Overview

**Overall:** Next.js App Router with Server Components as the default. Interactive sub-trees are extracted to `*Client.tsx` sibling files.

**Key Characteristics:**
- Pages are React Server Components; interactive portions are extracted to `*Client.tsx` files
- API routes are thin handlers — business logic lives in `lib/`, not in `app/api/`
- State is React Context only (`CreatorContext`, `IntakeFormContext`, `CartContext`) — no Zustand/Redux
- Configuration is centralized in `lib/config/` — never inline in pages or API routes
- Database access goes through `lib/db.ts` or `lib/creators/db.ts` using the raw `sql` tag from `@vercel/postgres`

## Layers

**Presentation Layer:**
- Purpose: Render UI, handle user interaction, navigate routes
- Location: `app/` (pages), `components/` (shared components)
- Contains: Server components, client components, layouts, metadata exports
- Depends on: `lib/` utilities, `lib/config/`, React Context
- Used by: End users via browser

**API Layer:**
- Purpose: Handle HTTP requests, validate input, orchestrate business logic
- Location: `app/api/` (72+ route handlers)
- Contains: `route.ts` files with named `GET`/`POST` exports
- Depends on: `lib/db.ts`, `lib/auth.ts`, `lib/creators/`, `lib/validation.ts`, external SDKs
- Used by: Presentation layer (fetch calls), external webhooks (Stripe, Affirm, Klarna)

**Business Logic Layer:**
- Purpose: Domain logic independent of HTTP or React
- Location: `lib/`
- Contains: Auth utilities, DB functions, commission engine, payment adapters, PDF/LMN generation
- Depends on: External SDK packages, environment variables
- Used by: API layer exclusively (no direct imports from components into lib/)

**Configuration Layer:**
- Purpose: Centralize all domain constants, IDs, rates, and feature flags
- Location: `lib/config/`
- Contains: Plans, affiliate rates, payment providers, social proof data, product catalog, quiz config
- Depends on: Nothing (pure data)
- Used by: Both API layer and presentation layer

## Data Flow

### Member Checkout (Primary Path)

1. User selects plan on `/pricing` — `app/pricing/page.tsx`
2. Navigates to `/join/[tier]` — `app/join/[tier]/page.tsx` renders `ConsentModal`
3. `ConsentModal` (`components/compliance/ConsentModal.tsx`) scroll-gates informed consent
4. On consent, `PaymentMethodSelector` (`components/payments/PaymentMethodSelector.tsx`) collects payment
5. POST to `app/api/checkout/route.ts` — creates Stripe checkout session
6. Stripe redirects back to `app/success/page.tsx`
7. Stripe webhook at `app/api/webhook/stripe/route.ts` creates membership row in DB

### Creator Attribution Flow

1. Visitor clicks creator tracking link — `app/r/[slug]/route.ts` sets `cultr_attribution` cookie (30-day)
2. Visitor purchases — checkout reads cookie via `lib/creators/attribution.ts`
3. `processOrderAttribution()` writes `order_attributions` row
4. For club orders, commission is deferred until `shipped` status transition (`app/api/admin/club-orders/[orderId]/status/route.ts`)
5. Cron at `app/api/cron/approve-commissions/route.ts` auto-approves after 30-day refund window
6. Creator views earnings at `/creators/portal/earnings` — served by `app/api/creators/earnings/`

### Magic Link Auth Flow

1. User enters email on `/login` — POST to `app/api/auth/magic-link/route.ts`
2. Resend delivers email with signed JWT token (15-min expiry, signed via `lib/auth.ts`)
3. User clicks link — GET `app/api/auth/verify/route.ts`
4. `verifyMagicLinkToken()` validates JWT; `createSessionToken()` signs 24h session
5. Response sets `cultr_session_v2` cookie via `response.cookies.set()` (never `headers.append`)
6. Subsequent requests read session via `getSession()` in `lib/auth.ts`

### Intake Form Flow

1. Member accesses `/intake` — `app/intake/IntakeFormClient.tsx` (multi-step, `IntakeFormContext`)
2. File uploads (ID, consent) use Asher Med presigned S3 URLs
3. Final submission POSTs to `app/api/intake/submit/route.ts`
4. Submission persists `dateOfBirth`, `gender`, `shippingAddress`, `personalInformation`, `medicationPackages` in `pending_intakes.intake_data`

**State Management:**
- Server state: Fetched directly in Server Components or API route handlers; no client-side cache layer
- Client state: React Context only — `CreatorContext` (`lib/contexts/CreatorContext.tsx`), `IntakeFormContext` (`lib/contexts/intake-form-context.tsx`), `CartContext` (`lib/cart-context.tsx`)
- URL state: Limited use; `session_id` and `next` params passed via query string for intake/onboarding handoff

## Key Abstractions

**`cn()` Utility:**
- Purpose: Safely merge Tailwind classes
- File: `lib/utils.ts`
- Pattern: `cn(...inputs)` using `clsx` + `tailwind-merge` — used universally in all components

**`PLANS` Config:**
- Purpose: Single source of truth for membership tiers, Stripe IDs, library access rules, consultation counts
- File: `lib/config/plans.ts`
- Pattern: Imported by pricing pages, checkout API, auth layer, and TierGate component

**`COMMISSION_CONFIG` + `TIER_CONFIGS`:**
- Purpose: Affiliate commission rates, tier thresholds, bonus windows
- File: `lib/config/affiliate.ts`
- Pattern: Used by commission engine (`lib/creators/commission.ts`) and creator portal UI

**`PIPELINE_ORDER` / `PIPELINE_STATUSES`:**
- Purpose: Club order lifecycle stages — always import from here, never hardcode stage strings
- File: `lib/admin-club-orders.ts`
- Pattern: Used by admin UI components and `app/api/admin/club-orders/` route handlers

## Authentication & Authorization Model

### User Types and Auth Flows

| Role | Auth Method | Entry Route | Protected Areas | Session Cookie |
|------|-------------|-------------|-----------------|----------------|
| Members/Patients | JWT magic link (15min token) | `/login` | `/members/`, `/intake/`, `/dashboard/`, `/renewal/` | `cultr_session_v2` (24h) |
| Providers | JWT + email allowlist (`PROTOCOL_BUILDER_ALLOWED_EMAILS`) | `/login` | `/provider/protocol-builder/` | `cultr_session_v2` (24h) |
| Creators | Separate JWT (creator-specific) | `/creators/login` | `/creators/portal/*` | creator-specific JWT cookie |
| Admins | JWT + admin role check | `/admin` | `/admin/*` | `cultr_session_v2` (24h) |
| Club Visitors | Signed minimal session token | — | `cultr_club_visitor` cookie only (no profile data) | `cultr_club_visitor` |

### Key Auth Files

- **`lib/auth.ts`**: `createMagicLinkToken()`, `verifyMagicLinkToken()`, `createSessionToken()`, `getSession()`, `requireAuth()`, `requireAdmin()`
- **`lib/portal-auth.ts`**: Creator portal session management (separate JWT secret/flow)
- **`app/api/auth/magic-link/route.ts`**: Sends magic link email via Resend
- **`app/api/auth/verify/route.ts`**: Validates token, sets `cultr_session_v2` cookie, redirects to `/members`

### Staging Bypass
On `staging.cultrhealth.com`, magic link flow is bypassed: any email returns the token directly in the API response (no email sent). Team emails are auto-provisioned as creators. Controlled via `process.env.NEXT_PUBLIC_SITE_URL` hostname check.

## Database Schema Summary

### Core Tables
| Table | Purpose |
|-------|---------|
| `users` | Customer accounts (email, name, phone) |
| `subscriptions` | Stripe subscription tracking (status, tier, customer ID) |
| `orders` | Patient orders and fulfillment status |
| `intake_forms` | Medical intake data (HIPAA — no PHI in logs) |
| `pending_intakes` | Pre-auth intake submissions with `intake_data` JSON |
| `lmns` | Lab Management Numbers |
| `memberships` | Member records with EHR linkage, SiPhox labs, Calendly |
| `waitlist` | Waitlist/lead capture entries |

### Creator Affiliate Tables (migration `009_creator_affiliate_portal.sql`)
| Table | Purpose |
|-------|---------|
| `creators` | Creator profiles, status (pending/active/paused/rejected), tier, override rate |
| `affiliate_codes` | Unique referral codes with discount type and usage tracking |
| `tracking_links` | Generated tracking URLs with UTM parameters |
| `click_events` | Click data with attribution tokens, session IDs, IP hashes, expiry |
| `order_attributions` | Order-to-creator mapping; `discount_rate` snapshot; `skipCommissionLedger` flag |
| `commission_ledger` | Commission records (direct/override/adjustment, pending/approved/paid/reversed) |
| `payouts` | Payout history (pending/processing/completed/failed) |
| `admin_actions` | Audit log for all admin actions |

### Club Tables (migration `010_club_orders.sql`)
| Table | Purpose |
|-------|---------|
| `club_members` | Club signups (email, name, phone, referral source, cookie token) |
| `club_orders` | Club product orders (status follows `PIPELINE_ORDER`, HMAC approval token) |

### Integration Tables
| Table | Purpose |
|-------|---------|
| `quickbooks_tokens` | QuickBooks Online OAuth2 tokens (access + refresh, realm ID, expiry) |
| `stripe_idempotency` | Stripe request idempotency records |
| `payment_provider` | Multi-provider payment records |
| `siphox_*` | SiPhox lab results tables (migrations 020-022) |
| `consult_requests` | Telehealth consultation requests |
| `product_inventory` | Product inventory with `site_source` column (cultrhealth vs cultrclub) |
| `quiz_responses` | Quiz submissions with lead capture columns (migration 056) |
| `visitor_tracking` | First-visit tracking (migration 045) |

### Key Relationships
- `memberships.stripe_customer_id` → Stripe customer
- `order_attributions.creator_id` → `creators.id`
- `order_attributions.attribution_id` → `commission_ledger.attribution_id`
- `club_orders.member_id` → `club_members.id`
- `click_events.creator_id` → `creators.id`

## API Layer Organization

API routes are organized by domain under `app/api/`:

| Domain | Routes | Key Responsibility |
|--------|--------|--------------------|
| `auth/` | magic-link, verify, logout | Member auth, session management |
| `checkout/` | route, product, corepay, affirm, klarna, authorize-net | Payment session creation |
| `webhook/` | stripe, affirm, klarna, authorize-net | Payment event processing |
| `creators/` | apply, magic-link, verify-login, verify-email, dashboard, profile, links, codes, earnings/, network, payouts, support | Full creator portal API |
| `admin/` | analytics, club-orders/, creators/, members, customers, orders, inventory, intakes | Admin management API |
| `club/` | signup, orders, check-member, login | CULTR Club flows |
| `member/` | profile, orders, files, medical-records | Authenticated member data |
| `intake/` | questions, submit, upload | Medical intake pipeline |
| `portal/` | profile, orders/, documents | Member portal |
| `cron/` | approve-commissions, update-tiers, siphox-results | Scheduled jobs |
| `track/` | click, daily | Analytics tracking |
| `visitor/` | new | First-visit recording |
| `webhook/calendly/` | — | Calendly scheduling webhook |

## Error Handling

**Strategy:** Explicit try/catch in every API route. Errors are logged server-side with context. User-facing responses return sanitized messages only — no PHI, no stack traces.

**Patterns:**
- API routes return `{ error: string }` JSON with appropriate HTTP status (400, 401, 403, 500)
- External API calls wrapped in `lib/resilience.ts` retry/circuit-breaker helpers
- HIPAA compliance: `lib/hipaa-logger.ts` provides safe logging that strips PHI fields
- Auth failures return 401 without revealing whether an email exists (anti-enumeration)
- Club order HMAC: buffer length verified before `crypto.timingSafeEqual()` to prevent `TypeError`

## Cross-Cutting Concerns

**Logging:** `lib/hipaa-logger.ts` for HIPAA-safe server logging. Production build suppresses `console.log` but preserves `console.error`/`console.warn` via `removeConsole` in `next.config.js`.

**Validation:** Zod schemas in `lib/validation.ts` applied at all API input boundaries.

**Authentication:** JWT via `jose` library. `getSession()` / `requireAuth()` in `lib/auth.ts` used by all protected routes and server components. Creator auth uses a separate flow via `lib/portal-auth.ts`.

**Bot protection:** Cloudflare Turnstile (`lib/turnstile.ts`) on intake and signup forms.

**Rate limiting:** `lib/rate-limit.ts` applied on auth endpoints and form submission routes.

**Input sanitization:** DOMPurify (`DOMPurify ^3.3.1`) applied to all markdown rendered client-side.

---

*Architecture analysis: 2026-05-15*
