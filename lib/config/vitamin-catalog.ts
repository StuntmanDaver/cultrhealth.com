// ============================================================
// Vitamin & Supplement Product Catalog
// ============================================================

import type { LucideIcon } from 'lucide-react'
import {
  Sun,
  Gem,
  Waves,
  FlaskConical,
  Leaf,
  Sprout,
  Dna,
  HeartPulse,
  Zap,
  TreeDeciduous,
} from 'lucide-react'

// ============================================================
// Types
// ============================================================

export type VitaminCategory =
  | 'vitamins'
  | 'minerals'
  | 'marine_plants'
  | 'nutraceuticals'
  | 'whole_food'
  | 'herbs'
  | 'amino_acids'
  | 'probiotics'
  | 'enzymes'
  | 'functional_mushrooms'

export interface VitaminProduct {
  id: string
  name: string
  category: VitaminCategory
  benefits: string
  isNew?: boolean
  grownInUSA?: boolean
}

export interface VitaminCategoryStyle {
  displayName: string
  gradient: string
  iconBg: string
  Icon: LucideIcon
}

// ============================================================
// Category styling (gradient + icon for placeholder cards)
// ============================================================

export const VITAMIN_CATEGORY_STYLES: Record<VitaminCategory, VitaminCategoryStyle> = {
  vitamins: {
    displayName: 'Vitamins',
    gradient: 'from-amber-200 to-orange-200',
    iconBg: 'bg-amber-400/30',
    Icon: Sun,
  },
  minerals: {
    displayName: 'Minerals',
    gradient: 'from-slate-200 to-zinc-300',
    iconBg: 'bg-slate-400/30',
    Icon: Gem,
  },
  marine_plants: {
    displayName: 'Marine Plants',
    gradient: 'from-cyan-200 to-teal-200',
    iconBg: 'bg-cyan-400/30',
    Icon: Waves,
  },
  nutraceuticals: {
    displayName: 'Nutraceuticals',
    gradient: 'from-violet-200 to-purple-200',
    iconBg: 'bg-violet-400/30',
    Icon: FlaskConical,
  },
  whole_food: {
    displayName: 'Whole Food Ingredients',
    gradient: 'from-lime-200 to-green-200',
    iconBg: 'bg-lime-400/30',
    Icon: Leaf,
  },
  herbs: {
    displayName: 'Herbs',
    gradient: 'from-emerald-200 to-green-200',
    iconBg: 'bg-emerald-400/30',
    Icon: Sprout,
  },
  amino_acids: {
    displayName: 'Amino Acids',
    gradient: 'from-blue-200 to-indigo-200',
    iconBg: 'bg-blue-400/30',
    Icon: Dna,
  },
  probiotics: {
    displayName: 'Probiotics',
    gradient: 'from-pink-200 to-rose-200',
    iconBg: 'bg-pink-400/30',
    Icon: HeartPulse,
  },
  enzymes: {
    displayName: 'Enzymes',
    gradient: 'from-yellow-200 to-amber-200',
    iconBg: 'bg-yellow-400/30',
    Icon: Zap,
  },
  functional_mushrooms: {
    displayName: 'Functional Mushrooms',
    gradient: 'from-orange-200 to-amber-300',
    iconBg: 'bg-orange-400/30',
    Icon: TreeDeciduous,
  },
}

// ============================================================
// Product catalog (~250+ products)
// ============================================================

export const VITAMIN_CATALOG: VitaminProduct[] = [
  // ── Vitamins (30) ──────────────────────────────────────────
  { id: 'vit-a-acetate', name: 'Vitamin A (Acetate)', category: 'vitamins', benefits: 'Supports healthy vision and immune function. Essential for skin cell turnover and tissue repair.' },
  { id: 'vit-a-retinyl', name: 'Vitamin A (Retinyl Palmitate)', category: 'vitamins', benefits: 'Highly bioavailable form of vitamin A for vision, immune health, and cellular growth.' },
  { id: 'vit-a-beta-carotene', name: 'Vitamin A (Beta Carotene)', category: 'vitamins', benefits: 'Plant-derived provitamin A with antioxidant properties. Body converts to active vitamin A as needed.' },
  { id: 'vit-b1-thiamine', name: 'Vitamin B1 (Thiamine HCl)', category: 'vitamins', benefits: 'Critical for energy metabolism and nervous system function. Supports carbohydrate conversion to fuel.' },
  { id: 'vit-b1-benfotiamine', name: 'Vitamin B1 (Benfotiamine)', category: 'vitamins', benefits: 'Fat-soluble form of thiamine with superior bioavailability. Protects against advanced glycation end products.' },
  { id: 'vit-b2-riboflavin', name: 'Vitamin B2 (Riboflavin)', category: 'vitamins', benefits: 'Essential for energy production and cellular function. Supports migraine prevention and red blood cell formation.' },
  { id: 'vit-b2-r5p', name: "Vitamin B2 (Riboflavin-5'-Phosphate)", category: 'vitamins', benefits: 'Active coenzyme form of riboflavin requiring no conversion. Ideal for individuals with absorption challenges.' },
  { id: 'vit-b3-niacin', name: 'Vitamin B3 (Niacin)', category: 'vitamins', benefits: 'Supports healthy cholesterol levels and cardiovascular function. Aids in energy metabolism and DNA repair.' },
  { id: 'vit-b3-niacinamide', name: 'Vitamin B3 (Niacinamide)', category: 'vitamins', benefits: 'Flush-free form of niacin supporting skin barrier integrity and cellular energy production.' },
  { id: 'vit-b5-calcium-d-panto', name: 'Vitamin B5 (Calcium-D-Pantothenate)', category: 'vitamins', benefits: 'Vital for synthesizing coenzyme A, supporting adrenal function and hormone production.' },
  { id: 'vit-b6-pyridoxine', name: 'Vitamin B6 (Pyridoxine HCl)', category: 'vitamins', benefits: 'Supports neurotransmitter synthesis, amino acid metabolism, and hemoglobin production.' },
  { id: 'vit-b6-p5p', name: "Vitamin B6 (P5P / Pyridoxal-5'-Phosphate)", category: 'vitamins', benefits: 'Bioactive form of B6 that bypasses liver conversion. Directly supports over 100 enzymatic reactions.' },
  { id: 'vit-b12-hydroxo', name: 'Vitamin B12 (Hydroxocobalamin)', category: 'vitamins', benefits: 'Long-acting form of B12 that supports detoxification pathways and sustained energy levels.' },
  { id: 'vit-b12-methyl', name: 'Vitamin B12 (Methylcobalamin)', category: 'vitamins', benefits: 'Methylated active form supporting nervous system health, methylation cycles, and cognitive function.' },
  { id: 'folinic-acid', name: 'Folinic Acid', category: 'vitamins', isNew: true, benefits: 'Readily converted to active folate without requiring MTHFR enzyme. Supports DNA synthesis and cellular repair.' },
  { id: 'folic-acid', name: 'Folic Acid', category: 'vitamins', benefits: 'Essential for DNA synthesis and cell division. Critical during pregnancy for neural tube development.' },
  { id: 'folate-5mthf', name: 'Folate (L-5-Methyltetrahydrofolate)', category: 'vitamins', benefits: 'The most bioactive form of folate, bypassing MTHFR gene variations. Supports methylation and mood regulation.' },
  { id: 'biotin', name: 'Biotin', category: 'vitamins', benefits: 'Supports healthy hair, skin, and nail growth. Essential coenzyme for fat and carbohydrate metabolism.' },
  { id: 'inositol', name: 'Inositol (Myo-inositol)', category: 'vitamins', benefits: 'Supports insulin signaling, mood balance, and reproductive health. Often used for PCOS and anxiety management.' },
  { id: 'vit-c', name: 'Vitamin C (Ascorbic Acid)', category: 'vitamins', benefits: 'Powerful antioxidant supporting immune defense, collagen synthesis, and iron absorption.' },
  { id: 'vit-d3', name: 'Vitamin D3 (Cholecalciferol)', category: 'vitamins', benefits: 'Regulates calcium absorption for bone health. Supports immune modulation and mood regulation.' },
  { id: 'vit-d3-vegan', name: 'Vitamin D3 (Cholecalciferol) (vegan)', category: 'vitamins', benefits: 'Lichen-derived vegan D3 providing the same bioavailability as animal-sourced forms for bone and immune support.' },
  { id: 'vit-e-succinate', name: 'Vitamin E (D-Alpha Tocopheryl Succinate)', category: 'vitamins', benefits: 'Stable dry form of vitamin E with potent antioxidant activity. Protects cell membranes from oxidative damage.' },
  { id: 'vit-e-mixed-toco', name: 'Vitamin E (Mixed Tocopherols)', category: 'vitamins', benefits: 'Full-spectrum vitamin E complex providing broad antioxidant coverage for cardiovascular and skin health.' },
  { id: 'vit-e-tocotrienols', name: 'Vitamin E (Tocotrienols)', category: 'vitamins', benefits: 'Highly potent form of vitamin E with superior antioxidant activity. Supports brain and cardiovascular health.' },
  { id: 'vit-k1', name: 'Vitamin K1', category: 'vitamins', benefits: 'Essential for blood clotting and bone metabolism. Supports proper calcium utilization in the body.' },
  { id: 'vit-k2-mk7', name: 'Vitamin K2 (MK7)', category: 'vitamins', benefits: 'Long-acting form directing calcium to bones and teeth while preventing arterial calcification.' },
  { id: 'choline-bitartrate', name: 'Choline (Bitartrate)', category: 'vitamins', benefits: 'Supports liver function, brain development, and cell membrane integrity. Precursor to the neurotransmitter acetylcholine.' },
  { id: 'choline-cdp', name: 'Choline Cytidine Diphosphate', category: 'vitamins', benefits: 'CDP-choline (citicoline) supporting cognitive function, memory, and neuroprotective processes.' },
  { id: 'paba', name: 'PABA (Para-aminobenzoic Acid)', category: 'vitamins', benefits: 'B-complex factor supporting skin health and pigmentation. May assist with connective tissue maintenance.' },

  // ── Minerals (28) ──────────────────────────────────────────
  { id: 'boron-citrate', name: 'Boron (Citrate)', category: 'minerals', benefits: 'Trace mineral supporting bone density, joint health, and hormone metabolism including testosterone and estrogen.' },
  { id: 'calcium-d-glucarate', name: 'Calcium (D-Glucarate)', category: 'minerals', benefits: 'Supports phase II liver detoxification and healthy estrogen metabolism. Aids in eliminating environmental toxins.' },
  { id: 'calcium-citrate', name: 'Calcium (Citrate)', category: 'minerals', benefits: 'Highly absorbable calcium form supporting bone strength and nerve signaling. Can be taken with or without food.' },
  { id: 'chromium-picolinate', name: 'Chromium (Picolinate)', category: 'minerals', benefits: 'Enhances insulin sensitivity and supports healthy blood sugar regulation. May reduce carbohydrate cravings.' },
  { id: 'copper-bisglycinate', name: 'Copper (Albion Minerals bisglycinate chelate)', category: 'minerals', benefits: 'Chelated form for gentle absorption supporting iron metabolism, connective tissue, and antioxidant enzyme production.' },
  { id: 'copper-citrate', name: 'Copper (Citrate)', category: 'minerals', benefits: 'Essential trace mineral for red blood cell formation, iron transport, and collagen cross-linking.' },
  { id: 'iodine-kelp', name: 'Iodine (from Kelp)', category: 'minerals', benefits: 'Natural ocean-sourced iodine critical for thyroid hormone production and metabolic regulation.' },
  { id: 'iodine-potassium', name: 'Iodine (from Potassium Iodide)', category: 'minerals', benefits: 'Pharmaceutical-grade iodine for precise thyroid support and healthy metabolic function.' },
  { id: 'iron-bisglycinate', name: 'Iron (Albion Minerals bisglycinate chelate)', category: 'minerals', benefits: 'Gentle, highly absorbable chelated iron minimizing GI side effects. Supports oxygen transport and energy production.' },
  { id: 'iron-citrate', name: 'Iron (Citrate)', category: 'minerals', benefits: 'Well-tolerated iron form supporting hemoglobin synthesis and preventing iron-deficiency fatigue.' },
  { id: 'mag-glycinate', name: 'Magnesium (Glycinate)', category: 'minerals', benefits: 'Calming form of magnesium ideal for sleep, stress reduction, and muscle relaxation without GI distress.' },
  { id: 'mag-threonate', name: 'Magnesium (L-Threonate)', category: 'minerals', benefits: 'The only form shown to cross the blood-brain barrier, supporting cognitive function and memory.' },
  { id: 'mag-malate', name: 'Magnesium (Malate)', category: 'minerals', benefits: 'Energizing form combining magnesium with malic acid for ATP production and muscle recovery.' },
  { id: 'mag-taurate', name: 'Magnesium (Taurate)', category: 'minerals', benefits: 'Cardiovascular-focused magnesium form supporting heart rhythm, blood pressure, and vascular tone.' },
  { id: 'manganese-bisglycinate', name: 'Manganese (Albion Minerals bisglycinate chelate)', category: 'minerals', benefits: 'Chelated trace mineral supporting bone formation, antioxidant defenses, and carbohydrate metabolism.' },
  { id: 'manganese-citrate', name: 'Manganese (Citrate)', category: 'minerals', benefits: 'Supports superoxide dismutase production, connective tissue health, and blood sugar regulation.' },
  { id: 'molybdenum-citrate', name: 'Molybdenum (Citrate)', category: 'minerals', benefits: 'Essential cofactor for detoxification enzymes processing sulfites and breaking down purines.' },
  { id: 'potassium-citrate', name: 'Potassium (Citrate)', category: 'minerals', benefits: 'Critical electrolyte for heart rhythm, muscle contractions, and nerve signaling. Supports healthy blood pressure.' },
  { id: 'selenium-methionine', name: 'Selenium (L-Selenomethionine)', category: 'minerals', benefits: 'Potent antioxidant mineral supporting thyroid function, immune defense, and protection against oxidative stress.' },
  { id: 'sodium-chloride', name: 'Sodium Chloride', category: 'minerals', benefits: 'Essential electrolyte maintaining fluid balance, nerve transmission, and proper cellular hydration.' },
  { id: 'strontium-citrate', name: 'Strontium (Citrate)', category: 'minerals', benefits: 'Supports bone density by promoting new bone formation while reducing bone resorption.' },
  { id: 'trace-minerals', name: 'Trace Minerals', category: 'minerals', benefits: 'Comprehensive blend of essential trace elements supporting enzymatic reactions and overall mineral balance.' },
  { id: 'vanadium-citrate', name: 'Vanadium (Citrate)', category: 'minerals', benefits: 'Ultra-trace mineral that mimics insulin action, supporting healthy blood sugar metabolism.' },
  { id: 'zinc-bisglycinate', name: 'Zinc (Albion Minerals bisglycinate chelate)', category: 'minerals', benefits: 'Premium chelated zinc for immune support, wound healing, and reproductive health with excellent absorption.' },
  { id: 'zinc-carnosine', name: 'Zinc (Carnosine)', category: 'minerals', benefits: 'Specialized form targeting gut lining integrity and gastric mucosal health. Supports digestive comfort.' },
  { id: 'zinc-chelate', name: 'Zinc (Chelate)', category: 'minerals', benefits: 'Gentle chelated zinc supporting immune function, protein synthesis, and DNA repair.' },
  { id: 'zinc-citrate', name: 'Zinc (Citrate)', category: 'minerals', benefits: 'Well-absorbed zinc form supporting immune defense, skin health, and hormonal balance.' },
  { id: 'zinc-picolinate', name: 'Zinc (Picolinate)', category: 'minerals', benefits: 'Highly bioavailable zinc bound to picolinic acid for superior absorption and immune optimization.' },

  // ── Marine Plants (3) ──────────────────────────────────────
  { id: 'chlorella', name: 'Chlorella', category: 'marine_plants', benefits: 'Nutrient-dense green algae supporting heavy metal detoxification, immune function, and chlorophyll-rich nutrition.' },
  { id: 'iodine-kelp-marine', name: 'Iodine (from Kelp)', category: 'marine_plants', benefits: 'Whole-food ocean kelp providing natural iodine for thyroid support alongside trace ocean minerals.' },
  { id: 'spirulina', name: 'Spirulina Pacifica', category: 'marine_plants', benefits: 'Blue-green superfood algae packed with protein, B-vitamins, and phycocyanin for antioxidant and anti-inflammatory support.' },

  // ── Nutraceuticals (~50) ───────────────────────────────────
  { id: 'beta-glucan', name: '1,3-Beta-Glucan 85%', category: 'nutraceuticals', benefits: 'Potent immune modulator derived from yeast cell walls. Activates macrophages and natural killer cells.' },
  { id: 'adrenal-cortex', name: 'Adrenal Cortex', category: 'nutraceuticals', benefits: 'Glandular extract supporting adrenal recovery and healthy cortisol patterns during periods of stress.' },
  { id: 'alpha-gpc', name: 'Alpha GPC', category: 'nutraceuticals', benefits: 'Premium choline source crossing the blood-brain barrier for enhanced cognitive performance and memory.' },
  { id: 'alpha-lipoic-acid', name: 'Alpha Lipoic Acid', category: 'nutraceuticals', benefits: 'Universal antioxidant active in both water and fat. Supports blood sugar regulation and nerve health.' },
  { id: 'andrographis', name: 'Andrographis Extract (30% Andrographolide)', category: 'nutraceuticals', isNew: true, benefits: 'Immune-stimulating herb traditionally used for upper respiratory support and inflammatory modulation.' },
  { id: 'astaxanthin', name: 'Astaxanthin', category: 'nutraceuticals', benefits: 'One of nature\'s most powerful antioxidants, 6000x stronger than vitamin C. Protects skin, eyes, and cardiovascular system.' },
  { id: 'availom-dha', name: 'AvailOm 50 High DHA', category: 'nutraceuticals', isNew: true, benefits: 'Advanced omega-3 phospholipid form with 50% DHA for superior brain and neurological support.' },
  { id: 'availom-epa', name: 'AvailOm 50 High EPA', category: 'nutraceuticals', isNew: true, benefits: 'Phospholipid-bound EPA omega-3 with enhanced absorption for cardiovascular and anti-inflammatory benefits.' },
  { id: 'berberine', name: 'Berberine HCl', category: 'nutraceuticals', benefits: 'Plant alkaloid activating AMPK pathways for metabolic health, blood sugar balance, and lipid optimization.' },
  { id: 'betaine-anhydrous', name: 'Betaine Anhydrous (Trimethylglycine)', category: 'nutraceuticals', benefits: 'Methyl donor supporting homocysteine metabolism, liver detoxification, and cellular hydration.' },
  { id: 'collagen-verisol', name: 'Bovine Collagen Peptides (VERISOL)', category: 'nutraceuticals', isNew: true, benefits: 'Clinically studied bioactive collagen peptides specifically targeting skin elasticity, wrinkle reduction, and nail strength.' },
  { id: 'collagen-bovine', name: 'Bovine Hydrolyzed Collagen', category: 'nutraceuticals', benefits: 'Type I and III collagen peptides supporting skin, joint, and connective tissue regeneration.' },
  { id: 'broccoli-seed', name: 'Broccoli Seed Extract (13% Glucoraphanin)', category: 'nutraceuticals', isNew: true, benefits: 'Concentrated sulforaphane precursor activating Nrf2 pathways for powerful antioxidant and detoxification support.' },
  { id: 'caffeine', name: 'Caffeine (Anhydrous)', category: 'nutraceuticals', benefits: 'Pure caffeine for energy, mental alertness, and thermogenic support. Enhances exercise performance.' },
  { id: 'calcium-d-glucarate-nutra', name: 'Calcium D-Glucarate', category: 'nutraceuticals', benefits: 'Supports liver glucuronidation pathway for healthy hormone clearance and environmental toxin elimination.' },
  { id: 'chondroitin', name: 'Chondroitin Sulfate 85%', category: 'nutraceuticals', benefits: 'Structural component of cartilage supporting joint cushioning, flexibility, and comfort.' },
  { id: 'coq10', name: 'CoEnzyme Q10 (Ubiquinone)', category: 'nutraceuticals', benefits: 'Essential mitochondrial cofactor for cellular energy production. Supports heart health and statin side effect management.' },
  { id: 'colostrum', name: 'Colostrum (30% immunoglobulins)', category: 'nutraceuticals', benefits: 'First milk concentrate rich in immunoglobulins and growth factors for gut integrity and immune priming.' },
  { id: 'creatine', name: 'Creatine Monohydrate', category: 'nutraceuticals', benefits: 'Well-researched compound enhancing ATP regeneration for strength, power, and cognitive performance.' },
  { id: 'd-mannose', name: 'D-Mannose', category: 'nutraceuticals', benefits: 'Natural sugar that prevents bacterial adhesion to urinary tract walls, supporting urinary health.' },
  { id: 'd-ribose', name: 'D-Ribose', category: 'nutraceuticals', benefits: 'Fundamental building block for ATP synthesis. Supports cardiac energy recovery and reduces exercise fatigue.' },
  { id: 'dim', name: 'DIM (Diindolylmethane)', category: 'nutraceuticals', benefits: 'Cruciferous vegetable compound promoting healthy estrogen metabolism and hormonal balance.' },
  { id: 'dhea', name: 'DHEA (only available in the US)', category: 'nutraceuticals', benefits: 'Master precursor hormone supporting adrenal function, energy, and age-related hormone optimization.' },
  { id: 'gamma-oryzanol', name: 'Gamma Oryzanol', category: 'nutraceuticals', benefits: 'Rice bran-derived compound supporting healthy cholesterol levels and reducing menopausal symptoms.' },
  { id: 'glucosamine', name: 'Glucosamine Sulfate', category: 'nutraceuticals', benefits: 'Building block for cartilage repair supporting joint mobility, flexibility, and comfort.' },
  { id: 'hesperidin', name: 'Hesperidin', category: 'nutraceuticals', benefits: 'Citrus bioflavonoid strengthening blood vessel walls and supporting healthy circulation and venous tone.' },
  { id: 'fish-collagen', name: 'Hydrolyzed Fish Collagen', category: 'nutraceuticals', benefits: 'Marine-sourced type I collagen with small peptides for enhanced skin hydration and joint support.' },
  { id: 'hyaluronic-acid', name: 'Hyaluronic Acid', category: 'nutraceuticals', benefits: 'Key molecule for tissue hydration supporting skin moisture retention, joint lubrication, and eye health.' },
  { id: 'inulin', name: 'Inulin', category: 'nutraceuticals', benefits: 'Prebiotic soluble fiber nourishing beneficial gut bacteria and supporting digestive regularity.' },
  { id: 'l-carnitine-nutra', name: 'L-Carnitine Tartrate', category: 'nutraceuticals', benefits: 'Amino acid transporting fatty acids into mitochondria for energy production and exercise recovery.' },
  { id: 'lecithin', name: 'Lecithin', category: 'nutraceuticals', benefits: 'Phospholipid complex supporting cell membrane integrity, brain function, and fat metabolism.' },
  { id: 'lutein', name: 'Lutein', category: 'nutraceuticals', benefits: 'Carotenoid antioxidant concentrated in the retina for macular health and protection against blue light damage.' },
  { id: 'lycopene', name: 'Lycopene', category: 'nutraceuticals', benefits: 'Powerful carotenoid from tomatoes supporting prostate health, cardiovascular protection, and skin defense.' },
  { id: 'mct', name: 'Medium Chain Triglycerides', category: 'nutraceuticals', benefits: 'Rapidly absorbed fats converted directly to ketones for quick energy, mental clarity, and metabolic support.' },
  { id: 'melatonin', name: 'Melatonin', category: 'nutraceuticals', benefits: 'Pineal gland hormone regulating circadian rhythm for restful sleep onset and jet lag recovery.' },
  { id: 'mcc', name: 'Microcrystalline Cellulose', category: 'nutraceuticals', benefits: 'Purified plant fiber used as a clean excipient and source of insoluble dietary fiber.' },
  { id: 'msm', name: 'MSM', category: 'nutraceuticals', benefits: 'Organic sulfur compound supporting joint comfort, connective tissue repair, and inflammatory balance.' },
  { id: 'nmn', name: 'Nicotinamide Mononucleotide (NMN)', category: 'nutraceuticals', benefits: 'Direct NAD+ precursor supporting cellular energy, DNA repair, and longevity pathways.' },
  { id: 'omega3-powder', name: 'Omega-3 Powder (from Fish Oil)', category: 'nutraceuticals', benefits: 'Microencapsulated fish oil providing EPA and DHA for cardiovascular, brain, and anti-inflammatory support.' },
  { id: 'phosphatidylcholine', name: 'Phosphatidylcholine (Soy)', category: 'nutraceuticals', benefits: 'Primary phospholipid in cell membranes supporting liver health, fat metabolism, and brain function.' },
  { id: 'phosphatidylserine', name: 'Phosphatidylserine (Sunflower)', category: 'nutraceuticals', benefits: 'Brain-nourishing phospholipid supporting memory, focus, cortisol balance, and cognitive longevity.' },
  { id: 'plant-sterols', name: 'Plant Sterols (Phytosterol)', category: 'nutraceuticals', benefits: 'Structurally similar to cholesterol, blocking its absorption for natural LDL cholesterol reduction.' },
  { id: 'policosanol', name: 'Policosanol', category: 'nutraceuticals', benefits: 'Sugar cane extract supporting healthy cholesterol ratios and smooth arterial function.' },
  { id: 'pqq', name: 'Pyrroloquinoline Quinone (PQQ)', category: 'nutraceuticals', isNew: true, benefits: 'Stimulates mitochondrial biogenesis for new mitochondria production, supporting energy and neuroprotection.' },
  { id: 'resveratrol', name: 'Resveratrol 50%', category: 'nutraceuticals', benefits: 'Polyphenol activating sirtuin longevity pathways. Supports cardiovascular health and healthy aging.' },
  { id: 'same', name: 'SAMe', category: 'nutraceuticals', benefits: 'Universal methyl donor supporting mood, joint comfort, liver detoxification, and neurotransmitter synthesis.' },
  { id: 'sodium-bicarbonate', name: 'Sodium Bicarbonate', category: 'nutraceuticals', benefits: 'Alkalizing agent supporting acid-base balance, exercise buffering, and digestive comfort.' },
  { id: 'vinpocetine', name: 'Vinpocetine 99%', category: 'nutraceuticals', benefits: 'Periwinkle-derived compound enhancing cerebral blood flow, memory, and neuroprotective support.' },
  { id: 'zeaxanthin', name: 'Zeaxanthin 5%', category: 'nutraceuticals', benefits: 'Retinal carotenoid working synergistically with lutein to filter harmful blue light and protect central vision.' },

  // ── Whole Food Ingredients (12) ────────────────────────────
  { id: 'acai', name: 'Acai Extract 4:1', category: 'whole_food', isNew: true, benefits: 'Superfruit concentrate rich in anthocyanins for potent antioxidant protection and cardiovascular support.' },
  { id: 'aloe-vera', name: 'Aloe Vera Powder', category: 'whole_food', benefits: 'Soothing plant extract supporting gut lining integrity, digestive comfort, and skin health from within.' },
  { id: 'beet-root', name: 'Beet Root (Red)', category: 'whole_food', benefits: 'Nitrate-rich root vegetable supporting blood flow, exercise endurance, and healthy blood pressure.' },
  { id: 'black-pepper', name: 'Black Pepper Extract', category: 'whole_food', benefits: 'Piperine-rich extract dramatically enhancing nutrient bioavailability, especially curcumin and CoQ10 absorption.' },
  { id: 'broccoli-powder', name: 'Broccoli Powder', category: 'whole_food', benefits: 'Whole-food cruciferous nutrition supporting detoxification pathways and providing sulforaphane precursors.' },
  { id: 'citrus-bioflavonoids', name: 'Citrus Bioflavonoids', category: 'whole_food', benefits: 'Plant compounds strengthening capillary walls and enhancing vitamin C activity for immune and circulatory health.' },
  { id: 'elderberry', name: 'Elderberry Extract 10:1', category: 'whole_food', isNew: true, benefits: 'Concentrated berry extract with potent antiviral properties supporting upper respiratory immune defense.' },
  { id: 'garlic', name: 'Garlic', category: 'whole_food', benefits: 'Allicin-rich bulb supporting cardiovascular health, immune function, and healthy microbial balance.' },
  { id: 'ginger-root', name: 'Ginger Root', category: 'whole_food', benefits: 'Anti-inflammatory rhizome supporting digestive comfort, nausea relief, and circulation.' },
  { id: 'raspberry-ketones', name: 'Raspberry Ketones', category: 'whole_food', benefits: 'Aromatic compound from raspberries supporting fat metabolism and adiponectin signaling pathways.' },
  { id: 'red-spinach', name: 'Red Spinach (Powder formulas only) 9% nitrate', category: 'whole_food', benefits: 'Exceptionally high nitrate content boosting nitric oxide production for vasodilation and exercise performance.' },
  { id: 'soy-isoflavones', name: 'Soy Isoflavones 40%', category: 'whole_food', benefits: 'Phytoestrogen compounds supporting bone density, menopausal symptom relief, and cardiovascular health.' },

  // ── Herbs (~62) ────────────────────────────────────────────
  { id: 'american-ginseng', name: 'American Ginseng (5% Ginsenosides)', category: 'herbs', benefits: 'Adaptogenic root supporting calm energy, immune modulation, and blood sugar regulation.' },
  { id: 'apigenin', name: 'Apigenin', category: 'herbs', benefits: 'Chamomile-derived flavonoid promoting relaxation, sleep quality, and healthy inflammatory response.' },
  { id: 'artichoke-leaf', name: 'Artichoke Leaf Powder', category: 'herbs', benefits: 'Supports liver bile production for fat digestion, cholesterol metabolism, and digestive comfort.' },
  { id: 'ashwagandha-sensoril', name: 'Ashwagandha (Sensoril) (10% Withanolides)', category: 'herbs', benefits: 'Patented extract with highest withanolide concentration for stress resilience, cortisol reduction, and calm focus.' },
  { id: 'ashwagandha-ksm66', name: 'Ashwagandha KSM-66', category: 'herbs', isNew: true, benefits: 'Gold-standard root extract supporting testosterone, strength, stress adaptation, and reproductive health.' },
  { id: 'astragalus', name: 'Astragalus', category: 'herbs', benefits: 'Traditional adaptogen supporting deep immune function, telomere protection, and adrenal vitality.' },
  { id: 'bacopa', name: 'Bacopa (45% Bacosides)', category: 'herbs', benefits: 'Ayurvedic nootropic enhancing memory formation, learning speed, and neuroprotection.' },
  { id: 'baikal-skullcap', name: 'Baikal Skullcap', category: 'herbs', benefits: 'Rich in baicalin for broad anti-inflammatory, antiviral, and neuroprotective support.' },
  { id: 'bamboo-silica', name: 'Bamboo (70% Silica)', category: 'herbs', benefits: 'Richest plant source of bioavailable silica for hair strength, nail growth, and collagen formation.' },
  { id: 'barberry', name: 'Barberry 4:1', category: 'herbs', benefits: 'Berberine-containing herb supporting digestive health, microbial balance, and liver function.' },
  { id: 'berberine-herb', name: 'Berberine 97%', category: 'herbs', benefits: 'High-purity plant alkaloid activating AMPK for metabolic optimization, blood sugar, and lipid management.' },
  { id: 'bergamot', name: 'Bergamot Orange PE 10:1', category: 'herbs', benefits: 'Citrus polyphenol extract supporting healthy cholesterol ratios and cardiovascular lipid profiles.' },
  { id: 'bilberry', name: 'Bilberry (25% Anthocynidins)', category: 'herbs', benefits: 'European blueberry relative rich in anthocyanins for visual acuity, microcirculation, and eye health.' },
  { id: 'black-cohosh', name: 'Black Cohosh 4:1', category: 'herbs', benefits: 'Traditional women\'s herb supporting menopausal comfort, hot flash reduction, and hormonal transition.' },
  { id: 'black-currant', name: 'Black Currant 4:1', category: 'herbs', benefits: 'Rich in GLA gamma-linolenic acid for anti-inflammatory support, skin health, and immune function.' },
  { id: 'boswellia', name: 'Boswellia Serrata (65% Boswellic Acid)', category: 'herbs', benefits: 'Frankincense extract with potent 5-LOX inhibition for joint comfort and inflammatory modulation.' },
  { id: 'camu-camu', name: 'Camu Camu', category: 'herbs', benefits: 'Amazonian superfruit with the highest natural vitamin C content supporting immune defense and collagen production.' },
  { id: 'cats-claw', name: "Cat's Claw Bark", category: 'herbs', benefits: 'Amazonian vine extract supporting immune modulation, inflammatory balance, and DNA repair mechanisms.' },
  { id: 'chamomile', name: 'Chamomile (1.2% Apigenin)', category: 'herbs', benefits: 'Standardized calming herb supporting relaxation, sleep quality, and digestive comfort.' },
  { id: 'chasteberry', name: 'Chasteberry Extract (Vitex) (0.5% Agnusides)', category: 'herbs', benefits: 'Hormone-balancing berry supporting regular menstrual cycles, PMS relief, and prolactin regulation.' },
  { id: 'cinnamon', name: 'Cinnamon 20:1', category: 'herbs', benefits: 'Concentrated extract supporting insulin sensitivity, blood sugar balance, and antimicrobial defense.' },
  { id: 'cranberry', name: 'Cranberry 12:1', category: 'herbs', benefits: 'Concentrated proanthocyanidin-rich extract preventing bacterial adhesion for urinary tract protection.' },
  { id: 'dandelion-root', name: 'Dandelion Root 4:1', category: 'herbs', benefits: 'Gentle liver and kidney tonic supporting natural detoxification, bile flow, and mild diuretic action.' },
  { id: 'echinacea', name: 'Echinacea Root Powder', category: 'herbs', benefits: 'Immune-stimulating herb activating white blood cells for upper respiratory and seasonal immune support.' },
  { id: 'fenugreek', name: 'Fenugreek (50% Saponins)', category: 'herbs', benefits: 'Saponin-rich seed extract supporting healthy testosterone levels, milk production, and blood sugar balance.' },
  { id: 'ginkgo', name: 'Ginkgo Biloba (22% Flavonoids Glycosides, 5.4% Terpene Lactones)', category: 'herbs', benefits: 'Ancient tree leaf extract enhancing cerebral circulation, memory, and peripheral blood flow.' },
  { id: 'goldenseal', name: 'Goldenseal (5% Alkaloids)', category: 'herbs', benefits: 'Berberine-rich root supporting mucosal immune defense, digestive health, and antimicrobial action.' },
  { id: 'grape-seed', name: 'Grape Seed Extract (95% Proanthocyanidins)', category: 'herbs', benefits: 'Powerful OPC antioxidants supporting vascular integrity, skin health, and protection against oxidative stress.' },
  { id: 'green-tea', name: 'Green Tea Phytosome (19% Polyphenols, 13% EGCG)', category: 'herbs', benefits: 'Enhanced-absorption catechins supporting thermogenesis, antioxidant defense, and metabolic health.' },
  { id: 'gymnema', name: 'Gymnema (25% Gymnemic Acid)', category: 'herbs', benefits: 'Ayurvedic "sugar destroyer" blocking sweet taste receptors and supporting healthy blood sugar levels.' },
  { id: 'hawthorne', name: 'Hawthorne (1.8% Flavones)', category: 'herbs', benefits: 'Cardiotonic herb supporting heart muscle strength, healthy blood pressure, and vascular tone.' },
  { id: 'holy-basil', name: 'Holy Basil (2.5% Ursolic Acid)', category: 'herbs', benefits: 'Sacred adaptogen (tulsi) supporting stress resilience, cortisol regulation, and mental clarity.' },
  { id: 'horny-goat-weed', name: 'Horny Goat Weed 10:1', category: 'herbs', benefits: 'Icariin-containing herb supporting libido, bone density, and healthy circulatory function.' },
  { id: 'larch', name: 'Larch Arabinogalactan', category: 'herbs', benefits: 'Prebiotic fiber from larch tree bark supporting immune function and beneficial gut microbiome diversity.' },
  { id: 'lemon-balm', name: 'Lemon Balm', category: 'herbs', benefits: 'Calming mint-family herb supporting relaxation, sleep onset, and cognitive function without drowsiness.' },
  { id: 'licorice-root', name: 'Licorice Root', category: 'herbs', benefits: 'Adrenal-supportive herb with glycyrrhizin for cortisol modulation, gut soothing, and immune support.' },
  { id: 'longvida', name: 'Longvida (Turmeric Extract)', category: 'herbs', isNew: true, benefits: 'Patented lipidated curcumin with 65x higher bioavailability for brain-targeted anti-inflammatory support.' },
  { id: 'maca', name: 'Maca (0.6% Glucosinolates)', category: 'herbs', benefits: 'Peruvian adaptogenic root supporting energy, libido, hormonal balance, and endurance.' },
  { id: 'marshmallow-root', name: 'Marshmallow Root', category: 'herbs', benefits: 'Mucilaginous herb coating and soothing irritated mucous membranes throughout the digestive and respiratory tracts.' },
  { id: 'milk-thistle', name: 'Milk Thistle (80% Silymarin)', category: 'herbs', benefits: 'Premier liver-protective herb supporting hepatocyte regeneration, detoxification, and glutathione production.' },
  { id: 'moringa', name: 'Moringa Leaf Extract 10:1', category: 'herbs', isNew: true, benefits: 'Nutrient-dense superfood containing all essential amino acids with potent anti-inflammatory and antioxidant properties.' },
  { id: 'nettle-root', name: 'Nettle Root', category: 'herbs', benefits: 'Supports prostate health and healthy testosterone levels by modulating sex hormone binding globulin (SHBG).' },
  { id: 'olive-leaf', name: 'Olive Leaf (6% Oleuropein)', category: 'herbs', benefits: 'Mediterranean antioxidant supporting immune defense, cardiovascular health, and healthy blood pressure.' },
  { id: 'panax-ginseng', name: 'Panax Ginseng (5% Ginsenosides)', category: 'herbs', benefits: 'Stimulating adaptogen enhancing physical endurance, cognitive function, and immune resilience.' },
  { id: 'pine-bark', name: 'Pine Bark (95% Anthocyanin)', category: 'herbs', benefits: 'Powerful proanthocyanidin extract supporting vascular health, skin elasticity, and nitric oxide production.' },
  { id: 'pomegranate', name: 'Pomegranate (40% Ellagic acid)', category: 'herbs', benefits: 'Ellagitannin-rich extract supporting cardiovascular health, urolithin A production, and mitochondrial function.' },
  { id: 'pygeum', name: 'Pygeum Bark', category: 'herbs', benefits: 'African tree bark extract supporting prostate comfort, urinary flow, and male reproductive health.' },
  { id: 'quercetin', name: 'Quercetin Phytosome', category: 'herbs', benefits: 'Enhanced-absorption flavonoid with broad anti-inflammatory, antihistamine, and senolytic properties.' },
  { id: 'red-yeast-rice', name: 'Red Yeast Rice (0.2% Monacolin-K)', category: 'herbs', benefits: 'Fermented rice containing natural statins for cholesterol management and cardiovascular health support.' },
  { id: 'rhodiola', name: 'Rhodiola Rosea (3% Rosavins)', category: 'herbs', benefits: 'Arctic adaptogen enhancing mental performance under stress, reducing fatigue, and supporting endurance.' },
  { id: 'rosemary', name: 'Rosemary Extract', category: 'herbs', benefits: 'Carnosic acid-rich extract supporting memory, focus, and antioxidant protection against neurodegeneration.' },
  { id: 'sage-leaf', name: 'Sage Leaf 4:1', category: 'herbs', benefits: 'Traditional herb supporting cognitive function, menopausal hot flash reduction, and antimicrobial defense.' },
  { id: 'saw-palmetto', name: 'Saw Palmetto (45% Total Fatty Acid)', category: 'herbs', benefits: 'Berry extract supporting prostate health, DHT balance, and urinary comfort in men.' },
  { id: 'siberian-ginseng', name: 'Siberian Ginseng (0.8% Eleutherosides (B & E))', category: 'herbs', benefits: 'Adaptogenic root supporting sustained energy, immune stamina, and recovery from physical stress.' },
  { id: 'st-johns-wort', name: "St. John's Wort (0.3% Hypericins) (3% Hyperforin)", category: 'herbs', benefits: 'Well-studied herb supporting mood balance and emotional well-being through serotonin pathway modulation.' },
  { id: 'tongkat-ali', name: 'Tongkat Ali', category: 'herbs', benefits: 'Southeast Asian root supporting healthy testosterone levels, libido, athletic performance, and stress adaptation.' },
  { id: 'tribulus', name: 'Tribulus Terrestris (40% Saponins)', category: 'herbs', benefits: 'Saponin-rich herb traditionally used for male vitality, libido, and athletic performance support.' },
  { id: 'turmeric', name: 'Turmeric Root (95% Curcuminoids)', category: 'herbs', benefits: 'Gold-standard anti-inflammatory spice supporting joint comfort, liver health, and systemic inflammatory balance.' },
  { id: 'valerian', name: 'Valerian Root 10:1', category: 'herbs', benefits: 'Sedative herb supporting deep sleep quality, relaxation, and nervous system calm through GABA modulation.' },
  { id: 'white-kidney-bean', name: 'White Kidney Bean Extract', category: 'herbs', benefits: 'Starch blocker inhibiting alpha-amylase enzyme to reduce carbohydrate absorption and support weight management.' },

  // ── Amino Acids (29) ───────────────────────────────────────
  { id: '5htp', name: '5-HTP (5-Hydroxytryptophan)', category: 'amino_acids', benefits: 'Direct serotonin precursor supporting mood elevation, sleep quality, and appetite regulation.' },
  { id: 'l-arginine', name: 'L-Arginine', category: 'amino_acids', benefits: 'Nitric oxide precursor supporting vasodilation, blood flow, exercise performance, and cardiovascular health.' },
  { id: 'l-aspartic-acid', name: 'L-Aspartic Acid', category: 'amino_acids', benefits: 'Non-essential amino acid supporting the urea cycle, energy metabolism, and neurotransmitter balance.' },
  { id: 'beta-alanine', name: 'Beta Alanine', category: 'amino_acids', benefits: 'Carnosine precursor buffering muscle acid buildup during high-intensity exercise for enhanced endurance.' },
  { id: 'l-carnitine-aa', name: 'L-Carnitine Tartrate', category: 'amino_acids', benefits: 'Shuttles fatty acids into mitochondria for energy production. Supports exercise recovery and fat metabolism.' },
  { id: 'l-carnosine', name: 'L-Carnosine', category: 'amino_acids', benefits: 'Dipeptide antioxidant protecting against glycation and supporting muscle endurance and cellular longevity.' },
  { id: 'l-citrulline', name: 'L-Citrulline DL-Malate', category: 'amino_acids', benefits: 'Potent nitric oxide booster enhancing blood flow, exercise endurance, and muscle recovery.' },
  { id: 'l-cystine', name: 'L-Cystine', category: 'amino_acids', benefits: 'Stable form of cysteine supporting keratin production for strong hair, nails, and antioxidant glutathione synthesis.' },
  { id: 'gaba', name: 'GABA', category: 'amino_acids', benefits: 'Primary inhibitory neurotransmitter promoting calm focus, relaxation, and healthy sleep without sedation.' },
  { id: 'l-glutamine', name: 'L-Glutamine', category: 'amino_acids', benefits: 'Most abundant amino acid supporting gut lining repair, immune cell fuel, and post-exercise recovery.' },
  { id: 'l-glutathione', name: 'L-Glutathione (Reduced)', category: 'amino_acids', benefits: 'Master antioxidant defending cells against oxidative damage. Supports liver detoxification and skin brightening.' },
  { id: 'l-glycine', name: 'L-Glycine', category: 'amino_acids', benefits: 'Calming amino acid supporting deep sleep, collagen synthesis, and neurotransmitter balance.' },
  { id: 'l-histidine', name: 'L-Histidine', category: 'amino_acids', benefits: 'Essential amino acid and histamine precursor supporting immune response, digestion, and joint health.' },
  { id: 'l-isoleucine', name: 'L-Isoleucine', category: 'amino_acids', benefits: 'Branched-chain amino acid supporting muscle recovery, blood sugar regulation, and endurance.' },
  { id: 'l-leucine', name: 'L-Leucine', category: 'amino_acids', benefits: 'Primary BCAA activating mTOR pathway for muscle protein synthesis, recovery, and lean mass preservation.' },
  { id: 'l-lysine', name: 'L-Lysine', category: 'amino_acids', benefits: 'Essential amino acid supporting collagen formation, calcium absorption, and antiviral immune defense.' },
  { id: 'l-methionine', name: 'L-Methionine', category: 'amino_acids', benefits: 'Sulfur-containing essential amino acid supporting liver detoxification, antioxidant production, and joint cartilage.' },
  { id: 'l-ornithine', name: 'L-Ornithine', category: 'amino_acids', benefits: 'Urea cycle amino acid supporting ammonia detoxification, sleep quality, and growth hormone release.' },
  { id: 'l-phenylalanine', name: 'L-Phenylalanine', category: 'amino_acids', benefits: 'Essential amino acid and precursor to tyrosine, dopamine, and norepinephrine for mood and focus.' },
  { id: 'l-serine', name: 'L-Serine', category: 'amino_acids', benefits: 'Amino acid critical for phospholipid synthesis, brain cell production, and nervous system health.' },
  { id: 'l-taurine', name: 'L-Taurine', category: 'amino_acids', benefits: 'Conditionally essential amino acid supporting heart rhythm, bile salt formation, and cellular hydration.' },
  { id: 'l-theanine', name: 'L-Theanine', category: 'amino_acids', benefits: 'Green tea amino acid promoting alert relaxation, alpha brain waves, and smooth focus without jitters.' },
  { id: 'l-threonine', name: 'L-Threonine', category: 'amino_acids', benefits: 'Essential amino acid supporting gut mucosal lining, immune function, and collagen production.' },
  { id: 'l-tryptophan', name: 'L-Tryptophan', category: 'amino_acids', benefits: 'Essential precursor to serotonin and melatonin supporting mood balance, relaxation, and restful sleep.' },
  { id: 'l-tyrosine', name: 'L-Tyrosine', category: 'amino_acids', benefits: 'Dopamine and thyroid hormone precursor supporting mental performance under stress, focus, and motivation.' },
  { id: 'l-valine', name: 'L-Valine', category: 'amino_acids', benefits: 'Branched-chain amino acid supporting muscle metabolism, tissue repair, and energy during exercise.' },
  { id: 'nalc', name: 'N-Acetyl L-Carnitine', category: 'amino_acids', benefits: 'Acetylated form crossing the blood-brain barrier for cognitive energy, neuroprotection, and fat metabolism.' },
  { id: 'nalt', name: 'N-Acetyl L-Tyrosine', category: 'amino_acids', benefits: 'Enhanced-solubility tyrosine form supporting dopamine production, mental clarity, and stress resilience.' },
  { id: 'nac', name: 'N-Acetyl Cysteine (NAC)', category: 'amino_acids', benefits: 'Powerful glutathione precursor supporting liver detoxification, mucolytic action, and antioxidant defense.' },

  // ── Probiotics (7) ─────────────────────────────────────────
  { id: 'b-clausii', name: 'Bacillus Clausii UBBC-07', category: 'probiotics', benefits: 'Spore-forming probiotic surviving stomach acid for antibiotic-associated diarrhea relief and immune support.' },
  { id: 'b-coagulans', name: 'Bacillus Coagulans IDCC 1201', category: 'probiotics', benefits: 'Heat-stable spore-forming strain supporting digestive comfort, IBS symptom relief, and gut immune defense.' },
  { id: 'b-mesentericus', name: 'Bacillus Mesentericus UBBM-37', category: 'probiotics', benefits: 'Soil-based probiotic producing enzymes and B-vitamins while supporting healthy gut microbiome diversity.' },
  { id: 'b-subtilis', name: 'Bacillus subtilis UBBS-14', category: 'probiotics', benefits: 'Robust spore-forming strain supporting pathogen displacement, biofilm disruption, and immune modulation.' },
  { id: 'b-bifidum', name: 'Bifidobacterium Bifidum Bb-06', category: 'probiotics', benefits: 'Foundational gut strain supporting nutrient absorption, immune priming, and mucosal barrier integrity.' },
  { id: 'l-acidophilus', name: 'Lactobacillus Acidophilus', category: 'probiotics', benefits: 'Well-researched probiotic supporting lactose digestion, vaginal health, and intestinal microbial balance.' },
  { id: 'l-rhamnosus', name: 'Lactobacillus Rhamnosus Lr-32', category: 'probiotics', benefits: 'Versatile strain supporting immune function, allergy reduction, and prevention of antibiotic-associated GI issues.' },

  // ── Enzymes (3) ────────────────────────────────────────────
  { id: 'betaine-hcl', name: 'Betaine HCL', category: 'enzymes', benefits: 'Supplemental stomach acid supporting protein digestion, nutrient absorption, and relief from low-acid symptoms.' },
  { id: 'bromelain', name: 'Bromelain 2,400 GDU/g', category: 'enzymes', benefits: 'Pineapple-derived protease enzyme supporting inflammation reduction, sinus health, and protein digestion.' },
  { id: 'pancreatin', name: 'Pancreatin 8X USPs', category: 'enzymes', benefits: 'Comprehensive digestive enzyme blend providing lipase, protease, and amylase for full-spectrum macronutrient breakdown.' },

  // ── Functional Mushrooms (7, all GROWN IN USA) ─────────────
  { id: 'chaga', name: 'Chaga (Inonotus obliquus)', category: 'functional_mushrooms', grownInUSA: true, benefits: 'Antioxidant-rich birch fungus supporting immune defense, skin health, and healthy inflammatory response.' },
  { id: 'cordyceps', name: 'Cordyceps Militaris', category: 'functional_mushrooms', grownInUSA: true, benefits: 'Performance mushroom supporting oxygen utilization, ATP production, and athletic endurance.' },
  { id: 'lions-mane', name: 'Lion\'s Mane (Hericium erinaceus)', category: 'functional_mushrooms', grownInUSA: true, benefits: 'Neurotrophic mushroom stimulating nerve growth factor (NGF) for brain health, memory, and cognitive clarity.' },
  { id: 'maitake', name: 'Maitake (Grifola frondosa)', category: 'functional_mushrooms', grownInUSA: true, benefits: 'Immune-modulating mushroom rich in beta-glucans supporting blood sugar balance and adaptive immunity.' },
  { id: 'shiitake', name: 'Organic Shiitake Mushroom (Lentinula edodes)', category: 'functional_mushrooms', grownInUSA: true, isNew: true, benefits: 'Lentinan-rich mushroom supporting cardiovascular health, immune function, and healthy cholesterol levels.' },
  { id: 'reishi', name: 'Reishi (Ganoderma lucidum)', category: 'functional_mushrooms', grownInUSA: true, benefits: 'Revered adaptogenic mushroom supporting deep immune modulation, sleep quality, and stress resilience.' },
  { id: 'turkey-tail', name: 'Turkey Tail (Coriolus versicolor)', category: 'functional_mushrooms', grownInUSA: true, benefits: 'PSK and PSP polysaccharide-rich mushroom with potent immune-stimulating and prebiotic properties.' },
]

// ============================================================
// Helper functions
// ============================================================

export function getVitaminCategoriesWithCounts(): { category: VitaminCategory; displayName: string; count: number }[] {
  const counts = new Map<VitaminCategory, number>()
  for (const product of VITAMIN_CATALOG) {
    counts.set(product.category, (counts.get(product.category) || 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([category, count]) => ({
      category,
      displayName: VITAMIN_CATEGORY_STYLES[category].displayName,
      count,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
}

export function getVitaminsByCategory(category: VitaminCategory): VitaminProduct[] {
  return VITAMIN_CATALOG.filter(p => p.category === category)
}

export function searchVitamins(query: string): VitaminProduct[] {
  const q = query.toLowerCase().trim()
  if (!q) return VITAMIN_CATALOG
  return VITAMIN_CATALOG.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.benefits.toLowerCase().includes(q) ||
    VITAMIN_CATEGORY_STYLES[p.category].displayName.toLowerCase().includes(q)
  )
}

export function getVitaminCategoryDisplayName(category: VitaminCategory): string {
  return VITAMIN_CATEGORY_STYLES[category].displayName
}
