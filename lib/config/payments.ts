// Payment Configuration
// Feature flags and provider settings for all payment providers

import type { PaymentProvider } from '@/lib/payments/payment-types';

// ---------------------
// Feature Flags
// ---------------------

export const KLARNA_ENABLED = process.env.NEXT_PUBLIC_ENABLE_KLARNA === 'true';
export const AFFIRM_ENABLED = process.env.NEXT_PUBLIC_ENABLE_AFFIRM === 'true';
export const AUTHORIZE_NET_ENABLED = process.env.NEXT_PUBLIC_ENABLE_AUTHORIZE_NET === 'true';

// Primary payment provider for card transactions (stripe or authorize_net)
// This determines which provider handles direct card payments
export const PRIMARY_PAYMENT_PROVIDER: 'stripe' | 'authorize_net' = 
  (process.env.NEXT_PUBLIC_PRIMARY_PAYMENT_PROVIDER as 'stripe' | 'authorize_net') || 'stripe';

export function isProviderEnabled(provider: PaymentProvider): boolean {
  switch (provider) {
    case 'stripe':
      return true; // Always available as fallback
    case 'healthie':
      return true; // Healthie (via Stripe Connect) is always available for HIPAA compliance
    case 'klarna':
      return KLARNA_ENABLED;
    case 'affirm':
      return AFFIRM_ENABLED;
    case 'authorize_net':
      return AUTHORIZE_NET_ENABLED;
    default:
      return false;
  }
}

export function getEnabledProviders(): PaymentProvider[] {
  const providers: PaymentProvider[] = ['stripe'];
  if (AUTHORIZE_NET_ENABLED) providers.push('authorize_net');
  if (KLARNA_ENABLED) providers.push('klarna');
  if (AFFIRM_ENABLED) providers.push('affirm');
  return providers;
}

/**
 * Get the primary payment provider for card transactions.
 * Use this to determine whether to show Stripe Checkout or Authorize.net form.
 */
export function getPrimaryPaymentProvider(): 'stripe' | 'authorize_net' {
  // Only return authorize_net if it's enabled
  if (PRIMARY_PAYMENT_PROVIDER === 'authorize_net' && AUTHORIZE_NET_ENABLED) {
    return 'authorize_net';
  }
  return 'stripe';
}

// ---------------------
// BNPL Amount Limits (USD cents)
// ---------------------

export const BNPL_LIMITS = {
  klarna: {
    minCents: 3500,   // $35.00
    maxCents: 100000,  // $1,000.00
  },
  affirm: {
    minCents: 5000,   // $50.00
    maxCents: 3000000, // $30,000.00
  },
} as const;

export function isAmountEligible(
  provider: 'klarna' | 'affirm',
  amountCents: number
): boolean {
  const limits = BNPL_LIMITS[provider];
  return amountCents >= limits.minCents && amountCents <= limits.maxCents;
}

// ---------------------
// Provider Configuration
// ---------------------

export const KLARNA_CONFIG = {
  apiUrl: process.env.KLARNA_API_URL || 'https://api.playground.klarna.com',
  clientId: process.env.NEXT_PUBLIC_KLARNA_CLIENT_ID || '',
  purchaseCountry: 'US',
  purchaseCurrency: 'USD',
  locale: 'en-US',
} as const;

export const AFFIRM_CONFIG = {
  apiUrl: process.env.AFFIRM_API_URL || 'https://sandbox.affirm.com',
  publicKey: process.env.NEXT_PUBLIC_AFFIRM_PUBLIC_KEY || '',
  scriptUrl: process.env.NEXT_PUBLIC_AFFIRM_SCRIPT_URL || 'https://cdn1-sandbox.affirm.com/js/v2/affirm.js',
  currency: 'USD',
} as const;

// ---------------------
// Authorize.net Configuration
// ---------------------

export const AUTHORIZE_NET_CONFIG = {
  // API endpoints
  apiUrl: process.env.AUTHORIZE_NET_ENVIRONMENT === 'production'
    ? 'https://api.authorize.net/xml/v1/request.api'
    : 'https://apitest.authorize.net/xml/v1/request.api',
  // Accept.js script URL for PCI-compliant card collection
  acceptJsUrl: process.env.AUTHORIZE_NET_ENVIRONMENT === 'production'
    ? 'https://js.authorize.net/v1/Accept.js'
    : 'https://jstest.authorize.net/v1/Accept.js',
  // Public credentials (safe for client-side)
  apiLoginId: process.env.NEXT_PUBLIC_AUTHORIZE_NET_API_LOGIN_ID || '',
  publicClientKey: process.env.NEXT_PUBLIC_AUTHORIZE_NET_PUBLIC_CLIENT_KEY || '',
  // Environment
  environment: (process.env.AUTHORIZE_NET_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
  currency: 'USD',
} as const;
