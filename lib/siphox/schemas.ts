// SiPhox Health API Response Schemas
// Zod schemas for runtime validation of all SiPhox API responses
// All object schemas use .passthrough() to allow unknown fields
// (schemas are inferred from documentation, not validated against real API yet)

import { z } from 'zod'

// ============================================================
// CUSTOMER
// ============================================================

// Customer response from POST /customer or GET /customers/:id
export const SiphoxCustomerSchema = z.object({
  _id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  external_id: z.string().optional(),
}).passthrough()

// ============================================================
// ORDER
// ============================================================

// Order response from POST /orders
export const SiphoxOrderSchema = z.object({
  _id: z.string(),
  status: z.string(),
  kit_types: z.array(z.object({
    kitType: z.string(),
    quantity: z.number(),
  }).passthrough()),
  recipient: z.object({
    first_name: z.string(),
    last_name: z.string(),
    email: z.string(),
    external_id: z.string().optional(),
  }).passthrough(),
  created_at: z.string().optional(),
}).passthrough()

// ============================================================
// CREDITS
// ============================================================

// Credit balance from GET /credits
export const SiphoxCreditsSchema = z.object({
  balance: z.number(),
}).passthrough()

// ============================================================
// KIT VALIDATION
// ============================================================

// Kit validation from GET /kits/:kitID/validate
export const SiphoxKitValidationSchema = z.object({
  valid: z.boolean(),
  kitId: z.string().optional(),
  status: z.string().optional(),
}).passthrough()

// ============================================================
// BIOMARKER RESULTS & REPORTS
// ============================================================

// Individual biomarker result within a report
export const SiphoxBiomarkerResultSchema = z.object({
  biomarker: z.string(),
  value: z.number().nullable(),
  unit: z.string(),
  reference_range: z.object({
    low: z.number().optional(),
    high: z.number().optional(),
    optimal_low: z.number().optional(),
    optimal_high: z.number().optional(),
  }).passthrough().optional(),
  status: z.string().optional(),
}).passthrough()

// Full report from GET /customers/:id/reports/:reportID
export const SiphoxReportSchema = z.object({
  _id: z.string(),
  customer_id: z.string(),
  biomarkers: z.array(SiphoxBiomarkerResultSchema),
  suggestions: z.array(z.object({
    _id: z.string().optional(),
    text: z.string(),
    category: z.string().optional(),
    link: z.string().optional(),
  }).passthrough()).optional(),
  created_at: z.string().optional(),
  status: z.string().optional(),
}).passthrough()
