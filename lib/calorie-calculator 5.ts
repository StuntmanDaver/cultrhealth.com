// Advanced Calorie & Macro Calculator Engine
// Formulas: Mifflin-St Jeor, Harris-Benedict (revised), Katch-McArdle

export type Sex = 'male' | 'female';
export type UnitSystem = 'imperial' | 'metric';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'aggressive_cut' | 'cut' | 'maintain' | 'lean_bulk' | 'bulk';
export type BmrFormula = 'mifflin' | 'harris' | 'katch';
export type MacroSplit = 'high_protein' | 'balanced' | 'low_carb' | 'keto';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, { label: string; description: string; factor: number }> = {
  sedentary:    { label: 'Sedentary',        description: 'Desk job, little exercise',           factor: 1.2 },
  light:        { label: 'Lightly Active',   description: 'Light exercise 1–3 days/week',       factor: 1.375 },
  moderate:     { label: 'Moderately Active', description: 'Moderate exercise 3–5 days/week',   factor: 1.55 },
  active:       { label: 'Very Active',      description: 'Hard exercise 6–7 days/week',        factor: 1.725 },
  very_active:  { label: 'Extremely Active', description: 'Athlete / physical job + training',  factor: 1.9 },
};

export const GOAL_ADJUSTMENTS: Record<Goal, { label: string; description: string; calorieDelta: number }> = {
  aggressive_cut: { label: 'Aggressive Cut',  description: '−750 kcal deficit (~1.5 lb/week)', calorieDelta: -750 },
  cut:            { label: 'Cut / Fat Loss',   description: '−500 kcal deficit (~1 lb/week)',   calorieDelta: -500 },
  maintain:       { label: 'Maintain',         description: 'No surplus or deficit',             calorieDelta: 0 },
  lean_bulk:      { label: 'Lean Bulk',        description: '+250 kcal surplus (~0.5 lb/week)', calorieDelta: 250 },
  bulk:           { label: 'Bulk',             description: '+500 kcal surplus (~1 lb/week)',   calorieDelta: 500 },
};

export const MACRO_SPLITS: Record<MacroSplit, { label: string; description: string; proteinPct: number; carbPct: number; fatPct: number }> = {
  high_protein: { label: 'High Protein',  description: '40P / 30C / 30F',  proteinPct: 0.40, carbPct: 0.30, fatPct: 0.30 },
  balanced:     { label: 'Balanced',       description: '30P / 40C / 30F',  proteinPct: 0.30, carbPct: 0.40, fatPct: 0.30 },
  low_carb:     { label: 'Low Carb',       description: '35P / 25C / 40F',  proteinPct: 0.35, carbPct: 0.25, fatPct: 0.40 },
  keto:         { label: 'Keto',           description: '30P / 5C / 65F',   proteinPct: 0.30, carbPct: 0.05, fatPct: 0.65 },
};

export const BMR_FORMULAS: Record<BmrFormula, { label: string; description: string }> = {
  mifflin: { label: 'Mifflin-St Jeor',     description: 'Most accurate for general population' },
  harris:  { label: 'Harris-Benedict',      description: 'Classic formula (revised 1990)' },
  katch:   { label: 'Katch-McArdle',        description: 'Best if you know your body fat %' },
};

export type CalcInput = {
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  formula: BmrFormula;
  bodyFatPct?: number; // required for Katch-McArdle
  macroSplit: MacroSplit;
};

export type CalcResult = {
  bmr: number;
  tdee: number;
  targetCalories: number;
  protein: { grams: number; calories: number; pct: number };
  carbs: { grams: number; calories: number; pct: number };
  fat: { grams: number; calories: number; pct: number };
  formulaUsed: BmrFormula;
  warnings: string[];
};

// Unit conversion helpers
export function lbsToKg(lbs: number): number {
  return lbs * 0.453592;
}

export function ftInToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * 2.54;
}

export function kgToLbs(kg: number): number {
  return kg / 0.453592;
}

export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

// BMR calculations
function mifflinStJeor(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  // Men:   10 × weight(kg) + 6.25 × height(cm) − 5 × age − 5 + 5
  // Women: 10 × weight(kg) + 6.25 × height(cm) − 5 × age − 161
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

function harrisBenedict(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  // Revised (Roza & Shizgal, 1984)
  // Men:   88.362 + 13.397 × weight(kg) + 4.799 × height(cm) − 5.677 × age
  // Women: 447.593 + 9.247 × weight(kg) + 3.098 × height(cm) − 4.330 × age
  if (sex === 'male') {
    return 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age;
  }
  return 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age;
}

function katchMcArdle(weightKg: number, bodyFatPct: number): number {
  // 370 + 21.6 × lean body mass(kg)
  const leanMassKg = weightKg * (1 - bodyFatPct / 100);
  return 370 + 21.6 * leanMassKg;
}

export function calculate(input: CalcInput): CalcResult {
  const warnings: string[] = [];
  let formulaUsed = input.formula;

  // Validate
  if (input.age < 15 || input.age > 100) {
    warnings.push('Age outside typical range (15–100). Results may be less accurate.');
  }
  if (input.weightKg < 30 || input.weightKg > 300) {
    warnings.push('Weight outside typical range. Results may be less accurate.');
  }
  if (input.heightCm < 120 || input.heightCm > 230) {
    warnings.push('Height outside typical range. Results may be less accurate.');
  }

  // Calculate BMR
  let bmr: number;
  if (formulaUsed === 'katch') {
    if (input.bodyFatPct == null || input.bodyFatPct <= 0 || input.bodyFatPct >= 60) {
      warnings.push('Body fat % required for Katch-McArdle. Falling back to Mifflin-St Jeor.');
      formulaUsed = 'mifflin';
      bmr = mifflinStJeor(input.weightKg, input.heightCm, input.age, input.sex);
    } else {
      bmr = katchMcArdle(input.weightKg, input.bodyFatPct);
    }
  } else if (formulaUsed === 'harris') {
    bmr = harrisBenedict(input.weightKg, input.heightCm, input.age, input.sex);
  } else {
    bmr = mifflinStJeor(input.weightKg, input.heightCm, input.age, input.sex);
  }

  // TDEE
  const activityFactor = ACTIVITY_MULTIPLIERS[input.activityLevel].factor;
  const tdee = bmr * activityFactor;

  // Target calories
  const goalDelta = GOAL_ADJUSTMENTS[input.goal].calorieDelta;
  let targetCalories = tdee + goalDelta;

  // Floor at minimum safe intake
  const minCalories = input.sex === 'male' ? 1200 : 1000;
  if (targetCalories < minCalories) {
    warnings.push(`Target adjusted to ${minCalories} kcal minimum for safety. Consult a provider for very low calorie diets.`);
    targetCalories = minCalories;
  }

  // Macros
  const split = MACRO_SPLITS[input.macroSplit];
  const proteinCal = targetCalories * split.proteinPct;
  const carbsCal = targetCalories * split.carbPct;
  const fatCal = targetCalories * split.fatPct;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
    protein: { grams: Math.round(proteinCal / 4), calories: Math.round(proteinCal), pct: split.proteinPct * 100 },
    carbs: { grams: Math.round(carbsCal / 4), calories: Math.round(carbsCal), pct: split.carbPct * 100 },
    fat: { grams: Math.round(fatCal / 9), calories: Math.round(fatCal), pct: split.fatPct * 100 },
    formulaUsed,
    warnings,
  };
}
