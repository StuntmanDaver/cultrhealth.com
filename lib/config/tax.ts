// Tax configuration for CULTR Health
// Business location: Alachua County, Florida
// State rate: 6.0% + County surtax: 1.5% = 7.5% total

export const FL_TAX_RATE = 0.075
export const TAX_RATE_LABEL = 'Sales Tax (7.5%)'

/** Calculate tax in cents from subtotal in cents */
export function calculateTaxCents(subtotalCents: number): number {
  return Math.round(subtotalCents * FL_TAX_RATE)
}

/** Calculate tax in dollars from subtotal in dollars */
export function calculateTaxDollars(subtotalDollars: number): number {
  return Math.round(subtotalDollars * FL_TAX_RATE * 100) / 100
}
