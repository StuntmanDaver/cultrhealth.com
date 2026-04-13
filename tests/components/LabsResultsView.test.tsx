import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { LabsResultsView } from '@/components/portal/LabsResultsView'
import type { ProcessedReport } from '@/lib/siphox/reports'

const mockReport: ProcessedReport = {
  reportId: 'report-1',
  createdAt: '2026-03-17T12:00:00Z',
  categories: [
    {
      key: 'heart',
      label: 'Heart & Cardiovascular',
      description: 'Lipids and cardiovascular risk markers',
      biomarkers: [
        {
          siphoxName: 'HDL-C',
          displayName: 'HDL Cholesterol',
          abbreviation: 'HDL-C',
          category: 'heart',
          unit: 'mg/dL',
          value: 62,
          referenceRange: { low: 40, high: 100, optimalLow: 50, optimalHigh: 80 },
          status: 'optimal',
          lowerIsBetter: false,
          description: 'Good cholesterol that removes LDL from arteries',
          rawStatus: 'optimal',
        },
        {
          siphoxName: 'LDL-C',
          displayName: 'LDL Cholesterol',
          abbreviation: 'LDL-C',
          category: 'heart',
          unit: 'mg/dL',
          value: 145,
          referenceRange: { low: 0, high: 130, optimalLow: 0, optimalHigh: 100 },
          status: 'high',
          lowerIsBetter: true,
          description: 'Bad cholesterol that builds up in arteries',
          rawStatus: 'elevated',
        },
      ],
      measuredCount: 2,
      optimalCount: 1,
    },
    {
      key: 'metabolic',
      label: 'Metabolic Health',
      description: 'Blood sugar and metabolic function',
      biomarkers: [
        {
          siphoxName: 'Fasting Glucose',
          displayName: 'Fasting Glucose',
          abbreviation: 'Gluc',
          category: 'metabolic',
          unit: 'mg/dL',
          value: null,
          referenceRange: null,
          status: 'na',
          lowerIsBetter: false,
          description: 'Blood sugar level after fasting',
          rawStatus: null,
        },
      ],
      measuredCount: 0,
      optimalCount: 0,
    },
  ],
  suggestions: [
    { text: 'Consider increasing omega-3 intake to support HDL levels' },
    { text: 'Review LDL reduction strategies', link: 'https://example.com/ldl' },
  ],
  summary: {
    totalBiomarkers: 3,
    measuredCount: 2,
    optimalCount: 1,
    needsAttentionCount: 1,
    naCount: 1,
  },
}

describe('LabsResultsView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = vi.fn()
  })

  it('shows loading skeleton initially', () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}))
    render(<LabsResultsView />)
    const pulsingElements = document.querySelectorAll('.animate-pulse')
    expect(pulsingElements.length).toBeGreaterThan(0)
  })

  it('shows error state with retry button', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'))
    render(<LabsResultsView />)
    await waitFor(() => {
      expect(screen.getByText(/Unable to load your biomarker results/)).toBeTruthy()
    })
    expect(screen.getByText('Try again')).toBeTruthy()
  })

  it('shows processing message when no report', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, report: null }),
    })
    render(<LabsResultsView />)
    await waitFor(() => {
      expect(screen.getByText(/results are being processed/)).toBeTruthy()
    })
  })

  it('renders summary stats from report', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, report: mockReport }),
    })
    render(<LabsResultsView />)
    await waitFor(() => {
      expect(screen.getByText('3')).toBeTruthy() // total biomarkers
    })
    expect(screen.getByText('Biomarkers Tested')).toBeTruthy()
    expect(screen.getByText('Optimal')).toBeTruthy()
    expect(screen.getByText('Needs Attention')).toBeTruthy()
    expect(screen.getByText('Not Tested')).toBeTruthy()
  })

  it('renders category cards', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, report: mockReport }),
    })
    render(<LabsResultsView />)
    await waitFor(() => {
      expect(screen.getByText('Heart & Cardiovascular')).toBeTruthy()
    })
    expect(screen.getByText('Metabolic Health')).toBeTruthy()
  })

  it('renders suggestions', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, report: mockReport }),
    })
    render(<LabsResultsView />)
    await waitFor(() => {
      expect(screen.getByText('Insights & Recommendations')).toBeTruthy()
    })
    expect(screen.getByText('Consider increasing omega-3 intake to support HDL levels')).toBeTruthy()
    expect(screen.getByText('Review LDL reduction strategies')).toBeTruthy()
    expect(screen.getByText('Learn more')).toBeTruthy()
  })

  it('opens biomarker detail modal on click', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, report: mockReport }),
    })
    render(<LabsResultsView />)
    await waitFor(() => {
      expect(screen.getByText('Heart & Cardiovascular')).toBeTruthy()
    })

    // First category is expanded by default — click a biomarker
    fireEvent.click(screen.getByText('HDL Cholesterol'))
    await waitFor(() => {
      expect(screen.getByText('About This Biomarker')).toBeTruthy()
    })
    expect(screen.getByText('Good cholesterol that removes LDL from arteries')).toBeTruthy()
  })

  it('shows medical disclaimer', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, report: mockReport }),
    })
    render(<LabsResultsView />)
    await waitFor(() => {
      expect(screen.getByText(/informational and wellness optimization/)).toBeTruthy()
    })
  })

  it('handles 401 gracefully without error', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
    })
    render(<LabsResultsView />)
    await waitFor(() => {
      // Should not show error — just stop loading
      const errorEl = screen.queryByText(/Unable to load/)
      expect(errorEl).toBeNull()
    })
  })

  it('shows report date when available', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, report: mockReport }),
    })
    render(<LabsResultsView />)
    await waitFor(() => {
      expect(screen.getByText(/March 17, 2026/)).toBeTruthy()
    })
  })
})
