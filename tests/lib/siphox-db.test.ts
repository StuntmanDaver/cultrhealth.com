import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use vi.hoisted so mockSql is available inside the hoisted vi.mock factory
const { mockSql } = vi.hoisted(() => ({
  mockSql: vi.fn(),
}))

vi.mock('@vercel/postgres', () => ({
  sql: mockSql,
}))

import {
  SiphoxDatabaseError,
  upsertSiphoxCustomer,
  getSiphoxCustomerByPhone,
  getSiphoxCustomerBySiphoxId,
  insertKitOrder,
  getKitOrdersByCustomer,
  updateKitOrderStatus,
  insertReport,
  getReportsByCustomer,
  getReportById,
} from '@/lib/siphox/db'

describe('SiPhox Database Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================
  // SiphoxDatabaseError
  // ============================================================

  describe('SiphoxDatabaseError', () => {
    it('should have correct name and message', () => {
      const err = new SiphoxDatabaseError('test error')
      expect(err.name).toBe('SiphoxDatabaseError')
      expect(err.message).toBe('test error')
      expect(err).toBeInstanceOf(Error)
    })

    it('should store originalError', () => {
      const original = new Error('pg error')
      const err = new SiphoxDatabaseError('wrapped', original)
      expect(err.originalError).toBe(original)
    })
  })

  // ============================================================
  // Customer Operations
  // ============================================================

  describe('upsertSiphoxCustomer', () => {
    it('should call sql and not throw on success', async () => {
      mockSql.mockResolvedValueOnce({ rows: [] })
      await expect(
        upsertSiphoxCustomer('+15551234567', 'siphox_abc123', 'John', 'Doe', 'john@example.com')
      ).resolves.not.toThrow()
      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it('should handle optional fields as null', async () => {
      mockSql.mockResolvedValueOnce({ rows: [] })
      await expect(
        upsertSiphoxCustomer('+15551234567', 'siphox_abc123')
      ).resolves.not.toThrow()
      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it('should wrap database errors in SiphoxDatabaseError', async () => {
      mockSql.mockRejectedValueOnce(new Error('connection refused'))
      await expect(
        upsertSiphoxCustomer('+15551234567', 'siphox_abc123')
      ).rejects.toThrow(SiphoxDatabaseError)
    })
  })

  describe('getSiphoxCustomerByPhone', () => {
    it('should return customer row when found', async () => {
      const mockRow = {
        id: 'uuid-1',
        phone_e164: '+15551234567',
        siphox_customer_id: 'siphox_abc123',
        external_id: '+15551234567',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        created_at: new Date(),
        updated_at: new Date(),
      }
      mockSql.mockResolvedValueOnce({ rows: [mockRow] })
      const result = await getSiphoxCustomerByPhone('+15551234567')
      expect(result).toEqual(mockRow)
    })

    it('should return null when not found', async () => {
      mockSql.mockResolvedValueOnce({ rows: [] })
      const result = await getSiphoxCustomerByPhone('+15559999999')
      expect(result).toBeNull()
    })

    it('should wrap errors in SiphoxDatabaseError', async () => {
      mockSql.mockRejectedValueOnce(new Error('timeout'))
      await expect(getSiphoxCustomerByPhone('+15551234567')).rejects.toThrow(SiphoxDatabaseError)
    })
  })

  describe('getSiphoxCustomerBySiphoxId', () => {
    it('should return customer row when found', async () => {
      const mockRow = {
        id: 'uuid-1',
        phone_e164: '+15551234567',
        siphox_customer_id: 'siphox_abc123',
        external_id: '+15551234567',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        created_at: new Date(),
        updated_at: new Date(),
      }
      mockSql.mockResolvedValueOnce({ rows: [mockRow] })
      const result = await getSiphoxCustomerBySiphoxId('siphox_abc123')
      expect(result).toEqual(mockRow)
    })

    it('should return null when not found', async () => {
      mockSql.mockResolvedValueOnce({ rows: [] })
      const result = await getSiphoxCustomerBySiphoxId('siphox_unknown')
      expect(result).toBeNull()
    })

    it('should wrap errors in SiphoxDatabaseError', async () => {
      mockSql.mockRejectedValueOnce(new Error('query failed'))
      await expect(getSiphoxCustomerBySiphoxId('siphox_abc')).rejects.toThrow(SiphoxDatabaseError)
    })
  })

  // ============================================================
  // Kit Order Operations
  // ============================================================

  describe('insertKitOrder', () => {
    it('should insert and return the new row', async () => {
      const mockRow = {
        id: 'uuid-2',
        siphox_customer_id: 'siphox_abc123',
        siphox_order_id: 'order_xyz',
        kit_type: 'comprehensive_wellness',
        quantity: 1,
        status: 'ordered',
        tracking_number: null,
        stripe_subscription_id: null,
        is_test_order: false,
        created_at: new Date(),
        updated_at: new Date(),
      }
      mockSql.mockResolvedValueOnce({ rows: [mockRow] })
      const result = await insertKitOrder('siphox_abc123', 'order_xyz', 'comprehensive_wellness')
      expect(result).toEqual(mockRow)
    })

    it('should accept optional fields', async () => {
      const mockRow = {
        id: 'uuid-2',
        siphox_customer_id: 'siphox_abc123',
        siphox_order_id: 'order_xyz',
        kit_type: 'comprehensive_wellness',
        quantity: 2,
        status: 'ordered',
        tracking_number: null,
        stripe_subscription_id: 'sub_123',
        is_test_order: true,
        created_at: new Date(),
        updated_at: new Date(),
      }
      mockSql.mockResolvedValueOnce({ rows: [mockRow] })
      const result = await insertKitOrder('siphox_abc123', 'order_xyz', 'comprehensive_wellness', {
        quantity: 2,
        stripeSubscriptionId: 'sub_123',
        isTestOrder: true,
      })
      expect(result).toEqual(mockRow)
    })

    it('should wrap errors in SiphoxDatabaseError', async () => {
      mockSql.mockRejectedValueOnce(new Error('FK violation'))
      await expect(
        insertKitOrder('siphox_unknown', 'order_xyz', 'kit_type')
      ).rejects.toThrow(SiphoxDatabaseError)
    })
  })

  describe('getKitOrdersByCustomer', () => {
    it('should return array of orders', async () => {
      const mockRows = [
        { id: 'uuid-2', siphox_customer_id: 'siphox_abc123', siphox_order_id: 'order_2', kit_type: 'kit_b', status: 'shipped', created_at: new Date() },
        { id: 'uuid-1', siphox_customer_id: 'siphox_abc123', siphox_order_id: 'order_1', kit_type: 'kit_a', status: 'ordered', created_at: new Date() },
      ]
      mockSql.mockResolvedValueOnce({ rows: mockRows })
      const result = await getKitOrdersByCustomer('siphox_abc123')
      expect(result).toEqual(mockRows)
      expect(result).toHaveLength(2)
    })

    it('should return empty array when no orders', async () => {
      mockSql.mockResolvedValueOnce({ rows: [] })
      const result = await getKitOrdersByCustomer('siphox_abc123')
      expect(result).toEqual([])
    })

    it('should wrap errors in SiphoxDatabaseError', async () => {
      mockSql.mockRejectedValueOnce(new Error('query error'))
      await expect(getKitOrdersByCustomer('siphox_abc123')).rejects.toThrow(SiphoxDatabaseError)
    })
  })

  describe('updateKitOrderStatus', () => {
    it('should update status without tracking number', async () => {
      mockSql.mockResolvedValueOnce({ rows: [] })
      await expect(
        updateKitOrderStatus('order_xyz', 'shipped')
      ).resolves.not.toThrow()
      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it('should update status with tracking number', async () => {
      mockSql.mockResolvedValueOnce({ rows: [] })
      await expect(
        updateKitOrderStatus('order_xyz', 'shipped', 'TRACK123456')
      ).resolves.not.toThrow()
      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it('should wrap errors in SiphoxDatabaseError', async () => {
      mockSql.mockRejectedValueOnce(new Error('update failed'))
      await expect(
        updateKitOrderStatus('order_xyz', 'shipped')
      ).rejects.toThrow(SiphoxDatabaseError)
    })
  })

  // ============================================================
  // Report Operations (immutable)
  // ============================================================

  describe('insertReport', () => {
    it('should insert and return the new row', async () => {
      const reportData = { biomarkers: [{ name: 'Glucose', value: 95 }] }
      const mockRow = {
        id: 'uuid-3',
        siphox_customer_id: 'siphox_abc123',
        siphox_report_id: 'report_xyz',
        report_data: reportData,
        suggestions: null,
        report_status: 'completed',
        fetched_at: new Date(),
        created_at: new Date(),
      }
      mockSql.mockResolvedValueOnce({ rows: [mockRow] })
      const result = await insertReport('siphox_abc123', 'report_xyz', reportData, null, 'completed')
      expect(result).toEqual(mockRow)
    })

    it('should accept suggestions as JSONB', async () => {
      const reportData = { biomarkers: [] }
      const suggestions = [{ text: 'Increase vitamin D intake' }]
      const mockRow = {
        id: 'uuid-3',
        siphox_customer_id: 'siphox_abc123',
        siphox_report_id: 'report_xyz',
        report_data: reportData,
        suggestions: suggestions,
        report_status: 'completed',
        fetched_at: new Date(),
        created_at: new Date(),
      }
      mockSql.mockResolvedValueOnce({ rows: [mockRow] })
      const result = await insertReport('siphox_abc123', 'report_xyz', reportData, suggestions, 'completed')
      expect(result).toEqual(mockRow)
    })

    it('should wrap errors in SiphoxDatabaseError', async () => {
      mockSql.mockRejectedValueOnce(new Error('unique violation'))
      await expect(
        insertReport('siphox_abc123', 'report_xyz', { biomarkers: [] })
      ).rejects.toThrow(SiphoxDatabaseError)
    })
  })

  describe('getReportsByCustomer', () => {
    it('should return array of reports', async () => {
      const mockRows = [
        { id: 'uuid-4', siphox_customer_id: 'siphox_abc123', siphox_report_id: 'report_2', report_data: {}, fetched_at: new Date() },
        { id: 'uuid-3', siphox_customer_id: 'siphox_abc123', siphox_report_id: 'report_1', report_data: {}, fetched_at: new Date() },
      ]
      mockSql.mockResolvedValueOnce({ rows: mockRows })
      const result = await getReportsByCustomer('siphox_abc123')
      expect(result).toEqual(mockRows)
      expect(result).toHaveLength(2)
    })

    it('should return empty array when no reports', async () => {
      mockSql.mockResolvedValueOnce({ rows: [] })
      const result = await getReportsByCustomer('siphox_abc123')
      expect(result).toEqual([])
    })

    it('should wrap errors in SiphoxDatabaseError', async () => {
      mockSql.mockRejectedValueOnce(new Error('query failed'))
      await expect(getReportsByCustomer('siphox_abc123')).rejects.toThrow(SiphoxDatabaseError)
    })
  })

  describe('getReportById', () => {
    it('should return report row when found', async () => {
      const mockRow = {
        id: 'uuid-3',
        siphox_customer_id: 'siphox_abc123',
        siphox_report_id: 'report_xyz',
        report_data: { biomarkers: [] },
        suggestions: null,
        report_status: 'completed',
        fetched_at: new Date(),
        created_at: new Date(),
      }
      mockSql.mockResolvedValueOnce({ rows: [mockRow] })
      const result = await getReportById('report_xyz')
      expect(result).toEqual(mockRow)
    })

    it('should return null when not found', async () => {
      mockSql.mockResolvedValueOnce({ rows: [] })
      const result = await getReportById('report_nonexistent')
      expect(result).toBeNull()
    })

    it('should wrap errors in SiphoxDatabaseError', async () => {
      mockSql.mockRejectedValueOnce(new Error('connection lost'))
      await expect(getReportById('report_xyz')).rejects.toThrow(SiphoxDatabaseError)
    })
  })

  // ============================================================
  // Error wrapping across all functions
  // ============================================================

  describe('error wrapping', () => {
    it('should include original error in SiphoxDatabaseError', async () => {
      const pgError = new Error('connection refused')
      mockSql.mockRejectedValueOnce(pgError)
      try {
        await getSiphoxCustomerByPhone('+15551234567')
        expect.fail('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(SiphoxDatabaseError)
        expect((err as SiphoxDatabaseError).originalError).toBe(pgError)
      }
    })
  })
})
