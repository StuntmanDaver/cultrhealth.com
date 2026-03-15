// SiPhox Health API Types
// Types inferred from Zod schemas plus request types

import { z } from 'zod'
import {
  SiphoxCustomerSchema,
  SiphoxOrderSchema,
  SiphoxCreditsSchema,
  SiphoxKitValidationSchema,
  SiphoxReportSchema,
  SiphoxBiomarkerResultSchema,
} from './schemas'

// ============================================================
// RESPONSE TYPES (inferred from Zod schemas)
// ============================================================

export type SiphoxCustomer = z.infer<typeof SiphoxCustomerSchema>
export type SiphoxOrder = z.infer<typeof SiphoxOrderSchema>
export type SiphoxCredits = z.infer<typeof SiphoxCreditsSchema>
export type SiphoxKitValidation = z.infer<typeof SiphoxKitValidationSchema>
export type SiphoxReport = z.infer<typeof SiphoxReportSchema>
export type SiphoxBiomarkerResult = z.infer<typeof SiphoxBiomarkerResultSchema>

// ============================================================
// REQUEST TYPES (not derived from Zod -- these are outgoing)
// ============================================================

export interface CreateSiphoxCustomerRequest {
  first_name: string
  last_name: string
  email: string
  phone: string
  external_id: string
  address?: {
    street1: string
    street2?: string
    city: string
    state: string
    zip: string
    country: string
  }
}

export interface CreateSiphoxOrderRequest {
  recipient: {
    first_name: string
    last_name: string
    email: string
    phone?: string
    external_id?: string
    address?: {
      street1: string
      street2?: string
      city: string
      state: string
      zip: string
      country: string
    }
  }
  kit_types: Array<{
    kitType: string
    quantity: number
  }>
  is_test_order?: boolean
  is_notify_receiver?: boolean
  purchase_with_attached_payment?: boolean
}
