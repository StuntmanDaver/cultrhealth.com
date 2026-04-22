'use client'

import { useState } from 'react'
import { Check, Copy, Download, Printer, Share2 } from 'lucide-react'
import type { DoseUnit } from '@/lib/peptide-calculator'
import { cn } from '@/lib/utils'

type Props = {
  therapyLabel?: string | null
  therapyCompound?: string | null
  vialMg: number
  waterMl: number
  dose: number
  doseUnit: DoseUnit
  drawMl: number
  drawUnitsU100: number
  concentrationMgPerMl: number
  syringeMl?: number | null
  warnings: string[]
  pdfPayload: {
    therapyLabel?: string | null
    therapyCompound?: string | null
    vialMg: number
    waterMl: number
    dose: number
    doseUnit: DoseUnit
    syringeMl?: number | null
    frequency?: string | null
    therapyLengthWeeks?: number | null
  }
}

export function InstructionCard(props: Props) {
  const {
    therapyLabel,
    therapyCompound,
    vialMg,
    waterMl,
    dose,
    doseUnit,
    drawMl,
    drawUnitsU100,
    concentrationMgPerMl,
    syringeMl,
    warnings,
    pdfPayload,
  } = props

  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [shared, setShared] = useState(false)

  const doseDisplay = doseUnit === 'mcg' ? `${Math.round(dose)} mcg` : `${dose.toFixed(3)} mg`
  const drawMlDisplay = drawMl.toFixed(3)
  const drawUnitsDisplay = drawUnitsU100.toFixed(1)

  const instructionText = [
    therapyLabel ? `CULTR Health — ${therapyLabel} dosing instructions` : 'CULTR Health dosing instructions',
    '',
    `1. Mix ${vialMg} mg with ${waterMl} mL bacteriostatic water (${concentrationMgPerMl.toFixed(2)} mg/mL).`,
    `2. For a ${doseDisplay} dose, draw to ${drawUnitsDisplay} units (${drawMlDisplay} mL)${syringeMl ? ` on a ${syringeMl} mL U-100 syringe` : ''}.`,
    `3. Administer per your CULTR Health provider's instructions.`,
    ...(warnings.length ? ['', 'Review before use:', ...warnings.map((w) => `• ${w}`)] : []),
    '',
    'Verify with your CULTR Health provider before dosing.',
  ].join('\n')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(instructionText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Silent — clipboard may be unavailable in older browsers.
    }
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print()
  }

  const handleShare = async () => {
    if (typeof navigator === 'undefined') return
    try {
      // Web Share API is not in every TS DOM lib target, so we feature-detect
      // through a cast and fall back to the clipboard if it's unavailable.
      const shareApi = (navigator as unknown as {
        share?: (data: { title?: string; text?: string }) => Promise<void>
      }).share
      if (typeof shareApi === 'function') {
        await shareApi.call(navigator, {
          title: therapyLabel ? `CULTR ${therapyLabel} dosing` : 'CULTR Health dosing instructions',
          text: instructionText,
        })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(instructionText)
      }
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    } catch {
      // User cancelled or API unavailable.
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const response = await fetch('/api/dosing-calculator/instruction-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pdfPayload),
      })
      if (!response.ok) throw new Error('PDF request failed')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cultr-dosing-instructions${therapyLabel ? '-' + slug(therapyLabel) : ''}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      console.error('PDF download failed', error)
      alert('Could not generate the PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-cultr-sage bg-white shadow-sm print:border-0 print:shadow-none">
      {/* Print-only scoped CSS — hides everything outside the card when window.print() fires. */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .cultr-instruction-card,
          .cultr-instruction-card * {
            visibility: visible !important;
          }
          .cultr-instruction-card {
            position: absolute !important;
            inset: 0 !important;
            padding: 24px !important;
          }
          .cultr-instruction-card .cultr-instruction-actions {
            display: none !important;
          }
        }
      `}</style>

      <div className="cultr-instruction-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-cultr-textMuted">
              Patient instruction card
            </p>
            <h3 className="mt-1 font-display text-lg font-bold text-cultr-text">
              {therapyLabel ? `CULTR Health — ${therapyLabel}` : 'CULTR Health dosing'}
            </h3>
            {therapyCompound && (
              <p className="text-xs text-cultr-textMuted">{therapyCompound}</p>
            )}
          </div>

          <div className="cultr-instruction-actions flex flex-wrap gap-2">
            <ActionButton onClick={handleCopy} label={copied ? 'Copied!' : 'Copy'} icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} />
            <ActionButton onClick={handlePrint} label="Print" icon={<Printer className="h-4 w-4" />} />
            <ActionButton
              onClick={handleDownload}
              label={downloading ? 'Preparing…' : 'PDF'}
              icon={<Download className="h-4 w-4" />}
              disabled={downloading}
            />
            <ActionButton
              onClick={handleShare}
              label={shared ? 'Shared!' : 'Share'}
              icon={shared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            />
          </div>
        </div>

        <ol className="mt-5 space-y-3">
          <Step
            n={1}
            title="Reconstitute the vial"
            body={
              <>
                Mix <strong>{vialMg} mg</strong> with <strong>{waterMl} mL</strong> bacteriostatic
                water ({concentrationMgPerMl.toFixed(2)} mg/mL).
              </>
            }
          />
          <Step
            n={2}
            title="Measure your dose"
            body={
              <>
                For a <strong>{doseDisplay}</strong> dose, draw to{' '}
                <strong>{drawUnitsDisplay} units</strong> (<strong>{drawMlDisplay} mL</strong>)
                {syringeMl ? <> on a {syringeMl} mL U-100 insulin syringe</> : null}.
              </>
            }
          />
          <Step
            n={3}
            title="Administer"
            body={<>Follow your CULTR Health provider&apos;s instructions for site, frequency, and timing.</>}
          />
        </ol>

        {warnings.length > 0 && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
              Review before use
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-amber-900">
              {warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-5 text-[11px] text-cultr-textMuted">
          Always verify with your CULTR Health provider before dosing.
        </p>
      </div>
    </div>
  )
}

function Step({ n, title, body }: { n: number; title: string; body: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-cultr-forest text-sm font-bold text-white">
        {n}
      </span>
      <div>
        <p className="text-sm font-semibold text-cultr-text">{title}</p>
        <p className="mt-0.5 text-sm text-cultr-textMuted leading-relaxed">{body}</p>
      </div>
    </li>
  )
}

function ActionButton({
  onClick,
  label,
  icon,
  disabled,
}: {
  onClick: () => void | Promise<void>
  label: string
  icon: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full border px-4 py-2.5 min-h-[44px] text-sm font-medium transition-colors',
        disabled
          ? 'border-cultr-sage/50 text-cultr-textMuted cursor-not-allowed'
          : 'border-cultr-sage text-cultr-forest hover:bg-cultr-mint/60 hover:border-cultr-forest/50'
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function slug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}
