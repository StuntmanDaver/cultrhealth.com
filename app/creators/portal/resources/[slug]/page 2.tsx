'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import type { ResourceEntry } from '../_components/helpers'
import { messagingPlaybook } from '../_data/messaging-playbook'
import { contentTemplates } from '../_data/content-templates'
import { contentStrategy } from '../_data/content-strategy'
import { contentCalendar } from '../_data/content-calendar'
import { salesFunnel } from '../_data/sales-funnel'
import { offerPrograms } from '../_data/offer-programs'
import { productEducation } from '../_data/product-education'
import { compliance } from '../_data/compliance'
import { brandKit } from '../_data/brand-kit'

const RESOURCES: Record<string, ResourceEntry> = {
  ...messagingPlaybook,
  ...contentTemplates,
  ...contentStrategy,
  ...contentCalendar,
  ...salesFunnel,
  ...offerPrograms,
  ...productEducation,
  ...compliance,
  ...brandKit,
}

export default function ResourceDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const resource = RESOURCES[slug]

  if (!resource) {
    return (
      <div className="max-w-3xl">
        <Link
          href="/creators/portal/resources"
          className="inline-flex items-center gap-1.5 text-sm text-cultr-textMuted hover:text-cultr-forest transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Resources
        </Link>
        <h1 className="text-2xl font-display font-bold text-cultr-forest mb-4">Resource not found</h1>
        <p className="text-sm text-cultr-textMuted">This resource doesn&apos;t exist or has been moved.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <Link
        href="/creators/portal/resources"
        className="inline-flex items-center gap-1.5 text-sm text-cultr-textMuted hover:text-cultr-forest transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Resources
      </Link>

      <div className="mb-2">
        <span className="text-xs font-display font-bold text-cultr-sage tracking-wider uppercase">{resource.category}</span>
      </div>
      <h1 className="text-2xl font-display font-bold text-cultr-forest mb-6">{resource.title}</h1>

      <div className="prose-cultr">
        {resource.content()}
      </div>
    </div>
  )
}
