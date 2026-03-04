// LMN Eligibility Logic - Determines which products qualify for Letter of Medical Necessity

import type { ProductCategory, ShopProduct } from '@/lib/config/product-catalog'
import type { LmnItem } from './lmn-types'

// Categories excluded from LMN (non-medical items)
const LMN_EXCLUDED_CATEGORIES: ProductCategory[] = ['accessory']

/**
 * Check if a product category is eligible for LMN
 */
export function isLmnEligibleCategory(category: ProductCategory): boolean {
  return !LMN_EXCLUDED_CATEGORIES.includes(category)
}

/**
 * Check if a specific product is eligible for LMN
 */
export function isProductLmnEligible(product: ShopProduct): boolean {
  return isLmnEligibleCategory(product.category)
}

/**
 * Filter cart/order items to only include LMN-eligible products
 */
export function filterLmnEligibleItems<T extends { category: string }>(items: T[]): T[] {
  return items.filter(item => isLmnEligibleCategory(item.category as ProductCategory))
}

/**
 * Calculate total for LMN-eligible items only
 */
export function calculateLmnEligibleTotal(items: LmnItem[]): number {
  return items
    .filter(item => isLmnEligibleCategory(item.category as ProductCategory))
    .reduce((sum, item) => sum + item.totalPrice, 0)
}

/**
 * Check if an order has any LMN-eligible items
 */
export function hasLmnEligibleItems<T extends { category: string }>(items: T[]): boolean {
  return items.some(item => isLmnEligibleCategory(item.category as ProductCategory))
}

/**
 * Get a list of eligible categories for display purposes
 */
export function getLmnEligibleCategories(): ProductCategory[] {
  const allCategories: ProductCategory[] = [
    'growth_factor',
    'repair',
    'metabolic',
    'bioregulator',
    'neuropeptide',
    'immune',
    'hormonal',
    'blend',
    'accessory',
  ]
  return allCategories.filter(cat => !LMN_EXCLUDED_CATEGORIES.includes(cat))
}
