# Requirements: CULTR Health Members Portal

**Defined:** 2026-03-10
**Core Value:** Members can log in and immediately see the status of their treatment — orders, profile, documents — without calling support or checking email.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Identity

- [x] **AUTH-01**: Member can log in with phone number + OTP via Twilio SMS
- [x] **AUTH-02**: OTP input auto-fills from SMS notification (`autocomplete='one-time-code'`)
- [x] **AUTH-03**: Member session persists across browser refresh (7-day JWT in httpOnly cookie)
- [x] **AUTH-04**: Member session times out after 15 minutes of inactivity with auto-logout
- [x] **AUTH-05**: Member can securely log out from any portal page
- [x] **AUTH-06**: Phone OTP auth coexists with existing magic link, creator, and admin JWT flows
- [x] **AUTH-07**: First login resolves phone to Asher Med patient ID and caches in local DB
- [x] **AUTH-08**: OTP requests are rate-limited to prevent SMS bombing
- [x] **AUTH-09**: Phone number input displays with US formatting mask
- [x] **AUTH-10**: OTP flow shows loading states and clear error messages for invalid/expired codes

### Order Status Tracking

- [x] **ORDR-01**: Member can view list of orders with live status from Asher Med
- [x] **ORDR-02**: Dashboard shows status-first layout with prominent hero card for active order
- [x] **ORDR-03**: Member can view order details (medication, status, dates, doctor assignment)
- [x] **ORDR-04**: Order statuses display plain-language explanations
- [x] **ORDR-05**: New members with no orders see empty state with CTA to start intake

### Patient Profile

- [x] **PROF-01**: Member can view personal info (name, DOB, phone, email, gender)
- [x] **PROF-02**: Member can view shipping address on file
- [x] **PROF-03**: Member can edit shipping address (synced back to Asher Med)
- [x] **PROF-04**: Member can view physical measurements (height, weight, BMI)

### Document Management

- [x] **DOCS-01**: Member can view uploaded documents (IDs, consent, prescriptions) via S3 preview URLs
- [x] **DOCS-02**: Member can upload new documents from the portal

### Forms & Renewals

- [ ] **FORM-01**: Intake form pre-fills from existing Asher Med patient data
- [ ] **FORM-02**: Renewal form pre-fills from last order and patient data
- [ ] **FORM-03**: Member can launch intake form inline from dashboard
- [ ] **FORM-04**: Member can launch renewal form inline from dashboard
- [ ] **FORM-05**: Dashboard shows proactive renewal prompt when medication supply is running low

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Provider Features

- **PROV-01**: Separate provider login page (`/provider`)
- **PROV-02**: Provider patient search/lookup via Asher Med API
- **PROV-03**: Provider patient detail view (read-only summary)
- **PROV-04**: Provider link-out to Asher Med portal for clinical actions

### Billing & Account

- **BILL-01**: Subscription management quick link (Stripe Customer Portal button)

### UX Polish

- **UX-01**: Branded order timeline (visual step-by-step: Submitted → Review → Approved → Shipped)
- **UX-02**: Resend OTP with cooldown timer ("Didn't receive it? Resend in 28s")
- **UX-03**: Phone number change flow (self-service with OTP to new number)
- **UX-04**: HSA/FSA document center (prominent LMN access)
- **UX-05**: Medication info cards linked to library content
- **UX-06**: Mobile-optimized touch targets (dedicated mobile pass)
- **UX-07**: Edit phone number with re-verification

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Full clinical provider dashboard | Providers use Asher Med's own portal for clinical workflows |
| Real-time notifications / push alerts | v2 feature — order status changes are infrequent |
| In-app messaging between members and providers | Use existing support channels |
| Password-based authentication | Phone OTP matches Asher Med's phone-based identity model |
| Multi-factor auth beyond phone OTP | Phone verification sufficient for HIPAA with TLS |
| Member-to-member social features | Handled by existing Community page |
| Video visit scheduling / telehealth calls | Asher Med handles clinical encounters |
| Lab results viewer | No Asher Med API support for lab data |
| Prescription/Rx history | Requires pharmacy integration beyond current scope |
| Progress photos upload/gallery | High HIPAA sensitivity, unclear clinical integration |
| Weight/BMI progress tracking | Asher Med stores only current measurements, no history |
| Quick re-order flow | Compliance risk around skipping intake steps |
| Social login (Google, Apple) | Doesn't match phone-based identity model |
| Email OTP as fallback | Two OTP channels doubles complexity |
| Biometric login | Requires native app or WebAuthn |
| Multi-language support | US-only service, defer i18n |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| AUTH-06 | Phase 1 | Complete |
| AUTH-07 | Phase 1 | Complete |
| AUTH-08 | Phase 1 | Complete |
| AUTH-09 | Phase 1 | Complete |
| AUTH-10 | Phase 1 | Complete |
| ORDR-01 | Phase 2 | Complete |
| ORDR-02 | Phase 2 | Complete |
| ORDR-03 | Phase 2 | Complete |
| ORDR-04 | Phase 2 | Complete |
| ORDR-05 | Phase 2 | Complete |
| PROF-01 | Phase 3 | Complete |
| PROF-02 | Phase 3 | Complete |
| PROF-03 | Phase 3 | Complete |
| PROF-04 | Phase 3 | Complete |
| DOCS-01 | Phase 3 | Complete |
| DOCS-02 | Phase 3 | Complete |
| FORM-01 | Phase 4 | Pending |
| FORM-02 | Phase 4 | Pending |
| FORM-03 | Phase 4 | Pending |
| FORM-04 | Phase 4 | Pending |
| FORM-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-14 after Phase 3 completion*
