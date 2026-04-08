# CULTR Production Compliance Launch Pack

Last updated: April 5, 2026

## Purpose
This document is the non-code launch packet for CULTR Health's production go-live and LegitScript submission readiness.

It consolidates:
- the domains and public properties that must be verified,
- the partner and vendor inventory,
- BAA and PHI-boundary requirements,
- licensure and state-coverage evidence,
- required policies and operating documents,
- the final production verification checklist.

This is not a legal opinion and it is not a substitute for counsel. It is the working launch binder that legal, compliance, clinical ops, and engineering should use together.

## Important Framing
- There is no official "HIPAA certification" for this website. Production readiness depends on documented safeguards, BAAs where required, workforce procedures, breach response readiness, and PHI-boundary enforcement.
- LegitScript certification is the external certification gate that matters for payments and healthcare advertising.
- This pack reflects the current code-backed baseline from `lib/config/compliance.ts`, `app/legal/privacy/page.tsx`, `app/legal/medical-disclaimer/page.tsx`, `app/legal/provider-credentials/page.tsx`, `components/site/Footer.tsx`, `next.config.js`, and the current join/member flow implementation.

## Current Code-Backed Baseline
- Public compliance disclosures, pharmacy information, provider credentials, and privacy/legal pages are present on the site.
- CSP is enforced and rendered library markdown is sanitized.
- The club/join public surface now uses a signed minimal visitor token instead of trusting raw browser JSON.
- Healthie EHR integration audited and hardened (Apr 5 2026): 7 critical bugs fixed in GraphQL queries, mutations, webhook handler, and portal mapper. HMAC-SHA256 webhook verification (RFC 9421), 30s request timeouts, HIPAA-safe error logging. Feature-flagged via `USE_HEALTHIE` — requires `HEALTHIE_API_KEY` + `HEALTHIE_WEBHOOK_SECRET` to activate.
- Healthie account is active. A signed BAA and production workspace configuration are still required before PHI workflows go live.
- Public intake and consultation pages are external Healthie handoff pages. They can launch once the Healthie URLs are configured; Healthie API access is only required if native sync, webhooks, or portal reads are enabled.

## Go/No-Go Summary
| Area | Current status | Launch gate |
|---|---|---|
| Public disclosures | Ready in code | Final legal review required |
| LegitScript seal placeholder | Ready in code | Real seal ID required after certification |
| Domain inventory | Partially documented | WHOIS and DNS proof required |
| Pharmacy evidence | Partially documented | Current license/accreditation packet required |
| Provider/state coverage evidence | Blocked | Multi-state licensure proof required before 48-state claim |
| Clinical workflow vendor (Healthie EHR) | Selected — external handoff path is in place, native sync remains gated | Signed BAA and configured Healthie URLs required for launch. API access only required if native sync is enabled. |
| HIPAA policy package | Partial | NPP, incident response, risk assessment, training records required |
| Payment/ads readiness | Partial | LegitScript account, Stripe production evidence, ad-policy package required |

## 1. Domain Inventory
| Domain / property | Purpose | Current source of truth | Status | Manual evidence required | Owner |
|---|---|---|---|---|---|
| `cultrhealth.com` | Primary production marketing site | `NEXT_PUBLIC_SITE_URL`, footer/legal pages | Manual verify | WHOIS record, registrar access, no privacy/proxy masking, TLS certificate proof | Ops |
| `join.cultrhealth.com` | Join/club ordering flow | `lib/config/links.ts` | Manual verify | DNS alias proof, WHOIS relationship to parent domain, TLS certificate proof | Ops |
| `staging.cultrhealth.com` | Staging environment | branch/deploy config | Internal only | Restrict indexing and advertising use | Engineering |
| `join.staging.cultrhealth.com` | Staging join host | `lib/config/links.ts` fallback | Internal only | Restrict indexing and advertising use | Engineering |
| Support inboxes | `support@cultrhealth.com`, `privacy@cultrhealth.com`, `legal@cultrhealth.com` | legal/footer pages | Manual verify | Mailbox ownership, routing, SLA owner | Ops |

### Domain evidence bundle
- Registrar screenshot or export showing legal registrant and no privacy proxy on production domain.
- DNS screenshots for apex + join subdomain.
- Active TLS screenshots for production and join hosts.
- SPF, DKIM, and DMARC records for `cultrhealth.com`.
- Screenshot proving staging hosts are not publicly indexed or used in ads.

## 2. Partner and Vendor Inventory
| Partner / vendor | Role | PHI expectation | Current public disclosure | Launch requirement | Status |
|---|---|---|---|---|---|
| St. Luke Compounding Pharmacy | Dispensing pharmacy | Yes, operational care partner | Footer, provider credentials, compliance config | Current license packet, relationship agreement, compounding/compliance verification | Manual verify |
| Healthie EHR | Intake + scheduling workflow | Yes | Privacy policy and handoff pages now name Healthie | Configure production URLs, execute agreement, and confirm BAA status | In progress |
| Stripe | Payments | No PHI intentionally sent | Privacy policy | Confirm PHI exclusion in implementation, production account proof, webhook secret live | Manual verify |
| Vercel / Neon | Hosting + database | Potentially yes if PHI is stored in app DB | Privacy policy | Confirm actual PHI scope, signed contractual controls/BAA if PHI remains in this stack | Manual verify |
| Resend | Transactional email | Routine PHI excluded | Privacy policy | Keep PHI exclusion in templates, verify policy/contract position | Manual verify |
| SiPhox Health | At-home labs | Yes, clinical partner | Privacy policy | Executed agreement, PHI workflow map, support/escalation contact | Manual verify |
| Cloudflare | CDN / WAF / Turnstile | Security traffic only | Privacy policy | Confirm configuration and log-retention posture | Manual verify |
| Google Analytics | Aggregated analytics only | No PHI | Privacy policy | Confirm excluded from authenticated/PHI pages | Manual verify |

### Partner packet to collect
- Master vendor inventory with business owner, security owner, and renewal date.
- Executed contracts for every vendor touching PHI or regulated workflows.
- BAAs for every vendor that creates, receives, maintains, or transmits PHI on CULTR's behalf.
- Written PHI-boundary note for vendors intentionally kept PHI-free (`Stripe`, `Google Analytics`, routine `Resend` templates).
- Pharmacy compliance evidence: license, inspection/accreditation if available, fulfillment contact, escalation path.

## 3. BAA and PHI Boundary Matrix
| Vendor | BAA needed? | Why | Current position | Required before production |
|---|---|---|---|---|
| Healthie EHR | Yes | Intake + scheduling will handle patient data | Selected vendor; BAA still required before PHI activation | Signed BAA and configured production workspace |
| Vercel / Neon | Likely yes if PHI remains in app database | Platform stores member/order/intake-linked data | Privacy policy says contractual controls required | Confirm scope and execute appropriate agreements |
| SiPhox Health | Yes | Lab workflows and results | Publicly disclosed as clinical partner | Signed BAA / data processing agreement |
| St. Luke Compounding Pharmacy | Operational care agreement, not standard website BAA framing | Dispensing partner | Publicly disclosed | Executed partner agreement on file |
| Resend | Only if PHI is ever sent | Email delivery | Policy currently assumes routine PHI excluded | Keep PHI out of email or upgrade contract posture |
| Cloudflare | Depends on PHI scope in logs and security tooling | Edge/security logs | Policy limits to security traffic data | Confirm documented log scope |
| Stripe | Generally no, if PHI excluded | Payment data only | Policy says PHI not intentionally sent | Verify implementation keeps Stripe metadata PHI-free |
| Google Analytics | No, if PHI excluded | Aggregated analytics only | Policy says no PHI pages tracked | Verify config and event catalog |

### PHI-boundary rule
- Do not claim a vendor is "HIPAA compliant" in launch materials without a signed agreement and a documented PHI use case.
- If a vendor is intentionally PHI-free, the safer evidence packet is:
  - implementation note showing no PHI is sent,
  - sample payload/screenshots,
  - internal owner signoff.

## 4. Licensure and State Coverage Pack
| Item | Current code-backed evidence | Gap | Status |
|---|---|---|---|
| Medical director | `Dr. Ali Saberi, MD`, NPI `1649495276`, specialty `Internal Medicine` | Current state licensure matrix beyond Florida not present in code | Partial |
| Provider credentials page | Exists and is publicly linked | Needs legal/ops review for completeness and accuracy | Partial |
| Dispensing pharmacy | St. Luke Compounding Pharmacy, Florida license `PH 32747`, control number `114077`, expiry `2027-02-28` | Need current supporting license file and any additional accreditation proof | Partial |
| Public state-availability claim | `SERVED_STATES` lists 48 states; excluded `NY`, `LA` | Current provider credentials only show Florida; broad claim must be backed by clinician network evidence | Blocker |
| Pharmacy service area | Public pharmacy record is Florida-based | Need documented shipping/dispensing legality for all claimed states | Blocker |

### Required licensure packet
- Current provider roster with:
  - provider full name,
  - credential,
  - NPI,
  - states licensed,
  - license numbers,
  - expiration dates.
- Current pharmacy packet with:
  - Florida license verification screenshot/PDF,
  - any non-resident pharmacy licenses if needed,
  - relationship/contact sheet,
  - escalation contact.
- Written matrix mapping:
  - states publicly marketed,
  - states currently serviceable,
  - responsible clinician entity,
  - responsible pharmacy/fulfillment path.

### Immediate launch rule
- Do not keep the 48-state public claim unless the licensure matrix exists and legal signs off.
- If the matrix is not ready, reduce the public claim to the states currently documented and actually serviceable.

## 5. Required Policies and Operating Documents
| Artifact | Current site status | Launch requirement | Status |
|---|---|---|---|
| Privacy Policy | Present, updated April 5, 2026 | Legal review and partner names finalized | Partial |
| Medical Disclaimer | Present, updated April 5, 2026 | Legal review and therapy claim review | Partial |
| Terms of Service | Present | Freeze explicit revision date, legal review, align cancellation language with actual plan policy | Partial |
| Provider Credentials page | Present | Validate named providers, NPIs, and licensure disclosures | Partial |
| Informed consent copy | Present in config and join flow | Clinical/legal approval of final version | Partial |
| Notice of Privacy Practices (NPP) | Not found in public app | Draft, approve, publish, and link from privacy workflow | Missing |
| Incident response plan | Not found in repo as launch artifact | Approved internal policy with owners and response SLAs | Missing |
| HIPAA breach notification SOP | Mentioned in privacy policy | Internal procedure and template notices required | Missing |
| Security risk assessment | Not found in repo | Formal assessment before production PHI workflows | Missing |
| Workforce HIPAA training log | Not found in repo | Training completion records for staff with PHI access | Missing |
| Affiliate / creator compliance policy | Creator system exists | Written ad/disclosure rules, monitoring process, and takedown path | Missing |
| Refund / cancellation policy packet | Terms + consent mention cancellation | Operational SOP aligned to Stripe and support workflows | Partial |

## 6. LegitScript Submission Packet
Collect these into one shared folder before submission:
- Domain ownership and WHOIS evidence.
- Pharmacy license packet and partner relationship evidence.
- Clinician licensure roster and service-state matrix.
- Final privacy policy, terms, medical disclaimer, provider credentials page screenshots, and consent copy.
- Vendor inventory with PHI boundaries and BAAs where required.
- Ad/promo compliance packet:
  - creator disclosure rules,
  - testimonial policy,
  - prohibited claims policy,
  - moderation/escalation owner.
- Stripe production account proof and payment-processing workflow summary.
- Screenshot pack of live production pages:
  - homepage,
  - pricing,
  - join flow,
  - footer,
  - privacy,
  - medical disclaimer,
  - provider credentials,
  - terms,
  - consent modal,
  - checkout/success handoff.

## 7. Production Verification Checklist
### Domains and infrastructure
- [ ] WHOIS for `cultrhealth.com` verified and non-private.
- [ ] `join.cultrhealth.com` DNS and TLS verified.
- [ ] SPF configured for `cultrhealth.com`.
- [ ] DKIM configured for sending provider/email domains.
- [ ] DMARC configured with monitored mailbox.
- [ ] Production Vercel project and environment variables reviewed.

### Payments and abuse controls
- [ ] Stripe production keys set.
- [ ] Stripe webhook secret set and tested.
- [ ] Turnstile server and client keys set for public forms that use bot protection.
- [ ] Upstash Redis configured if production rate limits should survive cold starts/instances.
- [ ] Checkout metadata and analytics payloads verified PHI-free.

### Clinical operations
- [ ] Healthie EHR named consistently in public/legal materials.
- [ ] Healthie intake URL configured.
- [ ] Healthie consultation booking URL configured.
- [ ] Signed Healthie BAA on file.
- [ ] Healthie API access confirmed if portal/webhook sync will be enabled.
- [ ] Support escalation path defined for failed intake/scheduling handoffs.

### Licensure and pharmacy
- [ ] Provider roster validated against public claims.
- [ ] State coverage matrix approved by legal/clinical ops.
- [ ] Pharmacy license packet collected and current.
- [ ] Any non-resident dispensing requirements reviewed.

### Legal and policy
- [ ] Privacy policy approved by counsel.
- [ ] Terms approved by counsel and explicit revision date frozen.
- [ ] Medical disclaimer approved by counsel/clinical lead.
- [ ] Provider credentials page approved by clinical ops.
- [ ] NPP approved and published.
- [ ] Incident response plan approved internally.
- [ ] Breach notification SOP approved internally.
- [ ] Workforce HIPAA training evidence collected.

### LegitScript and advertising
- [ ] LegitScript account created.
- [ ] Application owner assigned.
- [ ] Creator/affiliate compliance rules distributed.
- [ ] Testimonials reviewed for claim risk.
- [ ] Ad landing pages use only compliant claims and disclosures.
- [ ] LegitScript seal ID inserted only after certification.

### Final launch QA
- [ ] Production screenshots captured for all disclosure pages.
- [ ] Success page to onboarding to intake to consultation handoff tested.
- [ ] Join flow tested on the join host, not just staging root.
- [ ] Public pages checked for no PHI in URLs, logs, analytics, cookies, or localStorage.
- [ ] Support inboxes respond and are monitored.

## 8. Current Launch Blockers
1. Healthie EHR is now the selected clinical workflow vendor, but production PHI workflows should not go live until the Healthie intake/scheduling URLs are configured and the signed BAA is on file. Healthie API access is additionally required only if native sync, webhooks, or portal reads are turned on.
2. The site currently encodes a 48-state service claim, but the explicit provider credential source in code only documents Florida. Either produce the real licensure matrix or narrow the claim before launch.
3. The HIPAA policy package is incomplete without an NPP, incident response plan, breach SOP, risk assessment, and workforce training records.
4. The LegitScript packet is not complete without domain ownership evidence, pharmacy documentation, and the ad/compliance monitoring packet for creator marketing.

## 9. Recommended Folder Structure For The Real Packet
Use a shared drive or secure internal folder with this shape:

```text
production-compliance-launch-pack/
  01-domains/
  02-legitscript-application/
  03-pharmacy-and-licensure/
  04-vendors-and-baas/
  05-policies/
  06-production-screenshots/
  07-launch-verification/
```

Each folder should contain the final signed PDF, screenshot, or export used as evidence, not just links to dashboards.
