'use client'

import { AiDosingEnginePanel } from '@/components/dosing-ai/AiDosingEnginePanel'
import { DosingCalculator } from '@/components/dosing-calculator/DosingCalculator'

export function DosingCalculatorClient({
  email,
  backHref = '/members',
}: {
  email?: string
  backHref?: string
}) {
  return (
    <DosingCalculator
      variant="members"
      email={email}
      backHref={backHref}
      afterHeader={<AiDosingEnginePanel apiEndpoint="/api/member/dosing/recommendation" />}
    />
  )
}
