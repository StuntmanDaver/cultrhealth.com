import { DISCLAIMERS } from '@/lib/config/compliance';
import { cn } from '@/lib/utils';

interface TestimonialDisclaimerProps {
  className?: string;
}

export function TestimonialDisclaimer({ className }: TestimonialDisclaimerProps) {
  return (
    <p
      className={cn(
        'text-xs leading-relaxed text-white/50 bg-white/5 rounded-lg px-4 py-3 max-w-2xl mx-auto text-center',
        className
      )}
    >
      {DISCLAIMERS.testimonial}
    </p>
  );
}
