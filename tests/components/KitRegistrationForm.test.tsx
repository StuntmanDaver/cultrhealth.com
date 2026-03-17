import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { KitRegistrationForm } from '@/components/portal/KitRegistrationForm'

describe('KitRegistrationForm', () => {
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = vi.fn()
  })

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
    fireEvent.change(screen.getByPlaceholderText('e.g., KIT-XXXXX'), { target: { value: 'KIT-OK' } })
    fireEvent.click(screen.getByText('Register Kit'))

    await waitFor(() => {
      expect(screen.getByText('Kit registered successfully!')).toBeTruthy()
    })
    expect(mockOnSuccess).toHaveBeenCalledOnce()
  })

  it('shows client-side error for empty input', async () => {
    render(<KitRegistrationForm onSuccess={mockOnSuccess} />)
    fireEvent.click(screen.getByText('Register Kit'))

    await waitFor(() => {
      expect(screen.getByText('Please enter a kit ID.')).toBeTruthy()
    })
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
