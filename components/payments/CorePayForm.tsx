'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, CreditCard, Lock } from 'lucide-react';
import { COREPAY_CONFIG } from '@/lib/config/payments';
import type { AuthorizeNetOpaqueData } from '@/lib/payments/payment-types';

// Accept.js type declarations (same SDK as Authorize.Net, CorePay uses same gateway)
declare global {
  interface Window {
    CorePayAccept?: {
      dispatchData: (
        secureData: AcceptSecureData,
        callback: (response: AcceptResponse) => void
      ) => void;
    };
  }
}

interface AcceptSecureData {
  authData: { clientKey: string; apiLoginID: string };
  cardData: { cardNumber: string; month: string; year: string; cardCode: string };
}

interface AcceptResponse {
  opaqueData?: { dataDescriptor: string; dataValue: string };
  messages: {
    resultCode: 'Ok' | 'Error';
    message: { code: string; text: string }[];
  };
}

export interface CorePayBillingInfo {
  firstName: string;
  lastName: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface CorePayFormProps {
  planSlug: string;
  amountCents: number;
  email: string;
  onSuccess: (redirectUrl: string) => void;
  onError: (error: string) => void;
}

export function CorePayForm({ planSlug, amountCents, email, onSuccess, onError }: CorePayFormProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const sdkLoadedRef = useRef(false);

  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (sdkLoadedRef.current || typeof window === 'undefined') return;
    sdkLoadedRef.current = true;

    // Use window.Accept (same Accept.js SDK, aliased for CorePay context)
    if ((window as unknown as Record<string, unknown>).Accept) {
      window.CorePayAccept = (window as unknown as Record<string, { dispatchData: (s: AcceptSecureData, c: (r: AcceptResponse) => void) => void }>).Accept;
      setSdkReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = COREPAY_CONFIG.acceptJsUrl;
    script.async = true;
    script.onload = () => {
      setTimeout(() => {
        const w = window as unknown as Record<string, unknown>;
        if (w.Accept) {
          window.CorePayAccept = w.Accept as typeof window.CorePayAccept;
          setSdkReady(true);
        } else {
          setSdkError('Payment SDK failed to initialize');
        }
      }, 100);
    };
    script.onerror = () => setSdkError('Failed to load payment SDK');
    document.head.appendChild(script);
  }, []);

  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    const clean = cardNumber.replace(/\s/g, '');
    if (!clean || clean.length < 13 || clean.length > 19) e.cardNumber = 'Enter a valid card number';
    if (!expMonth || !expYear) {
      e.expiration = 'Enter expiration date';
    } else {
      const now = new Date();
      const yr = parseInt('20' + expYear, 10);
      const mo = parseInt(expMonth, 10);
      if (mo < 1 || mo > 12) e.expiration = 'Invalid month';
      else if (yr < now.getFullYear() || (yr === now.getFullYear() && mo < now.getMonth() + 1))
        e.expiration = 'Card is expired';
    }
    if (!cvv || cvv.length < 3) e.cvv = 'Enter a valid CVV';
    if (!firstName.trim()) e.firstName = 'First name is required';
    if (!lastName.trim()) e.lastName = 'Last name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [cardNumber, expMonth, expYear, cvv, firstName, lastName]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !window.CorePayAccept) return;
    setLoading(true);

    const secureData: AcceptSecureData = {
      authData: { clientKey: COREPAY_CONFIG.publicClientKey, apiLoginID: COREPAY_CONFIG.apiLoginId },
      cardData: {
        cardNumber: cardNumber.replace(/\s/g, ''),
        month: expMonth.padStart(2, '0'),
        year: expYear,
        cardCode: cvv,
      },
    };

    window.CorePayAccept.dispatchData(secureData, async (response: AcceptResponse) => {
      if (response.messages.resultCode === 'Error' || !response.opaqueData) {
        setLoading(false);
        onError(response.messages.message?.[0]?.text || 'Card validation failed');
        return;
      }

      const opaqueData: AuthorizeNetOpaqueData = {
        dataDescriptor: response.opaqueData.dataDescriptor,
        dataValue: response.opaqueData.dataValue,
      };

      try {
        const res = await fetch('/api/checkout/corepay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planSlug,
            email,
            opaqueData,
            billing: { firstName: firstName.trim(), lastName: lastName.trim() },
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Payment failed');
        onSuccess(data.redirectUrl || '/success');
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Payment failed');
      } finally {
        setLoading(false);
      }
    });
  }, [validate, cardNumber, expMonth, expYear, cvv, firstName, lastName, planSlug, email, onSuccess, onError]);

  const formatCard = (v: string) => {
    const d = v.replace(/\D/g, '').substring(0, 19);
    return d.match(/.{1,4}/g)?.join(' ') || d;
  };

  if (sdkError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <p className="text-sm text-red-700">Payment system temporarily unavailable. Please try again or contact support.</p>
      </div>
    );
  }

  const disabled = !sdkReady || loading;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
        <div className="relative">
          <input
            type="text" value={cardNumber}
            onChange={(e) => setCardNumber(formatCard(e.target.value))}
            placeholder="4111 1111 1111 1111"
            className={`w-full px-4 py-3 pl-10 border rounded-lg outline-none transition-colors focus:ring-2 focus:ring-black/20 focus:border-black ${errors.cardNumber ? 'border-red-500' : 'border-gray-300'}`}
            maxLength={23} autoComplete="cc-number" disabled={disabled}
          />
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        {errors.cardNumber && <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>}
      </div>

      {/* Expiry + CVV */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expiration</label>
          <div className="flex gap-2">
            <input type="text" value={expMonth} onChange={(e) => setExpMonth(e.target.value.replace(/\D/g, '').substring(0, 2))}
              placeholder="MM" className={`w-16 px-3 py-3 border rounded-lg text-center outline-none focus:ring-2 focus:ring-black/20 ${errors.expiration ? 'border-red-500' : 'border-gray-300'}`}
              maxLength={2} autoComplete="cc-exp-month" disabled={disabled} />
            <span className="py-3 text-gray-400">/</span>
            <input type="text" value={expYear} onChange={(e) => setExpYear(e.target.value.replace(/\D/g, '').substring(0, 2))}
              placeholder="YY" className={`w-16 px-3 py-3 border rounded-lg text-center outline-none focus:ring-2 focus:ring-black/20 ${errors.expiration ? 'border-red-500' : 'border-gray-300'}`}
              maxLength={2} autoComplete="cc-exp-year" disabled={disabled} />
          </div>
          {errors.expiration && <p className="mt-1 text-sm text-red-600">{errors.expiration}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
          <div className="relative">
            <input type="text" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
              placeholder="123" className={`w-full px-4 py-3 pl-10 border rounded-lg outline-none focus:ring-2 focus:ring-black/20 ${errors.cvv ? 'border-red-500' : 'border-gray-300'}`}
              maxLength={4} autoComplete="cc-csc" disabled={disabled} />
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          {errors.cvv && <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>}
        </div>
      </div>

      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-black/20 ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
            autoComplete="given-name" disabled={disabled} />
          {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-black/20 ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
            autoComplete="family-name" disabled={disabled} />
          {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Lock className="w-3 h-3" />
        <span>Secured with 256-bit SSL encryption via CorePay</span>
      </div>

      <button type="submit" disabled={disabled}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-cultr-forest text-white font-bold rounded-full hover:bg-cultr-forest-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Processing...</>
          : !sdkReady ? <><Loader2 className="w-5 h-5 animate-spin" />Loading...</>
          : `Pay $${(amountCents / 100).toFixed(2)}`}
      </button>
    </form>
  );
}
