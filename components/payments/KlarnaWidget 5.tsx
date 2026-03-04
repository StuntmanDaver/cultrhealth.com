'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useKlarnaReady } from './PaymentProviderLoader';
import { Loader2, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    Klarna?: {
      Payments: {
        init: (config: { client_token: string }) => void;
        load: (
          options: { container: string; payment_method_category: string },
          callback: (res: { show_form: boolean; error?: unknown }) => void
        ) => void;
        authorize: (
          options: { payment_method_category: string },
          data: Record<string, unknown>,
          callback: (res: {
            approved: boolean;
            authorization_token?: string;
            show_form?: boolean;
            error?: unknown;
          }) => void
        ) => void;
      };
    };
  }
}

interface KlarnaWidgetProps {
  clientToken: string;
  /** Called with authorization_token when user approves */
  onAuthorized: (authorizationToken: string) => void;
  onError: (error: string) => void;
  paymentMethodCategory?: string;
}

export function KlarnaWidget({
  clientToken,
  onAuthorized,
  onError,
  paymentMethodCategory = 'pay_later',
}: KlarnaWidgetProps) {
  const { ready, error: sdkError } = useKlarnaReady();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);
  const initializedRef = useRef(false);

  // Initialize and load Klarna widget
  useEffect(() => {
    if (!ready || !clientToken || !window.Klarna || initializedRef.current) return;
    initializedRef.current = true;

    try {
      window.Klarna.Payments.init({ client_token: clientToken });

      window.Klarna.Payments.load(
        {
          container: '#klarna-payments-container',
          payment_method_category: paymentMethodCategory,
        },
        (res) => {
          setLoading(false);
          if (res.show_form) {
            setFormVisible(true);
          } else {
            onError('Klarna payment form could not be loaded');
          }
        }
      );
    } catch (err) {
      setLoading(false);
      onError('Failed to initialize Klarna');
      console.error('Klarna init error:', err);
    }
  }, [ready, clientToken, paymentMethodCategory, onError]);

  // Handle SDK load failure
  useEffect(() => {
    if (sdkError) {
      setLoading(false);
      onError('Klarna SDK failed to load');
    }
  }, [sdkError, onError]);

  const handleAuthorize = useCallback(() => {
    if (!window.Klarna || authorizing) return;
    setAuthorizing(true);

    window.Klarna.Payments.authorize(
      { payment_method_category: paymentMethodCategory },
      {},
      (res) => {
        setAuthorizing(false);
        if (res.approved && res.authorization_token) {
          onAuthorized(res.authorization_token);
        } else {
          onError('Klarna authorization was not approved');
        }
      }
    );
  }, [paymentMethodCategory, onAuthorized, onError, authorizing]);

  if (sdkError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <p className="text-sm text-red-700">
          Klarna is temporarily unavailable. Please select another payment method.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-cultr-forest" />
          <span className="ml-2 text-sm text-cultr-textMuted">Loading Klarna...</span>
        </div>
      )}

      <div
        id="klarna-payments-container"
        ref={containerRef}
        className={loading ? 'hidden' : ''}
      />

      {formVisible && (
        <button
          type="button"
          onClick={handleAuthorize}
          disabled={authorizing}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
        >
          {authorizing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Authorizing...
            </>
          ) : (
            'Pay with Klarna'
          )}
        </button>
      )}
    </div>
  );
}
