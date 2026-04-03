// Payment Configuration
// Feature flags and provider settings for active payment providers (Stripe + CorePay)

import type { PaymentProvider } from '@/lib/payments/payment-types';

// ---------------------
// Feature Flags
// ---------------------

export const COREPAY_ENABLED = process.env.NEXT_PUBLIC_ENABLE_COREPAY === 'true';

export function isProviderEnabled(provider: PaymentProvider): boolean {
  switch (provider) {
    case 'stripe':
      return true; // Always available as fallback
    case 'corepay':
      return COREPAY_ENABLED;
    default:
      return false;
  }
}

export function getEnabledProviders(): PaymentProvider[] {
  const providers: PaymentProvider[] = [];
  if (COREPAY_ENABLED) providers.push('corepay');
  providers.push('stripe');
  return providers;
}

// ---------------------
// CorePay Configuration (uses Authorize.Net gateway)
// ---------------------

export const COREPAY_CONFIG = {
  apiUrl: process.env.COREPAY_ENVIRONMENT === 'production'
    ? 'https://api.authorize.net/xml/v1/request.api'
    : 'https://apitest.authorize.net/xml/v1/request.api',
  acceptJsUrl: process.env.COREPAY_ENVIRONMENT === 'production'
    ? 'https://js.authorize.net/v1/Accept.js'
    : 'https://jstest.authorize.net/v1/Accept.js',
  apiLoginId: process.env.NEXT_PUBLIC_COREPAY_API_LOGIN_ID || '',
  publicClientKey: process.env.NEXT_PUBLIC_COREPAY_PUBLIC_CLIENT_KEY || '',
  environment: (process.env.COREPAY_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
  currency: 'USD',
} as const;
