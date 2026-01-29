// Server-side Affirm REST API wrapper
// Handles authorize, capture, void, and refund operations

import type {
  AffirmChargeResponse,
  AffirmCaptureResponse,
  CheckoutItem,
  AffirmCheckoutConfig,
  AffirmItem,
} from './payment-types';
import { AFFIRM_CONFIG } from '@/lib/config/payments';

function getAuthHeader(): string {
  const publicKey = process.env.NEXT_PUBLIC_AFFIRM_PUBLIC_KEY;
  const privateKey = process.env.AFFIRM_PRIVATE_API_KEY;
  if (!publicKey || !privateKey) {
    throw new Error('Affirm API credentials not configured');
  }
  return 'Basic ' + Buffer.from(`${publicKey}:${privateKey}`).toString('base64');
}

function getBaseUrl(): string {
  return AFFIRM_CONFIG.apiUrl;
}

async function affirmFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Affirm API error:', {
      status: response.status,
      path,
      body: errorBody,
    });
    throw new Error(`Affirm API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

// ---------------------
// Build Affirm checkout config (PHI-free)
// ---------------------

export function buildAffirmCheckoutConfig(params: {
  orderId: string;
  amountCents: number;
  items?: CheckoutItem[];
  description?: string;
  confirmationUrl: string;
  cancelUrl: string;
}): AffirmCheckoutConfig {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const affirmItems: AffirmItem[] = params.items?.length
    ? params.items.map((item) => ({
        display_name: item.name,
        sku: item.sku,
        unit_price: item.unitPriceCents,
        qty: item.quantity,
        item_url: `${baseUrl}/library/shop/${encodeURIComponent(item.sku)}`,
      }))
    : [
        {
          display_name: params.description || 'CULTR Health Membership',
          sku: 'membership',
          unit_price: params.amountCents,
          qty: 1,
        },
      ];

  return {
    merchant: {
      user_confirmation_url: params.confirmationUrl,
      user_cancel_url: params.cancelUrl,
      user_confirmation_url_action: 'GET',
      name: 'CULTR Health',
    },
    items: affirmItems,
    metadata: {
      mode: 'modal',
      order_id: params.orderId,
    },
    order_id: params.orderId,
    currency: AFFIRM_CONFIG.currency,
    total: params.amountCents,
  };
}

// ---------------------
// Authorize charge (after user completes Affirm checkout)
// ---------------------

export async function authorizeAffirmCharge(
  checkoutToken: string
): Promise<AffirmChargeResponse> {
  return affirmFetch<AffirmChargeResponse>('/api/v2/charges', {
    method: 'POST',
    body: JSON.stringify({ checkout_token: checkoutToken }),
  });
}

// ---------------------
// Capture authorized charge
// ---------------------

export async function captureAffirmCharge(
  chargeId: string,
  orderId?: string
): Promise<AffirmCaptureResponse> {
  return affirmFetch<AffirmCaptureResponse>(
    `/api/v2/charges/${chargeId}/capture`,
    {
      method: 'POST',
      body: JSON.stringify(orderId ? { order_id: orderId } : {}),
    }
  );
}

// ---------------------
// Void authorized (uncaptured) charge
// ---------------------

export async function voidAffirmCharge(chargeId: string): Promise<void> {
  await affirmFetch(`/api/v2/charges/${chargeId}/void`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

// ---------------------
// Refund captured charge
// ---------------------

export async function refundAffirmCharge(
  chargeId: string,
  amountCents?: number
): Promise<{ id: string; amount: number }> {
  const body: Record<string, unknown> = {};
  if (amountCents !== undefined) {
    body.amount = amountCents;
  }

  return affirmFetch(`/api/v2/charges/${chargeId}/refund`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ---------------------
// Read charge details
// ---------------------

export async function getAffirmCharge(
  chargeId: string
): Promise<AffirmChargeResponse> {
  return affirmFetch<AffirmChargeResponse>(`/api/v2/charges/${chargeId}`);
}
