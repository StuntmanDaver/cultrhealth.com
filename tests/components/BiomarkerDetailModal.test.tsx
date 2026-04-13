import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BiomarkerDetailModal } from '@/components/portal/BiomarkerDetailModal'
import type { ProcessedBiomarker } from '@/lib/siphox/reports'

const optimalBiomarker: ProcessedBiomarker = {
  siphoxName: 'HDL-C',
  displayName: 'HDL Cholesterol',
  abbreviation: 'HDL-C',
  category: 'heart',
  unit: 'mg/dL',
  value: 62,
  referenceRange: { low: 40, high: 100, optimalLow: 50, optimalHigh: 80 },
  status: 'optimal',
  lowerIsBetter: false,
  description: 'Good cholesterol that helps remove LDL from arteries.',
  rawStatus: 'optimal',
}

const highBiomarker: ProcessedBiomarker = {
  siphoxName: 'LDL-C',
  displayName: 'LDL Cholesterol',
  abbreviation: 'LDL-C',
  category: 'heart',
  unit: 'mg/dL',
  value: 175,
  referenceRange: { low: 0, high: 130, optimalLow: 0, optimalHigh: 100 },
  status: 'high',
  lowerIsBetter: true,
  description: 'Bad cholesterol that builds up in arteries.',
  rawStatus: 'elevated',
}

const naBiomarker: ProcessedBiomarker = {
  siphoxName: 'Vitamin D',
  displayName: 'Vitamin D',
  abbreviation: 'VitD',
  category: 'nutritional',
  unit: 'ng/mL',
  value: null,
  referenceRange: null,
  status: 'na',
  lowerIsBetter: false,
  description: 'Essential for bone health and immune function.',
  rawStatus: null,
}

describe('BiomarkerDetailModal', () => {
  it('renders biomarker name and abbreviation', () => {
    render(<BiomarkerDetailModal biomarker={optimalBiomarker} onClose={vi.fn()} />)
    expect(screen.getByText('HDL Cholesterol')).toBeTruthy()
    expect(screen.getByText('HDL-C')).toBeTruthy()
  })

  it('shows value and unit for measured biomarkers', () => {
    render(<BiomarkerDetailModal biomarker={optimalBiomarker} onClose={vi.fn()} />)
    expect(screen.getByText('62')).toBeTruthy()
    expect(screen.getByText('mg/dL')).toBeTruthy()
  })

  it('shows N/A for unmeasured biomarkers', () => {
    render(<BiomarkerDetailModal biomarker={naBiomarker} onClose={vi.fn()} />)
    // N/A appears in both the value display and reference range bar
    const naElements = screen.getAllByText('N/A')
    expect(naElements.length).toBeGreaterThan(0)
  })

  it('shows optimal status badge and interpretation', () => {
    render(<BiomarkerDetailModal biomarker={optimalBiomarker} onClose={vi.fn()} />)
    expect(screen.getByText('Optimal')).toBeTruthy()
    expect(screen.getByText(/falls within the ideal range/)).toBeTruthy()
  })

  it('shows high status badge and interpretation', () => {
    render(<BiomarkerDetailModal biomarker={highBiomarker} onClose={vi.fn()} />)
    expect(screen.getByText('Above Range')).toBeTruthy()
    expect(screen.getByText(/above the expected reference range/)).toBeTruthy()
  })

  it('shows not available interpretation for N/A status', () => {
    render(<BiomarkerDetailModal biomarker={naBiomarker} onClose={vi.fn()} />)
    expect(screen.getByText('Not Available')).toBeTruthy()
    expect(screen.getByText(/not included in your test panel/)).toBeTruthy()
  })

  it('shows description section', () => {
    render(<BiomarkerDetailModal biomarker={optimalBiomarker} onClose={vi.fn()} />)
    expect(screen.getByText('About This Biomarker')).toBeTruthy()
    expect(screen.getByText('Good cholesterol that helps remove LDL from arteries.')).toBeTruthy()
  })

  it('shows reference range details when available', () => {
    render(<BiomarkerDetailModal biomarker={optimalBiomarker} onClose={vi.fn()} />)
    expect(screen.getByText('Range Details')).toBeTruthy()
    expect(screen.getByText('Low Boundary')).toBeTruthy()
    expect(screen.getByText('High Boundary')).toBeTruthy()
    expect(screen.getByText('Optimal Low')).toBeTruthy()
    expect(screen.getByText('Optimal High')).toBeTruthy()
  })

  it('does not show range details for N/A biomarkers', () => {
    render(<BiomarkerDetailModal biomarker={naBiomarker} onClose={vi.fn()} />)
    expect(screen.queryByText('Range Details')).toBeNull()
  })

  it('shows lowerIsBetter note when applicable', () => {
    render(<BiomarkerDetailModal biomarker={highBiomarker} onClose={vi.fn()} />)
    expect(screen.getByText(/lower values are generally associated/)).toBeTruthy()
  })

  it('does not show lowerIsBetter note when false', () => {
    render(<BiomarkerDetailModal biomarker={optimalBiomarker} onClose={vi.fn()} />)
    expect(screen.queryByText(/lower values are generally associated/)).toBeNull()
  })

  it('calls onClose when X button is clicked', () => {
    const onClose = vi.fn()
    render(<BiomarkerDetailModal biomarker={optimalBiomarker} onClose={onClose} />)
    // Find the close button (the one with X icon in the header)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(
      <BiomarkerDetailModal biomarker={optimalBiomarker} onClose={onClose} />
    )
    // Click the backdrop (first child with bg-black)
    const backdrop = container.querySelector('.bg-black\\/40')
    if (backdrop) fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledOnce()
  })
})
