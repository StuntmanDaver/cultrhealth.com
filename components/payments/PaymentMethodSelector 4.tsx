'use client';

import type { PaymentProvider } from '@/lib/payments/payment-types';
import { KLARNA_ENABLED, AFFIRM_ENABLED, isAmountEligible } from '@/lib/config/payments';
import { CreditCard } from 'lucide-react';

interface PaymentMethodSelectorProps {
  selected: PaymentProvider;
  onSelect: (provider: PaymentProvider) => void;
  amountCents: number;
  isSubscription?: boolean;
  bnplEnabled?: boolean;
}

interface ProviderOption {
  id: PaymentProvider;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  enabled: boolean;
}

export function PaymentMethodSelector({
  selected,
  onSelect,
  amountCents,
  isSubscription = false,
  bnplEnabled = true,
}: PaymentMethodSelectorProps) {
  const options: ProviderOption[] = [
    {
      id: 'stripe',
      label: 'Credit / Debit Card',
      icon: <CreditCard className="w-5 h-5" />,
      enabled: true,
    },
  ];

  if (KLARNA_ENABLED && bnplEnabled && isAmountEligible('klarna', amountCents)) {
    options.push({
      id: 'klarna',
      label: 'Klarna',
      sublabel: 'Pay in 4 interest-free installments',
      icon: <KlarnaLogo />,
      enabled: true,
    });
  }

  if (AFFIRM_ENABLED && bnplEnabled && isAmountEligible('affirm', amountCents)) {
    options.push({
      id: 'affirm',
      label: 'Affirm',
      sublabel: 'Pay over time',
      icon: <AffirmLogo />,
      enabled: true,
    });
  }

  // If only stripe is available, don't show selector
  if (options.length <= 1) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-cultr-forest tracking-widest uppercase">
        Payment Method
      </p>

      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => option.enabled && onSelect(option.id)}
            disabled={!option.enabled}
            className={`
              w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left
              ${selected === option.id
                ? 'border-cultr-forest bg-cultr-mint/30 ring-1 ring-cultr-forest'
                : 'border-cultr-sage hover:border-cultr-forest/40 bg-white'
              }
              ${!option.enabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className={`
              w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
              ${selected === option.id ? 'border-cultr-forest' : 'border-cultr-sage'}
            `}>
              {selected === option.id && (
                <div className="w-2 h-2 rounded-full grad-dark" />
              )}
            </div>

            <span className="shrink-0">{option.icon}</span>

            <div className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-cultr-text">{option.label}</span>
              {option.sublabel && (
                <span className="block text-xs text-cultr-textMuted">{option.sublabel}</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {isSubscription && selected !== 'stripe' && (
        <p className="text-xs text-cultr-textMuted bg-cultr-mint/50 rounded-lg p-2 border border-cultr-sage">
          BNPL applies to the first month only. A card will be required for recurring billing.
        </p>
      )}
    </div>
  );
}

// ---------------------
// Provider Logos (simple SVG/text fallbacks)
// ---------------------

function KlarnaLogo() {
  return (
    <span className="inline-flex items-center justify-center w-12 h-5 bg-pink-50 rounded text-[10px] font-bold text-pink-600 tracking-wide">
      Klarna
    </span>
  );
}

function AffirmLogo() {
  return (
    <span className="inline-flex items-center justify-center w-12 h-5 bg-blue-50 rounded text-[10px] font-bold text-blue-700 tracking-wide">
      affirm
    </span>
  );
}
