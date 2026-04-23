'use client'

import { DosingCalculator } from '@/components/dosing-calculator/DosingCalculator'

export function PublicDosingCalculatorClient({ backHref = '/tools' }: { email?: string; backHref?: string }) {
  return <DosingCalculator variant="public" backHref={backHref} />
}
