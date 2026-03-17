// SiPhox Health API - Barrel Export
// Public API surface for the SiPhox integration

export {
  createCustomer,
  getCustomerByExternalId,
  createOrder,
  getOrder,
  validateKit,
  registerKit,
  getReports,
  getReport,
  getBiomarkers,
  checkCreditBalance,
  isSiphoxConfigured,
} from './client'

export {
  deriveKitLifecycleState,
  KIT_LIFECYCLE_STAGES,
} from './kit-lifecycle'

export type {
  KitLifecycleState,
  KitLifecycleStage,
} from './kit-lifecycle'

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
  // Fulfillment operations (migration 021)
  insertFulfillmentOrder,
  getOrderByCheckoutSession,
  getPendingFulfillmentOrders,
  getDeferredIntakeOrders,
  updateFulfillmentStatus,
  incrementRetryCount,
} from './db'

export type {
  SiphoxCustomerRow,
  SiphoxKitOrderRow,
  SiphoxReportRow,
  FulfillmentStatus,
} from './db'

export {
  triggerSiphoxFulfillment,
  processDeferredOrders,
  retryFailedOrders,
  notifySiphoxRefund,
} from './fulfillment'
