'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { US_STATES } from '@/lib/config/asher-med'
import {
  ArrowLeft,
  User,
  MapPin,
  Activity,
  Pencil,
  RefreshCw,
  Check,
} from 'lucide-react'

// --------------------------------------------------
// Types
// --------------------------------------------------

interface ProfileAddress {
  address1: string
  address2: string | null
  city: string
  state: string
  zipCode: string
}

interface ProfileMeasurements {
  height: number | null
  weight: number | null
  bmi: number | null
}

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  address: ProfileAddress
  measurements: ProfileMeasurements
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const national = digits.startsWith('1') ? digits.slice(1) : digits
  if (national.length === 10) {
    return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`
  }
  return phone
}

function formatHeight(inches: number): string {
  const feet = Math.floor(inches / 12)
  const remaining = Math.round(inches % 12)
  return `${feet}'${remaining}"`
}

function formatGender(gender: string): string {
  if (gender === 'MALE') return 'Male'
  if (gender === 'FEMALE') return 'Female'
  return gender
}

// --------------------------------------------------
// Component
// --------------------------------------------------

export default function ProfileClient() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Address form state
  const [editAddress, setEditAddress] = useState<ProfileAddress>({
    address1: '',
    address2: null,
    city: '',
    state: '',
    zipCode: '',
  })

  // Fetch profile on mount
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/portal/profile')
        if (cancelled) return
        if (res.status === 401) return // auth guard handles redirect
        if (!res.ok) throw new Error('Failed to load profile')
        const data = await res.json()
        if (cancelled) return
        if (data.success) {
          setProfile(data.profile)
        } else {
          throw new Error(data.error || 'Failed to load profile')
        }
      } catch {
        if (!cancelled) setError('Unable to load your profile right now.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleRetry = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/portal/profile')
      if (res.status === 401) return
      if (!res.ok) throw new Error('Failed to load profile')
      const data = await res.json()
      if (data.success) {
        setProfile(data.profile)
      } else {
        throw new Error(data.error || 'Failed to load profile')
      }
    } catch {
      setError('Unable to load your profile right now.')
    } finally {
      setIsLoading(false)
    }
  }

  const startEditing = () => {
    if (profile) {
      setEditAddress({
        address1: profile.address.address1 || '',
        address2: profile.address.address2 || null,
        city: profile.address.city || '',
        state: profile.address.state || '',
        zipCode: profile.address.zipCode || '',
      })
    } else {
      setEditAddress({
        address1: '',
        address2: null,
        city: '',
        state: '',
        zipCode: '',
      })
    }
    setSaveError(null)
    setSaveSuccess(false)
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setSaveError(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      const res = await fetch('/api/portal/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: {
            address1: editAddress.address1,
            address2: editAddress.address2 || undefined,
            city: editAddress.city,
            state: editAddress.state,
            zipCode: editAddress.zipCode,
          },
        }),
      })
      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to update address')
      }

      // Update local state with new address
      if (profile) {
        setProfile({
          ...profile,
          address: {
            address1: editAddress.address1,
            address2: editAddress.address2,
            city: editAddress.city,
            state: editAddress.state,
            zipCode: editAddress.zipCode,
          },
        })
      }

      setIsEditing(false)
      setSaveSuccess(true)

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update address')
    } finally {
      setIsSaving(false)
    }
  }

  const hasAddress =
    profile &&
    (profile.address.address1 || profile.address.city || profile.address.state)

  const hasMeasurements =
    profile &&
    (profile.measurements.height !== null ||
      profile.measurements.weight !== null ||
      profile.measurements.bmi !== null)

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/portal/dashboard"
          className="p-1.5 rounded-full hover:bg-brand-primary/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-brand-primary/50" />
        </Link>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-brand-primary">
          Your Profile
        </h1>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-brand-primary/5 bg-white p-5 animate-pulse"
            >
              <div className="h-5 bg-brand-primary/10 rounded w-1/3 mb-4" />
              <div className="h-4 bg-brand-primary/10 rounded w-2/3 mb-3" />
              <div className="h-4 bg-brand-primary/10 rounded w-1/2 mb-3" />
              <div className="h-4 bg-brand-primary/10 rounded w-1/4" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4 mb-6">
          <p className="text-red-800 text-sm mb-2">{error}</p>
          <Button variant="secondary" size="sm" onClick={handleRetry}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {/* Empty State (Case C user) */}
      {!isLoading && !error && profile === null && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-brand-primary/30 mx-auto mb-4" />
          <h2 className="font-display text-2xl text-brand-primary mb-2">
            Complete Your Profile
          </h2>
          <p className="text-brand-primary/60 mb-6">
            Start your medical intake to set up your profile.
          </p>
          <Link href="/intake">
            <Button variant="primary" size="lg">
              Start Intake
            </Button>
          </Link>
        </div>
      )}

      {/* Profile Cards */}
      {!isLoading && !error && profile && (
        <div className="space-y-4">
          {/* Card 1: Personal Information (read-only) */}
          <div className="rounded-xl border border-brand-primary/5 bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-brand-primary/40" />
              <h2 className="font-display text-lg font-semibold text-brand-primary">
                Personal Information
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-medium text-brand-primary/50 uppercase tracking-wide block mb-1">
                  Full Name
                </span>
                <span className="text-sm text-brand-primary">
                  {profile.firstName} {profile.lastName}
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-brand-primary/50 uppercase tracking-wide block mb-1">
                  Date of Birth
                </span>
                <span className="text-sm text-brand-primary">
                  {formatDate(profile.dateOfBirth)}
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-brand-primary/50 uppercase tracking-wide block mb-1">
                  Phone
                </span>
                <span className="text-sm text-brand-primary">
                  {formatPhone(profile.phone)}
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-brand-primary/50 uppercase tracking-wide block mb-1">
                  Email
                </span>
                <span className="text-sm text-brand-primary">
                  {profile.email}
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-brand-primary/50 uppercase tracking-wide block mb-1">
                  Gender
                </span>
                <span className="text-sm text-brand-primary">
                  {formatGender(profile.gender)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Shipping Address (editable) */}
          <div className="rounded-xl border border-brand-primary/5 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-primary/40" />
                <h2 className="font-display text-lg font-semibold text-brand-primary">
                  Shipping Address
                </h2>
              </div>
              {!isEditing && hasAddress && (
                <button
                  onClick={startEditing}
                  className="flex items-center gap-1 text-sm text-brand-primary/60 hover:text-brand-primary transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
              )}
            </div>

            {/* Success message */}
            {saveSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-100 px-3 py-2 mb-4">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">Address updated</span>
              </div>
            )}

            {/* View mode */}
            {!isEditing && (
              <>
                {hasAddress ? (
                  <div className="text-sm text-brand-primary space-y-0.5">
                    <p>{profile.address.address1}</p>
                    {profile.address.address2 && (
                      <p>{profile.address.address2}</p>
                    )}
                    <p>
                      {profile.address.city}, {profile.address.state}{' '}
                      {profile.address.zipCode}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-brand-primary/50 mb-3">
                      No address on file
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={startEditing}
                    >
                      Add Address
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Edit mode */}
            {isEditing && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-brand-primary/50 uppercase tracking-wide block mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={editAddress.address1}
                    onChange={(e) =>
                      setEditAddress({ ...editAddress, address1: e.target.value })
                    }
                    className="w-full rounded-lg border border-brand-primary/10 px-3 py-2 text-sm text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    placeholder="123 Main St"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-brand-primary/50 uppercase tracking-wide block mb-1">
                    Apt / Suite
                  </label>
                  <input
                    type="text"
                    value={editAddress.address2 || ''}
                    onChange={(e) =>
                      setEditAddress({
                        ...editAddress,
                        address2: e.target.value || null,
                      })
                    }
                    className="w-full rounded-lg border border-brand-primary/10 px-3 py-2 text-sm text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    placeholder="Apt 4B"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-brand-primary/50 uppercase tracking-wide block mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={editAddress.city}
                      onChange={(e) =>
                        setEditAddress({ ...editAddress, city: e.target.value })
                      }
                      className="w-full rounded-lg border border-brand-primary/10 px-3 py-2 text-sm text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      placeholder="Gainesville"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-brand-primary/50 uppercase tracking-wide block mb-1">
                      State *
                    </label>
                    <select
                      value={editAddress.state}
                      onChange={(e) =>
                        setEditAddress({ ...editAddress, state: e.target.value })
                      }
                      className="w-full rounded-lg border border-brand-primary/10 px-3 py-2 text-sm text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-white"
                    >
                      <option value="">--</option>
                      {US_STATES.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-brand-primary/50 uppercase tracking-wide block mb-1">
                      ZIP *
                    </label>
                    <input
                      type="text"
                      value={editAddress.zipCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 5)
                        setEditAddress({ ...editAddress, zipCode: val })
                      }}
                      className="w-full rounded-lg border border-brand-primary/10 px-3 py-2 text-sm text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      placeholder="32601"
                      maxLength={5}
                      inputMode="numeric"
                    />
                  </div>
                </div>

                {saveError && (
                  <p className="text-sm text-red-600">{saveError}</p>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    isLoading={isSaving}
                  >
                    Save Address
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelEditing}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Physical Measurements (read-only) */}
          <div className="rounded-xl border border-brand-primary/5 bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-brand-primary/40" />
              <h2 className="font-display text-lg font-semibold text-brand-primary">
                Physical Measurements
              </h2>
            </div>
            {hasMeasurements ? (
              <div className="grid grid-cols-3 gap-4">
                {profile.measurements.height !== null && (
                  <div>
                    <span className="text-xs font-medium text-brand-primary/50 uppercase tracking-wide block mb-1">
                      Height
                    </span>
                    <span className="text-sm text-brand-primary">
                      {formatHeight(profile.measurements.height)}
                    </span>
                  </div>
                )}
                {profile.measurements.weight !== null && (
                  <div>
                    <span className="text-xs font-medium text-brand-primary/50 uppercase tracking-wide block mb-1">
                      Weight
                    </span>
                    <span className="text-sm text-brand-primary">
                      {profile.measurements.weight} lbs
                    </span>
                  </div>
                )}
                {profile.measurements.bmi !== null && (
                  <div>
                    <span className="text-xs font-medium text-brand-primary/50 uppercase tracking-wide block mb-1">
                      BMI
                    </span>
                    <span className="text-sm text-brand-primary">
                      {profile.measurements.bmi.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-brand-primary/50">
                No measurements on file
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
