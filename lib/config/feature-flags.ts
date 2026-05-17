// Feature flags for vendor migration.
// Keep each flag disabled unless the integration is fully configured
// in the target environment end-to-end.

export const USE_HEALTHIE =
  process.env.USE_HEALTHIE === 'true' &&
  Boolean(process.env.HEALTHIE_API_KEY)

export const USE_XERO =
  process.env.USE_XERO === 'true' &&
  Boolean(process.env.XERO_CLIENT_ID) &&
  Boolean(process.env.XERO_WEBHOOK_KEY)

// QuickBooks is being replaced by Xero. Keep gated so both can run during transition.
export const USE_QUICKBOOKS =
  process.env.USE_QUICKBOOKS === 'true' &&
  Boolean(process.env.QUICKBOOKS_CLIENT_ID)
