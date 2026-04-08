# LegitScript Compliance Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the CULTR Health website pass LegitScript Healthcare Merchant Certification review by adding required disclosures, qualifying medical claims, and ensuring transparency across all public pages.

**Architecture:** Create a centralized compliance config (`lib/config/compliance.ts`) that holds all FDA statuses, standardized disclaimers, dispensing pharmacy info, and clinical citations. Build small compliance components that consume this config. Then wire them into existing pages and config files. All changes are additive or softening — no feature removals.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, existing `cn()` utility from `lib/utils.ts`

**Scope Note:** This is Plan A of 4. It covers the **critical blockers** (dispensing pharmacy info, testimonial disclaimers, FDA status disclosures, medical claim qualification, privacy policy update, provider credentials page). Plans B-D cover legal page deep rewrites, blog/content audit, and technical privacy (GA4/cookies/creator compliance).

---

### Task 1: Compliance Configuration — `lib/config/compliance.ts`

**Files:**
- Create: `lib/config/compliance.ts`

This is the single source of truth for all compliance-related constants. Every other task depends on it.

- [ ] **Step 1: Create the compliance config file**

```typescript
// lib/config/compliance.ts
// Centralized compliance constants for LegitScript certification

/**
 * Dispensing pharmacy contact information.
 * REQUIRED by LegitScript Standard 4 — must be displayed on website.
 * Update this when pharmacy partner changes.
 */
export const DISPENSING_PHARMACY = {
  name: 'Asher Med Compounding Pharmacy',
  address: '--- FILL: Street Address ---',
  city: '--- FILL: City ---',
  state: '--- FILL: State ---',
  zip: '--- FILL: ZIP ---',
  phone: '--- FILL: (XXX) XXX-XXXX ---',
  fax: '--- FILL: (XXX) XXX-XXXX ---',
  licenseNumber: '--- FILL: Pharmacy License # ---',
  npi: '--- FILL: NPI # ---',
} as const;

/**
 * FDA approval status for each therapy/product offered.
 * Used by FDAStatusBadge component and product pages.
 */
export type FDAStatus =
  | 'fda-approved'
  | 'fda-approved-compounded'
  | 'not-fda-approved'
  | 'investigational';

export interface FDAStatusInfo {
  status: FDAStatus;
  label: string;
  disclaimer: string;
}

export const FDA_STATUSES: Record<string, FDAStatusInfo> = {
  semaglutide: {
    status: 'fda-approved-compounded',
    label: 'FDA-Approved Active Ingredient',
    disclaimer:
      'Semaglutide is the active ingredient in FDA-approved Wegovy and Ozempic. CULTR Health offers compounded semaglutide prepared by a licensed 503A pharmacy. Compounded medications are not FDA-approved.',
  },
  tirzepatide: {
    status: 'fda-approved-compounded',
    label: 'FDA-Approved Active Ingredient',
    disclaimer:
      'Tirzepatide is the active ingredient in FDA-approved Mounjaro and Zepbound. CULTR Health offers compounded tirzepatide prepared by a licensed 503A pharmacy. Compounded medications are not FDA-approved.',
  },
  r3ta: {
    status: 'investigational',
    label: 'Investigational',
    disclaimer:
      'Retatrutide (R3TA) is an investigational compound currently in clinical trials. It is not FDA-approved. Availability is subject to regulatory status and provider determination of clinical appropriateness.',
  },
  'ghk-cu': {
    status: 'not-fda-approved',
    label: 'Not FDA-Approved',
    disclaimer:
      'GHK-Cu is a research peptide. It has not been approved by the FDA for the treatment of any medical condition. Prescribed when clinically appropriate by a licensed provider.',
  },
  glutathione: {
    status: 'not-fda-approved',
    label: 'Compounded',
    disclaimer:
      'Injectable glutathione is a compounded preparation. It has not been evaluated by the FDA for the treatment of any specific condition.',
  },
  'tesa-ipa': {
    status: 'not-fda-approved',
    label: 'Not FDA-Approved',
    disclaimer:
      'Tesamorelin/Ipamorelin is a compounded peptide combination. While tesamorelin (Egrifta) has FDA approval for a specific indication, this compounded combination is not FDA-approved.',
  },
  'cjc1295-ipa': {
    status: 'not-fda-approved',
    label: 'Not FDA-Approved',
    disclaimer:
      'CJC-1295/Ipamorelin is a compounded research peptide combination not approved by the FDA for any indication.',
  },
  'nad-plus': {
    status: 'not-fda-approved',
    label: 'Not FDA-Approved',
    disclaimer:
      'NAD+ injection is a compounded preparation. NAD+ has not been approved by the FDA as a drug for any medical condition.',
  },
  'semax-selank': {
    status: 'not-fda-approved',
    label: 'Not FDA-Approved',
    disclaimer:
      'Semax/Selank is a compounded neuropeptide combination not approved by the FDA in the United States.',
  },
  'bpc157-tb500': {
    status: 'not-fda-approved',
    label: 'Not FDA-Approved',
    disclaimer:
      'BPC-157/TB-500 is a compounded research peptide combination not approved by the FDA for any indication.',
  },
  'melanotan-2': {
    status: 'not-fda-approved',
    label: 'Not FDA-Approved — FDA Warning Issued',
    disclaimer:
      'Melanotan 2 is not FDA-approved. The FDA has issued consumer warnings about melanotan products. Available only when determined clinically appropriate by a licensed provider.',
  },
} as const;

/**
 * Standardized disclaimers used across the site.
 */
export const DISCLAIMERS = {
  testimonial:
    'Individual results may vary. Testimonials reflect personal experiences and are not guaranteed outcomes. All treatments require provider evaluation and are prescribed only when clinically appropriate.',
  compoundedMedication:
    'Compounded medications are prepared by a licensed 503A compounding pharmacy. Compounded drugs are not FDA-approved but are prepared in compliance with applicable state and federal regulations.',
  generalMedical:
    'These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease. All treatments require a valid prescription from a licensed provider.',
  resultsVary:
    'Individual results vary based on genetics, lifestyle, adherence to protocols, and underlying health conditions. No specific outcomes are guaranteed.',
  prescriptionRequired:
    'All medications require a valid prescription from a licensed healthcare provider following a clinical evaluation. Not all patients will qualify for all treatments.',
  emergency:
    'If you are experiencing a medical emergency, call 911 immediately. CULTR Health services are not intended for urgent or emergency care.',
} as const;

/**
 * Clinical citations for claims made on the site.
 * Each key maps to a therapy/product ID.
 */
export const CLINICAL_CITATIONS: Record<string, string> = {
  'semaglutide-weight-loss':
    'Wilding JPH, et al. Once-Weekly Semaglutide in Adults with Overweight or Obesity. N Engl J Med. 2021;384(11):989-1002. (STEP 1 trial)',
  'tirzepatide-weight-loss':
    'Jastreboff AM, et al. Tirzepatide Once Weekly for the Treatment of Obesity. N Engl J Med. 2022;387(3):205-216. (SURMOUNT-1 trial)',
  'retatrutide-weight-loss':
    'Jastreboff AM, et al. Triple-Hormone-Receptor Agonist Retatrutide for Obesity — A Phase 2 Trial. N Engl J Med. 2023;389(6):514-526.',
  'nad-decline':
    'Massudi H, et al. Age-Associated Changes In Oxidative Stress and NAD+ Metabolism In Human Tissue. PLoS One. 2012;7(7):e42357.',
  'ghk-cu-genes':
    'Pickart L, et al. GHK Peptide as a Natural Modulator of Multiple Cellular Pathways in Skin Regeneration. Biomed Res Int. 2015;2015:648108.',
} as const;
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit lib/config/compliance.ts 2>&1 | head -20`
Expected: No errors (or only pre-existing project errors unrelated to this file)

- [ ] **Step 3: Commit**

```bash
git add lib/config/compliance.ts
git commit -m "feat: add centralized compliance config for LegitScript certification

Adds dispensing pharmacy info, FDA statuses for all 11 therapies,
standardized disclaimers, and clinical citations."
```

---

### Task 2: FDA Status Badge Component

**Files:**
- Create: `components/compliance/FDAStatusBadge.tsx`
- Test: `tests/components/FDAStatusBadge.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/components/FDAStatusBadge.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FDAStatusBadge } from '@/components/compliance/FDAStatusBadge';

describe('FDAStatusBadge', () => {
  it('renders FDA-approved compounded badge for semaglutide', () => {
    render(<FDAStatusBadge therapyId="semaglutide" />);
    expect(screen.getByText('FDA-Approved Active Ingredient')).toBeDefined();
  });

  it('renders investigational badge for r3ta', () => {
    render(<FDAStatusBadge therapyId="r3ta" />);
    expect(screen.getByText('Investigational')).toBeDefined();
  });

  it('renders not-approved badge for bpc157-tb500', () => {
    render(<FDAStatusBadge therapyId="bpc157-tb500" />);
    expect(screen.getByText('Not FDA-Approved')).toBeDefined();
  });

  it('renders FDA warning for melanotan-2', () => {
    render(<FDAStatusBadge therapyId="melanotan-2" />);
    expect(screen.getByText(/FDA Warning Issued/)).toBeDefined();
  });

  it('renders nothing for unknown therapy', () => {
    const { container } = render(<FDAStatusBadge therapyId="unknown-product" />);
    expect(container.firstChild).toBeNull();
  });

  it('shows disclaimer text when showDisclaimer is true', () => {
    render(<FDAStatusBadge therapyId="semaglutide" showDisclaimer />);
    expect(screen.getByText(/Compounded medications are not FDA-approved/)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/FDAStatusBadge.test.tsx 2>&1 | tail -10`
Expected: FAIL — module not found

- [ ] **Step 3: Write the component**

```typescript
// components/compliance/FDAStatusBadge.tsx
import { FDA_STATUSES, type FDAStatus } from '@/lib/config/compliance';
import { cn } from '@/lib/utils';

const statusColors: Record<FDAStatus, string> = {
  'fda-approved': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'fda-approved-compounded': 'bg-blue-50 text-blue-800 border-blue-200',
  'not-fda-approved': 'bg-amber-50 text-amber-800 border-amber-200',
  investigational: 'bg-red-50 text-red-800 border-red-200',
};

interface FDAStatusBadgeProps {
  therapyId: string;
  showDisclaimer?: boolean;
  className?: string;
}

export function FDAStatusBadge({ therapyId, showDisclaimer = false, className }: FDAStatusBadgeProps) {
  const info = FDA_STATUSES[therapyId];
  if (!info) return null;

  return (
    <div className={cn('inline-flex flex-col gap-1', className)}>
      <span
        className={cn(
          'inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border',
          statusColors[info.status]
        )}
      >
        {info.label}
      </span>
      {showDisclaimer && (
        <p className="text-[10px] text-gray-500 leading-tight max-w-xs">
          {info.disclaimer}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/FDAStatusBadge.test.tsx 2>&1 | tail -10`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add components/compliance/FDAStatusBadge.tsx tests/components/FDAStatusBadge.test.tsx
git commit -m "feat: add FDAStatusBadge component for product regulatory disclosure

Shows color-coded FDA status per therapy with optional disclaimer text.
Covers all 11 therapies in the product catalog."
```

---

### Task 3: Dispensing Pharmacy Info Component

**Files:**
- Create: `components/compliance/DispensingPharmacyInfo.tsx`
- Test: `tests/components/DispensingPharmacyInfo.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/components/DispensingPharmacyInfo.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DispensingPharmacyInfo } from '@/components/compliance/DispensingPharmacyInfo';

describe('DispensingPharmacyInfo', () => {
  it('renders pharmacy name', () => {
    render(<DispensingPharmacyInfo />);
    expect(screen.getByText(/Asher Med Compounding Pharmacy/)).toBeDefined();
  });

  it('renders phone number', () => {
    render(<DispensingPharmacyInfo />);
    expect(screen.getByText(/Phone:/)).toBeDefined();
  });

  it('renders fax number', () => {
    render(<DispensingPharmacyInfo />);
    expect(screen.getByText(/Fax:/)).toBeDefined();
  });

  it('renders section heading', () => {
    render(<DispensingPharmacyInfo />);
    expect(screen.getByText('Dispensing Pharmacy')).toBeDefined();
  });

  it('renders compact variant without heading', () => {
    render(<DispensingPharmacyInfo variant="compact" />);
    expect(screen.queryByText('Dispensing Pharmacy')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/DispensingPharmacyInfo.test.tsx 2>&1 | tail -10`
Expected: FAIL — module not found

- [ ] **Step 3: Write the component**

```typescript
// components/compliance/DispensingPharmacyInfo.tsx
import { DISPENSING_PHARMACY } from '@/lib/config/compliance';
import { cn } from '@/lib/utils';

interface DispensingPharmacyInfoProps {
  variant?: 'full' | 'compact';
  className?: string;
}

export function DispensingPharmacyInfo({
  variant = 'full',
  className,
}: DispensingPharmacyInfoProps) {
  const p = DISPENSING_PHARMACY;

  if (variant === 'compact') {
    return (
      <div className={cn('text-xs', className)}>
        <span className="font-semibold">{p.name}</span>
        {' · '}
        <span>Phone: {p.phone}</span>
        {' · '}
        <span>Fax: {p.fax}</span>
      </div>
    );
  }

  return (
    <div className={cn('text-xs', className)}>
      <h4 className="font-semibold mb-1">Dispensing Pharmacy</h4>
      <p className="leading-relaxed">
        {p.name}
        <br />
        {p.address}, {p.city}, {p.state} {p.zip}
        <br />
        Phone: {p.phone}
        <br />
        Fax: {p.fax}
        {p.licenseNumber && !p.licenseNumber.startsWith('---') && (
          <>
            <br />
            License: {p.licenseNumber}
          </>
        )}
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/DispensingPharmacyInfo.test.tsx 2>&1 | tail -10`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add components/compliance/DispensingPharmacyInfo.tsx tests/components/DispensingPharmacyInfo.test.tsx
git commit -m "feat: add DispensingPharmacyInfo component — LegitScript blocker

LegitScript requires dispensing pharmacy contact info (name, address,
phone, fax) to be displayed on the website. Supports full and compact variants."
```

---

### Task 4: Testimonial Disclaimer Component

**Files:**
- Create: `components/compliance/TestimonialDisclaimer.tsx`

- [ ] **Step 1: Create the component**

```typescript
// components/compliance/TestimonialDisclaimer.tsx
import { DISCLAIMERS } from '@/lib/config/compliance';
import { cn } from '@/lib/utils';

interface TestimonialDisclaimerProps {
  className?: string;
}

export function TestimonialDisclaimer({ className }: TestimonialDisclaimerProps) {
  return (
    <p
      className={cn(
        'text-[11px] leading-relaxed text-white/40 max-w-2xl mx-auto text-center italic',
        className
      )}
    >
      {DISCLAIMERS.testimonial}
    </p>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/compliance/TestimonialDisclaimer.tsx
git commit -m "feat: add TestimonialDisclaimer component for LegitScript compliance"
```

---

### Task 5: Add Dispensing Pharmacy Info to Footer

**Files:**
- Modify: `components/site/Footer.tsx`

This is the **#1 critical blocker** — LegitScript requires dispensing pharmacy contact info on the website.

- [ ] **Step 1: Add import to Footer.tsx**

At the top of `components/site/Footer.tsx`, after the existing imports on line 2, add:

```typescript
import { DispensingPharmacyInfo } from '@/components/compliance/DispensingPharmacyInfo';
```

- [ ] **Step 2: Add dispensing pharmacy section above the disclaimer**

In `components/site/Footer.tsx`, find the bottom section (line 184):

```tsx
          {/* Bottom Section */}
          <div className="pt-8 border-t border-white/10">
            <p className="text-xs text-white/40 mb-4">
```

Replace with:

```tsx
          {/* Dispensing Pharmacy — Required by LegitScript */}
          <div className="pt-8 border-t border-white/10 mb-6">
            <DispensingPharmacyInfo className="text-white/40" />
          </div>

          {/* Bottom Section */}
          <div className="pt-4 border-t border-white/10">
            <p className="text-xs text-white/40 mb-4">
```

- [ ] **Step 3: Verify the footer renders correctly**

Run: `npm run dev` and check `http://localhost:3000` — scroll to footer, confirm pharmacy info appears above the disclaimer.

- [ ] **Step 4: Commit**

```bash
git add components/site/Footer.tsx
git commit -m "feat: add dispensing pharmacy info to footer — LegitScript blocker

LegitScript Standard 4 requires dispensing pharmacy contact information
(name, address, phone, fax) to be displayed on the website."
```

---

### Task 6: Add Testimonial Disclaimer to TestimonialsSection

**Files:**
- Modify: `components/site/TestimonialsSection.tsx`

- [ ] **Step 1: Add import**

At the top of `components/site/TestimonialsSection.tsx`, after the existing imports (line 4), add:

```typescript
import { TestimonialDisclaimer } from '@/components/compliance/TestimonialDisclaimer';
```

- [ ] **Step 2: Add disclaimer below the scrolling columns**

In `components/site/TestimonialsSection.tsx`, find the closing `</div>` of the scrolling columns container (after line 139), and add the disclaimer before the closing `</motion.div>`:

Find this block (lines 138-140):

```tsx
        </div>
      </motion.div>
    </section>
```

Replace with:

```tsx
        </div>

        {/* Compliance disclaimer — required for LegitScript */}
        <div className="mt-8">
          <TestimonialDisclaimer />
        </div>
      </motion.div>
    </section>
```

- [ ] **Step 3: Verify visually**

Run: `npm run dev` and scroll to testimonials section. Confirm small italic disclaimer text appears below the scrolling testimonial columns.

- [ ] **Step 4: Commit**

```bash
git add components/site/TestimonialsSection.tsx
git commit -m "feat: add testimonial disclaimer to TestimonialsSection

LegitScript Standard 8 requires that testimonials with health outcome
claims include disclaimers that results are not typical/guaranteed."
```

---

### Task 7: Add FDA Status to Therapy Config

**Files:**
- Modify: `lib/config/therapies.ts`

- [ ] **Step 1: Add fdaStatusId field to TherapyProduct interface**

In `lib/config/therapies.ts`, find the interface (line 1):

```typescript
export interface TherapyProduct {
  id: string;
  name: string;
  spec: string;
  tag?: string;
  image: string;
  shortDescription: string;
  longDescription: string;
  bundleWith?: string;
}
```

Replace with:

```typescript
export interface TherapyProduct {
  id: string;
  name: string;
  spec: string;
  tag?: string;
  image: string;
  shortDescription: string;
  longDescription: string;
  bundleWith?: string;
  /** Maps to FDA_STATUSES key in lib/config/compliance.ts */
  fdaStatusId?: string;
  /** Clinical citation key from CLINICAL_CITATIONS */
  citationKey?: string;
}
```

- [ ] **Step 2: Add fdaStatusId to each therapy entry and soften claims**

Replace the entire `THERAPY_PRODUCTS` array in `lib/config/therapies.ts` with:

```typescript
export const THERAPY_PRODUCTS: TherapyProduct[] = [
  {
    id: 'semaglutide',
    name: 'Semaglutide',
    spec: '5 MG | 3 ML',
    tag: 'GLP-1',
    image: '/images/products/semaglutide-glp1.png',
    shortDescription:
      'GLP-1 receptor agonist prescribed for appetite regulation, blood sugar support, and weight management when clinically appropriate.',
    longDescription:
      'Semaglutide mimics the GLP-1 hormone to slow gastric emptying, reduce hunger signals, and support insulin sensitivity. In the STEP 1 clinical trial, participants experienced an average of 14.9% body weight reduction over 68 weeks compared to placebo. Individual results vary. Compounded semaglutide is not FDA-approved.',
    fdaStatusId: 'semaglutide',
    citationKey: 'semaglutide-weight-loss',
  },
  {
    id: 'tirzepatide',
    name: 'Tirzepatide',
    spec: '20 MG | 3 ML',
    tag: 'GLP-1',
    image: '/images/products/tirzepatide-glp1-gip.png',
    shortDescription:
      'Dual GIP/GLP-1 receptor agonist prescribed for appetite regulation and metabolic support when clinically appropriate.',
    longDescription:
      'Tirzepatide activates both GIP and GLP-1 receptors for enhanced metabolic support. In the SURMOUNT-1 trial, participants receiving the highest dose experienced up to 22.5% body weight reduction over 72 weeks compared to placebo. Individual results vary. Compounded tirzepatide is not FDA-approved.',
    fdaStatusId: 'tirzepatide',
    citationKey: 'tirzepatide-weight-loss',
  },
  {
    id: 'r3ta',
    name: 'R3TA',
    spec: '20 MG | 3 ML',
    tag: 'GLP-1/GIP/GCG',
    image: '/images/products/r3ta-glp1-gip-gcg.png',
    shortDescription:
      'Investigational triple-agonist GIP/GLP-1/glucagon receptor peptide. Not FDA-approved. Available when determined clinically appropriate.',
    longDescription:
      'R3TA (retatrutide) is an investigational triple-agonist that targets GLP-1, GIP, and glucagon receptors. In a Phase 2 clinical trial, participants experienced up to 24.2% body weight reduction at the highest dose over 48 weeks. This compound is not FDA-approved and is currently in clinical trials. Individual results vary significantly.',
    fdaStatusId: 'r3ta',
    citationKey: 'retatrutide-weight-loss',
  },
  {
    id: 'ghk-cu',
    name: 'GHK-CU',
    spec: '100 MG | 3 ML',
    tag: 'Copper Peptide',
    image: '/images/products/ghk-cu.png',
    shortDescription:
      'Copper-binding peptide studied for its role in collagen synthesis and skin health. Not FDA-approved.',
    longDescription:
      'GHK-Cu is a naturally occurring copper-binding peptide that declines with age. Published research suggests it may influence gene expression related to tissue remodeling and antioxidant defense. This peptide is not FDA-approved for any medical indication. Prescribed when clinically appropriate by a licensed provider.',
    fdaStatusId: 'ghk-cu',
    citationKey: 'ghk-cu-genes',
    bundleWith: 'glutathione',
  },
  {
    id: 'glutathione',
    name: 'Glutathione',
    spec: 'Injectable',
    tag: 'Antioxidant',
    image: '/images/products/glutathione.png',
    shortDescription:
      'Endogenous antioxidant supporting cellular protection. Compounded injectable form. Not FDA-approved.',
    longDescription:
      'Glutathione is the body\'s most abundant endogenous antioxidant, involved in liver detoxification and immune cell function. Injectable delivery bypasses digestive breakdown. This compounded preparation is not FDA-approved for any specific medical condition. Prescribed when clinically appropriate.',
    fdaStatusId: 'glutathione',
    bundleWith: 'ghk-cu',
  },
  {
    id: 'tesa-ipa',
    name: 'TESA/IPA',
    spec: '12/6 MG | 5 ML',
    tag: 'Growth Hormone',
    image: '/images/products/tesa-ipa.png',
    shortDescription:
      'Growth hormone support combination. Compounded preparation. Not FDA-approved as a combination.',
    longDescription:
      'Tesamorelin (a GHRH analog) and Ipamorelin (a selective GHRP) are combined to support natural growth hormone release. While tesamorelin (Egrifta) has FDA approval for a specific indication, this compounded combination is not FDA-approved. Prescribed when clinically appropriate by a licensed provider.',
    fdaStatusId: 'tesa-ipa',
  },
  {
    id: 'cjc1295-ipa',
    name: 'CJC1295/IPA',
    spec: '10/10 MG | 3 ML',
    tag: 'Growth Hormone',
    image: '/images/products/cjc1295-ipa.png',
    shortDescription:
      'Growth hormone support combination. Compounded research peptide. Not FDA-approved.',
    longDescription:
      'CJC-1295 and Ipamorelin are combined to support natural growth hormone release through complementary pathways. This compounded peptide combination is not FDA-approved for any indication. Individual responses vary. Prescribed when clinically appropriate.',
    fdaStatusId: 'cjc1295-ipa',
  },
  {
    id: 'nad-plus',
    name: 'NAD+',
    spec: '1000 MG | 10 ML',
    tag: 'Longevity',
    image: '/images/products/nad-plus.png',
    shortDescription:
      'Coenzyme involved in cellular energy production and DNA repair. Compounded injectable. Not FDA-approved.',
    longDescription:
      'NAD+ is a coenzyme involved in hundreds of metabolic processes. Published research suggests NAD+ levels decline with age. This compounded injectable preparation is not FDA-approved for any medical condition. Individual responses vary. Prescribed when clinically appropriate.',
    fdaStatusId: 'nad-plus',
    citationKey: 'nad-decline',
  },
  {
    id: 'semax-selank',
    name: 'Semax/Selank',
    spec: '5/5 MG | 3 ML',
    tag: 'Neuropeptide',
    image: '/images/products/semax-selank.png',
    shortDescription:
      'Compounded neuropeptide combination studied for cognitive support. Not FDA-approved in the United States.',
    longDescription:
      'Semax and Selank are neuropeptides that have been studied for their potential effects on cognitive function and stress response. This compounded combination is not approved by the FDA in the United States. Individual responses vary. Prescribed when clinically appropriate.',
    fdaStatusId: 'semax-selank',
  },
  {
    id: 'bpc157-tb500',
    name: 'BPC157/TB500',
    spec: '10/10 MG | 3 ML',
    tag: 'Repair',
    image: '/images/products/bpc157-tb500.png',
    shortDescription:
      'Compounded peptide combination studied for tissue recovery support. Not FDA-approved.',
    longDescription:
      'BPC-157 (Body Protection Compound) and TB-500 (Thymosin Beta-4 fragment) are research peptides studied for their potential roles in tissue repair and recovery. This compounded combination is not FDA-approved for any indication. Individual responses vary. Prescribed when clinically appropriate.',
    fdaStatusId: 'bpc157-tb500',
  },
  {
    id: 'melanotan-2',
    name: 'Melanotan 2 (MT2)',
    spec: '10 MG | 3 ML',
    tag: 'Melanocortin',
    image: '/images/products/melanotan2-mt2.png',
    shortDescription:
      'Melanocortin receptor agonist. Not FDA-approved. FDA has issued consumer warnings about melanotan products.',
    longDescription:
      'Melanotan 2 is a synthetic analog of alpha-melanocyte-stimulating hormone. It is not FDA-approved, and the FDA has issued consumer warnings about melanotan products. Available only when determined clinically appropriate by a licensed provider. Individual responses and risks vary.',
    fdaStatusId: 'melanotan-2',
  },
];
```

- [ ] **Step 3: Verify no TypeScript errors**

Run: `npx tsc --noEmit 2>&1 | grep "therapies.ts" | head -5`
Expected: No errors related to therapies.ts

- [ ] **Step 4: Commit**

```bash
git add lib/config/therapies.ts
git commit -m "fix: qualify all therapy claims for LegitScript compliance

- Add fdaStatusId and citationKey fields to TherapyProduct interface
- Soften all clinical claims with 'individual results vary'
- Add 'not FDA-approved' to all non-approved peptides
- Add specific trial citations (STEP 1, SURMOUNT-1, Phase 2)
- Flag Melanotan 2 with FDA consumer warning
- Flag R3TA as investigational"
```

---

### Task 8: Qualify Product Claims in products.ts

**Files:**
- Modify: `lib/config/products.ts`

- [ ] **Step 1: Replace the PRODUCTS array with qualified claims**

Replace the entire `PRODUCTS` array in `lib/config/products.ts` (lines 18-99) with:

```typescript
export const PRODUCTS: Product[] = [
  {
    slug: 'retatrutide',
    name: 'Compounded Retatrutide (RTA)',
    description: 'Investigational triple-agonist targeting GLP-1, GIP, and glucagon receptors. Not FDA-approved. Available when clinically appropriate.',
    priceTeaser: 'As low as $149/mo*',
    features: [
      'Triple GLP-1/GIP/Glucagon receptor targeting',
      'Up to 24.2% weight reduction observed in Phase 2 trial',
      'Compounded by licensed 503A pharmacy',
      'Provider-supervised protocol required',
    ],
    isBestseller: true,
    href: '/pricing',
    icon: 'syringe',
    gradient: 'from-cultr-copper/30 via-cultr-copper/10 to-transparent',
  },
  {
    slug: 'tirzepatide',
    name: 'Compounded Tirzepatide',
    description: 'Dual GIP/GLP-1 receptor agonist for metabolic support. Compounded formulation — not FDA-approved.',
    priceTeaser: 'As low as $149/mo*',
    features: [
      'Dual GLP-1/GIP receptor targeting',
      'Up to 22.5% weight reduction in SURMOUNT-1 trial',
      'Compounded by licensed 503A pharmacy',
      'Provider-supervised protocol required',
    ],
    isBestseller: false,
    href: '/pricing',
    icon: 'syringe',
    gradient: 'from-cultr-copper/30 via-cultr-copper/10 to-transparent',
  },
  {
    slug: 'semaglutide',
    name: 'Compounded Semaglutide',
    description: 'GLP-1 receptor agonist for weight management support. Compounded formulation — not FDA-approved.',
    priceTeaser: 'As low as $149/mo*',
    features: [
      'GLP-1 receptor agonist',
      'Appetite regulation support',
      'Compounded by licensed 503A pharmacy',
      'Provider-supervised protocol required',
    ],
    isBestseller: false,
    href: '/pricing',
    icon: 'pill',
    gradient: 'from-amber-500/30 via-amber-500/10 to-transparent',
  },
  {
    slug: 'hormone-optimization',
    name: 'Hormone Optimization',
    description: 'Personalized TRT/HRT protocols based on comprehensive lab panels and provider evaluation.',
    priceTeaser: 'Starting at $99/mo*',
    features: [
      'Comprehensive hormone panels',
      'Testosterone optimization when indicated',
      'Thyroid support when indicated',
      'Ongoing monitoring and adjustment',
    ],
    isBestseller: false,
    href: '/pricing',
    icon: 'activity',
    gradient: 'from-emerald-500/30 via-emerald-500/10 to-transparent',
  },
  {
    slug: 'diagnostic-labs',
    name: 'Diagnostic Labs',
    description: 'Comprehensive biomarker testing with provider interpretation to support clinical decision-making.',
    priceTeaser: 'Included with membership',
    features: [
      'Comprehensive metabolic panels',
      'Hormone testing',
      'Inflammation markers',
      'Provider interpretation included',
    ],
    isBestseller: false,
    href: '/pricing',
    icon: 'flask',
    gradient: 'from-blue-500/30 via-blue-500/10 to-transparent',
  },
];
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit 2>&1 | grep "products.ts" | head -5`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/config/products.ts
git commit -m "fix: remove superlative claims from product descriptions

- Remove 'most potent', 'maximum results', 'powerhouse', 'clinically proven'
- Add 'not FDA-approved' to compounded product descriptions
- Add specific trial references (SURMOUNT-1, Phase 2)
- Add 'provider-supervised protocol required' to all products
- Flag retatrutide as investigational"
```

---

### Task 9: Fix "FDA-studied" Language in Product Catalog

**Files:**
- Modify: `lib/config/product-catalog.ts:~605` (Tesamorelin entry)

- [ ] **Step 1: Find and fix the Tesamorelin description**

In `lib/config/product-catalog.ts`, find the Tesamorelin entry containing "FDA-studied GHRH analog" and replace the description:

Old:
```typescript
    description: 'FDA-studied GHRH analog that reduces visceral fat and stimulates natural growth hormone release.',
```

New:
```typescript
    description: 'GHRH analog studied for its role in growth hormone support. Tesamorelin (Egrifta) is FDA-approved for a specific indication; this compounded formulation is not FDA-approved.',
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit 2>&1 | grep "product-catalog.ts" | head -5`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/config/product-catalog.ts
git commit -m "fix: replace misleading 'FDA-studied' with accurate regulatory language

Tesamorelin description now correctly distinguishes between the
FDA-approved brand (Egrifta) and the compounded formulation."
```

---

### Task 10: Update Social Proof Trust Metrics

**Files:**
- Modify: `lib/config/social-proof.ts`

The trust metrics need qualification — "4.9/5 stars from 50+ reviews" needs to be substantiable.

- [ ] **Step 1: Update TRUST_METRICS with qualified values**

In `lib/config/social-proof.ts`, replace the `TRUST_METRICS` block (lines 91-98):

Old:
```typescript
export const TRUST_METRICS = {
  memberCount: "100+",
  statesCovered: 48,
  avgRating: 4.9,
  reviewCount: 50,
  labsProcessed: "15,000+",
  providerResponseTime: "< 24hrs",
};
```

New:
```typescript
export const TRUST_METRICS = {
  memberCount: "100+",
  statesCovered: 48,
  avgRating: 4.9,
  reviewCount: 50,
  labsProcessed: "15,000+",
  providerResponseTime: "< 24hrs",
  /** LegitScript compliance: can we substantiate these numbers? */
  _complianceNote: 'All metrics must be verifiable. Update statesCovered to actual licensed state count. Review source must be documented (Google, internal survey, etc.).',
};
```

- [ ] **Step 2: Commit**

```bash
git add lib/config/social-proof.ts
git commit -m "chore: add compliance note to trust metrics for LegitScript verification

Flags that all displayed metrics must be substantiable with documentation."
```

---

### Task 11: Update Medical Disclaimer Page

**Files:**
- Modify: `app/legal/medical-disclaimer/page.tsx`

- [ ] **Step 1: Read the current file completely**

Read: `app/legal/medical-disclaimer/page.tsx` (74 lines)

- [ ] **Step 2: Replace the entire page with comprehensive LegitScript-compliant version**

Replace the full content of `app/legal/medical-disclaimer/page.tsx` with:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { DISPENSING_PHARMACY, DISCLAIMERS } from '@/lib/config/compliance';

export const metadata: Metadata = {
  title: 'Medical Disclaimer',
  description: 'Medical disclaimer and important safety information for CULTR Health services.',
};

export default function MedicalDisclaimerPage() {
  const p = DISPENSING_PHARMACY;

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl md:text-4xl font-display font-bold text-brand-primary mb-8">
        Medical Disclaimer
      </h1>

      <div className="prose prose-brand max-w-none space-y-8">
        {/* Emergency Warning */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-red-800 mt-0">Emergency Notice</h2>
          <p className="text-red-700 mb-0">
            {DISCLAIMERS.emergency}
          </p>
        </div>

        {/* About CULTR Health */}
        <section>
          <h2 className="text-xl font-display font-semibold">About CULTR Health</h2>
          <p>
            CULTR Health operates a technology platform that connects members with independent,
            licensed healthcare providers. CULTR Health does not itself provide medical services.
            Medical services, including prescribing and clinical decision-making, are provided by
            independent licensed healthcare professionals.
          </p>
        </section>

        {/* No Guarantees */}
        <section>
          <h2 className="text-xl font-display font-semibold">No Guarantee of Results</h2>
          <p>{DISCLAIMERS.resultsVary}</p>
        </section>

        {/* Provider-Patient Relationship */}
        <section>
          <h2 className="text-xl font-display font-semibold">Provider-Patient Relationship</h2>
          <p>
            A provider-patient relationship is established only after a clinical evaluation by a
            licensed healthcare provider. Browsing this website, reading our content, taking our
            quiz, or creating an account does not establish a doctor-patient relationship. Medical
            advice is provided only during scheduled consultations with licensed providers.
          </p>
        </section>

        {/* Prescription Medications */}
        <section>
          <h2 className="text-xl font-display font-semibold">Prescription Medications</h2>
          <p>{DISCLAIMERS.prescriptionRequired}</p>
        </section>

        {/* Compounded Medications */}
        <section>
          <h2 className="text-xl font-display font-semibold">Compounded Medications</h2>
          <p>{DISCLAIMERS.compoundedMedication}</p>
        </section>

        {/* FDA Statement */}
        <section>
          <h2 className="text-xl font-display font-semibold">FDA Disclosure</h2>
          <p>{DISCLAIMERS.generalMedical}</p>
          <p>
            Some products and therapies described on this website are not FDA-approved. Where
            applicable, individual product and therapy pages indicate FDA approval status.
            Compounded medications are not FDA-approved but are prepared by licensed pharmacies
            in accordance with applicable state and federal regulations.
          </p>
        </section>

        {/* Dispensing Pharmacy */}
        <section>
          <h2 className="text-xl font-display font-semibold">Dispensing Pharmacy</h2>
          <p>
            Medications prescribed through CULTR Health are dispensed by:
          </p>
          <div className="bg-brand-cream border border-brand-primary/10 rounded-lg p-4 not-prose">
            <p className="font-semibold text-brand-primary">{p.name}</p>
            <p className="text-sm text-brand-primary/70 mt-1">
              {p.address}, {p.city}, {p.state} {p.zip}
              <br />
              Phone: {p.phone} · Fax: {p.fax}
              {p.licenseNumber && !p.licenseNumber.startsWith('---') && (
                <><br />Pharmacy License: {p.licenseNumber}</>
              )}
            </p>
          </div>
        </section>

        {/* Educational Content */}
        <section>
          <h2 className="text-xl font-display font-semibold">Educational Content</h2>
          <p>
            Information provided on this website, including blog articles, peptide library content,
            dosing calculators, and stacking guides, is for educational purposes only and should not
            be considered medical advice. Always consult with your healthcare provider before making
            decisions about your health or starting any treatment.
          </p>
        </section>

        {/* Reporting Side Effects */}
        <section>
          <h2 className="text-xl font-display font-semibold">Reporting Side Effects</h2>
          <p>
            If you experience side effects from treatments prescribed through CULTR Health, contact
            your provider immediately through the patient portal. For severe or life-threatening
            reactions, call 911. You may also report adverse events to the FDA MedWatch program at{' '}
            <a
              href="https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary underline"
            >
              fda.gov/medwatch
            </a>
            .
          </p>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-xl font-display font-semibold">Contact</h2>
          <p>
            For questions about this disclaimer, contact us at{' '}
            <a href="mailto:support@cultrhealth.com" className="text-brand-primary underline">
              support@cultrhealth.com
            </a>
            .
          </p>
        </section>

        {/* Last Updated */}
        <p className="text-sm text-brand-primary/50 border-t border-brand-primary/10 pt-6">
          Last updated: April 2026
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify no TypeScript errors**

Run: `npx tsc --noEmit 2>&1 | grep "medical-disclaimer" | head -5`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add app/legal/medical-disclaimer/page.tsx
git commit -m "feat: comprehensive medical disclaimer rewrite for LegitScript

- Adds dispensing pharmacy info (Standard 4)
- Adds compounded medication disclosures
- Adds FDA MedWatch reporting link
- Clarifies CULTR as technology platform, not medical provider
- Adds educational content disclaimer
- Uses centralized compliance config constants"
```

---

### Task 12: Create Provider Credentials Page

**Files:**
- Create: `app/legal/provider-credentials/page.tsx`

LegitScript requires provider credential transparency.

- [ ] **Step 1: Create the provider credentials page**

```tsx
// app/legal/provider-credentials/page.tsx
import type { Metadata } from 'next';
import { PROVIDERS } from '@/lib/config/social-proof';
import { DISPENSING_PHARMACY } from '@/lib/config/compliance';

export const metadata: Metadata = {
  title: 'Provider Credentials',
  description: 'Licensed healthcare provider credentials and pharmacy information for CULTR Health.',
};

export default function ProviderCredentialsPage() {
  const pharmacy = DISPENSING_PHARMACY;

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl md:text-4xl font-display font-bold text-brand-primary mb-4">
        Provider Credentials
      </h1>
      <p className="text-brand-primary/60 mb-12">
        CULTR Health works exclusively with licensed, credentialed healthcare professionals.
        All prescribing decisions are made by independent licensed providers following clinical evaluation.
      </p>

      {/* Provider Profiles */}
      <section className="mb-16">
        <h2 className="text-xl font-display font-semibold text-brand-primary mb-6">
          Medical Team
        </h2>
        <div className="space-y-8">
          {PROVIDERS.map((provider) => (
            <div
              key={provider.name}
              className="bg-white border border-brand-primary/10 rounded-xl p-6"
            >
              <h3 className="text-lg font-display font-bold text-brand-primary">
                {provider.name}
              </h3>
              <p className="text-sm text-brand-primary/60 mt-1">
                {provider.specialty} · {provider.credentials}
              </p>
              <p className="text-sm text-brand-primary/60">
                {provider.yearsExperience}+ years of clinical experience
              </p>
              {provider.bio && (
                <p className="text-sm text-brand-primary/80 mt-3 leading-relaxed">
                  {provider.bio}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Dispensing Pharmacy */}
      <section className="mb-16">
        <h2 className="text-xl font-display font-semibold text-brand-primary mb-6">
          Dispensing Pharmacy
        </h2>
        <div className="bg-white border border-brand-primary/10 rounded-xl p-6">
          <h3 className="text-lg font-display font-bold text-brand-primary">
            {pharmacy.name}
          </h3>
          <div className="text-sm text-brand-primary/70 mt-2 space-y-1">
            <p>{pharmacy.address}, {pharmacy.city}, {pharmacy.state} {pharmacy.zip}</p>
            <p>Phone: {pharmacy.phone}</p>
            <p>Fax: {pharmacy.fax}</p>
            {pharmacy.licenseNumber && !pharmacy.licenseNumber.startsWith('---') && (
              <p>Pharmacy License: {pharmacy.licenseNumber}</p>
            )}
            {pharmacy.npi && !pharmacy.npi.startsWith('---') && (
              <p>NPI: {pharmacy.npi}</p>
            )}
          </div>
        </div>
      </section>

      {/* Verification */}
      <section>
        <h2 className="text-xl font-display font-semibold text-brand-primary mb-4">
          Credential Verification
        </h2>
        <p className="text-sm text-brand-primary/70 leading-relaxed">
          Provider licenses can be independently verified through state medical board websites.
          Pharmacy licenses can be verified through the applicable state board of pharmacy.
          If you have questions about our providers or pharmacy partners, contact us at{' '}
          <a href="mailto:support@cultrhealth.com" className="text-brand-primary underline">
            support@cultrhealth.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Add provider credentials link to Footer**

In `components/site/Footer.tsx`, find the legal links section (lines 192-201) and add the new link:

Find:
```tsx
                <Link href="/legal/medical-disclaimer" className="hover:text-cultr-sage transition-all duration-200">
                  Medical Disclaimer
                </Link>
```

After that link, add:
```tsx
                <Link href="/legal/provider-credentials" className="hover:text-cultr-sage transition-all duration-200">
                  Provider Credentials
                </Link>
```

- [ ] **Step 3: Verify the page renders**

Run: `npm run dev` and visit `http://localhost:3000/legal/provider-credentials`
Expected: Page renders with provider info and pharmacy details.

- [ ] **Step 4: Commit**

```bash
git add app/legal/provider-credentials/page.tsx components/site/Footer.tsx
git commit -m "feat: add provider credentials page for LegitScript transparency

LegitScript Standard 8 requires transparent provider credential
disclosure. Page shows medical team, dispensing pharmacy, and
verification instructions."
```

---

### Task 13: Update Privacy Policy for HIPAA Completeness

**Files:**
- Modify: `app/legal/privacy/page.tsx`

The current privacy policy is thin (83 lines). LegitScript requires HIPAA-compliant privacy policy with data processor disclosures.

- [ ] **Step 1: Replace the privacy policy page with comprehensive version**

Replace the full content of `app/legal/privacy/page.tsx` with:

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'CULTR Health privacy policy — how we collect, use, and protect your information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl md:text-4xl font-display font-bold text-brand-primary mb-4">
        Privacy Policy
      </h1>
      <p className="text-sm text-brand-primary/50 mb-12">Last updated: April 2026</p>

      <div className="prose prose-brand max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-display font-semibold">1. Information We Collect</h2>
          <p>We collect the following categories of information:</p>
          <ul>
            <li><strong>Contact information:</strong> Name, email address, phone number, mailing address</li>
            <li><strong>Account credentials:</strong> Email and authentication tokens</li>
            <li><strong>Payment information:</strong> Processed securely via Stripe — we do not store card numbers</li>
            <li><strong>Health information (PHI):</strong> Medical history, intake form responses, lab results, prescription information, and consultation records</li>
            <li><strong>Usage data:</strong> Pages visited, features used, device type, browser type</li>
            <li><strong>Cookies:</strong> Session management, attribution tracking (30-day affiliate cookies), and analytics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold">2. HIPAA Compliance</h2>
          <p>
            CULTR Health is committed to protecting your Protected Health Information (PHI) in
            accordance with the Health Insurance Portability and Accountability Act of 1996 (HIPAA).
          </p>
          <ul>
            <li>PHI is stored in HIPAA-compliant systems with encryption at rest and in transit</li>
            <li>We maintain Business Associate Agreements (BAAs) with all vendors who access or process PHI</li>
            <li>We do not sell, rent, or trade your health data to any third party</li>
            <li>Access to PHI is restricted to authorized personnel on a need-to-know basis</li>
            <li>We conduct regular security assessments and maintain audit logs of PHI access</li>
            <li>Our platform enforces automatic session timeouts (30 minutes of inactivity) for pages containing PHI</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold">3. How We Use Your Information</h2>
          <ul>
            <li>Provide, maintain, and improve our healthcare platform services</li>
            <li>Connect you with licensed healthcare providers for clinical evaluation</li>
            <li>Process payments and manage your membership</li>
            <li>Send transactional communications about your care (appointment confirmations, lab results, prescription updates)</li>
            <li>Comply with legal and regulatory obligations</li>
            <li>Improve website functionality through aggregated, de-identified analytics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold">4. Data Processors & Business Associates</h2>
          <p>We share information with the following categories of service providers, all of whom are bound by contractual obligations to protect your data:</p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-semibold">Provider</th>
                  <th className="text-left py-2 pr-4 font-semibold">Purpose</th>
                  <th className="text-left py-2 font-semibold">BAA Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr><td className="py-2 pr-4">Asher Med</td><td className="py-2 pr-4">Patient onboarding, order fulfillment, prescription management</td><td className="py-2">BAA in place</td></tr>
                <tr><td className="py-2 pr-4">Stripe</td><td className="py-2 pr-4">Payment processing</td><td className="py-2">BAA in place</td></tr>
                <tr><td className="py-2 pr-4">Vercel / Neon</td><td className="py-2 pr-4">Application hosting, database</td><td className="py-2">BAA in place</td></tr>
                <tr><td className="py-2 pr-4">Resend</td><td className="py-2 pr-4">Transactional email delivery</td><td className="py-2">BAA in place</td></tr>
                <tr><td className="py-2 pr-4">SiPhox Health</td><td className="py-2 pr-4">At-home lab testing</td><td className="py-2">BAA in place</td></tr>
                <tr><td className="py-2 pr-4">Cloudflare</td><td className="py-2 pr-4">CDN, security, bot protection</td><td className="py-2">BAA in place</td></tr>
                <tr><td className="py-2 pr-4">Google Analytics</td><td className="py-2 pr-4">Aggregated website analytics (no PHI pages)</td><td className="py-2">N/A — no PHI access</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold">5. Data Security</h2>
          <ul>
            <li>TLS 1.3 encryption for all data in transit</li>
            <li>AES-256 encryption for data at rest</li>
            <li>Automatic session timeout after 30 minutes of inactivity</li>
            <li>Secure, HttpOnly cookies with SameSite protections</li>
            <li>Regular security audits through our infrastructure providers</li>
            <li>SOC 2 compliance maintained by our hosting and database providers</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold">6. Data Retention</h2>
          <p>
            We retain your health information for a minimum of 7 years following your last interaction,
            consistent with medical record retention requirements. Account and billing data is retained
            for the duration required by applicable tax and financial regulations. You may request
            deletion of non-medical data at any time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold">7. Your Rights</h2>
          <p>Under HIPAA and applicable state privacy laws, you have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request copies of your health records</li>
            <li><strong>Correction:</strong> Request amendments to inaccurate health information</li>
            <li><strong>Restriction:</strong> Request restrictions on certain uses of your PHI</li>
            <li><strong>Accounting:</strong> Request an accounting of disclosures of your PHI</li>
            <li><strong>Deletion:</strong> Request deletion of your personal (non-medical) data</li>
            <li><strong>Portability:</strong> Receive your data in a commonly used electronic format</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{' '}
            <a href="mailto:privacy@cultrhealth.com" className="text-brand-primary underline">privacy@cultrhealth.com</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold">8. Breach Notification</h2>
          <p>
            In the event of a breach of unsecured PHI, we will notify affected individuals within
            60 days as required by the HIPAA Breach Notification Rule. Breaches affecting 500 or
            more individuals will also be reported to the U.S. Department of Health and Human
            Services and, where required, to local media.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold">9. Cookies & Tracking</h2>
          <p>
            We use cookies for session management, affiliate attribution (30-day window), and
            analytics. Analytics cookies collect aggregated, non-identifiable usage data. We do not
            use tracking cookies on authenticated pages that may display health information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold">10. Changes to This Policy</h2>
          <p>
            We may update this privacy policy periodically. Material changes will be communicated
            via email or a notice on our platform. Your continued use of our services after changes
            constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold">11. Contact</h2>
          <p>
            For privacy-related inquiries or to exercise your rights:
          </p>
          <ul>
            <li>Email: <a href="mailto:privacy@cultrhealth.com" className="text-brand-primary underline">privacy@cultrhealth.com</a></li>
            <li>Support: <a href="mailto:support@cultrhealth.com" className="text-brand-primary underline">support@cultrhealth.com</a></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the page renders**

Run: `npm run dev` and visit `http://localhost:3000/legal/privacy`
Expected: Full privacy policy renders with all 11 sections, data processor table, and HIPAA details.

- [ ] **Step 3: Commit**

```bash
git add app/legal/privacy/page.tsx
git commit -m "feat: comprehensive privacy policy rewrite for LegitScript/HIPAA

- Adds data processor table with BAA status (Standard 6)
- Adds HIPAA rights section (access, correction, restriction, accounting)
- Adds breach notification procedures
- Adds data retention policy (7-year medical records)
- Adds cookie/tracking disclosure
- Adds session timeout documentation"
```

---

### Task 14: Add Sitemap Entry for New Legal Pages

**Files:**
- Modify: `app/sitemap.ts`

- [ ] **Step 1: Read current sitemap**

Read: `app/sitemap.ts`

- [ ] **Step 2: Add provider-credentials to static routes**

Find the array of static pages in the sitemap and add:

```typescript
{
  url: `${siteUrl}/legal/provider-credentials`,
  lastModified: new Date(),
  changeFrequency: 'monthly' as const,
  priority: 0.3,
},
```

- [ ] **Step 3: Commit**

```bash
git add app/sitemap.ts
git commit -m "chore: add provider-credentials page to sitemap"
```

---

### Task 15: Integration Verification

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run 2>&1 | tail -20`
Expected: All tests pass including the 2 new test files.

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit 2>&1 | tail -20`
Expected: No new errors introduced.

- [ ] **Step 3: Run production build**

Run: `npm run build 2>&1 | tail -30`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Visual verification checklist**

Run `npm run dev` and manually verify:
- [ ] Homepage footer shows dispensing pharmacy info
- [ ] Homepage testimonials section shows disclaimer text
- [ ] `/legal/medical-disclaimer` — comprehensive with pharmacy info, FDA disclosure, emergency notice
- [ ] `/legal/privacy` — full HIPAA-compliant policy with data processor table
- [ ] `/legal/provider-credentials` — provider profile and pharmacy info displayed
- [ ] Footer has 4 legal links (Privacy, Terms, Medical Disclaimer, Provider Credentials)

- [ ] **Step 5: Final commit (if any visual fixes needed)**

```bash
git add -A
git commit -m "fix: visual adjustments from integration verification"
```

---

## What This Plan Does NOT Cover (Deferred to Plans B-D)

**Plan B: Legal Page Deep Rewrites**
- Terms of Service comprehensive rewrite (refund policy, auto-renewal, complaint/grievance process, state availability)
- HIPAA Notice of Privacy Practices (separate from privacy policy)
- Shipping & Returns policy page
- Patient Grievance Process page

**Plan C: Claims Audit & Content Cleanup**
- All 12 blog post content audit (`content/blog/*.md`)
- All 6 library article audit (`content/library/*.md`)
- Homepage claim softening (`app/page.tsx`)
- Products page claim updates (`app/products/page.tsx`)
- Therapies page claim updates (`app/therapies/page.tsx`)
- Pricing page disclaimer additions (`app/pricing/page.tsx`)
- Public dosing calculator disclaimers (`app/tools/dosing-calculator/`)
- Stacking guides disclaimers (`app/tools/stacking-guides/`)
- FAQ accuracy review (`app/faq/page.tsx`)
- Product catalog descriptions (all 30 SKUs in `lib/config/product-catalog.ts`)

**Plan D: Technical Privacy & Creator Compliance**
- GA4 conditional loading (exclude from authenticated/PHI pages)
- Cookie consent banner implementation
- Creator portal advertising compliance guidelines
- FTC disclosure template updates
- Creator prohibited claims list
- WHOIS domain registration verification
