import { DISCLAIMERS } from '@/lib/config/compliance';
import { cn } from '@/lib/utils';

interface TestimonialDisclaimerProps {
  className?: string;
}

export function TestimonialDisclaimer({ className }: TestimonialDisclaimerProps) {
  return (
    <p
      className={cn(
        'text-[11px] leading-relaxed text-white/40 max-w-2xl mx-auto text-center italic',
        className
      )}
    >
      {DISCLAIMERS.testimonial}
    </p>
  );
}
