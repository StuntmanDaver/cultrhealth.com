# Technology Stack

**Analysis Date:** 2026-03-22

## Languages

**Primary:**
- TypeScript ^5.4.0 — All application code (`.ts`, `.tsx`). `strict: false`, `allowJs: true`, `moduleResolution: "node"` (legacy)

**Secondary:**
- JavaScript — `next.config.js`, `vitest.config.js`, `postcss.config.js` (CommonJS modules)
- SQL — Database migrations in `migrations/*.sql`
- Markdown — Content files in `content/blog/` and `content/library/`

## Runtime

**Environment:**
- Node.js 18+

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Next.js ^14.2.0 (App Router) — Full-stack framework; server components by default, `*Client.tsx` suffix for interactive client components
- React ^18.2.0 — UI rendering; functional components + hooks exclusively
- React DOM ^18.2.0 — DOM bindings

**Testing:**
- Vitest ^4.0.18 — Test runner (jsdom environment)
- @testing-library/react ^16.3.2 — Component testing
- @testing-library/jest-dom ^6.9.1 — DOM assertions
- jsdom ^27.4.0 — DOM simulation for tests

**Build/Dev:**
- TypeScript compiler (`npx tsc --noEmit`) — Type checking
- ESLint ^8.57.0 + eslint-config-next ^14.2.0 — Linting
- PostCSS ^8.4.38 + autoprefixer ^10.4.19 — CSS processing
- @next/bundle-analyzer ^16.1.6 — Bundle size analysis (`npm run analyze`)
- ts-node ^10.9.2 — Script execution (`scripts/setup-stripe.ts`)
- sharp ^0.34.5 — Image processing (QR code + business card PDFs)
- qrcode ^1.5.4 — QR code generation

## Key Dependencies

**Critical:**
- `@vercel/postgres` ^0.10.0 — Neon PostgreSQL client via Vercel Postgres SDK; all DB access goes through `lib/db.ts` and feature-specific db files using `sql` tagged template literal
- `stripe` ^20.2.0 — Subscriptions, checkout sessions, webhook verification; client also used server-side in `lib/auth.ts` for membership lookup fallback
- `jose` ^6.1.3 — JWT creation and verification (HS256); powers all auth in `lib/auth.ts` and `lib/portal-auth.ts`
- `zod` ^3.23.0 — Runtime schema validation for API inputs (`lib/validation.ts`) and SiPhox API responses (`lib/siphox/schemas.ts`)
- `resend` ^4.0.0 — Transactional email delivery via `lib/resend.ts`
- `ai` ^6.0.59 + `@ai-sdk/openai` ^3.0.21 — AI SDK v6 powering protocol generation (`app/api/protocol/generate/route.ts`) and meal plans (`app/api/meal-plan/route.ts`)
- `twilio` ^5.12.2 — SMS OTP delivery for portal phone authentication (`app/api/portal/send-otp/`)
- `dotenv` ^17.2.3 — Environment variable loading

**UI/Styling:**
- Tailwind CSS ^3.4.3 — Utility-first CSS; config at `tailwind.config.ts`
- @tailwindcss/typography ^0.5.19 — Prose styles for rendered markdown content
- `clsx` ^2.1.1 + `tailwind-merge` ^3.4.0 — Combined via `cn()` in `lib/utils.ts`
- `lucide-react` ^0.563.0 — Icon library (import-optimized in `next.config.js`)
- `framer-motion` ^12.36.0 + `motion` ^12.36.0 — Animation library (both packages present)
- `@paper-design/shaders-react` ^0.0.71 — WebGL mesh gradient background (`components/ui/MeshBackground.tsx`)
- `recharts` ^3.7.0 — Charts; used only in `components/creators/AnalyticsCharts.tsx`
- `three` ^0.183.2 — 3D/WebGL (present in `package.json`; verify active usage)
- `simplex-noise` ^4.0.3 — Noise generation (likely for shader/animation effects)

**Content:**
- `gray-matter` ^4.0.3 — Frontmatter parsing for `.md` files in `content/`
- `marked` ^17.0.1 — Markdown rendering
- `dompurify` ^3.3.1 — XSS sanitization of rendered HTML
- `@react-pdf/renderer` ^4.3.2 — PDF generation for invoices (`lib/invoice/`) and LMN documents (`lib/lmn/`)

**Forms:**
- `input-otp` ^1.4.2 — OTP input component for portal phone authentication (`app/portal/login/`)
- `uuid` ^13.0.0 — UUID generation

**Unused (listed in package.json but not imported):**
- `class-variance-authority` ^0.7.1 — Never imported; components use manual variant objects with `cn()`

## Configuration

**TypeScript (`tsconfig.json`):**
- `strict: false` — Not in strict mode; loose type checking
- `moduleResolution: "node"` — Legacy Node resolution (not `bundler`)
- `allowJs: true`, `skipLibCheck: true`
- `incremental: true` — Faster rebuilds via `tsconfig.tsbuildinfo`
- Path alias: `@/*` maps to project root
- Excludes: `node_modules`, `tests`

**Build (`next.config.js`):**
- `reactStrictMode: true`
- `removeConsole: true` in production
- `optimizePackageImports: ['lucide-react', 'recharts', 'zod']`
- Image formats: AVIF + WebP; device sizes configured for full responsive range
- Caching: differentiated headers per route group (public marketing vs. private authenticated vs. assets)
- Redirects: `/products` → `/pricing` (301)
- Bundle analyzer: `ANALYZE=true npm run build`

**Deployment (`vercel.json`):**
- `main` and `master` branches: deploy disabled
- Vercel Cron jobs:
  - `/api/cron/siphox-fulfillment` — every 15 minutes
  - `/api/cron/siphox-results` — every hour

**Environment:**
- Template: `env.example` at project root
- Required vars: `STRIPE_SECRET_KEY`, `POSTGRES_URL`, `JWT_SECRET`, `SESSION_SECRET`, `ASHER_MED_API_KEY`, `NEXT_PUBLIC_SITE_URL`
- SiPhox vars (not in `env.example`): `SIPHOX_API_KEY`, `SIPHOX_API_URL`
- Twilio (for portal OTP): `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`
- Feature flags (BNPL): `NEXT_PUBLIC_ENABLE_KLARNA`, `NEXT_PUBLIC_ENABLE_AFFIRM`, `NEXT_PUBLIC_ENABLE_AUTHORIZE_NET`

**Linting/Formatting:**
- ESLint with `eslint-config-next` — `npm run lint`
- No Prettier config detected; formatting enforced via `code-audit.sh` post-tool hook
- PostCSS + autoprefixer via `postcss.config.js`

## Platform Requirements

**Development:**
- Node.js 18+
- npm (lockfile must be respected)
- Development server: `npm run dev` → http://localhost:3000
- Dev mode: auth is auto-bypassed (`getSession()` returns mock admin session)

**Production:**
- Vercel (automatic deploys from `staging` and `production` branches; `main` deploy disabled per `vercel.json`)
- Database: Neon PostgreSQL (accessed via `@vercel/postgres` SDK, connection string: `POSTGRES_URL`)
- Migrations: manual via `node scripts/run-migration.mjs`
- Current migration count: 24 files (`002` through `024`)

---

*Stack analysis: 2026-03-22*
