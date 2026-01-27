# CULTR Platform End-to-End Checklist

## 0) Non-Negotiables and PHI Boundaries
- [ ] Keep public website PHI-free and cacheable
- [ ] Store all patient-specific clinical data, messaging, and telehealth in Healthie
- [ ] Keep Stripe, affiliate tools, analytics, and marketing CRMs PHI-free
- [ ] Treat Protocol Engine as first-class object with phased approach (v1 Healthie, v2 PHI-free builder, v3 API publish)

## 1) North Star: Best EMR for Longevity + Weightloss
- [ ] Optimize for recurring care
- [ ] Optimize for high-volume follow-ups
- [ ] Enable protocol-driven titration and monitoring
- [ ] Support membership retention
- [ ] Enable fast documentation
- [ ] Minimize clicks across workflows

### 1.1 One Screen Per Job
- [ ] Intake review screen
- [ ] Assessment snapshot screen
- [ ] Visit note screen (template-driven)
- [ ] Labs and trends screen
- [ ] Protocol plan screen (Care Plan)
- [ ] Refill cadence and follow-up schedule screen
- [ ] Patient messaging screen
- [ ] Tasks screen

### 1.2 Zero Hunting (Always Visible or 1 Click Away)
- [ ] Membership status (from Stripe, PHI-free)
- [ ] Primary goals and current protocol
- [ ] Vitals and weight trend
- [ ] Current meds and supplements list (as documented)
- [ ] Last encounter note
- [ ] Next scheduled appointment
- [ ] Open tasks and pending labs

### 1.3 Template-Driven Care (Standardized Protocols)
- [ ] GLP-1 initiation and follow-ups templates
- [ ] Metabolic optimization templates
- [ ] TRT workflows templates (if offered)
- [ ] Sleep and circadian optimization templates
- [ ] Cognition and performance optimization templates
- [ ] Peptides documented as care plan protocols (not brittle med catalog)

### 1.4 Membership-First Operations
- [ ] Renewal and churn prevention workflows
- [ ] Check-in cadence workflows
- [ ] Missed appointment recapture workflows
- [ ] Education drip content workflows
- [ ] Support response expectations and SLAs

### 1.5 Premium Portal UX Phases
- [ ] v1: Healthie portal experience
- [ ] v2: Thin custom member dashboard (PHI-free) with Healthie deep-links
- [ ] v3: Custom portal UX powered by Healthie API

## 2) Phase 0 Decisions (Prevent Complexity)
- [ ] Choose MVP model: Healthie portal only vs thin member dashboard
- [ ] Decide Healthie API add-on timing (now vs later)
- [ ] Decide to start Protocol Engine v1 with Care Plan Templates

## 3) Architecture and Stack
### 3.1 PHI-Free Public Website
- [ ] Next.js marketing site
- [ ] Pricing and packages pages
- [ ] Stripe Checkout integration
- [ ] Affiliate tracking integration
- [ ] Non-PHI content library previews
- [ ] Login redirect to Healthie portal

### 3.2 Clinical + Portal System (PHI)
- [ ] Healthie as system of record (EHR, scheduling, telehealth, messaging, care plans, documents, programs)
- [ ] Optional Healthie API add-on (Group/Enterprise)
- [ ] Optional Healthie FHIR API add-on (Enterprise)

### 3.3 Headless EMR in Practice
- [ ] Confirm Healthie API-first model for future integrations
- [ ] Set up sandbox and production API key workflows (when add-on enabled)
- [ ] Plan membership status sync (PHI-free)
- [ ] Plan create/read care plans and templates via API
- [ ] Plan portal embed/redirect experiences
- [ ] Plan future mobile app integration

### 3.4 Best Stack Decisions
- [ ] Next.js (TypeScript) with App Router
- [ ] Tailwind + shadcn/ui
- [ ] Vercel hosting
- [ ] Resend for transactional email (PHI-free)
- [ ] PostHog or GA (PHI-free analytics events only)
- [ ] Stripe Billing (subscriptions)
- [ ] Stripe Checkout (hosted)
- [ ] Stripe Customer Portal
- [ ] Coupon and promo rules
- [ ] Affiliate platform selection (Rewardful or Tolt or FirstPromoter)
- [ ] E-commerce decision (Stripe only vs Shopify headless later)
- [ ] Healthie platform for clinical engine
- [ ] Optional add-ons: Healthie API, DoseSpot eRx, Healthie FHIR API

## 4) End-to-End User Journey (Exact Flow)
### 4.1 Visitor to Member (Website)
- [ ] Visitor lands on website (home or pricing)
- [ ] Visitor selects a package
- [ ] Visitor completes Stripe Checkout subscription
- [ ] Success page shows:
  - [ ] Button A: Create portal login (Healthie)
  - [ ] Button B: Book consult (Healthie scheduling link)
  - [ ] 3-step timeline: Portal -> Intake -> Consult

### 4.2 Member to Patient (Healthie)
- [ ] Patient creates Healthie portal account
- [ ] Patient completes intake and consents
- [ ] Patient schedules appointment type
- [ ] Telehealth visit occurs
- [ ] Provider charts using templates
- [ ] Provider applies protocol (Care Plan from Template)
- [ ] Patient receives care plan and education resources
- [ ] Patient receives drip program content
- [ ] Patient uses secure messaging for follow-ups
- [ ] Retention loop: check-ins, labs reminders, follow-up scheduling

## 5) Website Workflows (MVP)
### 5.0 Existing Website Alignment (Current Codebase)
- [ ] Maintain App Router structure in `app/` with server components by default
- [ ] Keep global layout in `app/layout.tsx` and base styles in `app/globals.css`
- [ ] Preserve brand palette and typography tokens in `tailwind.config.ts` and CSS variables
- [ ] Keep library routes `/library` and `/library/[category]` functional
- [ ] Keep `CATEGORY_META` aligned with `content/library/*.md` files
- [ ] Keep `LibraryContent` category cards aligned with `CATEGORY_META` and library taxonomy
- [ ] Keep navigation links to `/` and `/library` consistent across pages
- [ ] Keep research-use disclaimers consistent with legal medical disclaimer page

### 5.1 Required Pages
- [ ] Home (`app/page.tsx`)
- [ ] Pricing (packages) (`app/pricing/page.tsx`)
- [ ] How it works (`app/how-it-works/page.tsx`)
- [ ] FAQ (`app/faq/page.tsx`)
- [ ] Join (optional route wrapper) (`app/join/[tier]/page.tsx`)
- [ ] Checkout (Stripe hosted) (`app/api/checkout/route.ts`)
- [ ] Success (next steps) (`app/success/page.tsx`)
- [ ] Login (Healthie portal redirect) (`app/login/page.tsx`)
- [ ] Legal: Terms (`app/legal/terms/page.tsx`)
- [ ] Legal: Privacy (`app/legal/privacy/page.tsx`)
- [ ] Legal: Medical disclaimer (`app/legal/medical-disclaimer/page.tsx`)

### 5.2 Success Page Handoff Logic
- [ ] Display Step 1: Create portal login
- [ ] Display Step 2: Complete intake
- [ ] Display Step 3: Book consult
- [ ] Provide portal link
- [ ] Provide scheduling link
- [ ] Provide support contact
- [ ] Optional: show membership active based on Stripe redirect params (PHI-free)

### 5.3 Membership Gating (PHI-Free)
- [ ] Gate member content by Stripe subscription status
- [ ] Gate member content by customer email
- [ ] Do not store clinical info in website DB

### 5.4 Library Access (Existing Magic Link Flow)
- [ ] Implement `/api/auth/magic-link` to send access links
- [ ] Implement `/api/auth/verify` to validate token and set session cookie
- [ ] Implement `/api/auth/logout` to clear session cookie
- [ ] Add session token creation and verification for `library-session`
- [ ] Enforce 15-minute magic link expiration
- [ ] Enforce 7-day session expiration
- [ ] Verify active Stripe subscription before granting access
- [ ] Remove dev-mode auto-grant in production
- [ ] Use secure cookie flags in production (HttpOnly, Secure, SameSite)
- [ ] Ensure `LibraryLogin` error mapping covers all expected failure states

### 5.5 Library Content Operations (Current Markdown System)
- [ ] Maintain `content/library/*.md` as source of truth
- [ ] Ensure new categories have matching markdown files
- [ ] Ensure `generateStaticParams` includes all categories in `CATEGORY_META`
- [ ] Validate markdown rendering via `marked`
- [ ] Keep content in PHI-free language and research-only framing
- [ ] Reconcile current library taxonomy with planned library structure (Foundation, Weightloss, Longevity, Cognition, Recovery, Protocol Catalog)
- [ ] Keep `content/library/index.md` and `content/library/products.md` aligned with library quick links

### 5.6 Site Navigation and Shared UI (Synergy)
- [ ] Add shared header and footer components consistent with library branding
- [ ] Use cultr color tokens and typography across new pages
- [ ] Ensure marketing pages link to Library, Pricing, Join, and Login consistently
- [ ] Ensure library pages link back to marketing pages without exposing PHI

## 6) Stripe + Billing (PHI-Free)
- [ ] Create Stripe products and prices
- [ ] Configure Stripe Billing subscriptions
- [ ] Configure Stripe Checkout (links or server-created sessions)
- [ ] Configure Stripe Customer Portal settings
- [ ] Define coupon and promo rules
- [ ] Define cancellation policy
- [ ] Define dunning policy
- [ ] Optional: implement webhook handling for subscription events
- [ ] Keep Stripe metadata PHI-free

## 7) Affiliate Tracking (PHI-Free)
- [ ] Select affiliate platform (Rewardful or Tolt or FirstPromoter)
- [ ] Connect affiliate platform to Stripe
- [ ] Define commission rules per plan tier
- [ ] Define refund handling policies for affiliates

## 8) Email Deliverability (PHI-Free)
- [ ] Configure SPF
- [ ] Configure DKIM
- [ ] Configure DMARC
- [ ] Ensure onboarding reminders are PHI-free
- [ ] Confirm receipts handled by Stripe

## 9) Analytics (PHI-Free)
- [ ] Define event spec for:
  - [ ] Plan view
  - [ ] Click join
  - [ ] Checkout started
  - [ ] Checkout completed
  - [ ] Success page CTA clicks
  - [ ] Login clicks
  - [ ] Booking clicks
- [ ] Verify no PHI is tracked

## 10) Healthie Core Setup (PHI)
- [ ] Configure clinic branding
- [ ] Create appointment types
- [ ] Build intake forms and consents
- [ ] Create visit note templates
- [ ] Create message templates
- [ ] Create care plans and care plan templates
- [ ] Create programs (onboarding drip and protocol education)
- [ ] Configure scheduling, telehealth, and secure messaging

## 11) Protocol Engine v1 (Inside Healthie)
### 11.1 Healthie Primitives
- [ ] Care Plans for patient-specific protocol plans
- [ ] Care Plan Templates for reusable protocols
- [ ] Documents for instruction packets and education
- [ ] Programs for drip education cadence
- [ ] Charting templates aligned to protocols

### 11.2 Provider Workflow (v1)
- [ ] Open patient
- [ ] Apply Care Plan Template (protocol)
- [ ] Customize patient-specific fields (dose schedule, monitoring cadence)
- [ ] Use visit note template to document assessment and decision
- [ ] Assign a Program (drip) for education and check-ins
- [ ] Send standardized post-visit summary message template

### 11.3 Patient Workflow (v1)
- [ ] Patient sees care plan
- [ ] Patient receives resources
- [ ] Patient receives drip education
- [ ] Patient uses messaging for questions and check-ins

## 12) Protocol Template Library (Initial Set)
- [ ] Clinic onboarding and expectations
- [ ] Weightloss foundation protocol
- [ ] GLP-1 initiation protocol (education, monitoring, follow-ups)
- [ ] GLP-1 titration follow-up protocol
- [ ] Appetite and cravings support protocol (education)
- [ ] Muscle retention protocol (training and nutrition support)
- [ ] Sleep optimization protocol
- [ ] Stress and recovery protocol
- [ ] Metabolic labs review protocol
- [ ] Cardiometabolic risk reduction protocol (education, monitoring)
- [ ] Cognition foundation protocol
- [ ] Gut health foundation protocol (education)
- [ ] Supplement foundation protocol (education)
- [ ] Peptide education protocol (category overview, monitoring framework)
- [ ] Peptide protocol template: titration or cycle plan shell
- [ ] Refill cadence protocol template
- [ ] Side effect management protocol template (education, escalation rules)
- [ ] Missed follow-up re-engagement protocol
- [ ] Maintenance or plateau protocol
- [ ] Stop or pause protocol template (education, follow-up rules)

### 12.1 Template Requirements (Each Template Must Include)
- [ ] Goal statement
- [ ] Phase breakdown (Week 0, Week 1-4, Week 5-8, etc.)
- [ ] Monitoring checklist
- [ ] Patient instruction blocks
- [ ] Follow-up cadence
- [ ] Red flags and escalation guidance

## 13) Protocol Governance
- [ ] Establish protocol committee (clinical owner and reviewer)
- [ ] Define protocol lifecycle (Draft -> Review -> Approved -> Published -> Retired)
- [ ] Define versioning rules (Major vs Minor changes)
- [ ] Maintain audit trail (who, when, why)
- [ ] Set monthly protocol review cadence

## 14) Protocol Data Model Standardization (v2/v3)
### 14.1 ProtocolTemplate Fields
- [ ] protocol_template_id
- [ ] name
- [ ] version
- [ ] status (draft | approved | retired)
- [ ] clinical_owner
- [ ] reviewers[]
- [ ] last_reviewed_at
- [ ] tags[] (weightloss, metabolic, appetite, sleep, cognition, recovery, longevity foundation)
- [ ] intended_population
- [ ] eligibility_notes
- [ ] contraindication_rules[] (human-readable + machine-readable)
- [ ] risk_flags[]
- [ ] monitoring_plan
- [ ] education_bundle_id
- [ ] default_followup_cadence
- [ ] default_refill_cadence
- [ ] default_labs_schedule[]
- [ ] patient_instruction_blocks[]
- [ ] provider_note_blocks[]
- [ ] billing_notes (internal, PHI-free guidance)
- [ ] legal_disclaimer_block (education disclaimer)

### 14.2 ProtocolInstance Fields
- [ ] protocol_instance_id
- [ ] protocol_template_id
- [ ] patient_external_ref (Healthie patient id, PHI-approved only if permitted)
- [ ] start_date
- [ ] end_date (optional)
- [ ] status (active | paused | completed)
- [ ] goal_metrics[] (weight, waist, BP, sleep score, etc.)
- [ ] compounds[]
- [ ] titration_schedule[]
- [ ] monitoring_tasks[]
- [ ] lab_tasks[]
- [ ] checkin_forms[]
- [ ] followup_appointments[]
- [ ] instruction_packet_url (stored in PHI system if patient-specific)
- [ ] change_log[] (who changed what, when)

### 14.3 Compound Fields (Within Protocol)
- [ ] compound_name
- [ ] category (GLP-1 | TRT | peptide | supplement | lifestyle)
- [ ] route
- [ ] frequency
- [ ] dose
- [ ] units
- [ ] timing_notes
- [ ] cycle_start
- [ ] cycle_end
- [ ] titration_steps[] (week-by-week)
- [ ] refill_interval_days
- [ ] storage_handling_notes (education)
- [ ] side_effect_watchlist[]
- [ ] patient_instructions_block
- [ ] provider_documentation_block
- [ ] pharmacy_fulfillment_notes (internal)

### 14.4 MonitoringPlan Fields (Within Protocol)
- [ ] vitals_requirements[] (BP, HR, weight)
- [ ] symptom_checklist[]
- [ ] red_flag_rules[]
- [ ] lab_schedule[] (what, frequency)
- [ ] followup_triggers[] (if X, schedule follow-up)
- [ ] messaging_guidelines_block (when to message clinic)
- [ ] emergency_disclaimer_block

### 14.5 Care Plan Output Mapping (Healthie)
- [ ] Protocol -> Care Plan
- [ ] Protocol template -> Care Plan Template
- [ ] Instruction packet -> Document attached to Care Plan
- [ ] Drip education -> Program

## 15) Provider Workflows (Exhaustive)
### 15.1 New Patient Workflow
- [ ] Intake review checklist: goals
- [ ] Intake review checklist: risks
- [ ] Intake review checklist: baseline vitals and metrics
- [ ] Intake review checklist: prior history
- [ ] Intake review checklist: contraindication screen
- [ ] Use visit note template: New consult
- [ ] Select protocol (Care Plan Template)
- [ ] Customize protocol schedule
- [ ] Assign drip program (onboarding)
- [ ] Assign protocol education program
- [ ] Schedule follow-up by plan tier
- [ ] Send post-visit summary message template

### 15.2 Follow-Up Workflow
- [ ] Open patient snapshot
- [ ] Use follow-up note template (1-click)
- [ ] Update protocol instance (Care Plan edits)
- [ ] Add tasks: labs due
- [ ] Add tasks: check-in form
- [ ] Confirm next appointment cadence
- [ ] Send short instructions message

### 15.3 Lab Review Workflow
- [ ] Review labs or uploaded results
- [ ] Use note template: Lab review
- [ ] Update care plan monitoring tasks
- [ ] Update care plan education blocks
- [ ] Message patient with summary and next steps
- [ ] Trigger follow-up if abnormal results

### 15.4 Refill and Renewal Workflow
- [ ] Identify patient due for refill check-in
- [ ] Identify patient due for follow-up appointment
- [ ] Identify patient due for labs
- [ ] Use refill checklist: adherence
- [ ] Use refill checklist: side effects
- [ ] Use refill checklist: vitals trend
- [ ] Use refill checklist: labs compliance
- [ ] Document refill decision in note template
- [ ] Update care plan instructions
- [ ] Schedule next follow-up

### 15.5 Escalation Workflow (Safety)
- [ ] Message triage for non-urgent questions
- [ ] Message triage for symptoms check-in
- [ ] Message triage for urgent red flags
- [ ] Escalate to provider when needed
- [ ] Document triage actions in chart
- [ ] Schedule urgent visit if needed

## 16) Peptide Library (Education + Protocol Catalog)
### 16.1 Member-Facing Structure
- [ ] Foundation: onboarding basics
- [ ] Foundation: expectations and safety
- [ ] Foundation: how to use portal and messaging
- [ ] Weightloss: appetite management
- [ ] Weightloss: metabolic basics
- [ ] Weightloss: GLP-1 education
- [ ] Weightloss: side-effect management education
- [ ] Longevity: sleep optimization
- [ ] Longevity: stress and recovery
- [ ] Longevity: training guidance
- [ ] Longevity: nutrition foundations
- [ ] Cognition: sleep and cognition link
- [ ] Cognition: cognitive performance foundations
- [ ] Recovery: injury recovery foundations
- [ ] Protocol Catalog: protocol overview pages (education only)
- [ ] Protocol Catalog: what it is
- [ ] Protocol Catalog: how clinicians monitor
- [ ] Protocol Catalog: what patients can expect
- [ ] Protocol Catalog: check-in cadence
- [ ] Protocol Catalog: safety and escalation

### 16.2 Library Location by Phase
- [ ] MVP: Healthie Documents and Programs
- [ ] Growth: Website member library gated by Stripe status
- [ ] Later: Personalized library recommendations in custom portal (PHI-safe)

## 17) Integrations (Exhaustive)
### 17.1 Healthie API (Future)
- [ ] Confirm Healthie API add-on plan (Group/Enterprise)
- [ ] Use cases: custom portal UI (selective)
- [ ] Use cases: Protocol Engine publish to Care Plans and Templates
- [ ] Use cases: operational dashboards (non-clinical counts)

### 17.2 eRx (Future)
- [ ] Confirm DoseSpot eRx add-on availability (Plus/Group/Enterprise)
- [ ] Provider credentialing workflows
- [ ] Prescribing policies and documentation templates
- [ ] Refill SOPs for eRx workflows

### 17.3 Healthie FHIR API (Future)
- [ ] Confirm FHIR API add-on (Enterprise)
- [ ] Define interoperability use cases

## 18) Compliance and Security Guardrails
### 18.1 PHI Boundaries
- [ ] PHI allowed: Healthie (EHR, portal, messaging, care plans, programs)
- [ ] PHI not allowed: Stripe
- [ ] PHI not allowed: affiliate platforms
- [ ] PHI not allowed: analytics
- [ ] PHI not allowed: marketing email tools (unless HIPAA/BAA configured)

### 18.2 Staff Security
- [ ] MFA for all staff accounts
- [ ] Least-privilege roles
- [ ] Offboarding checklist with same-day removal
- [ ] Device policy (password manager, disk encryption)
- [ ] Incident SOP (mis-sent message, compromised account)

### 18.3 Documentation Standards
- [ ] Consistent consent completion
- [ ] Templated notes
- [ ] Protocol plan documented in Care Plan
- [ ] Follow-up cadence documented

## 19) Testing Plan (Exhaustive)
### 19.1 Website Conversion Tests
- [ ] Pricing page renders correctly
- [ ] Stripe checkout works for every tier
- [ ] Success page displays correctly
- [ ] Create portal button links correctly
- [ ] Book consult button links correctly
- [ ] Login button links correctly
- [ ] Coupon behavior validated
- [ ] Cancel URL returns to pricing

### 19.2 Healthie Patient Flow Tests
- [ ] Portal account creation works
- [ ] Intake forms complete
- [ ] Appointment scheduling works
- [ ] Telehealth visit works
- [ ] Secure messaging works
- [ ] Provider note templates apply
- [ ] Care plan template applies and visible to patient
- [ ] Program assignment drips content

### 19.3 Edge Cases
- [ ] Paid user never creates portal
- [ ] Paid user creates portal but never books
- [ ] Patient no-shows
- [ ] Subscription past_due
- [ ] Upgrade and downgrade behavior

## 20) Admin and Ops SOPs (Exhaustive)
### 20.1 Daily Coordinator SOP
- [ ] Check Stripe new customers
- [ ] Confirm new member created portal
- [ ] Confirm new member completed intake
- [ ] Confirm new member booked consult
- [ ] Send reminder templates: 24h no-book
- [ ] Send reminder templates: 72h no-book
- [ ] Send reminder templates: intake incomplete
- [ ] Confirm tomorrow schedule
- [ ] Triage inbox: non-urgent
- [ ] Triage inbox: needs provider
- [ ] Triage inbox: urgent escalation

### 20.2 Weekly SOP
- [ ] Protocol usage review
- [ ] Churn risk list (past_due, missed visits)
- [ ] Follow-up compliance list
- [ ] Library and program content updates

### 20.3 Monthly SOP
- [ ] Protocol version review
- [ ] Content audit
- [ ] Affiliate payout review
- [ ] Billing policy review

## 21) Phase 1 (Week 1-2) MVP You Can Run the Clinic On
### 21.1 Website
- [ ] Next.js marketing site
- [ ] Pricing page
- [ ] Checkout flow
- [ ] Success page
- [ ] Login redirect
- [ ] Basic email deliverability configured

### 21.2 Healthie
- [ ] Clinic branding
- [ ] Appointment types
- [ ] Intake forms and consents
- [ ] Note templates
- [ ] Care Plans and Care Plan Templates (initial protocol set)
- [ ] Programs (onboarding drip and protocol education)
- [ ] Message templates
- [ ] SOPs: onboarding, follow-ups, triage

### 21.3 Protocol Engine v1 Deliverable
- [ ] 10-20 Care Plan Templates covering core offers

## 22) Phase 2 (Week 3-6) Operational Acceleration
- [ ] Expand protocol template library
- [ ] Add check-in Programs per protocol
- [ ] Define protocol naming and versioning rules
- [ ] Implement refill cadence SOP
- [ ] Add lab review templates
- [ ] Optional: integrate eRx add-on after workflows stabilize

## 23) Phase 3 (Week 6-12) Moat Layers (PHI-Free)
### 23.1 Protocol Builder v2 (Provider-Only, PHI-Free)
- [ ] Protocol template editor
- [ ] Versioning and approvals
- [ ] Instruction generator
- [ ] Export blocks for Healthie
- [ ] Template tagging and search
- [ ] Protocol usage analytics (PHI-free)

### 23.2 Thin Member Dashboard v1 (PHI-Free)
- [ ] Show membership status
- [ ] Provide library access
- [ ] Provide deep-links to Healthie portal

## 24) Phase 4 (12+ Weeks) Deep Integration
### 24.1 Protocol Builder v3 Publish to Healthie
- [ ] Publish to Care Plan (patient)
- [ ] Publish to Care Plan Template (org library, if approved)
- [ ] Publish Document (instruction packet)
- [ ] Publish Program assignment (drip schedule)
- [ ] Maintain audit log of publishes

### 24.2 Custom Portal Experiences (Selective)
- [ ] Build custom member dashboard (PHI-free)
- [ ] Build provider protocol builder (PHI-free)
- [ ] Later: patient-specific portal features via Healthie API

### 24.3 Ops Dashboards (Non-Clinical)
- [ ] Counts and cohorts dashboards (no PHI)

### 24.4 Optional Healthie FHIR API Layer
- [ ] Evaluate and enable FHIR API (Enterprise)

## 25) Deliverables (Exhaustive Build Artifacts)
### 25.1 Website Deliverables
- [ ] Page implementations
- [ ] Pricing config
- [ ] Checkout links or server-created sessions
- [ ] Success page onboarding UX
- [ ] PHI-safe analytics event spec
- [ ] Email deliverability setup doc

### 25.2 Stripe Deliverables
- [ ] Products and prices
- [ ] Coupon list and rules
- [ ] Cancellation policy
- [ ] Dunning policy
- [ ] Customer portal settings
- [ ] Webhook plan (optional)

### 25.3 Healthie Deliverables
- [ ] Appointment types
- [ ] Intake forms and consents
- [ ] Note templates
- [ ] Message templates
- [ ] Care plan templates (protocol library)
- [ ] Programs (drip education)
- [ ] Go-live QA checklist

### 25.4 Protocol Engine Deliverables
- [ ] v1: Care plan template set
- [ ] v1: Matching note templates
- [ ] v1: Program drip bundles
- [ ] v2: Protocol template editor
- [ ] v2: Protocol generator outputs (copy/paste blocks)
- [ ] v2: Versioning and approvals
- [ ] v2: Template tagging and search
- [ ] v2: Export formats (note block, care plan block, instruction packet, drip outline)
- [ ] v3: Healthie API integration module
- [ ] v3: Publish to care plan actions
- [ ] v3: Publish as template approval gates
- [ ] v3: Audit log of publishes

## 26) Healthie Feature Alignment (Explicit Mapping)
- [ ] Care Plans enable applying protocols with patient customization
- [ ] Care Plan Templates enable saving protocols for reuse
- [ ] Programs drip content over weeks or months
- [ ] API add-on (Group/Enterprise) for key generation and sandbox workflow
- [ ] eRx via DoseSpot add-on available on Plus/Group/Enterprise
- [ ] Healthie FHIR API add-on available on Enterprise
