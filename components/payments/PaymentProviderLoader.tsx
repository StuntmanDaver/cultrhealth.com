'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import Script from 'next/script';
import { KLARNA_ENABLED, AFFIRM_ENABLED, KLARNA_CONFIG, AFFIRM_CONFIG } from '@/lib/config/payments';

// ---------------------
// SDK Ready State
// ---------------------

interface ProviderState {
  klarnaReady: boolean;
  affirmReady: boolean;
  klarnaError: boolean;
  affirmError: boolean;
}

const ProviderContext = createContext<ProviderState>({
  klarnaReady: false,
  affirmReady: false,
  klarnaError: false,
  affirmError: false,
});

export function useKlarnaReady() {
  const ctx = useContext(ProviderContext);
  return { ready: ctx.klarnaReady, error: ctx.klarnaError };
}

export function useAffirmReady() {
  const ctx = useContext(ProviderContext);
  return { ready: ctx.affirmReady, error: ctx.affirmError };
}

// ---------------------
// Script Loader with Timeout + Retry
// ---------------------

const SDK_TIMEOUT_MS = 10000;
const SDK_RETRY_DELAY_MS = 2000;

export function PaymentProviderLoader({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProviderState>({
    klarnaReady: false,
    affirmReady: false,
    klarnaError: false,
    affirmError: false,
  });

  const [klarnaRetried, setKlarnaRetried] = useState(false);
  const [affirmRetried, setAffirmRetried] = useState(false);

  // Klarna timeout handler
  useEffect(() => {
    if (!KLARNA_ENABLED || state.klarnaReady || state.klarnaError) return;

    const timer = setTimeout(() => {
      if (!state.klarnaReady && !klarnaRetried) {
        // Retry once
        setKlarnaRetried(true);
      } else if (!state.klarnaReady) {
        setState((s) => ({ ...s, klarnaError: true }));
      }
    }, SDK_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [state.klarnaReady, state.klarnaError, klarnaRetried]);

  // Affirm timeout handler
  useEffect(() => {
    if (!AFFIRM_ENABLED || state.affirmReady || state.affirmError) return;

    const timer = setTimeout(() => {
      if (!state.affirmReady && !affirmRetried) {
        setAffirmRetried(true);
      } else if (!state.affirmReady) {
        setState((s) => ({ ...s, affirmError: true }));
      }
    }, SDK_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [state.affirmReady, state.affirmError, affirmRetried]);

  const handleKlarnaLoad = useCallback(() => {
    setState((s) => ({ ...s, klarnaReady: true }));
  }, []);

  const handleKlarnaError = useCallback(() => {
    if (!klarnaRetried) {
      setKlarnaRetried(true);
    } else {
      setState((s) => ({ ...s, klarnaError: true }));
    }
  }, [klarnaRetried]);

  const handleAffirmLoad = useCallback(() => {
    setState((s) => ({ ...s, affirmReady: true }));
  }, []);

  const handleAffirmError = useCallback(() => {
    if (!affirmRetried) {
      setAffirmRetried(true);
    } else {
      setState((s) => ({ ...s, affirmError: true }));
    }
  }, [affirmRetried]);

  return (
    <ProviderContext.Provider value={state}>
      {KLARNA_ENABLED && KLARNA_CONFIG.clientId && (
        <Script
          key={klarnaRetried ? 'klarna-retry' : 'klarna'}
          src={`https://x.klarnacdn.net/kp/lib/v1/api.js`}
          strategy="lazyOnload"
          onLoad={handleKlarnaLoad}
          onError={handleKlarnaError}
        />
      )}

      {AFFIRM_ENABLED && AFFIRM_CONFIG.scriptUrl && AFFIRM_CONFIG.publicKey && (
        <Script
          key={affirmRetried ? 'affirm-retry' : 'affirm'}
          src={AFFIRM_CONFIG.scriptUrl}
          strategy="lazyOnload"
          onLoad={handleAffirmLoad}
          onError={handleAffirmError}
        />
      )}

      {children}
    </ProviderContext.Provider>
  );
}
