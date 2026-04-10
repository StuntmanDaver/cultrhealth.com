import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import ClubOrderBulkActions from '@/components/admin/ClubOrderBulkActions'

describe('ClubOrderBulkActions', () => {
  it('frames bulk moves as manual processing and limits them to safe no-tracking statuses', () => {
    render(
      <ClubOrderBulkActions
        selectedCount={2}
        isBulkUpdating={false}
        onBulkMove={vi.fn()}
        onClearSelection={vi.fn()}
      />
    )

    expect(screen.getByRole('option', { name: /mark manually processed as/i })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Invoice Sent' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Shipped' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Approved' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Paid' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Fulfilled' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Cancelled' })).toBeInTheDocument()
  })
})
