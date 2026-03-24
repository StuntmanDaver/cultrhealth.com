/**
 * Critical Page Smoke Tests
 *
 * Verifies that the most critical page modules can be imported and their
 * default exports exist. This catches broken imports, missing dependencies,
 * and syntax errors that would cause pages to 500 in production.
 *
 * These are lightweight import-only checks — no rendering, no mocking beyond
 * what the global setup provides.
 */
import { describe, it, expect } from 'vitest'

describe('Critical Page Smoke Tests', () => {
  it('homepage exports a valid page component', async () => {
    const mod = await import('@/app/page')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe('function')
  })

  it('pricing page exports a valid page component', async () => {
    const mod = await import('@/app/pricing/page')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe('function')
  })

  it('quiz page exports a valid page component', async () => {
    const mod = await import('@/app/quiz/page')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe('function')
  })

  it('FAQ page exports a valid page component', async () => {
    const mod = await import('@/app/faq/page')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe('function')
  })

  it('how-it-works page exports a valid page component', async () => {
    const mod = await import('@/app/how-it-works/page')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe('function')
  })

  it('science page exports a valid page component', async () => {
    const mod = await import('@/app/science/page')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe('function')
  })

  it('login page exports a valid page component', async () => {
    const mod = await import('@/app/login/page')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe('function')
  })

  it('intake page exports a valid page component', async () => {
    const mod = await import('@/app/intake/page')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe('function')
  })

  it('creators page exports a valid page component', async () => {
    const mod = await import('@/app/creators/page')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe('function')
  })

  it('community page exports a valid page component', async () => {
    const mod = await import('@/app/community/page')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe('function')
  })

  it('therapies page exports a valid page component', async () => {
    const mod = await import('@/app/therapies/page')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe('function')
  })

  it('portal login page exports a valid page component', async () => {
    const mod = await import('@/app/portal/login/page')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe('function')
  })
})
