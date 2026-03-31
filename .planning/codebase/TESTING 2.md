# Testing Patterns

**Analysis Date:** 2026-03-11

## Test Framework

**Runner:**
- Vitest ^4.0.18
- Config: `vitest.config.js` (CommonJS format, `module.exports = defineConfig(...)`)

**Assertion Library:**
- Vitest built-in `expect` extended with `@testing-library/jest-dom` matchers
- Extension happens in `tests/setup.ts`: `expect.extend(matchers)`

**Run Commands:**
```bash
npm test                  # Run all tests once
npm test -- --watch       # Watch mode
npm test -- --coverage    # Coverage report (V8 provider)
```

## Test File Organization

**Location:**
- Separate `tests/` directory at project root (NOT co-located with source)
- Mirrors the source structure loosely

**Naming:**
- `*.test.ts` for pure logic tests
- `*.test.tsx` for React component tests

**Structure:**
```
tests/
├── setup.ts                         # Global setup: jest-dom matchers, Next.js mocks, env vars
├── vitest.d.ts                       # Vitest type declarations
├── api/                             # API route handler tests
│   ├── intake-submit.test.ts        # Tests for utility functions used by intake API
│   ├── portal-logout.test.ts
│   ├── portal-refresh.test.ts
│   ├── portal-send-otp.test.ts
│   ├── portal-verify-otp.test.ts
│   └── protocol-generate.test.ts   # Tests for POST /api/protocol/generate
├── components/                      # React component tests
│   ├── PortalLogin.test.tsx
│   └── TierGate.test.tsx
├── integration/
│   └── protocol-engine.test.ts     # Cross-module integration tests
└── lib/                            # Library/utility unit tests
    ├── auth.test.ts
    ├── library-content.test.ts
    ├── plans.test.ts
    ├── portal-auth.test.ts
    └── protocol-templates.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Module/Component Name', () => {
  describe('function or feature', () => {
    it('describes the expected behavior in plain English', () => {
      // arrange → act → assert
      const result = functionUnderTest(input)
      expect(result).toBe(expectedValue)
    })
  })
})
```

**Patterns:**
- Multi-level `describe` nesting: outer = module/component, inner = function or scenario group (e.g., "Access granted", "Access denied", "Edge cases")
- `beforeEach(() => vi.clearAllMocks())` — standard setup in files that use mocks
- `afterEach(() => vi.restoreAllMocks())` — used in API tests to restore spies
- `cleanup()` from `@testing-library/react` called in global `afterEach` via `tests/setup.ts`
- Helper factory functions defined inside `describe` blocks: `function createRequest(body: object): NextRequest { ... }`

**Shared test data pattern (matrix testing):**
```typescript
// From tests/lib/plans.test.ts
const accessMatrix = [
  { tier: 'club', advancedProtocols: false, providerNotes: false },
  { tier: 'concierge', advancedProtocols: true, providerNotes: true },
]

for (const expected of accessMatrix) {
  it(`${expected.tier} tier has correct access`, () => {
    // ...
  })
}
```

## Mocking

**Framework:** Vitest `vi` (built-in)

**Module-level mocks (declared before imports):**
```typescript
// Mock before importing the module under test
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
  isProviderEmail: vi.fn(),
}))

vi.mock('@vercel/postgres', () => ({
  sql: vi.fn(),
}))

// Then import
import { POST } from '@/app/api/protocol/generate/route'
import * as auth from '@/lib/auth'
```

**Global mocks (in `tests/setup.ts`):**
```typescript
// next/headers mock — always available
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => new Map()),
}))

// next/navigation mock — throws on redirect/notFound to enable assertions
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`NEXT_REDIRECT:${url}`) }),
  notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND') }),
  useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn() })),
}))
```

**Per-test mock overrides:**
```typescript
beforeEach(() => {
  vi.mocked(auth.getSession).mockResolvedValue({
    email: 'provider@cultrhealth.com',
    customerId: 'cus_123',
  })
  vi.mocked(auth.isProviderEmail).mockReturnValue(true)
})
```

**Mock cookies with per-test return values:**
```typescript
vi.mocked(cookies).mockResolvedValue({
  get: vi.fn().mockImplementation((name: string) => {
    if (name === PORTAL_ACCESS_COOKIE) return { value: token }
    return undefined
  }),
  set: mockSet,
  delete: vi.fn(),
} as any)
```

**NextResponse mock (for node environment tests):**
```typescript
// In portal-send-otp.test.ts — full manual mock of NextResponse
vi.mock('next/server', () => {
  class MockNextResponse {
    body: unknown
    status: number
    constructor(body: string | null, init?: { status?: number }) {
      this.body = body ? JSON.parse(body) : null
      this.status = init?.status || 200
    }
    async json() { return this.body }
    static json(data: unknown, init?: { status?: number }) {
      return new MockNextResponse(JSON.stringify(data), init)
    }
  }
  return { NextResponse: MockNextResponse }
})
```

**What to Mock:**
- `@vercel/postgres` (`sql`) — never hit real DB in tests
- `next/headers` (`cookies`, `headers`) — always mocked globally
- `next/navigation` (`redirect`, `useRouter`) — always mocked globally
- `next/link` — mocked in component tests as simple `<a href>` wrapper
- External API clients (`@/lib/auth`, `@/lib/asher-med-api`) when testing API routes
- `@/lib/rate-limit` — mocked to return `{ success: true }` by default

**What NOT to Mock:**
- Pure utility functions being tested directly (e.g., `buildPartnerNote`, `formatMedicationsList`, `cn()`)
- Config data modules (e.g., `@/lib/config/plans`) — import and test real data
- `jose` JWT library — used directly with test secrets to test real token behavior

## Fixtures and Factories

**Test Data:**
```typescript
// Inline object literals are the norm — no factory files
const testPhone = '+15551234567'
const testPatientId = 42

// Request factory function pattern (in API tests)
function createRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/protocol/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
```

**Environment variables (set in `tests/setup.ts`):**
```typescript
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.SESSION_SECRET = 'test-session-secret'
process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
process.env.ASHER_MED_API_KEY = 'test-asher-med-key'
process.env.ASHER_MED_API_URL = 'https://sandbox-api.asherweightloss.com'
process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS = 'provider@cultrhealth.com,admin@cultrhealth.com'
```

**Location:**
- No separate fixture files — all test data is inline within test files
- No factory functions in shared files — factories are defined locally per test file

## Coverage

**Requirements:** No enforced minimum thresholds — coverage is generated but not gated

**Configuration:**
- Provider: V8 (built into Vitest)
- Reporters: `text` (console), `json`, `html`
- Includes: `lib/**/*.ts`, `app/**/*.ts`, `app/**/*.tsx`
- Excludes: `**/*.d.ts`, `**/node_modules/**`

**View Coverage:**
```bash
npm test -- --coverage
# HTML report generated in coverage/ directory
```

## Test Types

**Unit Tests (`tests/lib/`):**
- Test individual exported functions in isolation
- Import the real module, pass test inputs, assert outputs
- Files: `auth.test.ts`, `plans.test.ts`, `library-content.test.ts`, `portal-auth.test.ts`, `protocol-templates.test.ts`

**API Route Tests (`tests/api/`):**
- Test HTTP handler functions (`GET`, `POST`) end-to-end within Node
- Mock all external dependencies (DB, auth, external APIs)
- Assert HTTP status codes and JSON response shapes
- Files: `protocol-generate.test.ts`, `portal-send-otp.test.ts`, `portal-verify-otp.test.ts`, etc.

**Component Tests (`tests/components/`):**
- Use `@testing-library/react` `render` + `screen` queries
- Test user-visible behavior (presence of text, links, button attributes)
- Files: `TierGate.test.tsx`, `PortalLogin.test.tsx`

**Integration Tests (`tests/integration/`):**
- Test interaction between real modules (no mocks of internal code)
- Example: `protocol-engine.test.ts` tests `getLibraryAccess` → `generateProtocol` → content interpolation flow
- Only external dependencies (DB, Next.js) are mocked

## Common Patterns

**Vitest environment override (for Node-only code):**
```typescript
// @vitest-environment node
// Placed at the very top of test files that must not run in jsdom
import { describe, it, expect } from 'vitest'
```
Used in: `tests/lib/portal-auth.test.ts`, `tests/api/portal-send-otp.test.ts`

**Async Testing:**
```typescript
it('round-trips a valid access token', async () => {
  const token = await createPortalAccessToken(testPhone, testPatientId)
  const session = await verifyPortalAccessToken(token)
  expect(session).not.toBeNull()
  expect(session!.phone).toBe(testPhone)
})
```

**Null/undefined edge case testing:**
```typescript
it('defaults to Club access for null tier', () => {
  const access = getLibraryAccess(null)
  expect(access.advancedProtocols).toBe(false)
})

it('handles null currentTier as Club (most restrictive)', () => {
  render(<TierGate requiredTier="core" currentTier={null} upgradeMessage="Upgrade">
    <div data-testid="content">Content</div>
  </TierGate>)
  expect(screen.getByText('Upgrade')).toBeInTheDocument()
})
```

**Error/rejection testing:**
```typescript
it('handles API errors gracefully', async () => {
  vi.mocked(asherApi.getPatientById).mockRejectedValue(new Error('Asher Med API error'))
  const response = await POST(request)
  const data = await response.json()
  expect(response.status).toBe(500)
  expect(data.error).toBe('Asher Med API error')
})
```

**Token expiry testing (using `jose` directly to craft expired tokens):**
```typescript
it('access token becomes invalid after expiry', async () => {
  const secret = new TextEncoder().encode(process.env.SESSION_SECRET)
  const token = await new SignJWT({ phone: testPhone, type: 'portal_access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('0s') // already expired
    .sign(secret)
  const session = await verifyPortalAccessToken(token)
  expect(session).toBeNull()
})
```

**Component render + query pattern:**
```typescript
it('renders children when user tier meets required tier', () => {
  render(
    <TierGate requiredTier="catalyst" currentTier="catalyst" upgradeMessage="Upgrade to access">
      <div data-testid="protected-content">Protected Content</div>
    </TierGate>
  )
  expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  expect(screen.queryByText('Upgrade to access')).not.toBeInTheDocument()
})
```

**Loop-based exhaustive testing (tier hierarchy):**
```typescript
const tiers = ['club', 'core', 'catalyst', 'concierge'] as const
it('respects tier ordering', () => {
  for (let i = 0; i < tiers.length; i++) {
    for (let j = 0; j <= i; j++) {
      const { unmount } = render(<TierGate requiredTier={tiers[j]} currentTier={tiers[i]} ...>)
      expect(screen.getByTestId('content')).toBeInTheDocument()
      unmount()
    }
  }
})
```

---

*Testing analysis: 2026-03-11*
