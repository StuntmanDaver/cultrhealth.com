// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { mapPatientToIntakeData, mapPatientToRenewalData, estimateSupplyDays } from '@/lib/portal-prefill'
import type { AsherPatient } from '@/lib/asher-med-api'

const basePatient: AsherPatient = {
  id: 100,
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phoneNumber: '+15551234567',
  dateOfBirth: '1990-05-15',
  gender: 'FEMALE',
  status: 'ACTIVE',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-06-01T00:00:00Z',
  height: 70, // 5'10"
  weight: 160,
  address1: '123 Main St',
  address2: 'Apt 4B',
  city: 'Gainesville',
  stateAbbreviation: 'FL',
  zipcode: '32601',
}

describe('mapPatientToIntakeData', () => {
  it('converts full AsherPatient to Partial<SimpleFormData>', () => {
    const result = mapPatientToIntakeData(basePatient)
    expect(result.firstName).toBe('Jane')
    expect(result.lastName).toBe('Doe')
    expect(result.email).toBe('jane@example.com')
    expect(result.phone).toBe('+15551234567')
    expect(result.dateOfBirth).toBe('1990-05-15')
    expect(result.gender).toBe('female')
    expect(result.weightLbs).toBe(160)
    expect(result.shippingAddress).toEqual({
      address1: '123 Main St',
      address2: 'Apt 4B',
      city: 'Gainesville',
      state: 'FL',
      zipCode: '32601',
    })
  })

  it('converts height from total inches to feet+inches (70 -> 5ft 10in)', () => {
    const result = mapPatientToIntakeData(basePatient)
    expect(result.heightFeet).toBe(5)
    expect(result.heightInches).toBe(10)
  })

  it('converts gender MALE to lowercase male', () => {
    const male = { ...basePatient, gender: 'MALE' as const }
    const result = mapPatientToIntakeData(male)
    expect(result.gender).toBe('male')
  })

  it('returns empty object when patient fields are missing (no crash)', () => {
    const minimal = {
      id: 1,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phoneNumber: '+15550000000',
      dateOfBirth: '2000-01-01',
      gender: 'MALE' as const,
      status: 'ACTIVE' as const,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      // no height, weight, address fields
    }
    const result = mapPatientToIntakeData(minimal)
    expect(result.heightFeet).toBeUndefined()
    expect(result.heightInches).toBeUndefined()
    expect(result.weightLbs).toBeUndefined()
    expect(result.shippingAddress).toBeUndefined()
  })
})

describe('mapPatientToRenewalData', () => {
  it('returns identity fields + shippingAddress + lastMedication', () => {
    const result = mapPatientToRenewalData(basePatient, 'Semaglutide')
    expect(result.firstName).toBe('Jane')
    expect(result.lastName).toBe('Doe')
    expect(result.email).toBe('jane@example.com')
    expect(result.phone).toBe('+15551234567')
    expect(result.dateOfBirth).toBe('1990-05-15')
    expect(result.gender).toBe('female')
    expect(result.shippingAddress).toEqual({
      address1: '123 Main St',
      address2: 'Apt 4B',
      city: 'Gainesville',
      state: 'FL',
      zipCode: '32601',
    })
    expect(result.lastMedication).toBe('Semaglutide')
  })

  it('sets lastMedication to null when no medication name provided', () => {
    const result = mapPatientToRenewalData(basePatient, null)
    expect(result.lastMedication).toBeNull()
  })
})

describe('estimateSupplyDays', () => {
  it('10 days ago with 28-day duration returns {daysRemaining: 18, isLow: false}', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    const result = estimateSupplyDays(tenDaysAgo, 28)
    expect(result.daysRemaining).toBe(18)
    expect(result.isLow).toBe(false)
  })

  it('25 days ago with 28-day duration returns {daysRemaining: 3, isLow: true}', () => {
    const twentyFiveDaysAgo = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
    const result = estimateSupplyDays(twentyFiveDaysAgo, 28)
    expect(result.daysRemaining).toBe(3)
    expect(result.isLow).toBe(true)
  })

  it('30 days ago with 28-day duration returns {daysRemaining: 0, isLow: true}', () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const result = estimateSupplyDays(thirtyDaysAgo, 28)
    expect(result.daysRemaining).toBe(0)
    expect(result.isLow).toBe(true)
  })
})
