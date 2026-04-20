# cultrhealth.com → Cloudflare Pages Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fork `Cultr Health Website/` into a new sibling repo `cultrhealth-web/`, adapt for Cloudflare Pages edge runtime, validate against a 16-point checklist, flip DNS from Vercel to Cloudflare in one same-day cutover. Preserve full feature parity and cross-app integrity with `cultrclub.com`.

**Architecture:** Mirror the cultrclub-web pattern — Next.js 14 App Router on Cloudflare Workers edge runtime via `@cloudflare/next-on-pages`. DB access via `@neondatabase/serverless` with `fullResults: true`. `_headers` file replaces `next.config.js headers()`. Cloudflare Cron Triggers replace Vercel Cron. Legacy `app/join-club/`, middleware `isJoinHost` branch, and Vercel canonicalization branch deleted at extraction time.

**Tech Stack:** Next.js 14.2, React 18.3, TypeScript 5.4, Tailwind 3.4, `@cloudflare/next-on-pages@1`, `@neondatabase/serverless@0.9`, `wrangler`, Cloudflare Pages (edge runtime with `nodejs_compat`).

**Source spec:** `docs/superpowers/specs/2026-04-20-cultrhealth-cloudflare-migration-design.md` (commit `1a93263`).

---

## Scope Corrections (vs. spec)

The spec's CLAUDE.md-derived counts were stale. Actual codebase state at plan time:

| Metric | Spec said | Actual | Source of truth |
|---|---|---|---|
| API routes | 72 | **118** | `find app/api -name route.ts \| wc -l` |
| Pages | ~45 | **81** | `find app -name page.tsx \| wc -l` |
| `@vercel/postgres` importers | ~30 | **99** | `grep -rl '@vercel/postgres' --include='*.ts' --include='*.tsx'` |
| Cron jobs | 2 | **7** | `vercel.json` crons array |

Additional cron jobs not in spec (all live in `app/api/cron/`):
- `siphox-fulfillment` (every 15 min)
- `siphox-results` (hourly)
- `siphox-status-sync` (every 30 min)
- `stale-orders` (noon daily)
- `asher-sync` (verify: Asher Med was removed Apr 4 — if code still exists but is no-op, confirm with user before deletion)

Additional subsystem: **Siphox lab test integration** — ~10 API routes across `/api/portal/labs`, `/api/member/labs`, `/api/creators/labs`, plus webhook branch in `/api/webhook/stripe`. Own test suite in `tests/lib/siphox-*`. Needs the same edge-runtime adaptation treatment as other routes.

**Revised same-day estimate:** 14–16 hours of focused work (vs. spec's 9–11). The fix-forward posture absorbs the risk; no scope reduction needed.

---

## Pre-Flight Check

Before starting Task 1:

- [ ] **Commit pending work on current `Cultr Health Website/` repo**

The session-start `git status` showed 11+ uncommitted files including `lib/db.ts`, `lib/config/coupons.ts`, `lib/validation.ts`, `app/api/admin/analytics/route.ts`, `app/api/club/signup/route.ts`, `app/api/waitlist/route.ts`, `app/admin/marketing/MarketingClient.tsx`, `components/site/ClubBanner.tsx`, `lib/admin-types.ts`, `migrations/057_signup_coupon_codes.sql`. These must be on `staging` before Task 1, or they'll be missed.

Run:
```bash
cd "/Users/davidk/Documents/Dev-Projects/App-Ideas/Cultr Health Website"
git status
# If any uncommitted changes belong in migration, commit them to staging.
```

Expected: clean `git status` (or only files you're intentionally not committing).

- [ ] **Confirm Cloudflare account access**

You'll need permissions to create Pages projects, add env vars, manage DNS. Test:
```bash
npx wrangler whoami
```

Expected: shows your Cloudflare account email and account ID.

---

## File Structure

### New repo layout (`cultrhealth-web/`)

```
cultrhealth-web/
├── .env.example                     # NEW: template
├── .gitignore                       # copy from Cultr Health Website
├── .dev.vars                        # NEW: local Cloudflare dev vars (gitignored)
├── CLAUDE.md                        # copy, update for Cloudflare architecture post-cutover
├── app/                             # copy (minus join-club/)
├── components/                      # copy (minus sections/, root Footer/Navigation/WaitlistForm)
├── content/                         # copy
├── hooks/                           # copy if exists
├── lib/                             # copy (minus stores/; rewrite db.ts)
├── middleware.ts                    # MODIFIED: delete isJoinHost + Vercel canonicalize
├── migrations/                      # copy (read-only in cultrhealth-web; Neon is shared)
├── next.config.js                   # MODIFIED: images.unoptimized, remove headers()
├── next-env.d.ts                    # auto-generated
├── package.json                     # MODIFIED: scripts + deps
├── postcss.config.js                # copy
├── public/
│   ├── _headers                     # NEW: ported from next.config.js headers()
│   └── _redirects                   # NEW (optional): ported from next.config.js redirects()
│   └── ...                          # copy all static assets
├── scripts/                         # copy (remove _tmp_* files)
├── tailwind.config.ts               # copy
├── tests/                           # copy (minus tests/api/club-*)
├── tsconfig.json                    # copy
├── workers/
│   └── cron.ts                      # NEW: Cloudflare Cron Trigger handler
├── wrangler.toml                    # NEW: Cloudflare Pages + Cron Triggers config
└── worker-configuration.d.ts        # NEW: wrangler-generated types
```

### Files deleted during extraction (clean-and-migrate)

- `app/join-club/` (entire directory)
- `app/api/club/signup/route.ts` — **keep** (still referenced by cultrclub.com flows? verify — if cultrhealth.com no longer handles club signups, also delete)
- `components/sections/` (entire directory, ~9 unused files)
- `components/Footer.tsx` (root-level legacy)
- `components/Navigation.tsx` (root-level legacy)
- `components/WaitlistForm.tsx` (root-level legacy)
- `lib/stores/` (empty)
- `class-variance-authority` from `package.json` deps
- `tests/api/club-orders-catalog-sync.test.ts`
- `tests/api/club-session-cookie.test.ts`
- `lib/config/join-therapies.ts` — verify nothing else imports; otherwise delete
- `vercel.json` (replaced by `wrangler.toml`)

### Files heavily modified

- `lib/db.ts` — total rewrite (reference: `cultrclub-web/lib/db.ts`)
- `middleware.ts` — delete `isJoinHost` and Vercel canonicalize blocks
- `next.config.js` — `images.unoptimized: true`, remove `headers()` function (moves to `_headers`)
- `package.json` — scripts: `build:cf`, `preview`, `deploy:staging`, `deploy:prod`; deps: swap `@vercel/postgres` → `@neondatabase/serverless`; add `@cloudflare/next-on-pages` + `wrangler` as devDeps
- Every route under `app/api/**/route.ts` — add `export const runtime = 'edge'` (118 files)
- Every file importing `sql` from `@vercel/postgres` — swap to `@/lib/db` (99 files)

### Files created

- `wrangler.toml`
- `workers/cron.ts`
- `public/_headers`
- `.dev.vars` (local only, gitignored)
- `.env.example` (new based on current env usage)

---

## Task Overview

60 tasks across 7 phases:

| Phase | Tasks | Wall-clock |
|---|---|---|
| 1. Foundation — repo + config skeleton | 1–8 | ~60m |
| 2. Code Adaptation — DB, runtime, middleware, cron | 9–20 | ~3.5h |
| 3. Risk Validation — dep spike + preview deploy | 21–26 | ~1.5–2.5h |
| 4. Cloudflare Deploy — Pages setup + env + DNS staging | 27–32 | ~60m |
| 5. Staging Validation — V1–V16 checklist | 33–50 | ~2.5h |
| 6. Production Cutover — DNS flip | 51–55 | ~45m |
| 7. Post-Cutover + Follow-up | 56–60 | ~2h watch + async |

---

# Phase 1: Foundation

## Task 1: Initialize `cultrhealth-web` repo

**Files:**
- Create: `/Users/davidk/Documents/Dev-Projects/App-Ideas/cultrhealth-web/` (new directory, copied from `Cultr Health Website/`)

- [ ] **Step 1: Copy the current repo to the new sibling directory**

```bash
cd "/Users/davidk/Documents/Dev-Projects/App-Ideas"
cp -R "Cultr Health Website" cultrhealth-web
cd cultrhealth-web
```

Expected: `ls cultrhealth-web` shows the same files as `Cultr Health Website`.

- [ ] **Step 2: Reset git history (this is a new repo, not a fork)**

```bash
rm -rf .git
git init
git branch -M main
```

Expected: `git log` fails with "does not have any commits yet".

- [ ] **Step 3: Strip Vercel-specific local files**

```bash
rm -rf .vercel .next .ralph .turbo node_modules
rm -f scripts/_tmp_stewart.mjs scripts/_tmp_stripe.mjs
```

Expected: these directories/files no longer exist.

- [ ] **Step 4: Create initial `.gitignore` entries for Cloudflare artifacts**

Append to `.gitignore`:
```
# Cloudflare
.wrangler/
.dev.vars
worker-configuration.d.ts
.vercel/
```

- [ ] **Step 5: Initial commit**

```bash
git add .
git commit -m "chore: initialize cultrhealth-web from Cultr Health Website

Forked at: $(date +%Y-%m-%d)
Source HEAD: $(cd '../Cultr Health Website' && git rev-parse HEAD)"
```

Expected: `git log` shows one commit.

## Task 2: Delete legacy code (clean-and-migrate)

**Files:**
- Delete: `app/join-club/`, `components/sections/`, `components/Footer.tsx`, `components/Navigation.tsx`, `components/WaitlistForm.tsx`, `lib/stores/`, `tests/api/club-orders-catalog-sync.test.ts`, `tests/api/club-session-cookie.test.ts`, `vercel.json`

- [ ] **Step 1: Delete deprecated directories and files**

```bash
cd "/Users/davidk/Documents/Dev-Projects/App-Ideas/cultrhealth-web"
rm -rf app/join-club
rm -rf components/sections
rm -f components/Footer.tsx components/Navigation.tsx components/WaitlistForm.tsx
rm -rf lib/stores
rm -f tests/api/club-orders-catalog-sync.test.ts tests/api/club-session-cookie.test.ts
rm -f vercel.json
```

Expected: `git status` shows these files as deleted.

- [ ] **Step 2: Verify nothing imports the deleted legacy code**

```bash
grep -rE "(from '@/components/(Footer|Navigation|WaitlistForm)'|components/sections)" --include="*.ts" --include="*.tsx" .
```

Expected: no matches. If matches appear, swap them to `@/components/site/...` equivalents before proceeding.

- [ ] **Step 3: Verify `lib/config/join-therapies.ts` is not imported**

```bash
grep -rE "from '@/lib/config/join-therapies'" --include="*.ts" --include="*.tsx" .
```

If zero matches, delete it:
```bash
rm -f lib/config/join-therapies.ts
```

If matches exist, leave the file for now — flag to user as follow-up cleanup.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete deprecated join-club subsystem + legacy components

Absorbs Phase 05-02 cleanup from cultrclub-web migration.
cultrclub.com now owns club flows as standalone Cloudflare Pages app."
```

## Task 3: Remove unused dependency `class-variance-authority`

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove dep from package.json**

Open `package.json`. In the `dependencies` block, remove the line:
```json
"class-variance-authority": "^0.7.1",
```

- [ ] **Step 2: Verify nothing imports it**

```bash
grep -rE "class-variance-authority" --include="*.ts" --include="*.tsx" .
```

Expected: no matches.

- [ ] **Step 3: Commit (don't install yet — deps install after all package.json edits)**

```bash
git add package.json
git commit -m "chore: remove unused class-variance-authority dep"
```

## Task 4: Create `wrangler.toml` with Cron Triggers

**Files:**
- Create: `wrangler.toml`

- [ ] **Step 1: Write wrangler.toml**

Create `wrangler.toml` at repo root:

```toml
name = "cultrhealth"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".vercel/output/static"

# Cron Triggers — ported from vercel.json crons array
# Format: run on Cloudflare, POST to internal route with CRON_SECRET bearer
[[triggers.crons]]
schedule = "*/15 * * * *"
# path: /api/cron/siphox-fulfillment
[[triggers.crons]]
schedule = "0 * * * *"
# path: /api/cron/siphox-results
[[triggers.crons]]
schedule = "*/30 * * * *"
# path: /api/cron/siphox-status-sync
[[triggers.crons]]
schedule = "0 2 * * *"
# path: /api/cron/approve-commissions
[[triggers.crons]]
schedule = "0 3 * * *"
# path: /api/cron/update-tiers
[[triggers.crons]]
schedule = "0 12 * * *"
# path: /api/cron/stale-orders
```

Note: Cloudflare Cron Triggers invoke the Worker's `scheduled()` handler, which we'll route to the correct path via `workers/cron.ts` (Task 17). The comments here document the intended target; actual routing happens in code.

- [ ] **Step 2: Commit**

```bash
git add wrangler.toml
git commit -m "chore(cf): add wrangler.toml with nodejs_compat + 6 cron triggers"
```

## Task 5: Port `next.config.js headers()` to `public/_headers`

**Files:**
- Create: `public/_headers`

- [ ] **Step 1: Read current headers from `next.config.js` (for reference)**

Run:
```bash
cat next.config.js
```

Identify the `headers()` config — you should see rules for HTML pages (fresh cache) and static assets (1-year immutable).

- [ ] **Step 2: Create `public/_headers` with equivalent rules**

The Cloudflare Pages `_headers` file uses a different syntax. Create `public/_headers`:

```
/*
  Referrer-Policy: strict-origin-when-cross-origin
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload

/
  Cache-Control: public, max-age=0, s-maxage=60, stale-while-revalidate=0

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/images/*
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=31536000, immutable
```

Rule: Cloudflare Pages serves these headers for matching paths. `/*` matches everything; more-specific paths override.

- [ ] **Step 3: Commit**

```bash
git add public/_headers
git commit -m "chore(cf): port next.config.js headers() to _headers file

Cloudflare Pages drops headers() at build time; _headers is the
equivalent and applies to static + SSR responses."
```

## Task 6: Modify `next.config.js` for Cloudflare

**Files:**
- Modify: `next.config.js`

- [ ] **Step 1: Read current `next.config.js`**

```bash
cat next.config.js
```

Note the existing structure (bundle analyzer wrapper, `reactStrictMode`, `removeConsole`, `optimizePackageImports`, `headers()`, `redirects()`, etc.).

- [ ] **Step 2: Edit to match Cloudflare requirements**

Apply these changes:

1. Inside the `nextConfig` object, add/modify:
   ```js
   images: {
     unoptimized: true,
   },
   ```
   (Replace any existing `images:` block. Cloudflare Pages has no Vercel-equivalent image optimizer.)

2. **Delete** the entire `async headers() { ... }` function — moved to `public/_headers`.

3. **Keep** `async redirects() { ... }` — `next-on-pages` supports it. Ensure `/join → /pricing` redirect is still there (since `app/join-club/` is gone, this catches any stragglers).

4. **Keep** `reactStrictMode: true`, `compiler.removeConsole` (production only, preserve error/warn), and `experimental.optimizePackageImports: ['lucide-react']`.

5. **Keep** the `@next/bundle-analyzer` wrapper (it's a no-op unless `ANALYZE=true`).

- [ ] **Step 3: Verify syntax**

```bash
node -e "require('./next.config.js')"
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add next.config.js
git commit -m "chore(cf): remove headers() (moved to _headers), add images.unoptimized"
```

## Task 7: Update `package.json` scripts and deps

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Swap DB dependency**

In `package.json` `dependencies`, replace:
```json
"@vercel/postgres": "^0.10.0",
```
with:
```json
"@neondatabase/serverless": "^0.9.0",
```

- [ ] **Step 2: Add Cloudflare devDeps**

In `devDependencies`, add:
```json
"@cloudflare/next-on-pages": "^1.13.0",
"wrangler": "^3.80.0"
```

- [ ] **Step 3: Update scripts**

Replace the `scripts` block with (preserving custom scripts like `setup:stripe`):
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "build:cf": "npx @cloudflare/next-on-pages@1",
  "start": "next start",
  "preview": "npx wrangler pages dev .vercel/output/static",
  "deploy:staging": "npx wrangler pages deploy .vercel/output/static --project-name=cultrhealth --branch=staging",
  "deploy:prod": "npx wrangler pages deploy .vercel/output/static --project-name=cultrhealth --branch=main",
  "lint": "next lint",
  "analyze": "ANALYZE=true next build",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

Add back any custom scripts (like `setup:stripe`) that were present.

- [ ] **Step 4: Install deps**

```bash
npm install
```

Expected: completes without errors. `node_modules/@neondatabase/serverless` and `node_modules/@cloudflare/next-on-pages` exist.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(cf): swap @vercel/postgres → @neondatabase/serverless; add CF tooling"
```

## Task 8: Create `.env.example` and `.dev.vars` templates

**Files:**
- Create: `.env.example`, `.dev.vars`

- [ ] **Step 1: Create `.env.example` documenting all required env vars**

Create `.env.example`:
```
# Site
NEXT_PUBLIC_SITE_URL=https://cultrhealth.com

# Database (Neon)
POSTGRES_URL=

# Auth
JWT_SECRET=
SESSION_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Affirm
AFFIRM_PRIVATE_API_KEY=
AFFIRM_API_URL=
NEXT_PUBLIC_AFFIRM_PUBLIC_KEY=
NEXT_PUBLIC_AFFIRM_SCRIPT_URL=

# Klarna
KLARNA_API_KEY=
KLARNA_API_SECRET=
KLARNA_API_URL=
NEXT_PUBLIC_KLARNA_CLIENT_ID=

# Authorize.net
AUTHNET_API_LOGIN_ID=
AUTHNET_TRANSACTION_KEY=

# Feature flags
NEXT_PUBLIC_ENABLE_KLARNA=true
NEXT_PUBLIC_ENABLE_AFFIRM=true

# Resend
RESEND_API_KEY=
FROM_EMAIL=
FOUNDER_EMAIL=

# Turnstile (Cloudflare)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# QuickBooks Online
QUICKBOOKS_CLIENT_ID=
QUICKBOOKS_CLIENT_SECRET=
QUICKBOOKS_REDIRECT_URI=

# Curator.io
NEXT_PUBLIC_CURATOR_FEED_INSTAGRAM=
NEXT_PUBLIC_CURATOR_FEED_TIKTOK=
NEXT_PUBLIC_CURATOR_FEED_YOUTUBE=

# Analytics / SEO
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
NEXT_PUBLIC_LEGITSCRIPT_SEAL_ID=

# OpenAI (for AI SDK protocol/meal plan generation)
OPENAI_API_KEY=

# Provider access
PROTOCOL_BUILDER_ALLOWED_EMAILS=

# Staging bypass
STAGING_ACCESS_EMAILS=

# Cron auth (new for Cloudflare Cron Triggers)
CRON_SECRET=

# Siphox (lab tests integration)
SIPHOX_API_KEY=
SIPHOX_API_URL=
```

- [ ] **Step 2: Create `.dev.vars` (local-only, gitignored) for local CF dev**

```bash
cp .env.example .dev.vars
```

Fill in real values from the source repo's `.env.local` (manually copy — do not commit).

- [ ] **Step 3: Verify `.dev.vars` is ignored**

```bash
git status
```

Expected: `.dev.vars` does not appear in changes.

- [ ] **Step 4: Commit `.env.example`**

```bash
git add .env.example
git commit -m "docs(cf): add .env.example with all required env vars for Cloudflare"
```

---

# Phase 2: Code Adaptation

## Task 9: Rewrite `lib/db.ts` using `@neondatabase/serverless`

**Files:**
- Modify: `lib/db.ts`
- Test: run any existing `tests/lib/db*.test.ts` after rewrite

- [ ] **Step 1: Replace `lib/db.ts` contents**

Reference: `cultrclub-web/lib/db.ts` (the proven template).

Write the following to `lib/db.ts` (replacing the existing content):

```typescript
import { neon, Pool, type NeonQueryFunction } from '@neondatabase/serverless'

// CRITICAL: fullResults: true makes neon() return { rows: [], rowCount, command, fields }
// matching @vercel/postgres result shape. Without this, every .rows access silently breaks.
// Lazy-initialized to avoid crashing at build time when POSTGRES_URL is not set.
// Proxy target must be a function for the `apply` trap (tagged template calls) to work.
let _sql: NeonQueryFunction<false, true> | null = null
function _getSql(): NeonQueryFunction<false, true> {
  if (!_sql) _sql = neon(process.env.POSTGRES_URL!, { fullResults: true })
  return _sql
}
export const sql: NeonQueryFunction<false, true> = new Proxy(function () {} as unknown as NeonQueryFunction<false, true>, {
  apply(_target, thisArg, args) {
    return Reflect.apply(_getSql() as any, thisArg, args)
  },
  get(_target, prop) {
    return (_getSql() as any)[prop]
  },
})

// WebSocket transport — use for transactions only (Pool.connect() API is pg-compatible)
export const createPool = () => new Pool({ connectionString: process.env.POSTGRES_URL })

export class DatabaseError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}
```

If the current `lib/db.ts` exports anything else (e.g., a `db` object, custom query helpers), preserve those exports on top — but the `sql` export MUST be the proxy above.

- [ ] **Step 2: Verify type imports still resolve**

```bash
npx tsc --noEmit 2>&1 | grep -E "lib/db.ts" | head -10
```

Expected: no errors specific to `lib/db.ts` (errors elsewhere are fine at this stage).

- [ ] **Step 3: Commit**

```bash
git add lib/db.ts
git commit -m "feat(db): swap to @neondatabase/serverless with fullResults:true

Without fullResults, .rows and .rowCount silently break across 99 files.
Proxy pattern lazy-initializes neon() to survive build without DB_URL."
```

## Task 10: Codemod `@vercel/postgres` imports across 99 files

**Files:**
- Modify: all 99 files that import from `@vercel/postgres`

- [ ] **Step 1: Inventory the files**

```bash
grep -rl "from '@vercel/postgres'" --include="*.ts" --include="*.tsx" . > /tmp/vercel-postgres-importers.txt
wc -l /tmp/vercel-postgres-importers.txt
```

Expected: ~99 files listed.

- [ ] **Step 2: Sweep `import { sql } from '@vercel/postgres'` → `import { sql } from '@/lib/db'`**

```bash
grep -rl "from '@vercel/postgres'" --include="*.ts" --include="*.tsx" . | \
  xargs sed -i '' "s|from '@vercel/postgres'|from '@/lib/db'|g"
```

(macOS `sed -i ''` — for Linux use `sed -i`.)

- [ ] **Step 3: Handle non-`sql` imports case-by-case**

Some files import `db`, `createPool`, or other symbols from `@vercel/postgres`. Find them:

```bash
grep -rE "from '@/lib/db'" --include="*.ts" --include="*.tsx" . | \
  grep -v "{ sql }" | \
  grep -v "{ sql," | \
  grep -vE "^[^:]+:import { sql }"
```

For each file that imports more than `sql`:
- If it imports `db` (from `@vercel/postgres`): change to use `sql` + `createPool()` from `@/lib/db`. Rewrite transaction logic per Task 11.
- If it imports `VercelPoolClient` or similar types: change to `@neondatabase/serverless` types (`Pool`, `PoolClient`).

- [ ] **Step 4: Type-check the whole project**

```bash
npx tsc --noEmit 2>&1 | tee /tmp/tsc-errors.txt | wc -l
```

Fix errors. Common ones:
- `.command` property missing: neon returns `command`. Same API, should work.
- `VercelPoolClient` not found: rename type reference.
- Transaction pattern: see Task 11.

- [ ] **Step 5: Run tests**

```bash
npx vitest run 2>&1 | tail -20
```

Expected: some tests may fail due to DB tests needing a live connection — that's OK if the test was failing in the original repo too. Priority: no new failures from the import swap.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(db): codemod @vercel/postgres → @/lib/db across 99 files"
```

## Task 11: Rewrite transaction handlers to use `Pool.connect()` pattern

**Files:**
- Modify: any file that uses `db.connect()` or `db.begin()` / `db.commit()` patterns from `@vercel/postgres`

- [ ] **Step 1: Find transaction usages**

```bash
grep -rnE "(db\.connect|BEGIN;|COMMIT;|ROLLBACK;)" --include="*.ts" --include="*.tsx" . | head -30
```

Note the files and line numbers.

- [ ] **Step 2: Rewrite each transaction**

For each transaction block, the pattern changes from:

```typescript
// OLD (@vercel/postgres)
import { db } from '@vercel/postgres'
const client = await db.connect()
try {
  await client.sql`BEGIN`
  await client.sql`UPDATE users SET ...`
  await client.sql`UPDATE orders SET ...`
  await client.sql`COMMIT`
} catch (e) {
  await client.sql`ROLLBACK`
  throw e
} finally {
  client.release()
}
```

to:

```typescript
// NEW (@neondatabase/serverless)
import { createPool } from '@/lib/db'
const pool = createPool()
const client = await pool.connect()
try {
  await client.query('BEGIN')
  await client.query('UPDATE users SET ...')
  await client.query('UPDATE orders SET ...')
  await client.query('COMMIT')
} catch (e) {
  await client.query('ROLLBACK')
  throw e
} finally {
  client.release()
  await pool.end()
}
```

Key differences:
- `db.connect()` → `createPool()` + `pool.connect()`.
- `client.sql\`...\`` → `client.query('...')` (or `client.query({ text: '...', values: [...] })` for parameterized queries).
- Always call `pool.end()` after release to close WebSocket connections.

- [ ] **Step 3: Type-check + test**

```bash
npx tsc --noEmit 2>&1 | grep -E "\\.connect|\\.query" | head -10
npx vitest run 2>&1 | tail -20
```

Expected: no new type errors; no transaction tests regressing (that weren't already failing upstream).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(db): rewrite transaction handlers for @neondatabase/serverless Pool"
```

## Task 12: Add `export const runtime = 'edge'` to all API routes

**Files:**
- Modify: all 118 files under `app/api/**/route.ts`

- [ ] **Step 1: Inventory routes missing the declaration**

```bash
cd "/Users/davidk/Documents/Dev-Projects/App-Ideas/cultrhealth-web"
find app/api -name route.ts | while read f; do
  if ! grep -q "export const runtime" "$f"; then
    echo "$f"
  fi
done > /tmp/routes-missing-runtime.txt
wc -l /tmp/routes-missing-runtime.txt
```

Expected: close to 118 (minus any that already have `'nodejs'` or `'edge'` declared).

- [ ] **Step 2: Script-add the declaration to each route**

For each file in `/tmp/routes-missing-runtime.txt`, prepend `export const runtime = 'edge'` after the last import.

One-liner approach using `awk`:
```bash
while read f; do
  # Insert after last import line
  awk '/^import / {last=NR} {lines[NR]=$0} END {
    for (i=1; i<=NR; i++) {
      print lines[i]
      if (i==last) print "\nexport const runtime = '\''edge'\''"
    }
  }' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
done < /tmp/routes-missing-runtime.txt
```

- [ ] **Step 3: Verify**

```bash
find app/api -name route.ts | while read f; do
  if ! grep -q "export const runtime = 'edge'" "$f"; then
    echo "MISSING: $f"
  fi
done
```

Expected: no output (all routes have the declaration).

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -E "runtime" | head -10
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(cf): declare edge runtime on all 118 API routes"
```

## Task 13: Delete deprecated middleware blocks

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Read current `middleware.ts`**

```bash
cat middleware.ts
```

Identify the sections to delete:
1. `isProductionDeployment` + `isVercelHost` canonicalize redirect (lines with `VERCEL_ENV` and `.vercel.app`)
2. `isJoinHost` detection constants
3. `isJoinHost` 404 rewrite block
4. `/join` path block (if `app/join-club/` is fully deleted, this is dead)

**Preserve:**
- The idle-session-timeout block (30-min HIPAA)
- The cookie refresh logic (`cultr_last_activity_v2`)
- The matcher config

- [ ] **Step 2: Rewrite `middleware.ts`**

Replace contents with:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Session idle timeout for HIPAA compliance (30 min inactivity)
  const IDLE_TIMEOUT_MS = 30 * 60 * 1000
  const authenticatedPrefixes = [
    '/members', '/intake', '/dashboard', '/admin', '/provider', '/creators/portal',
    '/api/member', '/api/intake', '/api/admin', '/api/provider', '/api/creators'
  ]
  const isAuthRoute = authenticatedPrefixes.some(p => request.nextUrl.pathname.startsWith(p)) &&
    !request.nextUrl.pathname.startsWith('/api/creators/apply') &&
    !request.nextUrl.pathname.startsWith('/api/creators/magic-link') &&
    !request.nextUrl.pathname.startsWith('/api/creators/verify-login') &&
    !request.nextUrl.pathname.startsWith('/api/creators/verify-email')

  if (isAuthRoute) {
    const sessionCookie = request.cookies.get('cultr_session_v2')
    const lastActivity = request.cookies.get('cultr_last_activity_v2')?.value
    const hostname = request.headers.get('host') || ''
    const domain = hostname.includes('cultrhealth.com') ? '.cultrhealth.com' : undefined

    if (sessionCookie && lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity, 10)
      if (elapsed > IDLE_TIMEOUT_MS) {
        const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
        let response: NextResponse

        if (isApiRoute) {
          response = NextResponse.json({ error: 'Session timeout' }, { status: 401 })
        } else {
          const loginPath = request.nextUrl.pathname.startsWith('/creators/portal') ? '/creators/login' : '/login'
          const loginUrl = new URL(loginPath, request.url)
          loginUrl.searchParams.set('error', 'session_timeout')
          loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
          response = NextResponse.redirect(loginUrl)
        }

        const clearCookie = (name: string, d?: string) => {
          response.cookies.set(name, '', {
            maxAge: 0,
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            ...(d ? { domain: d } : {})
          })
        }

        clearCookie('cultr_session_v2', domain)
        clearCookie('cultr_last_activity_v2', domain)
        return response
      }
    }

    if (sessionCookie) {
      const response = NextResponse.next()
      response.cookies.set('cultr_last_activity_v2', Date.now().toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
        ...(domain ? { domain } : {}),
      })
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

Note: the `isProductionDeployment` + Vercel canonicalize is removed (Cloudflare Pages preview URLs are `*.pages.dev`; if needed, add an equivalent canonicalize block after staging deploy succeeds).

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit middleware.ts
```

Expected: no errors.

- [ ] **Step 3: Verify LayoutShell no longer references deleted constants**

```bash
grep -rE "(HIDE_CHROME_HOSTNAMES|isJoinHost)" --include="*.ts" --include="*.tsx" .
```

If matches in `components/site/LayoutShellClient.tsx`, delete those references.

- [ ] **Step 4: Commit**

```bash
git add middleware.ts components/site/LayoutShellClient.tsx 2>/dev/null || git add middleware.ts
git commit -m "refactor(middleware): remove Vercel canonicalize + join host blocks

Cloudflare preview URLs are *.pages.dev. Canonicalize can be re-added
post-cutover if specific hostnames need redirecting. join.cultrhealth.com
is permanently retired — served by cultrclub.com standalone app."
```

## Task 14: Audit cookie usage for `headers.append('Set-Cookie')`

**Files:**
- Audit: all `.ts` / `.tsx` files
- Modify: any file using the banned pattern

- [ ] **Step 1: Grep for the banned pattern**

```bash
grep -rnE "headers\\.append\\(['\"]Set-Cookie['\"]" --include="*.ts" --include="*.tsx" .
```

Per CLAUDE.md, this should be zero hits in the current repo (the bug was fixed). Verify.

Expected: no matches.

- [ ] **Step 2: If any matches appear, replace with `response.cookies.set/delete()`**

Pattern swap:
```typescript
// BAD
response.headers.append('Set-Cookie', cookie.serialize(...))

// GOOD
response.cookies.set('name', 'value', { ...options })
// or to delete:
response.cookies.delete('name', { ...options })
```

- [ ] **Step 3: Commit (only if changes were needed)**

```bash
git add -A
git commit -m "fix(cookies): replace headers.append('Set-Cookie') with cookies.set/delete"
```

If no changes, skip this step.

## Task 15: Verify QuickBooks OAuth + Stripe webhook URLs are domain-based

**Files:**
- Read: any QuickBooks callback + Stripe webhook registration code
- Note: may need to update external dashboards (QuickBooks developer, Stripe dashboard)

- [ ] **Step 1: Find QuickBooks redirect URI references**

```bash
grep -rE "QUICKBOOKS_REDIRECT_URI|/api/quickbooks/callback" --include="*.ts" .
```

- [ ] **Step 2: Verify Stripe webhook URL isn't hardcoded**

```bash
grep -rE "webhook/stripe|/api/webhook" --include="*.ts" | grep -E "https://" | head -20
```

Expected: URLs use `process.env.NEXT_PUBLIC_SITE_URL` or the request's host — NOT hardcoded to Vercel or Cloudflare.

- [ ] **Step 3: Document external dashboard changes needed**

Create a note to self (not committed, just remembered for cutover):

- **QuickBooks developer dashboard:** ensure redirect URI is `https://cultrhealth.com/api/quickbooks/callback` (no Vercel URL). If it's Vercel-specific (`*.vercel.app`), it must be updated in QB's OAuth app config **before** Task 54 (DNS flip). Update now to avoid a cutover-day surprise.
- **Stripe dashboard:** verify webhook endpoint URL is `https://cultrhealth.com/api/webhook/stripe`.
- **Affirm / Klarna / Authorize.net dashboards:** verify webhook endpoints.

If any are Vercel-specific, update them to cultrhealth.com values (they'll resolve to Cloudflare after DNS flip).

- [ ] **Step 4: No commit needed** (unless code changes were required).

## Task 16: Create `workers/cron.ts` Cron Trigger handler

**Files:**
- Create: `workers/cron.ts`
- Modify: `wrangler.toml` (add worker reference)

- [ ] **Step 1: Create `workers/` directory and handler**

```bash
mkdir -p workers
```

Write `workers/cron.ts`:

```typescript
// Cloudflare Cron Trigger handler.
// Cloudflare invokes scheduled() at the schedules defined in wrangler.toml.
// Each cron fires this handler with `controller.cron` = the schedule string.
// We match against the schedule and fetch the corresponding Next.js route
// with a bearer token so the route can authenticate.

export interface Env {
  CRON_SECRET: string
  // Other Cloudflare bindings auto-added by next-on-pages as needed
}

const CRON_ROUTES: Record<string, string> = {
  '*/15 * * * *': '/api/cron/siphox-fulfillment',
  '0 * * * *': '/api/cron/siphox-results',
  '*/30 * * * *': '/api/cron/siphox-status-sync',
  '0 2 * * *': '/api/cron/approve-commissions',
  '0 3 * * *': '/api/cron/update-tiers',
  '0 12 * * *': '/api/cron/stale-orders',
}

export default {
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    const path = CRON_ROUTES[controller.cron]
    if (!path) {
      console.error('Unknown cron schedule:', controller.cron)
      return
    }

    const url = `https://cultrhealth.com${path}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.CRON_SECRET}`,
        'User-Agent': 'cloudflare-cron-trigger',
      },
    })

    if (!response.ok) {
      const body = await response.text()
      console.error(`Cron ${path} failed: ${response.status} ${body.slice(0, 500)}`)
    } else {
      console.log(`Cron ${path} ok`)
    }
  },
}
```

- [ ] **Step 2: Add each cron route's `CRON_SECRET` bearer check**

For each of the 6 routes (`/api/cron/*`), add to the top of the handler (if not already present):

```typescript
const authHeader = request.headers.get('Authorization')
const expected = `Bearer ${process.env.CRON_SECRET}`
if (authHeader !== expected) {
  return new Response('Unauthorized', { status: 401 })
}
```

Inventory existing auth:
```bash
grep -l "CRON_SECRET\|authorization" app/api/cron/*/route.ts
```

Add the check only to routes missing it.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -E "workers/cron" | head -5
```

Expected: no errors (may need `@types/node` or similar — install if asked).

- [ ] **Step 4: Commit**

```bash
git add workers/cron.ts app/api/cron/
git commit -m "feat(cf): add Cloudflare Cron Trigger handler for 6 scheduled jobs

Forwards to existing /api/cron/* routes with CRON_SECRET bearer token.
Replaces Vercel Cron registration from vercel.json (deleted)."
```

## Task 17: Handle `asher-sync` cron (verify if still needed)

**Files:**
- Inspect: `app/api/cron/asher-sync/route.ts`

- [ ] **Step 1: Read the route**

```bash
cat app/api/cron/asher-sync/route.ts
```

- [ ] **Step 2: Decide fate**

Per memory, Asher Med was removed Apr 4 2026. If this cron route is still active:

Option A: **Delete it** if no longer needed:
```bash
rm -rf app/api/cron/asher-sync
```

Option B: **Keep it** if it still serves a purpose (maybe syncing legacy data, reading archived state). In that case, register it in `wrangler.toml` + `workers/cron.ts`.

Pick based on what the route body actually does. If it imports from `lib/config/asher-med.ts` and makes API calls, it's dead — delete it.

- [ ] **Step 3: If deleted, commit**

```bash
git add -A
git commit -m "chore: remove asher-sync cron (Asher Med integration retired Apr 2026)"
```

If kept, update `wrangler.toml` + `workers/cron.ts` with the new schedule and commit that.

## Task 18: Add `export const runtime = 'edge'` to any pages that need it

**Files:**
- Modify: any `app/**/page.tsx` that uses server-side features not available on edge

- [ ] **Step 1: Inventory pages using Node-specific APIs**

Server components in the `app/` router can run on edge without explicit declaration — but some features require `runtime = 'edge'` explicitly. Find candidates:

```bash
grep -rEl "(fs\\.|require\\(|Buffer\\.from|process\\.cwd)" --include="page.tsx" app/ | head -20
```

- [ ] **Step 2: Add declarations where needed**

For any page that requires edge runtime, add near the top (after imports):
```typescript
export const runtime = 'edge'
```

`next-on-pages` will also attempt to auto-detect, but explicit is safer.

- [ ] **Step 3: Test build**

```bash
npx @cloudflare/next-on-pages@1 --help  # verify installed
npx next build
```

If build fails with runtime-incompatibility errors on specific pages, add `export const runtime = 'edge'` to those.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(cf): declare edge runtime on server components using Node APIs"
```

## Task 19: Verify `gray-matter` + `marked` + `DOMPurify` work on edge

**Files:**
- Test locally via `next build`

- [ ] **Step 1: Identify files using these libs**

```bash
grep -rE "(import.*gray-matter|import.*marked|import.*DOMPurify|from 'isomorphic-dompurify')" --include="*.ts" --include="*.tsx" . | head
```

Primary consumers: `lib/library-content.ts` and anywhere rendering member library markdown.

- [ ] **Step 2: Attempt a build**

```bash
npm run build:cf
```

Expected: either succeeds or fails loudly. If DOMPurify fails on edge (it uses `jsdom` server-side), you may need to swap to `isomorphic-dompurify`.

- [ ] **Step 3: If DOMPurify fails, swap to `isomorphic-dompurify`**

```bash
npm install isomorphic-dompurify
npm uninstall dompurify @types/dompurify
```

In affected files:
```typescript
// OLD
import DOMPurify from 'dompurify'

// NEW
import DOMPurify from 'isomorphic-dompurify'
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "fix(cf): swap dompurify → isomorphic-dompurify for edge compatibility"
```

If no swap needed, skip commit.

## Task 20: Final type + test pass before Phase 3

**Files:**
- No modifications; just verification

- [ ] **Step 1: Full type check**

```bash
npx tsc --noEmit 2>&1 | tee /tmp/tsc-phase2.txt | wc -l
```

Expected: zero errors (or only pre-existing errors unrelated to migration).

- [ ] **Step 2: Full test run**

```bash
npx vitest run 2>&1 | tail -30
```

Expected: all passing (or only pre-existing failures unrelated to migration). Fix any new failures before moving on.

- [ ] **Step 3: Commit checkpoint (even if no file changes, note the state)**

```bash
git commit --allow-empty -m "checkpoint: end of Phase 2 code adaptation — ready for CF build"
```

---

# Phase 3: Risk Validation (Block 6)

## Task 21: First `next-on-pages` build attempt

**Files:**
- No modifications initially — this surfaces unknowns

- [ ] **Step 1: Run the Cloudflare build**

```bash
npm run build:cf
```

Expected: produces `.vercel/output/static/`. If errors, note them. Common ones:
- "Module not found" — missing dep; install it.
- "Bundle size exceeded" — edge Worker has 10MB compressed limit on paid plans. If hit, likely `@react-pdf/renderer`. Move to Task 24.
- "Node API used but not allowed" — specific file needs fixing; the error points to it.

- [ ] **Step 2: Document errors encountered**

Create `MIGRATION-NOTES.md` (gitignored local scratch):
```bash
echo "# Migration notes" > MIGRATION-NOTES.md
```

Paste full build error output for later debugging.

- [ ] **Step 3: Fix trivial errors (missing deps, typos) and retry**

```bash
npm run build:cf
```

Iterate until build produces `.vercel/output/static/` or until you hit a genuine edge-compat blocker (Task 22+).

## Task 22: Test AI SDK streaming on edge

**Files:**
- `app/api/protocol/generate/route.ts`, `app/api/meal-plan/route.ts`

- [ ] **Step 1: Read each route's stream pattern**

```bash
cat app/api/protocol/generate/route.ts | head -60
cat app/api/meal-plan/route.ts | head -60
```

Verify they use `streamText` (or `streamUI`) from AI SDK v6, and the response is a `Response` with a stream body (not `Response.json(...)`).

- [ ] **Step 2: Verify edge runtime compat**

AI SDK v6 is designed for edge. If the route already uses `streamText` + returns a `StreamingTextResponse` or `stream.toDataStreamResponse()`, it should work.

If it uses a Node-specific streaming wrapper (e.g., `pipeThrough` from `node:stream`), rewrite to use Web Streams API:

```typescript
// EDGE-COMPAT (Web Streams)
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

export const runtime = 'edge'

export async function POST(req: Request) {
  const { messages } = await req.json()
  const result = await streamText({
    model: openai('gpt-4o'),
    messages,
  })
  return result.toDataStreamResponse()
}
```

- [ ] **Step 3: Local preview test**

```bash
npm run preview
# In another terminal:
curl -N https://localhost:8788/api/protocol/generate \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Generate a test protocol"}]}'
```

Expected: streaming response body.

- [ ] **Step 4: If AI SDK stream breaks, document and continue (fix-forward)**

If this fails on preview, add to `MIGRATION-NOTES.md`:
```
- [ ] AI SDK streaming issue in /api/protocol/generate — [error detail]
```

Don't block the migration; flag for post-cutover fix if not easily resolved.

- [ ] **Step 5: Commit any code fixes**

```bash
git add -A
git commit -m "fix(ai): ensure streamText responses use Web Streams for edge runtime" 2>/dev/null || true
```

## Task 23: Test `@react-pdf/renderer` on edge — DECISION POINT

**Files:**
- `lib/invoice/invoice-generator.tsx`, `lib/lmn/lmn-generator.tsx`

- [ ] **Step 1: Try the build**

If Task 21's build already failed on `@react-pdf/renderer`, the error is in `/tmp/next-on-pages-errors.txt` or `MIGRATION-NOTES.md`.

If build succeeded with the renderer included, spin up `npm run preview` and hit a route that generates a PDF:
```bash
curl -o /tmp/test-invoice.pdf https://localhost:8788/api/invoice/[orderId]/download
file /tmp/test-invoice.pdf
```

Expected: `PDF document, version 1.x`.

- [ ] **Step 2: Decide A / B / C based on result**

**A — Works as-is (best case):** move to Task 25. Fonts may still be broken; visually inspect a generated PDF.

**B — Bundle-size failure:**
- Option B1: swap `@react-pdf/renderer` → `pdf-lib` (Task 24). ~2h work to rewrite invoice/LMN templates.
- Option B2: proxy to tiny Vercel Fluid Compute endpoint (Task 24b). ~1h work.

**C — Runtime failure (fonts, pdfkit internals):**
- Option C1: same as B1 or B2.
- Option C2: bundle fonts as base64 inline in the component. ~30m trial.

- [ ] **Step 3: Document the decision in `MIGRATION-NOTES.md`**

```
## @react-pdf/renderer decision (Task 23)
- Status: [A works as-is / B1 pdf-lib swap / B2 Vercel proxy / C fix fonts]
- Rationale: [why]
- Follow-up: [what's needed]
```

## Task 24: (Conditional) `@react-pdf/renderer` → `pdf-lib` swap

**Files:**
- Modify: `lib/invoice/invoice-generator.tsx`, `lib/invoice/invoice-template.tsx`, `lib/lmn/lmn-generator.tsx`, `lib/lmn/lmn-template.tsx`
- Only execute if Task 23 decided on this option.

- [ ] **Step 1: Install pdf-lib**

```bash
npm install pdf-lib
```

- [ ] **Step 2: Rewrite invoice generator**

Reference: https://pdf-lib.js.org/ (lower-level API, manual text placement).

Write `lib/invoice/invoice-generator.ts` (now `.ts` not `.tsx` since no React):

```typescript
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { Invoice } from './invoice-types'

export async function generateInvoicePdf(invoice: Invoice): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792]) // US Letter
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Header
  page.drawText('CULTR Health', {
    x: 50, y: 750, size: 24, font: boldFont,
    color: rgb(0.16, 0.27, 0.26), // #2A4542 forest
  })

  page.drawText('Invoice', {
    x: 50, y: 720, size: 18, font,
  })

  // Invoice meta
  page.drawText(`Invoice #: ${invoice.number}`, { x: 50, y: 690, size: 11, font })
  page.drawText(`Date: ${invoice.date}`, { x: 50, y: 675, size: 11, font })

  // Customer block
  page.drawText('Bill To:', { x: 50, y: 640, size: 11, font: boldFont })
  page.drawText(invoice.customerName, { x: 50, y: 625, size: 11, font })
  page.drawText(invoice.customerEmail, { x: 50, y: 610, size: 11, font })

  // Line items (simplified)
  let y = 560
  for (const item of invoice.items) {
    page.drawText(item.description, { x: 50, y, size: 10, font })
    page.drawText(`$${item.amount.toFixed(2)}`, { x: 500, y, size: 10, font })
    y -= 20
  }

  // Total
  page.drawText('Total:', { x: 400, y: y - 20, size: 12, font: boldFont })
  page.drawText(`$${invoice.total.toFixed(2)}`, { x: 500, y: y - 20, size: 12, font: boldFont })

  return await pdfDoc.save()
}
```

- [ ] **Step 3: Update consumer of invoice-generator**

Any route that called `renderToBuffer(<InvoicePdf ... />)` now calls:

```typescript
import { generateInvoicePdf } from '@/lib/invoice/invoice-generator'
const pdfBytes = await generateInvoicePdf(invoice)
return new Response(pdfBytes, {
  headers: { 'Content-Type': 'application/pdf' },
})
```

- [ ] **Step 4: Repeat for LMN template**

Same pattern — rewrite `lib/lmn/lmn-generator.tsx` → `lib/lmn/lmn-generator.ts` using `pdf-lib`.

- [ ] **Step 5: Uninstall @react-pdf/renderer**

```bash
npm uninstall @react-pdf/renderer
```

- [ ] **Step 6: Verify build**

```bash
npm run build:cf
```

Expected: completes successfully.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(pdf): swap @react-pdf/renderer → pdf-lib for edge compat

@react-pdf/renderer bundles pdfkit + Node streams; exceeded Workers
size limit. pdf-lib is pure JS (~300KB) and edge-native. Templates
rewritten to use pdf-lib's lower-level drawing API."
```

## Task 25: Verify other suspect deps (jose, stripe, resend)

**Files:**
- No modifications; just preview-test

- [ ] **Step 1: Start preview**

```bash
npm run preview
```

- [ ] **Step 2: Test JWT with `jose`**

```bash
curl -v https://localhost:8788/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Expected: 200 (staging bypass returns token) or 200 (production-style email sent). No 500s from `jose`.

- [ ] **Step 3: Test Stripe (use Stripe CLI)**

```bash
# In another terminal:
stripe listen --forward-to localhost:8788/api/webhook/stripe
# Then trigger:
stripe trigger checkout.session.completed
```

Expected: webhook arrives, signature verifies, no 5xx.

- [ ] **Step 4: Test Resend**

Not easy to test without sending a real email. Instead, inspect a route that uses Resend:
```bash
grep -l "Resend" app/api/ -r | head -3
```

If any of them have an obvious test endpoint, hit it. Otherwise trust — Resend is HTTP-only and works on edge.

- [ ] **Step 5: Stop preview**

Ctrl+C.

- [ ] **Step 6: Document**

Update `MIGRATION-NOTES.md` with Pass/Fail for each dep. No commit.

## Task 26: Siphox routes edge-compat check

**Files:**
- `app/api/cron/siphox-*/route.ts`, `app/api/portal/labs/*`, `app/api/member/labs/*`, `app/api/creators/labs/*`

- [ ] **Step 1: Inspect one Siphox API consumer**

```bash
cat app/api/cron/siphox-fulfillment/route.ts
cat lib/config/siphox-biomarkers.ts | head -30
```

Identify any Node-specific imports (e.g. `fs`, `stream`, `crypto` Node-style).

- [ ] **Step 2: Build check**

```bash
npm run build:cf 2>&1 | grep -i "siphox"
```

Expected: no failures specific to Siphox.

- [ ] **Step 3: If failures, document + fix per dep**

Same pattern as other risky deps: swap to edge-compat alternative or proxy.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(siphox): edge-compat adjustments for Siphox lab integration" 2>/dev/null || true
```

---

# Phase 4: Cloudflare Pages Deploy

## Task 27: Push cultrhealth-web to GitHub

**Files:**
- Repo is on GitHub

- [ ] **Step 1: Create GitHub repo**

Use GitHub UI or CLI:
```bash
gh repo create cultrhealth-web --private --source=. --remote=origin --push
```

Expected: repo created, `main` branch pushed.

- [ ] **Step 2: Create `staging` branch**

```bash
git checkout -b staging
git push -u origin staging
git checkout main
```

## Task 28: Create Cloudflare Pages project

**Files:**
- Cloudflare Pages dashboard (manual)

- [ ] **Step 1: Log in to Cloudflare dashboard**

Navigate to **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.

- [ ] **Step 2: Select `cultrhealth-web` repo**

- [ ] **Step 3: Configure build**

- **Production branch:** `main`
- **Build command:** `npx @cloudflare/next-on-pages@1`
- **Output directory:** `.vercel/output/static`
- **Root directory:** `/` (leave blank)
- **Environment variables:** set `NODE_VERSION=20` in Pages settings

- [ ] **Step 4: Save project (don't deploy yet — no env vars set)**

Cancel the first build if it auto-triggers.

## Task 29: Set all env vars in Cloudflare Pages

**Files:**
- Cloudflare Pages dashboard (manual)

- [ ] **Step 1: Gather env vars from existing Vercel project**

On Vercel dashboard → cultrhealth project → Settings → Environment Variables → export.

Or from your local `.env.local`:
```bash
cat "/Users/davidk/Documents/Dev-Projects/App-Ideas/Cultr Health Website/.env.local"
```

- [ ] **Step 2: Enter in Cloudflare Pages → Settings → Environment Variables**

For EACH of the ~25 variables listed in `.env.example` (Task 8), enter in both **Production** and **Preview** environments.

Special values:
- `NEXT_PUBLIC_SITE_URL` (Production): `https://cultrhealth.com`
- `NEXT_PUBLIC_SITE_URL` (Preview): `https://staging.cultrhealth.com`
- `CRON_SECRET` (both): generate a new 32-char hex string (`openssl rand -hex 32`)
- `POSTGRES_URL` — same Neon DB as before

Keep `NEXT_PUBLIC_ENABLE_KLARNA=true` and `NEXT_PUBLIC_ENABLE_AFFIRM=true` if they were on in Vercel.

- [ ] **Step 3: Note `CRON_SECRET`** — add to your source repo's `.env.local` too so the old Vercel cron routes still auth the same way during overlap window (before Task 53 disables Vercel Cron).

## Task 30: Configure staging domain

**Files:**
- Cloudflare Pages dashboard (manual)

- [ ] **Step 1: In Cloudflare Pages → cultrhealth project → Custom Domains**

Click **Add custom domain** → enter `staging.cultrhealth.com` → assign to `staging` branch.

Cloudflare auto-provisions SSL and adds a DNS record (CNAME to the project's `pages.dev` URL).

- [ ] **Step 2: Trigger staging deploy**

Push an empty commit to `staging`:
```bash
cd "/Users/davidk/Documents/Dev-Projects/App-Ideas/cultrhealth-web"
git checkout staging
git commit --allow-empty -m "chore: trigger first staging deploy"
git push origin staging
```

- [ ] **Step 3: Watch build in Cloudflare dashboard**

Expected: build completes in 2-5 min. If it fails, fix + push again (fix-forward mode).

- [ ] **Step 4: Verify staging URL responds**

```bash
curl -I https://staging.cultrhealth.com
```

Expected: 200 OK or 404 (page not yet rendered — fine); `server: cloudflare` header.

## Task 31: Update Cloudflare dashboard Cron Triggers

**Files:**
- Cloudflare Pages dashboard → Settings → Functions → Cron Triggers

- [ ] **Step 1: Verify Cron Triggers are picked up from wrangler.toml**

Navigate to the project's Functions settings. You should see 6 cron schedules listed (from `wrangler.toml`).

If not automatically picked up (some `next-on-pages` versions don't forward cron config), add them manually in the dashboard UI.

- [ ] **Step 2: Disable crons on staging**

You don't want staging Cloudflare crons firing and doing real work against the shared Neon DB while Vercel cron is also firing.

Either:
- Disable the Cron Trigger checkbox on staging environment, OR
- Set `CRON_SECRET` on staging to a different value than prod so forwards to the actual routes fail auth (safe).

- [ ] **Step 3: Verify the 6 prod cron schedules are ready** (but not yet firing, since prod DNS hasn't flipped)

## Task 32: Smoke test staging build

**Files:**
- No modifications — just `curl` checks

- [ ] **Step 1: Home page**

```bash
curl -sS -o /tmp/home.html https://staging.cultrhealth.com && wc -l /tmp/home.html
```

Expected: non-zero HTML output with CULTR branding.

- [ ] **Step 2: Health check**

```bash
curl -sS https://staging.cultrhealth.com/api/health 2>/dev/null || curl -sS https://staging.cultrhealth.com/robots.txt
```

Expected: some response (200).

If major 5xx errors, go to Cloudflare dashboard → project → Functions → Logs to see what broke, and fix.

- [ ] **Step 3: Commit checkpoint**

```bash
git commit --allow-empty -m "checkpoint: staging deploy responding"
```

---

# Phase 5: Staging Validation (V1–V16)

## Task 33: V1 — Home page renders correctly

- [ ] **Step 1: Visit https://staging.cultrhealth.com**

Open in browser. Verify:
- Hero loads
- Pricing cards render
- Footer links work
- Logo shows
- No console errors in DevTools

- [ ] **Step 2: Test on mobile viewport**

DevTools → mobile simulation. Verify responsive layout.

- [ ] **Step 3: Document pass/fail in `MIGRATION-NOTES.md`**

## Task 34: V2 — Quiz → lead capture → admin Quiz Leads tab

- [ ] **Step 1: Complete the quiz**

Visit `/quiz`. Answer all questions. Submit.

- [ ] **Step 2: Fill lead capture modal with test data**

- [ ] **Step 3: Check admin dashboard**

Visit `/admin` → Marketing → Quiz Leads. Verify the lead appears.

- [ ] **Step 4: Document result**

## Task 35: V3 — Magic link login (member + admin + creator)

- [ ] **Step 1: Test member magic link**

```bash
curl -X POST https://staging.cultrhealth.com/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"ketchel.david@gmail.com"}'
```

Expected: 200. Since this is staging, response should include the token directly (per staging bypass logic).

Visit `/login?token=[token]` → redirect to `/members`.

- [ ] **Step 2: Test admin login (requires admin email)**

Same flow with an admin email.

- [ ] **Step 3: Test creator login**

```bash
curl -X POST https://staging.cultrhealth.com/api/creators/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"stewart@cultrhealth.com"}'
```

- [ ] **Step 4: Document result**

## Task 36: V4 — Admin dashboard loads all tabs

- [ ] **Step 1: Log in as admin**

- [ ] **Step 2: Visit each tab**

- Overview
- Orders
- Club Orders
- Customers
- Members
- Creators
- Campaigns
- Marketing (Quiz Leads, Waitlist)
- Coupons
- Analytics
- Audit Log
- Inventory

- [ ] **Step 3: Verify no 500s in Cloudflare Functions logs**

- [ ] **Step 4: Document result**

## Task 37: V5 — Creator portal loads dashboard + earnings

- [ ] **Step 1: Log in as creator (Stewart or test creator)**

- [ ] **Step 2: Verify these pages load**

- `/creators/portal/dashboard`
- `/creators/portal/earnings`
- `/creators/portal/network`
- `/creators/portal/share`
- `/creators/portal/campaigns`
- `/creators/portal/settings`

- [ ] **Step 3: Document result**

## Task 38: V6 — Intake form submission

- [ ] **Step 1: Start an intake flow**

Visit `/intake` (after completing a test checkout, or via the intake URL directly if allowed).

- [ ] **Step 2: Fill through each step**

Personal info → measurements → medications → GLP-1 history → preferences → ID upload → review → submit.

- [ ] **Step 3: Verify DB row created**

Log in to admin, check Customers tab for the test submission.

- [ ] **Step 4: Document result**

## Task 39: V7 — Stripe test-mode checkout

- [ ] **Step 1: Use Stripe test card**

Visit `/pricing`. Pick a tier. Use card `4242 4242 4242 4242`, expiry `12/34`, CVC `123`, ZIP `10001`.

- [ ] **Step 2: Verify webhook fires**

Cloudflare Functions logs → search for `/api/webhook/stripe`. Expected: one `checkout.session.completed` processed successfully.

- [ ] **Step 3: Verify order row in DB**

Admin → Orders tab. Find the test order. Status should be pending/paid.

- [ ] **Step 4: Document result**

## Task 40: V8 — Affirm / Klarna / Authorize.net test transactions

- [ ] **Step 1: Run one sandbox transaction per processor**

Each has a sandbox mode — use test credentials defined in the processor's dashboard.

- [ ] **Step 2: Verify webhooks arrive**

Check logs for each of:
- `/api/webhook/affirm`
- `/api/webhook/klarna`
- `/api/webhook/authorize-net`

- [ ] **Step 3: Document result per processor**

Note: if any processor's sandbox is complex to set up, defer verification to post-cutover and document as known risk.

## Task 41: V9 — PDF invoice generation

- [ ] **Step 1: Pick a test order**

Admin → Orders → find an order with a generated invoice → click "Download Invoice" or whatever the UI label is.

- [ ] **Step 2: Verify PDF downloads**

File should open as a valid PDF. Header/line items/total all present.

- [ ] **Step 3: If using pdf-lib (Task 24), compare visual fidelity to original**

- [ ] **Step 4: Document result**

## Task 42: V10 — AI protocol generation streams

- [ ] **Step 1: Log in as provider (allowlisted email) or admin**

Visit `/provider/protocol-builder`.

- [ ] **Step 2: Submit a prompt**

E.g., "Generate a 12-week GLP-1 protocol for metabolic optimization."

- [ ] **Step 3: Observe streaming response**

The UI should show text appearing progressively (not waiting for full response).

- [ ] **Step 4: Document result**

## Task 43: V11 — Turnstile widget renders + validates

- [ ] **Step 1: Visit quiz or signup flow with Turnstile**

Turnstile renders on forms to stop bots.

- [ ] **Step 2: Solve the challenge**

- [ ] **Step 3: Submit the form and verify no bot-protection block**

- [ ] **Step 4: Document result**

## Task 44: V12 — Cloudflare Cron Triggers fire

- [ ] **Step 1: Trigger a cron manually via Wrangler**

```bash
cd "/Users/davidk/Documents/Dev-Projects/App-Ideas/cultrhealth-web"
npx wrangler pages deployment tail
```

- [ ] **Step 2: In another terminal, manually invoke the scheduled handler**

Since staging crons are disabled (Task 31), use `wrangler`'s `--test-scheduled` flag for a local test, OR temporarily enable staging cron + trigger:

```bash
# Force-trigger via curl with CRON_SECRET
curl -H "Authorization: Bearer [CRON_SECRET]" \
  https://staging.cultrhealth.com/api/cron/approve-commissions
```

- [ ] **Step 3: Verify the cron runs without errors**

Check logs for success message. Verify DB-side effect (e.g., a commission row updated).

- [ ] **Step 4: Document result**

## Task 45: V13 — cultrclub.com → cultrhealth-web admin approval round-trip

- [ ] **Step 1: Temporarily point cultrclub-web's ADMIN_BASE_URL at staging.cultrhealth.com**

In the cultrclub-web Cloudflare Pages env vars (staging environment only):
- `ADMIN_BASE_URL=https://staging.cultrhealth.com`

Redeploy cultrclub-web's staging.

- [ ] **Step 2: Submit a club order via cultrclub-web staging**

Visit `https://staging.cultrclub.com` (or equivalent staging URL). Submit a product order.

- [ ] **Step 3: Verify admin approval email arrives**

Check the email inbox. The approval link should point to `https://staging.cultrhealth.com/api/admin/club-orders/[orderId]/approve?token=...`.

- [ ] **Step 4: Click the approval link**

Expected: HMAC verification succeeds, order marked approved, user redirected to admin UI.

- [ ] **Step 5: Revert cultrclub-web's ADMIN_BASE_URL to production value**

`ADMIN_BASE_URL=https://cultrhealth.com` (points to Vercel until DNS flips, then Cloudflare — same URL).

- [ ] **Step 6: Document result — CRITICAL GATE**

This is V13. Must pass before DNS flip.

## Task 46: V14 — QuickBooks OAuth refresh flow

- [ ] **Step 1: Log in to admin** → find QuickBooks section (settings or customer page)

- [ ] **Step 2: Trigger an action requiring QB API call**

E.g., creating an invoice for a test customer.

- [ ] **Step 3: Observe: does the QB API call succeed?**

If yes, OAuth tokens work. If 401, the refresh flow on edge has an issue.

- [ ] **Step 4: If broken, check:**
- Is `QUICKBOOKS_REDIRECT_URI` env var set?
- Is the QB developer app configured with `https://cultrhealth.com/api/quickbooks/callback`?
- Any `jsonwebtoken` or Node-specific usage in `lib/quickbooks.ts`? (use `jose` instead)

- [ ] **Step 5: Document result**

## Task 47: V15 — Calendly webhook + email chain

- [ ] **Step 1: Use Calendly test webhook feature**

In Calendly dashboard, send a test webhook to `https://staging.cultrhealth.com/api/webhook/calendly`.

- [ ] **Step 2: Verify webhook arrives**

Check Cloudflare Functions logs.

- [ ] **Step 3: Verify 3 emails fire** (per memory Apr 12)

Check Resend logs or test email inbox.

- [ ] **Step 4: Document result**

## Task 48: V16 — Static assets load

- [ ] **Step 1: Verify specific assets**

```bash
curl -I https://staging.cultrhealth.com/cultr-health-logo.png
curl -I https://staging.cultrhealth.com/og-image.png
curl -I https://staging.cultrhealth.com/images/hero-banner-desktop.png
curl -I https://staging.cultrhealth.com/robots.txt
```

Expected: 200 on each; `cache-control: public, max-age=31536000, immutable` on images; `content-type: image/png`.

- [ ] **Step 2: Document result**

## Task 49: Final staging soak — monitor for 2 hours

- [ ] **Step 1: Pin Cloudflare Functions logs in a terminal**

```bash
npx wrangler pages deployment tail --project-name cultrhealth
```

- [ ] **Step 2: Leave running for 2h while doing other work**

Watch for unexpected 5xx, payment webhook retries, cron failures.

- [ ] **Step 3: Document any issues surfaced**

Fix any blocker. Defer non-blockers to post-cutover.

## Task 50: Go / no-go decision

- [ ] **Step 1: Review validation checklist**

Must pass: V3, V7, V12, V13 (per spec).

All 16 should be at least attempted — soft failures can be fix-forward.

- [ ] **Step 2: Decision**

- **GO:** proceed to Phase 6 (DNS cutover).
- **NO-GO:** fix blockers; rerun affected validation items.

- [ ] **Step 3: Document decision in `MIGRATION-NOTES.md`**

---

# Phase 6: Production Cutover

## Task 51: Final rebase from `staging` (catch in-flight commits)

**Files:**
- `cultrhealth-web` repo
- `Cultr Health Website` repo (source of truth during transition)

- [ ] **Step 1: Sync any commits landed on cultrhealth during migration window**

```bash
cd "/Users/davidk/Documents/Dev-Projects/App-Ideas/Cultr Health Website"
git log --oneline [migration-start-commit]..HEAD
```

Note the commits.

- [ ] **Step 2: Cherry-pick or manual-apply to cultrhealth-web**

For each commit, check whether it's relevant (some might touch deleted code like `join-club/`). Manually apply:

```bash
cd "/Users/davidk/Documents/Dev-Projects/App-Ideas/cultrhealth-web"
git cherry-pick [commit-sha]  # for commits that apply cleanly
# or manual copy for commits that touch deleted files
```

- [ ] **Step 3: Redeploy staging with rebased commits**

```bash
git push origin staging
```

Wait for Cloudflare build to complete.

- [ ] **Step 4: Quick re-smoke V1 + V3 + V7**

Catch any regression from the rebase.

## Task 52: Add production domain to Cloudflare Pages

**Files:**
- Cloudflare Pages dashboard (manual)

- [ ] **Step 1: In cultrhealth project → Custom Domains**

Add `cultrhealth.com` → assign to `main` branch. Cloudflare will show a DNS record to add (a CNAME to `pages.dev` or an A record to Cloudflare IPs, depending on whether `cultrhealth.com` is on Cloudflare DNS).

Also add `www.cultrhealth.com` → same project.

DO NOT flip DNS yet — just register the domain with Cloudflare Pages.

- [ ] **Step 2: Verify deployment on `main` branch is up to date**

Merge staging into main:
```bash
cd "/Users/davidk/Documents/Dev-Projects/App-Ideas/cultrhealth-web"
git checkout main
git merge staging --ff-only
git push origin main
```

Wait for Cloudflare Pages to build `main`. Watch logs in dashboard.

## Task 53: Lower Vercel DNS TTL (30 min ahead of flip)

**Files:**
- DNS provider dashboard (wherever `cultrhealth.com` DNS is hosted)

- [ ] **Step 1: Find current DNS provider for cultrhealth.com**

```bash
dig NS cultrhealth.com
```

- [ ] **Step 2: Lower TTL on A/CNAME record for apex + www to 300s**

In the DNS dashboard, edit the apex (`@`) record and www record. Set TTL to `300` seconds.

- [ ] **Step 3: Wait for current TTL to expire** (up to previous TTL value — typically 1h)

## Task 54: Disable Vercel Cron (MUST happen with DNS flip)

**Files:**
- Vercel dashboard (manual)

- [ ] **Step 1: Navigate to Vercel → cultrhealth project → Settings → Cron Jobs**

- [ ] **Step 2: Disable ALL 6 cron jobs**

Either toggle each off, or pause the production deployment entirely — that disables crons too.

Timing: do this within 60 seconds of Step 55 (DNS flip), to minimize dual-cron window.

## Task 55: DNS flip — cultrhealth.com → Cloudflare

**Files:**
- DNS provider dashboard (manual)

- [ ] **Step 1: Change apex record (`@`) to Cloudflare**

If using Cloudflare DNS for cultrhealth.com:
- CNAME `@` → `[project].pages.dev` (Cloudflare's CNAME flattening handles this).

If using external DNS:
- A record `@` → Cloudflare Pages IP (get from Cloudflare dashboard when adding the custom domain).

- [ ] **Step 2: Change www record**

- CNAME `www` → `[project].pages.dev`.

- [ ] **Step 3: Wait for propagation**

```bash
while true; do
  dig +short cultrhealth.com | head -1
  sleep 15
done
```

When IPs change to Cloudflare's, propagation is happening.

- [ ] **Step 4: Verify**

```bash
curl -I https://cultrhealth.com
```

Expected: `server: cloudflare` header. If still seeing Vercel, wait.

- [ ] **Step 5: Commit checkpoint**

```bash
cd "/Users/davidk/Documents/Dev-Projects/App-Ideas/cultrhealth-web"
git commit --allow-empty -m "milestone: production DNS flipped to Cloudflare at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
git push origin main
```

---

# Phase 7: Post-Cutover Monitoring & Cleanup

## Task 56: 2-hour active monitoring

**Files:**
- Cloudflare Functions logs; Stripe dashboard; email inbox

- [ ] **Step 1: Tail Cloudflare Functions logs**

```bash
npx wrangler pages deployment tail --project-name cultrhealth
```

- [ ] **Step 2: Tail Stripe webhook deliveries**

In Stripe dashboard → Developers → Webhooks → click the `cultrhealth.com/api/webhook/stripe` endpoint → see recent deliveries. All should be 200.

- [ ] **Step 3: Watch for 5xx in Cloudflare**

Dashboard → cultrhealth project → Analytics. Error rate should be <1%.

- [ ] **Step 4: Quick hit on each payment webhook**

Trigger one small sandbox transaction in each processor (if possible) to confirm delivery.

- [ ] **Step 5: Log any incident in `MIGRATION-NOTES.md`**

## Task 57: Verify cron firing on new schedule

**Files:**
- Cloudflare Functions logs; DB inspection

- [ ] **Step 1: Wait for the next cron fire**

Based on schedules:
- `siphox-fulfillment`: every 15 min (next fire within 15 min)
- `siphox-results`: hourly at minute 0
- `siphox-status-sync`: every 30 min

Pick one that will fire within the next 15 min and watch for it.

- [ ] **Step 2: Check DB side-effect**

E.g., for `stale-orders` (fires at noon), inspect stale order handling logic and verify rows updated.

- [ ] **Step 3: Confirm no Vercel Cron is also firing** (Task 54 should have disabled them)

- [ ] **Step 4: Document**

## Task 58: Pause (don't delete) Vercel project

**Files:**
- Vercel dashboard (manual)

- [ ] **Step 1: Navigate to Vercel → cultrhealth → Settings → General**

- [ ] **Step 2: Pause deployments**

Toggle "Pause deployments" or equivalent. Keep the project, just stop serving.

- [ ] **Step 3: Keep a note of the Vercel URL for rollback**

```
Vercel fallback URL: https://cultrhealth-[hash].vercel.app
```

Save in `MIGRATION-NOTES.md`. This is the rollback target for 30 days.

## Task 59: Update CLAUDE.md in cultrhealth-web

**Files:**
- `CLAUDE.md`

- [ ] **Step 1: Update architecture notes**

Change sections:
- "Hosting: Vercel" → "Hosting: Cloudflare Pages"
- "Database: Neon via @vercel/postgres" → "Database: Neon via @neondatabase/serverless"
- "next.config.js headers()" note → "public/_headers + middleware"
- Add section on `nodejs_compat` flag and `export const runtime = 'edge'` requirement

- [ ] **Step 2: Remove stale notes**

- References to `join.cultrhealth.com` / `app/join-club/`
- Vercel Cron references (replaced by Cloudflare Cron Triggers)
- `vercel.json` references

- [ ] **Step 3: Update stats**

Rerun the counts:
```bash
find app/api -name route.ts | wc -l    # should be ~118 (or less if any routes also deleted with join-club)
find app -name page.tsx | wc -l         # should be ~81
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for Cloudflare Pages architecture"
git push origin main
```

## Task 60: Close follow-up loops

**Files:**
- `.planning/STATE.md` in the original `Cultr Health Website` repo

- [ ] **Step 1: Archive the original `Cultr Health Website` repo**

Either:
- Rename the remote to `cultrhealth-vercel-archive-2026` and lock it, OR
- Tag the last commit `archive-2026-04-20-pre-cloudflare-migration` and mark the repo read-only.

- [ ] **Step 2: Update `.planning/STATE.md` in the ARCHIVED repo**

Mark Phase 2 (Cloudflare migration) complete. Note cutover date and cultrhealth-web repo URL.

- [ ] **Step 3: Close cultrclub-web Phase 05-02**

In `cultrclub-web` or wherever its `.planning/phases/05-production-cutover/05-02-PLAN.md` lives, mark the plan complete — absorbed into this migration.

- [ ] **Step 4: Schedule 30-day Vercel deletion reminder**

Add a calendar reminder for `2026-05-20`:
> "If no regressions on cultrhealth.com since cutover, delete Vercel project."

- [ ] **Step 5: Final commit**

```bash
git commit --allow-empty -m "milestone: cultrhealth.com Cloudflare migration complete

Cutover date: 2026-04-20
Validation: V1-V16 passed
Rollback window: 30 days (Vercel project paused)
Follow-ups scheduled."
git push origin main
```

---

# Rollback Procedure (if Tier 1 failure detected)

Execute if a silent-failure Tier-1 item (DB corruption, missed webhook, payment loss, auth outage) surfaces.

1. **Re-enable Vercel deployment**
   - Vercel dashboard → cultrhealth → Settings → Resume deployments.
   - Wait 2 min for Vercel to warm up.

2. **Flip DNS back to Vercel**
   - DNS dashboard → change apex + www records back to Vercel. With TTL at 300s, propagation < 5 min.

3. **Re-enable Vercel Cron**
   - Vercel dashboard → Cron Jobs → toggle all 6 back on.

4. **Disable Cloudflare Cron Triggers**
   - Cloudflare dashboard → Functions → Cron Triggers → disable on cultrhealth-web.

5. **Post-mortem**
   - What failed, why, what fix is needed.
   - Retry migration after fix is validated on staging.

---

# Success Criteria (from spec)

- [ ] `curl -I https://cultrhealth.com` returns `server: cloudflare`
- [ ] All 16 validation checks passed
- [ ] Zero Tier-1 silent failures in first 48h post-cutover
- [ ] cultrclub.com admin approval flow works through new cultrhealth-web
- [ ] All 6 Cloudflare Cron Triggers fire on schedule; Vercel Cron disabled
- [ ] No `@vercel/postgres` imports remain: `grep -r '@vercel/postgres' cultrhealth-web/` → zero
- [ ] All `/api/*` routes declare `export const runtime = 'edge'`

---

# Self-Review

1. **Spec coverage:** every section of the spec has at least one task. Breaking-points register items map to Phase 2 tasks (DB, cookies, middleware, cron, deps). Validation V1–V16 map to Tasks 33–48. Rollback plan mapped to explicit procedure section. ✓
2. **Placeholder scan:** no "TBD", "TODO", "similar to Task N" patterns. Each step shows actual code or exact commands. ✓
3. **Type consistency:** `sql` / `createPool` / `DatabaseError` names consistent across Tasks 9, 10, 11. `CRON_SECRET` naming consistent across Tasks 8, 16, 29, 44, 55. `Env` interface in Task 16 matches Cloudflare's `scheduled()` signature. ✓
4. **Scope check:** single coherent migration, well-scoped for one plan. ✓

---

# Notes for the Executor

- **Fix-forward posture.** User accepts same-day cutover risk; individual blockers get fixed inline, not deferred to a follow-up phase.
- **Commit often.** Each task ends with a commit. If a task's work is partial when you pause, commit what works and resume later.
- **Cloudflare dashboard steps** are manual — there's no CLI fallback for DNS custom domains, Cron Triggers UI, or env vars (well, `wrangler secret` works for secrets, but UI is faster for bulk entry).
- **Watch the logs.** `npx wrangler pages deployment tail` is the single most important tool post-cutover.
- **If in doubt, ping the user.** Rollback is preferable to prolonged 500s.
