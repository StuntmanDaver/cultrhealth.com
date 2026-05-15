# Testing Patterns

**Analysis Date:** 2026-05-15

## Test Framework

**Unit/Integration Runner:**
- Vitest ^4.0.18
- Config: `vitest.config.js` (project root)

**Component Testing:**
- @testing-library/react ^16.3.2
- @testing-library/jest-dom ^6.9.1 (DOM matchers)

**E2E:**
- Playwright (config: `playwright.config.ts`)
- Test directory: `e2e/`

**Assertion Library:**
- Vitest's built-in `expect` extended with jest-dom matchers via `tests/setup.ts`

**Run Commands:**
```bash
npx vitest run              # Run all unit/integration tests once
npx vitest --watch          # Watch mode
npx vitest run --coverage   # Coverage report (V8 provider)
npx playwright test         # Run E2E tests (requires dev server on :3000)
```

## Test File Organization

**Location:** All Vitest tests in `tests/` directory (separate from source, not co-located)

**E2E:** All Playwright specs in `e2e/` directory

**Naming:**
- Unit/integration: `*.test.ts` or `*.test.tsx`
- E2E: `*.spec.ts`

**Directory structure:**
```
tests/
├── setup.ts                     # Global test setup + mocks
├── vitest.d.ts                  # Type augmentation for jest-dom matchers
├── api/                         # API route tests (~38 files)
│   ├── checkout-subscription.test.ts
│   ├── admin-creator-*.test.ts
│   ├── portal-*.test.ts
│   ├── club-*.test.ts
│   └── ...
├── components/                  # Component render tests (~20 files)
│   ├── TierGate.test.tsx
│   ├── ConsentModal.test.tsx
│   ├── JoinLandingClient.test.tsx
│   └── ...
├── lib/                         # Library utility tests (~30 files)
│   ├── auth.test.ts
│   ├── plans.test.ts
│   ├── protocol-templates.test.ts
│   ├── siphox-*.test.ts
│   ├── dosing-calculator/
│   └── dosing-engine/
├── integration/                 # Real-DB + multi-layer integration tests (~5 files)
│   ├── coupon-attribution-e2e.test.ts   # Real Neon DB
│   ├── creator-e2e-jon-collins.test.ts  # Real Neon DB
│   ├── intake-submission-e2e.test.ts
│   └── protocol-engine.test.ts
├── smoke/                       # Lightweight import/rendering smoke tests (~3 files)
│   ├── critical-pages.test.ts
│   ├── critical-apis.test.ts
│   └── middleware-session-timeout.test.ts
└── healthie-url-diagnosis.test.ts  # One-off diagnostic test

e2e/
├── hero-alignment.spec.ts
├── join/landing.spec.ts
├── admin/dashboard.spec.ts
├── dashboards/safari-dashboard-render.spec.ts
├── visual/responsive-layout.spec.ts
└── fixtures/auth.ts
```

## Test Structure

**Suite Organization (AAA pattern):**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Feature Name', () => {
  describe('Sub-feature / scenario', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('describes behavior in plain English', async () => {
      // Arrange
      const input = { ... }

      // Act
      const result = await functionUnderTest(input)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).toEqual({ ... })
    })
  })
})
```

**Naming convention:** Test descriptions are plain-English behavior statements:
- `'returns 401 when no session exists'`
- `'renders children when user tier meets required tier'`
- `'grants access to Concierge for Club-required content'`

**API route test pattern:**
```typescript
// 1. Mock dependencies at top of file
vi.mock('@/lib/auth', () => ({ getSession: vi.fn(), isProviderEmail: vi.fn() }))
vi.mock('@vercel/postgres', () => ({ sql: vi.fn() }))

// 2. Import handler after mocks
import { POST } from '@/app/api/protocol/generate/route'
import * as auth from '@/lib/auth'

// 3. Build request helper
function createRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/...', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// 4. Test groups: Authorization → Validation → Business Logic
describe('Authorization', () => {
  it('returns 401 when no session exists', async () => {
    vi.mocked(auth.getSession).mockResolvedValue(null)
    const response = await POST(createRequest({ ... }))
    expect(response.status).toBe(401)
  })
})
```

## Mocking

**Framework:** `vi` from Vitest

**Global mocks** (defined in `tests/setup.ts`, applied to all tests):
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

**Global env mocks** (in `tests/setup.ts`):
```typescript
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
```

**Per-test mocks:**
```typescript
// Mock modules
vi.mock('@/lib/auth', () => ({ getSession: vi.fn() }))

// Set return values
vi.mocked(auth.getSession).mockResolvedValue({ email: 'provider@cultrhealth.com' })

// Clear between tests
beforeEach(() => { vi.clearAllMocks() })
afterEach(() => { vi.restoreAllMocks() })
```

**Browser API mocks** (in component tests):
```typescript
// IntersectionObserver mock
class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) { ... }
  observe() {}
  disconnect() {}
}
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
```

**What to mock:**
- `next/headers`, `next/navigation` — always (global setup)
- `@vercel/postgres` (`sql`) — in API route unit tests
- External SDKs (Stripe, Resend) — in API route unit tests
- `@/lib/auth` — in route tests to control session state

**What NOT to mock in integration tests:**
- `lib/creators/attribution.ts`, `lib/creators/commission.ts` — tested against real DB in `tests/integration/`

## Fixtures and Factories

**Integration tests** generate unique test data per run using a nonce pattern:
```typescript
// tests/integration/coupon-attribution-e2e.test.ts
const NONCE = Date.now().toString(36).slice(-6)
const TEST_PREFIX = `E2E_${NONCE}`
const CREATOR_EMAIL = `${TEST_PREFIX}_creator@test-e2e.cultrhealth.com`
const CODE_MEMBERSHIP = `${TEST_PREFIX}MEM`
```

Data is created in `beforeAll` and torn down in `afterAll` to prevent test DB pollution.

**No shared fixture files** — each test file defines its own test data inline.

## Smoke Tests

**Critical page smoke tests** (`tests/smoke/critical-pages.test.ts`) — verify page modules can be imported:
```typescript
it('homepage exports a valid page component', async () => {
  const mod = await import('@/app/page')
  expect(mod.default).toBeDefined()
  expect(typeof mod.default).toBe('function')
})
```

**Critical API smoke tests** (`tests/smoke/critical-apis.test.ts`) — verify route handlers export correct HTTP methods

**Middleware smoke tests** (`tests/smoke/middleware-session-timeout.test.ts`) — verify cookie cleanup behavior using `NextRequest` directly without mocking

## E2E Tests (Playwright)

**Config:** `playwright.config.ts`
- Base URL: `http://localhost:3000`
- Timeout: 90s per test
- Retries: 1
- Reporters: HTML + list
- Screenshots/trace/video: on failure/retry only

**Browsers tested:**
- Desktop Chrome, Desktop Safari
- Mobile Chrome (Pixel 5), Mobile Safari (iPhone 14)

**Pattern:**
```typescript
import { test, expect } from '@playwright/test'

test.describe('Hero headline alignment', () => {
  test('headline is positioned over the image', async ({ page, viewport }) => {
    if (!viewport || viewport.width < 768) { test.skip(); return }
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 })
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
  })
})
```

**E2E coverage areas:**
- Hero visual alignment (`e2e/hero-alignment.spec.ts`)
- Join/landing page flow (`e2e/join/landing.spec.ts`)
- Admin dashboard (`e2e/admin/dashboard.spec.ts`)
- Safari dashboard rendering (`e2e/dashboards/safari-dashboard-render.spec.ts`)
- Responsive layout (`e2e/visual/responsive-layout.spec.ts`)

## Coverage

**Provider:** V8

**Target:** No enforced coverage threshold in `vitest.config.js`

**Include scope:**
- `lib/**/*.ts`
- `app/**/*.ts`
- `app/**/*.tsx`

**View coverage:**
```bash
npx vitest run --coverage
# Opens HTML report at coverage/index.html
```

## What Is Tested

**Well covered:**
- Auth utilities (`lib/auth.ts`) — `tests/lib/auth.test.ts`
- Plan config and tier logic (`lib/config/plans.ts`) — `tests/lib/plans.test.ts`
- Creator commission engine (`lib/creators/`) — `tests/integration/coupon-attribution-e2e.test.ts`
- API route auth/validation flows — ~38 files in `tests/api/`
- Component access control (`TierGate`, `ConsentModal`) — `tests/components/`
- Protocol templates (`lib/protocol-templates.ts`) — `tests/lib/protocol-templates.test.ts`
- SiPhox lab integration (`lib/siphox/`) — ~6 test files

**Not tested / gaps:**
- Homepage (`app/page.tsx`) — only smoke-tested for import, not rendered
- Creator portal UI components (`components/creators/`) — no component tests
- Checkout flow end-to-end (Stripe mock only; no full session flow)
- Admin dashboard UI (`app/admin/AdminDashboardClient.tsx`) — no component test
- QuickBooks integration (`lib/quickbooks.ts`) — no test file (complex OAuth2 flow)
- Email delivery (`lib/resend.ts`) — mocked in API tests, no real send tested
- `components/sections/` — 9 files marked legacy, not imported, not tested
- All Markdown library content rendering path

---

*Testing analysis: 2026-05-15*
