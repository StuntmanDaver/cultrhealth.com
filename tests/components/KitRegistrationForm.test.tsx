import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { KitRegistrationForm } from '@/components/portal/KitRegistrationForm'

describe('KitRegistrationForm', () => {
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = vi.fn()
  })

  /** Check all required-reading checkboxes so the form becomes active */
  function checkAllGuides() {
    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach((cb) => fireEvent.click(cb))
  }

  it('renders input field and Register Kit button', () => {
    render(<KitRegistrationForm onSuccess={mockOnSuccess} />)
    expect(screen.getByPlaceholderText('e.g., KIT-XXXXX')).toBeTruthy()
    expect(screen.getByText('Register Kit')).toBeTruthy()
  })

  it('shows "Kit not found" error for invalid kit validation', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, validation: { valid: false, status: 'not_found' } }),
    })

    render(<KitRegistrationForm onSuccess={mockOnSuccess} />)
    checkAllGuides()
    const input = screen.getByPlaceholderText('e.g., KIT-XXXXX')
    fireEvent.change(input, { target: { value: 'INVALID-123' } })
    fireEvent.click(screen.getByText('Register Kit'))

    await waitFor(() => {
      expect(screen.getByText(/Kit not found/)).toBeTruthy()
    })
  })

  it('shows "already registered" error for registered kit', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, validation: { valid: false, status: 'already_registered' } }),
    })

    render(<KitRegistrationForm onSuccess={mockOnSuccess} />)
    checkAllGuides()
    fireEvent.change(screen.getByPlaceholderText('e.g., KIT-XXXXX'), { target: { value: 'KIT-REG' } })
    fireEvent.click(screen.getByText('Register Kit'))

    await waitFor(() => {
      expect(screen.getByText(/already registered/)).toBeTruthy()
    })
  })

  it('shows "expired" error for expired kit', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, validation: { valid: false, status: 'expired' } }),
    })

    render(<KitRegistrationForm onSuccess={mockOnSuccess} />)
    checkAllGuides()
    fireEvent.change(screen.getByPlaceholderText('e.g., KIT-XXXXX'), { target: { value: 'KIT-EXP' } })
    fireEvent.click(screen.getByText('Register Kit'))

    await waitFor(() => {
      expect(screen.getByText(/expired/)).toBeTruthy()
    })
  })

  it('shows success message and calls onSuccess after registration', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, validation: { valid: true, kitId: 'KIT-OK' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, registration: {} }),
      })

    render(<KitRegistrationForm onSuccess={mockOnSuccess} />)
    checkAllGuides()
    fireEvent.change(screen.getByPlaceholderText('e.g., KIT-XXXXX'), { target: { value: 'KIT-OK' } })
    fireEvent.click(screen.getByText('Register Kit'))

    await waitFor(() => {
      expect(screen.getByText('Kit registered successfully!')).toBeTruthy()
    })
    // onSuccess is called after a 1.5s delay so the success message is visible
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledOnce()
    }, { timeout: 2000 })
  })

  it('shows client-side error for empty input', async () => {
    render(<KitRegistrationForm onSuccess={mockOnSuccess} />)
    checkAllGuides()
    fireEvent.click(screen.getByText('Register Kit'))

    await waitFor(() => {
      expect(screen.getByText('Please enter a kit ID.')).toBeTruthy()
    })
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
