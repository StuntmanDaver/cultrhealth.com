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
  
  return {
    title: `${product.name} | CULTR Health Shop`,
    description: `View details and add ${product.name} to your quote request.`,
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

  return (
    <ProductDetailClient
      product={product}
      peptideDetails={peptideDetails}
      email={session.email}
    />
  )
}
