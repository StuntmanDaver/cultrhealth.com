# CULTR Platform End-to-End Checklist

## 0) Non-Negotiables and PHI Boundaries
- [ ] Keep public website PHI-free and cacheable
- [ ] Store all patient-specific clinical data, orders, and medical records in Asher Med platform
- [ ] Keep Stripe, affiliate tools, analytics, and marketing CRMs PHI-free
- [ ] Treat Protocol Engine as first-class object with phased approach (v1 Asher Med platform, v2 PHI-free builder, v3 API publish)

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
- [ ] v1: Asher Med platform integration
- [ ] v2: Thin custom member dashboard (PHI-free) with Asher Med deep-links
- [ ] v3: Custom portal UX powered by Asher Med API

## 2) Phase 0 Decisions (Prevent Complexity)
- [ ] Choose MVP model: Asher Med platform integration vs thin member dashboard
- [ ] Decide Asher Med API integration timing (now vs later)
- [ ] Decide to start Protocol Engine v1 with order templates and protocols

## 3) Architecture and Stack
### 3.1 PHI-Free Public Website
- [ ] Next.js marketing site
- [ ] Pricing and packages pages
- [ ] Stripe Checkout integration
- [ ] Affiliate tracking integration
- [ ] Non-PHI content library previews
- [ ] Member dashboard with Asher Med integration

### 3.2 Clinical + Order Management System (PHI)
- [ ] Asher Med platform as system of record (patient registration, order management, prescription fulfillment, medical records)
- [ ] Asher Med API integration for patient onboarding and order creation
- [ ] HIPAA-compliant file storage and retrieval via Asher Med

### 3.3 API-First Integration in Practice
- [ ] Confirm Asher Med API-first model for patient and order management
- [ ] Set up sandbox and production API key workflows
- [ ] Plan membership status sync (PHI-free)
- [ ] Plan create/read orders and patient records via API
- [ ] Plan custom member dashboard experiences
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
- [ ] Asher Med platform for clinical operations and fulfillment
- [ ] Asher Med API integration for patient onboarding and order management

## 4) End-to-End User Journey (Exact Flow)
### 4.1 Visitor to Member (Website)
- [ ] Visitor lands on website (home or pricing)
- [ ] Visitor selects a package
- [ ] Visitor completes Stripe Checkout subscription
- [ ] Success page shows:
  - [ ] Button: Complete medical intake and order
  - [ ] 3-step timeline: Account -> Intake -> Order Submission

### 4.2 Member to Patient (Asher Med Platform)
- [ ] Patient creates account in member dashboard
- [ ] Patient completes intake questionnaire and consents
- [ ] Patient uploads required documents (ID, signatures)
- [ ] Patient selects medication packages and duration
- [ ] Order submitted to Asher Med platform for provider review
- [ ] Provider reviews order and approves prescription
- [ ] Patient receives order confirmation and tracking
- [ ] Medication shipped to patient address
- [ ] Patient receives protocol education and resources
- [ ] Retention loop: renewal reminders, check-ins, refill management

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
- [ ] Login (member dashboard) (`app/login/page.tsx`)
- [ ] Legal: Terms (`app/legal/terms/page.tsx`)
- [ ] Legal: Privacy (`app/legal/privacy/page.tsx`)
- [ ] Legal: Medical disclaimer (`app/legal/medical-disclaimer/page.tsx`)

### 5.2 Success Page Handoff Logic
- [ ] Display Step 1: Access member dashboard
- [ ] Display Step 2: Complete medical intake
- [ ] Display Step 3: Submit order
- [ ] Provide member dashboard link
- [ ] Provide intake form link
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

## 10) Asher Med Platform Setup (PHI)
- [ ] Configure partner account and branding
- [ ] Set up API keys (sandbox and production)
- [ ] Build intake questionnaire flow
- [ ] Create consent form templates
- [ ] Configure medication packages and protocols
- [ ] Set up file upload workflows (ID, signatures)
- [ ] Configure order review and approval workflows
- [ ] Set up patient communication templates

## 11) Protocol Engine v1 (Asher Med Integration)
### 11.1 Asher Med Order Components
- [ ] Medication packages for treatment protocols
- [ ] Wellness questionnaires for patient assessment
- [ ] Treatment preferences for protocol customization
- [ ] Order metadata for protocol tracking
- [ ] Patient education resources aligned to protocols

### 11.2 Provider Workflow (v1)
- [ ] Review patient order in Asher Med dashboard
- [ ] Review intake questionnaire and medical history
- [ ] Review physical measurements and treatment preferences
- [ ] Approve medication package and dosing protocol
- [ ] Customize patient-specific instructions
- [ ] Approve order for fulfillment
- [ ] Patient receives order confirmation and education resources

### 11.3 Patient Workflow (v1)
- [ ] Patient receives order confirmation
- [ ] Patient receives tracking information
- [ ] Patient receives protocol education resources
- [ ] Patient accesses renewal and refill management

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
- [ ] patient_external_ref (Asher Med patient id, PHI-approved only if permitted)
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

### 14.5 Order Output Mapping (Asher Med)
- [ ] Protocol -> Medication Package
- [ ] Protocol template -> Order Template
- [ ] Instruction packet -> Education Resources
- [ ] Drip education -> Email Automation

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
- [ ] MVP: Member dashboard education resources
- [ ] Growth: Website member library gated by Stripe status
- [ ] Later: Personalized library recommendations in custom portal (PHI-safe)

## 17) Integrations (Exhaustive)
### 17.1 Asher Med API Integration
- [ ] Configure Asher Med API keys (sandbox and production)
- [ ] Use cases: patient onboarding and registration
- [ ] Use cases: order creation and tracking
- [ ] Use cases: operational dashboards (non-clinical counts)

### 17.2 Prescription Management
- [ ] Asher Med handles prescription generation and fulfillment
- [ ] Provider credentialing managed by Asher Med
- [ ] Order approval workflows for prescription authorization
- [ ] Refill and renewal workflows via Asher Med platform

### 17.3 File Management
- [ ] Implement S3 presigned URL workflow for file uploads
- [ ] Upload patient ID photos and consent signatures
- [ ] Retrieve uploaded files for verification

## 18) Compliance and Security Guardrails
### 18.1 PHI Boundaries
- [ ] PHI allowed: Asher Med platform (patient records, orders, medical files)
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

### 19.2 Asher Med Patient Flow Tests
- [ ] Member dashboard access works
- [ ] Intake forms complete and validate
- [ ] File uploads work (ID photos, signatures)
- [ ] Order submission to Asher Med successful
- [ ] Order appears in Asher Med partner portal
- [ ] Provider can review and approve orders
- [ ] Patient receives order confirmation
- [ ] Renewal orders work for existing patients

### 19.3 Edge Cases
- [ ] Paid user never accesses member dashboard
- [ ] Paid user starts intake but never completes order
- [ ] Order submitted but never approved by provider
- [ ] Subscription past_due before order fulfillment
- [ ] Upgrade and downgrade behavior

## 20) Admin and Ops SOPs (Exhaustive)
### 20.1 Daily Coordinator SOP
- [ ] Check Stripe new customers
- [ ] Confirm new member accessed dashboard
- [ ] Confirm new member completed intake
- [ ] Confirm new member submitted order
- [ ] Send reminder templates: 24h no-order
- [ ] Send reminder templates: 72h no-order
- [ ] Send reminder templates: intake incomplete
- [ ] Review pending orders in Asher Med portal
- [ ] Triage patient questions: non-urgent
- [ ] Triage patient questions: needs provider
- [ ] Triage patient questions: urgent escalation

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

### 21.2 Asher Med Platform
- [ ] Partner account setup and branding
- [ ] API integration (sandbox and production)
- [ ] Intake questionnaire implementation
- [ ] Consent form templates
- [ ] Medication packages and protocols
- [ ] File upload workflows
- [ ] Order review and approval workflows
- [ ] SOPs: order processing, renewals, patient communication

### 21.3 Protocol Engine v1 Deliverable
- [ ] 10-20 medication packages and treatment protocols covering core offers

## 22) Phase 2 (Week 3-6) Operational Acceleration
- [ ] Expand medication packages and protocols
- [ ] Add automated renewal and refill workflows
- [ ] Define protocol naming and versioning rules
- [ ] Implement renewal cadence SOP
- [ ] Add patient check-in questionnaires
- [ ] Optimize order review and approval workflows

## 23) Phase 3 (Week 6-12) Moat Layers (PHI-Free)
### 23.1 Protocol Builder v2 (Provider-Only, PHI-Free)
- [ ] Protocol template editor
- [ ] Versioning and approvals
- [ ] Instruction generator
- [ ] Export order templates for Asher Med
- [ ] Template tagging and search
- [ ] Protocol usage analytics (PHI-free)

### 23.2 Thin Member Dashboard v1 (PHI-Free)
- [ ] Show membership status
- [ ] Provide library access
- [ ] Provide access to intake and order submission

## 24) Phase 4 (12+ Weeks) Deep Integration
### 24.1 Protocol Builder v3 Publish to Asher Med
- [ ] Publish to order templates
- [ ] Generate medication packages from protocols
- [ ] Create patient-specific order instructions
- [ ] Automate renewal scheduling
- [ ] Maintain audit log of protocol usage

### 24.2 Custom Portal Experiences (Selective)
- [ ] Build custom member dashboard (PHI-free)
- [ ] Build provider protocol builder (PHI-free)
- [ ] Later: patient-specific portal features via Asher Med API

### 24.3 Ops Dashboards (Non-Clinical)
- [ ] Counts and cohorts dashboards (no PHI)

### 24.4 Advanced API Integration
- [ ] Evaluate additional Asher Med API endpoints for custom workflows

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

### 25.3 Asher Med Platform Deliverables
- [ ] Partner account configuration
- [ ] API integration implementation
- [ ] Intake questionnaire flow
- [ ] Consent form templates
- [ ] Medication packages and protocols
- [ ] File upload workflows
- [ ] Go-live QA checklist

### 25.4 Protocol Engine Deliverables
- [ ] v1: Medication package templates
- [ ] v1: Treatment protocol documentation
- [ ] v1: Patient education resources
- [ ] v2: Protocol template editor
- [ ] v2: Protocol generator outputs (order templates)
- [ ] v2: Versioning and approvals
- [ ] v2: Template tagging and search
- [ ] v2: Export formats (order template, instruction packet, education outline)
- [ ] v3: Asher Med API integration module
- [ ] v3: Publish to order templates
- [ ] v3: Protocol approval workflows
- [ ] v3: Audit log of protocol usage

## 26) Asher Med Platform Feature Alignment (Explicit Mapping)
- [ ] Medication packages enable protocol-based treatment plans
- [ ] Order templates enable reusable protocol workflows
- [ ] Patient education resources provide ongoing support
- [ ] Asher Med API enables patient onboarding and order management
- [ ] Prescription management handled by Asher Med licensed providers
- [ ] HIPAA-compliant file storage via S3 presigned URLs
- [ ] Order tracking and fulfillment managed by Asher Med
