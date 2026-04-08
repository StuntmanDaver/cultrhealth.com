import { PublicDosingCalculatorClient } from './PublicDosingCalculatorClient'

export const metadata = {
  title: 'Peptide Dosing Calculator | CULTR Health',
  description: 'Calculate peptide reconstitution and dosing amounts for any vial size and desired dose.',
}

export default function PublicDosingCalculatorPage() {
  return <PublicDosingCalculatorClient backHref="/tools" />
}
