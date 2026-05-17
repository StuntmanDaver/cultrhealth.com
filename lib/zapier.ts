/**
 * Outbound Zapier webhook utility.
 *
 * Fires non-PHI event signals to Zapier catch-hook URLs.
 * Zapier then routes to Notion, Blotato, etc.
 *
 * HIPAA rule: NEVER include patient name, email, phone, medication,
 * or any PHI in the payload. Send only event type, status, and timestamps.
 *
 * Configure catch-hook URLs as env vars:
 *   ZAPIER_CREATOR_WEBHOOK_URL
 *   ZAPIER_HEALTHIE_EVENT_URL
 *   ZAPIER_XERO_EVENT_URL
 */

export async function fireZapierWebhook(
  webhookUrl: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, timestamp: new Date().toISOString(), ...payload }),
    })
  } catch (err) {
    // Non-fatal: Zapier outbound must never crash the caller
    console.error('[zapier] Outbound webhook failed for event:', event, err instanceof Error ? err.message : 'unknown')
  }
}
