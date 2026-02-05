// Type definitions for Letter of Medical Necessity (LMN)

export interface LmnItem {
  sku: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  category: string
}

export interface LmnData {
  lmnNumber: string
  orderNumber: string
  customerEmail: string
  customerName: string | null
  items: LmnItem[]
  eligibleTotal: number
  currency: string
  issueDate: Date
  attestationText: string
  providerReference: string
}

export interface LmnRecord {
  id: string
  lmn_number: string
  order_id: string | null
  order_number: string
  customer_email: string
  customer_name: string | null
  items: LmnItem[]
  eligible_total: number
  currency: string
  issue_date: Date
  created_at: Date
  attestation_text: string | null
  provider_reference: string | null
}

export interface CreateLmnInput {
  orderNumber: string
  orderId?: string
  customerEmail: string
  customerName?: string
  items: LmnItem[]
  eligibleTotal: number
  currency?: string
}

// Standard attestation text for all LMNs
export const LMN_ATTESTATION_TEXT = `This letter certifies that the products listed above have been determined to be medically necessary as part of a physician-supervised treatment protocol conducted through CULTR Health's telehealth platform. These peptide therapeutics are prescribed for the treatment, mitigation, or prevention of disease, or for the purpose of affecting a structure or function of the body.

This documentation is provided for HSA (Health Savings Account) and FSA (Flexible Spending Account) reimbursement purposes in accordance with IRS regulations governing qualified medical expenses.

The patient has undergone a telehealth consultation with a licensed healthcare provider who has evaluated their medical history, current health status, and treatment goals before prescribing these products.`

export const LMN_PROVIDER_REFERENCE = 'CULTR Health Medical Team - Telehealth Provider Network'
