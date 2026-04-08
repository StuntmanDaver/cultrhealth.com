# Architecture

**Analysis Date:** 2026-03-22

## Pattern Overview

**Overall:** Multi-tenant Next.js 14 App Router monolith with domain-segmented API surface, React Context state management, and external service delegation for medical/payment operations.

**Key Characteristics:**
- Server Components by default; interactive pages extracted to `*Client.tsx` files co-located with their page
- Three distinct authenticated portals (member `/portal`, creator `/creators/portal`, admin `/admin`) each with separate auth strategies and layouts
- Backend logic lives in `lib/` (pure utility functions, API clients, DB helpers); API routes in `app/api/` thin-orchestrate those utilities
- External services (Asher Med, Stripe, Resend, QuickBooks, SiPhox) are wrapped in dedicated `lib/` modules; API routes never call external SDKs directly
- Static marketing pages are edge-cached; authenticated/HIPAA pages are `private, no-cache`

## Layers

**Configuration Layer:**
- Purpose: Centralized business constants — plans, products, affiliate rates, social proof, coupons, therapies
- Location: `lib/config/`
- Contains: TypeScript constants and type definitions, no runtime side effects
- Depends on: Nothing (no imports from other layers)
- Used by: API routes, pages, components throughout

**Data Access Layer:**
- Purpose: All SQL queries and database operations
- Location: `lib/db.ts` (core entities), `lib/creators/db.ts` (affiliate tables), `lib/portal-db.ts` (portal sessions), `lib/siphox/db.ts` (lab results)
- Contains: Typed query functions using `@vercel/postgres` `sql` tagged template
- Depends on: `lib/config/` for types
- Used by: API routes only (never from components)

**External Service Layer:**
- Purpose: HIPAA-safe wrappers around third-party APIs
- Location: `lib/asher-med-api.ts`, `lib/quickbooks.ts`, `lib/resend.ts`, `lib/payments/`, `lib/siphox/client.ts`
- Contains: Typed API clients, auth header injection, error normalization
- Depends on: `lib/config/`, environment variables
- Used by: API routes only

**Business Logic Layer:**
- Purpose: Domain calculations and orchestration logic independent of HTTP
- Location: `lib/creators/commission.ts`, `lib/creators/attribution.ts`, `lib/resilience.ts`, `lib/calorie-calculator.ts`, `lib/peptide-calculator.ts`, `lib/lmn/`, `lib/invoice/`
- Contains: Pure functions, scoring engines, PDF generators
- Depends on: `lib/config/`, may call data access layer
- Used by: API routes, occasionally imported in server components

**API Route Layer:**
- Purpose: HTTP handlers — validate inputs, call lib functions, return JSON
- Location: `app/api/` (80+ `route.ts` files, named `GET`/`POST` exports)
- Contains: Thin orchestration: auth check → validate → call lib → respond
- Depends on: All lib layers
- Used by: Client components via `fetch()`

**Auth Layer:**
- Purpose: JWT creation/verification, session cookies, role checks
- Location: `lib/auth.ts` (member/creator/admin), `lib/portal-auth.ts` (phone OTP portal)
- Contains: `verifyAuth()`, `verifyCreatorAuth()`, `verifyAdminAuth()`, `getMembershipTier()`
- Depends on: `jose`, `lib/db.ts`, `lib/creators/db.ts`
- Used by: All API routes and portal layouts

**UI Layer:**
- Purpose: React components — pages, layouts, and shared UI primitives
- Location: `app/` (pages/layouts), `components/` (reusable components)
- Contains: Server components (pages), Client components (`*Client.tsx`), UI primitives (`components/ui/`)
- Depends on: `lib/config/` for constants, fetches `app/api/` for data
- Used by: End users via browser

## Data Flow

**New Member Checkout (Core/Catalyst/Concierge):**
1. User visits `app/join/[tier]/page.tsx`
2. `JoinClient.tsx` (client) calls `POST /api/checkout/subscription` with `planSlug` + `email`
3. Route calls `lib/rate-limit.ts` → creates Stripe Checkout Session via `stripe` SDK
4. Browser redirects to Stripe-hosted checkout; on success redirects to `/success`
5. Stripe fires `checkout.session.completed` webhook to `POST /api/webhook/stripe/route.ts`
6. Webhook handler writes membership record to DB via `lib/db.ts`, triggers Resend welcome email via `lib/resend.ts`

**CULTR Club Free Signup:**
1. User visits `app/join/page.tsx` (or `join.cultrhealth.com` via middleware rewrite)
2. Signup modal submits `POST /api/club/signup`
3. Route inserts `club_members` row, validates coupon via `lib/config/coupons.ts`, sends confirmation email via `lib/resend.ts`
4. Cookie `cultr_attribution` set for affiliate tracking

**Medical Intake Submission:**
1. Authenticated member completes `app/intake/IntakeFormClient.tsx` (12-step multi-form)
2. ID + consent uploads go to `POST /api/intake/upload` → calls `lib/asher-med-api.ts` for presigned S3 URLs
3. Form submits to `POST /api/intake/submit` → calls `lib/asher-med-api.ts` to create patient + order in Asher Med portal
4. `lib/intake-utils.ts` builds `partnerNote` payload, sent via `updateOrderApproval()` PATCH call

**Creator Affiliate Attribution:**
1. Visitor clicks affiliate link → `app/r/[slug]/route.ts` fires `POST /api/track/click`
2. Route records `click_events` row, sets `cultr_attribution` cookie (30-day expiry)
3. On checkout completion, webhook reads attribution cookie, writes `order_attributions` row
4. Cron job at `app/api/cron/approve-commissions/route.ts` runs daily, approves commissions after 30-day refund window

**Member Portal Auth (Phone OTP):**
1. Member enters phone at `app/portal/login/page.tsx`
2. `POST /api/portal/send-otp` sends OTP via Twilio (or returns `123456` on staging)
3. `POST /api/portal/verify-otp` validates OTP, issues short-lived access token (15 min) + refresh token (7 days) via `lib/portal-auth.ts`
4. `app/portal/layout.tsx` (client) polls `POST /api/portal/refresh` every 12 min of activity

**State Management:**
- **Server state:** Fetched in Server Components where possible; Client Components `fetch()` API routes
- **UI state:** React `useState`/`useReducer` local to each component
- **Cross-component state:** React Context API — `CreatorContext` (creator portal), `CartContext` (shop cart), `IntakeFormContext` (multi-step intake form)
- **Cart persistence:** `localStorage` via `CartContext` reducer
- **Attribution persistence:** `cultr_attribution` cookie (30-day)

## Key Abstractions

**`cn()` Utility:**
- Purpose: Merge Tailwind classes safely without conflicts
- Examples: `lib/utils.ts`
- Pattern: `clsx` + `tailwind-merge` combined; used in every component for conditional classes

**Plan Tiers (`PlanTier`):**
- Purpose: Typed union controlling feature access, pricing, and content gating
- Examples: `lib/config/plans.ts`, `lib/auth.ts` `getMembershipTier()`, `components/library/TierGate.tsx`
- Pattern: `'club' | 'core' | 'catalyst' | 'concierge'` — evaluated in `getLibraryAccess()` to return `LibraryAccess` object

**Auth Result Pattern:**
- Purpose: Consistent return shape from all auth verification functions
- Examples: `lib/auth.ts` — `verifyAuth()`, `verifyCreatorAuth()`, `verifyAdminAuth()`
- Pattern: `{ authenticated: boolean, email: string | null, customerId: string | null, role?: string | null }`

**`*Client.tsx` Server/Client Split:**
- Purpose: Keep pages as Server Components (SEO, zero client JS) while extracting interactive parts
- Examples: `app/quiz/QuizClient.tsx`, `app/intake/IntakeFormClient.tsx`, `app/library/shop/ShopClient.tsx`
- Pattern: `page.tsx` = server component with metadata, imports and renders `*Client.tsx` which is `'use client'`

**External API Wrapper Pattern:**
- Purpose: Isolate third-party SDK details from API routes
- Examples: `lib/asher-med-api.ts`, `lib/quickbooks.ts`, `lib/siphox/client.ts`
- Pattern: Module exports typed async functions; auth headers injected internally; errors normalized to `Error` objects

**Resilience Utilities:**
- Purpose: Retry logic + transient error detection for external API calls
- Examples: `lib/resilience.ts` — `withRetry()`, `isTransientDbError()`
- Pattern: `await withRetry(() => externalCall(), { maxAttempts: 3, delayMs: 1000 })`

## Entry Points

**Root Layout:**
- Location: `app/layout.tsx`
- Triggers: Every page request
- Responsibilities: Font CSS variables, GA script injection, `LayoutShell` wrapper (conditionally shows Header/Footer), `MeshBackgroundDynamic` global background

**Edge Middleware:**
- Location: `middleware.ts`
- Triggers: All requests matching `/((?!_next/static|_next/image|favicon.ico).*)`
- Responsibilities: Rewrites `join.cultrhealth.com` → `/join` (subdomain aliasing); passes all other requests through unchanged

**Marketing Homepage:**
- Location: `app/page.tsx`
- Triggers: `GET /`
- Responsibilities: Full-page server render of all marketing sections; lazy-loads below-fold components via `next/dynamic`

**API Route Convention:**
- Location: `app/api/**/*.route.ts`
- Triggers: HTTP requests from client components or external webhooks
- Responsibilities: Auth check → input validation → lib function calls → JSON response; follow `export async function GET/POST(request: NextRequest)` pattern

**Cron Jobs:**
- Location: `app/api/cron/*/route.ts`
- Triggers: Vercel Cron schedule (configured in `vercel.json`)
- Responsibilities: `approve-commissions` (approve 30-day-old pending commissions), `update-tiers` (recalculate creator tiers by recruit count), `siphox-results` (poll SiPhox for new lab results), `siphox-fulfillment` (sync fulfillment status)

## Error Handling

**Strategy:** Fail-fast on invalid input; graceful degradation on external service failures; structured JSON error responses from API routes.

**Patterns:**
- API routes return `NextResponse.json({ error: '...' }, { status: 4xx/5xx })` on failure
- External service calls wrapped in `try/catch`; failures logged (PHI-free), HTTP 500 returned
- Auth failures return 401 with `{ error: 'Unauthorized' }`; portal layouts redirect to login
- DB unavailability falls through to Stripe lookup for membership tier (cascading fallback in `lib/auth.ts` `getMembershipTier()`)
- Stripe webhook signature failures return 400 immediately (no processing)
- Individual email sends (customer + admin) have independent `try/catch` blocks; response includes `{ customerEmailSent, adminEmailSent }` flags

## Cross-Cutting Concerns

**Logging:** `console.log` (production `removeConsole` strips it via `next.config.js`); structured JSON for checkout events via `lib/resilience.ts` `logCheckoutEvent()`; HIPAA rule: never log PHI fields

**Validation:** Zod schemas in `lib/validation.ts`; API routes validate request bodies before any DB/service call; `DOMPurify` sanitizes all rendered markdown content

**Authentication:**
- Member/creator/admin sessions: JWT (HS256) in `cultr_session` cookie via `lib/auth.ts`; 7-day expiry
- Member portal (phone OTP): Dual-token (15-min access + 7-day refresh) via `lib/portal-auth.ts`
- Creator portal layout: Client-side auth check via `fetch('/api/creators/profile')` on mount
- Development bypass: `lib/auth.ts` `getSession()` returns a hardcoded admin session when `NODE_ENV === 'development'`

**Rate Limiting:** `lib/rate-limit.ts` — in-memory store for development, Upstash Redis for production; applied at API route level via `apiLimiter.check(ip)`

**HIPAA Compliance:** No PHI in logs; presigned S3 URLs for file uploads (expiring); `private, no-cache` headers on all authenticated routes; data encryption delegated to Neon/Vercel infrastructure

---

*Architecture analysis: 2026-03-22*
