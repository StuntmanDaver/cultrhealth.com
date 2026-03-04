'use client'

import Link from 'next/link'
import {
  BookOpen,
  FileText,
  Video,
  Download,
  ExternalLink,
  Shield,
  Palette,
  MessageSquare,
  Target,
  Layers,
  CalendarDays,
  Filter,
  Package,
} from 'lucide-react'
import { brandify } from '@/lib/utils'

const RESOURCE_SECTIONS = [
  {
    title: 'Messaging Playbook',
    subtitle: 'What do I say?',
    icon: Target,
    items: [
      { title: 'Outcomes-First Claims', desc: '10 compliance-safe marketing claims ready to use', type: 'doc', slug: 'compliance-safe-claims' },
      { title: 'Messaging Matrix', desc: 'Map outcomes to audiences and proof mechanisms', type: 'doc', slug: 'messaging-matrix' },
      { title: 'Audience Segments', desc: '7 target profiles with pains, channels, and offers', type: 'doc', slug: 'audience-segments' },
      { title: 'Objection Handling', desc: 'Skeptic triggers and how to address them by persona', type: 'doc', slug: 'objection-handling' },
    ],
  },
  {
    title: 'Content Templates',
    subtitle: 'Ready-to-use copy',
    icon: MessageSquare,
    items: [
      { title: 'Short-Form Hooks', desc: '15-second hook scripts for Reels/TikTok', type: 'doc', slug: 'short-form-hooks' },
      { title: 'Long-Form Scripts', desc: 'YouTube/podcast talking points', type: 'doc', slug: 'long-form-scripts' },
      { title: 'Email Templates', desc: 'Newsletter copy for your audience', type: 'doc', slug: 'email-templates' },
      { title: 'Caption Templates', desc: 'Ready-to-post social captions', type: 'doc', slug: 'caption-templates' },
    ],
  },
  {
    title: 'Content Pillars',
    subtitle: 'What topics do I cover?',
    icon: Layers,
    items: [
      { title: 'Metabolic & Weight Loss', desc: 'Topics, hooks, and myth-busts for weight/GLP-1 content', type: 'doc', slug: 'pillar-metabolic-weight' },
      { title: 'Recovery & Peptides', desc: 'Topics, hooks, and myth-busts for recovery content', type: 'doc', slug: 'pillar-recovery-peptides' },
      { title: 'Longevity & Biomarkers', desc: 'Topics and hooks for healthspan + data-driven content', type: 'doc', slug: 'pillar-longevity-biomarkers' },
      { title: 'Oral Health & Cognitive', desc: 'Topics and hooks for oral care + focus/energy content', type: 'doc', slug: 'pillar-microbiome-cognitive' },
    ],
  },
  {
    title: 'Content Calendar',
    subtitle: 'When do I post?',
    icon: CalendarDays,
    items: [
      { title: '30-Day Content Calendar', desc: 'Daily short-form prompts with topic and pillar reference', type: 'doc', slug: '30-day-calendar' },
      { title: 'Weekly Long-Form Plan', desc: '8 long-form topics across 4 weeks', type: 'doc', slug: 'weekly-longform-plan' },
      { title: 'Repurposing Workflow', desc: 'Turn one piece of content into 5+ formats', type: 'doc', slug: 'repurposing-workflow' },
    ],
  },
  {
    title: 'Sales Funnel',
    subtitle: 'How do I convert?',
    icon: Filter,
    items: [
      { title: 'Lead Magnet Ideas', desc: '5 lead magnets to capture audience interest', type: 'doc', slug: 'lead-magnets' },
      { title: 'Landing Page Blueprint', desc: 'Section-by-section outline for a high-converting page', type: 'doc', slug: 'landing-page-blueprint' },
      { title: '14-Day Nurture Sequence', desc: 'Day-by-day email/SMS follow-up with copy', type: 'doc', slug: 'nurture-sequence' },
      { title: 'DM & Booking Scripts', desc: 'Comment replies, DM flows, and conversion scripts', type: 'doc', slug: 'dm-conversion-scripts' },
    ],
  },
  {
    title: 'Offer Programs',
    subtitle: 'What am I selling?',
    icon: Package,
    items: [
      { title: 'Core Programs', desc: 'Metabolic Reset, Recovery & Resilience, Longevity Lab Loop', type: 'doc', slug: 'core-programs' },
      { title: 'Program Add-Ons', desc: 'Oral Microbiome, Biological Age Challenge, Stack Audit', type: 'doc', slug: 'program-add-ons' },
      { title: 'Offer Matching Guide', desc: 'Which offer to pitch based on audience segment', type: 'doc', slug: 'offer-matching-guide' },
    ],
  },
  {
    title: 'Product Education',
    subtitle: 'Know the product',
    icon: BookOpen,
    items: [
      { title: 'GLP-1 Overview', desc: 'How GLP-1 medications work, benefits, and eligibility', type: 'doc', slug: 'glp-1-overview' },
      { title: 'Peptide Protocols', desc: 'Introduction to peptide therapy and stacking', type: 'doc', slug: 'peptide-protocols' },
      { title: 'Membership Tiers', desc: 'Core, Catalyst+, and Curated explained', type: 'doc', slug: 'membership-tiers' },
      { title: 'FAQ Cheat Sheet', desc: 'Common questions your audience will ask', type: 'doc', slug: 'faq-cheat-sheet' },
    ],
  },
  {
    title: 'Compliance',
    subtitle: 'Stay safe',
    icon: Shield,
    items: [
      { title: 'FTC Disclosure Guide', desc: 'Required disclosures for affiliate content', type: 'doc', slug: 'ftc-disclosure-guide' },
      { title: 'Approved Claims', desc: 'What you can and cannot say — with traffic light system', type: 'doc', slug: 'approved-claims' },
      { title: 'Health Claims Policy', desc: 'FDA-compliant language + trending compound templates', type: 'doc', slug: 'health-claims-policy' },
      { title: 'Terms of Service', desc: 'Creator affiliate program terms', type: 'doc', slug: 'terms-of-service' },
    ],
  },
  {
    title: 'Brand Kit',
    subtitle: 'Look the part',
    icon: Palette,
    items: [
      { title: 'Logo Pack', desc: 'CULTR logos in PNG, SVG, and dark/light', type: 'download', slug: 'logo-pack' },
      { title: 'Brand Colors', desc: 'Forest #2B4542, Mint #D7F3DC, Ivory #FCFBF7', type: 'info', slug: 'brand-colors' },
      { title: 'Photography', desc: 'Approved product and lifestyle photos', type: 'download', slug: 'photography' },
      { title: 'Brand Guidelines', desc: 'Tone, voice, and usage rules', type: 'doc', slug: 'brand-guidelines' },
    ],
  },
]

function ResourceCard({ title, desc, type, slug }: { title: string; desc: string; type: string; slug: string }) {
  return (
    <Link
      href={`/creators/portal/resources/${slug}`}
      className="flex items-start gap-3 p-4 bg-white border border-stone-200 rounded-xl hover:border-cultr-forest transition-colors"
    >
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
        <p className="text-xs text-cultr-textMuted mt-0.5">{brandify(desc)}</p>
      </div>
      <ExternalLink className="w-4 h-4 text-stone-300 flex-shrink-0 mt-1" />
    </Link>
  )
}

export default function ResourcesPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-cultr-forest">Resources</h1>
        <p className="text-sm text-cultr-textMuted mt-1">
          Your complete creator toolkit &mdash; messaging, content, sales funnels, compliance, and brand assets.
        </p>
      </div>

      {RESOURCE_SECTIONS.map((section) => (
        <section key={section.title}>
          <h2 className="text-lg font-display font-bold text-cultr-forest flex items-center gap-2 mb-1">
            <section.icon className="w-5 h-5" /> {section.title}
          </h2>
          {section.subtitle && (
            <p className="text-xs text-cultr-textMuted mb-4 ml-7">{section.subtitle}</p>
          )}
          <div className="grid md:grid-cols-2 gap-3">
            {section.items.map((item) => (
              <ResourceCard key={item.slug} {...item} />
            ))}
          </div>
        </section>
      ))}

      <div className="grad-mint border border-cultr-sage rounded-2xl p-6 text-center">
        <p className="font-display font-bold text-cultr-forest mb-2">
          Need custom content?
        </p>
        <p className="text-sm text-cultr-textMuted mb-4">
          Reach out to your creator manager for custom assets, co-branded content, or specific product info.
        </p>
        <a
          href="mailto:creators@cultrhealth.com"
          className="inline-flex items-center gap-2 px-5 py-2.5 grad-dark text-white rounded-lg text-sm font-medium hover:bg-cultr-forestDark transition-colors"
        >
          Contact Creator Support
        </a>
      </div>
    </div>
  )
}
