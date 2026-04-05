import { DISPENSING_PHARMACY } from '@/lib/config/compliance';
import { cn } from '@/lib/utils';

interface DispensingPharmacyInfoProps {
  variant?: 'full' | 'compact';
  className?: string;
}

export function DispensingPharmacyInfo({
  variant = 'full',
  className,
}: DispensingPharmacyInfoProps) {
  const p = DISPENSING_PHARMACY;

  if (variant === 'compact') {
    return (
      <div className={cn('text-xs', className)}>
        <span className="font-semibold">{p.name}</span>
        {' · '}
        <span>Phone: {p.phone}</span>
        {' · '}
        <span>License: {p.licenseNumber}</span>
      </div>
    );
  }

  return (
    <div className={cn('text-xs', className)}>
      <h4 className="font-semibold mb-1">Dispensing Pharmacy</h4>
      <p className="leading-relaxed">
        {p.name}
        <br />
        {p.address}, {p.city}, {p.state} {p.zip}
        <br />
        Phone: {p.phone} · Fax: {p.fax}
        <br />
        Toll-Free: {p.tollFree}
        <br />
        License: {p.licenseNumber} (FL)
      </p>
    </div>
  );
}
