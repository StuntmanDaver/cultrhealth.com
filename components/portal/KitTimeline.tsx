'use client'

import { Check } from 'lucide-react'
import { KIT_LIFECYCLE_STAGES, type KitLifecycleState } from '@/lib/siphox/kit-lifecycle'

interface KitTimelineProps {
  currentState: KitLifecycleState
  trackingNumber?: string | null
}

// Filter out 'no_kit' -- timeline only shows the 6 active states
const TIMELINE_STAGES = KIT_LIFECYCLE_STAGES.filter((s) => s.key !== 'no_kit')

function getStepStatus(
  stepIndex: number,
  currentIndex: number
): 'completed' | 'current' | 'future' {
  if (stepIndex < currentIndex) return 'completed'
  if (stepIndex === currentIndex) return 'current'
  return 'future'
}

export function KitTimeline({ currentState }: KitTimelineProps) {
  const currentIndex = TIMELINE_STAGES.findIndex((s) => s.key === currentState)
  // If state is 'no_kit' or not found, nothing active
  const activeIndex = currentIndex >= 0 ? currentIndex : -1

  return (
    <>
      {/* Desktop horizontal stepper */}
      <div className="hidden md:flex items-start" role="list" aria-label="Kit lifecycle timeline">
        {TIMELINE_STAGES.map((stage, i) => {
          const status = getStepStatus(i, activeIndex)
          return (
            <div key={stage.key} className="flex-1 flex flex-col items-center relative" role="listitem">
              {/* Connecting line (before circle, except first) */}
              {i > 0 && (
                <div
                  className={`absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2 ${
                    status === 'future' ? 'bg-gray-200' : 'bg-brand-primary'
                  }`}
                  style={{ zIndex: 0 }}
                />
              )}
              {/* Circle */}
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                  status === 'completed'
                    ? 'bg-brand-primary text-white'
                    : status === 'current'
                      ? 'bg-brand-primary text-white ring-4 ring-brand-primary/20'
                      : 'bg-gray-200 text-gray-400 border-2 border-gray-300'
                }`}
                data-testid={`timeline-step-${stage.key}`}
                data-status={status}
              >
                {status === 'completed' ? (
                  <Check className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              {/* Label */}
              <span
                className={`mt-2 text-xs text-center leading-tight ${
                  status === 'future' ? 'text-gray-400' : 'text-brand-primary'
                }`}
              >
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Mobile vertical timeline */}
      <div className="md:hidden space-y-0" role="list" aria-label="Kit lifecycle timeline">
        {TIMELINE_STAGES.map((stage, i) => {
          const status = getStepStatus(i, activeIndex)
          const isLast = i === TIMELINE_STAGES.length - 1
          return (
            <div key={stage.key} className="flex gap-3" role="listitem">
              {/* Circle + vertical line */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${
                    status === 'completed'
                      ? 'bg-brand-primary text-white'
                      : status === 'current'
                        ? 'bg-brand-primary text-white ring-4 ring-brand-primary/20'
                        : 'bg-gray-200 text-gray-400 border-2 border-gray-300'
                  }`}
                  data-testid={`timeline-step-mobile-${stage.key}`}
                  data-status={status}
                >
                  {status === 'completed' ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    i + 1
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 min-h-[24px] ${
                      status === 'future' || getStepStatus(i + 1, activeIndex) === 'future'
                        ? 'bg-gray-200'
                        : 'bg-brand-primary'
                    }`}
                  />
                )}
              </div>
              {/* Text */}
              <div className="pb-4">
                <p
                  className={`text-sm font-medium ${
                    status === 'future' ? 'text-gray-400' : 'text-brand-primary'
                  }`}
                >
                  {stage.label}
                </p>
                <p
                  className={`text-xs ${
                    status === 'future' ? 'text-gray-300' : 'text-brand-primary/50'
                  }`}
                >
                  {stage.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
