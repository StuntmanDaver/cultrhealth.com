'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const MC_ACTION = 'https://cultrhealth.us1.list-manage.com/subscribe/post?u=feb3e322fcd1b7817968380f6&id=986a43eebd&f_id=00a9c2e1f0';

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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Listen for iframe load after form submission
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      if (isSubmitting) {
        setIsSubmitting(false);
        setShowSuccess(true);
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, [isSubmitting]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!smsConsent) {
      setError('Please agree to receive SMS messages to continue.');
      return;
    }

    if (!formData.email || !formData.phone) {
      setError('Please fill in all required fields.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    // Submit the native form to the hidden iframe
    formRef.current?.submit();
  };

  if (showSuccess) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <div className="inline-block flex flex-col items-center">
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
            <div 
              className="text-[#FDFBF7]/90 mt-4 text-xs md:text-sm tracking-widest font-light" 
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Change the CULTR, <span className="italic font-medium">rebrand</span> yourself.
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

  const phoneFormatted = formData.phone.startsWith('+')
    ? formData.phone
    : '+1' + formData.phone.replace(/\D/g, '');

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Hidden iframe for Mailchimp form submission */}
        <iframe
          ref={iframeRef}
          name="mc-iframe"
          style={{ display: 'none' }}
          title="signup"
        />

        {/* Logo */}
        <div className="text-center mb-12 flex flex-col items-center">
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
          <div 
            className="text-[#FDFBF7]/90 mt-4 text-xs md:text-sm tracking-widest font-light" 
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Change the CULTR, <span className="italic font-medium">rebrand</span> yourself.
          </div>
        </div>

        {/* Form — standard POST to Mailchimp via hidden iframe */}
        <form
          ref={formRef}
          action={MC_ACTION}
          method="POST"
          target="mc-iframe"
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div>
            <input
              type="email"
              name="EMAIL"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Email Address"
              required
              disabled={isSubmitting}
              className="w-full bg-transparent border-b border-[#FDFBF7]/30 py-3 text-[#FDFBF7] placeholder:text-[#FDFBF7]/50 focus:outline-none focus:border-[#FDFBF7] transition-colors"
            />
          </div>

          <div>
            <input
              type="tel"
              name="_phone_display"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Phone Number"
              required
              disabled={isSubmitting}
              className="w-full bg-transparent border-b border-[#FDFBF7]/30 py-3 text-[#FDFBF7] placeholder:text-[#FDFBF7]/50 focus:outline-none focus:border-[#FDFBF7] transition-colors"
            />
            {/* Hidden fields send formatted phone to Mailchimp */}
            <input type="hidden" name="SMSPHONE" value={phoneFormatted} />
            <input type="hidden" name="SMSPHONE[country]" value="US" />
          </div>

          <div>
            <input
              type="text"
              name="FNAME"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              placeholder="First Name"
              disabled={isSubmitting}
              className="w-full bg-transparent border-b border-[#FDFBF7]/30 py-3 text-[#FDFBF7] placeholder:text-[#FDFBF7]/50 focus:outline-none focus:border-[#FDFBF7] transition-colors"
            />
          </div>

          <div>
            <input
              type="text"
              name="LNAME"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              placeholder="Last Name"
              disabled={isSubmitting}
              className="w-full bg-transparent border-b border-[#FDFBF7]/30 py-3 text-[#FDFBF7] placeholder:text-[#FDFBF7]/50 focus:outline-none focus:border-[#FDFBF7] transition-colors"
            />
          </div>

          {/* SMS Consent — name must match Mailchimp's expected field */}
          <div className="flex items-start gap-3 pt-2">
            <input
              type="checkbox"
              id="sms-consent"
              name="mc-SMSPHONE-ack"
              value="true"
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

          {/* Honeypot for bot protection */}
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

        <div className="mt-10 text-center space-y-2">
          <p className="text-[#FDFBF7]/60 text-xs tracking-[0.15em] uppercase font-raleway">
            Building the Next Neuralink™ API
          </p>
          <p className="text-[#FDFBF7]/50 text-xs tracking-[0.08em]">
            Official Partner of{' '}
            <a
              href="https://prenuvo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#FDFBF7]/70 hover:text-[#FDFBF7] transition-colors underline underline-offset-2"
            >
              Prenuvo
            </a>
          </p>
        </div>

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
