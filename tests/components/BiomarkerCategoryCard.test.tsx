import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BiomarkerCategoryCard } from '@/components/portal/BiomarkerCategoryCard'
import type { ProcessedCategory, ProcessedBiomarker } from '@/lib/siphox/reports'

function makeBiomarker(overrides: Partial<ProcessedBiomarker>): ProcessedBiomarker {
  return {
    siphoxName: 'HDL-C',
    displayName: 'HDL Cholesterol',
    abbreviation: 'HDL-C',
    category: 'heart',
    unit: 'mg/dL',
    value: 62,
    referenceRange: { low: 40, high: 100, optimalLow: 50, optimalHigh: 80 },
    status: 'optimal',
    lowerIsBetter: false,
    description: 'Good cholesterol',
    rawStatus: 'optimal',
    ...overrides,
  }
}

const heartCategory: ProcessedCategory = {
  key: 'heart',
  label: 'Heart & Cardiovascular',
  description: 'Lipids and cardiovascular risk markers',
  biomarkers: [
    makeBiomarker({}),
    makeBiomarker({
      siphoxName: 'LDL-C',
      displayName: 'LDL Cholesterol',
      abbreviation: 'LDL-C',
      value: 145,
      status: 'high',
      rawStatus: 'elevated',
    }),
    makeBiomarker({
      siphoxName: 'TC',
      displayName: 'Total Cholesterol',
      abbreviation: 'TC',
      value: null,
      status: 'na',
      rawStatus: null,
    }),
  ],
  measuredCount: 2,
  optimalCount: 1,
}

describe('BiomarkerCategoryCard', () => {
  it('renders category label and description', () => {
    render(
      <BiomarkerCategoryCard
        category={heartCategory}
        onBiomarkerClick={vi.fn()}
      />
    )
    expect(screen.getByText('Heart & Cardiovascular')).toBeTruthy()
    expect(screen.getByText('Lipids and cardiovascular risk markers')).toBeTruthy()
  })

  it('is collapsed by default', () => {
    render(
      <BiomarkerCategoryCard
        category={heartCategory}
        onBiomarkerClick={vi.fn()}
      />
    )
    expect(screen.queryByText('HDL Cholesterol')).toBeNull()
  })

  it('expands on click to show biomarkers', () => {
    render(
      <BiomarkerCategoryCard
        category={heartCategory}
        onBiomarkerClick={vi.fn()}
      />
    )
    fireEvent.click(screen.getByText('Heart & Cardiovascular'))
    expect(screen.getByText('HDL Cholesterol')).toBeTruthy()
    expect(screen.getByText('LDL Cholesterol')).toBeTruthy()
    expect(screen.getByText('Total Cholesterol')).toBeTruthy()
  })

  it('shows defaultExpanded when prop is true', () => {
    render(
      <BiomarkerCategoryCard
        category={heartCategory}
        onBiomarkerClick={vi.fn()}
        defaultExpanded
      />
    )
    expect(screen.getByText('HDL Cholesterol')).toBeTruthy()
  })

  it('shows biomarker values and units', () => {
    render(
      <BiomarkerCategoryCard
        category={heartCategory}
        onBiomarkerClick={vi.fn()}
        defaultExpanded
      />
    )
    expect(screen.getByText('62')).toBeTruthy()
    expect(screen.getByText('145')).toBeTruthy()
  })

  it('shows N/A dash for null values', () => {
    render(
      <BiomarkerCategoryCard
        category={heartCategory}
        onBiomarkerClick={vi.fn()}
        defaultExpanded
      />
    )
    // Total Cholesterol has null value — should show dash
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('shows status badges', () => {
    render(
      <BiomarkerCategoryCard
        category={heartCategory}
        onBiomarkerClick={vi.fn()}
        defaultExpanded
      />
    )
    expect(screen.getByText('optimal')).toBeTruthy()
    expect(screen.getByText('high')).toBeTruthy()
    // N/A appears in both the status badge and reference range bar
    const naElements = screen.getAllByText('N/A')
    expect(naElements.length).toBeGreaterThan(0)
  })

  it('calls onBiomarkerClick when a biomarker row is clicked', () => {
    const onClick = vi.fn()
    render(
      <BiomarkerCategoryCard
        category={heartCategory}
        onBiomarkerClick={onClick}
        defaultExpanded
      />
    )
    fireEvent.click(screen.getByText('HDL Cholesterol'))
    expect(onClick).toHaveBeenCalledOnce()
    expect(onClick).toHaveBeenCalledWith(heartCategory.biomarkers[0])
  })

  it('collapses when header is clicked again', () => {
    render(
      <BiomarkerCategoryCard
        category={heartCategory}
        onBiomarkerClick={vi.fn()}
        defaultExpanded
      />
    )
    expect(screen.getByText('HDL Cholesterol')).toBeTruthy()
    fireEvent.click(screen.getByText('Heart & Cardiovascular'))
    expect(screen.queryByText('HDL Cholesterol')).toBeNull()
  })
})
