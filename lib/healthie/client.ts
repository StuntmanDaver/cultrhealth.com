// Healthie GraphQL API Client
// Follows lib/siphox/client.ts pattern with Basic auth and Zod validation
// HIPAA: Never log response bodies or patient data
//
// Auth: Authorization: Basic <API_KEY>, AuthorizationSource: API
// Staging: https://staging-api.gethealthie.com/graphql
// Production: https://api.gethealthie.com/graphql
// Rate limits: 250 RPS, 100 sign-ins/min

import { z } from 'zod'
import type { GraphQLResponse, GraphQLError } from './types'

// ============================================================
// CONFIGURATION
// ============================================================

function getHealthieApiUrl(): string {
  return process.env.HEALTHIE_API_URL || 'https://staging-api.gethealthie.com/graphql'
}

export function isHealthieConfigured(): boolean {
  return !!process.env.HEALTHIE_API_KEY
}

// ============================================================
// ERROR CLASS
// ============================================================

export class HealthieApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public graphqlErrors?: GraphQLError[],
  ) {
    super(message)
    this.name = 'HealthieApiError'
  }
}

// ============================================================
// GENERIC GRAPHQL REQUEST WRAPPER
// ============================================================

export async function healthieRequest<T>(
  query: string,
  variables: Record<string, unknown>,
  schema: z.ZodType<T>,
  resultKey: string,
): Promise<T> {
  const apiKey = process.env.HEALTHIE_API_KEY

  if (!apiKey) {
    throw new HealthieApiError('HEALTHIE_API_KEY is not configured')
  }

  const url = getHealthieApiUrl()

  // 30-second timeout to prevent hanging requests
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${apiKey}`,
        'AuthorizationSource': 'API',
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new HealthieApiError(
        `Healthie API HTTP error: ${response.status}`,
        response.status,
      )
    }

    const json: GraphQLResponse<Record<string, unknown>> = await response.json()

    if (json.errors && json.errors.length > 0) {
      // HIPAA: Only log error messages, not variable data
      console.error('Healthie GraphQL errors:', json.errors.map(e => e.message))
      throw new HealthieApiError(
        `Healthie GraphQL error: ${json.errors.map(e => e.message).join(', ')}`,
        undefined,
        json.errors,
      )
    }

    if (!json.data) {
      throw new HealthieApiError('Healthie API returned no data')
    }

    const result = json.data[resultKey]
    if (result === undefined || result === null) {
      throw new HealthieApiError(`Healthie API: missing result key "${resultKey}"`)
    }

    // Zod validation gate — HIPAA: only log paths, not received values
    const parsed = schema.safeParse(result)
    if (!parsed.success) {
      console.error('Healthie response validation failed:', parsed.error.issues.map(i => ({
        path: i.path,
        code: i.code,
        message: i.message,
      })))
      throw new HealthieApiError(
        `Response validation failed: ${parsed.error.issues.map(i => i.message).join(', ')}`,
      )
    }

    return parsed.data
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Raw GraphQL request without Zod validation -- use sparingly
 * for mutations that return simple payloads (e.g., delete operations)
 */
export async function healthieRawRequest<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const apiKey = process.env.HEALTHIE_API_KEY

  if (!apiKey) {
    throw new HealthieApiError('HEALTHIE_API_KEY is not configured')
  }

  const url = getHealthieApiUrl()

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${apiKey}`,
        'AuthorizationSource': 'API',
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new HealthieApiError(
        `Healthie API HTTP error: ${response.status}`,
        response.status,
      )
    }

    const json: GraphQLResponse<T> = await response.json()

    if (json.errors && json.errors.length > 0) {
      console.error('Healthie GraphQL errors:', json.errors.map(e => e.message))
      throw new HealthieApiError(
        `Healthie GraphQL error: ${json.errors.map(e => e.message).join(', ')}`,
        undefined,
        json.errors,
      )
    }

    if (!json.data) {
      throw new HealthieApiError('Healthie API returned no data')
    }

    return json.data
  } finally {
    clearTimeout(timeout)
  }
}
