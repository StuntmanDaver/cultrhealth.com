import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sql } from '@vercel/postgres'

// Mock @vercel/postgres
vi.mock('@vercel/postgres', () => ({
  sql: vi.fn(),
}))

import {
  upsertPortalSession,
  getPortalSessionByPhone,
  updatePortalPatientId,
  type PortalSessionRow,
} from '@/lib/portal-db'

describe('Portal DB', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('upsertPortalSession', () => {
    it('calls sql with INSERT ... ON CONFLICT for a new session', async () => {
      vi.mocked(sql).mockResolvedValue({ rows: [], rowCount: 1 } as any)

      await upsertPortalSession(
        '(555) 123-4567',
        '+15551234567',
        42,
        'John',
        'Doe'
      )

      expect(sql).toHaveBeenCalledTimes(1)
      // Verify the template literal call contains the right data
      const call = vi.mocked(sql).mock.calls[0]
      // sql is called as a tagged template literal, so call[0] is the strings array
      const templateStrings = call[0] as unknown as TemplateStringsArray
      const fullQuery = templateStrings.join('?')
      expect(fullQuery.toUpperCase()).toContain('INSERT INTO')
      expect(fullQuery.toUpperCase()).toContain('PORTAL_SESSIONS')
      expect(fullQuery.toUpperCase()).toContain('ON CONFLICT')
    })

    it('works with null patientId and optional names', async () => {
      vi.mocked(sql).mockResolvedValue({ rows: [], rowCount: 1 } as any)

      await upsertPortalSession('(555) 123-4567', '+15551234567', null)

      expect(sql).toHaveBeenCalledTimes(1)
    })
  })

  describe('getPortalSessionByPhone', () => {
    it('returns a row when found', async () => {
      const mockRow: PortalSessionRow = {
        id: 'test-uuid',
        phone: '(555) 123-4567',
        phone_e164: '+15551234567',
        asher_patient_id: 42,
        first_name: 'John',
        last_name: 'Doe',
        verified_at: new Date(),
        last_login_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      }

      vi.mocked(sql).mockResolvedValue({
        rows: [mockRow],
        rowCount: 1,
      } as any)

      const result = await getPortalSessionByPhone('+15551234567')
      expect(result).toEqual(mockRow)
      expect(sql).toHaveBeenCalledTimes(1)
    })

    it('returns null when no row found', async () => {
      vi.mocked(sql).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any)

      const result = await getPortalSessionByPhone('+15559999999')
      expect(result).toBeNull()
    })
  })

  describe('updatePortalPatientId', () => {
    it('calls sql with UPDATE for the given phone', async () => {
      vi.mocked(sql).mockResolvedValue({ rows: [], rowCount: 1 } as any)

      await updatePortalPatientId('+15551234567', 99)

      expect(sql).toHaveBeenCalledTimes(1)
      const call = vi.mocked(sql).mock.calls[0]
      const templateStrings = call[0] as unknown as TemplateStringsArray
      const fullQuery = templateStrings.join('?')
      expect(fullQuery.toUpperCase()).toContain('UPDATE')
      expect(fullQuery.toUpperCase()).toContain('PORTAL_SESSIONS')
    })
  })
})
