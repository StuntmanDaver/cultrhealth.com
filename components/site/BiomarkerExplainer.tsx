'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FlaskConical, X, Heart, Activity, Dna, Apple, Flame, Shield } from 'lucide-react';

const EASYDRAW_CORE_PANELS = [
  {
    category: 'Heart Health',
    icon: Heart,
    markers: [
      'ApoB:ApoA1 Ratio',
      'Apolipoprotein A1 (ApoA1)',
      'Apolipoprotein B (ApoB)',
      'Cholesterol, Total',
      'HDL Cholesterol',
      'LDL Cholesterol',
      'LDL-C:ApoB Ratio',
      'LDL-C:HDL-C Ratio',
      'Lipoprotein (a)',
      'Total Cholesterol:HDL Ratio',
      'Triglycerides',
      'VLDL Cholesterol',
    ],
  },
  {
    category: 'Hormonal Health',
    icon: Dna,
    markers: [
      'Cortisol:DHEA-S Ratio',
      'Dehydroepiandrosterone Sulfate (DHEA-S)',
      'Estradiol (Sensitive)',
      'Follicle-Stimulating Hormone (FSH)',
      'LH:FSH Ratio',
      'Luteinizing Hormone (LH)',
      'Sex Hormone-Binding Globulin (SHBG)',
      'Testosterone, Free (calc)',
      'Testosterone, Total (Males)',
      'Testosterone:Cortisol Ratio',
    ],
  },
  {
    category: 'Metabolic Health',
    icon: Activity,
    markers: [
      '% Hemoglobin A1C',
      'Albumin',
      'C-Peptide',
      'Estim. Avg Glu (eAG)',
      'Cortisol',
      'Triglycerides:HDL Ratio',
    ],
  },
  {
    category: 'Nutritional',
    icon: Apple,
    markers: [
      '25-(OH) Vitamin D',
      'Ferritin',
    ],
  },
  {
    category: 'Inflammation',
    icon: Flame,
    markers: [
      'High-Sensitivity CRP',
    ],
  },
  {
    category: 'Thyroid Health',
    icon: Shield,
    markers: [
      'Thyroid Stimulating Hormone (TSH)',
    ],
  },
] as const;

const AVAILABLE_UPGRADES = [
  'Metabolic+',
  'Hormone+',
  'Thyroid+',
  'Stress Panel',
  'Energy & Sleep Rhythm Cortisol Test',
  'Biological Age Test',
  'Continuous Glucose Monitor (CGM)',
];

/**
 * Inline link that opens a modal with the SiPhox EasyDraw Core biomarker list.
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

  const totalMarkers = EASYDRAW_CORE_PANELS.reduce((sum, p) => sum + p.markers.length, 0);

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
        <div className="px-6 py-5 border-b border-cultr-sage/30 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-cultr-forest" />
              <h3 className="font-display font-bold text-cultr-forest text-lg">
                SiPhox EasyDraw Core — {totalMarkers} Biomarkers
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
          <p className="text-xs text-cultr-textMuted mt-1">
            Overall assessment of critical heart, metabolic, hormonal, nutritional, inflammation, and thyroid biomarkers
          </p>
        </div>

        {/* Scrollable biomarker list */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {EASYDRAW_CORE_PANELS.map((panel) => {
            const Icon = panel.icon;
            return (
              <div key={panel.category}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-cultr-forest" />
                  <h4 className="text-sm font-display font-bold text-cultr-forest">
                    {panel.category}
                  </h4>
                  <span className="text-[10px] text-cultr-textMuted bg-cultr-sage/30 rounded-full px-2 py-0.5 font-medium">
                    {panel.markers.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pl-6">
                  {panel.markers.map((marker) => (
                    <span key={marker} className="text-sm text-cultr-text py-0.5">
                      {marker}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Program Features */}
          <div className="border-t border-cultr-sage/30 pt-4 mt-4">
            <h4 className="text-sm font-display font-bold text-cultr-forest mb-2">Program Features</h4>
            <ul className="space-y-1 pl-4 text-sm text-cultr-textMuted list-disc">
              <li>Health report with personalized insights</li>
              <li>Personalized Action Plan based on your results, lifestyle, and goals</li>
              <li>Personalized supplement recommendation</li>
              <li>Integration with wearable smart devices</li>
            </ul>
          </div>

          {/* Available Upgrades */}
          <div className="border-t border-cultr-sage/30 pt-4">
            <h4 className="text-sm font-display font-bold text-cultr-forest mb-2">Available Upgrades</h4>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_UPGRADES.map((upgrade) => (
                <span
                  key={upgrade}
                  className="text-xs bg-cultr-sage/20 text-cultr-forest rounded-full px-3 py-1 font-medium"
                >
                  {upgrade}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
