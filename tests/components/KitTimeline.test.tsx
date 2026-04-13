import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KitTimeline } from '@/components/portal/KitTimeline'

describe('KitTimeline', () => {
  it('renders 6 timeline steps (excludes no_kit)', () => {
    const { container } = render(<KitTimeline currentState="ordered" />)
    // Desktop steps (exclude mobile steps which have "timeline-step-mobile-" prefix)
    const desktopSteps = container.querySelectorAll('[data-testid^="timeline-step-"]:not([data-testid*="mobile"])')
    expect(desktopSteps.length).toBe(6)
  })

  it('marks the first step as current when state is ordered', () => {
    const { container } = render(<KitTimeline currentState="ordered" />)
    const orderedStep = container.querySelector('[data-testid="timeline-step-ordered"]')
    expect(orderedStep?.getAttribute('data-status')).toBe('current')
  })

  it('marks steps before currentState as completed', () => {
    const { container } = render(<KitTimeline currentState="processing" />)
    const ordered = container.querySelector('[data-testid="timeline-step-ordered"]')
    const shipped = container.querySelector('[data-testid="timeline-step-shipped"]')
    const registered = container.querySelector('[data-testid="timeline-step-registered"]')
    const sampleMailed = container.querySelector('[data-testid="timeline-step-sample_mailed"]')
    expect(ordered?.getAttribute('data-status')).toBe('completed')
    expect(shipped?.getAttribute('data-status')).toBe('completed')
    expect(registered?.getAttribute('data-status')).toBe('completed')
    expect(sampleMailed?.getAttribute('data-status')).toBe('completed')
  })

  it('highlights the current step for processing', () => {
    const { container } = render(<KitTimeline currentState="processing" />)
    const processing = container.querySelector('[data-testid="timeline-step-processing"]')
    expect(processing?.getAttribute('data-status')).toBe('current')
  })

  it('marks steps after currentState as future', () => {
    const { container } = render(<KitTimeline currentState="ordered" />)
    const shipped = container.querySelector('[data-testid="timeline-step-shipped"]')
    const resultsReady = container.querySelector('[data-testid="timeline-step-results_ready"]')
    expect(shipped?.getAttribute('data-status')).toBe('future')
    expect(resultsReady?.getAttribute('data-status')).toBe('future')
  })

  it('marks all steps as completed or current when results_ready', () => {
    const { container } = render(<KitTimeline currentState="results_ready" />)
    const allSteps = container.querySelectorAll('[data-testid^="timeline-step-"]:not([data-testid*="mobile"])')
    const statuses = Array.from(allSteps).map((s) => s.getAttribute('data-status'))
    // 5 completed + 1 current
    expect(statuses.filter((s) => s === 'completed').length).toBe(5)
    expect(statuses.filter((s) => s === 'current').length).toBe(1)
  })
})
