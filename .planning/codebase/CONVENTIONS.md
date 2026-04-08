# Coding Conventions

**Analysis Date:** 2026-03-22

## Naming Patterns

**Files:**
- React components: PascalCase — `Button.tsx`, `TierGate.tsx`, `Header.tsx`
- Client-side page components: `*Client.tsx` suffix — `QuizClient.tsx`, `IntakeFormClient.tsx`, `ShopClient.tsx`, `JoinLandingClient.tsx`
- API routes: `route.ts` (Next.js App Router convention) — `app/api/auth/magic-link/route.ts`
- Utility/lib files: camelCase — `auth.ts`, `db.ts`, `utils.ts`
- Config files: kebab-case in lib/config — `plans.ts`, `product-catalog.ts`, `social-proof.ts`

**Functions:**
- Exported async functions: camelCase — `createMagicLinkToken`, `verifySessionToken`, `getMembershipTier`
- React components: PascalCase — `Button`, `TierGate`, `Header`
- Private/internal helpers: camelCase — `isStaging()`, `normalizePlanTier()`, `getTierRank()`
- Factory/getter functions: `get*` prefix — `getStripe()`, `getResend()`, `getSession()`
- Validator functions: `is*` / `has*` / `check*` — `isProviderEmail()`, `hasFeatureAccess()`, `checkRateLimit()`

**Variables:**
- Local variables: camelCase — `normalizedEmail`, `sessionCookie`, `baseConfig`
- Constants: SCREAMING_SNAKE_CASE — `SESSION_COOKIE_NAME`, `RATE_LIMIT_WINDOW`, `TEAM_EMAILS`, `TIER_ORDER`
- Config objects: SCREAMING_SNAKE_CASE — `PLANS`, `STRIPE_CONFIG`, `BIOMARKER_DEFINITIONS`

**Types and Interfaces:**
- Interfaces: PascalCase with no `I` prefix — `ButtonProps`, `SessionPayload`, `AuthResult`
- Type aliases: PascalCase — `PlanTier`, `BiomarkerCategory`, `LibraryAccess`
- Input types: `*Input` suffix — `CreateWaitlistInput`, `CreateMembershipInput`, `UpdateMembershipInput`
- Entry/row types: `*Entry` suffix — `WaitlistEntry`, `MembershipEntry`, `OrderEntry`

## Code Style

**Formatting:**
- No Prettier or explicit formatting config found — formatting is enforced via ESLint (Next.js default config)
- Single quotes for strings in most files; some files use double quotes inconsistently (no enforced rule)
- Semicolons: inconsistent across the codebase (some files omit, some include)
- Trailing commas: present in most multi-line structures
- 2-space indentation throughout

**Linting:**
- ESLint via `eslint-config-next` (Next.js defaults)
- Run: `npm run lint`
- No custom `.eslintrc` — uses Next.js built-in rules only
- Hook post-write audit: `code-audit.sh` runs ESLint, checks for `console.log`, PHI logging, hardcoded secrets, TODO/FIXME

## Import Organization

**Order:**
1. React/Next.js framework imports — `import { useState, useEffect } from 'react'`, `import Link from 'next/link'`
2. External library imports — `import Stripe from 'stripe'`, `import { Resend } from 'resend'`
3. Internal imports with `@/` alias — `import { cn } from '@/lib/utils'`, `import Button from '@/components/ui/Button'`

**Path Aliases:**
- `@/*` maps to project root — use `@/lib/auth`, `@/components/ui/Button`, `@/app/api/...`
- Defined in both `tsconfig.json` and `vitest.config.js`

**Example:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { PLANS, BLOOD_TEST_ADDON } from '@/lib/config/plans'
import { apiLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
```

## Server vs. Client Boundary

**'use client' directive:** Always first line of file for client components — before any imports.

**Pattern:** Pages are server components by default. Interactive logic is extracted to `*Client.tsx` files:
- `app/quiz/page.tsx` (server) → imports `QuizClient.tsx` (client)
- `app/library/shop/page.tsx` (server) → imports `ShopClient.tsx` (client)
- `app/join/JoinLandingClient.tsx` (client, full landing page)

**Lazy loading below-fold components:**
```typescript
const PricingCard = dynamic(() => import('@/components/site/PricingCard'), {
  loading: () => <div className="skeleton-loader" />,
})
```

## Error Handling

**API routes:** Wrap all logic in `try/catch`. Return `NextResponse.json({ error: '...' }, { status: N })` on failure:
```typescript
export async function POST(request: NextRequest) {
  try {
    // ... logic
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Descriptive prefix:', error)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
```

**Library functions:** Throw custom `DatabaseError` for DB failures (`lib/db.ts`):
```typescript
export class DatabaseError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message)
    this.name = 'DatabaseError'
  }
}
```

**JWT/Auth:** Return `null` on verification failure (never throw):
```typescript
try {
  const { payload } = await jwtVerify(token, secret)
  // ...
  return result
} catch {
  return null
}
```

**External API failures:** Silently catch and fall through to fallback:
```typescript
try {
  const membership = await getMembershipByCustomerId(customerId)
  if (fromDb) return fromDb
} catch {
  // DB unavailable — fall through to Stripe or return null
}
```

**Lazy initialization pattern for external clients** (avoid build-time errors):
```typescript
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-02-25.clover',
  })
}
```

## Logging

**Framework:** `console.log` / `console.error` (no structured logging library)

**Patterns:**
- Info events: `console.log('Event description:', { key: value, timestamp: new Date().toISOString() })`
- Errors: `console.error('Descriptive prefix:', error)` — always with context
- Structured JSON for checkout events via `logCheckoutEvent()` in `lib/resilience.ts`
- HIPAA rule: never log PHI (email in logs is acceptable; health data is not)
- `console.log` statements are flagged by `code-audit.sh` hook — use sparingly

## Comments

**When to Comment:**
- JSDoc blocks on exported utility functions — `/** ... */` style used in `lib/auth.ts`, `lib/resilience.ts`
- Inline comments for non-obvious business logic (HIPAA rules, staging bypasses, rate limiting)
- Section dividers with `// === SECTION NAME ===` in large files (`lib/db.ts`, `lib/auth.ts`, `lib/resilience.ts`)
- TODO comments are flagged by `code-audit.sh` and should be avoided

**JSDoc pattern:**
```typescript
/**
 * Verify authentication for API routes
 * Reads session from cookie or Authorization header
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
```

## Function Design

**Size:** Functions are generally kept focused; large files (`lib/protocol-templates.ts` at 4074 lines, `lib/db.ts` at 1792 lines) contain many small, single-purpose functions.

**Parameters:** Use typed objects for multi-param functions (`CreateWaitlistInput`, `RetryOptions`); primitives for simple functions.

**Return Values:** Functions return typed values or `null` (never `undefined`) for optional results. Async functions return `Promise<T | null>` for fallible lookups.

**Async/await:** Used consistently — no raw Promise chains.

## Module Design

**Exports:**
- Named exports for utility functions — `export async function createWaitlistEntry(...)`
- Named exports for types/interfaces — `export interface SessionPayload {`
- Default export for React components — `export default Button`
- Named export for non-default components — `export function TierGate(...)`
- Both patterns exist; components in `components/ui/` use default, domain components use named

**Barrel Files:**
- `components/intake/index.ts` — barrel export for all intake components
- Other directories expose individual files directly (no barrels)

## Button Component Usage

Always use `Button` from `@/components/ui/Button`. Do NOT use CVA — variants are managed via plain object lookup + `cn()`:
```typescript
import Button from '@/components/ui/Button'
// Variants: 'primary' | 'secondary' | 'ghost'
// Sizes: 'sm' | 'md' | 'lg'
// All variants use rounded-full
<Button variant="secondary" size="sm" isLoading={loading}>Submit</Button>
```

## cn() Utility

Always use `cn()` from `@/lib/utils` for conditional class merging — never raw string concatenation:
```typescript
import { cn } from '@/lib/utils'
className={cn('base-class', condition && 'conditional-class', className)}
```

## Tailwind CSS

- Use brand color tokens, not raw hex: `text-brand-primary`, `bg-brand-cream`, `text-cultr-sage`
- Use `font-fraunces` or `font-display` for CULTR brand name and headings
- Use `font-body` / `font-sans` (Inter) for body text
- Custom animations defined in `tailwind.config.ts`: `animate-fade-in`, `animate-slide-up`, `animate-shimmer`

## TypeScript Configuration Notes

- `strict: false` — loose type checking; `any` casts (`as any`) are present in test files
- `allowJs: true` — JS files are permitted
- `skipLibCheck: true` — library type errors suppressed
- `moduleResolution: "node"` — legacy resolution (not `bundler`)
- Path alias `@/*` → project root; use consistently in new code

---

*Convention analysis: 2026-03-22*
