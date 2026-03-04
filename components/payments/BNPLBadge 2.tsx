'use client';

import { KLARNA_ENABLED, AFFIRM_ENABLED, isAmountEligible } from '@/lib/config/payments';

interface BNPLBadgeProps {
  priceUsd: number;
  className?: string;
}

export function BNPLBadge({ priceUsd, className = '' }: BNPLBadgeProps) {
  const amountCents = Math.round(priceUsd * 100);
  const showKlarna = KLARNA_ENABLED && isAmountEligible('klarna', amountCents);
  const showAffirm = AFFIRM_ENABLED && isAmountEligible('affirm', amountCents);

  if (!showKlarna && !showAffirm) return null;

  const installmentAmount = (priceUsd / 4).toFixed(2);

  return (
    <p className={`text-xs text-cultr-textMuted ${className}`}>
      or 4 interest-free payments of <span className="font-medium">${installmentAmount}</span>
      {showKlarna && showAffirm
        ? ' with Klarna or Affirm'
        : showKlarna
          ? ' with Klarna'
          : ' with Affirm'}
    </p>
  );
}
