// Per-preset static page content for /tools/dosing-calculator/[slug].
//
// Each entry maps a clean URL slug ("bpc-157", "semaglutide", "tb-500") to
// a preset id from lib/config/calculator-presets.ts plus unique page copy:
// title, meta description, intro, worked example, FAQ. Each page must be
// distinct (no duplicate-content penalties) and ranks for its own long-tail
// query — "bpc-157 calculator", "semaglutide reconstitution calculator", etc.
//
// Single source of truth. The [slug]/page.tsx template reads from this file.

export interface PresetPageFaq {
  question: string
  answer: string
}

export interface PresetPageContent {
  /** Clean URL slug — drives both the route and canonical URL. */
  slug: string
  /** Preset id in lib/config/calculator-presets.ts. */
  presetId: string
  /** Display name used in H1 and titles. */
  displayName: string
  /** Compound / generic name shown under the H1 and in copy. */
  compound: string
  /** Category label for breadcrumb / chip. */
  categoryLabel: string
  /** <title> tag — keep under ~60 chars. */
  title: string
  /** <meta name="description"> — 150–250 chars. */
  metaDescription: string
  /** Hero subtitle under the H1. */
  subtitle: string
  /** Intro paragraph below subtitle (1–2 sentences). */
  intro: string
  /** Worked-example box: vial, water, dose, math, result. */
  workedExample: {
    vialMg: number
    waterMl: number
    doseLabel: string
    concentrationMgPerMl: number
    doseMl: number
    units: number
    explanation: string
  }
  /** Per-peptide FAQ — 4 items, distinct from main calculator FAQ. */
  faqs: PresetPageFaq[]
  /** Related peptide slugs to surface in the cross-link block. */
  related: string[]
}

export const PRESET_PAGES: PresetPageContent[] = [
  // ─── GLP-1 ─────────────────────────────────────────────────────────
  {
    slug: 'semaglutide',
    presetId: 'glp1-sema',
    displayName: 'Semaglutide',
    compound: 'GLP-1 receptor agonist',
    categoryLabel: 'GLP-1',
    title: 'Semaglutide Calculator | Reconstitution & Dose Tool',
    metaDescription:
      'Free Semaglutide reconstitution calculator with visual U-100 syringe meter. Calculate exact dose volume for 0.25 mg starter through 2.4 mg titration from any vial size. Built by licensed CULTR Health providers.',
    subtitle: 'Reconstitution math and U-100 syringe units for every titration step',
    intro:
      'Semaglutide is dosed weekly with a four-step titration that starts at 0.25 mg and climbs to 2.4 mg as tolerated. The dose volume changes every step, and the math depends on how much bacteriostatic water you used to reconstitute the vial. This calculator handles both — enter your vial strength, water volume, and the dose your provider prescribed, and the visual U-100 syringe meter draws the exact fill line.',
    workedExample: {
      vialMg: 5,
      waterMl: 3,
      doseLabel: '0.25 mg starting dose',
      concentrationMgPerMl: 1.667,
      doseMl: 0.15,
      units: 15,
      explanation:
        'A 5 mg vial reconstituted with 3 mL of bacteriostatic water yields a concentration of 1.67 mg/mL. The 0.25 mg starting dose works out to 0.15 mL — 15 units on a U-100 insulin syringe. As you titrate up to 0.5 mg, 1.0 mg, 1.7 mg, and 2.4 mg, the unit count scales proportionally: 30, 60, 102, and 144 units respectively.',
    },
    faqs: [
      {
        question: 'What is the typical Semaglutide titration schedule?',
        answer:
          'Standard Semaglutide titration starts at 0.25 mg weekly for four weeks, then steps up monthly to 0.5 mg, 1.0 mg, 1.7 mg, and finally 2.4 mg as the maintenance dose. Some providers extend each step or split doses based on tolerance. Always follow the schedule your prescriber sets.',
      },
      {
        question: 'How much bacteriostatic water do I add to a 5 mg Semaglutide vial?',
        answer:
          'Most patients reconstitute a 5 mg Semaglutide vial with 2 mL or 3 mL of bacteriostatic water. 2 mL gives 2.5 mg/mL and a 0.25 mg starting dose of 0.10 mL (10 units); 3 mL gives 1.67 mg/mL and a 0.25 mg dose of 0.15 mL (15 units). Either is correct — pick the volume that puts your dose in an easy-to-read range on your syringe.',
      },
      {
        question: 'How long does reconstituted Semaglutide last in the refrigerator?',
        answer:
          'Reconstituted Semaglutide is typically stable for 28 days when stored at 36–46°F (2–8°C) in its sterile vial. Always inspect the solution before each injection — discard if you see cloudiness, particulates, or color change, and follow the beyond-use date on your pharmacy label.',
      },
      {
        question: 'Can I use this calculator for compounded Semaglutide?',
        answer:
          'Yes. The math is identical for brand-name and compounded Semaglutide — concentration is mass divided by volume regardless of source. Confirm your vial strength on the pharmacy label and use the calculator above. Compounded Semaglutide must be dispensed by a licensed 503A or 503B pharmacy under a valid prescription.',
      },
    ],
    related: ['tirzepatide'],
  },
  {
    slug: 'tirzepatide',
    presetId: 'glp1-tirz',
    displayName: 'Tirzepatide',
    compound: 'GLP-1 / GIP dual agonist',
    categoryLabel: 'GLP-1',
    title: 'Tirzepatide Calculator | Reconstitution & Dose Tool',
    metaDescription:
      'Free Tirzepatide reconstitution calculator. Compute exact mL and U-100 units for 2.5 mg through 15 mg weekly doses from any vial size and bacteriostatic water volume. Built by licensed CULTR Health providers.',
    subtitle: 'Calculate weekly dose volume and U-100 units for every titration step',
    intro:
      'Tirzepatide is a dual GLP-1 / GIP agonist dosed weekly, starting at 2.5 mg and titrating up monthly to 5, 7.5, 10, 12.5, or 15 mg as tolerated. With six titration steps, the math gets repetitive fast — this calculator handles each step instantly. Enter your vial size and bacteriostatic water volume once, then adjust the dose as you climb the ladder.',
    workedExample: {
      vialMg: 20,
      waterMl: 3,
      doseLabel: '2.5 mg starting dose',
      concentrationMgPerMl: 6.667,
      doseMl: 0.375,
      units: 37.5,
      explanation:
        'A 20 mg Tirzepatide vial reconstituted with 3 mL of bacteriostatic water yields 6.67 mg/mL. A 2.5 mg starting dose is 0.375 mL — about 37 to 38 units on a U-100 syringe. At the 15 mg maintenance dose, you would draw 2.25 mL, which exceeds a single 1 mL syringe — split across multiple injections or reconstitute with a smaller water volume to concentrate.',
    },
    faqs: [
      {
        question: 'What is the standard Tirzepatide titration schedule?',
        answer:
          'Tirzepatide titration starts at 2.5 mg weekly for four weeks, then steps up monthly to 5 mg, 7.5 mg, 10 mg, 12.5 mg, and 15 mg as tolerated. Most patients stop climbing once they hit a maintenance dose where weight loss continues without significant side effects.',
      },
      {
        question: 'Why does my Tirzepatide dose volume seem so large?',
        answer:
          'Tirzepatide is dosed in higher milligram amounts than Semaglutide, so the dose volume is larger at the same concentration. If your dose volume exceeds your syringe size, either reconstitute the vial with less bacteriostatic water (raises concentration, shrinks volume) or split the dose into two injections.',
      },
      {
        question: 'How long does reconstituted Tirzepatide last refrigerated?',
        answer:
          'Reconstituted Tirzepatide is typically stable for 28 days at 36–46°F (2–8°C) in its sterile vial. Compounded Tirzepatide stability may vary — always follow the beyond-use date your pharmacy prints on the label.',
      },
      {
        question: 'Can I switch from Semaglutide to Tirzepatide using this calculator?',
        answer:
          'The calculator handles dose math for either compound, but switching protocols is a clinical decision your provider needs to make. Tirzepatide and Semaglutide are not interchangeable on a milligram basis — dosing equivalents depend on individual response. Talk to your prescriber before switching.',
      },
    ],
    related: ['semaglutide'],
  },

  // ─── Repair ────────────────────────────────────────────────────────
  {
    slug: 'bpc-157',
    presetId: 'repair-bpc157',
    displayName: 'BPC-157',
    compound: 'Body Protection Compound',
    categoryLabel: 'Repair',
    title: 'BPC-157 Calculator | Reconstitution & Dose Tool',
    metaDescription:
      'Free BPC-157 dose calculator with visual U-100 syringe meter. Compute exact mL and units for 250 mcg dosing from any vial size and bacteriostatic water volume. Built by licensed CULTR Health providers.',
    subtitle: 'Reconstitution math and U-100 syringe units for the most common BPC-157 protocols',
    intro:
      'BPC-157 (Body Protection Compound) is a 15-amino-acid peptide commonly dosed at 250 micrograms once or twice daily for tissue repair, gut health, and recovery protocols. The math is straightforward but easy to mis-decimal — a 250 mcg dose and a 2.5 mg dose are an order of magnitude apart. The calculator below converts your vial strength, water volume, and dose into the exact fill line on a U-100 insulin syringe.',
    workedExample: {
      vialMg: 5,
      waterMl: 3,
      doseLabel: '250 mcg dose',
      concentrationMgPerMl: 1.667,
      doseMl: 0.15,
      units: 15,
      explanation:
        'A 5 mg BPC-157 vial reconstituted with 3 mL of bacteriostatic water yields 1.67 mg/mL. A 250 mcg dose is 0.15 mL — 15 units on a U-100 syringe. If you switch to a 10 mg vial reconstituted with the same 3 mL of water, the concentration doubles to 3.33 mg/mL and your 250 mcg dose drops to 0.075 mL (about 7 to 8 units).',
    },
    faqs: [
      {
        question: 'What is the typical BPC-157 dose?',
        answer:
          'BPC-157 is most commonly dosed at 250 micrograms once or twice daily for soft-tissue, joint, and gut-health protocols. Some protocols range from 200 to 500 mcg per dose. Cycles typically run four to eight weeks. Always confirm dosing with a licensed provider.',
      },
      {
        question: 'Should BPC-157 be injected near the injury site?',
        answer:
          'Many BPC-157 protocols call for subcutaneous injection near the area of injury — for example, near a tendon or joint — though systemic subcutaneous injection in the abdomen also produces clinical effects. Your provider will recommend the injection site based on your protocol.',
      },
      {
        question: 'How long does reconstituted BPC-157 last refrigerated?',
        answer:
          'Reconstituted BPC-157 is typically stable for 30 to 60 days when stored refrigerated at 36–46°F (2–8°C) in its original sterile vial. Always inspect for clarity before each injection and follow the beyond-use date on your pharmacy label.',
      },
      {
        question: 'Is BPC-157 FDA-approved?',
        answer:
          'No. BPC-157 is not FDA-approved for any indication and is dispensed only by licensed compounding pharmacies under a valid prescription. Research-grade BPC-157 sold "for research use only" is not regulated for human use and should not be self-administered.',
      },
    ],
    related: ['tb-500', 'ghk-cu', 'glutathione'],
  },
  {
    slug: 'tb-500',
    presetId: 'repair-tb500',
    displayName: 'TB-500',
    compound: 'Thymosin Beta-4 fragment',
    categoryLabel: 'Repair',
    title: 'TB-500 Calculator | Reconstitution & Dose Tool',
    metaDescription:
      'Free TB-500 (Thymosin Beta-4) dose calculator with visual U-100 syringe meter. Compute exact mL and units for 2.5 mg twice-weekly dosing. Built by licensed CULTR Health providers.',
    subtitle: 'Reconstitution math and twice-weekly dose volume for connective-tissue recovery',
    intro:
      'TB-500 is a synthetic fragment of Thymosin Beta-4 commonly dosed at 2.5 mg twice weekly for soft-tissue and connective-tissue recovery protocols. Cycles typically run four to six weeks. Because the dose is in milligrams rather than micrograms, the volume per injection is larger than for BPC-157 — the calculator below shows you the exact mL and U-100 unit count to draw.',
    workedExample: {
      vialMg: 10,
      waterMl: 3,
      doseLabel: '2.5 mg dose',
      concentrationMgPerMl: 3.333,
      doseMl: 0.75,
      units: 75,
      explanation:
        'A 10 mg TB-500 vial reconstituted with 3 mL of bacteriostatic water yields 3.33 mg/mL. A 2.5 mg dose is 0.75 mL — 75 units on a U-100 insulin syringe. This dose fits in a 1 mL syringe but exceeds a 0.5 mL syringe; choose syringe size accordingly.',
    },
    faqs: [
      {
        question: 'What is the typical TB-500 protocol?',
        answer:
          'A common TB-500 loading protocol is 2.5 mg twice weekly for four to six weeks, followed by a maintenance phase of 2.5 mg every other week if continued. Total cycle dosing typically lands between 20 and 40 mg. Always confirm protocol with a licensed provider.',
      },
      {
        question: 'Can I stack TB-500 with BPC-157?',
        answer:
          'TB-500 and BPC-157 are commonly stacked for soft-tissue recovery protocols — TB-500 supports systemic healing while BPC-157 acts more locally. They are typically injected separately (do not mix in one syringe). Your provider will recommend the stack based on your goals.',
      },
      {
        question: 'How long does reconstituted TB-500 last refrigerated?',
        answer:
          'Reconstituted TB-500 is typically stable for 30 to 60 days when stored refrigerated at 36–46°F (2–8°C) in its original sterile vial. Always follow the beyond-use date on your pharmacy label and inspect before injection.',
      },
      {
        question: 'Where should I inject TB-500?',
        answer:
          'TB-500 is typically injected subcutaneously in the abdomen or near the injury site, depending on the protocol. The calculator handles the math; your provider determines the injection site and frequency.',
      },
    ],
    related: ['bpc-157', 'ghk-cu', 'glutathione'],
  },
  {
    slug: 'ghk-cu',
    presetId: 'repair-ghkcu',
    displayName: 'GHK-Cu',
    compound: 'Copper tripeptide',
    categoryLabel: 'Repair',
    title: 'GHK-Cu Calculator | Reconstitution & Dose Tool',
    metaDescription:
      'Free GHK-Cu (Copper tripeptide) dose calculator with visual U-100 syringe meter. Compute exact mL and units for 1 mg daily dosing from any vial size. Built by licensed CULTR Health providers.',
    subtitle: 'Reconstitution math and daily dose volume for skin and tissue remodeling',
    intro:
      'GHK-Cu is a copper-bound tripeptide commonly dosed at 1 mg subcutaneously daily for skin remodeling, hair, and tissue repair protocols. Vials are typically 50 mg, so a single vial lasts roughly 50 days at 1 mg per dose. The calculator below converts your vial size, water volume, and dose into the exact draw line on a U-100 insulin syringe.',
    workedExample: {
      vialMg: 50,
      waterMl: 5,
      doseLabel: '1 mg dose',
      concentrationMgPerMl: 10,
      doseMl: 0.1,
      units: 10,
      explanation:
        'A 50 mg GHK-Cu vial reconstituted with 5 mL of bacteriostatic water yields 10 mg/mL. A 1 mg dose is 0.10 mL — 10 units on a U-100 insulin syringe. The high concentration keeps daily injection volumes small and easy to read on a 0.3 mL or 0.5 mL syringe.',
    },
    faqs: [
      {
        question: 'What is the typical GHK-Cu dose?',
        answer:
          'GHK-Cu is most commonly dosed at 1 mg subcutaneously daily, with cycles typically running six to eight weeks. Some protocols use 1.5 to 2 mg daily for more aggressive tissue remodeling. Always confirm with a licensed provider.',
      },
      {
        question: 'Why is GHK-Cu blue?',
        answer:
          'GHK-Cu is intrinsically blue because of the copper ion bound to the glycyl-histidyl-lysine peptide. Blue color is normal and expected; do not discard a vial because of color. Discard only for cloudiness, particulates, or color change away from clear blue.',
      },
      {
        question: 'Can GHK-Cu be applied topically instead of injected?',
        answer:
          'Yes — GHK-Cu is widely used in cosmetic skincare formulations for topical anti-aging effects. Topical and subcutaneous routes have different bioavailability and clinical applications. The calculator above is for the injectable form.',
      },
      {
        question: 'How long does reconstituted GHK-Cu last refrigerated?',
        answer:
          'Reconstituted GHK-Cu is typically stable for 30 to 60 days when stored refrigerated at 36–46°F (2–8°C). Follow the beyond-use date on your pharmacy label and inspect for changes in clarity or color before each injection.',
      },
    ],
    related: ['bpc-157', 'tb-500', 'glutathione'],
  },
  {
    slug: 'glutathione',
    presetId: 'repair-glutathione',
    displayName: 'Glutathione',
    compound: 'Master antioxidant tripeptide',
    categoryLabel: 'Repair',
    title: 'Glutathione Calculator | Reconstitution & Dose Tool',
    metaDescription:
      'Free Glutathione dose calculator with visual U-100 syringe meter. Compute exact mL and units for 50 mg weekly subcutaneous dosing from any vial size. Built by licensed CULTR Health providers.',
    subtitle: 'Reconstitution math and weekly dose volume for the master antioxidant',
    intro:
      'Glutathione is a tripeptide of cysteine, glycine, and glutamic acid — the body\'s primary intracellular antioxidant. Subcutaneous protocols typically dose 50 mg weekly, though IV and oral routes also exist. Vials are large (often 600 mg) so a single vial lasts 12 weeks at the standard subcutaneous dose. The calculator below handles the math.',
    workedExample: {
      vialMg: 600,
      waterMl: 3,
      doseLabel: '50 mg dose',
      concentrationMgPerMl: 200,
      doseMl: 0.25,
      units: 25,
      explanation:
        'A 600 mg Glutathione vial reconstituted with 3 mL of bacteriostatic water yields 200 mg/mL. A 50 mg subcutaneous dose is 0.25 mL — 25 units on a U-100 insulin syringe. This dose fits comfortably on a 0.3 mL or 0.5 mL syringe.',
    },
    faqs: [
      {
        question: 'What is the typical subcutaneous Glutathione dose?',
        answer:
          'Subcutaneous Glutathione is commonly dosed at 50 mg weekly for antioxidant and detoxification support. IV protocols use higher doses (600–1500 mg). Oral Glutathione has poor bioavailability compared to injection. Always follow your provider\'s prescribed dose.',
      },
      {
        question: 'Why is Glutathione yellow when reconstituted?',
        answer:
          'Reconstituted Glutathione is typically pale yellow to colorless. Slight yellow tint is normal. Discard only if the solution turns dark, cloudy, or develops particulates — those signal oxidation or contamination.',
      },
      {
        question: 'Can Glutathione be stacked with NAD+?',
        answer:
          'Glutathione and NAD+ are commonly used together in longevity and recovery protocols — Glutathione for antioxidant support, NAD+ for cellular energy and repair. They are injected separately (do not mix in one syringe). Your provider will recommend the stack and timing.',
      },
      {
        question: 'How long does reconstituted Glutathione last refrigerated?',
        answer:
          'Reconstituted Glutathione is typically stable for 30 to 60 days refrigerated at 36–46°F (2–8°C), but it is sensitive to oxidation. Store in a dark area of the refrigerator, draw doses quickly, and re-cap the vial promptly.',
      },
    ],
    related: ['nad', 'bpc-157', 'tb-500'],
  },

  // ─── Longevity ─────────────────────────────────────────────────────
  {
    slug: 'nad',
    presetId: 'longevity-nad',
    displayName: 'NAD+',
    compound: 'Nicotinamide Adenine Dinucleotide',
    categoryLabel: 'Longevity',
    title: 'NAD+ Calculator | Reconstitution & Dose Tool',
    metaDescription:
      'Free NAD+ subcutaneous dose calculator with visual U-100 syringe meter. Compute exact mL and units for 50 mg daily dosing from any vial size. Built by licensed CULTR Health providers.',
    subtitle: 'Reconstitution math and daily dose volume for cellular energy support',
    intro:
      'NAD+ (Nicotinamide Adenine Dinucleotide) is a coenzyme central to mitochondrial energy production. Subcutaneous protocols commonly dose 50 mg daily for an eight-week cycle, though IV protocols at much higher doses also exist. Vials are typically large (200 mg) to support multi-week daily dosing. The calculator handles the math instantly.',
    workedExample: {
      vialMg: 200,
      waterMl: 5,
      doseLabel: '50 mg dose',
      concentrationMgPerMl: 40,
      doseMl: 1.25,
      units: 125,
      explanation:
        'A 200 mg NAD+ vial reconstituted with 5 mL of bacteriostatic water yields 40 mg/mL. A 50 mg subcutaneous dose is 1.25 mL — 125 units, which exceeds a 1 mL U-100 syringe. Either reconstitute with less water (raises concentration, shrinks volume) or split the dose into two injections. Reconstituting with 2 mL gives 100 mg/mL and a 50 mg dose of 0.50 mL (50 units).',
    },
    faqs: [
      {
        question: 'What is the typical subcutaneous NAD+ dose?',
        answer:
          'Subcutaneous NAD+ protocols typically dose 50 mg daily for cellular-energy and longevity support, with cycles running 6 to 12 weeks. IV protocols use much higher doses (250–1000 mg) over longer infusion times. Subcutaneous injection often causes localized stinging that fades within minutes.',
      },
      {
        question: 'Why does my NAD+ injection sting?',
        answer:
          'NAD+ is mildly acidic and frequently causes a brief stinging or burning sensation at the injection site. Slowing the injection rate, ensuring the solution is at room temperature, and rotating injection sites help. The sensation typically resolves within a few minutes.',
      },
      {
        question: 'How long does reconstituted NAD+ last refrigerated?',
        answer:
          'Reconstituted NAD+ is typically stable for 30 to 60 days refrigerated at 36–46°F (2–8°C). NAD+ is sensitive to light and heat — store in a dark area of the refrigerator and minimize time at room temperature when drawing doses.',
      },
      {
        question: 'Can NAD+ be stacked with Glutathione?',
        answer:
          'Yes. NAD+ and Glutathione are frequently used together in longevity and recovery protocols. They target complementary pathways (energy production and antioxidant defense) and are typically injected separately (do not mix in one syringe).',
      },
    ],
    related: ['glutathione', 'sermorelin'],
  },

  // ─── Growth ────────────────────────────────────────────────────────
  {
    slug: 'sermorelin',
    presetId: 'growth-sermorelin',
    displayName: 'Sermorelin',
    compound: 'Growth hormone-releasing hormone analog',
    categoryLabel: 'Growth',
    title: 'Sermorelin Calculator | Reconstitution & Dose Tool',
    metaDescription:
      'Free Sermorelin dose calculator with visual U-100 syringe meter. Compute exact mL and units for 250 mcg nightly dosing from any vial size. Built by licensed CULTR Health providers.',
    subtitle: 'Reconstitution math and nightly dose volume for GH secretagogue protocols',
    intro:
      'Sermorelin is a growth-hormone-releasing hormone analog that stimulates the pituitary to produce endogenous growth hormone. Standard protocols dose 250 micrograms subcutaneously at bedtime, leveraging the natural nighttime GH pulse. The calculator below converts your vial size and water volume into the exact draw line for any dose.',
    workedExample: {
      vialMg: 5,
      waterMl: 2,
      doseLabel: '250 mcg dose',
      concentrationMgPerMl: 2.5,
      doseMl: 0.1,
      units: 10,
      explanation:
        'A 5 mg Sermorelin vial reconstituted with 2 mL of bacteriostatic water yields 2.5 mg/mL. A 250 mcg dose is 0.10 mL — 10 units on a U-100 insulin syringe. A 5 mg vial at 250 mcg/day lasts 20 days, so two vials cover a typical month-long cycle.',
    },
    faqs: [
      {
        question: 'When should I inject Sermorelin?',
        answer:
          'Sermorelin is typically injected subcutaneously at bedtime on an empty stomach (no food or carbohydrates within two hours). The timing leverages the natural nighttime growth hormone pulse and avoids insulin-driven blunting of GH release.',
      },
      {
        question: 'How long is a typical Sermorelin cycle?',
        answer:
          'Most Sermorelin protocols run 12 to 24 weeks of nightly dosing, often cycled with breaks. Effects on body composition and recovery typically emerge over 6 to 12 weeks. Always follow your provider\'s specific cycle length.',
      },
      {
        question: 'How does Sermorelin compare to CJC-1295 / Ipamorelin?',
        answer:
          'Sermorelin is a single GHRH analog with a short half-life. CJC-1295 / Ipamorelin combines a longer-acting GHRH analog (CJC-1295) with a GH secretagogue (Ipamorelin) for stronger, more sustained GH release. Your provider will recommend based on goals and tolerance.',
      },
      {
        question: 'How long does reconstituted Sermorelin last refrigerated?',
        answer:
          'Reconstituted Sermorelin is typically stable for 14 to 30 days refrigerated at 36–46°F (2–8°C). Follow the beyond-use date on your pharmacy label and inspect for clarity before each injection.',
      },
    ],
    related: ['cjc-1295-ipamorelin', 'tesamorelin-ipamorelin', 'nad'],
  },

  // ─── Blends ────────────────────────────────────────────────────────
  {
    slug: 'cjc-1295-ipamorelin',
    presetId: 'blend-cjc-ipa',
    displayName: 'CJC-1295 / Ipamorelin',
    compound: 'GHRH analog + GH secretagogue blend',
    categoryLabel: 'Growth',
    title: 'CJC-1295 / Ipamorelin Calculator | Reconstitution Tool',
    metaDescription:
      'Free CJC-1295 / Ipamorelin reconstitution calculator with visual U-100 syringe meter. Compute exact mL and units for 250 mcg nightly dosing of the popular GH-blend protocol.',
    subtitle: 'Reconstitution math for the most popular growth-hormone secretagogue blend',
    intro:
      'CJC-1295 / Ipamorelin is a compounded blend pairing a GHRH analog (CJC-1295 no DAC) with a selective GH secretagogue (Ipamorelin). Standard protocols dose 250 micrograms of the blend subcutaneously at bedtime. Because the vial contains both compounds, the dose volume is calculated against the combined vial mass — the calculator below handles it correctly.',
    workedExample: {
      vialMg: 5,
      waterMl: 3,
      doseLabel: '250 mcg blend dose',
      concentrationMgPerMl: 1.667,
      doseMl: 0.15,
      units: 15,
      explanation:
        'A 5 mg CJC-1295 / Ipamorelin blend vial reconstituted with 3 mL of bacteriostatic water yields 1.67 mg/mL. A 250 mcg dose is 0.15 mL — 15 units on a U-100 insulin syringe. The 5 mg vial at 250 mcg/day lasts 20 days.',
    },
    faqs: [
      {
        question: 'Why is CJC-1295 paired with Ipamorelin?',
        answer:
          'CJC-1295 and Ipamorelin work synergistically: CJC-1295 (a GHRH analog) increases the amplitude of GH pulses while Ipamorelin (a GH secretagogue) increases their frequency. The combination produces a more robust and sustained GH release than either alone.',
      },
      {
        question: 'Should I use CJC-1295 with or without DAC?',
        answer:
          'CJC-1295 without DAC has a short half-life (~30 minutes) and is preferred for nightly bedtime dosing that mimics the natural GH pulse. CJC-1295 with DAC has a multi-day half-life and produces a sustained GH bleed that can desensitize the pituitary. Most blends use the no-DAC version.',
      },
      {
        question: 'When should I inject CJC-1295 / Ipamorelin?',
        answer:
          'Inject subcutaneously at bedtime on an empty stomach (no food or carbs within two hours). The bedtime timing leverages the natural nighttime GH pulse, and the empty stomach prevents insulin from blunting GH release.',
      },
      {
        question: 'How long does reconstituted CJC-1295 / Ipamorelin last refrigerated?',
        answer:
          'Reconstituted blends are typically stable for 30 to 60 days refrigerated at 36–46°F (2–8°C). Follow the beyond-use date on your pharmacy label and inspect for clarity before each injection.',
      },
    ],
    related: ['tesamorelin-ipamorelin', 'sermorelin'],
  },
  {
    slug: 'tesamorelin-ipamorelin',
    presetId: 'blend-tesa-ipa',
    displayName: 'Tesamorelin / Ipamorelin',
    compound: 'GHRH analog + GH secretagogue blend',
    categoryLabel: 'Growth',
    title: 'Tesamorelin / Ipamorelin Calculator | Reconstitution Tool',
    metaDescription:
      'Free Tesamorelin / Ipamorelin reconstitution calculator with visual U-100 syringe meter. Compute exact mL and units for 300 mcg nightly dosing of the visceral-fat-targeted blend.',
    subtitle: 'Reconstitution math for the visceral-fat-targeted GH secretagogue blend',
    intro:
      'Tesamorelin / Ipamorelin is a compounded blend pairing Tesamorelin (a GHRH analog FDA-approved for HIV-associated visceral fat) with Ipamorelin (a selective GH secretagogue). Standard protocols dose 300 micrograms of the blend subcutaneously at bedtime. The calculator below converts your vial size and water volume into the exact draw line.',
    workedExample: {
      vialMg: 7,
      waterMl: 3,
      doseLabel: '300 mcg blend dose',
      concentrationMgPerMl: 2.333,
      doseMl: 0.13,
      units: 13,
      explanation:
        'A 7 mg Tesamorelin / Ipamorelin blend vial reconstituted with 3 mL of bacteriostatic water yields 2.33 mg/mL. A 300 mcg dose is approximately 0.13 mL — about 13 units on a U-100 insulin syringe. The 7 mg vial at 300 mcg/day lasts roughly 23 days.',
    },
    faqs: [
      {
        question: 'How is Tesamorelin / Ipamorelin different from CJC-1295 / Ipamorelin?',
        answer:
          'Tesamorelin is FDA-approved for HIV-associated visceral fat reduction and has clinical evidence specifically for visceral fat loss. CJC-1295 is a research-only GHRH analog with broader recompositional use. Both are paired with Ipamorelin to amplify GH pulses. Your provider will recommend based on goals and clinical context.',
      },
      {
        question: 'When should I inject Tesamorelin / Ipamorelin?',
        answer:
          'Inject subcutaneously at bedtime on an empty stomach. The bedtime timing leverages the natural GH pulse, and the empty stomach prevents insulin-driven blunting of GH release.',
      },
      {
        question: 'How long is a typical Tesamorelin / Ipamorelin cycle?',
        answer:
          'Most protocols run 12 to 24 weeks of nightly dosing, often with breaks between cycles. Visceral fat changes typically emerge over 8 to 12 weeks. Always follow your provider\'s specific cycle length.',
      },
      {
        question: 'How long does reconstituted Tesamorelin / Ipamorelin last refrigerated?',
        answer:
          'Reconstituted blends are typically stable for 14 to 30 days refrigerated at 36–46°F (2–8°C). Tesamorelin in particular is sensitive to degradation — minimize time at room temperature.',
      },
    ],
    related: ['cjc-1295-ipamorelin', 'sermorelin'],
  },

  // ─── Sexual Wellness ───────────────────────────────────────────────
  {
    slug: 'pt-141',
    presetId: 'sexual-pt141',
    displayName: 'PT-141',
    compound: 'Bremelanotide',
    categoryLabel: 'Sexual Wellness',
    title: 'PT-141 Calculator | Bremelanotide Dose Tool',
    metaDescription:
      'Free PT-141 (Bremelanotide) dose calculator with visual U-100 syringe meter. Compute exact mL and units for 1 mg as-needed dosing from any vial size.',
    subtitle: 'Reconstitution math and as-needed dose volume for the libido peptide',
    intro:
      'PT-141 (Bremelanotide) is a melanocortin agonist used for on-demand sexual wellness in both men and women. Standard protocols dose 1 mg subcutaneously 45 to 60 minutes before activity. Because PT-141 is dosed as-needed rather than on a daily schedule, vials last several months at typical use. The calculator below handles the math.',
    workedExample: {
      vialMg: 10,
      waterMl: 2,
      doseLabel: '1 mg dose',
      concentrationMgPerMl: 5,
      doseMl: 0.2,
      units: 20,
      explanation:
        'A 10 mg PT-141 vial reconstituted with 2 mL of bacteriostatic water yields 5 mg/mL. A 1 mg dose is 0.20 mL — 20 units on a U-100 insulin syringe. A 10 mg vial provides 10 doses; some patients start at a lower 0.5 mg dose to test tolerance for nausea.',
    },
    faqs: [
      {
        question: 'When should I inject PT-141?',
        answer:
          'Inject PT-141 subcutaneously 45 to 60 minutes before anticipated sexual activity. Effects typically last 4 to 8 hours. Avoid injecting more than once per 24 hours.',
      },
      {
        question: 'What are common PT-141 side effects?',
        answer:
          'The most common side effect is nausea, especially at higher doses. Flushing, headache, and transient blood pressure increase also occur. Starting at a lower 0.5 mg dose and titrating up helps test tolerance. Avoid PT-141 if you have uncontrolled hypertension or cardiovascular disease.',
      },
      {
        question: 'Is PT-141 FDA-approved?',
        answer:
          'Bremelanotide (the active ingredient in PT-141) is FDA-approved as Vyleesi for premenopausal women with hypoactive sexual desire disorder. Compounded PT-141 for off-label use in men and other contexts is available through licensed compounding pharmacies under prescription.',
      },
      {
        question: 'How long does reconstituted PT-141 last refrigerated?',
        answer:
          'Reconstituted PT-141 is typically stable for 30 to 60 days refrigerated at 36–46°F (2–8°C). Because PT-141 is dosed as-needed, draw doses quickly to minimize warming the rest of the vial.',
      },
    ],
    related: ['oxytocin'],
  },
  {
    slug: 'oxytocin',
    presetId: 'sexual-oxytocin',
    displayName: 'Oxytocin',
    compound: 'Oxytocin',
    categoryLabel: 'Sexual Wellness',
    title: 'Oxytocin Calculator | Reconstitution & Dose Tool',
    metaDescription:
      'Free Oxytocin subcutaneous dose calculator with visual U-100 syringe meter. Compute exact mL and units for the bonding and intimacy peptide from any vial size.',
    subtitle: 'Reconstitution math and dose volume for the bonding peptide',
    intro:
      'Oxytocin is a nine-amino-acid peptide implicated in social bonding, intimacy, and stress response. Subcutaneous protocols dose roughly 20 IU (~40 mcg) as needed. Sublingual and intranasal routes also exist with different bioavailability profiles. The calculator below handles the subcutaneous math; sublingual and intranasal dosing are typically prescribed in compounded liquid form rather than reconstituted vials.',
    workedExample: {
      vialMg: 10,
      waterMl: 5,
      doseLabel: '40 mcg dose',
      concentrationMgPerMl: 2,
      doseMl: 0.02,
      units: 2,
      explanation:
        'A 10 mg Oxytocin vial reconstituted with 5 mL of bacteriostatic water yields 2 mg/mL. A 40 mcg (~20 IU) subcutaneous dose is 0.02 mL — only 2 units on a U-100 insulin syringe. The very small dose volume makes a 0.3 mL syringe with fine graduations essential for accurate draw.',
    },
    faqs: [
      {
        question: 'How is Oxytocin typically dosed?',
        answer:
          'Subcutaneous Oxytocin is typically dosed at 20 IU (~40 mcg) as needed for bonding, intimacy, or anxiety protocols. Sublingual troches and intranasal sprays use different dose forms — those are typically compounded as liquid preparations and don\'t require reconstitution math.',
      },
      {
        question: 'Why is the Oxytocin dose volume so small?',
        answer:
          'Oxytocin is biologically active at very low milligram amounts — a 40 mcg dose is just 0.04 mg. Combined with typical compounded vial concentrations, the injection volume is often less than 0.05 mL. A 0.3 mL U-100 syringe with single-unit graduations is essential for accurate dosing.',
      },
      {
        question: 'Is Oxytocin FDA-approved?',
        answer:
          'Injectable Oxytocin (Pitocin) is FDA-approved for inducing labor and managing postpartum bleeding — different indications from the wellness uses described here. Compounded Oxytocin for off-label wellness protocols is dispensed by licensed compounding pharmacies under prescription.',
      },
      {
        question: 'How long does reconstituted Oxytocin last refrigerated?',
        answer:
          'Reconstituted Oxytocin is typically stable for 14 to 30 days refrigerated at 36–46°F (2–8°C). Oxytocin is sensitive to heat and agitation — store cold and avoid shaking the vial.',
      },
    ],
    related: ['pt-141'],
  },
]

export function getPresetPageBySlug(slug: string): PresetPageContent | null {
  return PRESET_PAGES.find((p) => p.slug === slug) ?? null
}

export function getAllPresetSlugs(): string[] {
  return PRESET_PAGES.map((p) => p.slug)
}
