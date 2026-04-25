// SEO content for /tools/dosing-calculator.
//
// Single source of truth for FAQ items, HowTo steps, peptide cross-sell, and
// outbound references. Both the visible JSX and the JSON-LD schemas in
// page.tsx import from this file — Google requires schema text to match
// visible text word-for-word for FAQ/HowTo rich-result eligibility.
//
// Edit copy here and both surfaces stay in sync.

export interface CalculatorFaqItem {
  question: string
  answer: string
}

export interface CalculatorHowToStep {
  name: string
  text: string
}

export interface CrossSellPeptide {
  id: string          // preset id from lib/config/calculator-presets.ts
  name: string        // display name
  compound: string    // chemical / generic
  typicalDose: string // human-readable dose summary
  category: string    // grouping label
}

export interface CalculatorReference {
  title: string
  url: string
  source: string
}

// ─────────────────────────────────────────────────────────────────────────
// HowTo — 5 ordered steps. Mirrored into HowTo JSON-LD.
// ─────────────────────────────────────────────────────────────────────────

export const HOW_TO_STEPS: CalculatorHowToStep[] = [
  {
    name: 'Prep a clean workspace',
    text: 'Wash your hands with soap for at least 20 seconds and dry them with a clean towel. Set out your peptide vial, bacteriostatic water vial, an alcohol swab, a U-100 insulin syringe, and a sharps container on a flat surface that has been wiped clean. Letting the vials reach room temperature first reduces the chance of foaming when the diluent meets the powder.',
  },
  {
    name: 'Disinfect both vial septums',
    text: 'Wipe the rubber stopper of the peptide vial and the bacteriostatic water vial with a fresh alcohol swab and let each air-dry for ten seconds. Skipping this step is the most common source of contamination during reconstitution.',
  },
  {
    name: 'Draw the bacteriostatic water',
    text: 'Pull air into your syringe equal to the volume of water you plan to draw, insert the needle into the bacteriostatic water vial, push the air in, then invert the vial and slowly draw the exact volume the calculator above tells you to add. Tap to clear bubbles and push them out before withdrawing the needle.',
  },
  {
    name: 'Inject the diluent slowly',
    text: 'Insert the needle into the peptide vial and aim the bevel toward the inside wall of the glass — not at the powder directly. Depress the plunger slowly so the bacteriostatic water runs down the side and gently dissolves the lyophilized peptide. A fast injection can foam or denature the protein.',
  },
  {
    name: 'Swirl, inspect, verify',
    text: 'Swirl the vial in slow circles for thirty to sixty seconds — do not shake. The solution should look clear and colorless within a minute or two. If you see particulates, cloudiness, or persistent foam, do not inject; consult your provider. Once dissolved, label the vial with the reconstitution date and store in the refrigerator at 36–46°F.',
  },
]

// ─────────────────────────────────────────────────────────────────────────
// FAQ — 12 questions. Mirrored into FAQPage JSON-LD.
// Answers must remain plain strings (no JSX) so visible and schema match.
// ─────────────────────────────────────────────────────────────────────────

export const CALCULATOR_FAQS: CalculatorFaqItem[] = [
  {
    question: 'What is a peptide calculator?',
    answer: 'A peptide calculator is a tool that converts the milligrams of peptide in your vial, the milliliters of bacteriostatic water you add to reconstitute it, and your prescribed dose into the exact volume to draw on a U-100 insulin syringe. Without one, the math is easy to get wrong by an order of magnitude — the difference between dosing 250 micrograms and 2.5 milligrams is a single decimal place.',
  },
  {
    question: 'How much bacteriostatic water do I need for a 5 mg peptide vial?',
    answer: 'Most 5 mg vials are reconstituted with 1 mL, 2 mL, or 3 mL of bacteriostatic water depending on the prescribed dose volume. Adding 2 mL to a 5 mg vial gives you 2.5 mg/mL, so a 250 mcg dose is 0.1 mL — 10 units on a U-100 syringe. The peptide calculator above lets you set vial size and water volume independently and shows the resulting concentration in real time.',
  },
  {
    question: 'How do you calculate peptide dose in units on an insulin syringe?',
    answer: 'A U-100 insulin syringe is graduated so that 100 units equals 1 milliliter. To convert a dose volume in milliliters to units, multiply by 100. A 0.25 mL dose is 25 units; a 0.10 mL dose is 10 units. The visual syringe meter on this page draws the exact fill line for any input combination so you can match the meter to the syringe in your hand.',
  },
  {
    question: 'What is the difference between mcg, mg, and IU for peptides?',
    answer: 'Milligrams (mg) and micrograms (mcg) are units of mass and convert directly: 1 mg equals 1,000 mcg. International Units (IU) are a measure of biological activity and only apply to certain peptides — for most research peptides, IU is not used. The calculator supports mg and mcg input and converts between them automatically; if your prescription is in IU, talk to your provider for the mass-equivalent.',
  },
  {
    question: 'How long does reconstituted peptide last in the refrigerator?',
    answer: 'Most reconstituted peptides remain stable for 28 to 60 days when refrigerated at 36–46°F (2–8°C) in their original sterile vial. Stability varies by compound — Semaglutide and Tirzepatide are typically stable for at least 28 days, while BPC-157 and TB-500 can be stable longer when kept cold. Always follow your pharmacy or provider beyond-use date and inspect for cloudiness or particulates before each injection.',
  },
  {
    question: 'Can I use sterile saline or tap water instead of bacteriostatic water?',
    answer: 'No. Bacteriostatic water contains 0.9% benzyl alcohol that suppresses microbial growth across the multi-day life of the reconstituted vial. Sterile water without a preservative is intended for single-dose use only and will support bacterial contamination once punctured. Tap water is non-sterile and can introduce endotoxins. Always use bacteriostatic water from a licensed pharmacy for any multi-dose peptide vial.',
  },
  {
    question: 'What is the typical BPC-157 dose?',
    answer: 'BPC-157 is most commonly dosed at 250 micrograms (mcg) once or twice daily for soft-tissue and gut-health protocols, with some protocols ranging from 200 to 500 mcg per dose. From a 5 mg vial reconstituted with 3 mL of bacteriostatic water (1.67 mg/mL), a 250 mcg dose is 0.15 mL — 15 units on a U-100 syringe. Always confirm dosing with a licensed provider.',
  },
  {
    question: 'What is a typical Semaglutide starting dose?',
    answer: 'Semaglutide titration usually starts at 0.25 mg weekly for four weeks, then steps up to 0.5 mg, 1.0 mg, 1.7 mg, and finally 2.4 mg weekly as tolerated. From a 5 mg vial reconstituted with 3 mL of bacteriostatic water (1.67 mg/mL), a 0.25 mg starting dose is 0.15 mL — 15 units. Use the calculator above to plan each step of your titration.',
  },
  {
    question: 'Why does my U-100 syringe show 25 units when my dose is 0.25 mg?',
    answer: 'It is a coincidence of the mass-to-volume math at common concentrations, not a one-to-one rule. At 1.0 mg/mL concentration, 0.25 mg = 0.25 mL = 25 units. At 1.67 mg/mL (5 mg vial in 3 mL), 0.25 mg = 0.15 mL = 15 units. Always run the math through a calculator — the milligram number and the unit number only match at exactly 1.0 mg/mL.',
  },
  {
    question: 'Are peptides safe to inject subcutaneously at home?',
    answer: 'Subcutaneous injection of properly compounded peptides under provider supervision is the most common administration route for self-injected protocols. Risks include injection-site reactions, infection if sterile technique is broken, and adverse responses to specific compounds. Peptides should only be sourced from licensed compounding pharmacies, dosed within prescriber guidance, and stored per pharmacy instructions. This calculator is an educational dosing tool and does not replace medical supervision.',
  },
  {
    question: 'Do I need a prescription for peptides?',
    answer: 'In the United States, GLP-1 agonists like Semaglutide and Tirzepatide and most therapeutic peptides require a prescription from a licensed provider. Compounded peptides are dispensed by 503A or 503B compounding pharmacies. Research-grade peptides sold "for research use only" are not regulated for human use and should not be self-administered. CULTR Health connects you with licensed providers who can review your goals, prescribe when appropriate, and supervise your protocol.',
  },
  {
    question: 'Where can I get my peptide protocol reviewed by a provider?',
    answer: 'CULTR Health offers telehealth consultations with licensed providers across 30 U.S. states for GLP-1 weight management, longevity peptides, and hormone optimization protocols. Take the assessment quiz to share your goals, lab history, and current medications, then book a video visit. Your provider reviews the calculator output you bring in and adjusts vial strength, water volume, and titration cadence based on your response.',
  },
]

// ─────────────────────────────────────────────────────────────────────────
// Cross-sell grid — links to the same calculator with a preset preloaded.
// Drives dwell time and indexable preset variants.
// ─────────────────────────────────────────────────────────────────────────

export const CROSS_SELL_PEPTIDES: CrossSellPeptide[] = [
  { id: 'glp1-sema',         name: 'Semaglutide',     compound: 'GLP-1 agonist',                 typicalDose: '0.25–2.4 mg weekly',  category: 'GLP-1' },
  { id: 'glp1-tirz',         name: 'Tirzepatide',     compound: 'GLP-1 / GIP agonist',           typicalDose: '2.5–15 mg weekly',    category: 'GLP-1' },
  { id: 'glp1-r3ta',         name: 'Retatrutide',     compound: 'Triple agonist',                typicalDose: '1–12 mg weekly',      category: 'GLP-1' },
  { id: 'repair-bpc157',     name: 'BPC-157',         compound: 'Body Protection Compound',      typicalDose: '250 mcg 1–2× daily',  category: 'Repair' },
  { id: 'repair-tb500',      name: 'TB-500',          compound: 'Thymosin Beta-4 fragment',      typicalDose: '2.5 mg twice weekly', category: 'Repair' },
  { id: 'repair-ghkcu',      name: 'GHK-Cu',          compound: 'Copper tripeptide',             typicalDose: '1 mg daily',          category: 'Repair' },
  { id: 'repair-glutathione',name: 'Glutathione',     compound: 'Master antioxidant',            typicalDose: '50 mg weekly',        category: 'Repair' },
  { id: 'longevity-nad',     name: 'NAD+',            compound: 'Cellular energy cofactor',      typicalDose: '50 mg daily',         category: 'Longevity' },
  { id: 'growth-sermorelin', name: 'Sermorelin',      compound: 'Growth hormone secretagogue',   typicalDose: '250 mcg nightly',     category: 'Growth' },
  { id: 'blend-cjc-ipa',     name: 'CJC-1295 / Ipamorelin', compound: 'GHRH + GH secretagogue',  typicalDose: '250 mcg nightly',     category: 'Growth' },
  { id: 'blend-tesa-ipa',    name: 'Tesamorelin / Ipamorelin', compound: 'GHRH + GH secretagogue', typicalDose: '300 mcg nightly',   category: 'Growth' },
  { id: 'sexual-pt141',      name: 'PT-141',          compound: 'Bremelanotide',                 typicalDose: '1 mg as needed',      category: 'Sexual Wellness' },
]

// ─────────────────────────────────────────────────────────────────────────
// References — outbound to authoritative agencies. Stable URLs only.
// ─────────────────────────────────────────────────────────────────────────

export const CALCULATOR_REFERENCES: CalculatorReference[] = [
  {
    title: 'FDA — Human Drug Compounding (503A and 503B Pharmacies)',
    url: 'https://www.fda.gov/drugs/human-drug-compounding',
    source: 'U.S. Food & Drug Administration',
  },
  {
    title: 'FDA — Safe Disposal of Used Needles and Other Sharps',
    url: 'https://www.fda.gov/safe-needle-disposal',
    source: 'U.S. Food & Drug Administration',
  },
  {
    title: 'PubMed — Peptide pharmacokinetics and bioavailability research',
    url: 'https://pubmed.ncbi.nlm.nih.gov/?term=peptide+pharmacokinetics',
    source: 'National Library of Medicine (NIH)',
  },
  {
    title: 'PubMed — BPC-157 mechanism and clinical research',
    url: 'https://pubmed.ncbi.nlm.nih.gov/?term=BPC-157',
    source: 'National Library of Medicine (NIH)',
  },
  {
    title: 'PubMed — Semaglutide pharmacology and dosing',
    url: 'https://pubmed.ncbi.nlm.nih.gov/?term=semaglutide+pharmacokinetics',
    source: 'National Library of Medicine (NIH)',
  },
  {
    title: 'USP — Pharmacy Compounding Standards (USP 〈797〉)',
    url: 'https://www.usp.org/compounding',
    source: 'U.S. Pharmacopeia',
  },
]
