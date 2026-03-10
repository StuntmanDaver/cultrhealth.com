# Feature Landscape: HIPAA-Compliant Patient Portal with EHR Integration

**Domain:** Telehealth patient portal (GLP-1/peptide therapy, connected to Asher Med EHR)
**Researched:** 2026-03-10
**Overall confidence:** HIGH (grounded in existing codebase capabilities + market analysis + competitor review)

---

## Table Stakes

Features users expect. Missing any of these = product feels broken, users call support instead of self-serving.

### Authentication & Identity

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Phone + OTP login | Members know their phone; matches Asher Med's phone-based patient lookup. Every competitor (Hims, Ro, Found) uses phone or email auth. | Medium | Twilio Verify API. 5-min OTP expiry, rate limit to 3 attempts/10 min. `getPatientByPhone()` already exists in API client. |
| OTP auto-fill from SMS | iOS/Android auto-suggest the OTP code from notification. Users expect `autocomplete='one-time-code'` behavior. | Low | HTML attribute on input. `input-otp` library handles this natively. |
| Session persistence | Members should not re-authenticate on every page load. | Low | JWT in httpOnly cookie, 7-day expiry, refresh on activity. Existing JWT infrastructure in `lib/auth.ts`. |
| Session timeout / auto-logout | HIPAA addressable safeguard. Members accessing ePHI expect security. Standard in every healthcare portal. | Medium | 15-min access token with silent refresh via short-lived JWT. Logout on inactivity. |
| Secure logout | Clear session, redirect to login. | Low | Delete cookies, redirect. `clearSession()` pattern already exists in codebase. |
| Graceful auth coexistence | New phone OTP must not break existing magic link (members), creator JWT, or admin JWT. | Medium | Separate cookie names. Phone OTP sets `cultr_member_session`; existing `cultr_session` (magic link) continues to work. Single auth middleware checks both. |
| Patient identity linking | First login must resolve phone to Asher Med patient ID and cache it locally. | Medium | `getPatientByPhone()` returns patient or null. Cache `asher_patient_id` in local DB. Handle case where phone is not yet in Asher Med (new member who hasn't completed intake). |
| Rate-limited OTP requests | Prevent SMS bombing of phone numbers. Security requirement. | Low | App-level rate limiting via existing `rateLimit()` from `lib/rate-limit.ts` + Twilio built-in (5/10min). |
| Phone number formatting on input | US phone masking: (555) 123-4567. Standard UX convention. | Low | `formatPhoneNumber()` utility already exists in `lib/asher-med-api.ts`. Need client-side as-you-type mask. |
| Loading/error states for OTP | Users need feedback that SMS is being sent. Clear errors for invalid code, expired code, rate limited. | Low | Existing `Button` component has `isLoading` prop with spinner. Map Twilio error codes to user-friendly messages. |

### Order Status Tracking

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Order list with live status | #1 reason members log in: "Where is my medication?" Hims, Ro, and every pharmacy app show order status prominently. | Low | Already partially built: `GET /api/member/orders` exists, fetches from `asher_orders` table and merges real-time status from Asher Med `getOrders()`. Frontend `MemberDashboard.tsx` renders order cards with status badges. |
| Status-first dashboard layout | The most recent/active order's status should be the first thing visible -- large hero card, not buried in a list. Immediately answers "where's my medication?" | Low | Design decision. Large hero card for most recent active order (PENDING/APPROVED/WaitingRoom), then chronological list below. Reduces support tickets. |
| Order detail view | Tapping an order should show medication name, status, dates, doctor assignment, and any partner notes. | Low | `getOrderDetail(orderId)` exists in API client. Returns `AsherOrder` with `patientId`, `doctorId`, `status`, `orderType`, `partnerNote`, timestamps. |
| Status change explanations | Members don't know what "WaitingRoom" or "APPROVED" means in clinical context. Status labels need plain-language explanations. | Low | Static copy mapping: PENDING = "Your order is being reviewed", APPROVED = "Your provider has approved your treatment", WaitingRoom = "Awaiting provider review", COMPLETED = "Your order has been fulfilled". |
| Empty state for new members | A member who just signed up (no orders yet) needs a clear path to start intake, not a blank page. | Low | Already handled in `MemberDashboard.tsx` with "No Orders Yet" empty state and "Start New Order" CTA linking to `/intake`. |

### Patient Profile Management

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| View personal info | Members need to see what's on file: name, email, phone, DOB, gender. Every patient portal (MHS Genesis, MyChart, etc.) provides this. | Low | `getPatientById()` returns full `AsherPatient` with all fields. `GET /api/member/profile` already fetches and merges Asher Med data. |
| View shipping address | Members need to confirm where their medication is being shipped. | Low | `AsherPatient` includes `address1`, `address2`, `city`, `stateAbbreviation`, `zipcode`. Already returned by profile endpoint. |
| Edit shipping address | Address changes are common (moved, shipping to office, etc.). Must sync back to Asher Med. Most common profile edit. | Low | `PUT /api/member/profile` already calls `updatePatient()` on Asher Med API with address fields. Frontend edit form needed. |
| Edit phone number | Less common but necessary. Must validate format and handle E.164 conversion. | Medium | `updatePatient()` supports `phoneNumber` update. `formatPhoneNumber()` utility exists. Changing phone changes the identity lookup key -- must update local cache too. Consider requiring OTP verification to new number. |
| View physical measurements | Height, weight, BMI are part of treatment context. Members want to see what the provider has on record. | Low | `AsherPatient` includes `height`, `weight`, `bmi`, `currentBodyFat`. Read-only display. |

### Document Management

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| View uploaded documents | Members need to see their uploaded ID, consent forms, and prescription photos. Reduces "did you get my ID?" support calls. Standard patient portal feature (MyChart, FollowMyHealth). | Medium | `getPreviewUrl(key)` generates signed S3 URLs for viewing. Need to track which S3 keys belong to which patient -- this data lives in intake submission but may need a dedicated document registry (patient_id + key + type + uploaded_at). |
| Upload new documents | Members may need to submit updated ID, new prescription labels, or additional consent forms after initial intake. | Medium | Full upload flow exists: `getPresignedUploadUrl()` + `uploadFileToS3()` + `uploadFile()`. `IDUploader.tsx` component exists in intake form. Needs adaptation for standalone use outside intake flow. |

### Form Pre-filling

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Pre-fill intake from existing patient data | Returning members should not re-enter name, DOB, address, measurements. Industry data: pre-filling cuts new-patient intake from 25 min to 5-7 min, and to 2 min for returning patients. 81% of patients prefer digital intake with pre-fill. | Medium | `getPatientById()` returns all personal info, address, measurements. Intake form components accept initial values via `IntakeFormContext`. Need to hydrate context with Asher Med data before form renders. |
| Pre-fill renewal from last order | Renewal flow should pre-populate medication selection, address, and personal info from previous order/patient record. | Medium | `RENEWAL_FORM_STEPS` already defines a shorter 6-step form. `AsherRenewalOrderRequest` has same personal info + shipping + medication fields. Pre-fill from cached patient data. |
| Inline intake launch from dashboard | Members should be able to start a new order directly from the dashboard. | Low | Dashboard already has "Start New Order" CTA linking to `/intake`. Enhancement: pass patient context via session state so intake form auto-hydrates. |
| Inline renewal launch from dashboard | Same as above for renewals. Dashboard should show "Renew" CTA when eligible. | Low | Dashboard already has "Renewal" button linking to `/renewal`. Profile endpoint already returns `renewalEligible` flag based on completed orders. |

### Provider-Facing Features

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Separate provider login | Providers need their own entry point, not the member login. | Low | New page at `/provider`. Email allowlist via `PROTOCOL_BUILDER_ALLOWED_EMAILS` pattern already exists. |
| Patient search/lookup | Providers need to find patients by name, phone, or email to check status or verify info before clinical work in Asher Med. | Medium | `getPatients({ search })` supports text search across patients. Paginated response. Lightweight search UI with table results. |
| Patient detail view (read-only) | After finding a patient, providers see key info: demographics, order history summary, current status. Quick reference before opening Asher Med. | Low | Combines `getPatientById()` + `getOrders({ patientId })`. Read-only display -- no edit capability in CULTR for providers. |
| Link-out to Asher Med portal | Providers do clinical work (prescribing, charting) in Asher Med's own portal. CULTR should provide a clear "Open in Asher Med" button. | Low | Static link to `ASHER_MED_URLS.website.production`. Could deep-link to patient record if Asher Med supports URL-based patient navigation. |

---

## Differentiators

Features that set CULTR apart from generic patient portals. Not expected, but valued by members paying $199-$1099/month.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Branded order timeline** | Instead of a plain status badge, show a visual step-by-step timeline (Submitted > Provider Review > Approved > Pharmacy > Shipped > Delivered) with the current step highlighted and animated. Hims and Ro use this pattern. Makes the wait feel shorter and more transparent. | Medium | Map Asher Med statuses (PENDING, APPROVED, WaitingRoom, COMPLETED) to a 5-6 step visual timeline. Use Tailwind keyframe animations for the active step (existing `shimmer`, `glowPulse` animations available). |
| **Smart renewal prompts** | Proactively surface "Time to renew" messaging based on medication duration. If a 28-day supply was ordered 21 days ago, show a renewal prompt. Reduces gaps in therapy and increases retention. | Medium | Calculate from `order.createdAt` + medication `duration` from `MEDICATION_OPTIONS` config. Show banner when remaining supply < 7 days. Push email notification via Resend as v2 enhancement. |
| **Subscription management quick link** | One-tap access to Stripe Customer Portal for billing, plan changes, payment method updates. Members shouldn't need to search for billing support. | Low | `STRIPE_CONFIG.customerPortalUrl` already exists (`billing.stripe.com/p/login/...`). Add prominent "Manage Billing" card to dashboard. |
| **HSA/FSA document center** | LMN (Letter of Medical Necessity) generation and access is already built. Surfacing this prominently helps members use tax-advantaged funds. Competitors rarely offer this -- genuine differentiator in the GLP-1 space. | Low | Already built: `MemberDashboard.tsx` has LMN modal, `GET /api/lmn/list` and `/api/lmn/[lmnNumber]` routes exist. Just needs prominent placement in new portal layout. |
| **Medication info cards** | Rich cards for each active medication showing what it is, how it works, dosing schedule, and common side effects. Links to relevant library content. Hims does this well with in-app medication education. | Low | Map medication names from `MEDICATION_OPTIONS` to content in `content/library/`. Display alongside order details. Tier-gated content access via `TierGate` component already exists. |
| **Resend OTP with cooldown timer** | "Didn't receive it? Resend in 28s" with visible countdown. Standard modern auth UX that reduces support friction. | Low | Client-side timer. Twilio handles server-side rate limiting. Small detail that feels polished. |
| **Phone number change flow** | Member changes phone, re-verifies via OTP to new number, updates Asher Med profile. Self-service instead of a support call. | Medium | Requires OTP to new number + `updatePatient()` call. Edge case: old number still linked in Asher Med local cache needs updating. |
| **Mobile-optimized touch targets** | Portal designed mobile-first with large touch targets (min 44px), swipeable order cards, bottom navigation on mobile. 70%+ of telehealth visits happen on mobile. | Medium | Existing codebase uses Tailwind responsive classes. New portal components should use `min-h-[44px]` touch targets, bottom sheet modals on mobile, and avoid hover-dependent interactions. |

---

## Anti-Features

Features to explicitly NOT build. Each would add complexity without proportional value given the Asher Med integration model.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **In-app messaging/chat with providers** | Providers use Asher Med's portal for clinical communication. Building a second messaging system creates fragmented conversations, HIPAA compliance burden (message retention, audit trails, encryption at rest), and support confusion. | Link to Asher Med portal for provider communication. Add `support@cultrhealth.com` mailto link for non-clinical questions. |
| **Video visit scheduling/telehealth calls** | Asher Med handles the clinical encounter. CULTR is the patient-facing brand layer, not the clinical platform. Video adds massive complexity (WebRTC, HIPAA-compliant recording, scheduling, provider availability). | Show provider info and consultation status from Asher Med. Let Asher Med handle the encounter. |
| **Full clinical provider dashboard** | Providers already have Asher Med's portal for prescribing, charting, and clinical workflows. Rebuilding it duplicates effort and creates data sync problems. PROJECT.md explicitly marks this out of scope. | Build lightweight lookup view that answers "who is this patient and what's their status?" then links out to Asher Med for all clinical actions. |
| **Lab results viewer** | Asher Med's API does not expose lab results. Building a separate lab integration (Quest, Labcorp, Surescripts) is a full product track. Premature for this milestone. | Note lab test pricing in plan features ($135/test). Link to external lab partner if applicable. Revisit when Asher Med API expands or a dedicated lab integration is warranted. |
| **Prescription/Rx history** | Asher Med API exposes orders and statuses, not detailed prescription records. Building Rx history requires pharmacy integration or NCPDP/Surescripts connectivity -- entirely different integration. | Show order history with medication names and statuses. That's the closest available proxy and what members actually need. |
| **Push notifications** | Requires native app or service worker setup, notification permission UX, and a push delivery service. Overkill for MVP portal. Order status changes are infrequent (a few per month). PROJECT.md marks this as v2. | Use email notifications via Resend for status changes and renewal reminders. |
| **Password-based authentication** | PROJECT.md explicitly scopes this out. Phone OTP is simpler, matches the Asher Med phone-based identity model, and avoids password management (hashing, reset flows, breach risk). | Phone + OTP via Twilio exclusively for member auth. |
| **Biometric login (Face ID, fingerprint)** | Requires native app or WebAuthn integration. Web-only platform for now. | Phone OTP is sufficient. Re-authentication on session expiry is fast (enter phone, get code). |
| **Social login (Google, Apple)** | Doesn't match phone-based identity model. Would require mapping social accounts to phone numbers -- adds complexity without reducing friction. | Phone OTP only. |
| **Email OTP as fallback** | Two OTP channels doubles complexity. Phone is the primary identity for Asher Med. | If SMS fails, show "Contact support" message. Twilio's US delivery rate is >99%. |
| **Multi-language support** | US-only service (Asher Med operates in specific US states). Adds significant complexity (content translation, RTL layout, locale management) with low ROI. | Design with i18n-ready patterns (no hardcoded strings -- use const objects), but defer actual translation. English only for MVP. |
| **Progress photos upload/gallery** | High HIPAA sensitivity (body images), storage costs, comparison view complexity, and unclear clinical integration with Asher Med. | Members can track progress photos in their phone camera roll. If needed later, add simple encrypted file upload to S3 with patient-only access. Do not build a gallery/comparison UI. |
| **Real-time order tracking with map** | Medication fulfillment is not like pizza delivery. No GPS tracking available from compounding pharmacy partners. | Status-based tracking: Pending > Approved > Shipped > Completed. Dates where available. |
| **Weight/BMI progress tracking (v1)** | Asher Med `AsherPatient` only stores current height/weight/bmi -- no historical data. Would need new data model (historical measurements table), regular data collection UX, and charting. | Show current measurements from Asher Med profile. Defer historical tracking to v2 when `track/daily` data pipeline is mature. |
| **Quick re-order flow** | For repeat peptide orders. Compliance complexity: Asher Med still requires consent and wellness questionnaire on every order. Cannot safely skip intake steps without understanding which are clinically mandatory. | Use pre-filled standard intake flow instead. Less risky, still reduces friction significantly. |

---

## Feature Dependencies

```
Phone Input + Validation ────> OTP Send Flow ────> OTP Verify Flow ────> Session Creation (JWT)
                                                                              |
                                                                              v
                                                                     Patient ID Lookup
                                                                   (phone -> asher_patient_id)
                                                                              |
                                                                              v
                                                                     Cache asher_patient_id in DB
                                                                              |
                                              +------------------+------------+----------+------------------+
                                              |                  |                       |                  |
                                              v                  v                       v                  v
                                       Order Dashboard    Profile View           Document Viewer     Renewal Launch
                                              |                  |                                         |
                                              v                  v                                         v
                                       Order Detail View   Profile Edit ──> Sync to Asher Med     Pre-fill Renewal Form
                                              |
                                              v
                                    Order Timeline (visual)

Session Creation ──> Session Timeout (15-min access token, silent refresh)
                 ──> Secure Logout

Provider Login (separate) ──> Patient Search ──> Patient Detail View ──> Link-out to Asher Med
```

Key dependency insight: **Everything depends on phone OTP auth + patient identity linking.** Those two features gate the entire portal. Build and stabilize them first.

---

## MVP Recommendation

Prioritize in this order:

### Phase 1: Authentication + Dashboard Shell (must ship together)
1. **Phone OTP login** (send + verify + session) -- without auth, nothing else works
2. **Patient identity linking** (phone -> `asher_patient_id` cached in DB)
3. **Session persistence** (7-day JWT, 15-min access token refresh)
4. **Status-first dashboard layout** -- the single most valuable screen
5. **Order list with live status** -- primary use case for logging in
6. **Order detail view** -- drill-down from list
7. **Status change explanations** -- plain-language labels
8. **Session timeout + secure logout** -- HIPAA requirement
9. **Empty state for new members** -- CTA to intake flow

### Phase 2: Profile + Documents
10. **View personal info** (read-only) -- name, DOB, gender, phone, email
11. **View shipping address** (read-only)
12. **Edit shipping address** -- most common profile edit
13. **View uploaded documents** -- leverages existing S3 preview URL infrastructure
14. **Upload new documents** -- adapts existing `IDUploader` component
15. **Subscription management quick link** -- Stripe Customer Portal button

### Phase 3: Form Pre-filling + Renewals
16. **Pre-fill intake from patient data** -- hydrate `IntakeFormContext` from Asher Med data
17. **Pre-fill renewal from last order** -- streamlines the renewal path
18. **Inline renewal launch from dashboard** -- CTA with `renewalEligible` flag
19. **Smart renewal prompts** -- banner based on medication duration calculation
20. **HSA/FSA document center** -- prominent LMN access (already built, needs better placement)

### Phase 4: Provider View
21. **Separate provider login** -- isolated from member auth
22. **Patient search/lookup** -- lightweight search UI with table results
23. **Patient detail view** (read-only summary) -- demographics + order summary
24. **Link-out to Asher Med** -- button in patient detail view

### Defer to v2:
- **Branded order timeline**: Nice visual polish but plain status badges with explanations work fine for MVP
- **Medication info cards**: Useful but not gating; members can access library content directly
- **Phone number change flow**: Edge case; support can handle for now
- **Mobile-optimized touch targets**: Design consideration throughout, but dedicated mobile optimization pass is v2
- **Weight/BMI progress tracking**: Requires new data model; no Asher Med API support for historical data
- **Quick re-order flow**: Compliance risk around skipping intake steps

### Deferral rationale:
- **Provider views (Phase 4)**: Providers currently use Asher Med's own portal. CULTR-side lookup is convenience, not necessity. Ship member portal first.
- **Pre-fill (Phase 3)**: Complex state management (hydrating a 12-step multi-context form). The existing intake flow at `/intake` works for new patients without pre-fill. Pre-fill is a friction reducer, not a blocker.
- **Progress tracking (v2)**: Asher Med stores only current measurements. Building historical tracking requires new DB tables, collection UX, and charting -- a mini-product in itself.

---

## Sources

### Codebase Analysis (HIGH confidence)
- `lib/asher-med-api.ts` -- 15 API endpoints verified (patients, orders, uploads, questions, partners)
- `lib/config/asher-med.ts` -- medication options, intake step config, state validation
- `components/library/MemberDashboard.tsx` -- existing dashboard component with order list, LMN modal, quick actions
- `app/api/member/orders/route.ts` -- order fetching with Asher Med real-time merge
- `app/api/member/profile/route.ts` -- profile GET/PUT with Asher Med sync
- `lib/config/plans.ts` -- tier definitions, Stripe config, library access matrix
- `lib/auth.ts` -- existing JWT infrastructure
- `.planning/PROJECT.md` -- validated requirements and constraints

### Market Research (MEDIUM confidence)
- [DocVilla - Patient Portal in Healthcare 2026](https://www.docvilla.com/2026/03/07/patient-portal-healthcare/)
- [14 Must-Have Telemedicine App Features for 2026](https://www.appverticals.com/blog/telemedicine-app-features/)
- [Top 10 UX Trends Shaping Digital Healthcare in 2026](https://www.uxstudioteam.com/ux-blog/healthcare-ux)
- [Healthcare UX Design: Top Trends 2025](https://www.webstacks.com/blog/healthcare-ux-design)
- [Optimizing Patient Check-in for Telehealth - Frontiers](https://www.frontiersin.org/journals/digital-health/articles/10.3389/fdgth.2025.1554762/full)
- [MedlinePlus - Patient Portals Overview](https://medlineplus.gov/ency/patientinstructions/000880.htm)

### Competitor Analysis (MEDIUM confidence)
- [Best Online GLP-1 Programs 2026](https://www.nutritionnc.com/best-online-glp-1-program/)
- [Top GLP-1 Telehealth Programs 2025](https://www.tryeden.com/post/top-glp1-telehealth-programs-2025)
- [Hims App - App Store](https://apps.apple.com/us/app/hims-telehealth-for-men/id1455690574)
- [Digital Health Companies Capitalizing on GLP-1 Boom - CNBC](https://www.cnbc.com/2024/05/25/digital-health-companies-are-launching-programs-around-glp-1s-.html)
- [How to Choose a Patient Portal - OpenLoop Health](https://openloophealth.com/blog/how-to-choose-a-patient-portal-for-your-telehealth-practice)

### HIPAA Compliance (MEDIUM confidence)
- [Patient Portals and the HIPAA Security Rule](https://compliancy-group.com/patient-portals-and-the-hipaa-security-rule/)
- [HIPAA Compliant File Sharing - FileCloud](https://www.filecloud.com/file-sharing-hospitals-healthcare-organizations/)
- [Telehealth Website Design - Purrweb](https://www.purrweb.com/blog/telehealth-website-design/)
