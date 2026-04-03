// Shared types for payment providers (Stripe + CorePay)

export type PaymentProvider = 'stripe' | 'corepay';

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

// CorePay uses the Authorize.Net Accept.js gateway — these types are needed for tokenization
export interface AuthorizeNetOpaqueData {
  dataDescriptor: string;
  dataValue: string;
}

export interface AuthorizeNetTransactionResponse {
  transactionResponse?: {
    responseCode: '1' | '2' | '3' | '4'; // 1=Approved, 2=Declined, 3=Error, 4=Held
    authCode?: string;
    transId: string;
    accountNumber?: string;
    accountType?: string;
    messages?: {
      message: {
        code: string;
        description: string;
      }[];
    };
    errors?: {
      error: {
        errorCode: string;
        errorText: string;
      }[];
    };
  };
  messages: {
    resultCode: 'Ok' | 'Error';
    message: {
      code: string;
      text: string;
    }[];
  };
}
