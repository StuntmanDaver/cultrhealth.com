# CULTR Health — Creator Affiliate Portal (V1 Spec)

## Goal
Build a creator-facing **affiliate member area** for **CULTR Health** (longevity clinic; peptides + GLP‑1) that lets creators:
- Join/apply and get approved
- Receive **tracking links** + **coupon codes**
- Track **clicks, orders, revenue, commissions, payouts**
- Track and grow their **creator network** (recruited creators)
- Earn a **compounding** reward for recruiting creators (tiered at **5 / 10 / 15 / 20 recruits**) with a **hard max payout cap of 20% per order**

**Version 1 verification:** name + email (verified) + phone (stored)  
**Version 2 verification:** add SMS OTP verification for phone

---

## V1 Scope (What must ship)
### Creator-facing portal
1. Dashboard
2. Share & Earn (links + codes)
3. Earnings (orders + ledger)
4. My Network (recruits + tier progress)
5. Payouts (method + history + threshold)
6. Resources (brand kit + compliance)
7. Support (tickets/FAQ)
8. Settings (profile + payout details)

### Admin-facing tools (minimum viable)
- Creator approvals / status (pending/active/paused)
- Code & link management
- Commission configuration (direct + override tiers)
- Order reconciliation + refund reversal
- Payout runs (export/batch)
- Fraud/compliance flags
- Analytics / leaderboard

---

## Information Architecture (Creator UI)

### Global navigation (left sidebar)
1. **Dashboard**
2. **Share & Earn**
3. **Earnings**
4. **My Network**
5. **Payouts & Tax**
6. **Resources**
7. **Support**
8. **Settings**

### Persistent header (top)
- Account status badge: Pending / Active / Paused
- Quick metrics: this month clicks, orders, net revenue, commission
- Primary CTA: **Copy referral link**
- Notifications: payout sent, code used, flagged order, new recruit

---

## Page Layouts (Creator)

### 1) Dashboard
**Hero metrics (4 cards)**
- Net revenue attributed (this month + lifetime)
- Commission earned (this month + lifetime)
- Orders (this month)
- Conversion rate + clicks (this month)

**Secondary blocks**
- Activity feed: “Order used CODE…”, “New recruit joined…”
- Tier progress bar: “X recruits away from Tier N”
- Top assets: best-performing link / coupon / landing page
- Payout status: payable balance + next payout window

**Quick actions**
- Copy referral link
- Copy coupon code
- Invite creator (shows their recruiter link)

---

### 2) Share & Earn
**A) Links**
- Default tracking link (copy)
- Deep-link generator:
  - Destination dropdown (GLP‑1 landing, peptides education, intake, quiz)
  - Optional UTM builder
  - Copy link button

**B) Coupon Codes**
- Primary code (ex: DAVE10)
- Stats: uses, net revenue, conversion rate
- Optional multiple codes (admin-controlled)

**C) Content tools**
- FTC disclosure helper (copy text)
- Do/Don’t claims guide (critical for GLP‑1 + peptides)
- Asset library shortcuts

---

### 3) Earnings
**Tabs**
- Overview
- Orders
- Commission ledger
- Holds & refunds

**Overview**
- Earnings graph (month)
- Breakdown:
  - Direct commission
  - Network override commission
  - Adjustments (refunds/chargebacks)
  - Pending vs approved vs paid

**Orders table**
- Date, Order ID, product category, net revenue, status, commission

**Holds**
- Show payout delay window (e.g., net-14 or net-30) + reason codes

---

### 4) My Network (Recruiting + Tier Engine)
**A) Network summary**
- Total recruits (all time)
- Active recruits (last 30 days)
- Network net revenue (last 30 days)
- Override earned (last 30 days)

**B) Tier progress**
- Tier milestones: 5 / 10 / 15 / 20 recruits
- Current tier badge + progress to next tier
- “Your current override rate: X%”

**C) Recruits list**
- Creator name, join date, status
- Last-30-day net revenue (their sales)
- Your override earned from them

**D) Invite flow**
- Invite link + QR
- Optional email invite
- Simple explainer: how recruiting affects earnings

---

### 5) Payouts & Tax
**Version 1 MVP**
- Choose payout method (pick one to start): Stripe Connect OR bank transfer OR PayPal
- Minimum payout threshold (e.g., $50)
- Payout schedule (e.g., monthly, net-30)
- Payout history table: date, amount, method, status

**Note:** tax form collection can be V1.5 depending on your compliance plan

---

### 6) Resources
- Brand kit (logos, fonts, colors)
- Approved landing pages + positioning
- Short-form hooks + scripts library
- Product education (what you can/can’t claim)
- FTC disclosure templates
- Case studies (if allowed)

---

### 7) Support
- Ticket submission
- FAQ
- Attribution dispute form (missing order, code conflict)
- Compliance questions

---

### 8) Settings (V1 verification fields)
- Name
- Email (verified)
- Phone (stored)
- Payout details
- Notification preferences
- Password reset

---

## Onboarding Flow (V1)
1. **Apply**
   - Name, email, phone
   - (Optional but recommended) social handles, niche, country
   - Agree to terms + FTC compliance checkbox
2. **Verify email**
   - Magic link or OTP email code
3. **Pending review**
   - “Pending approval” screen with expectations
4. **Approved**
   - Account becomes Active
   - Codes + links appear
   - Dashboard + reporting unlock

---

## Payout Structure (Compounding Recruiting, Max 20% Cap)

### Definitions
- **Direct commission**: paid to the creator who drove the order
- **Override commission**: paid to the recruiter/upline based on recruited creator performance
- **Active recruit**: creator with ≥1 click or ≥1 sale in last 30 days (define and enforce)

### Base direct commission
- **10%** of net revenue on attributed orders  
  (net revenue definition: after discounts; exclude tax/shipping; define clearly)

### Recruiting tiers (milestones: 5 / 10 / 15 / 20)
Creators unlock an override on the sales driven by creators they recruited:

| Recruit milestone | Override rate on direct recruits’ net revenue |
|---:|---:|
| 5 recruits | +2% |
| 10 recruits | +4% |
| 15 recruits | +6% |
| 20 recruits | +8% (max) |

### Hard cap: max 20% commission per order (total payout)
For any order, the **total commission paid out across all parties** must not exceed **20% of net revenue**.

**Allocation priority**
1. Pay direct creator commission first (e.g., 10%)
2. Pay recruiter overrides next (single-level in V1)
3. If you later add deeper levels, continue allocating up the chain until cap is reached

**Example**
- Creator B drives an order → earns **10%**
- Creator A recruited B and has 15 recruits → earns **6% override**
- Total payout = 16% (≤ 20%)

---

## Attribution Rules (reduce disputes)
1. **Last-click wins** within a defined cookie window (e.g., 30 days)
2. If coupon is used, optionally **coupon wins** (choose one rule and document it)
3. **No self-referrals** (block if customer email/phone matches creator, unless admin override)
4. Refunds/chargebacks **reverse** commissions automatically
5. Orders remain **Pending** until outside refund window

---

## Data Model (Implementation-ready)

### Creator
- id
- status: pending | active | paused
- name
- email
- email_verified_at
- phone
- recruiter_creator_id (nullable)
- recruit_count_active_30d (computed)
- tier (computed)
- payout_destination_id

### AffiliateCode
- id
- creator_id
- code
- discount_type (percent/fixed)
- discount_value
- active
- created_at

### TrackingLink
- id
- creator_id
- slug
- destination_url
- utm_template (optional)
- active

### ClickEvent
- id
- creator_id
- link_id
- timestamp
- session_id
- user_agent
- ip_hash

### OrderAttribution
- order_id
- creator_id (direct)
- code_id (nullable)
- net_revenue
- status: pending | approved | paid | refunded
- created_at

### CommissionLedger
- id
- order_id
- beneficiary_creator_id (who receives money)
- source_creator_id (whose sale generated it; for overrides)
- type: direct | override | adjustment
- rate
- amount
- status: pending | approved | paid | reversed

### Payout
- id
- creator_id
- amount
- method
- status
- period_start
- period_end
- paid_at

---

## Admin Portal (Minimum Set)
### Creators
- Approve/deny/pause
- Assign recruiter
- Force tier override eligibility (admin override)
- Notes + internal risk flags

### Codes & Links
- Generate/disable codes
- Manage landing page destinations for deep links

### Commissions
- Configure direct rate + tier overrides
- Reconciliation view (orders → ledger entries)
- Refund/chargeback automation rules

### Payout runs
- Batch payouts
- Export CSV
- Status tracking + payout receipts

### Fraud & compliance
- Self-referral detection
- Suspicious conversion spikes
- Claim-violation reporting

### Analytics
- Leaderboard
- Cohorts: creator join month vs performance
- Network growth velocity

---

## Version 2 Enhancements
- SMS OTP verification
- Optional identity checks for top tiers
- Automated compliance scanning (claim language)
- Creator quality scoring (refund rate, LTV proxy)
- Multi-level overrides (still enforce 20% cap)

---

## Recommended MVP Build Order
1. Onboarding + email verification + approval workflow
2. Codes/links + tracking + attribution → OrderAttribution
3. Commission ledger + earnings pages + reversal logic
4. Network page + tier calculation
5. Admin tools + payout run exports
