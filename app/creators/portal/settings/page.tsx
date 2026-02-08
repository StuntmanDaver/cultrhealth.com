'use client'

import { useState, useEffect } from 'react'
import { useCreator } from '@/lib/contexts/CreatorContext'
import { Settings, Save, User, AtSign, Phone, FileText } from 'lucide-react'

export default function SettingsPage() {
  const { creator, refreshAll, loading } = useCreator()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [socialHandle, setSocialHandle] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Initialize form when creator loads
  useEffect(() => {
    if (creator && !initialized) {
      setFullName(creator.full_name || '')
      setPhone(creator.phone || '')
      setSocialHandle(creator.social_handle || '')
      setBio(creator.bio || '')
      setInitialized(true)
    }
  }, [creator, initialized])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    try {
      const res = await fetch('/api/creators/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          social_handle: socialHandle,
          bio,
        }),
      })

      if (res.ok) {
        setSaved(true)
        await refreshAll()
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error('Failed to save profile:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl animate-pulse">
        <div className="h-8 w-32 bg-stone-100 rounded" />
        <div className="h-80 bg-stone-100 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-cultr-forest">Settings</h1>
        <p className="text-sm text-cultr-textMuted mt-1">
          Update your creator profile information.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5">
        <h2 className="font-display font-bold text-cultr-forest flex items-center gap-2 mb-2">
          <Settings className="w-5 h-5" /> Profile Settings
        </h2>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-cultr-forest/70 mb-1.5">
            <User className="w-3.5 h-3.5" /> Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-white border border-brand-primary/20 rounded-lg px-4 py-3 text-sm text-cultr-forest focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-cultr-forest/70 mb-1.5">
            <Phone className="w-3.5 h-3.5" /> Phone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-white border border-brand-primary/20 rounded-lg px-4 py-3 text-sm text-cultr-forest focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-cultr-forest/70 mb-1.5">
            <AtSign className="w-3.5 h-3.5" /> Social Handle
          </label>
          <input
            type="text"
            value={socialHandle}
            onChange={(e) => setSocialHandle(e.target.value)}
            placeholder="@yourhandle"
            className="w-full bg-white border border-brand-primary/20 rounded-lg px-4 py-3 text-sm text-cultr-forest placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-cultr-forest/70 mb-1.5">
            <FileText className="w-3.5 h-3.5" /> Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself and your audience..."
            rows={4}
            className="w-full bg-white border border-brand-primary/20 rounded-lg px-4 py-3 text-sm text-cultr-forest placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 resize-none"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-cultr-forest text-white rounded-lg text-sm font-medium hover:bg-cultr-forestDark transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && (
            <span className="text-sm text-emerald-600 font-medium animate-fade-in">
              Changes saved
            </span>
          )}
        </div>
      </form>

      {/* Account Info (read-only) */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6">
        <h2 className="font-display font-bold text-cultr-forest mb-4">Account Info</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-cultr-textMuted">Email</span>
            <span className="text-cultr-forest font-medium">{creator?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-cultr-textMuted">Status</span>
            <span className="text-cultr-forest font-medium capitalize">{creator?.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-cultr-textMuted">Member Since</span>
            <span className="text-cultr-forest font-medium">
              {creator?.created_at ? new Date(creator.created_at).toLocaleDateString() : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-cultr-textMuted">Email Verified</span>
            <span className={`font-medium ${creator?.email_verified ? 'text-emerald-600' : 'text-amber-600'}`}>
              {creator?.email_verified ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
