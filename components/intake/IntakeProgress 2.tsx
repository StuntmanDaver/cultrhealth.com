'use client';

import { CheckCircle2 } from 'lucide-react';
import type { IntakeFormStep } from '@/lib/config/asher-med';

interface IntakeProgressProps {
  steps: IntakeFormStep[];
  currentStep: number;
  completedSteps: string[];
  onStepClick: (index: number) => void;
}

export function IntakeProgress({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: IntakeProgressProps) {
  return (
    <div className="bg-white border-b border-forest-light/20">
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Mobile: Progress bar with step label */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-forest">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.shortTitle || steps[currentStep]?.title}
            </span>
          </div>
          <div className="h-2 bg-mint rounded-full overflow-hidden">
            <div
              className="h-full bg-forest transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Desktop: Step indicators */}
        <div className="hidden md:flex items-center gap-1 overflow-x-auto pb-2 pl-1">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = index === currentStep;
            const isClickable = index <= currentStep || completedSteps.includes(steps[index - 1]?.id);

            return (
              <button
                key={step.id}
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0
                  ${isCurrent
                    ? 'bg-forest text-white shadow-md'
                    : isCompleted
                    ? 'bg-mint text-forest hover:bg-sage'
                    : isClickable
                    ? 'text-forest-muted hover:bg-cream-dark hover:text-forest'
                    : 'text-forest-muted/40 cursor-not-allowed'
                  }
                `}
              >
                {isCompleted && !isCurrent ? (
                  <CheckCircle2 className="w-4 h-4 text-forest" />
                ) : (
                  <span
                    className={`
                      w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold
                      ${isCurrent
                        ? 'bg-white text-forest'
                        : isClickable
                        ? 'bg-forest-light/20 text-forest-muted'
                        : 'bg-forest-light/10 text-forest-muted/40'
                      }
                    `}
                  >
                    {index + 1}
                  </span>
                )}
                {step.shortTitle || step.title}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
