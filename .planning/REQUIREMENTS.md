# Requirements: cultrclub-web Cloudflare Migration

**Defined:** 2026-04-13
**Core Value:** CULTR Club experience at cultrclub.com — standalone Cloudflare Pages app sharing Neon DB with cultrhealth.com admin.

## v1 Requirements

### Repo & Config

- [ ] **CF-01**: cultrclub-web repo exists at `/Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/` with Next.js 14 App Router
- [ ] **CF-02**: `wrangler.toml` configured with `nodejs_compat` flag and correct build output dir
- [ ] **CF-03**: `next.config.js` has `images.unoptimized: true` and Turnstile-only CSP headers
- [ ] **CF-04**: `package.json` has `build:cf`, `preview`, `deploy:staging`, `deploy:prod` scripts using `@cloudflare/next-on-pages`
- [ ] **CF-05**: `@neondatabase/serverless` used for all DB access; `neon()` instantiated with `fullResults: true`

### Source Extraction

- [ ] **EX-01**: All 6 app routes and 1 new health route exist in cultrclub-web
- [ ] **EX-02**: All 15 lib files copied and adapted (sql import swapped to `@/lib/db`)
- [ ] **EX-03**: All 3 component files and hooks copied
- [ ] **EX-04**: All product images (24 PNGs), logos, and email images copied to public/

### Code Adaptation

- [ ] **CD-01**: `lib/db.ts` completely rewritten to use `@neondatabase/serverless` with `fullResults: true`
- [ ] **CD-02**: All simple sql files have import swapped from `@vercel/postgres` to `@/lib/db`
- [ ] **CD-03**: Transaction files (`app/api/club/orders/route.ts`, `lib/creators/commission.ts`) use `createPool()` + `Pool.connect()` instead of `db.connect()`
- [ ] **CD-04**: `ADMIN_BASE_URL` env var used for approval email links (points to cultrhealth.com); `siteUrl` uses `NEXT_PUBLIC_SITE_URL`
- [ ] **CD-05**: Welcome email in `app/api/club/signup/route.ts` links to `cultrclub.com` (not join.cultrhealth.com)
- [ ] **CD-06**: `JoinLandingClient.tsx` cookie clear uses `getCookieDomain()` — no hardcoded `.cultrhealth.com`
- [ ] **CD-07**: `lib/utils.ts` getCookieDomain() returns `.cultrclub.com` for cultrclub.com URLs
- [ ] **CD-08**: All 6 API routes have `export const runtime = 'edge'` at top
- [ ] **CD-09**: `app/layout.tsx` is minimal — no PaymentProviderLoader, includes brand fonts
- [ ] **CD-10**: `middleware.ts` simplified — UTM tracking only, no join host detection, no HIPAA session timeout

### Deployment

- [ ] **DP-01**: Cloudflare Pages project created, connected to `cultrclub-web` repo
- [ ] **DP-02**: All 17 env vars set in Cloudflare Pages dashboard (production)
- [ ] **DP-03**: `staging.join.cultrhealth.com` CNAME points to Cloudflare Pages staging deployment
- [ ] **DP-04**: All 11 staging validation checks pass before production cutover

### Production Cutover

- [ ] **CU-01**: `cultrclub.com` domain configured in Cloudflare Pages (production branch = `main`)
- [ ] **CU-02**: `join.cultrhealth.com` → `https://cultrclub.com` 301 redirect via Cloudflare DNS
- [ ] **CU-03**: cultrhealth.com `middleware.ts` cleaned up (join host detection blocks removed)
- [ ] **CU-04**: `join.cultrhealth.com` Vercel domain alias removed (2-4 weeks after redirect confirmed working)
