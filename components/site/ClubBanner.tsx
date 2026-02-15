'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, CheckCircle, Sparkles } from 'lucide-react';

export function ClubBanner() {
  const router = useRouter();
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
        body: JSON.stringify({ email, source: 'club' }),
      });

      if (response.ok) {
        setStatus('success');
        setMessage("You're in! Taking you to our therapies...");
        setEmail('');
        setTimeout(() => router.push('/therapies'), 800);
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
    <div className="w-full p-8 md:p-10 rounded-2xl bg-cultr-mint border border-cultr-sage">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-cultr-forest" />
            <span className="text-xs font-display font-bold tracking-widest text-cultr-forest uppercase">Free</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-display font-bold text-cultr-forest mb-2">
            CULTR Club
          </h3>
          <p className="text-cultr-textMuted text-sm md:text-base max-w-lg">
            Get access to our protocol library, peptide calculators, cycle guides, and education content. No credit card required.
          </p>
        </div>

        <div className="flex-shrink-0 md:w-[400px]">
          {status === 'success' ? (
            <div className="flex items-center gap-3 py-4 px-6 bg-cultr-sage border border-cultr-forest/20 rounded-full">
              <CheckCircle className="w-5 h-5 text-cultr-forest shrink-0" />
              <span className="text-cultr-forest font-medium text-sm">{message}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
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
                    transition-colors text-sm
                  "
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="
                  inline-flex items-center justify-center gap-2
                  px-6 py-3 rounded-full whitespace-nowrap
                  bg-cultr-forest text-white font-medium text-sm
                  hover:bg-cultr-forestDark
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors group
                "
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    Join Free
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {status === 'error' && (
            <p className="mt-3 text-red-500 text-sm">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
