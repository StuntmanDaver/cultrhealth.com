# Testing Patterns

**Analysis Date:** 2026-03-22

## Test Framework

**Runner:**
- Vitest ^4.0.18
- Config: `vitest.config.js` (CommonJS format using `require`)
- Environment: `jsdom`

**Assertion Library:**
- Vitest's built-in `expect` + `@testing-library/jest-dom` matchers (extended in setup)

**Run Commands:**
```bash
npm test                      # Run all tests (vitest run)
npm test -- --watch           # Watch mode
npm test -- --coverage        # Coverage report
```

## Test File Organization

**Location:** All tests in `tests/` directory — NOT co-located with source files.

**Naming:** `*.test.ts` or `*.test.tsx`

**Structure:**
```
tests/
├── setup.ts                        # Global setup (mocks, env vars, cleanup)
├── vitest.d.ts                     # Vitest type declarations
├── api/
│   └── protocol-generate.test.ts   # API route handler tests
├── components/
│   └── TierGate.test.tsx           # React component tests
├── integration/
│   └── protocol-engine.test.ts     # Multi-module integration tests
└── lib/
    ├── auth.test.ts                 # Auth utility tests
    ├── library-content.test.ts      # Content utility tests
    ├── plans.test.ts                # Config/data tests
    └── protocol-templates.test.ts   # Business logic tests
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Top-Level Domain', () => {
  describe('Specific Function/Feature', () => {
    it('describes expected behavior', () => {
      // arrange, act, assert
    })
  })
})
```

**Patterns:**
- `beforeEach(() => { vi.clearAllMocks() })` — reset mocks before each test
- `afterEach(() => { vi.restoreAllMocks() })` — restore spies after each test
- React component tests use `afterEach(() => { cleanup() })` via global setup in `tests/setup.ts`
- Named test descriptions follow: `'returns X when Y'`, `'has correct Z'`, `'denies/grants access when...'`

**Data Table Pattern (parametrized tests):**
```typescript
const testCases = [
  { id: 'anxiety', supplements: ['Magnesium glycinate'], peptide: 'Selank' },
  { id: 'insomnia', supplements: ['Glycine'], peptide: 'DSIP' },
]

for (const tc of testCases) {
  it(`${tc.id} has correct interventions`, () => {
    const protocol = getSymptomProtocol(tc.id)
    expect(protocol?.peptide).toBe(tc.peptide)
  })
}
```

**Access Matrix Pattern (exhaustive tier testing):**
```typescript
const tiers = ['club', 'core', 'catalyst', 'concierge'] as const

it('respects tier ordering for access control', () => {
  for (let i = 0; i < tiers.length; i++) {
    for (let j = 0; j <= i; j++) {
      const { unmount } = render(<TierGate requiredTier={tiers[j]} currentTier={tiers[i]}>...)
      expect(screen.getByTestId('content')).toBeInTheDocument()
      unmount()
    }
  }
})
```

## Mocking

**Framework:** Vitest's `vi.mock()` and `vi.fn()`

**Module-level mock pattern:**
```typescript
// Declare mocks before importing the module under test
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
  isProviderEmail: vi.fn(),
}))

vi.mock('@vercel/postgres', () => ({
  sql: vi.fn(),
}))

// Import after mock declarations
import { POST } from '@/app/api/protocol/generate/route'
import * as auth from '@/lib/auth'
```

**Mock implementation in beforeEach:**
```typescript
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auth.getSession).mockResolvedValue({
    email: 'provider@cultrhealth.com',
    customerId: 'cus_123',
  })
  vi.mocked(auth.isProviderEmail).mockReturnValue(true)
})
```

**Async mock that throws:**
```typescript
vi.mocked(asherApi.getPatientById).mockRejectedValue(new Error('Asher Med API error'))
```

**Next.js module mocks (global, in `tests/setup.ts`):**
```typescript
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() })),
  headers: vi.fn(() => new Map()),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`NEXT_REDIRECT:${url}`) }),
  useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn() })),
}))
```

**Next/link mock (per-test-file):**
```typescript
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))
```

**What to Mock:**
- Next.js server modules (`next/headers`, `next/navigation`)
- External API clients (`@/lib/auth`, `@/lib/asher-med-api`, `@vercel/postgres`)
- Services that make network requests in unit/API tests

**What NOT to Mock:**
- Pure functions with no side effects (config objects, algorithms, utilities)
- Business logic under test (e.g., `generateProtocol`, `getLibraryAccess` are tested directly, not mocked)

## Fixtures and Factories

**Request factory (API tests):**
```typescript
function createRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/protocol/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
```

**Inline fixture objects (component tests):**
```typescript
const coreAccess: LibraryAccess = {
  masterIndex: 'titles_only',
  advancedProtocols: false,
  dosingCalculators: false,
  stackingGuides: false,
  providerNotes: false,
  customRequests: false,
}
```

**Location:** No shared fixture files — test data is defined inline within each test file.

## Environment Variables

Test environment variables are set globally in `tests/setup.ts`:
```typescript
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.SESSION_SECRET = 'test-session-secret'
process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
process.env.ASHER_MED_API_KEY = 'test-asher-med-key'
process.env.ASHER_MED_API_URL = 'https://sandbox-api.asherweightloss.com'
process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS = 'provider@cultrhealth.com,admin@cultrhealth.com'
```

## Coverage

**Configuration:**
- Provider: V8
- Reporters: `text`, `json`, `html`
- Includes: `lib/**/*.ts`, `app/**/*.ts`, `app/**/*.tsx`
- Excludes: `**/*.d.ts`, `**/node_modules/**`

**Requirements:** No enforced coverage threshold.

**View Coverage:**
```bash
npm test -- --coverage
```

## Test Types

**Unit Tests (`tests/lib/`):**
- Scope: Pure functions, config validation, algorithm correctness
- No external dependencies — tests run against real implementation
- Files: `auth.test.ts`, `plans.test.ts`, `protocol-templates.test.ts`, `library-content.test.ts`

**Component Tests (`tests/components/`):**
- Scope: React rendering behavior, prop-driven access control
- Uses `@testing-library/react` with `render`, `screen`, `getByTestId`, `getByRole`
- Files: `TierGate.test.tsx`

**API Route Tests (`tests/api/`):**
- Scope: HTTP handler behavior — status codes, response shapes, auth enforcement
- Mocks all external dependencies (auth, DB, external APIs)
- Uses real `NextRequest` constructor
- Files: `protocol-generate.test.ts`

**Integration Tests (`tests/integration/`):**
- Scope: Multi-module flows — tier access → protocol generation → content gating
- Tests real implementations without mocks (pure business logic)
- Files: `protocol-engine.test.ts`

**E2E Tests:** Not used.

## Common Patterns

**Async Testing:**
```typescript
it('returns 401 when no session exists', async () => {
  vi.mocked(auth.getSession).mockResolvedValue(null)

  const request = createRequest({ templateId: 'glp1-standard', patientId: '123' })
  const response = await POST(request)
  const data = await response.json()

  expect(response.status).toBe(401)
  expect(data.error).toBe('Unauthorized')
})
```

**Error Testing:**
```typescript
it('handles API errors gracefully', async () => {
  vi.mocked(asherApi.getPatientById).mockRejectedValue(new Error('Asher Med API error'))

  const response = await POST(request)
  const data = await response.json()

  expect(response.status).toBe(500)
  expect(data.error).toBe('Asher Med API error')
})
```

**Null/undefined edge cases (always test explicitly):**
```typescript
it('handles null currentTier as Club (most restrictive)', () => {
  render(<TierGate requiredTier="core" currentTier={null} upgradeMessage="Upgrade">...)
  expect(screen.getByText('Upgrade')).toBeInTheDocument()
})
```

**Negative assertions:**
```typescript
expect(screen.queryByText('Upgrade to access')).not.toBeInTheDocument()
expect(slugs).not.toContain('index')
```

## Current Test Coverage Summary

| File | What It Tests |
|------|---------------|
| `tests/lib/auth.test.ts` | `getLibraryAccess`, `hasFeatureAccess`, `isProviderEmail` |
| `tests/lib/plans.test.ts` | `PLANS` array structure, `STRIPE_CONFIG`, tier access matrix |
| `tests/lib/protocol-templates.test.ts` | `PROTOCOL_TEMPLATES`, `generateProtocol`, `SYMPTOM_PROTOCOLS` (100+ entries), symptom search/combine |
| `tests/lib/library-content.test.ts` | `CATEGORY_META`, `getCategories`, content filtering logic |
| `tests/components/TierGate.test.tsx` | Tier-based content gating component (access grant/deny, hierarchy) |
| `tests/api/protocol-generate.test.ts` | `/api/protocol/generate` route (auth, validation, error handling) |
| `tests/integration/protocol-engine.test.ts` | Tier → access → protocol generation full flow |

**Not covered:** Checkout flows, intake form submission, creator portal API routes, webhook handlers, admin routes, most database functions, payment providers.

---

*Testing analysis: 2026-03-22*
