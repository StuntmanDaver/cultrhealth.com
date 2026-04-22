/**
 * SiPhox Health API client — starter.
 *
 * Copy this file to `lib/siphox/client.ts` and extend as needed.
 * Keep all SiPhox HTTP calls funneled through this module so auth,
 * error handling, and PHI-safe logging are consistent.
 *
 * Spec: .claude/skills/siphox-api/references/openapi.json
 * Endpoint docs: .claude/skills/siphox-api/references/endpoints.md
 */

const DEFAULT_BASE_URL = 'https://connect.siphoxhealth.com';

// ---------- Types (mirror references/schemas.md) ----------

export type Address = {
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
};

export type CreateOrderRecipient = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  external_id?: string;
  external_tags?: string;
  address: Address;
};

export type CreateOrderKitType = { kitType: string; quantity: number };

export type CreateOrderRequest = {
  recipient: CreateOrderRecipient;
  kit_types: CreateOrderKitType[];
  purchase_with_attached_payment?: boolean;
  is_notify_receiver?: boolean;
  is_test_order?: boolean;
};

export type CreateOrderResponse =
  | { orderId: string }
  | { orderIds: string[] }
  | { link: string }; // payment link variant

export type KitStatus =
  | 'preparing' | 'inTransit' | 'delivered' | 'registered' | 'collected'
  | 'deliveryException' | 'registrationException' | 'canceled';

export type SampleStatus =
  | 'awaitingCollection' | 'inTransit' | 'collected' | 'received' | 'delivered'
  | 'rejected' | 'resulted' | 'partiallyResulted'
  | 'collectionException' | 'deliveryException' | 'canceled';

export type Kit = {
  kitID: string;
  orderID: string;
  recipientEmail: string;
  registeredToEmail: string;
  lastUpdatedDate: string;
  createdDate: string;
  kitStatus: KitStatus;
  sampleStatus?: SampleStatus;
  // Plus additional tracking fields; extend as needed.
  [key: string]: unknown;
};

export type KitRegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string; // YYYY-MM-DD
  sex: 'M' | 'F';
  phone?: string;
};

// ---------- Errors ----------

export type SiphoxErrorPayload =
  | { error: string; details?: Array<{ message?: string }> }
  | { code: string; message: string };

export class SiphoxApiError extends Error {
  readonly httpStatus: number;
  readonly code: string;
  readonly details?: unknown;
  constructor(httpStatus: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'SiphoxApiError';
    this.httpStatus = httpStatus;
    this.code = code;
    this.details = details;
  }
}

function classify(status: number, payload: SiphoxErrorPayload | null): SiphoxApiError {
  const code =
    payload && 'code' in payload ? payload.code :
    payload && 'error' in payload ? payload.error :
    'UNKNOWN';
  const message =
    payload && 'message' in payload ? payload.message :
    payload && 'error' in payload ? payload.error :
    `Siphox HTTP ${status}`;
  return new SiphoxApiError(status, code, message, (payload as any)?.details);
}

// ---------- Core fetch ----------

type SiphoxFetchOpts = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  timeoutMs?: number;
};

async function siphoxFetch<T>(path: string, opts: SiphoxFetchOpts = {}): Promise<T> {
  const token = process.env.SIPHOX_API_TOKEN;
  if (!token) throw new SiphoxApiError(500, 'MISSING_TOKEN', 'SIPHOX_API_TOKEN is not set');

  const base = process.env.SIPHOX_API_BASE_URL || DEFAULT_BASE_URL;
  const url = new URL(path, base);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 15_000);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: opts.method ?? 'GET',
      headers: {
        // CRITICAL: literal "Token", not "Bearer"
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  const text = await res.text();
  const payload = text ? safeJson(text) : null;

  if (!res.ok) {
    // PHI-safe logging: status, code, path — NEVER body (may contain PHI).
    console.error('[siphox] non-2xx', {
      status: res.status,
      path,
      code: (payload && typeof payload === 'object' && ('code' in payload ? payload.code : (payload as any).error)) || 'unknown',
    });
    throw classify(res.status, payload as SiphoxErrorPayload | null);
  }

  return (payload ?? {}) as T;
}

function safeJson(txt: string): unknown {
  try { return JSON.parse(txt); } catch { return { error: txt }; }
}

// ---------- Typed helpers ----------

export const siphox = {
  createOrder: (req: CreateOrderRequest) =>
    siphoxFetch<CreateOrderResponse>('/api/v1/create-order', { method: 'POST', body: req }),

  getOrder: (orderId: string) =>
    siphoxFetch<unknown>(`/api/v1/orders/${encodeURIComponent(orderId)}`),

  listOrders: (query: {
    kitStatus?: KitStatus;
    sampleStatus?: SampleStatus;
    page?: number;
    size?: number;
  } = {}) =>
    siphoxFetch<{ data: unknown[] }>('/api/v1/orders', { query }),

  listKits: (query: {
    page: number;
    size: number;
    kitID?: string;
    orderID?: string;
    externalID?: string;
  }) => siphoxFetch<Kit[]>('/api/v1/kits', { query }),

  validateKit: (kitID: string) =>
    siphoxFetch<{ exists: boolean; kitID: string; kitStatus: KitStatus; sampleStatus?: SampleStatus }>(
      `/api/v1/kits/${encodeURIComponent(kitID)}/validate`
    ),

  registerKit: (kitID: string, body: KitRegisterRequest) =>
    siphoxFetch<{ message: string; kitID: string; customerId: string }>(
      `/api/v1/kits/${encodeURIComponent(kitID)}/register`,
      { method: 'POST', body }
    ),

  createCustomer: (body: {
    email: string;
    name: string;
    dateOfBirth: string; // YYYY-MM-DD
    gender: 'M' | 'F';
    customTags?: string[];
  }) => siphoxFetch<{ id: string; email: string; name: string }>('/api/v1/customer', { method: 'POST', body }),

  listCustomers: () =>
    siphoxFetch<Array<{ id: string; name: string; email: string; reports: string[] }>>('/api/v1/customers'),

  getCustomer: (id: string) =>
    siphoxFetch<{ id: string; name: string; email: string; reports: Array<{ id: string }> }>(
      `/api/v1/customers/${encodeURIComponent(id)}`
    ),

  getReport: (customerId: string, reportID: string) =>
    siphoxFetch<{ axes: Array<{ axis: string; category: string; result: number }> }>(
      `/api/v1/customers/${encodeURIComponent(customerId)}/reports/${encodeURIComponent(reportID)}`
    ),

  getCredits: () => siphoxFetch<unknown>('/api/v1/credits'),

  getBiomarkers: () =>
    siphoxFetch<Array<{ id: string; label: string; shortLabel: string; simpleLabel?: string }>>(
      '/api/v1/biomarkers'
    ),

  // SAI (AI assistant)
  sai: {
    createChat: (body: { userId: string; initialMessage: string; customInstructions?: string }) =>
      siphoxFetch<{ chatId: string; chats: Array<{ content: string; source: string }> }>(
        '/api/v1/sai/chats',
        { method: 'POST', body }
      ),

    listChats: (query: { userId?: string; tags?: string; page?: string; limit?: string } = {}) =>
      siphoxFetch<{ conversations: unknown[] }>('/api/v1/sai/chats', { query }),

    sendMessage: (chatId: string, message: string) =>
      siphoxFetch<{ chatId: string; chats: Array<{ content: string }> }>(
        `/api/v1/sai/chats/${encodeURIComponent(chatId)}/messages`,
        { method: 'POST', body: { message } }
      ),

    // Consolidated endpoint: creates OR continues a chat
    send: (userId: string, body: { chatId?: string; userMessage: string; customInstructions?: string }) =>
      siphoxFetch<{ userMessage: string; saiResponse: string; chatId: string }>(
        `/api/v1/sai/chats/${encodeURIComponent(userId)}`,
        { method: 'POST', body }
      ),

    updateChat: (chatId: string, body: { tags?: string[]; notes?: string }) =>
      siphoxFetch<{ chatId: string; tags: string[] }>(
        `/api/v1/sai/chats/${encodeURIComponent(chatId)}`,
        { method: 'PATCH', body }
      ),

    deleteChat: (chatId: string) =>
      siphoxFetch<{ chatId: string; message: string }>(
        `/api/v1/sai/chats/${encodeURIComponent(chatId)}`,
        { method: 'DELETE' }
      ),

    getSettings: () => siphoxFetch<unknown>('/api/v1/sai/settings'),

    updateSettings: (body: { preferredLanguage: string; customInstructions: string; upsellInstructions?: string }) =>
      siphoxFetch<unknown>('/api/v1/sai/settings', { method: 'PATCH', body }),

    getUpsellsRaw: () => siphoxFetch<string>('/api/v1/sai/upsells'),

    setUpsells: (offerings: Array<Record<string, unknown>>) =>
      siphoxFetch<{ message: string; count: number }>('/api/v1/sai/upsells', {
        method: 'POST',
        body: { productOfferingsJson: JSON.stringify(offerings) }, // CRITICAL: stringified JSON
      }),
  },
};

export default siphox;
