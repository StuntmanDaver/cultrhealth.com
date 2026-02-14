'use client';

import { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  Send,
} from 'lucide-react';
import type { PlanTier } from '@/lib/config/plans';
import { TierGate } from '@/components/library/TierGate';

const TIME_OPTIONS = ['Morning (8am-12pm)', 'Afternoon (12pm-5pm)', 'Evening (5pm-8pm)'];
const REASON_OPTIONS = ['Follow-up', 'New concern', 'Protocol adjustment', 'Lab review', 'Other'];

interface ScheduleConsultProps {
  tier: PlanTier | null;
}

export function ScheduleConsult({ tier }: ScheduleConsultProps) {
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Minimum date is tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/member/consult-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredDate, preferredTime, reason, notes }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Failed to submit request');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-display font-bold text-stone-900 mb-4">
        Schedule a Consultation
      </h3>

      <TierGate
        requiredTier="core"
        currentTier={tier}
        upgradeMessage="Upgrade to Core to schedule consultations."
      >
        {submitted ? (
          <div className="bg-white border border-emerald-200 rounded-2xl p-8 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h4 className="text-stone-900 font-medium text-lg">Request Submitted</h4>
            <p className="text-stone-500 text-sm mt-2">
              Our care team will contact you within 24 hours to confirm your appointment.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setPreferredDate('');
                setPreferredTime('');
                setReason('');
                setNotes('');
              }}
              className="mt-4 text-sm text-stone-500 hover:text-stone-700 underline underline-offset-2"
            >
              Schedule another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                <Calendar className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                Preferred Date
              </label>
              <input
                type="date"
                required
                min={minDate}
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent"
              />
            </div>

            {/* Time Preference */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                <Clock className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                Preferred Time
              </label>
              <div className="flex flex-wrap gap-2">
                {TIME_OPTIONS.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setPreferredTime(time)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      preferredTime === time
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Reason for Visit
              </label>
              <select
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent bg-white"
              >
                <option value="">Select a reason...</option>
                {REASON_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Additional Notes <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any details you'd like to share with your provider..."
                className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent resize-none placeholder:text-stone-400"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !preferredDate || !preferredTime || !reason}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {submitting ? 'Submitting...' : 'Request Consultation'}
            </button>
          </form>
        )}
      </TierGate>
    </div>
  );
}
