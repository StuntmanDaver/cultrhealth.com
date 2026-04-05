# LegitScript Compliance + Asher Med Removal — Design Spec

**Date:** April 4, 2026
**Status:** Approved
**Scope:** Remove Asher Med integration, implement LegitScript compliance foundation with St. Luke Compounding Pharmacy

---

## Context

CULTR Health has transitioned away from Asher Med as its pharmacy/fulfillment partner. The Healthie EMR migration (Apr 3, 2026) moved patient/clinical management to Healthie. Order fulfillment with the new pharmacy partner, St. Luke Compounding Pharmacy, is manual for now.

Simultaneously, CULTR needs LegitScript Healthcare Merchant Certification to process payments via Visa/Mastercard and advertise on Google/Meta/TikTok.

## New Pharmacy Partner

| Field | Value |
|-------|-------|
| **Name** | St. Luke Compounding Pharmacy |
| **Address** | 9338 Little Rd, New Port Richey, FL 34654 |
| **Phone** | (727) 416-2006 |
| **Fax** | TBD — user to provide |
| **Email** | Admin@stlukecompounding.com |
| **Website** | https://stlukecompounding.com/ |
| **FL License** | PH 32747 |
| **Control No** | 114077 |
| **Issued** | November 15, 2024 |
| **Expires** | February 28, 2027 |
| **NPI** | TBD — user to provide |

## Workstream 1: Asher Med Removal

### Strategy
- Delete Asher Med core files (API client, config, mapping, docs, scripts)
- Refactor API routes that import Asher Med to use local DB only
- Extract reusable utilities (`formatPhoneNumber`, `isValidPhoneNumber`, `calculateBMI`, `US_STATES`) to `lib/utils/` or inline
- Delete Asher Med admin components (`AsherDashboardSection`)
- Keep database tables/columns as-is — no destructive migration
- Remove env var references from docs (user removes from Vercel separately)

### Files to Delete (7)
1. `lib/asher-med-api.ts`
2. `lib/config/asher-med.ts`
3. `lib/config/product-to-asher-mapping.ts`
4. `asher-med-api-documentation.md`
5. `ASHER_MED_INTEGRATION_GUIDE.md`
6. `scripts/test-asher-api.mjs`
7. `app/admin/intakes/AsherDashboardSection.tsx`

### API Routes to Delete (2)
1. `app/api/cron/asher-sync/route.ts`
2. `app/api/admin/asher-dashboard/route.ts`

### API Routes to Refactor (~14)
Remove Asher Med imports, use local DB only. Routes should still function — they just won't call external APIs.

### UI Components to Refactor
- `app/admin/intakes/IntakeViewerClient.tsx` — remove Asher Med status/ID displays
- `app/portal/profile/ProfileClient.tsx` — inline US_STATES or import from new location

## Workstream 2: LegitScript Compliance Foundation

As defined in `docs/superpowers/plans/2026-04-04-legitscript-compliance-foundation.md`, updated to use St. Luke Compounding Pharmacy:

1. Create `lib/config/compliance.ts` — FDA statuses, disclaimers, St. Luke pharmacy info
2. Create compliance components (FDAStatusBadge, DispensingPharmacyInfo, TestimonialDisclaimer)
3. Add dispensing pharmacy to footer
4. Add testimonial disclaimers
5. Qualify therapy/product claims
6. Fix "FDA-studied" language
7. Rewrite medical disclaimer page
8. Create provider credentials page
9. Rewrite privacy policy (referencing St. Luke instead of Asher Med)

## Execution Order

1. **Phase 1:** Extract utilities from Asher Med files → commit
2. **Phase 2:** Delete Asher Med core files → commit
3. **Phase 3:** Refactor all API routes to remove Asher Med imports → commit per route group
4. **Phase 4:** Remove Asher Med UI components → commit
5. **Phase 5:** Create compliance config with St. Luke details → commit
6. **Phase 6:** Create compliance components → commit
7. **Phase 7:** Wire compliance into footer, testimonials, legal pages → commit
8. **Phase 8:** Qualify therapy/product claims → commit
9. **Phase 9:** Final build verification → commit

## Out of Scope
- Healthie integration changes (untouched)
- Database schema changes (no migration)
- Vercel env var removal (user action)
- St. Luke API integration (future)
- Plans B-D of LegitScript audit (content audit, GA4, creator compliance)
