'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function WaitlistPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    social_handle: '',
    treatment_reason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          turnstileToken: 'pending-setup',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <div className="inline-block mb-12">
            <div className="mb-0">
              <Image
                src="/cultr-logotype-cream.png"
                alt="CULTR"
                width={180}
                height={50}
                priority
                className="w-auto h-14"
              />
            </div>
            <div className="text-[#FDFBF7] text-xs font-raleway tracking-[0.3em] uppercase text-right pr-1 mt-1">
              Health
            </div>
          </div>
          <h1 className="text-2xl font-light tracking-wide text-[#FDFBF7] mb-4">
            You&apos;re on the list
          </h1>
          <p className="text-[#FDFBF7]/70 mb-8">
            We&apos;ll be in touch soon with next steps.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-block">
            <div className="mb-0">
              <Image
                src="/cultr-logotype-cream.png"
                alt="CULTR"
                width={180}
                height={50}
                priority
                className="w-auto h-14"
              />
            </div>
            <div className="text-[#FDFBF7] text-xs font-raleway tracking-[0.3em] uppercase text-right pr-1 mt-1">
              Health
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              required
              disabled={isSubmitting}
              className="w-full bg-transparent border-b border-[#FDFBF7]/30 py-3 text-[#FDFBF7] placeholder:text-[#FDFBF7]/50 focus:outline-none focus:border-[#FDFBF7] transition-colors"
            />
          </div>

          <div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              required
              disabled={isSubmitting}
              className="w-full bg-transparent border-b border-[#FDFBF7]/30 py-3 text-[#FDFBF7] placeholder:text-[#FDFBF7]/50 focus:outline-none focus:border-[#FDFBF7] transition-colors"
            />
          </div>

          <div>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              required
              disabled={isSubmitting}
              className="w-full bg-transparent border-b border-[#FDFBF7]/30 py-3 text-[#FDFBF7] placeholder:text-[#FDFBF7]/50 focus:outline-none focus:border-[#FDFBF7] transition-colors"
            />
          </div>

          <div>
            <input
              type="text"
              name="social_handle"
              value={formData.social_handle}
              onChange={handleChange}
              placeholder="Social Handle (optional)"
              disabled={isSubmitting}
              className="w-full bg-transparent border-b border-[#FDFBF7]/30 py-3 text-[#FDFBF7] placeholder:text-[#FDFBF7]/50 focus:outline-none focus:border-[#FDFBF7] transition-colors"
            />
          </div>

          <div>
            <textarea
              name="treatment_reason"
              value={formData.treatment_reason}
              onChange={handleChange}
              placeholder="Why do you want treatment? (optional)"
              rows={3}
              disabled={isSubmitting}
              className="w-full bg-transparent border-b border-[#FDFBF7]/30 py-3 text-[#FDFBF7] placeholder:text-[#FDFBF7]/50 focus:outline-none focus:border-[#FDFBF7] transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-red-300 text-sm text-center">{error}</p>
          )}

          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-[#FDFBF7] text-[#2B4542] font-medium tracking-widest uppercase text-sm hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Joining...' : 'Join Waitlist'}
            </button>
          </div>
        </form>

        {/* Footer Links */}
        <div className="mt-12 text-center text-sm text-[#FDFBF7]/50">
          <Link href="/legal/privacy" className="hover:text-[#FDFBF7] transition-colors">
            Privacy
          </Link>
          <span className="mx-2">·</span>
          <Link href="/legal/terms" className="hover:text-[#FDFBF7] transition-colors">
            Terms
          </Link>
        </div>

        {/* Copyright */}
        <p className="mt-8 text-center text-xs text-[#FDFBF7]/40">
          © {new Date().getFullYear()} CULTR. All rights reserved.
        </p>
      </div>
    </main>
  );
}
