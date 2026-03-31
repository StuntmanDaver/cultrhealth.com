# Technology Stack

**Analysis Date:** 2026-03-11

## Languages

**Primary:**
- TypeScript ^5.4.0 — All application code (strict: false, allowJs: true)
- JavaScript — Config files (next.config.js, vitest.config.js, postcss.config.js)

**Secondary:**
- SQL — Database migrations in `migrations/` (11 files)
- Markdown — Content files in `content/blog/` and `content/library/`

## Runtime

**Environment:**
- Node.js 18+ (required by Next.js 14 and @vercel/postgres)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Next.js ^14.2.0 (App Router) — Full-stack React framework, SSR/SSG, API routes
- React ^18.2.0 — UI component library
- React DOM ^18.2.0 — DOM rendering

**Styling:**
- Tailwind CSS ^3.4.3 — Utility-first CSS, configured at `tailwind.config.ts`
- @tailwindcss/typography ^0.5.19 — Prose styling for rendered markdown
- PostCSS ^8.4.38 — CSS processing pipeline, configured at `postcss.config.js`
- Autoprefixer ^10.4.19 — CSS vendor prefixing

**Testing:**
- Vitest ^4.0.18 — Test runner, configured at `vitest.config.js`
- @testing-library/react ^16.3.2 — React component testing
- @testing-library/jest-dom ^6.9.1 — DOM assertion matchers
- jsdom ^27.4.0 — Browser environment simulation for tests

**Build/Dev:**
- @next/bundle-analyzer ^16.1.6 — Bundle size analysis (triggered by `ANALYZE=true`)
- ts-node ^10.9.2 — TypeScript execution for scripts (e.g., `scripts/setup-stripe.ts`)

## Key Dependencies

**Authentication & Security:**
- jose ^6.1.3 — JWT signing and verification (HS256 algorithm); magic link tokens (15 min) + session tokens (7 days) + portal tokens
- @marsidev/react-turnstile ^1.0.2 — Cloudflare Turnstile bot protection UI component
- uuid ^13.0.0 — UUID generation for IDs

**Database:**
- @vercel/postgres ^0.10.0 — SQL client for Neon PostgreSQL (`sql` tagged template literal)

**Payments:**
- stripe ^20.2.0 — Stripe server SDK (subscriptions, webhooks, checkout)
- @stripe/react-stripe-js ^5.6.0 — Stripe React components
- @stripe/stripe-js ^8.7.0 — Stripe client-side JS loader

**Email:**
- resend ^4.0.0 — Transactional email service client

**AI/LLM:**
- ai ^6.0.59 — Vercel AI SDK core (streaming, tool calls)
- @ai-sdk/openai ^3.0.21 — OpenAI provider for AI SDK (protocol generation, meal plans)
- @ai-sdk/react ^3.0.61 — React hooks for AI SDK streaming

**Content:**
- gray-matter ^4.0.3 — Frontmatter parsing for markdown files in `content/`
- marked ^17.0.1 — Markdown-to-HTML rendering
- dompurify ^3.3.1 — HTML sanitization for rendered markdown (XSS protection)

**PDF Generation:**
- @react-pdf/renderer ^4.3.2 — PDF generation for invoices (`lib/invoice/`) and LMN documents (`lib/lmn/`)

**Telephony:**
- twilio ^5.12.2 — SMS OTP for portal authentication (`app/api/portal/`)

**UI Utilities:**
- clsx ^2.1.1 — Conditional CSS class construction
- tailwind-merge ^3.4.0 — Merge conflicting Tailwind classes
- lucide-react ^0.563.0 — Icon library (optimized via `optimizePackageImports` in next.config.js)
- recharts ^3.7.0 — Chart library (used only in `components/creators/AnalyticsCharts.tsx`)
- input-otp ^1.4.2 — OTP input component for portal login
- dotenv ^17.2.3 — Environment variable loading for scripts

**Validation:**
- zod ^3.23.0 — Schema validation for API inputs and form data (`lib/validation.ts`)

**Unused (listed in package.json but not imported):**
- class-variance-authority ^0.7.1 — NOT used; Button variants use manual objects + `cn()` instead

## Configuration

**TypeScript (`tsconfig.json`):**
- `strict: false` — Not in strict mode; allows implicit any
- `allowJs: true` — JavaScript files allowed
- `moduleResolution: "node"` — Legacy Node resolution (not modern `bundler`)
- `skipLibCheck: true` — Skip type-checking of declaration files
- `baseUrl: "."` with `paths: { "@/*": ["./*"] }` — Path alias for project root
- `incremental: true` — Faster rebuilds via `.tsbuildinfo`
- Tests excluded from compilation via `"exclude": ["tests"]`

**ESLint:**
- Config: ESLint ^8.57.0 + eslint-config-next ^14.2.0 (standard Next.js rules)
- No custom `.eslintrc` file observed — uses Next.js defaults

**Build (`next.config.js`):**
- `reactStrictMode: true`
- `compiler.removeConsole` in production
- `experimental.optimizePackageImports: ['lucide-react', 'recharts', 'zod']`
- Image formats: AVIF + WebP
- Redirects: `/products` and `/products/*` → `/pricing` (301 permanent)
- Caching headers per route pattern (HIPAA: authenticated routes `private, no-cache`)
- Bundle analyzer: wrapped with `withBundleAnalyzer` (enabled when `ANALYZE=true`)

**Fonts:**
- Loaded via `next/font/google` in `app/layout.tsx`
- Fraunces (display/serif): weights 400, 500, 600, 700; CSS var `--font-fraunces`
- Playfair Display (headings): weights 400, 500, 600, 700; CSS var `--font-display`
- Inter (body): weights 400, 500, 600; CSS var `--font-body`

**Environment:**
- Template: `env.example` in project root
- Environment-specific vars managed in Vercel dashboard
- Development: `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
- Staging: `NEXT_PUBLIC_SITE_URL` contains "staging" (triggers staging bypass behavior)

**Middleware (`middleware.ts`):**
- Rewrites `join.cultrhealth.com` → `/join` route internally
- Passes through `/api`, `/join`, `/_next`, `/images`, static assets unchanged
- Matcher: all paths except `_next/static`, `_next/image`, `favicon.ico`

## Platform Requirements

**Development:**
- Node.js 18+
- npm (install with `npm install`)
- Run dev server: `npm run dev` (http://localhost:3000)
- Run tests: `npm test`
- Run migration: `node scripts/run-migration.mjs`

**Production:**
- Hosting: Vercel (automatic deployments from `staging` and `production` branches)
- Database: Neon PostgreSQL (accessed via `@vercel/postgres` SDK)
- Environment variables configured per environment in Vercel dashboard
- `staging` branch → staging.cultrhealth.com + join.cultrhealth.com
- `production` branch → cultrhealth.com

## Test Configuration

- Runner: Vitest, config at `vitest.config.js`
- Environment: `jsdom` (browser simulation)
- Setup file: `tests/setup.ts`
- Test files: `tests/**/*.test.{ts,tsx}` (8 test files in `tests/`)
- Coverage: V8 provider, includes `lib/**/*.ts` and `app/**/*.{ts,tsx}`
- Path alias: `@` → project root (`__dirname`)
- Run commands:
  ```bash
  npm test                         # Run all tests
  npm test -- --watch              # Watch mode
  npm test -- --coverage           # Generate coverage report
  npm run analyze                  # Bundle analysis (ANALYZE=true next build)
  ```

---

*Stack analysis: 2026-03-11*
