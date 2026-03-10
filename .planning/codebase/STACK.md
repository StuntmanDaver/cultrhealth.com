# Technology Stack

**Analysis Date:** 2026-03-10

## Languages

**Primary:**
- TypeScript ^5.4.0 - Full codebase (strict: false, allowJs: true)
- React ^18.2.0 - UI framework, functional components + hooks
- JavaScript/Node.js - Backend APIs

**CSS:**
- Tailwind CSS ^3.4.3 - Utility-first styling with @tailwindcss/typography plugin
- PostCSS ^8.4.38 - CSS processing
- Autoprefixer ^10.4.19 - Vendor prefix automation

## Runtime

**Environment:**
- Node.js 18+ (per package.json)
- Next.js ^14.2.0 - App Router (not Pages Router)

**Package Manager:**
- npm (lockfile: package-lock.json)

## Frameworks

**Core:**
- Next.js ^14.2.0 - React metaframework with App Router, SSR/SSG/ISR
- React ^18.2.0 - UI library with functional components
- React DOM ^18.2.0 - DOM rendering

**AI/LLM:**
- AI SDK v6 (@ai-sdk/openai ^3.0.21, @ai-sdk/react ^3.0.61, ai ^6.0.59) - LLM protocol generation, meal plans

**Testing:**
- Vitest ^4.0.18 - Unit/integration test runner
- @testing-library/react ^16.3.2 - React component testing
- @testing-library/jest-dom ^6.9.1 - DOM matchers
- jsdom ^27.4.0 - DOM environment for tests

**Build/Dev:**
- @next/bundle-analyzer ^16.1.6 - Bundle size analysis (ANALYZE=true)
- @vitejs/plugin-react ^5.1.2 - Vite React support
- ts-node ^10.9.2 - TypeScript execution (scripts)

## Key Dependencies

**Critical:**
- @vercel/postgres ^0.10.0 - PostgreSQL client (Neon database access)
- stripe ^20.2.0 - Payment processing and webhooks
- jose ^6.1.3 - JWT token signing/verification (HS256)
- zod ^3.23.0 - Runtime schema validation

**Frontend Utilities:**
- lucide-react ^0.563.0 - Icon library (optimized imports)
- clsx ^2.1.1 - Conditional className utility
- tailwind-merge ^3.4.0 - Tailwind class merging
- uuid ^13.0.0 - UUID generation
- marked ^17.0.1 - Markdown rendering
- gray-matter ^4.0.3 - YAML frontmatter parsing
- dompurify ^3.3.1 - HTML sanitization (Markdown output)

**Charts & UI:**
- recharts ^3.7.0 - Charting library (used in creator analytics)
- @react-pdf/renderer ^4.3.2 - PDF generation (invoices, LMN documents)

**Payment & BNPL:**
- @stripe/react-stripe-js ^5.6.0 - Stripe React components
- @stripe/stripe-js ^8.7.0 - Stripe.js SDK
- (Klarna, Affirm, Authorize.net via custom integration)

**Bot Protection:**
- @marsidev/react-turnstile ^1.0.2 - Cloudflare Turnstile CAPTCHA

**Email:**
- resend ^4.0.0 - Transactional email service

**Utility:**
- dotenv ^17.2.3 - Environment variable loading

## Configuration

**TypeScript (`tsconfig.json`):**
- `strict: false` - Relaxed type checking
- `allowJs: true` - Allows JavaScript files
- `skipLibCheck: true` - Skips type checking of dependencies
- `moduleResolution: "node"` - Node.js module resolution
- `module: "esnext"` - ESM output
- `target: "ES2022"` (default Next.js)
- Path alias: `@/*` → project root

**Next.js (`next.config.js`):**
- `reactStrictMode: true` - Double-render components in dev
- `removeConsole` - Strip console logs in production
- Image formats: AVIF, WebP
- Optimized package imports for lucide-react, recharts, zod
- Cache headers configured per route (homepage: 5min, marketing: 1hr, auth: no-cache)
- Redirects: `/products/*` → `/pricing` (301)

**Vitest (`vitest.config.js`):**
- Environment: jsdom
- Setup file: `tests/setup.ts`
- Coverage: V8 provider (text, json, html reports)
- Includes: `lib/**/*.ts`, `app/**/*.{ts,tsx}`
- Path alias: `@/` → project root

**ESLint & Prettier:**
- ESLint ^8.57.0 with eslint-config-next
- No explicit .prettierrc (uses Next.js defaults)

## Environment Configuration

**Required vars (production):**
- `STRIPE_SECRET_KEY` - Stripe API key (sk_test_... or sk_live_...)
- `STRIPE_WEBHOOK_SECRET` - Webhook signature key (whsec_...)
- `POSTGRES_URL` - Neon PostgreSQL connection string
- `JWT_SECRET` - JWT signing key (32+ chars)
- `SESSION_SECRET` - Session encryption (32+ chars)
- `ASHER_MED_API_KEY` - Asher Med partner authentication
- `ASHER_MED_PARTNER_ID` - Asher Med partner identifier
- `ASHER_MED_API_URL` - Asher Med endpoint
- `NEXT_PUBLIC_SITE_URL` - Public site URL (for redirects, emails)

**Optional vars:**
- `RESEND_API_KEY` - Resend email service
- `FROM_EMAIL` - Email sender address
- `TURNSTILE_SECRET_KEY` - Cloudflare Turnstile bot protection
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` - Redis caching
- `KLARNA_API_KEY`, `KLARNA_API_SECRET`, `KLARNA_API_URL` - Klarna BNPL
- `NEXT_PUBLIC_KLARNA_CLIENT_ID` - Klarna client-side
- `AFFIRM_PRIVATE_API_KEY`, `AFFIRM_API_URL` - Affirm BNPL
- `NEXT_PUBLIC_AFFIRM_PUBLIC_KEY`, `NEXT_PUBLIC_AFFIRM_SCRIPT_URL` - Affirm client-side
- `NEXT_PUBLIC_ENABLE_KLARNA`, `NEXT_PUBLIC_ENABLE_AFFIRM` - Feature flags (true/false)
- `PROTOCOL_BUILDER_ALLOWED_EMAILS` - Provider access control (comma-separated)
- `STAGING_ACCESS_EMAILS` - Staging subscription bypass (comma-separated)
- `QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET` - QB OAuth2 app credentials
- `QUICKBOOKS_REALM_ID`, `QUICKBOOKS_REFRESH_TOKEN` - QB tokens (persisted in DB)
- `QUICKBOOKS_REDIRECT_URI` - QB OAuth2 callback URL
- `QUICKBOOKS_SANDBOX` - QB environment (true/false)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Google Analytics 4
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` - Google Search Console
- `NEXT_PUBLIC_CURATOR_FEED_INSTAGRAM`, `TIKTOK`, `YOUTUBE` - Curator.io feed IDs
- `ASHER_MED_ENVIRONMENT` - production or sandbox
- `ADMIN_APPROVAL_EMAIL` - Club order approval contact
- `ADMIN_ALLOWED_EMAILS` - Admin panel access (comma-separated)

**Env file existence:**
- `.env` - Development (not committed, git-ignored)
- `.env.example` - Template with all variables documented
- `.env.local` - Local overrides (not committed)

## Build & Runtime

**Development:**
```bash
npm install              # Install dependencies
npm run dev              # Dev server (port 3000)
npm run dev -- -p 3001  # Alternative port
```

**Production:**
```bash
npm run build            # Next.js build (requires env vars)
npm start                # Production server (requires build)
npm run lint             # ESLint check
npm run analyze          # Bundle analysis (ANALYZE=true)
npm test                 # Run Vitest suite
npm test -- --watch     # Watch mode
npm test -- --coverage  # Coverage report
```

**Database:**
```bash
node scripts/run-migration.mjs  # Run SQL migrations
```

**Stripe Setup (one-time):**
```bash
npm run setup:stripe     # Create Stripe products
```

## Platform Requirements

**Development:**
- Node.js 18+
- npm or yarn
- PostgreSQL client (psql) - optional, for direct DB queries

**Production:**
- Deployment: Vercel (automatic per branch)
- Database: Neon PostgreSQL (via @vercel/postgres)
- CDN: Vercel Edge Network
- Storage: AWS S3 (presigned URLs via Asher Med)

## Deployment Configuration

**Branch Strategy:**
| Branch | Environment | Domain |
|--------|-------------|--------|
| production | Production | cultrhealth.com |
| staging | Staging | staging.cultrhealth.com, join.cultrhealth.com |
| main | Base (for PRs) | — |

**Automatic Deployment:**
- Push to branch → Vercel auto-builds → Environment deployed
- Environment variables configured per branch in Vercel dashboard
- Migrations run manually via CLI

**Cache Policy:**
- HTML pages: `public, max-age=0, s-maxage=300/3600, stale-while-revalidate` (homepage: 5min, marketing: 1hr)
- Auth/dynamic pages: `private, no-cache, no-store, must-revalidate`
- Static assets (images, fonts): `public, max-age=31536000, immutable` (1 year)

---

*Stack analysis: 2026-03-10*
