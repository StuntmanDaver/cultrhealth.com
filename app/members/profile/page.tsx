'use client'

import { useState, useEffect } from 'react'
import { US_STATES } from '@/lib/config/us-states'
import { MapPin, Check, Pencil, User } from 'lucide-react'
import Button from '@/components/ui/Button'

interface ShippingAddress {
  address1: string
  address2: string
  city: string
  state: string
  zipCode: string
}

interface PatientData {
  firstName: string
  lastName: string
  email: string
  phone: string
  shippingAddress: ShippingAddress | null
}

export default function MemberProfilePage() {
  const [patient, setPatient] = useState<PatientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [editAddress, setEditAddress] = useState<ShippingAddress>({
    address1: '', address2: '', city: '', state: '', zipCode: '',
  })

  useEffect(() => {
    fetch('/api/member/profile')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.patient) setPatient(data.patient)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const startEdit = () => {
    setEditAddress({
      address1: patient?.shippingAddress?.address1 || '',
      address2: patient?.shippingAddress?.address2 || '',
      city: patient?.shippingAddress?.city || '',
      state: patient?.shippingAddress?.state || '',
      zipCode: patient?.shippingAddress?.zipCode || '',
    })
    setSaveError(null)
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!editAddress.address1 || !editAddress.city || !editAddress.state || !editAddress.zipCode) {
      setSaveError('Street, city, state, and ZIP are required.')
      return
    }
    setIsSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/member/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingAddress: editAddress }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to save')
      setPatient(p => p ? { ...p, shippingAddress: { ...editAddress } } : p)
      setIsEditing(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save address')
    } finally {
      setIsSaving(false)
    }
  }

  const hasAddress = patient?.shippingAddress?.address1 || patient?.shippingAddress?.city

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 space-y-4 animate-pulse">
        <div className="h-7 w-32 bg-brand-primary/10 rounded" />
        <div className="h-52 bg-brand-primary/10 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-primary">Profile</h1>
        <p className="text-sm text-brand-primary/50 mt-1">Manage your shipping address.</p>
      </div>

      {/* Personal info (read-only) */}
      {patient && (
        <div className="rounded-2xl border border-brand-primary/10 bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-brand-primary/40" />
            <h2 className="font-display text-base font-semibold text-brand-primary">Account</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-primary/50">Name</span>
              <span className="text-brand-primary font-medium">{patient.firstName} {patient.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-primary/50">Email</span>
              <span className="text-brand-primary font-medium">{patient.email}</span>
            </div>
            {patient.phone && (
              <div className="flex justify-between">
                <span className="text-brand-primary/50">Phone</span>
                <span className="text-brand-primary font-medium">{patient.phone}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shipping address */}
      <div className="rounded-2xl border border-brand-primary/10 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-primary/40" />
            <h2 className="font-display text-base font-semibold text-brand-primary">Shipping Address</h2>
          </div>
          {!isEditing && hasAddress && (
            <button
              onClick={startEdit}
              className="flex items-center gap-1 text-sm text-brand-primary/50 hover:text-brand-primary transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          )}
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-100 px-3 py-2 mb-4">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">Address updated</span>
          </div>
        )}

        {!isEditing && (
          hasAddress ? (
            <div className="text-sm text-brand-primary space-y-0.5">
              <p>{patient!.shippingAddress!.address1}</p>
              {patient!.shippingAddress!.address2 && <p>{patient!.shippingAddress!.address2}</p>}
              <p>{patient!.shippingAddress!.city}, {patient!.shippingAddress!.state} {patient!.shippingAddress!.zipCode}</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-brand-primary/50 mb-3">No address on file</p>
              <Button variant="secondary" size="sm" onClick={startEdit}>Add Address</Button>
            </div>
          )
        )}

        {isEditing && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-brand-primary/50 uppercase tracking-wide block mb-1">Street Address *</label>
              <input
                type="text"
                value={editAddress.address1}
                onChange={e => setEditAddress({ ...editAddress, address1: e.target.value })}
                placeholder="123 Main St"
                className="w-full rounded-lg border border-brand-primary/10 px-3 py-2 text-sm text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-brand-primary/50 uppercase tracking-wide block mb-1">Apt / Suite</label>
              <input
                type="text"
                value={editAddress.address2}
                onChange={e => setEditAddress({ ...editAddress, address2: e.target.value })}
                placeholder="Apt 4B"
                className="w-full rounded-lg border border-brand-primary/10 px-3 py-2 text-sm text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-brand-primary/50 uppercase tracking-wide block mb-1">City *</label>
                <input
                  type="text"
                  value={editAddress.city}
                  onChange={e => setEditAddress({ ...editAddress, city: e.target.value })}
                  placeholder="Gainesville"
                  className="w-full rounded-lg border border-brand-primary/10 px-3 py-2 text-sm text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-brand-primary/50 uppercase tracking-wide block mb-1">State *</label>
                <select
                  value={editAddress.state}
                  onChange={e => setEditAddress({ ...editAddress, state: e.target.value })}
                  className="w-full rounded-lg border border-brand-primary/10 px-3 py-2 text-sm text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-white"
                >
                  <option value="">--</option>
                  {US_STATES.map(s => <option key={s.code} value={s.code}>{s.code}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-brand-primary/50 uppercase tracking-wide block mb-1">ZIP *</label>
                <input
                  type="text"
                  value={editAddress.zipCode}
                  onChange={e => setEditAddress({ ...editAddress, zipCode: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                  placeholder="32601"
                  maxLength={5}
                  inputMode="numeric"
                  className="w-full rounded-lg border border-brand-primary/10 px-3 py-2 text-sm text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
            </div>

            {saveError && <p className="text-sm text-red-600">{saveError}</p>}

            <div className="flex gap-2 pt-1">
              <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving}>
                Save Address
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
