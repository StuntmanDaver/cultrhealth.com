import { redirect, notFound } from 'next/navigation'
import { getSession, getMembershipTier, hasFeatureAccess } from '@/lib/auth'
import { ProductDetailClient } from './ProductDetailClient'
import { getProductBySku, PRODUCT_CATALOG } from '@/lib/config/product-catalog'
import { getPeptideById } from '@/lib/protocol-templates'

// Generate static params for all products
export async function generateStaticParams() {
  return PRODUCT_CATALOG.map((product) => ({
    sku: encodeURIComponent(product.sku),
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params
  const product = getProductBySku(decodeURIComponent(sku))
  
  if (!product) {
    return { title: 'Product Not Found | CULTR Health' }
  }
  
  const title = `${product.name} — CULTR Health Shop`
  const description = `${product.name} available through CULTR Health membership. Compounded peptide therapy with provider-supervised protocols.`

  return {
    title,
    description,
    alternates: {
      canonical: `/library/shop/${encodeURIComponent(product.sku)}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'CULTR Health',
    },
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ sku: string }> }) {
  const session = await getSession()

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/library?error=login_required')
  }

  const tier = await getMembershipTier(session.customerId)

  // Check if user has access to shop (catalyst+ tier)
  if (!hasFeatureAccess(tier, 'dosingCalculators')) {
    redirect('/pricing?upgrade=catalyst')
  }

  const { sku } = await params
  const product = getProductBySku(decodeURIComponent(sku))
  
  if (!product) {
    notFound()
  }
  
  // Get peptide details from catalog if available
  const peptideDetails = product.peptideId ? getPeptideById(product.peptideId) : null

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} — compounded peptide available through CULTR Health membership.`,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: 'CULTR Health',
    },
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'CULTR Health',
      },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ProductDetailClient
        product={product}
        peptideDetails={peptideDetails}
        email={session.email}
      />
    </>
  )
}
