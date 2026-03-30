import { ProviderConsultationClient } from './ProviderConsultationClient'

export default async function ProviderConsultationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ProviderConsultationClient consultationId={Number(id)} />
}
