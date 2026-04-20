# Testing Patterns
*Last updated: 2026-04-20*
*Scope: cultrhealth.com + cultrclub.com*

Testing is heavily asymmetric between the two apps. cultrhealth has a mature ~90-file Vitest suite plus Playwright E2E. cultrclub has no tests at all — zero Vitest, zero Playwright, no dev dependencies for testing — and leans on shared helpers from cultrhealth, tight runtime error handling, and Cloudflare Pages preview deploys.

- **cultrhealth.com** → `/Users/davidk/Documents/Dev-Projects/App-Ideas/Cultr Health Website/`
- **cultrclub.com** → `/Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/`

---

## 1. cultrhealth.com — Vitest Test Suite

### Framework

| Package | Version | Purpose |
|---|---|---|
| `vitest` | `^4.0.18` | Runner + assertion library |
| `@vitejs/plugin-react` | `^5.1.2` | JSX transform for React components |
| `@testing-library/react` | `^16.3.2` | `render`, `screen`, `fireEvent` helpers |
| `@testing-library/dom` | `^10.4.1` | DOM querying primitives |
| `@testing-library/jest-dom` | `^6.9.1` | `.toBeInTheDocument()` matchers |
| `jsdom` | `^27.4.0` | Default browser-like environment |

### Configuration — `vitest.config.js`
```javascript
const { defineConfig } = require('vitest/config')
const react = require('@vitejs/plugin-react')
const path = require('path')

module.exports = defineConfig({
  plugins: [react.default()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['./tests/**/*.test.ts', './tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.ts', 'app/**/*.ts', 'app/**/*.tsx'],
      exclude: ['**/*.d.ts', '**/node_modules/**'],
    },
  },
  resolve: {
    alias: { '@': __dirname },
  },
})
```

Notes:
- CommonJS config (uses `require`) — matches the loose TS config (`strict: false`, `allowJs: true`).
- Path alias `@/*` → repo root, mirroring `tsconfig.json`.
- `globals: true` — no need to `import { describe, it, expect } from 'vitest'` (though most files still do explicitly for clarity).
- Default env is `jsdom`; individual files may override with `// @vitest-environment node` at the top.

### Setup — `tests/setup.ts`
```typescript
import { vi, expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)
afterEach(() => { cleanup() })

// Next.js server modules mocked globally
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() })),
  headers: vi.fn(() => new Map()),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`NEXT_REDIRECT:${url}`) }),
  notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND') }),
  useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn() })),
}))

// Test env vars — must be set before any @/lib imports
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.SESSION_SECRET = 'test-session-secret'
process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS = 'provider@cultrhealth.com,admin@cultrhealth.com'
process.env.MAILCHIMP_API_KEY = 'test-mailchimp-key-us1'
process.env.MAILCHIMP_AUDIENCE_ID = 'test-audience-123'
process.env.MAILCHIMP_SERVER_PREFIX = 'us1'
```

### Test file organization

All tests live under `tests/` — NOT co-located with source. Naming: `kebab-case.test.ts` for logic, `PascalCase.test.tsx` for components.

```
tests/
├── setup.ts
├── vitest.d.ts
├── healthie-url-diagnosis.test.ts
├── api/               (32 files)
├── components/        (24 files)
├── integration/       (5 files)
├── lib/               (23 files + dosing-engine/ subdir)
└── smoke/             (4 files)
```

Total: ~89 test files.

### Test files by area

**`tests/api/` — 32 API route handler tests**
| File | Purpose |
|---|---|
| `admin-club-order-approve-attribution.test.ts` | Admin approval flow writes attribution correctly |
| `admin-club-order-attribution-sync.test.ts` | Retroactive attribution on approval |
| `admin-club-order-status-suppress-emails.test.ts` | Manual-processing flow skips customer emails |
| `admin-creator-add-route.test.ts` | Admin creates creator records |
| `admin-creator-approve-route.test.ts` | Admin approves pending creators |
| `admin-creator-auth-and-payouts.test.ts` | Admin payout batch auth |
| `admin-creator-codes.test.ts` | Admin manages affiliate codes |
| `admin-creator-impersonate-route.test.ts` | "Login As" session masquerade |
| `admin-member-add.test.ts` | Admin creates member records |
| `checkout-subscription.test.ts` | Stripe subscription checkout session creation |
| `club-orders-catalog-sync.test.ts` | Club order items sync to product catalog |
| `club-session-cookie.test.ts` | Club visitor cookie lifecycle |
| `club-validate-coupon.test.ts` | Unified coupon validation endpoint |
| `creator-apply-route.test.ts` | Creator application submission + Turnstile |
| `creator-magic-link-route.test.ts` | Creator login email (incl. staging bypass) |
| `creator-verify-email-route.test.ts` | Creator email verification via GET + POST |
| `cron-siphox-fulfillment.test.ts` | SiPhox lab-kit fulfillment cron |
| `intake-submit.test.ts` | Medical intake submission + pending-intake linkage |
| `portal-documents.test.ts` | Portal document fetch |
| `portal-labs-register.test.ts` | SiPhox kit registration |
| `portal-labs-validate.test.ts` | Kit code validation |
| `portal-labs.test.ts` | Labs dashboard data |
| `portal-logout.test.ts` | Portal logout cookie clearing |
| `portal-order-detail.test.ts` | Single-order detail fetch |
| `portal-orders.test.ts` | Orders list |
| `portal-profile.test.ts` | Profile read/update |
| `portal-refresh.test.ts` | Session refresh |
| `portal-results.test.ts` | Lab results retrieval |
| `portal-send-otp.test.ts` | OTP send (magic link) |
| `portal-verify-otp.test.ts` | OTP verify |
| `protocol-generate.test.ts` | AI protocol generation (auth, validation, AI mock) |
| `stripe-webhook-attribution.test.ts` | Stripe webhook → commission ledger |

**`tests/components/` — 24 React component tests**
| File | Purpose |
|---|---|
| `AppleCardsCarousel.test.tsx` | Carousel navigation + a11y |
| `BiomarkerCategoryCard.test.tsx` | Category card rendering |
| `BiomarkerDetailModal.test.tsx` | Modal open/close + content |
| `ClubOrderBulkActions.test.tsx` | Admin bulk-action UI |
| `ClubOrdersTab.test.tsx` | Admin club-orders tab (distinct from product orders) |
| `ClubOrderStageControls.test.tsx` | Pipeline stage transitions |
| `ConsentModal.test.tsx` | Scroll-gated consent + IntersectionObserver |
| `CouponsClient.test.tsx` | Admin coupon management UI |
| `FloridaStateGate.test.tsx` | FL-only jurisdiction gating |
| `HomePageHero.test.tsx` | Hero headline + CTA alignment |
| `IntakeFormClient.test.tsx` | Multi-step intake form navigation |
| `JoinCartContext.test.tsx` | Cart state (for cultrhealth's `/join-club`) |
| `JoinLandingClient.test.tsx` | Landing + signup modal (for cultrhealth's `/join-club`) |
| `KitEmptyState.test.tsx` | Empty kit dashboard state |
| `KitRegistrationForm.test.tsx` | Kit code input + validation |
| `KitTimeline.test.tsx` | Kit status timeline stepper |
| `LabsClient.test.tsx` | Labs dashboard client component |
| `LabsResultsView.test.tsx` | Results chart rendering |
| `MemberLogin.test.tsx` | Member magic-link login UI |
| `OnboardingClient.test.tsx` | Onboarding step routing (post-checkout) |
| `OrdersClient.test.tsx` | Member orders view |
| `PortalDashboard.test.tsx` | Creator portal dashboard layout |
| `PortalLogin.test.tsx` | Creator portal login |
| `TierGate.test.tsx` | Tier-based access control + null-tier matrix |

**`tests/integration/` — 5 multi-module tests**
| File | Purpose |
|---|---|
| `coupon-attribution-e2e.test.ts` | **Real staging Neon DB**: full creator coupon → commission → dashboard flow (14 tests). Loads `.env.local`, uses `Date.now()` nonce for test isolation. |
| `creator-e2e-jon-collins.test.ts` | Full creator lifecycle (apply → approve → attribute → reverse) with DB mocks |
| `intake-submission-e2e.test.ts` | Intake form → pending-intake row → session linkage |
| `protocol-engine.test.ts` | Pure protocol engine logic (no DB, no AI) |
| `healthie-availability-diagnosis.test.ts` | Healthie EHR scheduling URL diagnostics |

**`tests/lib/` — 23 unit-test files + `dosing-engine/engine.test.ts` subdir**
| File | Purpose |
|---|---|
| `admin-creator-metrics-sync.test.ts` | Admin metrics aggregation correctness |
| `auth.test.ts` | JWT sign/verify, session management, role checks |
| `biomarker-mapping.test.ts` | Biomarker name → category mapping |
| `coupons.test.ts` | Unified coupon validator (CLUB_COUPONS + creator codes) |
| `creator-links-sync.test.ts` | Tracking link generation + attribution |
| `creator-order-stats-sync.test.ts` | Per-creator revenue aggregation |
| `creator-payout-lifecycle.test.ts` | Payout batch state transitions |
| `dosing-engine/engine.test.ts` | Peptide dosing algorithm |
| `join-therapies.test.ts` | Bundle discount math, coupon policy |
| `kit-lifecycle.test.ts` | SiPhox kit status machine |
| `library-content.test.ts` | Markdown library loading + frontmatter |
| `links.test.ts` | Centralized URL registry (`LINKS`) |
| `mailchimp.test.ts` | Mailchimp sync with tags + merge fields |
| `plans.test.ts` | Tier config (Club/Core/Catalyst/Concierge) |
| `portal-auth.test.ts` | Creator portal JWT + cookie utilities |
| `portal-db.test.ts` | Portal DB query helpers |
| `portal-orders.test.ts` | Portal order query helpers |
| `protocol-templates.test.ts` | Protocol template validation |
| `report-processing.test.ts` | Lab report ingestion |
| `siphox-biomarkers.test.ts` | SiPhox biomarker parsing |
| `siphox-client.test.ts` | SiPhox API client |
| `siphox-db.test.ts` | SiPhox persistence |
| `siphox-fulfillment.test.ts` | SiPhox fulfillment pipeline |
| `siphox-schemas.test.ts` | Zod schemas for SiPhox payloads |

**`tests/smoke/` — 4 lightweight module-export checks**
| File | Purpose |
|---|---|
| `critical-apis.test.ts` | 8 critical API routes export the correct HTTP handlers |
| `critical-pages.test.ts` | 11 critical pages export a default component |
| `join-routing.test.ts` | Join domain middleware rewrites |
| `middleware-session-timeout.test.ts` | Session timeout redirect logic |

Example pattern:
```typescript
it('checkout route exports POST handler', async () => {
  const mod = await import('@/app/api/checkout/route')
  expect(mod.POST).toBeDefined()
  expect(typeof mod.POST).toBe('function')
})
```

Smoke tests are the fastest way to catch broken imports / missing exports that would otherwise only surface as production 404s or 405s.

### Run commands

```bash
npx vitest run              # Run all tests once
npx vitest --watch          # Watch mode
npx vitest run --coverage   # Coverage report (V8 provider)
npm run test:smoke          # Smoke-only (fast CI gate): vitest run tests/smoke/
```

`package.json` scripts:
```json
"test:smoke": "vitest run tests/smoke/",
"test:e2e": "playwright test",
"test:e2e:join": "playwright test e2e/join/",
"test:e2e:admin": "playwright test e2e/admin/",
"test:e2e:visual": "playwright test e2e/visual/",
"test:e2e:mobile": "playwright test --project='Mobile Chrome' --project='Mobile Safari'",
"test:e2e:webkit": "playwright test --project='Desktop Safari' --project='Mobile Safari'"
```

### Test patterns

**Suite structure:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Top-Level Domain', () => {
  describe('Specific Feature', () => {
    beforeEach(() => { vi.clearAllMocks() })
    afterEach(() => { vi.restoreAllMocks() })

    it('returns X when Y', () => { /* arrange, act, assert */ })
    it('handles null edge case', () => { /* ... */ })
  })
})
```

**Module mocking (declare BEFORE imports):**
```typescript
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
  isProviderEmail: vi.fn(),
}))

vi.mock('@vercel/postgres', () => ({
  sql: vi.fn(),
  db: { connect: vi.fn(() => Promise.resolve(mockClient)) },
}))

// Module under test imported AFTER mocks
import { POST } from '@/app/api/protocol/generate/route'
import * as auth from '@/lib/auth'
```

**`vi.hoisted()` for complex setups** (avoids hoisting issues with destructured mocks):
```typescript
const { mockGetAffiliateCodeByCode, mockGetCreatorById } = vi.hoisted(() => ({
  mockGetAffiliateCodeByCode: vi.fn(),
  mockGetCreatorById: vi.fn(),
}))
vi.mock('@/lib/creators/db', () => ({
  getAffiliateCodeByCode: mockGetAffiliateCodeByCode,
  getCreatorById: mockGetCreatorById,
}))
```

**Parameterized tier matrix:**
```typescript
const tiers = ['club', 'core', 'catalyst', 'concierge'] as const
for (let i = 0; i < tiers.length; i++) {
  for (let j = 0; j <= i; j++) {
    it(`${tiers[i]} can access ${tiers[j]}-gated content`, () => { /* ... */ })
  }
}
```

**Request factory (API tests):**
```typescript
function createRequest(body: Record<string, unknown>, cookies?: Record<string, string>) {
  const req = new NextRequest('http://localhost:3000/api/feature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (cookies) for (const [n, v] of Object.entries(cookies)) req.cookies.set(n, v)
  return req
}
```

**Redirect assertion (works with the global `redirect` mock that throws):**
```typescript
await expect(renderServerComponent()).rejects.toThrow('NEXT_REDIRECT:/login')
```

**Real-DB integration test setup:**
```typescript
// @vitest-environment node
import { config } from 'dotenv'
config({ path: '.env.local' })   // MUST run before any @/lib import that reads POSTGRES_URL

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
const NONCE = Date.now().toString(36).slice(-6)
const TEST_PREFIX = `E2E_${NONCE}`   // Unique per run — avoids collisions on shared staging DB
```

### Coverage

V8 provider, reports to text/json/html. No enforced threshold.

```bash
npx vitest run --coverage
```

**Well-covered areas:**
- Auth / JWT (`lib/auth.test.ts`)
- Tier access / plan config (`lib/plans.test.ts`)
- Protocol templates (`lib/protocol-templates.test.ts`)
- Coupon validation (`lib/coupons.test.ts`, `api/club-validate-coupon.test.ts`)
- SiPhox lab integration (5 test files)
- Creator portal auth + earnings (`lib/portal-auth.test.ts`, `lib/creator-*.test.ts`)
- Critical component states (TierGate, ConsentModal, KitTimeline, ClubOrdersTab)
- Stripe webhook attribution (`api/stripe-webhook-attribution.test.ts`)
- Full creator-coupon E2E against real DB (`integration/coupon-attribution-e2e.test.ts`, 14 tests)

**Coverage gaps (no tests):**
- Webhook handlers for Affirm, Klarna, Authorize.net (`app/api/webhook/affirm/`, `/klarna/`, `/authorize-net/`)
- `lib/db.ts` — no unit tests on the DB helper itself
- Admin analytics route (`app/api/admin/analytics/route.ts`)
- Renewal flow (`app/api/renewal/check/`, `/submit/`)
- Meal-plan AI generation (`app/api/meal-plan/`)
- Creator dashboard metrics API (`app/api/creators/dashboard/`)
- QuickBooks integration (`lib/quickbooks.ts`)
- BNPL API clients (`lib/payments/affirm-api.ts`, `klarna-api.ts`, `authorize-net-api.ts`)
- Asher Med removal left several orphaned test fixtures (cleaned but worth auditing)

### Playwright E2E (`playwright.config.ts` + `e2e/`)

```typescript
// playwright.config.ts
{
  testDir: './e2e',
  timeout: 90000,
  retries: 1,
  fullyParallel: true,
  reporter: [['html', { ... }], ['list']],
  webServer: { command: 'npm run dev', port: 3000, timeout: 120_000 },
  projects: [
    'Desktop Chrome', 'Desktop Safari',
    'Mobile Chrome' (Pixel 5), 'Mobile Safari' (iPhone 14),
  ],
}
```

**E2E test files:**
- `e2e/admin/dashboard.spec.ts` — admin dashboard smoke flow
- `e2e/dashboards/safari-dashboard-render.spec.ts` — Safari-specific dashboard rendering
- `e2e/join/landing.spec.ts` — join landing page flow (for cultrhealth's `/join-club`)
- `e2e/visual/responsive-layout.spec.ts` — visual regression across breakpoints
- `e2e/hero-alignment.spec.ts` — hero headline positioning
- `e2e/healthie-availability-diagnosis.spec.ts` — Healthie embed diagnostics
- `e2e/fixtures/` — shared test fixtures

---

## 2. cultrclub.com — No Test Suite

**Current state:** zero tests. `package.json` has no test script, no test framework dev dependency, no `tests/` or `__tests__/` directory, no Vitest config, no Playwright config.

```json
// package.json scripts — NO test entries
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "build:cf": "npx @cloudflare/next-on-pages@1",
  "start": "next start",
  "preview": "npx wrangler pages dev .vercel/output/static",
  "deploy:staging": "npx wrangler pages deploy .vercel/output/static --branch=staging",
  "deploy:prod": "npx wrangler pages deploy .vercel/output/static --branch=main"
}
```

### How quality is currently enforced

- **Shared logic comes from cultrhealth** — most business rules live in libs that are tested in the cultrhealth suite (coupon validation, commission engine, creator attribution, member-record shape). Changes to the shared DB schema or `lib/creators/*` must be tested in cultrhealth.
- **Runtime defensive coding** — every cultrclub API route wraps its handler in `try/catch`, uses `describeError()` to sanitize errors, and returns generic user-facing messages.
- **Cloudflare Pages preview deploys** — every push gets a preview URL (`*.cultrclub-web.pages.dev`) that can be smoke-tested manually before promoting to `staging` or `main`.
- **Fail-closed rate limiting** — `strictLimiter` denies requests if Redis is unavailable on auth endpoints, preventing brute force if a misconfigured deploy ships.
- **Transactional writes** — `createPool()` transactions in `app/api/club/orders/route.ts` guarantee no partial writes, so a mid-flight error rolls back cleanly.

### Coverage gaps (everything)

Because there are no tests, all cultrclub code is untested in isolation. The most critical gaps:

- `app/api/club/signup/route.ts` — member upsert, UTM tracking, visitor cookie set
- `app/api/club/login/route.ts` — anti-enumeration login, phone normalization, cookie issuance
- `app/api/club/orders/route.ts` — HMAC approval token generation, bundle discount math, coupon policy validation, transaction rollback, inventory decrement, two-email side-effect
- `app/api/club/check-member/route.ts` — member lookup
- `app/api/club/validate-coupon/route.ts` — unified coupon validator (duplicates cultrhealth logic)
- `app/api/club/event/route.ts` — analytics event capture
- `app/api/stock/route.ts` — stock-source precedence (`cultrclub` > `join_cultrhealth`)
- `middleware.ts` — www canonicalization, X-Robots-Tag carve-outs, visitor-context cookie
- `lib/auth.ts` — `createClubVisitorToken` / `verifyClubVisitorToken`
- `lib/utils.ts` — `getCookieDomain`, `parseCookieJson`, `brandify`
- `lib/creators/*` — local copies of attribution + commission logic
- `lib/config/*` — tax calc, coupon rules, join-therapies catalog
- `components/ui/Button.tsx` — motion wrapper + loading state
- `components/ui/apple-cards-carousel.tsx`
- `app/JoinLandingClient.tsx` — the entire customer-facing flow (signup modal, cart, checkout)

### Recommended first tests (if/when the suite is added)

Prioritize by blast radius:
1. `app/api/club/orders/route.ts` — HMAC generation + transaction integrity (money on the line)
2. `app/api/club/login/route.ts` — anti-enumeration guarantee (security)
3. `app/api/club/validate-coupon/route.ts` — coupon parity with cultrhealth
4. `middleware.ts` — stealth-header carve-out regression (easy to break silently)
5. `lib/auth.ts` — visitor token round-trip

Vitest is the natural choice for parity with cultrhealth, but would need `@vitejs/plugin-react` + `jsdom` + `@testing-library/*` added as dev deps. Edge-runtime routes can be tested directly by calling the exported `POST` / `GET` with a `new Request(...)` — they don't need a jsdom environment.

---

## 3. CI / Pre-Deploy Test Gating

### cultrhealth — four PostToolUse hooks (`.claude/hooks/`)

Every `Write` or `Edit` of a `.ts` / `.tsx` file triggers four hooks in `.claude/settings.local.json`:

| Hook | Script | Timeout | Behavior |
|---|---|---|---|
| **Tests** | `.claude/hooks/run-tests.sh` | 120s | Runs `npx vitest run --reporter=verbose`. Exit 2 (blocks Claude) on failure. Skips test files themselves (`*.test.ts` / `tests/*`) to prevent infinite loops. |
| **Type check** | `.claude/hooks/type-check.sh` | 60s | Runs `npx tsc --noEmit` project-wide, filters errors to the changed file + summary. Exit 2 on type errors. |
| **Code audit** | `.claude/hooks/code-audit.sh` | 60s | ESLint + console statement grep + HIPAA PHI pattern grep + hardcoded-secret grep + TODO scan. Exit 2 on lint errors, PHI risk, or secrets. |
| **Marketing check** | `.claude/hooks/marketing-check.sh` | 30s | Only fires on marketing files (`app/page.tsx`, `app/pricing/`, `app/therapies/`, etc.). Checks SEO metadata, weak CTAs, missing alt text, hardcoded hex colors. Advisory only (exit 0). |

The tests hook runs the full suite on every change — this is deliberate. A few seconds of waiting prevents a minutes-long debug session when a regression ships.

The `/pre-deploy` slash command (defined in `.claude/commands/pre-deploy.md`) runs a 12-step checklist: TypeScript, tests, lint, console statements, HIPAA scan, secrets check, build, env vars, site health, git status, DB migrations, bundle size. Output is a PASS/FAIL/WARN table with a `READY` / `BLOCKED` verdict. Accepts `staging` (default) or `production` argument.

### cultrclub — no hooks, no CI

No `.claude/hooks/` directory in `cultrclub-web`. No CI config files (`.github/workflows/`, no `.gitlab-ci.yml`). Deploys go directly through `npm run deploy:staging` / `npm run deploy:prod` via Wrangler, which only runs the Next.js build. If the build passes, it ships.

If you add testing infrastructure here, the cheapest first step is copying `run-tests.sh` + `type-check.sh` into `.claude/hooks/` and wiring them into `.claude/settings.local.json` with the same matcher pattern.

---

## 4. Quick Reference — Running Tests

### cultrhealth.com
```bash
# From the cultrhealth repo root
npx vitest run                                    # full suite
npx vitest run tests/lib/auth.test.ts             # single file
npx vitest run tests/api/                         # a directory
npx vitest --watch                                # watch mode
npx vitest run --coverage                         # coverage (V8, html reporter)

npm run test:smoke                                # smoke only (fast gate)

# Playwright (requires dev server on :3000)
npm run test:e2e                                  # all projects
npm run test:e2e:join                             # join/landing only
npm run test:e2e:mobile                           # Mobile Chrome + Mobile Safari
npm run test:e2e:webkit                           # Desktop + Mobile Safari

# Real-DB integration tests — require .env.local with POSTGRES_URL
npx vitest run tests/integration/coupon-attribution-e2e.test.ts
npx vitest run tests/integration/creator-e2e-jon-collins.test.ts
```

### cultrclub.com
```bash
# No test command exists. Verify via:
npm run build                                     # Next.js build check
npm run build:cf                                  # Cloudflare Pages build check
npm run preview                                   # local Wrangler preview
```

---

*Testing analysis: 2026-04-20*
