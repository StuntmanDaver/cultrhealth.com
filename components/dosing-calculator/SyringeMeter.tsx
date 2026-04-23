'use client'

import { useEffect, useState } from 'react'
import type { CapacityStatus } from '@/lib/peptide-calculator'

type Props = {
  syringeMl: number
  drawMl: number
  drawUnits: number
  capacityStatus: CapacityStatus
  capacityPct: number
}

type ZoneColor = {
  fill: string
  text: string
  badgeBg: string
  badgeText: string
  label: string
}

function zoneFor(status: CapacityStatus): ZoneColor {
  switch (status) {
    case 'exceeds':
      return {
        fill: '#DC2626',
        text: 'text-white',
        badgeBg: 'bg-red-500/90 border-red-300',
        badgeText: 'text-white',
        label: 'Exceeds capacity',
      }
    case 'near':
      return {
        fill: '#F59E0B',
        text: 'text-white',
        badgeBg: 'bg-amber-400/90 border-amber-200',
        badgeText: 'text-amber-950',
        label: 'Near limit',
      }
    case 'ok':
      return {
        fill: '#B7E4C7',
        text: 'text-cultr-forest',
        badgeBg: 'bg-white/90 border-white',
        badgeText: 'text-cultr-forest',
        label: 'Fits',
      }
    default:
      return {
        fill: '#B7E4C7',
        text: 'text-cultr-forest',
        badgeBg: 'bg-white/90 border-white',
        badgeText: 'text-cultr-forest',
        label: '',
      }
  }
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [])
  return reduced
}

// Cap on rendered tick marks. The standard 0.3 / 0.5 / 1.0 mL syringes produce
// 30 / 50 / 50 ticks respectively. The fallback below scales gracefully when a
// user types an arbitrary custom syringe size so we never blow up the SVG
// with thousands of elements.
const MAX_SYRINGE_TICKS = 120

function deriveTickConfig(syringeMl: number) {
  if (syringeMl === 0.3 || syringeMl === 0.5) {
    return { minor: 1, medium: 5, major: 10, labelEvery: 10 }
  }
  if (syringeMl === 1.0) {
    return { minor: 2, medium: 10, major: 20, labelEvery: 20 }
  }
  const maxUnits = Math.max(1, syringeMl * 100)
  const minor = Math.max(1, Math.ceil(maxUnits / MAX_SYRINGE_TICKS))
  return {
    minor,
    medium: minor * 5,
    major: minor * 10,
    labelEvery: minor * 10,
  }
}

export function SyringeMeter({ syringeMl, drawMl, drawUnits, capacityStatus, capacityPct }: Props) {
  const reducedMotion = useReducedMotion()
  const maxUnits = Math.max(1, syringeMl * 100)
  const visualPct = Math.min(capacityPct, 100)
  const zone = zoneFor(capacityStatus)

  const config = deriveTickConfig(syringeMl)

  const ticks: number[] = []
  for (let i = 0; i <= maxUnits; i += config.minor) ticks.push(i)

  const barrelTop = 30
  const barrelHeight = 300
  const barrelWidth = 58
  const svgWidth = 170
  const svgHeight = 400
  const barrelX = 62

  const pctLabel = capacityPct > 0 ? `${Math.round(Math.min(capacityPct, 999))}%` : ''
  const captionDrawMl = Number.isFinite(drawMl) ? drawMl.toFixed(3) : '—'

  return (
    <div className="flex flex-col items-center">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="overflow-visible"
        role="img"
        aria-label={`Syringe meter: ${captionDrawMl} mL of ${syringeMl} mL (${pctLabel || '0%'})`}
      >
        <rect
          x={barrelX}
          y={barrelTop}
          width={barrelWidth}
          height={barrelHeight}
          rx={5}
          fill="#f8faf9"
          stroke="white"
          strokeWidth={2}
        />

        <rect
          x={barrelX + 2}
          y={barrelTop + barrelHeight - (barrelHeight - 4) * (visualPct / 100)}
          width={barrelWidth - 4}
          height={(barrelHeight - 4) * (visualPct / 100)}
          rx={3}
          fill={zone.fill}
          style={reducedMotion ? undefined : { transition: 'all 300ms ease-out' }}
        />

        {ticks.map((tick) => {
          const yPos = barrelTop + barrelHeight - barrelHeight * (tick / maxUnits)
          const isMajor = tick % config.major === 0
          const isMedium = !isMajor && tick % config.medium === 0
          const showLabel = tick % config.labelEvery === 0
          let tickLength = 6
          if (isMedium) tickLength = 12
          if (isMajor) tickLength = 16
          return (
            <g key={tick}>
              <line
                x1={barrelX - tickLength}
                y1={yPos}
                x2={barrelX}
                y2={yPos}
                stroke={isMajor ? 'white' : 'rgba(255,255,255,0.7)'}
                strokeWidth={isMajor ? 2.5 : isMedium ? 1.5 : 1}
              />
              {showLabel && (
                <text
                  x={barrelX - tickLength - 6}
                  y={yPos + 4}
                  textAnchor="end"
                  className="text-[13px] font-bold"
                  fill="white"
                >
                  {tick}
                </text>
              )}
            </g>
          )
        })}

        {/* Percentage overlay in center of fill when there's measurable fill */}
        {capacityPct > 0 && (
          <text
            x={barrelX + barrelWidth / 2}
            y={barrelTop + barrelHeight / 2}
            textAnchor="middle"
            className="text-[20px] font-display font-bold"
            fill="white"
            stroke="rgba(0,0,0,0.35)"
            strokeWidth={0.6}
          >
            {pctLabel}
          </text>
        )}

        {/* Needle hub */}
        <rect
          x={barrelX + barrelWidth / 2 - 10}
          y={barrelTop + barrelHeight}
          width={20}
          height={14}
          fill="#d1d5db"
        />
        <rect
          x={barrelX + barrelWidth / 2 - 1.5}
          y={barrelTop + barrelHeight + 14}
          width={3}
          height={36}
          fill="#e5e7eb"
        />
        <polygon
          points={`${barrelX + barrelWidth / 2},${barrelTop + barrelHeight + 58} ${barrelX + barrelWidth / 2 - 1.5},${barrelTop + barrelHeight + 50} ${barrelX + barrelWidth / 2 + 1.5},${barrelTop + barrelHeight + 50}`}
          fill="#e5e7eb"
        />

        {/* Plunger */}
        <rect
          x={barrelX + 4}
          y={10}
          width={barrelWidth - 8}
          height={barrelTop - 8}
          rx={2}
          fill="#e5e7eb"
          stroke="white"
          strokeWidth={1}
        />
        <rect
          x={barrelX + barrelWidth / 2 - 7}
          y={0}
          width={14}
          height={14}
          rx={2}
          fill="#d1d5db"
        />
      </svg>

      <div className="text-center">
        <p className="text-sm font-semibold text-white">{syringeMl} mL Syringe</p>
        <p className="text-xs text-white/70">{maxUnits} units capacity</p>
      </div>

      {drawUnits > 0 && (
        <div
          className={`mt-3 rounded-lg border px-4 py-2 text-sm font-semibold ${zone.badgeBg} ${zone.badgeText}`}
        >
          {capacityStatus === 'exceeds'
            ? 'Exceeds capacity'
            : `Draw to ${drawUnits.toFixed(1)} units`}
        </div>
      )}

      <p className="mt-3 text-center text-xs text-white/70">
        {captionDrawMl} mL of {syringeMl} mL{pctLabel ? ` (${pctLabel})` : ''}
      </p>
    </div>
  )
}
