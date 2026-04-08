// Google Analytics event tracking utilities
// Used for tracking user interactions, purchases, and conversions

declare global {
  interface Window {
    gtag: (
      command: 'event' | 'config' | 'js',
      targetId: string,
      config?: Record<string, unknown>
    ) => void
    dataLayer: unknown[]
  }
}

// Check if gtag is available
function isGtagAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function'
}

// Track page view
export function trackPageView(url: string, title?: string): void {
  if (!isGtagAvailable()) return
  
  window.gtag('event', 'page_view', {
    page_location: url,
    page_title: title,
  })
}

// Track product view
export function trackProductView(product: {
  sku: string
  name: string
  category: string
  price?: number
}): void {
  if (!isGtagAvailable()) return
  
  window.gtag('event', 'view_item', {
    currency: 'USD',
    value: product.price || 0,
    items: [
      {
        item_id: product.sku,
        item_name: product.name,
        item_category: product.category,
        price: product.price || 0,
        quantity: 1,
      },
    ],
  })
}

// Track add to cart
export function trackAddToCart(product: {
  sku: string
  name: string
  category: string
  price?: number
  quantity: number
}): void {
  if (!isGtagAvailable()) return
  
  window.gtag('event', 'add_to_cart', {
    currency: 'USD',
    value: (product.price || 0) * product.quantity,
    items: [
      {
        item_id: product.sku,
        item_name: product.name,
        item_category: product.category,
        price: product.price || 0,
        quantity: product.quantity,
      },
    ],
  })
}

// Track remove from cart
export function trackRemoveFromCart(product: {
  sku: string
  name: string
  category: string
  price?: number
  quantity: number
}): void {
  if (!isGtagAvailable()) return
  
  window.gtag('event', 'remove_from_cart', {
    currency: 'USD',
    value: (product.price || 0) * product.quantity,
    items: [
      {
        item_id: product.sku,
        item_name: product.name,
        item_category: product.category,
        price: product.price || 0,
        quantity: product.quantity,
      },
    ],
  })
}

// Track begin checkout
export function trackBeginCheckout(items: {
  sku: string
  name: string
  category: string
  price?: number
  quantity: number
}[], totalValue: number): void {
  if (!isGtagAvailable()) return
  
  window.gtag('event', 'begin_checkout', {
    currency: 'USD',
    value: totalValue,
    items: items.map(item => ({
      item_id: item.sku,
      item_name: item.name,
      item_category: item.category,
      price: item.price || 0,
      quantity: item.quantity,
    })),
  })
}

// Track purchase completion
export function trackPurchase(transaction: {
  transactionId: string
  value: number
  items: {
    sku: string
    name: string
    category: string
    price?: number
    quantity: number
  }[]
  coupon?: string
}): void {
  if (!isGtagAvailable()) return
  
  window.gtag('event', 'purchase', {
    transaction_id: transaction.transactionId,
    currency: 'USD',
    value: transaction.value,
    coupon: transaction.coupon,
    items: transaction.items.map(item => ({
      item_id: item.sku,
      item_name: item.name,
      item_category: item.category,
      price: item.price || 0,
      quantity: item.quantity,
    })),
  })
}

// Track membership signup
export function trackMembershipSignup(membership: {
  tier: string
  price: number
  transactionId?: string
}): void {
  if (!isGtagAvailable()) return
  
  window.gtag('event', 'sign_up', {
    method: 'membership',
    currency: 'USD',
    value: membership.price,
    items: [
      {
        item_id: membership.tier,
        item_name: `${membership.tier} Membership`,
        item_category: 'membership',
        price: membership.price,
        quantity: 1,
      },
    ],
  })

  // Also track as a conversion
  window.gtag('event', 'conversion', {
    send_to: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    value: membership.price,
    currency: 'USD',
    transaction_id: membership.transactionId,
  })
}

// Track waitlist signup
export function trackWaitlistSignup(): void {
  if (!isGtagAvailable()) return
  
  window.gtag('event', 'generate_lead', {
    currency: 'USD',
    value: 0,
  })
}

// Track search
export function trackSearch(searchTerm: string): void {
  if (!isGtagAvailable()) return
  
  window.gtag('event', 'search', {
    search_term: searchTerm,
  })
}

// Track custom event
export function trackEvent(
  eventName: string,
  parameters?: Record<string, unknown>
): void {
  if (!isGtagAvailable()) return
  
  window.gtag('event', eventName, parameters)
}

// Track login
export function trackLogin(method: string = 'magic_link'): void {
  if (!isGtagAvailable()) return
  
  window.gtag('event', 'login', {
    method,
  })
}

// Track quote request
export function trackQuoteRequest(products: { sku: string; name: string }[]): void {
  if (!isGtagAvailable()) return
  
  window.gtag('event', 'generate_lead', {
    currency: 'USD',
    value: 0,
    items: products.map(p => ({
      item_id: p.sku,
      item_name: p.name,
    })),
  })
}

// Track medical intake start
export function trackIntakeStart(): void {
  if (!isGtagAvailable()) return
  
  window.gtag('event', 'begin_checkout', {
    event_category: 'medical_intake',
    event_label: 'start_intake'
  })
}

// Track medical intake step completion
export function trackIntakeStep(stepName: string, stepNumber: number): void {
  if (!isGtagAvailable()) return
  
  window.gtag('event', 'checkout_progress', {
    checkout_step: stepNumber,
    checkout_option: stepName,
    event_category: 'medical_intake',
    event_label: stepName
  })
}

// Track medical intake completion
export function trackIntakeComplete(): void {
  if (!isGtagAvailable()) return
  
  window.gtag('event', 'generate_lead', {
    event_category: 'medical_intake',
    event_label: 'complete_intake',
    value: 0
  })
}

// Track quiz start
export function trackQuizStart(): void {
  if (typeof window === 'undefined') return
  
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'tutorial_begin', {
      event_category: 'quiz',
    })
  }

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: 'quiz_start'
  })
}

// Track quiz step progress
export function trackQuizStep(
  stepNumber: number,
  questionId: string,
  answer: string | string[]
): void {
  if (typeof window === 'undefined') return
  
  const formattedAnswer = Array.isArray(answer) ? answer.join(',') : answer

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'tutorial_progress', {
      event_category: 'quiz',
      step_number: stepNumber,
      question_id: questionId,
      answer: formattedAnswer
    })
  }
  
  // Also push raw data to dataLayer for GTM flexibility
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: 'quiz_step_answered',
    quiz_step: stepNumber,
    quiz_question_id: questionId,
    quiz_answer: formattedAnswer
  })
}

// Track quiz completion and capture all answers
export function trackQuizComplete(
  answers: Record<string, string | string[]>,
  result: { recommendedTier: string; coreTherapy?: { slug: string } }
): void {
  if (typeof window === 'undefined') return
  
  // Format answers for GA4 custom dimensions
  const formattedAnswers = Object.entries(answers).reduce((acc, [key, val]) => {
    acc[`quiz_${key}`] = Array.isArray(val) ? val.join(',') : val
    return acc
  }, {} as Record<string, string>)

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'tutorial_complete', {
      event_category: 'quiz',
      recommended_tier: result.recommendedTier,
      recommended_therapy: result.coreTherapy?.slug || 'none',
      ...formattedAnswers
    })

    // Also track as a generic lead generation event
    window.gtag('event', 'generate_lead', {
      event_category: 'quiz',
      event_label: 'complete_quiz',
      value: 0,
      recommended_tier: result.recommendedTier,
    })
  }

  // Push full payload to dataLayer for GTM
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: 'quiz_completed',
    quiz_answers: answers,
    recommended_tier: result.recommendedTier,
    recommended_therapy: result.coreTherapy?.slug || null
  })
}
