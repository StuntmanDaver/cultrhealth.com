# CULTR Health LegitScript Certification Audit Plan

**Date:** April 4, 2026
**Site:** staging.cultrhealth.com
**Goal:** Achieve LegitScript Healthcare Merchant Certification for Telemedicine
**Application Fee:** $975 (non-refundable) | **Annual Fee:** $2,150/year
**Timeline:** 30-90 days from application to approval

---

## Table of Contents

1. [LegitScript's 9 Standards](#the-9-legitscript-standards)
2. [Audit Phase 1: Licensing & Business Registration](#phase-1-licensing--business-registration-standard-1)
3. [Audit Phase 2: Legal & Regulatory Compliance](#phase-2-legal--regulatory-compliance-standard-2)
4. [Audit Phase 3: Disciplinary History](#phase-3-disciplinary-history-standard-3)
5. [Audit Phase 4: Affiliates & Partners](#phase-4-affiliates--partners-standard-4)
6. [Audit Phase 5: Patient Services](#phase-5-patient-services-standard-5)
7. [Audit Phase 6: Privacy & Data Protection](#phase-6-privacy--data-protection-standard-6)
8. [Audit Phase 7: Validity of Prescription](#phase-7-validity-of-prescription-standard-7)
9. [Audit Phase 8: Transparency & Claims](#phase-8-transparency--claims-standard-8)
10. [Audit Phase 9: Advertising Compliance](#phase-9-advertising-compliance-standard-9)
11. [Page-by-Page Audit Checklist](#page-by-page-audit-checklist)
12. [GLP-1 & Peptide-Specific Compliance](#glp-1--peptide-specific-compliance)
13. [Website Content Requirements](#website-content-requirements-checklist)
14. [Technical Requirements](#technical-requirements)
15. [Application Documentation Prep](#application-documentation-prep)
16. [Risk Register](#risk-register)
17. [Implementation Priority Matrix](#implementation-priority-matrix)

---

## The 9 LegitScript Standards

| # | Standard | Focus Area | Risk Level for CULTR |
|---|----------|------------|---------------------|
| 1 | **Licensure & Business Registration** | Proper licensing in all jurisdictions served | HIGH |
| 2 | **Legal Compliance** | Compliance with all prescribing/dispensing laws | HIGH |
| 3 | **Prior Discipline & History** | 10-year history disclosure for all principals | MEDIUM |
| 4 | **Affiliates & Partners** | All partners must also be compliant/certified | HIGH |
| 5 | **Patient Services** | Clear disclosure of service areas & availability | MEDIUM |
| 6 | **Privacy** | HIPAA compliance, SSL, data protection | MEDIUM |
| 7 | **Validity of Prescription** | Valid practitioner-patient relationships | HIGH |
| 8 | **Transparency** | Accurate, non-misleading claims & operations | CRITICAL |
| 9 | **Advertising** | Compliant ads across all platforms | HIGH |

---

## Phase 1: Licensing & Business Registration (Standard 1)

### What LegitScript Requires
- Valid business registration in state of incorporation
- Medical practice license in all states where patients are located
- Pharmacy licenses (or partner pharmacy licenses) in dispensing states
- Telemedicine permits where required by state law
- DEA registration (if controlled substances involved)
- NPI numbers for all prescribing providers

### Audit Checklist

- [ ] **1.1** Verify CULTR Health business entity registration (state, type, status)
- [ ] **1.2** Document business physical address (no PO Box — must be verifiable)
- [ ] **1.3** List all states currently serving patients (site claims "48 states")
- [ ] **1.4** Verify medical practice license for each state served
- [ ] **1.5** Verify telemedicine permits/registrations per state (many states require separate telemedicine registration)
- [ ] **1.6** Document prescribing provider licenses (Dr. Ali Saberi, MD — verify all states)
- [ ] **1.7** Verify Asher Med pharmacy licensing in all dispensing states
- [ ] **1.8** Confirm DEA registration status (applicable if any controlled substances)
- [ ] **1.9** Verify NPI numbers for all providers
- [ ] **1.10** Confirm business insurance (malpractice, general liability)
- [ ] **1.11** Document state-by-state telemedicine prescribing restrictions (some states require in-person visit first)

### Website Changes Needed
- [ ] **1.W1** Add "Licensed in [X] states" with accurate state count (verify "48 states" claim)
- [ ] **1.W2** Display business registration information (or link to it)
- [ ] **1.W3** Add provider credential pages with license numbers

### Files to Audit
| File | What to Check |
|------|---------------|
| `lib/config/social-proof.ts` | TRUST_METRICS claims "48 states" — verify this is accurate |
| `app/how-it-works/page.tsx` | Claims "Licensed pharmacies only" — verify |
| `components/site/Footer.tsx` | Trust badge "Licensed Providers" — verify all are licensed |

---

## Phase 2: Legal & Regulatory Compliance (Standard 2)

### What LegitScript Requires
- Compliance with ALL federal, state, and local laws for prescribing and dispensing
- Cannot facilitate prescribing/dispensing of unapproved medications
- Cannot sell medications lacking regulatory authorization
- Must comply with FDA regulations on drug marketing

### Audit Checklist

- [ ] **2.1** Verify FDA approval status of every medication offered:
  - [ ] Semaglutide — FDA-approved (Wegovy/Ozempic); compounded status?
  - [ ] Tirzepatide — FDA-approved (Mounjaro/Zepbound); compounded status?
  - [ ] removed therapy (removed therapy) — NOT FDA-approved (investigational)
  - [ ] BPC-157 — NOT FDA-approved
  - [ ] TB-500 — NOT FDA-approved
  - [ ] GHK-Cu — NOT FDA-approved as drug
  - [ ] NAD+ — Supplement, not FDA-approved as drug
  - [ ] Semax/Selank — NOT FDA-approved in US
  - [ ] CJC-1295/Ipamorelin — NOT FDA-approved
  - [ ] TESA/Ipamorelin — NOT FDA-approved
  - [ ] Melanotan 2 — NOT FDA-approved, FDA has issued warnings
- [ ] **2.2** Determine if compounded versions of FDA-approved drugs are still legally available post-shortage resolution:
  - [ ] Semaglutide compounding deadline: April 24, 2025 (EXPIRED)
  - [ ] Tirzepatide compounding deadline: March 5, 2025 (EXPIRED)
  - [ ] Verify current sourcing through Asher Med is compliant
- [ ] **2.3** Review ALL product descriptions for FDA compliance
- [ ] **2.4** Ensure no claims that non-FDA-approved peptides "treat" or "cure" conditions
- [ ] **2.5** Verify compliance with FTC Act Section 5 (unfair/deceptive practices)
- [ ] **2.6** Review state-specific telemedicine prescribing laws
- [ ] **2.7** Verify controlled substance scheduling compliance (if applicable)
- [ ] **2.8** Confirm compliance with Ryan Haight Act (online prescribing of controlled substances)
- [ ] **2.9** Review FDA warning letters database for any related to CULTR or Asher Med

### CRITICAL: FDA Enforcement on Compounded GLP-1s
> **As of May 2025, FDA ended enforcement discretion on compounded semaglutide and tirzepatide.** 503A pharmacies can ONLY compound these if they demonstrate a patient's legitimate, documented clinical need that cannot be satisfied by commercially available FDA-approved products. Compounded drugs cannot be "essentially copies" of originals unless a meaningful clinical difference is documented.

### Website Changes Needed
- [ ] **2.W1** Add FDA status disclosures to every product/therapy page
- [ ] **2.W2** Add "compounded medication" disclaimers where applicable
- [ ] **2.W3** Remove or modify claims for non-FDA-approved peptides
- [ ] **2.W4** Add "These statements have not been evaluated by the FDA" where required
- [ ] **2.W5** Review and update medical disclaimer page with current FDA status

### Files to Audit
| File | What to Check |
|------|---------------|
| `lib/config/therapies.ts` | Every therapy description for FDA compliance |
| `lib/config/products.ts` | Every product description for unapproved claims |
| `lib/config/product-catalog.ts` | All SKUs, descriptions, "FDA-studied" language |
| `app/products/page.tsx` | Product page claims ("Up to 24% body weight reduction") |
| `app/therapies/page.tsx` | Therapy descriptions and claims |
| `app/pricing/page.tsx` | What therapies are included per tier |
| `lib/config/plans.ts` | Plan descriptions and included medications |
| `app/legal/medical-disclaimer/page.tsx` | Current disclaimer language |

### HIGH-RISK PRODUCTS (Likely LegitScript Blockers)
| Product | Issue | Action Required |
|---------|-------|-----------------|
| **removed therapy (removed therapy)** | Not FDA-approved, investigational only | May need to remove from public marketing |
| **Melanotan 2 (MT2)** | FDA has issued consumer warnings | HIGH RISK — may need to remove entirely |
| **Semax/Selank** | Not FDA-approved in US | Review marketing claims |
| **BPC-157/TB-500** | Not FDA-approved | Cannot claim to "treat" conditions |
| **Compounded Semaglutide/Tirzepatide** | Post-shortage enforcement | Verify Asher Med compliance |

---

## Phase 3: Disciplinary History (Standard 3)

### What LegitScript Requires
- Disclosure of criminal, regulatory, or civil violations from past 10 years
- Includes all principals, key staff, and medical/pharmacy practitioners
- Recent/repeated disciplinary sanctions may disqualify
- Must disclose any ongoing, resolved, or addressed litigation

### Audit Checklist

- [ ] **3.1** Run license verification for Dr. Ali Saberi, MD (all states)
- [ ] **3.2** Check state medical board disciplinary records for all providers
- [ ] **3.3** Check DEA sanctions list
- [ ] **3.4** Check OIG exclusion list (Office of Inspector General)
- [ ] **3.5** Run background on all CULTR Health principals/officers
- [ ] **3.6** Check Asher Med's disciplinary history
- [ ] **3.7** Check pharmacy partner licensing and disciplinary history
- [ ] **3.8** Document any litigation history for the business entity
- [ ] **3.9** Prepare 10-year disclosure statement for application

### Documentation to Prepare
- [ ] **3.D1** Provider license verification printouts (all states)
- [ ] **3.D2** OIG exclusion search results
- [ ] **3.D3** State medical board standing letters
- [ ] **3.D4** Business entity good standing certificates

---

## Phase 4: Affiliates & Partners (Standard 4)

### What LegitScript Requires
- ALL affiliates and partners must comply with certification standards
- Partner pharmacies generally require LegitScript certification or equivalent
- Must disclose ALL domain names and affiliated entities
- Any person/entity exercising control must not be affiliated with non-compliant entities

### Audit Checklist

- [ ] **4.1** Verify Asher Med Partner Portal LegitScript certification status
- [ ] **4.2** Verify dispensing pharmacy LegitScript/VIPPS/equivalent accreditation
- [ ] **4.3** Verify SiPhox Health compliance status (lab partner)
- [ ] **4.4** Document ALL business affiliations and partnerships
- [ ] **4.5** Disclose ALL operated domains:
  - [ ] cultrhealth.com (production)
  - [ ] staging.cultrhealth.com (staging)
  - [ ] join.cultrhealth.com (subdomain)
  - [ ] Any other domains owned
- [ ] **4.6** Verify Stripe payment processing compliance for healthcare
- [ ] **4.7** Verify Resend email service BAA status
- [ ] **4.8** Document relationship with creator affiliates (LegitScript may scrutinize affiliate marketing)
- [ ] **4.9** Ensure no links to non-compliant healthcare websites
- [ ] **4.10** Verify Cal.com/Daily.co telehealth platform compliance (HIPAA BAA)

### CRITICAL: Partner Pharmacy Certification
> LegitScript Terms state: "Partner pharmacies generally require LegitScript certification or equivalent accreditation." **If Asher Med's dispensing pharmacy is not LegitScript certified, this could block CULTR's certification.**

### Website Changes Needed
- [ ] **4.W1** Display dispensing pharmacy information (name, address, phone, fax) — REQUIRED
- [ ] **4.W2** Add pharmacy license numbers to dispensing info
- [ ] **4.W3** Review all external links for compliance (no links to non-certified healthcare sites)

### Files to Audit
| File | What to Check |
|------|---------------|
| `components/site/Footer.tsx` | External links — ensure none link to non-compliant sites |
| `lib/config/links.ts` | All external URLs — verify compliance of linked sites |
| `app/creators/page.tsx` | Creator/affiliate program — how it's presented |
| `lib/config/affiliate.ts` | Affiliate structure — must be transparent |

---

## Phase 5: Patient Services (Standard 5)

### What LegitScript Requires
- Clearly disclose ALL states/territories/countries where services are available
- Clear information about what services are offered
- Transparent patient onboarding process
- Clear information about how care is delivered

### Audit Checklist

- [ ] **5.1** Add explicit state availability disclosure to website
- [ ] **5.2** Clearly describe the patient care pathway (quiz → intake → provider review → prescription → fulfillment)
- [ ] **5.3** Disclose which services are available in which states (some states may have restrictions)
- [ ] **5.4** Clearly describe the practitioner-patient relationship establishment process
- [ ] **5.5** Document patient communication methods (portal, email, telehealth)
- [ ] **5.6** Ensure return/refund policy is clearly stated
- [ ] **5.7** Display customer service contact information prominently
- [ ] **5.8** Clearly state shipping/delivery expectations
- [ ] **5.9** Document patient complaint/grievance process

### Website Changes Needed
- [ ] **5.W1** Create or update a "States We Serve" disclosure page or section
- [ ] **5.W2** Add detailed "How It Works" content showing the full patient journey
- [ ] **5.W3** Add customer service contact info to every page (or footer)
- [ ] **5.W4** Add shipping policy page or section
- [ ] **5.W5** Add return/refund policy
- [ ] **5.W6** Add patient grievance/complaint process

### Files to Audit
| File | What to Check |
|------|---------------|
| `app/how-it-works/page.tsx` | Accuracy of described process |
| `app/pricing/page.tsx` | Service descriptions per tier |
| `components/site/Footer.tsx` | Contact info presence, support email |
| `app/legal/terms/page.tsx` | Return/refund/cancellation policies |
| `lib/config/plans.ts` | Plan descriptions — clear about what's included |

---

## Phase 6: Privacy & Data Protection (Standard 6)

### What LegitScript Requires
- Privacy policy clearly displayed, easily accessible
- HIPAA compliance for all PHI handling (US-based)
- SSL/TLS encryption on all pages handling sensitive data
- Privacy policy compliant with applicable laws
- Only share information with third parties as permitted by law
- BAAs (Business Associate Agreements) with all data processors

### Audit Checklist

- [ ] **6.1** Review privacy policy for HIPAA compliance completeness
- [ ] **6.2** Verify SSL/TLS certificate on all pages (HTTPS everywhere)
- [ ] **6.3** Verify privacy policy link is accessible from every page (footer)
- [ ] **6.4** Document all third parties receiving PHI and verify BAAs:
  - [ ] Asher Med (fulfillment partner) — BAA status
  - [ ] Stripe (payment processor) — BAA status
  - [ ] Neon PostgreSQL/Vercel (database) — BAA status
  - [ ] Resend (email) — BAA status
  - [ ] SiPhox Health (labs) — BAA status
  - [ ] AWS S3 (file storage) — BAA status
  - [ ] Cloudflare (CDN/security) — BAA status
  - [ ] Cal.com/Daily.co (telehealth) — BAA status
  - [ ] Google Analytics — HIPAA implications
- [ ] **6.5** Review data retention policies
- [ ] **6.6** Verify consent collection for data processing
- [ ] **6.7** Review cookie policy (especially analytics cookies)
- [ ] **6.8** Verify no PHI in URL parameters or logs
- [ ] **6.9** Review HIPAA breach notification procedures
- [ ] **6.10** Verify encryption at rest for database
- [ ] **6.11** Review session management security (30-min timeout in middleware — good)

### CONCERN: Google Analytics & HIPAA
> Google Analytics tracking on pages where PHI may be visible (member dashboard, intake forms, lab results) is a HIPAA risk. GA4 collects URL paths, which could contain health-related page identifiers.

### Website Changes Needed
- [ ] **6.W1** Update privacy policy with complete list of data processors and BAA status
- [ ] **6.W2** Add cookie consent banner (if not already present)
- [ ] **6.W3** Ensure GA4 is NOT tracking on authenticated/PHI pages
- [ ] **6.W4** Add HIPAA Notice of Privacy Practices page
- [ ] **6.W5** Add data breach notification policy section

### Files to Audit
| File | What to Check |
|------|---------------|
| `app/legal/privacy/page.tsx` | Completeness, HIPAA compliance, data processor list |
| `app/layout.tsx` | GA4 script — is it on all pages including PHI pages? |
| `middleware.ts` | Session timeout, cookie security, HTTPS enforcement |
| `lib/auth.ts` | JWT security, token expiration |
| `app/api/intake/submit/route.ts` | PHI handling, logging |
| `app/api/intake/upload/route.ts` | File upload security |
| All API routes | Check for PHI in logs or error messages |

---

## Phase 7: Validity of Prescription (Standard 7)

### What LegitScript Requires
- Only valid prescriptions from authorized practitioners
- Practitioner-patient relationship must be established before prescribing
- "Care by a licensed medical professional" must precede prescription issuance
- Prescriptions must comply with telemedicine laws
- Cannot prescribe without proper evaluation
- Many states require synchronous (video/audio) consultation before prescribing

### Audit Checklist

- [ ] **7.1** Document the full prescribing workflow:
  - [ ] Patient completes intake form
  - [ ] Provider reviews intake (asynchronous vs synchronous?)
  - [ ] Provider evaluation method (questionnaire only? video consult? phone?)
  - [ ] Prescription issuance criteria
  - [ ] Prescription transmitted to pharmacy
- [ ] **7.2** Verify that prescriptions are not issued based solely on questionnaire (many states require live interaction)
- [ ] **7.3** Document which states require synchronous telehealth visits
- [ ] **7.4** Verify informed consent is obtained before treatment
- [ ] **7.5** Confirm prescription validity verification at pharmacy level
- [ ] **7.6** Document clinical appropriateness determination process
- [ ] **7.7** Verify providers have DEA registration in patient's state (if prescribing controlled substances)
- [ ] **7.8** Confirm follow-up care protocols are in place

### CRITICAL CONCERN: Asynchronous Prescribing
> Many state medical boards require a synchronous (live video or audio) consultation before prescribing prescription medications, especially for new patients. If CULTR's model is primarily intake-form-based with asynchronous provider review, this may not meet requirements in all 48 states claimed.

### Website Changes Needed
- [ ] **7.W1** Clearly describe the provider evaluation process on How It Works page
- [ ] **7.W2** State whether consultations are synchronous or asynchronous
- [ ] **7.W3** Add disclaimers: "Prescriptions are issued only when clinically appropriate after provider evaluation"
- [ ] **7.W4** Describe follow-up care availability

### Files to Audit
| File | What to Check |
|------|---------------|
| `app/how-it-works/page.tsx` | Does it accurately describe provider interaction? |
| `app/intake/IntakeFormClient.tsx` | What data is collected for provider evaluation |
| `app/api/intake/submit/route.ts` | Where does intake data go? How does provider review it? |
| `lib/asher-med-api.ts` | Asher Med order flow — when is prescription issued? |
| `app/members/consultations/` | Telehealth consultation implementation |

---

## Phase 8: Transparency & Claims (Standard 8)

### What LegitScript Requires
- ALL practices, offers, and claims must be ACCURATE and NON-MISLEADING
- No unsupported health benefit claims
- Transparent about pharmacy, staff, practitioners, drugs, and treatments
- Cannot create reputational risk to LegitScript
- Must be transparent about financial transactions and pricing

### Audit Checklist — Testimonials

- [ ] **8.1** Review ALL testimonials for specific health outcome claims:

| Testimonial | Claim | Issue | Action |
|-------------|-------|-------|--------|
| Michael R. | "Down 32 lbs in 4 months" | Specific weight loss claim | Add "Results not typical" disclaimer |
| Sarah K. | "Found my thyroid was tanking" | Implies diagnostic capability | Review for accuracy |
| David L. | "Back in the gym in 3 weeks after shoulder surgery" | Medical recovery claim | Add "Individual results vary" |
| James T. | "Went from 215 to 183" | Specific weight loss claim | Add "Results not typical" disclaimer |
| Rachel M. | "The only one where the provider actually knows peptides" | Comparative claim | Review for substantiation |
| Chris W. | "NAD+ protocol changed my energy levels completely" | Efficacy claim for non-FDA-approved product | HIGH RISK — may need removal |
| Amanda P. | "4-day delivery" | Service claim | Verify accuracy |
| Kevin H. | "Not just weight loss pills — real protocols" | Comparative claim | Review language |

- [ ] **8.2** Add standardized disclaimer to every testimonial: *"Individual results may vary. These testimonials reflect personal experiences and should not be construed as guaranteed outcomes. All treatments are prescribed only when clinically appropriate."*

### Audit Checklist — Product & Therapy Claims

- [ ] **8.3** Review every medical claim in codebase:

| Location | Claim | Issue |
|----------|-------|-------|
| `therapies.ts` | "Clinical trials demonstrate average weight loss of 15-20% of body weight over 68 weeks" | Must cite specific study |
| `therapies.ts` | "Up to 22.5% body weight reduction" for Tirzepatide | Must cite specific study |
| `therapies.ts` | "Activates over 4,000 genes" for GHK-Cu | Extraordinary claim — needs strong citation |
| `therapies.ts` | "Decline approximately 50% between ages 40 and 60" for NAD+ | Needs citation |
| `products.ts` | "The most potent metabolic compound available" | Superlative claim — remove or substantiate |
| `products.ts` | "Clinically proven efficacy" | Must specify what's "proven" and cite evidence |
| `products.ts` | "The original GLP-1 powerhouse" | Marketing language — review |
| `product-catalog.ts` | "FDA-studied" language | Misleading if not actually FDA-approved |
| Homepage | "Stop managing symptoms. Start living." | Implies treatment of disease symptoms |
| Homepage | "Outrun the version of you from six months ago" | Lifestyle claim — lower risk |
| Products page | "Up to 24% body weight reduction in trials" | Must cite specific trial |
| Products page | "Triple-action formula... for maximum results" | "Maximum results" is unsupported |

- [ ] **8.4** For each claim, either:
  - Add specific study citation
  - Add "results may vary" qualifier
  - Remove or soften the claim
  - Add "not FDA-approved" where applicable

### Audit Checklist — Pricing Transparency

- [ ] **8.5** Verify all pricing is accurate and clearly displayed
- [ ] **8.6** Disclose all fees (membership, medication costs, lab costs, shipping)
- [ ] **8.7** Clarify what's included vs. additional costs per tier
- [ ] **8.8** Ensure pricing page matches checkout amounts
- [ ] **8.9** Disclose auto-renewal terms clearly

### Audit Checklist — Provider Transparency

- [ ] **8.10** Display provider credentials prominently
- [ ] **8.11** Show provider license numbers and verification links
- [ ] **8.12** Do not imply more providers than actually exist
- [ ] **8.13** Verify "Board-certified providers" claim
- [ ] **8.14** Clarify CULTR's role: technology platform vs. medical practice

### Trust Metrics Verification

- [ ] **8.15** Verify "4.9/5 stars (50+ reviews)" — where are these reviews? Can they be substantiated?
- [ ] **8.16** Verify "100+ customers" claim
- [ ] **8.17** Verify "48 states covered" claim
- [ ] **8.18** Verify "<24 hour provider response time" claim

### Website Changes Needed
- [ ] **8.W1** Add testimonial disclaimers to every testimonial
- [ ] **8.W2** Add citation links/footnotes for all clinical claims
- [ ] **8.W3** Remove or qualify superlative claims ("most potent", "maximum results")
- [ ] **8.W4** Add "Not FDA-approved" labels to non-FDA-approved products
- [ ] **8.W5** Create a provider credentials page
- [ ] **8.W6** Clarify CULTR's role in the care delivery model
- [ ] **8.W7** Add substantiation for trust metrics or remove unsubstantiable claims

### Files to Audit (Complete List)
| File | What to Check |
|------|---------------|
| `lib/config/social-proof.ts` | All testimonials, trust metrics, trust badges, provider profiles |
| `lib/config/therapies.ts` | Every therapy description — clinical claims |
| `lib/config/products.ts` | Every product description — efficacy claims |
| `lib/config/product-catalog.ts` | SKU descriptions — "FDA-studied" language |
| `lib/config/plans.ts` | Tier descriptions — what's promised |
| `app/page.tsx` | Homepage — all marketing claims |
| `app/products/page.tsx` | Product catalog — all claims |
| `app/therapies/page.tsx` | Therapy showcase — all claims |
| `app/pricing/page.tsx` | Pricing claims, included services |
| `app/how-it-works/page.tsx` | Process descriptions, safety claims |
| `app/faq/page.tsx` | FAQ answers — medical accuracy |
| `app/science/page.tsx` | Blog content — medical claims |
| `content/blog/*.md` | All 12 blog posts — medical claims audit |
| `content/library/*.md` | All 6 library articles — claim audit |
| `app/quiz/QuizClient.tsx` | Quiz questions — implied promises |
| `lib/config/quiz.ts` | Quiz configuration — result claims |

---

## Phase 9: Advertising Compliance (Standard 9)

### What LegitScript Requires
- All ads must comply with applicable laws AND platform ToS
- Ads must be accurate, transparent, and non-misleading
- Cannot circumvent platform advertising policies
- No misleading claims or improper guarantees in ad copy

### Audit Checklist

- [ ] **9.1** Review all current advertising (Google, Meta, TikTok, etc.)
- [ ] **9.2** Ensure ad landing pages match ad claims
- [ ] **9.3** Review creator-generated content for compliance (affiliate marketing)
- [ ] **9.4** Ensure creator FTC disclosure templates are compliant
- [ ] **9.5** Review creator coupon code marketing for medical claims
- [ ] **9.6** Audit social media content (@cultrhealth on all platforms)
- [ ] **9.7** Review email marketing templates for compliance
- [ ] **9.8** Ensure no "guaranteed results" language in any advertising
- [ ] **9.9** Document advertising review/approval process

### CONCERN: Creator Affiliate Marketing
> Creator affiliates generating content about CULTR's medical products creates significant compliance risk. Each creator's content must comply with:
> - FDA advertising regulations for prescription medications
> - FTC endorsement guidelines
> - LegitScript transparency standards
> - Platform-specific healthcare advertising policies

### Website Changes Needed
- [ ] **9.W1** Add advertising compliance guidelines to creator portal resources
- [ ] **9.W2** Update FTC disclosure templates in creator portal
- [ ] **9.W3** Implement content approval workflow for creator-generated materials
- [ ] **9.W4** Add prohibited claims list to creator resource center

### Files to Audit
| File | What to Check |
|------|---------------|
| `lib/config/affiliate.ts` | FTC disclosures, creator guidelines |
| `app/creators/page.tsx` | How the program is marketed |
| `app/creators/portal/resources/` | Creator marketing materials |
| All email templates in API routes | Email content compliance |

---

## Page-by-Page Audit Checklist

### Public Marketing Pages

#### `/` — Homepage
- [ ] Hero section claims audit
- [ ] "Physician-supervised optimization" — verify accuracy
- [ ] Lifestyle image claims (Confidence, Endurance, Freedom) — not misleading?
- [ ] "How It Works" 3-step process — accurate?
- [ ] Comparison table (CULTR vs Standard Care) — substantiated?
- [ ] Pricing preview — matches actual pricing?
- [ ] Trust badges — each badge verified?
- [ ] Testimonials — disclaimers added?
- [ ] FAQ answers — medically accurate?
- [ ] Footer disclaimer — adequate?
- [ ] Dispensing pharmacy contact info — MISSING (must add)
- [ ] Provider credentials — visible?

#### `/pricing` — Pricing Page
- [ ] All tier prices accurate and current
- [ ] Included services clearly described
- [ ] Additional costs disclosed (labs, shipping, medications)
- [ ] Auto-renewal terms visible
- [ ] Cancellation policy linked
- [ ] MEMBERSHIP_DISCLAIMER present and adequate
- [ ] "Starting at $149*" — asterisk explained?
- [ ] Doctor visit disclaimers present

#### `/products` — Products Page
- [ ] Every product has FDA status disclosed
- [ ] Clinical claims have citations
- [ ] "Up to 24% body weight reduction" — cited?
- [ ] "Triple-action formula" — not misleading?
- [ ] Non-FDA-approved products clearly labeled
- [ ] No guarantee language
- [ ] Pricing transparency (if shown)

#### `/therapies` — Therapies Page
- [ ] Every therapy description medically accurate
- [ ] FDA status disclosed per therapy
- [ ] Clinical trial citations present
- [ ] Side effects disclosed
- [ ] "Not a substitute for medical advice" disclaimer
- [ ] Compounded medication disclosures

#### `/how-it-works` — How It Works
- [ ] Process accurately described
- [ ] Provider evaluation step clearly explained
- [ ] Timeline expectations accurate
- [ ] Safety messaging verified
- [ ] HIPAA compliance claim accurate
- [ ] "Board-certified providers" verified
- [ ] "Licensed pharmacies only" verified

#### `/science` — Science Hub
- [ ] All articles authored/reviewed by licensed provider
- [ ] Citations provided for clinical claims
- [ ] "For educational purposes only" disclaimer present
- [ ] No treatment recommendations without provider context

#### `/science/[slug]` — Individual Articles (12 posts)
- [ ] `biomarker-basics.md` — claims audit
- [ ] `fasting-metabolic-health.md` — claims audit
- [ ] `glp1-beyond-weight-loss.md` — claims audit (high risk — GLP-1 claims)
- [ ] `inflammation-markers.md` — claims audit
- [ ] `mitochondrial-health.md` — claims audit
- [ ] `nad-and-longevity.md` — claims audit (NAD+ claims)
- [ ] `peptide-stacking.md` — claims audit (high risk — unapproved peptides)
- [ ] `sleep-and-recovery.md` — claims audit
- [ ] `tb500-tissue-repair.md` — claims audit (non-FDA-approved)
- [ ] `testosterone-optimization.md` — claims audit
- [ ] `thyroid-deep-dive.md` — claims audit
- [ ] `understanding-bpc-157.md` — claims audit (non-FDA-approved)

#### `/quiz` — Protocol Quiz
- [ ] Questions don't constitute medical advice
- [ ] Results presented as recommendations, not prescriptions
- [ ] Disclaimer that quiz doesn't replace provider evaluation
- [ ] No guaranteed outcomes from quiz results

#### `/faq` — FAQ Page
- [ ] Every answer medically accurate
- [ ] No guarantee language
- [ ] Side effects mentioned where appropriate
- [ ] Pricing info accurate

#### `/community` — Community Page
- [ ] User-generated content moderation policy
- [ ] No unmoderated medical claims
- [ ] Social feed content reviewed

#### `/tools/dosing-calculator` — PUBLIC Dosing Calculator
- [ ] **HIGH RISK**: Public dosing guidance may constitute medical advice
- [ ] Add prominent disclaimer: "For educational purposes only — consult your provider"
- [ ] Consider gating behind authentication
- [ ] Add "Not medical advice" warning

#### `/tools/calorie-calculator` — Calorie Calculator
- [ ] Educational only disclaimers
- [ ] No medical claims

#### `/tools/peptide-faq` — Peptide FAQ
- [ ] FDA status disclosures
- [ ] No treatment claims for unapproved peptides
- [ ] Citations for any clinical claims

#### `/tools/stacking-guides` — Stacking Guides
- [ ] **HIGH RISK**: Implies medical guidance without provider relationship
- [ ] Must clearly state "Under provider supervision only"
- [ ] Consider gating behind authentication
- [ ] No dosing recommendations without provider context

### Legal Pages

#### `/legal/privacy` — Privacy Policy
- [ ] HIPAA compliance section complete
- [ ] All data processors listed with BAA status
- [ ] Data retention periods specified
- [ ] User rights clearly stated (access, deletion, correction)
- [ ] Breach notification procedures documented
- [ ] Cookie policy included
- [ ] Third-party data sharing disclosed
- [ ] Contact information for privacy officer
- [ ] Last updated date current

#### `/legal/terms` — Terms of Service
- [ ] Service description accurate (technology platform connecting to providers)
- [ ] Liability limitations properly stated
- [ ] Cancellation and refund policy clear
- [ ] Auto-renewal terms disclosed
- [ ] Dispute resolution process
- [ ] Age restrictions (must be 18+)
- [ ] Governing law and jurisdiction

#### `/legal/medical-disclaimer` — Medical Disclaimer
- [ ] Emergency notice (call 911) — PRESENT
- [ ] "Not a substitute for professional medical advice"
- [ ] No guarantee of specific outcomes
- [ ] FDA statements accurate
- [ ] Side effects reporting guidance
- [ ] Provider-patient relationship clarification
- [ ] Compounded medication disclosures

### Checkout & Onboarding

#### `/join/[tier]` — Checkout Pages (core, catalyst, concierge, club)
- [ ] Pricing matches displayed prices
- [ ] Auto-renewal terms shown before payment
- [ ] Cancellation policy linked
- [ ] What's included clearly stated
- [ ] Medical service disclaimers visible
- [ ] HIPAA consent obtained
- [ ] Terms acceptance required
- [ ] Refund policy visible

#### `/intake` — Medical Intake Form
- [ ] Informed consent collected
- [ ] HIPAA authorization obtained
- [ ] Data handling notice displayed
- [ ] Required fields appropriate for medical evaluation
- [ ] No unnecessary data collection
- [ ] Secure form submission (HTTPS)
- [ ] Upload security (presigned URLs)

#### `/onboarding` — Post-Signup
- [ ] Sets appropriate expectations
- [ ] No guarantee language
- [ ] Clear next steps

### Member Portal Pages (Protected)

#### `/portal/*` and `/members/*`
- [ ] All pages require authentication
- [ ] Session timeout enforced (30 min — verified in middleware)
- [ ] No PHI exposed in URLs
- [ ] No PHI in browser history/local storage
- [ ] GA4 tracking disabled on PHI-containing pages

### Creator Pages

#### `/creators` — Creator Program Page
- [ ] FTC endorsement disclosure requirements explained
- [ ] No misleading income claims
- [ ] Clear that creators cannot make medical claims
- [ ] Commission structure transparent

#### `/creators/[slug]` — Public Creator Profiles
- [ ] No medical claims by non-providers
- [ ] FTC disclosures visible
- [ ] Compliant with endorsement guidelines

#### `/creators/portal/*` — Creator Dashboard
- [ ] Creator guidelines include advertising compliance
- [ ] Prohibited claims list available
- [ ] Content review process documented

### Admin Pages

#### `/admin/*` — Admin Panel
- [ ] Access controls verified (admin role required)
- [ ] PHI access logged
- [ ] No PHI in admin page URLs

---

## GLP-1 & Peptide-Specific Compliance

### FDA Status Matrix (As of April 2026)

| Medication | FDA Status | Compounding Status | Marketing Restrictions |
|------------|-----------|-------------------|----------------------|
| **Semaglutide** | FDA-approved (Wegovy, Ozempic) | Compounding restricted post-April 2025 | Can reference FDA approval; compounded versions need clinical justification |
| **Tirzepatide** | FDA-approved (Mounjaro, Zepbound) | Compounding restricted post-March 2025 | Same as above |
| **removed therapy** | NOT approved — Phase 3 trials | N/A | Cannot market as available treatment; "investigational" only |
| **BPC-157** | NOT approved | Research compound | Cannot claim to treat/cure; "research" or "wellness" framing only |
| **TB-500** | NOT approved | Research compound | Same as BPC-157 |
| **GHK-Cu** | NOT approved as drug | Cosmetic ingredient | Cannot make drug-like claims |
| **NAD+** | NOT approved as drug | Supplement/IV therapy | Cannot claim to treat disease |
| **Semax/Selank** | NOT approved in US | Not commercially available in US | HIGH RISK to market |
| **CJC-1295/Ipamorelin** | NOT approved | Research peptide | Cannot claim to treat |
| **TESA/Ipamorelin** | NOT approved | Research peptide | Cannot claim to treat |
| **Melanotan 2** | NOT approved — FDA warnings issued | Not legally marketed | HIGHEST RISK — FDA has issued consumer warnings |

### Required Actions

1. **Immediately review**: Melanotan 2 and removed therapy marketing — these are the highest-risk products
2. **Add FDA status badges**: Every product/therapy page must clearly show FDA approval status
3. **Qualify all claims**: "Used in clinical research" vs. "FDA-approved treatment"
4. **Update compounding disclosures**: Post-shortage compliance language
5. **Consult legal counsel**: For continued marketing of non-FDA-approved peptides

---

## Website Content Requirements Checklist

### MUST HAVE (LegitScript will check)

| Requirement | Current Status | Action |
|-------------|---------------|--------|
| **Privacy policy** — accessible from every page | PRESENT in footer | Verify completeness |
| **Terms of service** — accessible from every page | PRESENT in footer | Verify completeness |
| **Medical disclaimer** | PRESENT at `/legal/medical-disclaimer` | Update with current FDA status |
| **Dispensing pharmacy contact info** (name, address, phone, fax) | **MISSING** | **ADD — BLOCKER** |
| **SSL/TLS encryption** on all pages | PRESENT (Vercel handles) | Verify |
| **Provider credentials** | Partial (Dr. Ali Saberi mentioned) | Add full credentials page |
| **Service area disclosure** (states served) | Partial ("48 states" badge) | Add explicit state list |
| **Pricing transparency** | PRESENT on pricing page | Verify all costs disclosed |
| **Contact information** | PRESENT (support email) | Add phone number |
| **Accurate domain registration** | Unknown | Verify WHOIS — no privacy/proxy services |
| **No links to non-certified healthcare sites** | Unknown | Audit all outbound links |
| **LegitScript seal** (post-certification) | N/A | Add after certification |

### SHOULD HAVE (Best practices / will strengthen application)

| Requirement | Current Status | Action |
|-------------|---------------|--------|
| Provider credentials page with license #s | MISSING | Create |
| Prescribing process explanation | Partial (How It Works) | Enhance |
| Side effects disclosure per medication | Partial | Add per-product |
| Clinical evidence citations | MISSING | Add throughout |
| Refund/return policy | In Terms | Make more prominent |
| Complaint/grievance process | MISSING | Create |
| HIPAA Notice of Privacy Practices | MISSING | Create |
| Cookie consent banner | MISSING | Add |
| Patient Bill of Rights | MISSING | Consider adding |
| Shipping/delivery policy | Not prominent | Add section |

---

## Technical Requirements

### SSL/Security
- [ ] Verify SSL certificate on cultrhealth.com (should be via Vercel/Cloudflare)
- [ ] Verify HTTPS enforcement (no HTTP access)
- [ ] Verify secure cookies (already SameSite=Lax, Secure in prod)
- [ ] Run security headers scan (Strict-Transport-Security, X-Content-Type-Options, etc.)

### Domain Registration
- [ ] Verify WHOIS registration is NOT using privacy/proxy services (LegitScript requires this)
- [ ] Verify registrant name matches business entity
- [ ] Verify domain registration information is current

### Data Security
- [ ] Verify database encryption at rest (Neon PostgreSQL)
- [ ] Verify API rate limiting is active
- [ ] Verify no PHI in server logs
- [ ] Verify file upload security (presigned URLs with expiration)
- [ ] Verify session security (JWT, 30-min timeout)

---

## Application Documentation Prep

### Documents to Prepare Before Applying

| Document | Status | Notes |
|----------|--------|-------|
| Business registration certificate | NEEDED | State of incorporation |
| Articles of incorporation/organization | NEEDED | |
| Good standing certificate | NEEDED | Current, from state |
| Medical practice license(s) | NEEDED | All states served |
| Pharmacy partner licenses | NEEDED | Asher Med + dispensing pharmacy |
| Provider license(s) | NEEDED | All prescribing providers, all states |
| DEA registration(s) | NEEDED | If applicable |
| NPI number(s) | NEEDED | All providers |
| Malpractice insurance | NEEDED | All providers |
| General liability insurance | NEEDED | Business entity |
| HIPAA compliance documentation | NEEDED | Policies + BAAs |
| BAA with Asher Med | NEEDED | Verify exists |
| BAA with all data processors | NEEDED | Stripe, Neon, Resend, etc. |
| Privacy policy | EXISTS | May need updates |
| Terms of service | EXISTS | May need updates |
| Medical disclaimer | EXISTS | Needs updates |
| Prescribing protocols | NEEDED | Internal documentation |
| Quality assurance documentation | NEEDED | |
| Product sourcing documentation | NEEDED | FDA compliance proof |
| Advertising samples | NEEDED | Website screenshots, ad copies |
| 10-year disciplinary history disclosure | NEEDED | For all principals |

---

## Risk Register

### CRITICAL (Must resolve before applying)

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| R1 | **Dispensing pharmacy info not displayed on website** | Application rejection | Add pharmacy name, address, phone, fax to footer or dedicated page |
| R2 | **Compounded GLP-1 post-shortage compliance** | Certification denial; legal action | Verify Asher Med sourcing is post-shortage compliant |
| R3 | **Non-FDA-approved products marketed as treatments** | Certification denial | Add FDA status disclosures; remove treatment claims for unapproved products |
| R4 | **Melanotan 2 marketing** | Certification denial; FDA warning | Consider removing MT2 or adding strong disclaimers |
| R5 | **removed therapy (removed therapy) marketed as available therapy** | Certification denial | Clearly label as investigational |
| R6 | **Unsupported health claims in testimonials** | Application flagged | Add disclaimers; remove specific weight loss claims |
| R7 | **Partner pharmacy not LegitScript certified** | Blocks CULTR certification | Verify Asher Med pharmacy certification status |
| R8 | **Domain WHOIS using privacy service** | Application rejection | Update to transparent registration |

### HIGH (Should resolve before applying)

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| R9 | Provider licensing gaps (not licensed in all 48 claimed states) | Reduce claimed coverage | Verify and update state count |
| R10 | Missing HIPAA Notice of Privacy Practices | Application weakness | Create NPP page |
| R11 | GA4 tracking on PHI pages | HIPAA violation risk | Disable GA4 on authenticated pages |
| R12 | Public dosing calculator constitutes medical advice | Regulatory risk | Gate behind auth or add strong disclaimers |
| R13 | Creator affiliate content lacks compliance oversight | Creator content violates standards | Implement content review |
| R14 | Missing BAAs with some data processors | HIPAA non-compliance | Execute BAAs with all processors |
| R15 | Asynchronous prescribing may not meet all state laws | Regulatory non-compliance | Document prescribing model; add synchronous option |

### MEDIUM (Strengthen application)

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| R16 | Unsubstantiated trust metrics (4.9 stars, 100+ customers) | Transparency concerns | Verify or remove |
| R17 | Missing clinical citations throughout | Weakens credibility | Add citations to all clinical claims |
| R18 | Stacking guides public without provider context | Implied medical advice | Gate behind auth with disclaimers |
| R19 | Blog articles lack adequate disclaimers | Could be seen as medical advice | Add standardized disclaimers |
| R20 | Cookie consent banner missing | Privacy compliance gap | Add consent management |

---

## Implementation Priority Matrix

### Week 1: Critical Blockers
1. Verify Asher Med / dispensing pharmacy LegitScript certification status
2. Add dispensing pharmacy contact information to website (name, address, phone, fax)
3. Verify WHOIS domain registration (remove privacy services if present)
4. Audit compounded GLP-1 sourcing compliance (post-shortage)
5. Review Melanotan 2 and removed therapy marketing — make go/no-go decision
6. Add FDA status disclosures to all product/therapy pages

### Week 2: High Priority Website Changes
7. Add testimonial disclaimers to all testimonials
8. Remove/qualify unsupported claims ("most potent", "maximum results", "clinically proven")
9. Add clinical citation footnotes to therapy/product claims
10. Create provider credentials page with license numbers
11. Update privacy policy (complete data processor list, BAA status)
12. Update medical disclaimer (current FDA status, compounding disclosures)
13. Add HIPAA Notice of Privacy Practices page
14. Create explicit state availability disclosure

### Week 3: Compliance Infrastructure
15. Disable GA4 on authenticated/PHI pages
16. Add cookie consent banner
17. Add public dosing calculator disclaimers (or gate behind auth)
18. Add stacking guide disclaimers
19. Update Terms of Service (refund policy, auto-renewal, complaint process)
20. Add shipping policy page
21. Add return/refund policy prominence
22. Create patient grievance/complaint process page

### Week 4: Content Audit & Refinement
23. Audit all 12 blog posts for medical claims compliance
24. Audit all 6 library articles
25. Audit FAQ answers for accuracy
26. Review quiz for implied medical advice
27. Update creator portal resources with advertising compliance guidelines
28. Verify all trust metrics (reviews, customer count, state count, response time)
29. Audit all outbound links for compliance

### Week 5: Documentation & Application Prep
30. Compile all business registration documents
31. Compile all provider licenses and credentials
32. Execute any missing BAAs
33. Document prescribing workflow and protocols
34. Document quality assurance processes
35. Prepare advertising samples (website screenshots)
36. Complete 10-year disciplinary history disclosure
37. Final website review and screenshots

### Week 6: Submit Application
38. Create LegitScript account
39. Pay $975 application fee
40. Complete application questionnaire
41. Upload all supporting documentation
42. Submit and begin analyst correspondence

---

## Sources

- [LegitScript Healthcare Certification](https://www.legitscript.com/certification/healthcare-certification/)
- [LegitScript Telemedicine Certification](https://www.legitscript.com/certification/telemedicine/)
- [LegitScript Healthcare Certification FAQ](https://www.legitscript.com/certification/healthcare-certification/faq/)
- [LegitScript Healthcare Certification Terms & Conditions](https://www.legitscript.com/certification/healthcare-certification/terms-and-conditions/)
- [LegitScript Certification Fact Sheet — Telemedicine (PDF)](https://www.legitscript.com/wp-content/uploads/2022/03/Healthcare-Certification-FactSheet-Telemedicine.pdf)
- [LegitScript Resource Documents](https://getlegitscript.com/pages/legitscript-resource-documents)
- [LegitScript — Navigating Certification for Weight Loss Medications](https://www.legitscript.com/healthcare/navigating-legitscript-certification-for-weight-loss-medications-common-inquiries-and-answers/)
- [LegitScript — GLP-1 Pharmacies Compliance](https://www.legitscript.com/healthcare/from-shortage-heroes-to-compliance-champions-what-todays-glp-1-pharmacies-must-know/)
- [Corepay — GLP-1 Payment Compliance](https://corepay.net/articles/glp-1-payment-compliance-for-medspas/)
- [Corepay — LegitScript Certification Guide](https://corepay.net/articles/legitscript-certification-guide/)
- [ScriptCert — LegitScript Certification Checklist](https://scriptcert.com/legitscript-certification-checklist-guide/)
- [L7 Creative — LegitScript Certification Guide](https://www.l7creative.com/healthcare-marketing/legitscript-certification-guide/)
- [Bloom Consulting — Telehealth LegitScript](https://bloomconsulting.agency/compliance/legit-script/telehealth-legitscript/)
- [PrecisionMeds — LegitScript Certification for Telehealth](https://precisionmeds.com/blog/legit-script-certification-the-key-to-telehealth-advertising/)
- [HealthOn — LegitScript & Healthcare Ads](https://healthon.com/blogs/journal/legitscript-healthcare-ads-why-compliance-matters)
