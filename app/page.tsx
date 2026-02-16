'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function WaitlistPage() {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
  });
  const [smsConsent, setSmsConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!smsConsent) {
      setError('Please agree to receive SMS messages to continue.');
      setIsSubmitting(false);
      return;
    }

    const params = new URLSearchParams({
      u: 'feb3e322fcd1b7817968380f6',
      id: '986a43eebd',
      f_id: '00a9c2e1f0',
      EMAIL: formData.email,
      FNAME: formData.firstName,
      LNAME: formData.lastName,
      SMSPHONE: formData.phone,
      'SMSPHONE[country]': 'US',
      'mc-SMSPHONE-ack': 'true',
    });

    try {
      await new Promise<void>((resolve, reject) => {
        const callbackName = 'mc_cb_' + Date.now();

        const timeout = setTimeout(() => {
          cleanup();
          reject(new Error('Request timed out. Please try again.'));
        }, 10000);

        function cleanup() {
          clearTimeout(timeout);
          delete (window as Record<string, unknown>)[callbackName];
          const el = document.getElementById(callbackName);
          if (el) el.remove();
        }

        (window as Record<string, unknown>)[callbackName] = (response: { result: string; msg: string }) => {
          cleanup();
          if (response.result === 'success') {
            resolve();
          } else {
            const msg = response.msg || 'Something went wrong';
            if (msg.includes('already subscribed')) {
              resolve();
            } else {
              reject(new Error(msg.replace(/<[^>]*>/g, '')));
            }
          }
        };

        const script = document.createElement('script');
        script.id = callbackName;
        script.src = `https://cultrhealth.us1.list-manage.com/subscribe/post-json?${params.toString()}&c=${callbackName}`;
        document.head.appendChild(script);
      });

      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, smsConsent]);

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
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="First Name"
              disabled={isSubmitting}
              className="w-full bg-transparent border-b border-[#FDFBF7]/30 py-3 text-[#FDFBF7] placeholder:text-[#FDFBF7]/50 focus:outline-none focus:border-[#FDFBF7] transition-colors"
            />
          </div>

          <div>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Last Name"
              disabled={isSubmitting}
              className="w-full bg-transparent border-b border-[#FDFBF7]/30 py-3 text-[#FDFBF7] placeholder:text-[#FDFBF7]/50 focus:outline-none focus:border-[#FDFBF7] transition-colors"
            />
          </div>

          {/* SMS Consent */}
          <div className="flex items-start gap-3 pt-2">
            <input
              type="checkbox"
              id="sms-consent"
              checked={smsConsent}
              onChange={(e) => setSmsConsent(e.target.checked)}
              disabled={isSubmitting}
              className="mt-1 h-4 w-4 rounded border-[#FDFBF7]/30 accent-[#FDFBF7] flex-shrink-0"
            />
            <label htmlFor="sms-consent" className="text-[#FDFBF7]/50 text-xs leading-relaxed">
              CULTR - By providing your phone number and checking the box, you agree to receive promotional and marketing messages, notifications, and customer service communications from CULTR. Message and data rates may apply. Consent is not a condition of purchase. Message frequency varies. Text HELP for help. Text STOP to cancel. See{' '}
              <a href="http://eepurl.com/jzxj0E" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#FDFBF7] transition-colors">Terms</a>
              {' '}and{' '}
              <a href="http://eepurl.com/jzxjZs" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#FDFBF7] transition-colors">Privacy Policy</a>
            </label>
          </div>

          {/* Honeypot */}
          <div aria-hidden="true" style={{ position: 'absolute', left: '-5000px' }}>
            <input type="text" name="b_feb3e322fcd1b7817968380f6_986a43eebd" tabIndex={-1} defaultValue="" />
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
          <span className="mx-2">&middot;</span>
          <Link href="/legal/terms" className="hover:text-[#FDFBF7] transition-colors">
            Terms
          </Link>
        </div>

        {/* Copyright */}
        <p className="mt-8 text-center text-xs text-[#FDFBF7]/40">
          &copy; {new Date().getFullYear()} CULTR. All rights reserved.
        </p>
      </div>
    </main>
  );
}
