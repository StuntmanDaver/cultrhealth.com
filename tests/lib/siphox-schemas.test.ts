import { describe, it, expect } from 'vitest'
import {
  SiphoxCustomerSchema,
  SiphoxOrderSchema,
  SiphoxCreditsSchema,
  SiphoxReportSchema,
  SiphoxBiomarkerResultSchema,
  SiphoxKitValidationSchema,
} from '@/lib/siphox/schemas'

// ============================================================
// FIXTURES
// ============================================================

const VALID_CUSTOMER = {
  _id: 'cust_abc123',
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane@example.com',
  phone: '+14155551234',
  external_id: '+14155551234',
}

const VALID_ORDER = {
  _id: 'ord_xyz789',
  status: 'created',
  kit_types: [{ kitType: 'longevity_essentials', quantity: 1 }],
  recipient: {
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane@example.com',
    external_id: '+14155551234',
  },
  created_at: '2026-03-15T00:00:00Z',
}

const VALID_CREDITS = {
  balance: 25,
}

const VALID_KIT_VALIDATION = {
  valid: true,
  kitId: 'KIT-001',
  status: 'active',
}

const VALID_BIOMARKER_RESULT = {
  biomarker: 'HbA1c',
  value: 5.2,
  unit: '%',
  reference_range: {
    low: 4.0,
    high: 5.6,
    optimal_low: 4.0,
    optimal_high: 5.0,
  },
  status: 'normal',
}

const VALID_REPORT = {
  _id: 'rep_def456',
  customer_id: 'cust_abc123',
  biomarkers: [VALID_BIOMARKER_RESULT],
  suggestions: [
    {
      _id: 'sug_001',
      text: 'Your HbA1c is within normal range.',
      category: 'metabolic',
      link: 'https://example.com',
    },
  ],
  created_at: '2026-03-15T00:00:00Z',
  status: 'completed',
}

// ============================================================
// TESTS
// ============================================================

describe('SiphoxCustomerSchema', () => {
  it('validates a known-good customer response', () => {
    const result = SiphoxCustomerSchema.safeParse(VALID_CUSTOMER)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data._id).toBe('cust_abc123')
      expect(result.data.first_name).toBe('Jane')
      expect(result.data.email).toBe('jane@example.com')
    }
  })

  it('rejects a response missing required _id field', () => {
    const { _id, ...missingId } = VALID_CUSTOMER
    const result = SiphoxCustomerSchema.safeParse(missingId)
    expect(result.success).toBe(false)
  })

  it('rejects a response missing required email field', () => {
    const { email, ...missingEmail } = VALID_CUSTOMER
    const result = SiphoxCustomerSchema.safeParse(missingEmail)
    expect(result.success).toBe(false)
  })

  it('accepts a response with extra unknown fields (passthrough)', () => {
    const withExtra = { ...VALID_CUSTOMER, unknownField: 'extra', nested: { deep: true } }
    const result = SiphoxCustomerSchema.safeParse(withExtra)
    expect(result.success).toBe(true)
    if (result.success) {
      expect((result.data as Record<string, unknown>).unknownField).toBe('extra')
    }
  })

  it('accepts customer without optional phone and external_id', () => {
    const { phone, external_id, ...minimal } = VALID_CUSTOMER
    const result = SiphoxCustomerSchema.safeParse(minimal)
    expect(result.success).toBe(true)
  })
})

describe('SiphoxOrderSchema', () => {
  it('validates a known-good order response', () => {
    const result = SiphoxOrderSchema.safeParse(VALID_ORDER)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data._id).toBe('ord_xyz789')
      expect(result.data.status).toBe('created')
      expect(result.data.kit_types).toHaveLength(1)
    }
  })

  it('rejects a response missing required _id field', () => {
    const { _id, ...missingId } = VALID_ORDER
    const result = SiphoxOrderSchema.safeParse(missingId)
    expect(result.success).toBe(false)
  })

  it('rejects a response missing kit_types array', () => {
    const { kit_types, ...missingKitTypes } = VALID_ORDER
    const result = SiphoxOrderSchema.safeParse(missingKitTypes)
    expect(result.success).toBe(false)
  })

  it('accepts a response with extra unknown fields (passthrough)', () => {
    const withExtra = { ...VALID_ORDER, tracking_url: 'https://track.example.com' }
    const result = SiphoxOrderSchema.safeParse(withExtra)
    expect(result.success).toBe(true)
    if (result.success) {
      expect((result.data as Record<string, unknown>).tracking_url).toBe('https://track.example.com')
    }
  })
})

describe('SiphoxCreditsSchema', () => {
  it('validates a known-good credits response', () => {
    const result = SiphoxCreditsSchema.safeParse(VALID_CREDITS)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.balance).toBe(25)
    }
  })

  it('rejects a response missing balance field', () => {
    const result = SiphoxCreditsSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects a response with non-number balance', () => {
    const result = SiphoxCreditsSchema.safeParse({ balance: 'twenty' })
    expect(result.success).toBe(false)
  })

  it('accepts a response with extra unknown fields (passthrough)', () => {
    const withExtra = { ...VALID_CREDITS, plan: 'enterprise', updated_at: '2026-03-15' }
    const result = SiphoxCreditsSchema.safeParse(withExtra)
    expect(result.success).toBe(true)
  })
})

describe('SiphoxKitValidationSchema', () => {
  it('validates a known-good kit validation response', () => {
    const result = SiphoxKitValidationSchema.safeParse(VALID_KIT_VALIDATION)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.valid).toBe(true)
    }
  })

  it('rejects a response missing required valid field', () => {
    const { valid, ...missingValid } = VALID_KIT_VALIDATION
    const result = SiphoxKitValidationSchema.safeParse(missingValid)
    expect(result.success).toBe(false)
  })
})

describe('SiphoxBiomarkerResultSchema', () => {
  it('validates a known-good biomarker result', () => {
    const result = SiphoxBiomarkerResultSchema.safeParse(VALID_BIOMARKER_RESULT)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.biomarker).toBe('HbA1c')
      expect(result.data.value).toBe(5.2)
    }
  })

  it('accepts a biomarker result with null value', () => {
    const withNull = { ...VALID_BIOMARKER_RESULT, value: null }
    const result = SiphoxBiomarkerResultSchema.safeParse(withNull)
    expect(result.success).toBe(true)
  })

  it('rejects a result missing required biomarker field', () => {
    const { biomarker, ...missingBiomarker } = VALID_BIOMARKER_RESULT
    const result = SiphoxBiomarkerResultSchema.safeParse(missingBiomarker)
    expect(result.success).toBe(false)
  })
})

describe('SiphoxReportSchema', () => {
  it('validates a known-good report response', () => {
    const result = SiphoxReportSchema.safeParse(VALID_REPORT)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data._id).toBe('rep_def456')
      expect(result.data.biomarkers).toHaveLength(1)
      expect(result.data.suggestions).toHaveLength(1)
    }
  })

  it('rejects a response missing required _id field', () => {
    const { _id, ...missingId } = VALID_REPORT
    const result = SiphoxReportSchema.safeParse(missingId)
    expect(result.success).toBe(false)
  })

  it('rejects a response missing biomarkers array', () => {
    const { biomarkers, ...missingBiomarkers } = VALID_REPORT
    const result = SiphoxReportSchema.safeParse(missingBiomarkers)
    expect(result.success).toBe(false)
  })

  it('validates a report without optional suggestions', () => {
    const { suggestions, ...noSuggestions } = VALID_REPORT
    const result = SiphoxReportSchema.safeParse(noSuggestions)
    expect(result.success).toBe(true)
  })

  it('accepts a response with extra unknown fields (passthrough)', () => {
    const withExtra = { ...VALID_REPORT, lab_name: 'Quest', version: 2 }
    const result = SiphoxReportSchema.safeParse(withExtra)
    expect(result.success).toBe(true)
    if (result.success) {
      expect((result.data as Record<string, unknown>).lab_name).toBe('Quest')
    }
  })
})
