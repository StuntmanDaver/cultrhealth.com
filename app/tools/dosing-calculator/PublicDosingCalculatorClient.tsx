'use client'

import { DosingCalculator } from '@/components/dosing-calculator/DosingCalculator'

export function PublicDosingCalculatorClient({
  backHref = '/tools',
  initialPresetId,
}: {
  email?: string
  backHref?: string
  initialPresetId?: string
}) {
  return <DosingCalculator variant="public" backHref={backHref} initialPresetId={initialPresetId} />
}
