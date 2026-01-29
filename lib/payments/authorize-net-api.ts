// Server-side Authorize.net REST API wrapper
// Handles transactions, subscriptions (ARB), and webhook verification

import type {
  AuthorizeNetOpaqueData,
  AuthorizeNetTransactionResponse,
  AuthorizeNetSubscriptionResponse,
  AuthorizeNetLineItem,
  CheckoutItem,
} from './payment-types';
import { AUTHORIZE_NET_CONFIG } from '@/lib/config/payments';

// ---------------------
// Authentication
// ---------------------

function getMerchantAuthentication() {
  const apiLoginId = process.env.NEXT_PUBLIC_AUTHORIZE_NET_API_LOGIN_ID;
  const transactionKey = process.env.AUTHORIZE_NET_TRANSACTION_KEY;
  
  if (!apiLoginId || !transactionKey) {
    throw new Error('Authorize.net API credentials not configured');
  }
  
  return {
    name: apiLoginId,
    transactionKey: transactionKey,
  };
}

function getApiUrl(): string {
  return AUTHORIZE_NET_CONFIG.apiUrl;
}

// ---------------------
// API Request Helper
// ---------------------

async function authorizeNetFetch<T>(requestBody: Record<string, unknown>): Promise<T> {
  const url = getApiUrl();
  
  // Add merchant authentication to request
  const fullRequest = {
    ...requestBody,
    merchantAuthentication: getMerchantAuthentication(),
  };
  
  // Wrap in the appropriate API request envelope
  const requestKey = Object.keys(requestBody)[0];
  const envelope = {
    [requestKey]: fullRequest,
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(envelope),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Authorize.net API HTTP error:', {
      status: response.status,
      body: errorText,
    });
    throw new Error(`Authorize.net API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Check for API-level errors
  if (data.messages?.resultCode === 'Error') {
    const errorMessage = data.messages.message?.[0]?.text || 'Unknown error';
    console.error('Authorize.net API error:', data.messages);
    throw new Error(`Authorize.net error: ${errorMessage}`);
  }
  
  return data as T;
}

// ---------------------
// Build Line Items (PHI-free)
// ---------------------

export function buildLineItems(items: CheckoutItem[]): AuthorizeNetLineItem[] {
  return items.map((item, index) => ({
    itemId: item.sku || `item-${index + 1}`,
    name: item.name.substring(0, 31), // Max 31 chars
    description: item.name.substring(0, 255), // Max 255 chars
    quantity: item.quantity.toString(),
    unitPrice: (item.unitPriceCents / 100).toFixed(2),
  }));
}

// ---------------------
// Create Transaction (One-Time Payment)
// ---------------------

export interface CreateTransactionParams {
  opaqueData: AuthorizeNetOpaqueData;
  amountCents: number;
  orderId: string;
  description?: string;
  customerEmail: string;
  items?: CheckoutItem[];
  billing?: {
    firstName: string;
    lastName: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

export async function createTransaction(
  params: CreateTransactionParams
): Promise<AuthorizeNetTransactionResponse> {
  const amount = (params.amountCents / 100).toFixed(2);
  
  const transactionRequest: Record<string, unknown> = {
    transactionType: 'authCaptureTransaction',
    amount,
    payment: {
      opaqueData: params.opaqueData,
    },
    order: {
      invoiceNumber: params.orderId.substring(0, 20), // Max 20 chars
      description: (params.description || 'CULTR Health Purchase').substring(0, 255),
    },
    customer: {
      email: params.customerEmail,
    },
  };
  
  // Add billing address if provided
  if (params.billing) {
    transactionRequest.billTo = {
      firstName: params.billing.firstName.substring(0, 50),
      lastName: params.billing.lastName.substring(0, 50),
      address: params.billing.address?.substring(0, 60),
      city: params.billing.city?.substring(0, 40),
      state: params.billing.state?.substring(0, 40),
      zip: params.billing.zip?.substring(0, 20),
      country: params.billing.country || 'US',
    };
  }
  
  // Add line items if provided
  if (params.items && params.items.length > 0) {
    transactionRequest.lineItems = {
      lineItem: buildLineItems(params.items).slice(0, 30), // Max 30 line items
    };
  }
  
  const response = await authorizeNetFetch<AuthorizeNetTransactionResponse>({
    createTransactionRequest: {
      transactionRequest,
    },
  });
  
  // Log transaction result (no PHI)
  console.log('Authorize.net transaction created:', {
    transId: response.transactionResponse?.transId,
    responseCode: response.transactionResponse?.responseCode,
    resultCode: response.messages.resultCode,
    orderId: params.orderId,
    timestamp: new Date().toISOString(),
  });
  
  return response;
}

// ---------------------
// Create Subscription (ARB - Automated Recurring Billing)
// ---------------------

export interface CreateSubscriptionParams {
  opaqueData: AuthorizeNetOpaqueData;
  amountCents: number;
  subscriptionName: string;
  customerEmail: string;
  billing?: {
    firstName: string;
    lastName: string;
  };
  orderId?: string;
  description?: string;
  startDate?: string; // YYYY-MM-DD, defaults to today
  intervalMonths?: number; // Defaults to 1 (monthly)
}

export async function createSubscription(
  params: CreateSubscriptionParams
): Promise<AuthorizeNetSubscriptionResponse> {
  const amount = (params.amountCents / 100).toFixed(2);
  const startDate = params.startDate || new Date().toISOString().split('T')[0];
  
  const subscription: Record<string, unknown> = {
    name: params.subscriptionName.substring(0, 50), // Max 50 chars
    paymentSchedule: {
      interval: {
        length: (params.intervalMonths || 1).toString(),
        unit: 'months',
      },
      startDate,
      totalOccurrences: '9999', // Indefinite
    },
    amount,
    payment: {
      opaqueData: params.opaqueData,
    },
    customer: {
      email: params.customerEmail,
    },
  };
  
  // Add billing info if provided
  if (params.billing) {
    subscription.billTo = {
      firstName: params.billing.firstName.substring(0, 50),
      lastName: params.billing.lastName.substring(0, 50),
    };
  }
  
  // Add order info if provided
  if (params.orderId || params.description) {
    subscription.order = {
      invoiceNumber: params.orderId?.substring(0, 20) || '',
      description: (params.description || 'CULTR Health Membership').substring(0, 255),
    };
  }
  
  const response = await authorizeNetFetch<AuthorizeNetSubscriptionResponse>({
    ARBCreateSubscriptionRequest: {
      subscription,
    },
  });
  
  // Log subscription result (no PHI)
  console.log('Authorize.net subscription created:', {
    subscriptionId: response.subscriptionId,
    resultCode: response.messages.resultCode,
    timestamp: new Date().toISOString(),
  });
  
  return response;
}

// ---------------------
// Cancel Subscription
// ---------------------

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await authorizeNetFetch({
    ARBCancelSubscriptionRequest: {
      subscriptionId,
    },
  });
  
  console.log('Authorize.net subscription cancelled:', {
    subscriptionId,
    timestamp: new Date().toISOString(),
  });
}

// ---------------------
// Get Subscription Status
// ---------------------

export interface SubscriptionStatus {
  subscriptionId: string;
  status: 'active' | 'expired' | 'suspended' | 'canceled' | 'terminated';
  name: string;
  amount: string;
}

export async function getSubscriptionStatus(
  subscriptionId: string
): Promise<SubscriptionStatus> {
  const response = await authorizeNetFetch<{
    subscription: {
      name: string;
      amount: string;
      status: string;
    };
    messages: {
      resultCode: string;
      message: { code: string; text: string }[];
    };
  }>({
    ARBGetSubscriptionStatusRequest: {
      subscriptionId,
    },
  });
  
  return {
    subscriptionId,
    status: response.subscription.status.toLowerCase() as SubscriptionStatus['status'],
    name: response.subscription.name,
    amount: response.subscription.amount,
  };
}

// ---------------------
// Get Transaction Details
// ---------------------

export interface TransactionDetails {
  transId: string;
  submitTimeUTC: string;
  transactionType: string;
  transactionStatus: string;
  responseCode: number;
  responseReasonCode: number;
  authAmount: string;
  settleAmount: string;
  order?: {
    invoiceNumber: string;
    description: string;
  };
  customer?: {
    email: string;
  };
}

export async function getTransactionDetails(
  transactionId: string
): Promise<TransactionDetails> {
  const response = await authorizeNetFetch<{
    transaction: TransactionDetails;
    messages: {
      resultCode: string;
      message: { code: string; text: string }[];
    };
  }>({
    getTransactionDetailsRequest: {
      transId: transactionId,
    },
  });
  
  return response.transaction;
}

// ---------------------
// Refund Transaction
// ---------------------

export interface RefundParams {
  transactionId: string;
  amountCents?: number; // Partial refund, or full if not specified
  lastFourDigits: string; // Last 4 digits of the card
}

export async function refundTransaction(
  params: RefundParams
): Promise<AuthorizeNetTransactionResponse> {
  // First get original transaction details if amount not specified
  let amount: string;
  if (params.amountCents) {
    amount = (params.amountCents / 100).toFixed(2);
  } else {
    const original = await getTransactionDetails(params.transactionId);
    amount = original.settleAmount;
  }
  
  const response = await authorizeNetFetch<AuthorizeNetTransactionResponse>({
    createTransactionRequest: {
      transactionRequest: {
        transactionType: 'refundTransaction',
        amount,
        payment: {
          creditCard: {
            cardNumber: params.lastFourDigits,
            expirationDate: 'XXXX', // Required but not validated for refunds
          },
        },
        refTransId: params.transactionId,
      },
    },
  });
  
  console.log('Authorize.net refund processed:', {
    originalTransId: params.transactionId,
    refundTransId: response.transactionResponse?.transId,
    amount,
    timestamp: new Date().toISOString(),
  });
  
  return response;
}

// ---------------------
// Verify Webhook Signature
// ---------------------

import { createHmac } from 'crypto';

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  webhookSignatureKey?: string
): boolean {
  const signatureKey = webhookSignatureKey || process.env.AUTHORIZE_NET_WEBHOOK_SIGNATURE_KEY;
  
  if (!signatureKey) {
    console.warn('Authorize.net webhook signature key not configured, skipping verification');
    return true; // Allow if no key configured (development)
  }
  
  const expectedSignature = createHmac('sha512', signatureKey)
    .update(payload)
    .digest('hex')
    .toUpperCase();
  
  return signature.toUpperCase() === expectedSignature;
}

// ---------------------
// Helper: Check if transaction was successful
// ---------------------

export function isTransactionSuccessful(
  response: AuthorizeNetTransactionResponse
): boolean {
  // Response code 1 = Approved
  return (
    response.messages.resultCode === 'Ok' &&
    response.transactionResponse?.responseCode === '1'
  );
}

// ---------------------
// Helper: Get error message from response
// ---------------------

export function getTransactionError(
  response: AuthorizeNetTransactionResponse
): string {
  // Check transaction-level errors first
  if (response.transactionResponse?.errors?.error?.[0]) {
    return response.transactionResponse.errors.error[0].errorText;
  }
  
  // Fall back to API-level messages
  if (response.messages.message?.[0]) {
    return response.messages.message[0].text;
  }
  
  return 'Unknown payment error';
}
