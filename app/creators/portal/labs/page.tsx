import type { Metadata } from 'next'
import CreatorLabsClient from './CreatorLabsClient'

export const metadata: Metadata = {
  title: 'Labs | CULTR Creator Portal',
  description: 'View your blood test results and biomarker data.',
}

export default function CreatorLabsPage() {
  return <CreatorLabsClient />
}
