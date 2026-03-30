import { ProviderPatientDetailClient } from './ProviderPatientDetailClient'

export const metadata = { title: 'Patient Detail — CULTR Health Provider' }

export default async function ProviderPatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ProviderPatientDetailClient patientId={Number(id)} />
}
