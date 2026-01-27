'use client';

import { useState } from 'react';
import { ArrowRight, Loader2, CheckCircle } from 'lucide-react';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    setStatus('loading');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'newsletter' }),
      });

      if (response.ok) {
        setStatus('success');
        setMessage('Welcome to the club! Check your inbox.');
        setEmail('');
      } else {
        const data = await response.json();
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <section className="py-24 px-6 bg-cultr-offwhite">
      <div className="max-w-2xl mx-auto text-center">
        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
          Join the CULTR Health Club
        </h2>
        <p className="text-cultr-textMuted mb-8">
          Latest offers, health insights, and exclusive content delivered to your inbox.
        </p>

        {/* Form */}
        {status === 'success' ? (
          <div className="flex items-center justify-center gap-3 py-4 px-6 bg-cultr-sage border border-cultr-forest/20 rounded-full">
            <CheckCircle className="w-5 h-5 text-cultr-forest" />
            <span className="text-cultr-forest font-medium">{message}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <div className="flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="
                  w-full px-4 py-3 rounded-full
                  bg-white border border-cultr-sage
                  text-cultr-text placeholder-cultr-textMuted
                  focus:outline-none focus:border-cultr-forest focus:ring-1 focus:ring-cultr-forest/50
                  transition-colors
                "
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="
                inline-flex items-center justify-center gap-2
                px-6 py-3 rounded-full
                bg-cultr-forest text-white font-medium
                hover:bg-cultr-forestDark
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
                group
              "
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  Subscribe
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Error Message */}
        {status === 'error' && (
          <p className="mt-4 text-red-500 text-sm">{message}</p>
        )}

        {/* Microcopy */}
        <p className="mt-6 text-xs text-cultr-textMuted">
          No spam, ever. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
