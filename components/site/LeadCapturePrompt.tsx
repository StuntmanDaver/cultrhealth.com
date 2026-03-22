'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Mail, ArrowRight } from 'lucide-react';

type PromptVariant = 'results' | 'save' | 'next-steps';

const VARIANT_COPY: Record<PromptVariant, { heading: string; subtext: string; cta: string }> = {
  results: {
    heading: 'Email me my results',
    subtext: 'Get a copy of your results and personalized next steps.',
    cta: 'Send Results',
  },
  save: {
    heading: 'Save your calculations',
    subtext: 'Enter your email to save results and get dosing reminders.',
    cta: 'Save & Send',
  },
  'next-steps': {
    heading: 'Get personalized next steps',
    subtext: 'Want a protocol matched to your goals? Enter your email.',
    cta: 'Get Next Steps',
  },
};

interface LeadCapturePromptProps {
  variant?: PromptVariant;
  source?: string;
  className?: string;
}

export function LeadCapturePrompt({ variant = 'next-steps', source, className }: LeadCapturePromptProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const copy = VARIANT_COPY[variant];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: source || variant }),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'lead_capture_submitted', {
          variant,
          source: source || variant,
        });
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className={cn('rounded-2xl glass-card border-gradient p-6 text-center', className)}>
        <p className="text-cultr-forest font-display font-bold">Check your inbox!</p>
        <p className="text-sm text-cultr-textMuted mt-1">We sent your personalized results.</p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-2xl glass-card border-gradient p-6', className)}>
      <div className="flex items-center gap-2 mb-2">
        <Mail className="w-4 h-4 text-cultr-forest" />
        <h3 className="font-display font-bold text-cultr-forest text-sm">{copy.heading}</h3>
      </div>
      <p className="text-xs text-cultr-textMuted mb-4">{copy.subtext}</p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          required
          className="flex-1 rounded-full border border-cultr-sage/40 bg-white px-4 py-2 text-sm text-cultr-forest placeholder:text-cultr-textMuted/50 focus:outline-none focus:ring-2 focus:ring-cultr-sage/50"
        />
        <Button size="sm" isLoading={status === 'loading'} className="shrink-0">
          {copy.cta} <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </form>

      {status === 'error' && (
        <p className="text-xs text-red-600 mt-2">Something went wrong. Please try again.</p>
      )}
    </div>
  );
}
