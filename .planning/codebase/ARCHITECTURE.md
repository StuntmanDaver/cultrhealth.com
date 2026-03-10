# Architecture

**Analysis Date:** 2026-03-10

## Pattern Overview

**Overall:** Next.js 14 App Router with server/client component separation, layered business logic, and multi-tenant workflows (public site, member portal, creator affiliate portal, admin dashboard).

**Key Characteristics:**
- Server components as default; interactive sections extracted to `*Client.tsx` files
- API routes follow RESTful patterns with webhook integrations for external services
- Context-based state management (React Context API) for shared form state and portal data
- Database-driven entity types (users, creators, orders, commissions)
- HIPAA-compliant architecture with no PHI logging, presigned URLs for file uploads, encrypted JWT tokens
- Multi-step workflows using state machines (intake form, checkout, creator applications)
- Real-time attribution tracking for affiliate commissions (30-day cookie window)

## Layers

**Presentation Layer (Frontend):**
- Purpose: Render pages, forms, interactive components; handle user interactions
- Location: `app/` (pages), `components/` (reusable UI)
- Contains: Page routes, layout wrappers, form components, UI primitives, animation wrappers
- Depends on: Business logic layer (lib/), API routes via fetch
- Used by: End users (browsers)

**API Layer (Route Handlers):**
- Purpose: Handle HTTP requests, validate inputs, orchestrate business logic, return JSON
- Location: `app/api/` (72 endpoints)
- Contains: Route handler files (`route.ts` with named exports `GET`, `POST`, `PUT`, `DELETE`)
- Depends on: Business logic layer, database layer, external integrations
- Used by: Frontend via fetch, external webhooks (Stripe, Affirm, Klarna), third-party services

**Business Logic Layer (Services):**
- Purpose: Implement domain logic, calculations, validations, transformations
- Location: `lib/` (creators/, payments/, invoice/, lmn/, config/)
- Contains: Commission calculations, attribution tracking, protocol generation, bill/invoice generation, eligibility checks
- Depends on: Data access layer, external SDKs (Stripe, OpenAI, Resend)
- Used by: API routes, server components, client context providers

**Data Access Layer (Database):**
- Purpose: Query and persist data to PostgreSQL via Neon
- Location: `lib/db.ts`, `lib/creators/db.ts`
- Contains: SQL query builders, type definitions, error handling, table creation logic
- Depends on: `@vercel/postgres` SDK
- Used by: API routes, business logic services

**Configuration Layer:**
- Purpose: Define application constants, enums, mappings, feature flags
- Location: `lib/config/`
- Contains: Plans, products, affiliate commission rules, payment providers, social proof, quiz questions, links registry
- Depends on: Environment variables
- Used by: All layers

**External Integrations:**
- Purpose: Communicate with third-party services
- Location: `lib/asher-med-api.ts`, `lib/payments/`, `lib/resend.ts`, `lib/quickbooks.ts`, etc.
- Contains: API client wrappers, authentication, request/response mapping
- Depends on: Official SDKs (Stripe, Resend), HTTP clients (fetch)
- Used by: Business logic and API routes

## Data Flow

**Checkout & Subscription Flow:**

1. User selects plan on pricing page
2. Frontend calls `POST /api/checkout` with plan slug
3. Route handler validates plan, reads attribution cookie (`cultr_attribution`)
4. Returns Stripe payment link with `client_reference_id` (attribution token) embedded
5. User completes Stripe checkout → `Stripe.checkout.session.completed` webhook fires
6. `POST /app/api/webhook/stripe/route.ts` verifies signature, looks up Asher Med patient ID from `asher_orders` table
7. Creates or updates membership record in `memberships` table with Stripe subscription ID
8. User redirected to `/intake` with `session_id` query param
9. Intake form auto-populates from Stripe checkout metadata if available
10. On form submit: `POST /api/intake/submit` creates Asher Med patient + order, stores intake data locally
11. Stores file uploads (ID, consent) via presigned S3 URLs (Asher Med provides URLs)

**Affiliate Click Attribution Flow:**

1. Creator generates tracking link via portal: `https://cultrhealth.com/r/[slug]`
2. User clicks link → redirected to `GET /app/api/r/[slug]/route.ts`
3. Route handler calls `handleClickTracking()` from `lib/creators/attribution.ts`
4. Generates unique attribution token + session ID, hashes IP, stores click event in DB
5. Sets `cultr_attribution` cookie with 30-day expiry (`COMMISSION_CONFIG.attributionWindowMs`)
6. Redirects to destination (homepage, pricing, quiz, etc.)
7. User later checks out → checkout route reads `cultr_attribution` cookie, embeds token in Stripe session
8. On successful checkout: webhook looks up creator from click event, creates `order_attributions` record
9. Commission ledger calculates direct (10%) + override (2-8%) commissions, records in `commission_ledger` table

**Intake Form Multi-Step Flow:**

1. User enters form via `/intake` page (server component wraps `IntakeFormClient`)
2. `IntakeFormClient` wraps form state in `IntakeFormProvider` (React Context)
3. Context loads/saves state to localStorage (`cultr-intake-simple` key)
4. Conditional rendering: steps shown/hidden based on medication selection (e.g., GLP-1 history only shows if GLP-1 selected)
5. On step completion validation, progress bar updates
6. On final submission: `POST /api/intake/submit` sends all form data
7. API route calls `createAsherMedPatient()` to create patient in Asher Med system
8. Returns Asher patient ID, stores intake data in local `intake_forms` table
9. Redirects to `/intake/success` with confirmation

**Admin Club Order Approval Flow:**

1. Customer submits club order via `POST /api/club/orders/route.ts`
2. Route handler validates order, sends email to customer + admin (`ADMIN_APPROVAL_EMAIL`)
3. Admin email contains one-click approval link: `/api/admin/club-orders/[orderId]/approve` with HMAC-signed token
4. Token valid for 30 minutes, prevents URL forgery
5. Admin clicks approval link → route calls `createQuickBooksCustomer()` + `createQuickBooksInvoice()`
6. QB invoice created with line items (therapies with dosages from `therapy.note`)
7. Invoice copy emailed to admin + customer
8. Club order status updated to `approved`, awaits customer payment

**State Management:**

- **Form state:** React Context + localStorage (intake form, join form)
- **Portal state:** React Context (`CreatorContext`, wrapped in `app/creators/portal/layout.tsx`)
- **User session:** JWT cookie (`cultr_session`, created in `lib/auth.ts`)
- **Attribution:** Serialized JSON in `cultr_attribution` cookie (base64url encoded)
- **User membership:** Membership tier + Stripe subscription ID stored in `memberships` table

## Key Abstractions

**Plan Configuration:**
- Purpose: Define membership tiers with pricing, features, library access levels
- Examples: `lib/config/plans.ts` defines `PLANS` array with plan objects (slug, price, Stripe IDs, features)
- Pattern: Config-driven; plans reference Stripe product/price IDs, feature flags control access to library sections

**Affiliate Commission Engine:**
- Purpose: Calculate commissions based on creator tier, recruitment chain, and capped totals
- Examples: `lib/creators/commission.ts` exports `calculateCommission()`, `getCreatorTier()`
- Pattern: Tiered override rates (Starter 0%, Bronze 2%, Silver 4%, Gold 6%, Platinum 8%), 10% direct rate, 20% total cap

**Attribution System:**
- Purpose: Track affiliate clicks across 30-day window, link orders to creators
- Examples: `lib/creators/attribution.ts`, `lib/creators/db.ts`
- Pattern: Token-based (generated on click), stored in HTTP-only cookie, mapped via `click_events` table on checkout

**Intake Form Context:**
- Purpose: Manage multi-step form state with localStorage persistence
- Examples: `lib/contexts/intake-form-context.tsx`
- Pattern: Provider wraps form controller, provides form data + step helpers (`isStepComplete`, `getCompletedSteps`)

**Asher Med Patient Adapter:**
- Purpose: Map local form data to Asher Med API schema
- Examples: `lib/asher-med-api.ts` exports `createAsherPatient()`, `createAsherOrder()`
- Pattern: Type-safe wrappers around HTTP calls; transforms between local and Asher schema

**Multi-Provider Payment System:**
- Purpose: Support Stripe subscriptions + BNPL providers (Affirm, Klarna, Authorize.net)
- Examples: `lib/payments/`, payment type selection in `components/payments/PaymentMethodSelector.tsx`
- Pattern: Provider-specific APIs (Affirm, Klarna SDKs), Stripe fallback, feature flags (`NEXT_PUBLIC_ENABLE_KLARNA`)

**Invoice & LMN Generation:**
- Purpose: Generate PDF documents (invoices, Lab Management Numbers)
- Examples: `lib/invoice/invoice-generator.tsx`, `lib/lmn/lmn-generator.tsx`
- Pattern: React component rendering to PDF via `@react-pdf/renderer`; includes eligibility checks (`lmn-eligibility.ts`)

## Entry Points

**Public Site Homepage:**
- Location: `app/page.tsx`
- Triggers: User visits `https://cultrhealth.com/`
- Responsibilities: Render hero, lifestyle images, how-it-works, pricing preview, testimonials, FAQ, newsletter signup. Uses dynamic imports for below-fold sections.

**Subscription Checkout:**
- Location: `app/join/[tier]/page.tsx`
- Triggers: User clicks "Get Started" on pricing page
- Responsibilities: Render plan details, membership disclaimer, payment method selector (Stripe/Affirm/Klarna/Authorize.net), redirect to payment provider

**Medical Intake Form:**
- Location: `app/intake/page.tsx` (wrapper) + `app/intake/IntakeFormClient.tsx` (state)
- Triggers: User successfully completes checkout, redirected with `session_id`
- Responsibilities: Multi-step form collection, file uploads (ID, consent), API submission, conditional step visibility based on medication selection

**Member Portal (Library & Dashboard):**
- Location: `app/library/page.tsx` (layout), `app/library/[category]/page.tsx` (category)
- Triggers: Logged-in members access `/library` route
- Responsibilities: Render peptide library, dosing calculator, protocol index, tier-gated content via `TierGate` component

**Creator Portal:**
- Location: `app/creators/portal/layout.tsx` (wrapper) + `app/creators/portal/[section]/page.tsx`
- Triggers: Logged-in creator accesses `/creators/portal/dashboard`
- Responsibilities: Creator dashboard (earnings, clicks, conversions), link management, coupon codes, payout tracking. Wrapped in `CreatorContext`.

**Admin Dashboard:**
- Location: `app/admin/page.tsx` + `app/admin/[section]/page.tsx`
- Triggers: Admin user navigates to `/admin`
- Responsibilities: Manage creator applications (approve/reject), process payouts, view analytics, manage club orders, fulfill member orders

**Webhook Handlers:**
- Location: `app/api/webhook/[provider]/route.ts` (Stripe, Affirm, Klarna, Authorize.net)
- Triggers: External payment provider sends event
- Responsibilities: Verify signature, process event (subscription created, payment succeeded, refund issued), update order status, trigger emails

**Affiliate Click Redirect:**
- Location: `app/api/r/[slug]/route.ts`
- Triggers: User clicks creator tracking link
- Responsibilities: Record click event, generate attribution token, set cookie, redirect to destination

## Error Handling

**Strategy:** Try/catch blocks per operation; errors logged (no PHI) and returned in API responses; client-side toast notifications for user feedback.

**Patterns:**
- API routes return `{ success: false, error: string }` on failure with appropriate HTTP status (400 bad request, 401 unauthorized, 500 server error)
- Database operations wrap in custom `DatabaseError` class with original error attached for logging
- External API calls use `resilience.ts` retry patterns (exponential backoff) for transient failures
- Form submission errors trapped in component state (`submitError`), displayed to user
- Payment provider errors (Stripe, Affirm, Klarna) caught, logged, and re-thrown with user-friendly message

## Cross-Cutting Concerns

**Logging:** No PHI logged. API routes log event type + metadata (IDs, counts), errors logged with stack trace, sensitive operations logged with summary (e.g., "Checkout completed, customer X, subscription Y").

**Validation:** Zod schemas in `lib/validation.ts` used for form data + API payloads. Schemas run on frontend (client-side) and backend (server-side) for defense-in-depth. All external data validated before use.

**Authentication:** JWT tokens (HS256, `jose` library) issued via magic link or direct auth. Token includes email, customerId, role, creatorId. Cookie-based session (`cultr_session`, HTTP-only, 7-day expiry). Staging bypass: any email returns token directly for testing. Allowed emails auto-provisioned as creators.

**Authorization:** Role-based access control (RBAC) via `role` claim in JWT (member|creator|admin). Middleware/helpers check role before exposing protected routes/data. Provider access controlled via `PROTOCOL_BUILDER_ALLOWED_EMAILS` env var (comma-separated list).

**Rate Limiting:** API endpoints rate-limited via Upstash Redis (optional, falls back to in-memory if not configured). Client IP extracted from `x-forwarded-for` header (Vercel routing). Limits vary by endpoint (checkout: generous, auth: strict).

**Resilience:** External API calls wrapped in retry logic (`lib/resilience.ts`). Circuit breaker pattern for failing services. Fallback behavior: if Asher Med unavailable, order marked as pending, no checkout failure.

**Bot Protection:** Cloudflare Turnstile on signup/checkout forms. Token verified server-side before processing request.

---

*Architecture analysis: 2026-03-10*
