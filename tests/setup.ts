import { vi, expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js modules
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => new Map()),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  }),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
}))

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.SESSION_SECRET = 'test-session-secret'
process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
// Asher Med env vars removed — external API no longer used
process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS = 'provider@cultrhealth.com,admin@cultrhealth.com'
process.env.MAILCHIMP_API_KEY = 'test-mailchimp-key-us1'
process.env.MAILCHIMP_AUDIENCE_ID = 'test-audience-123'
process.env.MAILCHIMP_SERVER_PREFIX = 'us1'
