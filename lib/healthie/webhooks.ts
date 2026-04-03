// Healthie Webhook Verification
// Verifies incoming webhook payloads from Healthie
// HIPAA: Never log webhook body contents (may contain PHI)

import { NextRequest } from 'next/server'

export interface HealthieWebhookEvent {
  event_type: string
  resource_id: string
  resource_id_type: string
  data?: Record<string, unknown>
}

/**
 * Parse and verify a Healthie webhook request.
 * Healthie webhooks use a shared secret for verification.
 * The secret is sent as a query parameter or header depending on configuration.
 */
export function verifyHealthieWebhook(request: NextRequest): boolean {
  const webhookSecret = process.env.HEALTHIE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('HEALTHIE_WEBHOOK_SECRET not configured')
    return false
  }

  // Healthie sends the secret as a query parameter named 'secret'
  // or in a custom header depending on webhook configuration
  const urlSecret = request.nextUrl.searchParams.get('secret')
  const headerSecret = request.headers.get('x-healthie-webhook-secret')

  return urlSecret === webhookSecret || headerSecret === webhookSecret
}

/**
 * Parse the webhook body into a typed event.
 * Call this AFTER verification succeeds.
 */
export async function parseWebhookBody(request: NextRequest): Promise<HealthieWebhookEvent> {
  const body = await request.json()
  return {
    event_type: body.event_type || '',
    resource_id: body.resource_id || '',
    resource_id_type: body.resource_id_type || '',
    data: body,
  }
}
