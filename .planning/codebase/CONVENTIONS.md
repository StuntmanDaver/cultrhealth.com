# Coding Conventions
*Last updated: 2026-04-20*
*Scope: cultrhealth.com + cultrclub.com*

Two sibling Next.js applications share a brand, a database schema, and many patterns — but they run on different platforms (Vercel vs. Cloudflare Pages) and are wired very differently at the edges. These conventions apply to both repos unless a rule is explicitly scoped to one.

- **cultrhealth.com** → `/Users/davidk/Documents/Dev-Projects/App-Ideas/Cultr Health Website/` (Next.js 14 on Vercel; full product surface: marketing, admin, creator portal, member portal, intake)
- **cultrclub.com** → `/Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/` (Next.js 15 on Cloudflare Pages via `@cloudflare/next-on-pages`; customer-facing club storefront only)

---

## 1. TypeScript Config

Both repos intentionally run in loose mode — no `strict: true`, `allowJs: true`, `skipLibCheck: true`. Do not flip strict on in a single PR; it will cascade into hundreds of errors.

### cultrhealth.com — `tsconfig.json`
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] },
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "incremental": true,
    "module": "esnext",
    "esModuleInterop": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "plugins": [{ "name": "next" }]
  },
  "exclude": ["node_modules", "tests"]
}
```

- No `target` set - defaults to ES5 for legacy reasons
- `tests` is excluded from `include` - Vitest compiles them separately
- Uses legacy `moduleResolution: "node"`, NOT `bundler`

### cultrclub.com - `tsconfig.json`
Nearly identical, with these key differences:

- `"target": "ES2017"` is set explicitly (Cloudflare Workers/Edge needs a modern target)
- `tests` is NOT in `exclude` - there are no tests to exclude
- Everything else (paths, allowJs, strict:false, node resolution) matches

### Path alias (both repos)
`@/*` → repo root. Imports always go through the alias:
```typescript
import { sql } from '@/lib/db'          // yes
import { sql } from '../../../lib/db'  // never
```
Vitest (cultrhealth only) mirrors this with `resolve.alias['@'] = __dirname` in `vitest.config.js`.

---

## 2. Component Patterns

### cultrhealth.com
- **Server components by default.** Pages (`app/**/page.tsx`) are server components and fetch data directly (DB, config) with `await`.
- **Client islands use `*Client.tsx` naming.** Any page needing interactivity splits into a thin `page.tsx` that renders `<SomethingClient />`. Examples: `QuizClient.tsx`, `IntakeFormClient.tsx`, `ShopClient.tsx`, `OnboardingClient.tsx`, `JoinLandingClient.tsx`, `AdminDashboardClient.tsx`.
- **Dynamic imports for below-the-fold homepage components.** `app/page.tsx` uses `next/dynamic` for `PricingCard`, `FAQAccordion`, `ClubBanner`, `NewsletterSignup` with loading skeletons.
- **Button is manual variants, NOT CVA.** `components/ui/Button.tsx` composes `baseStyles + variants[variant] + sizes[size] + className` through `cn()`. Variants: `primary` / `secondary` / `ghost`. Sizes: `sm` / `md` / `lg`. Has built-in `isLoading` spinner. All variants are `rounded-full`. **`class-variance-authority` is in package.json but must never be imported** - every variant uses the manual-object-plus-`cn()` pattern.
- **State sharing uses React Context.** `lib/contexts/CreatorContext.tsx`, `lib/contexts/intake-form-context.tsx`, `lib/cart-context.tsx`. No Zustand, no Redux.
- **Forms are native React state + Zod.** No react-hook-form, no Formik. Zod schemas live in `lib/validation.ts`.

### cultrclub.com
- **Same server-first pattern, but with much tighter edge constraints.** `app/page.tsx` is a server component that reads cookies via `next/headers` and SSR-hydrates member state from `cultr_club_visitor` (signed JWT) - this is critical so Safari/iOS render a logged-in navbar without a client round-trip.
- **Single `JoinLandingClient.tsx` owns the entire customer-facing app** (landing, signup modal, cart, checkout flow) - mirrors the cultrhealth `/join-club` pattern.
- **Button is an almost-identical clone** of cultrhealth's but wraps the `<button>` in `framer-motion`'s `motion.button` for whileHover/whileTap scale animations. Same three variants, same manual-`cn()` pattern, same `rounded-full`, same built-in spinner. Uses the same `isLoading` prop contract.
- **Signed visitor token, not localStorage.** Club profile data (phone, address, age, gender) MUST NOT be stored in client-readable cookies or localStorage. `cultr_club_visitor` is a minimal signed JWT (`{ email }`) that the server uses to re-hydrate the full member record from `club_members` on every request. See `lib/auth.ts::createClubVisitorToken` + `verifyClubVisitorToken`.

---

## 3. Styling Conventions

Both apps use Tailwind 3.4 utility-first with `@tailwindcss/typography`. No CSS modules, no styled-components, no emotion.

### Shared brand tokens (both `tailwind.config.ts` files)

| Token | Hex | Purpose |
|---|---|---|
| `brand-primary` / `forest` | `#2A4542` (`#2B4542` in cultrclub) | Primary text, buttons, backgrounds |
| `brand-primaryHover` / `forest-dark` | `#1F3533` | Pressed state |
| `brand-primaryLight` / `forest-light` | `#3A5956` / `#3D5E5B` | Hover state |
| `brand-cream` / `cream` | `#FDFBF7` / `#FCFBF7` | Page / body background |
| `brand-creamDark` / `cream-dark` | `#F5F0E8` / `#F5F2ED` | Card background |
| `sage` | `#B7E4C7` | Accents, badges |
| `mint` | `#D8F3DC` / `#D7F3DC` | Highlights, trust badges |
| `aura-*` | Purple / lavender / sage / mint / orange / peach / yellow | Decorative gradient blobs |
| `cultr-*` | Legacy aliases | Back-compat only - prefer `brand-*` in new code |

Note the 1-hex drift between repos (`#2A4542` vs `#2B4542`) on forest. Both render as "the same forest." Treat them as equivalent in design reviews; don't "fix" one to match the other.

### Typography

Both repos load three variable fonts via `next/font/google` and expose them as CSS vars:

```typescript
const fraunces = Fraunces({ variable: '--font-fraunces' })
const playfair = Playfair_Display({ variable: '--font-display' })
const inter = Inter({ variable: '--font-body' })
```

Tailwind exposes:
- `font-display` / `font-fraunces` → Playfair Display / Fraunces (headings & brand)
- `font-body` / `font-sans` → Inter (body copy)

**Brand typography rule (hard):**
- `CULTR` and `CULTR HEALTH` always render in Playfair Display (`font-display`).
- Slogan `Change the CULTR, rebrand yourself.` renders in Inter (`font-body`) with `rebrand` in lowercase italic.
- In cultrclub, use the `brandify(text)` helper in `lib/utils.ts` which wraps every occurrence of `CULTR` in a `<span className="font-display font-bold">`. Use this whenever text is user-visible and contains `CULTR`.

### Color usage rules

- **Never hardcode hex values in JSX or CSS.** Use Tailwind brand tokens. The `marketing-check.sh` hook flags `"#[0-9a-fA-F]{6}"` literals in marketing files.
- **Never invent tokens that don't exist.** Historic dead-ends: `cultr-copper`, `cultr-charcoal` - these are NOT defined in `tailwind.config.ts` and will silently fall through.

### Animation tokens (both tailwind configs)
`fade-in`, `slide-up`, `float`, `shimmer`, `scale-in`, `blur-in`, `bounce-subtle`, `glow-pulse`, `pulse-slow`, `aurora`, `marquee-up` - with matching keyframes. Prefer these over adding new keyframes.

---

## 4. API Route Patterns

### cultrhealth.com

Standard Next.js 14 App Router: files at `app/api/**/route.ts` export `GET`, `POST`, `PATCH`, `DELETE` async functions that accept `(request: NextRequest, { params })` and return `NextResponse.json(...)`.

- Runtime is **Node.js by default** (no `export const runtime = 'edge'` unless a route explicitly needs edge features).
- Uses `@vercel/postgres`'s `sql` tagged template.
- Has 72 API routes spanning: auth, checkout (Stripe + Affirm + Klarna + Authorize.net), webhooks, creators, club, admin, intake, LMN, member, protocol, meal-plan, renewal, tracking, cron, waitlist.

### cultrclub.com

Much smaller API surface (3 groups: `club/*`, `health`, `stock`) but every route follows a strict edge-runtime template:

```typescript
export const runtime = 'edge'                       // REQUIRED on every route

import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'                      // neon() proxy, not @vercel/postgres
import { formLimiter, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request)
    const rl = await formLimiter.check(`some-bucket:${clientIp}`)
    if (!rl.success) return rateLimitResponse(rl)

    const body = await request.json() as Record<string, any>
    // ... validation, DB work, email, return ...
  } catch (err) {
    console.error('[club/route] Error:', describeError(err))
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
```

**Edge-specific rules for cultrclub:**
- **`export const runtime = 'edge'` on every route.** No exceptions. The Cloudflare Pages build flags any route missing this.
- **Use Web Crypto, not Node `crypto`.** Example: HMAC approval token generation in `app/api/club/orders/route.ts` uses `crypto.subtle.importKey` + `crypto.subtle.sign`, and `crypto.getRandomValues(new Uint8Array(2))` for order-number entropy.
- **Dynamic `import()` for heavy libs.** `resend`, `@/lib/creators/commission`, `@/lib/creators/db` are imported dynamically inside the handler so the edge bundle stays small.
- **`NO_CACHE_HEADERS` on any route returning live data.** See `app/api/stock/route.ts`:
  ```typescript
  const NO_CACHE_HEADERS = {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'CDN-Cache-Control': 'no-store',
    'Vercel-CDN-Cache-Control': 'no-store',
  }
  ```

---

## 5. Database Patterns (both repos)

### Two different clients, same SQL dialect

| Repo | Client | Import |
|---|---|---|
| cultrhealth | `@vercel/postgres` | `import { sql, db } from '@vercel/postgres'` |
| cultrclub | `@neondatabase/serverless` (lazy proxy) | `import { sql, createPool } from '@/lib/db'` |

**cultrclub's `lib/db.ts` uses a lazy `Proxy` around `neon()`** so the client isn't instantiated at build time when `POSTGRES_URL` is absent:
```typescript
let _sql: NeonQueryFunction<false, true> | null = null
function _getSql() {
  if (!_sql) _sql = neon(process.env.POSTGRES_URL!, { fullResults: true })
  return _sql
}
export const sql = new Proxy(function () {} as any, {
  apply(_, thisArg, args) { return Reflect.apply(_getSql() as any, thisArg, args) },
  get(_, prop) { return (_getSql() as any)[prop] },
})
```

**Critical:** `neon()` MUST be called with `{ fullResults: true }` so it returns `{ rows, rowCount, command, fields }` matching `@vercel/postgres`'s shape. Without it, every `.rows` access silently breaks.

### Transactions (cultrclub)
Use `createPool()` + `client.query(...)` with manual `BEGIN` / `COMMIT` / `ROLLBACK` / `client.release()` / `pool.end()`. See `app/api/club/orders/route.ts` for the canonical pattern: member upsert + order insert + inventory decrement are wrapped in a single transaction so partial writes are impossible.

### NUMERIC coercion (both repos)

**`@vercel/postgres` AND neon-serverless both return NUMERIC columns as strings.** Always coerce:

```typescript
// correct
const quantity = row.stock_quantity != null ? Number(row.stock_quantity) : null
const amount = parseFloat(row.amount_usd)
const count = parseInt(row.active_count, 10)

// wrong - arithmetic on strings silently concatenates
const total = row.subtotal + row.tax     // "10" + "2" = "102"
```

Alternatively, cast in SQL:
- `COUNT(*)::integer` - return count as JS number directly
- `amount::float8` - return float as JS number
- `SUM(amount)::float8` - aggregate + float cast

### SQL patterns

- **Interval math: `NOW() - make_interval(days => $1)`** - NOT `NOW() - '$1 days'::interval`. The string-interpolation form breaks in parameterized queries.
- **Null-safe comparison: `IS DISTINCT FROM` / `IS NOT DISTINCT FROM`** - instead of `!=` / `=` when either side may be null.
- **Parallel queries > `UNION ALL`** - when running independent aggregates, `Promise.all([sql\`...\`, sql\`...\`])` is faster on Neon than a single UNION query.
- **GROUP BY columns MUST also appear in SELECT.** If code reads `row.creator_id`, then `creator_id` must be both in the `SELECT` list AND the `GROUP BY` clause. Never maintain a partial hardcoded allowlist when a canonical source exists.
- **Lifetime-vs-period metrics:** when one query returns both, guard the period with `SUM(CASE WHEN created_at >= $since THEN amount ELSE 0 END)` rather than filtering the whole table in `WHERE`. Otherwise "lifetime" totals are silently truncated to the period window.
- **Parameterized queries only.** Never string-interpolate user input into SQL - use `${}` tagged template slots.

### Admin analytics union rule

When computing coupon / revenue / creator-commission metrics in admin, ALWAYS combine:
- `club_orders` rows (club checkouts from cultrclub + legacy club checkouts from cultrhealth's `/join-club`)
- `order_attributions` rows (main-site Stripe checkouts)

Missing either side = missing revenue. Use `UNION ALL` in the CTE or run two queries and merge in JS - never look at only one table.

---

## 6. Auth Conventions

### JWT via `jose` (both repos, HS256)

- Secret: `SESSION_SECRET` (falls back to `JWT_SECRET` in cultrclub for the visitor token only)
- Algorithm: `HS256`
- Every token sets `.setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('...')`
- Verification wraps `jwtVerify(token, secret)` in `try/catch` and returns `null` on failure

### cultrhealth auth cookies
- `cultr_session` - member session (patients, providers, admins use role field inside payload)
- `cultr_admin_return_v2` - "Login As" masquerade return ticket (NEVER append to existing Set-Cookie; use distinct cookie name instead of trying to clear both host + domain variants)
- `cultr_attribution` - creator attribution cookie (30-day window, domain `.cultrhealth.com`)
- Creators use a **separate** JWT (different payload shape + scope), not the member session

### cultrclub auth cookies
- `cultr_club_visitor` - signed minimal `{ email }` JWT, 90-day expiry, domain `.cultrclub.com`. Used for SSR member hydration only. Full profile is re-read from `club_members` on every request.
- `cultr_visitor_ctx` - UTM + first-visit tracking, set in `middleware.ts`, 30-day expiry, domain `.cultrclub.com` (or `.cultrhealth.com` if hostname matches)
- `cultr_attribution` - creator attribution cookie (same cross-subdomain strategy)

### Cookie safety - HARD RULE (both repos)

**NEVER use `response.headers.append('Set-Cookie', …)` in a `NextResponse`.**
- Vercel's Edge runtime and Cloudflare Pages both merge multiple `append` calls into a single comma-separated `Set-Cookie` header, which violates the HTTP spec.
- Safari and Chrome silently drop those cookies → users get infinite session-timeout loops.
- **Always** use `response.cookies.set()` / `response.cookies.delete()`.
- `response.cookies.set()` OVERWRITES a cookie of the same name even across different domain attributes. To clear both host-only and domain-scoped variants of the same logical cookie, use **distinct cookie names** (e.g. `cultr_session` + `cultr_session_v2`), not `set()`-with-different-domains.

### Cookie-domain helper (cultrclub)
`lib/utils.ts::getCookieDomain(hostname?)` returns:
- `.cultrclub.com` for `*.cultrclub.com`
- `.cultrhealth.com` for `*.cultrhealth.com`
- `undefined` for localhost / dev (browser default = host-only)

Always pass the live request hostname (`new URL(request.url).hostname`), not `process.env.NEXT_PUBLIC_SITE_URL`. On Cloudflare Workers, the env var is frequently stale or empty at edge.

### Staging bypass (cultrhealth only)
On `staging.cultrhealth.com`:
- Magic-link flow returns the token in the API response instead of emailing it (any email address)
- Team emails (`stewart@`, `erik@threepointshospitality.com`, + 3 others) are auto-provisioned as approved creators on first login
- Creator magic-link rate limiting is skipped for these emails and for all staging hostnames so Safari/WebKit retries don't fail spuriously
- Gate: `process.env.NEXT_PUBLIC_SITE_URL` contains `staging`

### Anti-enumeration (cultrclub login)
`app/api/club/login/route.ts` returns the **same** generic error `{ error: 'Email or phone number is incorrect.' }` with **same** HTTP 401 for:
- Unknown email
- Known email with wrong phone

This is deliberate. Do not add more-specific error codes; it would leak member-enumeration.

---

## 7. Error Handling & Validation

### Validation

- **Zod is the only validation library.** Schemas live in `lib/validation.ts` (cultrhealth). Never add Yup, Joi, io-ts.
- Rendered markdown/HTML content MUST pass through DOMPurify. `lib/resend.ts::escapeHtml` is a lightweight escape helper for non-markdown user-supplied strings in email templates - every user-controlled field interpolated into email HTML must be escaped (see all `escapeHtml(...)` call sites in `lib/resend.ts`).

### HIPAA no-PHI-logging (both repos)

Protected Health Information must never appear in logs. The `code-audit.sh` hook grep-blocks on patterns like:

```
console\.(log|warn|error).*(patient|ssn|dob|date.of.birth|medical|diagnosis|
  prescription|email|customerEmail|\.phone|phoneNumber|firstName|lastName|
  dateOfBirth|shippingAddress|patientName)
```

**Correct:** log only IDs + error messages.
```typescript
console.error('[club/orders] DB error (fatal):', describeError(dbError))
console.error('[club/orders] Attribution processing failed (non-fatal):', {
  orderId, method: attributionMethod, error: describeError(attrError)
})
```

**Wrong:** logging any of `email`, `firstName`, `phone`, `dateOfBirth`, `shippingAddress`, medication names, etc.

Exception: the grep allowlist permits log lines that are clearly about email-sending success/failure (e.g. `emailError`, `send.*email`, `email.*sent`, `REDACTED`) - only the error + outcome, never the contents.

### Error message pattern

User-facing errors are generic: `'Please try again shortly.'`, `'We could not save your order.'`, `'Internal server error.'`. Never surface DB error codes, stack traces, or PHI to the client. Log the specific error server-side (without PHI) for debugging.

---

## 8. Commission & Attribution Lifecycle

Commissions are **deferred to shipment for club orders** - creators must not earn on abandoned checkouts.

1. **At checkout** (`app/api/club/orders/route.ts` in both repos) - writes `order_attributions` row via `processOrderAttribution({ skipCommissionLedger: true })`. No commission ledger row yet.
2. **On `shipped` transition** (admin status update) - calls `recordCommissionsForShippedOrder()`. Idempotent: no-op if already recorded.
3. **Rollback from `shipped` / `fulfilled`** - calls `reverseCommissionsForAttribution()`.
4. **Cancel / dismiss / Stripe refund** - same `reverseCommissionsForAttribution()`.
5. **Cron `approveEligibleCommissions()`** - for club-order-linked attributions, only auto-approves if `club_orders.status IN ('shipped', 'fulfilled')`. Stripe subscription path is independent and auto-approves on the 30-day refund window.

**Hard rule:** every cancel / remove path MUST call `reverseCommissionsForAttribution()` so creators never keep commission for work that got undone.

**Retroactive attribution (admin approval):** when an admin approves an order that carries an unattributed coupon code which now belongs to an active creator, the commission is mapped retroactively on approval. This prevents lost commissions when internal promo codes are transferred to an affiliate after an order is placed.

**Zero-revenue attribution:** for quote-only carts (all items have `price: null`), call `recordZeroRevenueAttribution()` instead - the referral is tracked but the commission is recorded later, when the invoiced amount is known.

---

## 9. Email URL Rule (cultrhealth only)

Email HTML must build absolute URLs from `getEmailSiteUrl()` (in `lib/resend.ts`), which falls back to `https://staging.cultrhealth.com` when `NEXT_PUBLIC_SITE_URL` is missing or contains `localhost`. Never use raw `process.env.NEXT_PUBLIC_SITE_URL` in email templates - localhost URLs are unreachable from mail clients and silently break every `<img>` and every link in the email.

cultrclub emails use `process.env.NEXT_PUBLIC_SITE_URL || 'https://cultrclub.com'` for customer-facing links, and a separate `process.env.ADMIN_BASE_URL || 'https://cultrhealth.com'` for admin approval links (approval dashboard lives on cultrhealth admin).

---

## 10. Owner Email Filtering (cultrhealth only)

Admin analytics / dashboards filter out internal test accounts from marketplace-level aggregates (creator network tables, commission/revenue/conversion aggregates, coupon performance, payout batches):

```typescript
// lib/config/owner-emails.ts
export const OWNER_EMAILS = [
  'erik@cultrhealth.com',
  'alex@cultrhealth.com',
  'tony@cultrhealth.com',
  'david@cultrhealth.com',
  'erik@threepointshospitality.com',
]
```

- Stewart (`stewart@cultrhealth.com`) is a part owner but is intentionally **NOT** in this list - he operates as a real creator (STEWART1 code) and his metrics must appear in admin dashboards alongside other creators.
- Owner-attributed orders still exist in the DB and show up in the owner's own `/creators/portal` dashboard. Only admin-level aggregates filter them out.
- Never filter `CULTR*` or `CULTRSTAFF` by coupon code - those are company-level codes without individual creator attribution and must remain in revenue totals.
- Never assign owner accounts as code / PR reviewers.

---

## 11. Cloudflare Pages Gotchas (cultrclub only)

Cloudflare Pages runs the built Next.js output through `@cloudflare/next-on-pages` which produces Workers-compatible bundles. Several Next.js conventions silently break.

- **`next.config.js` `async headers()` is DROPPED on Pages.** The config file is still needed (the build reads `images.unoptimized: true` from it) but `headers()` returns are ignored for dynamic/SSR routes.
  - Static assets: use a `public/_headers` file (Cloudflare Pages native)
  - Dynamic / SSR / HTML: set headers in `middleware.ts` via `response.headers.set(...)` - see `middleware.ts` for the X-Robots-Tag / Referrer-Policy / X-Frame-Options / X-Content-Type-Options pattern with preview-bot carveouts.
- **`images.unoptimized: true` is mandatory.** `next/image` optimization isn't supported on Pages. Every image renders at its source resolution.
- **`compatibility_flags = ["nodejs_compat"]` in `wrangler.toml` is required.** Without it, Web Crypto / HMAC / TextEncoder fail in SSR.
- **Every route handler uses `export const runtime = 'edge'`.** Pages doesn't support Node runtime handlers.
- **`neon()` MUST use `{ fullResults: true }`** (see §5).
- **Cookie domain uses request hostname, NOT env var.** The Worker can't trust `NEXT_PUBLIC_SITE_URL` to be populated. Use `getCookieDomain(new URL(request.url).hostname)`.
- **Emails go through dynamic `import('resend')` inside handlers** so the static edge bundle stays under Cloudflare's worker size limits.
- **Deploy commands:**
  - Staging: `npm run deploy:staging` → `npx wrangler pages deploy .vercel/output/static --branch=staging`
  - Prod: `npm run deploy:prod` → `npx wrangler pages deploy .vercel/output/static --branch=main`
  - Build: `npm run build:cf` → `npx @cloudflare/next-on-pages@1`

---

## 12. Stealth / SEO Rules (cultrclub only)

cultrclub is deliberately non-indexable. The stack:

- **`next.config.js` headers:** `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex, nocache` + `Referrer-Policy: no-referrer` + `X-Frame-Options: SAMEORIGIN` + `X-Content-Type-Options: nosniff` + strict CSP.
- **`middleware.ts`:** re-applies the same headers on every Worker-served HTML/SSR response (because Pages drops `headers()`). Carve-out: link-preview bots (`facebookexternalhit|Twitterbot|Slackbot|LinkedInBot|Discordbot|TelegramBot|WhatsApp|SkypeUriPreview|Pinterestbot|redditbot`) get through without the noindex header so iMessage / Slack previews still render.
- **`app/layout.tsx` metadata:** `<title>—</title>` (em-dash sentinel so nothing brandable leaks to browser tabs) + `robots.index: false` / `follow: false` / `nocache: true` / `noarchive: true`. OpenGraph + Twitter tags DO exist (matching the join brand copy) so preview bots render a thumbnail.
- **`www.cultrclub.com → cultrclub.com` 301** in `middleware.ts` so only one hostname appears in CT logs.
- **Anti-enumeration on login** (§6).

Preserve this entire stack. Removing any single layer exposes either the brand (title, search indexing) or member enumeration (login timing).

---

## 13. Self-Correcting CLAUDE.md Rule (both repos)

When Claude (or a contributor) gets something wrong about this project - wrong file path, incorrect assumption, outdated pattern, misunderstood convention - fix it in `CLAUDE.md` and (where relevant) in `.cursorrules` immediately, not just inline. Both files are loaded on every session and every subagent; codifying corrections makes the next session faster. This is a shared discipline: when anyone spots Claude making a recurring mistake, update these files.

---

## 14. File & Naming Conventions (both repos)

| Kind | Convention | Example |
|---|---|---|
| React component file | `PascalCase.tsx` | `Button.tsx`, `TierGate.tsx` |
| Client page island | `*Client.tsx` | `QuizClient.tsx`, `JoinLandingClient.tsx` |
| API route | `route.ts` | `app/api/club/orders/route.ts` |
| Utility / lib | `camelCase.ts` | `auth.ts`, `db.ts`, `utils.ts` |
| Config | `kebab-case.ts` | `product-catalog.ts`, `owner-emails.ts`, `join-therapies.ts` |
| Exported async function | `camelCase` | `createMagicLinkToken`, `processOrderAttribution` |
| React component | `PascalCase` | `Button`, `TierGate` |
| Validator | `is*` / `has*` / `check*` | `isProviderEmail`, `hasFeatureAccess` |
| Factory / getter | `get*` | `getStripe`, `getResend`, `getCookieDomain` |
| Constant | `SCREAMING_SNAKE_CASE` | `SESSION_COOKIE_NAME`, `TEAM_EMAILS`, `BUNDLE_DISCOUNT_RATE` |
| Config object | `SCREAMING_SNAKE_CASE` | `PLANS`, `STRIPE_CONFIG`, `OWNER_EMAILS`, `FL_TAX_RATE` |
| TypeScript interface / type | `PascalCase`, no `I` prefix | `ButtonProps`, `SessionPayload`, `OrderItem` |

### Import order (both repos)
1. React / Next.js (`react`, `next/server`, `next/navigation`, `next/headers`, `next/font/google`, `next/dynamic`, `next/script`)
2. External libraries (`jose`, `resend`, `stripe`, `framer-motion`, `lucide-react`, `zod`, `clsx`, `tailwind-merge`, `@neondatabase/serverless`, `@vercel/postgres`)
3. Internal `@/lib/*`
4. Internal `@/components/*`
5. Relative imports (only within a feature folder; prefer `@/` alias for cross-folder)

---

## 15. Linting & Hooks (cultrhealth only)

- ESLint via `eslint-config-next` - `npm run lint` or `npx eslint path/to/file`
- No Biome, no Prettier config - formatting is handled via editor defaults + ESLint
- **Four PostToolUse hooks** run after every `Write`/`Edit` on a `.ts`/`.tsx` file:
  - `run-tests.sh` - `npx vitest run` (blocks on failure, skips test files themselves)
  - `type-check.sh` - `npx tsc --noEmit` (blocks on type errors)
  - `code-audit.sh` - ESLint + console.log detection + HIPAA PHI grep + hardcoded-secret grep + TODO grep (blocks on lint errors, PHI risk, or hardcoded secrets)
  - `marketing-check.sh` - for marketing-facing files only: SEO metadata, weak CTAs, missing alt text, hardcoded hex colors, missing social proof (advisory only, exit 0)

cultrclub has no ESLint config, no hooks - it leans on the shared developer discipline + the cultrhealth repo's hooks for any shared lib changes.

---

## 16. Secrets & Env Vars

- **Never hardcode secrets.** `code-audit.sh` greps for `api.key | secret | password | token` assigned to a string literal (filtered to exclude `process.env.*` / `config.*`).
- **Always read from `process.env`.** Both repos.
- **Never commit `.env` / `.env.local` / `.env.production`** - `.gitignore` covers these but double-check before `git add`.
- Required env vars differ per app; see `CLAUDE.md` §Environment Variables for cultrhealth and `.ralphrc` / deploy script for cultrclub.

---

*Conventions are enforced by hooks + code review, not just by habit. When a rule is broken twice, codify it here (and in `.cursorrules` for cultrhealth) rather than re-prompting.*
