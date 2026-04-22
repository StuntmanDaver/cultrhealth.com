# SiPhox × CULTR Health — Integration Patterns

Opinionated patterns that match this repo's stack: Next.js 14 App Router, TypeScript, `@vercel/postgres`, Zod, Resend, JWT via `jose`.

## Where code lives

```
lib/siphox/
  client.ts           # siphoxFetch + typed endpoint helpers (see client-starter.ts)
  types.ts            # shared TS types extracted from schemas.md
  errors.ts           # SiphoxApiError, code classification, toHttpStatus mapper
  db.ts               # siphox_* table queries (@vercel/postgres)

app/api/siphox/
  orders/route.ts           # POST → create order for authenticated member
  kits/register/route.ts    # POST → /api/v1/kits/{kitID}/register
  kits/webhook/route.ts     # Placeholder — no public webhook spec yet
  reports/[id]/route.ts     # GET → member's own report (gate on auth)

app/api/cron/siphox-sync/route.ts   # Scheduled via Vercel cron (every 15 min)

migrations/
  XXX_siphox_tables.sql     # siphox_orders, siphox_kits, siphox_customers, siphox_reports
```

Don't sprinkle `fetch('https://connect.siphoxhealth.com/...')` across route handlers — always go through `lib/siphox/client.ts`.

## Env vars

| Name | Where | Notes |
|---|---|---|
| `SIPHOX_API_TOKEN` | Vercel env (staging + production), `.env.local` | Server-only. Never `NEXT_PUBLIC_*`. Copy from https://admin.siphoxhealth.com. |
| `SIPHOX_API_BASE_URL` | Optional | Defaults to `https://connect.siphoxhealth.com`. Override only if SiPhox provides a sandbox URL. |
| `SIPHOX_TEST_MODE` | Optional | When `'true'`, client forces `is_test_order: true` on `/create-order`. Default `'true'` on staging, `'false'` in production. |

Add both to `docs/env-vars-go-live.md` in the Critical section if SiPhox kits are part of the member product.

## Auth header (the thing everyone gets wrong)

```ts
headers: {
  'Authorization': `Token ${process.env.SIPHOX_API_TOKEN}`,   // note: `Token`, not `Bearer`
  'Content-Type': 'application/json',
}
```

A 401 with body `{ "error": "Business session is required" }` almost always means you used `Bearer`.

## DB schema sketch

```sql
-- Kits we've ordered. kitID is the stable natural key from Siphox.
CREATE TABLE siphox_orders (
  id BIGSERIAL PRIMARY KEY,
  siphox_order_id TEXT UNIQUE NOT NULL,    -- e.g. "OUOHRDR83V"
  user_id BIGINT REFERENCES users(id),
  external_id TEXT,                         -- the external_id we sent to Siphox
  kit_type TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  is_test BOOLEAN NOT NULL DEFAULT false,
  raw_request JSONB NOT NULL,               -- for audit / replay
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE siphox_kits (
  id BIGSERIAL PRIMARY KEY,
  kit_id TEXT UNIQUE NOT NULL,              -- e.g. "SPOT6WTLQH"
  siphox_order_id TEXT NOT NULL REFERENCES siphox_orders(siphox_order_id),
  user_id BIGINT REFERENCES users(id),
  kit_status TEXT NOT NULL,                 -- kitStatus enum
  sample_status TEXT,                       -- sampleStatus enum
  last_siphox_update TIMESTAMPTZ NOT NULL,  -- lastUpdatedDate from Siphox
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE siphox_customers (
  id BIGSERIAL PRIMARY KEY,
  siphox_customer_id TEXT UNIQUE NOT NULL,  -- Mongo ObjectId from Siphox
  user_id BIGINT UNIQUE REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reports are cached lazily when the member opens them.
CREATE TABLE siphox_reports (
  id BIGSERIAL PRIMARY KEY,
  siphox_report_id TEXT NOT NULL,
  siphox_customer_id TEXT NOT NULL REFERENCES siphox_customers(siphox_customer_id),
  kit_id TEXT REFERENCES siphox_kits(kit_id),
  collected_date TIMESTAMPTZ,
  resulted_date TIMESTAMPTZ,
  axes_json JSONB NOT NULL,                 -- full report payload
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (siphox_customer_id, siphox_report_id)
);
```

Add a migration file at `migrations/NNN_siphox_tables.sql` using the next sequential number.

## API route pattern

```ts
// app/api/siphox/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSiphoxOrder, SiphoxApiError } from '@/lib/siphox/client';
import { getSessionUser } from '@/lib/auth';
import { sql } from '@vercel/postgres';

const schema = z.object({
  kitType: z.string().min(1),
  quantity: z.number().int().min(1).max(5).default(1),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid request', details: body.error.flatten() }, { status: 400 });
  }

  try {
    const order = await createSiphoxOrder({
      recipient: {
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        external_id: String(user.id),        // reconciliation key
        address: user.shippingAddress,
      },
      kit_types: [{ kitType: body.data.kitType, quantity: body.data.quantity }],
      is_notify_receiver: true,
      is_test_order: process.env.SIPHOX_TEST_MODE === 'true',
    });

    await sql`
      INSERT INTO siphox_orders (siphox_order_id, user_id, external_id, kit_type, quantity, is_test, raw_response)
      VALUES (${order.orderId}, ${user.id}, ${String(user.id)}, ${body.data.kitType}, ${body.data.quantity},
              ${process.env.SIPHOX_TEST_MODE === 'true'}, ${JSON.stringify(order)}::jsonb)
    `;

    return NextResponse.json({ orderId: order.orderId });
  } catch (e) {
    if (e instanceof SiphoxApiError) {
      return NextResponse.json({ error: e.code, message: e.message }, { status: e.httpStatus });
    }
    console.error('[siphox:create-order] failed', { userId: user.id });  // no PHI
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

## PHI rules (HIPAA — non-negotiable)

- **Never log:** names, emails, phone, DOB, address, biomarker values, report bodies.
- **OK to log:** our `user.id`, Siphox `orderId`, `kitID`, Siphox `customerId`, status enums, HTTP status codes, Zod validation error keys.
- **Don't store raw request JSON** in `raw_request` if it contains unsanitized PHI beyond what you already store elsewhere. Minimum necessary.
- **No PHI in analytics events.** The GA4 event for "kit ordered" carries `user_id_hash` + `kit_type`, nothing else.
- **Use DOMPurify** on anything from `/biomarkers` or `/sai/chats` rendered into the DOM.

## Test-order discipline

- **Staging:** `SIPHOX_TEST_MODE=true`. Every `/create-order` call sets `is_test_order: true`. Real credits are never consumed.
- **Production:** `SIPHOX_TEST_MODE=false`. Allow an admin override to force a test order (e.g. staff QA) — put the flag in the admin payload, never accept it from a member-facing route.
- **Pre-deploy checklist** (`/pre-deploy`) should verify `SIPHOX_TEST_MODE` matches the environment.

## Sync cron

```ts
// app/api/cron/siphox-sync/route.ts — wired to a Vercel cron (every 15 min)
// 1. Select kits where sample_status NOT IN ('resulted','canceled','rejected','partiallyResulted')
//    AND synced_at < now() - interval '10 minutes'
// 2. Batch by orderID (≤50 per call), GET /api/v1/kits?page=1&size=250&orderID=<comma-joined>
// 3. Upsert siphox_kits rows; on transition to `resulted`, enqueue Resend email + mark notification sent.
// 4. Retry once on transient 5xx; bail on 503 NOT_AVAILABLE.
```

## Webhooks (future)

As of Apr 22 2026, SiPhox does not publish webhook docs. When they do:

- Host handler at `app/api/siphox/webhook/route.ts` with `export const runtime = 'nodejs'` (not edge).
- Verify whatever signature they ship (HMAC-SHA256 on raw body is the safe guess); use `crypto.timingSafeEqual` after length check (see CLAUDE.md note on this gotcha).
- Event handler should be idempotent — key on `(eventId, kitID)` in a small `siphox_webhook_events` dedupe table.
- Until then, the cron + lazy-refresh pattern above is canonical.

## Error classification

Map SiPhox `code` and HTTP status to typed errors so admin UI can act:

| Source | Our class | Admin action |
|---|---|---|
| 400 `{ error: "Validation failed", details }` | `SiphoxValidationError` | Show details; fix input. |
| 401 `{ error: "Business session is required" }` | `SiphoxAuthError` | Rotate token; verify `Token ` prefix. |
| 403 | `SiphoxForbiddenError` | Feature not enabled for business; contact Siphox. |
| 404 `KIT_NOT_FOUND` / "not found" | `SiphoxNotFoundError` | Probably a stale kitID; re-sync. |
| 409 `KIT_ALREADY_REGISTERED` | `SiphoxConflictError` | Already registered; fetch current state. |
| 409 "not enough credits" | `SiphoxInsufficientCreditsError` | Top up at admin dashboard. |
| 500 `INTERNAL_ERROR` | `SiphoxServerError` | Transient; retry idempotent GETs, not POSTs. |
| 503 `NOT_AVAILABLE` | `SiphoxFeatureDisabledError` | Feature not enabled; surface to admin, don't retry. |

## Observations to verify before shipping

- [ ] Does `is_test_order: true` consume credits in our account? (Confirm on admin dashboard before going live.)
- [ ] Does `/register` really 200 before the lab is ready? (It does per spec description — confirm in a staging run.)
- [ ] What is the actual `kitType` string format? (Admin dashboard — enumerate and add to `lib/siphox/types.ts`.)
- [ ] Are there any webhook docs surface now? (Re-check GitBook; if so, update `webhooks` section above.)
