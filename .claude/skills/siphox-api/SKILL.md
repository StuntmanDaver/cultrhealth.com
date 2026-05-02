---
name: siphox-api
description: Use when integrating or calling the SiPhox Health B2B API (connect.siphoxhealth.com) — ordering at-home blood test kits, registering kits to customers, fetching biomarker reports, SAI AI chat, or managing SiPhox API tokens. Also use when code touches kitStatus/sampleStatus enums, `/api/v1/create-order`, `/api/v1/kits`, `/api/v1/customers`, or `SIPHOX_API_TOKEN`/`SIPHOX_API_KEY` env vars.
---

# SiPhox Health API

## Overview

SiPhox provides white-label at-home blood-test kits and biomarker reporting. The B2B API lets CULTR Health order kits on behalf of a member, register a kit to a customer, and pull back biomarker reports and axis scores.

- **Base URL:** `https://connect.siphoxhealth.com`
- **OpenAPI spec:** `references/openapi.json` (v1.0.0, OpenAPI 3.1)
- **Admin dashboard:** https://admin.siphoxhealth.com (token + credit balance + test orders)
- **Token docs:** https://siphoxhealth.gitbook.io/docs/api
- **Auth header:** `Authorization: Token <TOKEN>` — literal word `Token`, **not** `Bearer`
- **Env var convention for this repo:** `SIPHOX_API_TOKEN` (server-only; never expose to client)

## Gotchas — read these first

1. **Known repo bug: `lib/siphox/client.ts:80` sends `Authorization: Bearer` but SiPhox requires `Authorization: Token`.** The existing code is broken for auth and returns 401 "Business session is required" in production. Will be fixed in Phase 13. Until then, do not rely on `lib/siphox/client.ts` for live API calls — use the `siphoxFetch` helper in `references/client-starter.ts` instead.
2. **Auth prefix is `Token`, not `Bearer`.** `Authorization: Token <uuid>`. Anything else returns 401 "Business session is required".
3. **No `servers` block in the spec.** Always prepend `https://connect.siphoxhealth.com` manually — the spec ships with `servers: []`.
4. **Kit registration is async.** `POST /api/v1/kits/{kitID}/register` returns 200 immediately; lab processing happens later. Poll `/api/v1/kits` or `/api/v1/customers/{id}` to detect `sampleStatus = resulted`.
5. **Test orders require `is_test_order: true`** on `/create-order`. Otherwise you burn real credits / charge the attached payment method.
6. **`purchase_with_attached_payment` wording is ambiguous.** Per the spec, `false` first tries credits, then the attached payment method, then falls back to creating a pending order. Re-check the admin dashboard before sending anything else.
7. **`sai/upsells` uses stringified JSON.** `productOfferingsJson` is a string containing JSON — `JSON.stringify` the array on write, `JSON.parse` on read.
8. **503 "NOT_AVAILABLE"** is a legitimate response (e.g. `/kits/{kitID}/register` when the feature is not enabled for a business). Don't retry — surface to admin.
9. **Three separate status fields** on kits/samples/orders. Don't conflate them. See `references/kit-lifecycle.md`.
10. **Only four named schemas** — `Address`, `CreateOrderRequest`, `ProductOffering`, `Suggestion`. Everything else is inline. See `references/schemas.md`.
11. **GitBook docs are thin.** The OpenAPI spec is authoritative. If the spec and GitBook disagree, trust the spec and verify with a test order.

## Quick reference — all endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/create-order` | Order kits for a recipient |
| GET | `/api/v1/orders` | List orders (filter by kitStatus, sampleStatus) |
| GET | `/api/v1/orders/{id}` | Single order |
| GET | `/api/v1/kits` | List kits (paginated, filter by kitID/orderID/externalID) |
| GET | `/api/v1/kits/{kitID}/validate` | Does this kitID belong to us? |
| POST | `/api/v1/kits/{kitID}/register` | Register kit to customer (async) |
| POST | `/api/v1/customer` | Create B2B customer |
| GET | `/api/v1/customers` | List customers |
| GET | `/api/v1/customers/{id}` | Customer + reports list |
| GET | `/api/v1/customers/{id}/reports/{reportID}` | Full biomarker report with axes |
| POST | `/api/v1/customer/add-data` | Attach quiz / test-results / file (async for files) |
| GET | `/api/v1/customer/add-data/jobs/{id}` | Poll async add-data job |
| GET | `/api/v1/credits` | Business credit balance |
| GET | `/api/v1/biomarkers` | Biomarker catalog + ranges |
| POST | `/api/v1/sai/chats` | Create SAI chat |
| GET | `/api/v1/sai/chats` | List chats (filter by userId/tags) |
| POST | `/api/v1/sai/chats/{userId}` | Send message (creates or continues) |
| POST | `/api/v1/sai/chats/{chatId}/messages` | Send message to existing chat |
| PATCH | `/api/v1/sai/chats/{chatId}` | Tag / note a chat |
| DELETE | `/api/v1/sai/chats/{chatId}` | Delete chat |
| GET,PATCH | `/api/v1/sai/settings` | SAI language + custom instructions |
| GET,POST | `/api/v1/sai/upsells` | Product offerings (stringified JSON) |

Full request/response shapes live in `references/endpoints.md`.

## When implementing a new SiPhox call

1. **Read `references/endpoints.md` for that endpoint** — path params, query params, body, every response code. Do not guess field names.
2. **Use the `siphoxFetch` helper** in `references/client-starter.ts`. Don't re-implement auth headers per route.
3. **Handle the documented non-2xx codes explicitly.** Every endpoint lists its 400/401/403/404/409/500/503 shapes — map them to typed errors so admin UI can show something useful.
4. **Wrap idempotent GETs with `lib/resilience.ts` retry.** POSTs that create orders or register kits **must not auto-retry** — use idempotency via `external_id` / `kitID` instead.
5. **Log without PHI.** Kit IDs, order IDs, and SiPhox customer IDs are OK. Names, DOB, address, emails, biomarker values are PHI — never log them. See CLAUDE.md HIPAA rules.
6. **NUMERIC coercion.** `@vercel/postgres` returns NUMERIC columns as strings; when persisting SiPhox biomarker values, `Number()` them before arithmetic.
7. **Test with `is_test_order: true`** on staging before touching production credits.

## Cultr integration patterns

Stack: Next.js 14 App Router + TypeScript + `@vercel/postgres` + Zod + Resend. See `references/integration-patterns.md` for:

- Where SiPhox code should live (`lib/siphox/`)
- Env var naming + where to wire them (local `.env`, Vercel staging, Vercel production)
- API route pattern (`app/api/siphox/*/route.ts`) with Zod body validation
- DB tables to add (`siphox_orders`, `siphox_kits`, `siphox_customers`, `siphox_reports`)
- Member-facing UI mapping (kitStatus → human copy)
- PHI rules + audit logging

## Reference files

- `references/openapi.json` — raw spec, source of truth
- `references/endpoints.md` — generated per-endpoint detail (params, body, responses)
- `references/schemas.md` — named schemas + common inline shapes worth typing
- `references/kit-lifecycle.md` — kitStatus / sampleStatus / orderStatus enums + transitions
- `references/integration-patterns.md` — Cultr-specific: env, routes, DB schema, error handling, PHI rules
- `references/client-starter.ts` — drop-in `lib/siphox/client.ts` with typed helpers

## Refreshing this skill

The spec is embedded inline in `https://connect.siphoxhealth.com/api-docs/swagger-ui-init.js`. To refresh:

```bash
node scripts/refresh-siphox-spec.mjs
```

(Or re-run the extract block in the commit message that introduced this skill.) Then regenerate `references/endpoints.md` via the generator noted in that file's header.
