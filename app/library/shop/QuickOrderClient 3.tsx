'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  Minus,
  Plus,
  ChevronDown,
  ChevronUp,
  Package,
  Trash2,
  X,
  Flag,
} from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import {
  PRODUCT_CATALOG,
  getCategoriesWithCounts,
  getCategoryDisplayName,
  getUniqueVialTypes,
  type ProductCategory,
  type ShopProduct,
  type StockStatus,
} from '@/lib/config/product-catalog'
import {
  VITAMIN_CATALOG,
  VITAMIN_CATEGORY_STYLES,
  getVitaminCategoriesWithCounts,
  getVitaminCategoryDisplayName,
  vitaminToShopProduct,
  isSupplementSku,
  type VitaminCategory,
  type VitaminProduct,
} from '@/lib/config/vitamin-catalog'
import type { PlanTier } from '@/lib/config/plans'

// ============================================================
// Shop tab type
// ============================================================
type ShopTab = 'peptides' | 'vitamins'

// ============================================================
// Sort options
// ============================================================
type SortOption = 'az' | 'za' | 'price_low' | 'price_high'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'az', label: 'Name: A-Z' },
  { value: 'za', label: 'Name: Z-A' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
]

// ============================================================
// Stock badge component
// ============================================================
function StockBadge({ status }: { status: StockStatus }) {
  if (status === 'in_stock') {
    return <span className="text-xs font-medium text-green-600">In stock</span>
  }
  if (status === 'low_stock') {
    return <span className="text-xs font-medium text-amber-500">Low Stock</span>
  }
  return <span className="text-xs font-medium text-red-500">Out of Stock</span>
}

// ============================================================
// Dropdown component
// ============================================================
function Dropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 border border-brand-primary/15 rounded-lg grad-white hover:border-brand-primary/30 transition-colors text-sm min-w-[140px]"
      >
        <span className="flex-1 text-left truncate text-brand-primary">
          {selected?.label || label}
        </span>
        <ChevronDown className={`w-4 h-4 text-brand-primary/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-brand-primary/10 rounded-lg shadow-lg py-1 z-30 min-w-full max-h-64 overflow-y-auto">
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-cultr-mint/50 transition-colors ${
                value === opt.value ? 'bg-cultr-mint text-cultr-forest font-medium' : 'text-brand-primary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Quantity selector
// ============================================================
function QuantitySelector({
  quantity,
  onChange,
  disabled,
}: {
  quantity: number
  onChange: (qty: number) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center border border-brand-primary/15 rounded-lg overflow-hidden">
      <button
        onClick={() => onChange(Math.max(1, quantity - 1))}
        disabled={disabled || quantity <= 1}
        className="px-2.5 py-1.5 text-brand-primary/50 hover:bg-cultr-mint/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="px-3 py-1.5 text-sm font-medium text-brand-primary min-w-[36px] text-center border-x border-brand-primary/15">
        {quantity}
      </span>
      <button
        onClick={() => onChange(quantity + 1)}
        disabled={disabled}
        className="px-2.5 py-1.5 text-brand-primary/50 hover:bg-cultr-mint/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ============================================================
// Floating Cart Summary Panel (Desktop sidebar + Mobile sheet)
// ============================================================
function CartSummaryPanel({ mobileExpanded, onToggleMobile }: { mobileExpanded: boolean; onToggleMobile: () => void }) {
  const { items, updateQuantity, removeItem, getCartTotal, getItemCount } = useCart()
  const cartTotal = getCartTotal()
  const cartCount = getItemCount()

  if (cartCount === 0) return null

  return (
    <>
      {/* Desktop: Sticky sidebar */}
      <div className="hidden lg:block w-[300px] flex-shrink-0">
        <div className="sticky top-24">
          <div className="bg-white border border-brand-primary/10 rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-brand-primary px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-brand-cream">
                <ShoppingCart className="w-4 h-4" />
                <span className="font-display font-semibold text-sm">Your Order</span>
              </div>
              <span className="text-xs text-white/70">{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
            </div>

            {/* Items list */}
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
              {items.map(item => (
                <div key={item.sku} className="px-4 py-3 border-b border-brand-primary/5 last:border-b-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-primary truncate">{item.product.name}</p>
                      <p className="text-xs text-cultr-textMuted mt-0.5">
                        {item.product.priceUsd
                          ? `$${item.product.priceUsd.toFixed(2)} each`
                          : 'Staff review'}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.sku)}
                      className="text-brand-primary/30 hover:text-red-500 transition-colors flex-shrink-0 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-brand-primary/15 rounded-md overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                        className="px-1.5 py-0.5 text-brand-primary/50 hover:bg-cultr-mint/50 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 py-0.5 text-xs font-medium text-brand-primary border-x border-brand-primary/15 min-w-[28px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.sku, item.quantity + 1)}
                        className="px-1.5 py-0.5 text-brand-primary/50 hover:bg-cultr-mint/50 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-brand-primary">
                      {item.product.priceUsd
                        ? `$${((item.product.priceUsd) * item.quantity).toFixed(2)}`
                        : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal + Checkout */}
            <div className="border-t border-brand-primary/10 px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-cultr-textMuted">Subtotal</span>
                <span className="text-lg font-display font-bold text-brand-primary">${cartTotal.toFixed(2)}</span>
              </div>
              <Link
                href="/library/cart"
                className="block w-full text-center py-2.5 rounded-full bg-brand-primary text-brand-cream text-sm font-semibold hover:bg-brand-primaryHover transition-colors"
              >
                View Cart &amp; Checkout
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Bottom sheet */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30">
        {/* Expanded sheet */}
        {mobileExpanded && (
          <div className="bg-white border-t border-brand-primary/10 shadow-2xl rounded-t-2xl max-h-[60vh] flex flex-col">
            {/* Handle + Header */}
            <button
              onClick={onToggleMobile}
              className="w-full px-4 pt-3 pb-2 flex flex-col items-center"
            >
              <div className="w-10 h-1 rounded-full bg-brand-primary/20 mb-2" />
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary">
                  <ShoppingCart className="w-4 h-4" />
                  <span className="font-display font-semibold text-sm">Your Order ({cartCount})</span>
                </div>
                <ChevronDown className="w-4 h-4 text-brand-primary/40" />
              </div>
            </button>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 pb-2">
              {items.map(item => (
                <div key={item.sku} className="py-2 border-b border-brand-primary/5 last:border-b-0 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-primary truncate">{item.product.name}</p>
                    <p className="text-xs text-cultr-textMuted">
                      {item.product.priceUsd
                        ? `${item.quantity} x $${item.product.priceUsd.toFixed(2)}`
                        : `${item.quantity} × Staff review`}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-brand-primary flex-shrink-0">
                    {item.product.priceUsd
                      ? `$${((item.product.priceUsd) * item.quantity).toFixed(2)}`
                      : '—'}
                  </span>
                  <button
                    onClick={() => removeItem(item.sku)}
                    className="text-brand-primary/30 hover:text-red-500 transition-colors flex-shrink-0 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Subtotal + CTA */}
            <div className="border-t border-brand-primary/10 px-4 py-3 flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-cultr-textMuted">Subtotal</p>
                <p className="text-lg font-display font-bold text-brand-primary">${cartTotal.toFixed(2)}</p>
              </div>
              <Link
                href="/library/cart"
                className="px-5 py-2.5 rounded-full bg-brand-primary text-brand-cream text-sm font-semibold hover:bg-brand-primaryHover transition-colors"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}

        {/* Collapsed bar */}
        {!mobileExpanded && (
          <button
            onClick={onToggleMobile}
            className="w-full bg-brand-primary text-brand-cream px-4 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="text-sm font-semibold">{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">${cartTotal.toFixed(2)}</span>
              <ChevronUp className="w-4 h-4" />
            </div>
          </button>
        )}
      </div>
    </>
  )
}

// ============================================================
// Quick Order Row
// ============================================================
function QuickOrderRow({ product }: { product: ShopProduct }) {
  const { addItem, isInCart, getItem, updateQuantity } = useCart()
  const inCart = isInCart(product.sku)
  const cartItem = getItem(product.sku)
  const [localQty, setLocalQty] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState(product.defaultVariant)
  const isOutOfStock = product.stockStatus === 'out_of_stock'

  const handleAddToCart = () => {
    if (isOutOfStock) return
    if (inCart && cartItem) {
      updateQuantity(product.sku, cartItem.quantity + localQty)
    } else {
      addItem(product, localQty)
    }
    setLocalQty(1)
  }

  return (
    <div className="bg-white border border-brand-primary/10 rounded-xl px-4 py-3 hover:border-brand-primary/25 hover:shadow-sm transition-all">
      {/* Desktop: Horizontal layout */}
      <div className="hidden md:flex items-center gap-3">
        {/* Thumbnail with hover tooltip */}
        <div className="group/tip relative flex-shrink-0">
          <div className="w-12 h-12 rounded-lg bg-brand-cream border border-brand-primary/5 flex items-center justify-center overflow-hidden">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
            ) : (
              <Package className="w-5 h-5 text-brand-primary/20" />
            )}
          </div>
          {product.description && (
            <div className="pointer-events-none invisible opacity-0 group-hover/tip:visible group-hover/tip:opacity-100 transition-all duration-200 absolute left-0 top-full mt-1 z-20 w-64 grad-dark text-white text-xs rounded-lg px-3 py-2 shadow-lg">
              {product.description}
            </div>
          )}
        </div>

        {/* Name + Price info — this column flexes to fill available space */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-sm text-brand-primary leading-tight truncate">{product.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-bold text-sm text-brand-primary">
              ${product.priceUsd?.toFixed(2)}
            </span>
            <StockBadge status={product.stockStatus} />
            {product.bulkPrice && product.bulkMinQty && product.bulkSavePercent && (
              <span className="text-xs text-cultr-textMuted hidden lg:inline">
                ${product.bulkPrice}/{product.bulkMinQty}+ (–{product.bulkSavePercent}%)
              </span>
            )}
          </div>
        </div>

        {/* Variant select */}
        <select
          value={selectedVariant}
          onChange={(e) => setSelectedVariant(e.target.value)}
          className="px-2 py-1.5 border border-brand-primary/15 rounded-lg text-xs grad-white text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary w-[120px] flex-shrink-0"
        >
          {product.variants.map(v => (
            <option key={v.value} value={v.value}>{v.label}</option>
          ))}
        </select>

        {/* Quantity */}
        <div className="flex-shrink-0">
          <QuantitySelector
            quantity={localQty}
            onChange={setLocalQty}
            disabled={isOutOfStock}
          />
        </div>

        {/* Add to cart button — shows cart count inline when item is in cart */}
        <div className="flex-shrink-0">
          {isOutOfStock ? (
            <button
              disabled
              className="px-4 py-2 rounded-full text-xs font-semibold bg-brand-primary/10 text-brand-primary/40 cursor-not-allowed whitespace-nowrap"
            >
              OUT OF STOCK
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-brand-primary text-brand-cream hover:bg-brand-primaryHover transition-colors whitespace-nowrap"
            >
              {inCart && cartItem ? `ADD (${cartItem.quantity} in cart)` : `ADD TO CART`}
            </button>
          )}
        </div>
      </div>

      {/* Mobile: Stacked layout */}
      <div className="md:hidden">
        <div className="flex items-start gap-3 mb-3">
          {/* Thumbnail */}
          <div className="w-14 h-14 rounded-lg bg-brand-cream border border-brand-primary/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
            ) : (
              <Package className="w-5 h-5 text-brand-primary/20" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-sm text-brand-primary leading-tight">{product.name}</h3>
            {product.description && (
              <p className="text-xs text-cultr-textMuted mt-1 line-clamp-2">{product.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="font-bold text-base text-brand-primary">${product.priceUsd?.toFixed(2)}</span>
              <StockBadge status={product.stockStatus} />
            </div>
            {product.bulkPrice && product.bulkMinQty && product.bulkSavePercent && (
              <p className="text-xs text-cultr-textMuted mt-0.5">
                From ${product.bulkPrice} for {product.bulkMinQty}+ (Save {product.bulkSavePercent}%)
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Variant */}
          <select
            value={selectedVariant}
            onChange={(e) => setSelectedVariant(e.target.value)}
            className="px-2 py-1.5 border border-brand-primary/15 rounded-lg text-xs grad-white text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary flex-1 min-w-[100px]"
          >
            {product.variants.map(v => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>

          {/* Quantity */}
          <QuantitySelector
            quantity={localQty}
            onChange={setLocalQty}
            disabled={isOutOfStock}
          />

          {/* Add to cart */}
          {isOutOfStock ? (
            <button
              disabled
              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-brand-primary/10 text-brand-primary/40 cursor-not-allowed flex-shrink-0"
            >
              OUT OF STOCK
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-brand-primary text-brand-cream hover:bg-brand-primaryHover transition-colors flex-shrink-0"
            >
              {inCart ? `ADD MORE` : `ADD TO CART`}
            </button>
          )}
        </div>

        {inCart && cartItem && (
          <p className="text-xs text-cultr-forest font-medium mt-2">
            {cartItem.quantity} in cart
          </p>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Vitamin Row component (matches QuickOrderRow layout)
// ============================================================
function VitaminRow({ product }: { product: VitaminProduct }) {
  const style = VITAMIN_CATEGORY_STYLES[product.category]
  const IconComponent = style.Icon
  const { addItem, isInCart, getItem, updateQuantity } = useCart()
  const [localQty, setLocalQty] = useState(1)

  const shopProduct = vitaminToShopProduct(product)
  const inCart = isInCart(shopProduct.sku)
  const cartItem = getItem(shopProduct.sku)

  const handleAddToCart = () => {
    if (inCart && cartItem) {
      updateQuantity(shopProduct.sku, cartItem.quantity + localQty)
    } else {
      addItem(shopProduct, localQty)
    }
    setLocalQty(1)
  }

  return (
    <div className="bg-white border border-brand-primary/10 rounded-xl px-4 py-3 hover:border-brand-primary/25 hover:shadow-sm transition-all">
      {/* Desktop: Horizontal layout */}
      <div className="hidden md:flex items-center gap-3">
        {/* Thumbnail — gradient icon matching the category */}
        <div className="group/tip relative flex-shrink-0">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${style.gradient} border border-brand-primary/5 flex items-center justify-center`}>
            <IconComponent className="w-5 h-5 text-brand-primary/40" />
          </div>
          {/* Hover tooltip with benefits */}
          <div className="pointer-events-none invisible opacity-0 group-hover/tip:visible group-hover/tip:opacity-100 transition-all duration-200 absolute left-0 top-full mt-1 z-20 w-64 grad-dark text-white text-xs rounded-lg px-3 py-2 shadow-lg">
            {product.benefits}
          </div>
        </div>

        {/* Name + category info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-sm text-brand-primary leading-tight truncate">{product.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="inline-flex px-2 py-0.5 bg-mint text-brand-primary text-[10px] font-medium rounded-full">
              {style.displayName}
            </span>
            {product.isNew && (
              <span className="text-xs font-medium text-green-600">New</span>
            )}
            {product.grownInUSA && (
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600">
                <Flag className="w-3 h-3" />
                Grown in USA
              </span>
            )}
          </div>
        </div>

        {/* Quantity */}
        <div className="flex-shrink-0">
          <QuantitySelector
            quantity={localQty}
            onChange={setLocalQty}
          />
        </div>

        {/* Add to cart button */}
        <div className="flex-shrink-0">
          <button
            onClick={handleAddToCart}
            className="px-4 py-2 rounded-full text-xs font-semibold bg-brand-primary text-brand-cream hover:bg-brand-primaryHover transition-colors whitespace-nowrap"
          >
            {inCart && cartItem ? `ADD (${cartItem.quantity} in cart)` : `ADD TO CART`}
          </button>
        </div>
      </div>

      {/* Mobile: Stacked layout */}
      <div className="md:hidden">
        <div className="flex items-start gap-3 mb-3">
          {/* Thumbnail */}
          <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${style.gradient} border border-brand-primary/5 flex items-center justify-center flex-shrink-0`}>
            <IconComponent className="w-5 h-5 text-brand-primary/40" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-sm text-brand-primary leading-tight">{product.name}</h3>
            <p className="text-xs text-cultr-textMuted mt-1 line-clamp-2">{product.benefits}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="inline-flex px-2 py-0.5 bg-mint text-brand-primary text-[10px] font-medium rounded-full">
                {style.displayName}
              </span>
              {product.isNew && (
                <span className="text-xs font-medium text-green-600">New</span>
              )}
              {product.grownInUSA && (
                <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600">
                  <Flag className="w-3 h-3" />
                  USA
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quantity */}
          <QuantitySelector
            quantity={localQty}
            onChange={setLocalQty}
          />

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-brand-primary text-brand-cream hover:bg-brand-primaryHover transition-colors flex-shrink-0"
          >
            {inCart ? `ADD MORE` : `ADD TO CART`}
          </button>
        </div>

        {inCart && cartItem && (
          <p className="text-xs text-cultr-forest font-medium mt-2">
            {cartItem.quantity} in cart
          </p>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Main component
// ============================================================
export function QuickOrderClient({ email, tier }: { email: string; tier: PlanTier | null }) {
  const [activeShopTab, setActiveShopTab] = useState<ShopTab>('peptides')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all')
  const [selectedStock, setSelectedStock] = useState<StockStatus | 'all'>('all')
  const [selectedVial, setSelectedVial] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('az')
  const [vitaminSearchQuery, setVitaminSearchQuery] = useState('')
  const [selectedVitaminCategory, setSelectedVitaminCategory] = useState<VitaminCategory | 'all'>('all')
  const [mobileCartExpanded, setMobileCartExpanded] = useState(false)
  const { getItemCount } = useCart()

  const categories = getCategoriesWithCounts()
  const vialTypes = getUniqueVialTypes()
  const cartCount = getItemCount()

  // Build filter options
  const categoryOptions = [
    { value: 'all', label: `All Categories` },
    ...categories.map(c => ({ value: c.category, label: `${c.displayName} (${c.count})` })),
  ]

  const stockOptions = [
    { value: 'all', label: 'All Stock' },
    { value: 'in_stock', label: 'In Stock' },
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'out_of_stock', label: 'Out of Stock' },
  ]

  const vialOptions = [
    { value: 'all', label: 'All Vials' },
    ...vialTypes.map(v => ({ value: v, label: v })),
  ]

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let products = [...PRODUCT_CATALOG]

    if (selectedCategory !== 'all') {
      products = products.filter(p => p.category === selectedCategory)
    }
    if (selectedStock !== 'all') {
      products = products.filter(p => p.stockStatus === selectedStock)
    }
    if (selectedVial !== 'all') {
      products = products.filter(p => p.vialType === selectedVial)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      )
    }

    switch (sortBy) {
      case 'az':
        products.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'za':
        products.sort((a, b) => b.name.localeCompare(a.name))
        break
      case 'price_low':
        products.sort((a, b) => (a.priceUsd || 0) - (b.priceUsd || 0))
        break
      case 'price_high':
        products.sort((a, b) => (b.priceUsd || 0) - (a.priceUsd || 0))
        break
    }

    return products
  }, [searchQuery, selectedCategory, selectedStock, selectedVial, sortBy])

  // Filter vitamin products
  const vitaminCategories = getVitaminCategoriesWithCounts()
  const vitaminCategoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...vitaminCategories.map(c => ({ value: c.category, label: `${c.displayName} (${c.count})` })),
  ]

  const filteredVitamins = useMemo(() => {
    let products = [...VITAMIN_CATALOG]

    if (selectedVitaminCategory !== 'all') {
      products = products.filter(p => p.category === selectedVitaminCategory)
    }
    if (vitaminSearchQuery.trim()) {
      const q = vitaminSearchQuery.toLowerCase()
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.benefits.toLowerCase().includes(q) ||
        VITAMIN_CATEGORY_STYLES[p.category].displayName.toLowerCase().includes(q)
      )
    }

    products.sort((a, b) => a.name.localeCompare(b.name))
    return products
  }, [vitaminSearchQuery, selectedVitaminCategory])

  const hasActiveFilters = selectedCategory !== 'all' || selectedStock !== 'all' || selectedVial !== 'all' || searchQuery.trim() !== ''
  const hasActiveVitaminFilters = selectedVitaminCategory !== 'all' || vitaminSearchQuery.trim() !== ''

  const clearFilters = () => {
    setSelectedCategory('all')
    setSelectedStock('all')
    setSelectedVial('all')
    setSearchQuery('')
    setSortBy('az')
  }

  const clearVitaminFilters = () => {
    setSelectedVitaminCategory('all')
    setVitaminSearchQuery('')
  }

  return (
    <div className="min-h-screen grad-page">
      {/* Header Bar */}
      <header className="bg-brand-primary text-brand-cream py-5 px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between">
            <Link
              href="/library"
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Library</span>
            </Link>

            <Link
              href="/library/cart"
              className="relative flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="text-sm">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-sage text-brand-primary text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Page content — two column on desktop when cart has items */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex gap-10 items-start">
          {/* Left: Products */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-display font-bold text-brand-primary mb-6">
              {activeShopTab === 'peptides' ? 'Quick Order' : 'Vitamins & Supplements'}
            </h1>

            {/* Tab toggle */}
            <div className="flex items-center gap-1 p-1 bg-brand-primary/5 rounded-full w-fit mb-8">
              <button
                onClick={() => setActiveShopTab('peptides')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeShopTab === 'peptides'
                    ? 'bg-brand-primary text-brand-cream shadow-sm'
                    : 'text-brand-primary/60 hover:text-brand-primary'
                }`}
              >
                Peptides &amp; Compounds
              </button>
              <button
                onClick={() => setActiveShopTab('vitamins')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeShopTab === 'vitamins'
                    ? 'bg-brand-primary text-brand-cream shadow-sm'
                    : 'text-brand-primary/60 hover:text-brand-primary'
                }`}
              >
                Vitamins &amp; Supplements
              </button>
            </div>

            {/* ── Peptides Tab ─────────────────────────────── */}
            {activeShopTab === 'peptides' && (
              <>
                {/* Filter bar */}
                <div className="flex flex-col gap-4 mb-6">
                  {/* Row 1: Filters */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Dropdown
                      label="Category"
                      value={selectedCategory}
                      options={categoryOptions}
                      onChange={(v) => setSelectedCategory(v as ProductCategory | 'all')}
                    />
                    <Dropdown
                      label="Stock"
                      value={selectedStock}
                      options={stockOptions}
                      onChange={(v) => setSelectedStock(v as StockStatus | 'all')}
                    />
                    <Dropdown
                      label="Vial Type"
                      value={selectedVial}
                      options={vialOptions}
                      onChange={(v) => setSelectedVial(v)}
                    />

                    <div className="hidden md:block w-px h-8 bg-brand-primary/10" />

                    <Dropdown
                      label="Sort"
                      value={sortBy}
                      options={SORT_OPTIONS}
                      onChange={(v) => setSortBy(v as SortOption)}
                    />

                    <span className="text-sm text-cultr-textMuted ml-auto">
                      {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Row 2: Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-primary/30" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 border border-brand-primary/15 rounded-lg grad-white text-brand-primary placeholder:text-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-cultr-textMuted hover:text-brand-primary transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Active filter badges */}
                  {hasActiveFilters && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedCategory !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-mint text-brand-primary text-xs rounded-full font-medium">
                          {getCategoryDisplayName(selectedCategory)}
                          <button onClick={() => setSelectedCategory('all')}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      {selectedStock !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-mint text-brand-primary text-xs rounded-full font-medium">
                          {stockOptions.find(o => o.value === selectedStock)?.label}
                          <button onClick={() => setSelectedStock('all')}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      {selectedVial !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-mint text-brand-primary text-xs rounded-full font-medium">
                          {selectedVial}
                          <button onClick={() => setSelectedVial('all')}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      {searchQuery && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-mint text-brand-primary text-xs rounded-full font-medium">
                          &quot;{searchQuery}&quot;
                          <button onClick={() => setSearchQuery('')}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      <button
                        onClick={clearFilters}
                        className="text-xs text-cultr-textMuted hover:text-brand-primary underline ml-1 transition-colors"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>

                {/* Product list */}
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-20">
                    <Package className="w-12 h-12 text-brand-primary/20 mx-auto mb-4" />
                    <h3 className="text-lg font-display font-bold text-brand-primary mb-2">No products found</h3>
                    <p className="text-cultr-textMuted text-sm">
                      Try adjusting your search or filter criteria.
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="mt-4 text-sm text-brand-primary hover:underline"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {filteredProducts.map(product => (
                      <QuickOrderRow key={product.sku} product={product} />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── Vitamins Tab ─────────────────────────────── */}
            {activeShopTab === 'vitamins' && (
              <>
                {/* Filter bar */}
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <Dropdown
                      label="Category"
                      value={selectedVitaminCategory}
                      options={vitaminCategoryOptions}
                      onChange={(v) => setSelectedVitaminCategory(v as VitaminCategory | 'all')}
                    />
                    <span className="text-sm text-cultr-textMuted ml-auto">
                      {filteredVitamins.length} product{filteredVitamins.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-primary/30" />
                    <input
                      type="text"
                      placeholder="Search vitamins & supplements..."
                      value={vitaminSearchQuery}
                      onChange={(e) => setVitaminSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 border border-brand-primary/15 rounded-lg grad-white text-brand-primary placeholder:text-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm"
                    />
                    {vitaminSearchQuery && (
                      <button
                        onClick={() => setVitaminSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-cultr-textMuted hover:text-brand-primary transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Active filter badges */}
                  {hasActiveVitaminFilters && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedVitaminCategory !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-mint text-brand-primary text-xs rounded-full font-medium">
                          {getVitaminCategoryDisplayName(selectedVitaminCategory)}
                          <button onClick={() => setSelectedVitaminCategory('all')}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      {vitaminSearchQuery && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-mint text-brand-primary text-xs rounded-full font-medium">
                          &quot;{vitaminSearchQuery}&quot;
                          <button onClick={() => setVitaminSearchQuery('')}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      <button
                        onClick={clearVitaminFilters}
                        className="text-xs text-cultr-textMuted hover:text-brand-primary underline ml-1 transition-colors"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>

                {/* Product list */}
                {filteredVitamins.length === 0 ? (
                  <div className="text-center py-20">
                    <Package className="w-12 h-12 text-brand-primary/20 mx-auto mb-4" />
                    <h3 className="text-lg font-display font-bold text-brand-primary mb-2">No supplements found</h3>
                    <p className="text-cultr-textMuted text-sm">
                      Try adjusting your search or filter criteria.
                    </p>
                    {hasActiveVitaminFilters && (
                      <button
                        onClick={clearVitaminFilters}
                        className="mt-4 text-sm text-brand-primary hover:underline"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {filteredVitamins.map(product => (
                      <VitaminRow key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: Sticky cart summary (desktop) */}
          <CartSummaryPanel
            mobileExpanded={mobileCartExpanded}
            onToggleMobile={() => setMobileCartExpanded(!mobileCartExpanded)}
          />
        </div>
      </div>

      {/* Bottom padding on mobile so content isn't hidden behind cart bar */}
      {cartCount > 0 && <div className="lg:hidden h-14" />}

      {/* Disclaimer */}
      <div className="max-w-[1400px] mx-auto px-6 pb-8">
        <div className="p-4 bg-mint border border-sage rounded-xl">
          {activeShopTab === 'peptides' ? (
            <p className="text-xs text-cultr-textMuted">
              <strong className="text-brand-primary">Note:</strong> All products require a valid prescription.
              <span className="font-display font-bold">CULTR</span> Health does not guarantee product availability.
              Contact our team for current inventory and pricing.
            </p>
          ) : (
            <p className="text-xs text-cultr-textMuted">
              <strong className="text-brand-primary">Note:</strong> These statements have not been evaluated by the Food and Drug Administration.
              These products are not intended to diagnose, treat, cure, or prevent any disease.
              Supplement orders are reviewed by our staff and fulfilled separately from peptide orders.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
