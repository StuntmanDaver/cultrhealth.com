# Coding Conventions

**Analysis Date:** 2026-03-10

## Naming Patterns

**Files:**
- Components: PascalCase + `.tsx` extension (e.g., `Button.tsx`, `Header.tsx`, `TierGate.tsx`)
- Utilities/helpers: camelCase + `.ts` extension (e.g., `utils.ts`, `validation.ts`, `rate-limit.ts`)
- API routes: lowercase with hyphens + `route.ts` (e.g., `magic-link/route.ts`, `checkout/route.ts`)
- Config files: camelCase (e.g., `plans.ts`, `products.ts`, `affiliate.ts`)
- Test files: same name as source file + `.test.ts` or `.test.tsx` (e.g., `auth.test.ts`, `TierGate.test.tsx`)
- Client components: suffix with `Client` (e.g., `QuizClient.tsx`, `ShopClient.tsx`, `IntakeFormClient.tsx`)

**Functions:**
- camelCase for all functions: `createMagicLinkToken()`, `verifySessionToken()`, `formatPhoneE164()`
- Async functions use `async/await` pattern, no promise chains
- Factory/helper functions use descriptive names: `getLibraryAccess()`, `getMembershipTier()`, `ensureWaitlistTable()`

**Variables:**
- camelCase: `planSlug`, `customerId`, `stripePriceId`, `mobileMenuOpen`
- Constants: SCREAMING_SNAKE_CASE (e.g., `SESSION_COOKIE_NAME`, `MAGIC_LINK_SECRET`, `RATE_LIMIT_WINDOW`, `TEAM_EMAILS`)
- Database columns: snake_case (e.g., `stripe_customer_id`, `created_at`, `social_handle`)
- React hooks state: camelCase (e.g., `const [scrolled, setScrolled] = useState(false)`)

**Types/Interfaces:**
- PascalCase for all types and interfaces: `SessionPayload`, `WaitlistEntry`, `ButtonProps`, `LibraryAccess`
- Type exports: `export type PlanTier = 'core' | 'catalyst' | 'concierge' | 'club'`
- Interface exports: `export interface MembershipEntry { ... }`
- Discriminated unions used for state machines: see `lib/auth.ts` SessionPayload for role typing

## Code Style

**Formatting:**
- No ESLint config file detected; use Next.js default ESLint rules
- No Prettier config file detected; follow Next.js style defaults
- 2-space indentation (inferred from codebase)
- Semicolons required at end of statements
- Single quotes for strings where possible (observed pattern)

**Linting:**
- ESLint ^8.57.0 configured via `eslint-config-next`
- Lint with: `npm run lint`
- Next.js strict linting enabled (no Biome)
- TypeScript: `strict: false` in tsconfig.json (loose mode), `allowJs: true`, `skipLibCheck: true`

**Component Style:**
- Functional components with hooks, no class components
- Use `'use client'` directive for interactive components
- forwardRef for UI components that need ref access (e.g., Button)
- Destructure props in function signature when possible

**Tailwind CSS:**
- Utility-first approach (no CSS modules or styled-components)
- Custom color tokens defined in `tailwind.config.ts`: `brand-primary`, `brand-cream`, `sage`, `mint`
- Responsive classes: `lg:`, `md:`, `sm:` prefixes for mobile-first design
- Custom animations via `@keyframes`: fadeIn, slideUp, float, shimmer, scaleIn, blurIn, bounceSubtle, glowPulse (in tailwind.config.ts)
- All buttons use `rounded-full` class for pill shape

## Import Organization

**Order:**
1. React/Next imports (React, next/link, next/navigation, etc.)
2. Third-party libraries (stripe, resend, zod, etc.)
3. Internal utilities (lib/utils, lib/auth, etc.)
4. Internal components (@/components/*)
5. Type imports (import type ...)

**Example:**
```typescript
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { verifyAuth } from '@/lib/auth'
import Button from '@/components/ui/Button'
import type { PlanTier } from '@/lib/config/plans'
```

**Path Aliases:**
- `@/*` maps to project root (defined in tsconfig.json and vitest.config.js)
- Use absolute imports: `@/lib/auth`, `@/components/ui/Button`, never relative imports like `../../lib/auth`

## Error Handling

**Pattern:**
- Try/catch with explicit error logging via `console.error()`
- Custom error classes: `DatabaseError` (in lib/db.ts) extends Error with `name` property
- API routes return NextResponse with appropriate HTTP status codes (400, 401, 404, 429, 500)
- Validation errors: return 400 with error message in JSON

**Example:**
```typescript
export async function createMembership(input: CreateMembershipInput): Promise<{ id: string }> {
  try {
    const result = await sql`...`
    return { id: result.rows[0].id }
  } catch (error) {
    console.error('Database error creating membership:', error)
    throw new DatabaseError('Failed to create membership', error)
  }
}

// In API routes:
try {
  // ... operation
  return NextResponse.json({ success: true }, { status: 200 })
} catch (error) {
  console.error('Operation error:', error)
  const errorMessage = error instanceof Error ? error.message : 'Operation failed'
  return NextResponse.json(
    { error: errorMessage },
    { status: 500 }
  )
}
```

**Database errors:**
- Always wrap SQL operations in try/catch
- Log with context: `console.error('Database error [operation]:', error)`
- Throw DatabaseError for caller handling or return null/empty for graceful degradation

**Validation errors:**
- Use Zod for schema validation (lib/validation.ts)
- Return 400 with specific error message
- Example: `waitlistSchema`, `newsletterSchema` define validation rules with custom messages

**API Rate Limiting:**
- Check rate limit before processing: `lib/rate-limit.ts` provides `apiLimiter.check()`
- Return 429 (Too Many Requests) when limit exceeded
- Graceful user message: "Please wait before requesting another link"

## Logging

**Framework:** console methods (console.log, console.error, console.warn)

**Patterns:**
- Production builds remove console.log via `removeConsole: true` in next.config.js
- Use console.error for exceptions and operational issues
- Log context-specific information: `console.error('Database error creating membership:', error)`
- Never log PHI (Protected Health Information) — HIPAA compliance
- Log rate limit violations: `console.log('Checkout rate limit exceeded:', { ip: clientIp })`

**Example:**
```typescript
// Log exceptions
catch (error) {
  console.error('Checkout error:', error)
}

// Log specific events
if (!rateLimitResult.success) {
  console.log('Checkout rate limit exceeded:', { ip: clientIp })
}

// Log missing configuration
if (!apiKey) {
  throw new Error('RESEND_API_KEY is not configured')
}
```

## Comments

**When to Comment:**
- Complex business logic that isn't obvious from code
- Non-trivial algorithms or calculations
- Workarounds or temporary solutions (mark with TODO, FIXME, HACK)
- Section dividers for large functions: `// ===========================================`
- Edge cases or gotchas (e.g., "Staging bypass for testing")

**JSDoc/TSDoc:**
- Use for public APIs and exported functions
- Document parameters, return values, and side effects
- Example from codebase:
```typescript
/**
 * Verify authentication for API routes
 * Reads session from cookie or Authorization header
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  ...
}
```

**Not over-commented:**
- Self-documenting code preferred (clear function names, type signatures)
- Avoid redundant comments that just restate the code

## Function Design

**Size:** Keep functions focused and under ~100 lines where practical

**Parameters:**
- Use object parameters (destructuring) for functions with 3+ parameters
- Example: `createMembership(input: CreateMembershipInput)` instead of 5 separate params
- Optional parameters use `?` notation or default values

**Return Values:**
- Explicit return types on all exported functions
- Use discriminated unions for success/error returns (e.g., `{ authenticated: boolean, email: string | null }`)
- Async functions return Promises: `Promise<string>`, `Promise<MembershipEntry | null>`
- Database queries return entity or null: `Promise<WaitlistEntry | null>`
- API handlers return NextResponse with status code

**Example:**
```typescript
// Good: typed params, explicit return, clear logic
export async function createSessionToken(
  email: string,
  customerId: string,
  creatorId?: string,
  role?: 'member' | 'creator' | 'admin'
): Promise<string> {
  return new SignJWT({
    email,
    customerId,
    creatorId: creatorId || undefined,
    role: role || 'member',
    type: 'session',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SESSION_SECRET)
}
```

## Module Design

**Exports:**
- Named exports for functions, interfaces, types, constants
- Default export only for React components (e.g., `export default Button`)
- Barrel files use `export { ... } from '...'` pattern (e.g., `components/intake/index.ts`)

**Barrel Files:**
- Located at `components/intake/index.ts` with pattern:
```typescript
export { PersonalInfoForm } from './PersonalInfoForm'
export { PhysicalMeasurementsForm } from './PhysicalMeasurementsForm'
// ... etc
```

**Config Files:**
- Centralized in `lib/config/`: plans.ts, affiliate.ts, products.ts, quiz.ts, etc.
- Exported constants and types: `export const PLANS`, `export type PlanTier`
- Single source of truth for configuration values

**Context Providers:**
- Located in `lib/contexts/`: CreatorContext.tsx, intake-form-context.tsx, cart-context.tsx
- Use React Context API for shared state
- Export hook: `export function useCreator() { return useContext(CreatorContext) }`

---

*Convention analysis: 2026-03-10*
