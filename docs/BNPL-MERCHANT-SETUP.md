# BNPL Merchant Setup Guide

## Klarna

### 1. Apply for a Merchant Account
- Visit [klarna.com/us/business](https://www.klarna.com/us/business/) and apply
- Business category: Health & Wellness / Telemedicine
- Expected approval timeline: 1-2 weeks

### 2. Get API Credentials
- Log into the [Klarna Merchant Portal](https://portal.klarna.com/)
- Navigate to **Settings > API Credentials**
- Generate an **API Key** and **API Secret**
- Note the **Client ID** for frontend integration

### 3. Configure Environment Variables
```env
KLARNA_API_KEY=<your-api-key>
KLARNA_API_SECRET=<your-api-secret>
KLARNA_API_URL=https://api.playground.klarna.com   # Sandbox
# KLARNA_API_URL=https://api.klarna.com            # Production
NEXT_PUBLIC_KLARNA_CLIENT_ID=<your-client-id>
NEXT_PUBLIC_ENABLE_KLARNA=true
```

### 4. Configure Webhook URL
In the Klarna Merchant Portal:
- Navigate to **Settings > Webhooks**
- Add endpoint: `https://your-domain.com/api/webhook/klarna`
- Select events: `checkout_complete`, `order_approved`, `order_captured`, `order_refunded`

### 5. Fee Structure
- Klarna charges merchants a per-transaction fee (typically 3.29% + $0.30)
- No fees to the customer for Pay in 4
- Longer financing options may have customer-facing interest

### 6. Go-Live Checklist
- [ ] Sandbox testing complete with test credentials
- [ ] Production API credentials obtained
- [ ] Webhook URL configured and verified
- [ ] Switch `KLARNA_API_URL` to `https://api.klarna.com`
- [ ] Set `NEXT_PUBLIC_ENABLE_KLARNA=true`
- [ ] Verify no PHI in API payloads (check browser DevTools Network tab)

---

## Affirm

### 1. Apply for a Merchant Account
- Visit [affirm.com/business](https://www.affirm.com/business) and apply
- Business category: Health & Wellness
- Expected approval timeline: 1-3 weeks

### 2. Get API Credentials
- Log into the [Affirm Merchant Dashboard](https://www.affirm.com/dashboard/)
- Navigate to **Settings > API Keys**
- Note your **Public API Key** and **Private API Key**

### 3. Configure Environment Variables
```env
AFFIRM_PRIVATE_API_KEY=<your-private-key>
NEXT_PUBLIC_AFFIRM_PUBLIC_KEY=<your-public-key>
AFFIRM_API_URL=https://sandbox.affirm.com              # Sandbox
# AFFIRM_API_URL=https://api.affirm.com                # Production
NEXT_PUBLIC_AFFIRM_SCRIPT_URL=https://cdn1-sandbox.affirm.com/js/v2/affirm.js  # Sandbox
# NEXT_PUBLIC_AFFIRM_SCRIPT_URL=https://cdn1.affirm.com/js/v2/affirm.js        # Production
NEXT_PUBLIC_ENABLE_AFFIRM=true
```

### 4. Configure Webhook URL
In the Affirm Merchant Dashboard:
- Navigate to **Settings > Webhooks**
- Add endpoint: `https://your-domain.com/api/webhook/affirm`
- Select events: `charge.authorized`, `charge.captured`, `charge.voided`, `charge.refunded`

### 5. Fee Structure
- Affirm charges merchants a per-transaction fee (varies, typically 5-7%)
- 0% APR options available for promotional periods
- Customer-facing APR: 0-36% depending on creditworthiness and term length

### 6. Go-Live Checklist
- [ ] Sandbox testing complete with test credentials
- [ ] Production API credentials obtained
- [ ] Webhook URL configured and verified
- [ ] Switch `AFFIRM_API_URL` to `https://api.affirm.com`
- [ ] Switch `NEXT_PUBLIC_AFFIRM_SCRIPT_URL` to production CDN
- [ ] Set `NEXT_PUBLIC_ENABLE_AFFIRM=true`
- [ ] Verify no PHI in API payloads (check browser DevTools Network tab)

---

## Regulatory Notes

### TILA Compliance (Truth in Lending Act)
- Klarna and Affirm handle TILA disclosures within their checkout flows
- Do not add custom APR or financing terms in your own UI
- The `BNPLBadge` component shows "4 interest-free payments of $X" which is factual and compliant

### HIPAA Considerations
- No Protected Health Information (PHI) is sent to Klarna or Affirm
- Order metadata contains only: product name, SKU, category, quantity, price
- No health conditions, prescriptions, or patient data in any BNPL API payload
- Audit regularly by checking the Network tab in browser DevTools during test transactions

### State Regulations
- Both providers handle state-specific lending regulations
- Some states may have restrictions on BNPL for certain product categories
- Consult legal counsel for state-specific health commerce regulations
