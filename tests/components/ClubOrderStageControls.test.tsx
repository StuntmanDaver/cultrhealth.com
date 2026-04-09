import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import ClubOrderStageControls from '@/components/admin/ClubOrderStageControls'

describe('ClubOrderStageControls', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('submits shipped status with tracking details from the inline shipping form', () => {
    const onStatusUpdate = vi.fn()

    render(
      <ClubOrderStageControls
        orderId="club-order-1"
        currentStatus="paid"
        isApproving={false}
        isUpdating={false}
        onApprove={vi.fn()}
        onStatusUpdate={onStatusUpdate}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /mark shipped/i }))
    fireEvent.change(screen.getByPlaceholderText(/carrier/i), { target: { value: 'UPS' } })
    fireEvent.change(screen.getByPlaceholderText(/tracking number/i), { target: { value: '1Z999AA10123456784' } })
    fireEvent.change(screen.getByPlaceholderText(/tracking url/i), { target: { value: 'https://tracking.example/1Z999AA10123456784' } })
    fireEvent.click(screen.getByRole('button', { name: /confirm shipment/i }))

    expect(onStatusUpdate).toHaveBeenCalledWith('club-order-1', 'shipped', {
      carrier: 'UPS',
      trackingNumber: '1Z999AA10123456784',
      trackingUrl: 'https://tracking.example/1Z999AA10123456784',
    })
  })

  it('uses suppressEmails when skipping ahead from the move menu', () => {
    const onStatusUpdate = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(
      <ClubOrderStageControls
        orderId="club-order-2"
        currentStatus="approved"
        isApproving={false}
        isUpdating={false}
        onApprove={vi.fn()}
        onStatusUpdate={onStatusUpdate}
      />
    )

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'fulfilled' } })

    expect(onStatusUpdate).toHaveBeenCalledWith('club-order-2', 'fulfilled', {
      suppressEmails: true,
    })
  })
})
