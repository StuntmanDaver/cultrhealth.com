# Mailchimp Drip Campaign Tagging — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the existing Mailchimp sync into a shared utility, then wire up tier-specific tags and merge fields at every purchase, intake, and labs event so Mailchimp Journey Builder can trigger the 6-campaign post-purchase drip system.

**Architecture:** Create `lib/mailchimp.ts` as a single shared module with `syncContactToMailchimp()` and `addTagsToContact()` functions. Each purchase/event route calls these non-blocking helpers to upsert the contact and apply the correct tags. Tags drive Mailchimp Journey Builder automations — no scheduling logic lives in our code.

**Tech Stack:** Mailchimp Marketing API 3.0 (REST, already authenticated via env vars), Node crypto (MD5 hashing), existing `@vercel/postgres` for DB reads

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| **Create** | `lib/mailchimp.ts` | Shared Mailchimp API utility — contact upsert, tag management, merge fields |
| **Create** | `tests/lib/mailchimp.test.ts` | Unit tests for the shared utility |
| **Modify** | `app/api/club/signup/route.ts` | Replace inline `syncToMailchimp()` with shared utility import |
| **Modify** | `app/api/club/orders/route.ts` | Add Mailchimp sync with `club-order-placed` + therapy-specific tags |
| **Modify** | `app/api/webhook/stripe/route.ts` | Add Mailchimp sync with `tier-core` / `tier-catalyst` / `tier-concierge` tags |
| **Modify** | `app/api/intake/submit/route.ts` | Add Mailchimp tag `intake-complete` after successful submission |
| **Modify** | `app/api/cron/siphox-results/route.ts` | Add Mailchimp tag `labs-results-ready` when emailing results |

---

### Task 1: Create shared Mailchimp utility

**Files:**
- Create: `lib/mailchimp.ts`
- Test: `tests/lib/mailchimp.test.ts`

- [ ] **Step 1: Write failing tests for `getEmailHash()`**

```typescript
// tests/lib/mailchimp.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Set env vars before importing
process.env.MAILCHIMP_API_KEY = 'test-api-key-us1'
process.env.MAILCHIMP_AUDIENCE_ID = 'test-audience-123'
process.env.MAILCHIMP_SERVER_PREFIX = 'us1'

import { getEmailHash, syncContactToMailchimp, addTagsToContact } from '@/lib/mailchimp'

describe('mailchimp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
  })

  describe('getEmailHash', () => {
    it('returns MD5 hash of lowercase email', () => {
      // MD5 of "test@example.com" is known
      const hash = getEmailHash('Test@Example.com')
      expect(hash).toBe(getEmailHash('test@example.com'))
      expect(hash).toMatch(/^[a-f0-9]{32}$/)
    })

    it('trims whitespace before hashing', () => {
      expect(getEmailHash('  test@example.com  ')).toBe(getEmailHash('test@example.com'))
    })
  })

  describe('syncContactToMailchimp', () => {
    it('sends PUT request with correct URL and auth', async () => {
      await syncContactToMailchimp({
        email: 'jane@test.com',
        firstName: 'Jane',
        lastName: 'Doe',
        tags: ['club-member'],
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toContain('https://us1.api.mailchimp.com/3.0/lists/test-audience-123/members/')
      expect(options.method).toBe('PUT')
      expect(options.headers['Content-Type']).toBe('application/json')
      expect(options.headers['Authorization']).toContain('Basic ')
    })

    it('includes merge fields and tags in body', async () => {
      await syncContactToMailchimp({
        email: 'jane@test.com',
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '+15551234567',
        tags: ['club-order-placed', 'therapy-semaglutide'],
        mergeFields: { THERAPY: 'Semaglutide', ORDER_NUM: 'CLB-ABC123' },
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.email_address).toBe('jane@test.com')
      expect(body.status_if_new).toBe('subscribed')
      expect(body.merge_fields.FNAME).toBe('Jane')
      expect(body.merge_fields.LNAME).toBe('Doe')
      expect(body.merge_fields.PHONE).toBe('+15551234567')
      expect(body.merge_fields.THERAPY).toBe('Semaglutide')
      expect(body.merge_fields.ORDER_NUM).toBe('CLB-ABC123')
      expect(body.tags).toEqual(['club-order-placed', 'therapy-semaglutide'])
    })

    it('skips silently when env vars not configured', async () => {
      const origKey = process.env.MAILCHIMP_API_KEY
      delete process.env.MAILCHIMP_API_KEY

      await syncContactToMailchimp({
        email: 'jane@test.com',
        firstName: 'Jane',
        lastName: 'Doe',
        tags: ['test'],
      })

      expect(mockFetch).not.toHaveBeenCalled()
      process.env.MAILCHIMP_API_KEY = origKey
    })

    it('does not throw on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Invalid resource' }),
      })

      // Should not throw
      await syncContactToMailchimp({
        email: 'jane@test.com',
        firstName: 'Jane',
        lastName: 'Doe',
        tags: ['test'],
      })
    })
  })

  describe('addTagsToContact', () => {
    it('sends POST to tags endpoint with active status', async () => {
      await addTagsToContact('jane@test.com', ['intake-complete'])

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toContain('/tags')
      const body = JSON.parse(options.body)
      expect(body.tags).toEqual([{ name: 'intake-complete', status: 'active' }])
    })

    it('handles multiple tags', async () => {
      await addTagsToContact('jane@test.com', ['labs-results-ready', 'tier-core'])

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.tags).toEqual([
        { name: 'labs-results-ready', status: 'active' },
        { name: 'tier-core', status: 'active' },
      ])
    })

    it('skips when env vars missing', async () => {
      const origKey = process.env.MAILCHIMP_API_KEY
      delete process.env.MAILCHIMP_API_KEY

      await addTagsToContact('jane@test.com', ['test'])
      expect(mockFetch).not.toHaveBeenCalled()

      process.env.MAILCHIMP_API_KEY = origKey
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/lib/mailchimp.test.ts`
Expected: FAIL — `Cannot find module '@/lib/mailchimp'`

- [ ] **Step 3: Implement `lib/mailchimp.ts`**

```typescript
// lib/mailchimp.ts
import crypto from 'crypto'

/**
 * Shared Mailchimp Marketing API 3.0 utility.
 *
 * Used by purchase routes, intake, and labs cron to tag contacts
 * for Mailchimp Journey Builder drip campaign automations.
 *
 * Environment variables:
 *   MAILCHIMP_API_KEY        — API key (e.g. "abc123-us1")
 *   MAILCHIMP_AUDIENCE_ID    — List/audience ID
 *   MAILCHIMP_SERVER_PREFIX  — Region prefix (e.g. "us1")
 */

function getConfig() {
  const apiKey = process.env.MAILCHIMP_API_KEY
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID
  const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX
  if (!apiKey || !audienceId || !serverPrefix) return null
  return { apiKey, audienceId, serverPrefix }
}

function getAuthHeader(apiKey: string): string {
  return `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`
}

/** MD5 hash of lowercase, trimmed email — Mailchimp's subscriber key. */
export function getEmailHash(email: string): string {
  return crypto
    .createHash('md5')
    .update(email.trim().toLowerCase())
    .digest('hex')
}

interface SyncContactOptions {
  email: string
  firstName: string
  lastName: string
  phone?: string
  socialHandle?: string
  tags?: string[]
  mergeFields?: Record<string, string>
}

/**
 * Upsert a contact in Mailchimp with merge fields and tags.
 * Non-throwing — logs errors but never rejects.
 */
export async function syncContactToMailchimp(opts: SyncContactOptions): Promise<void> {
  const config = getConfig()
  if (!config) return

  const emailHash = getEmailHash(opts.email)
  const url = `https://${config.serverPrefix}.api.mailchimp.com/3.0/lists/${config.audienceId}/members/${emailHash}`

  const mergeFields: Record<string, string> = {
    FNAME: opts.firstName,
    LNAME: opts.lastName,
    ...(opts.phone ? { PHONE: opts.phone } : {}),
    ...(opts.socialHandle ? { MMERGE5: opts.socialHandle } : {}),
    ...opts.mergeFields,
  }

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': getAuthHeader(config.apiKey),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: opts.email.trim().toLowerCase(),
        status_if_new: 'subscribed',
        merge_fields: mergeFields,
        ...(opts.tags?.length ? { tags: opts.tags } : {}),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[mailchimp] Sync failed:', { email: opts.email, error })
    }
  } catch (err) {
    console.error('[mailchimp] Sync error:', err)
  }
}

/**
 * Add tags to an existing contact. Use this when you only need to
 * tag (not upsert) — e.g. intake-complete, labs-results-ready.
 * Non-throwing — logs errors but never rejects.
 */
export async function addTagsToContact(email: string, tags: string[]): Promise<void> {
  const config = getConfig()
  if (!config) return

  const emailHash = getEmailHash(email)
  const url = `https://${config.serverPrefix}.api.mailchimp.com/3.0/lists/${config.audienceId}/members/${emailHash}/tags`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(config.apiKey),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tags: tags.map(name => ({ name, status: 'active' })),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[mailchimp] Tag failed:', { email, tags, error })
    }
  } catch (err) {
    console.error('[mailchimp] Tag error:', err)
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lib/mailchimp.test.ts`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/mailchimp.ts tests/lib/mailchimp.test.ts
git commit -m "feat(mailchimp): extract shared utility with syncContact and addTags helpers"
```

---

### Task 2: Replace inline Mailchimp in club signup route

**Files:**
- Modify: `app/api/club/signup/route.ts:51-54` (caller) and lines `128-181` (inline function)

- [ ] **Step 1: Replace the inline `syncToMailchimp` call with the shared utility**

In `app/api/club/signup/route.ts`, add the import at the top (after existing imports):

```typescript
import { syncContactToMailchimp } from '@/lib/mailchimp'
```

Replace lines 51-54 (the existing call):

```typescript
    // Sync to Mailchimp (non-blocking)
    syncToMailchimp(name.trim(), normalizedEmail, phone?.trim() || '', socialHandle?.trim() || '').catch((err) =>
      console.error('[club/signup] Mailchimp sync error (non-fatal):', err)
    )
```

With:

```typescript
    // Sync to Mailchimp (non-blocking)
    syncContactToMailchimp({
      email: normalizedEmail,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone?.trim() || undefined,
      socialHandle: socialHandle?.trim() || undefined,
      tags: ['cultr-club-signup', 'club-member'],
    }).catch((err) =>
      console.error('[club/signup] Mailchimp sync error (non-fatal):', err)
    )
```

- [ ] **Step 2: Delete the inline `syncToMailchimp` function**

Remove lines 127-181 (the entire `async function syncToMailchimp(...)` block and the blank line before it).

- [ ] **Step 3: Remove the `crypto` import if no longer needed**

Check line 3: `import crypto from 'crypto'` — this was only used by the deleted `syncToMailchimp`. Remove it.

- [ ] **Step 4: Run tests to verify nothing broke**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/club/signup/route.ts
git commit -m "refactor(signup): replace inline Mailchimp sync with shared lib/mailchimp utility"
```

---

### Task 3: Add Mailchimp tagging to club orders route

**Files:**
- Modify: `app/api/club/orders/route.ts`

- [ ] **Step 1: Add import at top of file**

After the existing import block (line 9), add:

```typescript
import { syncContactToMailchimp } from '@/lib/mailchimp'
```

- [ ] **Step 2: Add Mailchimp sync after the email-sending block**

After line 317 (after the email success/failure logging block, before `return NextResponse.json`), add:

```typescript
    // Sync to Mailchimp with order tags (non-blocking)
    const therapyNames = items
      .map((item: OrderItem) => item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
      .map((slug: string) => `therapy-${slug}`)
    const firstName = name.trim().split(' ')[0]
    const lastName = name.trim().split(' ').slice(1).join(' ') || ''
    syncContactToMailchimp({
      email: normalizedEmail,
      firstName,
      lastName,
      phone: phone?.trim() || undefined,
      tags: ['club-order-placed', ...therapyNames],
      mergeFields: {
        THERAPY: items[0]?.name || '',
        ORDER_NUM: orderNumber,
      },
    }).catch((err) =>
      console.error('[club/orders] Mailchimp sync error (non-fatal):', err)
    )
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add app/api/club/orders/route.ts
git commit -m "feat(orders): tag Mailchimp contacts with club-order-placed and therapy-specific tags"
```

---

### Task 4: Add Mailchimp tagging to Stripe webhook (membership subscriptions)

**Files:**
- Modify: `app/api/webhook/stripe/route.ts`

- [ ] **Step 1: Add import at top of file**

After line 3 (`import { headers } from 'next/headers'`), add:

```typescript
import { syncContactToMailchimp } from '@/lib/mailchimp'
```

- [ ] **Step 2: Add Mailchimp sync in `handleCheckoutCompleted` after the welcome email block**

After line 300 (`console.log('Welcome email sent to:', custEmail)`) inside the welcome email try block, but still inside the `if (custEmail)` check, add:

```typescript
        // Sync to Mailchimp with tier tag (non-blocking)
        const planTier = session.metadata?.plan_tier || 'unknown'
        const tierTag = planTier !== 'unknown' ? `tier-${planTier}` : null
        syncContactToMailchimp({
          email: custEmail,
          firstName: customerName.split(' ')[0] || customerName,
          lastName: customerName.split(' ').slice(1).join(' ') || '',
          tags: ['cultr-member', ...(tierTag ? [tierTag] : [])],
          mergeFields: {
            TIER: planTier.charAt(0).toUpperCase() + planTier.slice(1),
          },
        }).catch((err) =>
          console.error('[stripe-webhook] Mailchimp sync error (non-fatal):', err)
        )
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add app/api/webhook/stripe/route.ts
git commit -m "feat(stripe): tag Mailchimp contacts with tier-core/catalyst/concierge on subscription"
```

---

### Task 5: Add Mailchimp tagging to intake submission

**Files:**
- Modify: `app/api/intake/submit/route.ts`

- [ ] **Step 1: Read the full file to find the success response location**

The intake submit route returns a JSON response after successful Asher Med order creation. We need to find the success path and add the Mailchimp tag there.

Read the file to find the exact return statement after a successful order creation.

- [ ] **Step 2: Add import at top of file**

After the existing imports, add:

```typescript
import { addTagsToContact } from '@/lib/mailchimp'
```

- [ ] **Step 3: Add Mailchimp tag call before the success response**

Right before the final success `return NextResponse.json(...)`, add:

```typescript
    // Tag Mailchimp contact as intake complete (non-blocking)
    if (customerEmail) {
      addTagsToContact(customerEmail, ['intake-complete']).catch((err) =>
        console.error('[intake/submit] Mailchimp tag error (non-fatal):', err)
      )
    }
```

Where `customerEmail` is whatever variable holds the patient email in that route. Read the file to confirm the variable name — it's likely from the form data (e.g., `formData.email` or `body.email`).

- [ ] **Step 4: Run tests**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/intake/submit/route.ts
git commit -m "feat(intake): tag Mailchimp contacts with intake-complete on submission"
```

---

### Task 6: Add Mailchimp tagging to SiPhox results cron

**Files:**
- Modify: `app/api/cron/siphox-results/route.ts`

- [ ] **Step 1: Add import at top of file**

After the existing imports, add:

```typescript
import { addTagsToContact } from '@/lib/mailchimp'
```

- [ ] **Step 2: Add Mailchimp tag inside the customer loop, after successful email send**

Inside the `for (const customer of customers)` loop, after the `sendResultsReadyEmail` call succeeds, add:

```typescript
        // Tag Mailchimp contact (non-blocking, don't count as failure)
        if (customer.email) {
          addTagsToContact(customer.email, ['labs-results-ready']).catch((err) =>
            console.error('[siphox-results] Mailchimp tag error (non-fatal):', err)
          )
        }
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add app/api/cron/siphox-results/route.ts
git commit -m "feat(siphox): tag Mailchimp contacts with labs-results-ready on notification"
```

---

### Task 7: Add Mailchimp env vars to test setup

**Files:**
- Modify: `tests/setup.ts`

- [ ] **Step 1: Add Mailchimp env vars to test setup**

After line 44 (`process.env.SIPHOX_API_URL = ...`), add:

```typescript
process.env.MAILCHIMP_API_KEY = 'test-mailchimp-key-us1'
process.env.MAILCHIMP_AUDIENCE_ID = 'test-audience-123'
process.env.MAILCHIMP_SERVER_PREFIX = 'us1'
```

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS (including the new mailchimp tests)

- [ ] **Step 3: Commit**

```bash
git add tests/setup.ts
git commit -m "test: add Mailchimp env vars to test setup"
```

---

## Verification

After all tasks are complete, verify end-to-end:

1. **Type check:** `npx tsc --noEmit` — no errors
2. **Tests:** `npx vitest run` — all pass
3. **Build:** `npm run build` — succeeds
4. **Manual smoke test on staging:**
   - Submit a club order on staging.cultrhealth.com/join → check Mailchimp audience for `club-order-placed` tag
   - Complete an intake form → check for `intake-complete` tag
   - Check that the existing club signup still applies `cultr-club-signup` + `club-member` tags

## Mailchimp Merge Fields to Create (Manual, in Mailchimp Dashboard)

Before the tags work with Journey Builder, create these merge fields in Mailchimp:

| Field Tag | Field Name | Type |
|-----------|-----------|------|
| `THERAPY` | Primary Therapy | Text |
| `TIER` | Membership Tier | Text |
| `ORDER_NUM` | Order Number | Text |

These are set by the code but must exist in the Mailchimp audience settings first.

## Tags Summary

| Tag | Set By | Journey Builder Trigger |
|-----|--------|------------------------|
| `cultr-club-signup` | `/api/club/signup` | — (existing) |
| `club-member` | `/api/club/signup` | — |
| `club-order-placed` | `/api/club/orders` | Campaign 1: Club Post-Purchase |
| `therapy-{slug}` | `/api/club/orders` | Conditional branches (GLP-1 vs peptide) |
| `cultr-member` | Stripe webhook | — |
| `tier-core` | Stripe webhook | Campaign 2: Core Onboarding |
| `tier-catalyst` | Stripe webhook | Campaign 3: Catalyst+ Onboarding |
| `tier-concierge` | Stripe webhook | Campaign 4: Concierge Onboarding |
| `intake-complete` | `/api/intake/submit` | Skip intake nudge emails |
| `labs-results-ready` | SiPhox cron | Insert results notification email |
