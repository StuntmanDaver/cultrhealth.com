// CorePay Gateway — Authorize.Net ARB subscription creation
// CorePay uses the Authorize.Net payment gateway with its own merchant credentials.

import type { AuthorizeNetOpaqueData, AuthorizeNetTransactionResponse } from './payment-types';
import { COREPAY_CONFIG } from '@/lib/config/payments';
import { calculateTaxCents } from '@/lib/config/tax';

// ---------------------
// Types
// ---------------------

export interface GatewayCredentials {
  apiLoginId: string;
  transactionKey: string;
  apiUrl?: string;
}

export interface SubscriptionResponse {
  subscriptionId?: string;
  profile?: {
    customerProfileId: string;
    customerPaymentProfileId: string;
  };
  messages: {
    resultCode: 'Ok' | 'Error';
    message: {
      code: string;
      text: string;
    }[];
  };
}

export interface CreateSubscriptionParams {
  opaqueData: AuthorizeNetOpaqueData;
  amountCents: number;
  subscriptionName: string;
  customerEmail: string;
  billing?: { firstName: string; lastName: string };
  orderId?: string;
  description?: string;
  intervalMonths?: number;
  startDate?: string;
  credentials?: GatewayCredentials;
}

// ---------------------
// API Request Helper
// ---------------------

async function gatewayFetch<T>(
  requestBody: Record<string, unknown>,
  overrides?: GatewayCredentials,
): Promise<T> {
  const url = overrides?.apiUrl || COREPAY_CONFIG.apiUrl;

  const auth = overrides
    ? { name: overrides.apiLoginId, transactionKey: overrides.transactionKey }
    : {
        name: process.env.NEXT_PUBLIC_COREPAY_API_LOGIN_ID || '',
        transactionKey: process.env.COREPAY_TRANSACTION_KEY || '',
      };

  const requestKey = Object.keys(requestBody)[0];
  const envelope = {
    [requestKey]: {
      ...requestBody[requestKey] as Record<string, unknown>,
      merchantAuthentication: auth,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(envelope),
  });

  if (!response.ok) {
    throw new Error(`Gateway API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.messages?.resultCode === 'Error') {
    const errorMessage = data.messages.message?.[0]?.text || 'Unknown error';
    throw new Error(`Gateway error: ${errorMessage}`);
  }

  return data as T;
}

// ---------------------
// Create Subscription (ARB)
// ---------------------

export async function createSubscription(
  params: CreateSubscriptionParams,
): Promise<SubscriptionResponse> {
  const taxCents = calculateTaxCents(params.amountCents);
  const amount = ((params.amountCents + taxCents) / 100).toFixed(2);
  const startDate = params.startDate || new Date().toISOString().split('T')[0];

  const subscription: Record<string, unknown> = {
    name: params.subscriptionName.substring(0, 50),
    paymentSchedule: {
      interval: {
        length: (params.intervalMonths || 1).toString(),
        unit: 'months',
      },
      startDate,
      totalOccurrences: '9999',
    },
    amount,
    payment: {
      opaqueData: params.opaqueData,
    },
    customer: {
      email: params.customerEmail,
    },
  };

  if (params.billing) {
    subscription.billTo = {
      firstName: params.billing.firstName.substring(0, 50),
      lastName: params.billing.lastName.substring(0, 50),
    };
  }

  if (params.orderId || params.description) {
    subscription.order = {
      invoiceNumber: params.orderId?.substring(0, 20) || '',
      description: (params.description || 'CULTR Health Membership').substring(0, 255),
    };
  }

  const response = await gatewayFetch<SubscriptionResponse>(
    { ARBCreateSubscriptionRequest: { subscription } },
    params.credentials,
  );

  console.log('CorePay subscription created:', {
    subscriptionId: response.subscriptionId,
    resultCode: response.messages.resultCode,
    timestamp: new Date().toISOString(),
  });

  return response;
}
