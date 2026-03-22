import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface Step {
  title: string;
  description: string;
  icon?: LucideIcon;
}

interface HowItWorksStepsProps {
  steps: Step[];
  variant?: '3-step' | '5-step';
  className?: string;
}

export function HowItWorksSteps({ steps, variant = '3-step', className }: HowItWorksStepsProps) {
  const is5Step = variant === '5-step';

  return (
    <div className={cn(
      'grid gap-6',
      is5Step ? 'md:grid-cols-1 max-w-3xl mx-auto' : 'md:grid-cols-3',
      className,
    )}>
      {steps.map((step, i) => {
        const Icon = step.icon;
        return (
          <ScrollReveal key={step.title} delay={i * 100} direction="up">
            <div className={cn(
              'relative rounded-2xl p-6',
              is5Step
                ? 'flex items-start gap-5 glass-card border-gradient'
                : 'text-center glass-card border-gradient',
            )}>
              {/* Step number */}
              <div className={cn(
                'flex items-center justify-center rounded-full bg-cultr-forest text-white font-display font-bold shrink-0',
                is5Step ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-lg mx-auto mb-4',
              )}>
                {i + 1}
              </div>

              <div className={is5Step ? 'flex-1' : ''}>
                {Icon && !is5Step && (
                  <div className="flex justify-center mb-3">
                    <Icon className="w-6 h-6 text-cultr-forest" />
                  </div>
                )}
                <h3 className={cn(
                  'font-display font-bold text-cultr-forest',
                  is5Step ? 'text-base mb-1' : 'text-lg mb-2',
                )}>
                  {step.title}
                </h3>
                <p className="text-sm text-cultr-textMuted leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          </ScrollReveal>
        );
      })}
    </div>
  );
}
