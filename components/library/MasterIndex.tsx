'use client'

import { useState } from 'react'
import { Search, ExternalLink } from 'lucide-react'
import { getAllProducts, getCategoriesWithCounts, getCategoryDisplayName, ShopProduct, ProductCategory } from '@/lib/config/product-catalog'
import Link from 'next/link'

export function MasterIndex() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all')

  const products = getAllProducts()
  const categories = getCategoriesWithCounts()

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Group by category for the list view
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const cat = product.category
    if (!acc[cat]) {
      acc[cat] = []
    }
    acc[cat].push(product)
    return acc
  }, {} as Record<ProductCategory, ShopProduct[]>)

  // Sort categories by predefined order or name
  const sortedCategories = Object.keys(groupedProducts) as ProductCategory[]

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Header */}
      <div className="bg-cultr-forest text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/library" className="text-white/60 hover:text-white transition-colors mb-4 inline-flex items-center text-sm">
            ← Back to Library
          </Link>
          <h1 className="text-4xl font-display font-bold mb-4">Master Index</h1>
          <p className="text-xl text-white/80 max-w-2xl">
            Complete catalog of 80+ products with quick lookup by category and use case.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-6 -mt-8">
        <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cultr-mint transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all' 
                  ? 'bg-cultr-forest text-white' 
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.category}
                onClick={() => setSelectedCategory(cat.category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.category
                    ? 'bg-cultr-forest text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat.displayName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 mt-12 space-y-12">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-stone-500">
            No products found matching your search.
          </div>
        ) : (
          sortedCategories.map(category => (
            <div key={category} className="scroll-mt-24" id={category}>
              <h2 className="text-2xl font-display font-bold text-cultr-forest mb-6 flex items-center gap-3">
                <span className="w-2 h-8 bg-cultr-mint rounded-full"></span>
                {getCategoryDisplayName(category)}
                <span className="text-sm font-sans font-normal text-stone-500 ml-2">
                  ({groupedProducts[category].length})
                </span>
              </h2>
              
              <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-stone-50 border-b border-stone-200">
                      <tr>
                        <th className="p-4 font-semibold text-stone-700 w-1/3">Product Name</th>
                        <th className="p-4 font-semibold text-stone-700">Dose/Volume</th>
                        <th className="p-4 font-semibold text-stone-700">SKU</th>
                        <th className="p-4 font-semibold text-stone-700 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {groupedProducts[category].map(product => (
                        <tr key={product.sku} className="hover:bg-cultr-offwhite/50 transition-colors group">
                          <td className="p-4 font-medium text-stone-900">{product.name}</td>
                          <td className="p-4 text-stone-600">
                            {product.doseMg > 0 && `${product.doseMg}mg`}
                            {product.doseMg > 0 && product.volumeMl > 0 && ' / '}
                            {product.volumeMl > 0 && `${product.volumeMl}ml`}
                          </td>
                          <td className="p-4 text-stone-400 font-mono text-xs">{product.sku}</td>
                          <td className="p-4 text-right">
                            <Link href={`/library/shop/${product.sku}`} className="opacity-0 group-hover:opacity-100 text-cultr-forest hover:text-cultr-forestDark transition-all">
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
