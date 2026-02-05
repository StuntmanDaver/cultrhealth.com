// Server-side Klarna REST API wrapper
// Uses fetch + Basic auth for Klarna Payments API v1

import type {
  KlarnaSessionRequest,
  KlarnaSessionResponse,
  KlarnaOrderResponse,
  KlarnaOrderLine,
  CheckoutItem,
} from './payment-types';
import { KLARNA_CONFIG } from '@/lib/config/payments';

function getAuthHeader(): string {
  const apiKey = process.env.KLARNA_API_KEY;
  const apiSecret = process.env.KLARNA_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error('Klarna API credentials not configured');
  }
  return 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
}

function getBaseUrl(): string {
  return KLARNA_CONFIG.apiUrl;
}

async function klarnaFetch<T>(
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
    console.error('Klarna API error:', {
      status: response.status,
      path,
      body: errorBody,
    });
    throw new Error(`Klarna API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

// ---------------------
// Build order lines (PHI-free)
// ---------------------

export function buildOrderLines(
  items: CheckoutItem[],
  description?: string
): KlarnaOrderLine[] {
  if (items.length > 0) {
    return items.map((item) => ({
      type: 'physical' as const,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unitPriceCents,
      total_amount: item.unitPriceCents * item.quantity,
      total_tax_amount: 0,
      tax_rate: 0,
      reference: item.sku,
    }));
  }

  // Fallback: single line item (e.g. subscription first payment)
  return [
    {
      type: 'digital' as const,
      name: description || 'CULTR Health Payment',
      quantity: 1,
      unit_price: 0, // caller must set
      total_amount: 0,
      total_tax_amount: 0,
      tax_rate: 0,
    },
  ];
}

// ---------------------
// Create Payment Session
// ---------------------

export async function createKlarnaSession(params: {
  amountCents: number;
  items?: CheckoutItem[];
  description?: string;
  confirmationUrl: string;
  pushUrl: string;
}): Promise<KlarnaSessionResponse> {
  const orderLines = params.items?.length
    ? buildOrderLines(params.items)
    : [
        {
          type: 'digital' as const,
          name: params.description || 'CULTR Health Membership',
          quantity: 1,
          unit_price: params.amountCents,
          total_amount: params.amountCents,
          total_tax_amount: 0,
          tax_rate: 0,
        },
      ];

  const body: KlarnaSessionRequest = {
    purchase_country: KLARNA_CONFIG.purchaseCountry,
    purchase_currency: KLARNA_CONFIG.purchaseCurrency,
    locale: KLARNA_CONFIG.locale,
    order_amount: params.amountCents,
    order_tax_amount: 0,
    order_lines: orderLines,
    merchant_urls: {
      terms: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/terms`,
      checkout: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout`,
      confirmation: params.confirmationUrl,
      push: params.pushUrl,
    },
  };

  return klarnaFetch<KlarnaSessionResponse>(
    '/payments/v1/sessions',
    { method: 'POST', body: JSON.stringify(body) }
  );
}

// ---------------------
// Create Order (Capture after frontend authorization)
// ---------------------

export async function createKlarnaOrder(
  authorizationToken: string,
  params: {
    amountCents: number;
    items?: CheckoutItem[];
    description?: string;
  }
): Promise<KlarnaOrderResponse> {
  const orderLines = params.items?.length
    ? buildOrderLines(params.items)
    : [
        {
          type: 'digital' as const,
          name: params.description || 'CULTR Health Membership',
          quantity: 1,
          unit_price: params.amountCents,
          total_amount: params.amountCents,
          total_tax_amount: 0,
          tax_rate: 0,
        },
      ];

  const body = {
    purchase_country: KLARNA_CONFIG.purchaseCountry,
    purchase_currency: KLARNA_CONFIG.purchaseCurrency,
    order_amount: params.amountCents,
    order_tax_amount: 0,
    order_lines: orderLines,
  };

  return klarnaFetch<KlarnaOrderResponse>(
    `/payments/v1/authorizations/${authorizationToken}/order`,
    { method: 'POST', body: JSON.stringify(body) }
  );
}

// ---------------------
// Get Order Details
// ---------------------

export async function getKlarnaOrder(orderId: string) {
  return klarnaFetch(`/ordermanagement/v1/orders/${orderId}`);
}

// ---------------------
// Acknowledge Order (respond to push notification)
// ---------------------

export async function acknowledgeKlarnaOrder(orderId: string): Promise<void> {
  await klarnaFetch(
    `/ordermanagement/v1/orders/${orderId}/acknowledge`,
    { method: 'POST', body: JSON.stringify({}) }
  );
}
