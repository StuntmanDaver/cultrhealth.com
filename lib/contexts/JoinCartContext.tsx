'use client'

import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react'

// =============================================
// TYPES
// =============================================

export interface JoinCartItem {
  therapyId: string
  name: string
  /** Price per unit in USD. null = consultation/TBD pricing */
  price: number | null
  pricingNote?: string
  quantity: number
}

interface JoinCartState {
  items: JoinCartItem[]
  isLoaded: boolean
}

type JoinCartAction =
  | { type: 'ADD_ITEM'; payload: Omit<JoinCartItem, 'quantity'> & { quantity?: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { therapyId: string; quantity: number } }
  | { type: 'CLEAR' }
  | { type: 'LOAD'; payload: JoinCartItem[] }

interface JoinCartContextValue {
  items: JoinCartItem[]
  isLoaded: boolean
  addItem: (item: Omit<JoinCartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (therapyId: string) => void
  updateQuantity: (therapyId: string, quantity: number) => void
  clearCart: () => void
  getItemCount: () => number
  isInCart: (therapyId: string) => boolean
  getCartTotal: () => number
  hasConsultationItems: () => boolean
}

// =============================================
// REDUCER
// =============================================

const STORAGE_KEY = 'cultr-join-cart'

function cartReducer(state: JoinCartState, action: JoinCartAction): JoinCartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.therapyId === action.payload.therapyId)
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.therapyId === action.payload.therapyId
              ? { ...i, quantity: i.quantity + (action.payload.quantity || 1) }
              : i
          ),
        }
      }
      return {
        ...state,
        items: [
          ...state.items,
          {
            therapyId: action.payload.therapyId,
            name: action.payload.name,
            price: action.payload.price,
            pricingNote: action.payload.pricingNote,
            quantity: action.payload.quantity || 1,
          },
        ],
      }
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.therapyId !== action.payload) }
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.therapyId !== action.payload.therapyId) }
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.therapyId === action.payload.therapyId ? { ...i, quantity: action.payload.quantity } : i
        ),
      }
    }
    case 'CLEAR':
      return { ...state, items: [] }
    case 'LOAD':
      return { ...state, items: action.payload, isLoaded: true }
    default:
      return state
  }
}

// =============================================
// CONTEXT
// =============================================

const JoinCartContext = createContext<JoinCartContextValue | null>(null)

export function JoinCartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isLoaded: false })

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as JoinCartItem[]
        dispatch({ type: 'LOAD', payload: parsed })
      } else {
        dispatch({ type: 'LOAD', payload: [] })
      }
    } catch {
      dispatch({ type: 'LOAD', payload: [] })
    }
  }, [])

  // Persist to localStorage on changes
  useEffect(() => {
    if (state.isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
    }
  }, [state.items, state.isLoaded])

  const addItem = useCallback(
    (item: Omit<JoinCartItem, 'quantity'> & { quantity?: number }) => {
      dispatch({ type: 'ADD_ITEM', payload: item })
    },
    []
  )

  const removeItem = useCallback((therapyId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: therapyId })
  }, [])

  const updateQuantity = useCallback((therapyId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { therapyId, quantity } })
  }, [])

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' })
  }, [])

  const getItemCount = useCallback(() => {
    return state.items.reduce((sum, i) => sum + i.quantity, 0)
  }, [state.items])

  const isInCart = useCallback(
    (therapyId: string) => state.items.some((i) => i.therapyId === therapyId),
    [state.items]
  )

  const getCartTotal = useCallback(() => {
    return state.items.reduce((sum, i) => (i.price ? sum + i.price * i.quantity : sum), 0)
  }, [state.items])

  const hasConsultationItems = useCallback(() => {
    return state.items.some((i) => i.price === null)
  }, [state.items])

  return (
    <JoinCartContext.Provider
      value={{
        items: state.items,
        isLoaded: state.isLoaded,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemCount,
        isInCart,
        getCartTotal,
        hasConsultationItems,
      }}
    >
      {children}
    </JoinCartContext.Provider>
  )
}

export function useJoinCart() {
  const ctx = useContext(JoinCartContext)
  if (!ctx) {
    throw new Error('useJoinCart must be used within <JoinCartProvider>')
  }
  return ctx
}
