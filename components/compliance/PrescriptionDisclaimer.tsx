import { DISCLAIMERS } from '@/lib/config/compliance';
import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';

interface PrescriptionDisclaimerProps {
  className?: string;
}

export function PrescriptionDisclaimer({ className }: PrescriptionDisclaimerProps) {
  return (
    <p
      className={cn(
        'flex items-center gap-2 text-xs text-brand-primary/60',
        className
      )}
    >
      <Shield className="w-3.5 h-3.5 shrink-0" />
      <span>{DISCLAIMERS.prescriptionRequired}</span>
    </p>
  );
}
