# Customer Approval Email Preview

## Email Subject
```
Your Order is Confirmed — CLB-1F4QJ5H-A1B2
```

---

## Email Content (Visual)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                        CULTR                           │
│                                                         │
│                  Order Confirmed!                       │
│              Order #CLB-1F4QJ5H-A1B2                    │
│                                                         │
│  Hi John,                                              │
│                                                         │
│  Great news — your order has been reviewed and         │
│  confirmed by our medical team.                        │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Therapy / Dosage          │ Qty │   Price       │ │
│  ├───────────────────────────────────────────────────┤ │
│  │ R3TA — 1 MG | 3 ML        │  1  │  $199.00      │ │
│  │ NAD+ Boost                │  1  │  $ 89.00      │ │
│  │ Glutathione               │  2  │  TBD          │ │
│  ├───────────────────────────────────────────────────┤ │
│  │                    Total: $288.00                 │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ✓ Status: Confirmed by Medical Team            │   │
│  │   Your order is approved and ready for          │   │
│  │   payment processing.                           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Next Step: Payment                              │   │
│  │                                                 │   │
│  │ Our team will send you a payment link within    │   │
│  │ 1-2 business days. You can reference your       │   │
│  │ order number below when following up.           │   │
│  │                                                 │   │
│  │ Your Order Number: CLB-1F4QJ5H-A1B2             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  CULTR Health — Personalized Longevity Medicine       │
│  Questions? Contact support@cultrhealth.com            │
│  or reply to this email.                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## What Changed (Option C Implementation)

| Section | Before | After |
|---------|--------|-------|
| **Status Badge** | "Confirmed" | "Confirmed by Medical Team" + subtext "ready for payment processing" |
| **Next Steps** | "Our team will reach out within 1-2 business days with next steps." | Clear "Next Step: Payment" section with explicit instructions |
| **Order Number** | Shown at top in heading | **ALSO shown in "Next Step" box** in monospace for easy reference when customer needs to contact admin about payment |
| **CTA** | Passive (waiting) | Active (customer can reference order number to follow up) |
| **Support Contact** | support@cultrhealth.com | support@cultrhealth.com or reply to this email |

---

## Admin Workflow (Option C)

### Step 1: Approve from Email
- Admin receives email: "New Club Order — CLB-1F4QJ5H-A1B2"
- Admin clicks: **"Approve This Order"** button (one-click)

### Step 2: Customer Gets Confirmation
- Email arrives: "Your Order is Confirmed — CLB-1F4QJ5H-A1B2"
- Contains order details + order number for reference

### Step 3: Admin Creates Payment Link (Manual)
- Admin creates QB invoice, Stripe link, or ACH payment info
- Admin emails customer:
  ```
  Subject: Payment Instructions for Order CLB-1F4QJ5H-A1B2

  Hi John,

  Your order CLB-1F4QJ5H-A1B2 has been approved!

  To complete payment, please click here: [PAYMENT LINK]

  Total: $288.00
  Items: R3TA (1 MG | 3 ML), NAD+ Boost, Glutathione (qty 2)

  Let us know if you have questions!
  ```

### Step 4: Customer Pays
- Customer clicks payment link
- Enters payment information
- Order fulfilled

---

## Why Order Number is Prominent

In Option C (manual workaround), the customer needs to easily reference their order number when:
- Asking admin about payment link timing
- Receiving separate payment email
- Following up with support
- Checking payment status

By highlighting it in the approval email, customer has it available without searching through email subject lines.

---

## Version 2 Plan (Option A)

In v2, the "Next Step: Payment" section will be replaced with:

```
┌─────────────────────────────────────────────────────┐
│ Next Step: Complete Payment                          │
│                                                       │
│ Your order is approved and ready for payment!        │
│ Click below to complete your purchase securely.      │
│                                                       │
│            [PAY NOW - $288.00]                       │
│            (Stripe / QB Invoice / ACH)               │
│                                                       │
│ Or copy this link: [ONE-CLICK PAYMENT URL]          │
└─────────────────────────────────────────────────────┘
```

This will eliminate manual admin follow-up entirely.
