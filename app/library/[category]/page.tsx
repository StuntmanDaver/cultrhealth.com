import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getLibraryAccess, getMembershipTier, getSession } from '@/lib/auth'
import { getLibraryContent, CATEGORY_META } from '@/lib/library-content'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { MasterIndex } from '@/components/library/MasterIndex'
import { ProductCatalog } from '@/components/library/ProductCatalog'

export async function generateStaticParams() {
  return Object.keys(CATEGORY_META).map((category) => ({
    category,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const meta = CATEGORY_META[category]

  if (!meta) {
    return { title: 'Not Found | CULTR Library' }
  }

  return {
    title: `${meta.name} | CULTR Library`,
    description: meta.description,
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const session = await getSession()

  if (!session) {
    redirect('/library')
  }

  const { category } = await params
  const meta = CATEGORY_META[category]

  if (!meta) {
    notFound()
  }

  const tier = await getMembershipTier(session.customerId, session.email)
  const access = getLibraryAccess(tier)

  // Handle Master Index
  if (category === 'index') {
    return <MasterIndex />
  }

  // Handle Stack Guides
  if (category === 'stack-guides' && !access.stackingGuides) {
    return (
      <div className="min-h-screen grad-white">
        <section className="py-16 px-6 grad-dark text-white">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/library"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Library
            </Link>
            <h1 className="text-4xl font-display font-bold mb-3">
              Stack Guides
            </h1>
            <p className="text-white/80 text-lg">
              Upgrade to unlock goal-based stacking guides.
            </p>
          </div>
        </section>
        <section className="py-12 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="rounded-2xl border border-cultr-sage grad-light p-8">
              <p className="text-cultr-text font-medium mb-4">
                Stack guides with persona-based protocols require a membership. Join <span className="font-display font-bold">CULTR</span> Club (free) to get started.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 text-cultr-forest hover:text-cultr-forestDark transition-colors font-medium"
              >
                View Plans <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    )
  }

  // Handle Product Catalog
  if (category === 'products') {
    if (!access.advancedProtocols) {
      return (
        <div className="min-h-screen grad-white">
          <section className="py-16 px-6 grad-dark text-white">
            <div className="max-w-4xl mx-auto">
              <Link
                href="/library"
                className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Library
              </Link>
              <h1 className="text-4xl font-display font-bold mb-3">
                Full Product Catalog
              </h1>
              <p className="text-white/80 text-lg">
                Upgrade to Core to unlock the full product catalog.
              </p>
            </div>
          </section>
          <section className="py-12 px-6">
            <div className="max-w-3xl mx-auto text-center">
              <div className="rounded-2xl border border-cultr-sage grad-light p-8">
                <p className="text-cultr-text font-medium mb-4">
                  The product catalog is available starting at the Core tier ($199/mo).
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 text-cultr-forest hover:text-cultr-forestDark transition-colors font-medium"
                >
                  View Plans <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      )
    }
    return <ProductCatalog />
  }

  // Default handling for other categories (Markdown content)
  const content = await getLibraryContent(category, access)

  if (!content) {
    notFound()
  }

  return (
    <div className="min-h-screen grad-white">
      {/* Header */}
      <section className="py-16 px-6 grad-dark text-white">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Library
          </Link>
          <h1 className="text-4xl font-display font-bold mb-3">
            {meta.name}
          </h1>
          <p className="text-white/80 text-lg">
            {meta.description}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="library-content prose prose-lg max-w-none">
            <div
              dangerouslySetInnerHTML={{ __html: content }}
              className="
                [&_h1]:text-3xl [&_h1]:font-display [&_h1]:text-cultr-forest [&_h1]:mb-6 [&_h1]:mt-12 first:[&_h1]:mt-0
                [&_h2]:text-2xl [&_h2]:font-display [&_h2]:text-cultr-forest [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:border-b [&_h2]:border-cultr-sage [&_h2]:pb-2
                [&_h3]:text-xl [&_h3]:font-display [&_h3]:text-cultr-forestLight [&_h3]:mb-3 [&_h3]:mt-8
                [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-cultr-text [&_h4]:mb-2 [&_h4]:mt-6
                [&_h5]:text-base [&_h5]:font-semibold [&_h5]:text-cultr-text [&_h5]:mb-2 [&_h5]:mt-4
                [&_p]:text-cultr-textMuted [&_p]:leading-relaxed [&_p]:mb-4
                [&_ul]:mb-4 [&_ul]:space-y-1 [&_ul]:list-disc [&_ul]:pl-5
                [&_li]:text-cultr-textMuted
                [&_ol]:mb-4 [&_ol]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5
                [&_table]:w-full [&_table]:border-collapse [&_table]:mb-6 [&_table]:text-sm
                [&_thead]:grad-mint
                [&_th]:text-left [&_th]:p-3 [&_th]:text-cultr-forest [&_th]:font-medium [&_th]:border-b [&_th]:border-cultr-sage
                [&_td]:p-3 [&_td]:border-b [&_td]:border-cultr-sage/50 [&_td]:text-cultr-textMuted
                [&_tr:hover]:grad-light
                [&_blockquote]:border-l-4 [&_blockquote]:border-cultr-forest [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-cultr-textMuted [&_blockquote]:my-6
                [&_hr]:border-cultr-sage [&_hr]:my-12
                [&_strong]:text-cultr-text [&_strong]:font-semibold
                [&_code]:bg-cultr-mint [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-cultr-forest [&_code]:text-sm
                [&_pre]:bg-cultr-offwhite [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:mb-6 [&_pre]:border [&_pre]:border-cultr-sage
                [&_a]:text-cultr-forest [&_a]:underline [&_a]:hover:text-cultr-forestDark
              "
            />
          </div>

          {/* Disclaimer */}
          <div className="mt-16 p-6 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 font-medium mb-2">Research Use Only</p>
                <p className="text-amber-700/80 text-sm leading-relaxed">
                  The information on this page is for educational and research purposes only.
                  These compounds are not FDA-approved for human use unless otherwise noted.
                  Always consult with a qualified healthcare provider before considering any peptide therapy.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-12 pt-8 border-t border-cultr-sage">
            <Link
              href="/library"
              className="inline-flex items-center gap-2 text-cultr-forest hover:text-cultr-forestDark transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to All Categories
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
