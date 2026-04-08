import type { Metadata } from 'next'
import DocumentsClient from './DocumentsClient'

export const metadata: Metadata = {
  title: 'Documents | CULTR Health',
  description: 'View and upload your medical documents.',
}

export default function PortalDocumentsPage() {
  return <DocumentsClient />
}
