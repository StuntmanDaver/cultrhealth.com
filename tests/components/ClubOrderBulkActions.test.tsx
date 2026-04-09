import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import ClubOrderBulkActions from '@/components/admin/ClubOrderBulkActions'

describe('ClubOrderBulkActions', () => {
  it('shows the shipped stage label consistently in the bulk move menu', () => {
    render(
      <ClubOrderBulkActions
        selectedCount={2}
        isBulkUpdating={false}
        onBulkMove={vi.fn()}
        onClearSelection={vi.fn()}
      />
    )

    expect(screen.getByRole('option', { name: 'Shipped' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Waiting to Ship' })).not.toBeInTheDocument()
  })
})
