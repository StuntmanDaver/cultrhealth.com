import { Suspense } from 'react'
import { CreatorDosingCalculatorClient } from './CreatorDosingCalculatorClient'

export const metadata = {
  title: 'CULTR Creator | Dosing Calculator',
  description: 'Calculate peptide reconstitution and dosing with our precision calculator.',
}

export default function CreatorDosingCalculatorPage() {
  return (
    <Suspense fallback={null}>
      <CreatorDosingCalculatorClient />
    </Suspense>
  )
}
