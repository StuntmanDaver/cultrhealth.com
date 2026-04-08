'use client'

import { useState } from 'react'
import { Copy, Check, Download } from 'lucide-react'

/* ─── Shared resource type ─── */
export type ResourceEntry = {
  title: string
  category: string
  content: () => React.ReactNode
}

/* ─── Copyable code/text block ─── */
export function CopyBlock({ label, children }: { label?: string; children: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative bg-stone-50 border border-stone-200 rounded-xl p-4 my-4">
      {label && <p className="text-xs font-bold text-cultr-forest tracking-wider uppercase mb-2">{label}</p>}
      <pre className="text-sm text-cultr-text whitespace-pre-wrap leading-relaxed font-body">{children}</pre>
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-1.5 rounded-lg bg-white border border-stone-200 hover:border-cultr-forest transition-colors"
        aria-label="Copy"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
      </button>
    </div>
  )
}

/* ─── Section heading (h2) ─── */
export function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-display font-bold text-cultr-forest mt-8 mb-3">{children}</h2>
}

/* ─── Sub heading (h3) ─── */
export function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-display font-bold text-cultr-text mt-6 mb-2">{children}</h3>
}

/* ─── Body paragraph ─── */
export function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-cultr-textMuted leading-relaxed mb-3">{children}</p>
}

/* ─── Bullet list ─── */
export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 my-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-cultr-textMuted">
          <span className="w-1.5 h-1.5 rounded-full grad-dark mt-1.5 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

/* ─── Color swatch (click to copy hex) ─── */
export function ColorSwatch({ name, hex, textColor = 'text-white' }: { name: string; hex: string; textColor?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(hex); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="flex flex-col rounded-xl overflow-hidden border border-stone-200 hover:shadow-md transition-shadow"
    >
      <div className={`h-20 flex items-end p-3 ${textColor}`} style={{ backgroundColor: hex }}>
        <span className="text-xs font-bold">{copied ? 'Copied!' : hex}</span>
      </div>
      <div className="p-3 bg-white text-left">
        <p className="text-sm font-medium text-cultr-forest">{name}</p>
      </div>
    </button>
  )
}

/* ─── Download button ─── */
export function DownloadButton({ href, label, format }: { href: string; label: string; format: string }) {
  return (
    <a
      href={href}
      download
      className="flex items-center gap-3 p-3 bg-white border border-stone-200 rounded-xl hover:border-cultr-forest hover:shadow-sm transition-all group"
    >
      <div className="w-9 h-9 rounded-lg grad-mint flex items-center justify-center">
        <Download className="w-4 h-4 text-cultr-forest" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-cultr-forest">{label}</p>
        <p className="text-[11px] text-cultr-textMuted">{format}</p>
      </div>
    </a>
  )
}

/* ─── Data table for matrices, calendars, etc. ─── */
export function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-4 rounded-xl border border-stone-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-stone-50">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left font-bold text-cultr-forest text-xs tracking-wider uppercase border-b border-stone-200">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 1 ? 'bg-stone-50/50' : ''}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2.5 text-cultr-textMuted border-b border-stone-100 whitespace-pre-wrap">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Status badge (green/yellow/red) for compliance guardrails ─── */
export function StatusBadge({ status, children }: { status: 'green' | 'yellow' | 'red'; children: React.ReactNode }) {
  const colors = {
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  }
  const icons = { green: '\u2705', yellow: '\u26A0\uFE0F', red: '\u274C' }
  return (
    <div className={`flex items-start gap-2 px-4 py-3 rounded-lg border text-sm my-2 ${colors[status]}`}>
      <span className="shrink-0">{icons[status]}</span>
      <span>{children}</span>
    </div>
  )
}
