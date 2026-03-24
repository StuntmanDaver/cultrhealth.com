/**
 * Critical API Route Smoke Tests
 *
 * Verifies that critical API route modules export the expected HTTP method
 * handlers (GET, POST). This catches broken imports and missing handler
 * exports that would cause API routes to 404 or 405 in production.
 *
 * These are lightweight import-only checks — no request execution, no
 * mocking beyond what the global setup provides.
 */
import { describe, it, expect } from 'vitest'

describe('Critical API Route Smoke Tests', () => {
  it('checkout route exports POST handler', async () => {
    const mod = await import('@/app/api/checkout/route')
    expect(mod.POST).toBeDefined()
    expect(typeof mod.POST).toBe('function')
  })

  it('club signup route exports POST handler', async () => {
    const mod = await import('@/app/api/club/signup/route')
    expect(mod.POST).toBeDefined()
    expect(typeof mod.POST).toBe('function')
  })

  it('auth magic-link route exports POST handler', async () => {
    const mod = await import('@/app/api/auth/magic-link/route')
    expect(mod.POST).toBeDefined()
    expect(typeof mod.POST).toBe('function')
  })

  it('auth verify route exports GET handler', async () => {
    const mod = await import('@/app/api/auth/verify/route')
    expect(mod.GET).toBeDefined()
    expect(typeof mod.GET).toBe('function')
  })

  it('intake questions route exports GET handler', async () => {
    const mod = await import('@/app/api/intake/questions/route')
    expect(mod.GET).toBeDefined()
    expect(typeof mod.GET).toBe('function')
  })

  it('intake submit route exports POST handler', async () => {
    const mod = await import('@/app/api/intake/submit/route')
    expect(mod.POST).toBeDefined()
    expect(typeof mod.POST).toBe('function')
  })

  it('creators apply route exports POST handler', async () => {
    const mod = await import('@/app/api/creators/apply/route')
    expect(mod.POST).toBeDefined()
    expect(typeof mod.POST).toBe('function')
  })

  it('club orders route exports POST handler', async () => {
    const mod = await import('@/app/api/club/orders/route')
    expect(mod.POST).toBeDefined()
    expect(typeof mod.POST).toBe('function')
  })

  it('member profile route exports GET handler', async () => {
    const mod = await import('@/app/api/member/profile/route')
    expect(mod.GET).toBeDefined()
    expect(typeof mod.GET).toBe('function')
  })
})
