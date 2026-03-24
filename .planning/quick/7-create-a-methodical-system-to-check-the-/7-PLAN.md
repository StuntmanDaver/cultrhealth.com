---
phase: quick-7
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/site-health-check.mjs
  - tests/smoke/critical-pages.test.ts
  - tests/smoke/critical-apis.test.ts
autonomous: true
requirements: [QUICK-7]

must_haves:
  truths:
    - "Running one command checks all critical site sections"
    - "Failures identify exactly which section broke and why"
    - "Check covers public pages, auth-gated pages, and API endpoints"
  artifacts:
    - path: "scripts/site-health-check.mjs"
      provides: "Standalone health check script runnable against staging/localhost"
    - path: "tests/smoke/critical-pages.test.ts"
      provides: "Vitest smoke tests for critical page imports and rendering"
    - path: "tests/smoke/critical-apis.test.ts"
      provides: "Vitest smoke tests for critical API route handlers"
  key_links:
    - from: "scripts/site-health-check.mjs"
      to: "staging.cultrhealth.com or localhost:3000"
      via: "HTTP fetch to page routes and API endpoints"
      pattern: "fetch.*\\/(api|pricing|quiz)"
---

<objective>
Create a methodical site health-check system that verifies the most critical sections of the CULTR Health website are working correctly.

Purpose: The site has 65+ pages and 72+ API endpoints with no smoke testing. When code changes deploy, there is no systematic way to verify critical user flows still work. This creates a two-pronged checking system: (1) a standalone HTTP health-check script that can run against any deployed environment (staging, localhost), and (2) Vitest-based smoke tests that verify page components import/render and API route handlers respond correctly without needing a running server.

Output: `scripts/site-health-check.mjs` (run against live URLs) + `tests/smoke/critical-pages.test.ts` + `tests/smoke/critical-apis.test.ts` (run via `npm test`)
</objective>

<execution_context>
@/Users/davidk/.claude/get-shit-done/workflows/execute-plan.md
@/Users/davidk/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@vitest.config.js
@tests/setup.ts
@app/page.tsx
@lib/config/plans.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create standalone HTTP site health-check script</name>
  <files>scripts/site-health-check.mjs</files>
  <action>
Create `scripts/site-health-check.mjs` — a Node.js script (no dependencies beyond Node 18 built-ins) that methodically checks the most critical sections of the site via HTTP requests.

**Usage:** `node scripts/site-health-check.mjs [base-url]`
- Default base URL: `http://localhost:3000`
- Example: `node scripts/site-health-check.mjs https://staging.cultrhealth.com`

**Sections to check, organized by priority tier:**

**Tier 1 — Revenue-critical (must work or business loses money):**
- `GET /` — Homepage (200, contains "CULTR")
- `GET /pricing` — Pricing page (200, contains "Core" or "$199")
- `GET /join/core` — Checkout page for Core tier (200)
- `GET /join/catalyst` — Checkout page for Catalyst tier (200)
- `GET /join/club` — Club join page (200)
- `GET /quiz` — Recommendation quiz (200)
- `POST /api/checkout` — Checkout endpoint responds (not 500; 400 for missing body is acceptable)
- `POST /api/club/signup` — Club signup endpoint responds (not 500)

**Tier 2 — Patient experience (critical for retention):**
- `GET /intake` — Intake form page (200)
- `GET /login` — Login page (200)
- `GET /portal/login` — Portal login page (200)
- `GET /how-it-works` — How It Works page (200)
- `GET /therapies` — Therapies page (200)
- `POST /api/auth/magic-link` — Auth endpoint responds (not 500)
- `POST /api/intake/questions` — Intake questions (not 500; 405 for wrong method is OK too — check GET)
- `GET /api/intake/questions` — Intake questions endpoint

**Tier 3 — Marketing & SEO (drives acquisition):**
- `GET /science` — Science library (200)
- `GET /faq` — FAQ page (200)
- `GET /community` — Community page (200)
- `GET /creators` — Creator program page (200)
- `GET /legal/privacy` — Privacy policy (200)
- `GET /legal/terms` — Terms page (200)

**Tier 4 — Admin & Creator (internal tools):**
- `GET /admin` — Admin panel (200 or 302 redirect to login)
- `GET /creators/login` — Creator login (200)
- `GET /creators/apply` — Creator application (200)

**Output format:** Table with colored status indicators:
```
CULTR Health Site Check — https://staging.cultrhealth.com
============================================================

TIER 1: Revenue-Critical
  [PASS] GET  /                    200  (142ms)
  [PASS] GET  /pricing             200  (89ms)
  [FAIL] GET  /join/core           500  (2103ms)  "Internal Server Error"
  ...

TIER 2: Patient Experience
  ...

TIER 3: Marketing & SEO
  ...

TIER 4: Admin & Creator
  ...

============================================================
SUMMARY: 21/24 passed | 2 failed | 1 warning
TIER 1 FAILURES: /join/core (500)
```

**Implementation details:**
- Use native `fetch` (Node 18+)
- Color output using ANSI escape codes (green PASS, red FAIL, yellow WARN)
- Timeout per request: 10 seconds
- For POST endpoints, send minimal JSON body `{}` with Content-Type application/json — expect non-500 response (400/401 = acceptable, proves route is wired)
- Exit code 0 if all Tier 1 passes, exit code 1 if any Tier 1 failure
- Include response time in ms for each check
- Catch network errors gracefully (ECONNREFUSED = "server not running" message)
- No external dependencies — pure Node.js ESM module
  </action>
  <verify>
    <automated>node scripts/site-health-check.mjs http://localhost:9999 2>&1 | head -5</automated>
  </verify>
  <done>Script exists, runs without errors against any URL (gracefully handles connection refused), outputs structured tier-based results with PASS/FAIL/WARN per endpoint, exits 1 on Tier 1 failures</done>
</task>

<task type="auto">
  <name>Task 2: Create Vitest smoke tests for critical pages and API routes</name>
  <files>tests/smoke/critical-pages.test.ts, tests/smoke/critical-apis.test.ts</files>
  <action>
Create two Vitest smoke test files that verify critical sections work at the code/import level (no running server needed).

**tests/smoke/critical-pages.test.ts:**

Test that the most critical page modules can be imported and their default exports exist. This catches broken imports, missing dependencies, and syntax errors that would make pages 500 in production.

Test the following pages (import the page.tsx module, assert default export is a function):
- `app/page.tsx` (Homepage)
- `app/pricing/page.tsx` (Pricing)
- `app/quiz/page.tsx` (Quiz)
- `app/faq/page.tsx` (FAQ)
- `app/how-it-works/page.tsx` (How It Works)
- `app/science/page.tsx` (Science)
- `app/login/page.tsx` (Login)
- `app/intake/page.tsx` (Intake)
- `app/creators/page.tsx` (Creators)
- `app/community/page.tsx` (Community)
- `app/therapies/page.tsx` (Therapies)
- `app/portal/login/page.tsx` (Portal Login)

Structure as a describe block "Critical Page Smoke Tests" with individual test cases per page. Use dynamic imports to catch import-time errors:

```typescript
describe('Critical Page Smoke Tests', () => {
  it('homepage exports a valid page component', async () => {
    const mod = await import('@/app/page')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe('function')
  })
  // ... etc for each page
})
```

**tests/smoke/critical-apis.test.ts:**

Test that critical API route modules export the expected HTTP method handlers (GET, POST). This catches broken imports and missing handler exports.

Test the following API routes:
- `app/api/checkout/route.ts` — exports POST
- `app/api/club/signup/route.ts` — exports POST
- `app/api/auth/magic-link/route.ts` — exports POST
- `app/api/auth/verify/route.ts` — exports GET or POST
- `app/api/intake/questions/route.ts` — exports GET
- `app/api/intake/submit/route.ts` — exports POST
- `app/api/creators/apply/route.ts` — exports POST
- `app/api/stripe/checkout/route.ts` — exports POST
- `app/api/club/orders/route.ts` — exports POST
- `app/api/member/profile/route.ts` — exports GET

Structure as a describe block "Critical API Route Smoke Tests" with individual test cases:

```typescript
describe('Critical API Route Smoke Tests', () => {
  it('checkout route exports POST handler', async () => {
    const mod = await import('@/app/api/checkout/route')
    expect(mod.POST).toBeDefined()
    expect(typeof mod.POST).toBe('function')
  })
  // ... etc
})
```

Both files should be lightweight — import-only checks, no mocking, no rendering. They verify the dependency graph is intact. If any critical page has a broken import chain, these tests will catch it.
  </action>
  <verify>
    <automated>cd /Users/davidk/Documents/Dev-Projects/App-Ideas/Cultr\ Health\ Website && npx vitest run tests/smoke/ --reporter=verbose 2>&1 | tail -30</automated>
  </verify>
  <done>Both smoke test files exist in tests/smoke/. Running `npx vitest run tests/smoke/` executes all smoke tests. Each critical page verifies it has a default export function. Each critical API route verifies it exports the expected HTTP method handler. Test suite reports which specific page or API route has a broken import chain.</done>
</task>

<task type="auto">
  <name>Task 3: Add npm script and document the health-check system</name>
  <files>package.json</files>
  <action>
Add two convenience npm scripts to package.json:

```json
"scripts": {
  "check:health": "node scripts/site-health-check.mjs",
  "check:health:staging": "node scripts/site-health-check.mjs https://staging.cultrhealth.com",
  "test:smoke": "vitest run tests/smoke/"
}
```

Add these to the existing scripts object (do NOT replace existing scripts). This provides three quick commands:
- `npm run check:health` — check localhost:3000
- `npm run check:health:staging` — check staging deployment
- `npm run test:smoke` — run import-level smoke tests

Verify no script name conflicts with existing scripts before adding.
  </action>
  <verify>
    <automated>cd /Users/davidk/Documents/Dev-Projects/App-Ideas/Cultr\ Health\ Website && node -e "const pkg = require('./package.json'); console.log('check:health:', !!pkg.scripts['check:health']); console.log('test:smoke:', !!pkg.scripts['test:smoke'])"</automated>
  </verify>
  <done>Running `npm run check:health` invokes the site health-check script against localhost. Running `npm run check:health:staging` checks staging. Running `npm run test:smoke` runs the Vitest smoke tests. All three scripts are documented in package.json.</done>
</task>

</tasks>

<verification>
1. `node scripts/site-health-check.mjs` runs without errors (outputs connection refused if no server running — graceful failure)
2. `npx vitest run tests/smoke/` runs all smoke tests (page imports + API route exports)
3. `npm run check:health` and `npm run test:smoke` scripts exist in package.json
</verification>

<success_criteria>
- Single command (`npm run check:health:staging`) verifies all critical site sections against staging
- Single command (`npm run test:smoke`) verifies all critical page/API imports are intact
- Failures identify the exact page or API route that broke
- Tier 1 (revenue-critical) failures cause non-zero exit code for CI integration
- No external dependencies added — uses Node.js built-ins and existing Vitest setup
</success_criteria>

<output>
After completion, create `.planning/quick/7-create-a-methodical-system-to-check-the-/7-SUMMARY.md`
</output>
