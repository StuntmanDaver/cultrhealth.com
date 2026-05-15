# Coding Conventions

**Analysis Date:** 2026-05-15

## Naming Patterns

**Files:**
- Pages: `page.tsx` (Next.js App Router convention)
- Client components: `*Client.tsx` suffix (e.g., `QuizClient.tsx`, `IntakeFormClient.tsx`, `ShopClient.tsx`)
- API routes: `route.ts` in `app/api/` directories
- Config modules: kebab-case in `lib/config/` (e.g., `plans.ts`, `payments.ts`, `social-proof.ts`)
- Utility/service modules: kebab-case (e.g., `rate-limit.ts`, `hipaa-logger.ts`, `data-normalization.ts`)

**Components:** PascalCase for all React components (`TierGate`, `ConsentModal`, `ScrollReveal`)

**Hooks:** `use` prefix in camelCase (`useRouter`, `usePathname`, `useSearchParams`)

**Constants:** `UPPER_SNAKE_CASE` for module-level constants
```typescript
// lib/config/payments.ts
export const COREPAY_ENABLED = process.env.NEXT_PUBLIC_ENABLE_COREPAY === 'true'

// lib/config/plans.ts
export const PLANS: Plan[] = [...]
export const STRIPE_CONFIG = {...}
export const BLOOD_TEST_ADDON = {...}
```

**Types/Interfaces:**
- `type` aliases for unions, plan-related models, and utility shapes
- `interface` for component props and extendable shapes
- Props interfaces defined inline or named `*Props`
```typescript
// type alias for union
export type PlanTier = 'core' | 'catalyst' | 'concierge' | 'club'
export type LibraryAccess = { masterIndex: 'full' | 'preview'; ... }

// interface for component props
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  isLoading?: boolean
}
```

**Boolean variables:** `is*`, `has*`, `should*`, `can*` prefixes (e.g., `isLoading`, `isOpen`, `isProviderEnabled`)

**Event handlers:** `on*` prefix for props, `handle*` for implementations (e.g., `onClose`, `handleSubmit`)

## Code Style

**Formatting:**
- Semicolons used (`;`) — enforced by ESLint/Next.js config
- Single quotes for strings in most files; some files use double quotes inconsistently
- `strict: false` in `tsconfig.json` — TypeScript strict mode is off; `allowJs: true`
- Module resolution: `node` (not `bundler`)

**Linting:**
- ESLint ^8.57.0 with `eslint-config-next ^14.2.0`
- Run: `npm run lint`
- No Prettier config in repo root — formatting is informal

## Import Organization

**Order (observed pattern):**
1. Next.js / React built-ins (`next/server`, `next/headers`, `react`)
2. Third-party libraries (`stripe`, `jose`, `zod`)
3. Internal paths via `@/` alias (`@/lib/...`, `@/components/...`, `@/app/...`)

```typescript
// API route example
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { PLANS, BLOOD_TEST_ADDON } from '@/lib/config/plans'
import { apiLimiter, getClientIp } from '@/lib/rate-limit'

// Component example
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NavDock } from '@/components/ui/NavDock'
```

**Path aliases:** `@/` maps to project root (defined in `tsconfig.json` and `vitest.config.js`)

**No barrel files** except `components/intake/index.ts` — modules are imported directly by path

## TypeScript Patterns

**Strict mode is OFF.** The codebase uses `strict: false` with `allowJs: true`. Code quality varies; `any` appears in some files (e.g., `{...props as any}` in `components/ui/Button.tsx`).

**Type exports from config:** Domain types are co-located with their config modules and exported from `lib/config/`:
```typescript
// lib/config/plans.ts
export type PlanTier = 'core' | 'catalyst' | 'concierge' | 'club'
export type Plan = { slug: PlanTier; name: string; price: number; ... }
```

**Inferred types preferred** for local variables; explicit types on exported function signatures

**Zod schemas** used for API input validation in `lib/validation.ts`:
```typescript
const userSchema = z.object({
  email: z.string().email(),
})
type UserInput = z.infer<typeof userSchema>
```

## CSS/Styling Conventions

**Utility-first Tailwind** — all styling via utility classes; no CSS modules or styled-components

**`cn()` utility** — always use for conditional class merging (defined in `lib/utils.ts`):
```typescript
import { cn } from '@/lib/utils'
// usage in component
className={cn(baseStyles, variants[variant], sizes[size], className)}
```

**Brand tokens** from `tailwind.config.ts` — never hardcode hex values:
- Backgrounds: `bg-brand-cream`, `bg-brand-primary`, `bg-cream-dark`
- Text: `text-brand-primary`, `text-brand-cream`
- Borders: `border-brand-primary/30`

**Animations:** Tailwind keyframes for simple effects; `framer-motion` via `motion.button` for interactive components (e.g., `components/ui/Button.tsx`). CSS transitions for hover states (`transition-colors duration-200`).

**Responsive:** Mobile-first. `md:` breakpoint = 768px, `lg:` = 1024px.

**Font utilities:** `font-fraunces` / `font-display` for display headings; `font-body` / `font-sans` for body text.

## Component Patterns

### Server/Client Split (CRITICAL)

Pages are **server components by default**. Interactive portions are extracted to `*Client.tsx` files:
- `app/quiz/page.tsx` (server) → `app/quiz/QuizClient.tsx` (client)
- `app/intake/page.tsx` (server) → `app/intake/IntakeFormClient.tsx` (client)
- `app/join/[tier]/page.tsx` — entire file is `'use client'` (complex interactive checkout)

Client components are marked `'use client'` at the file top. ~80 client components across `components/` and `app/`.

### Dynamic Imports

Homepage uses `next/dynamic` for below-fold components with loading skeletons:
```typescript
const PricingCard = dynamic(() => import('@/components/site/PricingCard'), {
  loading: () => <div className="animate-pulse ...">...</div>
})
```
Use for heavy components, below-fold sections, and components with browser-only side effects.

### Component Props Pattern

Named interfaces extending HTML element attributes where appropriate:
```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}
```

**Do not use `React.FC`** — declare function components as plain functions or via `forwardRef`.

### Context Pattern

React Context API for shared state (no Redux/Zustand/Jotai):
- `lib/contexts/CreatorContext.tsx` — creator portal auth and metrics state
- `lib/intake-form-context.tsx` — multi-step intake form state
- `lib/cart-context.tsx` — shopping cart state

## API Route Patterns

All API routes in `app/api/` follow Next.js App Router conventions with named HTTP method exports:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const clientIp = await getClientIp()
    const rateLimitResult = await apiLimiter.check(`route-name:${clientIp}`)
    if (!rateLimitResult.success) return rateLimitResponse(rateLimitResult)

    // 2. Parse + validate body
    const body = await request.json()
    if (!body.requiredField) {
      return NextResponse.json({ error: 'Field is required' }, { status: 400 })
    }

    // 3. Auth check
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 4. Business logic + DB

    // 5. Success response
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('[route-name] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Response shapes:**
- Success: `{ success: true, data?: T }` or `{ url: string }` for Stripe redirects
- Error: `{ error: string }` with appropriate HTTP status code
- No enforced envelope type — shape varies by route

**Auth is per-route** — no edge middleware auth; each handler calls `getSession()` or `getCreatorSession()` directly

**Rate limiting** applied via `lib/rate-limit.ts` at the top of sensitive POST routes

## Error Handling

**API routes:** `try/catch` wrapping the entire handler body. Errors are logged and returned as `{ error: string }` with correct HTTP status:
```typescript
} catch (error) {
  console.error('[checkout] Error:', error)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
```

**HIPAA Logger (`lib/hipaa-logger.ts`):** Required in all API routes — redacts PHI (email, phone, name, DOB, address) before output. Never use raw `console.log` with user data:
```typescript
import logger from '@/lib/hipaa-logger'
logger.info('[intake] form submitted', { orderId })   // safe — no PHI
```

**External API calls:** Use `lib/resilience.ts` patterns (retry with backoff, circuit breaker) for outbound HTTP.

**Client components:** React state (`isLoading`, `error`) pattern with user-facing error strings in JSX.

## Logging

**Framework:** `lib/hipaa-logger.ts` (wraps `console.log/error/warn` with PHI redaction)

**Rules:**
- Use `logger.info/error/warn` in all API routes
- Never log PHI fields: email, phone, name, DOB, address, medical data
- Structured logs with a `[module-name]` prefix: `logger.error('[checkout] Stripe error', { orderId })`
- `lib/quickbooks.ts` uses raw `console.log` — this is a known legacy inconsistency

## Comments

**When to comment:**
- JSDoc on exported functions in `lib/` when behavior is non-obvious
- Inline comments for security-sensitive decisions (cookie handling, HMAC verification, HIPAA)
- `// TODO: ...` for known stubs awaiting pharmacy partner reconnection

**JSDoc pattern:**
```typescript
/**
 * Creates a Stripe Checkout Session for paid tier subscriptions.
 * Includes optional blood test and consultation add-ons.
 */
export async function POST(request: NextRequest) { ... }
```

---

*Convention analysis: 2026-05-15*
