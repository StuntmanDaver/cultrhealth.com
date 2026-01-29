export type ProtocolCategory = 'metabolic' | 'cognitive' | 'repair' | 'longevity'

// ============================================================================
// SYMPTOM-BASED PROTOCOL ENGINE
// ============================================================================

export type SymptomCategory =
  | 'mental'
  | 'energy'
  | 'physical'
  | 'skin'
  | 'digestive'
  | 'immune'
  | 'neurological'
  | 'metabolic'
  | 'cardiovascular'
  | 'hormonal'

export type Intervention = {
  name: string
  type: 'supplement' | 'peptide'
  dosageRange?: string
  timing?: string
  notes?: string
}

// Expected outcome for N-of-1 trial tracking (Altos Labs alignment)
export type ExpectedOutcome = {
  biomarkerId: string // Links to BIOMARKER_DEFINITIONS in lib/resilience.ts
  metric: string // Human-readable metric name
  direction: 'increase' | 'decrease' | 'maintain'
  targetChange?: number // Expected % change
  timeframeWeeks: number // Weeks to see effect
  measurementMethod: string // How to measure (e.g., "blood test", "daily log", "wearable")
}

// Subjective outcome tracking
export type SubjectiveOutcome = {
  metric: string // e.g., "Energy level", "Sleep quality"
  scale: '1-10' | 'binary' | 'categorical'
  direction: 'increase' | 'decrease'
  checkInFrequency: 'daily' | 'weekly' | 'biweekly'
}

export type SymptomProtocol = {
  id: string
  symptom: string
  category: SymptomCategory
  supplements: string[]
  peptide: string
  interventions: Intervention[]
  monitoring: string[]
  contraindications?: string[]
  synergies?: string[] // IDs of symptoms that often co-occur
  // N-of-1 Trial Tracking (Altos Labs alignment)
  expectedOutcomes?: ExpectedOutcome[] // Biomarker-based outcomes
  subjectiveOutcomes?: SubjectiveOutcome[] // Self-reported outcomes
  typicalDurationWeeks?: number // Standard protocol length
  checkInSchedule?: number[] // Days to prompt check-ins (e.g., [7, 14, 28])
}

// Complete symptom-to-intervention mapping
export const SYMPTOM_PROTOCOLS: SymptomProtocol[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // MENTAL HEALTH & MOOD
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'anxiety',
    symptom: 'Anxiety',
    category: 'mental',
    supplements: ['Magnesium glycinate', 'Vitamin B6', 'Omega-3'],
    peptide: 'Selank',
    interventions: [
      { name: 'Magnesium glycinate', type: 'supplement', dosageRange: '200-400mg', timing: 'Evening', notes: 'Calming form of magnesium' },
      { name: 'Vitamin B6', type: 'supplement', dosageRange: '25-50mg', timing: 'Morning', notes: 'Supports GABA synthesis' },
      { name: 'Omega-3', type: 'supplement', dosageRange: '2-3g EPA/DHA', timing: 'With meals', notes: 'Anti-inflammatory, mood support' },
      { name: 'Selank', type: 'peptide', dosageRange: '250-500mcg', timing: 'Intranasal 1-2x daily', notes: 'Anxiolytic peptide' },
    ],
    monitoring: ['Anxiety levels (1-10 scale)', 'Sleep quality', 'Heart rate variability'],
    synergies: ['panic-attacks', 'social-anxiety', 'overthinking'],
    // N-of-1 Trial Tracking
    expectedOutcomes: [
      { biomarkerId: 'hs-crp', metric: 'hs-CRP (inflammation)', direction: 'decrease', targetChange: 20, timeframeWeeks: 8, measurementMethod: 'blood test' },
      { biomarkerId: 'homocysteine', metric: 'Homocysteine', direction: 'decrease', targetChange: 15, timeframeWeeks: 8, measurementMethod: 'blood test' },
    ],
    subjectiveOutcomes: [
      { metric: 'Anxiety level', scale: '1-10', direction: 'decrease', checkInFrequency: 'daily' },
      { metric: 'Sleep quality', scale: '1-10', direction: 'increase', checkInFrequency: 'daily' },
      { metric: 'HRV', scale: '1-10', direction: 'increase', checkInFrequency: 'daily' },
    ],
    typicalDurationWeeks: 8,
    checkInSchedule: [7, 14, 28, 56],
  },
  {
    id: 'insomnia',
    symptom: 'Insomnia',
    category: 'mental',
    supplements: ['Glycine', 'Magnesium threonate', 'L-theanine'],
    peptide: 'DSIP',
    interventions: [
      { name: 'Glycine', type: 'supplement', dosageRange: '3g', timing: '30 min before bed', notes: 'Lowers core body temp' },
      { name: 'Magnesium threonate', type: 'supplement', dosageRange: '144mg elemental', timing: 'Evening', notes: 'Crosses BBB, calming' },
      { name: 'L-theanine', type: 'supplement', dosageRange: '200-400mg', timing: 'Evening', notes: 'Promotes alpha waves' },
      { name: 'DSIP', type: 'peptide', dosageRange: '100-200mcg', timing: 'Before bed', notes: 'Delta sleep-inducing peptide' },
    ],
    monitoring: ['Sleep onset latency', 'Sleep duration', 'Wake episodes', 'Morning energy'],
    synergies: ['restless-legs', 'stress-sensitivity'],
    // N-of-1 Trial Tracking
    expectedOutcomes: [
      { biomarkerId: 'hs-crp', metric: 'hs-CRP (inflammation)', direction: 'decrease', targetChange: 15, timeframeWeeks: 4, measurementMethod: 'blood test' },
    ],
    subjectiveOutcomes: [
      { metric: 'Sleep quality', scale: '1-10', direction: 'increase', checkInFrequency: 'daily' },
      { metric: 'Sleep onset latency (minutes)', scale: '1-10', direction: 'decrease', checkInFrequency: 'daily' },
      { metric: 'Night wakings', scale: '1-10', direction: 'decrease', checkInFrequency: 'daily' },
      { metric: 'Morning energy', scale: '1-10', direction: 'increase', checkInFrequency: 'daily' },
    ],
    typicalDurationWeeks: 4,
    checkInSchedule: [3, 7, 14, 28],
  },
  {
    id: 'brain-fog',
    symptom: 'Brain fog',
    category: 'mental',
    supplements: ['Thiamine B1', 'Choline', 'Omega-3'],
    peptide: 'Semax',
    interventions: [
      { name: 'Thiamine B1', type: 'supplement', dosageRange: '100-300mg', timing: 'Morning', notes: 'Benfotiamine form preferred' },
      { name: 'Choline', type: 'supplement', dosageRange: '500-1000mg', timing: 'Morning', notes: 'Alpha-GPC or CDP-choline' },
      { name: 'Omega-3', type: 'supplement', dosageRange: '2-3g EPA/DHA', timing: 'With meals' },
      { name: 'Semax', type: 'peptide', dosageRange: '200-600mcg', timing: 'Intranasal morning', notes: 'Cognitive enhancement' },
    ],
    monitoring: ['Mental clarity (1-10)', 'Task completion', 'Word recall'],
    synergies: ['poor-focus', 'mental-fatigue'],
    // N-of-1 Trial Tracking
    expectedOutcomes: [
      { biomarkerId: 'homocysteine', metric: 'Homocysteine', direction: 'decrease', targetChange: 20, timeframeWeeks: 8, measurementMethod: 'blood test' },
      { biomarkerId: 'hs-crp', metric: 'hs-CRP (neuroinflammation proxy)', direction: 'decrease', targetChange: 15, timeframeWeeks: 8, measurementMethod: 'blood test' },
    ],
    subjectiveOutcomes: [
      { metric: 'Mental clarity', scale: '1-10', direction: 'increase', checkInFrequency: 'daily' },
      { metric: 'Focus duration', scale: '1-10', direction: 'increase', checkInFrequency: 'daily' },
      { metric: 'Word recall ability', scale: '1-10', direction: 'increase', checkInFrequency: 'weekly' },
    ],
    typicalDurationWeeks: 8,
    checkInSchedule: [7, 14, 28, 56],
  },
  {
    id: 'depression',
    symptom: 'Depression',
    category: 'mental',
    supplements: ['Vitamin D', 'Omega-3', 'Methylfolate'],
    peptide: 'Selank',
    interventions: [
      { name: 'Vitamin D', type: 'supplement', dosageRange: '5000-10000 IU', timing: 'Morning with fat', notes: 'Test levels first' },
      { name: 'Omega-3', type: 'supplement', dosageRange: '2-4g EPA/DHA', timing: 'With meals', notes: 'Higher EPA for mood' },
      { name: 'Methylfolate', type: 'supplement', dosageRange: '400-800mcg', timing: 'Morning', notes: 'Active folate form' },
      { name: 'Selank', type: 'peptide', dosageRange: '250-500mcg', timing: 'Intranasal 1-2x daily', notes: 'Mood stabilizing' },
    ],
    monitoring: ['Mood rating', 'Energy levels', 'Social engagement', 'Vitamin D levels'],
    contraindications: ['Bipolar disorder without medical supervision'],
    synergies: ['emotional-numbness', 'low-motivation'],
  },
  {
    id: 'panic-attacks',
    symptom: 'Panic attacks',
    category: 'mental',
    supplements: ['Taurine', 'Magnesium', 'Vitamin B6'],
    peptide: 'Selank',
    interventions: [
      { name: 'Taurine', type: 'supplement', dosageRange: '1-3g', timing: 'Divided doses', notes: 'GABA modulator' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '300-600mg', timing: 'Divided doses', notes: 'Glycinate or threonate' },
      { name: 'Vitamin B6', type: 'supplement', dosageRange: '50-100mg', timing: 'Morning', notes: 'P5P form preferred' },
      { name: 'Selank', type: 'peptide', dosageRange: '250-500mcg', timing: 'As needed or 2x daily', notes: 'Acute and preventive' },
    ],
    monitoring: ['Panic frequency', 'Panic intensity', 'Trigger identification'],
    synergies: ['anxiety', 'heart-palpitations'],
  },
  {
    id: 'overthinking',
    symptom: 'Overthinking',
    category: 'mental',
    supplements: ['Inositol', 'Glycine', 'Magnesium'],
    peptide: 'Selank',
    interventions: [
      { name: 'Inositol', type: 'supplement', dosageRange: '2-4g', timing: 'Evening', notes: 'Calms repetitive thoughts' },
      { name: 'Glycine', type: 'supplement', dosageRange: '3g', timing: 'Evening', notes: 'Inhibitory neurotransmitter' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '300-400mg', timing: 'Evening' },
      { name: 'Selank', type: 'peptide', dosageRange: '250-500mcg', timing: 'Intranasal evening', notes: 'Quiets mental chatter' },
    ],
    monitoring: ['Racing thoughts frequency', 'Sleep onset', 'Rumination duration'],
    synergies: ['anxiety', 'insomnia'],
  },
  {
    id: 'low-motivation',
    symptom: 'Low motivation',
    category: 'mental',
    supplements: ['Tyrosine', 'Iron', 'Vitamin B3'],
    peptide: 'Semax',
    interventions: [
      { name: 'Tyrosine', type: 'supplement', dosageRange: '500-2000mg', timing: 'Morning fasted', notes: 'Dopamine precursor' },
      { name: 'Iron', type: 'supplement', dosageRange: '18-36mg', timing: 'Away from other supps', notes: 'Test ferritin first' },
      { name: 'Vitamin B3', type: 'supplement', dosageRange: '500mg', timing: 'With meals', notes: 'Niacinamide form' },
      { name: 'Semax', type: 'peptide', dosageRange: '200-600mcg', timing: 'Intranasal morning', notes: 'Dopaminergic support' },
    ],
    monitoring: ['Drive/initiative rating', 'Task initiation', 'Goal completion'],
    synergies: ['depression', 'chronic-fatigue'],
  },
  {
    id: 'poor-focus',
    symptom: 'Poor focus',
    category: 'mental',
    supplements: ['Zinc', 'Omega-3', 'Magnesium threonate'],
    peptide: 'Semax',
    interventions: [
      { name: 'Zinc', type: 'supplement', dosageRange: '15-30mg', timing: 'Evening with food', notes: 'Supports neurotransmitters' },
      { name: 'Omega-3', type: 'supplement', dosageRange: '2-3g EPA/DHA', timing: 'With meals' },
      { name: 'Magnesium threonate', type: 'supplement', dosageRange: '144mg elemental', timing: 'Morning and evening' },
      { name: 'Semax', type: 'peptide', dosageRange: '200-600mcg', timing: 'Intranasal morning', notes: 'Enhances focus and memory' },
    ],
    monitoring: ['Sustained attention duration', 'Task switching ability', 'Distraction frequency'],
    synergies: ['brain-fog', 'mental-fatigue'],
  },
  {
    id: 'mental-fatigue',
    symptom: 'Mental fatigue',
    category: 'mental',
    supplements: ['CoQ10', 'Creatine', 'Riboflavin B2'],
    peptide: 'NAD+',
    interventions: [
      { name: 'CoQ10', type: 'supplement', dosageRange: '100-300mg', timing: 'Morning with fat', notes: 'Ubiquinol form preferred' },
      { name: 'Creatine', type: 'supplement', dosageRange: '5g', timing: 'Any time', notes: 'Brain energy support' },
      { name: 'Riboflavin B2', type: 'supplement', dosageRange: '100-400mg', timing: 'With meals', notes: 'Mitochondrial support' },
      { name: 'NAD+', type: 'peptide', dosageRange: '100-250mg', timing: 'SubQ or IV', notes: 'Cellular energy restoration' },
    ],
    monitoring: ['Cognitive stamina', 'Afternoon energy', 'Recovery after mental work'],
    synergies: ['brain-fog', 'burnout'],
  },
  {
    id: 'stress-sensitivity',
    symptom: 'Stress sensitivity',
    category: 'mental',
    supplements: ['Vitamin C', 'Magnesium', 'Pantothenic acid B5'],
    peptide: 'Thymosin Alpha-1',
    interventions: [
      { name: 'Vitamin C', type: 'supplement', dosageRange: '1-2g', timing: 'Divided doses', notes: 'Adrenal support' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '300-600mg', timing: 'Divided doses', notes: 'Stress buffer' },
      { name: 'Pantothenic acid B5', type: 'supplement', dosageRange: '500-1000mg', timing: 'With meals', notes: 'Adrenal function' },
      { name: 'Thymosin Alpha-1', type: 'peptide', dosageRange: '1.6mg', timing: '2-3x weekly', notes: 'Immune-stress axis' },
    ],
    monitoring: ['Stress response intensity', 'Recovery time', 'Cortisol patterns'],
    synergies: ['burnout', 'anxiety'],
  },
  {
    id: 'burnout',
    symptom: 'Burnout',
    category: 'mental',
    supplements: ['Pantothenic acid B5', 'Vitamin C', 'Magnesium'],
    peptide: 'NAD+',
    interventions: [
      { name: 'Pantothenic acid B5', type: 'supplement', dosageRange: '500-1500mg', timing: 'Divided doses', notes: 'Adrenal recovery' },
      { name: 'Vitamin C', type: 'supplement', dosageRange: '2-3g', timing: 'Divided doses', notes: 'Cortisol regulation' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '400-600mg', timing: 'Evening', notes: 'Nervous system recovery' },
      { name: 'NAD+', type: 'peptide', dosageRange: '100-500mg', timing: 'SubQ or IV weekly', notes: 'Cellular restoration' },
    ],
    monitoring: ['Energy levels', 'Emotional resilience', 'Work capacity', 'Sleep quality'],
    synergies: ['chronic-fatigue', 'stress-sensitivity', 'mental-fatigue'],
  },
  {
    id: 'mood-swings',
    symptom: 'Mood swings',
    category: 'mental',
    supplements: ['Magnesium', 'Vitamin B6', 'Omega-3'],
    peptide: 'Selank',
    interventions: [
      { name: 'Magnesium', type: 'supplement', dosageRange: '300-500mg', timing: 'Divided doses' },
      { name: 'Vitamin B6', type: 'supplement', dosageRange: '50-100mg', timing: 'Morning', notes: 'P5P form' },
      { name: 'Omega-3', type: 'supplement', dosageRange: '2-3g EPA/DHA', timing: 'With meals' },
      { name: 'Selank', type: 'peptide', dosageRange: '250-500mcg', timing: 'Intranasal 2x daily', notes: 'Mood stabilization' },
    ],
    monitoring: ['Mood variability', 'Trigger identification', 'Cycle correlation'],
    synergies: ['pms', 'irritability'],
  },
  {
    id: 'emotional-numbness',
    symptom: 'Emotional numbness',
    category: 'mental',
    supplements: ['Vitamin B12', 'Folate', 'Omega-3'],
    peptide: 'Semax',
    interventions: [
      { name: 'Vitamin B12', type: 'supplement', dosageRange: '1000-5000mcg', timing: 'Morning', notes: 'Methylcobalamin form' },
      { name: 'Folate', type: 'supplement', dosageRange: '400-800mcg', timing: 'Morning', notes: 'Methylfolate form' },
      { name: 'Omega-3', type: 'supplement', dosageRange: '2-3g EPA/DHA', timing: 'With meals' },
      { name: 'Semax', type: 'peptide', dosageRange: '200-600mcg', timing: 'Intranasal morning', notes: 'Dopaminergic, emotional processing' },
    ],
    monitoring: ['Emotional range', 'Connection to others', 'Pleasure from activities'],
    synergies: ['depression', 'low-motivation'],
  },
  {
    id: 'social-anxiety',
    symptom: 'Social anxiety',
    category: 'mental',
    supplements: ['Magnesium', 'Vitamin B6', 'L-theanine'],
    peptide: 'Selank',
    interventions: [
      { name: 'Magnesium', type: 'supplement', dosageRange: '300-400mg', timing: 'Before social situations' },
      { name: 'Vitamin B6', type: 'supplement', dosageRange: '50mg', timing: 'Morning' },
      { name: 'L-theanine', type: 'supplement', dosageRange: '200-400mg', timing: 'Before social situations' },
      { name: 'Selank', type: 'peptide', dosageRange: '250-500mcg', timing: 'Intranasal before/daily', notes: 'Anxiolytic without sedation' },
    ],
    monitoring: ['Social comfort levels', 'Avoidance behaviors', 'Physical symptoms'],
    synergies: ['anxiety', 'panic-attacks'],
  },
  {
    id: 'irritability',
    symptom: 'Irritability',
    category: 'mental',
    supplements: ['Thiamine B1', 'Riboflavin B2', 'Magnesium'],
    peptide: 'Selank',
    interventions: [
      { name: 'Thiamine B1', type: 'supplement', dosageRange: '100-300mg', timing: 'Morning' },
      { name: 'Riboflavin B2', type: 'supplement', dosageRange: '100mg', timing: 'Morning' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '300-500mg', timing: 'Evening' },
      { name: 'Selank', type: 'peptide', dosageRange: '250-500mcg', timing: 'Intranasal 2x daily' },
    ],
    monitoring: ['Irritability triggers', 'Reaction intensity', 'Recovery time'],
    synergies: ['mood-swings', 'stress-sensitivity'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ENERGY & FATIGUE
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'chronic-fatigue',
    symptom: 'Chronic fatigue',
    category: 'energy',
    supplements: ['Vitamin B12', 'CoQ10', 'Magnesium'],
    peptide: 'MOTS-c',
    interventions: [
      { name: 'Vitamin B12', type: 'supplement', dosageRange: '1000-5000mcg', timing: 'Morning', notes: 'Test levels first' },
      { name: 'CoQ10', type: 'supplement', dosageRange: '200-400mg', timing: 'Morning', notes: 'Ubiquinol form' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '300-600mg', timing: 'Divided doses' },
      { name: 'MOTS-c', type: 'peptide', dosageRange: '5-10mg', timing: '3-5x weekly', notes: 'Mitochondrial optimization' },
    ],
    monitoring: ['Energy levels AM/PM', 'Activity tolerance', 'Post-exertional malaise'],
    synergies: ['low-stamina', 'mental-fatigue', 'burnout'],
  },
  {
    id: 'low-stamina',
    symptom: 'Low stamina',
    category: 'energy',
    supplements: ['Iron', 'Copper', 'Vitamin B1'],
    peptide: 'MOTS-c',
    interventions: [
      { name: 'Iron', type: 'supplement', dosageRange: '18-36mg', timing: 'Away from other supplements', notes: 'Test ferritin first' },
      { name: 'Copper', type: 'supplement', dosageRange: '1-2mg', timing: 'With zinc', notes: 'Iron metabolism' },
      { name: 'Vitamin B1', type: 'supplement', dosageRange: '100-300mg', timing: 'Morning' },
      { name: 'MOTS-c', type: 'peptide', dosageRange: '5-10mg', timing: '3-5x weekly', notes: 'Endurance enhancement' },
    ],
    monitoring: ['Exercise capacity', 'Recovery time', 'Hemoglobin/ferritin'],
    synergies: ['chronic-fatigue', 'low-endurance'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PHYSICAL PERFORMANCE & RECOVERY
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'poor-recovery',
    symptom: 'Poor recovery',
    category: 'physical',
    supplements: ['Magnesium', 'Vitamin C', 'Zinc'],
    peptide: 'TB-500',
    interventions: [
      { name: 'Magnesium', type: 'supplement', dosageRange: '400-600mg', timing: 'Post-workout and evening' },
      { name: 'Vitamin C', type: 'supplement', dosageRange: '1-2g', timing: 'Post-workout' },
      { name: 'Zinc', type: 'supplement', dosageRange: '30-50mg', timing: 'Evening' },
      { name: 'TB-500', type: 'peptide', dosageRange: '2.5-5mg', timing: '2x weekly', notes: 'Tissue repair and recovery' },
    ],
    monitoring: ['DOMS duration', 'Performance consistency', 'Sleep quality'],
    synergies: ['muscle-soreness', 'slow-healing'],
  },
  {
    id: 'muscle-soreness',
    symptom: 'Muscle soreness',
    category: 'physical',
    supplements: ['Vitamin D', 'Magnesium', 'Curcumin'],
    peptide: 'BPC-157',
    interventions: [
      { name: 'Vitamin D', type: 'supplement', dosageRange: '5000 IU', timing: 'Morning with fat' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '400-600mg', timing: 'Post-workout' },
      { name: 'Curcumin', type: 'supplement', dosageRange: '500-1000mg', timing: 'With meals', notes: 'With piperine' },
      { name: 'BPC-157', type: 'peptide', dosageRange: '250-500mcg', timing: '1-2x daily', notes: 'Anti-inflammatory, repair' },
    ],
    monitoring: ['Soreness duration', 'Mobility', 'Training capacity'],
    synergies: ['poor-recovery', 'post-workout-inflammation'],
  },
  {
    id: 'weak-workouts',
    symptom: 'Weak workouts',
    category: 'physical',
    supplements: ['Creatine', 'Magnesium', 'Vitamin D'],
    peptide: 'IGF-1 LR3',
    interventions: [
      { name: 'Creatine', type: 'supplement', dosageRange: '5g', timing: 'Daily, any time' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '400mg', timing: 'Pre-workout' },
      { name: 'Vitamin D', type: 'supplement', dosageRange: '5000 IU', timing: 'Morning' },
      { name: 'IGF-1 LR3', type: 'peptide', dosageRange: '20-50mcg', timing: 'Post-workout', notes: 'Anabolic, strength support' },
    ],
    monitoring: ['Strength metrics', 'Rep performance', 'Energy during workout'],
    contraindications: ['History of cancer'],
    synergies: ['low-strength', 'exercise-intolerance'],
  },
  {
    id: 'exercise-intolerance',
    symptom: 'Exercise intolerance',
    category: 'physical',
    supplements: ['CoQ10', 'Ribose', 'Magnesium'],
    peptide: 'MOTS-c',
    interventions: [
      { name: 'CoQ10', type: 'supplement', dosageRange: '200-400mg', timing: 'Morning', notes: 'Ubiquinol form' },
      { name: 'Ribose', type: 'supplement', dosageRange: '5g', timing: 'Pre/post workout', notes: 'ATP regeneration' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '400mg', timing: 'Divided doses' },
      { name: 'MOTS-c', type: 'peptide', dosageRange: '5-10mg', timing: '3-5x weekly', notes: 'Mitochondrial function' },
    ],
    monitoring: ['Exercise tolerance', 'Heart rate recovery', 'Post-exertional symptoms'],
    synergies: ['chronic-fatigue', 'low-vo2-fitness'],
  },
  {
    id: 'slow-healing',
    symptom: 'Slow healing',
    category: 'physical',
    supplements: ['Vitamin C', 'Zinc', 'Protein'],
    peptide: 'BPC-157',
    interventions: [
      { name: 'Vitamin C', type: 'supplement', dosageRange: '1-2g', timing: 'Divided doses', notes: 'Collagen synthesis' },
      { name: 'Zinc', type: 'supplement', dosageRange: '30-50mg', timing: 'With meals' },
      { name: 'Protein', type: 'supplement', dosageRange: '1.2-1.6g/kg', timing: 'Throughout day' },
      { name: 'BPC-157', type: 'peptide', dosageRange: '250-500mcg', timing: '1-2x daily', notes: 'Accelerates healing' },
    ],
    monitoring: ['Wound healing time', 'Bruise resolution', 'Tissue repair'],
    synergies: ['easy-bruising', 'frequent-injuries'],
  },
  {
    id: 'frequent-injuries',
    symptom: 'Frequent injuries',
    category: 'physical',
    supplements: ['Collagen', 'Vitamin C', 'Copper'],
    peptide: 'TB-500',
    interventions: [
      { name: 'Collagen', type: 'supplement', dosageRange: '10-20g', timing: '30-60 min before training' },
      { name: 'Vitamin C', type: 'supplement', dosageRange: '500mg', timing: 'With collagen' },
      { name: 'Copper', type: 'supplement', dosageRange: '2mg', timing: 'With meals' },
      { name: 'TB-500', type: 'peptide', dosageRange: '2.5-5mg', timing: '2x weekly', notes: 'Tissue resilience' },
    ],
    monitoring: ['Injury frequency', 'Recovery time', 'Connective tissue health'],
    synergies: ['tendon-pain', 'joint-pain'],
  },
  {
    id: 'low-strength',
    symptom: 'Low strength',
    category: 'physical',
    supplements: ['Creatine', 'Zinc', 'Vitamin D'],
    peptide: 'CJC-1295',
    interventions: [
      { name: 'Creatine', type: 'supplement', dosageRange: '5g', timing: 'Daily' },
      { name: 'Zinc', type: 'supplement', dosageRange: '30mg', timing: 'Evening' },
      { name: 'Vitamin D', type: 'supplement', dosageRange: '5000 IU', timing: 'Morning' },
      { name: 'CJC-1295', type: 'peptide', dosageRange: '100mcg', timing: 'Before bed', notes: 'GH secretagogue' },
    ],
    monitoring: ['Strength benchmarks', 'Muscle measurements', 'Hormone panel'],
    synergies: ['weak-workouts', 'low-testosterone-symptoms'],
  },
  {
    id: 'low-endurance',
    symptom: 'Low endurance',
    category: 'physical',
    supplements: ['Iron', 'B12', 'CoQ10'],
    peptide: 'MOTS-c',
    interventions: [
      { name: 'Iron', type: 'supplement', dosageRange: '18-36mg', timing: 'Morning', notes: 'If deficient' },
      { name: 'Vitamin B12', type: 'supplement', dosageRange: '1000mcg', timing: 'Morning' },
      { name: 'CoQ10', type: 'supplement', dosageRange: '200mg', timing: 'Morning' },
      { name: 'MOTS-c', type: 'peptide', dosageRange: '5-10mg', timing: '3-5x weekly', notes: 'Endurance optimization' },
    ],
    monitoring: ['Cardio capacity', 'Recovery between sets', 'VO2 improvements'],
    synergies: ['low-stamina', 'low-vo2-fitness'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SKIN, HAIR & NAILS
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'hair-thinning',
    symptom: 'Hair thinning',
    category: 'skin',
    supplements: ['Iron', 'Zinc', 'Biotin'],
    peptide: 'GHK-Cu',
    interventions: [
      { name: 'Iron', type: 'supplement', dosageRange: '18-36mg', timing: 'If deficient', notes: 'Test ferritin' },
      { name: 'Zinc', type: 'supplement', dosageRange: '30mg', timing: 'Evening' },
      { name: 'Biotin', type: 'supplement', dosageRange: '5000mcg', timing: 'With meals' },
      { name: 'GHK-Cu', type: 'peptide', dosageRange: '1-2mg', timing: 'SubQ or topical', notes: 'Hair follicle stimulation' },
    ],
    monitoring: ['Hair density', 'Shedding rate', 'New growth', 'Ferritin levels'],
    synergies: ['brittle-nails', 'dry-skin'],
  },
  {
    id: 'dry-skin',
    symptom: 'Dry skin',
    category: 'skin',
    supplements: ['Omega-3', 'Vitamin A', 'Zinc'],
    peptide: 'GHK-Cu',
    interventions: [
      { name: 'Omega-3', type: 'supplement', dosageRange: '2-3g', timing: 'With meals' },
      { name: 'Vitamin A', type: 'supplement', dosageRange: '5000-10000 IU', timing: 'With fat', notes: 'Or beta-carotene' },
      { name: 'Zinc', type: 'supplement', dosageRange: '15-30mg', timing: 'Evening' },
      { name: 'GHK-Cu', type: 'peptide', dosageRange: '1-2mg', timing: 'SubQ or topical', notes: 'Skin hydration support' },
    ],
    monitoring: ['Skin hydration', 'Elasticity', 'Flakiness'],
    synergies: ['brittle-nails', 'poor-complexion'],
  },
  {
    id: 'brittle-nails',
    symptom: 'Brittle nails',
    category: 'skin',
    supplements: ['Zinc', 'Selenium', 'Biotin'],
    peptide: 'GHK-Cu',
    interventions: [
      { name: 'Zinc', type: 'supplement', dosageRange: '30mg', timing: 'Evening' },
      { name: 'Selenium', type: 'supplement', dosageRange: '200mcg', timing: 'With meals' },
      { name: 'Biotin', type: 'supplement', dosageRange: '5000mcg', timing: 'With meals' },
      { name: 'GHK-Cu', type: 'peptide', dosageRange: '1-2mg', timing: 'SubQ', notes: 'Nail matrix support' },
    ],
    monitoring: ['Nail strength', 'Growth rate', 'Ridging'],
    synergies: ['hair-thinning', 'dry-skin'],
  },
  {
    id: 'adult-acne',
    symptom: 'Adult acne',
    category: 'skin',
    supplements: ['Zinc', 'Vitamin A', 'Pantothenic acid B5'],
    peptide: 'BPC-157',
    interventions: [
      { name: 'Zinc', type: 'supplement', dosageRange: '30-50mg', timing: 'Evening', notes: 'Sebum regulation' },
      { name: 'Vitamin A', type: 'supplement', dosageRange: '10000 IU', timing: 'With fat', notes: 'Skin cell turnover' },
      { name: 'Pantothenic acid B5', type: 'supplement', dosageRange: '500-1000mg', timing: 'Divided doses' },
      { name: 'BPC-157', type: 'peptide', dosageRange: '250mcg', timing: '1-2x daily', notes: 'Anti-inflammatory, healing' },
    ],
    monitoring: ['Breakout frequency', 'Inflammation level', 'Scarring'],
    contraindications: ['Pregnancy (high-dose vitamin A)'],
    synergies: ['gut-inflammation', 'hormonal-imbalance'],
  },
  {
    id: 'eczema-flares',
    symptom: 'Eczema flares',
    category: 'skin',
    supplements: ['Vitamin D', 'Omega-3', 'Zinc'],
    peptide: 'Thymosin Alpha-1',
    interventions: [
      { name: 'Vitamin D', type: 'supplement', dosageRange: '5000-10000 IU', timing: 'Morning' },
      { name: 'Omega-3', type: 'supplement', dosageRange: '3-4g', timing: 'With meals' },
      { name: 'Zinc', type: 'supplement', dosageRange: '30mg', timing: 'Evening' },
      { name: 'Thymosin Alpha-1', type: 'peptide', dosageRange: '1.6mg', timing: '2-3x weekly', notes: 'Immune modulation' },
    ],
    monitoring: ['Flare frequency', 'Severity', 'Trigger identification'],
    synergies: ['food-sensitivity-reactions', 'chronic-inflammation'],
  },
  {
    id: 'psoriasis-flares',
    symptom: 'Psoriasis flares',
    category: 'skin',
    supplements: ['Vitamin D', 'Omega-3', 'Selenium'],
    peptide: 'Thymosin Alpha-1',
    interventions: [
      { name: 'Vitamin D', type: 'supplement', dosageRange: '5000-10000 IU', timing: 'Morning' },
      { name: 'Omega-3', type: 'supplement', dosageRange: '3-4g', timing: 'With meals' },
      { name: 'Selenium', type: 'supplement', dosageRange: '200mcg', timing: 'With meals' },
      { name: 'Thymosin Alpha-1', type: 'peptide', dosageRange: '1.6mg', timing: '2-3x weekly', notes: 'Autoimmune modulation' },
    ],
    monitoring: ['Plaque coverage', 'Flare duration', 'Triggers'],
    synergies: ['autoimmune-flares', 'chronic-inflammation'],
  },
  {
    id: 'slow-skin-repair',
    symptom: 'Slow skin repair',
    category: 'skin',
    supplements: ['Vitamin C', 'Copper', 'Collagen'],
    peptide: 'GHK-Cu',
    interventions: [
      { name: 'Vitamin C', type: 'supplement', dosageRange: '1-2g', timing: 'Divided doses' },
      { name: 'Copper', type: 'supplement', dosageRange: '2mg', timing: 'With meals' },
      { name: 'Collagen', type: 'supplement', dosageRange: '10-20g', timing: 'Morning' },
      { name: 'GHK-Cu', type: 'peptide', dosageRange: '1-2mg', timing: 'SubQ or topical', notes: 'Accelerates skin repair' },
    ],
    monitoring: ['Wound healing time', 'Scar formation', 'Skin regeneration'],
    synergies: ['slow-healing', 'easy-bruising'],
  },
  {
    id: 'easy-bruising',
    symptom: 'Easy bruising',
    category: 'skin',
    supplements: ['Vitamin C', 'Vitamin K2', 'Bioflavonoids'],
    peptide: 'BPC-157',
    interventions: [
      { name: 'Vitamin C', type: 'supplement', dosageRange: '1-2g', timing: 'Divided doses' },
      { name: 'Vitamin K2', type: 'supplement', dosageRange: '100-200mcg', timing: 'With fat', notes: 'MK-7 form' },
      { name: 'Bioflavonoids', type: 'supplement', dosageRange: '500-1000mg', timing: 'With vitamin C' },
      { name: 'BPC-157', type: 'peptide', dosageRange: '250mcg', timing: '1-2x daily', notes: 'Vascular integrity' },
    ],
    monitoring: ['Bruising frequency', 'Resolution time', 'Platelet count'],
    synergies: ['slow-healing', 'low-circulation'],
  },
  {
    id: 'premature-aging',
    symptom: 'Premature aging',
    category: 'skin',
    supplements: ['Collagen', 'Vitamin C', 'Astaxanthin'],
    peptide: 'GHK-Cu',
    interventions: [
      { name: 'Collagen', type: 'supplement', dosageRange: '10-20g', timing: 'Morning' },
      { name: 'Vitamin C', type: 'supplement', dosageRange: '1g', timing: 'With collagen' },
      { name: 'Astaxanthin', type: 'supplement', dosageRange: '4-12mg', timing: 'With fat', notes: 'Powerful antioxidant' },
      { name: 'GHK-Cu', type: 'peptide', dosageRange: '1-2mg', timing: 'SubQ or topical', notes: 'Anti-aging, collagen remodeling' },
    ],
    monitoring: ['Skin elasticity', 'Fine lines', 'Hydration', 'Oxidative markers'],
    synergies: ['poor-complexion', 'dry-skin'],
  },
  {
    id: 'poor-complexion',
    symptom: 'Poor complexion',
    category: 'skin',
    supplements: ['Vitamin C', 'Vitamin E', 'Omega-3'],
    peptide: 'GHK-Cu',
    interventions: [
      { name: 'Vitamin C', type: 'supplement', dosageRange: '1g', timing: 'Morning' },
      { name: 'Vitamin E', type: 'supplement', dosageRange: '400 IU', timing: 'With fat', notes: 'Mixed tocopherols' },
      { name: 'Omega-3', type: 'supplement', dosageRange: '2-3g', timing: 'With meals' },
      { name: 'GHK-Cu', type: 'peptide', dosageRange: '1-2mg', timing: 'SubQ or topical', notes: 'Skin tone and texture' },
    ],
    monitoring: ['Skin tone', 'Radiance', 'Blemishes', 'Texture'],
    synergies: ['dry-skin', 'premature-aging'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DIGESTIVE HEALTH
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'bloating',
    symptom: 'Bloating',
    category: 'digestive',
    supplements: ['Digestive enzymes', 'Ginger', 'Magnesium'],
    peptide: 'BPC-157',
    interventions: [
      { name: 'Digestive enzymes', type: 'supplement', dosageRange: '1-2 caps', timing: 'With meals' },
      { name: 'Ginger', type: 'supplement', dosageRange: '500-1000mg', timing: 'Before meals' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '300-400mg', timing: 'Evening', notes: 'Citrate or glycinate' },
      { name: 'BPC-157', type: 'peptide', dosageRange: '250-500mcg', timing: '1-2x daily', notes: 'Gut healing' },
    ],
    monitoring: ['Bloating severity', 'Trigger foods', 'Bowel regularity'],
    synergies: ['gas', 'slow-digestion'],
  },
  {
    id: 'acid-reflux',
    symptom: 'Acid reflux',
    category: 'digestive',
    supplements: ['Zinc carnosine', 'Thiamine B1', 'Magnesium'],
    peptide: 'BPC-157',
    interventions: [
      { name: 'Zinc carnosine', type: 'supplement', dosageRange: '75mg', timing: 'Between meals', notes: 'Mucosal healing' },
      { name: 'Thiamine B1', type: 'supplement', dosageRange: '100-300mg', timing: 'Morning' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '300mg', timing: 'Evening' },
      { name: 'BPC-157', type: 'peptide', dosageRange: '250-500mcg', timing: '1-2x daily', notes: 'Esophageal/gastric healing' },
    ],
    monitoring: ['Reflux frequency', 'Severity', 'Trigger identification'],
    synergies: ['bloating', 'nausea'],
  },
  {
    id: 'constipation',
    symptom: 'Constipation',
    category: 'digestive',
    supplements: ['Magnesium citrate', 'Vitamin C', 'PHGG fiber'],
    peptide: 'BPC-157',
    interventions: [
      { name: 'Magnesium citrate', type: 'supplement', dosageRange: '300-600mg', timing: 'Evening', notes: 'Osmotic effect' },
      { name: 'Vitamin C', type: 'supplement', dosageRange: '1-3g', timing: 'Divided doses', notes: 'Bowel tolerance' },
      { name: 'PHGG fiber', type: 'supplement', dosageRange: '5-10g', timing: 'With water', notes: 'Gentle, prebiotic' },
      { name: 'BPC-157', type: 'peptide', dosageRange: '250-500mcg', timing: '1-2x daily', notes: 'Gut motility support' },
    ],
    monitoring: ['Bowel frequency', 'Stool consistency', 'Straining'],
    synergies: ['bloating', 'slow-digestion'],
  },
  {
    id: 'gas',
    symptom: 'Gas',
    category: 'digestive',
    supplements: ['Peppermint oil', 'Magnesium', 'PHGG fiber'],
    peptide: 'BPC-157',
    interventions: [
      { name: 'Peppermint oil', type: 'supplement', dosageRange: '180mg', timing: 'Enteric-coated, before meals' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '300mg', timing: 'Evening' },
      { name: 'PHGG fiber', type: 'supplement', dosageRange: '5g', timing: 'With water' },
      { name: 'BPC-157', type: 'peptide', dosageRange: '250mcg', timing: '1-2x daily', notes: 'Gut lining support' },
    ],
    monitoring: ['Gas frequency', 'Odor', 'Associated symptoms'],
    synergies: ['bloating', 'ibs-symptoms'],
  },
  {
    id: 'diarrhea',
    symptom: 'Diarrhea',
    category: 'digestive',
    supplements: ['Zinc', 'Electrolytes', 'Vitamin A'],
    peptide: 'BPC-157',
    interventions: [
      { name: 'Zinc', type: 'supplement', dosageRange: '30-50mg', timing: 'With meals' },
      { name: 'Electrolytes', type: 'supplement', dosageRange: 'As needed', timing: 'Throughout day' },
      { name: 'Vitamin A', type: 'supplement', dosageRange: '10000 IU', timing: 'With fat', notes: 'Gut lining repair' },
      { name: 'BPC-157', type: 'peptide', dosageRange: '250-500mcg', timing: '1-2x daily', notes: 'Intestinal healing' },
    ],
    monitoring: ['Frequency', 'Consistency', 'Hydration status'],
    synergies: ['ibs-symptoms', 'food-sensitivity-reactions'],
  },
  {
    id: 'ibs-symptoms',
    symptom: 'IBS symptoms',
    category: 'digestive',
    supplements: ['Vitamin D', 'Zinc', 'Magnesium'],
    peptide: 'BPC-157',
    interventions: [
      { name: 'Vitamin D', type: 'supplement', dosageRange: '5000 IU', timing: 'Morning' },
      { name: 'Zinc', type: 'supplement', dosageRange: '30mg', timing: 'Evening' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '300-400mg', timing: 'Evening' },
      { name: 'BPC-157', type: 'peptide', dosageRange: '250-500mcg', timing: '1-2x daily', notes: 'Gut-brain axis support' },
    ],
    monitoring: ['Symptom diary', 'Flare triggers', 'Stool patterns'],
    synergies: ['bloating', 'gas', 'food-sensitivity-reactions'],
  },
  {
    id: 'food-sensitivity-reactions',
    symptom: 'Food sensitivity reactions',
    category: 'digestive',
    supplements: ['Vitamin A', 'Zinc', 'Vitamin D'],
    peptide: 'Thymosin Alpha-1',
    interventions: [
      { name: 'Vitamin A', type: 'supplement', dosageRange: '10000 IU', timing: 'With fat' },
      { name: 'Zinc', type: 'supplement', dosageRange: '30mg', timing: 'Evening' },
      { name: 'Vitamin D', type: 'supplement', dosageRange: '5000 IU', timing: 'Morning' },
      { name: 'Thymosin Alpha-1', type: 'peptide', dosageRange: '1.6mg', timing: '2-3x weekly', notes: 'Immune tolerance' },
    ],
    monitoring: ['Reaction severity', 'Trigger identification', 'Gut symptoms'],
    synergies: ['ibs-symptoms', 'histamine-reactions'],
  },
  {
    id: 'nausea',
    symptom: 'Nausea',
    category: 'digestive',
    supplements: ['Vitamin B6', 'Ginger', 'Magnesium'],
    peptide: 'BPC-157',
    interventions: [
      { name: 'Vitamin B6', type: 'supplement', dosageRange: '25-50mg', timing: 'As needed' },
      { name: 'Ginger', type: 'supplement', dosageRange: '500-1000mg', timing: 'Before meals or as needed' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '200mg', timing: 'As needed' },
      { name: 'BPC-157', type: 'peptide', dosageRange: '250mcg', timing: '1-2x daily', notes: 'Gastric support' },
    ],
    monitoring: ['Nausea frequency', 'Triggers', 'Associated symptoms'],
    synergies: ['acid-reflux', 'dizziness'],
  },
  {
    id: 'poor-appetite',
    symptom: 'Poor appetite',
    category: 'digestive',
    supplements: ['Zinc', 'Thiamine B1', 'Vitamin B12'],
    peptide: 'Ipamorelin',
    interventions: [
      { name: 'Zinc', type: 'supplement', dosageRange: '30mg', timing: 'Before meals', notes: 'Taste/appetite' },
      { name: 'Thiamine B1', type: 'supplement', dosageRange: '100mg', timing: 'Morning' },
      { name: 'Vitamin B12', type: 'supplement', dosageRange: '1000mcg', timing: 'Morning' },
      { name: 'Ipamorelin', type: 'peptide', dosageRange: '200-300mcg', timing: 'Before bed', notes: 'GH release, appetite support' },
    ],
    monitoring: ['Appetite rating', 'Food intake', 'Weight'],
    synergies: ['chronic-fatigue', 'depression'],
  },
  {
    id: 'slow-digestion',
    symptom: 'Slow digestion',
    category: 'digestive',
    supplements: ['Betaine HCL', 'Zinc', 'Ginger'],
    peptide: 'BPC-157',
    interventions: [
      { name: 'Betaine HCL', type: 'supplement', dosageRange: '650mg', timing: 'With protein meals', notes: 'Stomach acid support' },
      { name: 'Zinc', type: 'supplement', dosageRange: '30mg', timing: 'Away from HCL' },
      { name: 'Ginger', type: 'supplement', dosageRange: '500mg', timing: 'Before meals' },
      { name: 'BPC-157', type: 'peptide', dosageRange: '250mcg', timing: '1-2x daily', notes: 'Motility support' },
    ],
    monitoring: ['Digestion time', 'Fullness duration', 'Discomfort'],
    synergies: ['bloating', 'constipation'],
  },
  {
    id: 'gut-inflammation',
    symptom: 'Gut inflammation',
    category: 'digestive',
    supplements: ['Omega-3', 'Curcumin', 'Zinc'],
    peptide: 'BPC-157',
    interventions: [
      { name: 'Omega-3', type: 'supplement', dosageRange: '3-4g', timing: 'With meals' },
      { name: 'Curcumin', type: 'supplement', dosageRange: '500-1000mg', timing: 'With meals', notes: 'With piperine' },
      { name: 'Zinc', type: 'supplement', dosageRange: '30mg', timing: 'Evening' },
      { name: 'BPC-157', type: 'peptide', dosageRange: '250-500mcg', timing: '1-2x daily', notes: 'Anti-inflammatory, healing' },
    ],
    monitoring: ['Inflammatory markers', 'Gut symptoms', 'Stool changes'],
    synergies: ['chronic-inflammation', 'ibs-symptoms'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // IMMUNE SYSTEM
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'frequent-colds',
    symptom: 'Frequent colds',
    category: 'immune',
    supplements: ['Vitamin D', 'Zinc', 'Vitamin C'],
    peptide: 'Thymosin Alpha-1',
    interventions: [
      { name: 'Vitamin D', type: 'supplement', dosageRange: '5000-10000 IU', timing: 'Morning', notes: 'Test levels' },
      { name: 'Zinc', type: 'supplement', dosageRange: '30-50mg', timing: 'With meals' },
      { name: 'Vitamin C', type: 'supplement', dosageRange: '1-2g', timing: 'Divided doses' },
      { name: 'Thymosin Alpha-1', type: 'peptide', dosageRange: '1.6mg', timing: '2-3x weekly', notes: 'Immune enhancement' },
    ],
    monitoring: ['Cold frequency', 'Duration', 'Severity'],
    synergies: ['slow-immune-recovery', 'frequent-infections'],
  },
  {
    id: 'sinus-congestion',
    symptom: 'Sinus congestion',
    category: 'immune',
    supplements: ['Quercetin', 'Vitamin C', 'Zinc'],
    peptide: 'Thymosin Alpha-1',
    interventions: [
      { name: 'Quercetin', type: 'supplement', dosageRange: '500-1000mg', timing: 'Divided doses', notes: 'Natural antihistamine' },
      { name: 'Vitamin C', type: 'supplement', dosageRange: '1-2g', timing: 'Divided doses' },
      { name: 'Zinc', type: 'supplement', dosageRange: '30mg', timing: 'With meals' },
      { name: 'Thymosin Alpha-1', type: 'peptide', dosageRange: '1.6mg', timing: '2-3x weekly', notes: 'Immune modulation' },
    ],
    monitoring: ['Congestion severity', 'Duration', 'Triggers'],
    synergies: ['seasonal-allergies', 'histamine-reactions'],
  },
  {
    id: 'seasonal-allergies',
    symptom: 'Seasonal allergies',
    category: 'immune',
    supplements: ['Vitamin C', 'Quercetin', 'Magnesium'],
    peptide: 'Thymosin Alpha-1',
    interventions: [
      { name: 'Vitamin C', type: 'supplement', dosageRange: '2-3g', timing: 'Divided doses' },
      { name: 'Quercetin', type: 'supplement', dosageRange: '500-1000mg', timing: 'Divided doses' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '400mg', timing: 'Evening' },
      { name: 'Thymosin Alpha-1', type: 'peptide', dosageRange: '1.6mg', timing: '2-3x weekly', notes: 'Immune balance' },
    ],
    monitoring: ['Symptom severity', 'Medication usage', 'Quality of life'],
    synergies: ['sinus-congestion', 'histamine-reactions'],
  },
  {
    id: 'histamine-reactions',
    symptom: 'Histamine reactions',
    category: 'immune',
    supplements: ['Vitamin C', 'Vitamin B6', 'Copper'],
    peptide: 'Thymosin Alpha-1',
    interventions: [
      { name: 'Vitamin C', type: 'supplement', dosageRange: '2-3g', timing: 'Divided doses', notes: 'Histamine degradation' },
      { name: 'Vitamin B6', type: 'supplement', dosageRange: '50-100mg', timing: 'Morning', notes: 'DAO cofactor' },
      { name: 'Copper', type: 'supplement', dosageRange: '2mg', timing: 'With meals', notes: 'DAO cofactor' },
      { name: 'Thymosin Alpha-1', type: 'peptide', dosageRange: '1.6mg', timing: '2-3x weekly', notes: 'Immune regulation' },
    ],
    monitoring: ['Reaction frequency', 'Trigger foods', 'Symptom severity'],
    synergies: ['food-sensitivity-reactions', 'seasonal-allergies'],
  },
  {
    id: 'asthma-tendency',
    symptom: 'Asthma tendency',
    category: 'immune',
    supplements: ['Magnesium', 'Vitamin D', 'Omega-3'],
    peptide: 'Thymosin Alpha-1',
    interventions: [
      { name: 'Magnesium', type: 'supplement', dosageRange: '400-600mg', timing: 'Divided doses', notes: 'Bronchodilation' },
      { name: 'Vitamin D', type: 'supplement', dosageRange: '5000 IU', timing: 'Morning' },
      { name: 'Omega-3', type: 'supplement', dosageRange: '2-3g', timing: 'With meals' },
      { name: 'Thymosin Alpha-1', type: 'peptide', dosageRange: '1.6mg', timing: '2-3x weekly', notes: 'Airway inflammation' },
    ],
    monitoring: ['Peak flow', 'Rescue inhaler use', 'Triggers'],
    synergies: ['seasonal-allergies', 'chronic-inflammation'],
  },
  {
    id: 'autoimmune-flares',
    symptom: 'Autoimmune flares',
    category: 'immune',
    supplements: ['Vitamin D', 'Omega-3', 'Selenium'],
    peptide: 'Thymosin Alpha-1',
    interventions: [
      { name: 'Vitamin D', type: 'supplement', dosageRange: '5000-10000 IU', timing: 'Morning', notes: 'Immune modulation' },
      { name: 'Omega-3', type: 'supplement', dosageRange: '3-4g', timing: 'With meals' },
      { name: 'Selenium', type: 'supplement', dosageRange: '200mcg', timing: 'With meals' },
      { name: 'Thymosin Alpha-1', type: 'peptide', dosageRange: '1.6mg', timing: '2-3x weekly', notes: 'Immune tolerance' },
    ],
    monitoring: ['Flare frequency', 'Inflammatory markers', 'Symptom severity'],
    contraindications: ['Consult rheumatologist for peptide use'],
    synergies: ['chronic-inflammation', 'psoriasis-flares', 'eczema-flares'],
  },
  {
    id: 'slow-immune-recovery',
    symptom: 'Slow immune recovery',
    category: 'immune',
    supplements: ['Zinc', 'Vitamin C', 'Protein'],
    peptide: 'Thymosin Alpha-1',
    interventions: [
      { name: 'Zinc', type: 'supplement', dosageRange: '30-50mg', timing: 'With meals' },
      { name: 'Vitamin C', type: 'supplement', dosageRange: '2g', timing: 'Divided doses' },
      { name: 'Protein', type: 'supplement', dosageRange: '1.2-1.6g/kg', timing: 'Throughout day' },
      { name: 'Thymosin Alpha-1', type: 'peptide', dosageRange: '1.6mg', timing: '2-3x weekly', notes: 'Immune restoration' },
    ],
    monitoring: ['Recovery time', 'Symptom duration', 'Secondary infections'],
    synergies: ['frequent-colds', 'frequent-infections'],
  },
  {
    id: 'chronic-inflammation',
    symptom: 'Chronic inflammation',
    category: 'immune',
    supplements: ['Omega-3', 'Curcumin', 'Magnesium'],
    peptide: 'BPC-157',
    interventions: [
      { name: 'Omega-3', type: 'supplement', dosageRange: '3-4g', timing: 'With meals' },
      { name: 'Curcumin', type: 'supplement', dosageRange: '500-1000mg', timing: 'With meals', notes: 'With piperine' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '400mg', timing: 'Evening' },
      { name: 'BPC-157', type: 'peptide', dosageRange: '250-500mcg', timing: '1-2x daily', notes: 'Systemic anti-inflammatory' },
    ],
    monitoring: ['CRP', 'ESR', 'Symptom levels', 'Pain/stiffness'],
    synergies: ['joint-pain', 'gut-inflammation'],
  },
  {
    id: 'frequent-infections',
    symptom: 'Frequent infections',
    category: 'immune',
    supplements: ['Vitamin D', 'Zinc', 'Selenium'],
    peptide: 'Thymosin Alpha-1',
    interventions: [
      { name: 'Vitamin D', type: 'supplement', dosageRange: '5000-10000 IU', timing: 'Morning' },
      { name: 'Zinc', type: 'supplement', dosageRange: '30-50mg', timing: 'With meals' },
      { name: 'Selenium', type: 'supplement', dosageRange: '200mcg', timing: 'With meals' },
      { name: 'Thymosin Alpha-1', type: 'peptide', dosageRange: '1.6mg', timing: '2-3x weekly', notes: 'Immune competence' },
    ],
    monitoring: ['Infection frequency', 'Types', 'Duration', 'Vitamin D levels'],
    synergies: ['frequent-colds', 'slow-immune-recovery'],
  },
  {
    id: 'long-haul-symptoms',
    symptom: 'Long haul symptoms',
    category: 'immune',
    supplements: ['Vitamin D', 'Zinc', 'Omega-3'],
    peptide: 'Thymosin Alpha-1',
    interventions: [
      { name: 'Vitamin D', type: 'supplement', dosageRange: '5000-10000 IU', timing: 'Morning' },
      { name: 'Zinc', type: 'supplement', dosageRange: '30-50mg', timing: 'With meals' },
      { name: 'Omega-3', type: 'supplement', dosageRange: '3-4g', timing: 'With meals' },
      { name: 'Thymosin Alpha-1', type: 'peptide', dosageRange: '1.6mg', timing: '2-3x weekly', notes: 'Immune reset, inflammation' },
    ],
    monitoring: ['Symptom inventory', 'Energy levels', 'Cognitive function', 'Exercise tolerance'],
    synergies: ['chronic-fatigue', 'brain-fog', 'chronic-inflammation'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NEUROLOGICAL & PAIN
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'headaches',
    symptom: 'Headaches',
    category: 'neurological',
    supplements: ['Magnesium', 'Riboflavin B2', 'CoQ10'],
    peptide: 'Semax',
    interventions: [
      { name: 'Magnesium', type: 'supplement', dosageRange: '400-600mg', timing: 'Divided doses', notes: 'Glycinate or oxide' },
      { name: 'Riboflavin B2', type: 'supplement', dosageRange: '400mg', timing: 'Morning' },
      { name: 'CoQ10', type: 'supplement', dosageRange: '100-300mg', timing: 'Morning' },
      { name: 'Semax', type: 'peptide', dosageRange: '200-400mcg', timing: 'Intranasal as needed', notes: 'Neuroprotective' },
    ],
    monitoring: ['Headache frequency', 'Intensity', 'Duration', 'Triggers'],
    synergies: ['migraines', 'neck-tension'],
  },
  {
    id: 'migraines',
    symptom: 'Migraines',
    category: 'neurological',
    supplements: ['Magnesium', 'Riboflavin B2', 'Electrolytes'],
    peptide: 'Semax',
    interventions: [
      { name: 'Magnesium', type: 'supplement', dosageRange: '400-800mg', timing: 'Divided doses' },
      { name: 'Riboflavin B2', type: 'supplement', dosageRange: '400mg', timing: 'Morning' },
      { name: 'Electrolytes', type: 'supplement', dosageRange: 'As needed', timing: 'Throughout day' },
      { name: 'Semax', type: 'peptide', dosageRange: '200-600mcg', timing: 'Intranasal preventive/acute', notes: 'Vascular, neuroprotective' },
    ],
    monitoring: ['Migraine frequency', 'Aura presence', 'Triggers', 'Abortive med use'],
    synergies: ['headaches', 'neck-tension'],
  },
  {
    id: 'neck-tension',
    symptom: 'Neck tension',
    category: 'neurological',
    supplements: ['Magnesium', 'Glycine', 'Omega-3'],
    peptide: 'Selank',
    interventions: [
      { name: 'Magnesium', type: 'supplement', dosageRange: '400-600mg', timing: 'Evening' },
      { name: 'Glycine', type: 'supplement', dosageRange: '3g', timing: 'Evening' },
      { name: 'Omega-3', type: 'supplement', dosageRange: '2g', timing: 'With meals' },
      { name: 'Selank', type: 'peptide', dosageRange: '250-500mcg', timing: 'Intranasal 1-2x daily', notes: 'Stress-tension relief' },
    ],
    monitoring: ['Tension level', 'Range of motion', 'Trigger points'],
    synergies: ['headaches', 'jaw-clenching', 'stress-sensitivity'],
  },
  {
    id: 'jaw-clenching',
    symptom: 'Jaw clenching',
    category: 'neurological',
    supplements: ['Magnesium', 'Glycine', 'Taurine'],
    peptide: 'Selank',
    interventions: [
      { name: 'Magnesium', type: 'supplement', dosageRange: '400-600mg', timing: 'Evening' },
      { name: 'Glycine', type: 'supplement', dosageRange: '3g', timing: 'Before bed' },
      { name: 'Taurine', type: 'supplement', dosageRange: '1-2g', timing: 'Evening' },
      { name: 'Selank', type: 'peptide', dosageRange: '250-500mcg', timing: 'Intranasal evening', notes: 'Reduces stress-induced tension' },
    ],
    monitoring: ['Clenching awareness', 'Morning jaw pain', 'Teeth wear'],
    synergies: ['neck-tension', 'anxiety', 'stress-sensitivity'],
  },
  {
    id: 'muscle-cramps',
    symptom: 'Muscle cramps',
    category: 'neurological',
    supplements: ['Magnesium', 'Potassium', 'Sodium'],
    peptide: 'TB-500',
    interventions: [
      { name: 'Magnesium', type: 'supplement', dosageRange: '400-600mg', timing: 'Divided doses' },
      { name: 'Potassium', type: 'supplement', dosageRange: '99mg + diet', timing: 'With meals', notes: 'Primarily from food' },
      { name: 'Sodium', type: 'supplement', dosageRange: 'As needed', timing: 'Pre/during exercise' },
      { name: 'TB-500', type: 'peptide', dosageRange: '2.5mg', timing: '2x weekly', notes: 'Muscle recovery' },
    ],
    monitoring: ['Cramp frequency', 'Location', 'Triggers', 'Electrolyte status'],
    synergies: ['restless-legs', 'exercise-crashes'],
  },
  {
    id: 'restless-legs',
    symptom: 'Restless legs',
    category: 'neurological',
    supplements: ['Iron', 'Magnesium', 'Folate'],
    peptide: 'DSIP',
    interventions: [
      { name: 'Iron', type: 'supplement', dosageRange: '18-36mg', timing: 'If deficient', notes: 'Test ferritin (target >75)' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '400-600mg', timing: 'Evening' },
      { name: 'Folate', type: 'supplement', dosageRange: '400-800mcg', timing: 'Morning' },
      { name: 'DSIP', type: 'peptide', dosageRange: '100-200mcg', timing: 'Before bed', notes: 'Sleep quality, symptom relief' },
    ],
    monitoring: ['Symptom frequency', 'Sleep quality', 'Ferritin levels'],
    synergies: ['insomnia', 'muscle-cramps'],
  },
  {
    id: 'tingling-hands-feet',
    symptom: 'Tingling hands/feet',
    category: 'neurological',
    supplements: ['Vitamin B12', 'Thiamine B1', 'Magnesium'],
    peptide: 'BPC-157',
    interventions: [
      { name: 'Vitamin B12', type: 'supplement', dosageRange: '1000-5000mcg', timing: 'Morning', notes: 'Methylcobalamin' },
      { name: 'Thiamine B1', type: 'supplement', dosageRange: '100-300mg', timing: 'Morning', notes: 'Benfotiamine for neuropathy' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '400mg', timing: 'Evening' },
      { name: 'BPC-157', type: 'peptide', dosageRange: '250-500mcg', timing: '1-2x daily', notes: 'Nerve healing support' },
    ],
    monitoring: ['Symptom frequency', 'Distribution', 'B12 levels'],
    synergies: ['cold-hands-feet', 'low-circulation'],
  },
  {
    id: 'low-pain-tolerance',
    symptom: 'Low pain tolerance',
    category: 'neurological',
    supplements: ['Vitamin D', 'Omega-3', 'Magnesium'],
    peptide: 'BPC-157',
    interventions: [
      { name: 'Vitamin D', type: 'supplement', dosageRange: '5000 IU', timing: 'Morning' },
      { name: 'Omega-3', type: 'supplement', dosageRange: '2-3g', timing: 'With meals' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '400mg', timing: 'Divided doses' },
      { name: 'BPC-157', type: 'peptide', dosageRange: '250-500mcg', timing: '1-2x daily', notes: 'Pain modulation' },
    ],
    monitoring: ['Pain threshold', 'Response to stimuli', 'Inflammatory markers'],
    synergies: ['chronic-inflammation', 'stress-sensitivity'],
  },
  {
    id: 'joint-pain',
    symptom: 'Joint pain',
    category: 'neurological',
    supplements: ['Vitamin D', 'Omega-3', 'Magnesium'],
    peptide: 'TB-500',
    interventions: [
      { name: 'Vitamin D', type: 'supplement', dosageRange: '5000 IU', timing: 'Morning' },
      { name: 'Omega-3', type: 'supplement', dosageRange: '3-4g', timing: 'With meals' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '400mg', timing: 'Evening' },
      { name: 'TB-500', type: 'peptide', dosageRange: '2.5-5mg', timing: '2x weekly', notes: 'Joint tissue repair' },
    ],
    monitoring: ['Pain levels', 'Range of motion', 'Swelling', 'Function'],
    synergies: ['chronic-inflammation', 'tendon-pain'],
  },
  {
    id: 'tendon-pain',
    symptom: 'Tendon pain',
    category: 'neurological',
    supplements: ['Vitamin C', 'Collagen', 'Copper'],
    peptide: 'BPC-157',
    interventions: [
      { name: 'Vitamin C', type: 'supplement', dosageRange: '500-1000mg', timing: 'With collagen' },
      { name: 'Collagen', type: 'supplement', dosageRange: '10-20g', timing: '30-60 min before activity' },
      { name: 'Copper', type: 'supplement', dosageRange: '2mg', timing: 'With meals' },
      { name: 'BPC-157', type: 'peptide', dosageRange: '250-500mcg', timing: '1-2x daily', notes: 'Tendon healing' },
    ],
    monitoring: ['Pain levels', 'Function', 'Loading tolerance'],
    synergies: ['joint-pain', 'frequent-injuries'],
  },
  {
    id: 'eye-twitching',
    symptom: 'Eye twitching',
    category: 'neurological',
    supplements: ['Magnesium', 'Potassium', 'Taurine'],
    peptide: 'GHK-Cu',
    interventions: [
      { name: 'Magnesium', type: 'supplement', dosageRange: '400-600mg', timing: 'Divided doses' },
      { name: 'Potassium', type: 'supplement', dosageRange: '99mg + diet', timing: 'With meals' },
      { name: 'Taurine', type: 'supplement', dosageRange: '1-2g', timing: 'Divided doses' },
      { name: 'GHK-Cu', type: 'peptide', dosageRange: '1mg', timing: 'SubQ', notes: 'Nerve support' },
    ],
    monitoring: ['Twitch frequency', 'Duration', 'Triggers'],
    synergies: ['stress-sensitivity', 'insomnia'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // METABOLIC & WEIGHT
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'high-appetite',
    symptom: 'High appetite',
    category: 'metabolic',
    supplements: ['Protein', 'Chromium', 'Inositol'],
    peptide: 'Retatrutide',
    interventions: [
      { name: 'Protein', type: 'supplement', dosageRange: '30-40g per meal', timing: 'Each meal', notes: 'Satiety' },
      { name: 'Chromium', type: 'supplement', dosageRange: '200-400mcg', timing: 'With meals' },
      { name: 'Inositol', type: 'supplement', dosageRange: '2-4g', timing: 'Before meals' },
      { name: 'Retatrutide', type: 'peptide', dosageRange: 'Per protocol', timing: 'Weekly', notes: 'Triple agonist appetite control' },
    ],
    monitoring: ['Appetite rating', 'Caloric intake', 'Satiety duration'],
    synergies: ['sugar-cravings', 'binge-eating'],
  },
  {
    id: 'binge-eating',
    symptom: 'Binge eating',
    category: 'metabolic',
    supplements: ['Magnesium', 'Chromium', 'Omega-3'],
    peptide: 'Retatrutide',
    interventions: [
      { name: 'Magnesium', type: 'supplement', dosageRange: '400mg', timing: 'Evening' },
      { name: 'Chromium', type: 'supplement', dosageRange: '400mcg', timing: 'With meals' },
      { name: 'Omega-3', type: 'supplement', dosageRange: '2-3g', timing: 'With meals' },
      { name: 'Retatrutide', type: 'peptide', dosageRange: 'Per protocol', timing: 'Weekly', notes: 'Appetite normalization' },
    ],
    monitoring: ['Binge frequency', 'Trigger identification', 'Emotional state'],
    contraindications: ['Active eating disorder without treatment team'],
    synergies: ['high-appetite', 'sugar-cravings'],
  },
  {
    id: 'sugar-cravings',
    symptom: 'Sugar cravings',
    category: 'metabolic',
    supplements: ['Chromium', 'Inositol', 'Magnesium'],
    peptide: 'Retatrutide',
    interventions: [
      { name: 'Chromium', type: 'supplement', dosageRange: '200-400mcg', timing: 'With meals' },
      { name: 'Inositol', type: 'supplement', dosageRange: '2-4g', timing: 'Before meals' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '300-400mg', timing: 'Evening' },
      { name: 'Retatrutide', type: 'peptide', dosageRange: 'Per protocol', timing: 'Weekly', notes: 'Craving reduction' },
    ],
    monitoring: ['Craving intensity', 'Sugar intake', 'Blood glucose patterns'],
    synergies: ['insulin-resistance', 'high-appetite'],
  },
  {
    id: 'night-cravings',
    symptom: 'Night cravings',
    category: 'metabolic',
    supplements: ['Magnesium', 'Glycine', 'Chromium'],
    peptide: 'Retatrutide',
    interventions: [
      { name: 'Magnesium', type: 'supplement', dosageRange: '400mg', timing: 'After dinner' },
      { name: 'Glycine', type: 'supplement', dosageRange: '3g', timing: 'Evening' },
      { name: 'Chromium', type: 'supplement', dosageRange: '200mcg', timing: 'With dinner' },
      { name: 'Retatrutide', type: 'peptide', dosageRange: 'Per protocol', timing: 'Weekly', notes: 'Evening appetite control' },
    ],
    monitoring: ['Evening hunger', 'Night eating frequency', 'Sleep quality'],
    synergies: ['sugar-cravings', 'insomnia'],
  },
  {
    id: 'weight-gain',
    symptom: 'Weight gain',
    category: 'metabolic',
    supplements: ['Vitamin D', 'Magnesium', 'Chromium'],
    peptide: 'Retatrutide',
    interventions: [
      { name: 'Vitamin D', type: 'supplement', dosageRange: '5000 IU', timing: 'Morning' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '400mg', timing: 'Evening' },
      { name: 'Chromium', type: 'supplement', dosageRange: '400mcg', timing: 'With meals' },
      { name: 'Retatrutide', type: 'peptide', dosageRange: 'Per protocol', timing: 'Weekly', notes: 'Multi-receptor weight loss' },
    ],
    monitoring: ['Weight', 'Body composition', 'Metabolic markers'],
    synergies: ['insulin-resistance', 'slow-metabolism'],
  },
  {
    id: 'weight-loss-resistance',
    symptom: 'Weight loss resistance',
    category: 'metabolic',
    supplements: ['Zinc', 'Selenium', 'Iodine'],
    peptide: 'Retatrutide',
    interventions: [
      { name: 'Zinc', type: 'supplement', dosageRange: '30mg', timing: 'Evening' },
      { name: 'Selenium', type: 'supplement', dosageRange: '200mcg', timing: 'With meals', notes: 'Thyroid support' },
      { name: 'Iodine', type: 'supplement', dosageRange: '150-300mcg', timing: 'Morning', notes: 'If deficient' },
      { name: 'Retatrutide', type: 'peptide', dosageRange: 'Per protocol', timing: 'Weekly', notes: 'Metabolic breakthrough' },
    ],
    monitoring: ['Weight', 'Thyroid panel', 'Metabolic rate', 'Body composition'],
    synergies: ['slow-metabolism', 'insulin-resistance'],
  },
  {
    id: 'belly-fat',
    symptom: 'Belly fat',
    category: 'metabolic',
    supplements: ['Chromium', 'Omega-3', 'Magnesium'],
    peptide: 'AOD-9604',
    interventions: [
      { name: 'Chromium', type: 'supplement', dosageRange: '400mcg', timing: 'With meals' },
      { name: 'Omega-3', type: 'supplement', dosageRange: '3g', timing: 'With meals' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '400mg', timing: 'Evening' },
      { name: 'AOD-9604', type: 'peptide', dosageRange: '300mcg', timing: 'Fasted morning', notes: 'Fat-specific lipolysis' },
    ],
    monitoring: ['Waist circumference', 'Body composition', 'Visceral fat imaging'],
    synergies: ['insulin-resistance', 'weight-gain'],
  },
  {
    id: 'water-retention',
    symptom: 'Water retention',
    category: 'metabolic',
    supplements: ['Potassium', 'Vitamin B6', 'Magnesium'],
    peptide: 'CJC-1295',
    interventions: [
      { name: 'Potassium', type: 'supplement', dosageRange: '99mg + diet', timing: 'With meals' },
      { name: 'Vitamin B6', type: 'supplement', dosageRange: '50-100mg', timing: 'Morning' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '400mg', timing: 'Divided doses' },
      { name: 'CJC-1295', type: 'peptide', dosageRange: '100mcg', timing: 'Before bed', notes: 'Body composition optimization' },
    ],
    monitoring: ['Edema', 'Weight fluctuation', 'Ring fit', 'Blood pressure'],
    synergies: ['pms', 'high-blood-pressure'],
  },
  {
    id: 'slow-metabolism',
    symptom: 'Slow metabolism',
    category: 'metabolic',
    supplements: ['Iodine', 'Selenium', 'Zinc'],
    peptide: 'MOTS-c',
    interventions: [
      { name: 'Iodine', type: 'supplement', dosageRange: '150-300mcg', timing: 'Morning' },
      { name: 'Selenium', type: 'supplement', dosageRange: '200mcg', timing: 'With meals' },
      { name: 'Zinc', type: 'supplement', dosageRange: '30mg', timing: 'Evening' },
      { name: 'MOTS-c', type: 'peptide', dosageRange: '5-10mg', timing: '3-5x weekly', notes: 'Metabolic activation' },
    ],
    monitoring: ['Resting metabolic rate', 'Thyroid panel', 'Energy levels'],
    synergies: ['weight-loss-resistance', 'chronic-fatigue'],
  },
  {
    id: 'insulin-resistance',
    symptom: 'Insulin resistance',
    category: 'metabolic',
    supplements: ['Chromium', 'Magnesium', 'Alpha lipoic acid'],
    peptide: 'Retatrutide',
    interventions: [
      { name: 'Chromium', type: 'supplement', dosageRange: '400-1000mcg', timing: 'With meals' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '400-600mg', timing: 'Divided doses' },
      { name: 'Alpha lipoic acid', type: 'supplement', dosageRange: '600mg', timing: 'Before meals' },
      { name: 'Retatrutide', type: 'peptide', dosageRange: 'Per protocol', timing: 'Weekly', notes: 'GLP-1/GIP/glucagon' },
    ],
    monitoring: ['Fasting glucose', 'HbA1c', 'Fasting insulin', 'HOMA-IR'],
    synergies: ['weight-gain', 'belly-fat', 'sugar-cravings'],
  },
  {
    id: 'high-triglycerides',
    symptom: 'High triglycerides',
    category: 'metabolic',
    supplements: ['Omega-3', 'Niacin B3', 'Magnesium'],
    peptide: 'Retatrutide',
    interventions: [
      { name: 'Omega-3', type: 'supplement', dosageRange: '3-4g EPA/DHA', timing: 'With meals' },
      { name: 'Niacin B3', type: 'supplement', dosageRange: '500-1500mg', timing: 'With meals', notes: 'Flush-free or extended release' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '400mg', timing: 'Evening' },
      { name: 'Retatrutide', type: 'peptide', dosageRange: 'Per protocol', timing: 'Weekly', notes: 'Metabolic optimization' },
    ],
    monitoring: ['Lipid panel', 'Triglyceride levels', 'Liver enzymes'],
    synergies: ['insulin-resistance', 'belly-fat'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CARDIOVASCULAR
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'cold-hands-feet',
    symptom: 'Cold hands and feet',
    category: 'cardiovascular',
    supplements: ['Iron', 'B12', 'Omega-3'],
    peptide: 'Semax',
    interventions: [
      { name: 'Iron', type: 'supplement', dosageRange: '18-36mg', timing: 'If deficient' },
      { name: 'Vitamin B12', type: 'supplement', dosageRange: '1000mcg', timing: 'Morning' },
      { name: 'Omega-3', type: 'supplement', dosageRange: '2-3g', timing: 'With meals' },
      { name: 'Semax', type: 'peptide', dosageRange: '200-400mcg', timing: 'Intranasal', notes: 'Circulation support' },
    ],
    monitoring: ['Temperature sensation', 'Color changes', 'Hemoglobin/ferritin'],
    synergies: ['low-circulation', 'tingling-hands-feet'],
  },
  {
    id: 'dizziness',
    symptom: 'Dizziness',
    category: 'cardiovascular',
    supplements: ['Iron', 'Electrolytes', 'Vitamin B12'],
    peptide: 'BPC-157',
    interventions: [
      { name: 'Iron', type: 'supplement', dosageRange: '18-36mg', timing: 'If anemic' },
      { name: 'Electrolytes', type: 'supplement', dosageRange: 'As needed', timing: 'Throughout day' },
      { name: 'Vitamin B12', type: 'supplement', dosageRange: '1000mcg', timing: 'Morning' },
      { name: 'BPC-157', type: 'peptide', dosageRange: '250mcg', timing: '1-2x daily', notes: 'Vascular support' },
    ],
    monitoring: ['Dizziness frequency', 'Triggers', 'Blood pressure', 'Hemoglobin'],
    synergies: ['low-circulation', 'heart-palpitations'],
  },
  {
    id: 'heart-palpitations',
    symptom: 'Heart palpitations',
    category: 'cardiovascular',
    supplements: ['Magnesium', 'Taurine', 'Potassium'],
    peptide: 'Thymosin Alpha-1',
    interventions: [
      { name: 'Magnesium', type: 'supplement', dosageRange: '400-600mg', timing: 'Divided doses' },
      { name: 'Taurine', type: 'supplement', dosageRange: '2-3g', timing: 'Divided doses' },
      { name: 'Potassium', type: 'supplement', dosageRange: '99mg + diet', timing: 'With meals' },
      { name: 'Thymosin Alpha-1', type: 'peptide', dosageRange: '1.6mg', timing: '2x weekly', notes: 'Cardiac support' },
    ],
    monitoring: ['Palpitation frequency', 'Triggers', 'ECG if indicated', 'Electrolytes'],
    contraindications: ['Seek evaluation for new/severe palpitations'],
    synergies: ['anxiety', 'panic-attacks'],
  },
  {
    id: 'high-blood-pressure',
    symptom: 'High blood pressure',
    category: 'cardiovascular',
    supplements: ['Magnesium', 'Potassium', 'Omega-3'],
    peptide: 'BPC-157',
    interventions: [
      { name: 'Magnesium', type: 'supplement', dosageRange: '400-600mg', timing: 'Divided doses' },
      { name: 'Potassium', type: 'supplement', dosageRange: '99mg + diet', timing: 'With meals' },
      { name: 'Omega-3', type: 'supplement', dosageRange: '3-4g', timing: 'With meals' },
      { name: 'BPC-157', type: 'peptide', dosageRange: '250-500mcg', timing: '1-2x daily', notes: 'Vascular health' },
    ],
    monitoring: ['Blood pressure', 'Sodium intake', 'Weight', 'Exercise'],
    synergies: ['water-retention', 'stress-sensitivity'],
  },
  {
    id: 'low-circulation',
    symptom: 'Low circulation',
    category: 'cardiovascular',
    supplements: ['Omega-3', 'Vitamin E', 'CoQ10'],
    peptide: 'TB-500',
    interventions: [
      { name: 'Omega-3', type: 'supplement', dosageRange: '2-3g', timing: 'With meals' },
      { name: 'Vitamin E', type: 'supplement', dosageRange: '400 IU', timing: 'With fat', notes: 'Mixed tocopherols' },
      { name: 'CoQ10', type: 'supplement', dosageRange: '200mg', timing: 'Morning' },
      { name: 'TB-500', type: 'peptide', dosageRange: '2.5mg', timing: '2x weekly', notes: 'Vascular repair' },
    ],
    monitoring: ['Peripheral warmth', 'Capillary refill', 'Exercise tolerance'],
    synergies: ['cold-hands-feet', 'easy-bruising'],
  },
  {
    id: 'brain-blood-flow',
    symptom: 'Brain blood flow issues',
    category: 'cardiovascular',
    supplements: ['Omega-3', 'CoQ10', 'Vitamin B3'],
    peptide: 'Semax',
    interventions: [
      { name: 'Omega-3', type: 'supplement', dosageRange: '3g', timing: 'With meals' },
      { name: 'CoQ10', type: 'supplement', dosageRange: '200-300mg', timing: 'Morning' },
      { name: 'Vitamin B3', type: 'supplement', dosageRange: '500mg', timing: 'With meals' },
      { name: 'Semax', type: 'peptide', dosageRange: '200-600mcg', timing: 'Intranasal', notes: 'Cerebral blood flow' },
    ],
    monitoring: ['Cognitive function', 'Head pressure', 'Dizziness'],
    synergies: ['brain-fog', 'poor-focus'],
  },
  {
    id: 'shortness-of-breath',
    symptom: 'Shortness of breath',
    category: 'cardiovascular',
    supplements: ['Iron', 'Copper', 'B12'],
    peptide: 'MOTS-c',
    interventions: [
      { name: 'Iron', type: 'supplement', dosageRange: '18-36mg', timing: 'If deficient' },
      { name: 'Copper', type: 'supplement', dosageRange: '2mg', timing: 'With meals' },
      { name: 'Vitamin B12', type: 'supplement', dosageRange: '1000mcg', timing: 'Morning' },
      { name: 'MOTS-c', type: 'peptide', dosageRange: '5-10mg', timing: '3-5x weekly', notes: 'Respiratory capacity' },
    ],
    monitoring: ['Breathing ease', 'Exercise tolerance', 'Oxygen saturation'],
    contraindications: ['Rule out cardiac/pulmonary causes'],
    synergies: ['low-endurance', 'exercise-intolerance'],
  },
  {
    id: 'low-vo2-fitness',
    symptom: 'Low VO2 fitness',
    category: 'cardiovascular',
    supplements: ['Iron', 'CoQ10', 'Magnesium'],
    peptide: 'MOTS-c',
    interventions: [
      { name: 'Iron', type: 'supplement', dosageRange: '18-36mg', timing: 'If deficient' },
      { name: 'CoQ10', type: 'supplement', dosageRange: '200-300mg', timing: 'Morning' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '400mg', timing: 'Divided doses' },
      { name: 'MOTS-c', type: 'peptide', dosageRange: '5-10mg', timing: '3-5x weekly', notes: 'Aerobic capacity' },
    ],
    monitoring: ['VO2 max testing', 'Heart rate zones', 'Recovery metrics'],
    synergies: ['low-endurance', 'exercise-intolerance'],
  },
  {
    id: 'exercise-crashes',
    symptom: 'Exercise crashes',
    category: 'cardiovascular',
    supplements: ['Sodium', 'Potassium', 'Magnesium'],
    peptide: 'MOTS-c',
    interventions: [
      { name: 'Sodium', type: 'supplement', dosageRange: '500-1000mg', timing: 'Pre/during exercise' },
      { name: 'Potassium', type: 'supplement', dosageRange: '99mg + food', timing: 'With electrolytes' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '200-400mg', timing: 'Pre-workout' },
      { name: 'MOTS-c', type: 'peptide', dosageRange: '5-10mg', timing: '3-5x weekly', notes: 'Exercise resilience' },
    ],
    monitoring: ['Exercise tolerance', 'Heart rate response', 'Recovery time'],
    synergies: ['muscle-cramps', 'exercise-intolerance'],
  },
  {
    id: 'post-workout-inflammation',
    symptom: 'Post workout inflammation',
    category: 'cardiovascular',
    supplements: ['Omega-3', 'Curcumin', 'Magnesium'],
    peptide: 'BPC-157',
    interventions: [
      { name: 'Omega-3', type: 'supplement', dosageRange: '3-4g', timing: 'With meals' },
      { name: 'Curcumin', type: 'supplement', dosageRange: '500-1000mg', timing: 'Post-workout' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '400mg', timing: 'Post-workout' },
      { name: 'BPC-157', type: 'peptide', dosageRange: '250-500mcg', timing: '1-2x daily', notes: 'Anti-inflammatory' },
    ],
    monitoring: ['DOMS severity', 'Joint swelling', 'Recovery time'],
    synergies: ['muscle-soreness', 'poor-recovery'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // HORMONAL
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'low-libido',
    symptom: 'Low libido',
    category: 'hormonal',
    supplements: ['Zinc', 'Boron', 'Vitamin D'],
    peptide: 'PT-141',
    interventions: [
      { name: 'Zinc', type: 'supplement', dosageRange: '30-50mg', timing: 'Evening' },
      { name: 'Boron', type: 'supplement', dosageRange: '6-10mg', timing: 'Morning' },
      { name: 'Vitamin D', type: 'supplement', dosageRange: '5000 IU', timing: 'Morning' },
      { name: 'PT-141', type: 'peptide', dosageRange: '1-2mg', timing: '2-4 hours before', notes: 'Sexual function' },
    ],
    monitoring: ['Libido rating', 'Hormone panel', 'Energy levels'],
    synergies: ['low-testosterone-symptoms', 'erectile-dysfunction'],
  },
  {
    id: 'pms',
    symptom: 'PMS',
    category: 'hormonal',
    supplements: ['Vitamin B6', 'Magnesium', 'Calcium'],
    peptide: 'Oxytocin',
    interventions: [
      { name: 'Vitamin B6', type: 'supplement', dosageRange: '50-100mg', timing: 'Morning', notes: 'P5P form' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '400-600mg', timing: 'Divided doses' },
      { name: 'Calcium', type: 'supplement', dosageRange: '1000-1200mg', timing: 'Divided doses' },
      { name: 'Oxytocin', type: 'peptide', dosageRange: '10-20 IU', timing: 'Intranasal as needed', notes: 'Mood and comfort' },
    ],
    monitoring: ['Symptom severity', 'Cycle tracking', 'Mood patterns'],
    synergies: ['mood-swings', 'water-retention'],
  },
  {
    id: 'low-testosterone-symptoms',
    symptom: 'Low testosterone symptoms',
    category: 'hormonal',
    supplements: ['Zinc', 'Magnesium', 'Vitamin D'],
    peptide: 'Kisspeptin-10',
    interventions: [
      { name: 'Zinc', type: 'supplement', dosageRange: '30-50mg', timing: 'Evening' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '400-600mg', timing: 'Evening' },
      { name: 'Vitamin D', type: 'supplement', dosageRange: '5000 IU', timing: 'Morning' },
      { name: 'Kisspeptin-10', type: 'peptide', dosageRange: '50-100mcg', timing: '2-3x weekly', notes: 'HPG axis support' },
    ],
    monitoring: ['Total/free testosterone', 'LH/FSH', 'Symptoms', 'Energy'],
    synergies: ['low-libido', 'low-strength'],
  },
  {
    id: 'erectile-dysfunction',
    symptom: 'Erectile dysfunction',
    category: 'hormonal',
    supplements: ['Zinc', 'Vitamin D', 'Niacin B3'],
    peptide: 'PT-141',
    interventions: [
      { name: 'Zinc', type: 'supplement', dosageRange: '30-50mg', timing: 'Evening' },
      { name: 'Vitamin D', type: 'supplement', dosageRange: '5000 IU', timing: 'Morning' },
      { name: 'Niacin B3', type: 'supplement', dosageRange: '500-1000mg', timing: 'With meals', notes: 'Vascular support' },
      { name: 'PT-141', type: 'peptide', dosageRange: '1-2mg', timing: '2-4 hours before activity', notes: 'Central mechanism' },
    ],
    monitoring: ['Erectile function', 'Cardiovascular markers', 'Hormone panel'],
    contraindications: ['Rule out cardiovascular causes'],
    synergies: ['low-libido', 'low-testosterone-symptoms'],
  },
  {
    id: 'low-morning-drive',
    symptom: 'Low morning drive',
    category: 'hormonal',
    supplements: ['Zinc', 'Boron', 'Magnesium'],
    peptide: 'Kisspeptin-10',
    interventions: [
      { name: 'Zinc', type: 'supplement', dosageRange: '30mg', timing: 'Evening' },
      { name: 'Boron', type: 'supplement', dosageRange: '6-10mg', timing: 'Morning' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '400mg', timing: 'Evening' },
      { name: 'Kisspeptin-10', type: 'peptide', dosageRange: '50-100mcg', timing: 'Evening', notes: 'Hormone pulsatility' },
    ],
    monitoring: ['Morning function', 'Sleep quality', 'Hormone panel'],
    synergies: ['low-testosterone-symptoms', 'insomnia'],
  },
  {
    id: 'low-sperm-quality',
    symptom: 'Low sperm quality',
    category: 'hormonal',
    supplements: ['Zinc', 'Selenium', 'CoQ10'],
    peptide: 'Kisspeptin-10',
    interventions: [
      { name: 'Zinc', type: 'supplement', dosageRange: '30-50mg', timing: 'Evening' },
      { name: 'Selenium', type: 'supplement', dosageRange: '200mcg', timing: 'With meals' },
      { name: 'CoQ10', type: 'supplement', dosageRange: '200-400mg', timing: 'Morning' },
      { name: 'Kisspeptin-10', type: 'peptide', dosageRange: '50-100mcg', timing: '2-3x weekly', notes: 'Fertility support' },
    ],
    monitoring: ['Semen analysis', 'Hormone panel', 'Oxidative markers'],
    synergies: ['low-testosterone-symptoms'],
  },
  {
    id: 'irregular-cycles',
    symptom: 'Irregular cycles',
    category: 'hormonal',
    supplements: ['Vitamin B6', 'Magnesium', 'Iron'],
    peptide: 'Kisspeptin-10',
    interventions: [
      { name: 'Vitamin B6', type: 'supplement', dosageRange: '50-100mg', timing: 'Morning' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '400mg', timing: 'Evening' },
      { name: 'Iron', type: 'supplement', dosageRange: '18mg', timing: 'If deficient' },
      { name: 'Kisspeptin-10', type: 'peptide', dosageRange: '50-100mcg', timing: '2-3x weekly', notes: 'Cycle regulation' },
    ],
    monitoring: ['Cycle length', 'Ovulation tracking', 'Hormone panel'],
    synergies: ['pms', 'low-progesterone-symptoms'],
  },
  {
    id: 'heavy-periods',
    symptom: 'Heavy periods',
    category: 'hormonal',
    supplements: ['Iron', 'Vitamin C', 'Magnesium'],
    peptide: 'Oxytocin',
    interventions: [
      { name: 'Iron', type: 'supplement', dosageRange: '36-65mg', timing: 'With vitamin C', notes: 'Replenish losses' },
      { name: 'Vitamin C', type: 'supplement', dosageRange: '500mg', timing: 'With iron' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '400mg', timing: 'Evening' },
      { name: 'Oxytocin', type: 'peptide', dosageRange: '10-20 IU', timing: 'Intranasal during period', notes: 'Uterine support' },
    ],
    monitoring: ['Flow volume', 'Ferritin levels', 'Hemoglobin'],
    synergies: ['irregular-cycles', 'chronic-fatigue'],
  },
  {
    id: 'hot-flashes',
    symptom: 'Hot flashes',
    category: 'hormonal',
    supplements: ['Vitamin E', 'Omega-3', 'Magnesium'],
    peptide: 'Epitalon',
    interventions: [
      { name: 'Vitamin E', type: 'supplement', dosageRange: '400-800 IU', timing: 'With fat' },
      { name: 'Omega-3', type: 'supplement', dosageRange: '2-3g', timing: 'With meals' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '400mg', timing: 'Evening' },
      { name: 'Epitalon', type: 'peptide', dosageRange: '5-10mg', timing: 'Before bed, 10-day cycles', notes: 'Hormonal balance' },
    ],
    monitoring: ['Flash frequency', 'Severity', 'Sleep disruption'],
    synergies: ['low-estrogen-symptoms', 'insomnia'],
  },
  {
    id: 'low-progesterone-symptoms',
    symptom: 'Low progesterone symptoms',
    category: 'hormonal',
    supplements: ['Vitamin B6', 'Magnesium', 'Zinc'],
    peptide: 'Kisspeptin-10',
    interventions: [
      { name: 'Vitamin B6', type: 'supplement', dosageRange: '50-100mg', timing: 'Morning' },
      { name: 'Magnesium', type: 'supplement', dosageRange: '400mg', timing: 'Evening' },
      { name: 'Zinc', type: 'supplement', dosageRange: '30mg', timing: 'Evening' },
      { name: 'Kisspeptin-10', type: 'peptide', dosageRange: '50-100mcg', timing: '2-3x weekly luteal phase', notes: 'Progesterone support' },
    ],
    monitoring: ['Progesterone levels', 'Luteal phase length', 'Symptoms'],
    synergies: ['pms', 'irregular-cycles'],
  },
  {
    id: 'low-estrogen-symptoms',
    symptom: 'Low estrogen symptoms',
    category: 'hormonal',
    supplements: ['Omega-3', 'Vitamin E', 'Vitamin D'],
    peptide: 'Oxytocin',
    interventions: [
      { name: 'Omega-3', type: 'supplement', dosageRange: '2-3g', timing: 'With meals' },
      { name: 'Vitamin E', type: 'supplement', dosageRange: '400 IU', timing: 'With fat' },
      { name: 'Vitamin D', type: 'supplement', dosageRange: '5000 IU', timing: 'Morning' },
      { name: 'Oxytocin', type: 'peptide', dosageRange: '10-20 IU', timing: 'Intranasal as needed', notes: 'Tissue support' },
    ],
    monitoring: ['Estrogen levels', 'Symptoms', 'Bone density'],
    synergies: ['hot-flashes', 'dry-skin'],
  },
  {
    id: 'menopause-fatigue',
    symptom: 'Menopause fatigue',
    category: 'hormonal',
    supplements: ['Magnesium', 'Vitamin D', 'Creatine'],
    peptide: 'NAD+',
    interventions: [
      { name: 'Magnesium', type: 'supplement', dosageRange: '400mg', timing: 'Evening' },
      { name: 'Vitamin D', type: 'supplement', dosageRange: '5000 IU', timing: 'Morning' },
      { name: 'Creatine', type: 'supplement', dosageRange: '5g', timing: 'Daily' },
      { name: 'NAD+', type: 'peptide', dosageRange: '100-250mg', timing: 'SubQ or IV', notes: 'Energy restoration' },
    ],
    monitoring: ['Energy levels', 'Sleep quality', 'Hormone panel'],
    synergies: ['hot-flashes', 'chronic-fatigue'],
  },
]

// ============================================================================
// SYMPTOM PROTOCOL HELPER FUNCTIONS
// ============================================================================

/**
 * Get a symptom protocol by ID
 */
export function getSymptomProtocol(symptomId: string): SymptomProtocol | null {
  return SYMPTOM_PROTOCOLS.find((p) => p.id === symptomId) || null
}

/**
 * Search symptoms by name (case-insensitive partial match)
 */
export function searchSymptoms(query: string): SymptomProtocol[] {
  const normalizedQuery = query.toLowerCase().trim()
  return SYMPTOM_PROTOCOLS.filter(
    (p) =>
      p.symptom.toLowerCase().includes(normalizedQuery) ||
      p.id.toLowerCase().includes(normalizedQuery)
  )
}

/**
 * Get all symptoms in a category
 */
export function getSymptomsByCategory(category: SymptomCategory): SymptomProtocol[] {
  return SYMPTOM_PROTOCOLS.filter((p) => p.category === category)
}

/**
 * Get all unique supplements across all protocols
 */
export function getAllSupplements(): string[] {
  const supplements = new Set<string>()
  SYMPTOM_PROTOCOLS.forEach((p) => {
    p.supplements.forEach((s) => supplements.add(s))
  })
  return Array.from(supplements).sort()
}

/**
 * Get all unique peptides across all protocols
 */
export function getAllPeptides(): string[] {
  const peptides = new Set<string>()
  SYMPTOM_PROTOCOLS.forEach((p) => peptides.add(p.peptide))
  return Array.from(peptides).sort()
}

/**
 * Find symptoms that share a specific intervention
 */
export function findSymptomsByIntervention(interventionName: string): SymptomProtocol[] {
  const normalized = interventionName.toLowerCase()
  return SYMPTOM_PROTOCOLS.filter(
    (p) =>
      p.supplements.some((s) => s.toLowerCase().includes(normalized)) ||
      p.peptide.toLowerCase().includes(normalized)
  )
}

/**
 * Generate a combined protocol for multiple symptoms
 */
export type CombinedSymptomProtocol = {
  symptoms: string[]
  interventions: Array<{
    name: string
    type: 'supplement' | 'peptide'
    frequency: number // How many symptoms reference this
    details: Intervention[]
  }>
  monitoring: string[]
  contraindications: string[]
}

export function generateCombinedProtocol(symptomIds: string[]): CombinedSymptomProtocol | null {
  const protocols = symptomIds
    .map((id) => getSymptomProtocol(id))
    .filter((p): p is SymptomProtocol => p !== null)

  if (protocols.length === 0) return null

  // Aggregate interventions with frequency count
  const interventionMap = new Map<
    string,
    { type: 'supplement' | 'peptide'; frequency: number; details: Intervention[] }
  >()

  protocols.forEach((protocol) => {
    protocol.interventions.forEach((intervention) => {
      const existing = interventionMap.get(intervention.name)
      if (existing) {
        existing.frequency++
        // Keep the most detailed version
        if (intervention.dosageRange && !existing.details.some((d) => d.dosageRange)) {
          existing.details.push(intervention)
        }
      } else {
        interventionMap.set(intervention.name, {
          type: intervention.type,
          frequency: 1,
          details: [intervention],
        })
      }
    })
  })

  // Sort by frequency (most common first), then peptides after supplements
  const sortedInterventions = Array.from(interventionMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => {
      if (a.frequency !== b.frequency) return b.frequency - a.frequency
      if (a.type !== b.type) return a.type === 'supplement' ? -1 : 1
      return a.name.localeCompare(b.name)
    })

  // Aggregate monitoring items
  const monitoringSet = new Set<string>()
  protocols.forEach((p) => p.monitoring.forEach((m) => monitoringSet.add(m)))

  // Aggregate contraindications
  const contraindicationSet = new Set<string>()
  protocols.forEach((p) => {
    p.contraindications?.forEach((c) => contraindicationSet.add(c))
  })

  return {
    symptoms: protocols.map((p) => p.symptom),
    interventions: sortedInterventions,
    monitoring: Array.from(monitoringSet),
    contraindications: Array.from(contraindicationSet),
  }
}

/**
 * Get synergistic symptoms (commonly co-occurring)
 */
export function getSynergisticSymptoms(symptomId: string): SymptomProtocol[] {
  const protocol = getSymptomProtocol(symptomId)
  if (!protocol?.synergies) return []

  return protocol.synergies
    .map((id) => getSymptomProtocol(id))
    .filter((p): p is SymptomProtocol => p !== null)
}

/**
 * Get symptom categories with counts
 */
export function getSymptomCategoryCounts(): Record<SymptomCategory, number> {
  const counts: Record<SymptomCategory, number> = {
    mental: 0,
    energy: 0,
    physical: 0,
    skin: 0,
    digestive: 0,
    immune: 0,
    neurological: 0,
    metabolic: 0,
    cardiovascular: 0,
    hormonal: 0,
  }

  SYMPTOM_PROTOCOLS.forEach((p) => {
    counts[p.category]++
  })

  return counts
}

// ============================================================================
// GOAL-BASED PEPTIDE RECOMMENDATION ENGINE (Complete Catalog)
// ============================================================================

export type PeptideGoal =
  | 'muscle_strength'
  | 'fat_loss'
  | 'tissue_repair'
  | 'sleep_recovery'
  | 'cognitive'
  | 'immune'
  | 'anti_aging'
  | 'sexual_function'
  | 'skin_hair'
  | 'gi_healing'
  | 'cardiovascular'
  | 'hormonal'
  | 'metabolic_health'

export type EvidenceGrade = 'A' | 'B' | 'B-C' | 'C' | 'C-D' | 'D' | 'D-E'
export type RiskTier = 'low' | 'low-moderate' | 'moderate' | 'moderate-high' | 'high'
export type PeptidePriority = 'primary' | 'secondary' | 'adjunct'

export type CatalogPeptide = {
  id: string
  name: string
  category: 'growth_factor' | 'repair' | 'metabolic' | 'bioregulator' | 'neuropeptide' | 'immune' | 'hormonal'
  price: number
  size: string
  evidenceGrade: EvidenceGrade
  riskTier: RiskTier
  mechanism: string
  dosageRange: string
  timing: string
  route: string
  duration: string
  goals: PeptideGoal[]
  bestFor: string[]
  contraindications: string[]
  synergyWith: string[]
  notes?: string
}

export type GoalDefinition = {
  id: PeptideGoal
  name: string
  description: string
  icon: string
}

export const PEPTIDE_GOALS: GoalDefinition[] = [
  { id: 'muscle_strength', name: 'Muscle & Strength', description: 'Build muscle, enhance strength, support anabolic pathways', icon: '💪' },
  { id: 'fat_loss', name: 'Fat Loss & Body Recomp', description: 'Reduce body fat, preserve muscle, optimize metabolism', icon: '🔥' },
  { id: 'tissue_repair', name: 'Tissue Repair & Recovery', description: 'Heal injuries, tendons, ligaments, accelerate recovery', icon: '🩹' },
  { id: 'sleep_recovery', name: 'Sleep & Recovery', description: 'Improve sleep quality, enhance recovery, optimize rest', icon: '😴' },
  { id: 'cognitive', name: 'Cognitive & Focus', description: 'Enhance memory, focus, mental clarity, neuroprotection', icon: '🧠' },
  { id: 'immune', name: 'Immune Support', description: 'Strengthen immune function, reduce illness frequency', icon: '🛡️' },
  { id: 'anti_aging', name: 'Anti-Aging & Longevity', description: 'Slow aging, support telomeres, cellular rejuvenation', icon: '⏳' },
  { id: 'sexual_function', name: 'Sexual Function & Libido', description: 'Enhance libido, sexual performance, reproductive health', icon: '❤️' },
  { id: 'skin_hair', name: 'Skin, Hair & Collagen', description: 'Improve skin quality, hair growth, collagen synthesis', icon: '✨' },
  { id: 'gi_healing', name: 'Gut & GI Healing', description: 'Heal gut lining, reduce inflammation, support digestion', icon: '🫁' },
  { id: 'cardiovascular', name: 'Cardiovascular Health', description: 'Support heart health, circulation, vascular function', icon: '❤️‍🩹' },
  { id: 'hormonal', name: 'Hormonal Optimization', description: 'Balance hormones, support endocrine function', icon: '⚖️' },
  { id: 'metabolic_health', name: 'Metabolic Health', description: 'Improve insulin sensitivity, glucose control, energy', icon: '⚡' },
]

export const PEPTIDE_CATALOG: CatalogPeptide[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // GROWTH FACTORS & ANABOLIC
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'igf1-lr3',
    name: 'IGF-1 LR3',
    category: 'growth_factor',
    price: 150,
    size: '1mg',
    evidenceGrade: 'B',
    riskTier: 'moderate-high',
    mechanism: 'Long-acting insulin-like growth factor promoting muscle protein synthesis and cell proliferation',
    dosageRange: '20-50mcg',
    timing: 'Post-workout or divided doses',
    route: 'SubQ or IM',
    duration: '4-6 weeks on, 4 weeks off',
    goals: ['muscle_strength', 'tissue_repair', 'anti_aging'],
    bestFor: ['Muscle hypertrophy', 'Strength gains', 'Recovery enhancement'],
    contraindications: ['History of cancer', 'Diabetes (hypoglycemia risk)', 'Pregnancy'],
    synergyWith: ['CJC-1295', 'Ipamorelin', 'BPC-157'],
    notes: 'Potent anabolic; requires careful glucose monitoring',
  },
  {
    id: 'ace-031',
    name: 'ACE-031',
    category: 'growth_factor',
    price: 160,
    size: '1mg',
    evidenceGrade: 'B-C',
    riskTier: 'moderate',
    mechanism: 'Myostatin inhibitor (ActRIIB-Fc fusion protein) promoting muscle growth',
    dosageRange: '1-5mg',
    timing: 'Weekly',
    route: 'SubQ',
    duration: '8-12 weeks',
    goals: ['muscle_strength', 'fat_loss'],
    bestFor: ['Muscle sparing during deficit', 'Lean mass gains', 'Body recomposition'],
    contraindications: ['Cardiac conditions', 'Pregnancy'],
    synergyWith: ['Follistatin 344', 'Cagrilintide', 'Sermorelin'],
    notes: 'Early clinical trials show promise; muscle-sparing during weight loss',
  },
  {
    id: 'follistatin-344',
    name: 'Follistatin 344',
    category: 'growth_factor',
    price: 160,
    size: '1mg',
    evidenceGrade: 'C',
    riskTier: 'moderate',
    mechanism: 'Myostatin/activin antagonist promoting muscle growth and reducing fat',
    dosageRange: '100-300mcg',
    timing: 'Daily for 10-30 days',
    route: 'SubQ',
    duration: '10-30 day cycles',
    goals: ['muscle_strength', 'fat_loss'],
    bestFor: ['Muscle growth', 'Fat reduction', 'Athletic performance'],
    contraindications: ['Cancer history', 'Pregnancy'],
    synergyWith: ['ACE-031', 'IGF-1 LR3'],
    notes: 'Limited human data; potent in animal models',
  },
  {
    id: 'sermorelin',
    name: 'Sermorelin',
    category: 'growth_factor',
    price: 50,
    size: '5mg',
    evidenceGrade: 'B-C',
    riskTier: 'low-moderate',
    mechanism: 'GHRH analog stimulating natural GH release from pituitary',
    dosageRange: '200-300mcg',
    timing: 'Before bed or 2-3x daily',
    route: 'SubQ',
    duration: '3-6 months',
    goals: ['muscle_strength', 'fat_loss', 'sleep_recovery', 'anti_aging', 'tissue_repair'],
    bestFor: ['GH optimization', 'Sleep quality', 'Recovery', 'Anti-aging'],
    contraindications: ['Active cancer', 'Pregnancy'],
    synergyWith: ['Ipamorelin', 'CJC-1295', 'DSIP', 'BPC-157'],
    notes: 'Well-studied; stimulates natural GH pulsatility',
  },
  {
    id: 'cjc-1295',
    name: 'CJC-1295 (No DAC)',
    category: 'growth_factor',
    price: 95,
    size: '5mg',
    evidenceGrade: 'B-C',
    riskTier: 'low-moderate',
    mechanism: 'Modified GHRH analog with extended half-life for sustained GH release',
    dosageRange: '100mcg',
    timing: 'Before bed',
    route: 'SubQ',
    duration: '8-12 weeks',
    goals: ['muscle_strength', 'fat_loss', 'sleep_recovery', 'anti_aging'],
    bestFor: ['GH secretion', 'Body composition', 'Recovery'],
    contraindications: ['Active cancer', 'Pregnancy'],
    synergyWith: ['Ipamorelin', 'Sermorelin', 'GHRP-6'],
    notes: 'Often combined with Ipamorelin for synergistic effect',
  },
  {
    id: 'cjc-ipamorelin-blend',
    name: 'CJC-1295 + Ipamorelin Blend',
    category: 'growth_factor',
    price: 75,
    size: '3-4.5mg',
    evidenceGrade: 'B-C',
    riskTier: 'low-moderate',
    mechanism: 'Synergistic GHRH + GHRP combination for amplified GH release',
    dosageRange: '100mcg CJC / 200-300mcg Ipamorelin',
    timing: 'Before bed',
    route: 'SubQ',
    duration: '8-12 weeks',
    goals: ['muscle_strength', 'fat_loss', 'sleep_recovery', 'anti_aging', 'tissue_repair'],
    bestFor: ['Optimal GH release', 'Sleep quality', 'Recovery', 'Body composition'],
    contraindications: ['Active cancer', 'Pregnancy'],
    synergyWith: ['BPC-157', 'TB-500', 'DSIP'],
    notes: 'Gold standard GH secretagogue combo',
  },
  {
    id: 'ipamorelin',
    name: 'Ipamorelin',
    category: 'growth_factor',
    price: 50,
    size: '5mg',
    evidenceGrade: 'B-C',
    riskTier: 'low',
    mechanism: 'Selective GHRP stimulating GH release without affecting cortisol or prolactin',
    dosageRange: '200-300mcg',
    timing: 'Before bed or 2-3x daily',
    route: 'SubQ',
    duration: '8-12 weeks',
    goals: ['muscle_strength', 'fat_loss', 'sleep_recovery', 'anti_aging'],
    bestFor: ['Clean GH release', 'Sleep', 'Recovery', 'Minimal side effects'],
    contraindications: ['Active cancer', 'Pregnancy'],
    synergyWith: ['CJC-1295', 'Sermorelin', 'DSIP'],
    notes: 'Cleanest GHRP with minimal hunger/cortisol effects',
  },
  {
    id: 'tesamorelin',
    name: 'Tesamorelin',
    category: 'growth_factor',
    price: 80,
    size: '5mg',
    evidenceGrade: 'B',
    riskTier: 'low-moderate',
    mechanism: 'FDA-approved GHRH analog specifically targeting visceral fat reduction',
    dosageRange: '1-2mg',
    timing: 'Before bed',
    route: 'SubQ',
    duration: 'Ongoing',
    goals: ['fat_loss', 'metabolic_health', 'anti_aging'],
    bestFor: ['Visceral fat reduction', 'Metabolic health', 'HIV lipodystrophy'],
    contraindications: ['Active cancer', 'Pregnancy', 'Pituitary disorders'],
    synergyWith: ['Cagrilintide', 'MOTS-c', 'AOD-9604'],
    notes: 'FDA-approved for HIV lipodystrophy; effective for visceral fat',
  },
  {
    id: 'testagen',
    name: 'Testagen',
    category: 'bioregulator',
    price: 50,
    size: '20mg',
    evidenceGrade: 'D',
    riskTier: 'low',
    mechanism: 'Russian bioregulator targeting testicular function and testosterone support',
    dosageRange: '10-20mg',
    timing: 'Daily for 10-20 days',
    route: 'SubQ or oral',
    duration: '10-20 day cycles',
    goals: ['hormonal', 'muscle_strength', 'sexual_function'],
    bestFor: ['Male hormonal support', 'Testosterone optimization', 'Reproductive health'],
    contraindications: ['Prostate cancer', 'Pregnancy'],
    synergyWith: ['Kisspeptin-10', 'Zinc', 'Vitamin D'],
    notes: 'Russian bioregulator; limited English-language data',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // REPAIR & RECOVERY
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'bpc-157',
    name: 'BPC-157',
    category: 'repair',
    price: 110,
    size: '10mg',
    evidenceGrade: 'C',
    riskTier: 'low-moderate',
    mechanism: 'Body Protection Compound promoting angiogenesis, VEGF/FGF upregulation, and tissue repair',
    dosageRange: '250-500mcg',
    timing: '1-2x daily',
    route: 'SubQ (near injury) or oral',
    duration: '4-12 weeks',
    goals: ['tissue_repair', 'gi_healing', 'muscle_strength'],
    bestFor: ['Tendon/ligament injuries', 'GI healing', 'Muscle recovery', 'Joint health'],
    contraindications: ['Active cancer', 'Pregnancy', 'Severe kidney disease'],
    synergyWith: ['TB-500', 'GHK-Cu', 'Collagen', 'Vitamin C'],
    notes: 'Most versatile repair peptide; excellent safety profile',
  },
  {
    id: 'tb-500',
    name: 'TB-500 (Thymosin Beta-4)',
    category: 'repair',
    price: 120,
    size: '10mg',
    evidenceGrade: 'C-D',
    riskTier: 'low-moderate',
    mechanism: 'Actin-binding protein promoting cell migration, angiogenesis, and tissue remodeling',
    dosageRange: '2.5-5mg',
    timing: '2x weekly',
    route: 'SubQ',
    duration: '4-12 weeks',
    goals: ['tissue_repair', 'muscle_strength', 'cardiovascular'],
    bestFor: ['Systemic healing', 'Muscle repair', 'Inflammation reduction', 'Flexibility'],
    contraindications: ['Active cancer', 'Pregnancy'],
    synergyWith: ['BPC-157', 'GHK-Cu', 'Sermorelin'],
    notes: 'Excellent for systemic repair; works synergistically with BPC-157',
  },
  {
    id: 'bpc-tb4-blend',
    name: 'BPC-TB4 Blend',
    category: 'repair',
    price: 240,
    size: '10mg + 10mg',
    evidenceGrade: 'C-D',
    riskTier: 'low-moderate',
    mechanism: 'Synergistic combination of BPC-157 and TB-500 for enhanced repair',
    dosageRange: '500mcg BPC / 2.5mg TB-500',
    timing: '1-2x daily / 2x weekly',
    route: 'SubQ',
    duration: '4-12 weeks',
    goals: ['tissue_repair', 'muscle_strength', 'gi_healing'],
    bestFor: ['Complex injuries', 'Accelerated healing', 'Post-surgical recovery'],
    contraindications: ['Active cancer', 'Pregnancy'],
    synergyWith: ['GHK-Cu', 'Sermorelin', 'Collagen'],
    notes: 'Premium repair stack; most comprehensive healing support',
  },
  {
    id: 'ghk',
    name: 'GHK',
    category: 'repair',
    price: 60,
    size: '50mg',
    evidenceGrade: 'C',
    riskTier: 'low',
    mechanism: 'Copper-binding tripeptide promoting collagen synthesis and wound healing',
    dosageRange: '50-200mcg',
    timing: 'Daily',
    route: 'SubQ or topical',
    duration: '4-12 weeks',
    goals: ['skin_hair', 'tissue_repair', 'anti_aging'],
    bestFor: ['Skin rejuvenation', 'Wound healing', 'Collagen production'],
    contraindications: ['Wilson\'s disease'],
    synergyWith: ['GHK-Cu', 'BPC-157', 'Vitamin C'],
    notes: 'Precursor to GHK-Cu; excellent safety profile',
  },
  {
    id: 'ghk-cu',
    name: 'GHK-Cu',
    category: 'repair',
    price: 70,
    size: '50mg',
    evidenceGrade: 'C',
    riskTier: 'low',
    mechanism: 'Copper peptide complex promoting collagen, elastin synthesis, and gene expression modulation',
    dosageRange: '1-2mg',
    timing: 'Daily',
    route: 'SubQ or topical',
    duration: '8-16 weeks',
    goals: ['skin_hair', 'tissue_repair', 'anti_aging'],
    bestFor: ['Anti-aging skin', 'Hair growth', 'Wound healing', 'Collagen remodeling'],
    contraindications: ['Wilson\'s disease', 'Copper sensitivity'],
    synergyWith: ['BPC-157', 'TB-500', 'Epitalon'],
    notes: 'Powerful anti-aging peptide; modulates 4000+ genes',
  },
  {
    id: 'glow-blend',
    name: 'GLOW Blend (BPC + TB-500 + GHK-Cu)',
    category: 'repair',
    price: 215,
    size: 'Mixed',
    evidenceGrade: 'C-D',
    riskTier: 'low-moderate',
    mechanism: 'Triple peptide synergy for comprehensive repair and rejuvenation',
    dosageRange: 'Per component guidelines',
    timing: 'Daily',
    route: 'SubQ',
    duration: '8-12 weeks',
    goals: ['tissue_repair', 'skin_hair', 'anti_aging', 'muscle_strength'],
    bestFor: ['Comprehensive healing', 'Skin rejuvenation', 'Anti-aging', 'Recovery optimization'],
    contraindications: ['Active cancer', 'Pregnancy'],
    synergyWith: ['Sermorelin', 'Epitalon', 'Collagen'],
    notes: 'All-in-one repair stack',
  },
  {
    id: 'elamipretide',
    name: 'Elamipretide (SS-31)',
    category: 'repair',
    price: 250,
    size: '50mg',
    evidenceGrade: 'B-C',
    riskTier: 'moderate',
    mechanism: 'Mitochondrial-targeted peptide stabilizing cardiolipin and restoring cellular energy',
    dosageRange: '10-40mg',
    timing: 'Daily',
    route: 'SubQ',
    duration: '4-12 weeks',
    goals: ['anti_aging', 'cardiovascular', 'metabolic_health', 'cognitive'],
    bestFor: ['Mitochondrial dysfunction', 'Heart failure', 'Aging', 'Fatigue'],
    contraindications: ['Pregnancy', 'Severe renal impairment'],
    synergyWith: ['NAD+', 'CoQ10', 'MOTS-c'],
    notes: 'In clinical trials for heart failure and mitochondrial diseases',
  },
  {
    id: 'tp508',
    name: 'TP508 (Chrysalin)',
    category: 'repair',
    price: 80,
    size: '5mg',
    evidenceGrade: 'C-D',
    riskTier: 'low-moderate',
    mechanism: 'Thrombin-derived peptide promoting wound healing and endothelial repair',
    dosageRange: '100-500mcg',
    timing: 'Daily or every other day',
    route: 'SubQ or local',
    duration: '4-8 weeks',
    goals: ['tissue_repair', 'skin_hair'],
    bestFor: ['Wound healing', 'Fracture repair', 'Diabetic ulcers'],
    contraindications: ['Active bleeding disorders', 'Pregnancy'],
    synergyWith: ['BPC-157', 'GHK-Cu'],
    notes: 'Specialized wound healing peptide',
  },
  {
    id: 'fgl',
    name: 'FGL (Fibroblast Growth Factor-Like)',
    category: 'repair',
    price: 110,
    size: '10mg',
    evidenceGrade: 'D',
    riskTier: 'low-moderate',
    mechanism: 'FGF receptor modulator promoting cognitive and neural repair',
    dosageRange: '1-5mg',
    timing: '2-3x weekly',
    route: 'SubQ',
    duration: '4-8 weeks',
    goals: ['cognitive', 'tissue_repair'],
    bestFor: ['Neural repair', 'Cognitive enhancement', 'Memory'],
    contraindications: ['Cancer history', 'Pregnancy'],
    synergyWith: ['Semax', 'Selank', 'BPC-157'],
    notes: 'Emerging neuroprotective peptide',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // METABOLIC & WEIGHT LOSS
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'cagrilintide',
    name: 'Cagrilintide',
    category: 'metabolic',
    price: 90,
    size: '5mg',
    evidenceGrade: 'B-C',
    riskTier: 'moderate',
    mechanism: 'Amylin analog reducing appetite and slowing gastric emptying',
    dosageRange: '0.25-2.4mg',
    timing: 'Weekly (slow titration)',
    route: 'SubQ',
    duration: 'Ongoing',
    goals: ['fat_loss', 'metabolic_health'],
    bestFor: ['Weight loss', 'Appetite control', 'Metabolic syndrome'],
    contraindications: ['Pancreatitis history', 'MTC/MEN2 history', 'Pregnancy', 'Gastroparesis'],
    synergyWith: ['Semaglutide', 'AOD-9604', 'Protein (1.4g/lb)'],
    notes: 'Similar to GLP-1s; requires slow titration for GI tolerance',
  },
  {
    id: 'cagrilintide-10mg',
    name: 'Cagrilintide (10mg)',
    category: 'metabolic',
    price: 170,
    size: '10mg',
    evidenceGrade: 'B-C',
    riskTier: 'moderate',
    mechanism: 'Amylin analog reducing appetite and slowing gastric emptying',
    dosageRange: '0.25-2.4mg',
    timing: 'Weekly (slow titration)',
    route: 'SubQ',
    duration: 'Ongoing',
    goals: ['fat_loss', 'metabolic_health'],
    bestFor: ['Weight loss', 'Appetite control', 'Longer treatment duration'],
    contraindications: ['Pancreatitis history', 'MTC/MEN2 history', 'Pregnancy', 'Gastroparesis'],
    synergyWith: ['Semaglutide', 'AOD-9604', 'Protein (1.4g/lb)'],
    notes: 'Larger vial for extended treatment',
  },
  {
    id: 'sema-cagri-blend',
    name: 'Sema + Cagri Blend',
    category: 'metabolic',
    price: 120,
    size: '5mg + 5mg',
    evidenceGrade: 'B',
    riskTier: 'moderate',
    mechanism: 'Dual GLP-1/amylin agonism for enhanced appetite suppression and metabolic effects',
    dosageRange: 'Per individual component titration',
    timing: 'Weekly',
    route: 'SubQ',
    duration: 'Ongoing',
    goals: ['fat_loss', 'metabolic_health'],
    bestFor: ['Maximum weight loss', 'Severe obesity', 'Metabolic optimization'],
    contraindications: ['Pancreatitis history', 'MTC/MEN2', 'Pregnancy', 'Gastroparesis'],
    synergyWith: ['High protein diet', 'Strength training'],
    notes: 'Most potent weight loss combination; GI side effects additive',
  },
  {
    id: 'aod-9604',
    name: 'FRAG 176-191 + AOD 9604 Blend',
    category: 'metabolic',
    price: 95,
    size: '5mg each',
    evidenceGrade: 'C-D',
    riskTier: 'low-moderate',
    mechanism: 'GH fragment promoting lipolysis without insulin or growth effects',
    dosageRange: '250-500mcg',
    timing: 'Fasted AM or before bed',
    route: 'SubQ',
    duration: '8-12 weeks',
    goals: ['fat_loss'],
    bestFor: ['Targeted fat loss', 'Body recomposition', 'GLP-1 intolerant individuals'],
    contraindications: ['Diabetes (monitor glucose)', 'Pregnancy'],
    synergyWith: ['Zone 2 cardio', 'Caffeine', 'L-carnitine'],
    notes: 'Modest fat loss effect (1-2 lbs/month); no appetite suppression',
  },
  {
    id: 'mots-c',
    name: 'MOTS-c',
    category: 'metabolic',
    price: 60,
    size: '5mg',
    evidenceGrade: 'D',
    riskTier: 'low',
    mechanism: 'Mitochondrial-derived peptide enhancing metabolic function and exercise capacity',
    dosageRange: '5-10mg',
    timing: '3-5x weekly',
    route: 'SubQ',
    duration: '8-12 weeks',
    goals: ['metabolic_health', 'fat_loss', 'muscle_strength', 'anti_aging'],
    bestFor: ['Metabolic optimization', 'Exercise performance', 'Endurance', 'Insulin sensitivity'],
    contraindications: ['Pregnancy'],
    synergyWith: ['NAD+', 'Elamipretide', 'Exercise'],
    notes: 'Exercise mimetic; enhances mitochondrial function',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NEUROPEPTIDES & COGNITIVE
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'semax',
    name: 'Semax',
    category: 'neuropeptide',
    price: 50,
    size: '10mg',
    evidenceGrade: 'C-D',
    riskTier: 'low',
    mechanism: 'ACTH derivative promoting BDNF, cognitive function, and neuroprotection',
    dosageRange: '200-600mcg',
    timing: 'Intranasal morning',
    route: 'Intranasal or SubQ',
    duration: '4-8 weeks',
    goals: ['cognitive', 'anti_aging'],
    bestFor: ['Focus', 'Memory', 'Neuroprotection', 'Stroke recovery'],
    contraindications: ['Uncontrolled anxiety', 'Pregnancy'],
    synergyWith: ['Selank', 'NAD+', 'Omega-3'],
    notes: 'Russian nootropic; well-studied for cognitive enhancement',
  },
  {
    id: 'selank',
    name: 'Selank',
    category: 'neuropeptide',
    price: 50,
    size: '10mg',
    evidenceGrade: 'C-D',
    riskTier: 'low',
    mechanism: 'Tuftsin analog with anxiolytic, nootropic, and immunomodulatory effects',
    dosageRange: '250-500mcg',
    timing: 'Intranasal 1-2x daily',
    route: 'Intranasal or SubQ',
    duration: '4-8 weeks',
    goals: ['cognitive', 'immune'],
    bestFor: ['Anxiety reduction', 'Cognitive enhancement', 'Immune support', 'Stress'],
    contraindications: ['Pregnancy'],
    synergyWith: ['Semax', 'Magnesium', 'L-theanine'],
    notes: 'Anxiolytic without sedation; enhances learning',
  },
  {
    id: 'dsip',
    name: 'DSIP (Delta Sleep-Inducing Peptide)',
    category: 'neuropeptide',
    price: 35,
    size: '5mg',
    evidenceGrade: 'C-D',
    riskTier: 'low',
    mechanism: 'Nonapeptide modulating sleep architecture and enhancing delta wave sleep',
    dosageRange: '100-500mcg',
    timing: 'Before bed',
    route: 'SubQ',
    duration: '4-12 weeks',
    goals: ['sleep_recovery', 'anti_aging'],
    bestFor: ['Sleep quality', 'Deep sleep', 'Recovery', 'Shift workers'],
    contraindications: ['Narcolepsy', 'Untreated sleep apnea'],
    synergyWith: ['Sermorelin', 'Magnesium', 'Glycine'],
    notes: 'Very safe; promotes restorative sleep without sedation',
  },
  {
    id: 'humanin',
    name: 'Humanin (HNG)',
    category: 'neuropeptide',
    price: 60,
    size: '5mg',
    evidenceGrade: 'D',
    riskTier: 'low',
    mechanism: 'Mitochondrial-derived peptide with neuroprotective and cardioprotective effects',
    dosageRange: '0.5-5mg',
    timing: 'Daily or 3x weekly',
    route: 'SubQ',
    duration: '4-12 weeks',
    goals: ['cognitive', 'anti_aging', 'cardiovascular'],
    bestFor: ['Neuroprotection', 'Mitochondrial health', 'Alzheimer\'s prevention'],
    contraindications: ['Pregnancy'],
    synergyWith: ['NAD+', 'Semax', 'Elamipretide'],
    notes: 'Emerging longevity peptide; excellent safety profile',
  },
  {
    id: 'dihexa',
    name: 'Dihexa',
    category: 'neuropeptide',
    price: 100,
    size: '10mg',
    evidenceGrade: 'D',
    riskTier: 'low-moderate',
    mechanism: 'HGF/c-Met system modulator promoting synaptic plasticity and memory',
    dosageRange: '10-20mg',
    timing: 'Morning',
    route: 'Oral or SubQ',
    duration: '4-8 weeks',
    goals: ['cognitive'],
    bestFor: ['Memory enhancement', 'Synaptic plasticity', 'Cognitive decline'],
    contraindications: ['Cancer history', 'Pregnancy'],
    synergyWith: ['Semax', 'NAD+'],
    notes: 'Potent nootropic; 10 million times more potent than BDNF in some models',
  },
  {
    id: 'pinealon',
    name: 'Pinealon',
    category: 'bioregulator',
    price: 50,
    size: '20mg',
    evidenceGrade: 'D',
    riskTier: 'low',
    mechanism: 'Pineal gland bioregulator supporting melatonin and circadian function',
    dosageRange: '10-20mg',
    timing: 'Evening',
    route: 'SubQ or oral',
    duration: '10-20 day cycles',
    goals: ['sleep_recovery', 'cognitive', 'anti_aging'],
    bestFor: ['Sleep optimization', 'Circadian rhythm', 'Pineal health'],
    contraindications: ['Pregnancy'],
    synergyWith: ['DSIP', 'Epitalon', 'Melatonin'],
    notes: 'Russian bioregulator for pineal function',
  },
  {
    id: 'cortagen',
    name: 'Cortagen',
    category: 'bioregulator',
    price: 50,
    size: '20mg',
    evidenceGrade: 'D',
    riskTier: 'low-moderate',
    mechanism: 'Adrenal and brain cortex bioregulator supporting stress adaptation',
    dosageRange: '10-20mg',
    timing: 'Morning',
    route: 'SubQ or oral',
    duration: '10-20 day cycles',
    goals: ['cognitive', 'hormonal'],
    bestFor: ['Stress resilience', 'Cognitive function', 'Adrenal support'],
    contraindications: ['Pregnancy'],
    synergyWith: ['Semax', 'Selank', 'Vitamin C'],
    notes: 'Russian bioregulator; supports HPA axis',
  },
  {
    id: 'oxytocin',
    name: 'Oxytocin',
    category: 'neuropeptide',
    price: 50,
    size: '10mg',
    evidenceGrade: 'C',
    riskTier: 'low',
    mechanism: 'Social bonding neuropeptide promoting trust, relaxation, and connection',
    dosageRange: '10-40 IU',
    timing: 'As needed for social/bonding contexts',
    route: 'Intranasal',
    duration: 'Acute use',
    goals: ['cognitive', 'sexual_function', 'hormonal'],
    bestFor: ['Social bonding', 'Anxiety reduction', 'Trust', 'Intimacy'],
    contraindications: ['Pregnancy (can induce labor)'],
    synergyWith: ['Selank', 'PT-141'],
    notes: 'Use acutely; not for chronic daily use',
  },
  {
    id: 'vip',
    name: 'VIP (Vasoactive Intestinal Peptide)',
    category: 'neuropeptide',
    price: 30,
    size: '2mg',
    evidenceGrade: 'D',
    riskTier: 'low',
    mechanism: 'Multi-functional peptide affecting GI, immune, and respiratory function',
    dosageRange: '50-100mcg',
    timing: 'Variable',
    route: 'Intranasal or SubQ',
    duration: 'Per protocol',
    goals: ['immune', 'gi_healing'],
    bestFor: ['CIRS/Mold illness', 'Respiratory support', 'Immune modulation'],
    contraindications: ['Hypotension', 'Pregnancy'],
    synergyWith: ['BPC-157', 'KPV'],
    notes: 'Used in CIRS protocols',
  },
  {
    id: 'atx-gd-59',
    name: 'ATX-GD-59',
    category: 'neuropeptide',
    price: 75,
    size: '1.6mg',
    evidenceGrade: 'D-E',
    riskTier: 'low-moderate',
    mechanism: 'Neuroprotective peptide for cognitive support',
    dosageRange: 'Variable',
    timing: 'Morning',
    route: 'SubQ',
    duration: '4-8 weeks',
    goals: ['cognitive'],
    bestFor: ['Cognitive enhancement', 'Neuroprotection'],
    contraindications: ['Pregnancy'],
    synergyWith: ['Semax', 'Selank'],
    notes: 'Proprietary compound; limited published data',
  },
  {
    id: 'irw-peptide',
    name: 'IRW Peptide',
    category: 'neuropeptide',
    price: 60,
    size: '10mg',
    evidenceGrade: 'D',
    riskTier: 'low',
    mechanism: 'Food-derived bioactive tripeptide with antihypertensive and antioxidant effects',
    dosageRange: 'Variable',
    timing: 'Daily',
    route: 'Oral or SubQ',
    duration: '4-8 weeks',
    goals: ['cardiovascular', 'anti_aging'],
    bestFor: ['Blood pressure support', 'Antioxidant', 'Vascular health'],
    contraindications: ['Pregnancy'],
    synergyWith: ['Omega-3', 'CoQ10'],
    notes: 'Food-derived peptide',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // IMMUNE & THYMIC PEPTIDES
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'thymosin-alpha1',
    name: 'Thymosin Alpha-1',
    category: 'immune',
    price: 65,
    size: '4.5mg',
    evidenceGrade: 'B-C',
    riskTier: 'low',
    mechanism: 'Thymic peptide enhancing T-cell function, NK cells, and immune modulation',
    dosageRange: '1.6-4.5mg',
    timing: '2-3x weekly',
    route: 'SubQ',
    duration: '4-16 weeks',
    goals: ['immune', 'anti_aging'],
    bestFor: ['Immune optimization', 'Viral support', 'Cancer adjunct', 'Aging immune decline'],
    contraindications: ['Active autoimmune flare', 'Pregnancy'],
    synergyWith: ['Vitamin D', 'Zinc', 'Vitamin C', 'Epitalon'],
    notes: 'Approved in 35+ countries; excellent safety profile',
  },
  {
    id: 'thymosin-beta4',
    name: 'Thymosin Beta-4',
    category: 'immune',
    price: 120,
    size: '10mg',
    evidenceGrade: 'C',
    riskTier: 'low-moderate',
    mechanism: 'Actin-binding thymic peptide promoting tissue repair and anti-aging',
    dosageRange: '2-4mg',
    timing: '2-3x weekly',
    route: 'SubQ',
    duration: '4-12 weeks',
    goals: ['tissue_repair', 'immune', 'anti_aging'],
    bestFor: ['Muscle recovery', 'Tissue repair', 'Anti-aging'],
    contraindications: ['Active cancer', 'Pregnancy'],
    synergyWith: ['BPC-157', 'TB-500'],
    notes: 'Same as TB-500; parent compound',
  },
  {
    id: 'thymogen',
    name: 'Thymogen',
    category: 'immune',
    price: 35,
    size: '1mg',
    evidenceGrade: 'C-D',
    riskTier: 'low',
    mechanism: 'Synthetic thymic dipeptide for immune enhancement',
    dosageRange: '100-500mcg',
    timing: 'Daily',
    route: 'SubQ',
    duration: '4-8 weeks',
    goals: ['immune'],
    bestFor: ['Immune support', 'Infection recovery'],
    contraindications: ['Pregnancy'],
    synergyWith: ['Thymosin Alpha-1', 'Vitamin C'],
    notes: 'Entry-level thymic peptide; affordable',
  },
  {
    id: 'thymulin',
    name: 'Thymulin',
    category: 'immune',
    price: 100,
    size: '20mg',
    evidenceGrade: 'D',
    riskTier: 'low',
    mechanism: 'Zinc-dependent thymic hormone regulating T-cell maturation',
    dosageRange: '1-5mg',
    timing: '2-3x weekly',
    route: 'SubQ',
    duration: '4-12 weeks',
    goals: ['immune', 'anti_aging'],
    bestFor: ['Thymic function', 'Age-related immune decline'],
    contraindications: ['Pregnancy'],
    synergyWith: ['Zinc', 'Thymosin Alpha-1'],
    notes: 'Requires adequate zinc status',
  },
  {
    id: 'll-37',
    name: 'LL-37',
    category: 'immune',
    price: 75,
    size: '4mg',
    evidenceGrade: 'C-D',
    riskTier: 'low-moderate',
    mechanism: 'Human cathelicidin with broad antimicrobial and immunomodulatory effects',
    dosageRange: '50-100mcg',
    timing: 'Daily',
    route: 'SubQ',
    duration: '4-8 weeks',
    goals: ['immune', 'tissue_repair'],
    bestFor: ['Antimicrobial support', 'Wound healing', 'Immune modulation'],
    contraindications: ['Pregnancy'],
    synergyWith: ['Thymosin Alpha-1', 'BPC-157'],
    notes: 'Caution: pro-inflammatory at high doses',
  },
  {
    id: 'hybrid-ll37-ta1',
    name: 'Hybrid LL-37/Tα1',
    category: 'immune',
    price: 70,
    size: '5mg',
    evidenceGrade: 'D',
    riskTier: 'low-moderate',
    mechanism: 'Combined LL-37 and Thymosin Alpha-1 effects',
    dosageRange: 'Per component guidelines',
    timing: '2-3x weekly',
    route: 'SubQ',
    duration: '4-8 weeks',
    goals: ['immune'],
    bestFor: ['Comprehensive immune support', 'Antimicrobial + thymic'],
    contraindications: ['Active autoimmune', 'Pregnancy'],
    synergyWith: ['Vitamin D', 'Zinc'],
    notes: 'Combined immune peptide',
  },
  {
    id: 'kpv',
    name: 'KPV',
    category: 'immune',
    price: 65,
    size: '10mg',
    evidenceGrade: 'D',
    riskTier: 'low',
    mechanism: 'Alpha-MSH fragment with anti-inflammatory and antimicrobial properties',
    dosageRange: '200-500mcg',
    timing: 'Daily',
    route: 'SubQ or oral',
    duration: '4-12 weeks',
    goals: ['immune', 'gi_healing', 'skin_hair'],
    bestFor: ['Gut inflammation', 'Skin conditions', 'Antimicrobial'],
    contraindications: ['Pregnancy'],
    synergyWith: ['BPC-157', 'L-Glutamine'],
    notes: 'Excellent for gut healing and inflammation',
  },
  {
    id: 'gv1001',
    name: 'GV1001',
    category: 'immune',
    price: 60,
    size: '1.12mg',
    evidenceGrade: 'C-D',
    riskTier: 'low-moderate',
    mechanism: 'Telomerase reverse transcriptase peptide with immune and anti-aging properties',
    dosageRange: 'Per clinical protocol',
    timing: 'Variable',
    route: 'SubQ or ID',
    duration: 'Variable',
    goals: ['immune', 'anti_aging'],
    bestFor: ['Immune modulation', 'Anti-aging'],
    contraindications: ['Pregnancy'],
    synergyWith: ['Epitalon', 'Thymosin Alpha-1'],
    notes: 'Originally developed as cancer vaccine',
  },
  {
    id: 'kcf-18',
    name: 'KCF-18',
    category: 'immune',
    price: 115,
    size: '10mg',
    evidenceGrade: 'D',
    riskTier: 'low-moderate',
    mechanism: 'Antimicrobial peptide with immune support',
    dosageRange: 'Variable',
    timing: 'Daily',
    route: 'SubQ',
    duration: '4-8 weeks',
    goals: ['immune'],
    bestFor: ['Antimicrobial support', 'Immune enhancement'],
    contraindications: ['Pregnancy'],
    synergyWith: ['LL-37', 'Thymosin Alpha-1'],
    notes: 'Research-stage antimicrobial',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ANTI-AGING & LONGEVITY
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'epitalon',
    name: 'Epitalon',
    category: 'bioregulator',
    price: 50,
    size: '10mg',
    evidenceGrade: 'C-D',
    riskTier: 'low-moderate',
    mechanism: 'Tetrapeptide activating telomerase and optimizing pineal/circadian function',
    dosageRange: '5-10mg',
    timing: 'Before bed, 10-day cycles',
    route: 'SubQ',
    duration: '10-20 days on, 20 days off',
    goals: ['anti_aging', 'sleep_recovery'],
    bestFor: ['Telomere support', 'Sleep quality', 'Circadian optimization', 'Longevity'],
    contraindications: ['Cancer history (theoretical)', 'Pregnancy'],
    synergyWith: ['DSIP', 'NAD+', 'Thymosin Alpha-1'],
    notes: 'Flagship Russian anti-aging peptide',
  },
  {
    id: 'nad-plus',
    name: 'NAD+',
    category: 'metabolic',
    price: 105,
    size: '500mg',
    evidenceGrade: 'B-C',
    riskTier: 'low',
    mechanism: 'Direct NAD+ supplementation for cellular energy and sirtuin activation',
    dosageRange: '50-500mg',
    timing: 'Morning or as needed',
    route: 'SubQ or IV',
    duration: 'Variable',
    goals: ['anti_aging', 'cognitive', 'metabolic_health'],
    bestFor: ['Cellular energy', 'Anti-aging', 'Mitochondrial function', 'Brain fog'],
    contraindications: ['Pregnancy'],
    synergyWith: ['MOTS-c', 'Elamipretide', 'Resveratrol'],
    notes: 'Core longevity molecule; injectable for direct effect',
  },
  {
    id: 'fox-04',
    name: 'FOX-04 (FOXO4-DRI)',
    category: 'bioregulator',
    price: 300,
    size: '2mg',
    evidenceGrade: 'D',
    riskTier: 'moderate',
    mechanism: 'Senolytic peptide targeting senescent cells for elimination',
    dosageRange: 'Variable',
    timing: 'Pulsed 2-3 day cycles',
    route: 'SubQ',
    duration: 'Pulsed cycles',
    goals: ['anti_aging'],
    bestFor: ['Senescent cell clearance', 'Anti-aging'],
    contraindications: ['Cancer', 'Immune compromise', 'Pregnancy'],
    synergyWith: ['Fisetin', 'Quercetin'],
    notes: 'Experimental senolytic; expensive',
  },
  {
    id: 'gdf-11',
    name: 'GDF-11',
    category: 'bioregulator',
    price: 23,
    size: '50pg',
    evidenceGrade: 'D',
    riskTier: 'low-moderate',
    mechanism: 'Circulating growth factor with alleged rejuvenation effects',
    dosageRange: 'Picogram dosing',
    timing: 'Variable',
    route: 'SubQ',
    duration: 'Research-stage',
    goals: ['anti_aging'],
    bestFor: ['Rejuvenation (theoretical)', 'Anti-aging research'],
    contraindications: ['Pregnancy'],
    synergyWith: ['Epitalon', 'NAD+'],
    notes: 'Extremely preliminary; mechanism in humans unknown',
  },
  {
    id: 'alpha-klotho',
    name: 'α-Klotho',
    category: 'bioregulator',
    price: 21,
    size: '3.5pg',
    evidenceGrade: 'D',
    riskTier: 'low',
    mechanism: 'Longevity protein associated with lifespan extension',
    dosageRange: 'Picogram dosing',
    timing: 'Variable',
    route: 'SubQ',
    duration: 'Research-stage',
    goals: ['anti_aging'],
    bestFor: ['Longevity research', 'Anti-aging'],
    contraindications: ['Pregnancy'],
    synergyWith: ['NAD+', 'Epitalon'],
    notes: 'Research-stage; mechanism in humans unknown',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SEXUAL FUNCTION & HORMONAL
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'pt-141',
    name: 'PT-141 (Bremelanotide)',
    category: 'hormonal',
    price: 45,
    size: '10mg',
    evidenceGrade: 'C-D',
    riskTier: 'low-moderate',
    mechanism: 'MC4R agonist enhancing sexual arousal via central nervous system',
    dosageRange: '1-2mg',
    timing: '2-4 hours before activity',
    route: 'SubQ',
    duration: 'As needed',
    goals: ['sexual_function'],
    bestFor: ['Sexual dysfunction', 'Low libido', 'Erectile dysfunction', 'Female arousal'],
    contraindications: ['Uncontrolled hypertension', 'Cardiovascular disease', 'Pregnancy'],
    synergyWith: ['Kisspeptin-10', 'Oxytocin'],
    notes: 'FDA-approved version (Vyleesi) for female HSDD',
  },
  {
    id: 'kisspeptin-10',
    name: 'Kisspeptin-10',
    category: 'hormonal',
    price: 35,
    size: '3mg',
    evidenceGrade: 'D-E',
    riskTier: 'low',
    mechanism: 'GnRH trigger stimulating LH/FSH release and reproductive function',
    dosageRange: '1-10mcg',
    timing: 'Acute or 2-3x weekly',
    route: 'SubQ',
    duration: 'Variable',
    goals: ['sexual_function', 'hormonal'],
    bestFor: ['Sexual arousal', 'Reproductive optimization', 'Hormone pulsatility'],
    contraindications: ['Hormone-sensitive cancers', 'Pregnancy'],
    synergyWith: ['PT-141', 'Zinc', 'Vitamin D'],
    notes: 'Stimulates natural hormone cascade',
  },
  {
    id: 'melanotan-1',
    name: 'Melanotan-1 (Afamelanotide)',
    category: 'hormonal',
    price: 40,
    size: '10mg',
    evidenceGrade: 'D-E',
    riskTier: 'low-moderate',
    mechanism: 'MC1R agonist promoting melanogenesis and photoprotection',
    dosageRange: '0.5-1mg',
    timing: 'Daily during loading, then maintenance',
    route: 'SubQ',
    duration: '2-4 weeks loading, maintenance variable',
    goals: ['skin_hair', 'sexual_function'],
    bestFor: ['Tanning', 'Photoprotection', 'Skin health'],
    contraindications: ['Melanoma history', 'Pregnancy'],
    synergyWith: ['GHK-Cu', 'Vitamin D'],
    notes: 'Selective MC1R; fewer side effects than MT-2',
  },
  {
    id: 'melanotan-2',
    name: 'Melanotan-2',
    category: 'hormonal',
    price: 35,
    size: '10mg',
    evidenceGrade: 'D-E',
    riskTier: 'low-moderate',
    mechanism: 'Non-selective MCR agonist promoting tanning and libido',
    dosageRange: '0.25-0.5mg',
    timing: 'Daily during loading',
    route: 'SubQ',
    duration: '2-4 weeks loading',
    goals: ['skin_hair', 'sexual_function'],
    bestFor: ['Tanning', 'Libido enhancement', 'Appetite suppression'],
    contraindications: ['Melanoma history', 'Cardiovascular disease', 'Pregnancy'],
    synergyWith: ['PT-141'],
    notes: 'More side effects than MT-1; nausea, flushing common',
  },
  {
    id: 'setmelanotide',
    name: 'Setmelanotide',
    category: 'metabolic',
    price: 60,
    size: '15mg',
    evidenceGrade: 'B',
    riskTier: 'moderate',
    mechanism: 'MC4R agonist for appetite control in genetic obesity',
    dosageRange: 'Per FDA protocol',
    timing: 'Daily',
    route: 'SubQ',
    duration: 'Ongoing',
    goals: ['fat_loss', 'metabolic_health'],
    bestFor: ['Genetic obesity syndromes (POMC, LEPR deficiency)'],
    contraindications: ['Non-genetic obesity', 'Pregnancy'],
    synergyWith: ['Caloric deficit'],
    notes: 'FDA-approved for specific genetic obesity only',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // RUSSIAN BIOREGULATORS
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'cardiogen',
    name: 'Cardiogen',
    category: 'bioregulator',
    price: 50,
    size: '20mg',
    evidenceGrade: 'D',
    riskTier: 'low-moderate',
    mechanism: 'Cardiac bioregulator supporting heart tissue function',
    dosageRange: '10-20mg',
    timing: 'Daily for 10-20 days',
    route: 'SubQ or oral',
    duration: '10-20 day cycles',
    goals: ['cardiovascular', 'anti_aging'],
    bestFor: ['Cardiac health', 'Cardiovascular aging'],
    contraindications: ['Pregnancy'],
    synergyWith: ['CoQ10', 'Omega-3', 'Vesugen'],
    notes: 'Russian bioregulator; limited English data',
  },
  {
    id: 'cartalax',
    name: 'Cartalax',
    category: 'bioregulator',
    price: 50,
    size: '20mg',
    evidenceGrade: 'D',
    riskTier: 'low',
    mechanism: 'Cartilage bioregulator supporting joint health',
    dosageRange: '10-20mg',
    timing: 'Daily for 10-20 days',
    route: 'SubQ or oral',
    duration: '10-20 day cycles',
    goals: ['tissue_repair'],
    bestFor: ['Joint health', 'Cartilage support', 'Arthritis'],
    contraindications: ['Pregnancy'],
    synergyWith: ['BPC-157', 'Collagen', 'Glucosamine'],
    notes: 'Russian bioregulator for joint tissue',
  },
  {
    id: 'chonluten',
    name: 'Chonluten',
    category: 'bioregulator',
    price: 50,
    size: '20mg',
    evidenceGrade: 'D',
    riskTier: 'low',
    mechanism: 'Lung/respiratory bioregulator supporting pulmonary function',
    dosageRange: '10-20mg',
    timing: 'Daily for 10-20 days',
    route: 'SubQ or oral',
    duration: '10-20 day cycles',
    goals: ['immune'],
    bestFor: ['Respiratory health', 'Lung function', 'COPD support'],
    contraindications: ['Pregnancy'],
    synergyWith: ['VIP', 'NAC'],
    notes: 'Russian bioregulator for lungs',
  },
  {
    id: 'crystagen',
    name: 'Crystagen',
    category: 'bioregulator',
    price: 50,
    size: '20mg',
    evidenceGrade: 'D',
    riskTier: 'low',
    mechanism: 'Immune/connective tissue bioregulator',
    dosageRange: '10-20mg',
    timing: 'Daily for 10-20 days',
    route: 'SubQ or oral',
    duration: '10-20 day cycles',
    goals: ['immune', 'tissue_repair'],
    bestFor: ['Tissue regeneration', 'Immune support'],
    contraindications: ['Pregnancy'],
    synergyWith: ['Thymosin Alpha-1', 'BPC-157'],
    notes: 'Russian bioregulator',
  },
  {
    id: 'livagen',
    name: 'Livagen',
    category: 'bioregulator',
    price: 50,
    size: '20mg',
    evidenceGrade: 'D',
    riskTier: 'low-moderate',
    mechanism: 'Liver bioregulator supporting hepatic function',
    dosageRange: '10-20mg',
    timing: 'Daily for 10-20 days',
    route: 'SubQ or oral',
    duration: '10-20 day cycles',
    goals: ['metabolic_health'],
    bestFor: ['Liver health', 'Hepatic function', 'Detoxification'],
    contraindications: ['Pregnancy'],
    synergyWith: ['NAC', 'Milk thistle'],
    notes: 'Russian bioregulator for liver',
  },
  {
    id: 'normoftal',
    name: 'Normoftal',
    category: 'bioregulator',
    price: 50,
    size: '20mg',
    evidenceGrade: 'D',
    riskTier: 'low',
    mechanism: 'Eye/retinal bioregulator supporting vision',
    dosageRange: '10-20mg',
    timing: 'Daily for 10-20 days',
    route: 'SubQ or oral',
    duration: '10-20 day cycles',
    goals: ['anti_aging'],
    bestFor: ['Vision support', 'Retinal health', 'Age-related eye changes'],
    contraindications: ['Pregnancy'],
    synergyWith: ['Lutein', 'Zeaxanthin'],
    notes: 'Russian bioregulator for eyes',
  },
  {
    id: 'ovagen',
    name: 'Ovagen',
    category: 'bioregulator',
    price: 50,
    size: '20mg',
    evidenceGrade: 'D',
    riskTier: 'low',
    mechanism: 'Ovarian bioregulator supporting female reproductive aging',
    dosageRange: '10-20mg',
    timing: 'Daily for 10-20 days',
    route: 'SubQ or oral',
    duration: '10-20 day cycles',
    goals: ['hormonal', 'anti_aging'],
    bestFor: ['Female reproductive health', 'Ovarian function', 'Menopause support'],
    contraindications: ['Hormone-sensitive cancers', 'Pregnancy'],
    synergyWith: ['Kisspeptin-10', 'Vitamin D'],
    notes: 'Russian bioregulator for ovarian function',
  },
  {
    id: 'pancragen',
    name: 'Pancragen',
    category: 'bioregulator',
    price: 50,
    size: '20mg',
    evidenceGrade: 'D',
    riskTier: 'low-moderate',
    mechanism: 'Pancreatic bioregulator supporting glucose metabolism',
    dosageRange: '10-20mg',
    timing: 'Daily for 10-20 days',
    route: 'SubQ or oral',
    duration: '10-20 day cycles',
    goals: ['metabolic_health'],
    bestFor: ['Pancreatic function', 'Glucose metabolism', 'Diabetes support'],
    contraindications: ['Pregnancy'],
    synergyWith: ['Chromium', 'Berberine'],
    notes: 'Russian bioregulator for pancreas',
  },
  {
    id: 'prostamax',
    name: 'Prostamax',
    category: 'bioregulator',
    price: 50,
    size: '20mg',
    evidenceGrade: 'D',
    riskTier: 'low',
    mechanism: 'Prostate bioregulator supporting prostate health',
    dosageRange: '10-20mg',
    timing: 'Daily for 10-20 days',
    route: 'SubQ or oral',
    duration: '10-20 day cycles',
    goals: ['hormonal'],
    bestFor: ['Prostate health', 'BPH support', 'Male aging'],
    contraindications: ['Prostate cancer', 'Pregnancy'],
    synergyWith: ['Saw palmetto', 'Zinc'],
    notes: 'Russian bioregulator for prostate',
  },
  {
    id: 'vesilute',
    name: 'Vesilute',
    category: 'bioregulator',
    price: 50,
    size: '20mg',
    evidenceGrade: 'D',
    riskTier: 'low',
    mechanism: 'Venous bioregulator supporting vascular health',
    dosageRange: '10-20mg',
    timing: 'Daily for 10-20 days',
    route: 'SubQ or oral',
    duration: '10-20 day cycles',
    goals: ['cardiovascular'],
    bestFor: ['Venous health', 'Vascular function'],
    contraindications: ['Pregnancy'],
    synergyWith: ['Vesugen', 'Omega-3'],
    notes: 'Russian bioregulator for veins',
  },
  {
    id: 'vesugen',
    name: 'Vesugen',
    category: 'bioregulator',
    price: 50,
    size: '20mg',
    evidenceGrade: 'D',
    riskTier: 'low',
    mechanism: 'Vascular bioregulator supporting cardiovascular health',
    dosageRange: '10-20mg',
    timing: 'Daily for 10-20 days',
    route: 'SubQ or oral',
    duration: '10-20 day cycles',
    goals: ['cardiovascular', 'anti_aging'],
    bestFor: ['Cardiovascular health', 'Vascular aging'],
    contraindications: ['Pregnancy'],
    synergyWith: ['Cardiogen', 'CoQ10'],
    notes: 'Russian bioregulator for blood vessels',
  },
  {
    id: 'vilon',
    name: 'Vilon',
    category: 'bioregulator',
    price: 50,
    size: '20mg',
    evidenceGrade: 'D',
    riskTier: 'low',
    mechanism: 'Muscle bioregulator supporting muscle function',
    dosageRange: '10-20mg',
    timing: 'Daily for 10-20 days',
    route: 'SubQ or oral',
    duration: '10-20 day cycles',
    goals: ['muscle_strength'],
    bestFor: ['Muscle function', 'Sarcopenia', 'Muscle aging'],
    contraindications: ['Pregnancy'],
    synergyWith: ['BPC-157', 'Creatine'],
    notes: 'Russian bioregulator for muscle',
  },
  {
    id: 'klow-blend',
    name: 'KLOW Blend',
    category: 'bioregulator',
    price: 170,
    size: 'Mixed',
    evidenceGrade: 'D',
    riskTier: 'low-moderate',
    mechanism: 'Multi-peptide anti-aging blend',
    dosageRange: 'Per component guidelines',
    timing: 'Daily',
    route: 'SubQ',
    duration: 'Variable',
    goals: ['anti_aging'],
    bestFor: ['Comprehensive anti-aging', 'Longevity optimization'],
    contraindications: ['Cancer history', 'Pregnancy'],
    synergyWith: ['NAD+', 'Epitalon'],
    notes: 'Combination anti-aging blend',
  },
  {
    id: 'slu-pp-332',
    name: 'SLU-PP-332',
    category: 'metabolic',
    price: 90,
    size: '5mg',
    evidenceGrade: 'D',
    riskTier: 'low-moderate',
    mechanism: 'ERRα agonist with exercise mimetic effects',
    dosageRange: 'Variable',
    timing: 'Daily',
    route: 'SubQ or oral',
    duration: 'Research-stage',
    goals: ['metabolic_health', 'muscle_strength'],
    bestFor: ['Exercise mimetic', 'Metabolic enhancement'],
    contraindications: ['Pregnancy'],
    synergyWith: ['MOTS-c', 'Exercise'],
    notes: 'Research-stage compound; exercise in a pill concept',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ADDITIONAL PEPTIDES (Added for Product Catalog)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'ara-290',
    name: 'ARA-290',
    category: 'neuropeptide',
    price: 75,
    size: '10mg',
    evidenceGrade: 'B-C',
    riskTier: 'low-moderate',
    mechanism: 'Innate repair receptor agonist; promotes tissue repair without erythropoietic effects',
    dosageRange: '1-4mg',
    timing: 'Daily or as needed',
    route: 'SubQ',
    duration: '4-8 weeks',
    goals: ['tissue_repair', 'cognitive'],
    bestFor: ['Neuropathic pain', 'Tissue healing', 'Diabetic complications'],
    contraindications: ['Active cancer', 'Pregnancy'],
    synergyWith: ['BPC-157', 'NAD+'],
    notes: 'EPO-derived peptide without blood-building effects; Phase 2 clinical trials for neuropathy',
  },
  {
    id: 'ghrp-2',
    name: 'GHRP-2',
    category: 'growth_factor',
    price: 50,
    size: '5mg',
    evidenceGrade: 'B-C',
    riskTier: 'low-moderate',
    mechanism: 'Growth hormone releasing peptide; stimulates GH secretion via ghrelin receptor',
    dosageRange: '100-300mcg',
    timing: '2-3x daily, fasted',
    route: 'SubQ',
    duration: '8-12 weeks',
    goals: ['muscle_strength', 'fat_loss', 'sleep_recovery', 'anti_aging'],
    bestFor: ['GH optimization', 'Body composition', 'Recovery'],
    contraindications: ['Active cancer', 'Pregnancy', 'Diabetes'],
    synergyWith: ['CJC-1295', 'Sermorelin', 'GHRP-6'],
    notes: 'Stronger GH release than Ipamorelin; may increase appetite and cortisol slightly',
  },
  {
    id: 'ghrp-6',
    name: 'GHRP-6',
    category: 'growth_factor',
    price: 45,
    size: '5mg',
    evidenceGrade: 'B-C',
    riskTier: 'low-moderate',
    mechanism: 'Growth hormone releasing peptide; potent GH secretagogue with hunger-stimulating effects',
    dosageRange: '100-300mcg',
    timing: '2-3x daily, fasted',
    route: 'SubQ',
    duration: '8-12 weeks',
    goals: ['muscle_strength', 'fat_loss', 'sleep_recovery'],
    bestFor: ['GH release', 'Appetite stimulation', 'Mass building'],
    contraindications: ['Active cancer', 'Pregnancy', 'Uncontrolled diabetes'],
    synergyWith: ['CJC-1295', 'GHRP-2', 'Sermorelin'],
    notes: 'Significant appetite increase; good for those needing to eat more for gains',
  },
  {
    id: 'hexarelin',
    name: 'Hexarelin',
    category: 'growth_factor',
    price: 55,
    size: '2mg',
    evidenceGrade: 'B-C',
    riskTier: 'moderate',
    mechanism: 'Strongest GHRP; potent growth hormone secretagogue with cardiac benefits',
    dosageRange: '100-200mcg',
    timing: '2-3x daily',
    route: 'SubQ',
    duration: '4-6 weeks (desensitization occurs)',
    goals: ['muscle_strength', 'cardiovascular', 'anti_aging'],
    bestFor: ['Maximum GH release', 'Cardiac health', 'Strength'],
    contraindications: ['Cardiac conditions', 'Cancer history', 'Pregnancy'],
    synergyWith: ['CJC-1295', 'BPC-157'],
    notes: 'Most potent GHRP but rapid desensitization; cycle carefully',
  },
  {
    id: 'gonadorelin',
    name: 'Gonadorelin',
    category: 'hormonal',
    price: 45,
    size: '2mg',
    evidenceGrade: 'B',
    riskTier: 'low-moderate',
    mechanism: 'GnRH analog; stimulates LH and FSH release for testosterone/fertility support',
    dosageRange: '100-200mcg',
    timing: '2-3x weekly or as directed',
    route: 'SubQ',
    duration: 'Ongoing or cycled',
    goals: ['hormonal', 'sexual_function'],
    bestFor: ['Testosterone support during TRT', 'Fertility preservation', 'HPTA stimulation'],
    contraindications: ['Hormone-sensitive cancers', 'Pregnancy'],
    synergyWith: ['Kisspeptin-10', 'HCG alternative'],
    notes: 'Often used during TRT to maintain testicular function and fertility',
  },
  {
    id: 'mgf',
    name: 'MGF (Mechano Growth Factor)',
    category: 'growth_factor',
    price: 65,
    size: '2mg',
    evidenceGrade: 'C',
    riskTier: 'moderate',
    mechanism: 'IGF-1 splice variant; promotes satellite cell activation and muscle repair',
    dosageRange: '100-200mcg',
    timing: 'Post-workout',
    route: 'IM (localized)',
    duration: '4-6 weeks',
    goals: ['muscle_strength', 'tissue_repair'],
    bestFor: ['Localized muscle growth', 'Injury recovery', 'Hypertrophy'],
    contraindications: ['Cancer history', 'Pregnancy'],
    synergyWith: ['IGF-1 LR3', 'BPC-157', 'TB-500'],
    notes: 'Very short half-life; best used immediately post-training at target muscle',
  },
  {
    id: 'peg-mgf',
    name: 'PEG-MGF',
    category: 'growth_factor',
    price: 75,
    size: '2mg',
    evidenceGrade: 'C',
    riskTier: 'moderate',
    mechanism: 'PEGylated MGF with extended half-life for systemic muscle repair',
    dosageRange: '200-500mcg',
    timing: '2-3x weekly',
    route: 'SubQ or IM',
    duration: '4-8 weeks',
    goals: ['muscle_strength', 'tissue_repair'],
    bestFor: ['Systemic muscle recovery', 'Overall muscle development', 'Injury healing'],
    contraindications: ['Cancer history', 'Pregnancy'],
    synergyWith: ['IGF-1 LR3', 'BPC-157', 'GH secretagogues'],
    notes: 'Longer-acting than MGF; can be used for systemic effects',
  },
  {
    id: 'thymalin',
    name: 'Thymalin',
    category: 'immune',
    price: 55,
    size: '10mg',
    evidenceGrade: 'C-D',
    riskTier: 'low',
    mechanism: 'Thymic peptide complex; modulates immune function and T-cell maturation',
    dosageRange: '5-10mg',
    timing: 'Daily for 5-10 days',
    route: 'SubQ or IM',
    duration: '5-10 day cycles, repeat as needed',
    goals: ['immune', 'anti_aging'],
    bestFor: ['Immune reconstitution', 'Anti-aging', 'Post-illness recovery'],
    contraindications: ['Autoimmune conditions', 'Pregnancy'],
    synergyWith: ['Thymosin Alpha-1', 'Epitalon'],
    notes: 'Russian bioregulator; traditionally used for immune restoration',
  },
  {
    id: 'snap-8',
    name: 'SNAP-8',
    category: 'repair',
    price: 60,
    size: '10mg',
    evidenceGrade: 'C',
    riskTier: 'low',
    mechanism: 'Acetyl octapeptide-3; reduces muscle contraction for wrinkle reduction (Botox-like)',
    dosageRange: '50-100mcg',
    timing: 'Daily application',
    route: 'Topical or SubQ (facial)',
    duration: 'Ongoing',
    goals: ['skin_hair', 'anti_aging'],
    bestFor: ['Wrinkle reduction', 'Expression lines', 'Cosmetic anti-aging'],
    contraindications: ['Facial infections', 'Pregnancy'],
    synergyWith: ['GHK-Cu', 'Argireline'],
    notes: 'Cosmetic peptide; topical use most common, injectable for targeted effects',
  },
  {
    id: 'lc-120',
    name: 'LC-120',
    category: 'neuropeptide',
    price: 80,
    size: '10mg',
    evidenceGrade: 'D',
    riskTier: 'low-moderate',
    mechanism: 'Research neuropeptide with potential cognitive and neurological applications',
    dosageRange: 'Variable (research)',
    timing: 'Per protocol',
    route: 'SubQ',
    duration: 'Research-dependent',
    goals: ['cognitive', 'anti_aging'],
    bestFor: ['Cognitive research', 'Neuroprotection studies'],
    contraindications: ['Pregnancy', 'Neurological conditions'],
    synergyWith: ['Semax', 'Selank'],
    notes: 'Research-stage compound; limited published data',
  },
  {
    id: '5-amino-1mq',
    name: '5-Amino-1MQ',
    category: 'metabolic',
    price: 85,
    size: '50mg',
    evidenceGrade: 'C-D',
    riskTier: 'low-moderate',
    mechanism: 'NNMT inhibitor; blocks enzyme that slows metabolism and promotes fat storage',
    dosageRange: '50-150mg',
    timing: 'Daily, morning',
    route: 'Oral or SubQ',
    duration: '8-12 weeks',
    goals: ['fat_loss', 'metabolic_health'],
    bestFor: ['Metabolic enhancement', 'Fat loss', 'Energy'],
    contraindications: ['Liver disease', 'Pregnancy'],
    synergyWith: ['AOD-9604', 'MOTS-c', 'GLP-1 agonists'],
    notes: 'Small molecule NNMT inhibitor; enhances NAD+ levels and metabolic rate',
  },
  {
    id: 'glp1-cagrilintide',
    name: 'GLP-1 (Cagrilintide)',
    category: 'metabolic',
    price: 90,
    size: '5mg',
    evidenceGrade: 'B',
    riskTier: 'moderate',
    mechanism: 'Amylin analog; promotes satiety, slows gastric emptying, reduces appetite',
    dosageRange: '0.3-2.4mg',
    timing: 'Weekly',
    route: 'SubQ',
    duration: 'Ongoing',
    goals: ['fat_loss', 'metabolic_health'],
    bestFor: ['Weight loss', 'Appetite control', 'Metabolic optimization'],
    contraindications: ['MTC/MEN2', 'Pancreatitis history', 'Pregnancy'],
    synergyWith: ['Semaglutide', 'Tirzepatide', 'Exercise'],
    notes: 'Often combined with semaglutide (CagriSema) for enhanced weight loss',
  },
  {
    id: 'glp1-semaglutide',
    name: 'GLP-1 (Semaglutide)',
    category: 'metabolic',
    price: 95,
    size: '5mg',
    evidenceGrade: 'A',
    riskTier: 'moderate',
    mechanism: 'GLP-1 receptor agonist; enhances insulin secretion, reduces appetite, slows gastric emptying',
    dosageRange: '0.25-2.4mg',
    timing: 'Weekly',
    route: 'SubQ',
    duration: 'Ongoing',
    goals: ['fat_loss', 'metabolic_health', 'cardiovascular'],
    bestFor: ['Significant weight loss', 'Type 2 diabetes', 'Cardiovascular protection'],
    contraindications: ['MTC/MEN2', 'Pancreatitis', 'Pregnancy'],
    synergyWith: ['Cagrilintide', 'Exercise', 'Metformin'],
    notes: 'FDA-approved for weight management and T2D; titrate slowly to minimize GI effects',
  },
  {
    id: 'glp1-tirzepatide',
    name: 'GLP-1 (Tirzepatide)',
    category: 'metabolic',
    price: 120,
    size: '5mg',
    evidenceGrade: 'A',
    riskTier: 'moderate',
    mechanism: 'Dual GIP/GLP-1 receptor agonist; superior weight loss and glycemic control',
    dosageRange: '2.5-15mg',
    timing: 'Weekly',
    route: 'SubQ',
    duration: 'Ongoing',
    goals: ['fat_loss', 'metabolic_health', 'cardiovascular'],
    bestFor: ['Maximum weight loss', 'Type 2 diabetes', 'Metabolic syndrome'],
    contraindications: ['MTC/MEN2', 'Pancreatitis', 'Pregnancy'],
    synergyWith: ['Exercise', 'Metformin', 'Lifestyle modification'],
    notes: 'Most effective weight loss agent; titrate slowly; GI side effects common initially',
  },
  {
    id: 'glp1-retatrutide',
    name: 'GLP-1 (Retatrutide)',
    category: 'metabolic',
    price: 130,
    size: '5mg',
    evidenceGrade: 'B',
    riskTier: 'moderate',
    mechanism: 'Triple agonist (GLP-1/GIP/Glucagon); most potent weight loss compound in development',
    dosageRange: '1-12mg',
    timing: 'Weekly',
    route: 'SubQ',
    duration: 'Ongoing',
    goals: ['fat_loss', 'metabolic_health'],
    bestFor: ['Severe obesity', 'Maximum metabolic enhancement', 'Research'],
    contraindications: ['MTC/MEN2', 'Pancreatitis', 'Pregnancy', 'Cardiac conditions'],
    synergyWith: ['Exercise', 'Caloric deficit'],
    notes: 'Phase 3 trials; up to 24% weight loss in studies; not yet FDA-approved',
  },
  {
    id: 'glp1-mz',
    name: 'GLP-1 (MZ)',
    category: 'metabolic',
    price: 100,
    size: '5mg',
    evidenceGrade: 'C',
    riskTier: 'moderate',
    mechanism: 'GLP-1 analog variant for metabolic optimization',
    dosageRange: 'Variable',
    timing: 'Weekly',
    route: 'SubQ',
    duration: 'Ongoing',
    goals: ['fat_loss', 'metabolic_health'],
    bestFor: ['Weight management', 'Metabolic support'],
    contraindications: ['MTC/MEN2', 'Pancreatitis', 'Pregnancy'],
    synergyWith: ['Exercise', 'Dietary modification'],
    notes: 'Research compound; consult provider for specific protocol',
  },
  {
    id: 'glp1-sv',
    name: 'GLP-1 (SV)',
    category: 'metabolic',
    price: 100,
    size: '10mg',
    evidenceGrade: 'C',
    riskTier: 'moderate',
    mechanism: 'GLP-1 analog variant for metabolic optimization',
    dosageRange: 'Variable',
    timing: 'Weekly',
    route: 'SubQ',
    duration: 'Ongoing',
    goals: ['fat_loss', 'metabolic_health'],
    bestFor: ['Weight management', 'Metabolic support'],
    contraindications: ['MTC/MEN2', 'Pancreatitis', 'Pregnancy'],
    synergyWith: ['Exercise', 'Dietary modification'],
    notes: 'Research compound; consult provider for specific protocol',
  },
  {
    id: 'bacteriostatic-water',
    name: 'Bacteriostatic Water',
    category: 'immune',
    price: 10,
    size: '30ml',
    evidenceGrade: 'A',
    riskTier: 'low',
    mechanism: 'Sterile water with 0.9% benzyl alcohol preservative for reconstituting peptides',
    dosageRange: 'N/A - diluent',
    timing: 'As needed for reconstitution',
    route: 'N/A',
    duration: 'N/A',
    goals: [],
    bestFor: ['Peptide reconstitution', 'Multi-dose vial preparation'],
    contraindications: ['Benzyl alcohol allergy'],
    synergyWith: [],
    notes: 'Essential supply for peptide use; allows multi-dose vial storage',
  },
]

// ============================================================================
// GOAL-BASED RECOMMENDATION FUNCTIONS
// ============================================================================

export type GoalRecommendation = {
  goal: GoalDefinition
  primaryPeptides: CatalogPeptide[]
  secondaryPeptides: CatalogPeptide[]
  adjunctPeptides: CatalogPeptide[]
}

/**
 * Get all peptides for a specific goal, ranked by evidence and relevance
 */
export function getPeptidesForGoal(goalId: PeptideGoal): GoalRecommendation | null {
  const goal = PEPTIDE_GOALS.find(g => g.id === goalId)
  if (!goal) return null

  const matchingPeptides = PEPTIDE_CATALOG.filter(p => p.goals.includes(goalId))
  
  // Sort by evidence grade (A > B > C > D) and risk tier (lower is better)
  const sortedPeptides = matchingPeptides.sort((a, b) => {
    const evidenceOrder: Record<EvidenceGrade, number> = { 'A': 0, 'B': 1, 'B-C': 2, 'C': 3, 'C-D': 4, 'D': 5, 'D-E': 6 }
    const riskOrder: Record<RiskTier, number> = { 'low': 0, 'low-moderate': 1, 'moderate': 2, 'moderate-high': 3, 'high': 4 }
    
    const evidenceDiff = evidenceOrder[a.evidenceGrade] - evidenceOrder[b.evidenceGrade]
    if (evidenceDiff !== 0) return evidenceDiff
    
    return riskOrder[a.riskTier] - riskOrder[b.riskTier]
  })

  // Categorize: top 3 as primary, next 4 as secondary, rest as adjunct
  const primaryPeptides = sortedPeptides.slice(0, 3)
  const secondaryPeptides = sortedPeptides.slice(3, 7)
  const adjunctPeptides = sortedPeptides.slice(7)

  return {
    goal,
    primaryPeptides,
    secondaryPeptides,
    adjunctPeptides,
  }
}

/**
 * Get peptide recommendations for multiple goals (combined)
 */
export function getPeptidesForGoals(goalIds: PeptideGoal[]): {
  goals: GoalDefinition[]
  recommendations: Array<CatalogPeptide & { matchedGoals: PeptideGoal[]; matchCount: number }>
} {
  const goals = goalIds.map(id => PEPTIDE_GOALS.find(g => g.id === id)).filter((g): g is GoalDefinition => g !== null)
  const evidenceOrder: Record<EvidenceGrade, number> = { 'A': 0, 'B': 1, 'B-C': 2, 'C': 3, 'C-D': 4, 'D': 5, 'D-E': 6 }
  const riskOrder: Record<RiskTier, number> = { 'low': 0, 'low-moderate': 1, 'moderate': 2, 'moderate-high': 3, 'high': 4 }
  
  // Find all peptides that match any of the goals
  const peptideMatches = new Map<string, { peptide: CatalogPeptide; matchedGoals: PeptideGoal[] }>()
  
  for (const peptide of PEPTIDE_CATALOG) {
    const matchedGoals = peptide.goals.filter(g => goalIds.includes(g))
    if (matchedGoals.length > 0) {
      peptideMatches.set(peptide.id, { peptide, matchedGoals })
    }
  }

  // Convert to array and compute synergy within goal-matched set
  const recommendationEntries = Array.from(peptideMatches.values())
    .map(({ peptide, matchedGoals }) => ({
      ...peptide,
      matchedGoals,
      matchCount: matchedGoals.length,
    }))
  const recommendationIds = new Set(recommendationEntries.map((rec) => rec.id))
  const synergyScores = new Map<string, number>()

  for (const rec of recommendationEntries) {
    const synergyCount = getSynergyPeptides(rec.id).filter((p) => recommendationIds.has(p.id)).length
    synergyScores.set(rec.id, synergyCount)
  }

  // Sort by match count, synergy, then evidence/risk
  const recommendations = recommendationEntries.sort((a, b) => {
    if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount

    const synergyDiff = (synergyScores.get(b.id) ?? 0) - (synergyScores.get(a.id) ?? 0)
    if (synergyDiff !== 0) return synergyDiff

    const evidenceDiff = evidenceOrder[a.evidenceGrade] - evidenceOrder[b.evidenceGrade]
    if (evidenceDiff !== 0) return evidenceDiff

    const riskDiff = riskOrder[a.riskTier] - riskOrder[b.riskTier]
    if (riskDiff !== 0) return riskDiff

    return a.name.localeCompare(b.name)
  })

  return { goals, recommendations }
}

/**
 * Search peptides by name or mechanism
 */
export function searchPeptides(query: string): CatalogPeptide[] {
  const normalizedQuery = query.toLowerCase().trim()
  return PEPTIDE_CATALOG.filter(
    p =>
      p.name.toLowerCase().includes(normalizedQuery) ||
      p.mechanism.toLowerCase().includes(normalizedQuery) ||
      p.bestFor.some(b => b.toLowerCase().includes(normalizedQuery))
  )
}

/**
 * Get a specific peptide by ID
 */
export function getPeptideById(id: string): CatalogPeptide | null {
  return PEPTIDE_CATALOG.find(p => p.id === id) || null
}

/**
 * Get synergistic peptides for a given peptide
 */
export function getSynergyPeptides(peptideId: string): CatalogPeptide[] {
  const peptide = getPeptideById(peptideId)
  if (!peptide) return []
  
  return peptide.synergyWith
    .map(name => PEPTIDE_CATALOG.find(p => 
      p.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(p.name.toLowerCase())
    ))
    .filter((p): p is CatalogPeptide => p !== null)
}

// ============================================================================
// ORIGINAL PROTOCOL TEMPLATES (below)
// ============================================================================

export type ProtocolParameter = {
  id: string
  label: string
  type: 'number' | 'select' | 'boolean'
  options?: string[]
  defaultValue: string | number | boolean
  unit?: string
  min?: number
  max?: number
}

export type ProtocolPhase = {
  name: string
  weekStart: number
  weekEnd: number
  instructions: string
}

export type MonitoringItem = {
  label: string
  cadence: string
  notes?: string
}

export type ProtocolDocument = {
  title: string
  content: string
}

export type SynergisticPeptide = {
  name: string
  purpose: string
  dosageRange: string
  timing: string
  notes?: string
  priority: 'primary' | 'secondary' | 'optional'
}

export type ProtocolTemplate = {
  id: string
  name: string
  category: ProtocolCategory
  description: string
  defaultDuration: number
  phases: ProtocolPhase[]
  parameters: ProtocolParameter[]
  monitoringSchedule: MonitoringItem[]
  contraindications: string[]
  documents: ProtocolDocument[]
  synergisticPeptides?: SynergisticPeptide[]
}

export type GeneratedProtocol = {
  templateId: string
  name: string
  summary: string
  parameters: Record<string, string | number | boolean>
  phases: ProtocolPhase[]
  monitoringSchedule: MonitoringItem[]
  documents: ProtocolDocument[]
}

export const PROTOCOL_TEMPLATES: ProtocolTemplate[] = [
  {
    id: 'glp1-standard',
    name: 'GLP-1 Standard Protocol',
    category: 'metabolic',
    description: 'Foundational GLP-1 protocol with titration and monitoring.',
    defaultDuration: 12,
    parameters: [
      { id: 'startingDose', label: 'Starting dose', type: 'number', defaultValue: 0.25, unit: 'mg' },
      { id: 'targetDose', label: 'Target dose', type: 'number', defaultValue: 1.0, unit: 'mg' },
      { id: 'titrationWeeks', label: 'Titration weeks', type: 'number', defaultValue: 4, min: 2, max: 8 },
    ],
    phases: [
      {
        name: 'Titration',
        weekStart: 1,
        weekEnd: 4,
        instructions:
          'Start at {{startingDose}} mg and titrate over {{titrationWeeks}} weeks as tolerated.',
      },
      {
        name: 'Maintenance',
        weekStart: 5,
        weekEnd: 12,
        instructions: 'Maintain around {{targetDose}} mg with ongoing monitoring.',
      },
    ],
    monitoringSchedule: [
      { label: 'Weight and appetite', cadence: 'Weekly' },
      { label: 'Side effects', cadence: 'Weekly' },
      { label: 'Blood pressure', cadence: 'Monthly' },
    ],
    contraindications: ['History of pancreatitis', 'Pregnancy or breastfeeding'],
    documents: [
      {
        title: 'GLP-1 Patient Instructions',
        content:
          'Start at {{startingDose}} mg and titrate every 1-2 weeks as tolerated. Target dose: {{targetDose}} mg. Stay hydrated and prioritize protein at meals.',
      },
    ],
    synergisticPeptides: [
      {
        name: 'MOTS-c',
        purpose: 'Metabolic optimization & mitochondrial function',
        dosageRange: '5-10mg',
        timing: '3-5x weekly SubQ',
        notes: 'Enhances metabolic efficiency, supports fat oxidation',
        priority: 'primary',
      },
      {
        name: 'AOD-9604',
        purpose: 'Targeted fat loss without muscle catabolism',
        dosageRange: '300mcg',
        timing: 'Fasted morning SubQ',
        notes: 'Fat-specific lipolysis fragment of GH',
        priority: 'primary',
      },
      {
        name: 'BPC-157',
        purpose: 'GI protection & gut healing',
        dosageRange: '250-500mcg',
        timing: '1-2x daily SubQ or oral',
        notes: 'Helps mitigate GI side effects common with GLP-1',
        priority: 'secondary',
      },
      {
        name: 'Tesamorelin',
        purpose: 'Visceral fat reduction',
        dosageRange: '1-2mg',
        timing: 'Before bed SubQ',
        notes: 'FDA-approved for visceral adiposity',
        priority: 'optional',
      },
    ],
  },
  {
    id: 'glp1-muscle-retention',
    name: 'GLP-1 + Muscle Retention Stack',
    category: 'metabolic',
    description: 'GLP-1 protocol paired with muscle retention support.',
    defaultDuration: 12,
    parameters: [
      { id: 'startingDose', label: 'Starting dose', type: 'number', defaultValue: 0.25, unit: 'mg' },
      { id: 'targetDose', label: 'Target dose', type: 'number', defaultValue: 1.0, unit: 'mg' },
      { id: 'proteinTarget', label: 'Protein target', type: 'number', defaultValue: 140, unit: 'g/day' },
      { id: 'resistanceDays', label: 'Resistance training days', type: 'number', defaultValue: 3, min: 2, max: 5 },
    ],
    phases: [
      {
        name: 'Titration + Preservation',
        weekStart: 1,
        weekEnd: 4,
        instructions:
          'Start at {{startingDose}} mg and titrate as tolerated. Maintain protein at {{proteinTarget}} g/day and train {{resistanceDays}} days/week.',
      },
      {
        name: 'Maintenance',
        weekStart: 5,
        weekEnd: 12,
        instructions:
          'Maintain around {{targetDose}} mg. Keep resistance training and protein targets consistent.',
      },
    ],
    monitoringSchedule: [
      { label: 'Weight and strength markers', cadence: 'Weekly' },
      { label: 'Body composition trend', cadence: 'Monthly' },
    ],
    contraindications: ['Active eating disorder history', 'Uncontrolled GI conditions'],
    documents: [
      {
        title: 'Muscle Retention Guidelines',
        content:
          'Prioritize protein intake of {{proteinTarget}} g/day. Schedule {{resistanceDays}} resistance sessions weekly and include daily mobility work.',
      },
    ],
    synergisticPeptides: [
      {
        name: 'CJC-1295 + Ipamorelin',
        purpose: 'GH secretion for muscle preservation',
        dosageRange: '100mcg CJC / 200-300mcg Ipamorelin',
        timing: 'Before bed SubQ',
        notes: 'Synergistic combo for sustained GH release, protects lean mass',
        priority: 'primary',
      },
      {
        name: 'BPC-157',
        purpose: 'Muscle & tendon repair',
        dosageRange: '250-500mcg',
        timing: '1-2x daily SubQ',
        notes: 'Accelerates recovery, protects against training injuries',
        priority: 'primary',
      },
      {
        name: 'IGF-1 LR3',
        purpose: 'Anabolic support & muscle growth',
        dosageRange: '20-50mcg',
        timing: 'Post-workout SubQ',
        notes: 'Potent anabolic, use with caution',
        priority: 'secondary',
      },
      {
        name: 'TB-500',
        purpose: 'Tissue repair & recovery',
        dosageRange: '2.5-5mg',
        timing: '2x weekly SubQ',
        notes: 'Systemic healing, reduces DOMS',
        priority: 'secondary',
      },
      {
        name: 'MOTS-c',
        purpose: 'Exercise performance & metabolic efficiency',
        dosageRange: '5-10mg',
        timing: '3-5x weekly SubQ',
        notes: 'Enhances endurance and metabolic function',
        priority: 'optional',
      },
    ],
  },
  {
    id: 'cognitive-enhancement',
    name: 'Cognitive Enhancement Protocol',
    category: 'cognitive',
    description: 'Cognitive performance and focus optimization.',
    defaultDuration: 10,
    parameters: [
      { id: 'cycleWeeks', label: 'Cycle length', type: 'number', defaultValue: 8, min: 4, max: 12 },
      { id: 'sleepTarget', label: 'Sleep target', type: 'number', defaultValue: 7.5, unit: 'hours' },
    ],
    phases: [
      {
        name: 'Initiation',
        weekStart: 1,
        weekEnd: 2,
        instructions: 'Introduce cognitive protocol and monitor focus response.',
      },
      {
        name: 'Optimization',
        weekStart: 3,
        weekEnd: 8,
        instructions: 'Optimize cognitive stack and maintain sleep target of {{sleepTarget}} hours.',
      },
    ],
    monitoringSchedule: [
      { label: 'Focus and energy rating', cadence: 'Weekly' },
      { label: 'Sleep quality', cadence: 'Weekly' },
    ],
    contraindications: ['Uncontrolled anxiety', 'Severe insomnia'],
    documents: [
      {
        title: 'Cognitive Support Plan',
        content:
          'Maintain a consistent sleep window targeting {{sleepTarget}} hours. Track focus and energy weekly and note any side effects.',
      },
    ],
    synergisticPeptides: [
      {
        name: 'Semax',
        purpose: 'Cognitive enhancement & neuroprotection',
        dosageRange: '200-600mcg',
        timing: 'Intranasal morning',
        notes: 'BDNF upregulation, focus and memory enhancement',
        priority: 'primary',
      },
      {
        name: 'Selank',
        purpose: 'Anxiolytic & cognitive support',
        dosageRange: '250-500mcg',
        timing: 'Intranasal 1-2x daily',
        notes: 'Reduces anxiety without sedation, enhances learning',
        priority: 'primary',
      },
      {
        name: 'Dihexa',
        purpose: 'Memory & synaptic plasticity',
        dosageRange: '10-20mg',
        timing: 'Oral or SubQ morning',
        notes: 'Potent nootropic, enhances HGF signaling',
        priority: 'secondary',
      },
      {
        name: 'NAD+',
        purpose: 'Cellular energy & brain metabolism',
        dosageRange: '100-250mg',
        timing: 'SubQ or IV weekly',
        notes: 'Mitochondrial function, mental clarity',
        priority: 'secondary',
      },
      {
        name: 'DSIP',
        purpose: 'Sleep quality optimization',
        dosageRange: '100-200mcg',
        timing: 'Before bed SubQ',
        notes: 'Delta sleep-inducing peptide, enhances restorative sleep',
        priority: 'optional',
      },
    ],
  },
  {
    id: 'recovery-repair',
    name: 'Recovery & Repair Protocol',
    category: 'repair',
    description: 'Tissue repair and recovery support.',
    defaultDuration: 8,
    parameters: [
      { id: 'acuteWeeks', label: 'Acute phase weeks', type: 'number', defaultValue: 2, min: 1, max: 4 },
      { id: 'maintenanceWeeks', label: 'Maintenance weeks', type: 'number', defaultValue: 4, min: 2, max: 8 },
    ],
    phases: [
      {
        name: 'Acute Recovery',
        weekStart: 1,
        weekEnd: 2,
        instructions: 'Focus on recovery and mobility during the acute phase.',
      },
      {
        name: 'Maintenance',
        weekStart: 3,
        weekEnd: 8,
        instructions:
          'Transition to maintenance for {{maintenanceWeeks}} weeks with progressive activity.',
      },
    ],
    monitoringSchedule: [
      { label: 'Pain and mobility', cadence: 'Weekly' },
      { label: 'Activity tolerance', cadence: 'Weekly' },
    ],
    contraindications: ['Acute infection or fever'],
    documents: [
      {
        title: 'Recovery Checklist',
        content:
          'Track pain levels weekly and prioritize sleep, hydration, and gentle movement.',
      },
    ],
    synergisticPeptides: [
      {
        name: 'BPC-157',
        purpose: 'Tissue healing & anti-inflammatory',
        dosageRange: '250-500mcg',
        timing: '1-2x daily SubQ near injury site',
        notes: 'Accelerates tendon, ligament, muscle, and gut healing',
        priority: 'primary',
      },
      {
        name: 'TB-500',
        purpose: 'Systemic tissue repair',
        dosageRange: '2.5-5mg',
        timing: '2x weekly SubQ',
        notes: 'Promotes angiogenesis and cell migration',
        priority: 'primary',
      },
      {
        name: 'GHK-Cu',
        purpose: 'Collagen synthesis & wound healing',
        dosageRange: '1-2mg',
        timing: 'SubQ or topical daily',
        notes: 'Copper peptide for skin, tissue remodeling',
        priority: 'secondary',
      },
      {
        name: 'Thymosin Alpha-1',
        purpose: 'Immune modulation & recovery support',
        dosageRange: '1.6mg',
        timing: '2-3x weekly SubQ',
        notes: 'Supports immune function during healing',
        priority: 'secondary',
      },
      {
        name: 'CJC-1295 + Ipamorelin',
        purpose: 'GH release for tissue regeneration',
        dosageRange: '100mcg CJC / 200mcg Ipamorelin',
        timing: 'Before bed SubQ',
        notes: 'Enhances recovery via GH pulse',
        priority: 'optional',
      },
    ],
  },
  {
    id: 'longevity-anti-aging',
    name: 'Longevity & Anti-Aging Protocol',
    category: 'longevity',
    description: 'Longevity optimization with biomarker tracking.',
    defaultDuration: 16,
    parameters: [
      { id: 'cycleWeeks', label: 'Cycle length', type: 'number', defaultValue: 12, min: 8, max: 16 },
      { id: 'labCadence', label: 'Lab cadence', type: 'select', defaultValue: 'quarterly', options: ['monthly', 'quarterly'] },
    ],
    phases: [
      {
        name: 'Foundation',
        weekStart: 1,
        weekEnd: 4,
        instructions: 'Establish baseline routines and introduce longevity protocol.',
      },
      {
        name: 'Optimization',
        weekStart: 5,
        weekEnd: 16,
        instructions:
          'Maintain protocol and review labs on a {{labCadence}} cadence.',
      },
    ],
    monitoringSchedule: [
      { label: 'Energy and recovery', cadence: 'Weekly' },
      { label: 'Labs', cadence: '{{labCadence}}' },
    ],
    contraindications: ['Active malignancy', 'Unstable chronic conditions'],
    documents: [
      {
        title: 'Longevity Protocol Summary',
        content:
          'Maintain consistent sleep, nutrition, and recovery habits. Labs are reviewed on a {{labCadence}} cadence.',
      },
    ],
    synergisticPeptides: [
      {
        name: 'Epitalon',
        purpose: 'Telomerase activation & cellular longevity',
        dosageRange: '5-10mg',
        timing: 'Before bed SubQ, 10-day cycles',
        notes: 'Pineal peptide, supports telomere length',
        priority: 'primary',
      },
      {
        name: 'NAD+',
        purpose: 'Cellular energy & DNA repair',
        dosageRange: '100-500mg',
        timing: 'SubQ or IV weekly',
        notes: 'Core longevity molecule, sirtuin activation',
        priority: 'primary',
      },
      {
        name: 'GHK-Cu',
        purpose: 'Skin rejuvenation & tissue remodeling',
        dosageRange: '1-2mg',
        timing: 'SubQ or topical daily',
        notes: 'Anti-aging copper peptide, gene expression modulation',
        priority: 'primary',
      },
      {
        name: 'Thymosin Alpha-1',
        purpose: 'Immune system optimization',
        dosageRange: '1.6mg',
        timing: '2-3x weekly SubQ',
        notes: 'Thymic peptide, immune competence',
        priority: 'secondary',
      },
      {
        name: 'MOTS-c',
        purpose: 'Metabolic health & mitochondrial function',
        dosageRange: '5-10mg',
        timing: '3-5x weekly SubQ',
        notes: 'Mitochondrial-derived peptide, metabolic longevity',
        priority: 'secondary',
      },
      {
        name: 'BPC-157',
        purpose: 'Systemic healing & organ protection',
        dosageRange: '250-500mcg',
        timing: '1-2x daily SubQ or oral',
        notes: 'Gut-brain axis support, cytoprotective',
        priority: 'optional',
      },
    ],
  },
]

export function getProtocolTemplate(templateId: string): ProtocolTemplate | null {
  return PROTOCOL_TEMPLATES.find((template) => template.id === templateId) || null
}

export function generateProtocol(
  templateId: string,
  parameters: Record<string, string | number | boolean>
): GeneratedProtocol | null {
  const template = getProtocolTemplate(templateId)
  if (!template) return null

  const mergedParams = template.parameters.reduce<Record<string, string | number | boolean>>(
    (acc, param) => {
      acc[param.id] = parameters[param.id] ?? param.defaultValue
      return acc
    },
    {}
  )

  const applyParams = (text: string) =>
    text.replace(/\{\{(.*?)\}\}/g, (_, key) => String(mergedParams[key.trim()] ?? ''))

  const phases = template.phases.map((phase) => ({
    ...phase,
    instructions: applyParams(phase.instructions),
  }))

  const monitoringSchedule = template.monitoringSchedule.map((item) => ({
    ...item,
    cadence: applyParams(item.cadence),
    notes: item.notes ? applyParams(item.notes) : item.notes,
  }))

  const documents = template.documents.map((doc) => ({
    ...doc,
    content: applyParams(doc.content),
  }))

  const summary = `${template.name} (${template.defaultDuration} weeks)`

  return {
    templateId: template.id,
    name: template.name,
    summary,
    parameters: mergedParams,
    phases,
    monitoringSchedule,
    documents,
  }
}
