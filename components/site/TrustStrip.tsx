import {
  Stethoscope,
  FlaskConical,
  Shield,
  Truck,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TRUST_ITEMS = [
  { icon: Stethoscope, label: 'Licensed providers' },
  { icon: FlaskConical, label: '29 biomarkers (up to 60+)' },
  { icon: Shield, label: 'HIPAA-compliant' },
  { icon: Truck, label: 'Delivered to your door' },
  { icon: CreditCard, label: 'HSA/FSA eligible' },
];

interface TrustStripProps {
  variant?: 'light' | 'dark';
  className?: string;
}

export function TrustStrip({ variant = 'light', className }: TrustStripProps) {
  const isLight = variant === 'light';

  return (
    <div className={cn(
      'py-5 px-6',
      isLight ? 'grad-mint border-b border-cultr-sage' : 'bg-white/5',
      className,
    )}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 md:gap-x-10">
          {TRUST_ITEMS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className={cn(
                'flex items-center gap-2',
                isLight ? 'text-cultr-forest' : 'text-white/80',
              )}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="text-xs font-display font-medium tracking-wide">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
