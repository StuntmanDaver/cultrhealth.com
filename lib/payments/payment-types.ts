// Shared types for BNPL payment providers (Klarna & Affirm)

export type PaymentProvider = 'stripe' | 'klarna' | 'affirm';

export type CheckoutType = 'subscription' | 'product';

export interface CheckoutRequest {
  provider: PaymentProvider;
  type: CheckoutType;
  /** Plan slug for subscriptions, or undefined for product checkout */
  planSlug?: string;
  /** Cart items for product checkout */
  items?: CheckoutItem[];
  /** Total amount in USD cents */
  amountCents: number;
  /** Customer email if known */
  email?: string;
  /** PHI-free metadata */
  metadata?: Record<string, string>;
}

export interface CheckoutItem {
  sku: string;
  name: string;
  quantity: number;
  /** Price in USD cents */
  unitPriceCents: number;
}

// ---------------------
// Klarna Types
// ---------------------

export interface KlarnaSessionRequest {
  purchase_country: string;
  purchase_currency: string;
  locale: string;
  order_amount: number;
  order_tax_amount: number;
  order_lines: KlarnaOrderLine[];
  merchant_urls?: {
    terms: string;
    checkout: string;
    confirmation: string;
    push: string;
  };
}

export interface KlarnaOrderLine {
  type: 'physical' | 'digital' | 'discount' | 'shipping_fee';
  name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  total_tax_amount: number;
  tax_rate: number;
  reference?: string;
}

export interface KlarnaSessionResponse {
  session_id: string;
  client_token: string;
  payment_method_categories: {
    identifier: string;
    name: string;
    asset_urls: {
      descriptive: string;
      standard: string;
    };
  }[];
}

export interface KlarnaOrderResponse {
  order_id: string;
  fraud_status: 'ACCEPTED' | 'PENDING' | 'REJECTED';
  redirect_url?: string;
}

export interface KlarnaWebhookEvent {
  event_id: string;
  event_type: string;
  order_id: string;
}

// ---------------------
// Affirm Types
// ---------------------

export interface AffirmCheckoutConfig {
  merchant: {
    user_confirmation_url: string;
    user_cancel_url: string;
    user_confirmation_url_action: 'GET' | 'POST';
    name: string;
  };
  shipping?: {
    name: { first: string; last: string };
    address: {
      line1: string;
      city: string;
      state: string;
      zipcode: string;
      country: string;
    };
  };
  items: AffirmItem[];
  metadata: {
    mode?: 'modal';
    order_id?: string;
    [key: string]: string | undefined;
  };
  order_id: string;
  currency: string;
  total: number;
  tax_amount?: number;
  shipping_amount?: number;
}

export interface AffirmItem {
  display_name: string;
  sku: string;
  unit_price: number;
  qty: number;
  item_url?: string;
}

export interface AffirmChargeRequest {
  checkout_token: string;
  order_id: string;
}

export interface AffirmChargeResponse {
  id: string;
  amount: number;
  created: string;
  currency: string;
  order_id: string;
  status: 'authorized' | 'captured' | 'voided' | 'refunded';
  events: {
    type: string;
    created: string;
  }[];
}

export interface AffirmCaptureResponse {
  id: string;
  amount: number;
  fee: number;
  created: string;
  order_id: string;
  type: 'capture';
}

export interface AffirmWebhookEvent {
  type: string;
  data: {
    id: string;
    order_id: string;
    amount: number;
    status: string;
  };
}
