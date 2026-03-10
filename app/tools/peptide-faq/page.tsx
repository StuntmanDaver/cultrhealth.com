import { PeptideFAQContent } from '@/app/library/peptide-faq/PeptideFAQContent'

export const metadata = {
  title: 'Peptide FAQ | CULTR Health',
  description: 'Comprehensive answers to the most common questions about peptide therapy, dosing, and protocols.',
}

export default function PublicPeptideFAQPage() {
  return <PeptideFAQContent tier={null} backHref="/tools" />
}
