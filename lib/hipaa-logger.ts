/**
 * HIPAA-compliant logger. Redacts PHI before any console output.
 * RULE: Never log email, phone, name, DOB, SSN, address, or medical data.
 * Use this instead of raw console.log/error/warn in all API routes.
 */

function redactPhi(args: unknown[]): unknown[] {
  return args.map(arg => {
    if (typeof arg === 'string') return redactString(arg)
    if (arg && typeof arg === 'object') return redactObject(arg as Record<string, unknown>)
    return arg
  })
}

function redactString(s: string): string {
  // Redact email addresses
  s = s.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
  // Redact phone numbers (various formats)
  s = s.replace(/(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g, '[REDACTED_PHONE]')
  return s
}

// PHI field names to redact in objects
const PHI_FIELDS = new Set([
  'email', 'phone', 'phoneNumber', 'phone_number', 'phoneE164',
  'firstName', 'lastName', 'first_name', 'last_name', 'name', 'displayName',
  'dateOfBirth', 'dob', 'date_of_birth',
  'ssn', 'social_security',
  'address', 'address1', 'address2', 'shippingAddress',
  'city', 'zipCode', 'zip_code',
  'custEmail', 'customerEmail', 'customer_email',
  'patientName', 'providerName',
])

function redactObject(obj: Record<string, unknown>, depth = 0): Record<string, unknown> {
  if (depth > 3) return { '[REDACTED_DEEP]': true }
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (PHI_FIELDS.has(key)) {
      result[key] = '[REDACTED]'
    } else if (typeof value === 'string') {
      result[key] = redactString(value)
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = redactObject(value as Record<string, unknown>, depth + 1)
    } else {
      result[key] = value
    }
  }
  return result
}

export const safeLog = {
  info: (...args: unknown[]) => console.log(...redactPhi(args)),
  warn: (...args: unknown[]) => console.warn(...redactPhi(args)),
  error: (...args: unknown[]) => console.error(...redactPhi(args)),
}

/**
 * Return a safe, generic error message for client responses.
 * NEVER expose error.message to clients -- it may contain DB schema,
 * API keys, internal URLs, or PHI from query parameters.
 */
export function safeErrorResponse(error: unknown, fallback: string): string {
  // Log the real error server-side (redacted)
  safeLog.error('[API Error]', error instanceof Error ? error.message : String(error))
  // Return generic message to client
  return fallback
}
