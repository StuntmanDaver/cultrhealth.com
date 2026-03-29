// NOWPayments API service
// Docs: https://documenter.getpostman.com/view/7907941/2s93JusNJt

import crypto from 'crypto';
import { NOWPAYMENTS_CONFIG } from '@/lib/config/payments';
import type { NowPaymentsPayment, NowPaymentsInvoice, NowPaymentsStatus } from '@/lib/payments/payment-types';

// Re-export for convenience
export type { NowPaymentsPayment, NowPaymentsInvoice, NowPaymentsStatus };

function getApiKey(): string {
  const key = process.env.NOWPAYMENTS_API_KEY;
  if (!key) throw new Error('NOWPAYMENTS_API_KEY is not configured');
  return key;
}

async function nowPaymentsFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${NOWPAYMENTS_CONFIG.apiUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'x-api-key': getApiKey(),
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NOWPayments API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export interface CreateNowPaymentParams {
  price_amount: number;
  price_currency: 'usd';
  pay_currency: 'btc';
  order_id: string;
  order_description: string;
  ipn_callback_url: string;
  success_url: string;
  cancel_url: string;
}

export async function createNowPayment(
  params: CreateNowPaymentParams
): Promise<NowPaymentsPayment> {
  return nowPaymentsFetch<NowPaymentsPayment>('/payment', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getNowPaymentStatus(
  paymentId: string
): Promise<NowPaymentsPayment> {
  return nowPaymentsFetch<NowPaymentsPayment>(`/payment/${paymentId}`);
}

export interface CreateNowInvoiceParams {
  price_amount: number;
  price_currency: 'usd';
  pay_currency: 'btc';
  order_id: string;
  order_description: string;
  ipn_callback_url: string;
  success_url: string;
  cancel_url: string;
}

export async function createNowInvoice(
  params: CreateNowInvoiceParams
): Promise<NowPaymentsInvoice> {
  return nowPaymentsFetch<NowPaymentsInvoice>('/invoice', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Verify the x-nowpayments-sig HMAC-SHA-512 signature from IPN webhooks.
 * NOWPayments signs: JSON.stringify(body, Object.keys(body).sort())
 */
export function verifyNowPaymentsSignature(
  body: Record<string, unknown>,
  signature: string
): boolean {
  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!ipnSecret) {
    console.error('NOWPAYMENTS_IPN_SECRET is not configured');
    return false;
  }

  try {
    const sortedBody = JSON.stringify(body, Object.keys(body).sort());
    const computed = crypto
      .createHmac('sha512', ipnSecret)
      .update(sortedBody)
      .digest('hex');
    return computed === signature;
  } catch {
    return false;
  }
}
