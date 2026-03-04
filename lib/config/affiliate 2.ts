// Affiliate Program Configuration
// Commission rates, tier thresholds, and attribution settings

// ===========================================
// TYPES
// ===========================================

export type CreatorStatus = 'pending' | 'active' | 'paused' | 'rejected'
export type AttributionMethod = 'link_click' | 'coupon_code' | 'manual'
export type CommissionType = 'direct' | 'override' | 'adjustment'
export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'reversed'
export type AttributionStatus = 'pending' | 'approved' | 'paid' | 'refunded'
export type PayoutMethod = 'stripe_connect' | 'bank_transfer' | 'paypal'
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Creator {
  id: string
  email: string
  full_name: string
  phone?: string
  social_handle?: string
  bio?: string
  status: CreatorStatus
  recruiter_id?: string
  recruit_count: number
  tier: number
  override_rate: number
  payout_method?: PayoutMethod
  payout_destination_id?: string
  email_verified: boolean
  approved_at?: string
  approved_by?: string
  created_at: string
  updated_at: string
}

export interface AffiliateCode {
  id: string
  creator_id: string
  code: string
  is_primary: boolean
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  use_count: number
  total_revenue: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface TrackingLink {
  id: string
  creator_id: string
  slug: string
  destination_path: string
  utm_source: string
  utm_medium: string
  utm_campaign?: string
  click_count: number
  conversion_count: number
  active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface ClickEvent {
  id: string
  creator_id: string
  link_id?: string
  session_id: string
  attribution_token: string
  ip_hash?: string
  user_agent?: string
  referer?: string
  clicked_at: string
  expires_at: string
  converted: boolean
  order_id?: string
}

export interface OrderAttribution {
  id: string
  order_id: string
  creator_id: string
  attribution_method: AttributionMethod
  link_id?: string
  code_id?: string
  click_event_id?: string
  customer_email?: string
  net_revenue: number
  direct_commission_rate: number
  direct_commission_amount: number
  status: AttributionStatus
  is_self_referral: boolean
  created_at: string
  updated_at: string
}

export interface CommissionLedgerEntry {
  id: string
  order_attribution_id: string
  beneficiary_creator_id: string
  commission_type: CommissionType
  source_creator_id?: string
  base_amount: number
  commission_rate: number
  commission_amount: number
  tier_level: number
  status: CommissionStatus
  payout_id?: string
  created_at: string
  updated_at: string
}

export interface Payout {
  id: string
  creator_id: string
  amount: number
  period_start: string
  period_end: string
  payout_method?: PayoutMethod
  provider_payout_id?: string
  status: PayoutStatus
  commission_count: number
  paid_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface AdminAction {
  id: string
  admin_email: string
  action_type: string
  entity_type: string
  entity_id?: string
  reason?: string
  metadata?: Record<string, unknown>
  created_at: string
}

// Dashboard metrics returned by the API
export interface CreatorDashboardMetrics {
  totalClicks: number
  totalOrders: number
  totalRevenue: number
  totalCommission: number
  pendingCommission: number
  thisMonthClicks: number
  thisMonthOrders: number
  thisMonthRevenue: number
  thisMonthCommission: number
  conversionRate: number
  tier: number
  overrideRate: number
  recruitCount: number
  nextTierRequirement: number
}

export interface EarningsOverview {
  lifetimeEarnings: number
  pendingEarnings: number
  paidEarnings: number
  thisMonthEarnings: number
  lastMonthEarnings: number
  avgOrderValue: number
}

export interface NetworkSummary {
  totalRecruits: number
  activeRecruits: number
  recruitRevenue?: number
  overrideEarnings: number
  tier: number
  tierName?: string
  overrideRate: number
  recruitCount: number
  nextTierAt: number
}

// ===========================================
// COMMISSION CONFIGURATION
// ===========================================

export const COMMISSION_CONFIG = {
  // Direct commission rate (10% of net revenue)
  directRate: 10.00,

  // Total commission cap per order (20% of net revenue)
  totalCapRate: 20.00,

  // Minimum payout threshold
  minPayoutAmount: 50.00,

  // Attribution cookie window (30 days in milliseconds)
  attributionWindowMs: 30 * 24 * 60 * 60 * 1000,

  // Attribution cookie name
  attributionCookieName: 'cultr_attribution',

  // Payout schedule (net-30 days)
  payoutDelayDays: 30,

  // Commission approval delay (30-day refund window)
  approvalDelayDays: 30,
} as const

// ===========================================
// TIER CONFIGURATION
// ===========================================

export interface TierConfig {
  tier: number
  name: string
  minRecruits: number
  overrideRate: number
}

export const TIER_CONFIGS: TierConfig[] = [
  { tier: 0, name: 'Starter', minRecruits: 0, overrideRate: 0.00 },
  { tier: 1, name: 'Bronze', minRecruits: 5, overrideRate: 2.00 },
  { tier: 2, name: 'Silver', minRecruits: 10, overrideRate: 4.00 },
  { tier: 3, name: 'Gold', minRecruits: 15, overrideRate: 6.00 },
  { tier: 4, name: 'Platinum', minRecruits: 20, overrideRate: 8.00 },
]

export function getTierForRecruitCount(recruitCount: number): TierConfig {
  // Find highest tier the creator qualifies for
  for (let i = TIER_CONFIGS.length - 1; i >= 0; i--) {
    if (recruitCount >= TIER_CONFIGS[i].minRecruits) {
      return TIER_CONFIGS[i]
    }
  }
  return TIER_CONFIGS[0]
}

export function getNextTierRequirement(currentTier: number): number {
  const nextTier = TIER_CONFIGS.find(t => t.tier === currentTier + 1)
  return nextTier ? nextTier.minRecruits : TIER_CONFIGS[TIER_CONFIGS.length - 1].minRecruits
}

export function getTierName(tier: number): string {
  return TIER_CONFIGS.find(t => t.tier === tier)?.name || 'Starter'
}

// ===========================================
// DEFAULT LINK DESTINATIONS
// ===========================================

export const LINK_DESTINATIONS = [
  { label: 'Homepage', path: '/' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'GLP-1 Info', path: '/how-it-works' },
  { label: 'Quiz', path: '/quiz' },
  { label: 'FAQ', path: '/faq' },
] as const

// ===========================================
// FTC COMPLIANCE TEMPLATES
// ===========================================

export const FTC_DISCLOSURES = [
  {
    id: 'short',
    label: 'Short Disclosure',
    text: '#ad #CULTRpartner',
  },
  {
    id: 'standard',
    label: 'Standard Disclosure',
    text: 'I earn a commission if you purchase through my link. #CULTRpartner',
  },
  {
    id: 'full',
    label: 'Full Disclosure',
    text: 'This post contains affiliate links. I may earn a commission at no extra cost to you if you make a purchase through my link. All opinions are my own. #CULTRpartner #ad',
  },
] as const
