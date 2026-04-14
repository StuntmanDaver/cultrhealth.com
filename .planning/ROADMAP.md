# Roadmap: cultrclub-web Cloudflare Migration

## Overview

Extract the CULTR Club free-tier experience from cultrhealth.com into a standalone Next.js 14 app (`cultrclub-web`) deployed to Cloudflare Pages at `cultrclub.com`. Admin stays on Vercel. Both apps share the same Neon PostgreSQL database. `join.cultrhealth.com` stays live throughout validation; deprecated only after cultrclub.com is confirmed stable.

Five phases: bootstrap the new repo, extract source files, adapt code for Cloudflare Workers, deploy staging and validate, then go live and clean up.

## Phases

- [ ] **Phase 1: Bootstrap** — Create cultrclub-web repo with all config files
- [ ] **Phase 2: Source Extraction** — Copy and adapt all source files from cultrhealth.com
- [ ] **Phase 3: Code Adaptation** — Apply all Cloudflare-specific code changes
- [ ] **Phase 4: Deploy & Validate** — Cloudflare Pages staging setup + 11-point validation
- [ ] **Phase 5: Production Cutover** — Go live on cultrclub.com + deprecate join.cultrhealth.com

## Phase Details

### Phase 1: Bootstrap
**Goal**: The cultrclub-web repo exists with all config files needed to build and deploy to Cloudflare Pages
**Depends on**: Nothing (first phase)
**Requirements**: CF-01, CF-02, CF-03, CF-04
**Success Criteria**:
  1. `cultrclub-web/` directory exists with a valid Next.js 14 App Router structure
  2. `wrangler.toml` has `nodejs_compat` flag and correct build output dir
  3. All brand tokens, fonts, and animations present in tailwind.config.ts and globals.css
  4. package.json has build:cf, preview, deploy:staging, deploy:prod scripts
**Plans:** 0/1 plans complete

Plans:
- [ ] 01-01-PLAN.md — Create repo skeleton: package.json, tsconfig, tailwind, next.config.js, wrangler.toml, globals.css

### Phase 2: Source Extraction
**Goal**: All source files from cultrhealth.com that cultrclub-web needs are copied into the new repo
**Depends on**: Phase 1
**Requirements**: EX-01, EX-02, EX-03, EX-04
**Success Criteria**:
  1. All 7 app route files exist in cultrclub-web/app/
  2. All 15 lib files exist in cultrclub-web/lib/
  3. All components, hooks, and static assets are in place
**Plans:** 0/2 plans complete

Plans:
- [ ] 02-01-PLAN.md — Extract app routes (page.tsx, layout.tsx, globals.css, 6 API routes)
- [ ] 02-02-PLAN.md — Extract lib files, components, hooks, and static assets (product images, logos)

### Phase 3: Code Adaptation
**Goal**: All extracted files are adapted for Cloudflare Workers runtime — @vercel/postgres removed, edge runtime declared, Cloudflare-specific fixes applied
**Depends on**: Phase 2
**Requirements**: CD-01 through CD-10
**Success Criteria**:
  1. Zero `@vercel/postgres` imports remain in cultrclub-web
  2. `lib/db.ts` uses `@neondatabase/serverless` with `fullResults: true`
  3. All transaction files use `createPool()` + `Pool.connect()`
  4. All 6 API routes have `export const runtime = 'edge'`
  5. Cookie domain uses `getCookieDomain()` — no hardcoded `.cultrhealth.com`
  6. `ADMIN_BASE_URL` used for approval links; `siteUrl` for customer-facing links
**Plans:** 0/2 plans complete

Plans:
- [ ] 03-01-PLAN.md — lib/db.ts rewrite + sql import swaps across 6 simple files
- [ ] 03-02-PLAN.md — Pool swap, admin URL fix, email link fix, cookie fix, edge runtime, layout, middleware

### Phase 4: Deploy & Validate
**Goal**: cultrclub-web deployed to Cloudflare Pages staging at staging.join.cultrhealth.com; all 11 validation checks pass
**Depends on**: Phase 3
**Requirements**: DP-01, DP-02, DP-03, DP-04
**Success Criteria**:
  1. `staging.join.cultrhealth.com` serves the cultrclub-web app from Cloudflare Pages
  2. Club signup creates a `club_members` row in Neon; welcome email links to cultrclub.com
  3. Admin approval link points to cultrhealth.com admin (not cultrclub.com)
  4. All 11 verification checks pass
**Plans:** 0/2 plans complete

Plans:
- [ ] 04-01-PLAN.md — Cloudflare Pages project setup, DNS CNAME, all 17 env vars
- [ ] 04-02-PLAN.md — Run staging validation checklist (all 11 checks as tasks)

### Phase 5: Production Cutover
**Goal**: cultrclub.com is live, join.cultrhealth.com redirects there, cultrhealth.com middleware cleaned up
**Depends on**: Phase 4 (all 11 validation checks passing)
**Requirements**: CU-01, CU-02, CU-03, CU-04
**Success Criteria**:
  1. cultrclub.com serves the app from Cloudflare Pages production branch
  2. join.cultrhealth.com → https://cultrclub.com (301 redirect)
  3. cultrhealth.com middleware has no join host detection blocks
  4. No regression on cultrhealth.com after middleware change
**Plans:** 0/2 plans complete

Plans:
- [ ] 05-01-PLAN.md — cultrclub.com domain + Cloudflare Pages production go-live
- [ ] 05-02-PLAN.md — cultrhealth.com middleware cleanup + join.cultrhealth.com 301 redirect
