// SiPhox Health API - Barrel Export
// Public API surface for the SiPhox integration

export {
  createCustomer,
  getCustomerByExternalId,
  createOrder,
  getOrder,
  validateKit,
  getReports,
  getReport,
  getBiomarkers,
  checkCreditBalance,
  isSiphoxConfigured,
} from './client'

export {
  SiphoxCustomerSchema,
  SiphoxOrderSchema,
  SiphoxCreditsSchema,
  SiphoxKitValidationSchema,
  SiphoxBiomarkerResultSchema,
  SiphoxReportSchema,
} from './schemas'

export type {
  SiphoxCustomer,
  SiphoxOrder,
  SiphoxCredits,
  SiphoxKitValidation,
  SiphoxReport,
  SiphoxBiomarkerResult,
  CreateSiphoxCustomerRequest,
  CreateSiphoxOrderRequest,
} from './types'

export { SiphoxApiError } from './errors'

export {
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
} from './db'

export type {
  SiphoxCustomerRow,
  SiphoxKitOrderRow,
  SiphoxReportRow,
} from './db'
