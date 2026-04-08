'use client';

import type { PaymentProvider } from '@/lib/payments/payment-types';
import { COREPAY_ENABLED } from '@/lib/config/payments';
import { CreditCard } from 'lucide-react';

interface PaymentMethodSelectorProps {
  selected: PaymentProvider;
  onSelect: (provider: PaymentProvider) => void;
  amountCents: number;
  isSubscription?: boolean;
}

interface ProviderOption {
  id: PaymentProvider;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  enabled: boolean;
  comingSoon?: boolean;
}

export function PaymentMethodSelector({
  selected,
  onSelect,
  amountCents,
  isSubscription = false,
}: PaymentMethodSelectorProps) {
  const options: ProviderOption[] = [];

  if (COREPAY_ENABLED) {
    options.push({
      id: 'corepay',
      label: 'Credit / Debit Card',
      sublabel: 'Powered by CorePay',
      icon: <CreditCard className="w-5 h-5" />,
      enabled: true,
    });
  }

  if (!COREPAY_ENABLED) {
    // Stripe is shown as primary when CorePay is not yet enabled
    options.push({
      id: 'stripe',
      label: 'Credit / Debit Card',
      sublabel: 'Powered by Stripe',
      icon: <CreditCard className="w-5 h-5" />,
      enabled: true,
    });
  } else {
    // When CorePay is active, Stripe is a fallback
    options.push({
      id: 'stripe',
      label: 'Credit Card (Stripe)',
      icon: <CreditCard className="w-5 h-5" />,
      enabled: true,
    });
  }

  // If only one option, no need to show selector
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
                : 'border-cultr-sage bg-white'
              }
              cursor-pointer hover:border-cultr-forest/40
            `}
          >
            <div className={`
              w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
              ${selected === option.id ? 'border-cultr-forest' : 'border-cultr-sage'}
            `}>
              {selected === option.id && (
                <div className="w-2 h-2 rounded-full bg-cultr-forest" />
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
    </div>
  );
}
