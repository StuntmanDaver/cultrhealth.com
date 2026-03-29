'use client';

import type { PaymentProvider } from '@/lib/payments/payment-types';
import {
  KLARNA_ENABLED,
  AFFIRM_ENABLED,
  COREPAY_ENABLED,
  NOWPAYMENTS_ENABLED,
  CHERRY_ENABLED,
  COINBASE_COMMERCE_ENABLED,
  isAmountEligible,
} from '@/lib/config/payments';
import { CreditCard, Bitcoin } from 'lucide-react';

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
  comingSoon?: boolean;
}

export function PaymentMethodSelector({
  selected,
  onSelect,
  amountCents,
  isSubscription = false,
  bnplEnabled = true,
}: PaymentMethodSelectorProps) {
  const options: ProviderOption[] = [];

  // --- Active providers ---
  if (COREPAY_ENABLED) {
    options.push({
      id: 'corepay',
      label: 'Credit / Debit Card',
      sublabel: 'Powered by CorePay',
      icon: <CreditCard className="w-5 h-5" />,
      enabled: true,
    });
  }

  if (NOWPAYMENTS_ENABLED) {
    options.push({
      id: 'nowpayments',
      label: 'Pay with Bitcoin',
      sublabel: 'BTC via NOWPayments',
      icon: <BitcoinIcon />,
      enabled: true,
    });
  }

  // --- Coming Soon providers ---
  options.push({
    id: 'stripe',
    label: 'Credit Card (Stripe)',
    icon: <CreditCard className="w-5 h-5" />,
    enabled: false,
    comingSoon: true,
  });

  if (bnplEnabled && isAmountEligible('klarna', amountCents)) {
    options.push({
      id: 'klarna',
      label: 'Klarna',
      sublabel: 'Pay in 4 interest-free installments',
      icon: <KlarnaLogo />,
      enabled: KLARNA_ENABLED,
      comingSoon: !KLARNA_ENABLED,
    });
  } else if (KLARNA_ENABLED) {
    // show even outside amount range when enabled
  } else {
    options.push({
      id: 'klarna',
      label: 'Klarna',
      sublabel: 'Pay in 4 interest-free installments',
      icon: <KlarnaLogo />,
      enabled: false,
      comingSoon: true,
    });
  }

  if (bnplEnabled && isAmountEligible('affirm', amountCents)) {
    options.push({
      id: 'affirm',
      label: 'Affirm',
      sublabel: 'Pay over time',
      icon: <AffirmLogo />,
      enabled: AFFIRM_ENABLED,
      comingSoon: !AFFIRM_ENABLED,
    });
  } else if (!AFFIRM_ENABLED) {
    options.push({
      id: 'affirm',
      label: 'Affirm',
      sublabel: 'Pay over time',
      icon: <AffirmLogo />,
      enabled: false,
      comingSoon: true,
    });
  }

  options.push({
    id: 'cherry',
    label: 'Cherry Financing',
    sublabel: 'Healthcare payment plans',
    icon: <CherryLogo />,
    enabled: CHERRY_ENABLED,
    comingSoon: !CHERRY_ENABLED,
  });

  options.push({
    id: 'coinbase_commerce',
    label: 'Coinbase Commerce',
    sublabel: 'Pay with crypto',
    icon: <CoinbaseLogo />,
    enabled: COINBASE_COMMERCE_ENABLED,
    comingSoon: !COINBASE_COMMERCE_ENABLED,
  });

  // Always show the selector — we have Coming Soon providers
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
            onClick={() => !option.comingSoon && option.enabled && onSelect(option.id)}
            disabled={option.comingSoon || !option.enabled}
            className={`
              w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left
              ${selected === option.id && !option.comingSoon
                ? 'border-cultr-forest bg-cultr-mint/30 ring-1 ring-cultr-forest'
                : 'border-cultr-sage bg-white'
              }
              ${option.comingSoon ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-cultr-forest/40'}
            `}
          >
            <div className={`
              w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
              ${selected === option.id && !option.comingSoon ? 'border-cultr-forest' : 'border-cultr-sage'}
            `}>
              {selected === option.id && !option.comingSoon && (
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

            {option.comingSoon && (
              <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cultr-sage/40 text-cultr-forest border border-cultr-sage">
                Coming Soon
              </span>
            )}
          </button>
        ))}
      </div>

      {isSubscription && selected === 'nowpayments' && (
        <p className="text-xs text-cultr-textMuted bg-cultr-mint/50 rounded-lg p-2 border border-cultr-sage">
          Bitcoin payments cover your first month. You&apos;ll receive a monthly invoice by email for renewals.
        </p>
      )}
    </div>
  );
}

// ---------------------
// Provider Logos / Icons
// ---------------------

function BitcoinIcon() {
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 bg-orange-50 rounded-full">
      <Bitcoin className="w-4 h-4 text-orange-500" />
    </span>
  );
}

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

function CherryLogo() {
  return (
    <span className="inline-flex items-center justify-center w-12 h-5 bg-red-50 rounded text-[10px] font-bold text-red-600 tracking-wide">
      Cherry
    </span>
  );
}

function CoinbaseLogo() {
  return (
    <span className="inline-flex items-center justify-center w-12 h-5 bg-blue-50 rounded text-[10px] font-bold text-blue-600 tracking-wide">
      Coinbase
    </span>
  );
}
