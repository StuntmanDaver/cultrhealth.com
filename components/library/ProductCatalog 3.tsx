'use client'

import { useState } from 'react'
import { Search, Grid, List, ArrowRight } from 'lucide-react'
import { getAllProducts, getCategoriesWithCounts, getCategoryDisplayName, ShopProduct, ProductCategory } from '@/lib/config/product-catalog'
import Link from 'next/link'

export function ProductCatalog() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const products = getAllProducts()
  const categories = getCategoriesWithCounts()

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="bg-stone-50 min-h-screen pb-20">
      {/* Header */}
      <div className="grad-dark text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/library" className="text-white/60 hover:text-white transition-colors mb-4 inline-flex items-center text-sm">
            ← Back to Library
          </Link>
          <h1 className="text-4xl font-display font-bold mb-4">Product Catalog</h1>
          <p className="text-xl text-white/80 max-w-2xl">
            Detailed protocol cards and information for all 80+ compounds.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-6 -mt-8">
        <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search catalog..."
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cultr-mint transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-lg border border-stone-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-cultr-forest' : 'text-stone-400 hover:text-stone-600'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-cultr-forest' : 'text-stone-400 hover:text-stone-600'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                selectedCategory === 'all' 
                  ? 'bg-cultr-forest text-white border-cultr-forest' 
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
              }`}
            >
              All Products
            </button>
            {categories.map(cat => (
              <button
                key={cat.category}
                onClick={() => setSelectedCategory(cat.category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  selectedCategory === cat.category
                    ? 'bg-cultr-forest text-white border-cultr-forest'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                }`}
              >
                {cat.displayName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid View */}
      <div className="max-w-7xl mx-auto px-6 mt-12">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-stone-500">
            No products found matching your criteria.
          </div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredProducts.map(product => (
              <Link 
                href={`/library/shop/${product.sku}`} 
                key={product.sku}
                className={`bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-xl hover:border-cultr-mint/50 transition-all group ${
                  viewMode === 'list' ? 'flex items-center gap-6 p-4' : 'flex flex-col'
                }`}
              >
                <div className={`${viewMode === 'grid' ? 'p-6 flex-1' : 'flex-1'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <span className="px-3 py-1 bg-stone-100 text-stone-600 text-xs font-semibold rounded-full uppercase tracking-wider">
                      {getCategoryDisplayName(product.category)}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-stone-900 mb-2 group-hover:text-cultr-forest transition-colors">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-sm text-stone-500">
                    {product.doseMg > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-cultr-sage rounded-full"></span>
                        {product.doseMg}mg
                      </span>
                    )}
                    {product.volumeMl > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-cultr-sage rounded-full"></span>
                        {product.volumeMl}ml
                      </span>
                    )}
                  </div>
                </div>

                <div className={`bg-stone-50 border-t border-stone-100 px-6 py-4 flex items-center justify-between group-hover:bg-cultr-mint/5 transition-colors ${
                  viewMode === 'list' ? 'bg-transparent border-0 border-l border-stone-100 pl-6 w-48 justify-end' : ''
                }`}>
                  <span className="text-xs font-mono text-stone-400 truncate max-w-[120px]">
                    {product.sku}
                  </span>
                  <span className="text-cultr-forest text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                    View Details <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
