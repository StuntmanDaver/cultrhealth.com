# Roadmap: CULTR Health Members Portal

## Overview

Build an authenticated members portal that lets CULTR Health patients log in with their phone number, see live order status from Asher Med, manage their profile and documents, and launch intake/renewal forms -- all without calling support or checking email. Four phases: establish phone OTP authentication, deliver the status-first dashboard with order tracking, add profile management and document access, then wire up inline forms and renewal prompts. Each phase produces a deployable, testable increment.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Phone OTP Authentication** - Twilio-based phone login with session management and patient identity linking
- [ ] **Phase 2: Dashboard & Order Tracking** - Status-first dashboard with live order data from Asher Med
- [ ] **Phase 3: Profile & Documents** - Patient profile view/edit and document viewer/uploader
- [ ] **Phase 4: Forms & Renewals** - Inline intake and renewal flows with pre-fill and proactive prompts

## Phase Details

### Phase 1: Phone OTP Authentication
**Goal**: Members can securely authenticate with their phone number and maintain a persistent session linked to their Asher Med patient identity
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, AUTH-09, AUTH-10
**Success Criteria** (what must be TRUE):
  1. Member can enter a US phone number, receive an SMS OTP, and land on the portal dashboard after entering the correct code
  2. Member can close the browser, reopen it, and still be logged in (up to 7 days) -- but gets logged out after 15 minutes of inactivity
  3. Member can log out from any portal page and is redirected to the login screen
  4. Entering a wrong or expired OTP shows a clear error message; spamming OTP requests gets rate-limited
  5. Existing magic link login, creator login, and admin login all continue to work unchanged
**Plans**: TBD

Plans:
- [ ] 01-01: TBD
- [ ] 01-02: TBD
- [ ] 01-03: TBD

### Phase 2: Dashboard & Order Tracking
**Goal**: Members can see live order status from Asher Med the moment they log in, with the most important information front and center
**Depends on**: Phase 1
**Requirements**: ORDR-01, ORDR-02, ORDR-03, ORDR-04, ORDR-05
**Success Criteria** (what must be TRUE):
  1. Logged-in member sees a prominent status card for their most recent active order immediately upon reaching the dashboard
  2. Member can view a list of all their orders with current status pulled live from Asher Med
  3. Member can tap an order to see full details including medication name, status, dates, and assigned doctor
  4. A new member with no orders sees an empty state with a clear call-to-action to start their intake
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: Profile & Documents
**Goal**: Members can view and manage their personal information and access their uploaded documents without contacting support
**Depends on**: Phase 2
**Requirements**: PROF-01, PROF-02, PROF-03, PROF-04, DOCS-01, DOCS-02
**Success Criteria** (what must be TRUE):
  1. Member can view their personal info (name, DOB, phone, email, gender) and physical measurements (height, weight, BMI) on a profile page
  2. Member can view and edit their shipping address, with changes synced back to Asher Med
  3. Member can view previously uploaded documents (IDs, consent forms, prescriptions) rendered from S3 preview URLs
  4. Member can upload a new document from the portal and see it appear in their document list
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Forms & Renewals
**Goal**: Members can start or continue intake and renewal flows directly from their dashboard, with forms pre-filled from their existing data
**Depends on**: Phase 3
**Requirements**: FORM-01, FORM-02, FORM-03, FORM-04, FORM-05
**Success Criteria** (what must be TRUE):
  1. Member can launch the intake form from the dashboard and see fields pre-filled with their existing Asher Med patient data
  2. Member can launch the renewal form from the dashboard and see it pre-filled from their last order and patient data
  3. Member whose medication supply is running low sees a proactive renewal prompt on the dashboard
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Phone OTP Authentication | 0/3 | Not started | - |
| 2. Dashboard & Order Tracking | 0/2 | Not started | - |
| 3. Profile & Documents | 0/2 | Not started | - |
| 4. Forms & Renewals | 0/2 | Not started | - |
