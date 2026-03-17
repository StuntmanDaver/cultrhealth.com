'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FlaskConical, X } from 'lucide-react';

const SIPHOX_EMBED_URL =
  'https://home.siphoxhealth.com/embedded/biomarkers?bg=ddedd8&c=229335&bc=29490b';

/**
 * Inline link that opens a modal with the SiPhox biomarker explainer iframe.
 *
 * Usage:
 *   <BiomarkerExplainerLink />                    — renders "See what we test ›"
 *   <BiomarkerExplainerLink label="View biomarkers" />
 *   <BiomarkerExplainerLink variant="icon" />     — renders just a flask icon
 */
export default function BiomarkerExplainerLink({
  label = 'See what we test ›',
  variant = 'text',
  className = '',
}: {
  label?: string;
  variant?: 'text' | 'icon';
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === 'icon'
            ? `inline-flex items-center justify-center w-5 h-5 rounded-full bg-cultr-sage/40 hover:bg-cultr-sage transition-colors ${className}`
            : `inline-flex items-center gap-1 text-xs font-medium text-cultr-forest hover:text-cultr-forestDark underline underline-offset-2 decoration-cultr-sage hover:decoration-cultr-forest transition-colors ${className}`
        }
        aria-label="View biomarker details"
      >
        {variant === 'icon' ? (
          <FlaskConical className="w-3 h-3 text-cultr-forest" />
        ) : (
          label
        )}
      </button>

      {open && <BiomarkerModal onClose={() => setOpen(false)} />}
    </>
  );
}

/** Portal-rendered modal so it escapes parent transforms (ScrollReveal, PricingCard scale) */
function BiomarkerModal({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cultr-sage/30 shrink-0">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-cultr-forest" />
            <h3 className="font-display font-bold text-cultr-forest text-lg">
              Biomarkers We Test
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-cultr-sage/30 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-cultr-text" />
          </button>
        </div>

        {/* Iframe */}
        <div className="flex-1 min-h-0">
          <iframe
            src={SIPHOX_EMBED_URL}
            title="SiPhox Health — Biomarkers We Test"
            className="w-full h-full"
            style={{ border: 'none', minHeight: '60vh' }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
