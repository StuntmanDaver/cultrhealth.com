'use client'

import {
  BookOpen,
  FileText,
  Video,
  Download,
  ExternalLink,
  Shield,
  Palette,
  MessageSquare,
} from 'lucide-react'

const RESOURCE_SECTIONS = [
  {
    title: 'Content Templates',
    icon: MessageSquare,
    items: [
      { title: 'Short-Form Hooks', desc: '15-second hook scripts for Reels/TikTok', type: 'doc' },
      { title: 'Long-Form Scripts', desc: 'YouTube/podcast talking points', type: 'doc' },
      { title: 'Email Templates', desc: 'Newsletter copy for your audience', type: 'doc' },
      { title: 'Caption Templates', desc: 'Ready-to-post social captions', type: 'doc' },
    ],
  },
  {
    title: 'Brand Kit',
    icon: Palette,
    items: [
      { title: 'Logo Pack', desc: 'CULTR logos in PNG, SVG, and dark/light', type: 'download' },
      { title: 'Brand Colors', desc: 'Forest #2A4542, Sage #B7E4C7, Mint #D8F3DC', type: 'info' },
      { title: 'Photography', desc: 'Approved product and lifestyle photos', type: 'download' },
      { title: 'Brand Guidelines', desc: 'Tone, voice, and usage rules', type: 'doc' },
    ],
  },
  {
    title: 'Compliance',
    icon: Shield,
    items: [
      { title: 'FTC Disclosure Guide', desc: 'Required disclosures for affiliate content', type: 'doc' },
      { title: 'Approved Claims', desc: 'What you can and cannot say about CULTR products', type: 'doc' },
      { title: 'Health Claims Policy', desc: 'FDA-compliant language for health/wellness', type: 'doc' },
      { title: 'Terms of Service', desc: 'Creator affiliate program terms', type: 'doc' },
    ],
  },
  {
    title: 'Product Education',
    icon: BookOpen,
    items: [
      { title: 'GLP-1 Overview', desc: 'How GLP-1 medications work, benefits, and eligibility', type: 'doc' },
      { title: 'Peptide Protocols', desc: 'Introduction to peptide therapy and stacking', type: 'doc' },
      { title: 'Membership Tiers', desc: 'Core, Catalyst+, and Concierge explained', type: 'doc' },
      { title: 'FAQ Cheat Sheet', desc: 'Common questions your audience will ask', type: 'doc' },
    ],
  },
]

function ResourceCard({ title, desc, type }: { title: string; desc: string; type: string }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-white border border-stone-200 rounded-xl hover:border-cultr-forest transition-colors cursor-pointer">
      <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
        {type === 'download' ? (
          <Download className="w-4 h-4 text-cultr-forest" />
        ) : type === 'video' ? (
          <Video className="w-4 h-4 text-cultr-forest" />
        ) : (
          <FileText className="w-4 h-4 text-cultr-forest" />
        )}
      </div>
      <div className="flex-1">
        <p className="font-medium text-sm text-cultr-forest">{title}</p>
        <p className="text-xs text-cultr-textMuted mt-0.5">{desc}</p>
      </div>
      <ExternalLink className="w-4 h-4 text-stone-300 flex-shrink-0 mt-1" />
    </div>
  )
}

export default function ResourcesPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-cultr-forest">Resources</h1>
        <p className="text-sm text-cultr-textMuted mt-1">
          Everything you need to create content and promote CULTR Health.
        </p>
      </div>

      {RESOURCE_SECTIONS.map((section) => (
        <section key={section.title}>
          <h2 className="text-lg font-display font-bold text-cultr-forest flex items-center gap-2 mb-4">
            <section.icon className="w-5 h-5" /> {section.title}
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {section.items.map((item) => (
              <ResourceCard key={item.title} {...item} />
            ))}
          </div>
        </section>
      ))}

      <div className="bg-cultr-mint border border-cultr-sage rounded-2xl p-6 text-center">
        <p className="font-display font-bold text-cultr-forest mb-2">
          Need custom content?
        </p>
        <p className="text-sm text-cultr-textMuted mb-4">
          Reach out to your creator manager for custom assets, co-branded content, or specific product info.
        </p>
        <a
          href="mailto:creators@cultrhealth.com"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-cultr-forest text-white rounded-lg text-sm font-medium hover:bg-cultr-forestDark transition-colors"
        >
          Contact Creator Support
        </a>
      </div>
    </div>
  )
}
