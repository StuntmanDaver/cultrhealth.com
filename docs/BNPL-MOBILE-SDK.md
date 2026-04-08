# BNPL Mobile SDK Integration

This document covers integrating Klarna and Affirm BNPL into native iOS and Android apps. The **backend API routes are shared** between web and mobile -- only the frontend SDK changes.

---

## Architecture

```
Mobile App (iOS/Android)
    |
    |-- Klarna Mobile SDK / Affirm SDK
    |
    v
Same Backend Endpoints:
    POST /api/checkout/klarna/session   -> returns client_token
    POST /api/checkout/klarna/order     -> captures order
    POST /api/checkout/affirm/checkout  -> returns checkout config
    POST /api/checkout/affirm/capture   -> authorize + capture
```

---

## Klarna Mobile SDK

### iOS (Swift)

**Installation (SPM):**
```
https://github.com/nicklama/klarna-mobile-sdk-spm
```

Or via CocoaPods:
```ruby
pod 'KlarnaMobileSDK'
```

**Integration Flow:**
1. Call your backend `POST /api/checkout/klarna/session` to get `client_token`
2. Initialize `KlarnaPaymentView` with the client token
3. Load the payment view with the payment method category
4. On user authorization, receive `authorization_token`
5. Call your backend `POST /api/checkout/klarna/order` with the token

```swift
import KlarnaMobileSDK

let paymentView = KlarnaPaymentView(category: "pay_later", eventListener: self)
paymentView.initialize(clientToken: clientToken, returnURL: URL(string: "cultrhealth://klarna")!)
paymentView.load()

// KlarnaPaymentEventListener
func klarnaAuthorized(_ paymentView: KlarnaPaymentView, approved: Bool, authToken: String?) {
    guard approved, let token = authToken else { return }
    // Call POST /api/checkout/klarna/order with authorizationToken = token
}
```

### Android (Kotlin)

**Installation (Gradle):**
```gradle
implementation 'com.klarna.mobile:sdk:2.x.x'
```

**Integration Flow:**
Same as iOS. Use `KlarnaPaymentView` from the Android SDK.

```kotlin
val paymentView = KlarnaPaymentView(context)
paymentView.initialize(clientToken, "cultrhealth://klarna")
paymentView.load("pay_later")

paymentView.registerEventListener(object : KlarnaPaymentViewCallback {
    override fun onAuthorized(view: KlarnaPaymentView, approved: Boolean, authToken: String?) {
        if (approved && authToken != null) {
            // Call POST /api/checkout/klarna/order
        }
    }
})
```

---

## Affirm Mobile SDK

### iOS (Swift)

**Installation (CocoaPods):**
```ruby
pod 'AffirmSDK'
```

Or via SPM:
```
https://github.com/Affirm/affirm-merchant-sdk-ios
```

**Integration Flow:**
1. Call your backend `POST /api/checkout/affirm/checkout` to get checkout config
2. Create `AffirmCheckout` object with the config
3. Present `AffirmCheckoutViewController`
4. On success, receive `checkout_token`
5. Call your backend `POST /api/checkout/affirm/capture` with the token

```swift
import AffirmSDK

AffirmConfiguration.shared.configure(publicKey: "YOUR_PUBLIC_KEY", environment: .sandbox)

let checkout = AffirmCheckout(items: items, shipping: nil, totalAmount: totalCents, metadata: nil)
let vc = AffirmCheckoutViewController(delegate: self, checkout: checkout)
present(vc, animated: true)

// AffirmCheckoutDelegate
func checkout(_ checkoutViewController: AffirmCheckoutViewController, completedWithToken token: String) {
    // Call POST /api/checkout/affirm/capture with checkoutToken = token
}
```

### Android (Kotlin)

**Installation (Gradle):**
```gradle
implementation 'com.affirm:affirm-android-sdk:2.x.x'
```

**Integration Flow:**
```kotlin
Affirm.configure(AffirmConfiguration.Builder("YOUR_PUBLIC_KEY", Affirm.Environment.SANDBOX).build())

val checkout = Checkout.builder()
    .setItems(items)
    .setTotal(totalCents)
    .build()

Affirm.startCheckout(this, checkout, REQUEST_CODE)

// onActivityResult
override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    if (Affirm.handleCheckoutData(this, requestCode, resultCode, data)) {
        val token = data?.getStringExtra(Affirm.CHECKOUT_TOKEN)
        // Call POST /api/checkout/affirm/capture
    }
}
```

---

## Key Points

- **Backend is shared**: The same API routes (`/api/checkout/klarna/*`, `/api/checkout/affirm/*`) serve both web and mobile clients
- **Authentication**: Mobile apps should include the same session token (JWT cookie or Authorization header) when calling backend endpoints
- **Deep links**: Configure URL schemes (`cultrhealth://`) for Klarna/Affirm redirects back to the app
- **PHI compliance**: Same rules apply -- no health data in BNPL payloads, only product metadata
