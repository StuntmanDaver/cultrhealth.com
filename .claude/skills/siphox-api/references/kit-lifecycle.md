# SiPhox Kit, Sample & Order Lifecycle

Three independent status fields travel with every kit. They do **not** always move in lockstep. Source: enums on `GET /api/v1/orders` query parameters and `GET /api/v1/kits` responses in `references/openapi.json`.

## `kitStatus` — physical kit movement (the box)

| Status | Meaning |
|---|---|
| `preparing` | Order accepted, kit not yet shipped. |
| `inTransit` | Carrier has the kit, moving to recipient. |
| `delivered` | Kit arrived at recipient address. |
| `registered` | Recipient registered the kit (via app or `/register` API). Often precedes `collected`. |
| `collected` | Sample drawn by recipient (this is a kit-level echo of sample collection). |
| `deliveryException` | Carrier delivery failed (wrong address, refused, etc.). |
| `registrationException` | Registration failed (duplicate, invalid DOB, etc.). |
| `canceled` | Kit canceled pre-use. |

## `sampleStatus` — what's happening to the biological sample

| Status | Meaning |
|---|---|
| `awaitingCollection` | Kit delivered, user hasn't drawn sample. |
| `inTransit` | Sample on its way back to lab. |
| `collected` | User drew sample, not yet shipped back. |
| `received` | Lab has the sample. |
| `delivered` | (Rarely seen — lab received + logged.) |
| `rejected` | Sample unusable (clotted, insufficient, etc.). Triggers reship flow manually. |
| `resulted` | **Results ready.** Fetch via `/customers/{id}/reports/{reportID}`. |
| `partiallyResulted` | Some biomarkers reported, others pending or failed. |
| `collectionException` | Problem during collection (e.g. user reported issue). |
| `deliveryException` | Sample lost / damaged in return transit. |
| `canceled` | Sample voided. |

## `orderStatus` / `status` — billing + fulfillment meta

The spec is thin on this, but `status` on `/orders/{id}` includes `"created"` and other states tied to billing (credit spent, payment captured, pending, etc.). Treat it as opaque for now and key off `kitStatus` / `sampleStatus` in business logic.

## Typical happy-path transitions

```
Order created
  ├─ kitStatus:    preparing → inTransit → delivered → registered → collected
  └─ sampleStatus:                          awaitingCollection → collected → inTransit → received → resulted
```

## Terminal / escalation states

- `rejected` sample → reach out to member, reship (new order)
- `deliveryException` on kit → verify address, reship
- `registrationException` → usually DOB/sex mismatch with Siphox customer record; reconcile via `POST /api/v1/customer` and retry `POST /api/v1/kits/{kitID}/register`
- `canceled` → no further action; commission / credit refunds handled outside the API

## Polling strategy (no webhooks available yet)

SiPhox does not publicly document webhook events (as of Apr 2026). Until then:

- **Cron every 15 min:** `GET /api/v1/kits?page=1&size=250&orderID=...` for any order whose kit is not yet `resulted`/`canceled`.
- **On member open:** lazy-refresh a single kit via `GET /api/v1/kits?kitID=<id>&page=1&size=1`.
- **Do not poll `/customers/{id}/reports/{reportID}` until** `sampleStatus = resulted` or `partiallyResulted`.
- Store last-seen `lastUpdatedDate` per kit and skip the report fetch if unchanged — saves credits and latency.

## UI mapping (member-facing copy suggestion)

| sampleStatus | Member-facing message |
|---|---|
| `awaitingCollection` | "Kit delivered — ready when you are." |
| `collected` | "Sample collected. Drop it in any USPS mailbox." |
| `inTransit` | "Sample on its way to the lab." |
| `received` | "Lab received your sample — results in 2–3 business days." |
| `resulted` | "Your results are ready." |
| `partiallyResulted` | "Partial results ready. Remaining biomarkers in progress." |
| `rejected` | "Sample couldn't be processed. We're sending a new kit." |
| `collectionException` / `deliveryException` | "We hit a snag. Our team will reach out shortly." |
| `canceled` | "Kit canceled. Contact support if this wasn't you." |

Never surface raw enum strings to members.
