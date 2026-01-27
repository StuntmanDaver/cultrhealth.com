'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  Clock,
  Syringe,
  BookOpen,
  FlaskConical,
  Info,
} from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { getCategoryDisplayName, getProductsByPeptideId, type ShopProduct } from '@/lib/config/product-catalog'
import type { CatalogPeptide } from '@/lib/protocol-templates'

type ProductDetailClientProps = {
  product: ShopProduct
  peptideDetails: CatalogPeptide | null
  email: string
}

export function ProductDetailClient({ product, peptideDetails, email }: ProductDetailClientProps) {
  const { addItem, isInCart, getItem, updateQuantity, getItemCount } = useCart()
  const [quantity, setQuantity] = useState(1)
  
  const inCart = isInCart(product.sku)
  const cartItem = getItem(product.sku)
  const cartCount = getItemCount()
  
  // Get related products (other sizes of same peptide)
  const relatedProducts = product.peptideId
    ? getProductsByPeptideId(product.peptideId).filter(p => p.sku !== product.sku)
    : []

  const handleAddToCart = () => {
    if (inCart && cartItem) {
      updateQuantity(product.sku, cartItem.quantity + quantity)
    } else {
      addItem(product, quantity)
    }
    setQuantity(1)
  }

  const incrementQuantity = () => setQuantity(q => q + 1)
  const decrementQuantity = () => setQuantity(q => Math.max(1, q - 1))

  // Risk tier badge color
  const getRiskBadgeClass = (riskTier: string) => {
    switch (riskTier) {
      case 'low':
        return 'bg-green-100 text-green-800'
      case 'low-moderate':
        return 'bg-yellow-100 text-yellow-800'
      case 'moderate':
        return 'bg-orange-100 text-orange-800'
      case 'moderate-high':
      case 'high':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-cultr-offwhite">
      {/* Header */}
      <header className="bg-cultr-forest text-white py-6 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <Link
              href="/library/shop"
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Back to Shop</span>
            </Link>
            
            <Link
              href="/library/cart"
              className="relative flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="text-sm">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-cultr-sage text-cultr-forest text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Product Header */}
        <div className="bg-white rounded-2xl border border-cultr-sage p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <span className="inline-block text-xs px-2 py-1 bg-cultr-mint rounded-full text-cultr-forest mb-2">
                {getCategoryDisplayName(product.category)}
              </span>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-cultr-text">
                {product.name}
              </h1>
              <p className="text-cultr-textMuted mt-1">
                SKU: {product.sku}
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              {product.volumeMl > 0 && (
                <div className="flex items-center gap-2 text-cultr-textMuted">
                  <FlaskConical className="w-4 h-4" />
                  <span>{product.volumeMl}ml vial</span>
                </div>
              )}
              {product.doseMg > 0 && (
                <div className="flex items-center gap-2 text-cultr-textMuted">
                  <Syringe className="w-4 h-4" />
                  <span>{product.doseMg}mg per vial</span>
                </div>
              )}
            </div>
          </div>

          {/* Add to Cart Section */}
          <div className="flex flex-col sm:flex-row gap-4 items-center p-4 bg-cultr-offwhite rounded-xl">
            <div className="flex items-center gap-3">
              <button
                onClick={decrementQuantity}
                className="w-10 h-10 flex items-center justify-center border border-cultr-sage rounded-lg hover:bg-cultr-mint transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-bold text-lg">{quantity}</span>
              <button
                onClick={incrementQuantity}
                className="w-10 h-10 flex items-center justify-center border border-cultr-sage rounded-lg hover:bg-cultr-mint transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={handleAddToCart}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-cultr-forest text-white font-bold rounded-lg hover:bg-cultr-forest/90 transition-colors"
            >
              {inCart ? (
                <>
                  <Check className="w-5 h-5" />
                  Add More to Cart
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add to Cart
                </>
              )}
            </button>
            
            {inCart && cartItem && (
              <span className="text-sm text-cultr-forest">
                {cartItem.quantity} in cart
              </span>
            )}
          </div>
        </div>

        {/* Peptide Details */}
        {peptideDetails && (
          <div className="bg-white rounded-2xl border border-cultr-sage p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-cultr-forest" />
              <h2 className="text-lg font-display font-bold text-cultr-text">
                Peptide Information
              </h2>
            </div>

            {/* Evidence & Risk Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-cultr-mint rounded-full text-sm text-cultr-forest">
                Evidence: Grade {peptideDetails.evidenceGrade}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm ${getRiskBadgeClass(peptideDetails.riskTier)}`}>
                Risk: {peptideDetails.riskTier.replace('-', ' ')}
              </span>
            </div>

            {/* Mechanism */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-cultr-text mb-1">Mechanism</h3>
              <p className="text-cultr-textMuted text-sm">{peptideDetails.mechanism}</p>
            </div>

            {/* Dosing Info */}
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-cultr-text mb-1">Dosage Range</h3>
                <p className="text-cultr-textMuted text-sm">{peptideDetails.dosageRange}</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-cultr-text mb-1">Timing</h3>
                <p className="text-cultr-textMuted text-sm">{peptideDetails.timing}</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-cultr-text mb-1">Route</h3>
                <p className="text-cultr-textMuted text-sm">{peptideDetails.route}</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-cultr-text mb-1">Duration</h3>
                <p className="text-cultr-textMuted text-sm">{peptideDetails.duration}</p>
              </div>
            </div>

            {/* Best For */}
            {peptideDetails.bestFor.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-bold text-cultr-text mb-2">Best For</h3>
                <div className="flex flex-wrap gap-2">
                  {peptideDetails.bestFor.map((use, i) => (
                    <span key={i} className="px-2 py-1 bg-cultr-offwhite border border-cultr-sage rounded text-xs text-cultr-textMuted">
                      {use}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contraindications */}
            {peptideDetails.contraindications.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <h3 className="text-sm font-bold text-red-800">Contraindications</h3>
                </div>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {peptideDetails.contraindications.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notes */}
            {peptideDetails.notes && (
              <div className="mt-4 p-3 bg-cultr-mint border border-cultr-sage rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-cultr-forest mt-0.5" />
                  <p className="text-sm text-cultr-textMuted">{peptideDetails.notes}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Blend Components */}
        {product.isBlend && product.blendComponents && (
          <div className="bg-white rounded-2xl border border-cultr-sage p-6 mb-6">
            <h2 className="text-lg font-display font-bold text-cultr-text mb-4">
              Blend Components
            </h2>
            <div className="flex flex-wrap gap-2">
              {product.blendComponents.map((componentId) => (
                <span
                  key={componentId}
                  className="px-3 py-2 bg-cultr-offwhite border border-cultr-sage rounded-lg text-sm"
                >
                  {componentId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Related Products (Other Sizes) */}
        {relatedProducts.length > 0 && (
          <div className="bg-white rounded-2xl border border-cultr-sage p-6 mb-6">
            <h2 className="text-lg font-display font-bold text-cultr-text mb-4">
              Other Sizes Available
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.sku}
                  href={`/library/shop/${encodeURIComponent(relatedProduct.sku)}`}
                  className="flex items-center justify-between p-3 bg-cultr-offwhite border border-cultr-sage rounded-lg hover:border-cultr-forest/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-cultr-text">{relatedProduct.doseMg}mg</p>
                    <p className="text-xs text-cultr-textMuted">{relatedProduct.volumeMl}ml vial</p>
                  </div>
                  <span className="text-xs text-cultr-forest">View</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="p-4 bg-cultr-mint border border-cultr-sage rounded-xl">
          <p className="text-xs text-cultr-textMuted">
            <strong className="text-cultr-text">Note:</strong> All products require a valid prescription from a licensed provider.
            Pricing is provided upon quote request. Product availability may vary.
            This information is for educational purposes only and is not medical advice.
          </p>
        </div>
      </main>
    </div>
  )
}
