'use client'

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import type { ShopProduct } from './config/product-catalog'

// Cart item type
export type CartItem = {
  sku: string
  product: ShopProduct
  quantity: number
}

// Cart state
type CartState = {
  items: CartItem[]
  isLoaded: boolean
}

// Cart actions
type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: ShopProduct; quantity?: number } }
  | { type: 'REMOVE_ITEM'; payload: { sku: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { sku: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: { items: CartItem[] } }

// Cart context type
type CartContextType = {
  items: CartItem[]
  isLoaded: boolean
  addItem: (product: ShopProduct, quantity?: number) => void
  removeItem: (sku: string) => void
  updateQuantity: (sku: string, quantity: number) => void
  clearCart: () => void
  getItemCount: () => number
  isInCart: (sku: string) => boolean
  getItem: (sku: string) => CartItem | undefined
  /** Sum of priceUsd * quantity for items with a price. Returns 0 if no priced items. */
  getCartTotal: () => number
  /** Whether every item in the cart has a priceUsd set */
  allItemsPriced: () => boolean
}

// Local storage key
const CART_STORAGE_KEY = 'cultr-shop-cart'

// Cart reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity = 1 } = action.payload
      const existingItem = state.items.find(item => item.sku === product.sku)
      
      if (existingItem) {
        // Update quantity if item already exists
        return {
          ...state,
          items: state.items.map(item =>
            item.sku === product.sku
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        }
      }
      
      // Add new item
      return {
        ...state,
        items: [...state.items, { sku: product.sku, product, quantity }],
      }
    }
    
    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter(item => item.sku !== action.payload.sku),
      }
    }
    
    case 'UPDATE_QUANTITY': {
      const { sku, quantity } = action.payload
      
      // Remove item if quantity is 0 or less
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.sku !== sku),
        }
      }
      
      return {
        ...state,
        items: state.items.map(item =>
          item.sku === sku ? { ...item, quantity } : item
        ),
      }
    }
    
    case 'CLEAR_CART': {
      return {
        ...state,
        items: [],
      }
    }
    
    case 'LOAD_CART': {
      return {
        items: action.payload.items,
        isLoaded: true,
      }
    }
    
    default:
      return state
  }
}

// Initial state
const initialState: CartState = {
  items: [],
  isLoaded: false,
}

// Create context
const CartContext = createContext<CartContextType | null>(null)

// Provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  
  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY)
      if (savedCart) {
        const parsed = JSON.parse(savedCart)
        if (Array.isArray(parsed)) {
          dispatch({ type: 'LOAD_CART', payload: { items: parsed } })
        } else {
          dispatch({ type: 'LOAD_CART', payload: { items: [] } })
        }
      } else {
        dispatch({ type: 'LOAD_CART', payload: { items: [] } })
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error)
      dispatch({ type: 'LOAD_CART', payload: { items: [] } })
    }
  }, [])
  
  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (state.isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items))
      } catch (error) {
        console.error('Error saving cart to localStorage:', error)
      }
    }
  }, [state.items, state.isLoaded])
  
  // Context actions
  const addItem = (product: ShopProduct, quantity = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity } })
  }
  
  const removeItem = (sku: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { sku } })
  }
  
  const updateQuantity = (sku: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { sku, quantity } })
  }
  
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }
  
  const getItemCount = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0)
  }
  
  const isInCart = (sku: string) => {
    return state.items.some(item => item.sku === sku)
  }
  
  const getItem = (sku: string) => {
    return state.items.find(item => item.sku === sku)
  }

  const getCartTotal = () => {
    return state.items.reduce((sum, item) => {
      return sum + (item.product.priceUsd || 0) * item.quantity
    }, 0)
  }

  const allItemsPriced = () => {
    return state.items.length > 0 && state.items.every(item => typeof item.product.priceUsd === 'number' && item.product.priceUsd > 0)
  }

  const value: CartContextType = {
    items: state.items,
    isLoaded: state.isLoaded,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemCount,
    isInCart,
    getItem,
    getCartTotal,
    allItemsPriced,
  }
  
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// Hook to use cart context
export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
