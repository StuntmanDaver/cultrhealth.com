'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'

interface KitRegistrationFormProps {
  onSuccess: () => void
  /** Base endpoint for labs API. Defaults to '/api/portal/labs'. */
  labsEndpoint?: string
}

const ERROR_MESSAGES: Record<string, string> = {
  not_found: 'Kit not found -- check the ID and try again.',
  already_registered: 'This kit is already registered.',
  expired: 'This kit has expired.',
}

export function KitRegistrationForm({ onSuccess, labsEndpoint = '/api/portal/labs' }: KitRegistrationFormProps) {
  const [kitId, setKitId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = kitId.trim()
    if (!trimmed) {
      setError('Please enter a kit ID.')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Step 1: Validate kit ID
      const validateRes = await fetch(`${labsEndpoint}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kitId: trimmed }),
      })

      const validateData = await validateRes.json()

      if (!validateRes.ok || !validateData.success) {
        const status = validateData.validation?.status || validateData.error || 'not_found'
        setError(ERROR_MESSAGES[status] || validateData.error || 'Validation failed. Please try again.')
        setIsLoading(false)
        return
      }

      if (!validateData.validation?.valid) {
        const status = validateData.validation?.status || 'not_found'
        setError(ERROR_MESSAGES[status] || 'Kit not found -- check the ID and try again.')
        setIsLoading(false)
        return
      }

      // Step 2: Register kit
      const registerRes = await fetch(labsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kitId: trimmed }),
      })

      const registerData = await registerRes.json()

      if (!registerRes.ok || !registerData.success) {
        setError(registerData.error || 'Registration failed. Please try again.')
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setKitId('')
      setTimeout(() => onSuccess(), 1500)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <label
        htmlFor="kit-id-input"
        className="block text-sm font-semibold text-brand-primary mb-1"
      >
        Register Your Kit
      </label>
      <p className="text-xs text-brand-primary/50 mb-3">
        Find this on the label inside your test kit box.
      </p>
      <div className="flex gap-3 items-start w-full max-w-sm">
        <input
          id="kit-id-input"
          type="text"
          value={kitId}
          onChange={(e) => {
            setKitId(e.target.value)
            if (error) setError(null)
            if (success) setSuccess(false)
          }}
          placeholder="e.g., KIT-XXXXX"
          className="flex-1 rounded-xl border border-brand-primary/20 bg-white px-4 py-2.5 text-sm text-brand-primary placeholder:text-brand-primary/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/40"
          disabled={isLoading}
        />
        <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
          Register Kit
        </Button>
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-1" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-green-600 text-sm mt-1" role="status">
          Kit registered successfully!
        </p>
      )}
    </form>
  )
}
