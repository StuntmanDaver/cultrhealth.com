# CULTR Club Order Checkout Flow — Complete Test

## Workflow: Customer → Admin Approval → Payment

### STEP 1: Customer Places Order
- **URL:** `https://join.cultrhealth.com`
- **Action:** Select therapies → Enter name, email, phone → Submit order
- **Expected:**
  - ✅ Order created in DB (status: `pending_approval`)
  - ✅ Order number generated (format: `CLB-XXXXXXXXX-XXXX`)
  - ✅ Customer receives "Order Received" email
  - ✅ Admin receives "ACTION REQUIRED" approval email

### STEP 2: Admin Approves Order
- **Email:** Admin receives at `process.env.ADMIN_APPROVAL_EMAIL` (default: `admin@cultrhealth.com`)
- **Action:** Click "Approve Order" button in email
- **Expected:**
  - ✅ QuickBooks customer created (by name if email not supported)
  - ✅ QB invoice generated with line items + dosage info
  - ✅ QB invoice has payment methods enabled:
    - Online credit card ✅
    - Online ACH ✅
  - ✅ Invoice Link retrieved from QB (`/invoice/{invoiceId}`)
  - ✅ Order status updated to `invoice_sent`
  - ✅ Invoice copy sent to admin
  - ✅ Admin redirected to `/admin/club-orders?approved={orderNumber}`

### STEP 3: Customer Receives Approval + Payment Link
- **Email:** "Your Order is Approved" sent to customer
- **Contains:**
  - Order summary (therapies, quantities, prices)
  - **"Pay Now" button** → links to QuickBooks invoice
  - Payment instructions
- **Payment Link Format:** `https://connect.intuit.com/quickbooks/invoices/...`

### STEP 4: Customer Pays via QuickBooks
- **Action:** Click "Pay Now" in email
- **QB Payment Form Shows:**
  - ✅ Invoice details (order #, therapies, total)
  - ✅ Credit card payment option
  - ✅ ACH payment option
  - ✅ Amount due
- **After Payment:**
  - QB marks invoice as paid
  - Customer receives QB receipt
  - Order complete ✅

---

## Environment Variables Required

### Vercel Production Environment
```
RESEND_API_KEY=re_...          # Email sending
FROM_EMAIL=cultr@...           # Sender email
ADMIN_APPROVAL_EMAIL=admin@    # Admin approval recipient
POSTGRES_URL=postgresql://...  # Database
JWT_SECRET=...                 # Token signing
CLUB_ORDER_APPROVAL_SECRET=... # HMAC token

QUICKBOOKS_CLIENT_ID=...       # OAuth2 client
QUICKBOOKS_CLIENT_SECRET=...   # OAuth2 secret
QUICKBOOKS_REALM_ID=...        # QB company ID
QUICKBOOKS_REFRESH_TOKEN=...   # QB refresh token
QUICKBOOKS_REDIRECT_URI=...    # OAuth2 callback
QUICKBOOKS_SANDBOX=false       # Use production QB
```

### Vercel Staging Environment
```
RESEND_API_KEY=re_...          # Must be set
FROM_EMAIL=cultr@...
ADMIN_APPROVAL_EMAIL=admin@
POSTGRES_URL=postgresql://...
JWT_SECRET=...
CLUB_ORDER_APPROVAL_SECRET=...

QUICKBOOKS_CLIENT_ID=...       # Must match QB app
QUICKBOOKS_CLIENT_SECRET=...
QUICKBOOKS_REALM_ID=...
QUICKBOOKS_REFRESH_TOKEN=...
QUICKBOOKS_REDIRECT_URI=https://staging.cultrhealth.com/api/quickbooks/callback
QUICKBOOKS_SANDBOX=false       # Use production QB for real testing
```

---

## Critical Files in Checkout Flow

| File | Purpose |
|------|---------|
| `app/join/JoinLandingClient.tsx` | Order form UI + submission |
| `app/api/club/orders/route.ts` | Order creation + customer email |
| `app/api/admin/club-orders/[orderId]/approve/route.ts` | QB invoice + approval emails |
| `lib/quickbooks.ts` | QB OAuth2 + invoice creation + payment link |
| `migrations/010_club_orders.sql` | club_orders table schema |
| `migrations/011_quickbooks_tokens.sql` | QB token storage |

---

## Known Issues & Fixes (Mar 4 2026)

### ✅ FIXED: Approval URL Domain Mismatch
- **Was:** Email approval links pointed to production even when order on staging
- **Fix:** Links now use request hostname (`join.cultrhealth.com` or `staging.cultrhealth.com`)
- **Commits:** e43f81a, 3c3c08d

### ⚠️ TO VERIFY: QB Payment Form
- QB invoice must have `AllowOnlineCreditCardPayment = true`
- QB must have Payments enabled in company settings
- InvoiceLink field must be populated by QB

---

## Test Checklist

### Pre-Test Setup
- [ ] Vercel staging env vars all configured (RESEND_API_KEY, QB tokens, etc.)
- [ ] QB app created and authorized (QUICKBOOKS_SANDBOX = false for real testing)
- [ ] Admin email configured in ADMIN_APPROVAL_EMAIL
- [ ] Database migration 010 & 011 completed

### Test Execution
1. [ ] Navigate to `https://join.cultrhealth.com`
2. [ ] Select 1-2 therapies, enter test customer info
3. [ ] Submit order → verify "Order Received" email sent
4. [ ] Check admin inbox → click "Approve Order" link
5. [ ] Admin approval page loads (no 404)
6. [ ] Approval succeeds → QB invoice created
7. [ ] Check customer inbox → "Order is Approved" email with "Pay Now" button
8. [ ] Click "Pay Now" → QB payment form opens
9. [ ] Verify credit card + ACH payment options visible
10. [ ] Test payment (use QB sandbox card if staging)

### Validation
- [ ] Order status in DB: `invoice_sent`
- [ ] QB invoice exists with correct items
- [ ] Customer email contains valid QB payment link
- [ ] No 404 errors on any approval links
