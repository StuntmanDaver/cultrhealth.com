import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import { JoinCartProvider, useJoinCart } from '@/lib/contexts/JoinCartContext'

const STORAGE_KEY = 'cultr-join-cart'

function CartProbe() {
  const cart = useJoinCart()

  return (
    <pre data-testid="cart-items">
      {cart.isLoaded ? JSON.stringify(cart.items) : 'loading'}
    </pre>
  )
}

describe('JoinCartProvider', () => {
  beforeEach(() => {
    const storage = new Map<string, string>()

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
      removeItem: (key: string) => {
        storage.delete(key)
      },
      clear: () => {
        storage.clear()
      },
    })

    localStorage.clear()
  })

  it('drops removed therapies and refreshes persisted items to the current join catalog', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          therapyId: 'pt-141',
          name: 'PT-141 (Bremelanotide)',
          price: 6.5,
          note: 'Multiple formats available',
          quantity: 1,
        },
        {
          therapyId: 'semaglutide',
          name: 'Semaglutide/Pyridoxine (reconstituted)',
          price: 104,
          note: '2.5–5 mg/mL | 1–5 mL',
          quantity: 2,
        },
      ])
    )

    render(
      <JoinCartProvider>
        <CartProbe />
      </JoinCartProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('cart-items')).not.toHaveTextContent('loading')
    })

    const items = JSON.parse(screen.getByTestId('cart-items').textContent || '[]')

    expect(items).toEqual([
      {
        therapyId: 'semaglutide',
        name: 'Semaglutide — GLP1',
        price: 225,
        note: '5 MG | 3 ML · 2-3 month supply',
        quantity: 2,
      },
    ])

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')).toEqual(items)
  })
})
