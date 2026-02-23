'use client'

import { useState } from 'react'
import { LifeBuoy, Send, CheckCircle, Mail, MessageSquare } from 'lucide-react'

const CATEGORIES = [
  'General Question',
  'Technical Issue',
  'Payout Question',
  'Commission Dispute',
  'Content Approval',
  'Account Issue',
]

export default function SupportPage() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/creators/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, category }),
      })
      if (res.ok) {
        setSubmitted(true)
        setSubject('')
        setMessage('')
      }
    } catch (err) {
      console.error('Failed to submit ticket:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-cultr-forest">Support</h1>
        <p className="text-sm text-cultr-textMuted mt-1">
          Get help with your creator account, commissions, or content.
        </p>
      </div>

      {/* Contact Options */}
      <div className="grid md:grid-cols-2 gap-4">
        <a
          href="mailto:creators@cultrhealth.com"
          className="bg-white border border-stone-200 rounded-xl p-5 hover:border-cultr-forest transition-colors"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg grad-mint flex items-center justify-center">
              <Mail className="w-[18px] h-[18px] text-cultr-forest" />
            </div>
            <p className="font-medium text-cultr-forest">Email Us</p>
          </div>
          <p className="text-sm text-cultr-textMuted">creators@cultrhealth.com</p>
          <p className="text-xs text-cultr-textMuted mt-1">Response within 24 hours</p>
        </a>

        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg grad-mint flex items-center justify-center">
              <MessageSquare className="w-[18px] h-[18px] text-cultr-forest" />
            </div>
            <p className="font-medium text-cultr-forest">FAQ</p>
          </div>
          <p className="text-sm text-cultr-textMuted">Check our resources section for answers to common questions.</p>
        </div>
      </div>

      {/* Ticket Form */}
      {submitted ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-emerald-800 mb-2">
            Ticket Submitted
          </h2>
          <p className="text-sm text-emerald-700 mb-4">
            We&apos;ll get back to you within 24 hours.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="text-sm text-emerald-700 font-medium underline"
          >
            Submit another ticket
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
          <h2 className="font-display font-bold text-cultr-forest flex items-center gap-2">
            <LifeBuoy className="w-5 h-5" /> Submit a Ticket
          </h2>

          <div>
            <label className="block text-sm font-medium text-cultr-forest/70 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white border border-brand-primary/20 rounded-lg px-4 py-3 text-sm text-cultr-forest focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-cultr-forest/70 mb-1.5">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              className="w-full bg-white border border-brand-primary/20 rounded-lg px-4 py-3 text-sm text-cultr-forest placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cultr-forest/70 mb-1.5">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue in detail..."
              rows={5}
              className="w-full bg-white border border-brand-primary/20 rounded-lg px-4 py-3 text-sm text-cultr-forest placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !subject.trim() || !message.trim()}
            className="flex items-center gap-2 px-5 py-2.5 grad-dark text-white rounded-lg text-sm font-medium hover:bg-cultr-forestDark transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </form>
      )}
    </div>
  )
}
