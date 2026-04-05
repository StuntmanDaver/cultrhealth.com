'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CONSENT_DOCUMENT, TIER_THERAPY_IDS } from '@/lib/config/compliance';
import { FDAStatusBadge } from '@/components/compliance/FDAStatusBadge';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsent: () => void;
  tierSlug: string;
}

export function ConsentModal({ isOpen, onClose, onConsent, tierSlug }: ConsentModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false);
      setIsChecked(false);
      setShowTopShadow(false);
      setShowBottomShadow(true);
    }
  }, [isOpen]);

  // IntersectionObserver to detect when user scrolls to bottom
  useEffect(() => {
    if (!isOpen || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasScrolledToBottom(true);
        }
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.1,
      }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isOpen]);

  // Scroll shadow indicators
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowTopShadow(el.scrollTop > 8);
    setShowBottomShadow(el.scrollTop + el.clientHeight < el.scrollHeight - 8);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const therapyIds = TIER_THERAPY_IDS[tierSlug] ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-primary/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-brand-cream rounded-2xl shadow-xl flex flex-col max-h-[90vh] sm:max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-primary/10">
          <h2
            id="consent-modal-title"
            className="font-fraunces text-xl font-semibold text-brand-primary"
          >
            {CONSENT_DOCUMENT.title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-brand-primary/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-brand-primary" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="relative flex-1 min-h-0">
          {/* Top scroll shadow */}
          <div
            className={cn(
              'absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-brand-cream to-transparent z-10 pointer-events-none transition-opacity duration-200',
              showTopShadow ? 'opacity-100' : 'opacity-0'
            )}
          />

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="overflow-y-auto px-6 py-5 space-y-5 max-h-[calc(90vh-200px)] sm:max-h-[calc(80vh-200px)]"
          >
            {CONSENT_DOCUMENT.sections.map((section, i) => (
              <div key={i}>
                <h3 className="font-fraunces text-lg font-semibold text-brand-primary mb-1.5">
                  {section.heading}
                </h3>
                <p className="font-body text-sm leading-relaxed text-brand-primary/80">
                  {section.content}
                </p>
              </div>
            ))}

            {/* FDA Status section — only if tier has therapies */}
            {therapyIds.length > 0 && (
              <div>
                <h3 className="font-fraunces text-lg font-semibold text-brand-primary mb-2">
                  FDA Status of Selected Therapies
                </h3>
                <p className="font-body text-sm leading-relaxed text-brand-primary/80 mb-3">
                  The following therapies are available on your selected plan. Please review their regulatory status:
                </p>
                <div className="space-y-3">
                  {therapyIds.map((id) => (
                    <FDAStatusBadge key={id} therapyId={id} showDisclaimer />
                  ))}
                </div>
              </div>
            )}

            {/* Sentinel div for IntersectionObserver */}
            <div ref={sentinelRef} className="h-px" aria-hidden="true" />
          </div>

          {/* Bottom scroll shadow */}
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-brand-cream to-transparent z-10 pointer-events-none transition-opacity duration-200',
              showBottomShadow ? 'opacity-100' : 'opacity-0'
            )}
          />
        </div>

        {/* Footer — checkbox + button */}
        <div className="px-6 py-4 border-t border-brand-primary/10 space-y-3">
          <label
            className={cn(
              'flex items-start gap-3 cursor-pointer select-none',
              !hasScrolledToBottom && 'opacity-50 cursor-not-allowed'
            )}
          >
            <input
              type="checkbox"
              checked={isChecked}
              disabled={!hasScrolledToBottom}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-brand-primary/30 text-brand-primary focus:ring-brand-primary/30"
            />
            <span className="font-body text-sm text-brand-primary/80">
              {CONSENT_DOCUMENT.checkboxLabel}
            </span>
          </label>

          <button
            onClick={onConsent}
            disabled={!isChecked}
            className={cn(
              'w-full py-3 rounded-full font-body text-sm font-semibold transition-colors',
              isChecked
                ? 'bg-brand-primary text-brand-cream hover:bg-forest-light'
                : 'bg-brand-primary/20 text-brand-primary/40 cursor-not-allowed'
            )}
          >
            {CONSENT_DOCUMENT.buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
