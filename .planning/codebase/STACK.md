# Technology Stack

**Analysis Date:** 2026-05-15

## Languages

**Primary:**
- TypeScript ^5.4.0 - All application code (`app/`, `lib/`, `components/`)
- `strict: false` in `tsconfig.json` — loose type checking; `allowJs: true` allows mixed JS/TS

**Secondary:**
- JavaScript - Config files (`next.config.js`, `vitest.config.js`, `postcss.config.js`)

## Runtime

**Environment:**
- Node.js 18+ (required by Next.js 14; Cloudflare Pages build requires Node 20)
- Cloudflare Workers edge runtime on deployed routes (`export const runtime = 'edge'`)

**Package Manager:**
- npm 11.12.1
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js ^14.2.0 — App Router, server components, API routes, image optimization
- React ^18.2.0 — UI rendering, hooks, Context API

**Styling:**
- Tailwind CSS ^3.4.3 — utility-first CSS; config in `tailwind.config.ts`
- `@tailwindcss/typography` ^0.5.19 — prose styling for markdown content
- PostCSS ^8.4.38 + autoprefixer ^10.4.19 — CSS processing (`postcss.config.js`)

**Testing:**
- Vitest ^4.0.18 — unit/integration test runner (jsdom environment); config at `vitest.config.js`
- @testing-library/react ^16.3.2 — React component testing
- @testing-library/jest-dom ^6.9.1 — custom DOM matchers; setup in `tests/setup.ts`
- Playwright ^1.58.2 (`@playwright/test`) — E2E tests in `e2e/`; config at `playwright.config.ts`; projects: Desktop Chrome, Desktop Safari, Mobile Chrome (Pixel 5), Mobile Safari (iPhone 14)

**Build/Dev:**
- `@next/bundle-analyzer` ^16.1.6 — bundle size analysis (`npm run analyze`)
- Wrangler ^4.81.0 — Cloudflare Workers/Pages CLI for CF deployment
- `@opennextjs/cloudflare` ^1.14.10 — Cloudflare Pages adapter for Next.js
- ts-node ^10.9.2 — run TypeScript scripts directly (`scripts/setup-stripe.ts`)
- esbuild ^0.28.0 — fast JS bundling (used internally)
- sharp ^0.34.5 — image processing for QR code + business card PDF generation (`scripts/`)

## Key Dependencies

**Critical:**
- `stripe` ^20.2.0 — primary payment processing, subscriptions, webhooks
- `jose` ^6.1.3 — JWT signing/verification (HS256) for all auth; `lib/auth.ts`
- `@vercel/postgres` ^0.10.0 — PostgreSQL client targeting Neon; returns NUMERIC columns as strings — always coerce with `Number()` or `parseFloat()` before arithmetic
- `zod` ^3.23.0 — schema-based input validation throughout API routes; `lib/validation.ts`
- `resend` ^4.0.0 — transactional email delivery; `lib/resend.ts`
- `twilio` ^5.12.2 — SMS OTP via Verify service for portal verification (`app/api/portal/send-otp/route.ts`)

**AI / LLM:**
- `ai` ^6.0.59 (Vercel AI SDK) — core AI streaming primitives
- `@ai-sdk/openai` ^3.0.21 — OpenAI provider (GPT models)
- `@ai-sdk/react` ^3.0.61 — React hooks for streaming (meal plans, protocol generation, dosing explanations)

**PDF Generation:**
- `@react-pdf/renderer` ^4.3.2 — invoice and LMN document generation (`lib/invoice/`, `lib/lmn/`)

**Markdown:**
- `gray-matter` ^4.0.3 — frontmatter parsing for `content/library/*.md`
- `marked` ^17.0.1 — markdown-to-HTML rendering
- `dompurify` ^3.3.1 — HTML sanitization after rendering

**UI / Animation:**
- `framer-motion` ^12.36.0 / `motion` ^12.36.0 — declarative animation
- `gsap` ^3.14.2 — scroll-triggered animations (ScrollTrigger)
- `@paper-design/shaders-react` ^0.0.71 — WebGL shader backgrounds
- `three` ^0.183.2 — 3D rendering
- `lucide-react` ^0.563.0 — icon library (import-optimized in `next.config.js`)
- `recharts` ^3.7.0 — data charts (used ONLY in `components/creators/AnalyticsCharts.tsx`)
- `simplex-noise` ^4.0.3 — procedural noise for visual effects

**Infrastructure:**
- `@aws-sdk/client-s3` ^3.1019.0 + `@aws-sdk/s3-request-presigner` ^3.1019.0 — S3 file storage (medical intake uploads)
- `@marsidev/react-turnstile` ^1.0.2 — Cloudflare Turnstile bot protection widget
- `@stripe/react-stripe-js` ^5.6.0 + `@stripe/stripe-js` ^8.7.0 — Stripe Elements frontend
- `jotai` ^2.19.0 — atomic client-side state management
- `input-otp` ^1.4.2 — OTP input component for portal verification
- `uuid` ^13.0.0 — UUID generation
- `clsx` ^2.1.1 + `tailwind-merge` ^3.5.0 — class name utility; combined in `cn()` helper at `lib/utils.ts`
- `dotenv` ^17.2.3 — env loading for scripts

**Unused (in package.json but never imported):**
- `class-variance-authority` ^0.7.1 — NOT used; Button and other variants use manual objects + `cn()`

## Configuration

**TypeScript (`tsconfig.json`):**
- `strict: false`, `allowJs: true`, `skipLibCheck: true`
- `moduleResolution: "node"` (legacy, not `bundler`)
- Path alias: `@/*` → project root
- Excludes `tests/` from type-checking

**Next.js (`next.config.js`):**
- `reactStrictMode: true`
- `removeConsole` in production (keeps `error` and `warn`)
- `optimizePackageImports: ['lucide-react', 'recharts', 'zod']`
- Image formats: AVIF + WebP; device sizes 640–3840px
- Security headers on all routes (HSTS, CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- Cache-Control: marketing pages 5min edge cache; API/auth routes `no-store`; fonts 1yr immutable
- Redirects: `/products` → `/pricing`, `/library` → `/members`, `/science` → `/` (LegitScript), `/consultations` → `/members/consultations`
- `withBundleAnalyzer` wrapper (enabled via `ANALYZE=true` env var)

**ESLint:**
- `eslint` ^8.57.0 + `eslint-config-next` ^14.2.0
- Run: `npm run lint`

**Vitest (`vitest.config.js`):**
- Environment: `jsdom`, globals enabled
- Setup: `tests/setup.ts`
- Test glob: `tests/**/*.test.{ts,tsx}`
- Coverage: V8 provider, reports text/json/html, includes `lib/**/*.ts` and `app/**/*.{ts,tsx}`
- Path alias: `@/` → project root

**Playwright (`playwright.config.ts`):**
- Test dir: `e2e/`
- Timeout: 90s, 1 retry, fully parallel
- Base URL: `http://localhost:3000`
- Dev server auto-started via `webServer` config on `npm run test:e2e`

## Platform Requirements

**Development:**
- Node.js 18+ minimum
- `npm install`
- Neon PostgreSQL connection string (`POSTGRES_URL`)
- Stripe test keys, JWT/session secrets

**Production:**
- Cloudflare Pages (active hosting for `cultrhealth.com` via sibling repo `cultrhealth-web`)
- `@opennextjs/cloudflare` adapter (`wrangler` CLI for deploy)
- Node 20 required for CF Pages build
- Edge runtime on deployed routes — fire-and-forget Promises are killed on `return response`; use `fireAndForget()` from `lib/edge/wait-until.ts` for async side effects
- This legacy repo (`Cultr Health Website`) is a staging/workbench; active production deploys go through `cultrhealth-web` and `cultrclub-web` repos

---

*Stack analysis: 2026-05-15*
