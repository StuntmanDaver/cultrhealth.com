'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Script from 'next/script';
import { COREPAY_ENABLED, COREPAY_CONFIG } from '@/lib/config/payments';

// ---------------------
// SDK Ready State
// ---------------------

interface ProviderState {
  corepayReady: boolean;
  corepayError: boolean;
}

const ProviderContext = createContext<ProviderState>({
  corepayReady: false,
  corepayError: false,
});

export function useCorepayReady() {
  const ctx = useContext(ProviderContext);
  return { ready: ctx.corepayReady, error: ctx.corepayError };
}

// ---------------------
// Script Loader for CorePay (Accept.js)
// ---------------------

export function PaymentProviderLoader({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProviderState>({
    corepayReady: false,
    corepayError: false,
  });

  const handleCorepayLoad = useCallback(() => {
    setState((s) => ({ ...s, corepayReady: true }));
  }, []);

  const handleCorepayError = useCallback(() => {
    setState((s) => ({ ...s, corepayError: true }));
  }, []);

  return (
    <ProviderContext.Provider value={state}>
      {COREPAY_ENABLED && COREPAY_CONFIG.apiLoginId && (
        <Script
          src={COREPAY_CONFIG.acceptJsUrl}
          strategy="lazyOnload"
          onLoad={handleCorepayLoad}
          onError={handleCorepayError}
        />
      )}

      {children}
    </ProviderContext.Provider>
  );
}
