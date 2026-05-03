---
purpose: Q4 sandbox-gate question — Account Updater enrollment + cost
status: ready_to_send
created: 2026-05-03
to: Corepay support / account manager
from: David K (CULTR Health)
related: .planning/research/SANDBOX-GATE-RUNBOOK.md §Q4
---

# Q4 — Email to Corepay Support

**Recipient:** Whatever address Corepay support uses for merchant inquiries (try the contact on https://corepay.net or your account manager if you have one). If unsure, send to support@corepay.net and CC your account rep.

**Subject:**
```
Account Updater enrollment + pricing for CULTR Health (MID: <YOUR_MID>)
```

**Body:**

```
Hi Corepay team,

We're CULTR Health (cultrhealth.com) — a Florida telehealth practice currently
processing recurring subscription payments through our Corepay merchant
account on the Authorize.Net gateway. We're moving from a third-party
billing provider to Authorize.Net ARB this quarter and want to confirm
how Account Updater works on our MID before we cut over.

A few specific questions:

1. Is Account Updater currently enabled on our merchant account?
   MID: <FILL IN — find it in Authorize.Net merchant interface → Account → Merchant Profile>

2. If not enabled, what's the monthly cost (or per-event cost) to
   turn it on?

3. Which card networks are covered by your Account Updater
   integration — Visa Account Updater (VAU), Mastercard Automatic
   Billing Updater (ABU), Discover, American Express?

4. Update cadence — is it real-time on card events, daily batch,
   weekly batch?

5. Does Account Updater apply automatically to all stored payment
   profiles in our CIM (Customer Information Manager), or do we
   need to opt specific profiles in?

6. When a card is updated automatically, what's the notification
   path — webhook event, email, or only visible in the merchant
   interface report?

Context: we run roughly <FILL IN — number of active subs, e.g. "a few hundred">
active monthly subscriptions and want to minimize involuntary churn from
expired-card declines. Our planned fallback if Account Updater is not
enabled is a member-facing card-expiry email pipeline (T-30 / T-7 day
reminders), but Account Updater is the cleaner primary mechanism.

Happy to hop on a call if any of this is easier to discuss verbally.

Thanks,
David K
CULTR Health
ketchel.david@gmail.com
```

## Before sending — fill in

- [ ] **MID** — Authorize.Net merchant interface → Account → Merchant Profile → "Merchant ID"
- [ ] **Active subscription count** — `SELECT COUNT(*) FROM memberships WHERE subscription_status='active' AND payment_provider IN ('stripe','corepay')` (or whatever the prod name resolves to)
- [ ] **Recipient email** — confirm the right address with your account rep before sending blind to support@corepay.net

## After sending

1. Save the sent date in this file: `Sent: YYYY-MM-DD to <recipient>`
2. When reply lands, paste the answer into `.planning/research/SANDBOX-GATE-RUNBOOK.md` Q4 "Decision rule" section and update the locked decisions in `.planning/research/SUMMARY.md` §4.
3. If turnaround > 5 business days, ping again — Q4 is on the Phase 7 critical path.

## Why ask now (even before Phase 7 starts)

Q4 is the only sandbox-gate question with external turnaround time. Q1/Q2/Q3/Q5/Q6 are all answered in <30 min once you have credentials. Sending this email today means Corepay's reply lands while you're still doing the sandbox tests for the others — no idle waiting on the critical path.
