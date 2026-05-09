# Core Selection Flow & Pricing Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement variable Core therapy pricing with an expandable pricing card, redesign checkout around a 2-month clinical protocol model, and rename Curated to Concierge across the codebase.

**Architecture:** The `CORE_THERAPIES` config drives all pricing logic. The PricingCard component gets local expand/collapse state for the Core slug only. The checkout page reads `?therapy=` search param for Core and computes the 2-month protocol total dynamically. All other files get a text sweep for "Curated" → "Concierge" and "clinical cycle" → "clinical protocol".

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, React state

**Spec:** `docs/superpowers/specs/2026-03-29-core-selection-flow-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `public/images/therapies/semaglutide.png` | Create | Semaglutide vial photo |
| `public/images/therapies/tirzepatide.png` | Create | Tirzepatide vial photo |
| `public/images/therapies/removed-therapy.png` | Create | removed therapy vial photo |
| `lib/config/plans.ts` | Modify | CORE_THERAPIES, plan prices/names/features/disclaimers |
| `components/site/PricingCard.tsx` | Modify | Expand/collapse Core card, therapy selection cards, disclaimer |
| `app/join/[tier]/page.tsx` | Modify | Order summary redesign, consent checkbox, dynamic Core totals |
| `app/pricing/page.tsx` | Modify | Section copy, comparison table, FAQ, microcopy |
| `lib/config/quiz.ts:122` | Modify | Curated → Concierge, price 1099 → 1049 |
| `lib/config/social-proof.ts:53` | Modify | "Curated member" → "Concierge member" |
| `components/site/ComparisonTable.tsx:54` | Modify | "Curated" → "Concierge" |
| `app/faq/page.tsx:145` | Modify | "Curated" → "Concierge" |
| `app/how-it-works/page.tsx:329` | Modify | "Curated" → "Concierge" |
| `app/creators/page.tsx:90` | Modify | "Curated" → "Concierge" |
| `app/creators/portal/resources/page.tsx:93` | Modify | "Curated" → "Concierge" |
| `app/science/page.tsx:202` | Modify | "Curated" → "Concierge" |
| `scripts/generate-media-kit.tsx:252` | Modify | "Curated" → "Concierge", price update |

---

### Task 1: Copy therapy images to public directory

**Files:**
- Create: `public/images/therapies/semaglutide.png`
- Create: `public/images/therapies/tirzepatide.png`
- Create: `public/images/therapies/removed-therapy.png`

- [ ] **Step 1: Create the therapies directory and copy images**

```bash
mkdir -p public/images/therapies
cp ~/Downloads/Semaglutide\ —\ GLP1.png public/images/therapies/semaglutide.png
cp ~/Downloads/Tirzepatide\ —\ GLP1\:GIP.png public/images/therapies/tirzepatide.png
cp ~/Downloads/removed therapy\ —\ GLP1\:GIP\:GCG.png public/images/therapies/removed-therapy.png
```

- [ ] **Step 2: Verify images exist**

```bash
ls -la public/images/therapies/
```

Expected: 3 PNG files present.

- [ ] **Step 3: Commit**

```bash
git add public/images/therapies/
git commit -m "feat: add Core therapy vial images for pricing card"
```

---

### Task 2: Update plan config and add CORE_THERAPIES (`lib/config/plans.ts`)

**Files:**
- Modify: `lib/config/plans.ts`

- [ ] **Step 1: Add CoreTherapy type and CORE_THERAPIES constant**

Add after the `Plan` type definition (after line 38):

```ts
export type CoreTherapy = {
  slug: string;
  name: string;
  price: number;
  image: string;
};

export const CORE_THERAPIES: CoreTherapy[] = [
  { slug: 'semaglutide', name: 'Semaglutide', price: 149, image: '/images/therapies/semaglutide.png' },
  { slug: 'tirzepatide', name: 'Tirzepatide', price: 199, image: '/images/therapies/tirzepatide.png' },
  { slug: 'removed-therapy', name: 'removed therapy', price: 239, image: '/images/therapies/removed-therapy.png' },
];
```

- [ ] **Step 2: Add new optional fields to Plan type**

Add these fields to the `Plan` type (inside the type definition, before the closing `};`):

```ts
  /** Custom price label for display (e.g. "$149*") */
  priceLabel?: string;
  /** Disclaimer shown on pricing card (e.g. "2 month commitment required") */
  cardDisclaimer?: string;
  /** Asterisk or footnote microcopy */
  priceNote?: string;
```

- [ ] **Step 3: Update MEMBERSHIP_DISCLAIMER**

Replace the existing `MEMBERSHIP_DISCLAIMER` constant:

```ts
export const MEMBERSHIP_DISCLAIMER =
  'All paid memberships begin with an initial 2-month clinical protocol. ' +
  'After that, your membership renews month-to-month unless canceled before your next renewal date. ' +
  'Medications, peptides, and products are billed separately at cost. ' +
  'All prescriptions and treatments are subject to medical eligibility and provider approval. ' +
  'Membership does not guarantee any specific treatment or prescription.';
```

- [ ] **Step 4: Update Core plan config**

Replace the Core plan object (the one with `slug: 'core'`):

```ts
  {
    slug: 'core',
    name: 'CULTR Core',
    price: 149,
    interval: 'month',
    tagline: 'Foundational care for members getting started.',
    bestFor: 'GLP-1 focused',
    features: [
      '1 Foundation Therapy',
      'Personalized protocol review',
      'Ongoing provider-guided care',
    ],
    priceLabel: '$149*',
    cardDisclaimer: '2 month commitment required',
    priceNote: '*Starting price. Final monthly amount depends on selected therapy.',
    libraryAccess: {
      masterIndex: 'full',
      advancedProtocols: true,
      dosingCalculators: true,
      stackingGuides: true,
      providerNotes: false,
      customRequests: false,
    },
    stripeProductId: 'prod_TrIUWZzUIZYfIP',
    stripePriceId: 'price_1StZtWC1JUIZB7aRFsP1WVxI',
    paymentLink: 'https://buy.stripe.com/fZu9AS56zeWVbQOc926J208',
    isFeatured: false,
    ctaLabel: 'Learn more',
    bnplEnabled: true,
    consultationsPerMonth: 1,
  },
```

- [ ] **Step 5: Update Catalyst+ plan config**

Replace the Catalyst+ plan object (the one with `slug: 'catalyst'`):

```ts
  {
    slug: 'catalyst',
    name: 'CULTR Catalyst+',
    price: 499,
    interval: 'month',
    tagline: 'Multi-therapy optimization for members who want more customization.',
    bestFor: 'Peptide stacking & optimization',
    features: [
      '1 Foundation Therapy',
      '2 Add-Ons',
      'Personalized protocol review',
      'Ongoing provider-guided care',
    ],
    cardDisclaimer: '2 month commitment required',
    libraryAccess: {
      masterIndex: 'full',
      advancedProtocols: true,
      dosingCalculators: true,
      stackingGuides: true,
      providerNotes: false,
      customRequests: false,
    },
    stripeProductId: 'prod_TrIUf4gB4l9G70',
    stripePriceId: 'price_1StZtYC1JUIZB7aR2nEziKX8',
    paymentLink: 'https://buy.stripe.com/14A6oGfLd1658ECgpi6J20a',
    isFeatured: true,
    ctaLabel: 'Join Catalyst+',
    bnplEnabled: true,
    consultationsPerMonth: 2,
  },
```

- [ ] **Step 6: Update Concierge plan config (rename from Curated)**

Replace the Concierge plan object (the one with `slug: 'concierge'`):

```ts
  {
    slug: 'concierge',
    name: 'CULTR Concierge',
    price: 1049,
    interval: 'month',
    tagline: 'All-inclusive premium care with diagnostics included.',
    bestFor: 'Regenerative & executive care',
    features: [
      '2 Foundation Therapies',
      'Up to 4 Add-Ons',
      'At-home blood test kit included',
      'First doctor visit included',
      'Priority support',
    ],
    cardDisclaimer: '2 month commitment required',
    libraryAccess: {
      masterIndex: 'full',
      advancedProtocols: true,
      dosingCalculators: true,
      stackingGuides: true,
      providerNotes: true,
      customRequests: false,
    },
    stripeProductId: 'prod_TrIUHNyu0DIyUV',
    stripePriceId: 'price_1StZtYC1JUIZB7aR9gTXMWjK',
    paymentLink: 'https://buy.stripe.com/9B6dR8aqTaGF1ca8WQ6J20b',
    isFeatured: false,
    ctaLabel: 'Join Concierge',
    bnplEnabled: true,
    consultationsPerMonth: Infinity,
  },
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit --pretty 2>&1 | head -30
```

Expected: No errors related to `plans.ts`.

- [ ] **Step 8: Commit**

```bash
git add lib/config/plans.ts
git commit -m "feat: add CORE_THERAPIES, rename Curated to Concierge, update pricing"
```

---

### Task 3: Update PricingCard with expand/collapse and therapy selection

**Files:**
- Modify: `components/site/PricingCard.tsx`

- [ ] **Step 1: Rewrite PricingCard.tsx**

Replace the entire file with the following. The component adds:
- Local `isExpanded` state (Core only)
- Therapy cards with images inside the expanded area
- `cardDisclaimer` and `priceNote` display
- `priceLabel` override for price display
- "Learn more" / "Show less" toggle for Core
- "Select [Therapy] →" CTAs linking to `/join/core?therapy=[slug]`

```tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { BNPLBadge } from '@/components/payments/BNPLBadge';
import BiomarkerExplainerLink from '@/components/site/BiomarkerExplainer';
import { CORE_THERAPIES } from '@/lib/config/plans';
import { brandify } from '@/lib/utils';

interface PlanProps {
  slug: string;
  name: string;
  price: number;
  interval: string;
  tagline: string;
  features: string[];
  coreProducts?: string[];
  stripePriceId: string;
  paymentLink: string;
  isFeatured?: boolean;
  ctaLabel: string;
  bnplEnabled?: boolean;
  priceLabel?: string;
  cardDisclaimer?: string;
  priceNote?: string;
}

export function PricingCard({ plan }: { plan: PlanProps }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isCore = plan.slug === 'core';

  return (
    <div className={`
      p-8 rounded-[24px] flex flex-col h-full transition-all duration-300 ease-out group
      ${plan.isFeatured
        ? 'grad-dark-glow text-white shadow-lux-lg hover:scale-[1.03]'
        : 'glass-card hover:-translate-y-1'
      }
    `}>
      {plan.isFeatured && (
        <span className="text-cultr-sage text-xs font-display font-bold tracking-widest uppercase mb-4 block animate-pulse-slow">Most Popular</span>
      )}
      <h3 className={`text-2xl font-display font-bold mb-2 transition-transform duration-300 group-hover:translate-x-0.5 ${plan.isFeatured ? 'text-white' : 'text-cultr-text'}`}>{brandify(plan.name)}</h3>
      <div className="flex items-baseline gap-1 mb-1">
        {plan.priceLabel ? (
          <span className={`text-4xl font-bold transition-transform duration-300 group-hover:scale-105 origin-left ${plan.isFeatured ? 'text-white' : 'text-cultr-forest'}`}>
            {plan.priceLabel}
          </span>
        ) : (
          <>
            <span className={`text-4xl font-bold transition-transform duration-300 group-hover:scale-105 origin-left ${plan.isFeatured ? 'text-white' : 'text-cultr-forest'}`}>${plan.price}</span>
            <span className={`text-sm ${plan.isFeatured ? 'text-white/70' : 'text-cultr-textMuted'}`}>/{plan.interval}</span>
          </>
        )}
      </div>
      {plan.priceNote && (
        <p className={`text-[11px] mb-2 ${plan.isFeatured ? 'text-white/50' : 'text-cultr-textMuted/70'}`}>
          {plan.priceNote}
        </p>
      )}
      <p className={`text-sm mb-2 min-h-[40px] ${plan.isFeatured ? 'text-white/80' : 'text-cultr-textMuted'}`}>{plan.tagline}</p>
      {plan.bnplEnabled && !isCore && (
        <BNPLBadge
          priceUsd={plan.price}
          className={`mb-4 ${plan.isFeatured ? '!text-white/60' : ''}`}
        />
      )}

      <div className="flex-grow mb-6">
        <ul className="space-y-4">
          {plan.features.map((feature, i) => {
            const isLabFeature = /lab test|blood test/i.test(feature);
            return (
              <li
                key={i}
                className={`flex items-start gap-3 text-sm transition-all duration-300 ${plan.isFeatured ? 'text-white/90' : 'text-cultr-textMuted'}`}
                style={{ transitionDelay: `${i * 30}ms` }}
              >
                <Check className={`w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${plan.isFeatured ? 'text-cultr-sage' : 'text-cultr-forest'}`} />
                <span>
                  {feature}
                  {isLabFeature && (
                    <>
                      {' '}
                      <BiomarkerExplainerLink
                        label="See what we test ›"
                        className={plan.isFeatured ? '!text-cultr-sage hover:!text-white !decoration-cultr-sage/50' : ''}
                      />
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Core: Expandable therapy selection */}
      {isCore && (
        <>
          <div
            className={`overflow-hidden transition-all duration-400 ease-out ${
              isExpanded ? 'max-h-[600px] opacity-100 mb-6' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="border-t border-cultr-sage/50 pt-5 mt-2 space-y-3">
              <p className="text-xs font-bold text-cultr-forest tracking-widest uppercase mb-3">
                Choose your therapy
              </p>
              {CORE_THERAPIES.map((therapy) => (
                <Link
                  key={therapy.slug}
                  href={`/join/core?therapy=${therapy.slug}`}
                  className="flex items-center gap-4 p-3 rounded-xl border border-cultr-sage/50 hover:border-cultr-forest hover:bg-cultr-mint/30 transition-all duration-200 group/therapy"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 relative shrink-0 rounded-lg overflow-hidden bg-cultr-offwhite">
                    <Image
                      src={therapy.image}
                      alt={therapy.name}
                      fill
                      className="object-contain p-1"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-cultr-text text-sm">{therapy.name}</p>
                    <p className="text-cultr-forest font-bold text-sm">${therapy.price}/month</p>
                  </div>
                  <span className="text-xs text-cultr-forest font-medium opacity-0 group-hover/therapy:opacity-100 transition-opacity shrink-0">
                    Select →
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-3 rounded-full border border-cultr-sage text-cultr-forest font-medium text-sm hover:bg-cultr-mint/30 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isExpanded ? 'Show less' : plan.ctaLabel}
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </>
      )}

      {/* Non-Core: Direct checkout link */}
      {!isCore && (
        <Link href={`/join/${plan.slug}`} className="w-full">
          <Button
            variant={plan.isFeatured ? 'secondary' : 'primary'}
            className={`w-full ${plan.isFeatured ? 'text-white border-white/50 hover:bg-white/10 hover:border-white/70' : ''}`}
          >
            {plan.ctaLabel}
          </Button>
        </Link>
      )}

      {/* Disclaimer */}
      {plan.cardDisclaimer && (
        <p className={`text-[11px] text-center mt-3 ${plan.isFeatured ? 'text-white/40' : 'text-cultr-textMuted/60'}`}>
          {plan.cardDisclaimer}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the component renders (dev server)**

```bash
npm run dev
```

Open `http://localhost:3000/pricing` in browser. Verify:
- Core card shows `$149*` with asterisk microcopy
- "Learn more" button expands to show 3 therapy cards with vial images
- Each therapy card shows name and price
- Hovering a therapy card shows "Select →"
- Clicking routes to `/join/core?therapy=semaglutide` (etc.)
- Catalyst+ and Concierge cards show direct checkout CTAs
- All cards show "2 month commitment required" disclaimer
- No blood test / doctor visit amounts on any card

- [ ] **Step 3: Commit**

```bash
git add components/site/PricingCard.tsx
git commit -m "feat: expandable Core pricing card with therapy selection"
```

---

### Task 4: Redesign checkout page (`app/join/[tier]/page.tsx`)

**Files:**
- Modify: `app/join/[tier]/page.tsx`

- [ ] **Step 1: Add therapy param reading and order summary logic**

At the top of the `JoinPage` component (after `const plan = PLANS.find(...)` on line 265), add:

```tsx
import { CORE_THERAPIES, BLOOD_TEST_ADDON, DOCTOR_CONSULTATION_ADDON } from '@/lib/config/plans';
import { useSearchParams } from 'next/navigation';
```

Inside the component, after the plan lookup:

```tsx
  const searchParams = useSearchParams();
  const therapySlug = searchParams.get('therapy');

  // Core requires a therapy selection
  const coreTherapy = plan?.slug === 'core' && therapySlug
    ? CORE_THERAPIES.find(t => t.slug === therapySlug)
    : null;

  // Redirect if Core without therapy
  if (plan?.slug === 'core' && !coreTherapy) {
    router.push('/pricing');
    return null;
  }

  // Compute checkout pricing
  const monthlyPrice = plan?.slug === 'core' && coreTherapy ? coreTherapy.price : plan!.price;
  const twoMonthCost = monthlyPrice * 2;
  const isConcierge = plan?.slug === 'concierge';
  const labsCost = isConcierge ? 0 : BLOOD_TEST_ADDON.price;
  const doctorCost = isConcierge ? 0 : DOCTOR_CONSULTATION_ADDON.price;
  const todayTotal = twoMonthCost + labsCost + doctorCost;
```

- [ ] **Step 2: Add consent checkbox state**

Add state variables near the top of the component:

```tsx
  const [consentChecked, setConsentChecked] = useState(false);
  const [marketingChecked, setMarketingChecked] = useState(false);
```

- [ ] **Step 3: Replace the hero section**

Replace the hero section (the `<section className="py-16 px-6 grad-dark text-white">` block) with:

```tsx
      {/* Hero */}
      <section className="py-16 px-6 grad-dark text-white">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block text-xs font-bold text-cultr-sage tracking-widest mb-4">
            YOUR INITIAL 2-MONTH CLINICAL PROTOCOL
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            {plan.slug === 'core' && coreTherapy
              ? `${plan.name} with ${coreTherapy.name}`
              : plan.name}
          </h1>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-5xl font-bold">${monthlyPrice}</span>
            <span className="text-white/70">/ month</span>
          </div>
        </div>
      </section>
```

- [ ] **Step 4: Replace the "First-Time Fees" block with order summary**

Replace the entire `{/* One-Time Fees Summary */}` block (lines 504-546) with:

```tsx
            {/* Order Summary — Initial 2-Month Protocol */}
            {plan.price > 0 && (
              <div className="bg-cultr-offwhite rounded-xl p-6 mb-8 border border-cultr-sage/30">
                <p className="text-xs font-bold text-cultr-forest tracking-widest uppercase mb-4">
                  Your initial 2-month clinical protocol
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-cultr-text">
                      {plan.slug === 'core' && coreTherapy
                        ? `CULTR Core with ${coreTherapy.name} (2 months)`
                        : `${plan.name} membership (2 months)`}
                    </span>
                    <span className="text-sm font-medium text-cultr-forest">${twoMonthCost.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-cultr-text">At-home blood test kit</span>
                    <span className="text-sm font-medium text-cultr-forest">
                      {isConcierge ? 'included' : `$${BLOOD_TEST_ADDON.price}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-cultr-text">First doctor visit</span>
                    <span className="text-sm font-medium text-cultr-forest">
                      {isConcierge ? 'included' : `$${DOCTOR_CONSULTATION_ADDON.price}`}
                    </span>
                  </div>
                  <div className="border-t border-cultr-sage/30 pt-3 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-cultr-text">Today&apos;s total</span>
                      <span className="text-lg font-bold text-cultr-forest">${todayTotal.toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-cultr-textMuted mt-2">
                    Renews at ${monthlyPrice}/month after your initial 2-month protocol unless canceled before your next renewal date.
                  </p>
                </div>
              </div>
            )}
```

- [ ] **Step 5: Add consent checkboxes above payment section**

Add this block just before the `{/* Payment Method Selector */}` section (before line 549):

```tsx
            {/* Consent Checkboxes */}
            <div className="space-y-4 mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-cultr-sage text-cultr-forest focus:ring-cultr-forest/20 shrink-0"
                />
                <span className="text-xs text-cultr-textMuted leading-relaxed">
                  I understand that I am enrolling in an initial 2-month membership protocol and will be charged the total shown at checkout. After my initial protocol, my membership will renew monthly at the rate shown unless I cancel before my next renewal date.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingChecked}
                  onChange={(e) => setMarketingChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-cultr-sage text-cultr-forest focus:ring-cultr-forest/20 shrink-0"
                />
                <span className="text-xs text-cultr-textMuted leading-relaxed">
                  I&apos;d like to receive updates, offers, and educational content from CULTR Health.
                </span>
              </label>
            </div>
```

- [ ] **Step 6: Update the submit button text**

In the `CheckoutForm` component, replace the submit button IIFE that computes `addons` and `total` with:

```tsx
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Start my protocol — $${todayTotal.toLocaleString()} today`
        )}
```

Note: `todayTotal` must be passed to `CheckoutForm` as a prop. Add `todayTotal: number` to its props and pass it from the parent: `<CheckoutForm plan={plan} todayTotal={todayTotal} onSuccess={...} onError={...} />`.

Also add `disabled={!consentChecked}` to the submit button (pass `consentChecked` as a prop too).

- [ ] **Step 7: Disable all payment submit buttons when consent unchecked**

For each payment method section (Stripe, Klarna, Affirm, CorePay, NOWPayments), add `disabled={!consentChecked}` to their submit/continue buttons.

- [ ] **Step 8: Verify checkout renders correctly**

Open `http://localhost:3000/join/core?therapy=semaglutide` and verify:
- Hero shows "CULTR Core with Semaglutide" and "$149/month"
- Order summary: $298 + $135 + $75 = $508
- Consent checkbox blocks payment until checked
- Submit button shows "Start my protocol — $508 today"

Also verify:
- `/join/core?therapy=tirzepatide` → $608
- `/join/core?therapy=removed-therapy` → $688
- `/join/catalyst` → $1,208
- `/join/concierge` → $2,098 (blood test + doctor "included")
- `/join/core` (no therapy param) → redirects to `/pricing`

- [ ] **Step 9: Commit**

```bash
git add app/join/[tier]/page.tsx
git commit -m "feat: checkout redesign with 2-month protocol, consent, dynamic Core totals"
```

---

### Task 5: Update pricing page copy, tables, and FAQ (`app/pricing/page.tsx`)

**Files:**
- Modify: `app/pricing/page.tsx`

- [ ] **Step 1: Update section headline and subhead**

Replace the content inside the `<ScrollReveal className="text-center mb-16">` block (lines 83-92):

```tsx
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
              Transparent pricing built around an initial 2-month clinical protocol.
            </h2>
            <p className="text-cultr-textMuted max-w-2xl mx-auto mb-4">
              Choose the membership that matches your goals. All paid plans begin with a 2-month starting protocol so your provider has enough time to evaluate your labs, personalize your protocol, and adjust care when appropriate.
            </p>
            <Link href="/quiz" className="text-sm text-cultr-forest font-medium hover:underline">
              Not sure which plan? Take the quiz →
            </Link>
          </ScrollReveal>
```

- [ ] **Step 2: Add global microcopy below pricing cards**

After the closing `</div>` of the `grid md:grid-cols-3` div (after line 107), add:

```tsx
          {/* Global Microcopy */}
          <div className="mt-10 text-center space-y-2 max-w-2xl mx-auto">
            <p className="text-xs text-cultr-textMuted leading-relaxed">
              All paid memberships begin with an initial 2-month clinical protocol. After that, your membership renews month-to-month unless canceled before your next renewal date.
            </p>
            <p className="text-xs text-cultr-textMuted/70 leading-relaxed">
              Medication, protocol eligibility, and refills are subject to clinical review and approval.
            </p>
          </div>
```

- [ ] **Step 3: Update comparison table**

Replace "Curated" with "Concierge" in the comparison table header (line 160). Update the data array:

```tsx
                  {[
                    { feature: 'Monthly Price', values: ['$149*', '$499', '$1,049'] },
                    { feature: 'At Home Lab Test', values: ['$135', '$135', 'Included'], hasBiomarkerLink: true },
                    { feature: 'Physician Follow-up', values: ['Every 6 months', 'Every 6 months', 'Every 6 months'] },
                    { feature: 'Foundation Therapies', values: ['1', '1', '2'] },
                    { feature: 'Add-On Therapies', values: ['—', '2', 'Up to 4'] },
                    { feature: 'Protocol Library', values: [true, true, true] },
                    { feature: 'Peptide Calculator', values: [true, true, true] },
                    { feature: 'Member Shop Access', values: [false, true, 'VIP'] },
                  ].map((row, i) => (
```

- [ ] **Step 4: Update therapy unlock matrix header**

Replace "Curated" with "Concierge" in the therapy unlock table header (line 251).

- [ ] **Step 5: Replace FAQ entries**

Replace the entire `FAQAccordion items` array (lines 349-374):

```tsx
          <FAQAccordion items={[
            {
              question: 'Why do memberships start with a 2-month clinical protocol?',
              answer: 'Our memberships begin with a 2-month starting protocol so your provider has enough time to review your intake, assess labs when needed, personalize your protocol, and evaluate your response before ongoing month-to-month care.',
            },
            {
              question: 'Am I charged monthly or all at once?',
              answer: 'We display pricing as a monthly rate for easy comparison. Your initial purchase covers your first 2-month clinical protocol. After that, your membership renews monthly at your plan rate unless canceled.',
            },
            {
              question: 'Can I cancel?',
              answer: 'You can cancel future renewals anytime before your next renewal date. Your initial 2-month clinical protocol is the minimum starting term for paid memberships.',
            },
            {
              question: 'Why is there an asterisk next to Core pricing?',
              answer: brandify('CULTR Core starts at $149 per month, and the exact price depends on the selected therapy option.'),
            },
            {
              question: 'Are medications guaranteed?',
              answer: 'No. Treatment recommendations, prescriptions, and refills are always subject to provider review, clinical appropriateness, and applicable pharmacy and state requirements.',
            },
            {
              question: 'Can I use HSA/FSA funds?',
              answer: brandify('Yes! CULTR memberships are HSA/FSA eligible. We provide all necessary documentation for reimbursement from your health savings account.'),
            },
          ]} />
```

- [ ] **Step 6: Verify pricing page renders**

Open `http://localhost:3000/pricing` and verify:
- Section headline uses "2-month clinical protocol" language
- Global microcopy appears below plan cards
- Comparison table shows "Concierge" header, "$149*", "$1,049", "Included" for Concierge lab
- Therapy unlock matrix shows "Concierge"
- FAQ has 6 new entries with correct answers
- No "cancel anytime" in FAQ without clarification

- [ ] **Step 7: Commit**

```bash
git add app/pricing/page.tsx
git commit -m "feat: pricing page copy, tables, FAQ updated for 2-month protocol model"
```

---

### Task 6: Global "Curated" → "Concierge" text sweep

**Files:**
- Modify: `lib/config/quiz.ts:122`
- Modify: `lib/config/social-proof.ts:53`
- Modify: `components/site/ComparisonTable.tsx:54`
- Modify: `app/faq/page.tsx:145`
- Modify: `app/how-it-works/page.tsx:329`
- Modify: `app/creators/page.tsx:90`
- Modify: `app/creators/portal/resources/page.tsx:93`
- Modify: `app/science/page.tsx:202`
- Modify: `scripts/generate-media-kit.tsx:252`

- [ ] **Step 1: Update quiz.ts**

In `lib/config/quiz.ts`, line 122, change:
```ts
  concierge: { name: 'CULTR Curated', price: 1099 },
```
to:
```ts
  concierge: { name: 'CULTR Concierge', price: 1049 },
```

- [ ] **Step 2: Update social-proof.ts**

In `lib/config/social-proof.ts`, line 53, change:
```ts
    title: "Curated member, 10 months",
```
to:
```ts
    title: "Concierge member, 10 months",
```

- [ ] **Step 3: Update ComparisonTable.tsx**

In `components/site/ComparisonTable.tsx`, line 54, change:
```ts
    priority: 'Curated',
```
to:
```ts
    priority: 'Concierge',
```

- [ ] **Step 4: Update faq/page.tsx**

In `app/faq/page.tsx`, line 145, change:
```
Curated and Club members
```
to:
```
Concierge members
```

- [ ] **Step 5: Update how-it-works/page.tsx**

In `app/how-it-works/page.tsx`, line 329, change:
```
Curated and Club members
```
to:
```
Concierge members
```

- [ ] **Step 6: Update creators/page.tsx**

In `app/creators/page.tsx`, line 90, change:
```
Core, Catalyst+, or Curated
```
to:
```
Core, Catalyst+, or Concierge
```

- [ ] **Step 7: Update creators/portal/resources/page.tsx**

In `app/creators/portal/resources/page.tsx`, line 93, change:
```
Core, Catalyst+, and Curated explained
```
to:
```
Core, Catalyst+, and Concierge explained
```

- [ ] **Step 8: Update science/page.tsx**

In `app/science/page.tsx`, line 202, change:
```
Curated reading paths
```
to:
```
Concierge reading paths
```

- [ ] **Step 9: Update generate-media-kit.tsx**

In `scripts/generate-media-kit.tsx`, line 252, change:
```ts
{ name: 'Curated', price: '$1,099', interval: '/mo', best: 'White-glove care', featured: false },
```
to:
```ts
{ name: 'Concierge', price: '$1,049', interval: '/mo', best: 'White-glove care', featured: false },
```

- [ ] **Step 10: Verify no "Curated" references remain**

```bash
grep -r "Curated" --include="*.ts" --include="*.tsx" . | grep -v node_modules | grep -v .next | grep -v CHANGELOG | grep -v docs/
```

Expected: No results (only CHANGELOG or docs may contain historical references).

- [ ] **Step 11: Commit**

```bash
git add lib/config/quiz.ts lib/config/social-proof.ts components/site/ComparisonTable.tsx app/faq/page.tsx app/how-it-works/page.tsx app/creators/page.tsx app/creators/portal/resources/page.tsx app/science/page.tsx scripts/generate-media-kit.tsx
git commit -m "fix: rename all Curated references to Concierge across codebase"
```

---

### Task 7: Update creator resource files with "cancel anytime" clarification

**Files:**
- Modify: `app/creators/portal/resources/_data/offer-programs.tsx:240`
- Modify: `app/creators/portal/resources/_data/sales-funnel.tsx:153`
- Modify: `app/creators/portal/resources/_data/compliance.tsx:96`
- Modify: `app/creators/portal/resources/_data/product-education.tsx:206`

- [ ] **Step 1: Update offer-programs.tsx**

Line 240, change:
```
'Mention "month-to-month, cancel anytime" to reduce commitment anxiety',
```
to:
```
'Mention "cancel future renewals anytime before your next renewal date" to reduce commitment anxiety',
```

- [ ] **Step 2: Update sales-funnel.tsx**

Line 153, change:
```
ADDITIONAL: "HSA/FSA eligible. Month-to-month. Cancel anytime."
```
to:
```
ADDITIONAL: "HSA/FSA eligible. Renews month-to-month after initial 2-month protocol."
```

- [ ] **Step 3: Update compliance.tsx**

Line 96, change:
```
✅ "Month-to-month, cancel anytime"
```
to:
```
✅ "Renews month-to-month after initial protocol. Cancel before next renewal date."
```

- [ ] **Step 4: Update product-education.tsx**

Line 206, change:
```
'Month-to-month, cancel anytime — no long-term contracts',
```
to:
```
'Renews month-to-month after initial 2-month protocol — cancel before next renewal date',
```

- [ ] **Step 5: Commit**

```bash
git add app/creators/portal/resources/_data/
git commit -m "fix: update cancel anytime language in creator resources to match protocol model"
```

---

### Task 8: Final verification

- [ ] **Step 1: TypeScript check**

```bash
npx tsc --noEmit --pretty
```

Expected: No errors.

- [ ] **Step 2: Run existing tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 3: Full text sweep verification**

```bash
grep -r "Curated" --include="*.ts" --include="*.tsx" . | grep -v node_modules | grep -v .next | grep -v CHANGELOG | grep -v docs/
grep -r "clinical cycle" --include="*.ts" --include="*.tsx" . | grep -v node_modules | grep -v .next
grep -r "1,099\|1099" --include="*.ts" --include="*.tsx" . | grep -v node_modules | grep -v .next | grep -v CHANGELOG | grep -v stripe
```

Expected: No remaining "Curated" (except historical), no "clinical cycle", no "$1,099" pricing (now $1,049).

- [ ] **Step 4: Visual verification checklist**

Open in browser and check:
- [ ] `/pricing` — Core shows $149*, expands with 3 therapies, Catalyst+ $499, Concierge $1,049
- [ ] `/pricing` — Comparison table: Concierge header, $149*, Included for Concierge labs
- [ ] `/pricing` — FAQ: 6 new entries, no bare "cancel anytime"
- [ ] `/join/core?therapy=semaglutide` — Total $508
- [ ] `/join/core?therapy=tirzepatide` — Total $608
- [ ] `/join/core?therapy=removed-therapy` — Total $688
- [ ] `/join/catalyst` — Total $1,208
- [ ] `/join/concierge` — Total $2,098, labs+doctor "included"
- [ ] `/join/core` (no therapy) — Redirects to /pricing
- [ ] Homepage pricing preview — Same PricingCard behavior
- [ ] Mobile — Core expand/collapse works, therapy cards stack vertically
