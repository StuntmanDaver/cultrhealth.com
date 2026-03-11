# Coding Conventions

**Analysis Date:** 2026-03-11

## Naming Patterns

**Files:**
- Page routes: `page.tsx` (Next.js App Router convention)
- Interactive client components extracted from pages: `*Client.tsx` (e.g., `IntakeFormClient.tsx`, `ShopClient.tsx`, `QuizClient.tsx`)
- API routes: `route.ts` with named exports (`GET`, `POST`, etc.)
- Utility libraries: `kebab-case.ts` (e.g., `asher-med-api.ts`, `portal-auth.ts`, `intake-utils.ts`)
- Config files: `kebab-case.ts` inside `lib/config/` (e.g., `affiliate.ts`, `plans.ts`, `social-proof.ts`)
- React components: `PascalCase.tsx` (e.g., `TierGate.tsx`, `Button.tsx`, `CreatorHeader.tsx`)
- Test files: `*.test.ts` / `*.test.tsx` inside `tests/` directory tree

**Functions:**
- camelCase for all functions: `getLibraryAccess`, `buildPartnerNote`, `verifyCreatorAuth`
- Async functions: standard `async function` or `async () =>` arrow functions
- React components: PascalCase named function or `forwardRef` (e.g., `const Button = forwardRef<...>(...)`)
- Utility helpers: verb-first naming: `formatMedicationsList`, `calculateBMI`, `normalizePlanTier`

**Variables:**
- camelCase for local variables and parameters
- SCREAMING_SNAKE_CASE for module-level constants: `PLANS`, `STRIPE_CONFIG`, `BIOMARKER_DEFINITIONS`, `TIER_ORDER`, `SESSION_COOKIE_NAME`
- Interfaces: PascalCase with no `I` prefix: `ButtonProps`, `SessionPayload`, `AuthResult`
- Type aliases: PascalCase: `PlanTier`, `BiomarkerCategory`, `Phenotype`

**Types:**
- Interfaces for object shapes (preferred over `type` for extendable structures)
- Type unions for discriminated values: `'pending' | 'active' | 'paused' | 'rejected'`
- Zod schemas suffixed with `Schema`: `waitlistSchema`, `newsletterSchema`
- Inferred types exported alongside schemas: `export type WaitlistFormData = z.infer<typeof waitlistSchema>`

## Code Style

**Formatting:**
- No Prettier or Biome config detected — formatting is manual/editor-enforced
- Semicolons: inconsistent — API route files use semicolons (`app/api/`), library files often omit them (`lib/`)
- Single quotes for string literals throughout
- 2-space indentation

**Linting:**
- ESLint 8 via `eslint-config-next` (Next.js default ruleset)
- No custom `.eslintrc` — uses Next.js defaults only
- TypeScript: `strict: false` in `tsconfig.json` — loose type checking permitted

## Import Organization

**Order (observed pattern):**
1. Next.js framework imports (`next/server`, `next/headers`, `next/navigation`, `next/link`)
2. External library imports (`jose`, `zod`, `stripe`)
3. Internal `@/lib/*` imports (utilities, config, DB)
4. Internal `@/components/*` imports
5. Type-only imports last: `import type { PlanTier } from '@/lib/config/plans'`

**Path Aliases:**
- `@/` maps to project root (defined in both `tsconfig.json` and `vitest.config.js`)
- Use `@/lib/...`, `@/components/...`, `@/app/...` — never relative paths for cross-directory imports

**Example:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'
import { PLANS, type LibraryAccess, type PlanTier } from '@/lib/config/plans'
import { getMembershipByCustomerId } from '@/lib/db'
import type { ReactNode } from 'react'
```

## Error Handling

**API Routes:**
- All route handlers wrapped in a single top-level `try/catch`
- Errors returned as `NextResponse.json({ error: errorMessage }, { status: NNN })`
- Error message extraction pattern: `const errorMessage = error instanceof Error ? error.message : 'Fallback message'`
- Non-fatal external calls wrapped in their own nested try/catch with silent failure

**Example pattern from `app/api/checkout/route.ts`:**
```typescript
export async function POST(request: NextRequest) {
  try {
    // ... logic
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Operation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Operation failed'
    return NextResponse.json({ error: errorMessage }, { status: 400 })
  }
}
```

**Library functions:**
- Return `null` for "not found" or invalid input instead of throwing
- Throw only for unrecoverable errors
- JWT verify functions always return `null` on failure (never throw to caller)

```typescript
export async function verifyMagicLinkToken(token: string): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, MAGIC_LINK_SECRET)
    if (payload.type !== 'magic_link' || typeof payload.email !== 'string') return null
    return { email: payload.email }
  } catch {
    return null
  }
}
```

**External API resilience:**
- `lib/resilience.ts` exports `withRetry<T>()` with exponential backoff for wrapping external calls
- `isTransientDbError()` helper identifies retryable DB errors
- Pattern: non-fatal try/catch around Asher Med API calls after primary DB write succeeds

## Logging

**Framework:** `console` (native)

**Patterns:**
- `console.error()` for caught errors in API routes (282 occurrences across 69 API files)
- `console.log()` for operational events (rate limit hits, checkout events)
- Structured logging via `logCheckoutEvent()` in `lib/resilience.ts` for payment flows (JSON format with timestamp)
- No PHI in logs (HIPAA requirement — patient names, emails, health data must not appear in log output)
- `removeConsole` in production builds (configured in `next.config.js`)

## Comments

**When to Comment:**
- JSDoc block comments on exported functions: `/** Verify authentication for API routes */`
- Section dividers with `=== SECTION NAME ===` in large utility files (pattern in `lib/resilience.ts`, `lib/auth.ts`)
- Inline comments on non-obvious logic (cookie expiry values, HIPAA notes, API quirks)
- Route files: leading JSDoc block explaining the endpoint's purpose and what it accepts

**JSDoc pattern:**
```typescript
/**
 * POST /api/intake/submit
 *
 * Submits completed intake form to Asher Med to create a new order.
 * This is called after the user completes the multi-step intake form.
 */
export async function POST(request: NextRequest) {
```

## Function Design

**Size:** Functions are generally focused and single-purpose. Large orchestration functions (e.g., `calculateResilienceScore`) are split into helper functions called within.

**Parameters:** Prefer plain object params for functions with 3+ args. Simple functions use positional params.

**Return Values:**
- `null` for "not found" or unauthenticated states
- Plain objects for success data
- `{ authenticated: boolean, email: string | null, ... }` for auth result structs

## Module Design

**Exports:**
- Named exports preferred throughout (no default exports except React components)
- React components: `export default Button` (default) but `export function TierGate` (named) — inconsistent, both patterns exist
- `components/intake/index.ts` barrel file — the only barrel file detected; other component directories do not use barrels

**Barrel Files:**
- Only `components/intake/index.ts` uses barrel exports
- All other modules export directly from their files
- Do NOT create barrel files in new component directories

## React Component Conventions

**Server vs Client Split:**
- Pages (`page.tsx`) are server components by default
- Interactive parts extracted to `*Client.tsx` suffix: `IntakeFormClient.tsx`, `PortalLoginClient.tsx`, `ShopClient.tsx`
- Client components always start with `'use client'` directive as first line

**Component Pattern:**
```typescript
'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import type { PlanTier } from '@/lib/config/plans'

interface ComponentProps {
  // typed props
}

export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // hooks first
  const [state, setState] = useState(false)
  // render
  return (...)
}
```

**Styling:**
- Tailwind utility classes only — no CSS modules, no styled-components
- `cn()` from `lib/utils.ts` for conditional/merged class strings: `cn(baseStyles, variants[variant], sizes[size], className)`
- `class-variance-authority` (CVA) is NOT used despite being in `package.json`
- All Button variants use manual variant objects + `cn()` instead of CVA

**Dynamic Imports:**
- Use `next/dynamic` for below-fold / heavy components with a loading skeleton prop
- Pattern: `const PricingCard = dynamic(() => import('@/components/site/PricingCard'), { loading: () => <Skeleton /> })`

---

*Convention analysis: 2026-03-11*
