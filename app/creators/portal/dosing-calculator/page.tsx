import { Suspense } from 'react'
import { CreatorDosingCalculatorClient } from './CreatorDosingCalculatorClient'

export const metadata = {
  title: 'CULTR Creator | Dosing Calculator',
  description: 'Calculate peptide reconstitution and dosing with our precision calculator.',
  // Creator-portal variant — defer SEO authority to the public /tools/dosing-calculator page.
  robots: { index: false, follow: false, nocache: true },
}

export default function CreatorDosingCalculatorPage() {
  return (
    <Suspense fallback={null}>
      <CreatorDosingCalculatorClient />
    </Suspense>
  )
}
