'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  Plus,
  Check,
  Filter,
  ChevronDown,
  Package,
  Beaker,
  FlaskConical,
} from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import {
  PRODUCT_CATALOG,
  getCategoriesWithCounts,
  searchProducts,
  getProductsByCategory,
  getCategoryDisplayName,
  type ProductCategory,
  type ShopProduct,
} from '@/lib/config/product-catalog'
import type { PlanTier } from '@/lib/config/plans'

// Category icons
const CATEGORY_ICONS: Record<ProductCategory, typeof Beaker> = {
  growth_factor: FlaskConical,
  repair: Package,
  metabolic: Beaker,
  bioregulator: FlaskConical,
  neuropeptide: Beaker,
  immune: Package,
  hormonal: FlaskConical,
  blend: Package,
  accessory: Package,
  wellness_supplement: Package,
}

type ProductCardProps = {
  product: ShopProduct
}

function ProductCard({ product }: ProductCardProps) {
  const { addItem, isInCart, getItem, updateQuantity } = useCart()
  const inCart = isInCart(product.sku)
  const cartItem = getItem(product.sku)

  const handleAddToCart = () => {
    if (inCart && cartItem) {
      updateQuantity(product.sku, cartItem.quantity + 1)
    } else {
      addItem(product)
    }
  }

  return (
    <div className="bg-white border border-cultr-sage rounded-xl overflow-hidden hover:border-cultr-forest/50 hover:shadow-md transition-all">
      {/* Product Image */}
      {product.imageUrl && (
        <Link href={`/library/shop/${encodeURIComponent(product.sku)}`}>
          <div className="w-full h-48 grad-light overflow-hidden">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          </div>
        </Link>
      )}

      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <Link
              href={`/library/shop/${encodeURIComponent(product.sku)}`}
              className="font-display font-bold text-cultr-text hover:text-cultr-forest transition-colors"
            >
              {product.name}
            </Link>
            <p className="text-xs text-cultr-textMuted mt-1">
              {product.volumeMl > 0 ? `${product.volumeMl}ml vial` : ''}
            </p>
          </div>
          <span className="text-xs px-2 py-1 grad-mint rounded-full text-cultr-forest">
            {getCategoryDisplayName(product.category)}
          </span>
        </div>

        {/* Description preview for wellness supplements */}
        {product.description && (
          <p className="text-xs text-cultr-textMuted mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-cultr-textMuted">
            {product.priceUsd ? (
              <span className="font-bold text-cultr-text">${product.priceUsd.toFixed(2)}</span>
            ) : product.isBlend ? 'Blend' : product.peptideId ? 'Single' : 'Accessory'}
          </p>

          {inCart && cartItem ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-cultr-forest flex items-center gap-1">
                <Check className="w-3 h-3" />
                In cart ({cartItem.quantity})
              </span>
              <button
                onClick={handleAddToCart}
                className="p-2 grad-dark text-white rounded-lg hover:bg-cultr-forest/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              className="flex items-center gap-2 px-3 py-2 grad-dark text-white text-sm rounded-lg hover:bg-cultr-forest/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function ShopClient({ email, tier }: { email: string; tier: PlanTier | null }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all')
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const { getItemCount } = useCart()
  
  const categories = getCategoriesWithCounts()
  const cartCount = getItemCount()

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    let products: ShopProduct[] = []
    
    if (selectedCategory === 'all') {
      products = [...PRODUCT_CATALOG]
    } else {
      products = getProductsByCategory(selectedCategory)
    }
    
    if (searchQuery.trim()) {
      const searchResults = searchProducts(searchQuery)
      products = products.filter(p => searchResults.some(sr => sr.sku === p.sku))
    }
    
    // Sort by name
    return products.sort((a, b) => a.name.localeCompare(b.name))
  }, [searchQuery, selectedCategory])

  return (
    <div className="min-h-screen grad-light">
      {/* Header */}
      <header className="grad-dark text-white py-6 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/library"
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm">Library</span>
              </Link>
            </div>
            
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
          
          <div className="mt-6">
            <h1 className="text-3xl font-display font-bold">Product Shop</h1>
            <p className="text-white/70 mt-2">Browse our complete catalog of peptides and compounds</p>
          </div>
        </div>
      </header>

      {/* Filters & Search */}
      <div className="sticky top-0 z-10 bg-white border-b border-cultr-sage py-4 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cultr-textMuted" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-cultr-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-cultr-forest/20 focus:border-cultr-forest"
            />
          </div>
          
          {/* Category Filter */}
          <div className="relative">
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="flex items-center gap-2 px-4 py-2 border border-cultr-sage rounded-lg hover:border-cultr-forest/50 transition-colors min-w-[180px]"
            >
              <Filter className="w-4 h-4 text-cultr-textMuted" />
              <span className="flex-1 text-left text-sm">
                {selectedCategory === 'all' ? 'All Categories' : getCategoryDisplayName(selectedCategory)}
              </span>
              <ChevronDown className="w-4 h-4 text-cultr-textMuted" />
            </button>
            
            {showCategoryDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-cultr-sage rounded-lg shadow-lg py-1 z-20">
                <button
                  onClick={() => {
                    setSelectedCategory('all')
                    setShowCategoryDropdown(false)
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-cultr-mint transition-colors ${
                    selectedCategory === 'all' ? 'bg-cultr-mint text-cultr-forest' : ''
                  }`}
                >
                  All Categories ({PRODUCT_CATALOG.length})
                </button>
                {categories.map(({ category, count, displayName }) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category)
                      setShowCategoryDropdown(false)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-cultr-mint transition-colors ${
                      selectedCategory === category ? 'bg-cultr-mint text-cultr-forest' : ''
                    }`}
                  >
                    {displayName} ({count})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <p className="text-sm text-cultr-textMuted">
          Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          {searchQuery && ` for "${searchQuery}"`}
          {selectedCategory !== 'all' && ` in ${getCategoryDisplayName(selectedCategory)}`}
        </p>
      </div>

      {/* Product Grid */}
      <main className="max-w-6xl mx-auto px-6 pb-12">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-cultr-textMuted mx-auto mb-4" />
            <h3 className="text-lg font-display font-bold text-cultr-text mb-2">No products found</h3>
            <p className="text-cultr-textMuted">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.sku} product={product} />
            ))}
          </div>
        )}
      </main>

      {/* Floating Cart Button (Mobile) */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 right-6 md:hidden">
          <Link
            href="/library/cart"
            className="flex items-center gap-2 px-4 py-3 grad-dark text-white rounded-full shadow-lg hover:bg-cultr-forest/90 transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="font-bold">{cartCount}</span>
          </Link>
        </div>
      )}

      {/* Disclaimer */}
      <div className="max-w-6xl mx-auto px-6 pb-8">
        <div className="p-4 grad-mint border border-cultr-sage rounded-xl">
          <p className="text-xs text-cultr-textMuted">
            <strong className="text-cultr-text">Note:</strong> All products require a valid prescription.
            Pricing is provided upon quote request. <span className="font-display font-bold tracking-[0.08em]">CULTR</span> Health does not guarantee product availability.
            Contact our team for current inventory and pricing.
          </p>
        </div>
      </div>
    </div>
  )
}
