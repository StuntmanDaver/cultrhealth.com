import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import ClubOrderBulkActions from '@/components/admin/ClubOrderBulkActions'

describe('ClubOrderBulkActions', () => {
  it('does not allow bulk moves directly to shipped because tracking is required per order', () => {
    render(
      <ClubOrderBulkActions
        selectedCount={2}
        isBulkUpdating={false}
        onBulkMove={vi.fn()}
        onClearSelection={vi.fn()}
      />
    )

    expect(screen.queryByRole('option', { name: 'Shipped' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Fulfilled' })).toBeInTheDocument()
  })
})
