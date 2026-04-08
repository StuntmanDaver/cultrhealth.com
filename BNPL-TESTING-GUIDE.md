# BNPL Testing Guide
## Testing Klarna and Affirm Integrations

This guide will help you test the Klarna and Affirm Buy Now, Pay Later (BNPL) integrations.

---

## Quick Start

The BNPL feature flags are **ENABLED** in your `.env` file. The dev server is already running at http://localhost:3000.

**Current Status:**
- ✅ BNPL integrations fully built and integrated
- ✅ Feature flags enabled (`NEXT_PUBLIC_ENABLE_KLARNA=true`, `NEXT_PUBLIC_ENABLE_AFFIRM=true`)
- ✅ Sample product pricing added to catalog
- ⚠️  Sandbox credentials needed for full testing (see below)

---

## Testing the User Experience

### 1. View BNPL Badges on Pricing Page

**URL:** http://localhost:3000/pricing

**What to look for:**
- Under each membership tier price, you should see a BNPL badge
- Badge shows: "4 interest-free payments of $X with Klarna or Affirm"
- Badge only appears for plans that meet minimum BNPL amounts:
  - Klarna: $35 - $1,000
  - Affirm: $50 - $30,000

---

### 2. Test Payment Method Selector (Membership Join)

**URL:** http://localhost:3000/join/creator

**What to test:**
1. Navigate to the join page for any tier
2. Scroll to the payment section
3. You should see **three payment options**:
   - ✓ Credit / Debit Card (Stripe)
   - ✓ Klarna - "Pay in 4 interest-free installments"
   - ✓ Affirm - "Pay over time"

**Expected Behavior:**
- Payment method selector shows all three options
- Radio button UI with provider logos
- Selecting Klarna/Affirm will show loading state
- **Note:** Without real sandbox credentials, the widgets will show an error after loading

---

### 3. Test Product Shop & Cart Checkout

**Step 1: Browse Products**
- **URL:** http://localhost:3000/library/shop
- **Note:** You'll need to be "logged in" (or the app will redirect you to login)

**Step 2: Add Products to Cart**
- Click on any product that has a price (e.g., BPC-157, TB-500, NAD+)
- Add to cart
- Products with pricing added:
  - BPC-157 5mg: $89.00
  - BPC-157 10mg: $149.00
  - TB-500 5mg: $99.00
  - TB-500 10mg: $169.00
  - Ipamorelin 5mg: $79.00
  - NAD+ 500mg: $199.00
  - Various blends: $149-$289

**Step 3: View Cart**
- **URL:** http://localhost:3000/library/cart
- Cart shows all items with quantities
- Order summary on the right side

**Step 4: Select Payment Method**
- In the order summary, you should see the **Payment Method** selector
- Choose between:
  - Credit / Debit Card (Stripe)
  - Klarna
  - Affirm

**Step 5: Complete Checkout**
- If Stripe: Click "Checkout $XX.XX" button
- If Klarna: Widget will load (needs real credentials)
- If Affirm: Button will load (needs real credentials)

---

## Testing with Real Sandbox Credentials

To fully test the Klarna and Affirm flows, you need real sandbox credentials:

### Klarna Sandbox Setup

1. **Sign up for Klarna Merchant Account (Sandbox)**
   - Visit: https://portal.klarna.com/
   - Apply for a sandbox account (free for testing)
   - Business category: Health & Wellness / Telemedicine

2. **Get API Credentials**
   - Log into Klarna Merchant Portal
   - Navigate to **Settings > API Credentials**
   - Copy your:
     - API Key
     - API Secret
     - Client ID

3. **Update `.env` file**
   ```env
   KLARNA_API_KEY=your_actual_sandbox_key
   KLARNA_API_SECRET=your_actual_sandbox_secret
   NEXT_PUBLIC_KLARNA_CLIENT_ID=your_actual_client_id
   ```

4. **Restart dev server**
   ```bash
   # Stop current server
   pkill -f "next dev"
   
   # Start fresh
   npm run dev
   ```

5. **Test Klarna Flow**
   - Go to cart or join page
   - Select Klarna as payment method
   - Klarna widget should load successfully
   - Complete test checkout with Klarna test cards

### Affirm Sandbox Setup

1. **Sign up for Affirm Merchant Account (Sandbox)**
   - Visit: https://www.affirm.com/business
   - Apply for a sandbox account (free for testing)
   - Business category: Health & Wellness

2. **Get API Credentials**
   - Log into Affirm Merchant Dashboard
   - Navigate to **Settings > API Keys**
   - Copy your:
     - Private API Key
     - Public API Key

3. **Update `.env` file**
   ```env
   AFFIRM_PRIVATE_API_KEY=your_actual_sandbox_private_key
   NEXT_PUBLIC_AFFIRM_PUBLIC_KEY=your_actual_sandbox_public_key
   ```

4. **Restart dev server**
   ```bash
   pkill -f "next dev"
   npm run dev
   ```

5. **Test Affirm Flow**
   - Go to cart or join page
   - Select Affirm as payment method
   - Affirm button should load successfully
   - Click button to open Affirm modal
   - Complete test checkout with Affirm test account

---

## Visual Testing Checklist

### On the Pricing Page
- [ ] BNPL badges appear under each plan price
- [ ] Badge text is readable and properly formatted
- [ ] Badge shows correct installment amounts
- [ ] Badge disappears for plans below minimum amount

### On the Join Page
- [ ] Payment method selector appears
- [ ] All three payment options are visible
- [ ] Radio buttons work correctly
- [ ] Provider logos (Klarna pink badge, Affirm blue badge) display
- [ ] Selecting Klarna shows loading state
- [ ] Selecting Affirm shows loading state
- [ ] Error message appears if credentials are missing/invalid

### On the Cart/Checkout Page
- [ ] Cart displays priced products correctly
- [ ] Order summary shows correct totals
- [ ] Payment method selector appears
- [ ] Klarna/Affirm options only show if cart total is eligible
- [ ] Stripe checkout button works
- [ ] Selected payment method is visually highlighted

### On the Success Page
- [ ] Success page loads after checkout
- [ ] Provider-specific messaging appears
- [ ] Order details are displayed

---

## Mock Testing (Without Real Credentials)

You can still test the UI/UX without real API credentials:

1. **Visual Inspection**
   - Payment method selector appearance
   - BNPL badges on pricing cards
   - Button states and loading indicators

2. **Flow Navigation**
   - Adding products to cart
   - Cart quantity controls
   - Navigating between shop/cart/checkout

3. **Error Handling**
   - What happens when widgets fail to load
   - Fallback to Stripe

4. **Responsive Design**
   - Test on different screen sizes
   - Mobile vs desktop layouts

---

## Troubleshooting

### Payment Options Don't Appear

**Check:**
1. Feature flags are enabled in `.env`:
   ```env
   NEXT_PUBLIC_ENABLE_KLARNA=true
   NEXT_PUBLIC_ENABLE_AFFIRM=true
   ```

2. Cart/order total meets minimum:
   - Klarna: $35.00+
   - Affirm: $50.00+

3. Dev server was restarted after changing `.env`

### Widgets Show Loading Forever

**Reason:** Missing or invalid API credentials

**Solution:**
- Add real sandbox credentials (see setup sections above)
- Or expect this behavior when testing without credentials

### Checkout Fails

**Check:**
1. For Klarna: Valid `KLARNA_API_KEY`, `KLARNA_API_SECRET`, `NEXT_PUBLIC_KLARNA_CLIENT_ID`
2. For Affirm: Valid `AFFIRM_PRIVATE_API_KEY`, `NEXT_PUBLIC_AFFIRM_PUBLIC_KEY`
3. API URLs point to sandbox:
   - Klarna: `https://api.playground.klarna.com`
   - Affirm: `https://sandbox.affirm.com`

---

## Test Scenarios

### Scenario 1: Subscription Purchase with Klarna

1. Go to http://localhost:3000/pricing
2. Click "Get Started" on Creator plan
3. Select "Klarna" as payment method
4. Complete Klarna widget flow
5. Verify success page shows correct details

### Scenario 2: Product Purchase with Affirm

1. Login to library (or bypass auth check)
2. Go to http://localhost:3000/library/shop
3. Add BPC-157 10mg ($149) to cart
4. Go to cart
5. Select "Affirm" as payment method
6. Click Affirm button to open modal
7. Complete Affirm checkout
8. Verify success page

### Scenario 3: Mixed Cart with Multiple Products

1. Add multiple products to cart
2. Verify total is calculated correctly
3. Verify BNPL options appear based on total
4. Test quantity changes affect BNPL eligibility

### Scenario 4: Cart Below Minimum Amount

1. Add only Bacteriostatic Water ($15) to cart
2. Verify BNPL options do NOT appear
3. Only Stripe option should be available

---

## Next Steps

1. **Get Sandbox Credentials**
   - Apply for Klarna sandbox account
   - Apply for Affirm sandbox account
   - Update `.env` with real credentials

2. **Test Full Checkout Flows**
   - Complete test purchases with both providers
   - Verify webhooks (once configured)
   - Test fraud detection scenarios

3. **Mobile Testing**
   - Test on actual mobile devices
   - iOS and Android SDK integration (see `docs/BNPL-MOBILE-SDK.md`)

4. **Production Preparation**
   - Switch to production API URLs
   - Update credentials to production keys
   - Configure webhook endpoints
   - Review merchant setup guide (`docs/BNPL-MERCHANT-SETUP.md`)

---

## Useful Links

- **Klarna Docs:** https://docs.klarna.com/
- **Affirm Docs:** https://docs.affirm.com/
- **Merchant Setup Guide:** `/docs/BNPL-MERCHANT-SETUP.md`
- **Mobile SDK Guide:** `/docs/BNPL-MOBILE-SDK.md`

---

## Support

If you encounter issues during testing:

1. Check browser console for errors
2. Check dev server logs for API errors
3. Verify environment variables are set correctly
4. Ensure dev server was restarted after `.env` changes
5. Review the merchant setup documentation

**Remember:** The integrations are fully built and ready. You just need real sandbox credentials to test the complete payment flows!
