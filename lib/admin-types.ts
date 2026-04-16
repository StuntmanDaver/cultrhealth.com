// Admin dashboard shared types — extracted from AdminDashboardClient.tsx

export interface OrderRow {
  id: string
  order_number: string
  customer_email: string
  status: string
  total_amount: number
  created_at: string
  items: { sku: string; name: string; quantity: number; unit_price: number }[]
}

export interface SalesStats {
  totalOrders: number
  totalRevenue: number
  ordersByStatus: Record<string, number>
  topProducts: { sku: string; name: string; quantity: number; revenue: number }[]
  recentOrders: {
    id: string
    order_number: string
    customer_email: string
    status: string
    total_amount: number
    created_at: string
    items: { sku: string; name: string; quantity: number; unit_price: number }[]
  }[]
}

export interface WaitlistStats {
  total: number
  bySource: Record<string, number>
  recent: {
    id: string
    name: string
    email: string
    created_at: string
    source?: string
  }[]
}

export interface MembershipStats {
  total: number
  byTier: Record<string, number>
  byStatus: Record<string, number>
}

export interface CouponStatRow {
  coupon_code: string
  discount_percent: number
  usage_count: number
  total_revenue: number
  total_discount: number
  avg_order_value: number
  creator_name: string | null
  attributed_creator_id: string | null
  program_type: string | null
}

export interface PrelaunchStats {
  totalCodes: number
  activeCodes: number
  expiredCodes: number
  totalRedemptions: number
  totalRevenue: number
  totalDiscountGiven: number
}

export interface CouponStats {
  coupons: CouponStatRow[]
  totalCouponOrders: number
  totalCouponRevenue: number
  totalDiscountGiven: number
}

export interface CreatorStats {
  activeCreatorsWithCommissions: number
  totalPending: number
  totalApproved: number
  totalPaid: number
  totalLifetime: number
  creatorsByStatus: Record<string, number>
}

export interface QrScanStats {
  totalScans: number
  uniqueVisitors: number
  byDestination: Record<string, number>
  bySource: Record<string, number>
  byDevice: Record<string, number>
  byOs: Record<string, number>
  byBrowser: Record<string, number>
  byCity: { city: string; region: string; country: string; count: number }[]
  scansByDay: { date: string; count: number }[]
  recentScans: {
    scan_id: string
    source: string
    destination: string
    device_type: string
    os: string
    browser: string
    city: string | null
    region: string | null
    country: string | null
    created_at: string
  }[]
}

export interface CreatorAdminRow {
  id: string
  email: string
  full_name: string
  phone: string | null
  social_handle: string | null
  bio: string | null
  age: number | null
  gender: string | null
  status: string
  tier: number
  commission_rate: number
  override_rate: number
  recruit_count: number
  payout_method: string | null
  created_at: string
  code_count: number
  total_code_revenue: number
}

export interface TrackingLinkAdminRow {
  id: string
  slug: string
  destination_path: string
  click_count: number
  conversion_count: number
  active: boolean
  created_at: string
  creator_name: string | null
  creator_status: string | null
}

export interface CreatorLinkPerformanceRow {
  creator_id: string
  creator_name: string
  total_clicks: number
  converted_clicks: number
  non_converted_clicks: number
  conversion_rate: number
}

export interface AffiliateCodeAdminRow {
  id: string
  creator_id: string | null
  code: string
  code_type: string
  discount_type: string
  discount_value: number
  use_count: number
  total_revenue: number
  active: boolean
  expires_at: string | null
  program_type: string
  stripe_promotion_code_id: string | null
  created_at: string
  creator_name: string | null
}

export interface CustomerAdminRow {
  id: string
  name: string
  email: string
  phone: string | null
  address_city: string | null
  address_state: string | null
  signup_type: string | null
  source: string | null
  created_at: string
  order_count: number
  total_spent: number
  age: number | null
  gender: string | null
  converted: boolean
  avg_order_value: number | null
  browser: string | null
  device_type: string | null
}

export interface DashboardCounts {
  totalCustomers: number
  pendingInvoices: number
}

export interface ClubOrderItem {
  therapyId: string
  name: string
  price: number | null
  pricingNote?: string
  note?: string
  quantity: number
}

export interface InvoiceAgingRow {
  id: string
  order_number: string
  member_name: string
  member_email: string
  items: string // JSON string → ClubOrderItem[]
  subtotal_usd: number | null
  coupon_code: string | null
  discount_percent: number | null
  tax_amount_usd: number | null
  status: string
  created_at: string
  days_pending: number
}

export interface RefundStats {
  refunded: number
  total: number
  refundedAmount: number
  totalAmount: number
  refundRate: number
}

export interface RevenueByTierRow {
  tier: string
  orders: number
  revenue: number
}

export interface CreatorROIRow {
  id: string
  fullName: string
  totalDiscountGiven: number
  totalCommissionEarned: number
}

export interface IntakeFunnel {
  totalStarted: number
  completed: number
  pending: number
  completionRate: number
}

export interface RevenueTimeSeriesPoint {
  date: string
  revenue: number
  orders: number
}

export interface SearchOrderRow {
  id: string
  order_number: string
  customer_email: string
  customer_name: string | null
  status: string
  total_amount: number
  created_at: string
  source: 'orders' | 'club_orders'
  items: { sku: string; name: string; quantity: number; unit_price: number }[]
  coupon_code: string | null
}

export interface OrderSearchData {
  orders: SearchOrderRow[]
  total: number
  page: number
  totalPages: number
}

export interface CustomerProfile {
  member: {
    id: string
    name: string
    email: string
    phone: string | null
    address_street: string | null
    address_city: string | null
    address_state: string | null
    address_zip: string | null
    age: number | null
    gender: string | null
    signup_type: string | null
    source: string | null
    created_at: string
  } | null
  clubOrders: {
    id: string
    order_number: string
    status: string
    subtotal_usd: number | null
    items: { therapyId?: string; name: string; price: number | null; quantity: number; pricingNote?: string }[] | null
    coupon_code: string | null
    created_at: string
  }[]
  productOrders: {
    id: string
    order_number: string
    status: string
    total_amount: number
    items: { sku?: string; name: string; quantity: number; unit_price?: number }[] | null
    payment_provider: string | null
    created_at: string
  }[]
  membership: {
    plan_tier: string
    subscription_status: string
    created_at: string
  } | null
  intakeStatus: {
    intake_status: string
    plan_tier: string
    created_at: string
  } | null
  lifetimeValue: number
  totalOrders: number
}

export interface MembershipAdminRow {
  id: string
  email: string
  stripe_customer_id: string
  stripe_subscription_id: string
  plan_tier: string
  subscription_status: string
  created_at: string
  updated_at: string
  cancelled_at: string | null
  cancellation_reason: string | null
}

export interface InventoryAlertRow {
  therapyId: string
  therapyName: string
  stockStatus: 'low_stock' | 'out_of_stock' | 'restocking_soon'
  stockQuantity: number | null
  updatedAt: string
}

export interface AnalyticsData {
  sales: SalesStats
  waitlist: WaitlistStats
  memberships: MembershipStats
  coupons: CouponStats
  creators: CreatorStats
  qrScans: QrScanStats
  prelaunch: PrelaunchStats
  allCreators: CreatorAdminRow[]
  allTrackingLinks: TrackingLinkAdminRow[]
  allCouponCodes: AffiliateCodeAdminRow[]
  allCustomers: CustomerAdminRow[]
  allMemberships: MembershipAdminRow[]
  dashboardCounts: DashboardCounts
  invoiceAging: InvoiceAgingRow[]
  refundStats: RefundStats
  revenueByTier: RevenueByTierRow[]
  bnplAdoption: Record<string, number>
  creatorROI: CreatorROIRow[]
  intakeFunnel: IntakeFunnel
  revenueTimeSeries: RevenueTimeSeriesPoint[]
  creatorLinkPerformance: CreatorLinkPerformanceRow[]
  clubOrderFulfillment: Record<string, number>
  inventoryAlerts: InventoryAlertRow[]
  periodDays: number
  generatedAt: string
}
