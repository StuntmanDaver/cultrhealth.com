'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, CreditCard, Lock } from 'lucide-react';
import { AUTHORIZE_NET_CONFIG } from '@/lib/config/payments';
import type { AuthorizeNetOpaqueData } from '@/lib/payments/payment-types';

// Accept.js type declarations
declare global {
  interface Window {
    Accept?: {
      dispatchData: (
        secureData: AcceptSecureData,
        callback: (response: AcceptResponse) => void
      ) => void;
    };
  }
}

interface AcceptSecureData {
  authData: {
    clientKey: string;
    apiLoginID: string;
  };
  cardData: {
    cardNumber: string;
    month: string;
    year: string;
    cardCode: string;
  };
}

interface AcceptResponse {
  opaqueData?: {
    dataDescriptor: string;
    dataValue: string;
  };
  messages: {
    resultCode: 'Ok' | 'Error';
    message: {
      code: string;
      text: string;
    }[];
  };
}

interface AuthorizeNetFormProps {
  /** Called when Accept.js returns an opaque data token */
  onTokenReceived: (opaqueData: AuthorizeNetOpaqueData, billingInfo: BillingInfo) => void;
  /** Called on error */
  onError: (error: string) => void;
  /** External loading state */
  loading?: boolean;
  /** Button text */
  submitText?: string;
  /** Show billing address fields */
  collectBillingAddress?: boolean;
}

export interface BillingInfo {
  firstName: string;
  lastName: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export function AuthorizeNetForm({
  onTokenReceived,
  onError,
  loading: externalLoading = false,
  submitText = 'Pay Now',
  collectBillingAddress = false,
}: AuthorizeNetFormProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [tokenizing, setTokenizing] = useState(false);
  const sdkLoadedRef = useRef(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');

  // Billing address state (optional)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load Accept.js SDK
  useEffect(() => {
    if (sdkLoadedRef.current || typeof window === 'undefined') return;

    const loadSdk = () => {
      // Check if already loaded
      if (window.Accept) {
        setSdkReady(true);
        return;
      }

      const script = document.createElement('script');
      script.src = AUTHORIZE_NET_CONFIG.acceptJsUrl;
      script.async = true;

      script.onload = () => {
        sdkLoadedRef.current = true;
        // Accept.js may take a moment to initialize
        setTimeout(() => {
          if (window.Accept) {
            setSdkReady(true);
          } else {
            setSdkError('Accept.js failed to initialize');
          }
        }, 100);
      };

      script.onerror = () => {
        setSdkError('Failed to load Authorize.net SDK');
      };

      document.head.appendChild(script);
    };

    loadSdk();
  }, []);

  // Validate form fields
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Card number validation (basic)
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (!cleanCardNumber || cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      newErrors.cardNumber = 'Enter a valid card number';
    }

    // Expiration validation
    if (!expMonth || !expYear) {
      newErrors.expiration = 'Enter expiration date';
    } else {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const yearNum = parseInt('20' + expYear, 10);
      const monthNum = parseInt(expMonth, 10);

      if (monthNum < 1 || monthNum > 12) {
        newErrors.expiration = 'Invalid month';
      } else if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
        newErrors.expiration = 'Card is expired';
      }
    }

    // CVV validation
    if (!cvv || cvv.length < 3 || cvv.length > 4) {
      newErrors.cvv = 'Enter a valid CVV';
    }

    // Billing address validation (if required)
    if (collectBillingAddress) {
      if (!firstName.trim()) newErrors.firstName = 'First name is required';
      if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [cardNumber, expMonth, expYear, cvv, firstName, lastName, collectBillingAddress]);

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      if (!window.Accept) {
        onError('Authorize.net SDK not loaded');
        return;
      }

      setTokenizing(true);

      const secureData: AcceptSecureData = {
        authData: {
          clientKey: AUTHORIZE_NET_CONFIG.publicClientKey,
          apiLoginID: AUTHORIZE_NET_CONFIG.apiLoginId,
        },
        cardData: {
          cardNumber: cardNumber.replace(/\s/g, ''),
          month: expMonth.padStart(2, '0'),
          year: expYear,
          cardCode: cvv,
        },
      };

      window.Accept.dispatchData(secureData, (response: AcceptResponse) => {
        setTokenizing(false);

        if (response.messages.resultCode === 'Error') {
          const errorMessage = response.messages.message?.[0]?.text || 'Card validation failed';
          onError(errorMessage);
          return;
        }

        if (!response.opaqueData) {
          onError('Failed to tokenize card');
          return;
        }

        // Return opaque data and billing info
        onTokenReceived(
          {
            dataDescriptor: response.opaqueData.dataDescriptor,
            dataValue: response.opaqueData.dataValue,
          },
          {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            address: address.trim() || undefined,
            city: city.trim() || undefined,
            state: state.trim() || undefined,
            zip: zip.trim() || undefined,
            country: 'US',
          }
        );
      });
    },
    [
      cardNumber,
      expMonth,
      expYear,
      cvv,
      firstName,
      lastName,
      address,
      city,
      state,
      zip,
      validateForm,
      onTokenReceived,
      onError,
    ]
  );

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').substring(0, 19);
    const parts = [];
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.substring(i, i + 4));
    }
    return parts.join(' ');
  };

  if (sdkError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <p className="text-sm text-red-700">
          Payment system is temporarily unavailable. Please try again later or contact support.
        </p>
      </div>
    );
  }

  const isDisabled = !sdkReady || tokenizing || externalLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card Number */}
      <div>
        <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Card Number
        </label>
        <div className="relative">
          <input
            type="text"
            id="cardNumber"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="4111 1111 1111 1111"
            className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black outline-none transition-colors ${
              errors.cardNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            maxLength={23}
            autoComplete="cc-number"
            disabled={isDisabled}
          />
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        {errors.cardNumber && <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>}
      </div>

      {/* Expiration and CVV */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="expiration" className="block text-sm font-medium text-gray-700 mb-1">
            Expiration
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="expMonth"
              value={expMonth}
              onChange={(e) => setExpMonth(e.target.value.replace(/\D/g, '').substring(0, 2))}
              placeholder="MM"
              className={`w-16 px-3 py-3 border rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black outline-none transition-colors text-center ${
                errors.expiration ? 'border-red-500' : 'border-gray-300'
              }`}
              maxLength={2}
              autoComplete="cc-exp-month"
              disabled={isDisabled}
            />
            <span className="py-3 text-gray-400">/</span>
            <input
              type="text"
              id="expYear"
              value={expYear}
              onChange={(e) => setExpYear(e.target.value.replace(/\D/g, '').substring(0, 2))}
              placeholder="YY"
              className={`w-16 px-3 py-3 border rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black outline-none transition-colors text-center ${
                errors.expiration ? 'border-red-500' : 'border-gray-300'
              }`}
              maxLength={2}
              autoComplete="cc-exp-year"
              disabled={isDisabled}
            />
          </div>
          {errors.expiration && <p className="mt-1 text-sm text-red-600">{errors.expiration}</p>}
        </div>

        <div>
          <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
            CVV
          </label>
          <div className="relative">
            <input
              type="text"
              id="cvv"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
              placeholder="123"
              className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black outline-none transition-colors ${
                errors.cvv ? 'border-red-500' : 'border-gray-300'
              }`}
              maxLength={4}
              autoComplete="cc-csc"
              disabled={isDisabled}
            />
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          {errors.cvv && <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>}
        </div>
      </div>

      {/* Billing Address (optional) */}
      {collectBillingAddress && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black outline-none transition-colors ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
                autoComplete="given-name"
                disabled={isDisabled}
              />
              {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black outline-none transition-colors ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
                autoComplete="family-name"
                disabled={isDisabled}
              />
              {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Street Address
            </label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black outline-none transition-colors"
              autoComplete="street-address"
              disabled={isDisabled}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black outline-none transition-colors"
                autoComplete="address-level2"
                disabled={isDisabled}
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase().substring(0, 2))}
                placeholder="CA"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black outline-none transition-colors"
                maxLength={2}
                autoComplete="address-level1"
                disabled={isDisabled}
              />
            </div>
            <div>
              <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
                ZIP Code
              </label>
              <input
                type="text"
                id="zip"
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, '').substring(0, 5))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black outline-none transition-colors"
                maxLength={5}
                autoComplete="postal-code"
                disabled={isDisabled}
              />
            </div>
          </div>
        </>
      )}

      {/* Security note */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Lock className="w-3 h-3" />
        <span>Your payment info is secured with 256-bit SSL encryption</span>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isDisabled}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {tokenizing || externalLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {tokenizing ? 'Processing...' : 'Please wait...'}
          </>
        ) : !sdkReady ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading payment form...
          </>
        ) : (
          submitText
        )}
      </button>
    </form>
  );
}
