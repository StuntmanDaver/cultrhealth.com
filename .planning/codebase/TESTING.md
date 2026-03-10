# Testing Patterns

**Analysis Date:** 2026-03-10

## Test Framework

**Runner:**
- Vitest ^4.0.18
- Config: `vitest.config.js`
- Environment: jsdom (browser-like environment)
- Plugin: @vitejs/plugin-react

**Assertion Library:**
- Vitest built-in expect() with @testing-library/jest-dom matchers
- React Testing Library ^16.3.2 for component testing
- Custom matchers loaded in setup: `expect.extend(matchers)` in `tests/setup.ts`

**Run Commands:**
```bash
npm test                    # Run all tests once
npm test -- --watch        # Watch mode (auto-rerun on changes)
npm test -- --coverage     # Coverage report (V8 provider)
```

## Test File Organization

**Location:**
- Co-located with source files in dedicated `tests/` directory
- Structure mirrors source structure: `tests/lib/`, `tests/api/`, `tests/components/`, `tests/integration/`
- Exclude tests from tsconfig.json compilation (tests are excluded in include array)

**Naming:**
- `*.test.ts` for utility/library tests
- `*.test.tsx` for React component tests
- Example: `tests/lib/auth.test.ts`, `tests/components/TierGate.test.tsx`

**Structure:**
```
tests/
├── setup.ts                 # Global test setup (mocks, matchers, env vars)
├── vitest.d.ts              # Vitest type declarations
├── api/
│   └── protocol-generate.test.ts
├── components/
│   └── TierGate.test.tsx
├── integration/
│   └── protocol-engine.test.ts
└── lib/
    ├── auth.test.ts
    ├── library-content.test.ts
    ├── plans.test.ts
    └── protocol-templates.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
describe('Module/Feature Name', () => {
  describe('Specific Function/Component', () => {
    it('should do specific thing', () => {
      // Arrange
      const input = { ... }

      // Act
      const result = functionUnderTest(input)

      // Assert
      expect(result).toBe(expectedValue)
    })
  })
})
```

**Patterns:**

1. **Unit Test (Library Function):**
```typescript
// tests/lib/auth.test.ts
import { describe, it, expect } from 'vitest'
import { getLibraryAccess, hasFeatureAccess } from '@/lib/auth'

describe('Library Access', () => {
  describe('getLibraryAccess', () => {
    it('returns restricted access for Club tier (free)', () => {
      const access = getLibraryAccess('club')
      expect(access.masterIndex).toBe('full')
      expect(access.advancedProtocols).toBe(false)
      expect(access.dosingCalculators).toBe(true)
    })

    it('defaults to Club access for null tier', () => {
      const access = getLibraryAccess(null)
      expect(access.masterIndex).toBe('full')
    })
  })
})
```

2. **Component Test (React):**
```typescript
// tests/components/TierGate.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TierGate } from '@/components/library/TierGate'

describe('TierGate Component', () => {
  describe('Access granted', () => {
    it('renders children when user tier meets required tier', () => {
      render(
        <TierGate
          requiredTier="catalyst"
          currentTier="catalyst"
          upgradeMessage="Upgrade to access"
        >
          <div data-testid="protected-content">Protected Content</div>
        </TierGate>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(screen.queryByText('Upgrade to access')).not.toBeInTheDocument()
    })
  })
})
```

3. **API Route Test:**
```typescript
// tests/api/protocol-generate.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/protocol/generate/route'
import * as auth from '@/lib/auth'

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
  isProviderEmail: vi.fn(),
}))

describe('Protocol Generate API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 401 when no session exists', async () => {
    vi.mocked(auth.getSession).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/protocol/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId: 'glp1-standard', patientId: '123' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })
})
```

## Mocking

**Framework:** Vitest's `vi` module

**Patterns:**

1. **Module Mocking:**
```typescript
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
  isProviderEmail: vi.fn(),
}))

// Then use in test:
vi.mocked(auth.getSession).mockResolvedValue({ email: 'test@example.com', ... })
```

2. **Next.js Mocking (in tests/setup.ts):**
```typescript
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => new Map()),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  }),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
}))
```

3. **Component Mocking (next/link):**
```typescript
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))
```

**What to Mock:**
- External services (APIs, databases)
- Next.js modules (headers, cookies, navigation, router)
- Third-party libraries if they have side effects

**What NOT to Mock:**
- Functions you're testing (test the real implementation)
- Zod schemas or validation logic (test with real data)
- Utility functions like `cn()` or date calculations
- Component logic being tested

## Fixtures and Factories

**Test Data:**
- Inline test data in test files (no factory library)
- Example from tests:
```typescript
function createRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/protocol/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
```

**Location:**
- Fixtures: Create inline in test file as helper functions or constants
- No dedicated fixtures directory (keep tests self-contained)

**Pattern:**
```typescript
const mockPlan = {
  slug: 'catalyst',
  name: 'CULTR Catalyst+',
  price: 499,
  // ... etc
}

it('validates plan structure', () => {
  expect(mockPlan.slug).toBe('catalyst')
})
```

## Coverage

**Requirements:** No explicit coverage target enforced (tracked for reference)

**Configuration (vitest.config.js):**
```javascript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  include: ['lib/**/*.ts', 'app/**/*.ts', 'app/**/*.tsx'],
  exclude: ['**/*.d.ts', '**/node_modules/**'],
}
```

**View Coverage:**
```bash
npm test -- --coverage
```

Generates:
- Console output (text reporter)
- `coverage/` directory with detailed HTML report
- `coverage.json` for CI integration

## Test Types

**Unit Tests:**
- Scope: Single function or utility in isolation
- Location: `tests/lib/` for library functions
- Example: `auth.test.ts` tests `getLibraryAccess()`, `hasFeatureAccess()`, `isProviderEmail()`
- Approach: Mock external dependencies, test with various inputs (happy path + edge cases)
- 7 test files, 171 tests total passing

**Integration Tests:**
- Scope: Multiple units working together (functions + database + config)
- Location: `tests/integration/`
- Example: `protocol-engine.test.ts` tests tier access → protocol generation flow
- Approach: Test real function implementations together, verify data flows correctly
- Tests: Tier normalization, template validation, parameter interpolation

**E2E Tests:**
- Status: Not currently implemented
- Framework: Not configured
- Future: Would use Playwright or Cypress for browser-based tests

## Common Patterns

**Async Testing:**
```typescript
it('returns user when authenticated', async () => {
  vi.mocked(auth.getSession).mockResolvedValue({
    email: 'provider@cultrhealth.com',
    customerId: 'cus_123',
  })

  const request = createRequest({ templateId: 'glp1-standard', patientId: '123' })
  const response = await POST(request)

  expect(response.status).toBe(200)
})
```

**Error Testing:**
```typescript
it('returns 400 when templateId is missing', async () => {
  const request = createRequest({ patientId: '123' })
  const response = await POST(request)
  const data = await response.json()

  expect(response.status).toBe(400)
  expect(data.error).toBe('Template/Symptoms and patientId are required')
})

it('handles API errors gracefully', async () => {
  vi.mocked(asherApi.getPatientById).mockRejectedValue(
    new Error('Asher Med API error')
  )

  const request = createRequest({
    templateId: 'glp1-standard',
    patientId: '123',
  })

  const response = await POST(request)
  const data = await response.json()

  expect(response.status).toBe(500)
  expect(data.error).toBe('Asher Med API error')
})
```

**Component State Testing:**
```typescript
it('shows upgrade message when user tier is below required tier', () => {
  render(
    <TierGate
      requiredTier="catalyst"
      currentTier="core"
      upgradeMessage="Upgrade to Catalyst+ to unlock"
    >
      <div data-testid="protected-content">Protected Content</div>
    </TierGate>
  )

  expect(screen.getByText('Upgrade to Catalyst+ to unlock')).toBeInTheDocument()
  expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
})
```

**Test Isolation:**
```typescript
beforeEach(() => {
  vi.clearAllMocks()  // Reset all mocks before each test
})

afterEach(() => {
  vi.restoreAllMocks()  // Clean up after each test
  cleanup()  // Clean up React Testing Library (setup.ts)
})
```

## Environment Setup

**Global Setup (tests/setup.ts):**
- Loads jest-dom matchers
- Auto cleanup after each test (React Testing Library)
- Mocks Next.js modules globally
- Sets test environment variables

**Environment Variables (for tests):**
```typescript
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.SESSION_SECRET = 'test-session-secret'
process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
process.env.ASHER_MED_API_KEY = 'test-asher-med-key'
process.env.ASHER_MED_API_URL = 'https://sandbox-api.asherweightloss.com'
process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS = 'provider@cultrhealth.com,admin@cultrhealth.com'
```

---

*Testing analysis: 2026-03-10*
