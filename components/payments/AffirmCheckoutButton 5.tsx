'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAffirmReady } from './PaymentProviderLoader';
import { Loader2, AlertCircle } from 'lucide-react';
import type { AffirmCheckoutConfig } from '@/lib/payments/payment-types';

declare global {
  interface Window {
    affirm?: {
      checkout: {
        (config: AffirmCheckoutConfig): void;
        open: () => void;
      };
      ui: {
        ready: (callback: () => void) => void;
      };
    };
  }
}

interface AffirmCheckoutButtonProps {
  /** Fetch checkout config from backend, then pass it here */
  checkoutConfig: AffirmCheckoutConfig | null;
  /** Called when Affirm returns a checkout_token (via confirmation URL redirect) */
  onCheckoutComplete?: () => void;
  onError: (error: string) => void;
  loading?: boolean;
}

export function AffirmCheckoutButton({
  checkoutConfig,
  onError,
  loading: externalLoading = false,
}: AffirmCheckoutButtonProps) {
  const { ready, error: sdkError } = useAffirmReady();
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    if (sdkError) {
      onError('Affirm SDK failed to load');
    }
  }, [sdkError, onError]);

  const handleCheckout = useCallback(() => {
    if (!window.affirm || !checkoutConfig) {
      onError('Affirm is not ready');
      return;
    }

    setLaunching(true);

    try {
      window.affirm.checkout(checkoutConfig);
      window.affirm.checkout.open();
    } catch (err) {
      setLaunching(false);
      onError('Failed to open Affirm checkout');
      console.error('Affirm checkout error:', err);
    }
  }, [checkoutConfig, onError]);

  if (sdkError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <p className="text-sm text-red-700">
          Affirm is temporarily unavailable. Please select another payment method.
        </p>
      </div>
    );
  }

  const isDisabled = !ready || !checkoutConfig || launching || externalLoading;

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={isDisabled}
      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-700 text-white font-bold rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {launching || externalLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          {externalLoading ? 'Preparing...' : 'Opening Affirm...'}
        </>
      ) : !ready ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading Affirm...
        </>
      ) : (
        'Pay with Affirm'
      )}
    </button>
  );
}
