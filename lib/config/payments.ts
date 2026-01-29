// BNPL Payment Configuration
// Feature flags and provider settings for Klarna & Affirm

import type { PaymentProvider } from '@/lib/payments/payment-types';

// ---------------------
// Feature Flags
// ---------------------

export const KLARNA_ENABLED = process.env.NEXT_PUBLIC_ENABLE_KLARNA === 'true';
export const AFFIRM_ENABLED = process.env.NEXT_PUBLIC_ENABLE_AFFIRM === 'true';

export function isProviderEnabled(provider: PaymentProvider): boolean {
  switch (provider) {
    case 'stripe':
      return true;
    case 'klarna':
      return KLARNA_ENABLED;
    case 'affirm':
      return AFFIRM_ENABLED;
    default:
      return false;
  }
}

export function getEnabledProviders(): PaymentProvider[] {
  const providers: PaymentProvider[] = ['stripe'];
  if (KLARNA_ENABLED) providers.push('klarna');
  if (AFFIRM_ENABLED) providers.push('affirm');
  return providers;
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
