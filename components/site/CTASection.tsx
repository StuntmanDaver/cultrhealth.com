'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export function CTASection({
  title = "Stop guessing. Start optimizing.",
  subtitle = "Take the 2-minute quiz to find your protocol.",
  ctaText = "Take the Quiz",
  ctaLink = "/quiz"
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
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
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error('Newsletter submission fails:', err);
      setStatus('error');
    }
  };

  return (
    <section className="py-12 px-6 grad-dark-glow overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          {/* Left - CTA Content */}
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-left">
              <h2 className="text-lg md:text-xl font-display font-bold text-white leading-tight">{title}</h2>
              <p className="text-xs text-white/60 mt-0.5 max-w-[280px]">{subtitle}</p>
            </div>
          </div>

          {/* Center - Newsletter */}
          <div className="flex items-center gap-4 flex-1 justify-center">
            <span className="text-white font-display text-sm whitespace-nowrap hidden lg:block">
              Stay in the loop.
            </span>
            {status === 'success' ? (
              <div className="text-white text-sm font-medium bg-white/10 px-6 py-2.5 rounded-full border border-white/20">
                Thanks for joining the <span className="font-display font-bold tracking-[0.08em]">CULTR</span>.
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <label htmlFor="cta-newsletter-email" className="sr-only">Email address</label>
                <input
                  id="cta-newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={status === 'loading'}
                  className="w-56 md:w-64 px-4 py-2.5 border border-white/20 bg-white/8 backdrop-blur-sm rounded-lg text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 focus:bg-white/12 transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-5 py-2.5 grad-white text-cultr-forest text-sm font-medium rounded-full hover:bg-white/90 transition-all whitespace-nowrap disabled:opacity-50"
                >
                  {status === 'loading' ? 'Joining...' : 'Subscribe'}
                </button>
              </form>
            )}
            {status === 'error' && (
              <p className="text-[10px] text-red-300 mt-1">Something went wrong. Try again.</p>
            )}
          </div>

          {/* Right - CULTR Logo */}
          <span className="text-4xl md:text-5xl font-display font-bold text-white tracking-[0.08em] shrink-0">
            CULTR
          </span>
        </div>
      </div>
    </section>
  );
}
