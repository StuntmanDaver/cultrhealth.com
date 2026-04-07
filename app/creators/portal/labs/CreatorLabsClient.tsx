'use client'

import LabsClient from '@/app/portal/labs/LabsClient'

export default function CreatorLabsClient() {
  return (
    <LabsClient
      labsEndpoint="/api/creators/labs"
      resultsEndpoint="/api/creators/results"
    />
  )
}
