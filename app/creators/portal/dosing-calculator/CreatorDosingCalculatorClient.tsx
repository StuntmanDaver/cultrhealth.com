'use client'

import { AiDosingEnginePanel } from '@/components/dosing-ai/AiDosingEnginePanel'
import { DosingCalculator } from '@/components/dosing-calculator/DosingCalculator'

export function CreatorDosingCalculatorClient({
  email,
  backHref = '/creators/portal/dashboard',
}: {
  email?: string
  backHref?: string
}) {
  return (
    <DosingCalculator
      variant="creators"
      email={email}
      backHref={backHref}
      afterHeader={<AiDosingEnginePanel apiEndpoint="/api/creators/dosing/recommendation" />}
    />
  )
}
