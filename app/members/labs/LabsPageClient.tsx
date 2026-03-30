'use client'

import { Download } from 'lucide-react'
import LabsClient from '@/app/portal/labs/LabsClient'

const BLOOD_TEST_GUIDES = [
  { label: 'Collection Guide', href: '/docs/blood-test/collection-guide.pdf' },
  { label: 'Instructions', href: '/docs/blood-test/instructions.pdf' },
  { label: 'Ice Pack Preparation', href: '/docs/blood-test/ice-pack-frozen.pdf' },
]

export default function LabsPageClient() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Blood Test Guides */}
      <div className="rounded-2xl border border-brand-primary/10 bg-white p-5 mb-6">
        <h3 className="text-sm font-semibold text-brand-primary mb-3">Blood Test Guides</h3>
        <div className="space-y-2">
          {BLOOD_TEST_GUIDES.map((doc) => (
            <a
              key={doc.href}
              href={doc.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl p-3 hover:bg-brand-primary/[0.03] transition-colors"
            >
              <Download className="w-4 h-4 text-brand-primary/40 flex-shrink-0" />
              <span className="text-sm font-medium text-brand-primary">{doc.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* SiPhox Labs — kit status, registration, results */}
      <LabsClient
        labsEndpoint="/api/member/labs"
        resultsEndpoint="/api/member/results"
      />
    </div>
  )
}
