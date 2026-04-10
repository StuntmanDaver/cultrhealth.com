// Healthie Webhook Verification
// Verifies incoming webhook payloads from Healthie using HMAC-SHA256 (RFC 9421).
// HIPAA: Never log webhook body contents (may contain PHI)

import { createHmac, createHash, timingSafeEqual } from 'crypto'
import { NextRequest } from 'next/server'

export interface HealthieWebhookEvent {
  event_type: string
  resource_id: string
  resource_id_type: string
  changed_fields?: string[]
}

/**
 * Read the request body as text exactly once.
 * Must be called before any other body read (request.json(), etc.)
 */
export async function readWebhookBody(request: NextRequest): Promise<string> {
  return await request.text()
}

/**
 * Verify a Healthie webhook request using HMAC-SHA256 signature.
 *
 * Healthie sends three headers for signature verification:
 *   Content-Digest: sha-256=:<base64-hash>:
 *   Signature-Input: sig1=(... components ...);created=<ts>;keyid="..."
 *   Signature: sig1=:<base64-hmac>:
 *
 * Falls back to shared-secret query param for local dev/testing.
 */
export function verifyHealthieWebhook(
  request: NextRequest,
  rawBody: string,
): boolean {
  const webhookSecret = process.env.HEALTHIE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('HEALTHIE_WEBHOOK_SECRET not configured')
    return false
  }

  const signatureHeader = request.headers.get('signature')
  const contentDigest = request.headers.get('content-digest')

  // HMAC verification when Healthie sends signature headers
  if (signatureHeader && contentDigest) {
    return verifyHmacSignature(request, rawBody, webhookSecret)
  }

  // Fallback: shared-secret via query param or custom header (for local testing)
  const urlSecret = request.nextUrl.searchParams.get('secret')
  const headerSecret = request.headers.get('x-healthie-webhook-secret')
  const provided = urlSecret || headerSecret
  if (provided) {
    try {
      const providedBuf = Buffer.from(provided, 'utf8')
      const secretBuf = Buffer.from(webhookSecret, 'utf8')
      if (providedBuf.length !== secretBuf.length) return false
      return timingSafeEqual(providedBuf, secretBuf)
    } catch {
      return false
    }
  }

  return false
}

/**
 * Verify HMAC-SHA256 signature per Healthie's RFC 9421 implementation.
 */
function verifyHmacSignature(
  request: NextRequest,
  rawBody: string,
  secret: string,
): boolean {
  try {
    const contentDigest = request.headers.get('content-digest') || ''
    const signatureHeader = request.headers.get('signature') || ''
    const signatureInput = request.headers.get('signature-input') || ''

    // 1. Verify Content-Digest matches the body
    const bodyHash = createHash('sha256').update(rawBody).digest('base64')
    const expectedDigest = `sha-256=:${bodyHash}:`
    if (contentDigest !== expectedDigest) {
      console.error('Healthie webhook: Content-Digest mismatch')
      return false
    }

    // 2. Build the signature base string from Signature-Input components
    // Healthie includes: @method, @path, @query, content-digest, content-type, content-length
    const url = new URL(request.url)
    const components: Record<string, string> = {
      '@method': request.method.toUpperCase(),
      '@path': url.pathname,
      '@query': url.search || '?',
      'content-digest': contentDigest,
      'content-type': request.headers.get('content-type') || 'application/json',
      'content-length': request.headers.get('content-length') || String(Buffer.byteLength(rawBody)),
    }

    // Parse the component list from Signature-Input: sig1=("@method" "@path" ...);created=...
    const inputMatch = signatureInput.match(/sig1=\(([^)]+)\)/)
    if (!inputMatch) {
      console.error('Healthie webhook: cannot parse Signature-Input')
      return false
    }

    const componentNames = inputMatch[1]
      .split(' ')
      .map(s => s.replace(/"/g, ''))

    // Build the signature base per RFC 9421
    const signatureBase = componentNames
      .map(name => `"${name}": ${components[name] || ''}`)
      .join('\n')

    // Append the @signature-params line
    const sigParams = signatureInput.replace(/^sig1=/, '')
    const dataToSign = `${signatureBase}\n"@signature-params": ${sigParams}`

    // 3. Compute HMAC-SHA256
    const computedSig = createHmac('sha256', secret)
      .update(dataToSign)
      .digest('base64')

    // 4. Extract actual signature value: sig1=:<base64>:
    const sigMatch = signatureHeader.match(/sig1=:([^:]+):/)
    if (!sigMatch) {
      console.error('Healthie webhook: cannot parse Signature header')
      return false
    }

    const actualSig = sigMatch[1]

    const computedBuf = Buffer.from(computedSig, 'base64')
    const actualBuf = Buffer.from(actualSig, 'base64')
    if (computedBuf.length !== actualBuf.length) return false
    return timingSafeEqual(computedBuf, actualBuf)
  } catch (err) {
    console.error('Healthie webhook HMAC verification error:', err instanceof Error ? err.message : 'unknown')
    return false
  }
}

/**
 * Parse the raw webhook body into a typed event.
 * Call this AFTER verification succeeds.
 */
export function parseWebhookBody(rawBody: string): HealthieWebhookEvent {
  const body = JSON.parse(rawBody)
  return {
    event_type: body.event_type || '',
    resource_id: String(body.resource_id || ''),
    resource_id_type: body.resource_id_type || '',
    changed_fields: body.changed_fields,
  }
}
