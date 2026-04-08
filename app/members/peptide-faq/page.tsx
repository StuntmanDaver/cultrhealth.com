import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Peptide FAQ — CULTR Health',
  description: 'Comprehensive peptide FAQ covering dosing, administration, reconstitution, safety, stacking, and more. Based on analysis of 5,774+ community discussions.',
}

export default function PeptideFAQPage() {
  redirect('/members')
}
