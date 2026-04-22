# SiPhox API — Data Schemas

Source: `references/openapi.json` → `components.schemas` + inline object schemas referenced from endpoints.

## Named components

### `Address`
```ts
type Address = {
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;   // US state code
  zip?: string;
  country?: string; // ISO-2
};
```
Used by `CreateOrderRequest.recipient.address`. No fields are formally required in the spec, but shipping will fail without street1/city/state/zip/country.

### `CreateOrderRequest`
```ts
type CreateOrderRequest = {
  recipient: {                        // REQUIRED
    first_name: string;               // REQUIRED
    last_name: string;                // REQUIRED
    email: string;                    // REQUIRED
    phone?: string;
    external_id?: string;             // your internal user id — use this for reconciliation
    external_tags?: string;           // comma-separated tags
    address: Address;                 // REQUIRED
  };
  kit_types: Array<{                  // REQUIRED — at least one
    kitType: string;                  // e.g. "heart-health", "hormone-panel" (pull from admin dashboard)
    quantity: number;                 // integer
  }>;
  purchase_with_attached_payment?: boolean; // default false — spec wording is ambiguous
  is_notify_receiver?: boolean;       // default false — Siphox emails the kit recipient
  is_test_order?: boolean;            // default false — ALWAYS true on staging
};
```

### `ProductOffering` (used by `/api/v1/sai/upsells`)
```ts
type ProductOffering = {
  id: string;                   // REQUIRED
  type?: "product";             // fixed enum
  name: string;                 // REQUIRED
  longDescription: string;      // REQUIRED
  shortDescription?: string;
  keywords?: string[];
  imageUrl?: string;
  productUrl?: string | null;
  biomarkers?: string[];        // biomarker ids this product targets
};
```
Sent as a JSON **string** in `productOfferingsJson`, not an array. `JSON.stringify` before sending.

### `Suggestion`
```ts
type Suggestion = {
  _id?: string;
  text?: string;
  link?: string;
  category?: string;
  settings?: Array<{ biomarker?: string; value?: string }>;
};
```
Referenced in some SAI responses; shape rarely observed in practice.

## Common inline shapes (worth naming in your client)

### Kit (from `GET /api/v1/kits`)
```ts
type Kit = {
  kitID: string;
  orderID: string;
  recipientEmail: string;
  registeredToEmail: string;
  lastUpdatedDate: string;     // ISO 8601
  createdDate: string;         // ISO 8601
  kitStatus: KitStatus;        // see kit-lifecycle.md
  sampleStatus?: SampleStatus; // see kit-lifecycle.md
  // plus additional tracking fields
};
```

### Order (from `GET /api/v1/orders/{id}`)
```ts
type Order = {
  orderID: string;             // e.g. "OUOHRDR83V"
  createdDate: string;
  status: string;              // top-level billing/creation status (e.g. "created")
  orderStatus: string;         // fulfillment status
  // plus kits array, recipient info, billing fields
};
```
`GET /api/v1/orders` wraps the list in `{ data: Order[], ...pagination }`.

### Customer
```ts
// GET /api/v1/customers/{id}
type CustomerDetail = {
  id: string;                  // Siphox user id (Mongo ObjectId, e.g. "64fa1df97cf8d322cfa492eb")
  name: string;
  email: string;
  reports: Array<{
    id: string;
    collectedDate: string;     // ISO 8601
    resultedDate?: string;
  }>;
};

// GET /api/v1/customers
type CustomerListItem = {
  id: string;
  name: string;
  email: string;
  reports: string[];           // report IDs only
};
```

### Report axes (from `GET /api/v1/customers/{id}/reports/{reportID}`)
```ts
type Report = {
  axes: Array<{
    axis: string;              // e.g. "Metabolic Health"
    category: "biomarker" | string;
    result: number;            // axis score
    historic?: Array<{ date: string; result: number }>;
    // + biomarkers: Array<{ id, value, unit, flag }>
  }>;
};
```

### Biomarker catalog (from `GET /api/v1/biomarkers`)
```ts
type Biomarker = {
  id: string;
  label: string;          // "Low-Density Lipoprotein"
  shortLabel: string;     // "LDL"
  simpleLabel?: string;   // patient-friendly
  // + units, reference ranges, category, gender-specific ranges
};
```

### SAI chat response envelope
```ts
type SaiChatTurn = {
  content: string;
  createdAt: string;       // ISO 8601
  source: "user" | "siphox-ai-assistant";
};
type SaiChat = { chatId: string; chats: SaiChatTurn[] };
```

`POST /api/v1/sai/chats/{userId}` returns a slightly different envelope:
```ts
type SaiConsolidatedResponse = {
  userMessage: string;
  saiResponse: string;     // JSON string with chat sections — JSON.parse before rendering
  createdAt: string;
  chatId: string;
};
```

## Error envelope

Most 4xx/5xx responses follow one of two shapes:
```ts
type SiphoxError =
  | { error: string; details?: Array<{ message?: string }> }
  | { code: string; message: string };
```

`code` values observed: `INTERNAL_ERROR`, `KIT_NOT_FOUND`, `KIT_ALREADY_REGISTERED`, `NOT_AVAILABLE`.
